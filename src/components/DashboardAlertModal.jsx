import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiX,
  FiUser,
  FiActivity,
  FiCheckCircle,
  FiSend,
  FiArrowRight,
  FiClipboard,
  FiGlobe,
  FiBell,
  FiMoreHorizontal,
  FiList,
  FiChevronRight,
  FiCalendar,
  FiGrid,
  FiAlertCircle,
} from '../icons/hugeicons-feather';
import { resolveAlertViaApi } from '../utils/alerts';
import {
  formatCaseStatusLabel,
  formatSeverityLabel,
  isFallbackAlertId,
  patientInitials,
} from '../utils/alertMapping';
import CaseAttachedImageSection from './CaseAttachedImageSection';
import './DashboardAlertModal.css';

const RESOLUTION_SOLUTIONS = [
  'Patient vitals stabilized — monitoring continues',
  'Medication dosage adjusted',
  'Nurse reassigned to patient',
  'Emergency services contacted',
  'Family/caregiver notified',
  'Follow-up visit scheduled',
  'Wound treatment protocol updated',
  'Other (specify in notes)',
];

const SEVERITY_PILL = {
  critical: { bg: '#FCA5A5', color: '#7F1D1D' },
  high: { bg: '#FCA5A5', color: '#7F1D1D' },
  medium: { bg: '#FEF3C7', color: '#92400E' },
};

const STATUS_PILL = {
  open: { bg: '#FEF3C7', color: '#92400E', dot: '#EAB308' },
  'in-progress': { bg: '#FEF3C7', color: '#92400E', dot: '#EAB308' },
  resolved: { bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
};

export default function DashboardAlertModal({ alert, onClose, onResolved, onUnauthorized }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [solution, setSolution] = useState('');
  const [notes, setNotes] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setActiveTab('details');
    setSolution('');
    setNotes('');
    setResolveError('');
  }, [alert?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!alert) return null;

  const sev = SEVERITY_PILL[alert.severity] || SEVERITY_PILL.medium;
  const st = STATUS_PILL[alert.caseStatus] || STATUS_PILL.open;
  const vitalsEntries = Object.entries(alert.vitals || {}).filter(
    ([, v]) => v != null && String(v).trim() !== '' && String(v) !== '—',
  );
  const canResolve = !isFallbackAlertId(alert.id) && alert.caseStatus !== 'resolved';
  const patientProfileTo = alert.patientId
    ? `/patients/${encodeURIComponent(alert.patientId)}`
    : null;
  const checklistItems = [
    ...(alert.medications || []).map((m) => ({ id: `med-${m}`, label: m, done: false, kind: 'Medication' })),
    ...(alert.activities || []).map((a, i) => ({
      id: `act-${i}`,
      label: a.action || a.note || 'Activity',
      done: String(a.status || '').toLowerCase() === 'resolved' || String(a.status || '').toLowerCase() === 'done',
      kind: a.time || 'Activity',
    })),
  ];
  const doneCount = checklistItems.filter((item) => item.done).length;
  const progressPct = checklistItems.length
    ? Math.round((doneCount / checklistItems.length) * 100)
    : 0;

  const handleResolve = async () => {
    setResolveError('');
    if (!solution.trim()) {
      setResolveError('Select a solution before resolving.');
      setActiveTab('resolve');
      return;
    }
    const resolution = notes.trim()
      ? `${solution.trim()} — ${notes.trim()}`
      : solution.trim();
    setResolving(true);
    try {
      await resolveAlertViaApi(
        alert.id,
        { solution: solution.trim(), notes: notes.trim(), resolution },
        onUnauthorized,
      );
      onResolved?.();
      onClose();
    } catch (e) {
      setResolveError(e.message || 'Could not resolve alert.');
      setActiveTab('resolve');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="kh-modal-overlay db2-alert-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="db2-alert-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="db2-alert-modal-title"
      >
        <div className="db2-alert-modal__main">
          <div className="db2-alert-modal__topbar">
            <p className="db2-alert-modal__crumb">
              Watchlist <span aria-hidden>/</span> Alert detail
            </p>
            <div className="db2-alert-modal__topbar-actions">
              <span className={`db2-alert-modal__live${alert.caseStatus === 'resolved' ? ' is-off' : ''}`}>
                <span className="db2-alert-modal__live-toggle" aria-hidden />
                {alert.caseStatus === 'resolved' ? 'Resolved' : 'Active'}
              </span>
              {patientProfileTo ? (
                <Link
                  to={patientProfileTo}
                  className="db2-alert-modal__icon-btn"
                  onClick={onClose}
                  aria-label="Open patient profile"
                  title="Open patient profile"
                >
                  <FiGlobe size={18} />
                </Link>
              ) : null}
              <button
                type="button"
                className="db2-alert-modal__icon-btn"
                onClick={onClose}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <h2 id="db2-alert-modal-title" className="db2-alert-modal__title">
            {alert.type || 'Clinical alert'}
            {alert.patient ? `: ${alert.patient}` : ''}
          </h2>

          <div className="db2-alert-modal__tabs" role="tablist" aria-label="Alert sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'details'}
              className={`db2-alert-modal__tab${activeTab === 'details' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Description
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resolve'}
              className={`db2-alert-modal__tab${activeTab === 'resolve' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('resolve')}
              disabled={!canResolve && alert.caseStatus !== 'resolved'}
            >
              {alert.caseStatus === 'resolved' ? 'Resolution' : 'Resolve'}
            </button>
          </div>

          <div className="db2-alert-modal__scroll">
            {activeTab === 'details' ? (
              <>
                <section className="db2-alert-modal__desc-box">
                  <p className="db2-alert-modal__desc-text">
                    {alert.reason || 'No description provided for this alert.'}
                  </p>
                  {alert.diagnosis?.trim() ? (
                    <p className="db2-alert-modal__desc-extra">
                      <strong>Diagnosis:</strong> {alert.diagnosis}
                    </p>
                  ) : null}
                  <div className="db2-alert-modal__desc-toolbar">
                    <div className="db2-alert-modal__desc-tools">
                      <FiClipboard size={16} aria-hidden />
                      <FiActivity size={16} aria-hidden />
                      <FiBell size={16} aria-hidden />
                    </div>
                    <span>Alert details</span>
                  </div>
                </section>

                <CaseAttachedImageSection attachment={alert.attachedImage} />

                {vitalsEntries.length > 0 ? (
                  <section className="db2-alert-modal__vitals-grid">
                    {vitalsEntries.map(([k, v]) => (
                      <div key={k} className="db2-alert-modal__vital-card">
                        <span>{k}</span>
                        <strong>{v}</strong>
                      </div>
                    ))}
                  </section>
                ) : null}

                <section className="db2-alert-modal__checklist">
                  <div className="db2-alert-modal__checklist-head">
                    <span className="db2-alert-modal__section-label">Follow-ups</span>
                    <span
                      className="db2-alert-modal__progress"
                      aria-label={`${progressPct}% complete`}
                    >
                      <span style={{ width: `${progressPct}%` }} />
                    </span>
                  </div>

                  {checklistItems.length > 0 ? (
                    <ul className="db2-alert-modal__check-list">
                      {checklistItems.map((item) => (
                        <li
                          key={item.id}
                          className={`db2-alert-modal__check-item${item.done ? ' is-done' : ''}`}
                        >
                          <span className="db2-alert-modal__check-box" aria-hidden>
                            {item.done ? <FiCheckCircle size={16} /> : null}
                          </span>
                          <div className="db2-alert-modal__check-copy">
                            <span className="db2-alert-modal__check-kind">{item.kind}</span>
                            <p>{item.label}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="db2-alert-modal__empty-check">
                      No medications or activity entries attached yet.
                    </p>
                  )}
                </section>
              </>
            ) : (
              <section className="db2-alert-modal__resolve-panel">
                {canResolve ? (
                  <>
                    <label className="db2-alert-modal__field">
                      <span className="db2-alert-modal__section-label">Solution</span>
                      <select value={solution} onChange={(e) => setSolution(e.target.value)}>
                        <option value="">Select a solution</option>
                        {RESOLUTION_SOLUTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="db2-alert-modal__field">
                      <span className="db2-alert-modal__section-label">Notes</span>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        placeholder="Enter resolution notes"
                      />
                    </label>
                    {resolveError ? <p className="db2-alert-modal__error">{resolveError}</p> : null}
                    <div className="db2-alert-modal__resolve-links">
                      <button
                        type="button"
                        className="db2-alert-modal__text-btn"
                        onClick={() => {
                          setSolution('');
                          setNotes('');
                          setResolveError('');
                          setActiveTab('details');
                        }}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className="db2-alert-modal__text-btn db2-alert-modal__text-btn--accent"
                        onClick={handleResolve}
                        disabled={resolving || !solution.trim()}
                      >
                        {resolving ? 'Saving…' : 'Save resolution'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="db2-alert-modal__empty-check">
                    {isFallbackAlertId(alert.id)
                      ? 'This alert has no server ID — resolving is unavailable until the API returns a valid id.'
                      : 'This alert is already resolved.'}
                  </p>
                )}
              </section>
            )}
          </div>

          <div className="db2-alert-modal__left-actions">
            {patientProfileTo ? (
              <Link to={patientProfileTo} className="db2-alert-modal__pill-btn" onClick={onClose}>
                <FiUser size={16} aria-hidden />
                Patient
              </Link>
            ) : null}
            <button
              type="button"
              className="db2-alert-modal__pill-btn"
              onClick={() => { onClose(); navigate('/clinical'); }}
            >
              <FiList size={16} aria-hidden />
              Cases
            </button>
            <button
              type="button"
              className="db2-alert-modal__pill-btn"
              onClick={() => setActiveTab('resolve')}
              disabled={!canResolve}
            >
              <FiBell size={16} aria-hidden />
              Alert
            </button>
            <button type="button" className="db2-alert-modal__pill-btn" onClick={onClose}>
              <FiMoreHorizontal size={16} aria-hidden />
              More
            </button>
          </div>
        </div>

        <aside className="db2-alert-modal__side">
          {patientProfileTo ? (
            <Link to={patientProfileTo} className="db2-alert-modal__project" onClick={onClose}>
              <span className="db2-alert-modal__project-icon" aria-hidden>
                <FiGrid size={18} />
              </span>
              <span className="db2-alert-modal__project-label">
                {alert.patient || 'Open patient'}
              </span>
              <FiChevronRight size={18} aria-hidden />
            </Link>
          ) : (
            <div className="db2-alert-modal__project is-static">
              <span className="db2-alert-modal__project-icon" aria-hidden>
                <FiGrid size={18} />
              </span>
              <span className="db2-alert-modal__project-label">
                {alert.patient || 'Unknown patient'}
              </span>
            </div>
          )}

          <div className="db2-alert-modal__attrs-head">
            <span className="db2-alert-modal__section-label">Attributes</span>
            <FiList size={16} aria-hidden />
          </div>

          <div className="db2-alert-modal__attrs">
            <div className="db2-alert-modal__attr">
              <span className="db2-alert-modal__attr-label">Status</span>
              <span
                className="db2-alert-modal__pill"
                style={{ background: st.bg, color: st.color }}
              >
                <span className="db2-alert-modal__pill-dot" style={{ background: st.dot }} />
                {formatCaseStatusLabel(alert.caseStatus)}
              </span>
            </div>

            <div className="db2-alert-modal__attr">
              <span className="db2-alert-modal__attr-label">Priority</span>
              <span
                className="db2-alert-modal__pill db2-alert-modal__pill--priority"
                style={{ background: sev.bg, color: sev.color }}
              >
                <FiAlertCircle size={14} aria-hidden />
                {formatSeverityLabel(alert.severity)}
              </span>
            </div>

            <div className="db2-alert-modal__attr">
              <span className="db2-alert-modal__attr-label">Assignee</span>
              <span className="db2-alert-modal__chip" title={alert.nurse || 'Unassigned'}>
                <span className="db2-alert-modal__chip-avatar" aria-hidden>
                  {patientInitials(alert.nurse || 'N')}
                </span>
                {alert.nurse || 'Unassigned'}
              </span>
            </div>

            <div className="db2-alert-modal__attr is-highlight">
              <span className="db2-alert-modal__attr-label">Flagged</span>
              <span className="db2-alert-modal__chip">
                <FiCalendar size={15} className="db2-alert-modal__chip-cal" aria-hidden />
                {alert.flaggedDate || '—'}
              </span>
            </div>

            {alert.code ? (
              <div className="db2-alert-modal__attr">
                <span className="db2-alert-modal__attr-label">Code</span>
                <span className="db2-alert-modal__chip">{alert.code}</span>
              </div>
            ) : null}
          </div>

          <div className="db2-alert-modal__side-foot">
            <button type="button" className="db2-alert-modal__btn db2-alert-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            {canResolve ? (
              <button
                type="button"
                className="db2-alert-modal__btn db2-alert-modal__btn--primary"
                onClick={() => {
                  if (activeTab !== 'resolve') {
                    setActiveTab('resolve');
                    return;
                  }
                  handleResolve();
                }}
                disabled={resolving}
              >
                {activeTab === 'resolve' ? (
                  <>
                    <FiSend size={16} aria-hidden />
                    {resolving ? 'Saving…' : 'Resolve'}
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={16} aria-hidden />
                    Resolve
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="db2-alert-modal__btn db2-alert-modal__btn--primary"
                onClick={() => { onClose(); navigate('/clinical'); }}
              >
                <FiArrowRight size={16} aria-hidden />
                Open cases
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
