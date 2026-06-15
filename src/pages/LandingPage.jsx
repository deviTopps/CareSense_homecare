import { useEffect, useState } from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import LandingStats from '../components/landing/LandingStats';
import LandingProblemSolution from '../components/landing/LandingProblemSolution';
import LandingHowItWorks from '../components/landing/LandingHowItWorks';
import LandingReasons from '../components/landing/LandingReasons';
import LandingTestimonials from '../components/landing/LandingTestimonials';
import LandingPricing from '../components/landing/LandingPricing';
import LandingFaq from '../components/landing/LandingFaq';
import LandingCta from '../components/landing/LandingCta';
import LandingFinalCta from '../components/landing/LandingFinalCta';
import LandingFooter from '../components/landing/LandingFooter';
import LandingCookieBanner, { COOKIE_CONSENT_KEY } from '../components/landing/LandingCookieBanner';
import './LandingPage.css';

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showCookiePrefs, setShowCookiePrefs] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState({ analytics: true, marketing: false });

  useEffect(() => {
    document.body.classList.toggle('cs-lp-nav-open', navOpen);
    return () => document.body.classList.remove('cs-lp-nav-open');
  }, [navOpen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!saved) {
        setShowCookieBanner(true);
        return;
      }
      const parsed = JSON.parse(saved);
      if (parsed?.preferences) {
        setCookiePrefs((prev) => ({ ...prev, ...parsed.preferences }));
      }
      setShowCookieBanner(false);
    } catch {
      setShowCookieBanner(true);
    }
  }, []);

  const persistCookieConsent = (consent, preferences) => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
      consent,
      preferences: {
        analytics: Boolean(preferences?.analytics),
        marketing: Boolean(preferences?.marketing),
        necessary: true,
      },
      savedAt: new Date().toISOString(),
      }),
    );
    setCookiePrefs({
      analytics: Boolean(preferences?.analytics),
      marketing: Boolean(preferences?.marketing),
    });
    setShowCookiePrefs(false);
    setShowCookieBanner(false);
  };

  return (
    <div className="cs-lp">
      <a href="#main-content" className="cs-skip-link">
        Skip to main content
      </a>

      <LandingHeader navOpen={navOpen} setNavOpen={setNavOpen} />

      <div className="cs-lp__intro">
        <LandingHero />
        <LandingStats />
      </div>

      <main id="main-content" className="cs-page-main" tabIndex={-1}>
        <LandingProblemSolution />
        <LandingHowItWorks />
        <LandingReasons />
        <LandingTestimonials />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
        <LandingFinalCta />
      </main>

      <LandingFooter />

      <LandingCookieBanner
        show={showCookieBanner}
        showPrefs={showCookiePrefs}
        setShowPrefs={setShowCookiePrefs}
        prefs={cookiePrefs}
        setPrefs={setCookiePrefs}
        onPersist={persistCookieConsent}
      />
    </div>
  );
}
