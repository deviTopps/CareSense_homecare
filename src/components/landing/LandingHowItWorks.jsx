import { HOW_IT_WORKS_CONTENT } from '../../data/landingContent';
import LandingSection from './LandingSection';

export default function LandingHowItWorks() {
  const { eyebrow, title, steps } = HOW_IT_WORKS_CONTENT;

  return (
    <LandingSection
      id="how-it-works"
      eyebrow={eyebrow}
      title={title}
      variant="muted"
      headerAlign="center"
      className="cs-how"
    >
      <div className="cs-how__grid">
        {steps.map((step, i) => (
          <article key={step.number} className="cs-how__step">
            <span className="cs-how__number">{step.number}</span>
            {i < steps.length - 1 && <span className="cs-how__connector" aria-hidden />}
            <h3 className="cs-how__step-title">{step.title}</h3>
            <p className="cs-how__step-body">{step.body}</p>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
