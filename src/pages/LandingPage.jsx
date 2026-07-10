import { lazy, Suspense, useEffect, useState } from 'react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import LandingTrust from '../components/landing/LandingTrust';
import LandingStats from '../components/landing/LandingStats';
import LandingCookieBanner, { COOKIE_CONSENT_KEY } from '../components/landing/LandingCookieBanner';
import './LandingPage.css';

const LandingReasons = lazy(() => import('../components/landing/LandingReasons'));
const LandingHowItWorks = lazy(() => import('../components/landing/LandingHowItWorks'));
const LandingAudience = lazy(() => import('../components/landing/LandingAudience'));
const LandingSecurity = lazy(() => import('../components/landing/LandingSecurity'));
const LandingMobileApp = lazy(() => import('../components/landing/LandingMobileApp'));
const LandingPricing = lazy(() => import('../components/landing/LandingPricing'));
const LandingTestimonials = lazy(() => import('../components/landing/LandingTestimonials'));
const LandingFaq = lazy(() => import('../components/landing/LandingFaq'));
const LandingFooter = lazy(() => import('../components/landing/LandingFooter'));

function SectionFallback() {
  return <div className="cs-section-fallback" aria-hidden />;
}

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

      <LandingHero />
      <LandingTrust />
      <LandingStats />

      <main id="main-content" className="cs-page-main" tabIndex={-1}>
        <Suspense fallback={<SectionFallback />}>
          <LandingReasons />
          <LandingHowItWorks />
          <LandingAudience />
          <LandingSecurity />
          <LandingMobileApp />
          <LandingPricing />
          <LandingTestimonials />
          <LandingFaq />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <LandingFooter />
      </Suspense>

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
