import { getSupabase, throwIfError } from '@/lib/supabase';
import { logAction } from '@/services/history';

const ticketSelect = `
  *,
  user:profiles!user_id(name, surname, username),
  tasks(
    id, description, priority, status, start_date, end_date, technician_id,
    technician:profiles!technician_id(name, surname)
  )
`;

export async function fetchTickets() {
  const { data, error } = await getSupabase()
    .from('tickets')
    .select('*, user:profiles!user_id(name, surname, username)')
    .order('created_at', { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function fetchTicket(id) {
  const { data, error } = await getSupabase()
    .from('tickets')
    .select(ticketSelect)
    .eq('id', id)
    .single();
  throwIfError(error);
  return data;
}

export async function createTicket({ title, description, category, userId, priority = 'medium' }) {
  const { data, error } = await getSupabase()
    .from('tickets')
    .insert({
      title,
      description,
      category,
      priority,
      user_id: userId,
      status: 'open',
    })
    .select()
    .single();
  throwIfError(error);

  await logAction({
    userId,
    role: 'staff',
    action: 'ticket_created',
    objectType: 'ticket',
    objectId: data.id,
    description: `Created ticket: ${title}`,
  });

  return data;
}

export async function updateTicket(id, fields, actor) {
  const { data, error } = await getSupabase()
    .from('tickets')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  throwIfError(error);

  if (actor) {
    await logAction({
      userId: actor.id,
      role: actor.role,
      action: 'ticket_updated',
      objectType: 'ticket',
      objectId: id,
      description: `Updated ticket: ${data.title}`,
    });
  }

  return data;
}

export async function updateTicketStatus(id, status, actor) {
  const { error } = await getSupabase().from('tickets').update({ status }).eq('id', id);
  throwIfError(error);

  if (actor) {
    await logAction({
      userId: actor.id,
      role: actor.role,
      action: 'ticket_status_changed',
      objectType: 'ticket',
      objectId: id,
      description: `Ticket status changed to ${status}`,
    });
  }
}
