# Supabase Setup — Ministry IT Ticketing System

The app uses **Supabase for everything** — authentication, database, row-level security, and live ticket chat.

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Wait for the database to finish provisioning.

## 2. Run the database schema

1. Open **SQL Editor** in your Supabase dashboard.
2. Paste and run the entire contents of `supabase/schema.sql`.
3. If upgrading an existing database, also run migrations in order:
   - `supabase/migrations/002_features.sql`
   - `supabase/migrations/003_realtime_messages.sql`
   - `supabase/migrations/004_signup.sql`
   - `supabase/migrations/005_fix_rls_recursion.sql`
   - `supabase/migrations/006_super_admin.sql`
   - `supabase/migrations/007_support_chat_access.sql`

This creates tables, RLS policies, triggers, and enables real-time chat on tickets.

**Deploy to production:** see [docs/ARCHITECTURE_AND_DEPLOYMENT.md](../docs/ARCHITECTURE_AND_DEPLOYMENT.md#11-deploy-on-vercel).

## 3. Create users

**Option A - Staff self sign up (recommended)**

Staff register at **http://localhost:3000/signup** (or your deployed URL + `/signup`).

New accounts are always created with the **staff** role. Admins and technicians are created by an administrator (option B).

In Supabase go to **Authentication -> Providers -> Email** and:
- Turn **on** **Allow new users to sign up** (required for `/signup` to work)
- Turn **off** **Confirm email** if staff should sign in immediately after registering
- Leave **Confirm email on** if staff must verify their email first (they will see a message after sign up)

**Option B - Admin creates users manually**

In **Authentication -> Users -> Add user**, create accounts (check **Auto Confirm User**).

Example metadata for the profile trigger:

```json
{"name":"Jean","surname":"Mbeki","username":"jmbeki","role":"staff"}
```

Roles: `staff`, `admin`, or `technician` (admin/technician only via manual creation).

The trigger in `schema.sql` auto-creates matching `profiles` rows.

### Super admin (admin@minister.com)

1. In **Authentication -> Users -> Add user**:
   - Email: `admin@minister.com`
   - Password: your choice
   - **Auto Confirm User**: ON
   - User metadata:

```json
{"name":"System","surname":"Admin","username":"admin","role":"admin"}
```

2. Run `supabase/migrations/006_super_admin.sql` in SQL Editor (ensures admin role).

3. Sign in with **email** `admin@minister.com` or username `admin`.

**Admin powers:** view all tickets, users, reports, history; assign tasks; change user roles at **Admin -> Users**.

## 4. Configure environment variables

At the **repo root**:

```powershell
copy .env.example .env
```

Edit `.env` with credentials from **Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. Run the app

```powershell
npm run dev
```

Open **http://localhost:3000** and sign in, or go to **/signup** to create a staff account.

## Architecture

```
Next.js  →  Supabase Auth + PostgreSQL + RLS + Realtime
```

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User info + role (linked to auth.users) |
| `tickets` | IT support tickets |
| `tasks` | Technician assignments |
| `messages` | Live ticket chat between staff, technicians, and admins |
| `history` | Admin audit log |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login page says "Supabase is not configured" | Fill in `.env` with real URL and anon key |
| "Invalid username or password" | Check credentials, or run migration `004_signup.sql` for sign up |
| Chat not updating live | Run `supabase/migrations/003_realtime_messages.sql` and `007_support_chat_access.sql` |
| Admin/technician cannot see staff chat | Run `007_support_chat_access.sql`; ensure admin profile role is `admin` (`006_super_admin.sql`) |
| Dev server won't start on G: / exFAT drive | Use `.\run.ps1` — it runs from `%LOCALAPPDATA%` |
| Sign up fails / username error | Run `supabase/migrations/004_signup.sql` in SQL Editor |
| "Signups not allowed for this instance" | Supabase → Authentication → Providers → Email → enable **Allow new users to sign up** |
| "infinite recursion detected in policy for relation tickets" | Run `supabase/migrations/005_fix_rls_recursion.sql` in SQL Editor |
