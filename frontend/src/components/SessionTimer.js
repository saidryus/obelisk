import React, { useState, useEffect } from 'react';
import Icon from './Icons';

const SESSION_DURATION = 60 * 60;

export default function SessionTimer() {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const loginTime = parseInt(localStorage.getItem('loginTime') || '0', 10);
    const elapsed   = Math.floor((Date.now() - loginTime) / 1000);
    return Math.max(0, SESSION_DURATION - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem('loginTime') || '0', 10);
      const elapsed   = Math.floor((Date.now() - loginTime) / 1000);
      setSecondsLeft(Math.max(0, SESSION_DURATION - elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const isWarning  = secondsLeft <= 5 * 60 && secondsLeft > 60;
  const isCritical = secondsLeft <= 60;

  const dotClass = isCritical ? 'critical' : isWarning ? 'warning' : '';
  const timeColor = isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--text-secondary)';

  return (
    <div className="session-indicator">
      <div className={`session-dot ${dotClass}`} />
      <Icon name="clock" size={12} color="currentColor" />
      <span style={{ color: timeColor, fontVariantNumeric: 'tabular-nums' }}>
        {minutes}:{seconds}
      </span>
      <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>session</span>
    </div>
  );
}
