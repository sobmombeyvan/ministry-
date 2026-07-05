'use client';

import { useEffect, useRef, useState } from 'react';
import {
  summaryReport,
  taskReport,
  technicianPerformanceReport,
  ticketReport,
} from '@/services/reports';
import Layout, { Card, ErrorAlert, PageHeader } from '@/components/Layout';
import { formatTicketNumber } from '@/lib/format';

export default function ReportsView() {
  const printRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [techPerf, setTechPerf] = useState([]);

  useEffect(() => {
    Promise.all([summaryReport(), ticketReport(), taskReport(), technicianPerformanceReport()])
      .then(([s, t, tk, tp]) => {
        setSummary(s);
        setTickets(t);
        setTasks(tk);
        setTechPerf(tp);
      })
      .catch((err) => setError(err.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-loading"><div className="spinner" /><p>Generating reports…</p></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Reports"
        subtitle="System-wide ticket, task, and performance reports"
        action={
          <button type="button" className="btn btn-primary no-print" onClick={handlePrint}>
            Export PDF / Print
          </button>
        }
      />
      <ErrorAlert message={error} />

      <div className="print-area" ref={printRef}>
        <div className="print-header">
          <h1>Ministry IT — System Report</h1>
          <p>Generated {new Date().toLocaleString()}</p>
        </div>

        {summary && (
          <Card className="mt-4" title="Summary">
            <div className="stat-grid">
              <div className="stat-card accent-blue">
                <p className="stat-label">Total Tickets</p>
                <p className="stat-value">{summary.total_tickets}</p>
              </div>
              <div className="stat-card accent-amber">
                <p className="stat-label">Pending</p>
                <p className="stat-value">{summary.pending_tickets}</p>
              </div>
              <div className="stat-card accent-violet">
                <p className="stat-label">In Progress</p>
                <p className="stat-value">{summary.in_progress_tickets}</p>
              </div>
              <div className="stat-card accent-green">
                <p className="stat-label">Closed</p>
                <p className="stat-value">{summary.closed_tickets}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="mt-4" title="Ticket Report">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reporter</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.ref}>
                    <td>{formatTicketNumber(t.ref, t.created)}</td>
                    <td>{t.title}</td>
                    <td>{t.category}</td>
                    <td>{t.priority}</td>
                    <td>{t.status}</td>
                    <td>{t.reporter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mt-4" title="Task Report">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ticket</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td>#{t.ticket}</td>
                    <td>{t.description}</td>
                    <td>{t.priority}</td>
                    <td>{t.status}</td>
                    <td>{t.due || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mt-4" title="Technician Performance">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Total</th>
                  <th>In Progress</th>
                  <th>Closed</th>
                  <th>Refused</th>
                </tr>
              </thead>
              <tbody>
                {techPerf.map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td>{t.total}</td>
                    <td>{t.in_progress}</td>
                    <td>{t.closed}</td>
                    <td>{t.refused}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
