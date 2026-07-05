'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile, changePassword } from '@/services/profile';
import Layout, { Card, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

export default function ProfileView({ basePath = '/staff' }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', surname: '', email: '' });
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((p) => {
        setProfile(p);
        setForm({ name: p.name, surname: p.surname, email: p.email });
      })
      .catch((err) => setError(err.message));
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updated = await updateProfile(user.id, form);
      setProfile(updated);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm.newPassword);
      setPwForm({ newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  if (!profile) {
    return (
      <Layout>
        <div className="page-loading"><div className="spinner" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="My Profile" subtitle="View and update your account" />
      <ErrorAlert message={error} />
      {success && <div className="alert alert-success">{success}</div>}

      <div className="detail-grid">
        <Card title="Account details">
          <div className="meta-row">
            <StatusBadge value={profile.role} />
            <StatusBadge value={profile.account_status} />
          </div>
          <p className="muted">Username: <strong>{profile.username}</strong></p>
          <form className="form mt-4" onSubmit={handleProfileSave}>
            <label>
              First name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Surname
              <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </Card>

        <Card title="Change password">
          <form className="form" onSubmit={handlePasswordChange}>
            <label>
              New password
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
              />
            </label>
            <button type="submit" className="btn btn-secondary btn-block" disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
