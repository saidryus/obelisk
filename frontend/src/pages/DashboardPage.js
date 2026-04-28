import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icons';

const SECURITY_FEATURES = [
  { icon: 'lock',   title: 'AES-256 Encryption',    desc: 'All text encrypted at rest' },
  { icon: 'key',    title: 'JWT Authentication',     desc: '1-hour expiring tokens' },
  { icon: 'shield', title: 'Re-authentication',      desc: 'Required for all sensitive actions' },
  { icon: 'alert',  title: 'Brute-force Protection', desc: '5-attempt account lockout' },
  { icon: 'file',   title: 'Secure File Access',     desc: 'Auth-gated file downloads' },
  { icon: 'logs',   title: 'Audit Logging',          desc: 'All actions recorded' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [secrets,    setSecrets]    = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/secrets').then(r => setSecrets(r.data)),
      api.get('/logs').then(r => setRecentLogs(r.data.slice(0, 8)))
    ]).finally(() => setLoading(false));
  }, []);

  const textSecrets = secrets.filter(s => s.hasText && !s.hasFile).length;
  const fileSecrets = secrets.filter(s => s.hasFile).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h2>Dashboard</h2>
            <p>Welcome back, {user?.username}</p>
          </div>
          <div className="topbar-right">
            <Link to="/secrets/new" className="btn btn-primary btn-sm">
              <Icon name="plus" size={14} /> New Secret
            </Link>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Total Secrets', value: secrets.length, icon: 'lock', sub: 'encrypted vault entries' },
              { label: 'Text Secrets',  value: textSecrets,    icon: 'text', sub: 'AES-256 encrypted' },
              { label: 'File Secrets',  value: fileSecrets,    icon: 'file', sub: 'secure file storage' },
              { label: 'Log Entries',   value: recentLogs.length, icon: 'logs', sub: 'recent activity' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">{s.label}</span>
                  <Icon name={s.icon} size={15} color="var(--text-muted)" className="stat-card-icon" />
                </div>
                <div className="stat-card-value">{loading ? '—' : s.value}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Security Status */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Icon name="shield" size={15} color="var(--success)" /> Security Status
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                  All systems active
                </span>
              </div>
              <div className="security-grid">
                {SECURITY_FEATURES.map(f => (
                  <div key={f.title} className="security-item">
                    <Icon name={f.icon} size={14} color="var(--success)" className="security-item-icon" />
                    <div>
                      <div className="security-item-title">{f.title}</div>
                      <div className="security-item-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Icon name="activity" size={15} color="var(--text-muted)" /> Recent Activity
                </span>
                <Link to="/logs" className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem' }}>View all</Link>
              </div>
              {loading && <p className="text-muted" style={{ fontSize: '0.82rem' }}>Loading...</p>}
              {!loading && recentLogs.length === 0 && (
                <p className="text-muted" style={{ fontSize: '0.82rem' }}>No activity recorded yet</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentLogs.map(log => (
                  <div key={log._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`log-badge log-${log.action}`}>{log.action.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
