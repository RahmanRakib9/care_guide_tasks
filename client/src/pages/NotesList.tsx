import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Pagination } from '../components/Pagination';
import { Alert } from '../components/Alert';
import { Note, PaginationMeta } from '../types';

export const NotesList: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchNotes = async (pageNum = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/notes?page=${pageNum}&limit=6`);
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
    fetchNotes(page);
  }, [page]);

  const handleDelete = async (id: string, title: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete note "${title}"?`)) return;

    try {
      await api.delete(`/notes/${id}`);
      setActionMessage('Note deleted successfully');
      setTimeout(() => setActionMessage(null), 3000);
      fetchNotes(page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete note');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>My Notes</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Private notes strictly visible only to you.
          </p>
        </div>
        <Link to="/notes/new" className="btn btn-primary">
          + Create Note
        </Link>
      </div>

      {actionMessage && <Alert type="success" message={actionMessage} />}
      {error && <Alert type="danger" message={error} />}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Loading your notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>You do not have any notes yet.</p>
          <Link to="/notes/new" className="btn btn-primary">
            Create Your First Note
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {notes.map((note) => (
              <div key={note._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    {note.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                    {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    Created: {new Date(note.createdAt).toLocaleDateString()} &bull; {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link to={`/notes/${note._id}/edit`} className="btn btn-secondary btn-sm">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(note._id, note.title)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
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
