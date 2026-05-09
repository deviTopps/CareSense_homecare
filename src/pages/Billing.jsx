import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiDownload,
  FiX,
  FiFileText,
  FiSend,
  FiPrinter,
  FiUser,
} from '../icons/hugeicons-feather';
import { apiFetch, getUser } from '../api';
import { fetchAllPatients } from '../utils/patients';

const ROWS_PER_PAGE = 10;

function fmtDate(raw) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function fmtDateTime(raw) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function getPatientId(p) {
  return String(p?._id || p?.id || p?.patientId || p?.uuid || '').trim();
}

function getPatientName(p) {
  if (!p) return '—';
  const fn = p.firstName || p.first_name || '';
  const ln = p.lastName || p.last_name || '';
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  return full || p.name || p.fullName || p.patientName || '—';
}

function buildReportsFromPatient(patient) {
  const id = getPatientId(patient);
  const name = getPatientName(patient);
  const diagnosis = patient.diagnosis || patient.primaryDiagnosis || '—';
  const gender = patient.gender || '—';
  const age = patient.age || (patient.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000) : '—');
  const dob = patient.dob || patient.dateOfBirth || patient.date_of_birth || '';
  const nurseRaw = patient.nurse || patient.assignedNurse || patient.visitingNurse;
  const nurseName = typeof nurseRaw === 'object' ? getPatientName(nurseRaw) : (nurseRaw || '—');
  const doctorRaw = patient.doctor;
  const doctorName = typeof doctorRaw === 'object' ? (doctorRaw.name || '—') : (doctorRaw || '—');
  const doctorFacility = typeof doctorRaw === 'object' ? (doctorRaw.facility || '') : '';
  const enrolled = patient.enrolled || patient.createdAt || patient.created_at || '';
  const medications = patient.medications || '';
  const medicalHistory = patient.medicalHistory || patient.medical_history || '';
  const vitals = patient.vitals || {};
  const status = patient.status || 'active';

  const reports = [];

  if (vitals && Object.keys(vitals).length > 0) {
    reports.push({
      reportId: `RPT-V-${id}`,
      patientId: id,
      patientName: name,
      type: 'Vitals Assessment',
      date: enrolled || new Date().toISOString(),
      status: 'Final',
      nurseName,
      doctorName,
      doctorFacility,
      patient: { ...patient, name, age, gender, dob, diagnosis, medications, medicalHistory, vitals, status },
    });
  }

  if (diagnosis && diagnosis !== '—') {
    reports.push({
      reportId: `RPT-C-${id}`,
      patientId: id,
      patientName: name,
      type: 'Clinical Summary',
      date: enrolled || new Date().toISOString(),
      status: 'Final',
      nurseName,
      doctorName,
      doctorFacility,
      patient: { ...patient, name, age, gender, dob, diagnosis, medications, medicalHistory, vitals, status },
    });
  }

  if (medications && medications !== '—') {
    reports.push({
      reportId: `RPT-M-${id}`,
      patientId: id,
      patientName: name,
      type: 'Medication Review',
      date: enrolled || new Date().toISOString(),
      status: 'Final',
      nurseName,
      doctorName,
      doctorFacility,
      patient: { ...patient, name, age, gender, dob, diagnosis, medications, medicalHistory, vitals, status },
    });
  }

  if (reports.length === 0) {
    reports.push({
      reportId: `RPT-G-${id}`,
      patientId: id,
      patientName: name,
      type: 'General Assessment',
      date: enrolled || new Date().toISOString(),
      status: 'Draft',
      nurseName,
      doctorName,
      doctorFacility,
      patient: { ...patient, name, age, gender, dob, diagnosis, medications, medicalHistory, vitals, status },
    });
  }

  return reports;
}

const REPORT_TYPE_COLORS = {
  'Vitals Assessment': { bg: '#eff6ff', text: '#1d4ed8' },
  'Clinical Summary': { bg: '#f0fdf4', text: '#15803d' },
  'Medication Review': { bg: '#fdf4ff', text: '#7e22ce' },
  'General Assessment': { bg: '#f8fafc', text: '#475569' },
};

function ReportStatusBadge({ status }) {
  const colors = status === 'Final'
    ? { bg: '#f0fdf4', text: '#15803d' }
    : { bg: '#fffbeb', text: '#b45309' };
  return (
    <span className="reports-status-badge" style={{ background: colors.bg, color: colors.text }}>
      {status}
    </span>
  );
}

function ReportTypeBadge({ type }) {
  const c = REPORT_TYPE_COLORS[type] || REPORT_TYPE_COLORS['General Assessment'];
  return (
    <span className="reports-type-badge" style={{ background: c.bg, color: c.text }}>
      {type}
    </span>
  );
}

function ReportViewer({ report, onClose, onShare }) {
  const printRef = useRef(null);
  const p = report.patient || {};
  const user = getUser();
  const agencyName = user?.agencyName || user?.agency?.name || 'CareSense Homecare';
  const now = new Date();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${report.type} — ${report.patientName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
        .report-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px; }
        .report-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
        .report-header p { font-size: 12px; color: #555; }
        .report-title { font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #1a1a1a; padding: 8px; }
        .report-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 20px; font-size: 12px; }
        .report-meta dt { font-weight: 700; color: #333; }
        .report-meta dd { margin: 0; color: #555; }
        .report-section { margin-bottom: 18px; }
        .report-section h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
        .report-section p, .report-section li { font-size: 12.5px; line-height: 1.7; }
        .report-section ul { padding-left: 18px; }
        .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .vital-item { padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 11px; }
        .vital-item strong { display: block; font-size: 14px; margin-top: 2px; }
        .report-footer { margin-top: 32px; border-top: 1px solid #ccc; padding-top: 12px; font-size: 11px; color: #777; text-align: center; }
        .signature-line { margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }
        .signature-line > div { flex: 1; border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 11px; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}
      <script>window.print();window.close();<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const vitals = p.vitals || {};
  const vitalEntries = Object.entries(vitals).filter(([, v]) => v && v !== '—');

  return (
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div className="reports-viewer-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="reports-viewer-toolbar">
          <div className="reports-viewer-toolbar__left">
            <FiFileText size={18} />
            <span>{report.type}</span>
          </div>
          <div className="reports-viewer-toolbar__actions">
            <button type="button" className="reports-viewer-action-btn" onClick={handlePrint} title="Print report">
              <FiPrinter size={15} />
              <span>Print</span>
            </button>
            <button type="button" className="reports-viewer-action-btn" onClick={onShare} title="Share via email">
              <FiSend size={15} />
              <span>Share</span>
            </button>
            <button type="button" className="reports-viewer-close" onClick={onClose} aria-label="Close">
              <FiX size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="reports-viewer-body">
          <div ref={printRef} className="reports-document">
            <div className="report-header">
              <h1>{agencyName}</h1>
              <p>Homecare Medical Report</p>
              <p>Licensed Healthcare Provider</p>
            </div>

            <div className="report-title">{report.type}</div>

            <dl className="report-meta">
              <dt>Patient Name</dt><dd>{report.patientName}</dd>
              <dt>Report ID</dt><dd>{report.reportId}</dd>
              <dt>Age / Gender</dt><dd>{p.age || '—'} yrs / {p.gender || '—'}</dd>
              <dt>Date of Report</dt><dd>{fmtDate(report.date)}</dd>
              <dt>Date of Birth</dt><dd>{fmtDate(p.dob)}</dd>
              <dt>Status</dt><dd>{report.status}</dd>
              <dt>Attending Nurse</dt><dd>{report.nurseName}</dd>
              <dt>Referring Doctor</dt><dd>{report.doctorName}{report.doctorFacility ? ` — ${report.doctorFacility}` : ''}</dd>
            </dl>

            {(p.diagnosis && p.diagnosis !== '—') && (
              <div className="report-section">
                <h3>Diagnosis / Presenting Condition</h3>
                <p>{p.diagnosis}</p>
              </div>
            )}

            {(p.medicalHistory && p.medicalHistory !== '—') && (
              <div className="report-section">
                <h3>Medical History</h3>
                <p>{p.medicalHistory}</p>
              </div>
            )}

            {vitalEntries.length > 0 && (
              <div className="report-section">
                <h3>Vital Signs</h3>
                <div className="vitals-grid">
                  {vitalEntries.map(([key, val]) => (
                    <div className="vital-item" key={key}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).replace('Spo2', 'SpO₂').replace('Bp', 'Blood Pressure')}
                      <strong>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(p.medications && p.medications !== '—') && (
              <div className="report-section">
                <h3>Current Medications</h3>
                <ul>
                  {p.medications.split(',').map((med, i) => (
                    <li key={i}>{med.trim()}</li>
                  ))}
                </ul>
              </div>
            )}

            {p.pain?.present && (
              <div className="report-section">
                <h3>Pain Assessment</h3>
                <p>Location: {p.pain.location || '—'} | Score: {p.pain.score ?? '—'}/3 | Analgesia: {p.pain.analgesia || 'None'}</p>
              </div>
            )}

            {p.mobility && (
              <div className="report-section">
                <h3>Functional Assessment</h3>
                <p>
                  Independent mobility: {p.mobility.independent ? 'Yes' : 'No'} |
                  Bed movement: {p.mobility.bedMove ? 'Yes' : 'No'} |
                  Bed to chair: {p.mobility.bedToChair ? 'Yes' : 'No'} |
                  Toilet: {p.mobility.toilet ? 'Yes' : 'No'}
                </p>
              </div>
            )}

            <div className="report-section">
              <h3>Clinical Notes</h3>
              <p>
                Patient {report.patientName} is currently under homecare management for {p.diagnosis || 'the noted condition'}.
                {p.medications ? ` Current medications have been reviewed and are being administered as prescribed.` : ''}
                {vitalEntries.length > 0 ? ' Vital signs have been assessed and recorded as above.' : ''}
                {' '}Continued monitoring and follow-up as per care plan.
              </p>
            </div>

            <div className="signature-line">
              <div>
                <br />Attending Nurse: {report.nurseName}
              </div>
              <div>
                <br />Date: {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="report-footer">
              Generated by {agencyName} on {fmtDateTime(now)} — Confidential medical document
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareEmailModal({ report, onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Please find attached the ${report.type} for ${report.patientName}.`);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      await apiFetch('/reports/share', {
        method: 'POST',
        body: JSON.stringify({
          reportId: report.reportId,
          patientId: report.patientId,
          recipientEmail: email.trim(),
          message: message.trim(),
          reportType: report.type,
        }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-modal-overlay" role="presentation" onClick={onClose} style={{ zIndex: 10001 }}>
      <div className="app-modal-dialog app-modal-dialog--md" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="app-modal-dialog__header">
          <h2 className="app-modal-dialog__title">{sent ? 'Report shared' : 'Share report via email'}</h2>
          <button type="button" className="app-modal-dialog__close" aria-label="Close" onClick={onClose}>
            <FiX size={20} strokeWidth={1.75} />
          </button>
        </div>
        <div className="app-modal-dialog__body">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <FiSend size={32} style={{ color: '#45b6fe', marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Email sent successfully</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                The {report.type} for <strong>{report.patientName}</strong> has been shared to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="workforce-modal-alert" style={{ marginBottom: 14 }}>
                  {error}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <div className="reports-share-report-card">
                  <FiFileText size={16} style={{ color: '#45b6fe', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{report.type}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{report.patientName} — {fmtDate(report.date)}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 6 }}>Recipient email *</label>
                <input
                  type="email"
                  className="form-control form-control-kh workforce-form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 6 }}>Message (optional)</label>
                <textarea
                  className="form-control form-control-kh workforce-form-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </>
          )}
        </div>
        {sent ? (
          <div className="app-modal-dialog__footer">
            <button type="button" className="app-modal-dialog__btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className="app-modal-dialog__footer">
            <button type="button" className="app-modal-dialog__btn-cancel" onClick={onClose}>Cancel</button>
            <button type="button" className="app-modal-dialog__btn-primary" disabled={sending} onClick={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiSend size={13} />
              {sending ? 'Sending…' : 'Send email'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Billing() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [patientFilter, setPatientFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [viewReport, setViewReport] = useState(null);
  const [shareReport, setShareReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAllPatients();
        if (!cancelled) setPatients(list);
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allReports = useMemo(() => {
    return patients.flatMap(buildReportsFromPatient)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [patients]);

  const reportTypes = useMemo(() => {
    const set = new Set(allReports.map((r) => r.type));
    return ['All', ...Array.from(set).sort()];
  }, [allReports]);

  const patientNames = useMemo(() => {
    const set = new Set(allReports.map((r) => r.patientName));
    return ['All', ...Array.from(set).sort()];
  }, [allReports]);

  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      if (typeFilter !== 'All' && r.type !== typeFilter) return false;
      if (patientFilter !== 'All' && r.patientName !== patientFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.patientName.toLowerCase().includes(q)
          || r.reportId.toLowerCase().includes(q)
          || r.type.toLowerCase().includes(q)
          || r.nurseName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allReports, typeFilter, patientFilter, search]);

  useEffect(() => { setPage(1); }, [search, typeFilter, patientFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const startRow = filtered.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(page * ROWS_PER_PAGE, filtered.length);
  const paged = filtered.slice(startRow - 1, endRow);

  const pgBtn = (onClick, disabled, children) => (
    <button type="button" onClick={onClick} disabled={disabled} className="patients-page-btn">{children}</button>
  );

  const handleExport = () => {
    const headers = ['Report ID', 'Patient', 'Type', 'Date', 'Nurse', 'Doctor', 'Status'];
    const rows = filtered.map((r) => [
      r.reportId, r.patientName, r.type, fmtDate(r.date), r.nurseName, r.doctorName, r.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medical-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div className="page-wrapper reports-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
      <div className="patients-board-shell">
        <div className="patients-hero">
          <div>
            <div className="patients-kicker">Medical records</div>
            <h2 className="patients-title">Reports</h2>
            <p className="patients-subtitle">View, read, and share generated medical reports for your patients.</p>
          </div>
          <div className="patients-hero-actions">
            <button type="button" className="patients-toolbar-btn" onClick={handleExport}>
              <FiDownload size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <motion.div className="kh-card patients-board-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
          <div className="patients-topbar">
            <div className="patients-segmented-control">
              {reportTypes.map((t) => {
                const count = t === 'All' ? allReports.length : allReports.filter((r) => r.type === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`patients-segmented-control__item${typeFilter === t ? ' is-active' : ''}`}
                  >
                    <span>{t}</span>
                    <span className="patients-segmented-control__count">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="patients-topbar-actions">
              <div className="patients-meta-pill">
                <span className="patients-meta-pill__label">Total</span>
                <strong>{allReports.length}</strong>
              </div>
            </div>
          </div>

          <div className="patients-subtoolbar">
            <div className="patients-searchbox">
              <FiSearch className="patients-searchbox__icon" size={16} />
              <input
                type="search"
                className="form-control form-control-kh patients-searchbox__input"
                placeholder="Search reports by patient, ID, type, or nurse"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                aria-label="Search reports"
              />
            </div>
            <div className="patients-subtoolbar-actions">
              <label className="patients-meta-pill patients-meta-pill--select">
                <FiUser size={12} style={{ marginRight: 4 }} />
                <span className="patients-meta-pill__label">Patient</span>
                <select
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                  className="patients-rows-select"
                  aria-label="Filter by patient"
                  style={{ minWidth: 100 }}
                >
                  {patientNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="table-responsive patients-table-wrap">
            <table className="table kh-table patients-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Report Type</th>
                  <th>Date</th>
                  <th>Nurse</th>
                  <th>Status</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>Loading reports…</td></tr>
                )}
                {!loading && paged.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>
                    {allReports.length === 0 ? 'No reports generated yet. Reports are created from patient data.' : 'No reports match your filters.'}
                  </td></tr>
                )}
                {!loading && paged.map((r, i) => (
                  <tr key={r.reportId} className="patients-row-card" style={{ cursor: 'pointer' }} onClick={() => setViewReport(r)}>
                    <td className="col-num" data-label="#">{startRow + i}</td>
                    <td data-label="Patient">
                      <div className="d-flex align-items-center gap-2 patients-name-cell">
                        <div className="avatar sm patients-avatar" style={{ background: (startRow + i - 1) % 2 === 0 ? '#45B6FE' : '#2E7DB8' }}>
                          <FiUser size={14} aria-hidden />
                        </div>
                        <div>
                          <div className="patients-name-primary">{r.patientName}</div>
                          <div className="patients-name-secondary">{r.reportId}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Type"><ReportTypeBadge type={r.type} /></td>
                    <td data-label="Date" className="patients-table-date">{fmtDate(r.date)}</td>
                    <td data-label="Nurse" className="patients-table-value">{r.nurseName}</td>
                    <td data-label="Status"><ReportStatusBadge status={r.status} /></td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div className="d-inline-flex gap-2 align-items-center justify-content-end">
                        <button
                          type="button"
                          className="patients-row-action"
                          title="View report"
                          onClick={(e) => { e.stopPropagation(); setViewReport(r); }}
                        >
                          <FiFileText size={15} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="patients-row-action"
                          title="Share via email"
                          onClick={(e) => { e.stopPropagation(); setShareReport(r); }}
                        >
                          <FiSend size={15} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="patients-pagination-footer">
            <div className="patients-pagination-summary">
              <span>Showing</span>
              <strong>{startRow}–{endRow}</strong>
              <span>of</span>
              <strong>{filtered.length}</strong>
            </div>
            <div className="d-flex gap-1 patients-pagination-actions">
              {pgBtn(() => setPage(1), page === 1, <FiChevronsLeft size={14} />)}
              {pgBtn(() => setPage((p) => p - 1), page === 1, <FiChevronLeft size={14} />)}
              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((pNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pNum - prev > 1;
                  return (
                    <span key={pNum}>
                      {showEllipsis && <span className="patients-pagination-ellipsis">…</span>}
                      <button type="button" onClick={() => setPage(pNum)} className={`patients-page-number${page === pNum ? ' active' : ''}`}>{pNum}</button>
                    </span>
                  );
                })}
              {pgBtn(() => setPage((p) => p + 1), page === totalPages, <FiChevronRight size={14} />)}
              {pgBtn(() => setPage(totalPages), page === totalPages, <FiChevronsRight size={14} />)}
            </div>
          </div>
        </motion.div>
      </div>

      {viewReport && (
        <ReportViewer
          report={viewReport}
          onClose={() => setViewReport(null)}
          onShare={() => { setShareReport(viewReport); }}
        />
      )}

      {shareReport && (
        <ShareEmailModal
          report={shareReport}
          onClose={() => setShareReport(null)}
        />
      )}
    </motion.div>
  );
}
