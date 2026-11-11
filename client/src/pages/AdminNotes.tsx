import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Pagination } from '../components/Pagination';
import { Alert } from '../components/Alert';
import { Note, PaginationMeta } from '../types';

export const AdminNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllNotes = async (pageNum = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/notes?page=${pageNum}&limit=8`);
      setNotes(res.data.data.notes || []);
      setPagination(res.data.pagination);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotes(page);
  }, [page]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>All Notes (Admin Overview)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Inspect notes across all registered users in the system.
        </p>
      </div>

      {error && <Alert type="danger" message={error} />}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Loading all system notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No notes found in the database.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {notes.map((note) => {
              const author = typeof note.userId === 'object' && note.userId !== null ? note.userId : null;
              const authorName = author ? author.name : 'Unknown';
              const authorEmail = author ? author.email : 'N/A';

              return (
                <div key={note._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{note.title}</h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                      {note.content}
                    </p>
                  </div>
                  <div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      <div>
                        Author: <strong>{authorName}</strong> ({authorEmail})
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        Created: {new Date(note.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}
    </div>
  );
};
