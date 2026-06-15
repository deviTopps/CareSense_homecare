import { FiCheck, FiArrowRight } from '../../icons/hugeicons-feather';
import { PRICING_CONTENT } from '../../data/landingContent';

export default function LandingPricing() {
  const { heading, description, perPatient, setup, example } = PRICING_CONTENT;

  return (
    <section className="cs-pricing" id="pricing" aria-labelledby="pricing-heading">
      <div className="cs-container">
        <div className="cs-pricing__intro">
          <h2 id="pricing-heading" className="cs-pricing__heading">
            {heading}
          </h2>
          {description && <p className="cs-pricing__description">{description}</p>}
        </div>

        <div className="cs-pricing__layout">
          <div className="cs-pricing__main-card">
            <div className="cs-pricing__main-header">
              <span className="cs-pricing__main-price">{perPatient.price}</span>
              <span className="cs-pricing__main-unit">{perPatient.unit}</span>
            </div>

            <p className="cs-pricing__main-desc">{perPatient.description}</p>

            <ul className="cs-pricing__features">
              {perPatient.features.map((feature) => (
                <li key={feature} className="cs-pricing__feature">
                  <FiCheck size={16} strokeWidth={2.5} aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <a href={perPatient.buttonUrl} className="cs-btn cs-btn--primary cs-pricing__cta">
              {perPatient.buttonText}
              <FiArrowRight size={16} strokeWidth={2} aria-hidden />
            </a>
          </div>

          <div className="cs-pricing__side">
            <div className="cs-pricing__setup-card">
              <span className="cs-pricing__setup-badge">{setup.label}</span>
              <span className="cs-pricing__setup-price">{setup.price}</span>
              <p className="cs-pricing__setup-desc">{setup.description}</p>
              <ul className="cs-pricing__setup-list">
                {setup.includes.map((item) => (
                  <li key={item} className="cs-pricing__setup-item">
                    <FiCheck size={14} strokeWidth={2.5} aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {example && (
              <div className="cs-pricing__example">
                <span className="cs-pricing__example-label">{example.label}</span>
                <p className="cs-pricing__example-text">{example.text}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
