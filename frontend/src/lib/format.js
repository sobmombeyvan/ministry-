export function formatTicketNumber(id, createdAt) {
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `TCK-${year}-${String(id).padStart(3, '0')}`;
}

export function ticketDisplay(ticket) {
  if (!ticket) return '';
  return formatTicketNumber(ticket.id, ticket.created_at);
}
