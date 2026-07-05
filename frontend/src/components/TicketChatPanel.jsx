'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchMessages, sendMessage, subscribeToMessages } from '@/services/messages';

function roleLabel(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'technician') return 'Technician';
  return 'Staff';
}

export default function TicketChatPanel({
  ticketId,
  userId,
  userRole,
  ticketClosed = false,
  compact = false,
  onMessageSent,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    fetchMessages(ticketId)
      .then(setMessages)
      .catch((err) => setError(err.message || 'Failed to load messages'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    const unsubscribe = subscribeToMessages(ticketId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });
    const poll = setInterval(() => {
      fetchMessages(ticketId)
        .then((next) => {
          setMessages((prev) => {
            if (prev.length === next.length && prev.every((m, i) => m.id === next[i]?.id)) {
              return prev;
            }
            return next;
          });
        })
        .catch(() => {});
    }, 10000);
    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || ticketClosed) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendMessage(ticketId, userId, newMessage);
      setNewMessage('');
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      onMessageSent?.(sent);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!ticketId) {
    return (
      <div className="chat-panel chat-panel--empty">
        <p>Select a ticket to view the conversation.</p>
      </div>
    );
  }

  return (
    <div className={`chat-panel${compact ? ' chat-panel--compact' : ''}`}>
      {error && <div className="alert-error">{error}</div>}

      <div className="chat-thread">
        {loading ? (
          <div className="content-loading">
            <div className="spinner-sm" aria-hidden="true" />
            <span>Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <p className="muted chat-empty">No messages yet. Describe your issue or ask for help.</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            const senderRole = msg.sender?.role || (isOwn ? userRole : 'staff');
            return (
              <div
                key={msg.id}
                className={`chat-bubble-row${isOwn ? ' chat-bubble-row--own' : ''}`}
              >
                <div className={`chat-bubble${isOwn ? ' chat-bubble--own' : ''}`}>
                  <div className="chat-bubble-head">
                    <span className="chat-sender">
                      {msg.user?.name} {msg.user?.surname}
                    </span>
                    <span className={`chat-role chat-role--${senderRole}`}>
                      {roleLabel(senderRole)}
                    </span>
                    <time className="chat-time">
                      {new Date(msg.created_at).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                  <p className="chat-text">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {ticketClosed ? (
        <div className="chat-closed">This ticket is closed. Messaging is disabled.</div>
      ) : (
        <form className="chat-compose" onSubmit={handleSend}>
          <textarea
            rows={2}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to the support team…"
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}
    </div>
  );
}
