import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import ReauthModal from '../components/ReauthModal';
import SecretTimer from '../components/SecretTimer';
import Icon from '../components/Icons';
import useSecureAction from '../hooks/useSecureAction';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function IconBtn({ icon, label, onClick, variant = '', disabled = false }) {
  return (
    <button className={`icon-btn ${variant}`} onClick={onClick} disabled={disabled} title={label}>
      <Icon name={icon} size={14} />
      <span className="tooltip">{label}</span>
    </button>
  );
}

export default function SecretsPage() {
  const [secrets,       setSecrets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  // viewingSecret: { ...secretData, decryptedAt: timestamp }
  const [viewingSecret, setViewingSecret] = useState(null);
  const [downloading,   setDownloading]   = useState(null);
  const navigate = useNavigate();
  const secure = useSecureAction();

  useEffect(() => { fetchSecrets(); }, []);

  async function fetchSecrets() {
    try {
      const res = await api.get('/secrets');
      setSecrets(res.data);
    } catch { toast.error('Failed to load secrets'); }
    finally { setLoading(false); }
  }

  function handleView(id) {
    secure.run('View Secret', async () => {
      try {
        const res = await api.get(`/secrets/${id}`);
        // Persist decryptedAt to sessionStorage so it survives tab switches
        const key = `decryptedAt_${id}`;
        const existing = sessionStorage.getItem(key);
        // Only reuse timestamp if it's still within the 3-minute window
        const stored = existing ? parseInt(existing, 10) : null;
        const isStillValid = stored && (Date.now() - stored) < 3 * 60 * 1000;
        const decryptedAt = isStillValid ? stored : Date.now();
        if (!isStillValid) sessionStorage.setItem(key, decryptedAt.toString());
        setViewingSecret({ ...res.data, decryptedAt });
        toast.success('Secret decrypted');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to decrypt');
      }
    }, id);
  }

  function handleEdit(id) {
    secure.run('Edit Secret', () => navigate(`/secrets/edit/${id}`), id);
  }

  function handleDelete(id, title) {
    secure.run('Delete Secret', async () => {
      if (!window.confirm(`Permanently delete "${title}"?`)) return;
      try {
        await api.delete(`/secrets/${id}`);
        toast.success('Secret deleted');
        setSecrets(prev => prev.filter(s => s._id !== id));
        if (viewingSecret?._id === id) setViewingSecret(null);
      } catch { toast.error('Delete failed'); }
    }, id);
  }

  function handleDownload(id, filename) {
    secure.run('Download File', async () => {
      setDownloading(id);
      try {
        const res = await api.get(`/secrets/${id}/download`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        window.URL.revokeObjectURL(url);
        toast.success('File downloaded');
      } catch { toast.error('Download failed'); }
      finally { setDownloading(null); }
    }, id);
  }

  function handleTimerExpire(secretTitle, secretId) {
    sessionStorage.removeItem(`decryptedAt_${secretId}`);
    secure.revokeTrust(secretId);   // force re-auth next time View is clicked
    setViewingSecret(null);
    toast('Decrypted view closed — access window expired', {
      icon: null,
      style: {
        background: 'var(--bg-elevated)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
        fontSize: '0.8rem',
      }
    });
  }

  function getType(s) {
    if (s.hasText && s.hasFile) return { label: 'Text + File', cls: 'badge-both' };
    if (s.hasText) return { label: 'Text', cls: 'badge-text' };
    return { label: 'File', cls: 'badge-file' };
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h2>Trade Secrets</h2>
            <p>Encrypted confidential data vault</p>
          </div>
          <div className="topbar-right">
            <Link to="/secrets/new" className="btn btn-primary btn-sm">
              <Icon name="plus" size={14} /> New Secret
            </Link>
          </div>
        </div>

        <div className="page-body">
          {loading && <p className="text-muted" style={{ fontSize: '0.85rem' }}>Loading secrets...</p>}

          {!loading && secrets.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Icon name="lock" size={36} color="var(--text-muted)" /></div>
              <p>No secrets stored yet</p>
              <Link to="/secrets/new" className="btn btn-primary btn-sm">Create your first secret</Link>
            </div>
          )}

          <div className="secrets-grid">
            {secrets.map(s => {
              const type      = getType(s);
              const isViewing = viewingSecret?._id === s._id;

              return (
                <div key={s._id} className="secret-card">
                  <div className="secret-card-top">
                    <div style={{ minWidth: 0 }}>
                      <div className="secret-title">{s.title}</div>
                    </div>
                    <div className="secret-card-actions">
                      <IconBtn icon="eye"    label="View"   onClick={() => handleView(s._id)} />
                      <IconBtn icon="pencil" label="Edit"   onClick={() => handleEdit(s._id)} />
                      <IconBtn icon="trash"  label="Delete" onClick={() => handleDelete(s._id, s.title)} variant="danger" />
                    </div>
                  </div>

                  <div className="secret-meta">
                    <span className={`badge ${type.cls}`}>{type.label}</span>
                    {s.hasText && <span className="badge badge-encrypted"><Icon name="lock" size={9} /> Encrypted</span>}
                    <span className="secret-date">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>

                  {s.hasFile && (
                    <div className="secret-filename">
                      <Icon name="file" size={12} color="var(--text-muted)" />
                      {s.originalFileName}
                      {s.fileSize ? <span style={{ color: 'var(--text-muted)' }}>({formatBytes(s.fileSize)})</span> : null}
                    </div>
                  )}

                  {/* Decrypted panel with countdown timer */}
                  {isViewing && (
                    <div className="decrypted-panel">
                      <div className="decrypted-panel-header">
                        <span className="decrypted-label">
                          <Icon name="unlock" size={11} /> Decrypted Content
                        </span>
                        <button className="icon-btn" onClick={() => {
                          sessionStorage.removeItem(`decryptedAt_${s._id}`);
                          setViewingSecret(null);
                        }} title="Hide">
                          <Icon name="x" size={13} />
                        </button>
                      </div>

                      {/* Per-secret access timer */}
                      <SecretTimer
                        startedAt={viewingSecret.decryptedAt}
                        onExpire={() => handleTimerExpire(s.title, s._id)}
                      />

                      {viewingSecret.content && (
                        <div className="decrypted-content">{viewingSecret.content}</div>
                      )}
                      {viewingSecret.hasFile && (
                        <div style={{ padding: '0 0.85rem 0.85rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleDownload(s._id, s.originalFileName)}
                            disabled={downloading === s._id}
                          >
                            {downloading === s._id
                              ? <><span className="spinner" /> Downloading...</>
                              : <><Icon name="download" size={13} /> Download File</>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {secure.showModal && (
        <ReauthModal
          actionLabel={secure.actionLabel}
          onVerify={secure.handleVerify}
          onCancel={secure.handleCancel}
          error={secure.error}
          loading={secure.loading}
          cooldownLeft={secure.cooldownLeft}
          attemptsRemaining={secure.attemptsRemaining}
          maxAttempts={secure.maxAttempts}
        />
      )}
    </div>
  );
}
