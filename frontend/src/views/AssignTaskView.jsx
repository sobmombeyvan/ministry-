'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchTickets } from '@/services/tickets';
import { fetchUsers } from '@/services/users';
import { createTask } from '@/services/tasks';
import Layout, { Card, ErrorAlert, PageHeader } from '@/components/Layout';

export default function AssignTaskView() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState({
    ticket_id: '',
    technician_id: '',
    description: '',
    priority: 'medium',
    start_date: '',
    end_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchTickets(), fetchUsers('technician')])
      .then(([ticketsData, usersData]) => {
        setTickets(ticketsData);
        setTechnicians(usersData);
      })
      .catch((err) => setError(err.message || 'Failed to load data'));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTask(form, user);
      router.push('/admin/tickets');
    } catch (err) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Assign Task" subtitle="Create a task and assign a technician to a ticket" />
      <Card>
        <ErrorAlert message={error} />
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Ticket
            <select name="ticket_id" value={form.ticket_id} onChange={handleChange} required>
              <option value="">Select ticket</option>
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} — {t.title} ({t.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Technician
            <select name="technician_id" value={form.technician_id} onChange={handleChange} required>
              <option value="">Select technician</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.surname} ({t.username})
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Start Date
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
          </label>
          <label>
            End Date
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required />
          </label>
          <label>
            Task Description
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Assigning…' : 'Assign Task'}
          </button>
        </form>
      </Card>
    </Layout>
  );
}
