'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchTasks, refuseTask, updateTaskStatus } from '@/services/tasks';
import Layout, { Card, ContentLoading, EmptyState, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

export default function TasksView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTasks = () => {
    fetchTasks()
      .then(setTasks)
      .catch((err) => setError(err.message || 'Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleUpdateStatus = async (taskId, status) => {
    setError('');
    try {
      await updateTaskStatus(taskId, status, user);
      loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleRefuse = async (taskId) => {
    setError('');
    try {
      await refuseTask(taskId, user);
      loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to refuse task');
    }
  };

  return (
    <Layout>
      <PageHeader title="My Tasks" subtitle="Manage your assigned technical tasks" />
      <ErrorAlert message={error} />
      <Card className="card-table">
        {loading ? (
          <ContentLoading message="Loading tasks…" />
        ) : tasks.length === 0 ? (
          <EmptyState message="No tasks assigned yet." />
        ) : (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>#{task.id}</td>
                    <td>
                      <Link href={`/technician/tickets/${task.ticket_id}`} className="link">
                        #{task.ticket_id}
                      </Link>
                    </td>
                    <td>{task.description}</td>
                    <td>
                      <StatusBadge value={task.priority} />
                    </td>
                    <td>
                      <StatusBadge value={task.status} />
                    </td>
                    <td>{task.end_date ? new Date(task.end_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="actions-row compact">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                          className="select-sm"
                        >
                          <option value="open">open</option>
                          <option value="pending">pending</option>
                          <option value="in_progress">in progress</option>
                          <option value="closed">closed</option>
                        </select>
                        {task.status !== 'refused' && task.status !== 'closed' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRefuse(task.id)}
                          >
                            Refuse
                          </button>
                        )}
                      </div>
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
