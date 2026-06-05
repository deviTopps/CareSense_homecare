import { STATS_CONTENT } from '../../data/landingContent';

export default function LandingStats() {
  return (
    <section className="cs-stats" aria-label="Platform highlights">
      <div className="cs-container">
        <ul className="cs-stats__list">
          {STATS_CONTENT.map((stat) => (
            <li key={stat.label} className="cs-stats__item">
              <span className="cs-stats__value">{stat.value}</span>
              <span className="cs-stats__label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
