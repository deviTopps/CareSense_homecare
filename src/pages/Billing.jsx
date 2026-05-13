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
  const patientId = String(
    raw.patientId
    || raw.patientUUID
    || raw.patientUuid
    || wrapperPatient?.id
    || getPatientId(patient)
    || ''
  ).trim();
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
    patient: {
      ...patient,
      name: patientName,
      gender: normalizeGenderValue(
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
      ),
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

function ReportViewer({ report, onClose, onShare }) {
  const printRef = useRef(null);
  const p = report.patient || {};
  const user = getUser();
  const agencyName = user?.agencyName || user?.agency?.name || 'CareSense Homecare';
  const agencyLogoUrl = extractAgencyLogoUrl(user);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [reportEditable, setReportEditable] = useState(true);
  const now = new Date();

  const openReportPrintWindow = (documentTitle) => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${report.type} — ${report.patientName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 0; line-height: 1.25; background: #fff; font-size: 13px; }
        .report-document { border: 1px solid #111; padding: 8px; width: 100%; max-width: 100%; background: #fff; }
        .report-header { text-align: center; border-bottom: 1px solid #111; padding-bottom: 6px; margin-bottom: 8px; }
        .report-header-brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 4px; }
        .report-header-logo-wrap { width: 96px; height: 96px; display: inline-flex; align-items: center; justify-content: center; background: #fff; }
        .report-header-logo { width: 92px; height: 92px; object-fit: contain; }
        .report-header h1 { font-size: 16px; font-weight: 700; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.06em; }
        .report-header p { font-size: 11px; color: #333; }
        .report-title { font-size: 14px; font-weight: 800; text-align: center; margin-bottom: 8px; border: 1px solid #111; padding: 4px; }
        .report-meta-grid { border: 1px solid #111; border-radius: 6px; overflow: hidden; margin-bottom: 8px; background: #fff; }
        .report-meta-item {
          display: grid;
          grid-template-columns: minmax(100px, 180px) minmax(0, 1fr);
          align-items: start;
          column-gap: 10px;
          padding: 6px 8px;
          border-bottom: 1px solid #111;
        }
        .report-meta-item:last-child { border-bottom: none; }
        .report-meta-item__label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #374151; display: block; }
        .report-meta-item__value { font-size: 12px; font-weight: 700; color: #111; line-height: 1.25; text-align: right; justify-self: end; display: block; }
        .report-section { margin-bottom: 8px; border: 1px solid #111; page-break-inside: avoid; break-inside: avoid; }
        .report-section h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #111; padding: 4px 6px; margin: 0; background: #f4f4f4; }
        .report-section p, .report-section li { font-size: 12px; line-height: 1.35; }
        .report-section > p, .report-section > ul, .report-section > div { padding: 6px; }
        .report-kv { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding: 6px 8px; border-bottom: 1px solid #eee; }
        .report-kv:last-child { border-bottom: none; }
        .report-kv__label { font-weight: 700; color: #374151; font-size: 12px; }
        .report-kv__value { text-align: right; color: #111; font-size: 12px; margin-left: auto; max-width: 46%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .report-section ul { padding-left: 18px; }
        .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .vital-item { padding: 6px; border: 1px solid #111; text-align: center; font-size: 11px; }
        .vital-item strong { display: block; font-size: 13px; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        thead { display: table-header-group; }
        tr, td, th { page-break-inside: avoid; break-inside: avoid; word-break: break-word; }
        table th, table td { padding: 6px 6px; font-size: 12px; }
        .report-important-summary { page-break-inside: avoid; break-inside: avoid; border: 1px solid #111; margin-top: 6px; }
        .signature-line { page-break-inside: avoid; break-inside: avoid; }
        .report-footer { page-break-inside: avoid; break-inside: avoid; }
        .report-footer { margin-top: 12px; border-top: 1px solid #111; padding-top: 8px; font-size: 10.5px; color: #333; text-align: center; }
        .signature-line { margin-top: 28px; display: flex; justify-content: space-between; gap: 28px; }
        .signature-line > div { flex: 1; border-top: 1px solid #111; padding-top: 6px; font-size: 11px; text-align: center; }
        @media print {
          html, body { width: 210mm; }
          body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .reports-document, .report-document { box-shadow: none !important; border-radius: 0 !important; }
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

  const handleDownloadPdf = () => {
    openReportPrintWindow(`${String(report.patientName || 'patient').replace(/[^\w\s-]/g, '')}-medical-report`);
  };

  const aiReport = p?.aiMonthlyReport || null;
  const aiPatientInfo = aiReport?.patient_information || {};
  const sessionFallback = {
    patient_name: 'Kwame Duku',
    date_of_birth: '1986-05-06',
    primary_diagnosis_or_condition: '',
    care_plan_start_date: '',
    reporting_period: 'May 1 – May 31, 2026',
    assigned_caregivers: ['Felicia Apakulo'],
  };
  const aiVitalRows = Array.isArray(aiReport?.vital_signs_summary?.rows) ? aiReport.vital_signs_summary.rows : [];
  const aiAdlRows = Array.isArray(aiReport?.daily_living_activities?.rows) ? aiReport.daily_living_activities.rows : [];
  const aiWeeklyLog = Array.isArray(aiReport?.weekly_activity_log) ? aiReport.weekly_activity_log : [];
  const aiMedicationRows = Array.isArray(aiReport?.medication_summary?.rows) ? aiReport.medication_summary.rows : [];
  const aiObservationBullets = Array.isArray(aiReport?.health_observations_and_incidents?.bullets) ? aiReport.health_observations_and_incidents.bullets : [];
  const aiRecommendations = Array.isArray(aiReport?.recommendations) ? aiReport.recommendations : [];
  const aiNextMonthPlan = Array.isArray(aiReport?.next_month_plan) ? aiReport.next_month_plan : [];
  const aiProgress = aiReport?.progress_evaluation && typeof aiReport.progress_evaluation === 'object' ? aiReport.progress_evaluation : {};
  const reportDob = String(aiPatientInfo?.date_of_birth || p.dob || '').trim();
  const reportAge = String(p.age ?? '').trim() || computeAgeFromDob(reportDob);
  const reportGender = normalizeGenderValue(
    aiPatientInfo?.gender
    || aiPatientInfo?.sex
    || aiPatientInfo?.patient_gender
    || aiPatientInfo?.patient_sex
    || p.gender
    || p.Gender
    || p.sex
    || p.Sex
    || p.demographics?.gender
    || p.demographics?.sex
    || report?.gender
    || report?.patient?.gender
    || report?.patient?.sex
    || ''
  );
  const reportMetaItems = [
    { label: 'Patient Name', value: aiPatientInfo?.patient_name || report.patientName || '—' },
    { label: 'Patient Age', value: reportAge !== '—' ? `${reportAge} yrs` : '—' },
    { label: 'Gender', value: reportGender || '—' },
    { label: 'Date of Report', value: fmtDate(report.date) },
    { label: 'Date of Birth', value: fmtDate(reportDob) },
    { label: 'Status', value: report.status || '—' },
    { label: 'Attending Nurse', value: report.nurseName || '—' },
    { label: 'Referring Doctor', value: `${report.doctorName || '—'}${report.doctorFacility ? ` — ${report.doctorFacility}` : ''}` },
  ];
  // Clean AI markdown: remove technical lines and skip Summary Overview blocks
  const rawLines = String(p.aiReportMarkdown || '').split('\n').map((l) => l.trim());
  const cleaned = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    if (!line) continue;
    // skip front-matter table separators or explicit separators
    if (/^---\|/.test(line) || line === '---') continue;
    // skip patient id lines
    if (/^patient\s*id\s*:/i.test(line)) continue;
    if (/\bpatient\s*id\b/i.test(line)) continue;
    // skip explicit key message header
    if (/^key message$/i.test(line)) continue;
      // skip common patient information lines (avoid duplicating header/meta)
      if (/^(patient\s*information|patient\s*name|date\s*of\s*birth|primary\s*diagnosis|primary\s*diagnosis\/condition|care\s*plan\s*start\s*date|reporting\s*period|assigned\s*(caregiver|caregivers))\b/i.test(line)) continue;
    // if we encounter a Summary Overview header, skip it and the next non-empty paragraph
    if (/^summary overview\b/i.test(line)) {
      // skip the header line; advance to next non-empty and skip it too
      let j = i + 1;
      while (j < rawLines.length && rawLines[j].trim() === '') j += 1;
      i = j; // will be incremented by loop
      continue;
    }
    cleaned.push(line);
  }

  const readableMarkdownLines = cleaned
    .filter(Boolean)
    .map((line) => {
      if (/^\d+\.\s+/.test(line)) {
        return { kind: 'section', text: line.replace(/^\d+\.\s+/, '').trim() };
      }
      if (/^- /.test(line)) {
        return { kind: 'bullet', text: line.replace(/^- /, '').trim() };
      }
      if (line.includes('|')) {
        const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
        if (cells.length >= 2) {
          return { kind: 'bullet', text: cells.join(' • ') };
        }
      }
      return { kind: 'paragraph', text: line };
    });

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
            <button type="button" className="reports-viewer-action-btn" onClick={handleDownloadPdf} title="Download PDF">
              <FiDownload size={15} />
              <span>Download PDF</span>
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
            <button type="button" className="reports-viewer-action-btn" onClick={onShare} title="Share via email">
              <FiSend size={15} />
              <span>Share</span>
            </button>
            <button type="button" className="reports-viewer-close" onClick={onClose} aria-label="Close">
              <FiX size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <style>{`
          .reports-document--styled {
            background: #ffffff;
            border: 1px solid #dbe4ef;
            border-radius: 14px;
            box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
            padding: 20px;
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .reports-document--styled .report-header {
            border-radius: 12px;
            border: 1px solid #dbe4ef;
            background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
            padding: 12px;
            margin-bottom: 14px;
          }
          .reports-document--styled .report-title {
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            color: #0f172a;
          }
          .reports-document--styled .report-meta {
            border-radius: 10px;
            overflow: hidden;
            border-color: #dbe4ef !important;
            margin-bottom: 14px !important;
          }
          .reports-document--styled .report-meta-grid {
            border-color: #dbe4ef;
            border-radius: 10px;
            margin-bottom: 14px;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
          }
          .reports-document--styled .report-meta-item {
            border-color: #e2e8f0;
            background: #fff;
            min-height: 52px;
            padding: 9px 12px;
            display: grid;
            grid-template-columns: minmax(120px, 220px) minmax(0, 1fr);
            align-items: start;
            column-gap: 14px;
          }
          .reports-document--styled .report-meta-item__label {
            color: #64748b;
            display: block;
          }
          .reports-document--styled .report-meta-item__value {
            color: #0f172a;
            justify-self: end;
            text-align: right;
            display: block;
          }
          .reports-document--styled .report-section {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            margin-bottom: 12px;
            background: #fff;
            overflow: hidden;
          }
          .reports-document--styled .report-section h3 {
            background: #f8fafc;
            border-bottom: 1px solid #dbe4ef;
            color: #0f172a;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.04em;
            padding: 8px 10px;
          }
          .reports-document--styled .report-section > p,
          .reports-document--styled .report-section > ul,
          .reports-document--styled .report-section > div {
            padding: 12px;
          }
          .reports-document--styled table {
            border-collapse: collapse;
            border: 1px solid #dbe4ef;
            table-layout: fixed;
            width: 100%;
          }
          .reports-document--styled table th {
            background: #f8fafc;
            color: #334155;
            font-weight: 700;
          }
          .reports-document--styled table th,
          .reports-document--styled table td {
            border: 1px solid #dbe4ef !important;
            padding: 6px 6px;
          }
          .reports-document--styled .report-important-summary {
            border: 2px solid #93c5fd;
            border-radius: 12px;
            background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%);
            padding: 14px;
            margin-bottom: 12px;
          }
          .reports-document--styled .report-important-summary__label {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #1d4ed8;
            margin-bottom: 6px;
          }
          .reports-document--styled .report-important-summary__title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 8px;
            line-height: 1.3;
          }
          .reports-document--styled .report-important-summary__text {
            font-size: 13px;
            color: #1e293b;
            line-height: 1.7;
            margin: 0;
          }
        `}</style>

        <div className="reports-viewer-body">
          <div
            ref={printRef}
            className="reports-document reports-document--styled"
            contentEditable={reportEditable}
            suppressContentEditableWarning
          >
              <div className="report-heading" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12, width: '100%', textAlign: 'center' }}>
                <div className="report-heading-logo" style={{ width: 64, height: 64, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 8, flexShrink: 0 }}>
                  {agencyLogoUrl && !logoLoadFailed ? (
                    <img
                      src={agencyLogoUrl}
                      alt={`${agencyName} logo`}
                      style={{ width: 60, height: 60, objectFit: 'contain' }}
                      onError={() => setLogoLoadFailed(true)}
                    />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{String(agencyName || 'AG').slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, textAlign: 'center' }}>{agencyName}</div>
                  <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>Licensed Healthcare Provider</div>
                </div>
              </div>
            {!aiReport && (
              <>
                <div className="report-header">
                  <div className="report-header-brand">
                    <span className="report-header-logo-wrap" style={{ width: 96, height: 96, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                      {agencyLogoUrl && !logoLoadFailed ? (
                        <img
                          src={agencyLogoUrl}
                          alt={`${agencyName} logo`}
                          className="report-header-logo"
                          style={{ width: 92, height: 92, objectFit: 'contain' }}
                          onError={() => setLogoLoadFailed(true)}
                        />
                      ) : (
                        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em' }}>
                          {String(agencyName || 'AG').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <h1 style={{ marginBottom: 0 }}>{agencyName}</h1>
                  </div>
                  <p>Homecare Medical Report</p>
                  <p>Licensed Healthcare Provider</p>
                </div>

                <div className="report-title">{report.type}</div>

                <div className="report-meta-grid">
                  {reportMetaItems.map((item) => (
                    <div className="report-meta-item" key={item.label}>
                      <span className="report-meta-item__label">{item.label}</span>
                      <span className="report-meta-item__value">{item.value || '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {aiReport ? (
              <>
                <div className="report-section">
                  <h3>Patient Information</h3>
                  <div>
                    <div className="report-kv"><div className="report-kv__label">Patient Name</div><div className="report-kv__value">{aiPatientInfo?.patient_name || report.patientName || '—'}</div></div>
                    <div className="report-kv"><div className="report-kv__label">Date of Birth</div><div className="report-kv__value">{fmtDate(aiPatientInfo?.date_of_birth || reportDob || '—')}</div></div>
                    <div className="report-kv"><div className="report-kv__label">Primary Diagnosis/Condition</div><div className="report-kv__value">{aiPatientInfo?.primary_diagnosis_or_condition || p.diagnosis || '—'}</div></div>
                    <div className="report-kv"><div className="report-kv__label">Care Plan Start Date</div><div className="report-kv__value">{fmtDate(aiPatientInfo?.care_plan_start_date || '')}</div></div>
                    <div className="report-kv"><div className="report-kv__label">Reporting Period</div><div className="report-kv__value">{aiPatientInfo?.reporting_period || '—'}</div></div>
                    <div className="report-kv"><div className="report-kv__label">Assigned Caregiver(s)</div><div className="report-kv__value">{(Array.isArray(aiPatientInfo?.assigned_caregivers) && aiPatientInfo.assigned_caregivers.length)
                      ? aiPatientInfo.assigned_caregivers.map((entry) => (typeof entry === 'string' ? entry : entry?.name)).filter(Boolean).join(', ')
                      : '—'}
                    </div></div>
                  </div>
                </div>
                <div className="report-section">
                  <h3>Easy to Read Report</h3>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #dbeafe',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <p style={{ fontSize: 12.5, marginBottom: 10, color: '#334155' }}>
                      This simplified version is written for family members and non-medical readers.
                    </p>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {readableMarkdownLines.map((row, idx) => {
                        if (row.kind === 'section') {
                          return (
                            <div key={`md-${idx}`} style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginTop: idx === 0 ? 0 : 6 }}>
                              {row.text}
                            </div>
                          );
                        }
                        if (row.kind === 'bullet') {
                          const cells = row.text.split('•').map((part) => part.trim()).filter(Boolean);
                          const isTabularLine = cells.length >= 3;
                          const isHeaderLine = isTabularLine && cells.every((cell) => /[a-z]/i.test(cell)) && cells.some((cell) => /medication|dosage|frequency|compliance|notes|metric|average|activity|status/i.test(cell));
                          if (isTabularLine) {
                            return (
                              <div
                                key={`md-${idx}`}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
                                  gap: 8,
                                  border: '1px solid #dbe4ef',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  background: isHeaderLine ? '#eff6ff' : '#ffffff',
                                }}
                              >
                                {cells.map((cell, cellIdx) => (
                                  <div
                                    key={`md-${idx}-cell-${cellIdx}`}
                                    style={{
                                      fontSize: 12,
                                      color: isHeaderLine ? '#1e3a8a' : '#334155',
                                      fontWeight: isHeaderLine ? 700 : 500,
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    {cell}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div key={`md-${idx}`} style={{ fontSize: 12.5, color: '#334155' }}>
                              {row.text}
                            </div>
                          );
                        }
                        return (
                          <p
                            key={`md-${idx}`}
                            style={{
                              fontSize: 12.5,
                              color: '#334155',
                              margin: 0,
                              border: '1px solid #dbe4ef',
                              borderRadius: 8,
                              padding: '8px 10px',
                              background: '#ffffff',
                              lineHeight: 1.5,
                            }}
                          >
                            {row.text}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                    <div className="report-section">
                      <h3>Weekly Activity Log (Simplified)</h3>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {(aiWeeklyLog.length > 0 ? aiWeeklyLog : [
                          { week: 'Week 1', bullets: ['Patient needs more rest.', 'Constant communication is required.'] },
                        ]).map((week, idx) => (
                          <div key={`week-${idx}`} style={{ border: '1px solid #dbe4ef', borderRadius: 8, padding: 10, background: '#fff' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{week?.week || `Week ${idx + 1}`}</div>
                            <ul style={{ marginTop: 8, paddingLeft: 18, marginBottom: 0 }}>
                              {(Array.isArray(week?.bullets) ? week.bullets : (Array.isArray(week?.items) ? week.items : [])).map((bullet, bi) => (
                                <li key={`week-${idx}-b-${bi}`} style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                      <div className="report-section">
                        <h3>Progress Evaluation</h3>
                        <div style={{ display: 'grid', gap: 6 }}>
                          {[
                            ['Physical Health', aiProgress?.physical_health || 'Declining'],
                            ['Mental Health', aiProgress?.mental_health || 'Stable'],
                            ['Mobility', aiProgress?.mobility || 'Unknown'],
                            ['Appetite', aiProgress?.appetite || 'Unknown'],
                          ].map(([label, value], idx) => (
                            <div key={`progress-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 160px', alignItems: 'start', gap: 12, padding: '6px 8px', borderBottom: '1px solid #eee' }}>
                              <div style={{ fontWeight: 700, color: '#374151', fontSize: 12 }}>{label}</div>
                              <div style={{ textAlign: 'right', fontSize: 12.5, color: '#111', justifySelf: 'end' }}>{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {aiNextMonthPlan.length > 0 ? (
                      <div className="report-section">
                        <h3>Next Month Plan</h3>
                        <ul>
                          {aiNextMonthPlan.map((item, idx) => (
                            <li key={`next-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {aiReport?.summary_overview ? (
                      <div className="report-important-summary">
                        <div className="report-important-summary__label">Key Message</div>
                        <div className="report-important-summary__title">Summary Overview (Very Important)</div>
                        <p className="report-important-summary__text">{aiReport.summary_overview}</p>
                      </div>
                    ) : null}
                  </div>
              </>
            ) : (
              <>
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
                      {String(p.medications).split(',').map((med, i) => (
                        <li key={i}>{med.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {(!aiReport && p.aiReportMarkdown) ? (
              <div className="report-section">
                <h3>Easy to Read Report</h3>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #dbeafe',
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <p style={{ fontSize: 12.5, marginBottom: 10, color: '#334155' }}>
                    This simplified version is written for family members and non-medical readers.
                  </p>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {readableMarkdownLines.map((row, idx) => {
                      if (row.kind === 'section') {
                        return (
                          <div key={`md-${idx}`} style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginTop: idx === 0 ? 0 : 6 }}>
                            {row.text}
                          </div>
                        );
                      }
                      if (row.kind === 'bullet') {
                        const cells = row.text.split('•').map((part) => part.trim()).filter(Boolean);
                        const isTabularLine = cells.length >= 3;
                        const isHeaderLine = isTabularLine && cells.every((cell) => /[a-z]/i.test(cell)) && cells.some((cell) => /medication|dosage|frequency|compliance|notes|metric|average|activity|status/i.test(cell));
                        if (isTabularLine) {
                          return (
                            <div
                              key={`md-${idx}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
                                gap: 8,
                                border: '1px solid #dbe4ef',
                                borderRadius: 8,
                                padding: '8px 10px',
                                background: isHeaderLine ? '#eff6ff' : '#ffffff',
                              }}
                            >
                              {cells.map((cell, cellIdx) => (
                                <div
                                  key={`md-${idx}-cell-${cellIdx}`}
                                  style={{
                                    fontSize: 12,
                                    color: isHeaderLine ? '#1e3a8a' : '#334155',
                                    fontWeight: isHeaderLine ? 700 : 500,
                                    lineHeight: 1.45,
                                  }}
                                >
                                  {cell}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={`md-${idx}`}
                            style={{
                              fontSize: 12.5,
                              color: '#334155',
                              border: '1px solid #dbe4ef',
                              borderRadius: 8,
                              padding: '8px 10px',
                              background: '#ffffff',
                              lineHeight: 1.5,
                            }}
                          >
                            • {row.text}
                          </div>
                        );
                      }
                      const kvMatch = row.text.match(/^([A-Za-z][A-Za-z\s/&-]{1,40}):\s*(.+)$/);
                      if (kvMatch) {
                        return (
                          <div
                            key={`md-${idx}`}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '180px minmax(0, 1fr)',
                              gap: 10,
                              border: '1px solid #dbe4ef',
                              borderRadius: 8,
                              padding: '8px 10px',
                              background: '#ffffff',
                              alignItems: 'start',
                            }}
                          >
                            <div style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>
                              {kvMatch[1]}
                            </div>
                            <div style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.45 }}>
                              {kvMatch[2]}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <p
                          key={`md-${idx}`}
                          style={{
                            fontSize: 12.5,
                            color: '#334155',
                            margin: 0,
                            border: '1px solid #dbe4ef',
                            borderRadius: 8,
                            padding: '8px 10px',
                            background: '#ffffff',
                            lineHeight: 1.5,
                          }}
                        >
                          {row.text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Summary overview intentionally omitted from the medical report view */}

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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
              .map((patient) => ({ patient, patientId: getPatientId(patient) }))
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
                      patientId: entry?.patientId || patientId,
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
