import { Heart, Star } from 'lucide-react';
import { TESTIMONIALS_CONTENT } from '../../data/landingContent';
import LandingButton from './LandingButton';
import LandingReveal, { LandingStagger, LandingStaggerItem } from './LandingReveal';

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function LandingTestimonials() {
  const { badge, title, subtitle, items, ctaLabel, ctaHref } = TESTIMONIALS_CONTENT;

  return (
    <section className="cs-testimonials" id="testimonials" aria-labelledby="testimonials-heading">
      <div className="cs-testimonials__glows" aria-hidden>
        <span className="cs-testimonials__glow cs-testimonials__glow--a" />
        <span className="cs-testimonials__glow cs-testimonials__glow--b" />
        <span className="cs-testimonials__glow cs-testimonials__glow--c" />
      </div>

      <div className="cs-container">
        <LandingReveal className="cs-testimonials__intro">
          <span className="cs-testimonials__badge">
            <span className="cs-testimonials__badge-icon" aria-hidden>
              <Heart size={11} fill="currentColor" />
            </span>
            {badge}
          </span>
          <h2 id="testimonials-heading" className="cs-testimonials__title">
            {title}
          </h2>
          <p className="cs-testimonials__subtitle">{subtitle}</p>
        </LandingReveal>

        <LandingStagger className="cs-testimonials__grid" stagger={0.05}>
          {items.map((item) => (
            <LandingStaggerItem key={`${item.name}-${item.role}`}>
              <article className="cs-testimonial-card">
                <header className="cs-testimonial-card__header">
                  <span className="cs-testimonial-card__avatar" aria-hidden>
                    {getInitials(item.name)}
                  </span>
                  <div className="cs-testimonial-card__identity">
                    <h3 className="cs-testimonial-card__name">{item.name}</h3>
                    <p className="cs-testimonial-card__role">{item.role}</p>
                  </div>
                </header>

                <div className="cs-testimonial-card__stars" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className="cs-testimonial-card__star"
                      size={14}
                      fill="currentColor"
                      aria-hidden
                    />
                  ))}
                </div>

                <blockquote className="cs-testimonial-card__quote">
                  <p>&ldquo;{item.quote}&rdquo;</p>
                </blockquote>

                {item.rankTag ? (
                  <p className="cs-testimonial-card__rank">{item.rankTag}</p>
                ) : null}

                <a href={item.caseStudyHref || ctaHref} className="cs-testimonial-card__study">
                  Case Study
                </a>
              </article>
            </LandingStaggerItem>
          ))}
        </LandingStagger>

        <LandingReveal className="cs-testimonials__cta-wrap" delay={0.1}>
          <LandingButton href={ctaHref} className="cs-testimonials__cta">
            {ctaLabel}
          </LandingButton>
        </LandingReveal>
      </div>
    </section>
  );
}
