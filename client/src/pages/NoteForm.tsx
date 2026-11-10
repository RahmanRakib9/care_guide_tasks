import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { Alert } from '../components/Alert';

export const NoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; errors?: any[] } | null>(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchNote = async () => {
        try {
          const res = await api.get(`/notes/${id}`);
          const note = res.data.data.note;
          setTitle(note.title);
          setContent(note.content);
        } catch (err: any) {
          setError({
            message: err.response?.data?.message || 'Failed to load note details',
            errors: err.response?.data?.errors || []
          });
        } finally {
          setLoading(false);
        }
      };
      fetchNote();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isEditMode) {
        await api.patch(`/notes/${id}`, { title, content });
      } else {
        await api.post('/notes', { title, content });
      }
      navigate('/notes');
    } catch (err: any) {
      const resData = err.response?.data;
      setError({
        message: resData?.message || 'Failed to save note',
        errors: resData?.errors || []
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Loading note...</div>;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card">
        <h2 className="card-title">{isEditMode ? 'Edit Note' : 'Create New Note'}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>
          {isEditMode ? 'Update your private note content.' : 'Write a new secure private note.'}
        </p>

        {error && <Alert type="danger" message={error.message} errors={error.errors} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              required
              maxLength={100}
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Architecture Notes"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              required
              rows={8}
              maxLength={5000}
              className="form-control"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here..."
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Link to="/notes" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
