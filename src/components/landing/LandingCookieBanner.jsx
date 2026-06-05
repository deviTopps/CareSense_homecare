import { AnimatePresence, motion } from 'motion/react';

const COOKIE_CONSENT_KEY = 'kulobalCookieConsent';

export { COOKIE_CONSENT_KEY };

export default function LandingCookieBanner({
  show,
  showPrefs,
  setShowPrefs,
  prefs,
  setPrefs,
  onPersist,
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          className="cookie-banner"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.28 }}
          role="dialog"
          aria-modal="false"
          aria-label="Cookie preferences"
        >
          <div className="cookie-banner__header">
            <div className="cookie-banner__chip">Cookie Preferences</div>
            <button
              type="button"
              className="cookie-banner__manage"
              onClick={() => setShowPrefs((p) => !p)}
            >
              {showPrefs ? 'Hide settings' : 'Manage settings'}
            </button>
          </div>
          <h3 className="cookie-banner__title">We use cookies to improve your experience.</h3>
          <p>You can accept all, reject optional, or customize preferences.</p>
          {showPrefs && (
            <div className="cookie-banner__prefs">
              <div className="cookie-pref-item">
                <div>
                  <strong>Necessary</strong>
                  <span>Required for core functionality.</span>
                </div>
                <span className="cookie-pref-badge">Always on</span>
              </div>
              <div className="cookie-pref-item">
                <div>
                  <strong>Analytics</strong>
                  <span>Help us improve the product.</span>
                </div>
                <button
                  type="button"
                  className={`cookie-toggle ${prefs.analytics ? 'on' : ''}`}
                  onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                  aria-pressed={prefs.analytics}
                >
                  <span />
                </button>
              </div>
            </div>
          )}
          <div className="cookie-banner__actions">
            <button
              type="button"
              className="cookie-btn ghost"
              onClick={() => onPersist('rejected', { analytics: false, marketing: false })}
            >
              Reject optional
            </button>
            <button
              type="button"
              className="cookie-btn primary"
              onClick={() => onPersist('accepted', { analytics: true, marketing: true })}
            >
              Accept all
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
