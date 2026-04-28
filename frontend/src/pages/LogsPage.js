import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icons';

const ALL_ACTIONS = [
  'LOGIN_ATTEMPT','FAILED_LOGIN','CREATE_SECRET','VIEW_SECRET',
  'UPDATE_SECRET','DELETE_SECRET','FILE_UPLOAD','FILE_DOWNLOAD',
  'REAUTH_SUCCESS','FAILED_REAUTH'
];

export default function LogsPage() {
  const [logs,    setLogs]    = useState([]);
  const [filter,  setFilter]  = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/logs')
      .then(r => setLogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.action === filter);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h2>Activity Logs</h2>
            <p>Complete audit trail of all system actions</p>
          </div>
          <div className="topbar-right">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{filtered.length} entries</span>
          </div>
        </div>

        <div className="page-body">
          <div className="filter-bar">
            <button
              className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('ALL')}
            >
              All
            </button>
            {ALL_ACTIONS.map(a => (
              <button
                key={a}
                className={`btn btn-sm ${filter === a ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(a)}
              >
                {a.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading && (
              <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ borderTopColor: 'var(--text-muted)' }} />
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>Loading logs...</span>
              </div>
            )}
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Detail</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log._id}>
                    <td>
                      <span className={`log-badge log-${log.action}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{log.detail || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <div className="empty-state-icon"><Icon name="logs" size={28} color="var(--text-muted)" /></div>
                        <p>No log entries found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
