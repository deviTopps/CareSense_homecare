import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { BRAND_LOGO_SRC } from '../../constants/brandAssets';
import { FOOTER_CONTENT } from '../../data/landingContent';
import LandingButton from './LandingButton';
import LandingReveal from './LandingReveal';

function SocialIcon({ id }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
  };

  switch (id) {
    case 'facebook':
      return (
        <svg {...props}>
          <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...props}>
          <path d="M6.5 9.5H3.7V20h2.8V9.5zM5.1 4A1.6 1.6 0 1 0 5.1 7.2 1.6 1.6 0 0 0 5.1 4zM20.3 20h-2.8v-5.6c0-1.6-.6-2.7-2.1-2.7-1.1 0-1.8.8-2.1 1.5-.1.3-.1.7-.1 1.1V20h-2.8s.0-9.4 0-10.5h2.8v1.5c.4-.6 1.1-1.7 2.8-1.7 2 0 3.5 1.3 3.5 4.2V20z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...props}>
          <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2z" />
          <path d="M17.5 6.3a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" />
          <path d="M12 3.5c-2.3 0-2.6 0-3.5.1-2.2.1-3.9 1.8-4 4-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 2.2 1.8 3.9 4 4 .9.1 1.2.1 3.5.1s2.6 0 3.5-.1c2.2-.1 3.9-1.8 4-4 .1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-2.2-1.8-3.9-4-4-.9-.1-1.2-.1-3.5-.1zm0 1.5c2.3 0 2.5 0 3.4.1 1.6.1 2.9 1.3 3 3 .1.9.1 1.1.1 3.4s0 2.5-.1 3.4c-.1 1.6-1.3 2.9-3 3-.9.1-1.1.1-3.4.1s-2.5 0-3.4-.1c-1.6-.1-2.9-1.3-3-3-.1-.9-.1-1.1-.1-3.4s0-2.5.1-3.4c.1-1.6 1.3-2.9 3-3 .9-.1 1.1-.1 3.4-.1z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg {...props}>
          <path d="M21.5 4.3 3.7 11.2c-1.2.5-1.2 1.1-.2 1.4l4.6 1.4 1.8 5.4c.2.6.4.8 1 .8.6 0 .9-.3 1.2-.6l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8L23 5.5c.3-1.2-.4-1.7-1.5-1.2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function LandingFooter() {
  const { banner, brand, columns, newsletter, legal, copyright } = FOOTER_CONTENT;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="cs-footer">
      <div className="cs-container">
        <LandingReveal className="cs-footer__banner" y={20}>
          <h2 className="cs-footer__banner-title">{banner.title}</h2>
          <p className="cs-footer__banner-text">{banner.subtitle}</p>
          <LandingButton href={banner.cta.href} className="cs-footer__banner-cta" showArrow>
            {banner.cta.label}
          </LandingButton>
        </LandingReveal>

        <div className="cs-footer__grid">
          <div className="cs-footer__brand">
            <a href="/" className="cs-footer__logo">
              <img src={BRAND_LOGO_SRC} alt="CareSense" />
            </a>
            <p className="cs-footer__brand-text">{brand.description}</p>
            <div className="cs-footer__social">
              {brand.social.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="cs-footer__social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                >
                  <SocialIcon id={item.id} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} className="cs-footer__column" aria-label={column.title}>
              <h3 className="cs-footer__heading">{column.title}</h3>
              <ul className="cs-footer__list">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="cs-footer__newsletter">
            <h3 className="cs-footer__heading">{newsletter.title}</h3>
            <p className="cs-footer__newsletter-text">{newsletter.description}</p>
            {subscribed ? (
              <p className="cs-footer__newsletter-success" role="status">
                Thanks for subscribing.
              </p>
            ) : (
              <form className="cs-footer__newsletter-form" onSubmit={onSubscribe}>
                <label className="cs-sr-only" htmlFor="footer-newsletter-email">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder={newsletter.placeholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <button type="submit" className="cs-footer__subscribe">
                  {newsletter.buttonLabel}
                  <ChevronRight size={16} aria-hidden />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="cs-footer__bottom">
          <p className="cs-footer__copy">
            © {new Date().getFullYear()} {copyright}
          </p>
          <nav className="cs-footer__legal" aria-label="Legal">
            {legal.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
