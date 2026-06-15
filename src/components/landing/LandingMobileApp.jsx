import { FiSmartphone, FiMapPin, FiShield, FiMessageCircle } from '../../icons/hugeicons-feather';
import { MOBILE_APP_CONTENT } from '../../data/landingContent';

const FEATURE_ICONS = [FiSmartphone, FiMapPin, FiShield, FiMessageCircle];

export default function LandingMobileApp() {
  const { eyebrow, title, subtitle, description, features, playStore, mockupSrc } =
    MOBILE_APP_CONTENT;

  return (
    <section className="cs-mobile-app" id="mobile-app" aria-labelledby="mobile-app-heading">
      <div className="cs-container">
        <div className="cs-mobile-app__header">
          <span className="cs-section-eyebrow">{eyebrow}</span>
          <h2 id="mobile-app-heading" className="cs-mobile-app__title">{title}</h2>
          <p className="cs-mobile-app__subtitle">{subtitle}</p>
          <p className="cs-mobile-app__desc">{description}</p>
        </div>

        <div className="cs-mobile-app__showcase">
          <div className="cs-mobile-app__features-col cs-mobile-app__features-col--left">
            {features.slice(0, 2).map((f, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div key={f.title} className="cs-mobile-app__card">
                  <div className="cs-mobile-app__icon-wrap">
                    <Icon size={22} strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="cs-mobile-app__feature-title">{f.title}</h3>
                  <p className="cs-mobile-app__feature-text">{f.text}</p>
                </div>
              );
            })}
          </div>

          <div className="cs-mobile-app__visual">
            <div className="cs-mobile-app__phone-glow" />
            <div className="cs-mobile-app__phone-frame">
              <img src={mockupSrc} alt="CareSense mobile app" className="cs-mobile-app__mockup" loading="lazy" />
            </div>
          </div>

          <div className="cs-mobile-app__features-col cs-mobile-app__features-col--right">
            {features.slice(2, 4).map((f, i) => {
              const Icon = FEATURE_ICONS[i + 2];
              return (
                <div key={f.title} className="cs-mobile-app__card">
                  <div className="cs-mobile-app__icon-wrap">
                    <Icon size={22} strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="cs-mobile-app__feature-title">{f.title}</h3>
                  <p className="cs-mobile-app__feature-text">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cs-mobile-app__cta">
          <a href={playStore.href} className="cs-mobile-app__store" target="_blank" rel="noopener noreferrer">
            <img src={playStore.badgeSrc} alt={playStore.label} className="cs-mobile-app__badge" loading="lazy" />
          </a>
          <p className="cs-mobile-app__store-note">Available exclusively on Google Play Store</p>
        </div>
      </div>
    </section>
  );
}
