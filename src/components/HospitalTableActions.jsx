import { FiEdit, FiTrash2 } from '../icons/hugeicons-feather';

/**
 * Row action cluster: edit, delete, and optional overflow menu (reference layout).
 */
export default function HospitalTableActions({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  children,
  className = '',
}) {
  return (
    <div className={`hospital-table-actions ${className}`.trim()} onClick={(e) => e.stopPropagation()}>
      {onEdit ? (
        <button
          type="button"
          className="hospital-table-actions__btn"
          onClick={onEdit}
          aria-label={editLabel}
          title={editLabel}
        >
          <FiEdit size={15} aria-hidden />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className="hospital-table-actions__btn hospital-table-actions__btn--danger"
          onClick={onDelete}
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          <FiTrash2 size={15} aria-hidden />
        </button>
      ) : null}
      {children}
    </div>
  );
}
