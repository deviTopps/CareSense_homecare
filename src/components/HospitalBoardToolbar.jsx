import { FiDownload, FiFilter, FiMoreHorizontal } from '../icons/hugeicons-feather';

/**
 * Top-right board actions (download, filter, overflow) — matches hospital dashboard reference.
 */
export default function HospitalBoardToolbar({
  onDownload,
  downloadLabel = 'Download report',
  onFilter,
  filterActive = false,
  filterLabel = 'Filter',
  onMore,
  moreLabel = 'More options',
  children,
}) {
  return (
    <div className="hospital-board-toolbar">
      {onDownload ? (
        <button type="button" className="hospital-board-toolbar__primary" onClick={onDownload}>
          <FiDownload size={15} aria-hidden />
          <span>{downloadLabel}</span>
        </button>
      ) : null}
      {onFilter ? (
        <button
          type="button"
          className={`hospital-board-toolbar__filter${filterActive ? ' is-active' : ''}`}
          onClick={onFilter}
        >
          <FiFilter size={15} aria-hidden />
          <span>{filterLabel}</span>
        </button>
      ) : null}
      {children}
      {onMore ? (
        <button
          type="button"
          className="hospital-board-toolbar__icon"
          aria-label={moreLabel}
          onClick={onMore}
        >
          <FiMoreHorizontal size={18} aria-hidden />
        </button>
      ) : (
        <button type="button" className="hospital-board-toolbar__icon" aria-label={moreLabel} disabled>
          <FiMoreHorizontal size={18} aria-hidden />
        </button>
      )}
    </div>
  );
}
