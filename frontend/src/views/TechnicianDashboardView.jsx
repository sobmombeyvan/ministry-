'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { technicianDashboard } from '@/services/dashboard';
import Layout, { Card, ContentLoading, ErrorAlert, PageHeader, StatGrid } from '@/components/Layout';

export default function TechnicianDashboardView() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    technicianDashboard(user.id)
      .then(setStats)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Layout>
      <PageHeader title="Technician Dashboard" subtitle="Your assigned work overview" />
      <ErrorAlert message={error} />
      {loading ? (
        <ContentLoading message="Loading dashboard…" />
      ) : stats ? (
        <StatGrid
          stats={[
            { label: 'Total Tasks', value: stats.total_tasks },
            { label: 'In Progress', value: stats.in_progress },
            { label: 'Pending', value: stats.pending },
            { label: 'Completed', value: stats.completed },
          ]}
        />
      ) : null}
      <Card className="mt-4" title="Quick actions">
        <div className="actions-row">
          <Link href="/technician/support" className="btn btn-primary">
            Support chat
          </Link>
          <Link href="/technician/tasks" className="btn btn-secondary">
            My tasks
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
