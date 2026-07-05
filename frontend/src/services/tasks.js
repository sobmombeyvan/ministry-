import { getSupabase, throwIfError } from '@/lib/supabase';
import { logAction } from '@/services/history';
import { updateTicketStatus } from '@/services/tickets';

export async function fetchTasks() {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('*, ticket:tickets(id, title, user_id)')
    .order('created_at', { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function createTask(payload, actor) {
  const { ticket_id, technician_id, description, priority, start_date, end_date } = payload;

  const { data, error } = await getSupabase()
    .from('tasks')
    .insert({
      ticket_id: Number(ticket_id),
      technician_id,
      description,
      priority,
      start_date,
      end_date,
      status: 'open',
    })
    .select()
    .single();
  throwIfError(error);

  await updateTicketStatus(Number(ticket_id), 'in_progress', actor);

  if (actor) {
    await logAction({
      userId: actor.id,
      role: actor.role,
      action: 'task_assigned',
      objectType: 'task',
      objectId: data.id,
      description: `Assigned task for ticket #${ticket_id}`,
    });
  }

  return data;
}

export async function updateTaskStatus(taskId, status, actor) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select('*, ticket_id')
    .single();
  throwIfError(error);

  if (status === 'closed') {
    await updateTicketStatus(data.ticket_id, 'closed', actor);
  }

  return data;
}

export async function refuseTask(taskId, actor) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .update({ status: 'refused' })
    .eq('id', taskId)
    .select('ticket_id')
    .single();
  throwIfError(error);

  await updateTicketStatus(data.ticket_id, 'pending', actor);

  if (actor) {
    await logAction({
      userId: actor.id,
      role: actor.role,
      action: 'task_refused',
      objectType: 'task',
      objectId: taskId,
      description: 'Technician refused task',
    });
  }

  return data;
}

export async function reassignTask(taskId, technicianId, actor) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .update({ technician_id: technicianId })
    .eq('id', taskId)
    .select('*, ticket_id')
    .single();
  throwIfError(error);

  if (actor) {
    await logAction({
      userId: actor.id,
      role: actor.role,
      action: 'task_reassigned',
      objectType: 'task',
      objectId: taskId,
      description: `Reassigned task #${taskId}`,
    });
  }

  return data;
}
