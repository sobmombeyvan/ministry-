'use client';

import { useEffect, useState } from 'react';
import { fetchHistory } from '@/services/history';
import Layout, { Card, ContentLoading, EmptyState, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

export default function HistoryView() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .catch((err) => setError(err.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageHeader title="Activity History" subtitle="Audit log of system actions" />
      <ErrorAlert message={error} />
      <Card className="card-table">
        {loading ? (
          <ContentLoading message="Loading history…" />
        ) : items.length === 0 ? (
          <EmptyState message="No history records yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.created_at).toLocaleString()}</td>
                    <td>
                      {h.user ? `${h.user.name} ${h.user.surname}` : '—'}
                    </td>
                    <td>
                      <StatusBadge value={h.role} />
                    </td>
                    <td>
                      <code className="action-code">{h.action}</code>
                    </td>
                    <td>{h.description}</td>
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
