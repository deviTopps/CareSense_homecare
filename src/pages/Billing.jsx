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
import { apiFetch, getUser, shareMedicalReportByEmail } from '../api';
import { extractApiPatientId, fetchAllPatients, resolveMedicalReportPatientId } from '../utils/patients';
import { buildMedicalReportPdfFile, downloadPdfFile, REPORT_PRINT_STYLES } from '../utils/medicalReportPdf';
import MedicalReportDocument from '../components/MedicalReportDocument';
import { enrichReportWithPatientProfile } from '../utils/medicalReportTemplate';

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

function computeAgeFromDob(dobValue) {
  const raw = String(dobValue || '').trim();
  if (!raw) return '—';
  const dob = new Date(raw);
  if (Number.isNaN(dob.getTime())) return '—';
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age -= 1;
  return Number.isFinite(age) && age >= 0 ? String(age) : '—';
}

function normalizeGenderValue(rawValue) {
  const value = String(rawValue ?? '').trim();
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower === 'm' || lower === 'male') return 'Male';
  if (lower === 'f' || lower === 'female') return 'Female';
  if (lower === 'other' || lower === 'non-binary' || lower === 'nonbinary') return 'Other';
  return value.charAt(0).toUpperCase() + value.slice(1);
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

function extractAgencyLogoUrl(user) {
  const directCandidates = [
    user?.agencyLogoUrl,
    user?.agencyLogo,
    user?.logoUrl,
    user?.logo,
    user?.agency?.logoUrl,
    user?.agency?.logo,
    user?.agency?.brandLogoUrl,
    user?.agencyLogoAsset?.url,
    user?.agencyLogoAsset?.previewDataUrl,
    user?.agencyLogoAsset?.link?.url,
    user?.agency?.logo?.url,
    user?.agency?.logo?.link?.url,
  ];

  for (const value of directCandidates) {
    const url = String(value || '').trim();
    if (url) return url;
  }

  try {
    const raw = localStorage.getItem('accountSettings.agencyLogo');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const storedCandidates = [
      parsed?.previewUrl,
      parsed?.url,
      parsed?.link?.url,
      parsed?.asset?.url,
      parsed?.asset?.link?.url,
    ];
    for (const value of storedCandidates) {
      const url = String(value || '').trim();
      if (url) return url;
    }
  } catch {
  }

  return '';
}

function extractMedicalReportArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === 'object' && (payload.data.report || payload.data.reportMarkdown || payload.data.patient)) return [payload.data];
  if (Array.isArray(payload?.data?.reports)) return payload.data.reports;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload?.report && typeof payload.report === 'object') return [payload.report];
  if (payload && typeof payload === 'object' && (payload.report || payload.reportMarkdown || payload.patient)) return [payload];
  if (payload?.data?.report && typeof payload.data.report === 'object') return [payload.data.report];
  return [];
}

function normalizeMedicalReport(rawReport, index) {
  const raw = rawReport && typeof rawReport === 'object' ? rawReport : {};
  const isStructuredReport = Boolean(
    raw?.patient_information
    || raw?.summary_overview
    || raw?.vital_signs_summary
    || raw?.medication_summary,
  );
  const structuredReport = isStructuredReport
    ? raw
    : ((raw.report && typeof raw.report === 'object') ? raw.report : null);
  const wrapperPatient = (raw.patient && typeof raw.patient === 'object') ? raw.patient : {};
  const patient = (wrapperPatient && Object.keys(wrapperPatient).length > 0)
    ? wrapperPatient
    : ((raw.patientData && typeof raw.patientData === 'object') ? raw.patientData : {});
  const patientNameFromStructured = String(
    structuredReport?.patient_information?.patient_name
    || `${wrapperPatient?.firstName || ''} ${wrapperPatient?.lastName || ''}`.trim()
    || '',
  ).trim();
  const assignedCaregiverNames = Array.isArray(structuredReport?.patient_information?.assigned_caregivers)
    ? structuredReport.patient_information.assigned_caregivers
      .map((entry) => {
        if (!entry) return '';
        if (typeof entry === 'string') return entry.trim();
        return String(entry?.name || `${entry?.firstName || ''} ${entry?.lastName || ''}`).trim();
      })
      .filter(Boolean)
    : [];
  const patientId = extractApiPatientId(raw)
    || extractApiPatientId({ patient: wrapperPatient })
    || extractApiPatientId({ patient });
  const patientName = String(
    raw.patientName
    || raw.name
    || patientNameFromStructured
    || getPatientName(patient)
    || '—'
  ).trim() || '—';
  const reportId = String(
    raw.reportId
    || raw.id
    || raw._id
    || (raw.month ? `RPT-${patientId || 'patient'}-${raw.month}` : '')
    || `${patientId || 'patient'}-report-${index + 1}`
  ).trim();
  const type = String(
    raw.type
    || raw.reportType
    || raw.category
    || structuredReport?.title
    || 'Medical Report'
  ).trim() || 'Medical Report';
  const date = raw.generatedAt
    || raw.createdAt
    || raw.updatedAt
    || raw.date
    || (raw.month ? `${raw.month}-01` : '')
    || new Date().toISOString();
  const status = String(raw.status || 'Final').trim() || 'Final';
  const nurseName = String(
    raw.nurseName
    || raw.generatedBy
    || (assignedCaregiverNames.length > 0 ? assignedCaregiverNames.join(', ') : '')
    || (typeof patient.nurse === 'string' ? patient.nurse : getPatientName(patient.nurse))
    || '—'
  ).trim() || '—';
  const doctorName = String(
    raw.doctorName
    || (typeof patient.doctor === 'object' ? patient.doctor?.name : patient.doctor)
    || '—'
  ).trim() || '—';
  const doctorFacility = String(
    raw.doctorFacility
    || (typeof patient.doctor === 'object' ? patient.doctor?.facility : '')
    || ''
  ).trim();
  const reportBody = String(
    raw.reportMarkdown
    || raw.markdown
    || raw.summary
    || raw.content
    || raw.message
    || '',
  ).trim();

  const resolvedGender = normalizeGenderValue(
    patient?.gender
    || patient?.Gender
    || patient?.sex
    || patient?.Sex
    || patient?.demographics?.gender
    || patient?.demographics?.sex
    || raw?.gender
    || raw?.Gender
    || raw?.sex
    || raw?.Sex
    || structuredReport?.patient_information?.gender
    || structuredReport?.patient_information?.sex
    || structuredReport?.patient_information?.patient_gender
    || structuredReport?.patient_information?.patient_sex
    || ''
  );
  const resolvedAddress = String(
    patient?.residentialAddress
    || patient?.address
    || patient?.homeAddress
    || structuredReport?.patient_information?.address
    || ''
  ).trim();

  return {
    reportId,
    patientId,
    patientName,
    type,
    date,
    status,
    nurseName,
    doctorName,
    doctorFacility,
    gender: resolvedGender,
    address: resolvedAddress,
    patient: {
      ...patient,
      name: patientName,
      gender: resolvedGender,
      address: resolvedAddress,
      residentialAddress: patient?.residentialAddress || resolvedAddress,
      diagnosis: patient?.diagnosis || raw?.diagnosis || '—',
      medicalHistory: patient?.medicalHistory || raw?.medicalHistory || '',
      medications: patient?.medications || raw?.medications || '',
      vitals: patient?.vitals || raw?.vitals || {},
      aiReportText: reportBody,
      aiMonthlyReport: structuredReport,
      aiReportMarkdown: String(raw?.reportMarkdown || raw?.markdown || '').trim(),
      aiReportMonth: String(raw?.month || '').trim(),
    },
  };
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

function ReportViewer({ report, onClose, onShare, onCapture }) {
  const printRef = useRef(null);
  const [reportEditable, setReportEditable] = useState(!onCapture);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    if (!onCapture) return undefined;
    let cancelled = false;

    const captureReportHtml = async () => {
      await new Promise((resolve) => { setTimeout(resolve, 80); });
      const root = printRef.current;
      if (!root || cancelled) return;

      const images = Array.from(root.querySelectorAll('img'));
      await Promise.all(images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      }));

      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      if (!cancelled && printRef.current) {
        onCapture(printRef.current.outerHTML);
      }
    };

    captureReportHtml();
    return () => {
      cancelled = true;
    };
  }, [onCapture, report]);

  const openReportPrintWindow = (documentTitle) => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${report.type} — ${report.patientName}</title>
      <style>
        ${REPORT_PRINT_STYLES}
        @media print {
          html, body { width: 210mm; }
          body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .reports-document--styled.medical-report { box-shadow: none !important; border: none !important; }
        }
      </style></head><body>${content.innerHTML}
      <script>
        document.title = ${JSON.stringify(documentTitle)};
        window.focus();
        setTimeout(function () { window.print(); }, 120);
      <\/script>
      </body></html>
    `);
    win.document.close();
  };

  const handlePrint = () => {
    openReportPrintWindow(`${report.type} — ${report.patientName}`);
  };

  const handleDownloadPdf = async () => {
    if (pdfDownloading) return;
    setPdfDownloading(true);
    try {
      const attachmentHtml = printRef.current?.outerHTML || '';
      const file = await buildMedicalReportPdfFile(report, { attachmentHtml });
      downloadPdfFile(file);
    } catch (pdfError) {
      console.error(pdfError);
      openReportPrintWindow(`${String(report.patientName || 'patient').replace(/[^\w\s-]/g, '')}-medical-report`);
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <div className="reports-viewer-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="reports-viewer-toolbar">
          <div className="reports-viewer-toolbar__left">
            <FiFileText size={18} />
            <span>{report.type}</span>
          </div>
          <div className="reports-viewer-toolbar__actions">
            <button
              type="button"
              className="reports-viewer-action-btn"
              onClick={handleDownloadPdf}
              title="Download PDF"
              disabled={pdfDownloading}
            >
              <FiDownload size={15} />
              <span>{pdfDownloading ? 'Generating…' : 'Download PDF'}</span>
            </button>
            <button type="button" className="reports-viewer-action-btn" onClick={handlePrint} title="Print report">
              <FiPrinter size={15} />
              <span>Print</span>
            </button>
            <button
              type="button"
              className="reports-viewer-action-btn"
              onClick={() => setReportEditable((prev) => !prev)}
              title={reportEditable ? 'Lock editing' : 'Enable editing'}
            >
              <span>{reportEditable ? 'Lock Edit' : 'Edit Report'}</span>
            </button>
            <button
              type="button"
              className="reports-viewer-action-btn"
              onClick={() => onShare?.(printRef.current?.outerHTML || '')}
              title="Share via email"
            >
              <FiSend size={15} />
              <span>Share</span>
            </button>
            <button type="button" className="reports-viewer-close" onClick={onClose} aria-label="Close">
              <FiX size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="reports-viewer-body">
          <MedicalReportDocument
            report={report}
            innerRef={printRef}
            contentEditable={reportEditable}
          />
        </div>
      </div>
    </div>
  );
}

function ShareEmailModal({ report, attachmentHtml, onClose }) {
  const defaultSubject = `${report.type} — ${report.patientName}`;
  const defaultBody = `Please find attached the ${report.type} for ${report.patientName}.`;
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentLoading, setAttachmentLoading] = useState(true);
  const [attachmentError, setAttachmentError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!String(attachmentHtml || '').trim()) {
      setAttachmentLoading(true);
      setAttachmentError('');
      setAttachmentFile(null);
      return undefined;
    }

    let cancelled = false;
    setAttachmentLoading(true);
    setAttachmentError('');
    setAttachmentFile(null);

    buildMedicalReportPdfFile(report, { attachmentHtml })
      .then((file) => {
        if (!cancelled) {
          setAttachmentFile(file);
          setAttachmentLoading(false);
        }
      })
      .catch((pdfError) => {
        if (!cancelled) {
          setAttachmentError(pdfError?.message || 'Unable to generate PDF attachment.');
          setAttachmentLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [report, attachmentHtml]);

  const handleSend = async () => {
    setError('');
    const toEmail = recipientEmail.trim();
    const emailSubject = subject.trim();
    const emailBody = body.trim();
    const patientId = resolveMedicalReportPatientId(report);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      setError('Please enter a valid external recipient email address.');
      return;
    }
    if (!emailSubject) {
      setError('Please enter an email subject.');
      return;
    }
    if (!emailBody) {
      setError('Please enter an email message.');
      return;
    }
    if (!patientId) {
      setError('Patient ID is missing for this report.');
      return;
    }
    if (attachmentLoading) {
      setError('PDF attachment is still being generated. Please wait a moment.');
      return;
    }
    if (attachmentError) {
      setError(attachmentError);
      return;
    }
    if (!attachmentFile) {
      setError('Please attach a report PDF to send.');
      return;
    }

    setSending(true);
    try {
      const { response, payload } = await shareMedicalReportByEmail({
        email: toEmail,
        subject: emailSubject,
        body: emailBody,
        patientId,
        attachmentFile,
      });

      if (!response?.ok) {
        const apiError = String(payload?.message || payload?.error || '').trim();
        if (response?.status === 404) {
          throw new Error(
            apiError
            || 'Medical report share is not available on the server. Ensure POST /ai/medical-report/share is deployed.',
          );
        }
        throw new Error(apiError || 'Unable to send medical report email.');
      }
      setSent(true);
    } catch (sendError) {
      setError(sendError?.message || 'Unable to send medical report email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-modal-overlay" role="presentation" onClick={onClose} style={{ zIndex: 10001 }}>
      <div className="app-modal-dialog app-modal-dialog--md" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
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
                The {report.type} for <strong>{report.patientName}</strong> has been sent to <strong>{recipientEmail}</strong>.
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 6 }}>
                  External recipient email *
                </label>
                <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 8px', lineHeight: 1.45 }}>
                  Enter any email address outside your system (e.g. doctor, hospital, or family member).
                </p>
                <input
                  type="email"
                  name="medical-report-recipient-email"
                  className="form-control form-control-kh workforce-form-input"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 6 }}>Subject *</label>
                <input
                  type="text"
                  className="form-control form-control-kh workforce-form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Medical report for patient"
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 6 }}>Message *</label>
                <textarea
                  className="form-control form-control-kh workforce-form-input"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 6 }}>Attachment (PDF) *</label>
                {!attachmentHtml?.trim() ? (
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Preparing report layout for PDF…</p>
                ) : attachmentLoading ? (
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Generating PDF from medical report…</p>
                ) : attachmentError ? (
                  <p style={{ fontSize: 12, color: '#b91c1c', margin: 0 }}>{attachmentError}</p>
                ) : attachmentFile ? (
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                    Attached: <strong>{attachmentFile.name}</strong> ({Math.max(1, Math.round(attachmentFile.size / 1024))} KB)
                  </p>
                ) : null}
                <input
                  type="file"
                  className="form-control form-control-kh workforce-form-input"
                  accept=".pdf,application/pdf"
                  style={{ marginTop: 10 }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                      setAttachmentError('Please choose a PDF file.');
                      setAttachmentFile(null);
                      return;
                    }
                    setAttachmentError('');
                    setAttachmentFile(file || null);
                  }}
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
            <button type="button" className="app-modal-dialog__btn-cancel" onClick={onClose} disabled={sending}>Cancel</button>
            <button type="button" className="app-modal-dialog__btn-primary" disabled={sending || attachmentLoading || !attachmentHtml?.trim()} onClick={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [patientFilter, setPatientFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [viewReport, setViewReport] = useState(null);
  const [shareReport, setShareReport] = useState(null);
  const [shareAttachmentHtml, setShareAttachmentHtml] = useState('');
  const [patientProfilesById, setPatientProfilesById] = useState({});

  const enrichReport = useCallback((report) => {
    const patientId = String(report?.patientId || extractApiPatientId(report) || '').trim();
    const profile = patientProfilesById[patientId];
    return enrichReportWithPatientProfile(report, profile);
  }, [patientProfilesById]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError('');
        let loadedReports = [];
        let shouldFallbackToPatientRequests = false;

        const response = await apiFetch('/ai/medical-report', { method: 'GET', quiet: true });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          loadedReports = extractMedicalReportArray(payload)
            .map((entry, index) => normalizeMedicalReport(entry, index))
            .filter((entry) => entry?.reportId);
        } else {
          const message = String(payload?.message || payload?.error || '').toLowerCase();
          shouldFallbackToPatientRequests = response.status === 404 || response.status === 405 || message.includes('not found');
          if (!shouldFallbackToPatientRequests) {
            throw new Error(payload?.message || payload?.error || 'Unable to load generated medical reports.');
          }
        }

        if (shouldFallbackToPatientRequests) {
          const patients = await fetchAllPatients();
          const patientReports = await Promise.allSettled(
            (Array.isArray(patients) ? patients : [])
              .map((patient) => ({ patient, patientId: extractApiPatientId(patient) }))
              .filter(({ patientId }) => Boolean(patientId))
              .map(async ({ patient, patientId }) => {
                const reportResponse = await apiFetch('/ai/medical-report', {
                  method: 'POST',
                  body: JSON.stringify({ patientId }),
                  quiet: true,
                });
                const reportPayload = await reportResponse.json().catch(() => ({}));
                if (!reportResponse.ok) return [];

                const extracted = extractMedicalReportArray(reportPayload);
                if (!extracted.length && reportPayload && typeof reportPayload === 'object') {
                  extracted.push(reportPayload);
                }

                return extracted
                  .map((entry, index) => normalizeMedicalReport(
                    {
                      ...entry,
                      patient: entry?.patient || patient,
                      patientId: extractApiPatientId(entry) || extractApiPatientId({ patient: entry?.patient || patient }) || patientId,
                      patientName: entry?.patientName || getPatientName(patient),
                    },
                    index,
                  ))
                  .filter((entry) => entry?.reportId);
              }),
          );

          loadedReports = patientReports
            .filter((result) => result.status === 'fulfilled')
            .flatMap((result) => result.value || []);
        }

        const uniqueByReportId = Array.from(
          new Map(loadedReports.map((entry) => [String(entry.reportId), entry])).values(),
        );

        if (!cancelled) setReports(uniqueByReportId);

        try {
          const patients = await fetchAllPatients();
          const profileMap = {};
          (Array.isArray(patients) ? patients : []).forEach((patient) => {
            const id = extractApiPatientId(patient);
            if (id) profileMap[id] = patient;
          });
          if (!cancelled) setPatientProfilesById(profileMap);
        } catch {
          if (!cancelled) setPatientProfilesById({});
        }
      } catch (error) {
        if (!cancelled) {
          setReports([]);
          setLoadError(error?.message || 'Unable to load generated medical reports.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [reports]);

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
                {!loading && loadError && (
                  <tr><td colSpan={7} className="text-center py-4" style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{loadError}</td></tr>
                )}
                {!loading && paged.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>
                    {allReports.length === 0 ? 'No reports generated yet.' : 'No reports match your filters.'}
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
                          onClick={(e) => { e.stopPropagation(); setShareAttachmentHtml(''); setShareReport(r); }}
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
          report={enrichReport(viewReport)}
          onClose={() => setViewReport(null)}
          onShare={(html) => {
            setShareAttachmentHtml(html || '');
            setShareReport(enrichReport(viewReport));
          }}
        />
      )}

      {shareReport && !shareAttachmentHtml && (
        <div
          className="report-viewer-capture-host"
          aria-hidden
          style={{
            position: 'fixed',
            left: -10000,
            top: 0,
            width: 794,
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <ReportViewer
            report={shareReport}
            onClose={() => {}}
            onCapture={(html) => setShareAttachmentHtml(html || '')}
          />
        </div>
      )}

      {shareReport && (
        <ShareEmailModal
          report={shareReport}
          attachmentHtml={shareAttachmentHtml}
          onClose={() => { setShareReport(null); setShareAttachmentHtml(''); }}
        />
      )}
    </motion.div>
  );
}
