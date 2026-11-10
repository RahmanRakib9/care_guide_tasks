import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Pagination } from '../components/Pagination';
import { Alert } from '../components/Alert';
import { InterestGroup, PaginationMeta } from '../types';

export const AdminInterests: React.FC = () => {
  const [groups, setGroups] = useState<InterestGroup[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterestGroups = async (pageNum = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/users/interests?page=${pageNum}&limit=6`);
      setGroups(res.data.data.groups || []);
      setPagination(res.data.pagination);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load interest groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterestGroups(page);
  }, [page]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Users Grouped by Interests</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Visualizing MongoDB Aggregation Scenario 1: Executed via a single <code>collection.aggregate()</code> pipeline.
        </p>
      </div>

      <div className="card" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
          Aggregation Architecture Note
        </h4>
        <p style={{ fontSize: '13px', color: '#14532d' }}>
          This data is generated on MongoDB using <code>$match</code> &rarr; <code>$unwind</code> &rarr; <code>$group</code> &rarr; <code>$sort</code> &rarr; <code>$project</code> &rarr; <code>$facet</code> in <strong>exactly ONE database aggregation call</strong>. Zero in-memory JS grouping or secondary queries are used.
        </p>
      </div>

      {error && <Alert type="danger" message={error} />}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Executing aggregation pipeline...
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No interests found among existing users.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {groups.map((group) => (
              <div key={group._id} className="interest-card">
                <div className="interest-header">
                  <span className="interest-title">#{group.interest}</span>
                  <span
                    style={{
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '12px'
                    }}
                  >
                    {group.totalUsers} {group.totalUsers === 1 ? 'user' : 'users'}
                  </span>
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    MEMBERS:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {group.users.map((u) => (
                      <li
                        key={u._id}
                        style={{
                          fontSize: '13px',
                          padding: '4px 0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderBottom: '1px dashed #f1f5f9'
                        }}
                      >
                        <span>{u.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{u.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}
    </div>
  );
};
