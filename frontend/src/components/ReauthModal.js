import React, { useState } from 'react';
import Icon from './Icons';

const ACTION_META = {
  'View Secret':   { icon: 'eye',      desc: 'Verify your identity to decrypt and view this secret.' },
  'Edit Secret':   { icon: 'pencil',   desc: 'Verify your identity before modifying this secret.' },
  'Delete Secret': { icon: 'trash',    desc: 'Verify your identity before permanently deleting this secret.' },
  'Download File': { icon: 'download', desc: 'Verify your identity to download this file.' },
};

/**
 * ReauthModal
 * Props:
 *  - actionLabel      : string
 *  - onVerify         : (password) => void
 *  - onCancel         : () => void
 *  - error            : string
 *  - loading          : bool
 *  - cooldownLeft     : number  — seconds remaining (0 = not blocked)
 *  - attemptsRemaining: number  — attempts left before lockout
 *  - maxAttempts      : number  — total allowed attempts
 */
export default function ReauthModal({
  actionLabel = 'Sensitive Action',
  onVerify, onCancel,
  error, loading,
  cooldownLeft     = 0,
  attemptsRemaining = 5,
  maxAttempts       = 5,
}) {
  const [password, setPassword] = useState('');
  const meta      = ACTION_META[actionLabel] || { icon: 'key', desc: 'Enter your password to continue.' };
  const isBlocked = cooldownLeft > 0;
  const usedAttempts = maxAttempts - attemptsRemaining;

  function handleSubmit(e) {
    e.preventDefault();
    if (isBlocked) return;
    onVerify(password);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-icon-wrap" style={isBlocked ? {
            background: 'var(--danger-subtle)', borderColor: 'rgba(248,81,73,0.3)'
          } : {}}>
            <Icon
              name={isBlocked ? 'alert' : meta.icon}
              size={18}
              color={isBlocked ? 'var(--danger)' : 'var(--accent-hover)'}
            />
          </div>
          <h3>{isBlocked ? 'All Actions Temporarily Blocked' : 'Re-authentication Required'}</h3>
          <p style={{ fontSize: '0.78rem' }}>
            {isBlocked
              ? 'Too many failed attempts across all sensitive actions.'
              : meta.desc}
          </p>
        </div>

        {/* Blocked: countdown */}
        {isBlocked ? (
          <div style={{
            background: 'var(--danger-subtle)', border: '1px solid rgba(248,81,73,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '1rem',
            marginBottom: '1rem', textAlign: 'center',
          }}>
            <div style={{
              fontSize: '2rem', fontWeight: 700, color: 'var(--danger)',
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
            }}>
              {String(Math.floor(cooldownLeft / 60)).padStart(2, '0')}:{String(cooldownLeft % 60).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              All sensitive actions are restricted until cooldown expires
            </div>
          </div>
        ) : (
          /* Not blocked: trusted session note + attempt dots */
          <>
            <div className="modal-trusted-note">
              <Icon name="shield" size={13} />
              Verified access lasts <strong style={{ margin: '0 0.2rem' }}>3 minutes</strong> — no repeated prompts.
            </div>

            {/* Global attempt dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Global attempts:</span>
              {Array.from({ length: maxAttempts }).map((_, i) => (
                <span key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < usedAttempts ? 'var(--danger)' : 'var(--bg-elevated)',
                  border: `1px solid ${i < usedAttempts ? 'var(--danger)' : 'var(--border)'}`,
                  transition: 'background 0.2s ease',
                }} />
              ))}
              {usedAttempts > 0 && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.1rem' }}>
                  {attemptsRemaining} remaining
                </span>
              )}
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder={isBlocked ? 'Unavailable during cooldown' : 'Enter your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required={!isBlocked}
              disabled={isBlocked}
              autoFocus={!isBlocked}
              style={isBlocked ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            />
            {error && !isBlocked && (
              <p className="text-error">
                <Icon name="alert" size={13} />
                {/* Strip attempt count — shown via dots */}
                {error.replace(/ — \d+ attempt.* remaining\.?/, '')}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || isBlocked}
              style={{ flex: 1 }}
            >
              {loading
                ? <span className="spinner" />
                : isBlocked
                  ? <><Icon name="clock" size={14} /> Blocked</>
                  : <><Icon name="check" size={14} /> Verify &amp; {actionLabel}</>
              }
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
