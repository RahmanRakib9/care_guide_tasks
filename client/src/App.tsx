import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { NotesList } from './pages/NotesList';
import { NoteForm } from './pages/NoteForm';
import { PostsList } from './pages/PostsList';
import { AdminUsers } from './pages/AdminUsers';
import { AdminNotes } from './pages/AdminNotes';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/posts'} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/posts" element={<PostsList />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              isAdmin ? (
                <Navigate to="/admin/notes" replace />
              ) : (
                <ProtectedRoute>
                  <NotesList />
                </ProtectedRoute>
              )
            }
          />
          <Route
            path="/notes/new"
            element={
              isAdmin ? (
                <Navigate to="/admin/notes" replace />
              ) : (
                <ProtectedRoute>
                  <NoteForm />
                </ProtectedRoute>
              )
            }
          />
          <Route
            path="/notes/:id/edit"
            element={
              isAdmin ? (
                <Navigate to="/admin/notes" replace />
              ) : (
                <ProtectedRoute>
                  <NoteForm />
                </ProtectedRoute>
              )
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notes"
            element={
              <AdminRoute>
                <AdminNotes />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};
