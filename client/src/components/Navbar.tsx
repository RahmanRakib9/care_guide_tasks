import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        SecureNotes
      </Link>

      <div className="navbar-links">
        <NavLink to="/posts">Public Posts</NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/notes">My Notes</NavLink>

            {isAdmin && (
              <>
                <NavLink to="/admin/users">Users</NavLink>
                <NavLink to="/admin/notes">All Notes</NavLink>
                <NavLink to="/admin/interests">Interests (Agg)</NavLink>
              </>
            )}

            <div className="user-badge">
              <span>{user?.name}</span>
              <span className={`role-tag ${user?.role}`}>{user?.role}</span>
            </div>

            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};
