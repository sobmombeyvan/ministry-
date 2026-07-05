-- Fix infinite recursion between tickets and tasks RLS policies
-- Run in Supabase SQL Editor if you see: "infinite recursion detected in policy for relation tickets"

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
  AND can_access_ticket(p_ticket_id);
$$;

GRANT EXECUTE ON FUNCTION is_ticket_owner(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_technician_on_ticket(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_ticket(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_message_ticket(BIGINT) TO authenticated;

DROP POLICY IF EXISTS "tickets_select" ON tickets;
CREATE POLICY "tickets_select" ON tickets FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR current_user_role() = 'admin'
    OR (current_user_role() = 'technician' AND is_technician_on_ticket(id))
  );

DROP POLICY IF EXISTS "tickets_update" ON tickets;
CREATE POLICY "tickets_update" ON tickets FOR UPDATE TO authenticated
  USING (
    current_user_role() = 'admin'
    OR (current_user_role() = 'technician' AND is_technician_on_ticket(id))
  );

DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
  USING (
    current_user_role() = 'admin'
    OR technician_id = auth.uid()
    OR is_ticket_owner(ticket_id)
  );

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (can_access_ticket(ticket_id));

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND can_message_ticket(ticket_id));
