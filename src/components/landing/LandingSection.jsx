/**
 * Reusable landing section shell — consistent spacing, headings, and a11y.
 */
export default function LandingSection({
  id,
  titleId,
  eyebrow,
  title,
  children,
  variant = 'default',
  containerClassName = '',
  className = '',
  headerAlign = 'center',
  headerAside = null,
}) {
  const headingId = titleId || (id ? `${id}-heading` : undefined);

  return (
    <section
      id={id}
      className={`cs-section cs-section--${variant} ${className}`.trim()}
      aria-labelledby={title ? headingId : undefined}
    >
      <div className={`cs-container ${containerClassName}`.trim()}>
        {(eyebrow || title || headerAside) && (
          <header
            className={`cs-section__header cs-section__header--${headerAlign}${headerAside ? ' cs-section__header--split' : ''}`}
          >
            <div className="cs-section__header-copy">
              {eyebrow && <p className="cs-section__eyebrow">{eyebrow}</p>}
              {title && (
                <h2 id={headingId} className="cs-section__title">
                  {title}
                </h2>
              )}
            </div>
            {headerAside}
          </header>
        )}
        <div className="cs-section__body">{children}</div>
      </div>
    </section>
  );
}
