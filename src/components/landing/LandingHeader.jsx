import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { BRAND_LOGO_SRC } from '../../constants/brandAssets';
import {
  LANDING_NAV,
  LANDING_NAV_CTA,
  LANDING_NAV_PRIMARY,
} from '../../data/landingContent';
import useTheme from '../../hooks/useTheme';
import LandingButton from './LandingButton';
import { Button } from '@/components/ui/button';

export default function LandingHeader({ navOpen, setNavOpen, onNavClick }) {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeNav = () => {
    setNavOpen(false);
    onNavClick?.();
  };

  return (
    <header
      className={`cs-header${navOpen ? ' cs-header--open' : ''}${scrolled ? ' cs-header--scrolled' : ''}`}
    >
      <div className="cs-container">
        <div className="cs-header__shell">
          <a href="/" className="cs-header__logo" onClick={closeNav}>
            <img src={BRAND_LOGO_SRC} alt="CareSense" className="cs-header__logo-img" />
          </a>

          <nav className="cs-header__nav" aria-label="Primary">
            <ul className="cs-header__nav-list">
              {LANDING_NAV.map((item) => (
                <li key={item.id}>
                  <a href={item.href} className="cs-header__nav-link" onClick={closeNav}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="cs-header__actions">
            <button
              type="button"
              className="cs-header__theme-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            </button>
            <LandingButton href={LANDING_NAV_CTA.href} variant="ghost" size="sm" className="cs-header__signin">
              {LANDING_NAV_CTA.label}
            </LandingButton>
            <LandingButton href={LANDING_NAV_PRIMARY.href} size="sm">
              {LANDING_NAV_PRIMARY.label}
            </LandingButton>
          </div>

          <div className="cs-header__mobile-tools">
            <button
              type="button"
              className="cs-header__theme-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            </button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="cs-header__menu-btn"
              aria-expanded={navOpen}
              aria-controls="landing-mobile-nav"
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setNavOpen((o) => !o)}
            >
              {navOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {navOpen ? (
          <motion.nav
            id="landing-mobile-nav"
            className="cs-header__drawer"
            aria-label="Mobile"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="cs-container cs-header__drawer-inner">
              <ul className="cs-header__drawer-list">
                {LANDING_NAV.map((item) => (
                  <li key={item.id}>
                    <a href={item.href} onClick={closeNav}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="cs-header__drawer-actions">
                <LandingButton href={LANDING_NAV_CTA.href} variant="ghost" fullWidth onClick={closeNav}>
                  {LANDING_NAV_CTA.label}
                </LandingButton>
                <LandingButton href={LANDING_NAV_PRIMARY.href} fullWidth onClick={closeNav}>
                  {LANDING_NAV_PRIMARY.label}
                </LandingButton>
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
