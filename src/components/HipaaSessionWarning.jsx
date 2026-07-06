import { useEffect, useRef, useState, useCallback } from 'react';
import { HIPAA_SESSION } from '../hipaa/config';

/**
 * Warns before HIPAA idle session timeout; allows user to stay signed in.
 */
export default function HipaaSessionWarning({ active, onStaySignedIn, onLogout }) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const clearTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSecondsLeft(null);
  }, []);

  const scheduleFromActivity = useCallback(() => {
    clearTimers();
    if (!active) return;

    lastActivityRef.current = Date.now();

    const warningDelay = HIPAA_SESSION.INACTIVITY_WARNING_MS;
    const logoutDelay = HIPAA_SESSION.INACTIVITY_LOGOUT_MS;

    warningTimeoutRef.current = window.setTimeout(() => {
      const remaining = Math.max(1, Math.ceil((logoutDelay - warningDelay) / 1000));
      setSecondsLeft(remaining);

      countdownIntervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev == null || prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);

      logoutTimeoutRef.current = window.setTimeout(() => {
        onLogout();
      }, logoutDelay - warningDelay);
    }, warningDelay);
  }, [active, clearTimers, onLogout]);

  useEffect(() => {
    if (!active) {
      clearTimers();
      return undefined;
    }

    const onActivity = () => {
      if (secondsLeft != null) return;
      scheduleFromActivity();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, onActivity, true));
    scheduleFromActivity();

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity, true));
      clearTimers();
    };
  }, [active, clearTimers, scheduleFromActivity, secondsLeft]);

  const handleStay = () => {
    setSecondsLeft(null);
    onStaySignedIn();
    scheduleFromActivity();
  };

  if (!active || secondsLeft == null) return null;

  return (
    <div className="hipaa-session-warning" role="alertdialog" aria-modal="true" aria-labelledby="hipaa-session-title">
      <div className="hipaa-session-warning__backdrop" />
      <div className="hipaa-session-warning__panel">
        <h2 id="hipaa-session-title">Session expiring</h2>
        <p>
          For HIPAA workstation security, you will be signed out in{' '}
          <strong>{secondsLeft}</strong> second{secondsLeft === 1 ? '' : 's'} due to inactivity.
        </p>
        <div className="hipaa-session-warning__actions">
          <button type="button" className="hipaa-session-warning__btn hipaa-session-warning__btn--primary" onClick={handleStay}>
            Stay signed in
          </button>
          <button type="button" className="hipaa-session-warning__btn" onClick={onLogout}>
            Sign out now
          </button>
        </div>
      </div>
    </div>
  );
}
