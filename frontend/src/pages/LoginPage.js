import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    if (params.get('expired')) {
      setError('Your session expired. Please sign in again.');
      toast.error('Session expired');
    }
  }, [isAuthenticated, navigate, params]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.user, res.data.token);
      toast.success(`Signed in as ${res.data.user.username}`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Icon name="shield" size={18} />
          </div>
          <div className="auth-logo-text">
            <h1>Obelisk</h1>
            <p>Secret Protection System</p>
          </div>
        </div>

        <h2>Sign in</h2>
        <p>Access your secure confidential data vault</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <Icon name="alert" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading
              ? <><span className="spinner" /> Authenticating...</>
              : <><Icon name="lock" size={14} /> Sign In</>
            }
          </button>
        </form>

        <hr className="auth-divider" />
        <p className="auth-hint">
          Demo accounts: <code>alice / Alice@123</code> &nbsp; <code>bob / Bob@123</code>
        </p>
      </div>
    </div>
  );
}
