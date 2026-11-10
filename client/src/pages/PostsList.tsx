import React, { useEffect, useState, FormEvent } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { Alert } from '../components/Alert';
import { Post, PaginationMeta, UserWithPosts } from '../types';

export const PostsList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedUserLookup, setSelectedUserLookup] = useState<UserWithPosts | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const fetchPosts = async (pageNum = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/posts?page=${pageNum}&limit=6`);
      setPosts(res.data.data.posts || []);
      setPagination(res.data.pagination);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handleCreatePost = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setCreateError(null);
    setSubmitting(true);

    try {
      await api.post('/posts', { title, content });
      setTitle('');
      setContent('');
      setShowCreateModal(false);
      fetchPosts(1);
    } catch (err: any) {
      const resData = err.response?.data;
      setCreateError(resData?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectUserPosts = async (userId: string): Promise<void> => {
    setLookupLoading(true);
    setLookupError(null);
    setSelectedUserLookup(null);

    try {
      const res = await api.get(`/posts/users/${userId}`);
      setSelectedUserLookup(res.data.data.user);
    } catch (err: any) {
      setLookupError(err.response?.data?.message || 'Failed to retrieve user details via $lookup');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Public Posts Feed</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Posts visible to everyone. Click an author to trigger MongoDB <code>$lookup</code> aggregation.
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreateModal((prev) => !prev)}
            className="btn btn-primary"
          >
            {showCreateModal ? 'Cancel' : '+ New Post'}
          </button>
        )}
      </div>

      {showCreateModal && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--primary)' }}>
          <h3 className="card-title">Create a Public Post</h3>
          {createError && <Alert type="danger" message={createError} />}
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                type="text"
                required
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="post-content">Content</label>
              <textarea
                id="post-content"
                required
                rows={4}
                className="form-control"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts publicly..."
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </form>
        </div>
      )}

      {lookupLoading && (
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          Running MongoDB $lookup aggregation for user...
        </div>
      )}

      {lookupError && <Alert type="danger" message={lookupError} />}

      {selectedUserLookup && (
        <div className="card" style={{ borderColor: '#38bdf8', backgroundColor: '#f0f9ff', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>
                MongoDB $lookup Pipeline Result
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {selectedUserLookup.name} ({selectedUserLookup.email})
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Total Posts Retrieved via $lookup: <strong>{selectedUserLookup.totalPosts}</strong>
              </p>
            </div>
            <button
              onClick={() => setSelectedUserLookup(null)}
              className="btn btn-secondary btn-sm"
            >
              Close Inspection
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Joined Posts:</h4>
            {selectedUserLookup.posts.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>This user has not authored any posts yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {selectedUserLookup.posts.map((p) => (
                  <div
                    key={p._id}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#ffffff',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.title}</div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{p.content}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                      Created: {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <Alert type="danger" message={error} />}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          Loading public feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No public posts available yet.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {posts.map((post) => {
              const author = typeof post.userId === 'object' && post.userId !== null ? post.userId : null;
              const authorId = author ? author._id : (post.userId as string);
              const authorName = author ? author.name : 'Unknown User';

              return (
                <div key={post._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{post.title}</h3>
                    <p style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                      {post.content}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        By: <strong>{authorName}</strong>
                      </span>
                      {authorId && (
                        <button
                          onClick={() => handleInspectUserPosts(authorId)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                          title="Inspect user posts via $lookup pipeline"
                        >
                          $lookup view
                        </button>
                      )}
                    </div>
                    <div style={{ color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(post.createdAt).toLocaleDateString()}
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
