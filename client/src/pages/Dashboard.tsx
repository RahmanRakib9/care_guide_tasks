import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<{ notesCount: number; postsCount: number; loading: boolean }>({
    notesCount: 0,
    postsCount: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notesRes, postsRes] = await Promise.all([
          api.get('/notes?limit=1'),
          api.get(`/posts/users/${user?._id}`)
        ]);

        setStats({
          notesCount: notesRes.data.pagination?.total ?? 0,
          postsCount: postsRes.data.data.user?.totalPosts ?? 0,
          loading: false
        });
      } catch {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    if (user?._id && !isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin]);

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Welcome back, {user?.name}!</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Signed in as <strong>{user?.email}</strong> &bull; Role:{' '}
          <span className={`role-tag ${user?.role}`}>{user?.role}</span>
        </p>

        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '13px', color: 'var(--text-muted)' }}>YOUR INTERESTS:</strong>
          {user?.interests && user.interests.length > 0 ? (
            <div className="tag-list">
              {user.interests.map((interest, idx) => (
                <span key={idx} className="tag">
                  #{interest}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              No interests specified yet.
            </p>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">My Notes</h3>
            <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary)', margin: '8px 0' }}>
              {stats.loading ? '...' : stats.notesCount}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Your private notes.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/notes" className="btn btn-secondary btn-sm">
                View All Notes
              </Link>
              <Link to="/notes/new" className="btn btn-primary btn-sm">
                + New Note
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">My Public Posts</h3>
            <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)', margin: '8px 0' }}>
              {stats.loading ? '...' : stats.postsCount}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/posts" className="btn btn-secondary btn-sm">
                Explore Feed
              </Link>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ borderColor: '#fca5a5', backgroundColor: '#fff5f5' }}>
          <h3 className="card-title" style={{ color: '#991b1b' }}>
            Admin Management Console
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '14px', marginBottom: '16px' }}>
            Manage user accounts and view users' notes and public posts.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              Manage Users
            </Link>
            <Link to="/admin/notes" className="btn btn-secondary btn-sm">
              View All Notes
            </Link>
            <Link to="/posts" className="btn btn-secondary btn-sm">
              View Public Posts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
