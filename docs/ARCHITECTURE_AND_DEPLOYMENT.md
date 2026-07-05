# Ministry IT Support Portal — Architecture & Vercel Deployment

Complete guide to how the application works and how to deploy it on Vercel.

---

## Table of contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project structure](#3-project-structure)
4. [Database (Supabase)](#4-database-supabase)
5. [Authentication & roles](#5-authentication--roles)
6. [Routes & features](#6-routes--features)
7. [Services layer](#7-services-layer)
8. [Live chat](#8-live-chat)
9. [Ticket lifecycle](#9-ticket-lifecycle)
10. [Local development](#10-local-development)
11. [Deploy on Vercel](#11-deploy-on-vercel)
12. [Post-deploy checklist](#12-post-deploy-checklist)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Overview

The **Ministry IT Support Portal** is an internal help-desk for the Ministry of Basic Education.

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19 |
| Backend | Supabase (no custom API server) |
| Database | PostgreSQL |
| Auth | Supabase Auth (JWT sessions) |
| Security | Row Level Security (RLS) |
| Live chat | Supabase Realtime |

**Active application:** `frontend/` — talks directly to Supabase from the browser.

**Legacy (unused):** `app/`, `routes/`, `composer.json` — old Laravel backend. Not required for deployment.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ app/     │→ │ views/   │→ │ services/│→ │ lib/    │ │
│  │ (routes) │  │ (UI)     │  │ (data)   │  │supabase │ │
│  └──────────┘  └──────────┘  └──────────┘  └────┬────┘ │
│         AuthContext (global user session)          │     │
└──────────────────────────────────────────────────┼─────┘
                                                   │
                    HTTPS + JWT                    ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase Cloud                      │
│   Auth  │  PostgreSQL + RLS  │  Realtime (messages)    │
└─────────────────────────────────────────────────────────┘
```

**Key principle:** There is no middle-tier API. The Next.js app uses the Supabase **anon key** in the browser. PostgreSQL **RLS policies** enforce who can read or write each row. Even if someone modifies frontend code, the database still blocks unauthorized access.

---

## 3. Project structure

```
ministry/
├── frontend/                    ← Deploy THIS folder to Vercel
│   ├── src/
│   │   ├── app/                 ← URLs (Next.js App Router)
│   │   ├── views/               ← Page UI logic
│   │   ├── components/          ← Layout, chat, badges, modals
│   │   ├── context/             ← AuthContext
│   │   ├── services/            ← All Supabase calls
│   │   └── lib/                 ← Supabase client, formatters
│   ├── next.config.mjs
│   └── package.json
├── supabase/
│   ├── schema.sql               ← Full DB schema (new projects)
│   └── migrations/              ← Incremental SQL patches
├── docs/
│   └── ARCHITECTURE_AND_DEPLOYMENT.md   ← This file
├── .env.example
├── run.ps1                      ← Local dev on exFAT drives (G:)
└── SUPABASE_SETUP.md            ← Supabase project setup
```

### Layer responsibilities

| Folder | Role |
|--------|------|
| `app/` | Defines routes; thin wrappers that import views |
| `views/` | Forms, tables, dashboards, business UI |
| `services/` | `fetchTickets`, `sendMessage`, `login`, etc. |
| `components/` | Shared shell (`Layout`), chat (`TicketChatPanel`) |
| `context/` | Global auth state (`user`, `login`, `logout`) |

### Important files

| File | Purpose |
|------|---------|
| `frontend/src/lib/supabase.js` | Singleton Supabase browser client |
| `frontend/src/context/AuthContext.jsx` | Session + profile state |
| `frontend/src/components/ProtectedRoute.jsx` | Redirect if not logged in / wrong role |
| `frontend/src/components/Layout.jsx` | Sidebar, nav per role |
| `frontend/src/services/messages.js` | Chat fetch, send, Realtime subscriptions |
| `frontend/next.config.mjs` | Loads env vars for build and runtime |

---

## 4. Database (Supabase)

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (1:1 with `auth.users`) — name, username, email, role |
| `tickets` | IT support requests from staff |
| `tasks` | Admin assignments linking tickets to technicians |
| `messages` | Per-ticket chat messages |
| `history` | Admin audit log |

### Enums

- **Roles:** `staff`, `admin`, `technician`
- **Ticket status:** `open`, `pending`, `in_progress`, `closed`
- **Ticket category:** `hardware`, `network`, `software`
- **Task status:** `open`, `pending`, `in_progress`, `closed`, `refused`

### Relationships

```
auth.users ──1:1── profiles
profiles ──1:N── tickets (as reporter)
tickets ──1:N── tasks
profiles ──1:N── tasks (as technician)
tickets ──1:N── messages
profiles ──1:N── messages (as sender)
```

### Auto-profile on signup

Trigger `handle_new_user()` runs after insert on `auth.users` and creates a `profiles` row from signup metadata (`name`, `surname`, `username`, `role`). Default role is `staff`.

### RLS helper functions

| Function | Meaning |
|----------|---------|
| `current_user_role()` | Role of logged-in user |
| `is_ticket_owner(ticket_id)` | User created the ticket |
| `is_technician_on_ticket(ticket_id)` | User has a task on that ticket |
| `can_access_support_ticket(ticket_id)` | Who can read/send chat |
| `can_message_ticket(ticket_id)` | Ticket open + user has support access |

### Who can access what

| Table | Staff | Technician | Admin |
|-------|-------|------------|-------|
| `profiles` | Read all | Read all | Read all; update any |
| `tickets` | Own only | Assigned + all open | All |
| `tasks` | Own ticket's tasks | Own tasks | All |
| `messages` | Own tickets | Open + assigned | All |
| `history` | — | — | Read all |

### Realtime

- Table `messages` is in the `supabase_realtime` publication
- `REPLICA IDENTITY FULL` is set for reliable live delivery

### Migrations (existing databases)

Run in Supabase SQL Editor, in order:

1. `supabase/schema.sql` — **or** migrations below if already partially set up
2. `002_features.sql`
3. `003_realtime_messages.sql`
4. `004_signup.sql`
5. `005_fix_rls_recursion.sql`
6. `006_super_admin.sql`
7. `007_support_chat_access.sql`

---

## 5. Authentication & roles

### Sign up (`/signup`)

- Staff self-registration only
- Username validated via `is_username_available` RPC
- Role always set to `staff` in code
- Admins promote users to `technician` or `admin` later

### Login (`/login`)

- Accepts **email or username**
- Username resolved via `get_email_by_username` RPC
- Loads `profiles` row; rejects deactivated accounts
- Redirects to `/{role}` (`/staff`, `/admin`, `/technician`)

### Session flow

1. `AuthContext` calls `supabase.auth.getSession()` on load
2. If session exists → `fetchProfile(userId)`
3. `ProtectedRoute` on each role layout blocks unauthorized access

### Super admin

1. Create user in Supabase Auth: `admin@minister.com`
2. Metadata: `{"name":"System","surname":"Admin","username":"admin","role":"admin"}`
3. Run `006_super_admin.sql`

---

## 6. Routes & features

### Public

| URL | Purpose |
|-----|---------|
| `/` | Login |
| `/login` | Login |
| `/signup` | Staff registration |

### Staff (`/staff/*`)

| URL | Purpose |
|-----|---------|
| `/staff` | Dashboard (ticket counts) |
| `/staff/tickets` | My tickets |
| `/staff/tickets/[id]` | Ticket detail + chat |
| `/staff/support` | Support chat inbox |
| `/staff/new-ticket` | Report new issue |
| `/staff/profile` | Edit profile |

### Admin (`/admin/*`)

| URL | Purpose |
|-----|---------|
| `/admin` | System dashboard |
| `/admin/tickets` | All tickets |
| `/admin/support` | All conversations |
| `/admin/assign-task` | Assign technician to ticket |
| `/admin/reassign-task` | Move task to another tech |
| `/admin/users` | Roles, activate/deactivate |
| `/admin/history` | Audit log |
| `/admin/reports` | Reports |

### Technician (`/technician/*`)

| URL | Purpose |
|-----|---------|
| `/technician` | Task dashboard |
| `/technician/tasks` | My tasks (update/refuse) |
| `/technician/tickets` | Ticket list |
| `/technician/support` | Support chat |
| `/technician/profile` | Edit profile |

---

## 7. Services layer

All database access is in `frontend/src/services/`:

| Service | Main functions |
|---------|----------------|
| `auth.js` | `loginWithIdentifier`, `signUp`, `logout`, `fetchProfile` |
| `tickets.js` | `fetchTickets`, `fetchTicket`, `createTicket`, `updateTicket` |
| `tasks.js` | `createTask`, `updateTaskStatus`, `refuseTask`, `reassignTask` |
| `messages.js` | `fetchMessages`, `sendMessage`, `fetchSupportInbox`, Realtime subs |
| `users.js` | `fetchUsers`, `setUserRole`, `setUserStatus`, `updateUser` |
| `dashboard.js` | Role-specific stat aggregations |
| `history.js` | `logAction`, `fetchHistory` |
| `profile.js` | Profile updates |
| `reports.js` | Admin reports |

Views never call Supabase directly — they call services.

---

## 8. Live chat

### Components

- **`TicketChatPanel`** — message thread + compose box (used on ticket detail and support inbox)
- **`SupportInboxView`** — split panel: conversation list + chat

### How messages flow

1. User sends message → `sendMessage()` inserts into `messages`
2. Sender sees message immediately (optimistic UI)
3. Supabase Realtime broadcasts `INSERT` to other connected clients
4. RLS ensures only authorized users receive the event
5. Backup: chat polls every 10 seconds; inbox refreshes on new messages

### Who can chat

| Role | Access |
|------|--------|
| Staff | Own tickets only |
| Admin | All tickets |
| Technician | All **open** tickets + assigned tickets |

Closed tickets: messaging disabled (`can_message_ticket` blocks inserts).

---

## 9. Ticket lifecycle

```
open  →  in_progress  →  closed
  ↑           │
  └── pending ←┘ (technician refuses task)
```

| Event | Result |
|-------|--------|
| Staff creates ticket | Status `open` |
| Admin assigns task | Status `in_progress` |
| Technician closes task | Ticket `closed`, chat locked |
| Technician refuses | Task `refused`, ticket `pending` |
| Admin reassigns | New technician, ticket `in_progress` |

---

## 10. Local development

### Prerequisites

- Node.js 18+
- Supabase project with schema applied (see `SUPABASE_SETUP.md`)

### Environment

```powershell
copy .env.example .env
```

Edit `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Get values from Supabase → **Settings → API**.

### Run

**From repo root (recommended on G: / exFAT):**

```powershell
.\run.ps1
```

**Or directly from frontend (NTFS drives):**

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## 11. Deploy on Vercel

### Prerequisites

Before deploying, complete these steps:

- [ ] Code pushed to GitHub (e.g. `https://github.com/sobmombeyvan/ministry-.git`)
- [ ] Supabase project created
- [ ] `supabase/schema.sql` run in Supabase SQL Editor (or all migrations)
- [ ] Supabase Auth: **Allow new users to sign up** enabled (Authentication → Providers → Email)
- [ ] At least one admin user created (see [Super admin](#super-admin))

---

### Option A — Deploy via Vercel Dashboard (recommended)

#### Step 1: Import the repository

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Click **Import** next to your `ministry-` repository
4. If the repo is private, grant Vercel access when prompted

#### Step 2: Configure the project

### Vercel project settings (required)

In **Vercel → Project → Settings → General**:

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |

Click **Edit** next to Root Directory, enter `frontend`, confirm.

In **Settings → Build & Deployment**, leave **Install Command** and **Build Command** empty (use defaults). If you previously set custom commands, clear them.

> Vercel must use `frontend/` as the project root so it finds `next` in `package.json`. Do **not** deploy from the repository root.

#### Step 3: Add environment variables

Before clicking **Deploy**, expand **Environment Variables** and add:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon/public key from Supabase | Production, Preview, Development |

Get both from Supabase → **Settings → API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Use the **anon** key only. Never put the `service_role` key in Vercel or frontend code.

#### Step 4: Deploy

1. Click **Deploy**
2. Wait for the build to finish (typically 1–3 minutes)
3. Note your production URL, e.g. `https://ministry-xxxxx.vercel.app`

#### Step 5: Configure Supabase Auth URLs

In Supabase Dashboard → **Authentication → URL Configuration**:

| Field | Value |
|-------|-------|
| **Site URL** | `https://your-app.vercel.app` (your Vercel production URL) |
| **Redirect URLs** | Add these (one per line): |

```
https://your-app.vercel.app/**
https://your-app.vercel.app/login
https://your-app.vercel.app/signup
http://localhost:3000/**
```

For preview deployments, also add:

```
https://*.vercel.app/**
```

Save changes.

#### Step 6: Verify production

1. Open `https://your-app.vercel.app`
2. Sign in or register at `/signup`
3. Create a ticket as staff
4. Sign in as admin → **Support chat** → confirm messages appear
5. Assign a task → sign in as technician → confirm task and chat work

---

### Option B — Deploy via Vercel CLI

#### Step 1: Install CLI

```powershell
npm install -g vercel
```

#### Step 2: Login

```powershell
vercel login
```

#### Step 3: Deploy from frontend directory

```powershell
cd frontend
vercel
```

Answer the prompts:

| Prompt | Answer |
|--------|--------|
| Set up and deploy? | **Y** |
| Which scope? | Your account/team |
| Link to existing project? | **N** (first time) |
| Project name? | `ministry-it` (or your choice) |
| Directory `./`? | **Y** (you are already in `frontend`) |

#### Step 4: Add environment variables

```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted; select Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your anon key; select Production, Preview, Development
```

#### Step 5: Production deploy

```powershell
vercel --prod
```

#### Step 6: Configure Supabase Auth URLs

Same as [Step 5 in Option A](#step-5-configure-supabase-auth-urls).

---

### Vercel project settings reference

After first deploy, confirm under **Project → Settings**:

**General → Root Directory**

```
frontend
```

**Build & Development Settings**

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Node.js Version | 20.x (recommended) |
| Build Command | `npm run build` |
| Install Command | `npm install` |

**Environment Variables**

Both variables must exist for **Production** and **Preview**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Build troubleshooting on Vercel

If the build fails with Turbopack errors, change the build command in Vercel settings:

```
next build
```

instead of `next build --turbopack`.

To do this permanently, edit `frontend/package.json`:

```json
"build": "next build"
```

Then commit and redeploy.

---

### Custom domain (optional)

1. Vercel → **Project → Settings → Domains**
2. Add your domain (e.g. `support.ministry.gov`)
3. Add the DNS records Vercel provides
4. Update Supabase **Site URL** and **Redirect URLs** to use the custom domain

---

## 12. Post-deploy checklist

- [ ] Production URL loads login page (no "Supabase is not configured")
- [ ] Staff can register at `/signup`
- [ ] Staff can create a ticket
- [ ] Admin sees ticket in `/admin/tickets` and `/admin/support`
- [ ] Chat messages appear for admin/technician (live or within ~10s)
- [ ] Admin can assign task to technician
- [ ] Technician sees task in `/technician/tasks`
- [ ] Supabase Auth redirect URLs include production domain
- [ ] `.env` secrets are **not** in the Git repository

---

## 13. Troubleshooting

| Problem | Fix |
|---------|-----|
| "Supabase is not configured" on Vercel | Add both `NEXT_PUBLIC_*` env vars; redeploy |
| `next: command not found` on build | Set **Root Directory** to `frontend` in Vercel settings |
| No Next.js version detected | Set **Root Directory** to `frontend`; clear custom Install/Build commands |
| Login works locally but not on Vercel | Add Vercel URL to Supabase Redirect URLs |
| Sign up fails | Enable sign-ups in Supabase Auth → Email provider |
| Chat not live | Run migrations `003` and `007` in SQL Editor |
| Admin cannot see all tickets | Run `006_super_admin.sql`; verify `profiles.role = 'admin'` |
| Technician cannot see chat | Run `007_support_chat_access.sql` |
| RLS recursion error | Run `005_fix_rls_recursion.sql` |
| 404 on routes | Ensure deploying `frontend/`, not repo root |

---

## Quick reference

| Task | Command / location |
|------|-------------------|
| Local dev | `.\run.ps1` or `cd frontend && npm run dev` |
| Supabase schema | `supabase/schema.sql` |
| Vercel root | `frontend` |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Production URL config | Supabase → Authentication → URL Configuration |

---

*Ministry of Basic Education — IT Support Portal*
