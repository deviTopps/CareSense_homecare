import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiChevronDown, FiSearch } from '../icons/hugeicons-feather';

function buildAssignedLookup(assignedNurseRecords = []) {
  return new Set(assignedNurseRecords.flatMap((entry) => [
    String(entry.id || '').trim().toLowerCase(),
    String(entry.name || '').trim().toLowerCase(),
  ].filter(Boolean)));
}

function findAssignedRecord(assignedNurseRecords, nurse) {
  const nurseId = String(nurse?.id || '').trim().toLowerCase();
  const nurseName = String(nurse?.name || '').trim().toLowerCase();
  return (assignedNurseRecords || []).find((entry) => {
    const entryId = String(entry?.id || '').trim().toLowerCase();
    const entryName = String(entry?.name || '').trim().toLowerCase();
    return (nurseId && entryId === nurseId) || (nurseName && entryName === nurseName);
  }) || null;
}

function triggerLabel(patient) {
  const assigned = Array.isArray(patient?.assignedNurseRecords) ? patient.assignedNurseRecords : [];
  if (assigned.length === 0) return 'Select nurses';
  if (assigned.length === 1) return assigned[0].name;
  return `${assigned.length} nurses`;
}

export default function PatientNurseAssignDropdown({
  patient,
  assignableNurses = [],
  nursesLoading = false,
  nursesError = '',
  assigningNurseId = '',
  unassigningAssignmentId = '',
  assignmentError = '',
  assignmentSuccess = '',
  isOpen = false,
  onOpenChange,
  onAssign,
  onUnassign,
  onClearMessages,
}) {
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState(null);
  const wrapRef = useRef(null);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  const assignedNurseRecords = Array.isArray(patient?.assignedNurseRecords) ? patient.assignedNurseRecords : [];
  const assignedLookup = buildAssignedLookup(assignedNurseRecords);

  const filteredNurses = assignableNurses.filter((nr) => (
    !search
    || nr.name.toLowerCase().includes(search.toLowerCase())
    || nr.specialisation.toLowerCase().includes(search.toLowerCase())
    || nr.region.toLowerCase().includes(search.toLowerCase())
  ));

  const updateMenuPosition = useCallback(() => {
    const btn = toggleRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 300;
    const menuHeight = menuRef.current?.offsetHeight || 320;
    const gap = 6;
    const padding = 8;

    let top = rect.bottom + gap;
    let left = rect.left;

    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding));

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 1075,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return undefined;
    }
    updateMenuPosition();
    const raf = requestAnimationFrame(() => updateMenuPosition());
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [isOpen, updateMenuPosition, filteredNurses.length, nursesLoading, assignmentError, assignmentSuccess]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDocClick = (e) => {
      const target = e.target;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const handleToggleOpen = (e) => {
    e.stopPropagation();
    const next = !isOpen;
    if (next) {
      setSearch('');
      onClearMessages?.();
    }
    onOpenChange(next);
  };

  const handleNurseToggle = (e, nurse) => {
    e.stopPropagation();
    const isAssigned = assignedLookup.has(String(nurse.id || '').trim().toLowerCase())
      || assignedLookup.has(nurse.name.toLowerCase());
    if (isAssigned) {
      const assigned = findAssignedRecord(assignedNurseRecords, nurse);
      if (assigned) onUnassign(patient, assigned);
      return;
    }
    onAssign(patient, nurse);
  };

  const menuPortal = isOpen && menuStyle
    ? createPortal(
        <div
          ref={menuRef}
          className="patient-nurse-dropdown__menu patient-nurse-dropdown__menu--portal"
          role="listbox"
          aria-label={`Assigned nurses for ${patient.name}`}
          style={menuStyle}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="patient-nurse-dropdown__search">
            <FiSearch size={14} aria-hidden />
            <input
              type="search"
              className="patient-nurse-dropdown__search-input"
              placeholder="Search nurses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {assignmentError ? (
            <div className="patient-nurse-dropdown__feedback patient-nurse-dropdown__feedback--error">{assignmentError}</div>
          ) : null}
          {assignmentSuccess ? (
            <div className="patient-nurse-dropdown__feedback patient-nurse-dropdown__feedback--success">{assignmentSuccess}</div>
          ) : null}

          <div className="patient-nurse-dropdown__list">
            {nursesLoading && (
              <div className="patient-nurse-dropdown__empty">Loading nurses…</div>
            )}
            {!nursesLoading && nursesError && (
              <div className="patient-nurse-dropdown__empty patient-nurse-dropdown__empty--error">{nursesError}</div>
            )}
            {!nursesLoading && !nursesError && filteredNurses.length === 0 && (
              <div className="patient-nurse-dropdown__empty">No nurses found.</div>
            )}
            {!nursesLoading && !nursesError && filteredNurses.map((nurse) => {
              const isAssigned = assignedLookup.has(String(nurse.id || '').trim().toLowerCase())
                || assignedLookup.has(nurse.name.toLowerCase());
              const assignedRecord = isAssigned ? findAssignedRecord(assignedNurseRecords, nurse) : null;
              const assignmentId = String(assignedRecord?.assignmentId || '').trim();
              const isSubmittingAssign = assigningNurseId === String(nurse.id || '');
              const isSubmittingUnassign = assignmentId && unassigningAssignmentId === assignmentId;
              const isBusy = isSubmittingAssign || isSubmittingUnassign;
              const cannotUnassign = isAssigned && !assignmentId;

              return (
                <button
                  key={nurse.id || nurse.name}
                  type="button"
                  role="option"
                  aria-selected={isAssigned}
                  className={`patient-nurse-dropdown__option${isAssigned ? ' is-assigned' : ''}${isBusy ? ' is-busy' : ''}`}
                  disabled={isBusy || cannotUnassign}
                  title={cannotUnassign ? 'Assignment ID missing — refresh the list to remove' : undefined}
                  onClick={(e) => handleNurseToggle(e, nurse)}
                >
                  <span className={`patient-nurse-dropdown__check${isAssigned ? ' is-checked' : ''}`} aria-hidden>
                    {isAssigned ? <FiCheck size={12} /> : null}
                  </span>
                  <span className="patient-nurse-dropdown__option-body">
                    <span className="patient-nurse-dropdown__option-name">{nurse.name}</span>
                    <span className="patient-nurse-dropdown__option-meta">{nurse.specialisation}</span>
                  </span>
                  <span className="patient-nurse-dropdown__option-state">
                    {isBusy ? 'Saving…' : isAssigned ? 'Assigned' : 'Add'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )
    : null;

  const hasAssignment = assignedNurseRecords.length > 0;

  return (
    <div className="patient-nurse-dropdown" ref={wrapRef}>
      <button
        ref={toggleRef}
        type="button"
        className={`patient-nurse-dropdown__trigger${isOpen ? ' is-open' : ''}${hasAssignment ? ' has-value' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Assigned nurses for ${patient.name}`}
        onClick={handleToggleOpen}
      >
        <span className="patient-nurse-dropdown__trigger-label">{triggerLabel(patient)}</span>
        <FiChevronDown size={14} className="patient-nurse-dropdown__chevron" aria-hidden />
      </button>
      {menuPortal}
    </div>
  );
}
