'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminDashboard } from '@/services/dashboard';
import Layout, { Card, ContentLoading, ErrorAlert, PageHeader, StatGrid } from '@/components/Layout';

export default function AdminDashboardView() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboard()
      .then(setStats)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageHeader title="Admin Dashboard" subtitle="System-wide overview" />
      <ErrorAlert message={error} />
      {loading ? (
        <ContentLoading message="Loading dashboard…" />
      ) : stats ? (
        <StatGrid
          stats={[
            { label: 'Total Tickets', value: stats.total_tickets },
            { label: 'Pending', value: stats.pending_tickets },
            { label: 'In Progress', value: stats.in_progress_tickets },
            { label: 'Closed', value: stats.closed_tickets },
            { label: 'Technicians', value: stats.total_technicians },
            { label: 'Tasks In Progress', value: stats.tasks_in_progress },
            { label: 'Refused Tasks', value: stats.refused_tasks },
            { label: 'Total Users', value: stats.total_users },
          ]}
        />
      ) : null}
      <Card className="mt-4" title="Administration">
        <div className="actions-row">
          <Link href="/admin/support" className="btn btn-primary">
            Support chat
          </Link>
          <Link href="/admin/assign-task" className="btn btn-secondary">
            Assign task
          </Link>
          <Link href="/admin/users" className="btn btn-secondary">
            Manage users
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
