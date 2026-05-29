import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTargetedGuide, setTargetedGuideDismissed } from '../context/TargetedGuideContext';
import './TargetedGuide.css';

const TOOLTIP_MARGIN = 14;
const VIEWPORT_PAD = 12;

function queryTarget(selector) {
  if (!selector) return null;
  return document.querySelector(`[data-guide="${selector}"]`);
}

function computeTooltipPosition(rect, placement, tooltipSize) {
  const { width: tw, height: th } = tooltipSize;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!rect || placement === 'center') {
    return {
      top: Math.max(VIEWPORT_PAD, (vh - th) / 2),
      left: Math.max(VIEWPORT_PAD, (vw - tw) / 2),
    };
  }

  let top = rect.top;
  let left = rect.left;

  switch (placement) {
    case 'right':
      left = rect.right + TOOLTIP_MARGIN;
      top = rect.top + rect.height / 2 - th / 2;
      break;
    case 'left':
      left = rect.left - tw - TOOLTIP_MARGIN;
      top = rect.top + rect.height / 2 - th / 2;
      break;
    case 'top':
      top = rect.top - th - TOOLTIP_MARGIN;
      left = rect.left + rect.width / 2 - tw / 2;
      break;
    case 'bottom':
    default:
      top = rect.bottom + TOOLTIP_MARGIN;
      left = rect.left + rect.width / 2 - tw / 2;
      break;
  }

  return {
    top: Math.min(Math.max(VIEWPORT_PAD, top), vh - th - VIEWPORT_PAD),
    left: Math.min(Math.max(VIEWPORT_PAD, left), vw - tw - VIEWPORT_PAD),
  };
}

export default function TargetedGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isActive,
    stepIndex,
    totalSteps,
    currentStep,
    closeGuide,
    nextStep,
    prevStep,
  } = useTargetedGuide();

  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [targetMissing, setTargetMissing] = useState(false);

  const isLast = stepIndex >= totalSteps - 1;
  const isFirst = stepIndex <= 0;

  const measure = useCallback(() => {
    const step = currentStep;
    if (!step?.target) {
      setTargetRect(null);
      setTargetMissing(false);
      const tw = 360;
      const th = 220;
      setTooltipPos(computeTooltipPosition(null, 'center', { width: tw, height: th }));
      return;
    }

    const el = queryTarget(step.target);
    if (!el) {
      setTargetRect(null);
      setTargetMissing(true);
      setTooltipPos(computeTooltipPosition(null, 'center', { width: 360, height: 220 }));
      return;
    }

    setTargetMissing(false);
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
    });

    const tooltipEl = document.querySelector('.targeted-guide__tooltip');
    const tw = tooltipEl?.offsetWidth || 340;
    const th = tooltipEl?.offsetHeight || 200;
    setTooltipPos(computeTooltipPosition(rect, step.placement || 'bottom', { width: tw, height: th }));

    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    if (!isActive || !currentStep) return undefined;

    if (currentStep.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }

    const timer = window.setTimeout(measure, currentStep.route ? 320 : 80);
    return () => window.clearTimeout(timer);
  }, [isActive, currentStep, location.pathname, navigate, measure]);

  useEffect(() => {
    if (!isActive) return undefined;

    const onLayout = () => measure();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [isActive, measure]);

  useEffect(() => {
    if (!isActive) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeGuide();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isActive, closeGuide]);

  const handleFinish = () => {
    if (dontShowAgain) setTargetedGuideDismissed(true);
    closeGuide();
  };

  if (typeof document === 'undefined' || !isActive) return null;

  return createPortal(
    <AnimatePresence>
      {isActive ? (
        <motion.div
          className="targeted-guide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="targeted-guide-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="targeted-guide__backdrop" aria-hidden />

          {targetRect ? (
            <motion.div
              className="targeted-guide__spotlight"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
              }}
            />
          ) : null}

          <motion.div
            className="targeted-guide__tooltip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <div className="targeted-guide__progress">
              Step {stepIndex + 1} of {totalSteps}
            </div>
            <h2 id="targeted-guide-title" className="targeted-guide__title">{currentStep.title}</h2>
            <p className="targeted-guide__body">{currentStep.body}</p>
            {targetMissing ? (
              <p className="targeted-guide__hint">This item isn&apos;t visible right now — continue to the next step.</p>
            ) : null}

            <label className="targeted-guide__dismiss">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              Don&apos;t show automatically on login
            </label>

            <div className="targeted-guide__actions">
              <button type="button" className="targeted-guide__btn targeted-guide__btn--ghost" onClick={handleFinish}>
                Skip tour
              </button>
              {!isFirst ? (
                <button type="button" className="targeted-guide__btn targeted-guide__btn--ghost" onClick={prevStep}>
                  Back
                </button>
              ) : null}
              {isLast ? (
                <button type="button" className="targeted-guide__btn targeted-guide__btn--primary" onClick={handleFinish}>
                  Done
                </button>
              ) : (
                <button type="button" className="targeted-guide__btn targeted-guide__btn--primary" onClick={nextStep}>
                  Next
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
