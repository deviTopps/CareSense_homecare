import {
  createContext, useCallback, useContext, useMemo, useState,
} from 'react';
import { TARGETED_GUIDE_STORAGE_KEY, TARGETED_GUIDE_STEPS } from '../data/targetedGuideSteps';

const TargetedGuideContext = createContext(null);

export function isTargetedGuideDismissed() {
  try {
    return localStorage.getItem(TARGETED_GUIDE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTargetedGuideDismissed(dismissed) {
  try {
    if (dismissed) {
      localStorage.setItem(TARGETED_GUIDE_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(TARGETED_GUIDE_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function TargetedGuideProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = TARGETED_GUIDE_STEPS;
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex] || steps[0];

  const startGuide = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const closeGuide = useCallback(() => {
    setIsActive(false);
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((i) => (i >= totalSteps - 1 ? i : i + 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setStepIndex((i) => (i <= 0 ? 0 : i - 1));
  }, []);

  const goToStep = useCallback((index) => {
    const n = Number(index);
    if (!Number.isFinite(n)) return;
    setStepIndex(Math.min(Math.max(0, n), totalSteps - 1));
  }, [totalSteps]);

  const value = useMemo(() => ({
    isActive,
    stepIndex,
    totalSteps,
    currentStep,
    steps,
    startGuide,
    closeGuide,
    nextStep,
    prevStep,
    goToStep,
  }), [
    isActive,
    stepIndex,
    totalSteps,
    currentStep,
    steps,
    startGuide,
    closeGuide,
    nextStep,
    prevStep,
    goToStep,
  ]);

  return (
    <TargetedGuideContext.Provider value={value}>
      {children}
    </TargetedGuideContext.Provider>
  );
}

export function useTargetedGuide() {
  const ctx = useContext(TargetedGuideContext);
  if (!ctx) {
    throw new Error('useTargetedGuide must be used within TargetedGuideProvider');
  }
  return ctx;
}
