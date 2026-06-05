import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from '../../icons/hugeicons-feather';
import { TESTIMONIALS_CONTENT } from '../../data/landingContent';
import LandingSection from './LandingSection';

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function LandingTestimonials() {
  const { eyebrow, title, items } = TESTIMONIALS_CONTENT;
  const [index, setIndex] = useState(0);

  const visible = [];
  for (let i = 0; i < 3; i += 1) {
    visible.push(items[(index + i) % items.length]);
  }

  const nav = (
    <div className="cs-testimonials__nav">
      <button
        type="button"
        className="cs-testimonials__arrow"
        onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
        aria-label="Previous testimonials"
      >
        <FiChevronLeft size={18} />
      </button>
      <button
        type="button"
        className="cs-testimonials__arrow"
        onClick={() => setIndex((i) => (i + 1) % items.length)}
        aria-label="Next testimonials"
      >
        <FiChevronRight size={18} />
      </button>
    </div>
  );

  return (
    <LandingSection
      id="testimonials"
      eyebrow={eyebrow}
      title={title}
      variant="muted"
      headerAlign="start"
      headerAside={nav}
    >
      <div
        className="cs-testimonials__grid"
        role="region"
        aria-label="Client testimonials"
        aria-live="polite"
      >
        {visible.map((t) => (
          <article key={`${t.name}-${t.role}`} className="cs-testimonial-card">
            <div className="cs-testimonial-card__stars" aria-label="5 out of 5 stars">
              ★★★★★
            </div>
            <blockquote className="cs-testimonial-card__quote">
              <p>&ldquo;{t.quote}&rdquo;</p>
            </blockquote>
            <footer className="cs-testimonial-card__author">
              <span className="cs-testimonial-card__avatar" aria-hidden>
                {getInitials(t.name)}
              </span>
              <div>
                <cite className="cs-testimonial-card__name">{t.name}</cite>
                <span className="cs-testimonial-card__role">{t.role}</span>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
