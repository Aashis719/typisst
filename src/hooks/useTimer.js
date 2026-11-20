import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Synchronized high-precision timer supporting both countdown (Time mode)
 * and count-up (Words, Quote, Zen, Custom modes).
 */
export function useTimer({ mode = 'countup', durationSeconds = 30, onComplete, onSecondTick } = {}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const lastWholeSecondRef = useRef(0);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onSecondTickRef = useRef(onSecondTick);
  onSecondTickRef.current = onSecondTick;

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    if (startTimeRef.current !== null) {
      const finalElapsed = performance.now() - startTimeRef.current;
      setElapsedMs(finalElapsed);
      return finalElapsed;
    }
    return 0;
  }, [clearTimerInterval]);

  const reset = useCallback(() => {
    clearTimerInterval();
    startTimeRef.current = null;
    lastWholeSecondRef.current = 0;
    completedRef.current = false;
    setIsRunning(false);
    setElapsedMs(0);
  }, [clearTimerInterval]);

  const start = useCallback(() => {
    if (startTimeRef.current !== null) return;
    startTimeRef.current = performance.now();
    lastWholeSecondRef.current = 0;
    completedRef.current = false;
    setIsRunning(true);

    clearTimerInterval();
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      setElapsedMs(elapsed);

      const wholeSec = Math.floor(elapsed / 1000);
      if (wholeSec > lastWholeSecondRef.current) {
        lastWholeSecondRef.current = wholeSec;
        if (onSecondTickRef.current) {
          onSecondTickRef.current(wholeSec, elapsed / 1000);
        }
      }

      if (mode === 'countdown' && elapsed >= durationSeconds * 1000 && !completedRef.current) {
        completedRef.current = true;
        clearTimerInterval();
        setIsRunning(false);
        setElapsedMs(durationSeconds * 1000);
        if (onCompleteRef.current) {
          onCompleteRef.current(durationSeconds);
        }
      }
    }, 50);
  }, [clearTimerInterval, durationSeconds, mode]);

  useEffect(() => {
    return () => clearTimerInterval();
  }, [clearTimerInterval]);

  const elapsedSeconds = elapsedMs / 1000;
  const remainingSeconds =
    mode === 'countdown' ? Math.max(0, Math.ceil(durationSeconds - elapsedSeconds)) : elapsedSeconds;

  return {
    elapsedMs,
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    start,
    stop,
    reset,
    getExactElapsedSeconds: () =>
      startTimeRef.current !== null ? (performance.now() - startTimeRef.current) / 1000 : 0,
  };
}
