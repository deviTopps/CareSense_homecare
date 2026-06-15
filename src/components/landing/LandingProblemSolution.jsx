import { FiArrowRight } from '../../icons/hugeicons-feather';
import { PO_IMAGE_SRC } from '../../constants/brandAssets';
import { PROBLEM_SOLUTION_CONTENT } from '../../data/landingContent';
import LandingSection from './LandingSection';

const PO_IMAGE_CACHE_VERSION = '10';

function ProblemSolutionRow({ label, body, cta, image, imagePosition, forcePoImage = false }) {
  const isLeft = imagePosition === 'left';
  const src = forcePoImage ? PO_IMAGE_SRC : image.src;
  const imgSrc = `${src}?v=${PO_IMAGE_CACHE_VERSION}`;

  return (
    <article
      className={`cs-problem-solution__row cs-problem-solution__row--image-${imagePosition}`}
    >
      <div
        className={`cs-problem-solution__visual${isLeft ? ' cs-problem-solution__visual--float-left' : ' cs-problem-solution__visual--float-right'}${forcePoImage ? ' cs-problem-solution__visual--full' : ''}`}
      >
        <img
          src={imgSrc}
          alt={image.alt}
          className={`cs-problem-solution__img${forcePoImage ? ' cs-problem-solution__img--full' : image.variant === 'photo' ? ' cs-problem-solution__img--photo' : ''}`}
          loading="lazy"
          width={560}
          height={420}
          decoding="async"
        />
      </div>
      <div className="cs-problem-solution__copy">
        <p className="cs-problem-solution__label">{label}</p>
        <p className="cs-problem-solution__body">{body}</p>
        {cta ? (
          <a href={cta.href} className="cs-btn cs-btn--primary cs-problem-solution__cta">
            {cta.label}
            <FiArrowRight size={16} strokeWidth={2} aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function LandingProblemSolution() {
  const { eyebrow, title, lead, problem, solution } = PROBLEM_SOLUTION_CONTENT;

  return (
    <LandingSection
      id="problem-solution"
      eyebrow={eyebrow}
      title={title}
      variant="default"
      headerAlign="center"
      className="cs-problem-solution"
    >
      {lead && <p className="cs-section-lead">{lead}</p>}
      <div className="cs-problem-solution__stack">
        <ProblemSolutionRow
          label={problem.label}
          body={problem.body}
          cta={problem.cta}
          image={problem.image}
          imagePosition="left"
          forcePoImage
        />
        <ProblemSolutionRow
          label={solution.label}
          body={solution.body}
          cta={solution.cta}
          image={solution.image}
          imagePosition="right"
        />
      </div>
    </LandingSection>
  );
}
