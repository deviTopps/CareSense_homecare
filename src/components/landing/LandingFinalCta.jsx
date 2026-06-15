import { FiArrowRight } from '../../icons/hugeicons-feather';
import { FINAL_CTA_CONTENT } from '../../data/landingContent';

export default function LandingFinalCta() {
  const { title, subtitle, primaryCta, secondaryCta } = FINAL_CTA_CONTENT;

  return (
    <section className="cs-final-cta" aria-label="Get started">
      <div className="cs-container cs-final-cta__inner">
        <h2 className="cs-final-cta__title">{title}</h2>
        <p className="cs-final-cta__subtitle">{subtitle}</p>
        <div className="cs-final-cta__actions">
          <a href={primaryCta.href} className="cs-btn cs-btn--primary cs-btn--lg">
            {primaryCta.label}
            <FiArrowRight size={16} strokeWidth={2} aria-hidden />
          </a>
          {secondaryCta ? (
            <a href={secondaryCta.href} className="cs-btn cs-btn--ghost cs-btn--lg">
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
