'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchSupportInbox, subscribeToInbox } from '@/services/messages';
import { ticketDisplay } from '@/lib/format';
import TicketChatPanel from '@/components/TicketChatPanel';
import Layout, { ContentLoading, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

const subtitles = {
  staff: 'Message the IT team about your open tickets.',
  technician: 'Assist staff on tickets assigned to you.',
  admin: 'Monitor and join all support conversations.',
};

export default function SupportInboxView({ basePath = '/staff' }) {
  const { user } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;

  const handleMessageSent = (msg) => {
    setInbox((prev) =>
      prev
        .map((t) =>
          t.id === selectedId
            ? { ...t, lastMessage: msg, messageCount: (t.messageCount || 0) + 1 }
            : t
        )
        .sort((a, b) => {
          const ta = a.lastMessage?.created_at || a.updated_at || a.created_at;
          const tb = b.lastMessage?.created_at || b.updated_at || b.created_at;
          return new Date(tb) - new Date(ta);
        })
    );
  };

  const loadInbox = (silent = false) => {
    if (!silent) setLoading(true);
    fetchSupportInbox()
      .then((items) => {
        setInbox(items);
        if (items.length && !selectedIdRef.current) {
          setSelectedId(items[0].id);
        }
      })
      .catch((err) => setError(err.message || 'Failed to load conversations'))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToInbox(() => {
      loadInbox(true);
    });
    return unsubscribe;
  }, []);

  const selected = inbox.find((t) => t.id === selectedId);

  return (
    <Layout>
      <PageHeader
        title="Support chat"
        subtitle={subtitles[user?.role] || subtitles.staff}
        action={
          user?.role === 'staff' ? (
            <Link href={`${basePath}/new-ticket`} className="btn btn-primary">
              New ticket
            </Link>
          ) : null
        }
      />
      <ErrorAlert message={error} />

      <div className="support-layout">
        <aside className="support-list-panel">
          <div className="support-list-head">
            <h3>Conversations</h3>
            <span className="support-count">{inbox.length}</span>
          </div>
          {loading ? (
            <div className="support-list-empty">
              <ContentLoading message="Loading conversations…" />
            </div>
          ) : inbox.length === 0 ? (
            <div className="support-list-empty">
              <p>No ticket conversations yet.</p>
              {user?.role === 'staff' && (
                <Link href={`${basePath}/new-ticket`} className="link">
                  Submit a support ticket
                </Link>
              )}
            </div>
          ) : (
            <ul className="support-list">
              {inbox.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    className={`support-list-item${selectedId === ticket.id ? ' active' : ''}`}
                    onClick={() => setSelectedId(ticket.id)}
                  >
                    <div className="support-list-top">
                      <span className="support-list-ref">{ticketDisplay(ticket)}</span>
                      <StatusBadge value={ticket.status} />
                    </div>
                    <p className="support-list-title">{ticket.title}</p>
                    {user?.role !== 'staff' && (
                      <p className="support-list-meta">
                        {ticket.user?.name} {ticket.user?.surname}
                      </p>
                    )}
                    {ticket.lastMessage ? (
                      <p className="support-list-preview">
                        {ticket.lastMessage.user?.name}: {ticket.lastMessage.message}
                      </p>
                    ) : (
                      <p className="support-list-preview muted">No messages yet</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="support-chat-panel">
          {selected ? (
            <>
              <div className="support-chat-head">
                <div>
                  <h3>{ticketDisplay(selected)} — {selected.title}</h3>
                  <p className="muted">
                    {user?.role !== 'staff' && (
                      <>
                        Reported by {selected.user?.name} {selected.user?.surname} ·{' '}
                      </>
                    )}
                    <StatusBadge value={selected.status} />{' '}
                    <StatusBadge value={selected.priority || 'medium'} />
                  </p>
                </div>
                <Link href={`${basePath}/tickets/${selected.id}`} className="btn btn-secondary btn-sm">
                  Ticket details
                </Link>
              </div>
              <TicketChatPanel
                ticketId={selected.id}
                userId={user.id}
                userRole={user.role}
                ticketClosed={selected.status === 'closed'}
                onMessageSent={handleMessageSent}
              />
            </>
          ) : (
            <div className="support-chat-placeholder">
              <p>Select a conversation from the list.</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
