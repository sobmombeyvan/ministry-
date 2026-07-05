import { fetchTickets } from '@/services/tickets';
import { fetchTasks } from '@/services/tasks';
import { fetchUsers } from '@/services/users';
import { adminDashboard } from '@/services/dashboard';

export async function ticketReport() {
  const tickets = await fetchTickets();
  return tickets.map((t) => ({
    ref: t.id,
    title: t.title,
    category: t.category,
    priority: t.priority || 'medium',
    status: t.status,
    reporter: t.user ? `${t.user.name} ${t.user.surname}` : '—',
    created: t.created_at,
  }));
}

export async function taskReport() {
  const tasks = await fetchTasks();
  return tasks.map((t) => ({
    id: t.id,
    ticket: t.ticket_id,
    description: t.description,
    priority: t.priority,
    status: t.status,
    due: t.end_date,
  }));
}

export async function technicianPerformanceReport() {
  const [tasks, users] = await Promise.all([fetchTasks(), fetchUsers('technician')]);
  return users.map((tech) => {
    const assigned = tasks.filter((t) => t.technician_id === tech.id);
    return {
      name: `${tech.name} ${tech.surname}`,
      total: assigned.length,
      in_progress: assigned.filter((t) => t.status === 'in_progress').length,
      closed: assigned.filter((t) => t.status === 'closed').length,
      refused: assigned.filter((t) => t.status === 'refused').length,
    };
  });
}

export async function summaryReport() {
  return adminDashboard();
}
