import { BRAND_LOGO_SRC } from '../../constants/brandAssets';
import { FOOTER_LINKS } from '../../data/landingContent';

export default function LandingFooter() {
  return (
    <footer className="cs-footer">
      <div className="cs-container cs-footer__inner">
        <a href="/" className="cs-footer__logo">
          <img src={BRAND_LOGO_SRC} alt="CareSense" />
        </a>

        <nav className="cs-footer__nav" aria-label="Footer">
          <ul className="cs-footer__nav-list">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="cs-footer__copy">
          © {new Date().getFullYear()} Data Leap Technologies Inc.
        </p>
      </div>
    </footer>
  );
}
