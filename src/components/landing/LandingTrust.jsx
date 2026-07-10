import { TRUSTED_BY } from '../../data/landingContent';
import LandingReveal, { LandingStagger, LandingStaggerItem } from './LandingReveal';

export default function LandingTrust() {
  const { eyebrow, label, lead, items } = TRUSTED_BY;

  return (
    <section className="cs-trust" aria-labelledby="trust-heading">
      <div className="cs-trust__atmosphere" aria-hidden />

      <div className="cs-container">
        <LandingReveal className="cs-trust__intro">
          {eyebrow ? <p className="cs-trust__eyebrow">{eyebrow}</p> : null}
          <h2 id="trust-heading" className="cs-trust__title">
            {label}
          </h2>
          {lead ? <p className="cs-trust__lead">{lead}</p> : null}
        </LandingReveal>

        <LandingStagger className="cs-trust__roles" stagger={0.08} as="ul">
          {items.map((item) => (
            <LandingStaggerItem key={item} as="li" className="cs-trust__role">
              <a href="#audience" className="cs-trust__role-link">
                <span className="cs-trust__role-mark" aria-hidden />
                <span className="cs-trust__role-name">{item}</span>
              </a>
            </LandingStaggerItem>
          ))}
        </LandingStagger>
      </div>
    </section>
  );
}
