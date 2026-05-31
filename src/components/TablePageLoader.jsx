import { FiFileText } from '../icons/hugeicons-feather';

function LoaderPanel({
  progress = 0,
  title = 'Loading',
  subtitle = 'Please wait…',
  skeletonRows = 5,
  skeletonColumns = 7,
  icon: Icon = FiFileText,
  ariaLabel,
  showSkeleton = true,
}) {
  const pct = Math.round(Math.min(100, Math.max(0, progress)));
  const label = ariaLabel || `Loading ${title} ${pct} percent`;

  return (
    <div className="reports-table-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="reports-table-loader__panel">
        <div className="reports-table-loader__spinner" aria-hidden>
          <span className="reports-table-loader__spinner-ring" />
          <Icon size={22} className="reports-table-loader__icon" />
        </div>
        <p className="reports-table-loader__title">{title}</p>
        <p className="reports-table-loader__subtitle">{subtitle}</p>
        <div
          className="reports-table-loader__progress"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div className="reports-table-loader__progress-track">
            <div
              className="reports-table-loader__progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="reports-table-loader__progress-label">{pct}%</span>
        </div>
      </div>
      {showSkeleton && (
        <div className="reports-table-loader__skeleton" aria-hidden>
          {Array.from({ length: skeletonRows }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="reports-table-loader__skeleton-row"
              style={{ gridTemplateColumns: `repeat(${skeletonColumns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: skeletonColumns }, (_, colIndex) => (
                <span key={colIndex} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Full-width loader row for data tables (Reports, Patients, Workforce). */
export default function TablePageLoader({
  progress = 0,
  title = 'Loading',
  subtitle = 'Please wait…',
  colSpan = 7,
  skeletonRows = 5,
  skeletonColumns = 7,
  icon,
  ariaLabel,
  showSkeleton = true,
}) {
  return (
    <tr className="reports-table-loader-row">
      <td colSpan={colSpan}>
        <LoaderPanel
          progress={progress}
          title={title}
          subtitle={subtitle}
          skeletonRows={skeletonRows}
          skeletonColumns={skeletonColumns}
          icon={icon}
          ariaLabel={ariaLabel}
          showSkeleton={showSkeleton}
        />
      </td>
    </tr>
  );
}

/** Inline loader for modals and panels (e.g. nurse assignment picker). */
export function TablePageLoaderPanel(props) {
  return (
    <div className="reports-table-loader--panel">
      <LoaderPanel {...props} showSkeleton={props.showSkeleton ?? false} />
    </div>
  );
}
