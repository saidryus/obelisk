import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icons';

const DISPLAY_DURATION = 3 * 60; // 3 minutes in seconds

/**
 * SecretTimer
 * Shows a countdown for how long a decrypted secret remains visible.
 * Calls onExpire() when it hits zero.
 *
 * Props:
 *  - startedAt : timestamp (ms) when the secret was decrypted
 *  - onExpire  : () => void — called when timer reaches 0
 */
export default function SecretTimer({ startedAt, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, DISPLAY_DURATION - elapsed);
  });
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed   = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, DISPLAY_DURATION - elapsed);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  const isWarning  = secondsLeft <= 60 && secondsLeft > 15;
  const isCritical = secondsLeft <= 15;

  // Progress bar: percentage of time remaining
  const pct = (secondsLeft / DISPLAY_DURATION) * 100;
  const barColor = isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--accent-hover)';

  return (
    <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
      {/* Progress bar */}
      <div style={{
        height: 2, background: 'var(--bg-hover)',
        borderRadius: 999, marginBottom: '0.45rem', overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: barColor,
          transition: 'width 1s linear, background 0.3s ease',
          borderRadius: 999,
        }} />
      </div>

      {/* Label + countdown */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.7rem',
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          color: isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--text-muted)'
        }}>
          <Icon name="clock" size={11} color="currentColor" />
          {isCritical ? 'Closing soon' : 'Access expires in'}
        </span>
        <span style={{
          fontVariantNumeric: 'tabular-nums', fontWeight: 600,
          color: barColor,
          transition: 'color 0.3s ease',
        }}>
          {minutes}:{seconds}
        </span>
      </div>
    </div>
  );
}
