import React, { useEffect, useState, FormEvent } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { Alert } from '../components/Alert';
import { User, PaginationMeta, UserRole } from '../types';

export const AdminUsers: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('user');
  const [interestsInput, setInterestsInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchUsers = async (pageNum = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/users?page=${pageNum}&limit=8`);
      setUsers(res.data.data.users || []);
      setPagination(res.data.pagination);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleCreateUser = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setCreateError(null);
    setSubmitting(true);

    const interests = interestsInput
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      await api.post('/admin/users', { name, email, password, role, interests });
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      setInterestsInput('');
      setShowCreateModal(false);
      setActionMessage('User created successfully');
      setTimeout(() => setActionMessage(null), 3000);
      fetchUsers(1);
    } catch (err: any) {
      const resData = err.response?.data;
      setCreateError(resData?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRole = async (targetUser: User): Promise<void> => {
    const newRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role of ${targetUser.name} to ${newRole.toUpperCase()}?`)) return;

    try {
      await api.patch(`/admin/users/${targetUser._id}`, { role: newRole });
      setActionMessage(`Role updated to ${newRole}`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchUsers(page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (targetUser: User): Promise<void> => {
    if (!window.confirm(`Permanently delete user ${targetUser.name}? This will cascade delete their notes and posts.`)) return;

    try {
      await api.delete(`/admin/users/${targetUser._id}`);
      setActionMessage('User deleted successfully');
      setTimeout(() => setActionMessage(null), 3000);
      fetchUsers(page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>User Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Admin console: Manage user accounts, assign roles, and inspect profiles.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal((prev) => !prev)}
          className="btn btn-primary"
        >
          {showCreateModal ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {actionMessage && <Alert type="success" message={actionMessage} />}
      {error && <Alert type="danger" message={error} />}

      {showCreateModal && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--primary)' }}>
          <h3 className="card-title">Create New System User</h3>
          {createError && <Alert type="danger" message={createError} />}
          <form onSubmit={handleCreateUser}>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="user-name">Full Name</label>
                <input
                  id="user-name"
                  type="text"
                  required
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  type="email"
                  required
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="user-pwd">Password</label>
                <input
                  id="user-pwd"
                  type="password"
                  required
                  minLength={6}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-role">Role</label>
                <select
                  id="user-role"
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="user-interests">Interests (comma-separated)</label>
              <input
                id="user-interests"
                type="text"
                className="form-control"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="coding, cloud, security"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Loading users...
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Interests</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentAdmin?._id === u._id;
                  return (
                    <tr key={u._id}>
                      <td>
                        <strong>{u.name}</strong> {isSelf && <small style={{ color: 'var(--primary)' }}>(You)</small>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-tag ${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        {u.interests && u.interests.length > 0 ? (
                          <div className="tag-list">
                            {u.interests.map((int, i) => (
                              <span key={i} className="tag" style={{ fontSize: '11px' }}>
                                {int}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleToggleRole(u)}
                            className="btn btn-secondary btn-sm"
                            disabled={isSelf}
                            title={isSelf ? 'Cannot change own role' : `Change to ${u.role === 'admin' ? 'user' : 'admin'}`}
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-danger btn-sm"
                            disabled={isSelf}
                            title={isSelf ? 'Cannot delete own account' : 'Delete user'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </div>
      )}
    </div>
  );
};
