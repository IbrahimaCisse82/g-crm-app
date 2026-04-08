import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export function useInactivityTimer(enabled: boolean) {
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (!enabled || isLocked) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, INACTIVITY_TIMEOUT);
  }, [enabled, isLocked]);

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Start the timer
    resetTimer();

    const handleActivity = () => resetTimer();
    EVENTS.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    // Also detect visibility change (app goes background on mobile)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Store timestamp when app goes to background
        sessionStorage.setItem('gcrm_bg_time', Date.now().toString());
      } else {
        // Check if we've been in background too long
        const bgTime = sessionStorage.getItem('gcrm_bg_time');
        if (bgTime) {
          const elapsed = Date.now() - parseInt(bgTime, 10);
          if (elapsed >= INACTIVITY_TIMEOUT) {
            setIsLocked(true);
          }
          sessionStorage.removeItem('gcrm_bg_time');
        }
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, resetTimer]);

  return { isLocked, unlock };
}
