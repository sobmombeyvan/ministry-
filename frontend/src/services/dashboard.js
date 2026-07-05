import { getSupabase, throwIfError } from '@/lib/supabase';

export async function staffDashboard(userId) {
  const { data, error } = await getSupabase()
    .from('tickets')
    .select('status')
    .eq('user_id', userId);
  throwIfError(error);

  const tickets = data ?? [];
  return {
    total_tickets: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };
}

export async function adminDashboard() {
  const supabase = getSupabase();
  const [ticketsRes, usersRes, tasksRes] = await Promise.all([
    supabase.from('tickets').select('status'),
    supabase.from('profiles').select('role'),
    supabase.from('tasks').select('status'),
  ]);

  throwIfError(ticketsRes.error);
  throwIfError(usersRes.error);
  throwIfError(tasksRes.error);

  const tickets = ticketsRes.data ?? [];
  const users = usersRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  return {
    total_tickets: tickets.length,
    pending_tickets: tickets.filter((t) => t.status === 'pending').length,
    in_progress_tickets: tickets.filter((t) => t.status === 'in_progress').length,
    closed_tickets: tickets.filter((t) => t.status === 'closed').length,
    total_technicians: users.filter((u) => u.role === 'technician').length,
    tasks_in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    refused_tasks: tasks.filter((t) => t.status === 'refused').length,
    total_users: users.length,
  };
}

export async function technicianDashboard(userId) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('status')
    .eq('technician_id', userId);
  throwIfError(error);

  const tasks = data ?? [];
  return {
    total_tasks: tasks.length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'closed').length,
  };
}
