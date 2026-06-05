import { FiMenu, FiX } from '../../icons/hugeicons-feather';
import { BRAND_LOGO_SRC } from '../../constants/brandAssets';
import {
  LANDING_NAV,
  LANDING_NAV_CTA,
  LANDING_PHONE,
  LANDING_PHONE_HREF,
} from '../../data/landingContent';

export default function LandingHeader({ navOpen, setNavOpen, onNavClick }) {
  const closeNav = () => {
    setNavOpen(false);
    onNavClick?.();
  };

  return (
    <header className={`cs-header${navOpen ? ' cs-header--open' : ''}`}>
      <div className="cs-container cs-header__bar">
        <a href="/" className="cs-header__logo" onClick={closeNav}>
          <img src={BRAND_LOGO_SRC} alt="CareSense" className="cs-header__logo-img" />
        </a>

        <nav className="cs-header__nav" aria-label="Primary">
          <ul className="cs-header__nav-list">
            {LANDING_NAV.map((item) => (
              <li key={item.id}>
                <a href={item.href} onClick={closeNav}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="cs-header__actions">
          <a href={LANDING_PHONE_HREF} className="cs-header__phone">
            {LANDING_PHONE}
          </a>
          <a href={LANDING_NAV_CTA.href} className="cs-btn cs-btn--primary cs-btn--sm">
            {LANDING_NAV_CTA.label}
          </a>
        </div>

        <button
          type="button"
          className="cs-header__menu-btn"
          aria-expanded={navOpen}
          aria-controls="landing-mobile-nav"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setNavOpen((o) => !o)}
        >
          {navOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {navOpen && (
        <nav id="landing-mobile-nav" className="cs-header__drawer" aria-label="Mobile">
          <ul className="cs-header__drawer-list">
            {LANDING_NAV.map((item) => (
              <li key={item.id}>
                <a href={item.href} onClick={closeNav}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href={LANDING_NAV_CTA.href} className="cs-btn cs-btn--primary" onClick={closeNav}>
                {LANDING_NAV_CTA.label}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
