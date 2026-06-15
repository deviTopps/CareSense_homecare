import { FiX, FiCheck } from '../../icons/hugeicons-feather';
import { COMPARISON_CONTENT } from '../../data/landingContent';
import LandingSection from './LandingSection';

export default function LandingComparison() {
  const { eyebrow, title, columns, rows } = COMPARISON_CONTENT;

  return (
    <LandingSection
      id="comparison"
      eyebrow={eyebrow}
      title={title}
      variant="default"
      headerAlign="center"
      className="cs-comparison"
    >
      <div className="cs-comparison__table-wrap">
        <table className="cs-comparison__table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="cs-comparison__th">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="cs-comparison__row">
                <td className="cs-comparison__feature">{row.feature}</td>
                <td className="cs-comparison__old">
                  <span className="cs-comparison__icon cs-comparison__icon--old" aria-hidden>
                    <FiX size={14} strokeWidth={2.5} />
                  </span>
                  {row.oldWay}
                </td>
                <td className="cs-comparison__new">
                  <span className="cs-comparison__icon cs-comparison__icon--new" aria-hidden>
                    <FiCheck size={14} strokeWidth={2.5} />
                  </span>
                  {row.newWay}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LandingSection>
  );
}
