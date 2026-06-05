import { FEATURES_CONTENT } from '../../data/landingContent';
import { FeatureIcon } from './featureIcons';
import LandingSection from './LandingSection';

export default function LandingReasons() {
  const { eyebrow, title, subtitle, items } = FEATURES_CONTENT;

  return (
    <LandingSection id="features" eyebrow={eyebrow} title={title} headerAlign="center">
      {subtitle && <p className="cs-section-lead">{subtitle}</p>}
      <div className="cs-features__grid">
        {items.map((item) => (
          <article key={item.title} className="cs-features__card">
            <span className="cs-features__icon" aria-hidden>
              <FeatureIcon name={item.icon} />
            </span>
            <h3 className="cs-features__title">{item.title}</h3>
            <p className="cs-features__body">{item.body}</p>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
