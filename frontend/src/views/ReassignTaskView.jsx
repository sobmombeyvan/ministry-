'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchTasks, reassignTask } from '@/services/tasks';
import { fetchUsers } from '@/services/users';
import Layout, { Card, EmptyState, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

export default function ReassignTaskView() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selected, setSelected] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    Promise.all([fetchTasks(), fetchUsers('technician')])
      .then(([tasksData, techs]) => {
        setTasks(tasksData.filter((t) => t.status !== 'closed'));
        setTechnicians(techs);
      })
      .catch((err) => setError(err.message || 'Failed to load data'));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await reassignTask(Number(selected), technicianId, user);
      router.push('/admin/tickets');
    } catch (err) {
      setError(err.message || 'Failed to reassign task');
    } finally {
      setLoading(false);
    }
  };

  const currentTask = tasks.find((t) => String(t.id) === selected);

  return (
    <Layout>
      <PageHeader title="Reassign Task" subtitle="Move a task to a different technician" />
      <ErrorAlert message={error} />
      <Card>
        {tasks.length === 0 ? (
          <EmptyState message="No active tasks to reassign." />
        ) : (
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Task
              <select value={selected} onChange={(e) => setSelected(e.target.value)} required>
                <option value="">Select task</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — Ticket #{t.ticket_id}: {t.description.slice(0, 40)}…
                  </option>
                ))}
              </select>
            </label>
            {currentTask && (
              <div className="info-box">
                <StatusBadge value={currentTask.status} />
                <StatusBadge value={currentTask.priority} />
                <span className="muted">Current assignment shown in ticket detail</span>
              </div>
            )}
            <label>
              New technician
              <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} required>
                <option value="">Select technician</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.surname} ({t.username})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Reassigning…' : 'Reassign Task'}
            </button>
          </form>
        )}
      </Card>
    </Layout>
  );
}
