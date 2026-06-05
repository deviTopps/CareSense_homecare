import { HERO_CONTENT } from '../../data/landingContent';

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.15" />
      <path
        d="M5.5 9.2l2.2 2.2 4.8-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingHero() {
  const { badge, title, titleAccent, subtitle, primaryCta, secondaryCta, bullets, floatCard } =
    HERO_CONTENT;

  const titleParts = title.split(titleAccent);

  return (
    <section className="cs-hero" id="home" aria-labelledby="hero-title">
      <div className="cs-hero__bg" aria-hidden />
      <div className="cs-container cs-hero__inner">
        <div className="cs-hero__copy">
          <span className="cs-hero__badge">{badge}</span>
          <h1 id="hero-title" className="cs-hero__title">
            {titleParts[0]}
            <span className="cs-hero__title-accent">{titleAccent}</span>
            {titleParts[1]}
          </h1>
          <p className="cs-hero__subtitle">{subtitle}</p>
          <div className="cs-hero__actions">
            <a href={primaryCta.href} className="cs-btn cs-btn--primary">
              {primaryCta.label}
            </a>
            <a href={secondaryCta.href} className="cs-btn cs-btn--ghost">
              {secondaryCta.label}
            </a>
          </div>
          <ul className="cs-hero__checks">
            {bullets.map((text) => (
              <li key={text}>
                <CheckIcon />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="cs-hero__visual">
          <div className="cs-hero__frame">
            <img
              src="/mockups/02.png"
              alt="CareSense dashboard showing visits and patient overview"
              className="cs-hero__img"
              width={800}
              height={600}
              loading="eager"
            />
          </div>
          <aside className="cs-hero__float" aria-label="Weekly visits highlight">
            <span className="cs-hero__float-label">{floatCard.label}</span>
            <strong className="cs-hero__float-value">{floatCard.value}</strong>
            <span className="cs-hero__float-trend">{floatCard.trend} vs last week</span>
          </aside>
        </div>
      </div>
    </section>
  );
}
