import { Building2, CalendarDays, HeartPulse, FileSpreadsheet } from 'lucide-react';
import { AUDIENCE_CONTENT } from '../../data/landingContent';
import LandingReveal, { LandingStagger, LandingStaggerItem } from './LandingReveal';

const ROLE_ICONS = {
  owners: Building2,
  coordinators: CalendarDays,
  nurses: HeartPulse,
  billing: FileSpreadsheet,
};

export default function LandingAudience() {
  const { eyebrow, title, subtitle, items } = AUDIENCE_CONTENT;
  const featured = items.find((item) => item.accent === 'featured') || items[0];
  const supporting = items.filter((item) => item.id !== featured.id);
  const FeaturedIcon = ROLE_ICONS[featured.id] || Building2;

  return (
    <section className="cs-audience" id="audience" aria-labelledby="audience-heading">
      <div className="cs-audience__glow" aria-hidden />

      <div className="cs-container">
        <LandingReveal className="cs-audience__intro">
          <p className="cs-section__eyebrow">{eyebrow}</p>
          <h2 id="audience-heading" className="cs-section__title">
            {title}
          </h2>
          {subtitle ? <p className="cs-audience__lead">{subtitle}</p> : null}
        </LandingReveal>

        <LandingStagger className="cs-audience__mosaic" stagger={0.07}>
          <LandingStaggerItem className="cs-audience__featured">
            <article className="cs-audience__panel cs-audience__panel--featured">
              <div className="cs-audience__panel-top">
                <span className="cs-audience__icon" aria-hidden>
                  <FeaturedIcon strokeWidth={1.75} />
                </span>
                <span className="cs-audience__index">01</span>
              </div>
              <h3 className="cs-audience__role">{featured.title}</h3>
              <p className="cs-audience__copy">{featured.body}</p>
              <span className="cs-audience__tag">Leadership view</span>
            </article>
          </LandingStaggerItem>

          {supporting.map((item, index) => {
            const Icon = ROLE_ICONS[item.id] || Building2;
            return (
              <LandingStaggerItem key={item.id} className="cs-audience__support">
                <article className="cs-audience__panel">
                  <div className="cs-audience__panel-top">
                    <span className="cs-audience__icon" aria-hidden>
                      <Icon strokeWidth={1.75} />
                    </span>
                    <span className="cs-audience__index">0{index + 2}</span>
                  </div>
                  <h3 className="cs-audience__role">{item.title}</h3>
                  <p className="cs-audience__copy">{item.body}</p>
                </article>
              </LandingStaggerItem>
            );
          })}
        </LandingStagger>
      </div>
    </section>
  );
}
