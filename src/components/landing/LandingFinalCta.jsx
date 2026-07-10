import LandingButton from './LandingButton';
import LandingReveal from './LandingReveal';
import { FINAL_CTA_CONTENT } from '../../data/landingContent';

export default function LandingFinalCta() {
  const { title, subtitle, primaryCta, secondaryCta } = FINAL_CTA_CONTENT;

  return (
    <section className="cs-final-cta" aria-label="Get started">
      <div className="cs-container cs-final-cta__inner">
        <LandingReveal>
          <h2 className="cs-final-cta__title">{title}</h2>
          <p className="cs-final-cta__subtitle">{subtitle}</p>
          <div className="cs-final-cta__actions">
            <LandingButton href={primaryCta.href} size="lg" showArrow>
              {primaryCta.label}
            </LandingButton>
            {secondaryCta ? (
              <LandingButton href={secondaryCta.href} variant="ghost" size="lg" className="cs-btn--on-dark">
                {secondaryCta.label}
              </LandingButton>
            ) : null}
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
