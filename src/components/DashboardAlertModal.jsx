import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiX,
  FiMapPin,
  FiPhone,
  FiUser,
  FiClock,
  FiActivity,
  FiShield,
  FiCheckCircle,
  FiSend,
  FiArrowRight,
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

const SEVERITY_STYLE = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
};

const STATUS_STYLE = {
  open: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'in-progress': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  resolved: { bg: '#f0f7fe', color: '#1565a0', border: '#bae0fd' },
};

function MetaChip({ icon, children }) {
  const text = String(children ?? '').trim();
  if (!text || text === '—') return null;
  return (
    <span className="db2-alert-modal__chip">
      {icon}
      <span title={text}>{text}</span>
    </span>
  );
}

function DetailCell({ label, value }) {
  const v = String(value ?? '').trim();
  if (!v || v === '—') return null;
  return (
    <div className="db2-alert-modal__cell">
      <span className="db2-alert-modal__cell-label">{label}</span>
      <span className="db2-alert-modal__cell-value" title={v}>{v}</span>
    </div>
  );
}

export default function DashboardAlertModal({ alert, onClose, onResolved, onUnauthorized }) {
  const navigate = useNavigate();
  const [showResolve, setShowResolve] = useState(false);
  const [solution, setSolution] = useState('');
  const [notes, setNotes] = useState('');
  const [resolveError, setResolveError] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setShowResolve(false);
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

  const sev = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.medium;
  const st = STATUS_STYLE[alert.caseStatus] || STATUS_STYLE.open;
  const vitalsEntries = Object.entries(alert.vitals || {}).filter(
    ([, v]) => v != null && String(v).trim() !== '' && String(v) !== '—',
  );
  const canResolve = !isFallbackAlertId(alert.id) && alert.caseStatus !== 'resolved';
  const patientProfileTo = alert.patientId
    ? `/patients/${encodeURIComponent(alert.patientId)}`
    : null;

  const handleResolve = async () => {
    setResolveError('');
    if (!solution.trim()) {
      setResolveError('Select a solution before resolving.');
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
        <header className="db2-alert-modal__head">
          <div className="db2-alert-modal__head-top">
            <div className="db2-alert-modal__patient">
              <div className="db2-alert-modal__avatar" aria-hidden>
                {patientInitials(alert.patient)}
              </div>
              <div className="db2-alert-modal__patient-text">
                <p className="db2-alert-modal__type">{alert.type}</p>
                <h2 id="db2-alert-modal-title" className="db2-alert-modal__title" title={alert.patient}>
                  {alert.patient}
                </h2>
                {(alert.age != null || alert.gender) && (
                  <p className="db2-alert-modal__sub">
                    {[alert.age != null ? `${alert.age} yrs` : null, alert.gender || null].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <button type="button" className="db2-alert-modal__close" onClick={onClose} aria-label="Close">
              <FiX size={18} />
            </button>
          </div>
          <div className="db2-alert-modal__badges">
            <span className="db2-alert-modal__badge" style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}>
              {formatSeverityLabel(alert.severity)}
            </span>
            <span className="db2-alert-modal__badge" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
              {formatCaseStatusLabel(alert.caseStatus)}
            </span>
            {alert.code && <span className="db2-alert-modal__badge db2-alert-modal__badge--muted">{alert.code}</span>}
          </div>
        </header>

        <div className="db2-alert-modal__scroll">
          <section className="db2-alert-modal__reason">
            <span className="db2-alert-modal__label">What happened</span>
            <p>{alert.reason}</p>
          </section>

          <div className="db2-alert-modal__chips">
            <MetaChip icon={<FiMapPin size={12} aria-hidden />}>{alert.region}</MetaChip>
            <MetaChip icon={<FiUser size={12} aria-hidden />}>{alert.nurse}</MetaChip>
            <MetaChip icon={<FiPhone size={12} aria-hidden />}>{alert.phone}</MetaChip>
            <MetaChip icon={<FiClock size={12} aria-hidden />}>{alert.flaggedDate}</MetaChip>
          </div>

          <div className="db2-alert-modal__grid">
            <DetailCell label="Flagged by" value={alert.flaggedBy} />
            <DetailCell label="Assigned nurse" value={alert.nurse} />
          </div>

          {alert.diagnosis?.trim() && (
            <section className="db2-alert-modal__section">
              <h3 className="db2-alert-modal__section-title">Diagnosis</h3>
              <p>{alert.diagnosis}</p>
            </section>
          )}

          <CaseAttachedImageSection attachment={alert.attachedImage} />

          {vitalsEntries.length > 0 && (
            <section className="db2-alert-modal__section">
              <h3 className="db2-alert-modal__section-title">
                <FiActivity size={13} aria-hidden />
                Vitals
              </h3>
              <div className="db2-alert-modal__vitals">
                {vitalsEntries.map(([k, v]) => (
                  <div key={k} className="db2-alert-modal__vital">
                    <span className="db2-alert-modal__vital-label">{k}</span>
                    <span className="db2-alert-modal__vital-value">{v}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {alert.medications?.length > 0 && (
            <section className="db2-alert-modal__section">
              <h3 className="db2-alert-modal__section-title">
                <FiShield size={13} aria-hidden />
                Medications
              </h3>
              <ul className="db2-alert-modal__list">
                {alert.medications.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </section>
          )}

          {alert.activities?.length > 0 && (
            <section className="db2-alert-modal__section">
              <h3 className="db2-alert-modal__section-title">
                <FiClock size={13} aria-hidden />
                Activity
              </h3>
              <ul className="db2-alert-modal__timeline">
                {alert.activities.map((a, i) => (
                  <li key={`${a.action}-${i}`} data-status={a.status}>
                    <div className="db2-alert-modal__timeline-meta">
                      {a.time && <span>{a.time}</span>}
                      <strong>{a.action}</strong>
                      {a.note && <p className="db2-alert-modal__timeline-note">{a.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showResolve && canResolve && (
            <section className="db2-alert-modal__resolve">
              <span className="db2-alert-modal__label">Resolve alert</span>
              <label className="db2-alert-modal__field">
                <span className="db2-alert-modal__label">Solution</span>
                <select value={solution} onChange={(e) => setSolution(e.target.value)}>
                  <option value="">Select a solution</option>
                  {RESOLUTION_SOLUTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="db2-alert-modal__field">
                <span className="db2-alert-modal__label">Notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional context…"
                />
              </label>
              {resolveError && <p className="db2-alert-modal__error">{resolveError}</p>}
            </section>
          )}

          {isFallbackAlertId(alert.id) && (
            <p className="db2-alert-modal__warn">
              This alert has no server ID — resolving is unavailable until the API returns a valid id.
            </p>
          )}
        </div>

        <footer className="db2-alert-modal__foot">
          <div className="db2-alert-modal__foot-nav">
            {patientProfileTo && (
              <Link to={patientProfileTo} className="db2-alert-modal__nav-btn" onClick={onClose}>
                <FiUser size={14} aria-hidden />
                Patient
              </Link>
            )}
            <button
              type="button"
              className="db2-alert-modal__nav-btn"
              onClick={() => { onClose(); navigate('/clinical'); }}
            >
              <FiArrowRight size={14} aria-hidden />
              Emergency cases
            </button>
          </div>
          <div className="db2-alert-modal__foot-actions">
            <button type="button" className="db2-btn db2-btn--outline" onClick={onClose}>
              Close
            </button>
            {canResolve && !showResolve && (
              <button
                type="button"
                className="db2-btn db2-btn--primary"
                onClick={() => { setResolveError(''); setShowResolve(true); }}
              >
                <FiCheckCircle size={14} aria-hidden />
                Resolve
              </button>
            )}
            {canResolve && showResolve && (
              <>
                <button
                  type="button"
                  className="db2-btn db2-btn--outline"
                  onClick={() => {
                    setShowResolve(false);
                    setSolution('');
                    setNotes('');
                    setResolveError('');
                  }}
                  disabled={resolving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="db2-btn db2-btn--primary"
                  onClick={handleResolve}
                  disabled={resolving || !solution.trim()}
                >
                  <FiSend size={14} aria-hidden />
                  {resolving ? 'Saving…' : 'Confirm'}
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
