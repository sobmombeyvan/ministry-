'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { staffDashboard } from '@/services/dashboard';
import Layout, { Card, ContentLoading, ErrorAlert, PageHeader, StatGrid } from '@/components/Layout';

export default function StaffDashboardView() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    staffDashboard(user.id)
      .then(setStats)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Layout>
      <PageHeader title="Staff Dashboard" subtitle="Overview of your support tickets" />
      <ErrorAlert message={error} />
      {loading ? (
        <ContentLoading message="Loading dashboard…" />
      ) : stats ? (
        <StatGrid
          stats={[
            { label: 'Total Tickets', value: stats.total_tickets },
            { label: 'Open', value: stats.open },
            { label: 'In Progress', value: stats.in_progress },
            { label: 'Closed', value: stats.closed },
          ]}
        />
      ) : null}
      <Card className="mt-4" title="Quick actions">
        <p className="card-desc">Report an IT issue, follow up via support chat, or view ticket status.</p>
        <div className="actions-row">
          <Link href="/staff/new-ticket" className="btn btn-primary">
            New ticket
          </Link>
          <Link href="/staff/support" className="btn btn-secondary">
            Support chat
          </Link>
          <Link href="/staff/tickets" className="btn btn-secondary">
            My tickets
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
