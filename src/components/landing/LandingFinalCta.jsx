import { FINAL_CTA_CONTENT } from '../../data/landingContent';
import LandingButton from './LandingButton';
import LandingReveal from './LandingReveal';

export default function LandingFinalCta() {
  const { badge, title, subtitle, highlights, primaryCta, secondaryCta } = FINAL_CTA_CONTENT;

  return (
    <section className="cs-final-cta" aria-labelledby="final-cta-heading">
      <div className="cs-final-cta__atmosphere" aria-hidden>
        <span className="cs-final-cta__orb cs-final-cta__orb--a" />
        <span className="cs-final-cta__orb cs-final-cta__orb--b" />
        <span className="cs-final-cta__orb cs-final-cta__orb--c" />
        <span className="cs-final-cta__grid" />
      </div>

      <div className="cs-container">
        <LandingReveal className="cs-final-cta__panel" y={24}>
          <span className="cs-final-cta__badge">{badge}</span>

          <h2 id="final-cta-heading" className="cs-final-cta__title">
            {title}
          </h2>

          <p className="cs-final-cta__subtitle">{subtitle}</p>

          {highlights?.length ? (
            <ul className="cs-final-cta__highlights">
              {highlights.map((item) => (
                <li key={item} className="cs-final-cta__highlight">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="cs-final-cta__actions">
            <LandingButton href={primaryCta.href} size="lg" showArrow className="cs-final-cta__primary">
              {primaryCta.label}
            </LandingButton>
            {secondaryCta ? (
              <LandingButton
                href={secondaryCta.href}
                variant="ghost"
                size="lg"
                className="cs-final-cta__secondary"
              >
                {secondaryCta.label}
              </LandingButton>
            ) : null}
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
