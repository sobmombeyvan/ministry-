'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createTicket } from '@/services/tickets';
import Layout, { Card, ErrorAlert, PageHeader } from '@/components/Layout';

export default function NewTicketView() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'hardware',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ticket = await createTicket({ ...form, userId: user.id });
      router.push(`/staff/tickets/${ticket.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="New Ticket" subtitle="Report an IT issue to the support team" />
      <Card>
        <ErrorAlert message={error} />
        <form className="form form-narrow" onSubmit={handleSubmit}>
          <label>
            Title
            <input name="title" value={form.title} onChange={handleChange} required />
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="hardware">Hardware</option>
              <option value="network">Network</option>
              <option value="software">Software</option>
            </select>
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={6}
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </Card>
    </Layout>
  );
}
