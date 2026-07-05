-- Ministry IT Ticketing System — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('staff', 'admin', 'technician');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'deactivated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM ('hardware', 'network', 'software');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'in_progress', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('open', 'pending', 'in_progress', 'closed', 'refused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  account_status account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL DEFAULT 'hardware',
  status ticket_status NOT NULL DEFAULT 'open',
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'open',
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tickets_updated_at ON tickets;
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, surname, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'surname', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Username login lookup (public, no auth required)
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM profiles
  WHERE username = p_username AND account_status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO anon, authenticated;

-- Username availability check (for sign up)
CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM profiles WHERE username = p_username);
$$;

GRANT EXECUTE ON FUNCTION is_username_available(TEXT) TO anon, authenticated;

-- Helper: current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

-- RLS helpers (SECURITY DEFINER bypasses RLS — prevents tickets/tasks policy recursion)
CREATE OR REPLACE FUNCTION is_ticket_owner(p_ticket_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tickets
    WHERE id = p_ticket_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_technician_on_ticket(p_ticket_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tasks
    WHERE ticket_id = p_ticket_id AND technician_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_access_ticket(p_ticket_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    is_ticket_owner(p_ticket_id)
    OR current_user_role() = 'admin'
    OR is_technician_on_ticket(p_ticket_id);
$$;

CREATE OR REPLACE FUNCTION can_access_support_ticket(p_ticket_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    is_ticket_owner(p_ticket_id)
    OR current_user_role() = 'admin'
    OR is_technician_on_ticket(p_ticket_id)
    OR (
      current_user_role() = 'technician'
      AND EXISTS (
        SELECT 1 FROM tickets
        WHERE id = p_ticket_id AND status NOT IN ('closed')
      )
    );
$$;

CREATE OR REPLACE FUNCTION can_message_ticket(p_ticket_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tickets
    WHERE id = p_ticket_id AND status != 'closed'
  )
  AND can_access_support_ticket(p_ticket_id);
$$;

GRANT EXECUTE ON FUNCTION is_ticket_owner(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_technician_on_ticket(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_ticket(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_support_ticket(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_message_ticket(BIGINT) TO authenticated;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- Tickets policies
DROP POLICY IF EXISTS "tickets_select" ON tickets;
CREATE POLICY "tickets_select" ON tickets FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR current_user_role() = 'admin'
    OR (
      current_user_role() = 'technician'
      AND (is_technician_on_ticket(id) OR status NOT IN ('closed'))
    )
  );

DROP POLICY IF EXISTS "tickets_insert_staff" ON tickets;
CREATE POLICY "tickets_insert_staff" ON tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND current_user_role() = 'staff');

DROP POLICY IF EXISTS "tickets_update" ON tickets;
CREATE POLICY "tickets_update" ON tickets FOR UPDATE TO authenticated
  USING (
    current_user_role() = 'admin'
    OR (current_user_role() = 'technician' AND is_technician_on_ticket(id))
  );

-- Tasks policies
DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR technician_id = auth.uid()
    OR is_ticket_owner(ticket_id)
  );

DROP POLICY IF EXISTS "tasks_insert_admin" ON tasks;
CREATE POLICY "tasks_insert_admin" ON tasks FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "tasks_update_technician" ON tasks;
CREATE POLICY "tasks_update_technician" ON tasks FOR UPDATE TO authenticated
  USING (
    (current_user_role() = 'technician' AND technician_id = auth.uid())
    OR current_user_role() = 'admin'
  );

-- Messages policies
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (can_access_support_ticket(ticket_id));

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND can_message_ticket(ticket_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_ticket_id ON tasks(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tasks_technician_id ON tasks(technician_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);

-- Real-time chat (Supabase Realtime) — safe to re-run
ALTER TABLE messages REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ticket priority (also in migrations/002_features.sql for upgrades)
DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority ticket_priority NOT NULL DEFAULT 'medium';

-- Activity history / audit log
CREATE TABLE IF NOT EXISTS history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT,
  object_id TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_select_admin" ON history;
CREATE POLICY "history_select_admin" ON history FOR SELECT TO authenticated
  USING (current_user_role() = 'admin');

DROP POLICY IF EXISTS "history_insert" ON history;
CREATE POLICY "history_insert" ON history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);
