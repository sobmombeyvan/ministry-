'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchTicket, updateTicket } from '@/services/tickets';
import { ticketDisplay } from '@/lib/format';
import TicketChatPanel from '@/components/TicketChatPanel';
import Layout, { Card, ContentLoading, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

export default function TicketDetailView({ basePath = '/staff', id }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    fetchTicket(id)
      .then((ticketData) => {
        setTicket(ticketData);
        if (isAdmin) {
          setEditForm({
            title: ticketData.title,
            description: ticketData.description,
            status: ticketData.status,
            priority: ticketData.priority || 'medium',
            category: ticketData.category,
          });
        }
      })
      .catch((err) => setError(err.message || 'Failed to load ticket'));
  };

  useEffect(() => {
    loadData();
  }, [id, isAdmin]);

  const handleAdminSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateTicket(id, editForm, user);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  if (!ticket && !error) {
    return (
      <Layout>
        <ContentLoading message="Loading ticket…" />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={ticket ? ticketDisplay(ticket) : `Ticket #${id}`}
        subtitle={ticket?.title}
      />
      <ErrorAlert message={error} />
      {ticket && (
        <>
          <div className="detail-grid">
            <Card title="Ticket information">
              <p>{ticket.description}</p>
              <div className="meta-row">
                <StatusBadge value={ticket.category} />
                <StatusBadge value={ticket.priority || 'medium'} />
                <StatusBadge value={ticket.status} />
              </div>
              <p className="muted">
                Reported by {ticket.user?.name} {ticket.user?.surname} on{' '}
                {new Date(ticket.created_at).toLocaleString()}
              </p>
            </Card>
            {ticket.tasks?.length > 0 && (
              <Card title="Assignment">
                {ticket.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <p>{task.description}</p>
                    <div className="meta-row">
                      <StatusBadge value={task.priority} />
                      <StatusBadge value={task.status} />
                    </div>
                    <p className="muted">
                      Technician: {task.technician?.name} {task.technician?.surname}
                    </p>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {isAdmin && editForm && (
            <Card className="mt-4" title="Manage ticket">
              <form className="form" onSubmit={handleAdminSave}>
                <label>
                  Title
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    required
                  />
                </label>
                <div className="form-row">
                  <label>
                    Status
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>
                  <label>
                    Priority
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="hardware">Hardware</option>
                      <option value="network">Network</option>
                      <option value="software">Software</option>
                    </select>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </Card>
          )}

          <Card className="mt-4" title="Support conversation">
            <TicketChatPanel
              ticketId={id}
              userId={user.id}
              userRole={user.role}
              ticketClosed={ticket.status === 'closed'}
            />
          </Card>
        </>
      )}
    </Layout>
  );
}
