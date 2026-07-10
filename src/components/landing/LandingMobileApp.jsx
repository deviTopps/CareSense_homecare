import { motion, useReducedMotion } from 'motion/react';
import { MOBILE_APP_CONTENT } from '../../data/landingContent';
import LandingReveal from './LandingReveal';

export default function LandingMobileApp() {
  const { badge, title, description, playStore, appStore, mockupSrc } = MOBILE_APP_CONTENT;
  const reduceMotion = useReducedMotion();

  return (
    <section className="cs-mobile-app" id="mobile-app" aria-labelledby="mobile-app-heading">
      <div className="cs-mobile-app__atmosphere" aria-hidden>
        <span className="cs-mobile-app__orb cs-mobile-app__orb--a" />
        <span className="cs-mobile-app__orb cs-mobile-app__orb--b" />
        <span className="cs-mobile-app__grain" />
      </div>

      <div className="cs-container">
        <LandingReveal className="cs-mobile-app__card" y={24}>
          <div className="cs-mobile-app__copy">
            <span className="cs-mobile-app__badge-pill">{badge}</span>

            <h2 id="mobile-app-heading" className="cs-mobile-app__title">
              {title}
            </h2>

            <p className="cs-mobile-app__desc">{description}</p>

            <div className="cs-mobile-app__stores">
              <a
                href={playStore.href}
                className="cs-mobile-app__store-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={playStore.label}
              >
                <span className="cs-mobile-app__store-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#EA4335" d="M3.6 2.2l10.1 10.1-2.4 2.4L3 5.4z" />
                    <path fill="#FBBC04" d="M3 18.6l8.3-8.3 2.4 2.4L3.6 21.8z" />
                    <path fill="#4285F4" d="M16.8 10.7l2.9-1.6c.7-.4.7-1.4 0-1.8l-2.9-1.6-3.2 3.2z" />
                    <path fill="#34A853" d="M13.7 13.7l3.1 3.1 2.9-1.6c.7-.4.7-1.4 0-1.8l-2.9-1.6z" />
                  </svg>
                </span>
                <span className="cs-mobile-app__store-text">
                  <span className="cs-mobile-app__store-kicker">GET IT ON</span>
                  <span className="cs-mobile-app__store-name">Google Play</span>
                </span>
              </a>

              <a
                href={appStore.href}
                className="cs-mobile-app__store-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={appStore.label}
              >
                <span className="cs-mobile-app__store-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                    <path d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.7zM14.4 6.5c.6-.7 1-1.7.9-2.7-0.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 1.9-.5 2.6-1.2z" />
                  </svg>
                </span>
                <span className="cs-mobile-app__store-text">
                  <span className="cs-mobile-app__store-kicker">Download on the</span>
                  <span className="cs-mobile-app__store-name">App Store</span>
                </span>
              </a>
            </div>
          </div>

          <div className="cs-mobile-app__visual">
            <motion.img
              src={mockupSrc}
              alt="CareSense nurse app for recording field visit activities"
              className="cs-mobile-app__phone-img"
              loading="lazy"
              decoding="async"
              width={450}
              height={900}
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -10, 0] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
              }
            />
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
