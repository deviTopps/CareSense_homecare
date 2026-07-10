import { useState } from 'react';
import { CheckCircle2, Minus, Plus, Users } from 'lucide-react';
import { PRICING_CONTENT } from '../../data/landingContent';
import LandingButton from './LandingButton';
import LandingReveal from './LandingReveal';

function formatPrice(currency, amount) {
  const value = Math.round(amount);
  return `${currency}${value.toLocaleString('en-GH')}`;
}

export default function LandingPricing() {
  const { title, billing, plans, stepper, ctaLabel, ctaHref, setupNote } = PRICING_CONTENT;
  const defaultPlan = plans.find((plan) => plan.defaultSelected)?.id || plans[0]?.id;

  const [cycle, setCycle] = useState('monthly');
  const [selectedId, setSelectedId] = useState(defaultPlan);
  const [patientCount, setPatientCount] = useState(stepper.defaultValue);

  const getDisplayPrice = (plan) => {
    if (plan.billingType === 'oneTime') {
      return plan.monthlyPrice;
    }
    const monthly = plan.monthlyPrice;
    const perPatient = cycle === 'yearly'
      ? monthly * 12 * (1 - billing.yearlyDiscount)
      : monthly;
    return perPatient * patientCount;
  };

  const getUnitLabel = (plan) => {
    if (plan.billingType === 'oneTime') {
      return plan.unitLabel;
    }
    const period = cycle === 'yearly' ? 'Year' : 'Month';
    const patientLabel = patientCount === 1 ? 'patient' : 'patients';
    return `${patientCount} ${patientLabel} | ${period}`;
  };

  const decreasePatients = () => {
    setPatientCount((count) => Math.max(stepper.min, count - stepper.step));
  };

  const increasePatients = () => {
    setPatientCount((count) => count + stepper.step);
  };

  return (
    <section className="cs-pricing" id="pricing" aria-labelledby="pricing-heading">
      <div className="cs-container">
        <LandingReveal className="cs-pricing__shell" y={22}>
          <div className="cs-pricing__card">
            <div className="cs-pricing__header">
              <h2 id="pricing-heading" className="cs-pricing__title">
                {title}
              </h2>

              <div
                className="cs-pricing__toggle"
                role="group"
                aria-label="Billing cycle"
              >
                <button
                  type="button"
                  className={`cs-pricing__toggle-option${cycle === 'monthly' ? ' is-active' : ''}`}
                  aria-pressed={cycle === 'monthly'}
                  onClick={() => setCycle('monthly')}
                >
                  {billing.monthly}
                </button>
                <button
                  type="button"
                  className={`cs-pricing__toggle-option${cycle === 'yearly' ? ' is-active' : ''}`}
                  aria-pressed={cycle === 'yearly'}
                  onClick={() => setCycle('yearly')}
                >
                  {billing.yearly}
                </button>
                <span className="cs-pricing__discount">{billing.discountBadge}</span>
              </div>
            </div>

            <div className="cs-pricing__plans" role="radiogroup" aria-label="Pricing plans">
              {plans.map((plan) => {
                const selected = plan.id === selectedId;
                const price = getDisplayPrice(plan);

                return (
                  <div
                    key={plan.id}
                    className={`cs-pricing__plan${selected ? ' is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="cs-pricing__plan-header"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedId(plan.id)}
                    >
                      <span className="cs-pricing__radio" aria-hidden>
                        <span className="cs-pricing__radio-dot" />
                      </span>

                      <span className="cs-pricing__plan-meta">
                        <span className="cs-pricing__plan-name">{plan.name}</span>
                        <span className="cs-pricing__plan-subtitle">{plan.subtitle}</span>
                      </span>

                      <span className="cs-pricing__plan-price">
                        <span className="cs-pricing__amount" aria-live="polite">
                          {formatPrice(plan.currency, price)}
                        </span>
                        <span className="cs-pricing__unit">
                          {getUnitLabel(plan)}
                        </span>
                        {plan.billingType !== 'oneTime' ? (
                          <span className="cs-pricing__rate">
                            {formatPrice(
                              plan.currency,
                              cycle === 'yearly'
                                ? plan.monthlyPrice * 12 * (1 - billing.yearlyDiscount)
                                : plan.monthlyPrice,
                            )}{' '}
                            per patient
                          </span>
                        ) : null}
                      </span>
                    </button>

                    {selected ? (
                      <div className="cs-pricing__plan-body">
                        <ul className="cs-pricing__features">
                          {plan.features.map((feature) => (
                            <li key={feature} className="cs-pricing__feature">
                              <CheckCircle2 className="cs-pricing__check" aria-hidden />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {plan.billingType !== 'oneTime' ? (
                          <>
                            <div className="cs-pricing__divider" />

                            <div className="cs-pricing__stepper-row">
                              <div className="cs-pricing__stepper-copy">
                                <Users className="cs-pricing__users-icon" aria-hidden />
                                <div>
                                  <p className="cs-pricing__stepper-label">{stepper.label}</p>
                                  <p className="cs-pricing__stepper-sub">{stepper.subLabel}</p>
                                </div>
                              </div>

                              <div className="cs-pricing__stepper" aria-label="Patient quantity">
                                <button
                                  type="button"
                                  className="cs-pricing__stepper-btn"
                                  onClick={decreasePatients}
                                  aria-label="Decrease patients"
                                  disabled={patientCount <= stepper.min}
                                >
                                  <Minus size={18} />
                                </button>
                                <span className="cs-pricing__stepper-value" aria-live="polite">
                                  {patientCount}
                                </span>
                                <button
                                  type="button"
                                  className="cs-pricing__stepper-btn"
                                  onClick={increasePatients}
                                  aria-label="Increase patients"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="cs-pricing__footer">
              <p className="cs-pricing__setup-note">{setupNote}</p>
              <LandingButton href={ctaHref} showArrow className="cs-pricing__cta">
                {ctaLabel}
              </LandingButton>
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
