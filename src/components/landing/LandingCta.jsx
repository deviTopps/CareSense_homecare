import { APP_STORE_BADGE_SRC, GOOGLE_PLAY_BADGE_SRC } from '../../constants/brandAssets';
import { CTA_CONTENT } from '../../data/landingContent';

function StoreBadgeButton({ href, label, src, className = '' }) {
  return (
    <a
      href={href}
      className={`cs-mapp__store ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <img src={src} alt="" className="cs-mapp__store-img" />
    </a>
  );
}

function PhoneMockup({ variant = 'side' }) {
  return (
    <div className={`cs-mapp__device cs-mapp__device--${variant}`}>
      <div className="cs-mapp__frame">
        <div className="cs-mapp__island" aria-hidden />
        <div className="cs-mapp__screen">
          {variant === 'center' ? (
            <StoreBadgeButton
              href={CTA_CONTENT.playStore.href}
              label={CTA_CONTENT.playStore.label}
              src={GOOGLE_PLAY_BADGE_SRC}
              className="cs-mapp__screen-badge-link"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LandingCta() {
  const { eyebrow, title, appStore, playStore } = CTA_CONTENT;

  return (
    <section className="cs-mapp" id="mobile-app" aria-labelledby="mapp-heading">
      <div className="cs-container cs-mapp__inner">
        <span className="cs-mapp__badge">{eyebrow}</span>

        <h2 id="mapp-heading" className="cs-mapp__title">
          {title}
        </h2>

        <div className="cs-mapp__stores">
          <StoreBadgeButton
            href={appStore.href}
            label={appStore.label}
            src={APP_STORE_BADGE_SRC}
          />
          <StoreBadgeButton
            href={playStore.href}
            label={playStore.label}
            src={GOOGLE_PLAY_BADGE_SRC}
          />
        </div>

        <div className="cs-mapp__showcase">
          <PhoneMockup variant="left" />
          <PhoneMockup variant="center" />
          <PhoneMockup variant="right" />
        </div>
      </div>
    </section>
  );
}
