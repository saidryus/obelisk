import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import ReauthModal from '../components/ReauthModal';
import Icon from '../components/Icons';
import useSecureAction from '../hooks/useSecureAction';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AddSecretPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const secure = useSecureAction();

  const [authorized, setAuthorized] = useState(!isEdit);
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [file,     setFile]     = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (isEdit && !secure.isTrusted(id)) {
      secure.run('Edit Secret', () => setAuthorized(true), id);
    } else if (isEdit) {
      setAuthorized(true);
    }
  }, []); // eslint-disable-line

  function handleFile(f) {
    if (!f) return;
    if (!/\.(pdf|txt|docx|png|jpg|jpeg|gif)$/i.test(f.name)) { toast.error('File type not allowed'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content && !file) { toast.error('Add text content or upload a file'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      if (content) fd.append('content', content);
      if (file)    fd.append('file', file);
      if (isEdit) {
        await api.put(`/secrets/${id}`, fd);
        toast.success('Secret updated');
      } else {
        await api.post('/secrets', fd);
        toast.success('Secret encrypted and saved');
      }
      navigate('/secrets');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save secret');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h2>{isEdit ? 'Edit Secret' : 'New Secret'}</h2>
            <p>{isEdit ? 'Modify encrypted secret' : 'Encrypt and store confidential data'}</p>
          </div>
          <div className="topbar-right">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/secrets')}>
              <Icon name="chevronLeft" size={14} /> Back
            </button>
          </div>
        </div>

        <div className="page-body">
          <div className="card" style={{
            maxWidth: 620,
            filter: authorized ? 'none' : 'blur(6px)',
            pointerEvents: authorized ? 'auto' : 'none',
            transition: 'filter 0.25s ease'
          }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Product Formula, API Keys, Strategy Document"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confidential Text Content</label>
                <textarea
                  className="form-input"
                  placeholder="Enter sensitive content — will be AES-256 encrypted before storage"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                />
                {content && (
                  <p className="form-hint success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icon name="lock" size={11} /> Will be encrypted with AES-256 before saving
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Attach File <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <div
                  className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => fileRef.current.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                >
                  <div className="upload-zone-icon"><Icon name="upload" size={24} /></div>
                  <p>Click to browse or drag and drop</p>
                  <span>PDF, TXT, DOCX, PNG, JPG — max 10 MB</span>
                  <input
                    ref={fileRef} type="file"
                    accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.gif"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>

                {file && (
                  <div className="upload-preview">
                    <Icon name="file" size={16} color="var(--text-secondary)" />
                    <span className="upload-preview-name">{file.name}</span>
                    <span className="upload-preview-size">{formatBytes(file.size)}</span>
                    <button type="button" className="icon-btn danger" onClick={() => setFile(null)}>
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                )}
              </div>

              <hr className="divider" />

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading
                    ? <><span className="spinner" /> Saving...</>
                    : isEdit
                      ? <><Icon name="check" size={14} /> Update Secret</>
                      : <><Icon name="lock" size={14} /> Encrypt &amp; Save</>
                  }
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/secrets')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {secure.showModal && (
        <ReauthModal
          actionLabel={secure.actionLabel}
          onVerify={secure.handleVerify}
          onCancel={() => { secure.handleCancel(); navigate('/secrets'); }}
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
