import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';

export const Register: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [interestsInput, setInterestsInput] = useState<string>('');
  const [error, setError] = useState<{ message: string; errors?: any[] } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const interests = interestsInput
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      await register({ name, email, password, interests });
      navigate('/dashboard');
    } catch (err: any) {
      const resData = err.response?.data;
      setError({
        message: resData?.message || 'Registration failed. Please check your inputs.',
        errors: resData?.errors || []
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '40px auto' }}>
      <div className="card">
        <h2 className="card-title">Create Account</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>
          Register for a secure note-taking account.
        </p>

        {error && <Alert type="danger" message={error.message} errors={error.errors} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              required
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice Johnson"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min 6 characters)</label>
            <input
              id="password"
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
            <label htmlFor="interests">Interests </label>
            <input
              id="interests"
              type="text"
              className="form-control"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              placeholder="coding, security, reading"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};
