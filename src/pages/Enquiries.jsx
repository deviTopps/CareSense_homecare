import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import {
  fetchEnquiries,
  createEnquiry,
  patchEnquiry,
  deleteEnquiry,
  extractEnquiriesList,
  normalizeEnquiryRecord,
} from '../utils/enquiries';
import {
  FiUser,
  FiMapPin,
  FiPhone,
  FiClipboard,
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiX,
  FiCalendar,
  FiSend,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiTrash2,
} from '../icons/hugeicons-feather';

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function formatShortDate(v) {
  if (v == null || v === '') return '—';
  const s = String(v);
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch { /* ignore */ }
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function recordedByLabel(row) {
  const r = row?.recordedBy;
  if (r && typeof r === 'object') {
    const fn = String(r.firstName || '').trim();
    const ln = String(r.lastName || '').trim();
    const joined = [fn, ln].filter(Boolean).join(' ').trim();
    if (joined) return joined;
  }
  const s = pickFirst(row || {}, ['recordedByName', 'recorded_by_name']);
  return s != null ? String(s) : '—';
}

/** Allowed by backend — PATCH must use one of these */
const API_ENQUIRY_STATUSES = ['pending', 'visited', 'signup', 'failed'];

/**
 * Map stored / legacy status to a valid API value for PATCH.
 */
function coerceApiStatus(raw) {
  const v = String(raw ?? 'pending').toLowerCase().trim().replace(/_/g, '-');
  if (API_ENQUIRY_STATUSES.includes(v)) return v;
  if (['in-progress', 'contacted', 'follow-up', 'active', 'investigating'].includes(v)) return 'visited';
  if (['resolved', 'closed', 'converted', 'completed'].includes(v)) return 'signup';
  if (['lost', 'rejected'].includes(v)) return 'failed';
  return 'pending';
}

/** Filter + stat buckets: pending | active | closed */
function normalizeStatus(raw) {
  const api = coerceApiStatus(raw);
  if (api === 'pending') return 'pending';
  if (api === 'visited') return 'active';
  return 'closed'; // signup, failed
}

function statusDisplayLabel(api) {
  switch (api) {
    case 'pending': return 'Pending';
    case 'visited': return 'Visited';
    case 'signup': return 'Sign-up';
    case 'failed': return 'Failed';
    default: return 'Pending';
  }
}

const STATUS_FILTER = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Follow-up' },
  { key: 'closed', label: 'Closed' },
];

const FOLLOWUP_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'visited', label: 'Visited (follow-up in progress)' },
  { value: 'signup', label: 'Sign-up (converted)' },
  { value: 'failed', label: 'Failed' },
];

const apiStatusPillStyle = {
  pending: { bg: '#fefce8', color: '#a16207', border: '#fde047' },
  visited: { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  signup: { bg: '#ecfdf5', color: '#15803d', border: '#86efac' },
  failed: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

const emptyCreateForm = () => ({
  nameOfClient: '',
  dateOfContact: new Date().toISOString().slice(0, 10),
  relationToPatient: '',
  phoneNumber: '',
  email: '',
  location: '',
  gps: '',
  landMark: '',
  gateColour: '',
  notes: '',
});

export default function Enquiries() {
  const navigate = useNavigate();
  const on401 = () => navigate('/login', { replace: true });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [followUpError, setFollowUpError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [selected, setSelected] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('visited');
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const loadEnquiries = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const json = await fetchEnquiries({ page: 1, limit: 100 }, on401);
      const list = extractEnquiriesList(json);
      /** If single object returned, wrap */
      const asArray = Array.isArray(list) ? list : list && typeof list === 'object' ? [list] : [];
      setRows(asArray.map(normalizeEnquiryRecord).filter(Boolean));
    } catch (e) {
      setRows([]);
      setError(e.message || 'Could not load enquiries');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const bucket = normalizeStatus(r.status);
      if (statusFilter !== 'all' && bucket !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const hay = [
          r.nameOfClient,
          r.phoneNumber,
          r.email,
          r.location,
          r.relationToPatient,
          r.notes,
          r.id,
          recordedByLabel(r),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((r) => normalizeStatus(r.status) === 'pending').length,
      active: rows.filter((r) => normalizeStatus(r.status) === 'active').length,
      closed: rows.filter((r) => normalizeStatus(r.status) === 'closed').length,
    };
  }, [rows]);

  const openCreate = () => {
    setCreateForm(emptyCreateForm());
    setSubmitError(null);
    setShowCreate(true);
  };

  const submitCreate = async () => {
    const f = createForm;
    if (!f.nameOfClient.trim() || !f.dateOfContact.trim() || !f.relationToPatient.trim() || !f.phoneNumber.trim() || !f.location.trim()) {
      setSubmitError('Fill in client name, date of contact, relation, phone, and location.');
      return;
    }
    setCreateSubmitting(true);
    setSubmitError(null);
    try {
      const body = {
        nameOfClient: f.nameOfClient.trim(),
        dateOfContact: f.dateOfContact.trim(),
        relationToPatient: f.relationToPatient.trim(),
        phoneNumber: f.phoneNumber.trim(),
        location: f.location.trim(),
      };
      if (f.email.trim()) body.email = f.email.trim();
      if (f.gps.trim()) body.gps = f.gps.trim();
      if (f.landMark.trim()) body.landMark = f.landMark.trim();
      if (f.gateColour.trim()) body.gateColour = f.gateColour.trim();
      if (f.notes.trim()) body.notes = f.notes.trim();
      const created = await createEnquiry(body, on401);
      const createdRow = created && typeof created === 'object' ? normalizeEnquiryRecord(created) : null;
      if (createdRow) {
        setRows((prev) => [createdRow, ...prev.filter((x) => x && x.id !== createdRow.id)]);
      } else {
        await loadEnquiries();
      }
      setShowCreate(false);
      setCreateForm(emptyCreateForm());
    } catch (e) {
      setSubmitError(e.message || 'Create failed');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openFollowUp = (row) => {
    setSelected(row);
    setFollowUpNote('');
    setFollowUpStatus(coerceApiStatus(row.status));
    setFollowUpError(null);
    setShowFollowUp(true);
  };

  const submitFollowUp = async () => {
    if (!selected?.id || !followUpNote.trim()) {
      setFollowUpError('Add a follow-up note.');
      return;
    }
    setFollowUpSubmitting(true);
    setFollowUpError(null);
    const existing = String(selected.notes ?? '').trim();
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const combined = existing ? `${existing}\n\n[${stamp}] ${followUpNote.trim()}` : `[${stamp}] ${followUpNote.trim()}`;
    try {
      const updated = await patchEnquiry(
        selected.id,
        { notes: combined, status: coerceApiStatus(followUpStatus) },
        on401,
      );
      const nextStatus = coerceApiStatus(followUpStatus);
      const rawMerged = updated && typeof updated === 'object' ? updated : { ...selected, notes: combined, status: nextStatus };
      const merged = normalizeEnquiryRecord(rawMerged) || rawMerged;
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...merged } : r)));
      setSelected((s) => (s && s.id === selected.id ? { ...s, ...merged } : s));
      setShowFollowUp(false);
      setFollowUpNote('');
    } catch (e) {
      /** If PATCH not implemented, try PUT or show friendly error */
      const msg = e.message || '';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setFollowUpError('The server has no update endpoint for this enquiry yet. Notes are not saved.');
      } else {
        setFollowUpError(msg || 'Update failed');
      }
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  const handleDeleteRow = async (row) => {
    const id = row?.id ?? row?._id;
    if (id == null || String(id).trim() === '') {
      setDeleteError('This enquiry has no server id — refresh the list and try again.');
      return;
    }
    const label = String(row.nameOfClient || '').trim() || 'this enquiry';
    if (!window.confirm(`Delete enquiry for “${label}”? This cannot be undone.`)) return;

    setDeleteError(null);
    setDeletingId(String(id));
    try {
      await deleteEnquiry(id, on401);
      setRows((prev) => prev.filter((r) => String(r?.id ?? r?._id ?? '') !== String(id)));
      if (selected && String(selected.id ?? selected._id ?? '') === String(id)) {
        setShowFollowUp(false);
        setSelected(null);
      }
    } catch (e) {
      setDeleteError(e.message || 'Could not delete enquiry');
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="page-wrapper enquiries-page enquiries-page--full">
      <div className="enquiries-shell">
        <header className="enquiries-hero">
          <div className="enquiries-hero__row">
            <div className="enquiries-hero__titles">
              <p className="enquiries-hero__eyebrow">Intake &amp; pipeline</p>
              <h1 className="enquiries-hero__title">
                <FiClipboard size={26} aria-hidden className="enquiries-hero__title-icon" />
                Enquiries
              </h1>
              <p className="enquiries-hero__lead">
                Log calls and walk-ins, capture location and notes, then follow up until sign-up or close.
              </p>
            </div>
            <div className="enquiries-hero__actions">
              <button
                type="button"
                className="btn btn-light btn-sm enquiries-hero__btn"
                onClick={() => { loadEnquiries(); }}
                disabled={loading}
              >
                <FiRefreshCw size={14} className="me-1" aria-hidden /> Refresh
              </button>
              <button type="button" className="btn btn-primary btn-sm enquiries-hero__btn enquiries-hero__btn--primary" onClick={openCreate}>
                <FiPlus size={14} className="me-1" aria-hidden /> New enquiry
              </button>
            </div>
          </div>
        </header>

        <div className="enquiries-stats-row">
          {[
            { label: 'Total', value: stats.total, icon: FiClipboard, bg: '#e8f4fc', color: '#2E7DB8' },
            { label: 'Pending', value: stats.pending, icon: FiClock, bg: '#fefce8', color: '#a16207' },
            { label: 'Follow-up', value: stats.active, icon: FiAlertCircle, bg: '#eff6ff', color: '#2563eb' },
            { label: 'Closed', value: stats.closed, icon: FiCheckCircle, bg: '#ecfdf5', color: '#15803d' },
          ].map((s, i) => (
            <div key={i} className="enquiries-stat-card">
              <div className="enquiries-stat-card__icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={20} aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="enquiries-stat-card__value">{s.value}</div>
                <div className="enquiries-stat-card__label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="enquiries-toolbar kh-card border-0 shadow-sm">
          <div className="enquiries-toolbar__inner">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-xl-auto">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="enquiries-toolbar__label">Status</span>
                  <div className="d-flex flex-wrap gap-1" role="group" aria-label="Filter by status">
                    {STATUS_FILTER.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={`btn btn-sm enquiries-filter-chip${statusFilter === t.key ? ' is-active' : ''}`}
                        onClick={() => { setStatusFilter(t.key); setPage(1); }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-12 col-xl">
                <div className="input-group input-group-sm enquiries-search">
                  <span className="input-group-text border-end-0"><FiSearch size={14} aria-hidden /></span>
                  <input
                    type="search"
                    className="form-control border-start-0"
                    placeholder="Search client, phone, location, notes…"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
              {(statusFilter !== 'all' || searchTerm) && (
                <div className="col-12 col-xl-auto">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
                    <FiX size={14} className="me-1" aria-hidden /> Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 enquiries-alert" role="alert">
            <FiAlertCircle /> {error}
          </div>
        )}

        {deleteError && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between flex-wrap gap-2 enquiries-alert" role="alert">
            <span className="d-flex align-items-center gap-2">
              <FiAlertCircle aria-hidden /> {deleteError}
            </span>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDeleteError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div className="enquiries-board kh-card border-0 shadow-sm">
          {loading ? (
            <div className="enquiries-board__state">
              <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" aria-hidden />
              <span className="text-muted">Loading enquiries…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="enquiries-board__state enquiries-board__state--empty">
              <FiClipboard size={40} className="text-muted mb-3 opacity-45 d-block mx-auto" aria-hidden />
              <div className="enquiries-board__empty-title">No enquiries yet</div>
              <p className="text-muted small mb-3">Create a new enquiry or adjust filters.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                <FiPlus size={14} className="me-1" aria-hidden /> New enquiry
              </button>
            </div>
          ) : (
            <>
              <div className="enquiries-table-scroll table-responsive">
                <table className="table table-bordered table-hover mb-0 align-middle enquiries-table" style={{ fontSize: '0.925rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Client</th>
                      <th className="d-none d-lg-table-cell">Contact date</th>
                      <th className="d-none d-md-table-cell">Relation</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th className="d-none d-xl-table-cell">Location</th>
                      <th>Status</th>
                      <th className="d-none d-lg-table-cell">Recorded by</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r, idx) => {
                      const api = coerceApiStatus(r.status);
                      const st = apiStatusPillStyle[api] || apiStatusPillStyle.pending;
                      const rowKey = r.id ?? `idx-${idx}`;
                      const rowId = r.id ?? r._id;
                      const canDelete = rowId != null && String(rowId).trim() !== '';
                      const isDeleting = canDelete && deletingId === String(rowId);
                      return (
                        <tr key={rowKey} className={selected?.id === r.id ? 'table-primary' : ''}>
                          <td>
                            <div className="fw-semibold" style={{ color: '#0f172a' }}>{r.nameOfClient || '—'}</div>
                            <div className="text-muted small d-lg-none">{formatShortDate(r.dateOfContact)}</div>
                          </td>
                          <td className="d-none d-lg-table-cell text-muted">{formatShortDate(r.dateOfContact)}</td>
                          <td className="d-none d-md-table-cell">{r.relationToPatient || '—'}</td>
                          <td>
                            <div className="d-flex align-items-center gap-1 text-nowrap"><FiPhone size={12} className="text-muted flex-shrink-0" aria-hidden /> {r.phoneNumber || '—'}</div>
                          </td>
                          <td>
                            <div className="d-flex align-items-start gap-1 small">
                              <FiMail size={12} className="text-muted flex-shrink-0 mt-1" aria-hidden />
                              <span className="text-break">{r.email?.trim() || '—'}</span>
                            </div>
                          </td>
                          <td className="d-none d-xl-table-cell">
                            <div className="d-flex gap-1"><FiMapPin size={14} className="text-muted flex-shrink-0 mt-1" />
                              <span>{r.location || '—'}{r.gps ? ` · ${r.gps}` : ''}</span></div>
                          </td>
                          <td>
                            <span
                              className="badge rounded-pill px-2 py-1 fw-normal"
                              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                            >
                              {statusDisplayLabel(api)}
                            </span>
                          </td>
                          <td className="d-none d-lg-table-cell small">{recordedByLabel(r)}</td>
                          <td className="text-end">
                            <div className="d-inline-flex flex-wrap align-items-center justify-content-end gap-1">
                              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openFollowUp(r)}>
                                Follow-up
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger enquiries-delete-btn d-inline-flex align-items-center gap-1 text-white"
                                disabled={!canDelete || isDeleting}
                                title={canDelete ? 'Delete this enquiry' : 'Cannot delete without a server id'}
                                onClick={() => handleDeleteRow(r)}
                              >
                                <FiTrash2 size={12} aria-hidden />
                                {isDeleting ? '…' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="enquiries-board__footer">
                <span className="text-muted small">{filtered.length} matching</span>
                {totalPages > 1 ? (
                  <div className="btn-group btn-group-sm">
                    <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                    <span className="btn btn-outline-secondary disabled">{page} / {totalPages}</span>
                    <button type="button" className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                  </div>
                ) : (
                  <span className="small text-muted">Page 1</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Detail + follow-up (drawer-like modal) */}
        <Modal
          show={Boolean(showFollowUp && selected)}
          onHide={() => { setShowFollowUp(false); setSelected(null); }}
          centered
          size="lg"
          animation={false}
          backdrop="static"
          className="kh-rb-portal-modal"
          contentClassName="border-0"
          style={{ borderRadius: 12 }}
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="h6 d-flex align-items-center gap-2">
              <FiUser size={18} /> {selected?.nameOfClient || 'Enquiry'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            {selected && (
              <>
                <div className="row g-3 small mb-3">
                  <div className="col-md-6">
                    <div className="text-muted">Date of contact</div>
                    <div><FiCalendar size={14} className="me-1 text-muted" />{selected.dateOfContact || '—'}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Relation to patient</div>
                    <div>{selected.relationToPatient || '—'}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Phone</div>
                    <div>{selected.phoneNumber || '—'}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted">Email</div>
                    <div>{selected.email || '—'}</div>
                  </div>
                  <div className="col-12">
                    <div className="text-muted">Location & access</div>
                    <div>{selected.location || '—'}</div>
                    <div className="text-muted small mt-1">
                      {[selected.gps && `GPS ${selected.gps}`, selected.landMark && `Landmark: ${selected.landMark}`, selected.gateColour && `Gate: ${selected.gateColour}`].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="text-muted">Existing notes</div>
                    <div className="p-2 rounded bg-light border small" style={{ whiteSpace: 'pre-wrap', minHeight: 48 }}>
                      {selected.notes?.trim() || 'No notes'}
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">New follow-up note</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={3}
                    placeholder="What happened on your follow-up call or visit?"
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold">Update status</label>
                  <select
                    className="form-select form-select-sm"
                    value={followUpStatus}
                    onChange={(e) => setFollowUpStatus(e.target.value)}
                  >
                    {FOLLOWUP_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {followUpError && (
                  <div className="alert alert-warning py-2 small mb-2">{followUpError}</div>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <button type="button" className="btn btn-light btn-sm" onClick={() => { setShowFollowUp(false); setSelected(null); }}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={followUpSubmitting} onClick={submitFollowUp}>
              <FiSend size={14} className="me-1" /> Save follow-up
            </button>
          </Modal.Footer>
        </Modal>

        {/* Create enquiry */}
        <Modal
          show={showCreate}
          onHide={() => { if (!createSubmitting) setShowCreate(false); }}
          centered
          size="lg"
          animation={false}
          backdrop="static"
          className="kh-rb-portal-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>New enquiry</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {submitError && <div className="alert alert-danger py-2 small">{submitError}</div>}
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">Client / caller name <span className="text-danger">*</span></label>
                <input className="form-control form-control-sm" value={createForm.nameOfClient} onChange={(e) => setCreateForm((f) => ({ ...f, nameOfClient: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Date of contact <span className="text-danger">*</span></label>
                <input type="date" className="form-control form-control-sm" value={createForm.dateOfContact} onChange={(e) => setCreateForm((f) => ({ ...f, dateOfContact: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Relation to patient <span className="text-danger">*</span></label>
                <input className="form-control form-control-sm" value={createForm.relationToPatient} onChange={(e) => setCreateForm((f) => ({ ...f, relationToPatient: e.target.value }))} placeholder="Mother, spouse, self…" />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Phone <span className="text-danger">*</span></label>
                <input className="form-control form-control-sm" value={createForm.phoneNumber} onChange={(e) => setCreateForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="+233 …" />
              </div>
              <div className="col-md-6">
                <label className="form-label small">Email</label>
                <input type="email" className="form-control form-control-sm" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label small">Location / address <span className="text-danger">*</span></label>
                <input className="form-control form-control-sm" value={createForm.location} onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">GPS</label>
                <input className="form-control form-control-sm" value={createForm.gps} onChange={(e) => setCreateForm((f) => ({ ...f, gps: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Landmark</label>
                <input className="form-control form-control-sm" value={createForm.landMark} onChange={(e) => setCreateForm((f) => ({ ...f, landMark: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Gate colour</label>
                <input className="form-control form-control-sm" value={createForm.gateColour} onChange={(e) => setCreateForm((f) => ({ ...f, gateColour: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label small">Notes</label>
                <textarea className="form-control form-control-sm" rows={2} value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Interest, urgency, preferred visit time…" />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-light btn-sm" disabled={createSubmitting} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={createSubmitting} onClick={submitCreate}>
              {createSubmitting ? 'Saving…' : 'Create enquiry'}
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}
