import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SESSION_DURATION = 60 * 60;  // 60 minutes in seconds
const IDLE_TIMEOUT     = 2  * 60;  // 2 minutes in seconds

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

/**
 * useSessionManager
 * Handles three security features:
 *  1. Session expiry countdown (60 min from loginTime)
 *  2. Idle timeout logout (2 min of inactivity)
 *  3. Tab/browser close cleanup (beforeunload)
 *
 * @param {Function} logout  - logout function from AuthContext
 * @param {boolean}  active  - only run when user is authenticated
 * @returns {{ secondsLeft, isIdle }}
 */
export default function useSessionManager(logout, active) {
  const navigate       = useNavigate();
  const idleTimer      = useRef(null);
  const tickInterval   = useRef(null);
  const secondsLeftRef = useRef(SESSION_DURATION);

  // ── Perform logout with a reason message ──────────────────────────────────
  const handleExpiry = useCallback((reason) => {
    clearInterval(tickInterval.current);
    clearTimeout(idleTimer.current);
    logout();
    toast.error(reason, { duration: 4000 });
    navigate('/login');
  }, [logout, navigate]);

  // ── Reset idle timer on any user activity ─────────────────────────────────
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      handleExpiry('Logged out due to inactivity (2 minutes)');
    }, IDLE_TIMEOUT * 1000);
  }, [handleExpiry]);

  useEffect(() => {
    if (!active) return;

    // Ensure loginTime is set (fallback: now)
    if (!localStorage.getItem('loginTime')) {
      localStorage.setItem('loginTime', Date.now().toString());
    }

    // ── 1. Session expiry ticker (runs every second) ───────────────────────
    tickInterval.current = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem('loginTime') || '0', 10);
      const elapsed   = Math.floor((Date.now() - loginTime) / 1000);
      const remaining = SESSION_DURATION - elapsed;
      secondsLeftRef.current = remaining;

      if (remaining <= 0) {
        handleExpiry('Session expired. Please log in again.');
      } else if (remaining === 5 * 60) {
        toast('Session expires in 5 minutes', {
          icon: null,
          style: { background: '#78350f', color: '#fde68a', border: '1px solid #92400e' }
        });
      }
    }, 1000);

    // ── 2. Idle timeout — attach activity listeners ────────────────────────
    resetIdle(); // start the idle timer immediately
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));

    // ── 3. Tab/browser close — best-effort cleanup ────────────────────────
    // Only remove token/user, NOT loginTime — so the timer survives tab switches.
    // loginTime is intentionally kept so the countdown continues correctly on return.
    function handlePageHide(e) {
      if (!e.persisted) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // loginTime intentionally NOT removed here
      }
    }
    window.addEventListener('pagehide', handlePageHide);

    // ── Cleanup on unmount or when user logs out ───────────────────────────
    return () => {
      clearInterval(tickInterval.current);
      clearTimeout(idleTimer.current);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetIdle));
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [active, resetIdle, handleExpiry]);

  return { secondsLeftRef };
}
