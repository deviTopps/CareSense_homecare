import { useState } from 'react';
import { FiCheck } from '../../icons/hugeicons-feather';
import { PRICING_CONTENT } from '../../data/landingContent';

export default function LandingPricing() {
  const { heading, description, plans } = PRICING_CONTENT;
  const [isAnnually, setIsAnnually] = useState(false);
  const highlightedIndex = plans.findIndex((plan) => plan.highlighted);

  return (
    <section className="cs-pricing" id="pricing" aria-labelledby="pricing-heading">
      <div className="cs-container">
        <div className="cs-pricing__intro">
          <h2 id="pricing-heading" className="cs-pricing__heading">
            {heading}
          </h2>

          <div className="cs-pricing__intro-row">
            {description ? (
              <p className="cs-pricing__description">{description}</p>
            ) : null}

            <div
              className="cs-pricing__toggle"
              role="tablist"
              aria-label="Billing period"
            >
              <button
                type="button"
                role="tab"
                id="pricing-tab-monthly"
                aria-selected={!isAnnually}
                aria-controls="pricing-plans"
                className={`cs-pricing__toggle-btn${!isAnnually ? ' cs-pricing__toggle-btn--active' : ''}`}
                onClick={() => setIsAnnually(false)}
              >
                Monthly
              </button>
              <button
                type="button"
                role="tab"
                id="pricing-tab-yearly"
                aria-selected={isAnnually}
                aria-controls="pricing-plans"
                className={`cs-pricing__toggle-btn${isAnnually ? ' cs-pricing__toggle-btn--active' : ''}`}
                onClick={() => setIsAnnually(true)}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        <div className="cs-pricing__grid" id="pricing-plans" role="tabpanel">
          {plans.map((plan, index) => {
            const isHighlighted = highlightedIndex !== -1 && index === highlightedIndex;
            const price = isAnnually ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isAnnually ? plan.period.yearly : plan.period.monthly;
            const isFree = price === 'GH₵0' || price === '$0';

            return (
              <article
                key={plan.planCode || plan.name}
                className={`cs-pricing__card${isHighlighted ? ' cs-pricing__card--highlighted' : ''}`}
              >
                {isHighlighted && plan.highlightedLabel ? (
                  <span className="cs-pricing__popular">{plan.highlightedLabel}</span>
                ) : null}

                <span className="cs-pricing__badge">{plan.name}</span>

                <p className="cs-pricing__price">{price}</p>
                <p className={`cs-pricing__period${isFree ? ' cs-pricing__period--hidden' : ''}`}>
                  {period}
                </p>

                <p className="cs-pricing__plan-desc">
                  {isAnnually ? plan.description.yearly : plan.description.monthly}
                </p>

                <hr className="cs-pricing__divider" aria-hidden />

                <div className="cs-pricing__card-body">
                  <ul className="cs-pricing__features">
                    {plan.features.map((feature) => (
                      <li key={feature} className="cs-pricing__feature">
                        <FiCheck size={16} strokeWidth={2.5} aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.buttonUrl || '/login'}
                    className={`cs-btn cs-pricing__cta${isHighlighted ? ' cs-btn--primary' : ' cs-pricing__cta--outline'}`}
                  >
                    {plan.buttonText}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
