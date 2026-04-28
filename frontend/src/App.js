import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute  from './components/ProtectedRoute';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import SecretsPage     from './pages/SecretsPage';
import AddSecretPage   from './pages/AddSecretPage';
import LogsPage        from './pages/LogsPage';
import useSessionManager from './hooks/useSessionManager';
import './styles.css';

// Separate component so we can use hooks inside BrowserRouter context
function SessionGuard() {
  const { isAuthenticated, logout } = useAuth();
  // Runs session expiry + idle timeout + beforeunload cleanup
  useSessionManager(logout, isAuthenticated);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SessionGuard />
        <Routes>
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/dashboard"        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/secrets"          element={<ProtectedRoute><SecretsPage /></ProtectedRoute>} />
          <Route path="/secrets/new"      element={<ProtectedRoute><AddSecretPage /></ProtectedRoute>} />
          <Route path="/secrets/edit/:id" element={<ProtectedRoute><AddSecretPage /></ProtectedRoute>} />
          <Route path="/logs"             element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
          <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
