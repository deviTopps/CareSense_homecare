import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Smooth progress animation for table/page loaders.
 * Creeps toward target while active; use setProgressTarget for real milestones.
 */
export function useLoadProgress(isActive, options = {}) {
  const { finishDelay = 320 } = options;
  const [progress, setProgress] = useState(0);
  const targetRef = useRef(0);
  const finishTimerRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      targetRef.current = 0;
      if (finishTimerRef.current) {
        window.clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      return undefined;
    }

    targetRef.current = 4;
    const tick = window.setInterval(() => {
      setProgress((prev) => {
        const target = targetRef.current;
        if (prev >= 100) return 100;
        if (prev < target) {
          return Math.min(target, prev + Math.max(0.8, (target - prev) * 0.12));
        }
        const creepCap = Math.min(96, target + 18);
        if (prev >= creepCap) return prev;
        return prev + 0.35;
      });
    }, 60);

    return () => window.clearInterval(tick);
  }, [isActive]);

  const setProgressTarget = useCallback((value) => {
    const next = Math.min(100, Math.max(0, value));
    targetRef.current = Math.max(targetRef.current, next);
    setProgress((prev) => Math.max(prev, next));
  }, []);

  const finishProgress = useCallback((onDone) => {
    targetRef.current = 100;
    setProgress(100);
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null;
      onDone?.();
    }, finishDelay);
    return finishTimerRef.current;
  }, [finishDelay]);

  useEffect(() => () => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
  }, []);

  return { progress, setProgressTarget, finishProgress };
}
