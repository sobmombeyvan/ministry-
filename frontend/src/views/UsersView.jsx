'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, setUserStatus, setUserRole, updateUser } from '@/services/users';
import { useAuth } from '@/context/AuthContext';
import Layout, { Card, ContentLoading, EmptyState, ErrorAlert, PageHeader } from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';

const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'technician', label: 'Technician' },
  { value: 'admin', label: 'Admin' },
];

export default function UsersView() {
  const { user: actor } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', surname: '', email: '', role: 'staff' });
  const [roleSaving, setRoleSaving] = useState(null);

  const loadUsers = () => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async (user) => {
    setError('');
    try {
      const newStatus = user.account_status === 'active' ? 'deactivated' : 'active';
      await setUserStatus(user.id, newStatus, actor);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleRoleChange = async (user, role) => {
    if (user.role === role) return;
    setError('');
    setRoleSaving(user.id);
    try {
      await setUserRole(user.id, role, actor);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to change role');
    } finally {
      setRoleSaving(null);
    }
  };

  const openEdit = (user) => {
    setEditing(user.id);
    setEditForm({
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing === actor.id && editForm.role !== 'admin') {
        throw new Error('You cannot remove your own admin access');
      }
      await updateUser(editing, editForm, actor);
      setEditing(null);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Users"
        subtitle="View all accounts, assign roles (staff / technician / admin), and manage access"
      />
      <ErrorAlert message={error} />
      <Card className="card-table">
        {loading ? (
          <ContentLoading message="Loading users…" />
        ) : users.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name} {user.surname}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="role-select"
                        value={user.role}
                        disabled={roleSaving === user.id}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td><StatusBadge value={user.account_status} /></td>
                    <td>
                      <div className="actions-row compact">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(user)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleStatus(user)}
                          disabled={user.id === actor.id}
                        >
                          {user.account_status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <h3>Edit user</h3>
            <form className="form" onSubmit={saveEdit}>
              <label>
                First name
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </label>
              <label>
                Surname
                <input value={editForm.surname} onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </label>
              <label>
                Role
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
