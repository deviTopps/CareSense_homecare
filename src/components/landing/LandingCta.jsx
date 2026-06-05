import { CTA_CONTENT } from '../../data/landingContent';

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.12" />
      <path
        d="M6 10.5l2.5 2.5 5.5-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingCta() {
  const { eyebrow, title, text, features, appScreen, chips, playStore, webCta } = CTA_CONTENT;

  return (
    <section className="cs-mapp" id="mobile-app" aria-labelledby="mapp-heading">
      <div className="cs-container">
        <div className="cs-mapp__card">
          <div className="cs-mapp__glow cs-mapp__glow--left" aria-hidden />
          <div className="cs-mapp__glow cs-mapp__glow--right" aria-hidden />

          <div className="cs-mapp__grid">
            <div className="cs-mapp__content">
              <span className="cs-mapp__badge">
                <span className="cs-mapp__badge-dot" aria-hidden />
                {eyebrow}
              </span>
              <h2 id="mapp-heading" className="cs-mapp__title">
                {title}
              </h2>
              <p className="cs-mapp__text">{text}</p>

              <ul className="cs-mapp__features">
                {features.map((item) => (
                  <li key={item}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="cs-mapp__download">
                <p className="cs-mapp__download-label">Download for Android</p>
                <div className="cs-mapp__download-row">
                  <a
                    href={playStore.href}
                    className="cs-mapp__store"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={playStore.label}
                  >
                    <img src={playStore.badgeSrc} alt="" />
                  </a>
                  <a href={webCta.href} className="cs-mapp__web-link">
                    {webCta.label}
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="cs-mapp__visual">
              {chips.map((chip, i) => (
                <div
                  key={chip.label}
                  className={`cs-mapp__chip cs-mapp__chip--${i === 0 ? 'top' : 'bottom'}`}
                >
                  <span className="cs-mapp__chip-value">{chip.value}</span>
                  <span className="cs-mapp__chip-label">{chip.label}</span>
                </div>
              ))}

              <div className="cs-mapp__phone">
                <div className="cs-mapp__phone-bezel">
                  <div className="cs-mapp__phone-speaker" aria-hidden />
                  <div className="cs-mapp__phone-screen">
                    <img
                      src={appScreen}
                      alt="CareSense mobile app showing care visits and scheduling"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
