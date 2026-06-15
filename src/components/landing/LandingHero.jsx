import { Link } from 'react-router-dom';
import { FiArrowRight } from '../../icons/hugeicons-feather';
import { HERO_CONTENT } from '../../data/landingContent';

export default function LandingHero() {
  const { badge, title, titleAccent, subtitle, primaryCta, secondaryCta, trustLine } = HERO_CONTENT;
  const titleParts = title.split(titleAccent);

  return (
    <section className="cs-hero cs-hero115" id="home" aria-labelledby="hero-title">
      <div className="cs-hero115__pattern" aria-hidden>
        <span className="cs-hero115__pattern-grid" />
        <span className="cs-hero115__pattern-dots" />
        <span className="cs-hero115__pattern-glow" />
      </div>

      <div className="cs-container cs-hero115__container">
        <div className="cs-hero115__stack">
          <div className="cs-hero115__copy">
            {badge ? <span className="cs-hero115__badge">{badge}</span> : null}

            <h1 id="hero-title" className="cs-hero115__title">
              {titleParts[0]}
              <span className="cs-hero115__title-accent">{titleAccent}</span>
              {titleParts[1] || ''}
            </h1>

            <p className="cs-hero115__description">{subtitle}</p>

            <div className="cs-hero115__cta">
              <a href={primaryCta.href} className="cs-btn cs-btn--primary cs-hero115__btn">
                {primaryCta.label}
                <FiArrowRight size={16} strokeWidth={2} aria-hidden />
              </a>
              {secondaryCta ? (
                <Link to={secondaryCta.href} className="cs-btn cs-btn--ghost cs-hero115__btn">
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>

            {trustLine ? <p className="cs-hero115__trust">{trustLine}</p> : null}
          </div>

          <img
            src="/mockups/HomePage.png"
            alt="CareSense dashboard showing visits and patient overview"
            className="cs-hero115__img"
            width={1200}
            height={675}
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
