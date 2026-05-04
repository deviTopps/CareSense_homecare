import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import {
  FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiClock, FiX, FiSearch,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiUser, FiMapPin, FiPhone, FiActivity, FiFileText, FiSend, FiShield, FiRefreshCw,
} from '../icons/hugeicons-feather';

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function formatAlertDate(v) {
  if (v == null || v === '') return '';
  try {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch { /* ignore */ }
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function patientDisplayName(a) {
  const p = a.patient;
  if (p && typeof p === 'object') {
    const fn = pickFirst(p, ['firstName', 'first_name', 'givenName']);
    const ln = pickFirst(p, ['lastName', 'last_name', 'familyName']);
    const combined = [fn, ln].filter(Boolean).join(' ').trim();
    if (combined) return combined;
    const n = pickFirst(p, ['fullName', 'full_name', 'name', 'patientName']);
    if (n) return String(n);
  }
  const n = pickFirst(a, ['patientName', 'patient_name', 'name', 'patientFullName']);
  return n != null ? String(n) : 'Unknown patient';
}

function patientIdFrom(a) {
  const p = a.patient;
  if (p && typeof p === 'object') {
    const id = pickFirst(p, ['patientId', 'patient_id', 'id', '_id', 'registrationNumber']);
    if (id != null) return String(id);
  }
  const id = pickFirst(a, ['patientId', 'patient_id']);
  return id != null ? String(id) : '';
}

function normalizeSeverity(raw) {
  const v = String(raw ?? '').toLowerCase().trim();
  if (['critical', 'high', 'medium', 'low'].includes(v)) {
    return v === 'low' ? 'medium' : v;
  }
  if (v === 'severe' || v === 'urgent') return 'critical';
  if (v === 'warn' || v === 'warning') return 'high';
  return 'medium';
}

function normalizeCaseStatus(raw) {
  let v = String(raw ?? 'open').toLowerCase().trim().replace(/_/g, '-');
  if (v === 'inprogress' || v === 'in progress') v = 'in-progress';
  if (v === 'pending' || v === 'active') v = 'open';
  if (['open', 'in-progress', 'resolved'].includes(v)) return v;
  return 'open';
}

function extractAlertsArray(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  const d = json.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    if (Array.isArray(d.alerts)) return d.alerts;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.results)) return d.results;
  }
  if (Array.isArray(json.alerts)) return json.alerts;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.results)) return json.results;
  return [];
}

function mapAlertToCase(raw, index) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const idRaw = pickFirst(a, ['id', '_id', 'alertId', 'alert_id']);
  const id = idRaw != null ? String(idRaw) : `AL-${index + 1}`;
  const patient = patientDisplayName(a);
  const patientId = patientIdFrom(a);
  const type = String(pickFirst(a, ['type', 'alertType', 'alert_type', 'category', 'title']) || 'Alert');
  const reason = String(pickFirst(a, ['reason', 'message', 'description', 'details', 'note', 'body']) || '—');
  const severity = normalizeSeverity(pickFirst(a, ['severity', 'priority', 'level']));
  const caseStatus = normalizeCaseStatus(pickFirst(a, ['caseStatus', 'case_status', 'status', 'state']));
  const flaggedBy = String(pickFirst(a, ['flaggedBy', 'flagged_by', 'createdBy', 'created_by', 'reportedBy', 'source']) || '—');
  const flaggedDate = formatAlertDate(pickFirst(a, ['flaggedDate', 'flagged_date', 'createdAt', 'created_at', 'updatedAt', 'updated_at']));
  const nurse = String(pickFirst(a, ['nurse', 'nurseName', 'nurse_name', 'assignedNurse', 'assigned_to']) || flaggedBy);
  const region = String(pickFirst(a, ['region', 'location', 'area']) || '');
  const phone = String(pickFirst(a, ['phone', 'phoneNumber', 'phone_number', 'contact']) || '');
  const diagnosis = String(pickFirst(a, ['diagnosis']) || '');
  const ageRaw = pickFirst(a, ['age']);
  const ageNum = ageRaw != null && ageRaw !== '' ? Number(ageRaw) : NaN;
  const gender = String(pickFirst(a, ['gender']) || '');
  const vitals = pickFirst(a, ['vitals']);
  const medications = pickFirst(a, ['medications']);
  const activities = pickFirst(a, ['activities', 'timeline', 'history']);
  const resNested = a.resolution && typeof a.resolution === 'object' ? a.resolution : null;

  let resolution;
  if (caseStatus === 'resolved') {
    resolution = {
      resolvedBy: String(
        pickFirst(a, ['resolvedBy', 'resolved_by'])
        || pickFirst(resNested || {}, ['resolvedBy', 'resolved_by'])
        || '',
      ),
      resolvedDate: formatAlertDate(
        pickFirst(a, ['resolvedDate', 'resolved_date', 'resolvedAt'])
        || pickFirst(resNested || {}, ['resolvedDate', 'resolved_date', 'resolvedAt']),
      ),
      action: String(
        pickFirst(a, ['resolution', 'resolutionNote'])
        || pickFirst(resNested || {}, ['action', 'notes', 'description'])
        || '',
      ),
    };
    if (!resolution.action && !resolution.resolvedBy && !resolution.resolvedDate) resolution = undefined;
  }

  return {
    id,
    patientId,
    patient,
    age: Number.isFinite(ageNum) ? ageNum : undefined,
    gender: gender || undefined,
    type,
    severity,
    reason,
    flaggedBy,
    flaggedDate: flaggedDate || '—',
    nurse,
    region,
    phone,
    diagnosis,
    caseStatus,
    activities: Array.isArray(activities)
      ? activities.map((act) => {
        const st = String(pickFirst(act, ['status']) || '').toLowerCase();
        const status = ['alert', 'done', 'pending'].includes(st) ? st : 'pending';
        return {
          time: String(pickFirst(act, ['time', 'at']) || '').slice(0, 8),
          action: String(pickFirst(act, ['action', 'title', 'label']) || '—'),
          note: String(pickFirst(act, ['note', 'message', 'description']) || ''),
          status,
        };
      })
      : [],
    vitals: vitals && typeof vitals === 'object' && !Array.isArray(vitals) ? vitals : {},
    medications: Array.isArray(medications)
      ? medications
        .map((m) => (typeof m === 'string' ? m : String(pickFirst(m, ['name', 'label', 'medication']) || '')))
        .filter(Boolean)
      : [],
    resolution,
  };
}

const TYPE_TABS = [
  { key: 'all', label: 'All Cases' },
  { key: 'Vitals Alert', label: 'Vitals Alert' },
  { key: 'Wound Infection', label: 'Wound' },
  { key: 'Blood Sugar', label: 'Blood Sugar' },
  { key: 'Fall Risk', label: 'Fall Risk' },
  { key: 'Missed Visit', label: 'Missed Visit' },
  { key: 'Medication Error', label: 'Medication' },
  { key: 'GPS Flag', label: 'GPS Flag' },
];

const STATUS_OPTIONS = ['All', 'Open', 'In-Progress', 'Resolved'];

const SOLUTIONS = [
  'Medication dosage adjusted',
  'Patient referred to specialist',
  'Nurse reassigned to patient',
  'Emergency services contacted',
  'Family/caregiver notified',
  'Follow-up visit scheduled',
  'Incident report filed & reviewed',
  'GPS flag dismissed — address verified',
  'Patient vitals stabilized — monitoring continues',
  'Wound treatment protocol updated',
  'Other (specify in notes)',
];

const severityStyle = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
};

const caseStatusStyle = {
  open: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: <FiAlertCircle size={12} /> },
  'in-progress': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: <FiRefreshCw size={12} /> },
  resolved: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', icon: <FiCheckCircle size={12} /> },
};

const activityStatusDot = {
  alert: { bg: '#dc2626' },
  done: { bg: '#45B6FE' },
  pending: { bg: '#d97706' },
};

export default function ClinicalDocs() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const loadPendingAlerts = useCallback(async () => {
    setAlertsError(null);
    setAlertsLoading(true);
    try {
      const response = await apiFetch('/alerts/pending?page=1&limit=100', { method: 'GET' }, () => navigate('/login', { replace: true }));
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = json.message || json.error || `Could not load alerts (${response.status})`;
        throw new Error(typeof msg === 'string' ? msg : 'Could not load alerts');
      }
      const rows = extractAlertsArray(json);
      const mapped = rows.map((row, i) => mapAlertToCase(row, i));
      setCases(mapped);
      setSelected((prev) => {
        if (!prev) return null;
        return mapped.find((c) => c.id === prev.id) || null;
      });
    } catch (e) {
      setCases([]);
      setSelected(null);
      setAlertsError(e.message || 'Failed to load pending alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPendingAlerts();
  }, [loadPendingAlerts]);

  /* Resolution form state */
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  /* Filtered cases */
  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'All') {
        const want = statusFilter.toLowerCase().replace(/\s+/g, '-');
        if (c.caseStatus !== want) return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          c.patient.toLowerCase().includes(q)
          || c.id.toLowerCase().includes(q)
          || (c.nurse && c.nurse.toLowerCase().includes(q))
          || (c.region && c.region.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [cases, typeFilter, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  /* Stats */
  const stats = useMemo(() => ({
    total: cases.length,
    open: cases.filter(c => c.caseStatus === 'open').length,
    inProgress: cases.filter(c => c.caseStatus === 'in-progress').length,
    resolved: cases.filter(c => c.caseStatus === 'resolved').length,
    critical: cases.filter(c => c.severity === 'critical' && c.caseStatus !== 'resolved').length,
  }), [cases]);

  const resetFilters = () => { setTypeFilter('all'); setStatusFilter('All'); setSearchTerm(''); setPage(1); };
  const hasFilters = typeFilter !== 'all' || statusFilter !== 'All' || searchTerm;

  /* Apply resolution */
  const applyResolution = () => {
    if (!selected || !selectedSolution || !newStatus) return;
    setCases(prev => prev.map(c => {
      if (c.id !== selected.id) return c;
      const updated = { ...c, caseStatus: newStatus };
      if (newStatus === 'resolved') {
        updated.resolution = {
          resolvedBy: 'Admin',
          resolvedDate: new Date().toISOString().slice(0, 10),
          action: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}`,
        };
      }
      /* Add activity entry */
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      updated.activities = [...(c.activities || []), {
        time: timeStr,
        action: newStatus === 'resolved' ? 'Case resolved' : 'Status updated',
        note: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}`,
        status: newStatus === 'resolved' ? 'done' : newStatus === 'in-progress' ? 'pending' : 'alert',
      }];
      return updated;
    }));
    /* Update selected to reflect changes */
    setSelected(prev => {
      if (!prev) return null;
      const updated = cases.find(c => c.id === prev.id);
      if (!updated) return prev;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return {
        ...prev,
        caseStatus: newStatus,
        resolution: newStatus === 'resolved' ? { resolvedBy: 'Admin', resolvedDate: new Date().toISOString().slice(0, 10), action: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}` } : prev.resolution,
        activities: [...(prev.activities || []), { time: timeStr, action: newStatus === 'resolved' ? 'Case resolved' : 'Status updated', note: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}`, status: newStatus === 'resolved' ? 'done' : 'pending' }],
      };
    });
    setShowResolveForm(false);
    setSelectedSolution('');
    setResolutionNotes('');
    setNewStatus('');
  };

  return (
    <div className="page-wrapper emergency-cases-page" style={{ background: '#f1f5f9' }}>

      <div className="emergency-stats-row">
        {[
          { label: 'Total Cases', value: stats.total, color: '#2E7DB8', bg: '#e8f4fc', icon: <FiFileText size={20} /> },
          { label: 'Open', value: stats.open, color: '#dc2626', bg: '#fef2f2', icon: <FiAlertCircle size={20} /> },
          { label: 'In Progress', value: stats.inProgress, color: '#2563eb', bg: '#eff6ff', icon: <FiRefreshCw size={20} /> },
          { label: 'Resolved', value: stats.resolved, color: '#15803d', bg: '#ecfdf5', icon: <FiCheckCircle size={20} /> },
          { label: 'Critical Active', value: stats.critical, color: '#dc2626', bg: '#fef2f2', icon: <FiAlertTriangle size={20} /> },
        ].map((s, i) => (
          <div key={i} className="emergency-stat-card">
            <div className="emergency-stat-card__icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="emergency-stat-card__value">{s.value}</div>
              <div className="emergency-stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="emergency-cases-toolbar">
        <div className="emergency-cases-toolbar__banner">
          <div className="emergency-cases-toolbar__title">
            <FiAlertTriangle size={18} aria-hidden />
            Emergency case management
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2" style={{ justifyContent: 'flex-end' }}>
            <span className="emergency-cases-toolbar__count">{filtered.length} matching</span>
            <button
              type="button"
              className="emergency-clear-filters"
              style={{ borderColor: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', color: '#fff' }}
              onClick={loadPendingAlerts}
              disabled={alertsLoading}
              aria-busy={alertsLoading}
            >
              <FiRefreshCw size={14} aria-hidden /> Refresh
            </button>
          </div>
        </div>

        <div className="emergency-cases-toolbar__body">
          <div className="emergency-type-chips" role="tablist" aria-label="Case type">
            {TYPE_TABS.map(t => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={typeFilter === t.key}
                className={`emergency-type-chip${typeFilter === t.key ? ' is-active' : ''}`}
                onClick={() => { setTypeFilter(t.key); setPage(1); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="emergency-filter-row">
            <div className="emergency-search-wrap">
              <label className="emergency-field-label" htmlFor="emergency-case-search">Search</label>
              <div className="emergency-search-input-wrap">
                <FiSearch className="emergency-search-icon" size={14} aria-hidden />
                <input
                  id="emergency-case-search"
                  className="emergency-search-input"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Patient, case ID, nurse, region…"
                />
              </div>
            </div>

            <div>
              <span className="emergency-field-label">Case status</span>
              <div className="emergency-status-chips">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`emergency-status-chip${statusFilter === s ? ' is-active' : ''}`}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button type="button" className="emergency-clear-filters" onClick={resetFilters}>
                <FiX size={14} aria-hidden /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="emergency-layout">

        <div className="emergency-cases-main">
          {alertsLoading && cases.length === 0 ? (
            <div className="emergency-cases-empty">
              <FiRefreshCw size={36} style={{ opacity: 0.45 }} className="emergency-cases-loading-icon" aria-hidden />
              <p className="emergency-cases-empty__title">Loading pending alerts…</p>
              <p className="emergency-cases-empty__hint">Fetching from the server.</p>
            </div>
          ) : alertsError ? (
            <div className="emergency-cases-empty">
              <FiAlertCircle size={36} style={{ opacity: 0.5, color: '#b91c1c' }} aria-hidden />
              <p className="emergency-cases-empty__title">Could not load alerts</p>
              <p className="emergency-cases-empty__hint">{alertsError}</p>
              <button type="button" className="emergency-clear-filters" style={{ marginTop: 12 }} onClick={loadPendingAlerts}>
                <FiRefreshCw size={14} aria-hidden /> Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="emergency-cases-empty">
              <FiSearch size={36} style={{ opacity: 0.35 }} aria-hidden />
              <p className="emergency-cases-empty__title">{cases.length === 0 ? 'No pending alerts' : 'No cases found'}</p>
              <p className="emergency-cases-empty__hint">
                {cases.length === 0 ? 'There are no items in the pending queue right now.' : 'Try widening your filters or search terms.'}
              </p>
            </div>
          ) : (
            <>
              <div className="emergency-cases-grid">
                {paged.map((c) => {
                  const sev = severityStyle[c.severity] || severityStyle.medium;
                  const cs = caseStatusStyle[c.caseStatus] || caseStatusStyle.open;
                  const sevKey = c.severity === 'critical' ? 'critical' : c.severity === 'high' ? 'high' : 'medium';
                  return (
                    <article
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      className={`emergency-case-card emergency-case-card--${sevKey}${selected?.id === c.id ? ' is-selected' : ''}`}
                      onClick={() => { setSelected(c); setShowResolveForm(false); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(c);
                          setShowResolveForm(false);
                        }
                      }}
                    >
                      <div className="emergency-case-card__row">
                        <span className="emergency-case-card__id">{c.id}</span>
                        <span
                          className="emergency-case-card__pill"
                          style={{
                            background: cs.bg,
                            color: cs.color,
                            border: `1px solid ${cs.border}`,
                            textTransform: 'capitalize',
                            fontWeight: 700,
                          }}
                        >
                          {cs.icon}
                          {c.caseStatus}
                        </span>
                      </div>
                      <h3 className="emergency-case-card__patient">{c.patient}</h3>
                      <div className="emergency-case-card__sub">{c.patientId} · {c.region}</div>
                      <p className="emergency-case-card__reason">{c.reason}</p>
                      <div className="emergency-case-card__footer">
                        <span className="emergency-case-card__pill emergency-case-card__pill--type">{c.type}</span>
                        <span
                          className="emergency-case-card__pill"
                          style={{
                            background: sev.bg,
                            color: sev.color,
                            border: `1px solid ${sev.border}`,
                          }}
                        >
                          {c.severity}
                        </span>
                      </div>
                      <div className="emergency-case-card__meta">
                        <span><FiUser size={12} aria-hidden /> {c.flaggedBy}</span>
                        <span><FiClock size={12} aria-hidden /> {c.flaggedDate}</span>
                        <span><FiActivity size={12} aria-hidden /> {c.nurse}</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="emergency-pagination">
                <span className="emergency-pagination__info">
                  Showing <strong>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</strong> of {filtered.length}
                </span>
                <div className="emergency-pagination__btns">
                  <button type="button" className="emergency-page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="First page"><FiChevronsLeft size={14} /></button>
                  <button type="button" className="emergency-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page"><FiChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pn => pn === 1 || pn === totalPages || Math.abs(pn - page) <= 1)
                    .flatMap((pn, idx, arr) => {
                      const out = [];
                      if (idx > 0 && pn - arr[idx - 1] > 1) {
                        out.push(<span key={`ellipsis-${pn}`} style={{ padding: '5px 4px', fontSize: 12, color: '#94a3b8' }}>…</span>);
                      }
                      out.push(
                        <button
                          key={pn}
                          type="button"
                          className={`emergency-page-btn${page === pn ? ' is-current' : ''}`}
                          onClick={() => setPage(pn)}
                        >
                          {pn}
                        </button>,
                      );
                      return out;
                    })}
                  <button type="button" className="emergency-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page"><FiChevronRight size={14} /></button>
                  <button type="button" className="emergency-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Last page"><FiChevronsRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>

        {selected && (
          <div className="emergency-detail-panel">
            <div className="emergency-detail-panel__head">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c' }}>{selected.id}</span>
                    {(() => {
                      const cs = caseStatusStyle[selected.caseStatus] || caseStatusStyle.open;
                      return (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: cs.bg,
                            color: cs.color,
                            border: `1px solid ${cs.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {cs.icon}
                          {selected.caseStatus}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--kh-text)', letterSpacing: '-0.02em' }}>{selected.patient}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', fontWeight: 600 }}>
                    {[selected.age != null && `${selected.age}y`, selected.gender, selected.patientId].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button
                  type="button"
                  className="emergency-detail-close"
                  onClick={() => { setSelected(null); setShowResolveForm(false); }}
                  aria-label="Close case details"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            <div className="emergency-detail-panel__body">
              {/* Quick info */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {[
                  { icon: <FiMapPin size={11} />, text: selected.region },
                  { icon: <FiUser size={11} />, text: selected.nurse },
                  { icon: <FiPhone size={11} />, text: selected.phone },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>

              {/* Reason */}
              <div style={{ padding: '12px 14px', borderRadius: 2, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#dc2626', marginBottom: 4 }}>Flag Reason</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', lineHeight: 1.5 }}>{selected.reason}</div>
              </div>

              {/* Severity + Type badges */}
              <div className="d-flex gap-2 mb-4 flex-wrap">
                {(() => {
                  const sev = severityStyle[selected.severity];
                  return (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: sev.bg,
                        color: sev.color,
                        border: `1px solid ${sev.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <FiAlertTriangle size={12} aria-hidden />
                      {selected.severity}
                    </span>
                  );
                })()}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{selected.type}</span>
              </div>

              {/* Diagnosis */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 6 }}>Diagnosis</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{selected.diagnosis}</div>
              </div>

              {/* Vitals */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 8 }}>
                  <FiActivity size={11} style={{ marginRight: 4 }} />Current Vitals
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(selected.vitals || {}).map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 12px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb', minWidth: 80 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medications */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 8 }}>Medications</div>
                <div className="d-flex flex-column gap-1">
                  {(selected.medications || []).map((m, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: 'var(--kh-text)', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <FiShield size={14} style={{ color: '#64748b', flexShrink: 0, marginTop: 2 }} aria-hidden />
                      <span style={{ fontWeight: 600, lineHeight: 1.4 }}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity timeline */}
              <div style={{ marginBottom: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 10 }}>
                  <FiClock size={11} style={{ marginRight: 4 }} />Activity Timeline
                </div>
                <div className="d-flex flex-column gap-0" style={{ position: 'relative' }}>
                  {/* vertical line */}
                  <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, background: '#e5e7eb' }} />
                  {(selected.activities || []).map((a, i) => {
                    const dot = activityStatusDot[a.status] || activityStatusDot.pending;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', position: 'relative' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: dot.bg, border: '2px solid #fff', flexShrink: 0, marginTop: 2, zIndex: 1, boxShadow: '0 0 0 1px #e5e7eb' }} />
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--kh-text-muted)' }}>{a.time}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text)' }}>{a.action}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', lineHeight: 1.4, marginTop: 2 }}>{a.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution (if resolved) */}
              {selected.resolution && (
                <div style={{ padding: '12px 14px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #BAE0FD', marginBottom: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1565A0', marginBottom: 6 }}>
                    <FiCheckCircle size={11} style={{ marginRight: 4 }} />Resolution
                  </div>
                  <div style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.5, marginBottom: 4, fontWeight: 600 }}>{selected.resolution.action}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Resolved by {selected.resolution.resolvedBy} on {selected.resolution.resolvedDate}</div>
                </div>
              )}

              {/* ── Action Buttons ── */}
              {selected.caseStatus !== 'resolved' && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  {!showResolveForm ? (
                    <div className="d-flex gap-2">
                      <button onClick={() => { setShowResolveForm(true); setNewStatus('in-progress'); }} style={{
                        flex: 1, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiRefreshCw size={13} /> Update Status
                      </button>
                      <button onClick={() => { setShowResolveForm(true); setNewStatus('resolved'); }} style={{
                        flex: 1, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                        background: '#45B6FE', color: '#fff', border: '1px solid #45B6FE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiCheckCircle size={13} /> Resolve Case
                      </button>
                    </div>
                  ) : (
                    /* Resolution form */
                    <div style={{ padding: '16px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--kh-text)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {newStatus === 'resolved' ? <FiCheckCircle size={16} style={{ color: '#1565A0' }} /> : <FiRefreshCw size={16} style={{ color: '#2563eb' }} />}
                          {newStatus === 'resolved' ? 'Resolve case' : 'Update status'}
                        </span>
                        <button onClick={() => { setShowResolveForm(false); setSelectedSolution(''); setResolutionNotes(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)' }}><FiX size={14} /></button>
                      </div>

                      {/* Status select */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>New Status</label>
                        <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{
                          width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
                        }}>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      {/* Solution select */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Solution Applied</label>
                        <select value={selectedSolution} onChange={e => setSelectedSolution(e.target.value)} style={{
                          width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
                        }}>
                          <option value="">— Select a solution —</option>
                          {SOLUTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Notes */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Additional Notes</label>
                        <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={3} placeholder="Add any additional details about the resolution..."
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', resize: 'vertical', fontFamily: 'inherit' }} />
                      </div>

                      {/* Submit */}
                      <button onClick={applyResolution} disabled={!selectedSolution} style={{
                        width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 700, borderRadius: 2, cursor: selectedSolution ? 'pointer' : 'not-allowed',
                        background: selectedSolution ? (newStatus === 'resolved' ? '#45B6FE' : '#2563eb') : '#e5e7eb',
                        color: selectedSolution ? '#fff' : '#9ca3af',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiSend size={13} /> {newStatus === 'resolved' ? 'Apply Solution & Resolve' : 'Update Case Status'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
