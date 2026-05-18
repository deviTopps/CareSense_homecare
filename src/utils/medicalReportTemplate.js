import { getUser } from '../api';
import {
  buildAssessmentBlocks,
  renderAssessmentBlocksHtml,
} from './medicalReportAssessment';

export const REPORT_BRAND_GREEN = '#2d6a4f';
export const REPORT_BRAND_GREEN_DARK = '#1b4332';

export const REPORT_VIEWER_STYLES = `
  .reports-document--styled.medical-report {
    background: #ffffff;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 48px 56px 40px;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    font-size: 13px;
    line-height: 1.55;
    max-width: 794px;
    margin: 0 auto;
  }
  .medical-report .mr-header {
    text-align: center;
    margin-bottom: 28px;
  }
  .medical-report .mr-header__inner {
    display: inline-block;
    width: 100%;
    max-width: 520px;
    padding: 18px 0;
    border-top: 1px solid #c5c5c5;
    border-bottom: 1px solid #c5c5c5;
  }
  .medical-report .mr-logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .medical-report .mr-logo img {
    width: 52px;
    height: 52px;
    object-fit: contain;
  }
  .medical-report .mr-logo__heart {
    width: 48px;
    height: 48px;
    color: ${REPORT_BRAND_GREEN};
  }
  .medical-report .mr-agency-name {
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 26px;
    font-weight: 400;
    color: ${REPORT_BRAND_GREEN};
    margin: 0 0 6px;
    line-height: 1.2;
  }
  .medical-report .mr-agency-address {
    font-size: 11px;
    color: #6b6b6b;
    margin: 0;
    line-height: 1.5;
  }
  .medical-report .mr-doc-title {
    text-align: center;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #111111;
    margin: 28px 0 32px;
    text-transform: uppercase;
  }
  .medical-report .mr-block {
    margin-bottom: 26px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .medical-report .mr-section-title {
    font-size: 14px;
    font-weight: 700;
    color: ${REPORT_BRAND_GREEN};
    margin: 0 0 12px;
    text-align: left;
  }
  .medical-report .mr-info-grid {
    display: table;
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
  }
  .medical-report .mr-info-col {
    display: table-cell;
    width: 50%;
    vertical-align: top;
    padding-right: 24px;
  }
  .medical-report .mr-info-col:last-child {
    padding-right: 0;
    padding-left: 24px;
  }
  .medical-report .mr-info-line {
    margin: 0 0 8px;
    font-size: 13px;
    color: #1a1a1a;
    line-height: 1.5;
  }
  .medical-report .mr-info-line strong {
    font-weight: 700;
    color: #111111;
  }
  .medical-report .mr-body {
    margin: 0;
    font-size: 13px;
    color: #1a1a1a;
    line-height: 1.65;
    text-align: left;
  }
  .medical-report .mr-body ul {
    margin: 8px 0 0;
    padding-left: 20px;
  }
  .medical-report .mr-body li {
    margin-bottom: 6px;
  }
  .medical-report .mr-assessment__subsection {
    margin-bottom: 22px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e8e8e8;
  }
  .medical-report .mr-assessment__subsection:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  .medical-report .mr-assessment__subsection-title {
    font-size: 13px;
    font-weight: 700;
    color: ${REPORT_BRAND_GREEN};
    margin: 0 0 10px;
    letter-spacing: 0.02em;
  }
  .medical-report .mr-assessment__p {
    margin: 0;
    font-size: 13px;
    line-height: 1.65;
    color: #1a1a1a;
  }
  .medical-report .mr-assessment__list {
    margin: 0;
    padding-left: 20px;
  }
  .medical-report .mr-assessment__list li {
    margin-bottom: 6px;
    font-size: 13px;
    line-height: 1.55;
  }
  .medical-report .mr-assessment__kv-list {
    display: block;
  }
  .medical-report .mr-assessment__kv {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 0;
    border-bottom: 1px solid #eeeeee;
    font-size: 12.5px;
  }
  .medical-report .mr-assessment__kv:last-child {
    border-bottom: none;
  }
  .medical-report .mr-assessment__kv-label {
    font-weight: 700;
    color: #374151;
    flex: 0 0 42%;
  }
  .medical-report .mr-assessment__kv-value {
    text-align: right;
    color: #1a1a1a;
    flex: 1 1 auto;
  }
  .medical-report .mr-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 12px;
  }
  .medical-report .mr-table th,
  .medical-report .mr-table td {
    border: 1px solid #d4d4d4;
    padding: 7px 10px;
    text-align: left;
    vertical-align: top;
    word-break: break-word;
  }
  .medical-report .mr-table th {
    background: #f5f5f5;
    font-weight: 700;
    color: #333;
  }
  .medical-report .mr-footer {
    margin-top: 40px;
    padding-top: 20px;
    text-align: center;
    font-size: 11px;
    color: #777777;
    line-height: 1.7;
  }
  .medical-report .mr-footer p {
    margin: 0 0 4px;
  }
  .medical-report .mr-overall-summary {
    margin-bottom: 28px;
    padding: 18px 20px;
    border: 2px solid ${REPORT_BRAND_GREEN};
    border-radius: 10px;
    background: linear-gradient(180deg, #f1f8f4 0%, #e6f4ea 100%);
    box-shadow: 0 4px 14px rgba(45, 106, 79, 0.12);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .medical-report .mr-overall-summary__badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ffffff;
    background: ${REPORT_BRAND_GREEN};
    padding: 4px 12px;
    border-radius: 4px;
    margin-bottom: 10px;
  }
  .medical-report .mr-overall-summary__title {
    font-size: 16px;
    font-weight: 800;
    color: ${REPORT_BRAND_GREEN_DARK};
    margin: 0 0 10px;
    letter-spacing: 0.02em;
  }
  .medical-report .mr-overall-summary__text {
    font-size: 13.5px;
    line-height: 1.75;
    color: #1a1a1a;
    margin: 0;
    font-weight: 500;
  }
  .medical-report .mr-signature {
    display: table;
    width: 100%;
    margin-top: 32px;
    table-layout: fixed;
  }
  .medical-report .mr-signature__cell {
    display: table-cell;
    width: 50%;
    padding-top: 10px;
    border-top: 1px solid #cccccc;
    font-size: 11px;
    color: #444444;
    text-align: center;
  }
  .reports-viewer-body .medical-report {
    background: #ffffff !important;
    color: #1a1a1a !important;
  }
`;

export const REPORT_PRINT_STYLES = REPORT_VIEWER_STYLES + `
  @page { size: A4; margin: 12mm; }
  body { margin: 0; padding: 0; background: #fff; }
  .reports-document--styled.medical-report {
    max-width: 100%;
    padding: 0;
  }
`;

function fmtDate(raw) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
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

export function extractPatientGender(patient, info = {}, report = {}) {
  const candidates = [
    patient?.gender,
    patient?.Gender,
    patient?.sex,
    patient?.Sex,
    patient?.demographics?.gender,
    patient?.demographics?.sex,
    info?.gender,
    info?.sex,
    info?.patient_gender,
    info?.patient_sex,
    report?.gender,
    report?.patientGender,
    report?.patient?.gender,
    report?.patient?.Gender,
    report?.patient?.sex,
  ];
  for (const entry of candidates) {
    const normalized = normalizeGenderValue(entry);
    if (normalized) return normalized;
  }
  return '—';
}

function pickNonEmpty(...values) {
  for (const entry of values) {
    const text = String(entry ?? '').trim();
    if (text && text !== '—') return text;
  }
  return '';
}

export function enrichReportWithPatientProfile(report, patientProfile) {
  if (!report || !patientProfile || typeof patientProfile !== 'object') return report;
  const reportPatient = report.patient || {};
  const mergedPatient = {
    ...patientProfile,
    ...reportPatient,
    gender: pickNonEmpty(
      reportPatient.gender,
      reportPatient.Gender,
      reportPatient.sex,
      reportPatient.Sex,
      patientProfile.gender,
      patientProfile.Gender,
      patientProfile.sex,
      patientProfile.Sex,
    ),
    address: pickNonEmpty(
      reportPatient.residentialAddress,
      reportPatient.address,
      reportPatient.homeAddress,
      patientProfile.residentialAddress,
      patientProfile.address,
      patientProfile.homeAddress,
    ),
    phone: pickNonEmpty(
      reportPatient.phone,
      reportPatient.phoneNumber,
      reportPatient.contactPhone,
      patientProfile.phone,
      patientProfile.phoneNumber,
      patientProfile.contactPhone,
    ),
  };
  const info = mergedPatient?.aiMonthlyReport?.patient_information
    || reportPatient?.aiMonthlyReport?.patient_information
    || {};
  const gender = extractPatientGender(mergedPatient, info, {
    ...report,
    gender: pickNonEmpty(report.gender, mergedPatient.gender),
    address: pickNonEmpty(report.address, mergedPatient.address),
  });
  const address = extractPatientAddress(mergedPatient, info, {
    ...report,
    address: pickNonEmpty(report.address, mergedPatient.address),
  });
  return {
    ...report,
    patient: { ...mergedPatient, gender, address },
    gender,
    address,
  };
}

export function extractPatientAddress(patient, info = {}, report = {}) {
  const combinedStreet = [
    patient?.street,
    patient?.streetAddress,
    patient?.city,
    patient?.town,
  ].map((part) => String(part || '').trim()).filter(Boolean).join(', ');

  const candidates = [
    patient?.residentialAddress,
    patient?.residential_address,
    patient?.address,
    patient?.homeAddress,
    patient?.home_address,
    info?.address,
    info?.residential_address,
    info?.home_address,
    report?.address,
    report?.patientAddress,
    combinedStreet,
    patient?.region,
    patient?.location,
    patient?.gps,
    patient?.gpsAddress,
  ];

  for (const entry of candidates) {
    const text = String(entry || '').trim();
    if (text && text !== '—') return text;
  }
  return '—';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function extractAgencyLogoUrl(user) {
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
    // ignore
  }

  return '';
}

export function extractAgencyAddress(user) {
  const parts = [
    user?.agencyAddress,
    user?.agency?.address,
    user?.agency?.street,
    [user?.agency?.city, user?.agency?.region || user?.agency?.state].filter(Boolean).join(', '),
    user?.agency?.country,
  ].map((v) => String(v || '').trim()).filter(Boolean);

  if (parts.length) return parts.join(', ');
  return 'Licensed Homecare Provider';
}

export function extractAgencyContact(user) {
  const phone = String(
    user?.agencyPhone || user?.agency?.phone || user?.phone || '',
  ).trim();
  const email = String(
    user?.agencyEmail || user?.agency?.email || user?.email || '',
  ).trim();
  const website = String(
    user?.agencyWebsite || user?.agency?.website || '',
  ).trim();
  return { phone, email, website };
}

function cleanMarkdownLines(markdown) {
  const rawLines = String(markdown || '').split('\n').map((l) => l.trim());
  const cleaned = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    if (!line) continue;
    if (/^---\|/.test(line) || line === '---') continue;
    if (/^patient\s*id\s*:/i.test(line) || /\bpatient\s*id\b/i.test(line)) continue;
    if (/^key message$/i.test(line)) continue;
    if (/^(patient\s*information|patient\s*name|date\s*of\s*birth|primary\s*diagnosis|reporting\s*period|assigned\s*(caregiver|caregivers))\b/i.test(line)) continue;
    if (/^summary overview\b/i.test(line) || /^overall summary\b/i.test(line)) {
      let j = i + 1;
      while (j < rawLines.length && rawLines[j].trim() === '') j += 1;
      i = j;
      continue;
    }
    cleaned.push(line);
  }
  return cleaned;
}

function markdownToParagraphs(markdown) {
  const lines = cleanMarkdownLines(markdown);
  if (!lines.length) return '';
  return lines
    .map((line) => line.replace(/^\d+\.\s+/, '').replace(/^- /, '').trim())
    .filter(Boolean)
    .join(' ');
}

function extractSummaryFromMarkdown(markdown) {
  const lines = String(markdown || '').split('\n').map((l) => l.trim());
  let capturing = false;
  const parts = [];
  for (const line of lines) {
    if (/^summary overview\b/i.test(line) || /^overall summary\b/i.test(line)) {
      capturing = true;
      continue;
    }
    if (!capturing) continue;
    if (!line) {
      if (parts.length) break;
      continue;
    }
    if (/^\d+\.\s+/.test(line) && parts.length) break;
    if (/^(patient information|assessment|diagnosis|prescription|visit info)\b/i.test(line) && parts.length) break;
    parts.push(line.replace(/^- /, '').trim());
  }
  return parts.join(' ').trim();
}

export function resolveOverallSummary(report, patient, aiReport) {
  const p = patient || {};
  const candidates = [
    aiReport?.summary_overview,
    aiReport?.summary,
    aiReport?.overall_summary,
    report?.summaryOverview,
    report?.summary_overview,
    report?.summary,
    extractSummaryFromMarkdown(p.aiReportMarkdown || p.aiReportText),
  ];
  for (const entry of candidates) {
    const text = String(entry || '').trim();
    if (text) return text;
  }
  return '';
}

function pickNarrativeSections(report, patient, aiReport) {
  const p = patient || {};
  const info = aiReport?.patient_information || {};
  const overallSummary = resolveOverallSummary(report, patient, aiReport);
  const markdown = String(p.aiReportMarkdown || p.aiReportText || '').trim();
  const assessmentBlocks = buildAssessmentBlocks(report, p, aiReport);

  let assessment = '';
  if (!assessmentBlocks.length) {
    assessment = markdownToParagraphs(markdown)
      || String(p.medicalHistory || '').trim()
      || 'Patient assessed during the reporting period. See detailed notes below.';
  }

  const diagnosis = String(
    info.primary_diagnosis_or_condition || p.diagnosis || '',
  ).trim() || 'No new diagnosis recorded for this reporting period.';

  const meds = String(p.medications || '').trim();
  const recs = Array.isArray(aiReport?.recommendations) ? aiReport.recommendations.filter(Boolean) : [];
  const nextPlan = Array.isArray(aiReport?.next_month_plan) ? aiReport.next_month_plan.filter(Boolean) : [];
  let prescription = meds;
  if (recs.length) {
    prescription = prescription && prescription !== '—'
      ? `${prescription}. Recommendations: ${recs.join('; ')}`
      : recs.join(' ');
  }
  if (nextPlan.length) {
    prescription = prescription
      ? `${prescription} Next month: ${nextPlan.join('; ')}`
      : nextPlan.join(' ');
  }
  if (!prescription || prescription === '—') {
    prescription = 'No medication changes documented for this visit. Continue current care plan as directed.';
  }

  const extras = assessmentBlocks.length ? [] : [];

  return {
    overallSummary,
    assessment,
    assessmentBlocks,
    diagnosis,
    prescription,
    extras,
  };
}

export function buildMedicalReportModel(report, user = getUser()) {
  const patient = report?.patient || {};
  const aiReport = patient?.aiMonthlyReport && typeof patient.aiMonthlyReport === 'object'
    ? patient.aiMonthlyReport
    : null;
  const info = aiReport?.patient_information || {};
  const agencyName = user?.agencyName || user?.agency?.name || 'CareSense Homecare';
  const { phone, email, website } = extractAgencyContact(user);

  const patientName = info.patient_name || report.patientName || '—';
  const patientPhone = String(
    patient.phone || patient.phoneNumber || patient.mobile || patient.contactPhone || '—',
  ).trim() || '—';
  const patientAddress = extractPatientAddress(patient, info, report);
  const dob = info.date_of_birth || patient.dob || patient.dateOfBirth || '';
  const gender = extractPatientGender(patient, info, report);

  const doctorName = report.doctorName || report.nurseName || '—';
  const specialization = report.doctorFacility
    || (report.type && report.type !== 'Medical Report' ? report.type : 'Homecare')
    || 'General Practice';

  const narratives = pickNarrativeSections(report, patient, aiReport);

  return {
    agencyName,
    agencyAddress: extractAgencyAddress(user),
    agencyLogoUrl: extractAgencyLogoUrl(user),
    contactPhone: phone || '—',
    contactEmail: email || '—',
    contactWebsite: website,
    visit: {
      doctorName,
      specialization,
      visitDate: fmtDate(report.date),
    },
    patient: {
      fullName: patientName,
      phone: patientPhone,
      birthDate: fmtDate(dob),
      gender,
      address: patientAddress,
      reportingPeriod: info.reporting_period || '—',
      caregivers: (Array.isArray(info.assigned_caregivers) && info.assigned_caregivers.length)
        ? info.assigned_caregivers.map((e) => (typeof e === 'string' ? e : e?.name)).filter(Boolean).join(', ')
        : '—',
    },
    overallSummary: narratives.overallSummary,
    narratives,
    signature: {
      nurseName: report.nurseName || '—',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    },
  };
}

function heartLogoSvg() {
  return `<svg class="mr-logo__heart" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32 54s-18-11.2-18-24.5C14 19.8 19.5 14 26 14c4.2 0 8 2.2 10 5.7C38 16.2 41.8 14 46 14 52.5 14 58 19.8 58 29.5 58 42.8 32 54 32 54z" stroke="currentColor" stroke-width="2.2" fill="none"/>
    <path d="M32 48s-13-8.5-13-18.8C19 24.5 23 20 28 20c3.2 0 6 1.7 7.6 4.4C37.2 21.7 40 20 43 20 48 20 52 24.5 52 29.2 52 39.5 32 48 32 48z" stroke="currentColor" stroke-width="1.6" fill="none" opacity="0.55"/>
  </svg>`;
}

function infoLine(label, value) {
  return `<p class="mr-info-line"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || '—')}</p>`;
}

function formatDoctorName(name) {
  const value = String(name || '').trim();
  if (!value || value === '—') return '—';
  return /^dr\.?\s/i.test(value) ? value : `Dr. ${value}`;
}

function narrativeBlock(title, content, isHtml = false) {
  if (!content) return '';
  const body = isHtml
    ? `<div class="mr-body">${content}</div>`
    : `<p class="mr-body">${escapeHtml(content).replace(/\n/g, '<br/>')}</p>`;
  return `
    <section class="mr-block">
      <h3 class="mr-section-title">${escapeHtml(title)}</h3>
      ${body}
    </section>
  `;
}

function assessmentSectionHtml(assessment, assessmentBlocks) {
  const blocks = Array.isArray(assessmentBlocks) ? assessmentBlocks : [];
  const blocksHtml = renderAssessmentBlocksHtml(blocks);
  const intro = String(assessment || '').trim();

  if (!intro && !blocksHtml) {
    return narrativeBlock('Assessment', 'Patient assessed during the reporting period.');
  }

  const body = `
    ${intro ? `<p class="mr-assessment__p">${escapeHtml(intro)}</p>` : ''}
    ${blocksHtml}
  `;

  return `
    <section class="mr-block mr-assessment">
      <h3 class="mr-section-title">Assessment</h3>
      <div class="mr-body">${body}</div>
    </section>
  `;
}

function overallSummaryBlock(summaryText) {
  const text = String(summaryText || '').trim();
  if (!text) return '';
  return `
    <section class="mr-overall-summary" aria-label="Overall Summary">
      <span class="mr-overall-summary__badge">Important</span>
      <h3 class="mr-overall-summary__title">Overall Summary</h3>
      <p class="mr-overall-summary__text">${escapeHtml(text).replace(/\n/g, '<br/>')}</p>
    </section>
  `;
}

export function buildMedicalReportHtml(model) {
  const logoHtml = model.agencyLogoUrl
    ? `<img src="${escapeHtml(model.agencyLogoUrl)}" alt="" />`
    : heartLogoSvg();

  const footerLines = [
    'For inquiries and appointments, feel free to contact us.',
    [
      model.contactPhone !== '—' ? `phone: ${model.contactPhone}` : '',
      model.contactEmail !== '—' ? `email: ${model.contactEmail}` : '',
    ].filter(Boolean).join(', '),
    model.contactWebsite || '',
  ].filter(Boolean);

  const extrasHtml = (model.narratives.extras || [])
    .map((x) => narrativeBlock(x.title, x.bodyHtml || x.body, Boolean(x.bodyHtml)))
    .join('');

  return `
    <header class="mr-header">
      <div class="mr-header__inner">
        <div class="mr-logo">${logoHtml}</div>
        <h1 class="mr-agency-name">${escapeHtml(model.agencyName)}</h1>
        <p class="mr-agency-address">${escapeHtml(model.agencyAddress)}</p>
      </div>
      <h2 class="mr-doc-title">Medical Report</h2>
    </header>

    <section class="mr-block">
      <h3 class="mr-section-title">Visit Info</h3>
      <div class="mr-info-grid">
        <div class="mr-info-col">
          ${infoLine("Doctor's Name", formatDoctorName(model.visit.doctorName))}
          ${infoLine('Specialization', model.visit.specialization)}
        </div>
        <div class="mr-info-col">
          ${infoLine('Visit Date', model.visit.visitDate)}
        </div>
      </div>
    </section>

    <section class="mr-block">
      <h3 class="mr-section-title">Patient Info</h3>
      <div class="mr-info-grid">
        <div class="mr-info-col">
          ${infoLine('Full Name', model.patient.fullName)}
          ${infoLine('Birth Date', model.patient.birthDate)}
          ${infoLine('Gender', model.patient.gender)}
        </div>
        <div class="mr-info-col">
          ${infoLine('Phone', model.patient.phone)}
          ${infoLine('Address', model.patient.address)}
        </div>
      </div>
    </section>

    ${overallSummaryBlock(model.overallSummary || model.narratives?.overallSummary)}
    ${assessmentSectionHtml(model.narratives.assessment, model.narratives.assessmentBlocks)}
    ${narrativeBlock('Diagnosis', model.narratives.diagnosis)}
    ${narrativeBlock('Prescription', model.narratives.prescription)}
    ${extrasHtml}

    <div class="mr-signature">
      <div class="mr-signature__cell">Attending Nurse: ${escapeHtml(model.signature.nurseName)}</div>
      <div class="mr-signature__cell">Date: ${escapeHtml(model.signature.date)}</div>
    </div>

    <footer class="mr-footer">
      ${footerLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
      <p>Confidential medical document — ${escapeHtml(model.agencyName)}</p>
    </footer>
  `;
}
