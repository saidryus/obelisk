import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../utils/api';

// ── Constants ─────────────────────────────────────────────────────────────
const TRUSTED_DURATION = 3 * 60 * 1000; // 3 min trusted window after success
const MAX_ATTEMPTS     = 5;              // global failed attempts before lockout
const COOLDOWN_SECS    = 120;            // 2-minute cooldown

// ── Module-level singleton ─────────────────────────────────────────────────
// Stored outside the hook so ALL hook instances (SecretsPage, AddSecretPage)
// share the same counter — switching actions cannot reset it.
const globalReauth = {
  attempts:    0,
  blockedUntil: null,

  isBlocked() {
    return this.blockedUntil && Date.now() < this.blockedUntil;
  },
  secondsLeft() {
    if (!this.blockedUntil) return 0;
    return Math.max(0, Math.ceil((this.blockedUntil - Date.now()) / 1000));
  },
  recordFailure() {
    this.attempts += 1;
    if (this.attempts >= MAX_ATTEMPTS) {
      this.blockedUntil = Date.now() + COOLDOWN_SECS * 1000;
      this.attempts     = 0; // reset counter; cooldown is now the gate
      return true;           // signals: now blocked
    }
    return false;
  },
  reset() {
    this.attempts     = 0;
    this.blockedUntil = null;
  },
  attemptsRemaining() {
    return MAX_ATTEMPTS - this.attempts;
  },
};

// Trusted session — keyed by secret ID so each secret requires its own re-auth
const trustedSession = {
  ids: new Set(),   // set of secret IDs that have been verified
  expiryMap: {},    // { [id]: expiresAt timestamp }

  isActive(id) {
    if (!id) return false;
    const exp = this.expiryMap[id];
    if (!exp || Date.now() >= exp) {
      this.ids.delete(id);
      delete this.expiryMap[id];
      return false;
    }
    return true;
  },
  grant(id) {
    if (!id) return;
    this.ids.add(id);
    this.expiryMap[id] = Date.now() + TRUSTED_DURATION;
  },
  revoke(id) {
    if (!id) return;
    this.ids.delete(id);
    delete this.expiryMap[id];
  },
  clear() {
    this.ids.clear();
    this.expiryMap = {};
  },
};

/**
 * useSecureAction
 *
 * Wraps any sensitive action behind password re-authentication.
 *
 * Security model:
 *  - 5 global failed attempts → 2-minute cooldown on ALL sensitive actions
 *  - Switching between View / Edit / Delete does NOT reset the counter
 *  - Successful verify grants a 3-minute trusted window (no repeated prompts)
 *  - Cooldown auto-expires and resets the counter
 */
export default function useSecureAction() {
  const [showModal,    setShowModal]    = useState(false);
  const [actionLabel,  setActionLabel]  = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const pendingAction    = useRef(null);
  const pendingSecretId  = useRef(null);
  const cooldownInterval = useRef(null);

  useEffect(() => () => clearInterval(cooldownInterval.current), []);

  // ── Cooldown ticker ───────────────────────────────────────────────────────
  function startCooldownTick() {
    clearInterval(cooldownInterval.current);
    cooldownInterval.current = setInterval(() => {
      const remaining = globalReauth.secondsLeft();
      setCooldownLeft(remaining);
      if (remaining <= 0) {
        clearInterval(cooldownInterval.current);
        globalReauth.reset();
        setCooldownLeft(0);
        setError('');
      }
    }, 1000);
  }

  // ── run ───────────────────────────────────────────────────────────────────
  /**
   * run(label, callback, secretId)
   * Call before any sensitive action. Skips modal if this specific secret
   * has an active trusted session. Blocks if global cooldown is active.
   */
  const run = useCallback((label, callback, secretId = null) => {
    // Trusted session for this specific secret — no prompt needed
    if (trustedSession.isActive(secretId)) { callback(); return; }

    // Global cooldown active — open modal in blocked state
    if (globalReauth.isBlocked()) {
      const secs = globalReauth.secondsLeft();
      setActionLabel(label);
      setError('');
      setCooldownLeft(secs);
      setShowModal(true);
      startCooldownTick();
      return;
    }

    pendingAction.current  = callback;
    pendingSecretId.current = secretId;
    setActionLabel(label);
    setError('');
    setCooldownLeft(0);
    setShowModal(true);
  }, []); // eslint-disable-line

  // ── handleVerify ──────────────────────────────────────────────────────────
  async function handleVerify(password) {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-password', { password });

      // Success — grant trusted session for this specific secret, reset global counter
      trustedSession.grant(pendingSecretId.current);
      pendingSecretId.current = null;
      globalReauth.reset();
      clearInterval(cooldownInterval.current);
      setCooldownLeft(0);
      setShowModal(false);
      setLoading(false);

      if (pendingAction.current) {
        pendingAction.current();
        pendingAction.current = null;
      }
    } catch (err) {
      const nowBlocked = globalReauth.recordFailure();

      if (nowBlocked) {
        setCooldownLeft(COOLDOWN_SECS);
        setError('');
        startCooldownTick();
      } else {
        const left = globalReauth.attemptsRemaining();
        const base = err.response?.data?.message || 'Incorrect password';
        setError(`${base} — ${left} attempt${left !== 1 ? 's' : ''} remaining.`);
      }
      setLoading(false);
    }
  }

  // ── handleCancel ──────────────────────────────────────────────────────────
  function handleCancel() {
    setShowModal(false);
    setError('');
    if (!globalReauth.isBlocked()) clearInterval(cooldownInterval.current);
    pendingAction.current   = null;
    pendingSecretId.current = null;
  }

  return {
    run,
    showModal,
    actionLabel,
    error,
    loading,
    cooldownLeft,
    attemptsRemaining: globalReauth.attemptsRemaining(),
    maxAttempts: MAX_ATTEMPTS,
    handleVerify,
    handleCancel,
    isTrusted:  (id) => trustedSession.isActive(id),
    revokeTrust: (id) => trustedSession.revoke(id),
  };
}
