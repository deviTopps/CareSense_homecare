/**
 * Table title + optional status legend (hospital dashboard reference layout).
 */
export default function DataTableHeader({ title, legend = [], actions }) {
  return (
    <div className="hospital-table-header">
      <h3 className="hospital-table-header__title">{title}</h3>
      {legend.length > 0 ? (
        <ul className="hospital-table-legend" aria-label="Status legend">
          {legend.map((item) => (
            <li key={item.label} className="hospital-table-legend__item">
              <span
                className={`hospital-table-legend__dot hospital-table-legend__dot--${item.tone || 'neutral'}`}
                aria-hidden
              />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {actions ? <div className="hospital-table-header__actions">{actions}</div> : null}
    </div>
  );
}

export function HospitalStatus({ label, tone = 'neutral' }) {
  return (
    <span className={`hospital-status hospital-status--${tone}`}>
      <span className="hospital-status__dot" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
