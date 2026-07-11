import { ArrowUpRight } from 'lucide-react';
import { FEATURES_CONTENT } from '../../data/landingContent';
import LandingReveal, { LandingStagger, LandingStaggerItem } from './LandingReveal';

export default function LandingReasons() {
  const {
    eyebrow,
    titleLine1,
    titleAccent,
    titleLine2Prefix,
    titleLine2Rest,
    cta,
    items,
  } = FEATURES_CONTENT;

  return (
    <section className="cs-features" id="features" aria-labelledby="features-heading">
      <div className="cs-container cs-features__inner">
        <LandingReveal className="cs-features__header">
          <div className="cs-features__header-copy">
            <p className="cs-features__badge">{eyebrow}</p>
            <h2 id="features-heading" className="cs-features__title">
              <span className="cs-features__title-line">{titleLine1}</span>
              <span className="cs-features__title-line">
                {titleLine2Prefix}{' '}
                <span className="cs-features__title-accent">{titleAccent}</span>{' '}
                {titleLine2Rest}
              </span>
            </h2>
          </div>
          <a className="cs-features__learn" href={cta.href}>
            {cta.label}
          </a>
        </LandingReveal>

        <LandingStagger className="cs-features__grid" stagger={0.08}>
          {items.map((item) => {
            const label = item.title.replace(/\n/g, ' ');

            return (
              <LandingStaggerItem key={item.title} className="cs-features__item">
                <article className="cs-features__card">
                  <div className="cs-features__media">
                    <span className="cs-features__blob cs-features__blob--outer" aria-hidden />
                    <span className="cs-features__blob cs-features__blob--mid" aria-hidden />
                    <div className="cs-features__photo">
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>

                  <div className="cs-features__footer">
                    <div className="cs-features__copy">
                      <h3 className="cs-features__label">{item.title}</h3>
                      <p className="cs-features__body">{item.body}</p>
                    </div>
                    <a
                      className="cs-features__icon-btn"
                      href={item.href}
                      aria-label={`Learn more about ${label}`}
                    >
                      <ArrowUpRight strokeWidth={2.25} aria-hidden />
                    </a>
                  </div>
                </article>
              </LandingStaggerItem>
            );
          })}
        </LandingStagger>
      </div>
    </section>
  );
}
