import { getSupabase, throwIfError } from '@/lib/supabase';
import { fetchTicket } from '@/services/tickets';

function formatMessage(msg) {
  return { ...msg, user: msg.sender };
}

async function enrichMessage(supabase, row) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(name, surname, role)')
    .eq('id', row.id)
    .single();

  if (!error && data) {
    return formatMessage(data);
  }

  const { data: sender } = await supabase
    .from('profiles')
    .select('name, surname, role')
    .eq('id', row.sender_id)
    .single();

  return formatMessage({ ...row, sender: sender || null });
}

export async function fetchMessages(ticketId) {
  const { data, error } = await getSupabase()
    .from('messages')
    .select('*, sender:profiles!sender_id(name, surname, role)')
    .eq('ticket_id', Number(ticketId))
    .order('created_at', { ascending: true });
  throwIfError(error);

  return (data ?? []).map(formatMessage);
}

export async function fetchSupportInbox() {
  const supabase = getSupabase();

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, user:profiles!user_id(name, surname, username)')
    .order('updated_at', { ascending: false });
  throwIfError(error);

  if (!tickets?.length) return [];

  const ids = tickets.map((t) => t.id);
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(name, surname, role)')
    .in('ticket_id', ids)
    .order('created_at', { ascending: false });
  throwIfError(msgError);

  const latest = {};
  const counts = {};
  for (const msg of messages ?? []) {
    counts[msg.ticket_id] = (counts[msg.ticket_id] || 0) + 1;
    if (!latest[msg.ticket_id]) {
      latest[msg.ticket_id] = formatMessage(msg);
    }
  }

  return tickets
    .map((t) => ({
      ...t,
      lastMessage: latest[t.id] || null,
      messageCount: counts[t.id] || 0,
    }))
    .sort((a, b) => {
      const ta = a.lastMessage?.created_at || a.updated_at || a.created_at;
      const tb = b.lastMessage?.created_at || b.updated_at || b.created_at;
      return new Date(tb) - new Date(ta);
    });
}

export async function sendMessage(ticketId, senderId, message) {
  const ticket = await fetchTicket(ticketId);
  if (ticket.status === 'closed') {
    throw new Error('Cannot send messages on a closed ticket');
  }

  const { data, error } = await getSupabase()
    .from('messages')
    .insert({
      ticket_id: Number(ticketId),
      sender_id: senderId,
      message,
    })
    .select('*, sender:profiles!sender_id(name, surname, role)')
    .single();
  throwIfError(error);

  return formatMessage(data);
}

export function subscribeToMessages(ticketId, onNewMessage) {
  const supabase = getSupabase();
  const id = Number(ticketId);

  const channel = supabase
    .channel(`messages:${id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        if (Number(payload.new.ticket_id) !== id) return;
        const enriched = await enrichMessage(supabase, payload.new);
        onNewMessage(enriched);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToInbox(onInboxChange) {
  const supabase = getSupabase();

  const channel = supabase
    .channel('support-inbox')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      () => {
        onInboxChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
