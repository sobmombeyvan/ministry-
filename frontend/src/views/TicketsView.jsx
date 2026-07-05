'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchTickets } from '@/services/tickets';
import { ticketDisplay } from '@/lib/format';
import Layout, { Card, ContentLoading, EmptyState, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

export default function TicketsView({ basePath = '/staff' }) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets()
      .then(setTickets)
      .catch((err) => setError(err.message || 'Failed to load tickets'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Tickets"
        subtitle="Track and manage support requests"
        action={
          basePath === '/staff' ? (
            <Link href="/staff/new-ticket" className="btn btn-primary">
              New Ticket
            </Link>
          ) : null
        }
      />
      <ErrorAlert message={error} />
      <Card className="card-table">
        {loading ? (
          <ContentLoading message="Loading tickets…" />
        ) : tickets.length === 0 ? (
          <EmptyState message="No tickets found." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  {basePath === '/admin' && <th>Reporter</th>}
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><code className="ticket-ref">{ticketDisplay(ticket)}</code></td>
                    <td>{ticket.title}</td>
                    <td><StatusBadge value={ticket.category} /></td>
                    <td><StatusBadge value={ticket.priority || 'medium'} /></td>
                    <td><StatusBadge value={ticket.status} /></td>
                    {basePath === '/admin' && (
                      <td>{ticket.user?.name} {ticket.user?.surname}</td>
                    )}
                    <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link href={`${basePath}/tickets/${ticket.id}`} className="link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}
