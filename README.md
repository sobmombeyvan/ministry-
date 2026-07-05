# Ministry IT Ticketing System

Web-based IT ticketing platform for the Ministry of Basic Education.

**Stack:** Next.js + Supabase (PostgreSQL, Auth, Row Level Security, Realtime chat).

## Setup

1. Follow **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** to create your Supabase project and run the schema.
2. Copy `.env.example` to `.env` and add your Supabase URL and anon key.
3. Start the app:

```powershell
npm run dev
```

Open **http://localhost:3000** and sign in, or register at **/signup**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |

## Features

- **Staff sign up** — self-registration at `/signup` (staff role only)
- **Staff** — submit tickets, track status, chat with technicians
- **Admin** — assign tasks, manage users, reports, audit history
- **Technician** — handle assigned tasks, update progress, reply in ticket chat
- **Live chat** — real-time messaging on each ticket via Supabase Realtime
