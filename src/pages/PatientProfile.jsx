import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Fragment, useState, useRef, useEffect, useCallback, useMemo, useTransition, createContext, useContext } from 'react';
import { motion } from 'motion/react';
import {
  FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar,
  FiUser, FiHeart, FiActivity, FiShield, FiFileText, FiEdit2,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiThermometer, FiClipboard,
  FiClock, FiPlus, FiX, FiSend, FiRefreshCw,
  FiSearch, FiBell, FiChevronDown, FiChevronRight, FiBarChart2,
  FiTrash2, FiGrid, FiMoreHorizontal,
} from '../icons/hugeicons-feather';
import compressImage from '../utils/compressImage';
import {
  coerceVitalsToNumbers,
  getVitalFieldRisksFromRow,
  riskColor,
  vitalMetricsCheck,
  VITAL_RISK_COLORS,
} from '../utils/vitalMetricsCheck';
import { API_BASE, apiFetch, getToken, getUser } from '../api';
import {
  collectPatientAssignmentIds,
  extractApiPatientId,
  extractMongoObjectId,
  isLikelyMongoObjectId,
  isPatientUuid,
  isUuidV4ish,
  resolveMongoIdFromCandidates,
  resolvePatientMutationId,
} from '../utils/patients';
import { TablePageLoaderPanel } from '../components/TablePageLoader';
import PatientBillingTab from '../components/PatientBillingTab';
import { resolvePatientBillingRouteId } from '../utils/patientBilling';
import { invalidateMedicalReportsCache } from '../utils/medicalReports';
import { findAdmissionDraftForPatient } from '../utils/admissionDrafts';
import { ADMISSION_SECTION_COUNT } from '../utils/admissionResume';
import {
  admissionMedicationTextToRecords,
  collectCachedAdmissionMedicationTexts,
  extractMedicationTextFromPatientRaw,
  splitAdmissionMedicationText,
} from '../utils/admissionMedications';
import {
  buildDailyCarePlanChecklistPath,
  fetchPatientCompletedDailyCarePlans,
  listRecentIsoDates,
  parseDailyChecklistResponsePayload,
} from '../utils/carePlanChecklist';
import { extractIncidentImages } from '../utils/alertMapping';
import IncidentImagesSection from '../components/IncidentImagesSection';
import './PatientProfile.css';

const DEFAULT_PROFILE_PLACEHOLDER = '/images/default-profile-avatar.svg';

/* ── Patient data ── */
const patientsData = [
  {
    id: 'P-1001', name: 'Kwame Boateng', preferredName: 'Kwame', age: 72, gender: 'Male', dob: '1954-03-12',
    diagnosis: 'Hypertension, Type 2 Diabetes', phone: '+233 24 111 2222', email: 'kwame.b@email.com',
    address: '14 Osu Badu St, Accra', gps: 'GA-045-1234', region: 'Accra',
    nurse: 'Efua Mensah', nursePin: 'RN-0042',
    emergency: { name: 'Ama Boateng', relationship: 'Wife', phone: '+233 20 333 4444' },
    doctor: { name: 'Dr. Kwesi Asare', facility: 'Ridge Hospital', phone: '+233 30 278 5678' },
    status: 'active', enrolled: '2024-06-01', regNo: 'KH-2024-001',
    cultural: 'Christian — prefers prayer before meals',
    handbookGiven: true,
    infection: { riskPlan: true },
    diabetes: { has: true, carePlan: true, stockings: false },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: true },
    pain: { present: true, analgesia: 'Paracetamol 500mg', location: 'Lower back', score: 1 },
    sleep: { nightWake: true, sedation: false, sleepsWell: true, bestPosition: 'Left side', wakeTime: '06:00' },
    nutrition: { allergies: false, specialDiet: true, dietType: 'Diabetic', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: true, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: false, depression: false, anxiety: false, dementia: false },
    skin: { openWounds: false, pressureUlcer: false },
    mobility: { independent: true, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '138/88', sugar: '7.2 mmol/L', resp: '18', spo2: '97%', pulse: '78', temp: '36.6°C', weight: '82 kg', urinalysis: 'Normal' },
    medications: 'Metformin 500mg BD, Amlodipine 5mg OD, Aspirin 75mg OD',
    communication: { needs: false, hearing: false, speech: false, visual: true, understanding: false },
    medicalHistory: 'Appendectomy (1998), Knee replacement (2018)',
  },
  {
    id: 'P-1002', name: 'Abena Osei', preferredName: 'Abena', age: 65, gender: 'Female', dob: '1961-05-22',
    diagnosis: 'Post-surgical wound care', phone: '+233 20 555 6666', email: 'abena.osei@email.com',
    address: '7 Adum Road, Kumasi', gps: 'AK-012-5678', region: 'Kumasi',
    nurse: 'Yaa Asantewaa', nursePin: 'RN-0018',
    emergency: { name: 'Kofi Osei', relationship: 'Son', phone: '+233 27 777 8888' },
    doctor: { name: 'Dr. Ama Serwaa', facility: 'Komfo Anokye Teaching Hospital', phone: '+233 32 202 3456' },
    status: 'active', enrolled: '2024-08-15', regNo: 'KH-2024-015',
    cultural: 'Muslim — observes Ramadan',
    handbookGiven: true,
    infection: { riskPlan: true },
    diabetes: { has: false, carePlan: false, stockings: false },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: false },
    pain: { present: true, analgesia: 'Tramadol 50mg', location: 'Surgical site (abdomen)', score: 2 },
    sleep: { nightWake: true, sedation: true, sleepsWell: false, bestPosition: 'Back', wakeTime: '07:00' },
    nutrition: { allergies: true, specialDiet: false, dietType: 'Normal', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: false, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: true, depression: false, anxiety: true, dementia: false },
    skin: { openWounds: true, pressureUlcer: false },
    mobility: { independent: false, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '125/82', sugar: '5.1 mmol/L', resp: '16', spo2: '99%', pulse: '72', temp: '37.1°C', weight: '65 kg', urinalysis: 'Normal' },
    medications: 'Tramadol 50mg PRN, Amoxicillin 500mg TDS, Omeprazole 20mg OD',
    communication: { needs: false, hearing: false, speech: false, visual: false, understanding: false },
    medicalHistory: 'Hysterectomy (2025), Cholecystectomy (2019)',
  },
  {
    id: 'P-1003', name: 'Kofi Ankrah', preferredName: 'Kofi', age: 58, gender: 'Male', dob: '1968-11-04',
    diagnosis: 'Diabetes, Peripheral Neuropathy', phone: '+233 27 999 0000', email: 'kofi.a@email.com',
    address: '22 Dagomba Line, Tamale', gps: 'NT-034-7890', region: 'Tamale',
    nurse: 'Ama Darko', nursePin: 'RN-0031',
    emergency: { name: 'Yaa Ankrah', relationship: 'Wife', phone: '+233 24 111 0000' },
    doctor: { name: 'Dr. Ibrahim Mahama', facility: 'Tamale Teaching Hospital', phone: '+233 37 202 1234' },
    status: 'active', enrolled: '2024-09-20', regNo: 'KH-2024-022',
    cultural: 'Muslim — Friday prayers, halal diet',
    handbookGiven: true,
    infection: { riskPlan: true },
    diabetes: { has: true, carePlan: true, stockings: true },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: false },
    pain: { present: true, analgesia: 'Gabapentin 300mg', location: 'Feet & lower legs', score: 2 },
    sleep: { nightWake: true, sedation: false, sleepsWell: false, bestPosition: 'Back elevated', wakeTime: '05:30' },
    nutrition: { allergies: false, specialDiet: true, dietType: 'Diabetic', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: true, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: false, depression: true, anxiety: false, dementia: false },
    skin: { openWounds: false, pressureUlcer: false },
    mobility: { independent: true, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '145/92', sugar: '9.8 mmol/L', resp: '18', spo2: '96%', pulse: '80', temp: '36.8°C', weight: '75 kg', urinalysis: 'Glucose +' },
    medications: 'Metformin 1g BD, Insulin Glargine 20u ON, Gabapentin 300mg TDS',
    communication: { needs: false, hearing: false, speech: false, visual: false, understanding: false },
    medicalHistory: 'Type 2 Diabetes diagnosed 2010, Peripheral neuropathy 2020',
  },
];

const painLabels = ['No Pain', 'Mild', 'Moderate', 'Severe'];
const painColors = ['#45B6FE', '#d97706', '#ea580c', '#ef4444'];

const MEDICATION_FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QDS', 'PRN', 'ON', 'Weekly', 'Stat'];

const MEDICATION_FREQUENCY_ALIASES = {
  od: 'OD',
  'once daily': 'OD',
  'once a day': 'OD',
  '1x daily': 'OD',
  daily: 'OD',
  bd: 'BD',
  bid: 'BD',
  'twice daily': 'BD',
  '2x daily': 'BD',
  tds: 'TDS',
  tid: 'TDS',
  'three times daily': 'TDS',
  '3x daily': 'TDS',
  qds: 'QDS',
  qid: 'QDS',
  'four times daily': 'QDS',
  '4x daily': 'QDS',
  prn: 'PRN',
  'as needed': 'PRN',
  on: 'ON',
  'once nightly': 'ON',
  'at night': 'ON',
  nightly: 'ON',
  weekly: 'Weekly',
  stat: 'Stat',
  immediate: 'Stat',
};

function inferFrequencyFromTimes(times) {
  const count = Array.isArray(times) ? times.filter(Boolean).length : 0;
  if (count === 1) return 'OD';
  if (count === 2) return 'BD';
  if (count === 3) return 'TDS';
  if (count === 4) return 'QDS';
  return '';
}

function normalizeMedicationFrequency(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const upper = raw.toUpperCase();
  if (MEDICATION_FREQUENCY_OPTIONS.includes(upper)) return upper;

  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (MEDICATION_FREQUENCY_OPTIONS.includes(titled)) return titled;

  const alias = MEDICATION_FREQUENCY_ALIASES[raw.toLowerCase()];
  if (alias) return alias;

  const timesMatch = raw.match(/(\d+)\s*(?:times?|x)\s*(?:\/|per)?\s*day/i);
  if (timesMatch) {
    return inferFrequencyFromTimes(Array.from({ length: Number(timesMatch[1]) || 0 }, () => '08:00'));
  }

  return raw;
}

function resolveMedicationFrequency(rawMedication, fallback = {}) {
  const raw = rawMedication && typeof rawMedication === 'object' ? rawMedication : {};
  const reminderTimes = Array.isArray(raw?.reminders?.times) ? raw.reminders.times : [];
  const fallbackTimes = Array.isArray(fallback?.time)
    ? fallback.time
    : Array.isArray(fallback?.times)
      ? fallback.times
      : reminderTimes;
  const times = Array.isArray(raw?.time) ? raw.time.filter(Boolean) : fallbackTimes.filter(Boolean);

  const candidates = [
    raw?.frequency,
    raw?.dosingFrequency,
    raw?.doseFrequency,
    raw?.freq,
    raw?.schedule,
    raw?.regimen,
    raw?.reminders?.frequency,
    fallback?.frequency,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeMedicationFrequency(candidate);
    if (normalized) return normalized;
  }

  return inferFrequencyFromTimes(times) || '';
}

function frequencyToDefaultTimes(frequency, existingTimes = []) {
  const kept = Array.isArray(existingTimes) ? existingTimes.filter(Boolean).map(normalizeMedicationTimeValue) : [];
  if (kept.length > 0) return kept;

  switch (String(frequency || '').trim().toUpperCase()) {
    case 'OD':
      return ['08:00'];
    case 'BD':
      return ['08:00', '20:00'];
    case 'TDS':
      return ['08:00', '14:00', '20:00'];
    case 'QDS':
      return ['08:00', '12:00', '16:00', '20:00'];
    case 'ON':
      return ['20:00'];
    case 'WEEKLY':
      return ['08:00'];
    default:
      return ['08:00'];
  }
}

function parseLegacyMedicationEntry(entry) {
  const tokens = String(entry || '').trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return { drug: '', dosage: '—', frequency: '—' };
  }

  const last = tokens[tokens.length - 1];
  const normalizedFreq = normalizeMedicationFrequency(last);
  const looksLikeFrequency = Boolean(
    normalizedFreq
    && (
      MEDICATION_FREQUENCY_OPTIONS.includes(normalizedFreq)
      || MEDICATION_FREQUENCY_ALIASES[last.toLowerCase()]
    ),
  );

  if (looksLikeFrequency && tokens.length >= 2) {
    return {
      drug: tokens.slice(0, -2).join(' ') || entry,
      dosage: tokens[tokens.length - 2] || '—',
      frequency: normalizedFreq,
    };
  }

  return { drug: entry, dosage: '—', frequency: '—' };
}

/* ── EHR components ── */
const YN = ({ val }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
    background:
      val === null || val === undefined || val === ''
        ? '#f3f4f6'
        : val
          ? '#F0F7FE'
          : '#fef2f2',
    color:
      val === null || val === undefined || val === ''
        ? '#6b7280'
        : val
          ? '#1565A0'
          : '#dc2626',
  }}>{val === null || val === undefined || val === '' ? 'No data' : val ? 'Yes' : 'No'}</span>
);

const DataRow = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5 }}>
    <span style={{ flexShrink: 0, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ color: 'var(--kh-text)', fontWeight: 500, textAlign: 'right' }}>
      {children === null || children === undefined || children === ''
        ? <span style={{ color: 'var(--kh-text-muted)', fontWeight: 500 }}>No data</span>
        : children}
    </span>
  </div>
);

const NoDataState = ({ text = 'No data available for this section.' }) => (
  <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', lineHeight: 1.6 }}>{text}</div>
);

function hasMeaningfulSectionData(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.entries(value).some(([key, item]) => {
      if (['id', 'createdAt', 'updatedAt', '__typename'].includes(key)) return false;
      return hasMeaningfulSectionData(item);
    });
  }
  return false;
}

function formatStatusLabel(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return 'No status';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

const TILE_RISK_STYLE = {
  'high-risk': { background: '#fef2f2', borderLeft: VITAL_RISK_COLORS['high-risk'] },
  'medium-risk': { background: '#fffbeb', borderLeft: VITAL_RISK_COLORS['medium-risk'] },
  'low-risk': { background: '#f0fdf4', borderLeft: VITAL_RISK_COLORS['low-risk'] },
};

/** @param {{ label: string, value?: string|null, risk?: string, showFlagBorder?: boolean }} props */
const VitalTile = ({ label, value, risk = 'low-risk', showFlagBorder = true }) => {
  const hasValue = value !== null && value !== undefined && String(value).trim().length > 0;
  const tier = hasValue ? risk : 'neutral';
  const surface = hasValue ? (TILE_RISK_STYLE[risk] || TILE_RISK_STYLE['low-risk']) : { background: '#fafbfc', borderLeft: '#e5e7eb' };
  const valueColor = !hasValue
    ? 'var(--kh-text-muted)'
    : (risk === 'low-risk' ? '#166534' : riskColor(risk));
  return (
    <div style={{
      padding: '12px 14px',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      background: surface.background,
      borderLeft: showFlagBorder ? `3px solid ${surface.borderLeft}` : '3px solid #e5e7eb',
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--kh-text-muted)',
        marginBottom: 4,
      }}>{label}{tier !== 'neutral' ? (
        <span style={{
          marginLeft: 6,
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          color: tier === 'low-risk' ? VITAL_RISK_COLORS['low-risk'] : riskColor(tier),
        }}
        >
          {tier === 'high-risk' ? 'High' : tier === 'medium-risk' ? 'Watch' : 'OK'}
        </span>
      ) : null}</div>
      <div style={{
        fontSize: 18,
        fontWeight: 800,
        color: valueColor,
        fontVariantNumeric: 'tabular-nums',
      }}>{hasValue ? value : '—'}</div>
    </div>
  );
};

const FlagItem = ({ label, detail }) => (
  <div className="d-flex align-items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--kh-text)', flex: 1 }}>{label}</span>
    <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{detail}</span>
  </div>
);

const TABS = [
  { key: 'chart', label: 'General' },
  { key: 'assignednurses', label: 'Nurses' },
  { key: 'medications', label: 'Medications' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'care', label: 'Lifestyle' },
  { key: 'notes', label: 'Notes' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'careplan', label: 'Care plan' },
  { key: 'billing', label: 'Billing' },
  { key: 'checkliststatus', label: 'Daily care' },
];

const Panel = ({ title, icon, accent, children, action, variant = 'default', bodyClassName = '' }) => {
  const isSummary = variant === 'summary';

  return (
    <div
      className={isSummary ? 'patient-profile-summary-panel' : ''}
      style={{
        background: '#fff',
        border: isSummary ? '1px solid #edf1f5' : '1px solid #e5e7eb',
        borderRadius: isSummary ? 28 : 5,
        overflow: 'hidden',
        marginBottom: 12,
        boxShadow: isSummary ? '0 24px 60px rgba(15, 23, 42, 0.08)' : 'none',
      }}
    >
      <div
        className={isSummary ? 'patient-profile-summary-panel__header' : ''}
        style={{
          padding: isSummary ? '18px 20px 14px' : '10px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderLeft: !isSummary && accent ? `3px solid ${accent}` : 'none',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          {icon && <span style={{ color: accent || '#45B6FE', display: 'flex' }}>{icon}</span>}
          <span
            className={isSummary ? 'nurse-profile-card-heading' : ''}
            style={{
              fontSize: isSummary ? undefined : 12,
              fontWeight: 700,
              textTransform: isSummary ? 'none' : 'capitalize',
              letterSpacing: isSummary ? 'normal' : '0.5px',
              color: 'var(--kh-text)',
              marginBottom: 0,
            }}
          >
            {title}
          </span>
        </div>
        {action && action}
      </div>
      <div className={bodyClassName} style={{ padding: isSummary ? '18px 20px 20px' : '12px 16px' }}>{children}</div>
    </div>
  );
};

const FALLBACK_PATIENT_ID = 'e426444d-02a0-4f90-90d4-930b1745f199';
const PATIENT_PHOTO_CACHE_KEY = 'patientProfilePhotoCache';
const PATIENT_MEDICATION_CACHE_KEY = 'patientProfileMedicationCache';

function readPatientPhotoCache() {
  try {
    const raw = localStorage.getItem(PATIENT_PHOTO_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePatientPhotoCache(cache) {
  try {
    localStorage.setItem(PATIENT_PHOTO_CACHE_KEY, JSON.stringify(cache || {}));
  } catch {
  }
}

function getCachedPatientPhoto(patientId) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId) return null;

  const cache = readPatientPhotoCache();
  const entry = cache[normalizedId];
  return entry && typeof entry === 'object' ? entry : null;
}

function setCachedPatientPhoto(patientId, photoData) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId || !photoData || typeof photoData !== 'object') return;

  const cache = readPatientPhotoCache();
  cache[normalizedId] = {
    ...(cache[normalizedId] || {}),
    ...photoData,
    updatedAt: new Date().toISOString(),
  };
  writePatientPhotoCache(cache);
}

function readPatientMedicationCache() {
  try {
    const raw = localStorage.getItem(PATIENT_MEDICATION_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePatientMedicationCache(cache) {
  try {
    localStorage.setItem(PATIENT_MEDICATION_CACHE_KEY, JSON.stringify(cache || {}));
  } catch {
  }
}

function getCachedPatientMedications(patientId) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId) return [];

  const cache = readPatientMedicationCache();
  const entry = cache[normalizedId];
  return Array.isArray(entry) ? entry : [];
}

function setCachedPatientMedications(patientId, medications) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId) return;

  const cache = readPatientMedicationCache();
  cache[normalizedId] = Array.isArray(medications) ? medications : [];
  writePatientMedicationCache(cache);
}

function normalizeAgencyIdentifier(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized || null;
  }

  if (typeof value === 'object') {
    return (
      normalizeAgencyIdentifier(value?.agencyId)
      || normalizeAgencyIdentifier(value?.agencyID)
      || normalizeAgencyIdentifier(value?.id)
      || normalizeAgencyIdentifier(value?._id)
      || null
    );
  }

  return null;
}

function parseJwtPayload(token) {
  const rawToken = String(token || '').trim();
  if (!rawToken) return null;

  try {
    const base64Url = rawToken.split('.')[1] || '';
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function resolveAgencyId(source) {
  const entity = source && typeof source === 'object' ? source : source;
  const candidates = [
    entity,
    entity?.agency,
    entity?.organization,
    entity?.organisation,
    entity?.company,
    entity?.user,
    entity?.data,
    entity?.profile,
  ];

  for (const candidate of candidates) {
    const resolved = (
      normalizeAgencyIdentifier(candidate?.agencyId)
      || normalizeAgencyIdentifier(candidate?.agencyID)
      || normalizeAgencyIdentifier(candidate?.agency)
      || normalizeAgencyIdentifier(candidate?.organizationId)
      || normalizeAgencyIdentifier(candidate?.organisationId)
      || normalizeAgencyIdentifier(candidate?.organization)
      || normalizeAgencyIdentifier(candidate?.organisation)
      || normalizeAgencyIdentifier(candidate?.companyId)
      || normalizeAgencyIdentifier(candidate?.company)
    );

    if (resolved) return resolved;
  }

  return null;
}

function parsePresignResponse(raw) {
  const payload = raw?.data || raw?.result || raw || {};
  const upload = payload?.upload || payload?.presign || payload?.target || {};

  const uploadUrl = (
    payload?.url
    || payload?.uploadUrl
    || payload?.presignedUrl
    || payload?.presignedPostUrl
    || upload?.url
    || upload?.uploadUrl
    || null
  );

  const uploadFields = (
    payload?.fields
    || payload?.formFields
    || upload?.fields
    || upload?.formFields
    || null
  );

  const objectKey = (
    payload?.objectKey
    || payload?.key
    || payload?.path
    || payload?.objectPath
    || upload?.objectKey
    || upload?.key
    || null
  );

  const mediaId = (
    payload?.mediaId
    || payload?.id
    || payload?.media?.id
    || payload?.media?._id
    || upload?.mediaId
    || upload?.id
    || null
  );

  return {
    uploadUrl,
    uploadFields,
    objectKey,
    mediaId,
  };
}

async function uploadFileToPresignedTarget({ uploadUrl, uploadFields, file }) {
  if (!uploadUrl) {
    throw new Error('Upload target URL is missing from presign response.');
  }

  if (uploadFields && typeof uploadFields === 'object') {
    const formData = new FormData();
    Object.entries(uploadFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append('file', file);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      throw new Error(errorText || `Media upload failed (HTTP ${uploadResponse.status}).`);
    }

    return;
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file?.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => '');
    throw new Error(errorText || `Media upload failed (HTTP ${uploadResponse.status}).`);
  }
}

function parseDirectUploadResponse(raw) {
  const payload = raw?.data || raw || {};
  return {
    objectKey: payload?.upload?.objectKey || payload?.objectKey || payload?.key || null,
    mediaId: payload?.media?.id || payload?.mediaId || payload?.id || null,
  };
}

function extractPatientProfileImage(rawPatient) {
  const profileImage = rawPatient?.profileImage || rawPatient?.image || rawPatient?.photo || {};
  const documents = Array.isArray(rawPatient?.documents) ? rawPatient.documents : [];

  const profileDoc = documents.find((doc) => {
    const docType = String(doc?.documentType || '').toLowerCase();
    return docType.includes('profile') || docType.includes('photo') || docType.includes('avatar');
  }) || null;

  return {
    url:
      profileImage?.link?.url
      || profileImage?.url
      || rawPatient?.profileImageUrl
      || rawPatient?.imageUrl
      || rawPatient?.photoUrl
      || rawPatient?.avatarUrl
      || profileDoc?.link?.url
      || null,
    objectKey:
      profileImage?.objectKey
      || rawPatient?.profileImageObjectKey
      || profileDoc?.objectKey
      || null,
    mediaId:
      profileImage?.mediaId
      || profileImage?.media?.id
      || rawPatient?.profileImageMediaId
      || profileDoc?.mediaId
      || profileDoc?.media?.id
      || null,
    previewDataUrl:
      profileImage?.previewDataUrl
      || rawPatient?.profileImagePreviewDataUrl
      || null,
  };
}

function mergeProfileImage(primaryImage, fallbackImage) {
  const primary = primaryImage && typeof primaryImage === 'object' ? primaryImage : {};
  const fallback = fallbackImage && typeof fallbackImage === 'object' ? fallbackImage : {};

  return {
    url: primary.url || fallback.url || null,
    objectKey: primary.objectKey || fallback.objectKey || null,
    mediaId: primary.mediaId || fallback.mediaId || null,
    previewDataUrl: primary.previewDataUrl || fallback.previewDataUrl || null,
  };
}

function extractUrlFromPayload(payload) {
  if (!payload) return null;

  const url =
    payload?.url
    || payload?.link?.url
    || payload?.data?.url
    || payload?.data?.link?.url
    || payload?.media?.link?.url
    || payload?.media?.url
    || payload?.downloadUrl
    || payload?.signedUrl
    || payload?.presignedUrl
    || null;

  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

async function resolvePatientProfileImageUrl({ mediaId, objectKey }) {
  const normalizedMediaId = String(mediaId || '').trim();
  const normalizedObjectKey = String(objectKey || '').trim();

  if (!normalizedMediaId && !normalizedObjectKey) return null;

  const requestCandidates = [
    {
      path: '/media/b2/view-url',
      method: 'POST',
      body: {
        ...(normalizedMediaId ? { mediaId: normalizedMediaId } : {}),
        ...(normalizedObjectKey ? { objectKey: normalizedObjectKey } : {}),
      },
    },
    {
      path: '/media/b2/download-url',
      method: 'POST',
      body: {
        ...(normalizedMediaId ? { mediaId: normalizedMediaId } : {}),
        ...(normalizedObjectKey ? { objectKey: normalizedObjectKey } : {}),
      },
    },
    ...(normalizedMediaId
      ? [
          { path: `/media/${normalizedMediaId}`, method: 'GET' },
          { path: `/media/${normalizedMediaId}/link`, method: 'GET' },
        ]
      : []),
  ];

  for (const candidate of requestCandidates) {
    try {
      const response = await apiFetch(candidate.path, {
        method: candidate.method,
        ...(candidate.body ? { body: JSON.stringify(candidate.body) } : {}),
      });

      const responseText = await response.text().catch(() => '');
      let payload = {};
      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { url: responseText };
        }
      }

      if (!response.ok) {
        continue;
      }

      const resolvedUrl = extractUrlFromPayload(payload);
      if (resolvedUrl) return resolvedUrl;
    } catch {
    }
  }

  return null;
}

function buildQuickPatientProfile(rawPatient, fallbackId) {
  const normalized = normalizePatientProfile(rawPatient, fallbackId);
  const cachedImage = getCachedPatientPhoto(normalized?.id || fallbackId);
  return {
    ...normalized,
    profileImage: mergeProfileImage(normalized?.profileImage, cachedImage),
  };
}

async function hydratePatientProfile(rawPatient, fallbackId) {
  const mergedProfile = buildQuickPatientProfile(rawPatient, fallbackId);
  const existingUrl = mergedProfile?.profileImage?.url || null;

  if (existingUrl) {
    setCachedPatientPhoto(mergedProfile?.id || fallbackId, mergedProfile.profileImage);
    return mergedProfile;
  }

  const resolvedUrl = await resolvePatientProfileImageUrl({
    mediaId: mergedProfile?.profileImage?.mediaId,
    objectKey: mergedProfile?.profileImage?.objectKey,
  });

  if (!resolvedUrl) {
    return mergedProfile;
  }

  const hydratedProfile = {
    ...mergedProfile,
    profileImage: {
      ...(mergedProfile.profileImage || {}),
      url: resolvedUrl,
    },
  };

  setCachedPatientPhoto(hydratedProfile?.id || fallbackId, hydratedProfile.profileImage);
  return hydratedProfile;
}

async function uploadFileViaBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  let uploadResponse;
  try {
    uploadResponse = await fetch(`${API_BASE}/media/b2/upload/direct`, {
      method: 'POST',
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: formData,
    });
  } catch {
    throw new Error('Could not reach media upload endpoint. Check backend URL, CORS, and network connectivity.');
  }

  const uploadData = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    throw new Error(uploadData?.message || uploadData?.error || `Media upload failed (HTTP ${uploadResponse.status}).`);
  }

  const { objectKey, mediaId } = parseDirectUploadResponse(uploadData);
  if (!objectKey || !mediaId) {
    throw new Error('Direct upload response missing objectKey or mediaId.');
  }

  return { objectKey, mediaId };
}

function extractAssignedNurses(rawPatient) {
  const patientObj = rawPatient && typeof rawPatient === 'object' ? rawPatient : {};
  const sourceList = []
    .concat(
      Array.isArray(patientObj?.assignedNurses) ? patientObj.assignedNurses : [],
      Array.isArray(patientObj?.assigned_nurses) ? patientObj.assigned_nurses : [],
      Array.isArray(patientObj?.nurses) ? patientObj.nurses : [],
      Array.isArray(patientObj?.careTeam) ? patientObj.careTeam : [],
      Array.isArray(patientObj?.careTeamMembers) ? patientObj.careTeamMembers : [],
    );

  const normalized = sourceList
    .map((entry, index) => {
      if (!entry) return null;

      if (typeof entry === 'string') {
        const name = entry.trim();
        return name ? { id: `nurse:${name.toLowerCase()}:${index}`, name, role: '', region: '' } : null;
      }

      if (typeof entry !== 'object') return null;
      const nestedNurse = entry?.nurse && typeof entry.nurse === 'object' ? entry.nurse : null;
      const name = String(
        entry?.name
        || entry?.fullName
        || nurseObjectToDisplayName(entry)
        || nurseObjectToDisplayName(nestedNurse)
        || ''
      ).trim();
      if (!name) return null;

      return {
        id: String(
          entry?.nurseId
          || entry?.id
          || entry?._id
          || nestedNurse?.id
          || nestedNurse?._id
          || `nurse:${name.toLowerCase()}`
        ).trim(),
        assignmentId: String(
          entry?.assignmentId
          || entry?.assignment?._id
          || entry?.assignment?.id
          || entry?.assignmentRecordId
          || ''
        ).trim(),
        name,
        role: String(entry?.role || entry?.jobTitle || entry?.specialisation || nestedNurse?.role || nestedNurse?.jobTitle || '').trim(),
        region: String(entry?.region || entry?.location || nestedNurse?.region || nestedNurse?.location || '').trim(),
      };
    })
    .filter(Boolean);

  if (normalized.length === 0) {
    const fallbackName = String(patientObj?.admittingNurse || patientObj?.nurse || patientObj?.admissionChecklist?.admittingNurse || '').trim();
    if (fallbackName) {
      normalized.push({
        id: `nurse:${fallbackName.toLowerCase()}`,
        assignmentId: '',
        name: fallbackName,
        role: '',
        region: '',
      });
    }
  }

  const seen = new Set();
  return normalized.filter((entry) => {
    const key = String(entry?.id || entry?.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizePatientProfile(rawPatient, fallbackId) {
  if (!rawPatient || typeof rawPatient !== 'object') {
    return JSON.parse(JSON.stringify(patientsData[0]));
  }

  const firstName = rawPatient?.firstName || '';
  const lastName = rawPatient?.lastName || '';
  const fullName = rawPatient?.fullName || rawPatient?.name || `${firstName} ${lastName}`.trim();

  const nextOfKin = rawPatient?.nextOfKin || {};
  const admissionChecklist = rawPatient?.admissionChecklist || {};
  const communicationStyle = rawPatient?.communicationStyle || {};
  const infectionControl = extractInfectionControlFromRaw(rawPatient);
  const breathPain = extractBreathPainFromRaw(rawPatient);
  const sleepNutrition = rawPatient?.sleepNutrition || {};
  const sleep = extractSleepFromRaw(rawPatient);
  const nutrition = sleepNutrition?.nutrition || rawPatient?.nutrition || {};
  const hygienePsychological = rawPatient?.hygienePsychological || {};
  const personal = extractPersonalHygieneFromRaw(rawPatient);
  const bladderBowel = extractBladderBowelFromRaw(rawPatient);
  const psychologicalNeeds = extractPsychologicalNeedsFromRaw(rawPatient);
  const skinMobility = rawPatient?.skinMobility || {};
  const skinIntegrity = skinMobility?.skinIntegrity || rawPatient?.skinIntegrity || {};
  const handlingAssessment = skinMobility?.handlingAssessment || rawPatient?.handlingAssessment || {};
  const medicalHistoryRecord = rawPatient?.medicalHistory;
  const initialVitals = rawPatient?.initialVitals || {};
  const profileImage = extractPatientProfileImage(rawPatient || {});

  const painPresent = String(rawPatient?.painPresent || '').toLowerCase();
  const boolFromYesNo = (value, fallback = null) => {
    if (value === true || value === false) return value;
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'yes' || normalized === 'true') return true;
    if (normalized === 'no' || normalized === 'false') return false;
    return fallback;
  };

  const apiPatientId = extractApiPatientId(rawPatient);
  const mutationPatientId = resolvePatientMutationId(rawPatient, fallbackId);
  const recordMongoId = extractMongoObjectId(rawPatient);

  return {
    id: rawPatient?.registrationNumber || rawPatient?.regNo || apiPatientId || fallbackId || '',
    patientId: apiPatientId || mutationPatientId,
    uuid: rawPatient?.uuid || rawPatient?.patientUuid || rawPatient?.patientUUID
      || (isPatientUuid(apiPatientId) ? apiPatientId : '')
      || (isPatientUuid(mutationPatientId) ? mutationPatientId : '')
      || (isPatientUuid(rawPatient?.id) ? String(rawPatient.id).trim() : ''),
    recordMongoId,
    agencyId: resolveAgencyId(rawPatient),
    name: fullName || '',
    preferredName: rawPatient?.preferredName || firstName || '',
    age: rawPatient?.age ?? '',
    gender: rawPatient?.gender || '',
    dob: toDateInputValue(rawPatient?.dateOfBirth || rawPatient?.dob || ''),
    dateOfAssessment: toDateInputValue(rawPatient?.dateOfAssessment || ''),
    diagnosis: rawPatient?.diagnosis || rawPatient?.primaryDiagnosis || '',
    phone: rawPatient?.contactNumber || rawPatient?.phone || '',
    email: rawPatient?.email || '',
    address: rawPatient?.residentialAddress || rawPatient?.address || '',
    gps: rawPatient?.gpsCode || rawPatient?.gps || '',
    region: rawPatient?.region || rawPatient?.location || rawPatient?.residentialAddress || '',
    nurse: admissionChecklist?.admittingNurse || rawPatient?.admittingNurse || rawPatient?.nurse || '',
    nursePin: rawPatient?.nursePin || '',
    emergency: {
      name: nextOfKin?.fullName || '',
      relationship: nextOfKin?.relationship || '',
      phone: nextOfKin?.contactOne || nextOfKin?.contactTwo || '',
    },
    doctor: {
      name: nextOfKin?.personalDoctor || '',
      facility: nextOfKin?.personalDoctorFacility || '',
      phone: nextOfKin?.personalDoctorContact || '',
    },
    status: rawPatient?.status || '',
    enrolled: toDateInputValue(rawPatient?.dateOfAdmission || rawPatient?.enrolled || ''),
    regNo: rawPatient?.registrationNumber || '',
    profileImage,
    cultural: nextOfKin?.spiritualNeed || rawPatient?.cultural || '',
    notes: rawPatient?.notes || '',
    handbookGiven: boolFromYesNo(admissionChecklist?.clientHandBookGiven ?? rawPatient?.clientHandBookGiven, null),
    infection: {
      riskPlan: boolFromYesNo(infectionControl?.infectionCarePlanCompletion ?? infectionControl?.InfectionCarePlanCompletion, null),
    },
    diabetes: {
      has: boolFromYesNo(infectionControl?.anyDiabetes, null),
      carePlan: boolFromYesNo(infectionControl?.diabetesCarePlanCompletion ?? infectionControl?.DiabetesCarePlanCompletion, null),
      stockings: boolFromYesNo(infectionControl?.isThePatientBedBound, null),
    },
    breathing: {
      difficulties: boolFromYesNo(breathPain?.anyBreathingDifficulties, null),
      oxygen: boolFromYesNo(breathPain?.homeOxygenNeeded, null),
      smoker: boolFromYesNo(breathPain?.isSmoker, null),
      everSmoked: boolFromYesNo(breathPain?.everSmoked, null),
    },
    pain: (() => {
      const analgesiaPrescribed = boolFromYesNo(
        breathPain?.anagelsiaPrescribed ?? breathPain?.analgesiaPrescribed,
        null,
      );
      const analgesiaDetail = String(
        breathPain?.analgesia || breathPain?.analgesiaDescription || breathPain?.analgesiaDetails || '',
      ).trim();
      let analgesia = analgesiaDetail;
      if (!analgesia) {
        if (analgesiaPrescribed === true) analgesia = 'Prescribed';
        else if (analgesiaPrescribed === false) analgesia = 'Not prescribed';
      }
      return {
        present: painPresent ? painPresent === 'yes' || painPresent === 'true' : boolFromYesNo(breathPain?.painPresent, null),
        analgesiaPrescribed,
        analgesia,
        location: breathPain?.locationOfPain || '',
        score: breathPain?.painScore !== '' && breathPain?.painScore !== undefined && breathPain?.painScore !== null
          ? Number(breathPain.painScore) || 0
          : null,
      };
    })(),
    sleep: {
      nightWake: boolFromYesNo(getSleepFieldValue(sleep, 'wakeUpAtNight', 'wake_up_at_night'), null),
      sedation: boolFromYesNo(
        getSleepFieldValue(sleep, 'UseOfNightSedation', 'useOfNightSedation', 'use_of_night_sedation', 'nightSedation'),
        null,
      ),
      sleepsWell: boolFromYesNo(getSleepFieldValue(sleep, 'userSleepWell', 'user_sleep_well'), null),
      bestPosition: String(getSleepFieldValue(sleep, 'bestSleepingPosition', 'best_sleeping_position') ?? ''),
      wakeTime: String(getSleepFieldValue(sleep, 'usualTimeToWakeUp', 'usual_time_to_wake_up') ?? ''),
    },
    nutrition: {
      allergies: boolFromYesNo(nutrition?.allergy, null),
      specialDiet: boolFromYesNo(nutrition?.specialDiet, null),
      dietType: nutrition?.dietType || '',
      helpEating: boolFromYesNo(nutrition?.needHelpInEating, null),
      swallowing: boolFromYesNo(nutrition?.swallowingDifficulties, null),
      ngTube: boolFromYesNo(nutrition?.ngTube, null),
    },
    hygiene: {
      independent: boolFromYesNo(personal?.hygieneNeeds, null),
      mouthCare: boolFromYesNo(personal?.mouthCarePlan, null),
      diabeteFoot: boolFromYesNo(personal?.diabeteFoot, null),
    },
    bladder: {
      dysfunction: boolFromYesNo(bladderBowel?.bladderDysfunction, null),
      catheter: boolFromYesNo(bladderBowel?.catheterPlan, null),
      pads: boolFromYesNo(bladderBowel?.incontinentPads, null),
      catheterDescription: String(bladderBowel?.catheterDescription || '').trim(),
    },
    psych: {
      concerns: boolFromYesNo(getPsychologicalFieldValue(psychologicalNeeds, 'psychologicalNeeds'), null),
      depression: boolFromYesNo(getPsychologicalFieldValue(psychologicalNeeds, 'depressionHistory'), null),
      anxiety: boolFromYesNo(
        getPsychologicalFieldValue(psychologicalNeeds, 'anxietyhistory', 'anxietyHistory', 'anxiety_history', 'anxiety'),
        null,
      ),
      dementia: boolFromYesNo(getPsychologicalFieldValue(psychologicalNeeds, 'signDementia'), null),
      notes: String(getPsychologicalFieldValue(psychologicalNeeds, 'psychologicalNotes', 'notes') ?? '').trim(),
    },
    skin: {
      openWounds: boolFromYesNo(skinIntegrity?.openWounds, null),
      pressureUlcer: boolFromYesNo(skinIntegrity?.pressureUlcer, null),
    },
    mobility: {
      independent: boolFromYesNo(handlingAssessment?.isPatientMobile, null),
      bedMove: boolFromYesNo(handlingAssessment?.moveInBed, null),
      bedToChair: boolFromYesNo(handlingAssessment?.mobilityFromBedToChair, null),
      toilet: boolFromYesNo(handlingAssessment?.mobilityToWashroom, null),
    },
    vitals: {
      bp: initialVitals?.bloodPressure || rawPatient?.bloodPressure || '',
      sugar: initialVitals?.bloodSugar || rawPatient?.bloodSugar || '',
      resp: initialVitals?.respiration || rawPatient?.respiration || '',
      spo2: initialVitals?.sp02 || rawPatient?.sp02 || '',
      pulse: initialVitals?.pulseRate || rawPatient?.pulseRate || '',
      temp: initialVitals?.temperature || rawPatient?.temperature || '',
      weight: initialVitals?.weight || rawPatient?.weight || '',
      urinalysis: initialVitals?.urinalysis || rawPatient?.urinalysis || '',
    },
    medications:
      extractMedicationTextFromPatientRaw(rawPatient)
      || collectCachedAdmissionMedicationTexts([
        fallbackId,
        rawPatient?.uuid,
        rawPatient?.patientUuid,
        rawPatient?.patientId,
        rawPatient?._id,
        rawPatient?.id,
      ])
      || '',
    communication: {
      needs: boolFromYesNo(communicationStyle?.anyCommunicationNeeds, null),
      hearing: boolFromYesNo(communicationStyle?.anyHearingNeeds, null),
      speech: boolFromYesNo(communicationStyle?.anySpeechImpairment, null),
      visual: boolFromYesNo(communicationStyle?.anyVisualImpairment, null),
      understanding: boolFromYesNo(communicationStyle?.anyUnderstandingDifficulties, null),
    },
    medicalHistory:
      rawPatient?.medicalHistoryDescription
      || medicalHistoryRecord?.medicalHistoryDescription
      || (typeof medicalHistoryRecord === 'string' ? medicalHistoryRecord : '')
      || '',
    sectionNextOfKin: rawPatient?.nextOfKin || null,
    sectionAdmissionChecklist: rawPatient?.admissionChecklist || null,
    sectionMedicalHistory: rawPatient?.medicalHistory || null,
    sectionCommunicationStyle: rawPatient?.communicationStyle || null,
    sectionInfectionControl: rawPatient?.infectionControl || null,
    sectionBreathPain: rawPatient?.breathPain || null,
    sectionSleepNutrition: rawPatient?.sleepNutrition || null,
    sectionHygienePsychological: rawPatient?.hygienePsychological || null,
    sectionSkinMobility: rawPatient?.skinMobility || null,
    sectionInitialVitals: rawPatient?.initialVitals || null,
    assignedNurses: extractAssignedNurses(rawPatient),
  };
}

function toDateInputValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return normalized.includes('T') ? normalized.split('T')[0] : normalized;
}

function splitPatientName(name) {
  const chunks = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (chunks.length === 1) {
    return { firstName: chunks[0], lastName: '' };
  }
  return {
    firstName: chunks[0],
    lastName: chunks.slice(1).join(' '),
  };
}

function createPatientUpdateForm(profile, fallbackId) {
  const person = profile && typeof profile === 'object' ? profile : {};
  const nameParts = splitPatientName(person?.name);
  const nullableBoolean = (value) => (value === true ? true : value === false ? false : null);

  return {
    patientId: resolvePatientMutationId(person, fallbackId) || String(person?.patientId || '').trim(),
    personalInfo: {
      registrationNumber: person?.regNo || '',
      dateOfAssessment: toDateInputValue(person?.dateOfAssessment || person?.enrolled || ''),
      dateOfAdmission: toDateInputValue(person?.enrolled || ''),
      firstName: nameParts.firstName || '',
      lastName: nameParts.lastName || '',
      preferredName: person?.preferredName || nameParts.firstName || '',
      contactNumber: person?.phone || '',
      dateOfBirth: toDateInputValue(person?.dob || ''),
      age: person?.age === undefined || person?.age === null ? '' : String(person.age),
      gender: person?.gender || '',
      residentialAddress: person?.address || '',
      gpsCode: person?.gps || '',
      email: person?.email || '',
    },
    nextOfKin: {
      fullName: person?.emergency?.name || '',
      relationship: person?.emergency?.relationship || '',
      contactOne: person?.emergency?.phone || '',
      contactTwo: person?.emergency?.phone || '',
      spiritualNeed: person?.cultural || '',
      personalDoctor: person?.doctor?.name || '',
      personalDoctorFacility: person?.doctor?.facility || '',
      personalDoctorContact: person?.doctor?.phone || '',
    },
    admissionChecklist: {
      clientHandBookGiven: Boolean(person?.handbookGiven),
      admittingNurse: person?.nurse || '',
      infectionControlSupplies: Boolean(person?.infection?.riskPlan),
    },
    medicalHistory: {
      anyMedicalHistory: Boolean(String(person?.medicalHistory || '').trim()),
      medicalHistoryDescription: person?.medicalHistory || '',
    },
    communicationStyle: {
      anyCommunicationNeeds: Boolean(person?.communication?.needs),
      anyHearingNeeds: Boolean(person?.communication?.hearing),
      anySpeechImpairment: Boolean(person?.communication?.speech),
      anyVisualImpairment: Boolean(person?.communication?.visual),
      anyUnderstandingDifficulties: Boolean(person?.communication?.understanding),
      communicationNotes: person?.sectionCommunicationStyle?.communicationNotes || '',
    },
    infectionControl: {
      InfectionCarePlanCompletion: person?.infection?.riskPlan === true || person?.infection?.riskPlan === false
        ? person.infection.riskPlan
        : null,
      anyDiabetes: person?.diabetes?.has === true || person?.diabetes?.has === false
        ? person.diabetes.has
        : null,
      DiabetesCarePlanCompletion: person?.diabetes?.carePlan === true || person?.diabetes?.carePlan === false
        ? person.diabetes.carePlan
        : null,
      isThePatientBedBound: person?.diabetes?.stockings === true || person?.diabetes?.stockings === false
        ? person.diabetes.stockings
        : null,
    },
    breathPain: {
      anyBreathingDifficulties: Boolean(person?.breathing?.difficulties),
      homeOxygenNeeded: Boolean(person?.breathing?.oxygen),
      isSmoker: Boolean(person?.breathing?.smoker),
      everSmoked: Boolean(person?.breathing?.everSmoked),
      painPresent: person?.pain?.present === true || person?.pain?.present === false
        ? person.pain.present
        : null,
      anagelsiaPrescribed: person?.pain?.analgesiaPrescribed === true || person?.pain?.analgesiaPrescribed === false
        ? person.pain.analgesiaPrescribed
        : null,
      locationOfPain: person?.pain?.location || '',
      painScore: person?.pain?.score === undefined || person?.pain?.score === null ? '' : String(person.pain.score),
    },
    sleepNutrition: {
      sleep: {
        wakeUpAtNight: nullableBoolean(
          getSleepFieldValue(person?.sectionSleepNutrition?.sleep, 'wakeUpAtNight') ?? person?.sleep?.nightWake,
        ),
        UseOfNightSedation: nullableBoolean(
          getSleepFieldValue(
            person?.sectionSleepNutrition?.sleep,
            'UseOfNightSedation',
            'useOfNightSedation',
            'use_of_night_sedation',
            'nightSedation',
          ) ?? person?.sleep?.sedation,
        ),
        userSleepWell: nullableBoolean(
          getSleepFieldValue(person?.sectionSleepNutrition?.sleep, 'userSleepWell') ?? person?.sleep?.sleepsWell,
        ),
        RestDuringTheDay: nullableBoolean(
          getSleepFieldValue(person?.sectionSleepNutrition?.sleep, 'RestDuringTheDay', 'restDuringTheDay'),
        ),
        usualTimeToWakeUp: String(
          getSleepFieldValue(person?.sectionSleepNutrition?.sleep, 'usualTimeToWakeUp') ?? person?.sleep?.wakeTime ?? '',
        ),
        bestSleepingPosition: String(
          getSleepFieldValue(person?.sectionSleepNutrition?.sleep, 'bestSleepingPosition') ?? person?.sleep?.bestPosition ?? '',
        ),
      },
      nutrition: {
        allergy: nullableBoolean(person?.nutrition?.allergies),
        specialDiet: nullableBoolean(person?.nutrition?.specialDiet),
        needHelpInEating: nullableBoolean(person?.nutrition?.helpEating),
        feedingAid: null,
        swallowingDifficulties: nullableBoolean(person?.nutrition?.swallowing),
        dietType: person?.nutrition?.dietType || '',
        ngTube: nullableBoolean(person?.nutrition?.ngTube),
        nutritionConcerns: '',
      },
    },
    hygienePsych: {
      personal: {
        hygieneNeeds: person?.hygiene?.independent === true || person?.hygiene?.independent === false
          ? person.hygiene.independent
          : null,
        mouthCarePlan: person?.hygiene?.mouthCare === true || person?.hygiene?.mouthCare === false
          ? person.hygiene.mouthCare
          : null,
        diabeteFoot: person?.hygiene?.diabeteFoot === true || person?.hygiene?.diabeteFoot === false
          ? person.hygiene.diabeteFoot
          : null,
      },
      bladderBowel: {
        bladderDysfunction: person?.bladder?.dysfunction === true || person?.bladder?.dysfunction === false
          ? person.bladder.dysfunction
          : null,
        catheterDescription: person?.bladder?.catheterDescription
          ?? person?.sectionHygienePsychological?.bladderBowel?.catheterDescription
          ?? '',
        catheterPlan: person?.bladder?.catheter === true || person?.bladder?.catheter === false
          ? person.bladder.catheter
          : null,
        incontinentPads: person?.bladder?.pads === true || person?.bladder?.pads === false
          ? person.bladder.pads
          : null,
      },
      psychologicalNeeds: {
        psychologicalNeeds: person?.psych?.concerns === true || person?.psych?.concerns === false
          ? person.psych.concerns
          : null,
        depressionHistory: person?.psych?.depression === true || person?.psych?.depression === false
          ? person.psych.depression
          : null,
        anxietyhistory: person?.psych?.anxiety === true || person?.psych?.anxiety === false
          ? person.psych.anxiety
          : null,
        anxietyHistory: person?.psych?.anxiety === true || person?.psych?.anxiety === false
          ? person.psych.anxiety
          : null,
        signDementia: person?.psych?.dementia === true || person?.psych?.dementia === false
          ? person.psych.dementia
          : null,
        psychologicalNotes: person?.sectionHygienePsychological?.psychologicalNeeds?.psychologicalNotes ?? '',
      },
    },
    skinMobility: {
      skinIntegrity: {
        openWounds: Boolean(person?.skin?.openWounds),
        pressureUlcer: Boolean(person?.skin?.pressureUlcer),
        gradeAdmission: '',
        securityItems: '',
      },
      handlingAssessment: {
        isPatientMobile: Boolean(person?.mobility?.independent),
        isEquipmentNeeded: false,
        numberOfStaffNeeded: person?.mobility?.independent ? 0 : 1,
        moveInBed: Boolean(person?.mobility?.bedMove),
        moveInBedEquipment: '',
        mobilityFromBedToChair: Boolean(person?.mobility?.bedToChair),
        mobilityFromBedToChairEquipment: '',
        mobilityToWashroom: Boolean(person?.mobility?.toilet),
        mobilityToWashroomEquipment: '',
      },
    },
    initialVitals: {
      bloodPressure: person?.vitals?.bp || '',
      bloodSugar: person?.vitals?.sugar || '',
      respiration: person?.vitals?.resp || '',
      sp02: person?.vitals?.spo2 || '',
      pulseRate: person?.vitals?.pulse || '',
      temperature: person?.vitals?.temp || '',
      urinalysis: person?.vitals?.urinalysis || '',
      weight: person?.vitals?.weight || '',
    },
  };
}

function applyNestedFormUpdate(prev, path, value) {
  const keys = String(path || '').split('.').filter(Boolean);
  if (!keys.length) return prev;

  const next = { ...prev };
  let cursor = next;
  let source = prev;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    cursor[key] = { ...(source?.[key] || {}) };
    cursor = cursor[key];
    source = source?.[key] || {};
  }

  cursor[keys[keys.length - 1]] = value;
  return next;
}

function getNestedFormValue(form, path) {
  const keys = String(path || '').split('.').filter(Boolean);
  return keys.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), form);
}

async function patchPatientEndpoint(path, payload) {
  const response = await apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const responseText = await response.text().catch(() => '');
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }
  }

  if (!response.ok) {
    const err = new Error(data?.message || data?.error || `Failed request: ${path}`);
    err.error = data?.error;
    err.payload = data;
    throw err;
  }

  return data;
}

async function postPatientEndpoint(path, payload) {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const responseText = await response.text().catch(() => '');
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }
  }

  if (!response.ok) {
    const err = new Error(data?.message || data?.error || `Failed request: ${path}`);
    err.error = data?.error;
    err.payload = data;
    throw err;
  }

  return data;
}

function collectSleepNutritionLookupIds(rawPatient, routeFallback = '') {
  const seen = new Set();
  const ids = [];
  const push = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized || seen.has(normalized)) return;
    if (!isUuidV4ish(normalized) && !isLikelyMongoObjectId(normalized)) return;
    seen.add(normalized);
    ids.push(normalized);
  };

  push(extractMongoObjectId(rawPatient));
  push(resolvePatientMutationId(rawPatient, routeFallback));
  push(extractApiPatientId(rawPatient));
  push(routeFallback);

  return ids;
}

function unwrapSleepNutritionPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const candidates = [
    payload,
    payload.data,
    payload.sleepNutrition,
    payload.data?.sleepNutrition,
    payload.record,
    payload.result,
    payload.patient?.sleepNutrition,
    payload.patient,
  ];

  for (const node of candidates) {
    if (!node || typeof node !== 'object') continue;
    if (node.sleepNutrition && typeof node.sleepNutrition === 'object') return node.sleepNutrition;
    if (
      node.sleep
      || node.nutrition
      || node.personal
      || node.bladderBowel
      || node.psychologicalNeeds
    ) {
      return node;
    }
  }

  return null;
}

function sleepNutritionApiErrorText(error) {
  return String(error?.message || error?.error || error || '').toLowerCase();
}

function sleepNutritionApiErrorIndicatesExists(error) {
  const message = sleepNutritionApiErrorText(error);
  return (
    message.includes('already exists')
    || message.includes('use patch')
    || message.includes('sleep/nutrition already')
  );
}

function sleepNutritionApiErrorIndicatesNotFound(error) {
  const message = sleepNutritionApiErrorText(error);
  return (
    message.includes('not found')
    || message.includes('does not exist')
    || message.includes('no sleep')
    || message.includes('no record')
  );
}

const PATIENT_HYGIENE_PSYCHOLOGICAL_PATH = '/patients/hygiene-psychological';

function hygienePsychApiErrorIndicatesExists(error) {
  const message = sleepNutritionApiErrorText(error);
  return (
    message.includes('already exists')
    || message.includes('use patch')
    || message.includes('hygiene')
  );
}

function hygienePsychApiErrorIndicatesNotFound(error) {
  return sleepNutritionApiErrorIndicatesNotFound(error);
}

function unwrapHygienePsychologicalPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const candidates = [
    payload,
    payload.data,
    payload.hygienePsychological,
    payload.data?.hygienePsychological,
    payload.record,
    payload.result,
    payload.patient?.hygienePsychological,
    payload.patient,
  ];

  for (const node of candidates) {
    if (!node || typeof node !== 'object') continue;
    if (node.personal || node.bladderBowel || node.psychologicalNeeds) return node;
    if (node.hygienePsychological && typeof node.hygienePsychological === 'object') return node.hygienePsychological;
  }

  const keys = Object.keys(payload);
  if (keys.length === 1 && typeof payload[keys[0]] === 'object') {
    const inner = payload[keys[0]];
    if (inner?.personal || inner?.bladderBowel || inner?.psychologicalNeeds) return inner;
  }

  return null;
}

function mergeRawPatientWithHygienePsychological(rawPatient, hygieneRecord) {
  if (!rawPatient || typeof rawPatient !== 'object') return rawPatient;
  if (!hygieneRecord || typeof hygieneRecord !== 'object') return rawPatient;

  const hp = hygieneRecord.hygienePsychological && typeof hygieneRecord.hygienePsychological === 'object'
    ? hygieneRecord.hygienePsychological
    : hygieneRecord;
  const psychologicalNeeds = normalizePsychologicalNeedsRecord(
    hp.psychologicalNeeds || rawPatient.psychologicalNeeds || rawPatient.hygienePsychological?.psychologicalNeeds,
  );

  return {
    ...rawPatient,
    hygienePsychological: {
      ...(rawPatient.hygienePsychological || {}),
      ...hp,
      psychologicalNeeds,
    },
    personal: hp.personal || rawPatient.personal,
    bladderBowel: hp.bladderBowel || rawPatient.bladderBowel,
    psychologicalNeeds,
    sleepNutrition: {
      ...(rawPatient.sleepNutrition || {}),
      personal: hp.personal || rawPatient.sleepNutrition?.personal,
      bladderBowel: hp.bladderBowel || rawPatient.sleepNutrition?.bladderBowel,
      psychologicalNeeds,
    },
  };
}

async function fetchPatientHygienePsychologicalRecord(patientId) {
  const pid = encodeURIComponent(String(patientId || '').trim());
  if (!pid) return null;

  const paths = [
    `${PATIENT_HYGIENE_PSYCHOLOGICAL_PATH}?patientId=${pid}`,
  ];

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) continue;
      console.log('[hygienePsych] raw response from', path, JSON.stringify(payload).slice(0, 500));
      const unwrapped = unwrapHygienePsychologicalPayload(payload);
      if (unwrapped) return unwrapped;
      if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
        console.warn('[hygienePsych] payload received but could not unwrap:', Object.keys(payload));
        return payload;
      }
    } catch {
      // try next path
    }
  }

  return null;
}

/** Save sleep + nutrition only (no hygiene/psych). */
async function persistSleepNutritionToDb(patientId, form) {
  const sections = buildSleepNutritionBooleanSectionsFromForm(form);
  const payload = {
    patientId,
    sleep: sections.sleep,
    nutrition: sections.nutrition,
  };

  try {
    return await patchPatientEndpoint('/patients/sleep-nutrition', payload);
  } catch (patchError) {
    if (!sleepNutritionApiErrorIndicatesNotFound(patchError)) {
      throw patchError;
    }
  }

  const basePayload = { patientId, sleep: sections.sleep, nutrition: sections.nutrition };

  try {
    await postPatientEndpoint('/patients/sleep-nutrition', basePayload);
  } catch (postError) {
    if (!sleepNutritionApiErrorIndicatesExists(postError)) {
      throw postError;
    }
  }

  return patchPatientEndpoint('/patients/sleep-nutrition', payload);
}

async function persistSleepNutritionWithIdFallback(form, rawPatient, routeFallback) {
  const idCandidates = collectSleepNutritionLookupIds(rawPatient, routeFallback);
  if (!idCandidates.length) {
    throw new Error('Patient ID is required to save sleep & nutrition records.');
  }

  let lastError;
  for (const patientId of idCandidates) {
    try {
      const patchResponse = await persistSleepNutritionToDb(patientId, form);
      return { patientId, patchResponse };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to save sleep & nutrition to the server.');
}

/** PATCH/POST `/patients/hygiene-psychological` with boolean personal, bladderBowel, psychologicalNeeds. */
async function persistHygienePsychologicalToDb(patientId, form, rawPatient = null) {
  const payload = buildHygienePsychologicalPayload(patientId, form, rawPatient);

  try {
    return await patchPatientEndpoint(PATIENT_HYGIENE_PSYCHOLOGICAL_PATH, payload);
  } catch (patchError) {
    if (!hygienePsychApiErrorIndicatesNotFound(patchError)) {
      throw patchError;
    }
  }

  try {
    await postPatientEndpoint(PATIENT_HYGIENE_PSYCHOLOGICAL_PATH, payload);
  } catch (postError) {
    if (!hygienePsychApiErrorIndicatesExists(postError)) {
      throw postError;
    }
    return patchPatientEndpoint(PATIENT_HYGIENE_PSYCHOLOGICAL_PATH, payload);
  }

  return patchPatientEndpoint(PATIENT_HYGIENE_PSYCHOLOGICAL_PATH, payload);
}

async function persistHygienePsychologicalWithIdFallback(form, rawPatient, routeFallback) {
  const idCandidates = collectSleepNutritionLookupIds(rawPatient, routeFallback);
  if (!idCandidates.length) {
    throw new Error('Patient ID is required to save hygiene & psychological records.');
  }

  let lastError;
  for (const patientId of idCandidates) {
    try {
      const patchResponse = await persistHygienePsychologicalToDb(patientId, form, rawPatient);
      return { patientId, patchResponse };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to save hygiene & psychological records to the server.');
}

function getPsychologicalFieldValue(psychologicalNeeds, ...keys) {
  if (!psychologicalNeeds || typeof psychologicalNeeds !== 'object') return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(psychologicalNeeds, key)) {
      return psychologicalNeeds[key];
    }
  }
  return undefined;
}

function normalizePsychologicalNeedsRecord(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    psychologicalNeeds: getPsychologicalFieldValue(source, 'psychologicalNeeds'),
    depressionHistory: getPsychologicalFieldValue(source, 'depressionHistory'),
    anxietyhistory: getPsychologicalFieldValue(
      source,
      'anxietyhistory',
      'anxietyHistory',
      'anxiety_history',
      'anxiety',
    ),
    signDementia: getPsychologicalFieldValue(source, 'signDementia'),
    psychologicalNotes: String(getPsychologicalFieldValue(source, 'psychologicalNotes', 'notes') ?? ''),
  };
}

function extractPsychologicalNeedsFromRaw(rawPatient) {
  if (!rawPatient || typeof rawPatient !== 'object') return {};

  const direct =
    rawPatient.psychologicalNeeds
    || rawPatient.hygienePsychological?.psychologicalNeeds
    || rawPatient.sleepNutrition?.psychologicalNeeds
    || rawPatient.data?.psychologicalNeeds
    || rawPatient.data?.hygienePsychological?.psychologicalNeeds
    || rawPatient.patient?.psychologicalNeeds;

  if (direct && typeof direct === 'object') {
    return normalizePsychologicalNeedsRecord(direct);
  }

  const queue = [rawPatient];
  const seen = new Set();
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    if (node.psychologicalNeeds && typeof node.psychologicalNeeds === 'object' && (
      'psychologicalNeeds' in node.psychologicalNeeds
      || 'anxietyhistory' in node.psychologicalNeeds
      || 'anxietyHistory' in node.psychologicalNeeds
      || 'depressionHistory' in node.psychologicalNeeds
    )) {
      return normalizePsychologicalNeedsRecord(node.psychologicalNeeds);
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') queue.push(value);
    }
    if (seen.size > 48) break;
  }

  return {};
}

const PATIENT_INFECTION_CONTROL_PATH = '/patients/infection-control';
const PATIENT_BREATH_PAIN_PATH = '/patients/breath-pain';

function extractInfectionControlFromRaw(rawPatient) {
  if (!rawPatient || typeof rawPatient !== 'object') return {};

  const direct =
    rawPatient.infectionControl
    || rawPatient.data?.infectionControl
    || rawPatient.patient?.infectionControl;

  if (direct && typeof direct === 'object') return direct;

  return {};
}

function unwrapInfectionControlPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const candidates = [
    payload,
    payload.data,
    payload.infectionControl,
    payload.data?.infectionControl,
    payload.record,
    payload.result,
    payload.patient?.infectionControl,
  ];

  for (const node of candidates) {
    if (!node || typeof node !== 'object') continue;
    if (
      'InfectionCarePlanCompletion' in node
      || 'infectionCarePlanCompletion' in node
      || 'anyDiabetes' in node
      || 'DiabetesCarePlanCompletion' in node
      || 'isThePatientBedBound' in node
    ) {
      return node;
    }
  }

  return null;
}

function mergeRawPatientWithInfectionControl(rawPatient, infectionRecord) {
  if (!rawPatient || typeof rawPatient !== 'object') return rawPatient;
  if (!infectionRecord || typeof infectionRecord !== 'object') return rawPatient;

  const ic = infectionRecord.infectionControl && typeof infectionRecord.infectionControl === 'object'
    ? infectionRecord.infectionControl
    : infectionRecord;

  return {
    ...rawPatient,
    infectionControl: { ...(rawPatient.infectionControl || {}), ...ic },
  };
}

async function fetchPatientInfectionControlRecord(patientId) {
  const pid = encodeURIComponent(String(patientId || '').trim());
  if (!pid) return null;

  const paths = [
    `${PATIENT_INFECTION_CONTROL_PATH}?patientId=${pid}`,
  ];

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) continue;
      console.log('[infectionControl] raw response from', path, JSON.stringify(payload).slice(0, 500));
      const unwrapped = unwrapInfectionControlPayload(payload);
      if (unwrapped) return unwrapped;
      if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
        console.warn('[infectionControl] payload received but could not unwrap:', Object.keys(payload));
        return payload;
      }
    } catch {
      // try next path
    }
  }

  return null;
}

function infectionControlBool(value, fallback = false) {
  if (value === true || value === false) return value;
  if (fallback === true || fallback === false) return fallback;
  return false;
}

function buildInfectionControlPatchPayload(patientId, form, existingInfectionControl = {}) {
  const ic = form?.infectionControl || {};
  const existing = existingInfectionControl || {};

  return {
    patientId,
    InfectionCarePlanCompletion: infectionControlBool(
      ic.InfectionCarePlanCompletion,
      existing.InfectionCarePlanCompletion ?? existing.infectionCarePlanCompletion,
    ),
    anyDiabetes: infectionControlBool(ic.anyDiabetes, existing.anyDiabetes),
    DiabetesCarePlanCompletion: infectionControlBool(
      ic.DiabetesCarePlanCompletion,
      existing.DiabetesCarePlanCompletion ?? existing.diabetesCarePlanCompletion,
    ),
    isThePatientBedBound: infectionControlBool(ic.isThePatientBedBound, existing.isThePatientBedBound),
  };
}

async function persistInfectionControlToDb(patientId, form, existingInfectionControl = {}) {
  const payload = buildInfectionControlPatchPayload(patientId, form, existingInfectionControl);

  try {
    return await patchPatientEndpoint(PATIENT_INFECTION_CONTROL_PATH, payload);
  } catch (patchError) {
    if (!hygienePsychApiErrorIndicatesNotFound(patchError)) {
      throw patchError;
    }
  }

  try {
    await postPatientEndpoint(PATIENT_INFECTION_CONTROL_PATH, payload);
  } catch (postError) {
    if (!hygienePsychApiErrorIndicatesExists(postError)) {
      throw postError;
    }
    return patchPatientEndpoint(PATIENT_INFECTION_CONTROL_PATH, payload);
  }

  return patchPatientEndpoint(PATIENT_INFECTION_CONTROL_PATH, payload);
}

async function persistInfectionControlWithIdFallback(form, rawPatient, routeFallback) {
  const idCandidates = collectSleepNutritionLookupIds(rawPatient, routeFallback);
  if (!idCandidates.length) {
    throw new Error('Patient ID is required to save infection control records.');
  }

  const existing = extractInfectionControlFromRaw(rawPatient);
  let lastError;

  for (const patientId of idCandidates) {
    try {
      const patchResponse = await persistInfectionControlToDb(patientId, form, existing);
      return { patientId, patchResponse };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to save infection control to the server.');
}

function applyInfectionControlFormToNormalized(profile, form) {
  if (!profile || !form?.infectionControl) return profile;
  const ic = form.infectionControl;
  const tri = (value) => (value === true || value === false ? value : null);

  return {
    ...profile,
    infection: {
      riskPlan: tri(ic.InfectionCarePlanCompletion) ?? profile.infection?.riskPlan ?? null,
    },
    diabetes: {
      has: tri(ic.anyDiabetes) ?? profile.diabetes?.has ?? null,
      carePlan: tri(ic.DiabetesCarePlanCompletion) ?? profile.diabetes?.carePlan ?? null,
      stockings: tri(ic.isThePatientBedBound) ?? profile.diabetes?.stockings ?? null,
    },
  };
}

function mergeInfectionControlFormIntoRawPatient(rawPatient, form) {
  if (!rawPatient || typeof rawPatient !== 'object' || !form) return rawPatient;
  const patientId = resolvePatientMutationId(rawPatient) || '';
  return mergeRawPatientWithInfectionControl(
    rawPatient,
    buildInfectionControlPatchPayload(patientId, form, extractInfectionControlFromRaw(rawPatient)),
  );
}

function extractBreathPainFromRaw(rawPatient) {
  if (!rawPatient || typeof rawPatient !== 'object') return {};

  const direct =
    rawPatient.breathPain
    || rawPatient.data?.breathPain
    || rawPatient.patient?.breathPain;

  if (direct && typeof direct === 'object') return direct;

  return {};
}

function unwrapBreathPainPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const candidates = [
    payload,
    payload.data,
    payload.breathPain,
    payload.data?.breathPain,
    payload.record,
    payload.result,
    payload.patient?.breathPain,
  ];

  for (const node of candidates) {
    if (!node || typeof node !== 'object') continue;
    if (
      'painPresent' in node
      || 'anagelsiaPrescribed' in node
      || 'analgesiaPrescribed' in node
      || 'locationOfPain' in node
      || 'painScore' in node
      || 'anyBreathingDifficulties' in node
    ) {
      return node;
    }
  }

  return null;
}

function mergeRawPatientWithBreathPain(rawPatient, breathPainRecord) {
  if (!rawPatient || typeof rawPatient !== 'object') return rawPatient;
  if (!breathPainRecord || typeof breathPainRecord !== 'object') return rawPatient;

  const bp = breathPainRecord.breathPain && typeof breathPainRecord.breathPain === 'object'
    ? breathPainRecord.breathPain
    : breathPainRecord;

  return {
    ...rawPatient,
    breathPain: { ...(rawPatient.breathPain || {}), ...bp },
  };
}

async function fetchPatientBreathPainRecord(patientId) {
  const pid = encodeURIComponent(String(patientId || '').trim());
  if (!pid) return null;

  const paths = [
    `${PATIENT_BREATH_PAIN_PATH}?patientId=${pid}`,
  ];

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) continue;
      console.log('[breathPain] raw response from', path, JSON.stringify(payload).slice(0, 500));
      const unwrapped = unwrapBreathPainPayload(payload);
      if (unwrapped) return unwrapped;
      if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
        console.warn('[breathPain] payload received but could not unwrap:', Object.keys(payload));
        return payload;
      }
    } catch {
      // try next path
    }
  }

  return null;
}

function resolveBreathPainBool(formValue, existingValue) {
  if (formValue === true || formValue === false) return formValue;
  if (existingValue === true || existingValue === false) return existingValue;
  return false;
}

function triBoolFromApiValue(value) {
  if (value === true || value === false) return value;
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'yes' || normalized === 'true') return true;
  if (normalized === 'no' || normalized === 'false') return false;
  return null;
}

function buildBreathPainPatchPayload(patientId, form, existingBreathPain = {}) {
  const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '');
  const existing = existingBreathPain || {};
  const bp = form?.breathPain || {};

  const painPresentTri = bp.painPresent === true || bp.painPresent === false
    ? bp.painPresent
    : triBoolFromApiValue(existing.painPresent);

  return {
    patientId,
    anyBreathingDifficulties: resolveBreathPainBool(bp.anyBreathingDifficulties, existing.anyBreathingDifficulties),
    homeOxygenNeeded: resolveBreathPainBool(bp.homeOxygenNeeded, existing.homeOxygenNeeded),
    isSmoker: resolveBreathPainBool(bp.isSmoker, existing.isSmoker),
    everSmoked: resolveBreathPainBool(bp.everSmoked, existing.everSmoked),
    painPresent: yesNo(painPresentTri),
    anagelsiaPrescribed: resolveBreathPainBool(
      bp.anagelsiaPrescribed,
      existing.anagelsiaPrescribed ?? existing.analgesiaPrescribed,
    ),
    locationOfPain: String(bp.locationOfPain ?? existing.locationOfPain ?? ''),
    painScore: bp.painScore !== '' && bp.painScore !== undefined && bp.painScore !== null
      ? String(bp.painScore)
      : String(existing.painScore ?? ''),
  };
}

async function persistBreathPainWithIdFallback(form, rawPatient, routeFallback) {
  const idCandidates = collectSleepNutritionLookupIds(rawPatient, routeFallback);
  if (!idCandidates.length) {
    throw new Error('Patient ID is required to save breath & pain assessment.');
  }

  const existing = extractBreathPainFromRaw(rawPatient);
  let lastError;

  for (const patientId of idCandidates) {
    try {
      const patchResponse = await patchPatientEndpoint(
        PATIENT_BREATH_PAIN_PATH,
        buildBreathPainPatchPayload(patientId, form, existing),
      );
      return { patientId, patchResponse };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to save breath & pain assessment to the server.');
}

function applyPainFormToNormalized(profile, form) {
  if (!profile || !form?.breathPain) return profile;
  const bp = form.breathPain;
  const tri = (value) => (value === true || value === false ? value : null);
  const analgesiaPrescribed = tri(bp.anagelsiaPrescribed) ?? profile.pain?.analgesiaPrescribed ?? null;
  let analgesia = profile.pain?.analgesia || '';
  if (analgesiaPrescribed === true) analgesia = 'Prescribed';
  else if (analgesiaPrescribed === false) analgesia = 'Not prescribed';

  return {
    ...profile,
    pain: {
      present: tri(bp.painPresent) ?? profile.pain?.present ?? null,
      analgesiaPrescribed,
      analgesia,
      location: String(bp.locationOfPain ?? profile.pain?.location ?? ''),
      score: bp.painScore !== '' && bp.painScore !== undefined && bp.painScore !== null
        ? Number(bp.painScore) || 0
        : profile.pain?.score ?? null,
    },
  };
}

function mergePainFormIntoRawPatient(rawPatient, form) {
  if (!rawPatient || typeof rawPatient !== 'object' || !form) return rawPatient;
  const patientId = resolvePatientMutationId(rawPatient) || '';
  return mergeRawPatientWithBreathPain(
    rawPatient,
    buildBreathPainPatchPayload(patientId, form, extractBreathPainFromRaw(rawPatient)),
  );
}

function extractPersonalHygieneFromRaw(rawPatient) {
  if (!rawPatient || typeof rawPatient !== 'object') return {};

  const direct =
    rawPatient.personal
    || rawPatient.hygienePsychological?.personal
    || rawPatient.sleepNutrition?.personal
    || rawPatient.data?.personal
    || rawPatient.data?.sleepNutrition?.personal
    || rawPatient.patient?.personal
    || rawPatient.patient?.sleepNutrition?.personal;

  if (direct && typeof direct === 'object') return direct;

  const queue = [rawPatient];
  const seen = new Set();
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    if (node.personal && typeof node.personal === 'object' && (
      'hygieneNeeds' in node.personal
      || 'mouthCarePlan' in node.personal
      || 'diabeteFoot' in node.personal
    )) {
      return node.personal;
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') queue.push(value);
    }
    if (seen.size > 48) break;
  }

  return {};
}

function extractBladderBowelFromRaw(rawPatient) {
  if (!rawPatient || typeof rawPatient !== 'object') return {};

  const direct =
    rawPatient.bladderBowel
    || rawPatient.hygienePsychological?.bladderBowel
    || rawPatient.sleepNutrition?.bladderBowel
    || rawPatient.data?.bladderBowel
    || rawPatient.data?.sleepNutrition?.bladderBowel
    || rawPatient.patient?.bladderBowel
    || rawPatient.patient?.sleepNutrition?.bladderBowel;

  if (direct && typeof direct === 'object') return direct;

  const queue = [rawPatient];
  const seen = new Set();
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    if (node.bladderBowel && typeof node.bladderBowel === 'object') return node.bladderBowel;
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') queue.push(value);
    }
    if (seen.size > 48) break;
  }

  return {};
}

function getSleepFieldValue(sleep, ...keys) {
  if (!sleep || typeof sleep !== 'object') return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(sleep, key)) {
      return sleep[key];
    }
  }
  return undefined;
}

function normalizeSleepRecord(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    wakeUpAtNight: getSleepFieldValue(source, 'wakeUpAtNight', 'wake_up_at_night'),
    UseOfNightSedation: getSleepFieldValue(
      source,
      'UseOfNightSedation',
      'useOfNightSedation',
      'use_of_night_sedation',
      'nightSedation',
      'night_sedation',
    ),
    userSleepWell: getSleepFieldValue(source, 'userSleepWell', 'user_sleep_well'),
    RestDuringTheDay: getSleepFieldValue(source, 'RestDuringTheDay', 'restDuringTheDay', 'rest_during_the_day'),
    usualTimeToWakeUp: String(getSleepFieldValue(source, 'usualTimeToWakeUp', 'usual_time_to_wake_up') ?? ''),
    bestSleepingPosition: String(getSleepFieldValue(source, 'bestSleepingPosition', 'best_sleeping_position') ?? ''),
  };
}

function extractSleepFromRaw(rawPatient) {
  if (!rawPatient || typeof rawPatient !== 'object') return {};

  const direct =
    rawPatient.sleepNutrition?.sleep
    || rawPatient.sleep
    || rawPatient.data?.sleepNutrition?.sleep
    || rawPatient.data?.sleep
    || rawPatient.patient?.sleepNutrition?.sleep
    || rawPatient.patient?.sleep;

  if (direct && typeof direct === 'object') {
    return normalizeSleepRecord(direct);
  }

  const queue = [rawPatient];
  const seen = new Set();
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    if (node.sleep && typeof node.sleep === 'object' && (
      'wakeUpAtNight' in node.sleep
      || 'UseOfNightSedation' in node.sleep
      || 'useOfNightSedation' in node.sleep
      || 'userSleepWell' in node.sleep
    )) {
      return normalizeSleepRecord(node.sleep);
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') queue.push(value);
    }
    if (seen.size > 48) break;
  }

  return {};
}

function resolveSleepBoolForPatch(formValue, existingRecord, ...keys) {
  if (formValue === true || formValue === false) return formValue;
  const existing = getSleepFieldValue(existingRecord, ...keys);
  if (existing === true || existing === false) return existing;
  const normalized = String(existing ?? '').toLowerCase();
  if (normalized === 'yes' || normalized === 'true') return true;
  if (normalized === 'no' || normalized === 'false') return false;
  return false;
}

function buildSleepSectionPatchPayload(form, rawPatient) {
  const existingSleep = extractSleepFromRaw(rawPatient);
  const s = form?.sleepNutrition?.sleep || {};
  return {
    wakeUpAtNight: Boolean(resolveSleepBoolForPatch(s.wakeUpAtNight, existingSleep, 'wakeUpAtNight', 'wake_up_at_night')),
    UseOfNightSedation: Boolean(resolveSleepBoolForPatch(
      s.UseOfNightSedation,
      existingSleep,
      'UseOfNightSedation',
      'useOfNightSedation',
      'use_of_night_sedation',
      'nightSedation',
      'night_sedation',
    )),
    userSleepWell: Boolean(resolveSleepBoolForPatch(s.userSleepWell, existingSleep, 'userSleepWell', 'user_sleep_well')),
    RestDuringTheDay: Boolean(resolveSleepBoolForPatch(
      s.RestDuringTheDay,
      existingSleep,
      'RestDuringTheDay',
      'restDuringTheDay',
      'rest_during_the_day',
    )),
    usualTimeToWakeUp: String(
      s.usualTimeToWakeUp ?? getSleepFieldValue(existingSleep, 'usualTimeToWakeUp', 'usual_time_to_wake_up') ?? '',
    ),
    bestSleepingPosition: String(
      s.bestSleepingPosition ?? getSleepFieldValue(existingSleep, 'bestSleepingPosition', 'best_sleeping_position') ?? '',
    ),
  };
}

async function persistSleepSectionWithIdFallback(form, rawPatient, routeFallback) {
  const idCandidates = collectSleepNutritionLookupIds(rawPatient, routeFallback);
  if (!idCandidates.length) {
    throw new Error('Patient ID is required to save sleep records.');
  }

  const sleep = buildSleepSectionPatchPayload(form, rawPatient);
  let lastError;

  for (const patientId of idCandidates) {
    const payload = { patientId, sleep };
    try {
      const patchResponse = await patchPatientEndpoint('/patients/sleep-nutrition', payload);
      return { patientId, patchResponse };
    } catch (patchError) {
      lastError = patchError;
      if (!sleepNutritionApiErrorIndicatesNotFound(patchError)) continue;
    }

    try {
      await postPatientEndpoint('/patients/sleep-nutrition', payload);
      const patchResponse = await patchPatientEndpoint('/patients/sleep-nutrition', payload);
      return { patientId, patchResponse };
    } catch (postError) {
      lastError = postError;
      if (!sleepNutritionApiErrorIndicatesExists(postError)) continue;
      try {
        const patchResponse = await patchPatientEndpoint('/patients/sleep-nutrition', payload);
        return { patientId, patchResponse };
      } catch (retryPatchError) {
        lastError = retryPatchError;
      }
    }
  }

  throw lastError || new Error('Unable to save sleep record to the server.');
}

function applySleepFormToNormalized(profile, form) {
  if (!profile || !form?.sleepNutrition?.sleep) return profile;
  const s = form.sleepNutrition.sleep;
  const tri = (value) => (value === true || value === false ? value : null);
  return {
    ...profile,
    sleep: {
      nightWake: tri(s.wakeUpAtNight) ?? profile.sleep?.nightWake ?? null,
      sedation: tri(s.UseOfNightSedation) ?? profile.sleep?.sedation ?? null,
      sleepsWell: tri(s.userSleepWell) ?? profile.sleep?.sleepsWell ?? null,
      bestPosition: String(s.bestSleepingPosition ?? profile.sleep?.bestPosition ?? ''),
      wakeTime: String(s.usualTimeToWakeUp ?? profile.sleep?.wakeTime ?? ''),
    },
  };
}

function mergeSleepFormIntoRawPatient(rawPatient, form) {
  if (!rawPatient || typeof rawPatient !== 'object' || !form) return rawPatient;
  const existingSleep = extractSleepFromRaw(rawPatient);
  const s = form?.sleepNutrition?.sleep || {};
  const sleep = normalizeSleepRecord({
    ...existingSleep,
    wakeUpAtNight: s.wakeUpAtNight === true || s.wakeUpAtNight === false
      ? s.wakeUpAtNight
      : getSleepFieldValue(existingSleep, 'wakeUpAtNight'),
    UseOfNightSedation: s.UseOfNightSedation === true || s.UseOfNightSedation === false
      ? s.UseOfNightSedation
      : getSleepFieldValue(existingSleep, 'UseOfNightSedation', 'useOfNightSedation', 'use_of_night_sedation', 'nightSedation'),
    userSleepWell: s.userSleepWell === true || s.userSleepWell === false
      ? s.userSleepWell
      : getSleepFieldValue(existingSleep, 'userSleepWell'),
    RestDuringTheDay: s.RestDuringTheDay === true || s.RestDuringTheDay === false
      ? s.RestDuringTheDay
      : getSleepFieldValue(existingSleep, 'RestDuringTheDay', 'restDuringTheDay'),
    usualTimeToWakeUp: s.usualTimeToWakeUp ?? getSleepFieldValue(existingSleep, 'usualTimeToWakeUp') ?? '',
    bestSleepingPosition: s.bestSleepingPosition ?? getSleepFieldValue(existingSleep, 'bestSleepingPosition') ?? '',
  });
  return mergeRawPatientWithSleepNutrition(rawPatient, { sleep });
}

function mergeRawPatientWithSleepNutrition(rawPatient, sleepNutritionRecord) {
  if (!rawPatient || typeof rawPatient !== 'object') return rawPatient;
  if (!sleepNutritionRecord || typeof sleepNutritionRecord !== 'object') return rawPatient;

  const sn = sleepNutritionRecord.sleepNutrition && typeof sleepNutritionRecord.sleepNutrition === 'object'
    ? sleepNutritionRecord.sleepNutrition
    : sleepNutritionRecord;

  const normalizedSleep = normalizeSleepRecord(sn.sleep || rawPatient.sleep);

  return {
    ...rawPatient,
    sleepNutrition: { ...(rawPatient.sleepNutrition || {}), ...sn, sleep: normalizedSleep },
    sleep: normalizedSleep,
    nutrition: sn.nutrition || rawPatient.nutrition,
    bladderBowel: sn.bladderBowel || rawPatient.bladderBowel,
    personal: sn.personal || rawPatient.personal,
    psychologicalNeeds: sn.psychologicalNeeds || rawPatient.psychologicalNeeds,
    hygienePsychological: {
      ...(rawPatient.hygienePsychological || {}),
      personal: sn.personal || rawPatient.hygienePsychological?.personal,
      bladderBowel: sn.bladderBowel || rawPatient.hygienePsychological?.bladderBowel,
      psychologicalNeeds: sn.psychologicalNeeds || rawPatient.hygienePsychological?.psychologicalNeeds,
    },
  };
}

async function fetchPatientSleepNutritionRecord(patientId) {
  const pid = encodeURIComponent(String(patientId || '').trim());
  if (!pid) return null;

  const paths = [
    `/patients/sleep-nutrition?patientId=${pid}`,
  ];

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) continue;
      console.log('[sleepNutrition] raw response from', path, JSON.stringify(payload).slice(0, 500));
      const unwrapped = unwrapSleepNutritionPayload(payload);
      if (unwrapped) return unwrapped;
      if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
        console.warn('[sleepNutrition] payload received but could not unwrap:', Object.keys(payload));
        return payload;
      }
    } catch {
      // try next path
    }
  }

  return null;
}

function unwrapInitialVitalsPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload,
    payload.data,
    payload.record,
    payload.initialVitals,
    payload.initial_vitals,
    payload.vitals,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    if (
      candidate.bloodPressure != null
      || candidate.bloodSugar != null
      || candidate.currentMedications != null
      || candidate.current_medications != null
      || candidate.medications != null
    ) {
      return candidate;
    }
  }
  return null;
}

async function fetchPatientInitialVitalsRecord(patientId) {
  const pid = encodeURIComponent(String(patientId || '').trim());
  if (!pid) return null;

  const paths = [
    `/patients/initial-vitals?patientId=${pid}`,
  ];

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) continue;
      console.log('[initialVitals] raw response from', path, JSON.stringify(payload).slice(0, 500));
      const unwrapped = unwrapInitialVitalsPayload(payload);
      if (unwrapped) return unwrapped;
      if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
        console.warn('[initialVitals] payload received but could not unwrap:', Object.keys(payload));
        return payload;
      }
    } catch {
      // try next path
    }
  }

  return null;
}

function mergeRawPatientWithInitialVitals(rawPatient, initialVitalsRecord) {
  if (!rawPatient || typeof rawPatient !== 'object' || !initialVitalsRecord) return rawPatient;
  const iv = initialVitalsRecord.initialVitals || initialVitalsRecord.initial_vitals || initialVitalsRecord;
  return {
    ...rawPatient,
    initialVitals: { ...(rawPatient.initialVitals || {}), ...iv },
    vitals: { ...(rawPatient.vitals || {}), ...iv },
  };
}

function collectAdmissionMedicationTextSources(rawPatient, patientIdValue) {
  const idCandidates = collectSleepNutritionLookupIds(rawPatient, patientIdValue);
  const draft = findAdmissionDraftForPatient({
    patientId: patientIdValue,
    id: patientIdValue,
    uuid: rawPatient?.uuid,
    profileRouteId: patientIdValue,
  });
  const draftText = String(draft?.form?.vitals?.currentMedications || '').trim();

  const seen = new Set();
  const unique = [];
  [
    extractMedicationTextFromPatientRaw(rawPatient),
    draftText,
    collectCachedAdmissionMedicationTexts(idCandidates),
  ]
    .map((text) => String(text || '').trim())
    .filter(Boolean)
    .forEach((text) => {
      const key = text.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(text);
    });

  return unique;
}

function sectionAlreadyLoaded(rawPatient, key, requiredFields) {
  const section = rawPatient?.[key];
  if (!section || typeof section !== 'object') return false;
  return requiredFields.some((f) => section[f] != null);
}

async function enrichRawPatientRecord(rawPatient, patientId) {
  if (!rawPatient || typeof rawPatient !== 'object') return rawPatient;

  let merged = rawPatient;
  const idCandidates = collectSleepNutritionLookupIds(rawPatient, patientId);

  const hasHygiene = sectionAlreadyLoaded(rawPatient, 'hygienePsychological', ['personal', 'bladderBowel', 'psychologicalNeeds']);
  const hasSleep = sectionAlreadyLoaded(rawPatient, 'sleepNutrition', ['sleep', 'nutrition']);
  const hasBreath = sectionAlreadyLoaded(rawPatient, 'breathPain', ['breathing', 'pain', 'breathingAssessment']);
  const hasInfection = sectionAlreadyLoaded(rawPatient, 'infectionControl', ['mrsa', 'infectionRisk', 'hepatitis']);
  const hasVitals = sectionAlreadyLoaded(rawPatient, 'initialVitals', ['bloodPressure', 'bloodSugar', 'currentMedications']);

  if (hasHygiene && hasSleep && hasBreath && hasInfection && hasVitals) {
    return rawPatient;
  }

  for (const pid of idCandidates) {
    const [
      hygienePsych,
      sleepNutrition,
      breathPain,
      infectionControl,
      initialVitals,
    ] = await Promise.all([
      hasHygiene ? null : fetchPatientHygienePsychologicalRecord(pid).catch(() => null),
      hasSleep ? null : fetchPatientSleepNutritionRecord(pid).catch(() => null),
      null,
      null,
      null,
    ]);

    let candidate = merged;
    let foundSection = false;

    if (hygienePsych) {
      candidate = mergeRawPatientWithHygienePsychological(candidate, hygienePsych);
      foundSection = true;
    }

    if (sleepNutrition) {
      candidate = mergeRawPatientWithSleepNutrition(candidate, sleepNutrition);
      foundSection = true;
    }

    if (breathPain) {
      candidate = mergeRawPatientWithBreathPain(candidate, breathPain);
      foundSection = true;
    }

    if (infectionControl) {
      candidate = mergeRawPatientWithInfectionControl(candidate, infectionControl);
      foundSection = true;
    }

    if (initialVitals) {
      candidate = mergeRawPatientWithInitialVitals(candidate, initialVitals);
      foundSection = true;
    }

    if (foundSection) {
      merged = candidate;
      if (hygienePsych || initialVitals) break;
    }
  }

  return merged;
}

function hygienePsychBool(value, fallback = false) {
  if (value === true || value === false) return value;
  if (fallback === true || fallback === false) return fallback;
  return false;
}

function buildPersonalHygienePatchFields(form, existing = {}) {
  const personal = form?.hygienePsych?.personal || {};
  return {
    hygieneNeeds: hygienePsychBool(personal.hygieneNeeds, existing.hygieneNeeds),
    mouthCarePlan: hygienePsychBool(personal.mouthCarePlan, existing.mouthCarePlan),
    diabeteFoot: hygienePsychBool(personal.diabeteFoot, existing.diabeteFoot),
  };
}

function buildBladderBowelPatchFields(form, existing = {}) {
  const bb = form?.hygienePsych?.bladderBowel || {};
  return {
    bladderDysfunction: hygienePsychBool(bb.bladderDysfunction, existing.bladderDysfunction),
    catheterDescription: String(bb.catheterDescription ?? existing.catheterDescription ?? ''),
    catheterPlan: hygienePsychBool(bb.catheterPlan, existing.catheterPlan),
    incontinentPads: hygienePsychBool(bb.incontinentPads, existing.incontinentPads),
  };
}

function buildPsychologicalNeedsPatchFields(form, existing = {}) {
  const psych = form?.hygienePsych?.psychologicalNeeds || {};
  const existingNorm = normalizePsychologicalNeedsRecord(existing);
  const anxietyForm = psych.anxietyhistory ?? psych.anxietyHistory;
  const anxietyExisting = existingNorm.anxietyhistory ?? existing.anxietyHistory;
  const anxietyValue = hygienePsychBool(anxietyForm, anxietyExisting);

  return {
    psychologicalNeeds: hygienePsychBool(psych.psychologicalNeeds, existingNorm.psychologicalNeeds),
    depressionHistory: hygienePsychBool(psych.depressionHistory, existingNorm.depressionHistory),
    anxietyhistory: anxietyValue,
    anxietyHistory: anxietyValue,
    signDementia: hygienePsychBool(psych.signDementia, existingNorm.signDementia),
    psychologicalNotes: String(psych.psychologicalNotes ?? existingNorm.psychologicalNotes ?? ''),
  };
}

function buildHygienePsychologicalPayload(patientId, form, rawPatient = null) {
  const existingPersonal = extractPersonalHygieneFromRaw(rawPatient);
  const existingBladder = extractBladderBowelFromRaw(rawPatient);
  const existingPsych = extractPsychologicalNeedsFromRaw(rawPatient);

  return {
    patientId,
    personal: buildPersonalHygienePatchFields(form, existingPersonal),
    bladderBowel: buildBladderBowelPatchFields(form, existingBladder),
    psychologicalNeeds: buildPsychologicalNeedsPatchFields(form, existingPsych),
  };
}

function buildSleepNutritionBooleanSectionsFromForm(form) {
  const optBool = (value) => (value === true || value === false ? value : false);
  const s = form?.sleepNutrition?.sleep || {};
  const n = form?.sleepNutrition?.nutrition || {};
  return {
    sleep: {
      wakeUpAtNight: optBool(s.wakeUpAtNight),
      UseOfNightSedation: optBool(s.UseOfNightSedation),
      userSleepWell: optBool(s.userSleepWell),
      RestDuringTheDay: optBool(s.RestDuringTheDay),
      usualTimeToWakeUp: String(s.usualTimeToWakeUp ?? ''),
      bestSleepingPosition: String(s.bestSleepingPosition ?? ''),
    },
    nutrition: {
      allergy: optBool(n.allergy),
      specialDiet: optBool(n.specialDiet),
      needHelpInEating: optBool(n.needHelpInEating),
      feedingAid: optBool(n.feedingAid),
      swallowingDifficulties: optBool(n.swallowingDifficulties),
      dietType: String(n.dietType ?? ''),
      ngTube: optBool(n.ngTube),
      nutritionConcerns: String(n.nutritionConcerns ?? ''),
    },
  };
}

function applyPersonalHygieneFormToNormalized(profile, form) {
  if (!profile || !form?.hygienePsych?.personal) return profile;
  const personal = form.hygienePsych.personal;
  const tri = (value) => (value === true || value === false ? value : null);
  return {
    ...profile,
    hygiene: {
      independent: tri(personal.hygieneNeeds) ?? profile.hygiene?.independent ?? null,
      mouthCare: tri(personal.mouthCarePlan) ?? profile.hygiene?.mouthCare ?? null,
      diabeteFoot: tri(personal.diabeteFoot) ?? profile.hygiene?.diabeteFoot ?? null,
    },
  };
}

function mergePersonalHygieneFormIntoRawPatient(rawPatient, form) {
  if (!rawPatient || typeof rawPatient !== 'object' || !form) return rawPatient;
  const patientId = resolvePatientMutationId(rawPatient) || '';
  return mergeRawPatientWithHygienePsychological(
    rawPatient,
    buildHygienePsychologicalPayload(patientId, form, rawPatient),
  );
}

function applyBladderBowelFormToNormalized(profile, form) {
  if (!profile || !form?.hygienePsych?.bladderBowel) return profile;
  const bb = form.hygienePsych.bladderBowel;
  const tri = (value) => (value === true || value === false ? value : null);
  return {
    ...profile,
    bladder: {
      dysfunction: tri(bb.bladderDysfunction) ?? profile.bladder?.dysfunction ?? null,
      catheter: tri(bb.catheterPlan) ?? profile.bladder?.catheter ?? null,
      pads: tri(bb.incontinentPads) ?? profile.bladder?.pads ?? null,
      catheterDescription: String(bb.catheterDescription ?? profile.bladder?.catheterDescription ?? '').trim(),
    },
  };
}

function mergeBladderBowelFormIntoRawPatient(rawPatient, form) {
  if (!rawPatient || typeof rawPatient !== 'object' || !form) return rawPatient;
  const patientId = resolvePatientMutationId(rawPatient) || '';
  return mergeRawPatientWithHygienePsychological(
    rawPatient,
    buildHygienePsychologicalPayload(patientId, form, rawPatient),
  );
}

function applyPsychologicalFormToNormalized(profile, form) {
  if (!profile || !form?.hygienePsych?.psychologicalNeeds) return profile;
  const psych = form.hygienePsych.psychologicalNeeds;
  const tri = (value) => (value === true || value === false ? value : null);
  const anxietyTri = tri(psych.anxietyhistory ?? psych.anxietyHistory);
  return {
    ...profile,
    psych: {
      concerns: tri(psych.psychologicalNeeds) ?? profile.psych?.concerns ?? null,
      depression: tri(psych.depressionHistory) ?? profile.psych?.depression ?? null,
      anxiety: anxietyTri ?? profile.psych?.anxiety ?? null,
      dementia: tri(psych.signDementia) ?? profile.psych?.dementia ?? null,
      notes: String(psych.psychologicalNotes ?? profile.psych?.notes ?? '').trim(),
    },
  };
}

function mergePsychologicalFormIntoRawPatient(rawPatient, form) {
  if (!rawPatient || typeof rawPatient !== 'object' || !form) return rawPatient;
  const patientId = resolvePatientMutationId(rawPatient) || '';
  return mergeRawPatientWithHygienePsychological(
    rawPatient,
    buildHygienePsychologicalPayload(patientId, form, rawPatient),
  );
}

/** Backend requires patientId plus at least one sleep or nutrition field on /patients/sleep-nutrition. */
function withSleepNutritionApiRequirement(payload, form) {
  const out = { ...(payload || {}) };
  const sleepBlock = out.sleep && typeof out.sleep === 'object' ? out.sleep : null;
  const nutritionBlock = out.nutrition && typeof out.nutrition === 'object' ? out.nutrition : null;
  const hasSleep = sleepBlock && Object.values(sleepBlock).some((v) => v !== undefined && v !== '');
  const hasNutrition = nutritionBlock && Object.values(nutritionBlock).some((v) => v !== undefined && v !== '');
  if (hasSleep || hasNutrition) return out;

  const triBool = (value) => (value === true || value === false ? value : undefined);
  const s = form?.sleepNutrition?.sleep || {};
  const n = form?.sleepNutrition?.nutrition || {};

  const sleepCandidates = [
    ['wakeUpAtNight', triBool(s.wakeUpAtNight)],
    ['UseOfNightSedation', triBool(s.UseOfNightSedation)],
    ['userSleepWell', triBool(s.userSleepWell)],
    ['RestDuringTheDay', triBool(s.RestDuringTheDay)],
  ];
  const sleepHit = sleepCandidates.find(([, v]) => v !== undefined);
  if (sleepHit) {
    out.sleep = { [sleepHit[0]]: sleepHit[1] };
    return out;
  }

  const nutritionCandidates = [
    ['allergy', triBool(n.allergy)],
    ['specialDiet', triBool(n.specialDiet)],
    ['needHelpInEating', triBool(n.needHelpInEating)],
    ['swallowingDifficulties', triBool(n.swallowingDifficulties)],
    ['ngTube', triBool(n.ngTube)],
  ];
  const nutritionHit = nutritionCandidates.find(([, v]) => v !== undefined);
  if (nutritionHit) {
    out.nutrition = { [nutritionHit[0]]: nutritionHit[1] };
    return out;
  }

  out.sleep = { userSleepWell: false };
  return out;
}

function patchSleepNutritionPayload(form, patientIdForPatch, body) {
  const merged = withSleepNutritionApiRequirement(
    { patientId: patientIdForPatch, ...(body || {}) },
    form,
  );
  const pruned = prunePatchPayload(merged) || {};
  return { ...pruned, patientId: patientIdForPatch };
}

function prunePatchPayload(value) {
  if (value === undefined || value === '') return undefined;
  if (Array.isArray(value)) {
    const next = value.map(prunePatchPayload).filter((item) => item !== undefined);
    return next.length ? next : undefined;
  }
  if (value && typeof value === 'object') {
    const nextEntries = Object.entries(value)
      .map(([key, item]) => [key, prunePatchPayload(item)])
      .filter(([, item]) => item !== undefined);
    return nextEntries.length ? Object.fromEntries(nextEntries) : undefined;
  }
  return value;
}

function applyCommunicationFormToNormalized(profile, form) {
  if (!profile || !form?.communicationStyle) return profile;
  const cs = form.communicationStyle;
  const tri = (value) => (value === true || value === false ? value : null);

  return {
    ...profile,
    communication: {
      needs: tri(cs.anyCommunicationNeeds) ?? profile.communication?.needs ?? null,
      hearing: tri(cs.anyHearingNeeds) ?? profile.communication?.hearing ?? null,
      speech: tri(cs.anySpeechImpairment) ?? profile.communication?.speech ?? null,
      visual: tri(cs.anyVisualImpairment) ?? profile.communication?.visual ?? null,
      understanding: tri(cs.anyUnderstandingDifficulties) ?? profile.communication?.understanding ?? null,
    },
    sectionCommunicationStyle: {
      ...(profile.sectionCommunicationStyle || {}),
      communicationNotes: String(cs.communicationNotes ?? profile.sectionCommunicationStyle?.communicationNotes ?? ''),
    },
  };
}

function applyBreathingFormToNormalized(profile, form) {
  if (!profile || !form?.breathPain) return profile;
  const bp = form.breathPain;
  const tri = (value) => (value === true || value === false ? value : null);

  return {
    ...profile,
    breathing: {
      difficulties: tri(bp.anyBreathingDifficulties) ?? profile.breathing?.difficulties ?? null,
      oxygen: tri(bp.homeOxygenNeeded) ?? profile.breathing?.oxygen ?? null,
      smoker: tri(bp.isSmoker) ?? profile.breathing?.smoker ?? null,
      everSmoked: tri(bp.everSmoked) ?? profile.breathing?.everSmoked ?? null,
    },
  };
}

function applyNutritionFormToNormalized(profile, form) {
  if (!profile || !form?.sleepNutrition?.nutrition) return profile;
  const n = form.sleepNutrition.nutrition;
  const tri = (value) => (value === true || value === false ? value : null);

  return {
    ...profile,
    nutrition: {
      allergies: tri(n.allergy) ?? profile.nutrition?.allergies ?? null,
      specialDiet: tri(n.specialDiet) ?? profile.nutrition?.specialDiet ?? null,
      helpEating: tri(n.needHelpInEating) ?? profile.nutrition?.helpEating ?? null,
      swallowing: tri(n.swallowingDifficulties) ?? profile.nutrition?.swallowing ?? null,
      dietType: String(n.dietType ?? profile.nutrition?.dietType ?? ''),
      ngTube: tri(n.ngTube) ?? profile.nutrition?.ngTube ?? null,
    },
  };
}

function applySkinMobilityFormToNormalized(profile, form) {
  if (!profile || !form?.skinMobility) return profile;
  const si = form.skinMobility.skinIntegrity || {};
  const ha = form.skinMobility.handlingAssessment || {};
  const tri = (value) => (value === true || value === false ? value : null);

  return {
    ...profile,
    skin: {
      openWounds: tri(si.openWounds) ?? profile.skin?.openWounds ?? null,
      pressureUlcer: tri(si.pressureUlcer) ?? profile.skin?.pressureUlcer ?? null,
    },
    mobility: {
      independent: tri(ha.isPatientMobile) ?? profile.mobility?.independent ?? null,
      bedMove: tri(ha.moveInBed) ?? profile.mobility?.bedMove ?? null,
      bedToChair: tri(ha.mobilityFromBedToChair) ?? profile.mobility?.bedToChair ?? null,
      toilet: tri(ha.mobilityToWashroom) ?? profile.mobility?.toilet ?? null,
    },
  };
}

function applyNextOfKinFormToNormalized(profile, form) {
  if (!profile || !form?.nextOfKin) return profile;
  const nk = form.nextOfKin;

  return {
    ...profile,
    doctor: {
      name: String(nk.personalDoctor ?? profile.doctor?.name ?? ''),
      facility: String(nk.personalDoctorFacility ?? profile.doctor?.facility ?? ''),
      phone: String(nk.personalDoctorContact ?? profile.doctor?.phone ?? ''),
    },
    emergency: {
      name: String(nk.fullName ?? profile.emergency?.name ?? ''),
      relationship: String(nk.relationship ?? profile.emergency?.relationship ?? ''),
      phone: String(nk.contactOne ?? profile.emergency?.phone ?? ''),
    },
    cultural: String(nk.spiritualNeed ?? profile.cultural ?? ''),
  };
}

function applyPersonalInfoFormToNormalized(profile, form) {
  if (!profile || !form?.personalInfo) return profile;
  const pi = form.personalInfo;
  const firstName = String(pi.firstName ?? '').trim();
  const lastName = String(pi.lastName ?? '').trim();

  return {
    ...profile,
    name: [firstName, lastName].filter(Boolean).join(' ').trim() || profile.name,
    regNo: pi.registrationNumber ?? profile.regNo,
    phone: pi.contactNumber ?? profile.phone,
    dob: pi.dateOfBirth ?? profile.dob,
    age: pi.age !== '' && pi.age !== undefined && pi.age !== null ? Number(pi.age) || profile.age : profile.age,
    gender: pi.gender ?? profile.gender,
    address: pi.residentialAddress ?? profile.address,
    gps: pi.gpsCode ?? profile.gps,
    email: pi.email ?? profile.email,
    preferredName: pi.preferredName ?? profile.preferredName,
    enrolled: pi.dateOfAdmission ?? profile.enrolled,
    dateOfAssessment: pi.dateOfAssessment ?? profile.dateOfAssessment,
    medicalHistory: form.medicalHistory?.medicalHistoryDescription ?? profile.medicalHistory,
  };
}

function applyCardEditFormToProfile(profile, form, cardId) {
  if (!profile || !form || !cardId) return profile;

  switch (cardId) {
    case 'clinical:communication':
      return applyCommunicationFormToNormalized(profile, form);
    case 'clinical:infection':
    case 'clinical:diabetes':
      return applyInfectionControlFormToNormalized(profile, form);
    case 'clinical:breathing':
      return applyBreathingFormToNormalized(profile, form);
    case 'clinical:pain':
      return applyPainFormToNormalized(profile, form);
    case 'clinical:psychological':
      return applyPsychologicalFormToNormalized(profile, form);
    case 'clinical:skin':
    case 'clinical:mobility':
      return applySkinMobilityFormToNormalized(profile, form);
    case 'care:sleep':
      return applySleepFormToNormalized(profile, form);
    case 'care:nutrition':
      return applyNutritionFormToNormalized(profile, form);
    case 'care:hygiene':
      return applyPersonalHygieneFormToNormalized(profile, form);
    case 'care:bladder':
      return applyBladderBowelFormToNormalized(profile, form);
    case 'care:physician':
    case 'care:emergency':
      return applyNextOfKinFormToNormalized(profile, form);
    default:
      return profile;
  }
}

function applyPatientUpdateFormToProfile(profile, form) {
  if (!profile || !form) return profile;

  let next = applyPersonalInfoFormToNormalized(profile, form);
  next = applyNextOfKinFormToNormalized(next, form);
  next = applyCommunicationFormToNormalized(next, form);
  next = applyInfectionControlFormToNormalized(next, form);
  next = applyBreathingFormToNormalized(next, form);
  next = applyPainFormToNormalized(next, form);
  next = applySleepFormToNormalized(next, form);
  next = applyNutritionFormToNormalized(next, form);
  next = applyPersonalHygieneFormToNormalized(next, form);
  next = applyBladderBowelFormToNormalized(next, form);
  next = applyPsychologicalFormToNormalized(next, form);
  next = applySkinMobilityFormToNormalized(next, form);
  return next;
}

const ProfileCardEditContext = createContext(null);

function ProfileCardEditForm({ cardId, initialForm, onFormChange, children }) {
  const [form, setForm] = useState(() => initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [cardId, initialForm]);

  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  const editApi = useMemo(() => ({
    getValue: (path) => getNestedFormValue(form, path),
    setField: (path, value) => {
      setForm((prev) => applyNestedFormUpdate(prev, path, value));
    },
  }), [form]);

  return (
    <ProfileCardEditContext.Provider value={editApi}>
      {children}
    </ProfileCardEditContext.Provider>
  );
}

function ProfileCardEditRow({ label, path, kind = 'tristate' }) {
  const edit = useContext(ProfileCardEditContext);
  if (!edit) return null;
  return renderCardEditRowField(edit, label, path, kind);
}

function renderCardTriStateField(edit, path) {
  const val = edit.getValue(path);
  return (
    <select
      className="form-select form-control-kh patient-profile-card-edit-field"
      value={val === true ? 'true' : val === false ? 'false' : 'unset'}
      onChange={(event) => {
        const next = event.target.value;
        edit.setField(path, next === 'unset' ? null : next === 'true');
      }}
    >
      <option value="unset">No data</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

function renderCardBoolField(edit, path) {
  const val = edit.getValue(path);
  return (
    <select
      className="form-select form-control-kh patient-profile-card-edit-field"
      value={val === true ? 'true' : val === false ? 'false' : 'false'}
      onChange={(event) => edit.setField(path, event.target.value === 'true')}
    >
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

function renderCardTextField(edit, path, type = 'text') {
  return (
    <input
      type={type}
      className="form-control form-control-kh patient-profile-card-edit-field"
      value={edit.getValue(path) ?? ''}
      onChange={(event) => edit.setField(path, event.target.value)}
    />
  );
}

function renderCardEditRowField(edit, label, path, kind = 'tristate') {
  return (
    <div className="patient-profile-card-edit-row">
      <span>{label}</span>
      {kind === 'text'
        ? renderCardTextField(edit, path)
        : kind === 'bool'
          ? renderCardBoolField(edit, path)
          : renderCardTriStateField(edit, path)}
    </div>
  );
}

async function persistProfileSection(sectionId, form, patientIdForPatch, persistOptions = {}) {
  const { rawPatient = null, routeFallback = '' } = persistOptions;
  const toBooleanString = (value) => (value ? 'true' : 'false');
  const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '');
  const optionalBoolean = (value) => (value === true || value === false ? value : undefined);
  const optionalText = (value) => {
    const normalized = String(value ?? '').trim();
    return normalized ? normalized : undefined;
  };

  switch (sectionId) {
    case 'clinical:communication':
      await patchPatientEndpoint('/patients/communication-style', {
        patientId: patientIdForPatch,
        anyCommunicationNeeds: Boolean(form.communicationStyle.anyCommunicationNeeds),
        anyHearingNeeds: Boolean(form.communicationStyle.anyHearingNeeds),
        anySpeechImpairment: Boolean(form.communicationStyle.anySpeechImpairment),
        anyVisualImpairment: Boolean(form.communicationStyle.anyVisualImpairment),
        anyUnderstandingDifficulties: Boolean(form.communicationStyle.anyUnderstandingDifficulties),
        communicationNotes: form.communicationStyle.communicationNotes,
      });
      return 'Communication updated.';
    case 'clinical:infection':
    case 'clinical:diabetes': {
      const { patchResponse } = await persistInfectionControlWithIdFallback(
        form,
        rawPatient,
        routeFallback || patientIdForPatch,
      );
      const message = sectionId === 'clinical:infection'
        ? 'Infection control updated.'
        : 'Diabetes management updated.';
      return { message, patchResponse };
    }
    case 'clinical:breathing':
    case 'clinical:pain': {
      const { patchResponse } = await persistBreathPainWithIdFallback(
        form,
        rawPatient,
        routeFallback || patientIdForPatch,
      );
      const message = sectionId === 'clinical:breathing'
        ? 'Breathing assessment updated.'
        : 'Pain assessment updated.';
      return { message, patchResponse };
    }
    case 'clinical:psychological': {
      const { patchResponse } = await persistHygienePsychologicalWithIdFallback(
        form,
        rawPatient,
        routeFallback || patientIdForPatch,
      );
      return { message: 'Psychological assessment updated.', patchResponse };
    }
    case 'clinical:skin':
    case 'clinical:mobility':
      try {
        await patchPatientEndpoint('/patients/skin-mobility', {
          patientId: patientIdForPatch,
          skinIntegrity: {
            openWounds: Boolean(form.skinMobility.skinIntegrity.openWounds),
            pressureUlcer: Boolean(form.skinMobility.skinIntegrity.pressureUlcer),
            gradeAdmission: form.skinMobility.skinIntegrity.gradeAdmission,
            securityItems: form.skinMobility.skinIntegrity.securityItems,
          },
          handlingAssessment: {
            isPatientMobile: Boolean(form.skinMobility.handlingAssessment.isPatientMobile),
            isEquipmentNeeded: Boolean(form.skinMobility.handlingAssessment.isEquipmentNeeded),
            numberOfStaffNeeded: Number(form.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
            moveInBed: Boolean(form.skinMobility.handlingAssessment.moveInBed),
            moveInBedEquipment: form.skinMobility.handlingAssessment.moveInBedEquipment,
            mobilityFromBedToChair: Boolean(form.skinMobility.handlingAssessment.mobilityFromBedToChair),
            mobilityFromBedToChairEquipment: form.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
            mobilityToWashroom: Boolean(form.skinMobility.handlingAssessment.mobilityToWashroom),
            mobilityToWashroomEquipment: form.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
          },
        });
      } catch {
        await patchPatientEndpoint('/patients/initial-vitals', {
          patientId: patientIdForPatch,
          skinIntegrity: {
            openWounds: Boolean(form.skinMobility.skinIntegrity.openWounds),
            pressureUlcer: Boolean(form.skinMobility.skinIntegrity.pressureUlcer),
            gradeAdmission: form.skinMobility.skinIntegrity.gradeAdmission,
            securityItems: form.skinMobility.skinIntegrity.securityItems,
          },
          handlingAssessment: {
            isPatientMobile: Boolean(form.skinMobility.handlingAssessment.isPatientMobile),
            isEquipmentNeeded: Boolean(form.skinMobility.handlingAssessment.isEquipmentNeeded),
            numberOfStaffNeeded: Number(form.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
            moveInBed: Boolean(form.skinMobility.handlingAssessment.moveInBed),
            moveInBedEquipment: form.skinMobility.handlingAssessment.moveInBedEquipment,
            mobilityFromBedToChair: Boolean(form.skinMobility.handlingAssessment.mobilityFromBedToChair),
            mobilityFromBedToChairEquipment: form.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
            mobilityToWashroom: Boolean(form.skinMobility.handlingAssessment.mobilityToWashroom),
            mobilityToWashroomEquipment: form.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
          },
        });
      }
      return sectionId === 'clinical:skin' ? 'Skin integrity updated.' : 'Mobility assessment updated.';
    case 'care:sleep': {
      const { patchResponse } = await persistSleepSectionWithIdFallback(
        form,
        rawPatient,
        routeFallback || patientIdForPatch,
      );
      return { message: 'Sleep record updated.', patchResponse };
    }
    case 'care:nutrition': {
      const payload = patchSleepNutritionPayload(form, patientIdForPatch, {
        nutrition: {
          allergy: optionalBoolean(form.sleepNutrition.nutrition.allergy),
          specialDiet: optionalBoolean(form.sleepNutrition.nutrition.specialDiet),
          needHelpInEating: optionalBoolean(form.sleepNutrition.nutrition.needHelpInEating),
          feedingAid: optionalBoolean(form.sleepNutrition.nutrition.feedingAid),
          swallowingDifficulties: optionalBoolean(form.sleepNutrition.nutrition.swallowingDifficulties),
          dietType: optionalText(form.sleepNutrition.nutrition.dietType),
          ngTube: optionalBoolean(form.sleepNutrition.nutrition.ngTube),
          nutritionConcerns: optionalText(form.sleepNutrition.nutrition.nutritionConcerns),
        },
      });
      await patchPatientEndpoint('/patients/sleep-nutrition', payload);
      return 'Nutrition record updated.';
    }
    case 'care:hygiene': {
      const { patchResponse } = await persistHygienePsychologicalWithIdFallback(
        form,
        rawPatient,
        routeFallback || patientIdForPatch,
      );
      return { message: 'Personal hygiene updated.', patchResponse };
    }
    case 'care:bladder': {
      const { patchResponse } = await persistHygienePsychologicalWithIdFallback(
        form,
        rawPatient,
        routeFallback || patientIdForPatch,
      );
      return { message: 'Bladder & bowel record updated.', patchResponse };
    }
    case 'care:physician':
    case 'care:emergency':
      await patchPatientEndpoint('/patients/next-of-kin', {
        patientId: patientIdForPatch,
        fullName: form.nextOfKin.fullName,
        relationship: form.nextOfKin.relationship,
        contactOne: form.nextOfKin.contactOne,
        contactTwo: form.nextOfKin.contactTwo,
        spiritualNeed: form.nextOfKin.spiritualNeed,
        personalDoctor: form.nextOfKin.personalDoctor,
        personalDoctorFacility: form.nextOfKin.personalDoctorFacility,
        personalDoctorContact: form.nextOfKin.personalDoctorContact,
      });
      return sectionId === 'care:physician' ? 'Physician contact updated.' : 'Emergency contact updated.';
    default:
      throw new Error('Unknown section.');
  }
}

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function normalizeMedicationTimeValue(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  const meridiemMatch = rawValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiemMatch) {
    const [, rawHours, rawMinutes, period] = meridiemMatch;
    let hours = Number(rawHours);
    const minutes = rawMinutes;
    const normalizedPeriod = period.toUpperCase();

    if (normalizedPeriod === 'AM' && hours === 12) hours = 0;
    if (normalizedPeriod === 'PM' && hours < 12) hours += 12;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const standardMatch = rawValue.match(/^(\d{1,2}):(\d{2})$/);
  if (standardMatch) {
    const [, rawHours, rawMinutes] = standardMatch;
    return `${String(Number(rawHours)).padStart(2, '0')}:${rawMinutes}`;
  }

  return rawValue;
}

function formatMedicationApiTime(value) {
  const normalizedValue = normalizeMedicationTimeValue(value);
  const match = normalizedValue.match(/^(\d{2}):(\d{2})$/);
  if (!match) return normalizedValue;

  const [, rawHours, minutes] = match;
  let hours = Number(rawHours);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes}${suffix}`;
}

/** API dates may be ISO strings; <input type="date"> requires YYYY-MM-DD. */
function normalizeMedicationDateForInput(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const isoPrefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

function buildMedicationApiPatchPayload({
  medicationId,
  drug,
  dosage,
  intake,
  startDate,
  endDate,
  time,
  addedBy,
  prescribedBy = 'external',
  drugRef = null,
  active = true,
}) {
  const normalizedStart = normalizeMedicationDateForInput(startDate);
  const normalizedEnd = normalizeMedicationDateForInput(endDate);
  return {
    medicationId,
    prescribedBy,
    drug,
    drugRef,
    dosage,
    intake: String(intake || 'oral').toLowerCase(),
    startDate: normalizedStart || new Date().toISOString().slice(0, 10),
    endDate: normalizedEnd || null,
    active,
    time: (Array.isArray(time) ? time : []).filter(Boolean).map(formatMedicationApiTime),
    ...(addedBy ? { addedBy } : {}),
  };
}

async function fetchMedicationById(medicationId) {
  const id = encodeURIComponent(String(medicationId || '').trim());
  if (!id) throw new Error('Medication id is required.');
  const response = await apiFetch(`/medications/${id}`, { method: 'GET', quiet: true });
  const responseText = await response.text().catch(() => '');
  let payload = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }
  }
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Unable to load medication.');
  }
  return payload?.medication || payload?.data || payload;
}

async function enrichMedicationListWithDetails(items, patientId = '') {
  if (!Array.isArray(items) || items.length === 0) return [];

  const enriched = await Promise.all(items.map(async (item) => {
    const normalized = normalizeMedicationRecord(item, { patientId });
    const medicationId = extractMedicationApiId(normalized, normalized, patientId);
    const hasStartDate = Boolean(normalizeMedicationDateForInput(normalized.startDate));
    const hasCoreFields = Boolean(
      normalized.drug
      && normalizeDosageForMedicationSignature(normalized.dosage)
      && normalizeFrequencyForMedicationSignature(normalized.frequency),
    );

    if (!medicationId || hasStartDate || hasCoreFields) {
      return normalized;
    }

    try {
      const fullRecord = await fetchMedicationById(medicationId);
      return normalizeMedicationRecord(fullRecord, normalized);
    } catch {
      return normalized;
    }
  }));

  return enriched;
}

function medicationListPathsForPatientId(pid) {
  const q = encodeURIComponent(String(pid || '').trim());
  return [
    `/patients/${q}/medications`,
    `/medications?patientId=${q}`,
    `/medications/patient/${q}`,
    `/medications/${q}`,
  ];
}

async function fetchMedicationListPayloadForPatientId(pid) {
  const paths = medicationListPathsForPatientId(pid);
  const results = await Promise.all(paths.map(async (path) => {
    try {
      const res = await apiFetch(path, { method: 'GET', quiet: true });
      let payload = {};
      try {
        payload = await res.json();
      } catch {
        payload = {};
      }
      return { ok: res.ok, status: res.status, payload };
    } catch {
      return { ok: false, status: 0, payload: {} };
    }
  }));

  const success = results.find((result) => result.ok);
  if (success) {
    return { found: true, payload: success.payload };
  }

  const nonNotFound = results.find((result) => result.status && result.status !== 404);
  if (nonNotFound) {
    return { found: false, payload: nonNotFound.payload };
  }

  return { found: false, payload: {} };
}

function createMedicationReminderState(source = {}) {
  const reminderSource = source?.reminders || {};
  const times = Array.isArray(source?.time)
    ? source.time
    : Array.isArray(reminderSource?.times)
      ? reminderSource.times
      : ['08:00'];

  return {
    times: times.filter(Boolean).map(normalizeMedicationTimeValue),
    startDate: normalizeMedicationDateForInput(
      source?.startDate
      || source?.start_date
      || reminderSource?.startDate
      || reminderSource?.start_date,
    ) || new Date().toISOString().slice(0, 10),
    endDate: normalizeMedicationDateForInput(
      source?.endDate
      || source?.end_date
      || reminderSource?.endDate
      || reminderSource?.end_date,
    ),
    reminderType: source?.reminderType || reminderSource?.reminderType || 'daily',
    notifyNurse: source?.notifyNurse ?? reminderSource?.notifyNurse ?? true,
    notifyPatient: source?.notifyPatient ?? reminderSource?.notifyPatient ?? false,
  };
}

function extractMedicationApiId(rawMedication, fallback = {}, patientId = '') {
  const raw = rawMedication && typeof rawMedication === 'object' ? rawMedication : {};
  const exclude = new Set([
    String(patientId || '').trim().toLowerCase(),
    String(raw?.patientId || raw?.patientID || raw?.patient_id || '').trim().toLowerCase(),
    String(fallback?.patientId || '').trim().toLowerCase(),
  ].filter(Boolean));

  const candidates = [
    raw?.medicationId,
    raw?.id,
    raw?._id,
    fallback?.medicationId,
    fallback?.id,
    fallback?._id,
  ]
    .map((value) => String(value || '').trim())
    .filter((value) => value && !exclude.has(value.toLowerCase()) && !/^existing-/i.test(value));

  const uuid = candidates.find(isUuidV4ish);
  if (uuid) return uuid;

  const mongoId = candidates.find(isLikelyMongoObjectId);
  if (mongoId) return mongoId;

  return candidates.find((value) => !/^\d{13}$/.test(value)) || '';
}

function normalizeMedicationRecord(rawMedication, fallback = {}) {
  const raw = rawMedication && typeof rawMedication === 'object' ? rawMedication : {};
  const fallbackTimes = Array.isArray(fallback?.time) ? fallback.time.filter(Boolean) : [];
  const times = Array.isArray(raw?.time) ? raw.time.filter(Boolean) : fallbackTimes;
  const patientId = raw?.patientId || raw?.patientID || raw?.patient_id || raw?.patient?.id || raw?.patient?._id || raw?.patient?.patientId || fallback?.patientId || '';
  const frequency = resolveMedicationFrequency(raw, fallback) || 'Scheduled';
  const apiMedicationId = extractMedicationApiId(raw, fallback, patientId);
  const startDate = normalizeMedicationDateForInput(
    raw?.startDate || raw?.start_date || fallback?.startDate || fallback?.start_date,
  ) || new Date().toISOString().slice(0, 10);
  const endDate = normalizeMedicationDateForInput(
    raw?.endDate || raw?.end_date || fallback?.endDate || fallback?.end_date,
  );

  return {
    id: apiMedicationId || fallback?.id || fallback?.medicationId || Date.now(),
    medicationId: apiMedicationId || String(raw?.medicationId || fallback?.medicationId || '').trim(),
    patientId,
    drug: raw?.drug || fallback?.drug || '',
    dosage: raw?.dosage || fallback?.dosage || '',
    frequency,
    route: toTitleCase(raw?.intake || fallback?.intake || fallback?.route || 'Oral'),
    notes: raw?.notes || fallback?.notes || '',
    time: times,
    reminders: times.length > 0 ? {
      reminderType: fallback?.reminderType || 'daily',
      times,
      notifyNurse: fallback?.notifyNurse ?? true,
      notifyPatient: fallback?.notifyPatient ?? false,
      startDate,
      endDate,
    } : null,
    active: raw?.active ?? fallback?.active ?? true,
    startDate,
    endDate,
    prescribedBy: raw?.prescribedBy || fallback?.prescribedBy || 'external',
    source: 'api',
  };
}

function extractMedicationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.medications)) return payload.medications;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.medications)) return payload.data.medications;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.medication && typeof payload.medication === 'object') return [payload.medication];
  if (payload?.data?.medication && typeof payload.data.medication === 'object') return [payload.data.medication];
  if ((payload?.medicationId || payload?.id) && typeof payload === 'object') return [payload];
  return [];
}

function medicationBelongsToPatient(medication, patientId) {
  const directPatientId = medication?.patientId || medication?.patientID || medication?.patient_id;
  const nestedPatientId = medication?.patient?.id || medication?.patient?._id || medication?.patient?.patientId;
  return String(directPatientId || nestedPatientId || '').trim() === String(patientId || '').trim();
}

/** Structured meds sometimes arrive on GET /patients/:id (no separate /medications list route). */
function extractMedicationRowsFromPatientPayload(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const nests = [raw, raw.data, raw.patient].filter((o) => o && typeof o === 'object');
  const arrayKeys = [
    'medicationRecords',
    'medicationList',
    'medicationsList',
    'activeMedications',
    'patientMedications',
    'prescriptions',
    'medicineRecords',
    'medicines',
  ];
  for (const obj of nests) {
    for (const k of arrayKeys) {
      const v = obj[k];
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') return v;
    }
    const m = obj.medications;
    if (Array.isArray(m) && m.length > 0 && typeof m[0] === 'object') return m;
  }
  return [];
}

/** Care plan rows on patient envelope */
function extractCarePlanRowsFromPatientPayload(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const nests = [raw, raw.data, raw.patient].filter((o) => o && typeof o === 'object');
  const arrayKeys = ['carePlans', 'carePlanItems', 'patientCarePlans', 'careplans'];
  for (const obj of nests) {
    for (const k of arrayKeys) {
      const v = obj[k];
      if (Array.isArray(v) && v.length > 0) return v;
    }
    const single = obj.carePlan;
    if (single && typeof single === 'object' && !Array.isArray(single)) return [single];
  }
  return [];
}

function normalizeDosageForMedicationSignature(dosage) {
  const value = String(dosage || '').trim().toLowerCase();
  if (!value || value === '—' || value === '-' || value === 'n/a' || value === 'na') return '';
  return value;
}

function normalizeFrequencyForMedicationSignature(frequency) {
  const value = String(
    normalizeMedicationFrequency(frequency) || frequency || '',
  ).trim().toLowerCase();
  if (!value || value === '—' || value === '-' || value === 'scheduled' || value === 'n/a' || value === 'na') {
    return '';
  }
  return value;
}

function buildMedicationSignature(medication) {
  const drug = String(medication?.drug || '').trim().toLowerCase();
  if (!drug) return '';
  const dosage = normalizeDosageForMedicationSignature(medication?.dosage);
  const frequency = normalizeFrequencyForMedicationSignature(medication?.frequency);
  const route = String(medication?.route || medication?.intake || 'oral').trim().toLowerCase();
  return [drug, dosage, frequency, route].join('|');
}

function buildMedicationLooseSignature(medication) {
  const drug = String(medication?.drug || '').trim().toLowerCase();
  if (!drug) return '';
  const dosage = normalizeDosageForMedicationSignature(medication?.dosage);
  const route = String(medication?.route || medication?.intake || 'oral').trim().toLowerCase();
  return [drug, dosage, route].join('|');
}

function medicationRecordRichnessScore(medication) {
  if (!medication) return 0;
  let score = 0;
  if (normalizeMedicationDateForInput(medication.startDate)) score += 4;
  if (normalizeMedicationDateForInput(medication.endDate)) score += 2;
  const times = Array.isArray(medication.time) && medication.time.length
    ? medication.time
    : medication?.reminders?.times;
  if (Array.isArray(times) && times.length > 0) score += 2;
  if (medication.medicationId) score += 1;
  return score;
}

function mergeMedicationRecordFields(primary, secondary) {
  const richer = medicationRecordRichnessScore(secondary) > medicationRecordRichnessScore(primary)
    ? { ...primary, ...secondary }
    : { ...secondary, ...primary };
  const mergedTimes = (Array.isArray(richer.time) && richer.time.length
    ? richer.time
    : Array.isArray(primary?.time) && primary.time.length
      ? primary.time
      : secondary?.time) || [];
  return normalizeMedicationRecord(
    {
      ...richer,
      startDate: normalizeMedicationDateForInput(richer.startDate || primary?.startDate || secondary?.startDate),
      endDate: normalizeMedicationDateForInput(richer.endDate || primary?.endDate || secondary?.endDate) || '',
      time: mergedTimes,
    },
    richer,
  );
}

function mergeMedicationRecords(records) {
  const bySignature = new Map();
  const byLooseSignature = new Map();

  const storeMergedRecord = (merged) => {
    const signature = buildMedicationSignature(merged);
    const looseSignature = buildMedicationLooseSignature(merged);
    if (signature) bySignature.set(signature, merged);
    if (looseSignature) byLooseSignature.set(looseSignature, merged);
  };

  records.forEach((record) => {
    if (!record || !String(record.drug || '').trim()) return;
    const normalized = normalizeMedicationRecord(record, record);
    const signature = buildMedicationSignature(normalized);
    const looseSignature = buildMedicationLooseSignature(normalized);
    if (!signature && !looseSignature) return;

    if (signature && bySignature.has(signature)) {
      storeMergedRecord(mergeMedicationRecordFields(bySignature.get(signature), normalized));
      return;
    }

    if (looseSignature && byLooseSignature.has(looseSignature)) {
      storeMergedRecord(mergeMedicationRecordFields(byLooseSignature.get(looseSignature), normalized));
      return;
    }

    storeMergedRecord(normalized);
  });

  const unique = new Map();
  byLooseSignature.forEach((record) => {
    unique.set(buildMedicationLooseSignature(record), record);
  });
  return Array.from(unique.values());
}

function normalizeDrugOption(rawDrug) {
  const raw = rawDrug && typeof rawDrug === 'object' ? rawDrug : {};
  const name = String(
    raw?.name
    || raw?.drug
    || raw?.drugName
    || raw?.genericName
    || raw?.brandName
    || ''
  ).trim();

  return {
    id: raw?.id || raw?.drugId || raw?._id || name,
    name,
    category: String(raw?.category || raw?.class || raw?.type || raw?.group || 'Drug').trim() || 'Drug',
    commonDose: String(raw?.commonDose || raw?.strength || raw?.dose || raw?.defaultDose || '').trim(),
  };
}

function extractDrugList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.drugs)) return payload.drugs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.drugs)) return payload.data.drugs;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.drug && typeof payload.drug === 'object') return [payload.drug];
  if (payload?.data?.drug && typeof payload.data.drug === 'object') return [payload.data.drug];
  return [];
}

function createVitalForm(recordedBy = '') {
  return {
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    bp: '',
    sugar: '',
    resp: '',
    spo2: '',
    pulse: '',
    temp: '',
    weight: '',
    urinalysis: '',
    recordedBy,
    notes: '',
  };
}

function splitBloodPressure(value) {
  const match = String(value || '').trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  return {
    systolic: match?.[1] || '',
    diastolic: match?.[2] || '',
  };
}

function extractVitalList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.vitals)) return payload.vitals;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.vitals)) return payload.data.vitals;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.vital && typeof payload.vital === 'object') return [payload.vital];
  if (payload?.data?.vital && typeof payload.data.vital === 'object') return [payload.data.vital];
  return [];
}

function toVitalDateString(value, fallbackDate) {
  if (!value) return fallbackDate || new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackDate || String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function toVitalTimeString(value, fallbackTime) {
  if (!value) return fallbackTime || new Date().toTimeString().slice(0, 5);
  if (/^\d{2}:\d{2}/.test(String(value))) return String(value).slice(0, 5);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackTime || String(value).slice(0, 5);
  return parsed.toTimeString().slice(0, 5);
}

/** API may return takenBy/recordedBy as a string id, display name, or populated user object */
function vitalRecorderDisplayName(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value !== 'object') return '';
  const u = value?.user;
  const fromUser = u && (typeof u === 'string' ? u : vitalRecorderDisplayName(u));
  const direct =
    value?.name
    || value?.fullName
    || value?.displayName
    || value?.staffName
    || value?.nurseName
    || value?.label
    || fromUser;
  if (direct) return String(direct).trim();
  const first = value?.firstName || value?.givenName || '';
  const last = value?.lastName || value?.familyName || '';
  const combined = `${first} ${last}`.trim();
  return combined || '';
}

function normalizeVitalRecord(rawVital, fallback = {}) {
  const raw = rawVital && typeof rawVital === 'object' ? rawVital : {};
  const systolic = String(raw?.bloodPressureSystolic || raw?.systolic || fallback?.bloodPressureSystolic || '').trim();
  const diastolic = String(raw?.bloodPressureDystolic || raw?.diastolic || fallback?.bloodPressureDystolic || '').trim();
  const fallbackBloodPressure = String(raw?.bloodPressure || fallback?.bp || '').trim();
  const bp = systolic || diastolic
    ? [systolic, diastolic].filter(Boolean).join('/')
    : fallbackBloodPressure;
  const timestamp = raw?.takenAt || raw?.recordedAt || raw?.createdAt || raw?.updatedAt || fallback?.timestamp || '';

  return {
    id: raw?.id || raw?._id || raw?.vitalId || fallback?.id || Date.now(),
    patientId: raw?.patientId || fallback?.patientId || '',
    date: toVitalDateString(raw?.date || raw?.takenDate || timestamp, fallback?.date),
    time: toVitalTimeString(raw?.time || raw?.takenTime || timestamp, fallback?.time),
    bp,
    sugar: String(raw?.bloodSugar ?? fallback?.sugar ?? '').trim(),
    resp: String(raw?.respiration ?? fallback?.resp ?? '').trim(),
    spo2: String(raw?.sp02 ?? raw?.spo2 ?? fallback?.spo2 ?? '').trim(),
    pulse: String(raw?.pulseRate ?? raw?.pulse ?? fallback?.pulse ?? '').trim(),
    temp: String(raw?.temperature ?? fallback?.temp ?? '').trim(),
    weight: String(raw?.weight ?? fallback?.weight ?? '').trim(),
    urinalysis: String(raw?.urinalysis ?? fallback?.urinalysis ?? '').trim(),
    recordedBy:
      vitalRecorderDisplayName(raw?.takenBy)
      || vitalRecorderDisplayName(raw?.recordedBy)
      || vitalRecorderDisplayName(fallback?.recordedBy),
    notes: String(raw?.notes || fallback?.notes || '').trim(),
  };
}

function sortVitalRecords(records) {
  return [...records].sort((left, right) => {
    const leftDate = new Date(`${left.date || '1970-01-01'}T${left.time || '00:00'}`);
    const rightDate = new Date(`${right.date || '1970-01-01'}T${right.time || '00:00'}`);
    return rightDate - leftDate;
  });
}

function formatVitalRelativeTime(date, time) {
  const parsed = new Date(`${date || '1970-01-01'}T${time || '00:00'}`);
  if (Number.isNaN(parsed.getTime())) {
    return [date, time].filter(Boolean).join(' · ') || 'Date unavailable';
  }
  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) {
    return parsed.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildVitalCardTitle(record) {
  const labels = [];
  if (record?.bp) labels.push('Blood Pressure');
  if (record?.sugar) labels.push('Blood Sugar');
  if (record?.spo2) labels.push('SPO₂');
  if (record?.pulse) labels.push('Pulse');
  if (record?.temp) labels.push('Temperature');
  if (record?.resp) labels.push('Respiration');
  if (record?.weight) labels.push('Weight');
  if (record?.urinalysis) labels.push('Urinalysis');
  if (!labels.length) return 'Vital Signs Reading';
  if (labels.length <= 2) return labels.join(' · ');
  return 'Vital Signs Reading';
}

function getVitalDateGroupLabel(dateStr) {
  const normalized = String(dateStr || '').slice(0, 10);
  if (!normalized) return 'Earlier records';
  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  if (normalized === today) return 'Today visit';
  if (normalized === yesterday) return 'Yesterday';
  const parsed = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return normalized;
  return parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupVitalRecordsByDate(records) {
  const groups = [];
  const groupIndex = new Map();
  records.forEach((record) => {
    const label = getVitalDateGroupLabel(record.date);
    if (!groupIndex.has(label)) {
      groupIndex.set(label, groups.length);
      groups.push({ label, records: [] });
    }
    groups[groupIndex.get(label)].records.push(record);
  });
  return groups;
}

function extractCarePlanList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.carePlans)) return payload.carePlans;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (
    payload?.data
    && typeof payload.data === 'object'
    && !Array.isArray(payload.data)
    && String(payload.data.task || '').trim()
  ) {
    return [payload.data];
  }
  if (Array.isArray(payload?.data?.carePlans)) return payload.data.carePlans;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.carePlan && typeof payload.carePlan === 'object') return [payload.carePlan];
  if (payload?.data?.carePlan && typeof payload.data.carePlan === 'object') return [payload.data.carePlan];
  /* Root-level single object: { patientId, task, category, frequency, priority, description } */
  if (
    payload
    && typeof payload === 'object'
    && !Array.isArray(payload)
    && String(payload.task || '').trim()
  ) {
    return [payload];
  }
  return [];
}

function carePlanDerivedId(row) {
  const r = row && typeof row === 'object' ? row : {};
  const s = [
    r.patientId,
    r.task,
    r.category,
    r.frequency,
    r.priority,
    r.description ?? r.notes ?? '',
  ].join('\x1e');
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return `cp-${(h >>> 0).toString(36)}`;
}

function normalizeCarePlanRecord(raw, fallback = {}) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const createdRaw = r.createdAt || r.createdDate || r.date || r.updatedAt || fallback.createdDate || '';
  const createdDate = createdRaw
    ? (String(createdRaw).includes('T') ? String(createdRaw).split('T')[0] : String(createdRaw).slice(0, 10))
    : new Date().toISOString().slice(0, 10);
  const desc = r.description ?? r.notes ?? fallback.notes ?? '';
  const checked = Boolean(
    r.completed ?? r.isCompleted ?? r.checked ?? r.isChecked ?? fallback.checked ?? false,
  );
  const explicitId = r.id ?? r._id ?? r.carePlanId ?? fallback.id;
  return {
    id: explicitId != null && String(explicitId).trim() !== '' ? explicitId : carePlanDerivedId(r),
    patientId: String(r.patientId ?? fallback.patientId ?? '').trim(),
    task: String(r.task ?? fallback.task ?? '').trim(),
    category: String(r.category ?? fallback.category ?? 'Other').trim() || 'Other',
    frequency: String(r.frequency ?? fallback.frequency ?? 'Daily').trim() || 'Daily',
    priority: String(r.priority ?? fallback.priority ?? 'Medium').trim() || 'Medium',
    notes: String(desc ?? '').trim(),
    checked,
    createdDate: /^\d{4}-\d{2}-\d{2}$/.test(createdDate) ? createdDate : new Date().toISOString().slice(0, 10),
  };
}

function sortCarePlanItems(items) {
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    const pd = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    if (pd !== 0) return pd;
    return String(a.task || '').localeCompare(String(b.task || ''));
  });
}

function buildCarePlanApiBody(patientId, form, options = {}) {
  const pid = String(patientId || '').trim();
  const body = {
    patientId: pid,
    task: String(form.task ?? '').trim(),
    category: form.category,
    frequency: form.frequency,
    priority: form.priority,
  };
  const desc = String(form.notes ?? '').trim();
  if (desc) {
    body.description = desc;
  }
  if (options.completed !== undefined) {
    body.completed = Boolean(options.completed);
  }
  return body;
}

/** Read completed flag from POST /care-plan-checklist/mark (or similar) JSON when present. */
function completionFromCarePlanMarkResponse(data) {
  if (!data || typeof data !== 'object') return undefined;
  const v =
    data.completed
    ?? data.isCompleted
    ?? data.is_completed
    ?? data.checked
    ?? data.isChecked
    ?? data.data?.completed
    ?? data.data?.isCompleted
    ?? data.data?.is_completed
    ?? data.carePlan?.completed
    ?? data.carePlan?.isCompleted;
  if (v === undefined || v === null) return undefined;
  return Boolean(v);
}

/* ── Nurse Notes helpers ── */
function cleanNoteContent(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function noteContentToApi(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('<br>');
}

function extractNurseNoteList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notes)) return payload.notes;
  if (Array.isArray(payload?.nurseNotes)) return payload.nurseNotes;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.notes)) return payload.data.notes;
  if (Array.isArray(payload?.data?.nurseNotes)) return payload.data.nurseNotes;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.note && typeof payload.note === 'object') return [payload.note];
  if (payload?.nurseNote && typeof payload.nurseNote === 'object') return [payload.nurseNote];
  if (payload?.data?.note && typeof payload.data.note === 'object') return [payload.data.note];
  return [];
}

function toNoteDateString(value, fallbackDate) {
  if (!value) return fallbackDate || new Date().toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackDate || String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function toNoteTimeString(value, fallbackTime) {
  if (!value) return fallbackTime || new Date().toTimeString().slice(0, 5);
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackTime || String(value).slice(0, 5);
  return parsed.toTimeString().slice(0, 5);
}

function isUnknownNurseLabel(name) {
  const s = String(name || '').trim();
  if (!s) return true;
  if (isUnknownReporterLabel(s)) return true;
  return /^unknown\s*nurse$/i.test(s);
}

function isIdLikeNurseLabel(name) {
  const s = String(name || '').trim();
  if (!s) return false;
  if (isUuidV4ish(s) || isLikelyMongoObjectId(s)) return true;
  if (/^nurse:/i.test(s)) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isResolvableNurseName(name) {
  const s = String(name || '').trim();
  if (!s) return false;
  if (isUnknownNurseLabel(s)) return false;
  if (isIdLikeNurseLabel(s)) return false;
  return true;
}

function resolveSessionDisplayName(user, tokenPayload) {
  const u = user && typeof user === 'object' ? user : {};
  const token = tokenPayload && typeof tokenPayload === 'object' ? tokenPayload : {};
  const combined = `${u.firstName || u.givenName || ''} ${u.lastName || u.familyName || ''}`.trim();
  const tokenCombined = `${token.firstName || token.givenName || ''} ${token.lastName || token.familyName || ''}`.trim();
  const emailLocal = String(u.email || token.email || '').split('@')[0]?.trim();
  return String(
    u.name
    || u.fullName
    || u.displayName
    || u.staffName
    || u.nurseName
    || combined
    || tokenCombined
    || vitalRecorderDisplayName(u)
    || nurseObjectToDisplayName(u)
    || token.name
    || token.fullName
    || u.username
    || (emailLocal && !emailLocal.includes('+') ? emailLocal : '')
    || ''
  ).trim();
}

function collectSessionNurseIds(currentUser, tokenPayload) {
  const ids = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !ids.includes(s)) ids.push(s);
  };

  const u = currentUser && typeof currentUser === 'object' ? currentUser : {};
  const token = tokenPayload && typeof tokenPayload === 'object' ? tokenPayload : {};

  push(u.nurseId);
  push(token.nurseId);
  push(u.id);
  push(u._id);
  push(u.userId);
  push(u.staffId);
  push(u.uuid);
  push(token.userId);
  push(token.id);
  push(token.sub);

  collectNurseIdCandidates(u).forEach(push);
  return ids;
}

function mergeNurseDirectories(incidentNurses, assignedNurses = []) {
  const rows = Array.isArray(incidentNurses) ? [...incidentNurses] : [];

  (Array.isArray(assignedNurses) ? assignedNurses : []).forEach((entry) => {
    if (!entry) return;
    const name = String(entry.name || nurseObjectToDisplayName(entry) || '').trim();
    if (!name) return;

    const idsForMatch = [
      ...new Set([
        ...collectNurseIdCandidates(entry),
        String(entry.id || '').trim(),
        String(entry.nurseId || '').trim(),
      ].filter(Boolean)),
    ];

    const existing = rows.find((row) => (
      row.name === name
      || idsForMatch.some((id) => Array.isArray(row.idsForMatch) && row.idsForMatch.includes(id))
    ));

    if (existing) {
      existing.idsForMatch = [...new Set([...(existing.idsForMatch || []), ...idsForMatch])];
      if (!existing.name) existing.name = name;
      return;
    }

    rows.push({
      id: idsForMatch[0] || name,
      name,
      idsForMatch,
    });
  });

  return rows;
}

function resolveNurseNameFromDirectory(nurseId, nurses, session = {}) {
  const candidates = [...new Set(
    [nurseId, ...(Array.isArray(session.extraIds) ? session.extraIds : [])]
      .map((v) => String(v || '').trim())
      .filter(Boolean),
  )];

  if (!candidates.length) return '';

  const directory = Array.isArray(nurses) ? nurses : [];
  for (const nid of candidates) {
    const row = directory.find((n) => Array.isArray(n.idsForMatch) && n.idsForMatch.includes(nid));
    if (row?.name) return row.name;
  }

  const sessionIds = Array.isArray(session.sessionNurseIds)
    ? session.sessionNurseIds
    : [session.currentNurseId].filter(Boolean);
  const sessionName = String(session.currentUserName || session.sessionName || '').trim();

  if (sessionName && candidates.some((nid) => sessionIds.includes(nid))) {
    return sessionName;
  }

  return '';
}

function resolveNoteNurseName(raw, fallback = {}) {
  const fromPopulated =
    vitalRecorderDisplayName(raw?.takenBy)
    || vitalRecorderDisplayName(raw?.recordedBy)
    || vitalRecorderDisplayName(raw?.author)
    || vitalRecorderDisplayName(raw?.createdBy)
    || vitalRecorderDisplayName(raw?.user)
    || nurseObjectToDisplayName(raw?.nurse)
    || nurseObjectToDisplayName(raw?.user)
    || vitalRecorderDisplayName(raw?.nurse);
  const direct = String(
    raw?.nurseName
    || raw?.recordedByName
    || raw?.authorName
    || raw?.createdByName
    || raw?.staffName
    || raw?.recorderName
    || raw?.takerName
    || (typeof raw?.recordedBy === 'string' && !isIdLikeNurseLabel(raw.recordedBy) ? raw.recordedBy : '')
    || (typeof raw?.nurse === 'string' && !isIdLikeNurseLabel(raw.nurse) ? raw.nurse : '')
    || fallback?.nurse
    || ''
  ).trim();
  const candidate = fromPopulated || direct;
  return isResolvableNurseName(candidate) ? candidate : '';
}

function noteBelongsToSession(note, session = {}) {
  const sessionIds = Array.isArray(session.sessionNurseIds)
    ? session.sessionNurseIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const noteIds = noteAuthorIdList(note);

  if (!sessionIds.length) return false;
  if (!noteIds.length) return session.notesScope === 'nurse';
  return noteIds.some((id) => sessionIds.includes(id));
}

function resolveNoteNurseDisplayName(note, context = {}) {
  const {
    nurses = [],
    sessionName = '',
    sessionNurseIds = [],
    notesScope = 'patient',
    primaryNurse = '',
  } = context;

  const session = {
    currentUserName: sessionName,
    sessionName,
    sessionNurseIds,
    notesScope,
    extraIds: [note?.nurse, note?.nurseId].filter(Boolean),
  };

  if (isResolvableNurseName(note?.nurse)) {
    return String(note.nurse).trim();
  }

  const fromDirectory = resolveNurseNameFromDirectory(note?.nurseId, nurses, session)
    || resolveNurseNameFromDirectory(note?.nurse, nurses, session);
  if (fromDirectory) return fromDirectory;

  if (sessionName && noteBelongsToSession(note, { sessionNurseIds, notesScope })) {
    return sessionName;
  }

  const primary = String(primaryNurse || '').trim();
  if (primary && !isIdLikeNurseLabel(primary)) return primary;

  const authorIds = noteAuthorIdList(note);
  if (sessionName && (!authorIds.length || noteBelongsToSession(note, { sessionNurseIds, notesScope }))) {
    return sessionName;
  }

  return 'Unknown Nurse';
}

function enrichNurseNoteNames(notes, nurses, session = {}) {
  return notes.map((note) => ({
    ...note,
    nurse: resolveNoteNurseDisplayName(note, {
      nurses,
      sessionName: session.currentUserName || session.sessionName || '',
      sessionNurseIds: session.sessionNurseIds || [],
      notesScope: session.notesScope || 'patient',
      primaryNurse: session.primaryNurse || '',
    }),
  }));
}

function normalizeNurseNote(rawNote, fallback = {}) {
  const raw = rawNote && typeof rawNote === 'object' ? rawNote : {};
  const timestamp = raw?.recordedAt || raw?.createdAt || raw?.updatedAt || raw?.takenAt || fallback?.timestamp || '';
  const nurseName = resolveNoteNurseName(raw, fallback);
  const nurseIdCandidates = collectNoteAuthorIdCandidates(raw);
  const nurseId = String(
    nurseIdCandidates[0]
    || fallback?.nurseId
    || ''
  ).trim();
  const rawContent = String(
    raw?.note
    || raw?.content
    || raw?.text
    || raw?.body
    || raw?.description
    || raw?.message
    || fallback?.content
    || ''
  );
  const content = cleanNoteContent(rawContent);
  const category = String(raw?.category || raw?.type || fallback?.category || 'Assessment').trim() || 'Assessment';
  const priority = String(raw?.priority || raw?.severity || fallback?.priority || 'Normal').trim() || 'Normal';
  const pinned = Boolean(raw?.pinned ?? raw?.isPinned ?? fallback?.pinned ?? false);

  return {
    id: raw?.id || raw?._id || raw?.noteId || raw?.nurseNoteId || fallback?.id || `note-${Date.now()}`,
    patientId: String(raw?.patientId || (typeof raw?.patient === 'object' ? raw?.patient?.id || raw?.patient?._id : raw?.patient) || fallback?.patientId || '').trim(),
    nurseId,
    nurse: nurseName,
    date: toNoteDateString(raw?.date || timestamp, fallback?.date),
    time: toNoteTimeString(raw?.time || timestamp, fallback?.time),
    category,
    priority,
    content,
    pinned,
    timestamp,
  };
}

function sortNurseNotes(notes) {
  return [...notes].sort((a, b) => {
    if (Boolean(b.pinned) !== Boolean(a.pinned)) return Boolean(b.pinned) ? 1 : -1;
    const left = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
    const right = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
    return right - left;
  });
}

/* ─── Incident report API helpers ─── */
const INCIDENT_TYPE_LABELS = ['Fall', 'Medication Error', 'Skin Breakdown', 'Behavioral', 'Equipment Failure', 'Missed Visit', 'Injury', 'Allergic Reaction', 'Infection', 'Other'];
const INCIDENT_TYPE_TO_API = INCIDENT_TYPE_LABELS.reduce((acc, label) => {
  acc[label] = label.toLowerCase().replace(/\s+/g, '-');
  return acc;
}, {});
const INCIDENT_TYPE_FROM_API = Object.entries(INCIDENT_TYPE_TO_API).reduce((acc, [label, api]) => {
  acc[api] = label;
  acc[api.replace(/-/g, ' ')] = label;
  acc[label.toLowerCase()] = label;
  return acc;
}, {});

const INCIDENT_SEVERITY_TO_API = { Minor: 'low', Moderate: 'moderate', Serious: 'high', Critical: 'critical' };
const INCIDENT_SEVERITY_FROM_API = { low: 'Minor', minor: 'Minor', moderate: 'Moderate', medium: 'Moderate', high: 'Serious', serious: 'Serious', critical: 'Critical' };

function incidentTypeToApi(label) {
  if (!label) return '';
  return INCIDENT_TYPE_TO_API[label] || String(label).toLowerCase().replace(/\s+/g, '-');
}

function incidentTypeFromApi(value, fallback = 'Fall') {
  if (!value) return fallback;
  const v = String(value).trim();
  if (INCIDENT_TYPE_FROM_API[v]) return INCIDENT_TYPE_FROM_API[v];
  if (INCIDENT_TYPE_FROM_API[v.toLowerCase()]) return INCIDENT_TYPE_FROM_API[v.toLowerCase()];
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

function incidentSeverityToApi(label) {
  if (!label) return '';
  return INCIDENT_SEVERITY_TO_API[label] || String(label).toLowerCase();
}

function incidentSeverityFromApi(value, fallback = 'Minor') {
  if (!value) return fallback;
  const v = String(value).trim().toLowerCase();
  return INCIDENT_SEVERITY_FROM_API[v] || (v.charAt(0).toUpperCase() + v.slice(1));
}

/** PATCH /incidents/:id — API uses snake_case; UI uses `in-progress`. */
function incidentStatusToApi(uiStatus) {
  const s = String(uiStatus || 'open').trim().toLowerCase().replace(/_/g, '-');
  if (s === 'in-progress') return 'in_progress';
  if (s === 'resolved') return 'resolved';
  if (s === 'open') return 'open';
  return s.replace(/-/g, '_');
}

function incidentStatusFromApi(value, fallback = 'open') {
  if (value == null || value === '') return fallback;
  const v = String(value).trim().toLowerCase().replace(/_/g, '-');
  if (v === 'wip' || v === 'inprogress') return 'in-progress';
  if (v === 'in-progress') return 'in-progress';
  if (v === 'resolved' || v === 'closed') return 'resolved';
  if (v === 'open' || v === 'pending') return 'open';
  return v || fallback;
}

function incidentDateToApi(value) {
  if (!value) return '';
  const s = String(value).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().slice(0, 10);
    const [y, m, d] = iso.split('-');
    return `${d}-${m}-${y}`;
  }
  return s;
}

function incidentDateFromApi(value, fallback) {
  if (!value) return fallback || new Date().toISOString().slice(0, 10);
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-');
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return fallback || s;
}

function incidentTimeToApi(value) {
  if (!value) return '';
  const s = String(value).trim();
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (ampmMatch) return `${String(ampmMatch[1]).padStart(2, '0')}:${ampmMatch[2]}${ampmMatch[3].toUpperCase()}`;
  const t24 = s.match(/^(\d{1,2}):(\d{2})/);
  if (t24) {
    let h = parseInt(t24[1], 10);
    const min = t24[2];
    if (Number.isNaN(h)) return s;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${min}${period}`;
  }
  return s;
}

function incidentTimeFromApi(value, fallback) {
  if (!value) return fallback || new Date().toTimeString().slice(0, 5);
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const period = m[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m[2]}`;
  }
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5).padStart(5, '0');
  return fallback || s;
}

function extractIncidentList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.incidents)) return payload.incidents;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.incidents)) return payload.data.incidents;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.incident && typeof payload.incident === 'object') return [payload.incident];
  if (payload?.data?.incident && typeof payload.data.incident === 'object') return [payload.data.incident];
  return [];
}

function isUnknownReporterLabel(name) {
  const s = String(name || '').trim();
  if (!s) return true;
  return /^unknown$/i.test(s);
}

function nurseObjectToDisplayName(nurse) {
  if (!nurse || typeof nurse !== 'object') return '';
  const personal = nurse.personal && typeof nurse.personal === 'object' ? nurse.personal : {};
  const combined = `${nurse.firstName || personal.firstName || nurse.givenName || ''} ${nurse.lastName || personal.lastName || nurse.familyName || ''}`.trim();
  return String(nurse.name || nurse.fullName || nurse.displayName || nurse.nurseName || combined || '').trim();
}

function normalizeIncident(rawIncident, fallback = {}) {
  const raw = rawIncident && typeof rawIncident === 'object' ? rawIncident : {};
  const nestedNurseName = nurseObjectToDisplayName(raw?.nurse);
  return {
    id: raw?.id || raw?._id || raw?.incidentId || fallback?.id || `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nurseId: String(raw?.nurseId || (typeof raw?.nurse === 'object' ? raw?.nurse?.id || raw?.nurse?._id : '') || fallback?.nurseId || '').trim(),
    patientId: String(raw?.patientId || (typeof raw?.patient === 'object' ? raw?.patient?.id || raw?.patient?._id : raw?.patient) || fallback?.patientId || '').trim(),
    date: incidentDateFromApi(raw?.date, fallback?.date),
    time: incidentTimeFromApi(raw?.time, fallback?.time),
    type: incidentTypeFromApi(raw?.incidentType ?? raw?.type, fallback?.type),
    severity: incidentSeverityFromApi(raw?.severity, fallback?.severity),
    location: String(raw?.location || fallback?.location || '').trim(),
    description: String(raw?.description || fallback?.description || '').trim(),
    immediateAction: String(raw?.actionTaken ?? raw?.immediateAction ?? fallback?.immediateAction ?? '').trim(),
    injuryDetails: String(raw?.injuryDetail ?? raw?.injuryDetails ?? fallback?.injuryDetails ?? '').trim(),
    followUp: String(raw?.followUpPlan ?? raw?.followUp ?? fallback?.followUp ?? '').trim(),
    witnesses: String(raw?.witnesses ?? fallback?.witnesses ?? '').trim(),
    physicianNotified: Boolean(raw?.physicianNotified ?? fallback?.physicianNotified ?? false),
    familyNotified: Boolean(raw?.familyNotified ?? fallback?.familyNotified ?? false),
    status: incidentStatusFromApi(raw?.status ?? fallback?.status, 'open'),
    reportedBy: String(
      raw?.reportedBy
      || raw?.nurseName
      || raw?.reportedByName
      || raw?.reporterName
      || nestedNurseName
      || fallback?.reportedBy
      || ''
    ).trim(),
    timestamp: raw?.createdAt || raw?.recordedAt || raw?.updatedAt || fallback?.timestamp || '',
    images: (() => {
      const parsed = extractIncidentImages(raw);
      return parsed.length ? parsed : (Array.isArray(fallback?.images) ? fallback.images : []);
    })(),
  };
}

function sortIncidents(items) {
  return [...items].sort((a, b) => {
    const left = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
    const right = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
    return right - left;
  });
}

function appendIncidentImagesToPayload(payload, images) {
  const refs = (images || [])
    .map((img) => ({
      mediaId: String(img?.mediaId || '').trim() || undefined,
      objectKey: String(img?.objectKey || '').trim() || undefined,
      url: String(img?.url || '').trim() || undefined,
    }))
    .filter((img) => img.mediaId || img.objectKey || img.url);
  if (!refs.length) return payload;
  return {
    ...payload,
    images: refs,
    attachments: refs,
    mediaIds: refs.map((ref) => ref.mediaId).filter(Boolean),
  };
}

function incidentImagesFromFormState(images) {
  return (images || [])
    .map((img) => ({
      url: img.url || img.previewUrl || null,
      mediaId: img.mediaId || null,
      objectKey: img.objectKey || null,
    }))
    .filter((img) => img.url || img.mediaId || img.objectKey);
}

function isPatientDeactivatedStatus(status) {
  const normalized = String(status || '').toLowerCase();
  return normalized.includes('deactiv')
    || normalized.includes('inactive')
    || normalized.includes('discharg');
}

function resolvePatientApiId(rawApi, profile) {
  return resolvePatientMutationId(rawApi)
    || resolvePatientMutationId(profile)
    || extractApiPatientId(rawApi)
    || extractApiPatientId(profile);
}

function collectNurseIdCandidates(raw) {
  const out = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !out.includes(s)) out.push(s);
  };
  if (!raw || typeof raw !== 'object') return out;

  push(raw.nurseId);
  push(raw.uuid);
  push(raw.nurseUuid);
  push(raw.nurse_id);
  push(raw.publicId);
  push(raw.id);
  push(raw.userId);
  push(raw.accountId);

  if (raw.user && typeof raw.user === 'object') {
    push(raw.user.nurseId);
    push(raw.user.id);
    push(raw.user._id);
    push(raw.user.uuid);
  }
  if (raw.nurse && typeof raw.nurse === 'object') {
    push(raw.nurse.nurseId);
    push(raw.nurse.id);
    push(raw.nurse._id);
    push(raw.nurse.uuid);
  }

  push(raw._id);
  return out;
}

/** Nurse-note payloads must not treat the note's own `id` as the authoring nurse id. */
function collectNoteAuthorIdCandidates(raw) {
  const out = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !out.includes(s)) out.push(s);
  };
  if (!raw || typeof raw !== 'object') return out;

  push(raw.nurseId);
  push(raw.nurse_id);
  push(raw.nurseUuid);
  push(raw.recordedById);
  push(raw.authorId);
  push(raw.userId);
  push(raw.accountId);

  if (typeof raw.createdBy === 'string') push(raw.createdBy);
  if (typeof raw.nurse === 'string' && isIdLikeNurseLabel(raw.nurse)) push(raw.nurse);

  const nestedSources = [raw.nurse, raw.user, raw.takenBy, raw.recordedBy, raw.author, raw.createdBy];
  nestedSources.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    push(entry.nurseId);
    push(entry.id);
    push(entry._id);
    push(entry.uuid);
    push(entry.userId);
  });

  return out;
}

function noteAuthorIdList(note) {
  const ids = collectNoteAuthorIdCandidates(note);
  if (ids.length) return ids;
  const nurseField = String(note?.nurse || '').trim();
  if (nurseField && isIdLikeNurseLabel(nurseField)) ids.push(nurseField);
  const nurseId = String(note?.nurseId || '').trim();
  if (nurseId) ids.push(nurseId);
  return [...new Set(ids)];
}

/** Nurse id for POST /care-plan-checklist/mark — API expects UUID (or Mongo id); avoid email/sub. */
function resolveNurseIdForCarePlanMark(currentUser, tokenPayload) {
  const candidates = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !candidates.includes(s)) candidates.push(s);
  };
  for (const c of collectNurseIdCandidates(currentUser || {})) push(c);
  for (const c of collectNurseIdCandidates(tokenPayload || {})) push(c);

  const uuid = candidates.find(isUuidV4ish);
  if (uuid) return uuid;
  const mongo = candidates.find(isLikelyMongoObjectId);
  if (mongo) return mongo;
  return '';
}

/**
 * Nurses from GET /nurses often expose both a Mongo _id and a UUID the API expects on related routes.
 * Prefer UUID (and non–ObjectId strings) for POST /incidents `nurseId`.
 */
function normalizeIncidentNurseRow(n) {
  const raw = n && typeof n === 'object' ? n : {};
  const candidates = collectNurseIdCandidates(raw);
  if (!candidates.length) return null;

  const mongoId = candidates.find(isLikelyMongoObjectId) || '';
  const uuid = candidates.find(isUuidV4ish) || '';
  const apiId = mongoId || uuid || candidates[0];
  const idsForMatch = [...new Set(candidates)];

  const first = raw.firstName || '';
  const last = raw.lastName || '';
  const name = String(raw.name || `${first} ${last}`).trim();
  if (!name) return null;
  const jobTitle = String(raw.jobTitle || raw.specialisation || raw.specialization || '').trim();
  return { id: apiId, mongoId, uuid, name, jobTitle, idsForMatch };
}

function resolveCurrentNurseId(currentUser, tokenPayload) {
  const candidates = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !candidates.includes(s)) candidates.push(s);
  };

  push(currentUser?.nurseId);
  push(tokenPayload?.nurseId);
  push(currentUser?.id);
  push(currentUser?._id);
  push(currentUser?.userId);
  push(currentUser?.staffId);
  push(tokenPayload?.userId);
  push(tokenPayload?.id);
  push(tokenPayload?.sub);

  if (!candidates.length) return '';

  const uuid = candidates.find(isUuidV4ish);
  if (uuid) return uuid;

  const nonMongo = candidates.find((c) => !isLikelyMongoObjectId(c));
  if (nonMongo) return nonMongo;

  return candidates[0] || '';
}

export default function PatientProfile() {
  const { patientId } = useParams();
  const effectivePatientId = patientId || FALLBACK_PATIENT_ID;
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('chart');
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);
  /** Raw `/patients/:id` JSON (or equivalent) for nested meds / care plans — avoids extra 404s when list routes are absent. */
  const rawPatientApiRef = useRef(null);
  /** Incremented after each profile fetch attempt so meds/care-plan loads run after patient payload exists. */
  const [patientApiSyncVersion, setPatientApiSyncVersion] = useState(0);
  const [remotePatient, setRemotePatient] = useState(null);
  const [apiPatientRaw, setApiPatientRaw] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState('');
  const [avatarImageError, setAvatarImageError] = useState(false);
  const [photoRefreshLoading, setPhotoRefreshLoading] = useState(false);
  const [removingAssignedNurseId, setRemovingAssignedNurseId] = useState('');
  const [assignedNurseActionError, setAssignedNurseActionError] = useState('');
  const [assignedNurseActionSuccess, setAssignedNurseActionSuccess] = useState('');
  const [assignedNurseCandidateId, setAssignedNurseCandidateId] = useState('');
  const [assigningProfileNurseId, setAssigningProfileNurseId] = useState('');
  const [pendingRemoveAssignedNurse, setPendingRemoveAssignedNurse] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTopbarMenu, setShowTopbarMenu] = useState(false);
  const [savingProfileUpdate, setSavingProfileUpdate] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState('');
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState('');
  const [showProfileSaveAlert, setShowProfileSaveAlert] = useState(false);
  const [medicationSaveSuccess, setMedicationSaveSuccess] = useState('');
  const [showMedicationSaveAlert, setShowMedicationSaveAlert] = useState(false);
  const [vitalSaveSuccess, setVitalSaveSuccess] = useState('');
  const [showVitalSaveAlert, setShowVitalSaveAlert] = useState(false);
  const [latestRecordedVital, setLatestRecordedVital] = useState(null);
  const [latestVitalLoading, setLatestVitalLoading] = useState(false);
  const [profileUpdateForm, setProfileUpdateForm] = useState(() => createPatientUpdateForm(null, effectivePatientId));
  const [editingProfileCard, setEditingProfileCard] = useState(null);
  const [cardSectionError, setCardSectionError] = useState('');
  const [savingProfileCard, setSavingProfileCard] = useState(false);
  const cardEditSeedRef = useRef(null);
  const activeCardFormRef = useRef(null);
  const [, startProfileFormTransition] = useTransition();
  const currentUser = getUser();
  const tokenPayload = useMemo(() => parseJwtPayload(getToken()), []);
  const currentUserName = resolveSessionDisplayName(currentUser, tokenPayload);
  const sessionNurseIds = useMemo(
    () => collectSessionNurseIds(currentUser, tokenPayload),
    [currentUser, tokenPayload],
  );

  const setProfileUpdateField = (path, value) => {
    const keys = String(path || '').split('.').filter(Boolean);
    if (!keys.length) return;

    startProfileFormTransition(() => {
      setProfileUpdateForm(prev => {
        const next = { ...prev };
        let cursor = next;
        let source = prev;

        for (let index = 0; index < keys.length - 1; index += 1) {
          const key = keys[index];
          cursor[key] = { ...(source?.[key] || {}) };
          cursor = cursor[key];
          source = source?.[key] || {};
        }

        cursor[keys[keys.length - 1]] = value;
        return next;
      });
    });
  };

  const loadPatientProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');
    rawPatientApiRef.current = null;
    setApiPatientRaw(null);
    try {
      const response = await apiFetch(`/patients/${effectivePatientId}`, { method: 'GET' });
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to load patient profile.');
      }

      const rawPatient = data?.patient || data?.data || data;
      if (!rawPatient || typeof rawPatient !== 'object') {
        throw new Error('Patient record was empty.');
      }

      rawPatientApiRef.current = rawPatient;
      setApiPatientRaw(rawPatient);
      const apiPatientId = extractApiPatientId(rawPatient);
      const mutationPatientId = resolvePatientMutationId(rawPatient, effectivePatientId);
      const profileId = apiPatientId || mutationPatientId || effectivePatientId;

      setRemotePatient(buildQuickPatientProfile(rawPatient, profileId));
      setProfileLoading(false);
      setPatientApiSyncVersion((n) => n + 1);

      const routeId = String(effectivePatientId || '').trim();
      const canonicalRouteId = apiPatientId || mutationPatientId;
      if (canonicalRouteId && canonicalRouteId !== routeId) {
        navigate(`/patients/${encodeURIComponent(canonicalRouteId)}`, { replace: true });
      }

      void (async () => {
        try {
          const enrichedPatient = await enrichRawPatientRecord(rawPatient, effectivePatientId);
          rawPatientApiRef.current = enrichedPatient;
          setApiPatientRaw(enrichedPatient);
          const hydratedProfile = await hydratePatientProfile(enrichedPatient, profileId);
          setRemotePatient(hydratedProfile);
          setPatientApiSyncVersion((n) => n + 1);
        } catch {
          // Core profile is already visible; section enrichment is best-effort.
        }
      })();
    } catch (error) {
      setProfileError(error?.message || 'Unable to load patient profile.');
      rawPatientApiRef.current = null;
      setApiPatientRaw(null);
      setProfileLoading(false);
    }
  }, [effectivePatientId, navigate]);

  useEffect(() => {
    loadPatientProfile();
  }, [loadPatientProfile]);

  const loadMedicationRecords = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setAddedMeds([]);
      return;
    }

    const rawPatient = rawPatientApiRef.current;
    const idCandidates = collectSleepNutritionLookupIds(rawPatient, patientIdValue);

    const cachedItems = mergeMedicationRecords(
      getCachedPatientMedications(patientIdValue).map(item => normalizeMedicationRecord(item, { patientId: patientIdValue, source: 'cache' }))
    );

    try {
      const embedded = extractMedicationRowsFromPatientPayload(rawPatient);
      if (embedded.length > 0) {
        const patientMedicationItems = await enrichMedicationListWithDetails(
          embedded.filter((item) => item?.drug || item?.medicationId || item?.id),
          patientIdValue,
        );
        const mergedItems = mergeMedicationRecords([...cachedItems, ...patientMedicationItems]);
        setAddedMeds(mergedItems);
        setCachedPatientMedications(patientIdValue, mergedItems);
        return;
      }

      let patientMedicationPayload = null;
      let foundMedicationList = false;

      for (const pid of idCandidates) {
        const result = await fetchMedicationListPayloadForPatientId(pid);
        if (result.found) {
          patientMedicationPayload = result.payload;
          foundMedicationList = true;
          break;
        }
        if (result.payload && Object.keys(result.payload).length > 0) {
          patientMedicationPayload = result.payload;
        }
      }

      if (foundMedicationList) {
        const patientMedicationItems = await enrichMedicationListWithDetails(
          extractMedicationList(patientMedicationPayload),
          patientIdValue,
        );
        const mergedItems = mergeMedicationRecords([...cachedItems, ...patientMedicationItems]);
        setAddedMeds(mergedItems);
        setCachedPatientMedications(patientIdValue, mergedItems);
        return;
      }

      setAddedMeds(cachedItems);
    } catch {
      setAddedMeds(cachedItems);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    if (patientApiSyncVersion === 0) return;
    loadMedicationRecords();
  }, [patientApiSyncVersion, loadMedicationRecords]);

  const loadLatestVitalRecord = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setLatestRecordedVital(null);
      setLatestVitalLoading(false);
      return;
    }

    setLatestVitalLoading(true);
    try {
      const response = await apiFetch(`/vitals/patient/${encodeURIComponent(patientIdValue)}/latest`, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        setLatestRecordedVital(null);
        return;
      }

      const latestItem = payload?.vital || payload?.data?.vital || payload?.data || payload;
      const normalizedLatest = normalizeVitalRecord(latestItem, { patientId: patientIdValue });
      const hasVitalData = normalizedLatest.bp || normalizedLatest.sugar || normalizedLatest.spo2 || normalizedLatest.pulse || normalizedLatest.temp || normalizedLatest.resp || normalizedLatest.weight || normalizedLatest.urinalysis;
      setLatestRecordedVital(hasVitalData ? normalizedLatest : null);
    } catch {
      setLatestRecordedVital(null);
    } finally {
      setLatestVitalLoading(false);
    }
  }, [effectivePatientId]);

  const loadVitalRecords = useCallback(async () => {
    try {
      const patientIdValue = String(effectivePatientId || '').trim();
      if (!patientIdValue) {
        setVitalRecords([]);
        return;
      }

      const response = await apiFetch(`/vitals/patient/${encodeURIComponent(patientIdValue)}`, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        setVitalRecords([]);
        return;
      }

      const records = extractVitalList(payload)
        .map((item) => normalizeVitalRecord(item, { patientId: patientIdValue }))
        .filter((item) => item.bp || item.sugar || item.spo2 || item.pulse || item.temp || item.resp || item.weight || item.urinalysis);

      setVitalRecords(sortVitalRecords(records));
    } catch {
      setVitalRecords([]);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadLatestVitalRecord();
  }, [loadLatestVitalRecord]);

  /* Medication database */
  const MEDICATION_DB = [
    { name: 'Metformin', category: 'Antidiabetic', commonDose: '500mg' },
    { name: 'Amlodipine', category: 'Antihypertensive', commonDose: '5mg' },
    { name: 'Aspirin', category: 'Antiplatelet', commonDose: '75mg' },
    { name: 'Amoxicillin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Omeprazole', category: 'Antacid', commonDose: '20mg' },
    { name: 'Paracetamol', category: 'Analgesic', commonDose: '500mg' },
    { name: 'Ibuprofen', category: 'NSAID', commonDose: '400mg' },
    { name: 'Tramadol', category: 'Opioid Analgesic', commonDose: '50mg' },
    { name: 'Gabapentin', category: 'Anticonvulsant', commonDose: '300mg' },
    { name: 'Lisinopril', category: 'ACE Inhibitor', commonDose: '10mg' },
    { name: 'Losartan', category: 'ARB', commonDose: '50mg' },
    { name: 'Atorvastatin', category: 'Statin', commonDose: '20mg' },
    { name: 'Ciprofloxacin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Furosemide', category: 'Diuretic', commonDose: '40mg' },
    { name: 'Prednisolone', category: 'Corticosteroid', commonDose: '5mg' },
    { name: 'Insulin Glargine', category: 'Insulin', commonDose: '20u' },
    { name: 'Salbutamol', category: 'Bronchodilator', commonDose: 'Inhaler' },
    { name: 'Ferrous Sulphate', category: 'Iron Supplement', commonDose: '200mg' },
    { name: 'Calcium Carbonate', category: 'Supplement', commonDose: '500mg' },
    { name: 'Erythropoietin', category: 'Hematopoietic', commonDose: 'Injection' },
    { name: 'Warfarin', category: 'Anticoagulant', commonDose: '5mg' },
    { name: 'Clopidogrel', category: 'Antiplatelet', commonDose: '75mg' },
    { name: 'Doxycycline', category: 'Antibiotic', commonDose: '100mg' },
    { name: 'Azithromycin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Diazepam', category: 'Benzodiazepine', commonDose: '5mg' },
    { name: 'Morphine', category: 'Opioid', commonDose: '10mg' },
    { name: 'Hydrochlorothiazide', category: 'Diuretic', commonDose: '25mg' },
    { name: 'Ceftriaxone', category: 'Antibiotic', commonDose: '1g' },
    { name: 'Cloxacillin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Diclofenac', category: 'NSAID', commonDose: '50mg' },
    { name: 'Carvedilol', category: 'Beta Blocker', commonDose: '6.25mg' },
    { name: 'Nifedipine', category: 'Calcium Channel Blocker', commonDose: '30mg' },
    { name: 'Spironolactone', category: 'Diuretic', commonDose: '25mg' },
    { name: 'Digoxin', category: 'Cardiac Glycoside', commonDose: '0.25mg' },
    { name: 'Chlorpheniramine', category: 'Antihistamine', commonDose: '4mg' },
    { name: 'Cetirizine', category: 'Antihistamine', commonDose: '10mg' },
    { name: 'Multivitamin', category: 'Supplement', commonDose: '1 tab' },
    { name: 'Folic Acid', category: 'Supplement', commonDose: '5mg' },
    { name: 'Vitamin B Complex', category: 'Supplement', commonDose: '1 tab' },
    { name: 'Artemether-Lumefantrine', category: 'Antimalarial', commonDose: '20/120mg' },
  ];

  /* Medication state */
  const [drugCatalog, setDrugCatalog] = useState(MEDICATION_DB);
  const [drugCatalogLoading, setDrugCatalogLoading] = useState(false);
  const [drugCatalogError, setDrugCatalogError] = useState('');
  const [addedMeds, setAddedMeds] = useState([]);
  const [deletedExistingMeds, setDeletedExistingMeds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'existing'|'added', id: number, name: string }
  const [medDeleteConfirmInput, setMedDeleteConfirmInput] = useState('');
  const [medNameCopied, setMedNameCopied] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState(null);
  const [medicationSaveError, setMedicationSaveError] = useState('');
  const [medicationDeleteError, setMedicationDeleteError] = useState('');
  const [savingMedication, setSavingMedication] = useState(false);
  const [deletingMedication, setDeletingMedication] = useState(false);
  const [medForm, setMedForm] = useState({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' });
  const [drugSearch, setDrugSearch] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [showCustomDrug, setShowCustomDrug] = useState(false);
  const [customDrugName, setCustomDrugName] = useState('');

  /* Vitals state */
  const [vitalRecords, setVitalRecords] = useState([]);
  const [showVitalsMegaModal, setShowVitalsMegaModal] = useState(false);
  const [showNotesMegaModal, setShowNotesMegaModal] = useState(false);
  const [showIncidentsMegaModal, setShowIncidentsMegaModal] = useState(false);

  useEffect(() => {
    if (!showVitalsMegaModal && tab !== 'vitals') return;
    loadVitalRecords();
  }, [showVitalsMegaModal, tab, loadVitalRecords]);

  const [showMedicationsMegaModal, setShowMedicationsMegaModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [generateReportSubmitting, setGenerateReportSubmitting] = useState(false);
  const [generateReportError, setGenerateReportError] = useState('');
  const [generateReportDone, setGenerateReportDone] = useState(false);
  const [showReportDeathModal, setShowReportDeathModal] = useState(false);
  const [reportDeathSubmitting, setReportDeathSubmitting] = useState(false);
  const [patientStatusConfirm, setPatientStatusConfirm] = useState(null);
  const [patientStatusConfirmError, setPatientStatusConfirmError] = useState('');
  const [deactivatingPatient, setDeactivatingPatient] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState('');
  const [showDeactivateSuccessAlert, setShowDeactivateSuccessAlert] = useState(false);
  const [reportDeathError, setReportDeathError] = useState('');
  const [reportDeathDone, setReportDeathDone] = useState(false);
  const [reportDeathForm, setReportDeathForm] = useState({
    dateOfDeath: '',
    timeOfDeath: '',
    placeOfDeath: '',
    causeOrCircumstances: '',
    notes: '',
    nextOfKinNotified: false,
    confirmedProcedure: false,
  });
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openReportDeath = params.get('reportDeath');
    if (openReportDeath !== '1' && openReportDeath !== 'true') return;

    setReportDeathError('');
    setReportDeathDone(false);
    setShowReportDeathModal(true);

    params.delete('reportDeath');
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [vitalForm, setVitalForm] = useState(() => createVitalForm(currentUserName));
  const [expandedVital, setExpandedVital] = useState(null);
  const [vitalCardMenuId, setVitalCardMenuId] = useState(null);
  const [savingVital, setSavingVital] = useState(false);
  const [deletingVitalId, setDeletingVitalId] = useState(null);
  const [vitalSaveError, setVitalSaveError] = useState('');
  const [editingVitalId, setEditingVitalId] = useState(null);

  useEffect(() => {
    if (!showVitalsMegaModal) {
      setVitalCardMenuId(null);
    }
  }, [showVitalsMegaModal]);

  useEffect(() => {
    if (!showVitalsMegaModal || !vitalCardMenuId) return undefined;
    const closeMenu = () => setVitalCardMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [showVitalsMegaModal, vitalCardMenuId]);

  /* Reminder state */
  const [showReminderForm, setShowReminderForm] = useState(null); // med id
  const [reminderForm, setReminderForm] = useState(createMedicationReminderState());

  /* Nurse Notes state */
  const [nurseNotes, setNurseNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesRefreshing, setNotesRefreshing] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const notesLoadedRef = useRef(false);
  const incidentNursesRef = useRef([]);
  const remotePatientRef = useRef(null);
  const notesEnrichSessionRef = useRef({ currentUserName: '', sessionNurseIds: [] });
  const [notesError, setNotesError] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), nurse: '', category: 'Assessment', priority: 'Normal', content: '' });
  const [noteFilter, setNoteFilter] = useState('All');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [incidentNurses, setIncidentNurses] = useState([]);
  const [incidentNursesLoading, setIncidentNursesLoading] = useState(false);
  const [incidentNursesError, setIncidentNursesError] = useState('');
  const currentNurseId = resolveCurrentNurseId(currentUser, tokenPayload);

  const ROUTE_OPTIONS = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Rectal', 'Sublingual'];
  const medicationFrequencySelectValue = normalizeMedicationFrequency(medForm.frequency) || medForm.frequency || '';
  const medicationFrequencyOptions = useMemo(() => {
    const extras = [medicationFrequencySelectValue]
      .filter((value) => value && !MEDICATION_FREQUENCY_OPTIONS.includes(value));
    return [...MEDICATION_FREQUENCY_OPTIONS, ...extras];
  }, [medicationFrequencySelectValue]);

  const loadDrugCatalog = useCallback(async () => {
    setDrugCatalogLoading(true);
    setDrugCatalogError('');

    try {
      const response = await apiFetch('/drugs', { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Unable to load the drug list.');
      }

      const items = extractDrugList(payload)
        .map(normalizeDrugOption)
        .filter(item => item.name)
        .reduce((result, item) => {
          if (result.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
            return result;
          }

          result.push(item);
          return result;
        }, []);

      if (items.length > 0) {
        setDrugCatalog(items);
        setDrugCatalogError('');
      } else {
        setDrugCatalog(MEDICATION_DB);
        setDrugCatalogError('No drugs were returned from `/drugs`.');
      }
    } catch (error) {
      setDrugCatalog(MEDICATION_DB);
      setDrugCatalogError(error?.message || 'Unable to load the drug list.');
    } finally {
      setDrugCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showMedForm) {
      loadDrugCatalog();
    }
  }, [showMedForm, loadDrugCatalog]);

  /* Filtered drug list */
  const filteredDrugs = drugCatalog.filter(d =>
    d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(drugSearch.toLowerCase())
  );
  const drugNotFound = drugSearch.length >= 2 && filteredDrugs.length === 0;

  const selectDrug = (drug) => {
    setMedForm(f => ({ ...f, drug: drug.name, dosage: drug.commonDose }));
    setDrugSearch(drug.name);
    setShowDrugDropdown(false);
    setShowCustomDrug(false);
  };

  const applyCustomDrug = () => {
    if (!customDrugName.trim()) return;
    setMedForm(f => ({ ...f, drug: customDrugName.trim() }));
    setDrugSearch(customDrugName.trim());
    setShowCustomDrug(false);
    setShowDrugDropdown(false);
  };

  const resetMedicationComposer = () => {
    setShowMedForm(false);
    setEditingMedicationId(null);
    setMedicationSaveError('');
    setDrugCatalogError('');
    setMedForm({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' });
    setDrugSearch('');
    setShowDrugDropdown(false);
    setShowCustomDrug(false);
    setCustomDrugName('');
    setReminderForm(createMedicationReminderState());
  };

  const openMedicationEditor = (medication) => {
    if (!medication) return;

    const medicationKey = extractMedicationApiId(medication, medication, effectivePatientId)
      || medication.medicationId
      || medication.id;
    setEditingMedicationId(medicationKey);
    setMedicationSaveError('');
    setShowMedForm(true);
    setMedForm({
      drug: medication.drug || '',
      dosage: medication.dosage || '',
      frequency: resolveMedicationFrequency(medication, medication) || '',
      route: medication.route || 'Oral',
      notes: medication.notes || '',
    });
    setDrugSearch(medication.drug || '');
    setShowDrugDropdown(false);
    setShowCustomDrug(false);
    setCustomDrugName('');
    setReminderForm(createMedicationReminderState(medication));
  };

  const handleAddMed = async () => {
    if (!medForm.drug || !medForm.dosage || !medForm.frequency) return;
    setSavingMedication(true);
    setMedicationSaveError('');

    const currentUser = getUser();
    const addedBy = currentUser?.id || currentUser?._id || currentUser?.userId || currentUser?.staffId || undefined;
    const defaultReminder = createMedicationReminderState(editingMedicationId ? reminderForm : {});
    const normalizedFrequency = normalizeMedicationFrequency(medForm.frequency) || medForm.frequency;
    const scheduleTimes = frequencyToDefaultTimes(normalizedFrequency, defaultReminder.times)
      .filter(Boolean)
      .map(formatMedicationApiTime);
    const medicationPayload = {
      patientId: effectivePatientId,
      prescribedBy: 'external',
      drug: medForm.drug,
      drugRef: null,
      dosage: medForm.dosage,
      frequency: normalizedFrequency,
      intake: medForm.route.toLowerCase(),
      startDate: normalizeMedicationDateForInput(defaultReminder.startDate) || defaultReminder.startDate,
      endDate: normalizeMedicationDateForInput(defaultReminder.endDate) || null,
      active: true,
      time: scheduleTimes,
      ...(addedBy ? { addedBy } : {}),
    };

    try {
      let response = null;
      let data = {};

      if (editingMedicationId) {
        const editingMed = addedMeds.find((item) => (
          String(item.id) === String(editingMedicationId)
          || String(item.medicationId) === String(editingMedicationId)
        ));
        const medicationApiId = extractMedicationApiId(editingMed, { id: editingMedicationId }, effectivePatientId);

        if (!medicationApiId) {
          throw new Error(
            editingMed?.source === 'existing'
              ? 'Medications imported from the patient summary cannot be edited here. Remove and re-add them in Medications.'
              : 'This medication has no server ID. Remove it and add it again before editing.',
          );
        }

        const updatePayload = buildMedicationApiPatchPayload({
          medicationId: medicationApiId,
          drug: medForm.drug,
          dosage: medForm.dosage,
          intake: medForm.route,
          startDate: defaultReminder.startDate,
          endDate: defaultReminder.endDate,
          time: scheduleTimes,
          addedBy,
        });

        const patchResponse = await apiFetch(`/medications/${encodeURIComponent(medicationApiId)}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        });
        const responseText = await patchResponse.text().catch(() => '');
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }
        response = patchResponse;
        if (!response.ok) {
          throw new Error(data?.message || data?.error || 'Unable to update medication.');
        }

        try {
          const refreshed = await fetchMedicationById(medicationApiId);
          if (refreshed && typeof refreshed === 'object') {
            data = refreshed;
          }
        } catch {
          // PATCH succeeded; use response body if GET is unavailable
        }
      } else {
        const postResponse = await apiFetch('/medications', {
          method: 'POST',
          body: JSON.stringify(medicationPayload),
        });
        const responseText = await postResponse.text().catch(() => '');
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }
        response = postResponse;
        if (!response.ok) {
          throw new Error(data?.message || data?.error || 'Unable to save medication.');
        }
      }

      const savedMedication = normalizeMedicationRecord(data?.medication || data?.data || data, {
        id: editingMedicationId || undefined,
        medicationId: editingMedicationId || undefined,
        patientId: effectivePatientId,
        ...medForm,
        ...medicationPayload,
        frequency: normalizedFrequency,
        time: scheduleTimes,
        reminderType: defaultReminder.reminderType,
        notifyNurse: defaultReminder.notifyNurse,
        notifyPatient: defaultReminder.notifyPatient,
        startDate: normalizeMedicationDateForInput(defaultReminder.startDate) || defaultReminder.startDate,
        endDate: normalizeMedicationDateForInput(defaultReminder.endDate) || defaultReminder.endDate || '',
      });

      setAddedMeds(prev => {
        const next = editingMedicationId
          ? mergeMedicationRecords([
            ...prev.filter((item) => (
              String(item.id) !== String(editingMedicationId)
              && String(item.medicationId) !== String(editingMedicationId)
            )),
            savedMedication,
          ])
          : mergeMedicationRecords([...prev, savedMedication]);
        setCachedPatientMedications(effectivePatientId, next);
        return next;
      });
      setMedicationSaveSuccess(`${savedMedication.drug || 'Medication'} ${editingMedicationId ? 'updated' : 'added'} successfully.`);
      resetMedicationComposer();
      if (!editingMedicationId) {
        setShowReminderForm(savedMedication.id);
        setReminderForm(createMedicationReminderState(savedMedication));
      }
    } catch (error) {
      setMedicationSaveError(error?.message || 'Unable to save medication.');
    } finally {
      setSavingMedication(false);
    }
  };

  const handleRemoveMed = (id) => {
    setAddedMeds(prev => {
      const next = prev.filter(m => m.id !== id);
      setCachedPatientMedications(effectivePatientId, next);
      return next;
    });
    if (showReminderForm === id) setShowReminderForm(null);
  };

  const copyMedicationNameForDelete = async () => {
    const name = String(confirmDelete?.name || '').trim();
    if (!name) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(name);
      } else {
        throw new Error('clipboard unavailable');
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = name;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setMedNameCopied(true);
    window.setTimeout(() => setMedNameCopied(false), 2000);
  };

  const confirmDeleteMed = async () => {
    if (!confirmDelete || deletingMedication) return;

    if (medDeleteConfirmInput.trim() !== String(confirmDelete.name || '').trim()) {
      setMedicationDeleteError(`Type the medication name exactly as shown to confirm deletion.`);
      return;
    }
    setMedicationDeleteError('');

    if (confirmDelete.type === 'existing') {
      setDeletedExistingMeds(prev => [...prev, confirmDelete.id]);
      setConfirmDelete(null);
      return;
    }

    const medicationToDelete = addedMeds.find(item => String(item.id) === String(confirmDelete.id));
    if (!medicationToDelete) {
      handleRemoveMed(confirmDelete.id);
      setConfirmDelete(null);
      return;
    }

    setDeletingMedication(true);
    setMedicationDeleteError('');

    const deleteCandidates = [
      {
        path: `/medications/${encodeURIComponent(effectivePatientId)}`,
        body: {
          medicationId: extractMedicationApiId(medicationToDelete, medicationToDelete, effectivePatientId) || medicationToDelete.id,
          patientId: effectivePatientId,
          drug: medicationToDelete.drug,
        },
      },
      ...(String(medicationToDelete.id || '').trim() && String(medicationToDelete.id) !== String(effectivePatientId)
        ? [
            {
              path: `/medications/${encodeURIComponent(medicationToDelete.id)}`,
              body: {
                patientId: effectivePatientId,
              },
            },
          ]
        : []),
    ];

    let deleteSucceeded = false;
    let deleteErrorMessage = 'Unable to delete medication.';

    for (const candidate of deleteCandidates) {
      try {
        const response = await apiFetch(candidate.path, {
          method: 'DELETE',
          body: JSON.stringify(candidate.body),
        });

        const responseText = await response.text().catch(() => '');
        let data = {};

        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }

        if (response.ok) {
          deleteSucceeded = true;
          break;
        }

        deleteErrorMessage = data?.message || data?.error || deleteErrorMessage;
      } catch (error) {
        deleteErrorMessage = error?.message || deleteErrorMessage;
      }
    }

    if (!deleteSucceeded) {
      setMedicationDeleteError(deleteErrorMessage);
      setDeletingMedication(false);
      return;
    }

    handleRemoveMed(confirmDelete.id);
    setMedicationSaveSuccess(`${medicationToDelete.drug || 'Medication'} deleted successfully.`);
    setConfirmDelete(null);
    setDeletingMedication(false);
  };

  const saveReminder = async (medId) => {
    const currentMedication = addedMeds.find(item => item.id === medId);

    if (currentMedication) {
      try {
        const medicationFrequency = resolveMedicationFrequency(currentMedication, currentMedication);
        const medicationApiId = extractMedicationApiId(currentMedication, currentMedication, effectivePatientId);
        if (!medicationApiId) {
          throw new Error('This medication has no server ID. Re-save the medication before setting reminders.');
        }

        const currentUser = getUser();
        const addedBy = currentUser?.id || currentUser?._id || currentUser?.userId || currentUser?.staffId || undefined;
        const reminderPayload = buildMedicationApiPatchPayload({
          medicationId: medicationApiId,
          drug: currentMedication.drug,
          dosage: currentMedication.dosage,
          intake: currentMedication.route || 'Oral',
          startDate: reminderForm.startDate,
          endDate: reminderForm.endDate,
          time: reminderForm.times,
          addedBy,
          prescribedBy: currentMedication.prescribedBy || 'external',
          active: currentMedication.active ?? true,
        });

        const patchResponse = await apiFetch(`/medications/${encodeURIComponent(medicationApiId)}`, {
          method: 'PATCH',
          body: JSON.stringify(reminderPayload),
        });
        const responseText = await patchResponse.text().catch(() => '');
        let data = {};
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }
        if (!patchResponse.ok) {
          throw new Error(data?.message || data?.error || 'Unable to save medication reminder.');
        }

        try {
          const refreshed = await fetchMedicationById(medicationApiId);
          if (refreshed && typeof refreshed === 'object') {
            data = refreshed;
          }
        } catch {
          // use PATCH response
        }

        const updatedMedication = normalizeMedicationRecord(data?.medication || data?.data || data, {
          ...currentMedication,
          frequency: medicationFrequency,
          time: reminderForm.times.filter(Boolean).map(formatMedicationApiTime),
          startDate: normalizeMedicationDateForInput(reminderForm.startDate) || reminderForm.startDate,
          endDate: normalizeMedicationDateForInput(reminderForm.endDate) || reminderForm.endDate || '',
          reminderType: reminderForm.reminderType,
          notifyNurse: reminderForm.notifyNurse,
          notifyPatient: reminderForm.notifyPatient,
        });

        setAddedMeds(prev => {
          const next = mergeMedicationRecords(prev.map(item => item.id === medId ? updatedMedication : item));
          setCachedPatientMedications(effectivePatientId, next);
          return next;
        });
      } catch (error) {
        setMedicationSaveError(error?.message || 'Unable to save medication reminder.');
        return;
      }
    } else {
      setAddedMeds(prev => {
        const next = prev.map(m => m.id === medId ? { ...m, reminders: { ...reminderForm } } : m);
        setCachedPatientMedications(effectivePatientId, next);
        return next;
      });
    }

    setShowReminderForm(null);
    setReminderForm(createMedicationReminderState());
  };

  const addReminderTime = () => {
    setReminderForm(f => ({ ...f, times: [...f.times, '12:00'] }));
  };

  const removeReminderTime = (idx) => {
    setReminderForm(f => ({ ...f, times: f.times.filter((_, i) => i !== idx) }));
  };

  const updateReminderTime = (idx, val) => {
    setReminderForm(f => ({ ...f, times: f.times.map((t, i) => i === idx ? val : t) }));
  };

  /* Vitals helpers */
  const startEditVital = (record) => {
    if (!record) return;
    setEditingVitalId(record.id);
    setVitalSaveError('');
    setVitalForm({
      date: record.date || new Date().toISOString().slice(0, 10),
      time: record.time || new Date().toTimeString().slice(0, 5),
      bp: record.bp || '',
      sugar: record.sugar || '',
      resp: record.resp || '',
      spo2: record.spo2 || '',
      pulse: record.pulse || '',
      temp: record.temp || '',
      weight: record.weight || '',
      urinalysis: record.urinalysis || '',
      recordedBy: vitalRecorderDisplayName(record.recordedBy) || currentUserName || vitalRecorderDisplayName(p?.nurse) || '',
      notes: record.notes || '',
    });
    setShowVitalForm(true);
  };

  const closeVitalForm = () => {
    if (savingVital) return;
    setShowVitalForm(false);
    setVitalSaveError('');
    setEditingVitalId(null);
  };

  const handleAddVital = async () => {
    if (savingVital) return;
    if (!vitalForm.bp && !vitalForm.sugar && !vitalForm.pulse && !vitalForm.temp && !vitalForm.spo2 && !vitalForm.resp && !vitalForm.weight && !vitalForm.urinalysis) return;

    const tokenPayload = parseJwtPayload(getToken());
    const agencyId = resolveAgencyId(remotePatient) || resolveAgencyId(p) || resolveAgencyId(currentUser) || resolveAgencyId(tokenPayload);

    const { systolic, diastolic } = splitBloodPressure(vitalForm.bp);
    const recordedBy = (vitalRecorderDisplayName(vitalForm.recordedBy) || currentUserName || vitalRecorderDisplayName(p?.nurse) || '').trim();

    const payload = {
      patientId: effectivePatientId,
      ...(agencyId ? { agency: agencyId } : {}),
      bloodPressureSystolic: systolic,
      bloodPressureDystolic: diastolic,
      bloodSugar: String(vitalForm.sugar || '').trim(),
      respiration: String(vitalForm.resp || '').trim(),
      sp02: String(vitalForm.spo2 || '').trim(),
      pulseRate: String(vitalForm.pulse || '').trim(),
      temperature: String(vitalForm.temp || '').trim(),
      urinalysis: String(vitalForm.urinalysis || '').trim(),
      weight: String(vitalForm.weight || '').trim(),
      takenBy: recordedBy,
    };

    const isEditing = Boolean(editingVitalId);
    setSavingVital(true);
    setVitalSaveError('');

    try {
      const response = await apiFetch(
        isEditing ? `/vitals/${encodeURIComponent(editingVitalId)}` : '/vitals',
        {
          method: isEditing ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || (isEditing ? 'Unable to update vital record.' : 'Unable to save vital record.'));
      }

      const savedRecord = normalizeVitalRecord(data?.vital || data?.data || data, {
        id: isEditing ? editingVitalId : Date.now(),
        patientId: effectivePatientId,
        date: vitalForm.date,
        time: vitalForm.time,
        bp: vitalForm.bp,
        sugar: vitalForm.sugar,
        resp: vitalForm.resp,
        spo2: vitalForm.spo2,
        pulse: vitalForm.pulse,
        temp: vitalForm.temp,
        weight: vitalForm.weight,
        urinalysis: vitalForm.urinalysis,
        recordedBy,
        notes: vitalForm.notes,
      });

      await Promise.all([loadVitalRecords(), loadLatestVitalRecord()]);
      setVitalRecords((prev) => {
        if (isEditing) {
          const next = prev.map((item) => (item.id === editingVitalId ? { ...item, ...savedRecord, id: editingVitalId } : item));
          return sortVitalRecords(next);
        }
        return prev.length > 0 ? prev : sortVitalRecords([savedRecord]);
      });
      setEditingVitalId(null);
      setVitalForm(createVitalForm(currentUserName));
      setShowVitalForm(false);
      setVitalSaveSuccess(isEditing ? 'Vital record updated successfully.' : 'Vital record added successfully.');
    } catch (error) {
      setVitalSaveError(error?.message || (isEditing ? 'Unable to update vital record.' : 'Unable to save vital record.'));
    } finally {
      setSavingVital(false);
    }
  };

  const deleteVitalRecord = async (id) => {
    const vitalId = String(id || '').trim();
    if (!vitalId || deletingVitalId) return;
    if (!isUuidV4ish(vitalId) && !isLikelyMongoObjectId(vitalId)) {
      setVitalSaveError('This record cannot be deleted from the server (missing record id).');
      return;
    }

    setDeletingVitalId(vitalId);
    setVitalSaveError('');

    try {
      const response = await apiFetch(`/vitals/${encodeURIComponent(vitalId)}`, { method: 'DELETE' });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to delete vital record.');
      }

      if (expandedVital === vitalId) setExpandedVital(null);
      if (editingVitalId === vitalId) {
        setEditingVitalId(null);
        setShowVitalForm(false);
      }
      setVitalSaveSuccess('Vital record removed.');
      await Promise.all([loadVitalRecords(), loadLatestVitalRecord()]);
    } catch (error) {
      setVitalSaveError(error?.message || 'Unable to delete vital record.');
    } finally {
      setDeletingVitalId(null);
    }
  };

  /* Get latest vital value (from added records or admission) */
  const getLatestVital = (field) => {
    const latest = vitalRecords.find(r => r[field]);
    return latest ? latest[field] : p.vitals[field];
  };

  /* Urinalysis not in vitalMetricsCheck — flag non-normal manually */
  const isUrinalysisFlagged = (value) => {
    const normalized = String(value || '').trim();
    return normalized !== '' && normalized.toLowerCase() !== 'normal';
  };

  const vitalFormFieldRisk = useMemo(
    () => getVitalFieldRisksFromRow(vitalForm),
    [vitalForm.bp, vitalForm.sugar, vitalForm.spo2, vitalForm.pulse, vitalForm.temp],
  );
  const vitalFormOverallCheck = useMemo(
    () => vitalMetricsCheck(coerceVitalsToNumbers(vitalForm)),
    [vitalForm.bp, vitalForm.sugar, vitalForm.spo2, vitalForm.pulse, vitalForm.temp],
  );
  const vitalFormHasMetricInput = ['bp', 'sugar', 'spo2', 'pulse', 'temp'].some(
    (k) => String(vitalForm[k] || '').trim().length > 0,
  );

  const formatFlaggedMetricLabel = (key) => ({
    'blood-pressure': 'blood pressure',
    'blood-sugar': 'blood sugar',
    'blood-oxygen': 'SpO₂',
    'pulse-rate': 'pulse',
    temperature: 'temperature',
  }[key] || String(key || '').replace(/-/g, ' '));

  const vitalRiskInputStyle = (rowKey) => {
    const tier = vitalFormFieldRisk[rowKey] || 'low-risk';
    if (!String(vitalForm[rowKey] || '').trim()) return undefined;
    const c = riskColor(tier);
    return {
      borderWidth: 2,
      borderColor: c,
      boxShadow: `0 0 0 1px ${c}22`,
    };
  };
  const NOTE_CATEGORIES = ['Assessment', 'Medication', 'Care Update', 'Communication', 'Shift Handover', 'Incident', 'Observation', 'Other'];

  const resetNoteForm = () => {
    setNoteForm({
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      nurse:
        resolveNurseNameFromDirectory(currentNurseId, incidentNurses, { currentNurseId, currentUserName })
        || currentUserName
        || '',
      category: 'Assessment',
      priority: 'Normal',
      content: '',
    });
    setEditingNoteId(null);
    setNoteSaveError('');
  };

  const startEditNote = (note) => {
    if (!note) return;
    setEditingNoteId(note.id);
    setNoteSaveError('');
    setNoteForm({
      date: note.date || new Date().toISOString().slice(0, 10),
      time: note.time || new Date().toTimeString().slice(0, 5),
      nurse:
        note.nurse
        || resolveNurseNameFromDirectory(note.nurseId, incidentNurses, { currentNurseId, currentUserName })
        || currentUserName
        || '',
      category: note.category || 'Assessment',
      priority: note.priority || 'Normal',
      content: note.content || '',
    });
    setShowNoteForm(true);
  };

  useEffect(() => {
    incidentNursesRef.current = incidentNurses;
  }, [incidentNurses]);

  useEffect(() => {
    remotePatientRef.current = remotePatient;
  }, [remotePatient]);

  useEffect(() => {
    notesEnrichSessionRef.current = { currentUserName, sessionNurseIds };
  }, [currentUserName, sessionNurseIds]);

  const loadNurseNotes = useCallback(async ({ refresh = false } = {}) => {
    const patientIdValue = String(effectivePatientId || '').trim();

    if (!patientIdValue) {
      setNurseNotes([]);
      setNotesLoaded(true);
      return;
    }

    const path = `/nurse-notes/patient/${encodeURIComponent(patientIdValue)}`;
    const isInitialLoad = !refresh && !notesLoadedRef.current;

    if (refresh) {
      setNotesRefreshing(true);
    } else if (isInitialLoad) {
      setNotesLoading(true);
    }
    setNotesError('');

    try {
      const response = await apiFetch(path, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};
      if (responseText) {
        try { payload = JSON.parse(responseText); } catch { payload = { message: responseText }; }
      }

      if (!response.ok) {
        if (response.status === 404) {
          setNurseNotes([]);
          return;
        }
        throw new Error(payload?.message || payload?.error || 'Unable to load nurse notes.');
      }

      const patientSnapshot = remotePatientRef.current;
      const assignedNurses = Array.isArray(patientSnapshot?.assignedNurses) ? patientSnapshot.assignedNurses : [];
      const directory = mergeNurseDirectories(incidentNursesRef.current, assignedNurses);
      const { currentUserName: sessionName, sessionNurseIds: sessionIds } = notesEnrichSessionRef.current;
      const items = extractNurseNoteList(payload)
        .map((item) => normalizeNurseNote(item, { patientId: patientIdValue }))
        .filter((item) => item.content)
        .filter((item) => !item.patientId || String(item.patientId) === patientIdValue);
      setNurseNotes((prev) => {
        const enriched = sortNurseNotes(enrichNurseNoteNames(items, directory, {
          currentUserName: sessionName,
          sessionName,
          sessionNurseIds: sessionIds,
          notesScope: 'patient',
          primaryNurse: vitalRecorderDisplayName(patientSnapshot?.nurse) || String(patientSnapshot?.nurse || '').trim(),
        }));
        return enriched.map((note) => {
          const prior = prev.find((row) => String(row.id) === String(note.id));
          if (prior && isResolvableNurseName(prior.nurse) && !isResolvableNurseName(note.nurse)) {
            return { ...note, nurse: prior.nurse };
          }
          return note;
        });
      });
    } catch (error) {
      setNurseNotes((prev) => (refresh && prev.length ? prev : []));
      setNotesError(error?.message || 'Unable to load nurse notes.');
    } finally {
      setNotesLoading(false);
      setNotesRefreshing(false);
      notesLoadedRef.current = true;
      setNotesLoaded(true);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    if (!remotePatient) return undefined;

    notesLoadedRef.current = false;
    setNotesLoaded(false);
    setNurseNotes([]);
    setNotesError('');

    const scheduleLoad = () => { void loadNurseNotes(); };
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(scheduleLoad, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(scheduleLoad, 300);
    return () => window.clearTimeout(timer);
  }, [effectivePatientId, remotePatient, loadNurseNotes]);

  const handleAddNote = async () => {
    if (savingNote) return;
    const plainContent = String(noteForm.content || '').trim();
    if (!plainContent) {
      setNoteSaveError('Note content is required.');
      return;
    }

    const isEditing = Boolean(editingNoteId);
    if (!isEditing && !currentNurseId) {
      setNoteSaveError('Cannot create a note without a signed-in nurse identity.');
      return;
    }

    const noteForApi = noteContentToApi(plainContent);
    const recordedNurseName = String(
      currentUserName
      || resolveNurseNameFromDirectory(currentNurseId, incidentNurses, {
        currentNurseId,
        currentUserName,
        sessionNurseIds,
      })
      || noteForm.nurse
      || ''
    ).trim();

    const payload = isEditing
      ? { note: noteForApi }
      : {
          nurseId: currentNurseId,
          patientId: effectivePatientId,
          note: noteForApi,
          nurseName: recordedNurseName,
          recordedBy: recordedNurseName,
        };

    setSavingNote(true);
    setNoteSaveError('');

    try {
      const response = await apiFetch(
        isEditing ? `/nurse-notes/${encodeURIComponent(editingNoteId)}` : '/nurse-notes',
        {
          method: isEditing ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || (isEditing ? 'Unable to update note.' : 'Unable to save note.'));
      }

      const nurseName = String(
        recordedNurseName
        || resolveNoteNurseName(data?.note || data?.nurseNote || data?.data || data)
        || resolveNurseNameFromDirectory(currentNurseId, incidentNurses, { currentNurseId, currentUserName })
        || currentUserName
        || noteForm.nurse
        || ''
      ).trim();
      const savedNote = normalizeNurseNote(
        data?.note || data?.nurseNote || data?.data || data,
        {
          id: isEditing ? editingNoteId : undefined,
          patientId: effectivePatientId,
          nurseId: currentNurseId,
          nurse: nurseName,
          content: plainContent,
          date: noteForm.date,
          time: noteForm.time,
          category: noteForm.category,
          priority: noteForm.priority,
        }
      );

      setNurseNotes((prev) => {
        if (isEditing) {
          return sortNurseNotes(prev.map((item) => (String(item.id) === String(editingNoteId) ? { ...item, ...savedNote, id: editingNoteId } : item)));
        }
        return sortNurseNotes([savedNote, ...prev]);
      });

      resetNoteForm();
      setShowNoteForm(false);
    } catch (error) {
      setNoteSaveError(error?.message || (isEditing ? 'Unable to update note.' : 'Unable to save note.'));
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!id) return;
    setDeletingNoteId(id);
    try {
      const response = await apiFetch(`/nurse-notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        const responseText = await response.text().catch(() => '');
        let data = {};
        if (responseText) {
          try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
        }
        setNotesError(data?.message || data?.error || 'Unable to delete note.');
        return;
      }
      setNurseNotes((prev) => prev.filter((n) => String(n.id) !== String(id)));
      if (editingNoteId === id) {
        setEditingNoteId(null);
        setShowNoteForm(false);
      }
    } catch (error) {
      setNotesError(error?.message || 'Unable to delete note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handlePinNote = async (id) => {
    const target = nurseNotes.find((n) => String(n.id) === String(id));
    if (!target) return;
    const nextPinned = !target.pinned;

    setNurseNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, pinned: nextPinned } : n)));

    try {
      const response = await apiFetch(`/nurse-notes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: nextPinned, isPinned: nextPinned }),
      });
      if (!response.ok && response.status !== 404) {
        setNurseNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, pinned: !nextPinned } : n)));
      }
    } catch {
      setNurseNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, pinned: !nextPinned } : n)));
    }
  };
  const filteredNotes = nurseNotes
    .filter((n) => !effectivePatientId || !n.patientId || String(n.patientId) === String(effectivePatientId))
    .filter(n => noteFilter === 'All' || n.category === noteFilter)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getCategoryColor = (cat) => {
    const colors = { Assessment: '#45B6FE', Medication: '#3b82f6', 'Care Update': '#8b5cf6', Communication: '#f59e0b', 'Shift Handover': '#2E7DB8', Incident: '#dc2626', Observation: '#06b6d4', Other: '#6b7280' };
    return colors[cat] || '#6b7280';
  };

  /* ── Incident Report state ── */
  const INCIDENT_TYPES = INCIDENT_TYPE_LABELS;
  const INCIDENT_SEVERITIES = ['Minor', 'Moderate', 'Serious', 'Critical'];
  const [incidents, setIncidents] = useState([]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
    reportedBy: '', type: 'Fall', severity: 'Minor', location: '',
    description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
    physicianNotified: false, familyNotified: false,
  });
  const [incidentFilter, setIncidentFilter] = useState('All');
  const [expandedIncident, setExpandedIncident] = useState(null);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState('');
  const [savingIncident, setSavingIncident] = useState(false);
  const [incidentSaveError, setIncidentSaveError] = useState('');
  const [deletingIncidentId, setDeletingIncidentId] = useState(null);
  const [confirmDeleteIncident, setConfirmDeleteIncident] = useState(null);
  const [incidentDeleteModalError, setIncidentDeleteModalError] = useState('');
  const [updatingIncidentStatusId, setUpdatingIncidentStatusId] = useState(null);
  const [editingIncidentId, setEditingIncidentId] = useState(null);
  const [incidentFormImages, setIncidentFormImages] = useState([]);
  const [uploadingIncidentImages, setUploadingIncidentImages] = useState(false);
  const incidentImageInputRef = useRef(null);

  const resetIncidentForm = () => {
    setEditingIncidentId(null);
    setIncidentFormImages((prev) => {
      prev.forEach((img) => {
        if (img.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
      });
      return [];
    });
    setIncidentForm({
      date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
      reportedBy: String(currentUserName || '').trim(),
      type: 'Fall', severity: 'Minor', location: '',
      description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
      physicianNotified: false, familyNotified: false,
    });
    setIncidentSaveError('');
  };

  const setIncidentFormImagesFromIncident = (inc) => {
    setIncidentFormImages((prev) => {
      prev.forEach((img) => {
        if (img.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
      });
      return (inc?.images || []).map((attachment, index) => ({
        id: `existing-${index}-${attachment.mediaId || attachment.objectKey || attachment.url || index}`,
        url: attachment.url || '',
        mediaId: attachment.mediaId || '',
        objectKey: attachment.objectKey || '',
        previewUrl: attachment.url || '',
      }));
    });
  };

  const handleIncidentImageSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || uploadingIncidentImages) return;

    setUploadingIncidentImages(true);
    setIncidentSaveError('');
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setIncidentSaveError('Only image files can be attached.');
          continue;
        }
        const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
        const previewUrl = URL.createObjectURL(compressed);
        const { objectKey, mediaId } = await uploadFileViaBackend(compressed);
        setIncidentFormImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            mediaId,
            objectKey,
            previewUrl,
            url: '',
          },
        ]);
      }
    } catch (error) {
      setIncidentSaveError(error?.message || 'Unable to upload photo.');
    } finally {
      setUploadingIncidentImages(false);
    }
  };

  const removeIncidentFormImage = (imageId) => {
    setIncidentFormImages((prev) => {
      const target = prev.find((img) => img.id === imageId);
      if (target?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const loadIncidents = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setIncidents([]);
      return;
    }
    setIncidentsLoading(true);
    setIncidentsError('');
    try {
      const response = await apiFetch(`/incidents/patient/${encodeURIComponent(patientIdValue)}`, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};
      if (responseText) {
        try { payload = JSON.parse(responseText); } catch { payload = { message: responseText }; }
      }
      console.debug('[incidents] GET response', { status: response.status, payload });
      if (!response.ok) {
        if (response.status === 404) {
          setIncidents([]);
          return;
        }
        throw new Error(payload?.message || payload?.error || 'Unable to load incident reports.');
      }
      const items = extractIncidentList(payload)
        .map((item) => normalizeIncident(item, { patientId: patientIdValue }))
        .filter((item) => item.description || item.type);
      // Merge: if the server hasn't yet caught up, keep any locally-known incidents
      // that aren't in the response (so a just-created entry survives an eager refetch).
      setIncidents((prev) => {
        const serverIds = new Set(items.map((it) => String(it.id)));
        const stillLocal = prev.filter((it) => !serverIds.has(String(it.id)) && String(it.id).startsWith('inc-'));
        return sortIncidents([...items, ...stillLocal]);
      });
    } catch (error) {
      setIncidentsError(error?.message || 'Unable to load incident reports.');
    } finally {
      setIncidentsLoading(false);
    }
  }, [effectivePatientId]);

  const loadIncidentNurses = useCallback(async () => {
    setIncidentNursesLoading(true);
    setIncidentNursesError('');
    try {
      const response = await apiFetch('/nurses', { method: 'GET' });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }
      if (!response.ok) throw new Error(data?.message || data?.error || 'Failed to load nurses.');
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.nurses) ? data.nurses
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.items) ? data.items
        : [];
      const normalized = list
        .map(normalizeIncidentNurseRow)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      setIncidentNurses(normalized);
    } catch (error) {
      setIncidentNurses([]);
      setIncidentNursesError(error?.message || 'Unable to load nurses.');
    } finally {
      setIncidentNursesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showIncidentsMegaModal && !showNotesMegaModal && tab !== 'assignednurses') return;
    if (incidentNurses.length > 0 || incidentNursesLoading) return;
    loadIncidentNurses();
  }, [showIncidentsMegaModal, showNotesMegaModal, tab, incidentNurses.length, incidentNursesLoading, loadIncidentNurses]);

  useEffect(() => {
    if (!showIncidentsMegaModal && tab !== 'incidents') return;
    loadIncidents();
  }, [showIncidentsMegaModal, tab, loadIncidents]);

  useEffect(() => {
    if (!incidentNurses.length) return;
    setIncidents((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        if (!isUnknownReporterLabel(it.reportedBy)) return it;
        const nid = String(it.nurseId || '').trim();
        if (!nid) return it;
        const row = incidentNurses.find((n) => n.idsForMatch.includes(nid));
        if (!row?.name) return it;
        changed = true;
        return { ...it, reportedBy: row.name };
      });
      return changed ? next : prev;
    });
  }, [incidentNurses]);

  const handleAddIncident = async () => {
    if (savingIncident) return;
    if (!incidentForm.description.trim() || !incidentForm.type) {
      setIncidentSaveError('Description and type are required.');
      return;
    }
    const pref = String(incidentForm.reportedBy || '').trim();
    if (!pref) {
      setIncidentSaveError('Please enter who reported this incident.');
      return;
    }
    const sessionNurse = String(currentNurseId || '').trim();
    const lower = pref.toLowerCase();
    const nameMatch = incidentNurses.find(
      (n) => n.name && n.name.trim().toLowerCase() === lower
    );
    const idMatch = !nameMatch
      ? incidentNurses.find((n) => n.idsForMatch.includes(pref))
      : null;
    const rowMatch = nameMatch || idMatch;
    let reportingNurseId = '';
    if (rowMatch) {
      reportingNurseId = rowMatch.id;
    } else if (sessionNurse) {
      reportingNurseId = sessionNurse;
    }
    reportingNurseId = String(reportingNurseId || '').trim();
    if (incidentNurses.length) {
      const rowForPost = incidentNurses.find((n) => n.idsForMatch.includes(reportingNurseId));
      if (rowForPost) reportingNurseId = rowForPost.id;
    }
    if (!reportingNurseId) {
      setIncidentSaveError('Sign in to file a report, or enter a nurse name that matches your roster.');
      return;
    }

    const apiPayload = appendIncidentImagesToPayload({
      nurseId: reportingNurseId,
      patientId: String(effectivePatientId || '').trim(),
      date: incidentDateToApi(incidentForm.date),
      time: incidentTimeToApi(incidentForm.time),
      incidentType: incidentTypeToApi(incidentForm.type),
      severity: incidentSeverityToApi(incidentForm.severity),
      location: incidentForm.location || '',
      description: incidentForm.description.trim(),
      actionTaken: incidentForm.immediateAction || '',
      injuryDetail: incidentForm.injuryDetails || '',
      followUpPlan: incidentForm.followUp || '',
      physicianNotified: Boolean(incidentForm.physicianNotified),
      familyNotified: Boolean(incidentForm.familyNotified),
    }, incidentFormImages);

    setSavingIncident(true);
    setIncidentSaveError('');
    console.debug('[incidents] POST payload', apiPayload);
    try {
      const response = await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify(apiPayload),
      });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }
      console.debug('[incidents] POST response', { status: response.status, data });

      // Treat as failure if HTTP status is non-OK OR body explicitly signals failure.
      const bodyExplicitlyFailed =
        data && (data.success === false || data.ok === false || (data.error && !data.id && !data._id && !data.incident));
      if (!response.ok || bodyExplicitlyFailed) {
        const errMsg =
          data?.message
          || data?.data?.message
          || (typeof data?.error === 'string' ? data.error : data?.error?.message)
          || `Save failed (HTTP ${response.status}).`;
        throw new Error(errMsg);
      }

      const reporterRow = incidentNurses.find((n) => n.idsForMatch.includes(String(reportingNurseId)));
      const reporterFallback = String(rowMatch?.name || pref || reporterRow?.name || currentUserName || '').trim();
      const savedIncident = normalizeIncident(
        data?.incident || data?.data?.incident || data?.data || data,
        {
          patientId: effectivePatientId,
          nurseId: reportingNurseId,
          date: incidentForm.date,
          time: incidentForm.time,
          type: incidentForm.type,
          severity: incidentForm.severity,
          location: incidentForm.location,
          description: incidentForm.description,
          immediateAction: incidentForm.immediateAction,
          injuryDetails: incidentForm.injuryDetails,
          followUp: incidentForm.followUp,
          witnesses: incidentForm.witnesses,
          physicianNotified: incidentForm.physicianNotified,
          familyNotified: incidentForm.familyNotified,
          reportedBy: reporterFallback,
          status: 'open',
          images: incidentImagesFromFormState(incidentFormImages),
        }
      );

      // Add optimistically. We do NOT immediately refetch — if the backend has any
      // commit delay, an eager GET could return an empty list and wipe the just-saved
      // entry from view. Refresh button + tab re-open will re-sync from the server.
      setIncidents((prev) => {
        const without = prev.filter((it) => String(it.id) !== String(savedIncident.id));
        return sortIncidents([savedIncident, ...without]);
      });
      resetIncidentForm();
      setShowIncidentForm(false);

      // Soft re-sync after a beat — far enough out for typical commit latency.
      setTimeout(() => { loadIncidents(); }, 1200);
    } catch (error) {
      console.error('[incidents] POST failed', error);
      setIncidentSaveError(error?.message || 'Unable to save incident report.');
    } finally {
      setSavingIncident(false);
    }
  };

  const handleUpdateIncident = async () => {
    if (savingIncident) return;
    const incidentId = String(editingIncidentId || '').trim();
    if (!incidentId) return;

    if (!incidentForm.description.trim() || !incidentForm.type) {
      setIncidentSaveError('Description and type are required.');
      return;
    }
    const pref = String(incidentForm.reportedBy || '').trim();
    if (!pref) {
      setIncidentSaveError('Please enter who reported this incident.');
      return;
    }
    const sessionNurse = String(currentNurseId || '').trim();
    const lower = pref.toLowerCase();
    const nameMatch = incidentNurses.find(
      (n) => n.name && n.name.trim().toLowerCase() === lower
    );
    const idMatch = !nameMatch
      ? incidentNurses.find((n) => n.idsForMatch.includes(pref))
      : null;
    const rowMatch = nameMatch || idMatch;
    let reportingNurseId = '';
    if (rowMatch) {
      reportingNurseId = rowMatch.id;
    } else if (sessionNurse) {
      reportingNurseId = sessionNurse;
    }
    reportingNurseId = String(reportingNurseId || '').trim();
    if (incidentNurses.length) {
      const rowForPost = incidentNurses.find((n) => n.idsForMatch.includes(reportingNurseId));
      if (rowForPost) reportingNurseId = rowForPost.id;
    }
    if (!reportingNurseId) {
      setIncidentSaveError('Sign in to update this report, or enter a nurse name that matches your roster.');
      return;
    }

    const currentInc = incidents.find((i) => String(i.id) === incidentId);
    const statusPayload = incidentStatusToApi(currentInc?.status ?? 'open');

    const apiPayload = appendIncidentImagesToPayload({
      nurseId: reportingNurseId,
      patientId: String(effectivePatientId || '').trim(),
      date: incidentDateToApi(incidentForm.date),
      time: incidentTimeToApi(incidentForm.time),
      incidentType: incidentTypeToApi(incidentForm.type),
      severity: incidentSeverityToApi(incidentForm.severity),
      location: incidentForm.location || '',
      description: incidentForm.description.trim(),
      actionTaken: incidentForm.immediateAction || '',
      injuryDetail: incidentForm.injuryDetails || '',
      followUpPlan: incidentForm.followUp || '',
      physicianNotified: Boolean(incidentForm.physicianNotified),
      familyNotified: Boolean(incidentForm.familyNotified),
      status: statusPayload,
    }, incidentFormImages);

    setSavingIncident(true);
    setIncidentSaveError('');
    console.debug('[incidents] PATCH payload', incidentId, apiPayload);
    try {
      const response = await apiFetch(`/incidents/${encodeURIComponent(incidentId)}`, {
        method: 'PATCH',
        body: JSON.stringify(apiPayload),
      });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }
      console.debug('[incidents] PATCH response', { status: response.status, data });

      const bodyExplicitlyFailed =
        data && (data.success === false || data.ok === false || (data.error && !data.id && !data._id && !data.incident));
      if (!response.ok || bodyExplicitlyFailed) {
        const errMsg =
          data?.message
          || data?.data?.message
          || (typeof data?.error === 'string' ? data.error : data?.error?.message)
          || `Update failed (HTTP ${response.status}).`;
        throw new Error(errMsg);
      }

      const reporterRow = incidentNurses.find((n) => n.idsForMatch.includes(String(reportingNurseId)));
      const reporterFallback = String(rowMatch?.name || pref || reporterRow?.name || currentUserName || '').trim();
      const updatedIncident = normalizeIncident(
        data?.incident || data?.data?.incident || data?.data || data || {},
        {
          id: incidentId,
          patientId: effectivePatientId,
          nurseId: reportingNurseId,
          date: incidentForm.date,
          time: incidentForm.time,
          type: incidentForm.type,
          severity: incidentForm.severity,
          location: incidentForm.location,
          description: incidentForm.description,
          immediateAction: incidentForm.immediateAction,
          injuryDetails: incidentForm.injuryDetails,
          followUp: incidentForm.followUp,
          witnesses: incidentForm.witnesses,
          physicianNotified: incidentForm.physicianNotified,
          familyNotified: incidentForm.familyNotified,
          reportedBy: reporterFallback,
          status: currentInc?.status ?? 'open',
          images: incidentImagesFromFormState(incidentFormImages),
        }
      );

      setIncidents((prev) => {
        const without = prev.filter((it) => String(it.id) !== String(updatedIncident.id));
        return sortIncidents([updatedIncident, ...without]);
      });
      resetIncidentForm();
      setShowIncidentForm(false);
      setTimeout(() => { loadIncidents(); }, 1200);
    } catch (error) {
      console.error('[incidents] PATCH failed', error);
      setIncidentSaveError(error?.message || 'Unable to update incident report.');
    } finally {
      setSavingIncident(false);
    }
  };

  const performDeleteIncident = async (id) => {
    const incidentId = String(id || '').trim();
    if (!incidentId || deletingIncidentId === incidentId) return false;
    setDeletingIncidentId(incidentId);
    setIncidentsError('');
    try {
      const response = await apiFetch(`/incidents/${encodeURIComponent(incidentId)}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        const responseText = await response.text().catch(() => '');
        let data = {};
        if (responseText) {
          try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
        }
        throw new Error(data?.message || data?.error || 'Unable to delete incident.');
      }
      setIncidents((prev) => prev.filter((inc) => String(inc.id) !== String(incidentId)));
      if (expandedIncident === incidentId) setExpandedIncident(null);
      return true;
    } catch (error) {
      setIncidentDeleteModalError(error?.message || 'Unable to delete incident.');
      return false;
    } finally {
      setDeletingIncidentId(null);
    }
  };

  const requestDeleteIncident = (id) => {
    const incidentId = String(id || '').trim();
    if (!incidentId || deletingIncidentId === incidentId) return;
    setIncidentDeleteModalError('');
    setConfirmDeleteIncident({ id: incidentId });
  };

  const confirmDeleteIncidentAction = async () => {
    if (!confirmDeleteIncident?.id) return;
    const targetId = confirmDeleteIncident.id;
    const ok = await performDeleteIncident(targetId);
    if (ok) {
      setConfirmDeleteIncident(null);
      setIncidentDeleteModalError('');
      if (String(editingIncidentId) === String(targetId)) {
        setShowIncidentForm(false);
        resetIncidentForm();
      }
    }
  };

  const handleDeleteIncident = requestDeleteIncident;

  const handleUpdateIncidentStatus = async (id, newStatus) => {
    const incidentId = String(id || '').trim();
    if (!incidentId || updatingIncidentStatusId === incidentId) return;

    const previous = incidents;
    const statusPayload = incidentStatusToApi(newStatus);

    setUpdatingIncidentStatusId(incidentId);
    setIncidentsError('');
    setIncidents((prev) =>
      prev.map((inc) => (String(inc.id) === incidentId ? { ...inc, status: newStatus } : inc))
    );

    try {
      const response = await apiFetch(`/incidents/${encodeURIComponent(incidentId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusPayload }),
      });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      const bodyFailed =
        data && (data.success === false || data.ok === false || (data.error && !data.data && !data.incident && !data.id));

      if (!response.ok || bodyFailed) {
        throw new Error(data?.message || data?.error || `Update failed (HTTP ${response.status}).`);
      }

      const updatedRaw = data?.data ?? data?.incident ?? (data?.id ? data : null);
      if (updatedRaw && typeof updatedRaw === 'object') {
        setIncidents((prev) =>
          sortIncidents(
            prev.map((inc) =>
              String(inc.id) === incidentId ? normalizeIncident(updatedRaw, inc) : inc
            )
          )
        );
      }
    } catch (error) {
      setIncidents(previous);
      setIncidentsError(error?.message || 'Unable to update incident.');
    } finally {
      setUpdatingIncidentStatusId(null);
    }
  };

  const incidentIdIsPersisted = (id) => {
    const s = String(id || '').trim();
    return Boolean(s) && !s.startsWith('inc-');
  };

  const filteredIncidents = incidents
    .filter(inc => incidentFilter === 'All' || inc.type === incidentFilter)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getIncidentSeverityStyle = (sev) => {
    const styles = {
      Minor:    { bg: '#fefce8', color: '#a16207', border: '#eab308' },
      Moderate: { bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
      Serious:  { bg: '#fef3c7', color: '#92400e', border: '#d97706' },
      Critical: { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' },
    };
    return styles[sev] || styles.Minor;
  };
  const getIncidentStatusStyle = (st) => {
    const styles = {
      open:          { bg: '#ffffff', color: '#374151', border: '#d1d5db', label: 'Open' },
      'in-progress': { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db', label: 'In Progress' },
      resolved:      { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Resolved' },
    };
    return styles[st] || styles.open;
  };

  const pendingDeleteIncidentDetail = confirmDeleteIncident
    ? incidents.find((i) => String(i.id) === String(confirmDeleteIncident.id))
    : null;
  const incidentDeleteDialogBusy = Boolean(
    confirmDeleteIncident
    && deletingIncidentId
    && String(deletingIncidentId) === String(confirmDeleteIncident.id)
  );

  /* ── Care Plan state ── */
  const CARE_CATEGORIES = ['Personal Care', 'Medication Management', 'Nutrition & Diet', 'Mobility & Exercise', 'Wound Care', 'Monitoring & Vitals', 'Emotional Support', 'Hygiene', 'Safety', 'Therapy', 'Other'];
  const CARE_FREQUENCIES = ['Daily', 'Twice Daily', 'Three Times Daily', 'Weekly', 'Twice Weekly', 'Biweekly', 'Monthly', 'As Needed', 'Once'];
  const CARE_PRIORITIES = ['High', 'Medium', 'Low'];
  const [carePlanItems, setCarePlanItems] = useState([]);
  const [showCarePlanForm, setShowCarePlanForm] = useState(false);
  const [carePlanForm, setCarePlanForm] = useState({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
  const [carePlanFilter, setCarePlanFilter] = useState('All');
  const [editingCarePlan, setEditingCarePlan] = useState(null);
  const [confirmDeleteCarePlan, setConfirmDeleteCarePlan] = useState(null);
  const [carePlanDeleteError, setCarePlanDeleteError] = useState('');
  const [carePlanLoading, setCarePlanLoading] = useState(false);
  const [carePlanLoadError, setCarePlanLoadError] = useState('');
  const [savingCarePlan, setSavingCarePlan] = useState(false);
  const [carePlanSaveError, setCarePlanSaveError] = useState('');
  const [carePlanSaveSuccess, setCarePlanSaveSuccess] = useState('');
  const [carePlanToggleError, setCarePlanToggleError] = useState('');
  const [deletingCarePlanId, setDeletingCarePlanId] = useState(null);
  const [carePlanListExpanded, setCarePlanListExpanded] = useState(false);

  const loadCarePlans = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setCarePlanItems([]);
      return;
    }
    setCarePlanLoading(true);
    setCarePlanLoadError('');
    try {
      const embedded = extractCarePlanRowsFromPatientPayload(rawPatientApiRef.current);
      if (embedded.length > 0) {
        const items = embedded
          .map((row) => normalizeCarePlanRecord(row, { patientId: patientIdValue }))
          .filter((item) => item.task);
        setCarePlanItems(sortCarePlanItems(items));
        return;
      }

      const q = encodeURIComponent(patientIdValue);
      const paths = [
        `/patients/${q}/care-plans`,
        `/patients/${q}/care-plan`,
        `/patient/${q}/care-plans`,
        `/patient/${q}/care-plan`,
        `/care-plan/patient/${q}`,
        `/care-plans/patient/${q}`,
      ];

      let response = null;
      let payload = {};

      for (const path of paths) {
        const res = await apiFetch(path, { method: 'GET', quiet: true });
        const responseText = await res.text().catch(() => '');
        let parsed = {};
        if (responseText) {
          try {
            parsed = JSON.parse(responseText);
          } catch {
            parsed = { message: responseText };
          }
        }
        if (res.ok) {
          response = res;
          payload = parsed;
          break;
        }
        if (res.status !== 404) {
          response = res;
          payload = parsed;
          break;
        }
      }

      if (!response || !response.ok) {
        setCarePlanItems([]);
        if (response && response.status !== 404) {
          setCarePlanLoadError(payload?.message || payload?.error || 'Unable to load care plan.');
        }
        return;
      }

      const items = extractCarePlanList(payload)
        .map((row) => normalizeCarePlanRecord(row, { patientId: patientIdValue }))
        .filter((item) => item.task);
      setCarePlanItems(sortCarePlanItems(items));
    } catch (error) {
      setCarePlanItems([]);
      setCarePlanLoadError(error?.message || 'Unable to load care plan.');
    } finally {
      setCarePlanLoading(false);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    if (patientApiSyncVersion === 0) return;
    if (tab !== 'careplan' && tab !== 'checkliststatus') return;
    loadCarePlans();
  }, [patientApiSyncVersion, tab, loadCarePlans]);

  const [checklistStatusDate, setChecklistStatusDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyChecklistByDate, setDailyChecklistByDate] = useState({});
  const [completedCarePlansByDate, setCompletedCarePlansByDate] = useState({});
  const [completedCarePlansLoad, setCompletedCarePlansLoad] = useState({ loading: false, error: '' });

  const fetchDailyChecklist = useCallback(async (dateStr) => {
    const pid = String(effectivePatientId || '').trim();
    const d = String(dateStr || '').trim();
    if (!pid || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;

    setDailyChecklistByDate((prev) => ({
      ...prev,
      [d]: { ...prev[d], loading: true, error: '' },
    }));

    try {
      const path = buildDailyCarePlanChecklistPath(pid, d);
      if (!path) return;
      const res = await apiFetch(path, { method: 'GET', quiet: true });
      const text = await res.text().catch(() => '');
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }
      if (!res.ok) {
        if (res.status === 404) {
          setDailyChecklistByDate((prev) => ({
            ...prev,
            [d]: { items: [], loading: false, error: '' },
          }));
          return;
        }
        const msg = data?.message || data?.error || `Unable to load daily checklist (${res.status}).`;
        setDailyChecklistByDate((prev) => ({
          ...prev,
          [d]: {
            items: null,
            loading: false,
            error: typeof msg === 'string' ? msg : 'Unable to load daily checklist.',
          },
        }));
        return;
      }
      const items = parseDailyChecklistResponsePayload(data);
      setDailyChecklistByDate((prev) => ({
        ...prev,
        [d]: { items, loading: false, error: '' },
      }));
    } catch (e) {
      setDailyChecklistByDate((prev) => ({
        ...prev,
        [d]: { items: null, loading: false, error: e?.message || 'Unable to load daily checklist.' },
      }));
    }
  }, [effectivePatientId]);

  const loadPatientCompletedCarePlans = useCallback(async () => {
    const pid = String(
      resolvePatientApiId(rawPatientApiRef.current, remotePatient) || effectivePatientId || '',
    ).trim();
    if (!pid) return;

    setCompletedCarePlansLoad({ loading: true, error: '' });
    const result = await fetchPatientCompletedDailyCarePlans(apiFetch, pid, {
      quiet: true,
      onUnauthorized: () => { window.location.replace('/login'); },
    });

    setCompletedCarePlansByDate(result.byDate);
    setCompletedCarePlansLoad({
      loading: false,
      error: result.error || '',
    });

    setDailyChecklistByDate((prev) => {
      const next = { ...prev };
      Object.entries(result.byDate).forEach(([dateStr, completedItems]) => {
        const existing = Array.isArray(next[dateStr]?.items) ? next[dateStr].items : null;
        if (existing) {
          const pending = existing.filter((item) => !item.completed);
          const merged = [...pending, ...completedItems];
          const seen = new Set();
          next[dateStr] = {
            items: merged.filter((item) => {
              const key = `${item.id}|${item.task}|${item.completed}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }),
            loading: false,
            error: '',
          };
        } else {
          next[dateStr] = { items: completedItems, loading: false, error: '' };
        }
      });
      return next;
    });
  }, [effectivePatientId, remotePatient]);

  useEffect(() => {
    if (patientApiSyncVersion === 0) return;
    if (tab !== 'checkliststatus') return;
    void loadPatientCompletedCarePlans();
  }, [patientApiSyncVersion, tab, loadPatientCompletedCarePlans]);

  useEffect(() => {
    if (tab !== 'checkliststatus') return;
    void fetchDailyChecklist(checklistStatusDate);
    listRecentIsoDates(7).forEach((dateStr) => { void fetchDailyChecklist(dateStr); });
  }, [tab, checklistStatusDate, fetchDailyChecklist]);

  const postCarePlanCreate = async (fullBody, patientId) => {
    const pid = encodeURIComponent(patientId);

    const attempts = [
      ['POST', '/care-plan', fullBody],
      ['POST', `/care-plan/patient/${pid}`, fullBody],
      ['PUT', `/care-plan/patient/${pid}`, fullBody],
      ['POST', '/care-plans', fullBody],
      ['POST', `/care-plans/patient/${pid}`, fullBody],
    ];

    let last404Detail = '';
    for (const [method, path, body] of attempts) {
      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(body),
      });
      const lastText = await response.text().catch(() => '');
      let data = {};
      if (lastText) {
        try {
          data = JSON.parse(lastText);
        } catch {
          data = { message: lastText };
        }
      }
      if (response.ok) {
        return { data };
      }
      const msg = data?.message || data?.error || (typeof data === 'string' ? data : '');
      const textErr = typeof lastText === 'string' ? lastText.trim() : '';
      const combined = (typeof msg === 'string' && msg.trim() ? msg : textErr) || `HTTP ${response.status}`;
      if (response.status !== 404) {
        throw new Error(combined);
      }
      last404Detail = combined;
    }
    throw new Error(
      last404Detail
        || 'Care plan API returned "Not found" for every tried create path. Confirm POST /care-plan is deployed.',
    );
  };

  const handleAddCarePlanItem = async () => {
    if (!carePlanForm.task.trim() || savingCarePlan) return;
    const pid = String(effectivePatientId || '').trim();
    if (!pid) {
      setCarePlanSaveError('Patient is not loaded. Save the profile or open a patient record first.');
      return;
    }
    setSavingCarePlan(true);
    setCarePlanSaveError('');
    try {
      const body = buildCarePlanApiBody(pid, carePlanForm, {});
      const isEditing = Boolean(editingCarePlan);
      if (isEditing) {
        let patchResponse = await apiFetch(`/care-plan/${encodeURIComponent(editingCarePlan)}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        if (!patchResponse.ok && patchResponse.status === 404) {
          patchResponse = await apiFetch(`/care-plans/${encodeURIComponent(editingCarePlan)}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          });
        }
        const responseText = await patchResponse.text().catch(() => '');
        let data = {};
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }
        if (!patchResponse.ok) {
          const msg = data?.message || data?.error || `Unable to update care plan item (${patchResponse.status}).`;
          throw new Error(typeof msg === 'string' ? msg : 'Unable to update care plan item.');
        }
        const saved = normalizeCarePlanRecord(data?.carePlan || data?.data || data, {
          patientId: pid,
          id: editingCarePlan,
          task: carePlanForm.task,
          category: carePlanForm.category,
          frequency: carePlanForm.frequency,
          priority: carePlanForm.priority,
          notes: carePlanForm.notes,
          checked: carePlanItems.find((i) => String(i.id) === String(editingCarePlan))?.checked,
        });
        if (!saved.task) {
          await loadCarePlans();
        } else {
          setCarePlanItems((prev) => sortCarePlanItems(
            prev.map((item) => (String(item.id) === String(editingCarePlan) ? { ...item, ...saved } : item)),
          ));
        }
      } else {
        await postCarePlanCreate(body, pid);
        await loadCarePlans();
        setCarePlanSaveSuccess(`${carePlanForm.task.trim()} is now on the checklist.`);
      }
      setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
      setEditingCarePlan(null);
      setShowCarePlanForm(false);
      setCarePlanListExpanded(true);
    } catch (error) {
      setCarePlanSaveError(error?.message || 'Could not save care plan item.');
    } finally {
      setSavingCarePlan(false);
    }
  };
  const handleToggleCarePlanItem = async (id) => {
    const item = carePlanItems.find((i) => String(i.id) === String(id));
    if (!item) return;
    const pid = String(effectivePatientId || '').trim();
    if (!pid) return;
    setCarePlanToggleError('');
    const tokenPayload = parseJwtPayload(getToken());
    const markNurseId = resolveNurseIdForCarePlanMark(currentUser, tokenPayload);
    const carePlanIdStr = String(id).trim();
    const next = !item.checked;
    setCarePlanItems((prev) => sortCarePlanItems(prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: next } : i))));
    const todayIso = new Date().toISOString().slice(0, 10);

    const useCarePlanChecklistMark =
      Boolean(markNurseId)
      && !carePlanIdStr.startsWith('cp-')
      && (isUuidV4ish(pid) || isLikelyMongoObjectId(pid))
      && (isUuidV4ish(carePlanIdStr) || isLikelyMongoObjectId(carePlanIdStr));

    const runLegacyPatch = async () => {
      const body = buildCarePlanApiBody(pid, {
        task: item.task,
        category: item.category,
        frequency: item.frequency,
        priority: item.priority,
        notes: item.notes,
      }, { completed: next });
      let toggleRes = await apiFetch(`/care-plan/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!toggleRes.ok && toggleRes.status === 404) {
        toggleRes = await apiFetch(`/care-plans/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      const legacyText = await toggleRes.text().catch(() => '');
      let legacyData = {};
      if (legacyText) {
        try {
          legacyData = JSON.parse(legacyText);
        } catch {
          legacyData = { message: legacyText };
        }
      }
      if (!toggleRes.ok) {
        const msg = legacyData?.message || legacyData?.error || legacyText || 'Update failed';
        throw new Error(typeof msg === 'string' ? msg : 'Update failed.');
      }
      const resolvedLegacy = completionFromCarePlanMarkResponse(legacyData);
      if (resolvedLegacy !== undefined) {
        setCarePlanItems((prev) =>
          sortCarePlanItems(
            prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: resolvedLegacy } : i)),
          ));
      }
    };

    try {
      if (useCarePlanChecklistMark) {
        const markPayload = {
          patientId: pid,
          carePlanId: carePlanIdStr,
          nurseId: markNurseId,
        };
        const response = await apiFetch('/care-plan-checklist/mark', {
          method: 'POST',
          body: JSON.stringify(markPayload),
        });
        const responseText = await response.text().catch(() => '');
        let data = {};
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }

        if (!response.ok) {
          await runLegacyPatch();
        } else {
          const resolved = completionFromCarePlanMarkResponse(data);
          if (resolved !== undefined) {
            setCarePlanItems((prev) =>
              sortCarePlanItems(
                prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: resolved } : i)),
              ));
          }
        }
      } else {
        await runLegacyPatch();
      }

      void fetchDailyChecklist(todayIso);
      void loadPatientCompletedCarePlans();
      /* Do not await loadCarePlans() here — GET /care-plan/patient may lag behind POST mark/PATCH
         and would replace the list with stale `completed` flags, making the checkbox snap back. */
    } catch (err) {
      const msg = err?.message || 'Could not update this item.';
      setCarePlanToggleError(msg);
      setCarePlanItems((prev) => sortCarePlanItems(prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: !next } : i))));
    }
  };

  const handleDeleteCarePlanItem = async () => {
    if (!confirmDeleteCarePlan) return;
    const deleteId = confirmDeleteCarePlan.id;
    setCarePlanDeleteError('');
    setDeletingCarePlanId(deleteId);
    try {
      let response = await apiFetch(`/care-plans/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
      if (!response.ok && response.status === 404) {
        response = await apiFetch(`/care-plan/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
      }
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to remove care plan item.');
      }
      setCarePlanItems((prev) => prev.filter((item) => String(item.id) !== String(deleteId)));
      setConfirmDeleteCarePlan(null);
      await loadCarePlans();
    } catch (error) {
      setCarePlanDeleteError(error?.message || 'Unable to remove care plan item.');
    } finally {
      setDeletingCarePlanId(null);
    }
  };
  const handleEditCarePlanItem = (item) => {
    setCarePlanSaveError('');
    setCarePlanForm({ task: item.task, category: item.category, frequency: item.frequency, priority: item.priority, notes: item.notes });
    setEditingCarePlan(item.id);
    setCarePlanListExpanded(true);
    setShowCarePlanForm(true);
  };
  const filteredCarePlanItems = carePlanItems
    .filter(item => carePlanFilter === 'All' || item.category === carePlanFilter)
    .sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
  const carePlanProgress = carePlanItems.length > 0
    ? Math.round((carePlanItems.filter(i => i.checked).length / carePlanItems.length) * 100)
    : 0;
  const carePlanCompletedCount = carePlanItems.filter((i) => i.checked).length;
  const carePlanRemainingCount = carePlanItems.length - carePlanCompletedCount;
  const carePlanHighOpenCount = carePlanItems.filter((i) => i.priority === 'High' && !i.checked).length;
  const getCarePriorityStyle = (p) => {
    const styles = { High: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }, Medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }, Low: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD' } };
    return styles[p] || styles.Medium;
  };
  /* ── Care Checklist Status (daily checklist API) ── */
  const getChecklistForDate = (dateStr) => {
    const e = dailyChecklistByDate[dateStr];
    if (e && Array.isArray(e.items)) return e.items;
    return null;
  };
  const selectedDailyEntry = dailyChecklistByDate[checklistStatusDate];
  const selectedDateChecklist = getChecklistForDate(checklistStatusDate);
  const selectedDateCompleted = selectedDateChecklist ? selectedDateChecklist.filter(i => i.completed).length : 0;
  const selectedDateTotal = selectedDateChecklist ? selectedDateChecklist.length : 0;
  const selectedDatePercent = selectedDateTotal > 0 ? Math.round((selectedDateCompleted / selectedDateTotal) * 100) : 0;
  const getCompletionLabel = (pct) => {
    if (pct === 100) return { text: 'Fully completed', bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
    if (pct >= 75) return { text: 'Mostly completed', bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
    if (pct >= 50) return { text: 'Partially completed', bg: '#fffbeb', color: '#92400e', border: '#fde68a' };
    if (pct > 0) return { text: 'Minimal progress', bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' };
    return { text: 'Not started', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
  };
  /* Quick nav dates for the last 7 days */
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] };
  };
  const formatChecklistLongDate = (dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  const completedCarePlanDates = useMemo(() => {
    const fromApi = Object.keys(completedCarePlansByDate).filter((d) => (
      Array.isArray(completedCarePlansByDate[d]) && completedCarePlansByDate[d].length > 0
    ));
    if (fromApi.length) return fromApi.sort((a, b) => b.localeCompare(a));
    return quickDates;
  }, [completedCarePlansByDate, quickDates]);
  const selectedDateCompletedItems = useMemo(() => {
    const fromPatientCompleted = completedCarePlansByDate[checklistStatusDate];
    if (Array.isArray(fromPatientCompleted) && fromPatientCompleted.length > 0) {
      return fromPatientCompleted;
    }
    return selectedDateChecklist ? selectedDateChecklist.filter((item) => item.completed) : [];
  }, [completedCarePlansByDate, checklistStatusDate, selectedDateChecklist]);
  const allCompletedCarePlans = useMemo(
    () => completedCarePlanDates.flatMap((dateStr) => (
      (completedCarePlansByDate[dateStr] || []).map((item) => ({ ...item, careDate: dateStr }))
    )),
    [completedCarePlanDates, completedCarePlansByDate],
  );
  const dailyCompletedCareByDay = completedCarePlanDates.map((dateStr) => {
    const entry = dailyChecklistByDate[dateStr];
    const completed = completedCarePlansByDate[dateStr]
      || (getChecklistForDate(dateStr)?.filter((item) => item.completed) ?? []);
    return {
      dateStr,
      entry,
      items: getChecklistForDate(dateStr),
      completed: Array.isArray(completed) ? completed : [],
    };
  });
  const totalCompletedAll = allCompletedCarePlans.length;

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarImageError(false);
    setPhotoUploadError('');
    setPhotoUploadSuccess('');
    setPhotoUploading(true);

    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.75 });
      const previewDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(compressed);
      });

      if (previewDataUrl) {
        setPhoto(previewDataUrl);
        setCachedPatientPhoto(effectivePatientId, {
          previewDataUrl,
          url: previewDataUrl,
        });
      }

      const user = getUser();
      const agencyId = resolveAgencyId(remotePatient) || resolveAgencyId(user);

      let objectKey = '';
      let mediaId = '';

      try {
        const presignResponse = await apiFetch('/media/b2/upload/presign', {
          method: 'POST',
          body: JSON.stringify({
            patientId: effectivePatientId,
            agencyId,
            purpose: 'patient_profile_image',
            fileName: compressed?.name || file?.name || `patient-${effectivePatientId}.jpg`,
            contentType: compressed?.type || file?.type || 'image/jpeg',
          }),
        });

        let presignData = {};
        try {
          presignData = await presignResponse.json();
        } catch {
          presignData = {};
        }

        if (!presignResponse.ok) {
          throw new Error(presignData?.message || presignData?.error || 'Unable to prepare image upload.');
        }

        const parsed = parsePresignResponse(presignData);
        objectKey = parsed.objectKey || '';
        mediaId = parsed.mediaId || '';

        if (!objectKey || !mediaId) {
          throw new Error('Upload metadata is incomplete. Missing objectKey or mediaId.');
        }

        await uploadFileToPresignedTarget({
          uploadUrl: parsed.uploadUrl,
          uploadFields: parsed.uploadFields,
          file: compressed,
        });
      } catch (uploadError) {
        const direct = await uploadFileViaBackend(compressed);
        objectKey = direct.objectKey;
        mediaId = direct.mediaId;

        if (!objectKey || !mediaId) {
          throw uploadError;
        }
      }

      const response = await apiFetch('/patients/profile-image', {
        method: 'POST',
        body: JSON.stringify({
          patientId: effectivePatientId,
          objectKey,
          mediaId,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to save patient profile image.');
      }

      setCachedPatientPhoto(effectivePatientId, { objectKey, mediaId });

      let latestProfileData = {};
      try {
        const latestResponse = await apiFetch(`/patients/${effectivePatientId}`, { method: 'GET' });
        const latestPayload = await latestResponse.json().catch(() => ({}));
        if (latestResponse.ok) {
          latestProfileData = latestPayload?.patient || latestPayload?.data || latestPayload || {};
          const hydratedProfile = await hydratePatientProfile(latestProfileData, effectivePatientId);
          setRemotePatient(hydratedProfile);
          if (hydratedProfile?.profileImage) {
            setCachedPatientPhoto(effectivePatientId, hydratedProfile.profileImage);
          }
        }
      } catch {
      }

      setPhotoUploadSuccess('Patient photo uploaded successfully.');
    } catch (error) {
      const message = error?.message || 'Unable to upload patient photo.';
      if (message.toLowerCase().includes('objectkey does not belong to your agency')) {
        setPhotoUploadError('Image ownership check failed for your agency. Please retry the upload and contact support if it persists.');
      } else if (message.toLowerCase().includes('failed to fetch')) {
        setPhotoUploadError('Network error while uploading image. Please confirm backend is running and reachable, then retry.');
      } else {
        setPhotoUploadError(message);
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRefreshStoredPhoto = async () => {
    setPhotoUploadError('');
    setPhotoUploadSuccess('');
    setPhotoRefreshLoading(true);

    try {
      const cachedPhoto = getCachedPatientPhoto(effectivePatientId);
      const sourceImage = mergeProfileImage(remotePatient?.profileImage, cachedPhoto);

      if (!sourceImage?.mediaId && !sourceImage?.objectKey) {
        throw new Error('No stored photo metadata found to refresh. Please upload a photo again.');
      }

      const resolvedUrl = await resolvePatientProfileImageUrl({
        mediaId: sourceImage?.mediaId,
        objectKey: sourceImage?.objectKey,
      });

      if (!resolvedUrl) {
        throw new Error('Unable to resolve a current photo URL from stored metadata.');
      }

      const nextImage = {
        ...sourceImage,
        url: resolvedUrl,
      };

      setCachedPatientPhoto(effectivePatientId, nextImage);
      setRemotePatient(prev => (prev ? {
        ...prev,
        profileImage: {
          ...(prev.profileImage || {}),
          ...nextImage,
        },
      } : prev));
      setPhoto(null);
      setAvatarImageError(false);
      setPhotoUploadSuccess('Stored photo refreshed successfully.');
    } catch (error) {
      setPhotoUploadError(error?.message || 'Unable to refresh stored photo.');
    } finally {
      setPhotoRefreshLoading(false);
    }
  };

  const submitProfileUpdates = async () => {
    setSavingProfileUpdate(true);
    setProfileUpdateError('');
    setProfileUpdateSuccess('');

    const toBooleanString = (value) => (value ? 'true' : 'false');
    const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '');
    const optionalBoolean = (value) => (value === true || value === false ? value : undefined);
    const optionalText = (value) => {
      const normalized = String(value ?? '').trim();
      return normalized ? normalized : undefined;
    };
    const pruneEmpty = prunePatchPayload;

    try {
      const patientIdForPatch = resolvePatientMutationId(
        rawPatientApiRef.current,
        profileUpdateForm?.patientId || remotePatient?.patientId || effectivePatientId,
      );
      if (!patientIdForPatch) {
        throw new Error('Patient ID is required before updating patient information. Open the patient from the list again or refresh the page.');
      }

      await patchPatientEndpoint('/patients/personal-info', {
        patientId: patientIdForPatch,
        registrationNumber: profileUpdateForm.personalInfo.registrationNumber,
        dateOfAssessment: profileUpdateForm.personalInfo.dateOfAssessment,
        dateOfAdmission: profileUpdateForm.personalInfo.dateOfAdmission,
        firstName: profileUpdateForm.personalInfo.firstName,
        lastName: profileUpdateForm.personalInfo.lastName,
        preferredName: profileUpdateForm.personalInfo.preferredName,
        contactNumber: profileUpdateForm.personalInfo.contactNumber,
        dateOfBirth: profileUpdateForm.personalInfo.dateOfBirth,
        age: profileUpdateForm.personalInfo.age,
        gender: profileUpdateForm.personalInfo.gender,
        residentialAddress: profileUpdateForm.personalInfo.residentialAddress,
        gpsCode: profileUpdateForm.personalInfo.gpsCode,
        email: profileUpdateForm.personalInfo.email,
      });

      await patchPatientEndpoint('/patients/next-of-kin', {
        patientId: patientIdForPatch,
        fullName: profileUpdateForm.nextOfKin.fullName,
        relationship: profileUpdateForm.nextOfKin.relationship,
        contactOne: profileUpdateForm.nextOfKin.contactOne,
        contactTwo: profileUpdateForm.nextOfKin.contactTwo,
        spiritualNeed: profileUpdateForm.nextOfKin.spiritualNeed,
        personalDoctor: profileUpdateForm.nextOfKin.personalDoctor,
        personalDoctorFacility: profileUpdateForm.nextOfKin.personalDoctorFacility,
        personalDoctorContact: profileUpdateForm.nextOfKin.personalDoctorContact,
      });

      await patchPatientEndpoint('/patients/admission-checklist', {
        patientId: patientIdForPatch,
        clientHandBookGiven: Boolean(profileUpdateForm.admissionChecklist.clientHandBookGiven),
        admittingNurse: profileUpdateForm.admissionChecklist.admittingNurse,
        infectionControlSupplies: Boolean(profileUpdateForm.admissionChecklist.infectionControlSupplies),
      });

      await patchPatientEndpoint('/patients/medical-history', {
        patientId: patientIdForPatch,
        anyMedicalHistory: Boolean(profileUpdateForm.medicalHistory.anyMedicalHistory),
        medicalHistoryDescription: profileUpdateForm.medicalHistory.medicalHistoryDescription,
      });

      await patchPatientEndpoint('/patients/communication-style', {
        patientId: patientIdForPatch,
        anyCommunicationNeeds: Boolean(profileUpdateForm.communicationStyle.anyCommunicationNeeds),
        anyHearingNeeds: Boolean(profileUpdateForm.communicationStyle.anyHearingNeeds),
        anySpeechImpairment: Boolean(profileUpdateForm.communicationStyle.anySpeechImpairment),
        anyVisualImpairment: Boolean(profileUpdateForm.communicationStyle.anyVisualImpairment),
        anyUnderstandingDifficulties: Boolean(profileUpdateForm.communicationStyle.anyUnderstandingDifficulties),
        communicationNotes: profileUpdateForm.communicationStyle.communicationNotes,
      });

      const { patchResponse: infectionControlPatchResponse } = await persistInfectionControlWithIdFallback(
        profileUpdateForm,
        rawPatientApiRef.current,
        effectivePatientId,
      );
      const infectionControlSaved = unwrapInfectionControlPayload(infectionControlPatchResponse);
      if (infectionControlSaved && rawPatientApiRef.current && typeof rawPatientApiRef.current === 'object') {
        rawPatientApiRef.current = mergeRawPatientWithInfectionControl(
          rawPatientApiRef.current,
          infectionControlSaved,
        );
      }

      const { patchResponse: breathPainPatchResponse } = await persistBreathPainWithIdFallback(
        profileUpdateForm,
        rawPatientApiRef.current,
        effectivePatientId,
      );
      const breathPainSaved = unwrapBreathPainPayload(breathPainPatchResponse);
      if (breathPainSaved && rawPatientApiRef.current && typeof rawPatientApiRef.current === 'object') {
        rawPatientApiRef.current = mergeRawPatientWithBreathPain(rawPatientApiRef.current, breathPainSaved);
      }

      const sleepNutritionPayload = pruneEmpty({
        patientId: patientIdForPatch,
        sleep: {
          wakeUpAtNight: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.wakeUpAtNight),
          UseOfNightSedation: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.UseOfNightSedation),
          userSleepWell: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.userSleepWell),
          RestDuringTheDay: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.RestDuringTheDay),
          usualTimeToWakeUp: optionalText(profileUpdateForm.sleepNutrition.sleep.usualTimeToWakeUp),
          bestSleepingPosition: optionalText(profileUpdateForm.sleepNutrition.sleep.bestSleepingPosition),
        },
        nutrition: {
          allergy: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.allergy),
          specialDiet: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.specialDiet),
          needHelpInEating: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.needHelpInEating),
          feedingAid: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.feedingAid),
          swallowingDifficulties: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.swallowingDifficulties),
          dietType: optionalText(profileUpdateForm.sleepNutrition.nutrition.dietType),
          ngTube: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.ngTube),
          nutritionConcerns: optionalText(profileUpdateForm.sleepNutrition.nutrition.nutritionConcerns),
        },
      });

      const sleepNutritionForApi = patchSleepNutritionPayload(
        profileUpdateForm,
        patientIdForPatch,
        sleepNutritionPayload,
      );
      if (sleepNutritionForApi?.sleep || sleepNutritionForApi?.nutrition) {
        const { patchResponse } = await persistSleepNutritionWithIdFallback(
          profileUpdateForm,
          rawPatientApiRef.current,
          effectivePatientId,
        );
        const unwrapped = unwrapSleepNutritionPayload(patchResponse);
        if (unwrapped && rawPatientApiRef.current && typeof rawPatientApiRef.current === 'object') {
          rawPatientApiRef.current = mergeRawPatientWithSleepNutrition(rawPatientApiRef.current, unwrapped);
        }
      }

      try {
        const { patchResponse } = await persistHygienePsychologicalWithIdFallback(
          profileUpdateForm,
          rawPatientApiRef.current,
          effectivePatientId,
        );
        const unwrapped = unwrapHygienePsychologicalPayload(patchResponse);
        if (unwrapped && rawPatientApiRef.current && typeof rawPatientApiRef.current === 'object') {
          rawPatientApiRef.current = mergeRawPatientWithHygienePsychological(rawPatientApiRef.current, unwrapped);
        }
      } catch (hygieneError) {
        const onlyHygieneInModal = !sleepNutritionForApi?.sleep && !sleepNutritionForApi?.nutrition;
        if (onlyHygieneInModal) throw hygieneError;
      }

      try {
        await patchPatientEndpoint('/patients/skin-mobility', {
          patientId: patientIdForPatch,
          skinIntegrity: {
            openWounds: Boolean(profileUpdateForm.skinMobility.skinIntegrity.openWounds),
            pressureUlcer: Boolean(profileUpdateForm.skinMobility.skinIntegrity.pressureUlcer),
            gradeAdmission: profileUpdateForm.skinMobility.skinIntegrity.gradeAdmission,
            securityItems: profileUpdateForm.skinMobility.skinIntegrity.securityItems,
          },
          handlingAssessment: {
            isPatientMobile: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isPatientMobile),
            isEquipmentNeeded: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isEquipmentNeeded),
            numberOfStaffNeeded: Number(profileUpdateForm.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
            moveInBed: Boolean(profileUpdateForm.skinMobility.handlingAssessment.moveInBed),
            moveInBedEquipment: profileUpdateForm.skinMobility.handlingAssessment.moveInBedEquipment,
            mobilityFromBedToChair: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChair),
            mobilityFromBedToChairEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
            mobilityToWashroom: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroom),
            mobilityToWashroomEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
          },
        });
      } catch {
        await patchPatientEndpoint('/patients/initial-vitals', {
          patientId: patientIdForPatch,
          skinIntegrity: {
            openWounds: Boolean(profileUpdateForm.skinMobility.skinIntegrity.openWounds),
            pressureUlcer: Boolean(profileUpdateForm.skinMobility.skinIntegrity.pressureUlcer),
            gradeAdmission: profileUpdateForm.skinMobility.skinIntegrity.gradeAdmission,
            securityItems: profileUpdateForm.skinMobility.skinIntegrity.securityItems,
          },
          handlingAssessment: {
            isPatientMobile: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isPatientMobile),
            isEquipmentNeeded: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isEquipmentNeeded),
            numberOfStaffNeeded: Number(profileUpdateForm.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
            moveInBed: Boolean(profileUpdateForm.skinMobility.handlingAssessment.moveInBed),
            moveInBedEquipment: profileUpdateForm.skinMobility.handlingAssessment.moveInBedEquipment,
            mobilityFromBedToChair: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChair),
            mobilityFromBedToChairEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
            mobilityToWashroom: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroom),
            mobilityToWashroomEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
          },
        });
      }

      setRemotePatient((prev) => applyPatientUpdateFormToProfile(prev, profileUpdateForm));

      setShowUpdateModal(false);
      setProfileUpdateSuccess('Patient profile details updated successfully.');
    } catch (error) {
      setProfileUpdateError(error?.message || 'Unable to update patient profile details.');
    } finally {
      setSavingProfileUpdate(false);
    }
  };

  const submitReportDeath = async () => {
    setReportDeathError('');
    const pid = String(effectivePatientId || '').trim();
    if (!pid) {
      setReportDeathError('Patient ID is missing.');
      return;
    }
    if (!String(reportDeathForm.dateOfDeath || '').trim()) {
      setReportDeathError('Date of death is required.');
      return;
    }
    if (!reportDeathForm.confirmedProcedure) {
      setReportDeathError('Please confirm that this report complies with your organisation’s procedures.');
      return;
    }

    const trim = (value) => String(value ?? '').trim();

    const payload = {
      patientId: pid,
      dateOfDeath: trim(reportDeathForm.dateOfDeath),
      timeOfDeath: trim(reportDeathForm.timeOfDeath),
      placeOfDeath: trim(reportDeathForm.placeOfDeath),
      causeOfDeath: trim(reportDeathForm.causeOrCircumstances),
      additionalNote: trim(reportDeathForm.notes),
    };

    const postDeathReport = async (path) => {
      const response = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(payload),
        quiet: true,
      });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }
      if (!response.ok) {
        const err = new Error(data?.message || data?.error || 'Unable to submit death report.');
        err.status = response.status;
        throw err;
      }
      return data;
    };

    setReportDeathSubmitting(true);
    try {
      await postDeathReport(`/patients/${encodeURIComponent(pid)}/death`);
      setReportDeathDone(true);
      loadPatientProfile();
    } catch (error) {
      const hint = error?.status === 404
        ? ' The server does not expose POST /patients/:id/death for this patient record.'
        : '';
      setReportDeathError((error?.message || 'Unable to submit death report.') + hint);
    } finally {
      setReportDeathSubmitting(false);
    }
  };

  const handleGenerateReport = async () => {
    setShowGenerateReportModal(true);
    setGenerateReportError('');
    setGenerateReportDone(false);

    const pid = String(effectivePatientId || '').trim();
    if (!pid) {
      setGenerateReportError('Patient ID is missing.');
      return;
    }

    setGenerateReportSubmitting(true);
    try {
      const response = await apiFetch('/ai/medical-report', {
        method: 'POST',
        body: JSON.stringify({
          patientId: pid,
        }),
        quiet: true,
      });

      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        const err = new Error(data?.message || data?.error || 'Unable to generate patient medical report.');
        err.status = response.status;
        throw err;
      }

      invalidateMedicalReportsCache();
      setGenerateReportDone(true);
    } catch (error) {
      setGenerateReportError(error?.message || 'Unable to generate patient medical report.');
    } finally {
      setGenerateReportSubmitting(false);
    }
  };

  const closePatientStatusConfirm = () => {
    if (deactivatingPatient) return;
    setPatientStatusConfirm(null);
    setPatientStatusConfirmError('');
  };

  const runPatientStatusAction = async (action, successMessage, failureMessage) => {
    const patientId = resolvePatientApiId(rawPatientApiRef.current, remotePatient);

    if (!patientId) {
      setPatientStatusConfirmError(`Unable to ${action} this patient because a valid patient ID was not found.`);
      return;
    }

    setDeactivatingPatient(true);
    setDeactivateSuccess('');
    setPatientStatusConfirmError('');

    try {
      const response = await apiFetch(`/patients/${encodeURIComponent(patientId)}/${action}`, {
        method: 'PATCH',
        quiet: true,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || failureMessage);
      }

      setPatientStatusConfirm(null);
      setDeactivateSuccess(payload?.message || successMessage);
      setShowDeactivateSuccessAlert(true);
      loadPatientProfile();
    } catch (error) {
      setPatientStatusConfirmError(error?.message || failureMessage);
    } finally {
      setDeactivatingPatient(false);
    }
  };

  const confirmPatientStatusAction = async () => {
    if (!patientStatusConfirm) return;
    if (patientStatusConfirm.action === 'deactivate') {
      await runPatientStatusAction(
        'deactivate',
        'Patient has been deactivated successfully.',
        'Unable to deactivate patient.',
      );
      return;
    }
    await runPatientStatusAction(
      'reactivate',
      'Patient has been reactivated successfully.',
      'Unable to reactivate patient.',
    );
  };

  const handleRemoveAssignedNurse = async (nurse) => {
    const assignmentId = String(nurse?.assignmentId || '').trim();
    if (!assignmentId) {
      setAssignedNurseActionError('Assignment ID is missing for this nurse.');
      setAssignedNurseActionSuccess('');
      return;
    }

    setRemovingAssignedNurseId(assignmentId);
    setAssignedNurseActionError('');
    setAssignedNurseActionSuccess('');

    try {
      const response = await apiFetch(`/assignments/${encodeURIComponent(assignmentId)}`, {
        method: 'DELETE',
        quiet: true,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Unable to remove assigned nurse.');
      }

      setRemotePatient((prev) => {
        if (!prev || typeof prev !== 'object') return prev;
        const nextAssigned = (Array.isArray(prev.assignedNurses) ? prev.assignedNurses : [])
          .filter((entry) => String(entry?.assignmentId || '').trim() !== assignmentId);
        return { ...prev, assignedNurses: nextAssigned };
      });
      setAssignedNurseActionSuccess(payload?.message || `${nurse?.name || 'Nurse'} removed successfully.`);
      setPendingRemoveAssignedNurse(null);
      loadPatientProfile();
    } catch (error) {
      setAssignedNurseActionError(error?.message || 'Unable to remove assigned nurse.');
    } finally {
      setRemovingAssignedNurseId('');
    }
  };

  const openRemoveAssignedNurseModal = (nurse) => {
    setAssignedNurseActionError('');
    setAssignedNurseActionSuccess('');
    setPendingRemoveAssignedNurse(nurse || null);
  };

  const handleAssignNewNurse = async () => {
    const selectedNurseId = String(assignedNurseCandidateId || '').trim();
    if (!selectedNurseId) {
      setAssignedNurseActionError('Please select a nurse to assign.');
      setAssignedNurseActionSuccess('');
      return;
    }

    const selectedNurse = incidentNurses.find((row) => String(row?.id || '').trim() === selectedNurseId)
      || incidentNurses.find((row) => Array.isArray(row?.idsForMatch) && row.idsForMatch.includes(selectedNurseId));

    if (!selectedNurse) {
      setAssignedNurseActionError('Selected nurse could not be resolved.');
      setAssignedNurseActionSuccess('');
      return;
    }

    const patientIdentifierCandidates = collectPatientAssignmentIds(
      rawPatientApiRef?.current || (remotePatient?.recordMongoId ? { _id: remotePatient.recordMongoId } : null),
      effectivePatientId,
    );

    if (patientIdentifierCandidates.length === 0) {
      setAssignedNurseActionError(
        'This patient has no MongoDB or UUID id on file. Reload the profile from the Patients list, then try again.',
      );
      setAssignedNurseActionSuccess('');
      return;
    }

    // POST /assignments accepts a nurse identifier (Mongo `_id` when available, otherwise UUID).
    // Some `/nurses` payloads only include UUIDs (e.g. `nurseId`) and no 24-char ObjectId.
    const nurseIdForAssignment = resolveMongoIdFromCandidates(selectedNurse.idsForMatch)
      || String(selectedNurse.mongoId || '').trim()
      || String(selectedNurse.uuid || '').trim()
      || String(selectedNurse.id || '').trim()
      || '';

    if (!nurseIdForAssignment) {
      setAssignedNurseActionError('Selected nurse is missing an id from GET /nurses.');
      setAssignedNurseActionSuccess('');
      return;
    }

    setAssigningProfileNurseId(selectedNurseId);
    setAssignedNurseActionError('');
    setAssignedNurseActionSuccess('');

    let lastError = 'Unable to assign nurse to this patient.';
    for (const patientIdCandidate of patientIdentifierCandidates) {
      try {
        const response = await apiFetch('/assignments', {
          method: 'POST',
          body: JSON.stringify({ patientId: patientIdCandidate, nurseId: nurseIdForAssignment }),
          quiet: true,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          lastError = payload?.message || payload?.error || lastError;
          continue;
        }

        setAssignedNurseActionSuccess(payload?.message || `${selectedNurse.name} assigned successfully.`);
        setAssignedNurseCandidateId('');
        setAssigningProfileNurseId('');
        loadPatientProfile();
        return;
      } catch (error) {
        lastError = error?.message || lastError;
      }
    }

    setAssignedNurseActionError(lastError);
    setAssignedNurseActionSuccess('');
    setAssigningProfileNurseId('');
  };

  const localPatient = patientsData.find((pt) => {
    const candidateIds = [
      pt?.id,
      pt?.patientId,
      pt?.uuid,
      pt?.regNo,
      pt?._id,
    ].filter(Boolean).map((value) => String(value));
    return candidateIds.includes(String(patientId || ''));
  });
  const p = remotePatient || localPatient;
  const billingPatientId = useMemo(
    () => resolvePatientBillingRouteId(effectivePatientId, apiPatientRaw || remotePatient),
    [effectivePatientId, apiPatientRaw, remotePatient],
  );
  const billingPatientRecord = useMemo(
    () => (apiPatientRaw && remotePatient
      ? { ...remotePatient, ...apiPatientRaw }
      : (apiPatientRaw || remotePatient)),
    [apiPatientRaw, remotePatient],
  );
  const isPatientDeactivated = isPatientDeactivatedStatus(p?.status);
  const assignedNursesForProfile = Array.isArray(p?.assignedNurses) ? p.assignedNurses : [];
  const nurseNotesDirectory = useMemo(
    () => mergeNurseDirectories(incidentNurses, assignedNursesForProfile),
    [incidentNurses, assignedNursesForProfile],
  );
  const nurseNotesDisplayContext = useMemo(() => ({
    nurses: nurseNotesDirectory,
    sessionName: currentUserName,
    sessionNurseIds,
    notesScope: 'patient',
    primaryNurse: vitalRecorderDisplayName(p?.nurse) || String(p?.nurse || '').trim(),
  }), [nurseNotesDirectory, currentUserName, sessionNurseIds, p?.nurse]);

  useEffect(() => {
    setNurseNotes((prev) => {
      if (!prev.length) return prev;
      const next = enrichNurseNoteNames(prev, nurseNotesDirectory, {
        currentUserName,
        sessionName: currentUserName,
        sessionNurseIds,
        notesScope: 'patient',
        primaryNurse: vitalRecorderDisplayName(p?.nurse) || String(p?.nurse || '').trim(),
      });
      const changed = next.some((note, index) => note.nurse !== prev[index]?.nurse);
      return changed ? next : prev;
    });
  }, [nurseNotesDirectory, currentUserName, sessionNurseIds, p?.nurse]);

  const assignedNurseMatchKeys = useMemo(() => {
    const keys = new Set();
    assignedNursesForProfile.forEach((entry) => {
      const id = String(entry?.id || '').trim().toLowerCase();
      if (id) keys.add(id);
      const name = String(entry?.name || '').trim().toLowerCase();
      if (name) keys.add(name);
    });
    return keys;
  }, [assignedNursesForProfile]);
  const assignableNursesForProfile = useMemo(() => (
    incidentNurses.filter((row) => {
      const id = String(row?.id || '').trim().toLowerCase();
      const name = String(row?.name || '').trim().toLowerCase();
      return !(assignedNurseMatchKeys.has(id) || assignedNurseMatchKeys.has(name));
    })
  ), [incidentNurses, assignedNurseMatchKeys]);
  const persistedPhotoUrl = p?.profileImage?.url || null;
  const persistedPreviewDataUrl = p?.profileImage?.previewDataUrl || null;
  const avatarSrc = photo || persistedPhotoUrl || persistedPreviewDataUrl || null;
  const showAvatarImage = Boolean(avatarSrc) && !avatarImageError;
  const avatarDisplaySrc = showAvatarImage ? avatarSrc : DEFAULT_PROFILE_PLACEHOLDER;
  const cachedPhotoMeta = getCachedPatientPhoto(effectivePatientId);
  const canRefreshStoredPhoto = Boolean(
    p?.profileImage?.mediaId
    || p?.profileImage?.objectKey
    || cachedPhotoMeta?.mediaId
    || cachedPhotoMeta?.objectKey
  );

  useEffect(() => {
    if (!showUpdateModal || !p) return;
    setProfileUpdateError('');
    setProfileUpdateSuccess('');
    setProfileUpdateForm(createPatientUpdateForm(p, effectivePatientId));
  }, [showUpdateModal, p, effectivePatientId]);

  useEffect(() => {
    if ((tab === 'clinical' || tab === 'care') || !editingProfileCard) return;
    setEditingProfileCard(null);
    activeCardFormRef.current = null;
    cardEditSeedRef.current = null;
    setCardSectionError('');
  }, [tab, editingProfileCard]);

  useEffect(() => {
    if (!profileUpdateSuccess) {
      setShowProfileSaveAlert(false);
      return undefined;
    }

    setShowProfileSaveAlert(true);
    const timer = window.setTimeout(() => {
      setShowProfileSaveAlert(false);
      setProfileUpdateSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [profileUpdateSuccess]);

  useEffect(() => {
    if (!showReportDeathModal) return;
    setReportDeathError('');
    setReportDeathDone(false);
    setReportDeathSubmitting(false);
    setReportDeathForm({
      dateOfDeath: '',
      timeOfDeath: '',
      placeOfDeath: '',
      causeOrCircumstances: '',
      notes: '',
      nextOfKinNotified: false,
      confirmedProcedure: false,
    });
  }, [showReportDeathModal]);

  useEffect(() => {
    if (tab !== 'assignednurses') return;
    if (!incidentNurses.length && !incidentNursesLoading) {
      loadIncidentNurses();
    }
  }, [tab, incidentNurses.length, incidentNursesLoading, loadIncidentNurses]);

  useEffect(() => {
    if (!medicationSaveSuccess) {
      setShowMedicationSaveAlert(false);
      return undefined;
    }

    setShowMedicationSaveAlert(true);
    const timer = window.setTimeout(() => {
      setShowMedicationSaveAlert(false);
      setMedicationSaveSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [medicationSaveSuccess]);

  useEffect(() => {
    if (!vitalSaveSuccess) {
      setShowVitalSaveAlert(false);
      return undefined;
    }

    setShowVitalSaveAlert(true);
    const timer = window.setTimeout(() => {
      setShowVitalSaveAlert(false);
      setVitalSaveSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [vitalSaveSuccess]);

  useEffect(() => {
    if (!showTopbarMenu) return undefined;
    const onPointerDown = (event) => {
      if (!event.target.closest('.pp-pharm-topbar-menu')) {
        setShowTopbarMenu(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showTopbarMenu]);

  useEffect(() => {
    if (!carePlanSaveSuccess) return undefined;

    const timer = window.setTimeout(() => {
      setCarePlanSaveSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [carePlanSaveSuccess]);

  useEffect(() => {
    if (showVitalForm && !editingVitalId) {
      setVitalSaveError('');
      setVitalForm((prev) => ({
        ...createVitalForm(currentUserName),
        recordedBy: vitalRecorderDisplayName(prev.recordedBy) || currentUserName || vitalRecorderDisplayName(p?.nurse) || '',
      }));
    }
  }, [showVitalForm, editingVitalId, currentUserName, p?.nurse]);

  useEffect(() => {
    if (!confirmDelete) {
      setMedicationDeleteError('');
      setDeletingMedication(false);
      setMedDeleteConfirmInput('');
      setMedNameCopied(false);
    } else {
      setMedDeleteConfirmInput('');
      setMedicationDeleteError('');
      setMedNameCopied(false);
    }
  }, [confirmDelete]);

  useEffect(() => {
    if (!confirmDeleteCarePlan) {
      setCarePlanDeleteError('');
    } else {
      setCarePlanDeleteError('');
    }
  }, [confirmDeleteCarePlan]);

  useEffect(() => {
    setAvatarImageError(false);
  }, [avatarSrc]);

  const handleCardFormChange = useCallback((form) => {
    activeCardFormRef.current = form;
  }, []);

  if (profileLoading && !p) {
    return (
      <div className="page-wrapper patient-profile-page patient-profile-page--loading">
        <div className="patient-profile-page__spinner" aria-hidden />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--kh-text-muted)' }}>
          Loading patient profile…
        </p>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="page-wrapper patient-profile-page patient-profile-page--empty">
        <FiUser size={48} style={{ color: 'var(--kh-border)' }} aria-hidden />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--kh-text-muted)' }}>
          {profileError || 'Patient record not found'}
        </p>
        <button type="button" className="btn btn-kh-primary" onClick={() => navigate('/patients')}>
          Return to registry
        </button>
      </div>
    );
  }

  /* flag calculations */
  const flags = [];
  if (p.pain.present) flags.push({ label: `Pain — ${p.pain.location}`, status: p.pain.score >= 2 ? 'alert' : 'warn', detail: `Score ${p.pain.score}/3` });
  if (p.diabetes.has) flags.push({ label: 'Diabetes', status: 'warn', detail: p.nutrition.dietType });
  if (p.skin.openWounds) flags.push({ label: 'Open Wounds', status: 'alert', detail: 'Active' });
  if (p.skin.pressureUlcer) flags.push({ label: 'Pressure Ulcer', status: 'alert', detail: 'Active' });
  if (p.psych.depression) flags.push({ label: 'Depression', status: 'warn', detail: 'Flagged' });
  if (p.psych.anxiety) flags.push({ label: 'Anxiety', status: 'warn', detail: 'Flagged' });
  if (p.communication.visual) flags.push({ label: 'Visual Impairment', status: 'warn', detail: 'Noted' });
  if (!p.mobility.independent) flags.push({ label: 'Mobility Assist Required', status: 'warn', detail: 'Not independent' });
  if (flags.length === 0) flags.push({ label: 'No active clinical flags', status: 'ok', detail: '' });

  const medicationList = splitAdmissionMedicationText(p.medications);
  const existingMedicationEntries = medicationList
    .map((entry, index) => {
      const parsed = parseLegacyMedicationEntry(entry);
      return {
        id: `existing-${index}`,
        drug: parsed.drug,
        dosage: parsed.dosage,
        frequency: parsed.frequency,
        route: 'Oral',
        notes: '',
        source: 'existing',
        originalIndex: index,
      };
    })
    .filter(item => !deletedExistingMeds.includes(item.originalIndex));
  const activeMedicationRecords = mergeMedicationRecords([...existingMedicationEntries, ...addedMeds]);
  const persistedMedicationEntries = activeMedicationRecords.filter((item) => item.source !== 'existing');
  const medicationReminderCount = activeMedicationRecords.filter(item => Array.isArray(item?.reminders?.times) && item.reminders.times.length > 0).length;
  const medicationOralCount = activeMedicationRecords.filter(item => String(item?.route || '').trim().toLowerCase() === 'oral').length;
  const medicationNewCount = persistedMedicationEntries.length;
  const latestVitalRecord = latestRecordedVital || vitalRecords[0] || null;
  const latestVitalSummary = latestVitalRecord
    ? `${latestVitalRecord.date} at ${latestVitalRecord.time}`
    : `Admitted ${p.enrolled}`;
  const latestDisplayedVitals = {
    bp: latestVitalRecord?.bp || p.vitals.bp,
    sugar: latestVitalRecord?.sugar || p.vitals.sugar,
    spo2: latestVitalRecord?.spo2 || p.vitals.spo2,
    pulse: latestVitalRecord?.pulse || p.vitals.pulse,
    temp: latestVitalRecord?.temp || p.vitals.temp,
    resp: latestVitalRecord?.resp || p.vitals.resp,
    weight: latestVitalRecord?.weight || p.vitals.weight,
    urinalysis: latestVitalRecord?.urinalysis || p.vitals.urinalysis,
  };
  const latestRiskByField = getVitalFieldRisksFromRow(latestDisplayedVitals);
  const groupedVitalRecords = groupVitalRecordsByDate(vitalRecords);
  const hasAdmissionBaselineVitals = Boolean(
    p.vitals.bp || p.vitals.sugar || p.vitals.spo2 || p.vitals.pulse
    || p.vitals.temp || p.vitals.resp || p.vitals.weight || p.vitals.urinalysis,
  );
  const hasNextOfKinData = hasMeaningfulSectionData(p.sectionNextOfKin);
  const hasAdmissionChecklistData = hasMeaningfulSectionData(p.sectionAdmissionChecklist);
  const hasMedicalHistoryData = hasMeaningfulSectionData(p.sectionMedicalHistory) || Boolean(String(p.medicalHistory || '').trim());
  const hasCommunicationData = hasMeaningfulSectionData(p.sectionCommunicationStyle);
  const hasInfectionControlData = hasMeaningfulSectionData(p.sectionInfectionControl);
  const hasBreathPainData = hasMeaningfulSectionData(p.sectionBreathPain);
  const hasPainAssessmentData = [
    p.pain.present,
    p.pain.analgesiaPrescribed,
    p.pain.score,
    p.pain.location,
  ].some((value) => value !== null && value !== undefined && value !== '');
  const hasSleepNutritionData = hasMeaningfulSectionData(p.sectionSleepNutrition);
  const hasHygienePsychData = hasMeaningfulSectionData(p.sectionHygienePsychological);
  const hasPsychologicalAssessmentData = [
    p.psych.concerns,
    p.psych.depression,
    p.psych.anxiety,
    p.psych.dementia,
  ].some((value) => value !== null && value !== undefined);
  const hasSkinMobilityData = hasMeaningfulSectionData(p.sectionSkinMobility);
  const hasInitialVitalsData = hasMeaningfulSectionData(p.sectionInitialVitals);
  const patientStatusLabel = formatStatusLabel(p.status);
  const patientStatusClass = p.status === 'active' ? ' is-active' : ' is-pending';
  const admissionDraft = findAdmissionDraftForPatient({
    patientId: effectivePatientId,
    profileRouteId: effectivePatientId,
    id: p.id,
  });
  const completedAdmissionSections = [
    Boolean(String(p.regNo || p.name || '').trim()),
    hasNextOfKinData,
    hasAdmissionChecklistData,
    hasMedicalHistoryData,
    hasCommunicationData,
    hasInfectionControlData,
    hasBreathPainData,
    hasSleepNutritionData,
    hasHygienePsychData,
    hasSkinMobilityData,
    hasInitialVitalsData,
  ].filter(Boolean).length;
  const showAdmissionResumeBanner = Boolean(
    admissionDraft
    || (completedAdmissionSections > 0 && completedAdmissionSections < ADMISSION_SECTION_COUNT),
  );
  const admissionResumeProgress = admissionDraft?.completedTabs?.length || completedAdmissionSections;
  const patientSnapshotItems = [
    { label: 'Registration No.', value: p.regNo || '—' },
    { label: 'Region', value: p.region || '—' },
    { label: 'Medication Count', value: activeMedicationRecords.length || 0 },
    { label: 'Clinical Flags', value: flags[0]?.label || 'None' },
  ];
  const patientOverviewRows = [
    {
      label: 'Primary Nurse',
      detail: p.nurse || 'No nurse assigned',
      meta: p.nursePin || 'PIN unavailable',
      status: p.nurse ? 'Assigned' : 'Pending',
    },
    {
      label: 'Physician',
      detail: p.doctor?.name || 'No physician on file',
      meta: p.doctor?.facility || 'Facility unavailable',
      status: p.doctor?.name ? 'On file' : 'Pending',
    },
    {
      label: 'Emergency Contact',
      detail: p.emergency?.name || 'No contact set',
      meta: p.emergency?.phone || p.emergency?.relationship || 'No contact details',
      status: hasNextOfKinData ? (p.emergency?.phone ? 'Reachable' : 'Recorded') : 'No data',
    },
    {
      label: 'Latest Vitals',
      detail: latestVitalRecord ? `${latestVitalRecord.bp} • SpO₂ ${latestVitalRecord.spo2}` : 'No recent vitals',
      meta: latestVitalSummary,
      status: latestVitalRecord ? 'Updated' : hasInitialVitalsData ? 'On file' : 'No data',
    },
  ];
  const sidebarAllergies = (() => {
    const rows = [];
    if (p.nutrition?.allergies) {
      rows.push({ label: 'Food allergy noted', severity: 'Medium', tone: 'med' });
    }
    const d = String(p.diagnosis || '');
    if (/allerg/i.test(d)) {
      const head = d.split(',')[0].trim().slice(0, 56);
      if (head) rows.push({ label: head, severity: 'High', tone: 'high' });
    }
    if (!rows.length) {
      rows.push({ label: 'No allergies recorded', severity: null, tone: 'none' });
    }
    return rows;
  })();

  const handlePrimaryAction = () => {
    if (p.phone) {
      window.location.href = `tel:${String(p.phone).replace(/\s+/g, '')}`;
      return;
    }
    if (p.email) {
      window.location.href = `mailto:${p.email}`;
    }
  };

  const getProfileUpdateValue = (path) => {
    const keys = String(path || '').split('.').filter(Boolean);
    return keys.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), profileUpdateForm);
  };

  const handleProfileTabChange = (nextTab) => {
    const closeAll = () => {
      setShowVitalsMegaModal(false);
      setShowNotesMegaModal(false);
      setShowIncidentsMegaModal(false);
      setShowMedicationsMegaModal(false);
      setShowIncidentForm(false);
      setConfirmDeleteIncident(null);
      setIncidentDeleteModalError('');
      resetIncidentForm();
    };

    if (nextTab === 'vitals') { closeAll(); setShowVitalsMegaModal(true); loadVitalRecords(); return; }
    if (nextTab === 'notes') { closeAll(); setShowNotesMegaModal(true); return; }
    if (nextTab === 'incidents') { closeAll(); setShowIncidentsMegaModal(true); loadIncidents(); return; }
    if (nextTab === 'careplan' || nextTab === 'checkliststatus') {
      closeAll();
      setTab(nextTab);
      loadCarePlans();
      if (nextTab === 'checkliststatus') void loadPatientCompletedCarePlans();
      return;
    }
    if (nextTab === 'medications') { closeAll(); setShowMedicationsMegaModal(true); return; }

    closeAll();
    setTab(nextTab);
  };

  const renderBoolControl = (label, path) => (
    <div className="col-md-4">
      <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--kh-text-muted)' }}>{label}</label>
      <select
        className="form-select form-control-kh"
        value={getProfileUpdateValue(path) ? 'true' : 'false'}
        onChange={(event) => setProfileUpdateField(path, event.target.value === 'true')}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  );

  const startProfileCardEdit = (cardId) => {
    if (!p) return;
    const seedForm = createPatientUpdateForm(p, effectivePatientId);
    cardEditSeedRef.current = seedForm;
    activeCardFormRef.current = seedForm;
    setEditingProfileCard(cardId);
    setCardSectionError('');
  };

  const cancelProfileCardEdit = () => {
    setEditingProfileCard(null);
    activeCardFormRef.current = null;
    cardEditSeedRef.current = null;
    setCardSectionError('');
  };

  const saveProfileCard = async () => {
    const cardEditForm = activeCardFormRef.current;
    if (!editingProfileCard || !cardEditForm) return;

    setSavingProfileCard(true);
    setCardSectionError('');

    try {
      const patientIdForPatch = resolvePatientMutationId(
        rawPatientApiRef.current,
        cardEditForm?.patientId || remotePatient?.patientId || effectivePatientId,
      );
      if (!patientIdForPatch) {
        throw new Error('Patient ID is required. Reload the profile and try again.');
      }

      const persistResult = await persistProfileSection(editingProfileCard, cardEditForm, patientIdForPatch, {
        rawPatient: rawPatientApiRef.current,
        routeFallback: effectivePatientId,
      });
      const successMessage = typeof persistResult === 'string' ? persistResult : persistResult?.message || 'Changes saved.';
      const savedPatch = typeof persistResult === 'object' ? persistResult?.patchResponse : null;
      if (savedPatch && rawPatientApiRef.current && typeof rawPatientApiRef.current === 'object') {
        const hygieneSaved = unwrapHygienePsychologicalPayload(savedPatch);
        const sleepSaved = unwrapSleepNutritionPayload(savedPatch);
        const breathPainSaved = unwrapBreathPainPayload(savedPatch);
        const infectionControlSaved = unwrapInfectionControlPayload(savedPatch);
        if (hygieneSaved) {
          rawPatientApiRef.current = mergeRawPatientWithHygienePsychological(rawPatientApiRef.current, hygieneSaved);
        } else if (sleepSaved) {
          rawPatientApiRef.current = mergeRawPatientWithSleepNutrition(rawPatientApiRef.current, sleepSaved);
        } else if (breathPainSaved) {
          rawPatientApiRef.current = mergeRawPatientWithBreathPain(rawPatientApiRef.current, breathPainSaved);
        } else if (infectionControlSaved) {
          rawPatientApiRef.current = mergeRawPatientWithInfectionControl(
            rawPatientApiRef.current,
            infectionControlSaved,
          );
        }
      }

      const lifestyleCardHandlers = {
        'care:hygiene': mergePersonalHygieneFormIntoRawPatient,
        'care:bladder': mergeBladderBowelFormIntoRawPatient,
        'clinical:psychological': mergePsychologicalFormIntoRawPatient,
        'clinical:pain': mergePainFormIntoRawPatient,
        'clinical:breathing': mergePainFormIntoRawPatient,
        'clinical:infection': mergeInfectionControlFormIntoRawPatient,
        'clinical:diabetes': mergeInfectionControlFormIntoRawPatient,
        'care:sleep': mergeSleepFormIntoRawPatient,
      };
      const mergeIntoRaw = lifestyleCardHandlers[editingProfileCard];
      if (mergeIntoRaw && rawPatientApiRef.current && typeof rawPatientApiRef.current === 'object') {
        rawPatientApiRef.current = mergeIntoRaw(rawPatientApiRef.current, cardEditForm);
      }

      setRemotePatient((prev) => applyCardEditFormToProfile(prev, cardEditForm, editingProfileCard));

      cancelProfileCardEdit();
      setProfileUpdateSuccess(successMessage);
    } catch (error) {
      setCardSectionError(error?.message || 'Unable to save changes.');
    } finally {
      setSavingProfileCard(false);
    }
  };

  const isCardEditing = (cardId) => editingProfileCard === cardId;

  const renderProfileCardActions = (cardId) => (
    isCardEditing(cardId) ? (
      <div className="patient-profile-card-edit-actions">
        <button
          type="button"
          className="patient-profile-card-edit-actions__btn patient-profile-card-edit-actions__btn--primary"
          onClick={saveProfileCard}
          disabled={savingProfileCard}
        >
          {savingProfileCard ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="patient-profile-card-edit-actions__btn"
          onClick={cancelProfileCardEdit}
          disabled={savingProfileCard}
        >
          Cancel
        </button>
      </div>
    ) : (
      <button
        type="button"
        className="nurse-profile-inline-btn"
        onClick={() => startProfileCardEdit(cardId)}
        disabled={Boolean(editingProfileCard) || savingProfileCard}
      >
        <FiEdit2 size={12} /> Edit
      </button>
    )
  );

  const renderCardSectionError = (cardId) => (
    isCardEditing(cardId) && cardSectionError ? (
      <div className="patient-profile-card-edit-error">{cardSectionError}</div>
    ) : null
  );

  const activeProfileToast = (() => {
    if (showProfileSaveAlert && profileUpdateSuccess) {
      return {
        title: 'Changes saved',
        message: profileUpdateSuccess,
        onDismiss: () => {
          setShowProfileSaveAlert(false);
          setProfileUpdateSuccess('');
        },
      };
    }
    if (showMedicationSaveAlert && medicationSaveSuccess) {
      return {
        title: 'Medication saved',
        message: medicationSaveSuccess,
        onDismiss: () => {
          setShowMedicationSaveAlert(false);
          setMedicationSaveSuccess('');
        },
      };
    }
    if (showVitalSaveAlert && vitalSaveSuccess) {
      return {
        title: 'Vital recorded',
        message: vitalSaveSuccess,
        onDismiss: () => {
          setShowVitalSaveAlert(false);
          setVitalSaveSuccess('');
        },
      };
    }
    if (showDeactivateSuccessAlert && deactivateSuccess) {
      return {
        title: deactivateSuccess.toLowerCase().includes('reactivat') ? 'Patient reactivated' : 'Patient deactivated',
        message: deactivateSuccess,
        onDismiss: () => setShowDeactivateSuccessAlert(false),
      };
    }
    if (carePlanSaveSuccess) {
      return {
        title: 'Care plan updated',
        message: carePlanSaveSuccess,
        onDismiss: () => setCarePlanSaveSuccess(''),
      };
    }
    return null;
  })();

  const renderMedicationCard = (med, { variant = 'full' } = {}) => {
    const isExisting = med.source === 'existing';
    const hasReminder = Array.isArray(med?.reminders?.times) && med.reminders.times.length > 0;
    const reminderTargets = med.reminders
      ? [med.reminders.notifyNurse && 'Nurse', med.reminders.notifyPatient && 'Patient'].filter(Boolean)
      : [];
    const startDate = normalizeMedicationDateForInput(med.startDate);
    const endDate = normalizeMedicationDateForInput(med.endDate);
    const doseLine = [med.dosage, med.route].filter((v) => v && v !== '—').join(' · ') || '—';
    const durationLine = startDate || endDate
      ? `${startDate || '—'} – ${endDate || 'Ongoing'}`
      : null;
    const reminderLine = hasReminder
      ? `${med.reminders.times.join(', ')}${reminderTargets.length ? ` · ${reminderTargets.join(', ')}` : ''}`
      : null;

    if (variant === 'compact') {
      return (
        <article key={med.id} className="patient-med-card patient-med-card--compact">
          <div className="patient-med-card__compact-row">
            <span className="patient-med-card__freq">{med.frequency || '—'}</span>
            <span className="patient-med-card__name">{med.drug}</span>
            {hasReminder && <span className="patient-med-card__reminder-dot" title="Reminder set" />}
          </div>
          <p className="patient-med-card__dose">{doseLine}</p>
        </article>
      );
    }

    return (
      <article key={med.id} className="patient-med-card">
        <div className="patient-med-card__rail" aria-hidden />
        <div className="patient-med-card__body">
          <div className="patient-med-card__row">
            <div className="patient-med-card__primary">
              <span className="patient-med-card__freq">{med.frequency || '—'}</span>
              <span className="patient-med-card__name">{med.drug}</span>
              {doseLine !== '—' && <span className="patient-med-card__dose">{doseLine}</span>}
            </div>
            <span className={`patient-med-card__status${isExisting ? ' patient-med-card__status--record' : ''}`}>
              {isExisting ? 'On record' : 'Active'}
            </span>
          </div>

          {(durationLine || reminderLine || med.notes) && (
            <p className="patient-med-card__meta">
              {[
                durationLine && `Duration: ${durationLine}`,
                hasReminder ? `Reminder: ${reminderLine}` : 'Reminder: Not set',
                med.notes && `Notes: ${med.notes}`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}

          <footer className="patient-med-card__footer">
            <div className="patient-med-card__actions">
              {!isExisting && !hasReminder && (
                <button
                  type="button"
                  className="patient-med-card__action"
                  onClick={() => {
                    setShowReminderForm(med.id);
                    setReminderForm(createMedicationReminderState(med));
                  }}
                >
                  Set reminder
                </button>
              )}
              {!isExisting && (
                <button
                  type="button"
                  className="patient-med-card__action"
                  onClick={() => openMedicationEditor(med)}
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                className="patient-med-card__action patient-med-card__action--danger"
                onClick={() => setConfirmDelete({
                  type: isExisting ? 'existing' : 'added',
                  id: isExisting ? med.originalIndex : med.id,
                  name: med.drug,
                })}
              >
                Remove
              </button>
            </div>
          </footer>
        </div>
      </article>
    );
  };

  return (
    <motion.div className="page-wrapper nurse-profile-page patient-profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
      {activeProfileToast && (
        <div className="patient-profile-save-alert" role="status" aria-live="polite">
          <div className="patient-profile-save-alert__content">
            <strong>{activeProfileToast.title}</strong>
            <span>{activeProfileToast.message}</span>
          </div>
          <button
            type="button"
            className="patient-profile-save-alert__close"
            onClick={activeProfileToast.onDismiss}
            aria-label="Dismiss notification"
          >
            <FiX size={16} />
          </button>
        </div>
      )}
      {showAdmissionResumeBanner && (
        <div className="patient-profile-admission-resume">
          <div className="patient-profile-admission-resume__copy">
            <strong>Admission form incomplete</strong>
            <span>
              {admissionResumeProgress} of {ADMISSION_SECTION_COUNT} sections saved. Continue the client admission form where you left off.
            </span>
          </div>
          <button
            type="button"
            className="patient-profile-admission-resume__cta"
            onClick={() => navigate(`/patients?resume=${encodeURIComponent(effectivePatientId)}`)}
          >
            Continue admission
            <FiChevronRight size={14} />
          </button>
        </div>
      )}
      <div className="nurse-profile-shell">
        <input type="file" accept="image/*" ref={fileRef} onChange={handlePhoto} style={{ display: 'none' }} />
        <div className="nurse-profile-topbar pp-pharm-topbar">
          <div className="nurse-profile-topbar__left pp-pharm-topbar__left">
            <button type="button" className="pp-pharm-back" onClick={() => navigate('/patients')}>
              <FiArrowLeft size={16} />
              Patients
            </button>
            <div className="pp-pharm-topbar__title">
              <span className="pp-pharm-topbar__name">{p.name}</span>
              {(p.regNo || p.diagnosis) && (
                <span className="pp-pharm-topbar__meta">
                  {[p.regNo, p.diagnosis ? String(p.diagnosis).slice(0, 48) : ''].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>
          <div className="pp-pharm-topbar__actions">
            <button
              type="button"
              className="pp-pharm-btn-yellow"
              onClick={() => setShowUpdateModal(true)}
            >
              Edit profile
            </button>
            <div className="pp-pharm-topbar-menu">
              <button
                type="button"
                className="pp-pharm-btn-yellow pp-pharm-btn-yellow--secondary pp-pharm-topbar-menu__trigger"
                onClick={() => setShowTopbarMenu((open) => !open)}
                aria-expanded={showTopbarMenu}
                aria-haspopup="menu"
              >
                More
              </button>
              {showTopbarMenu && (
                <div className="pp-pharm-topbar-menu__panel" role="menu">
                  <button type="button" role="menuitem" onClick={() => { setShowTopbarMenu(false); handleGenerateReport(); }}>
                    Generate report
                  </button>
                  {p.phone && (
                    <button type="button" role="menuitem" onClick={() => { setShowTopbarMenu(false); handlePrimaryAction(); }}>
                      Call patient
                    </button>
                  )}
                  <button type="button" role="menuitem" onClick={() => { setShowTopbarMenu(false); loadPatientProfile(); }}>
                    Refresh profile
                  </button>
                  <hr />
                  {isPatientDeactivated ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowTopbarMenu(false);
                        setPatientStatusConfirmError('');
                        setPatientStatusConfirm({ action: 'reactivate' });
                      }}
                      disabled={deactivatingPatient}
                    >
                      Reactivate patient
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="is-danger"
                      onClick={() => {
                        setShowTopbarMenu(false);
                        setPatientStatusConfirmError('');
                        setPatientStatusConfirm({ action: 'deactivate' });
                      }}
                      disabled={deactivatingPatient}
                    >
                      Deactivate patient
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="is-danger"
                    onClick={() => { setShowTopbarMenu(false); setShowReportDeathModal(true); }}
                  >
                    Report death
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pp-pharm-desk">
          <aside className="pp-pharm-sidebar" aria-label="Patient summary">
            <div className="pp-pharm-side-card pp-pharm-side-card--profile">
              <div className="pp-pharm-side-profile">
                <div
                  className="pp-pharm-side-profile__photo"
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
                  role="button"
                  tabIndex={0}
                  title="Upload patient photo"
                >
                  <img
                    src={avatarDisplaySrc}
                    alt={showAvatarImage ? p.name : 'Patient'}
                    loading="lazy"
                    onError={() => { if (showAvatarImage) setAvatarImageError(true); }}
                  />
                </div>
                <div className="pp-pharm-side-profile__body">
                  <div className={`pp-pharm-side-profile__status${patientStatusClass}`}>{patientStatusLabel}</div>
                  {p.regNo && <p className="pp-pharm-side-profile__reg">Reg. {p.regNo}</p>}
                  <dl className="pp-pharm-side-profile__facts">
                    <div><dt>Gender</dt><dd>{p.gender || '—'}</dd></div>
                    <div><dt>Age</dt><dd>{p.age != null && p.age !== '' ? p.age : '—'}</dd></div>
                    <div><dt>Phone</dt><dd>{p.phone || '—'}</dd></div>
                  </dl>
                  {(photoUploading || photoUploadSuccess || photoUploadError) && (
                    <div className={`pp-pharm-side-profile__photo-msg${photoUploadError ? ' is-error' : ''}${photoUploadSuccess ? ' is-success' : ''}`}>
                      {photoUploading ? 'Uploading photo…' : (photoUploadSuccess || photoUploadError)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {flags.some((f) => f.status !== 'ok') && (
              <div className="pp-pharm-side-card">
                <div className="pp-pharm-side-card__title">Clinical flags</div>
                <ul className="pp-pharm-flag-chips">
                  {flags.filter((f) => f.status !== 'ok').slice(0, 4).map((flag) => (
                    <li
                      key={flag.label}
                      className={`pp-pharm-flag-chip pp-pharm-flag-chip--${flag.status === 'alert' ? 'alert' : 'warn'}`}
                    >
                      <span>{flag.label}</span>
                      {flag.detail && <span style={{ fontSize: 11, opacity: 0.85 }}>{flag.detail}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pp-pharm-side-card">
              <div className="pp-pharm-side-card__title">Allergies</div>
              <ul className="pp-pharm-allergy-list">
                {sidebarAllergies.map((row) => (
                  <li key={`${row.label}-${row.tone}`}>
                    <span className="pp-pharm-allergy-list__name">{row.label}</span>
                    {row.severity && (
                      <span className={`pp-pharm-allergy-list__sev pp-pharm-allergy-list__sev--${row.tone}`}>{row.severity}</span>
                    )}
                  </li>
                ))}
              </ul>
              <button type="button" className="pp-pharm-side-muted-link" onClick={() => setTab('clinical')}>
                Manage in Clinical
              </button>
            </div>
          </aside>

          <main className="pp-pharm-main">
        <div className="kh-card nurse-profile-board pp-pharm-board">
          <div className="pp-pharm-tabs-scroll">
          <div className="nurse-profile-tabs pp-pharm-tabs">
            {TABS.map((item) => (
              <button key={item.key} type="button" onClick={() => handleProfileTabChange(item.key)} className={`nurse-profile-tab${tab === item.key || (item.key === 'vitals' && showVitalsMegaModal) || (item.key === 'notes' && showNotesMegaModal) || (item.key === 'incidents' && showIncidentsMegaModal) || (item.key === 'medications' && showMedicationsMegaModal) ? ' active' : ''}`}>
                {item.label}
              </button>
            ))}
          </div>
          </div>

          <div className="nurse-profile-board__content">

      {/* ═══ CHART SUMMARY ═══ */}
      {tab === 'chart' && (
        <>
          <div className="pp-pharm-general-stack">
            <div className="pp-pharm-panel">
              <div className="pp-pharm-panel__section-title">Personal details</div>
              <div className="pp-pharm-personal-grid">
                <div><span className="pp-pharm-field-label">Name</span><span className="pp-pharm-field-value">{p.name || '—'}</span></div>
                <div><span className="pp-pharm-field-label">Date of birth</span><span className="pp-pharm-field-value">{p.dob || '—'}</span></div>
                <div><span className="pp-pharm-field-label">Phone</span><span className="pp-pharm-field-value">{p.phone || '—'}</span></div>
                <div><span className="pp-pharm-field-label">Email</span><span className="pp-pharm-field-value">{p.email || '—'}</span></div>
                <div className="pp-pharm-personal-grid__wide"><span className="pp-pharm-field-label">Address</span><span className="pp-pharm-field-value">{p.address || '—'}</span></div>
                <div><span className="pp-pharm-field-label">Diagnosis</span><span className="pp-pharm-field-value">{p.diagnosis || '—'}</span></div>
                <div><span className="pp-pharm-field-label">Primary nurse</span><span className="pp-pharm-field-value">{p.nurse || '—'}</span></div>
              </div>
            </div>

            <div className="pp-pharm-panel pp-pharm-panel--compact">
              <div className="pp-pharm-used-head">
                <h3 className="pp-pharm-used-title">Medications</h3>
                <button type="button" className="pp-pharm-used-add" onClick={() => handleProfileTabChange('medications')}>
                  Manage all
                </button>
              </div>
              {activeMedicationRecords.length === 0 ? (
                <p className="pp-pharm-panel__hint">No medications on file.</p>
              ) : (
                <>
                  <div className="patient-med-card-grid patient-med-card-grid--profile">
                    {activeMedicationRecords.slice(0, 4).map((med) => renderMedicationCard(med, { variant: 'compact' }))}
                  </div>
                  {activeMedicationRecords.length > 4 && (
                    <p className="pp-pharm-panel__hint">
                      +{activeMedicationRecords.length - 4} more — open Medications to view all.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="nurse-profile-overview-grid" style={{ marginBottom: 18 }}>
            <div className="nurse-profile-card nurse-profile-card--timeline">
              <div className="nurse-profile-card-heading nurse-profile-card-heading--with-action">
                <span>Care team & contacts</span>
                <button type="button" className="nurse-profile-inline-btn" onClick={() => setTab('clinical')}>Clinical details</button>
              </div>
              <div className="nurse-profile-timeline-table nurse-profile-timeline-table--compact">
                <div className="nurse-profile-timeline-head">
                  <span>Role</span>
                  <span>Details</span>
                  <span>Status</span>
                </div>
                {patientOverviewRows.map((row) => (
                  <div key={row.label} className="nurse-profile-timeline-row" style={{ cursor: 'default' }}>
                    <span><strong>{row.label}</strong></span>
                    <span>{row.detail}{row.meta ? ` · ${row.meta}` : ''}</span>
                    <span>
                      <em className={row.status === 'Assigned' || row.status === 'Updated' || row.status === 'Reachable' ? 'is-active' : ''}>{row.status}</em>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="nurse-profile-card nurse-profile-card--snapshot">
              <div className="nurse-profile-card-heading">At a glance</div>
              <div className="nurse-profile-snapshot-list">
                {patientSnapshotItems.map((item) => (
                  <div key={item.label} className="nurse-profile-snapshot-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="patient-daily-care-completed" aria-labelledby="patient-daily-care-completed-title">
            <header className="patient-daily-care-completed__head">
              <div>
                <h2 id="patient-daily-care-completed-title" className="patient-daily-care-completed__title">
                  Completed daily care plans
                </h2>
                <p className="patient-daily-care-completed__subtitle">
                  Completed tasks from the daily care plan API ({totalCompletedAll} total
                  {completedCarePlanDates.length ? ` across ${completedCarePlanDates.length} day${completedCarePlanDates.length === 1 ? '' : 's'}` : ''}).
                </p>
              </div>
              <button
                type="button"
                className="patient-daily-care-completed__link"
                onClick={() => handleProfileTabChange('checkliststatus')}
              >
                Full daily care view
              </button>
            </header>

            <div className="patient-daily-care-completed__toolbar">
              <label htmlFor="patient-daily-care-date" className="patient-daily-care-completed__date-label">Date</label>
              <input
                id="patient-daily-care-date"
                type="date"
                className="patient-daily-care-completed__date-input"
                value={checklistStatusDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setChecklistStatusDate(e.target.value)}
              />
              <div className="patient-daily-care-completed__day-strip" role="group" aria-label="Days with completed care plans">
                {completedCarePlanDates.slice(0, 14).map((qd) => {
                  const fd = formatShortDate(qd);
                  const completedCount = completedCarePlansByDate[qd]?.length
                    ?? getChecklistForDate(qd)?.filter((item) => item.completed).length
                    ?? null;
                  return (
                    <button
                      key={qd}
                      type="button"
                      className={`patient-daily-care-completed__day-chip${checklistStatusDate === qd ? ' is-active' : ''}`}
                      onClick={() => setChecklistStatusDate(qd)}
                      aria-pressed={checklistStatusDate === qd}
                    >
                      <span>{fd.day.slice(0, 3)} {fd.date}</span>
                      <small>{completedCount == null ? '…' : `${completedCount} done`}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            {(completedCarePlansLoad.loading || (selectedDailyEntry?.loading && selectedDateChecklist == null)) ? (
              <p className="patient-daily-care-completed__status">Loading completed care plans…</p>
            ) : (completedCarePlansLoad.error || (selectedDailyEntry?.error && selectedDateChecklist == null)) ? (
              <p className="patient-daily-care-completed__status patient-daily-care-completed__status--error" role="alert">
                {completedCarePlansLoad.error || selectedDailyEntry?.error}
              </p>
            ) : selectedDateCompletedItems.length > 0 ? (
              <ul className="patient-daily-care-completed__list">
                {selectedDateCompletedItems.map((item) => (
                  <li key={`${checklistStatusDate}-${item.id}`} className="patient-daily-care-completed__item">
                    <div className="patient-daily-care-completed__item-icon" aria-hidden>
                      <FiCheckCircle size={14} />
                    </div>
                    <div className="patient-daily-care-completed__item-body">
                      <p className="patient-daily-care-completed__item-task">{item.task}</p>
                      <div className="patient-daily-care-completed__item-meta">
                        <span>{item.category}</span>
                        <span>{item.frequency}</span>
                        {item.completedBy ? <span>{item.completedBy}</span> : null}
                        {item.completedAt ? <span>{item.completedAt}</span> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : selectedDateChecklist ? (
              <p className="patient-daily-care-completed__status">No completed care plan tasks for {formatChecklistLongDate(checklistStatusDate)}.</p>
            ) : (
              <p className="patient-daily-care-completed__status">No daily care checklist data for this date.</p>
            )}

            <div className="patient-daily-care-completed__history">
              <h3 className="patient-daily-care-completed__history-title">All completed days</h3>
              <div className="patient-daily-care-completed__history-grid">
                {dailyCompletedCareByDay.map((day) => {
                  const fd = formatShortDate(day.dateStr);
                  const isSelected = checklistStatusDate === day.dateStr;
                  if (day.entry?.loading && !day.items) {
                    return (
                      <div key={day.dateStr} className="patient-daily-care-completed__history-card is-loading">
                        <span className="patient-daily-care-completed__history-date">{fd.day} {fd.date} {fd.month}</span>
                        <span className="patient-daily-care-completed__history-count">Loading…</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      className={`patient-daily-care-completed__history-card${isSelected ? ' is-selected' : ''}`}
                      onClick={() => setChecklistStatusDate(day.dateStr)}
                      aria-pressed={isSelected}
                    >
                      <span className="patient-daily-care-completed__history-date">{fd.day} {fd.date} {fd.month}</span>
                      <strong className="patient-daily-care-completed__history-count">
                        {day.completed.length}
                      </strong>
                      <span className="patient-daily-care-completed__history-label">completed</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="row g-3">
          {/* Left column */}
          <div className="col-lg-4">
            <Panel title="Next of kin Info" variant="summary">
              {hasNextOfKinData ? (
                <>
                  <DataRow label="Full Name">{p.emergency.name}</DataRow>
                  <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
                  <DataRow label="Contact One">{p.sectionNextOfKin?.contactOne}</DataRow>
                  <DataRow label="Contact Two">{p.sectionNextOfKin?.contactTwo}</DataRow>
                  <DataRow label="Personal Doctor">{p.doctor.name}</DataRow>
                  <DataRow label="Doctor Facility">{p.doctor.facility}</DataRow>
                  <DataRow label="Doctor Contact">{p.doctor.phone}</DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Emergency Contact" variant="summary">
              {hasNextOfKinData ? (
                <>
                  <DataRow label="Name">{p.emergency.name}</DataRow>
                  <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
                  <DataRow label="Phone">{p.emergency.phone}</DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Cultural / Religious" variant="summary">
              {String(p.cultural || '').trim()
                ? <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.6 }}>{p.cultural}</div>
                : <NoDataState />}
            </Panel>
          </div>

          {/* Center column */}
          <div className="col-lg-4">
            <Panel title="Clinical Flags">
              {flags.map((f, i) => <FlagItem key={i} label={f.label} detail={f.detail} />)}
            </Panel>

            <Panel title="Admission Record" variant="summary">
              <DataRow label="Reg No.">{p.regNo}</DataRow>
              <DataRow label="Date of Assessment">{p.dateOfAssessment}</DataRow>
              <DataRow label="Date Admitted">{p.enrolled}</DataRow>
              <DataRow label="Handbook Given"><YN val={p.handbookGiven} /></DataRow>
              <DataRow label="Primary Nurse">{p.nurse} ({p.nursePin})</DataRow>
              <DataRow label="Physician">{p.doctor.name}</DataRow>
              <DataRow label="Facility">{p.doctor.facility}</DataRow>
              {!hasAdmissionChecklistData && <NoDataState text="Admission checklist data is not available from the endpoint yet." />}
            </Panel>
          </div>

          {/* Right column — Quick vitals */}
          <div className="col-lg-4">
            <Panel title="Latest Vitals"
              variant="summary"
              action={(
                <span style={{ fontSize: 10.5, color: 'var(--kh-text-muted)' }}>
                  {latestRecordedVital
                    ? `Recorded ${latestRecordedVital.date}${latestRecordedVital.time ? ` at ${latestRecordedVital.time}` : ''}`
                    : hasInitialVitalsData ? 'On admission' : 'No reading'}
                </span>
              )}
            >
              {latestVitalLoading && !latestRecordedVital ? (
                <div style={{ padding: '12px 4px', fontSize: 12.5, color: 'var(--kh-text-muted)' }}>
                  Loading latest vitals…
                </div>
              ) : (latestRecordedVital || hasInitialVitalsData) ? (
                <div className="row g-2">
                  <div className="col-6"><VitalTile label="Blood Pressure" value={latestDisplayedVitals.bp} risk={latestRiskByField.bp} /></div>
                  <div className="col-6"><VitalTile label="Blood Sugar" value={latestDisplayedVitals.sugar} risk={latestRiskByField.sugar} /></div>
                  <div className="col-6"><VitalTile label="SPO2" value={latestDisplayedVitals.spo2} risk={latestRiskByField.spo2} /></div>
                  <div className="col-6"><VitalTile label="Pulse" value={latestDisplayedVitals.pulse ? `${latestDisplayedVitals.pulse} bpm` : ''} risk={latestRiskByField.pulse} /></div>
                  <div className="col-6"><VitalTile label="Temperature" value={latestDisplayedVitals.temp} risk={latestRiskByField.temp} /></div>
                  <div className="col-6"><VitalTile label="Weight" value={latestDisplayedVitals.weight} risk="low-risk" /></div>
                </div>
              ) : <NoDataState text="No vitals data is available for this patient yet." />}
            </Panel>

            <Panel title="Current Medications" variant="summary">
              {activeMedicationRecords.length > 0 ? (
                <div className="patient-med-card-grid patient-med-card-grid--profile">
                  {activeMedicationRecords.slice(0, 6).map((med) => renderMedicationCard(med, { variant: 'compact' }))}
                </div>
              ) : (
                <NoDataState text="No current medications are available from the endpoint." />
              )}
            </Panel>
          </div>
          </div>
        </>
      )}

      {/* ═══ CLINICAL ASSESSMENT ═══ */}
      {tab === 'clinical' && (
        <div className="row g-3">
          <div className="col-lg-6">
            <Panel title="Communication" icon={<FiUser size={14} />} action={renderProfileCardActions('clinical:communication')}>
              {renderCardSectionError('clinical:communication')}
              {isCardEditing('clinical:communication') ? (
                <ProfileCardEditForm
                  cardId="clinical:communication"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Communication Needs" path="communicationStyle.anyCommunicationNeeds" kind="bool" />
                  <ProfileCardEditRow label="Hearing Impairment" path="communicationStyle.anyHearingNeeds" kind="bool" />
                  <ProfileCardEditRow label="Speech Impairment" path="communicationStyle.anySpeechImpairment" kind="bool" />
                  <ProfileCardEditRow label="Visual Impairment" path="communicationStyle.anyVisualImpairment" kind="bool" />
                  <ProfileCardEditRow label="Understanding Issues" path="communicationStyle.anyUnderstandingDifficulties" kind="bool" />
                  <ProfileCardEditRow label="Notes" path="communicationStyle.communicationNotes" kind="text" />
                </div>
                </ProfileCardEditForm>
              ) : hasCommunicationData ? (
                <>
                  <DataRow label="Communication Needs"><YN val={p.communication.needs} /></DataRow>
                  <DataRow label="Hearing Impairment"><YN val={p.communication.hearing} /></DataRow>
                  <DataRow label="Speech Impairment"><YN val={p.communication.speech} /></DataRow>
                  <DataRow label="Visual Impairment"><YN val={p.communication.visual} /></DataRow>
                  <DataRow label="Understanding Issues"><YN val={p.communication.understanding} /></DataRow>
                  <DataRow label="Notes">{p.sectionCommunicationStyle?.communicationNotes}</DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Infection Control" icon={<FiShield size={14} />} action={renderProfileCardActions('clinical:infection')}>
              {renderCardSectionError('clinical:infection')}
              {isCardEditing('clinical:infection') ? (
                <ProfileCardEditForm
                  cardId="clinical:infection"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Risk Assessment Plan" path="infectionControl.InfectionCarePlanCompletion" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : hasInfectionControlData ? (
                <>
                  <DataRow label="Risk Assessment Plan"><YN val={p.infection.riskPlan} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Diabetes Management" icon={<FiActivity size={14} />} accent={p.diabetes.has ? '#d97706' : undefined} action={renderProfileCardActions('clinical:diabetes')}>
              {renderCardSectionError('clinical:diabetes')}
              {isCardEditing('clinical:diabetes') ? (
                <ProfileCardEditForm
                  cardId="clinical:diabetes"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Diabetes Present" path="infectionControl.anyDiabetes" kind="bool" />
                  <ProfileCardEditRow label="Care Plan Active" path="infectionControl.DiabetesCarePlanCompletion" kind="bool" />
                  <ProfileCardEditRow label="Patient Bed Bound" path="infectionControl.isThePatientBedBound" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : (hasInfectionControlData || p.diabetes.has !== null) ? (
                <>
                  <DataRow label="Diabetes Present"><YN val={p.diabetes.has} /></DataRow>
                  <DataRow label="Care Plan Active"><YN val={p.diabetes.carePlan} /></DataRow>
                  <DataRow label="Patient Bed Bound"><YN val={p.diabetes.stockings} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Breathing" icon={<FiActivity size={14} />} action={renderProfileCardActions('clinical:breathing')}>
              {renderCardSectionError('clinical:breathing')}
              {isCardEditing('clinical:breathing') ? (
                <ProfileCardEditForm
                  cardId="clinical:breathing"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Breathing Difficulties" path="breathPain.anyBreathingDifficulties" kind="bool" />
                  <ProfileCardEditRow label="Home O₂ / CPAP" path="breathPain.homeOxygenNeeded" kind="bool" />
                  <ProfileCardEditRow label="Current Smoker" path="breathPain.isSmoker" kind="bool" />
                  <ProfileCardEditRow label="Smoking History" path="breathPain.everSmoked" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : hasBreathPainData ? (
                <>
                  <DataRow label="Breathing Difficulties"><YN val={p.breathing.difficulties} /></DataRow>
                  <DataRow label="Home O₂ / CPAP"><YN val={p.breathing.oxygen} /></DataRow>
                  <DataRow label="Current Smoker"><YN val={p.breathing.smoker} /></DataRow>
                  <DataRow label="Smoking History"><YN val={p.breathing.everSmoked} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>
          </div>
          <div className="col-lg-6">
            <Panel title="Pain Assessment" icon={<FiAlertTriangle size={14} />} accent={p.pain.present ? painColors[p.pain.score] : undefined} action={renderProfileCardActions('clinical:pain')}>
              {renderCardSectionError('clinical:pain')}
              {isCardEditing('clinical:pain') ? (
                <ProfileCardEditForm
                  cardId="clinical:pain"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Pain Present" path="breathPain.painPresent" kind="bool" />
                  <ProfileCardEditRow label="Pain Score (0–3)" path="breathPain.painScore" kind="text" />
                  <ProfileCardEditRow label="Location" path="breathPain.locationOfPain" kind="text" />
                  <ProfileCardEditRow label="Analgesia Prescribed" path="breathPain.anagelsiaPrescribed" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : hasPainAssessmentData ? (
                <>
                  <DataRow label="Pain Present"><YN val={p.pain.present} /></DataRow>
                  <DataRow label="Pain Score">
                    {p.pain.score === null || p.pain.score === undefined ? (
                      <span style={{ color: 'var(--kh-text-muted)', fontWeight: 500 }}>No data</span>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[0,1,2,3].map(s => (
                            <div key={s} style={{
                              width: 24, height: 8, borderRadius: 1,
                              background: s <= p.pain.score ? painColors[p.pain.score] : '#e5e7eb',
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: painColors[p.pain.score] }}>{p.pain.score}/3 {painLabels[p.pain.score]}</span>
                      </div>
                    )}
                  </DataRow>
                  <DataRow label="Location">{p.pain.location || '—'}</DataRow>
                  <DataRow label="Analgesia Prescribed"><YN val={p.pain.analgesiaPrescribed} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Psychological" icon={<FiShield size={14} />} accent={p.psych.concerns || p.psych.depression || p.psych.anxiety ? '#d97706' : undefined} action={renderProfileCardActions('clinical:psychological')}>
              {renderCardSectionError('clinical:psychological')}
              {isCardEditing('clinical:psychological') ? (
                <ProfileCardEditForm
                  cardId="clinical:psychological"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Concerns Flagged" path="hygienePsych.psychologicalNeeds.psychologicalNeeds" kind="tristate" />
                  <ProfileCardEditRow label="Depression" path="hygienePsych.psychologicalNeeds.depressionHistory" kind="tristate" />
                  <ProfileCardEditRow label="Anxiety" path="hygienePsych.psychologicalNeeds.anxietyhistory" kind="tristate" />
                  <ProfileCardEditRow label="Dementia / Delirium" path="hygienePsych.psychologicalNeeds.signDementia" kind="tristate" />
                  <ProfileCardEditRow label="Notes" path="hygienePsych.psychologicalNeeds.psychologicalNotes" kind="text" />
                </div>
                </ProfileCardEditForm>
              ) : hasPsychologicalAssessmentData || hasHygienePsychData ? (
                <>
                  <DataRow label="Concerns Flagged"><YN val={p.psych.concerns} /></DataRow>
                  <DataRow label="Depression"><YN val={p.psych.depression} /></DataRow>
                  <DataRow label="Anxiety"><YN val={p.psych.anxiety} /></DataRow>
                  <DataRow label="Dementia / Delirium"><YN val={p.psych.dementia} /></DataRow>
                  {p.psych.notes ? (
                    <DataRow label="Notes">{p.psych.notes}</DataRow>
                  ) : null}
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Skin Integrity" icon={<FiAlertTriangle size={14} />} accent={p.skin.openWounds || p.skin.pressureUlcer ? '#ef4444' : undefined} action={renderProfileCardActions('clinical:skin')}>
              {renderCardSectionError('clinical:skin')}
              {isCardEditing('clinical:skin') ? (
                <ProfileCardEditForm
                  cardId="clinical:skin"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Open Wounds" path="skinMobility.skinIntegrity.openWounds" kind="bool" />
                  <ProfileCardEditRow label="Pressure Ulcer" path="skinMobility.skinIntegrity.pressureUlcer" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : hasSkinMobilityData ? (
                <>
                  <DataRow label="Open Wounds"><YN val={p.skin.openWounds} /></DataRow>
                  <DataRow label="Pressure Ulcer"><YN val={p.skin.pressureUlcer} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Mobility" icon={<FiUser size={14} />} action={renderProfileCardActions('clinical:mobility')}>
              {renderCardSectionError('clinical:mobility')}
              {isCardEditing('clinical:mobility') ? (
                <ProfileCardEditForm
                  cardId="clinical:mobility"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Independently Mobile" path="skinMobility.handlingAssessment.isPatientMobile" kind="bool" />
                  <ProfileCardEditRow label="Move in Bed" path="skinMobility.handlingAssessment.moveInBed" kind="bool" />
                  <ProfileCardEditRow label="Bed to Chair" path="skinMobility.handlingAssessment.mobilityFromBedToChair" kind="bool" />
                  <ProfileCardEditRow label="Transfer to Toilet" path="skinMobility.handlingAssessment.mobilityToWashroom" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : hasSkinMobilityData ? (
                <>
                  <DataRow label="Independently Mobile"><YN val={p.mobility.independent} /></DataRow>
                  <DataRow label="Move in Bed"><YN val={p.mobility.bedMove} /></DataRow>
                  <DataRow label="Bed to Chair"><YN val={p.mobility.bedToChair} /></DataRow>
                  <DataRow label="Transfer to Toilet"><YN val={p.mobility.toilet} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ ASSIGNED NURSES ═══ */}
      {tab === 'assignednurses' && (
        <div className="row g-3">
          <div className="col-12">
            <Panel title="Assigned Nurses" icon={<FiUser size={14} />} variant="summary">
              {assignedNurseActionError && (
                <div style={{ marginBottom: 10, color: '#dc2626', fontSize: 12.5, fontWeight: 600 }}>
                  {assignedNurseActionError}
                </div>
              )}
              {assignedNurseActionSuccess && (
                <div style={{ marginBottom: 10, color: '#047857', fontSize: 12.5, fontWeight: 600 }}>
                  {assignedNurseActionSuccess}
                </div>
              )}
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="form-select form-control-kh"
                  style={{ minWidth: 260, maxWidth: 420, fontSize: 12.5 }}
                  value={assignedNurseCandidateId}
                  onChange={(event) => setAssignedNurseCandidateId(event.target.value)}
                  disabled={incidentNursesLoading || assigningProfileNurseId !== ''}
                >
                  <option value="">
                    {incidentNursesLoading ? 'Loading nurses...' : 'Select nurse to assign'}
                  </option>
                  {assignableNursesForProfile.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}{row.jobTitle ? ` — ${row.jobTitle}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  style={{ fontSize: 12.5, fontWeight: 700, padding: '8px 12px', minHeight: 'auto' }}
                  onClick={handleAssignNewNurse}
                  disabled={!assignedNurseCandidateId || assigningProfileNurseId !== '' || incidentNursesLoading}
                >
                  {assigningProfileNurseId ? 'Assigning...' : 'Assign New Nurse'}
                </button>
              </div>
              {assignedNursesForProfile.length === 0 ? (
                <NoDataState text="No assigned nurses found for this patient." />
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      background: 'linear-gradient(135deg, #f8fbff 0%, #f1f7ff 100%)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Active care team
                      </div>
                      <div style={{ fontSize: 15, color: '#0f172a', fontWeight: 800, marginTop: 2 }}>
                        {assignedNursesForProfile.length} assigned nurse{assignedNursesForProfile.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      Manage patient assignment coverage
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    {assignedNursesForProfile.map((nurse, index) => (
                      <div
                        key={nurse.id || `${nurse.name}-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: '1px solid #e5e7eb',
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div
                            aria-hidden
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#e8f3ff',
                              color: '#1d4ed8',
                              fontSize: 12,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {String(nurse?.name || 'N')
                              .split(' ')
                              .map((piece) => piece[0] || '')
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {nurse.name || '—'}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '3px 8px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: nurse.role ? '#eef6ff' : '#f1f5f9',
                                  color: nurse.role ? '#1d4ed8' : '#64748b',
                                }}
                              >
                                {nurse.role || 'Role not set'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-kh-outline"
                          style={{
                            fontSize: 12,
                            padding: '7px 11px',
                            minHeight: 'auto',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            color: '#b91c1c',
                            borderColor: '#fca5a5',
                            background: '#fef2f2',
                          }}
                          onClick={() => openRemoveAssignedNurseModal(nurse)}
                          disabled={!nurse.assignmentId || removingAssignedNurseId === String(nurse.assignmentId)}
                          title={!nurse.assignmentId ? 'Assignment ID unavailable' : 'Remove nurse'}
                        >
                          {removingAssignedNurseId === String(nurse.assignmentId) ? 'Removing...' : 'Remove Nurse'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ── Deactivate / Reactivate Patient Confirmation Modal ── */}
      {patientStatusConfirm && (
        <motion.div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={closePatientStatusConfirm}
        >
          <motion.div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-status-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="patient-status-confirm-title" className="destructive-confirm-dialog__title">
                {patientStatusConfirm.action === 'deactivate' ? 'Deactivate patient' : 'Reactivate patient'}
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={deactivatingPatient}
                onClick={closePatientStatusConfirm}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                {patientStatusConfirm.action === 'deactivate'
                  ? 'Are you sure you want to deactivate this patient? They will be moved out of the active patient list.'
                  : 'Are you sure you want to reactivate this patient? They will return to the active patient list.'}
              </p>
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  {patientStatusConfirm.action === 'deactivate' ? (
                    <>
                      <strong>Warning:</strong> Deactivated patients cannot receive new care assignments until reactivated.
                    </>
                  ) : (
                    <>
                      <strong>Note:</strong> Reactivating restores this patient to active status for care and scheduling.
                    </>
                  )}
                </div>
              </div>
              {patientStatusConfirmError && (
                <div className="destructive-confirm-dialog__banner-error">{patientStatusConfirmError}</div>
              )}
              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiUser size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{p?.name || 'Patient'}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {p?.patientId || p?.id || 'Patient ID unavailable'}
                  </div>
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={deactivatingPatient}
                onClick={closePatientStatusConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={patientStatusConfirm.action === 'deactivate'
                  ? 'destructive-confirm-dialog__btn-danger'
                  : 'btn btn-kh-primary'}
                disabled={deactivatingPatient}
                onClick={confirmPatientStatusAction}
              >
                {deactivatingPatient
                  ? (patientStatusConfirm.action === 'deactivate' ? 'Deactivating…' : 'Reactivating…')
                  : (patientStatusConfirm.action === 'deactivate' ? 'Deactivate Patient' : 'Reactivate Patient')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Remove Assigned Nurse Confirmation Modal ── */}
      {pendingRemoveAssignedNurse && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (removingAssignedNurseId) return;
            setPendingRemoveAssignedNurse(null);
            setAssignedNurseActionError('');
          }}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destructive-assigned-nurse-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="destructive-assigned-nurse-title" className="destructive-confirm-dialog__title">
                Remove assigned nurse
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={Boolean(removingAssignedNurseId)}
                onClick={() => {
                  if (removingAssignedNurseId) return;
                  setPendingRemoveAssignedNurse(null);
                  setAssignedNurseActionError('');
                }}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to remove this nurse from the patient&apos;s assigned care team?
              </p>
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning:</strong> This nurse will no longer appear under Assigned Nurses for this patient.
                </div>
              </div>
              {assignedNurseActionError && (
                <div className="destructive-confirm-dialog__banner-error">{assignedNurseActionError}</div>
              )}
              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiUser size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{pendingRemoveAssignedNurse?.name || 'Assigned nurse'}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {pendingRemoveAssignedNurse?.role || 'Role not set'}
                  </div>
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={Boolean(removingAssignedNurseId)}
                onClick={() => {
                  if (removingAssignedNurseId) return;
                  setPendingRemoveAssignedNurse(null);
                  setAssignedNurseActionError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={Boolean(removingAssignedNurseId)}
                onClick={() => handleRemoveAssignedNurse(pendingRemoveAssignedNurse)}
              >
                {removingAssignedNurseId ? 'Removing…' : 'Remove Nurse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VITALS ═══ */}
      {showVitalsMegaModal && (
        <div
          className="patient-vitals-mega-modal"
          onClick={() => { if (!showVitalForm) setShowVitalsMegaModal(false); }}
        >
          <div
            className="patient-vitals-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Patient vitals records"
          >
            <div className="patient-vitals-mega-modal__header">
              <div className="patient-vitals-mega-modal__header-copy">
                <span className="patient-vitals-mega-modal__eyebrow">Patient vitals</span>
                <div className="patient-vitals-mega-modal__title-row">
                  <span className="patient-vitals-mega-modal__title-icon"><FiActivity size={20} /></span>
                  <div>
                    <h3>Vitals Records</h3>
                    <p>{vitalRecords.length > 0 ? `Last updated on ${vitalRecords[0].date} at ${vitalRecords[0].time}.` : `Admission baseline captured on ${p.enrolled}.`} Review trends and add new readings from one place.</p>
                  </div>
                </div>
              </div>
              <div className="patient-vitals-mega-modal__actions">
                <button type="button" className="patient-vitals-mega-modal__add-btn" onClick={() => { setEditingVitalId(null); setShowVitalForm(true); }}>
                  <FiPlus size={14} /> Add Vital Record
                </button>
                <button type="button" className="patient-vitals-mega-modal__close" onClick={() => setShowVitalsMegaModal(false)}>
                  <FiX size={14} />
                </button>
              </div>
            </div>

            <div className="patient-vitals-mega-modal__body">

          {/* ── Add / Edit Vital Record Modal ── */}
          {showVitalForm && (
            <div
              className="patient-vital-modal"
              onClick={closeVitalForm}
            >
              <div
                className="patient-vital-modal__panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={editingVitalId ? 'Edit vital record' : 'Add vital record'}
              >
                <div className="patient-vital-modal__header">
                  <div className="patient-vital-modal__header-copy">
                    <span className="patient-vital-modal__eyebrow">{editingVitalId ? 'Update reading' : 'Vitals capture'}</span>
                    <div className="patient-vital-modal__title-row">
                      <span className="patient-vital-modal__title-icon">
                        <FiActivity size={20} />
                      </span>
                      <div>
                        <h3>{editingVitalId ? 'Update Vital Record' : 'Record New Vitals'}</h3>
                        <p>
                          {editingVitalId
                            ? `Adjust the measurements or notes for this reading recorded for ${p.name}. Changes sync to the patient timeline immediately.`
                            : `Capture the latest measurements and observations for ${p.name}. Saved records sync to the patient timeline immediately.`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeVitalForm}
                    disabled={savingVital}
                    type="button"
                    className="patient-vital-modal__close"
                  >
                    <FiX size={14} />
                  </button>
                </div>
                <div className="patient-vital-modal__body">
                  <div className="patient-vital-modal__layout">
                    <div className="patient-vital-modal__main">
                      <div className="patient-vital-modal__section">
                        <div className="patient-vital-modal__section-header">
                          <div>
                            <div className="patient-vital-modal__section-title">Recording details</div>
                            <div className="patient-vital-modal__section-copy">Add when the reading was taken and who recorded it.</div>
                          </div>
                          <span className="patient-vital-modal__pill">Required context</span>
                        </div>
                        <div className="patient-vital-modal__grid patient-vital-modal__grid--meta">
                          <div className="patient-vital-modal__field">
                            <label className="patient-vital-modal__label">Date *</label>
                            <input
                              className="patient-vital-modal__input"
                              type="date"
                              value={vitalForm.date}
                              onChange={e => setVitalForm(f => ({ ...f, date: e.target.value }))}
                            />
                          </div>
                          <div className="patient-vital-modal__field">
                            <label className="patient-vital-modal__label">Time *</label>
                            <input
                              className="patient-vital-modal__input"
                              type="time"
                              value={vitalForm.time}
                              onChange={e => setVitalForm(f => ({ ...f, time: e.target.value }))}
                            />
                          </div>
                          <div className="patient-vital-modal__field patient-vital-modal__field--wide">
                            <label className="patient-vital-modal__label">Recorded By</label>
                            <input
                              className="patient-vital-modal__input"
                              type="text"
                              value={vitalForm.recordedBy}
                              onChange={e => setVitalForm(f => ({ ...f, recordedBy: e.target.value }))}
                              placeholder="Nurse or staff name"
                              autoComplete="name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="patient-vital-modal__section">
                        <div className="patient-vital-modal__section-header">
                          <div>
                            <div className="patient-vital-modal__section-title">Vital measurements</div>
                            <div className="patient-vital-modal__section-copy">Enter the latest readings captured for this patient.</div>
                          </div>
                        </div>
                        {vitalFormHasMetricInput && (
                          <div style={{ marginBottom: 14 }} role="status" aria-live="polite">
                            <div style={{
                              padding: '12px 16px',
                              borderRadius: 14,
                              borderLeft: `4px solid ${riskColor(vitalFormOverallCheck.status)}`,
                              background: vitalFormOverallCheck.status === 'high-risk' ? '#fef2f2' : vitalFormOverallCheck.status === 'medium-risk' ? '#fffbeb' : '#f0fdf4',
                              border: `1px solid ${riskColor(vitalFormOverallCheck.status)}33`,
                            }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 4 }}>Vital risk summary</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: riskColor(vitalFormOverallCheck.status) }}>
                                {vitalFormOverallCheck.status === 'high-risk' ? 'High risk' : vitalFormOverallCheck.status === 'medium-risk' ? 'Medium risk — review' : 'Low risk (green band)'}
                              </div>
                              {vitalFormOverallCheck.flaggedVital && vitalFormOverallCheck.status !== 'low-risk' && (
                                <div style={{ marginTop: 8, fontSize: 12.5, color: '#475569' }}>
                                  Highest concern:&nbsp;
                                  <strong style={{ color: riskColor(vitalFormOverallCheck.status) }}>{formatFlaggedMetricLabel(vitalFormOverallCheck.flaggedVital)}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="patient-vital-modal__grid">
                          {[
                            { key: 'bp', label: 'Blood Pressure', placeholder: 'e.g. 130/85' },
                            { key: 'sugar', label: 'Blood Sugar', placeholder: 'e.g. 6.5 mmol/L' },
                            { key: 'spo2', label: 'SPO₂', placeholder: 'e.g. 97%' },
                            { key: 'pulse', label: 'Pulse', placeholder: 'e.g. 78 bpm' },
                            { key: 'temp', label: 'Temperature', placeholder: 'e.g. 36.6°C' },
                            { key: 'resp', label: 'Respiration', placeholder: 'e.g. 18' },
                            { key: 'weight', label: 'Weight', placeholder: 'e.g. 82 kg' },
                            { key: 'urinalysis', label: 'Urinalysis', placeholder: 'e.g. Normal' },
                          ].map((field) => (
                            <div key={field.key} className="patient-vital-modal__field">
                              <label className="patient-vital-modal__label">{field.label}</label>
                              <input
                                className="patient-vital-modal__input"
                                style={['bp', 'sugar', 'spo2', 'pulse', 'temp'].includes(field.key) ? vitalRiskInputStyle(field.key) : undefined}
                                value={vitalForm[field.key]}
                                onChange={e => setVitalForm(f => ({ ...f, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="patient-vital-modal__section">
                        <div className="patient-vital-modal__section-header patient-vital-modal__section-header--compact">
                          <div>
                            <div className="patient-vital-modal__section-title">Clinical notes</div>
                            <div className="patient-vital-modal__section-copy">Optional observations to support the measurements recorded.</div>
                          </div>
                        </div>
                        <div className="patient-vital-modal__field">
                          <label className="patient-vital-modal__label">Notes</label>
                          <textarea
                            className="patient-vital-modal__textarea"
                            value={vitalForm.notes}
                            onChange={e => setVitalForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="Add any relevant patient observation or escalation note..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    <aside className="patient-vital-modal__aside">
                      <div className="patient-vital-modal__summary-card">
                        <div className="patient-vital-modal__summary-title">Summary</div>
                        <div className="patient-vital-modal__summary-copy">Review the key details before saving this record.</div>
                        <div className="patient-vital-modal__summary-list">
                          <div>
                            <span>Patient</span>
                            <strong>{p.name}</strong>
                          </div>
                          <div>
                            <span>Recorded On</span>
                            <strong>{vitalForm.date || 'Select date'} {vitalForm.time ? `at ${vitalForm.time}` : ''}</strong>
                          </div>
                          <div>
                            <span>Captured By</span>
                            <strong>{vitalForm.recordedBy || 'Not provided yet'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="patient-vital-modal__summary-card patient-vital-modal__summary-card--soft">
                        <div className="patient-vital-modal__summary-title">Tips</div>
                        <div className="patient-vital-modal__tip-list">
                          <div>Use the `systolic/diastolic` format for blood pressure.</div>
                          <div>Include units where helpful for blood sugar, temperature, and weight.</div>
                          <div>Add notes when readings are unusual or need follow-up.</div>
                        </div>
                      </div>
                    </aside>
                  </div>

                  <div className="patient-vital-modal__footer">
                    <button
                      onClick={closeVitalForm}
                      disabled={savingVital}
                      type="button"
                      className="patient-vital-modal__btn patient-vital-modal__btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddVital}
                      disabled={savingVital}
                      type="button"
                      className="patient-vital-modal__btn patient-vital-modal__btn--primary"
                    >
                      {savingVital
                        ? (editingVitalId ? 'Updating...' : 'Saving...')
                        : (editingVitalId ? 'Update Vital Record' : 'Save Vital Record')}
                    </button>
                  </div>
                  {!!vitalSaveError && <div className="patient-vital-modal__error">{vitalSaveError}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── Vitals Records Grid ── */}
            <div className="patient-vitals-records">
              <div className="patient-vitals-records__grid">
                {groupedVitalRecords.map((group) => (
                  <Fragment key={group.label}>
                    <div className="patient-vitals-records__section-head patient-vitals-records__section-head--full">
                      <span className="patient-vitals-records__section-label">{group.label}</span>
                      <span className="patient-vitals-records__section-line" aria-hidden />
                    </div>
                    {group.records.map((r) => {
                      const recorderName = vitalRecorderDisplayName(r.recordedBy) || '—';
                      const isViewing = expandedVital === r.id;
                      return (
                        <article key={r.id} className="patient-vitals-record-card">
                          <div className="patient-vitals-record-card__header">
                            <div className="patient-vitals-record-card__recorder">
                              <span className="patient-vitals-record-card__recorder-icon" aria-hidden>
                                <FiUser size={13} />
                              </span>
                              <span>{recorderName}</span>
                            </div>
                            <div className="patient-vitals-record-card__menu-wrap">
                              <button
                                type="button"
                                className="patient-vitals-record-card__menu-btn"
                                aria-label="Record actions"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setVitalCardMenuId((current) => (current === r.id ? null : r.id));
                                }}
                              >
                                <FiMoreHorizontal size={16} />
                              </button>
                              {vitalCardMenuId === r.id && (
                                <div
                                  className="patient-vitals-record-card__menu"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button type="button" onClick={() => { setVitalCardMenuId(null); startEditVital(r); }}>
                                    <FiEdit2 size={13} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="patient-vitals-record-card__menu-danger"
                                    disabled={deletingVitalId === r.id || savingVital}
                                    onClick={() => { setVitalCardMenuId(null); deleteVitalRecord(r.id); }}
                                  >
                                    <FiTrash2 size={13} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="patient-vitals-record-card__divider" aria-hidden />
                          <div className="patient-vitals-record-card__body">
                            <div className="patient-vitals-record-card__copy">
                              <h4>{buildVitalCardTitle(r)}</h4>
                              <p>{formatVitalRelativeTime(r.date, r.time)}</p>
                            </div>
                            <button
                              type="button"
                              className={`patient-vitals-record-card__view-btn${isViewing ? ' is-active' : ''}`}
                              onClick={() => setExpandedVital(isViewing ? null : r.id)}
                            >
                              View result
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </Fragment>
                ))}

                {hasAdmissionBaselineVitals && (
                  <>
                    <div className="patient-vitals-records__section-head patient-vitals-records__section-head--full">
                      <span className="patient-vitals-records__section-label">Admission baseline</span>
                      <span className="patient-vitals-records__section-line" aria-hidden />
                    </div>
                    <article className="patient-vitals-record-card">
                      <div className="patient-vitals-record-card__header">
                        <div className="patient-vitals-record-card__recorder">
                          <span className="patient-vitals-record-card__recorder-icon" aria-hidden>
                            <FiUser size={13} />
                          </span>
                          <span>{vitalRecorderDisplayName(p.nurse) || '—'}</span>
                        </div>
                      </div>
                      <div className="patient-vitals-record-card__divider" aria-hidden />
                      <div className="patient-vitals-record-card__body">
                        <div className="patient-vitals-record-card__copy">
                          <h4>Admission Baseline Vitals</h4>
                          <p>{formatVitalRelativeTime(p.enrolled, '')}</p>
                        </div>
                        <button
                          type="button"
                          className={`patient-vitals-record-card__view-btn${expandedVital === 'admission' ? ' is-active' : ''}`}
                          onClick={() => setExpandedVital(expandedVital === 'admission' ? null : 'admission')}
                        >
                          View result
                        </button>
                      </div>
                    </article>
                  </>
                )}
              </div>

              {groupedVitalRecords.length === 0 && !hasAdmissionBaselineVitals && (
                <div className="patient-vitals-records__empty">
                  <FiActivity size={28} aria-hidden />
                  <p>No vital records yet. Add the first reading to start tracking this patient.</p>
                  <button
                    type="button"
                    className="patient-vitals-mega-modal__add-btn"
                    onClick={() => { setEditingVitalId(null); setShowVitalForm(true); }}
                  >
                    <FiPlus size={14} /> Add Vital Record
                  </button>
                </div>
              )}
            </div>

          </div>

            {expandedVital && (
              <div
                className="patient-vitals-detail-overlay"
                onClick={() => setExpandedVital(null)}
              >
                <div
                  className="patient-vitals-detail-panel"
                  onClick={(event) => event.stopPropagation()}
                  role="dialog"
                  aria-label="Vital record details"
                >
                  {(() => {
                    const isAdmission = expandedVital === 'admission';
                    const r = isAdmission
                      ? {
                        id: 'admission',
                        date: p.enrolled,
                        time: '',
                        bp: p.vitals.bp,
                        sugar: p.vitals.sugar,
                        spo2: p.vitals.spo2,
                        pulse: p.vitals.pulse,
                        temp: p.vitals.temp,
                        resp: p.vitals.resp,
                        weight: p.vitals.weight,
                        urinalysis: p.vitals.urinalysis,
                        recordedBy: p.nurse,
                        notes: '',
                      }
                      : vitalRecords.find((item) => item.id === expandedVital);
                    if (!r) return null;
                    const rowRisks = getVitalFieldRisksFromRow(r);
                    const detailTitle = isAdmission ? 'Admission Baseline Vitals' : buildVitalCardTitle(r);
                    return (
                      <>
                        <div className="patient-vitals-detail-panel__header">
                          <div>
                            <span className="patient-vitals-detail-panel__eyebrow">
                              {isAdmission ? 'Admission baseline' : 'Vital record'}
                            </span>
                            <h4>{detailTitle}</h4>
                            <p>
                              {vitalRecorderDisplayName(r.recordedBy) || '—'}
                              {' · '}
                              {formatVitalRelativeTime(r.date, r.time)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="patient-vitals-detail-panel__close"
                            onClick={() => setExpandedVital(null)}
                            aria-label="Close details"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                        <div className="patient-vitals-detail-panel__metrics">
                          {[
                            r.bp && { label: 'Blood Pressure', value: r.bp, risk: rowRisks.bp },
                            r.sugar && { label: 'Blood Sugar', value: r.sugar, risk: rowRisks.sugar },
                            r.spo2 && { label: 'SPO₂', value: r.spo2, risk: rowRisks.spo2 },
                            r.pulse && { label: 'Pulse', value: r.pulse, risk: rowRisks.pulse },
                            r.temp && { label: 'Temperature', value: r.temp, risk: rowRisks.temp },
                            r.resp && { label: 'Respiration', value: r.resp, risk: 'low-risk' },
                            r.weight && { label: 'Weight', value: r.weight, risk: 'low-risk' },
                            r.urinalysis && {
                              label: 'Urinalysis',
                              value: r.urinalysis,
                              risk: isUrinalysisFlagged(r.urinalysis) ? 'high-risk' : 'low-risk',
                            },
                          ].filter(Boolean).map((metric) => {
                            const risk = metric.risk || 'low-risk';
                            return (
                              <div
                                key={metric.label}
                                className={`patient-vitals-detail-panel__metric patient-vitals-detail-panel__metric--${risk}`}
                              >
                                <span>{metric.label}</span>
                                <strong style={{ color: risk === 'low-risk' ? '#166534' : riskColor(risk) }}>
                                  {metric.value}
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                        {r.notes && (
                          <div className="patient-vitals-detail-panel__notes">
                            <span>Notes</span>
                            <p>{r.notes}</p>
                          </div>
                        )}
                        {!isAdmission && (
                          <div className="patient-vitals-detail-panel__footer">
                            <button
                              type="button"
                              className="patient-vitals-detail-panel__edit-btn"
                              onClick={() => { setExpandedVital(null); startEditVital(r); }}
                            >
                              <FiEdit2 size={14} /> Edit Record
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

        </div>
        </div>
      )}

      {/* ═══ MEDICATIONS — MEGA MODAL ═══ */}
      {showMedicationsMegaModal && (
        <div
          className="patient-medications-mega-modal"
          onClick={() => { if (!showMedForm && !showReminderForm) setShowMedicationsMegaModal(false); }}
        >
          <div
            className="patient-medications-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Active medications"
          >
            <div className="patient-medications-mega-modal__header">
              <div className="patient-medications-mega-modal__header-copy">
                <h3 className="patient-medications-mega-modal__title">
                  Medications
                  <span className="patient-medications-mega-modal__count">{activeMedicationRecords.length}</span>
                  {medicationReminderCount > 0 && (
                    <span className="patient-medications-mega-modal__pill">
                      {medicationReminderCount} with reminders
                    </span>
                  )}
                </h3>
                <p className="patient-medications-mega-modal__subtitle">
                  Active medications for {p.name}
                </p>
              </div>
              <div className="patient-medications-mega-modal__actions">
                <button
                  type="button"
                  className="patient-medications-mega-modal__add-btn"
                  onClick={() => {
                    if (showMedForm) {
                      resetMedicationComposer();
                    } else {
                      setShowMedForm(true);
                      setDrugSearch('');
                      setShowCustomDrug(false);
                      setShowDrugDropdown(false);
                    }
                  }}
                >
                  {showMedForm ? 'Close form' : 'Add medication'}
                </button>
                <button
                  type="button"
                  className="patient-medications-mega-modal__close"
                  onClick={() => { if (!showMedForm && !showReminderForm) setShowMedicationsMegaModal(false); }}
                  aria-label="Close medications"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="patient-medications-mega-modal__body">
              <div className="patient-medications-toolbar">
                <p className="patient-medications-toolbar__hint">
                  {activeMedicationRecords.length} medication{activeMedicationRecords.length === 1 ? '' : 's'}
                  {medicationNewCount > 0 ? ` · ${medicationNewCount} added this session` : ''}
                </p>
              </div>
              {/* Add Medication Modal */}
              {showMedForm && (
                <div
                  className="kh-modal-overlay"
                  style={{ zIndex: 9998, padding: 16 }}
                  onClick={resetMedicationComposer}
                >
                  <div
                    className="kh-modal-panel"
                    style={{
                      width: 'min(980px, 96vw)',
                      maxHeight: '90vh',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onClick={event => event.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={editingMedicationId ? 'Edit medication' : 'Add medication'}
                  >
                    <div className="kh-modal-header patient-medication-modal__header patient-medication-modal__header--clean">
                      <div className="patient-medication-modal__header-copy">
                        <h4 className="patient-medication-modal__title">{editingMedicationId ? 'Edit medication' : 'Add medication'}</h4>
                        {drugCatalogError && (
                          <p className="patient-medication-modal__catalog-note">Using fallback drug list — live catalog unavailable.</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={resetMedicationComposer}
                        className="patient-medications-mega-modal__close"
                        aria-label="Close medication form"
                      >
                        Close
                      </button>
                    </div>

                    <div className="kh-modal-body patient-medication-modal__body patient-medication-modal__body--clean">
                      {medicationSaveError && (
                        <div className="patient-medications-form__error">{medicationSaveError}</div>
                      )}
                      <div className="patient-medication-modal__layout patient-medication-modal__layout--single">
                        <div className="patient-medication-modal__main">
                          <section className="patient-medication-modal__section patient-medication-modal__section--clean">
                            <label className="patient-medication-modal__label">Drug name *</label>
                            <div className="patient-medication-modal__search-wrap patient-medication-modal__search-wrap--clean">
                              <input
                                value={drugSearch}
                                onChange={e => { setDrugSearch(e.target.value); setShowDrugDropdown(true); setMedForm(f => ({ ...f, drug: '' })); setShowCustomDrug(false); }}
                                onFocus={() => setShowDrugDropdown(true)}
                                placeholder="Search medication"
                                className="patient-medication-modal__search-input"
                              />

                              {showDrugDropdown && drugSearch.length >= 1 && (
                                <div className="patient-medication-modal__search-dropdown">
                                  {drugCatalogLoading ? (
                                    <div className="patient-medication-modal__search-empty">Loading drugs…</div>
                                  ) : filteredDrugs.length > 0 ? (
                                    filteredDrugs.map((drugOption, index) => (
                                      <button
                                        key={drugOption.id || index}
                                        type="button"
                                        onClick={() => selectDrug(drugOption)}
                                        className="patient-medication-modal__search-option"
                                      >
                                        <span>{drugOption.name}</span>
                                        <small>{drugOption.category}{drugOption.commonDose ? ` · ${drugOption.commonDose}` : ''}</small>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="patient-medication-modal__search-miss-wrap">
                                      <div className="patient-medication-modal__search-miss">
                                        &quot;{drugSearch}&quot; not found
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => { setShowCustomDrug(true); setCustomDrugName(drugSearch); setShowDrugDropdown(false); }}
                                        className="patient-medication-modal__custom-trigger"
                                      >
                                        Add as custom medication
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {medForm.drug && (
                              <div className="patient-medication-modal__selected-chip patient-medication-modal__selected-chip--clean">
                                <span>{medForm.drug}</span>
                                <button
                                  type="button"
                                  onClick={() => { setMedForm(f => ({ ...f, drug: '', dosage: '' })); setDrugSearch(''); }}
                                >
                                  Remove
                                </button>
                              </div>
                            )}

                            {showCustomDrug && (
                              <div className="patient-medication-modal__custom-card patient-medication-modal__custom-card--clean">
                                <label className="patient-medication-modal__label">Custom medication name</label>
                                <div className="patient-medication-modal__custom-actions">
                                  <input
                                    value={customDrugName}
                                    onChange={e => setCustomDrugName(e.target.value)}
                                    placeholder="Enter medication name"
                                    className="patient-medication-modal__input"
                                  />
                                  <button
                                    type="button"
                                    onClick={applyCustomDrug}
                                    disabled={!customDrugName.trim()}
                                    className="patient-medication-modal__inline-btn patient-medication-modal__inline-btn--primary"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setShowCustomDrug(false); setCustomDrugName(''); }}
                                    className="patient-medication-modal__inline-btn"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </section>

                          <section className="patient-medication-modal__section patient-medication-modal__section--clean">
                            <div className="row g-3">
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Dosage *</label>
                                  <input
                                    value={medForm.dosage}
                                    onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))}
                                    placeholder="e.g. 500mg"
                                    className="patient-medication-modal__input"
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Frequency *</label>
                                  <select
                                    value={medicationFrequencySelectValue}
                                    onChange={(e) => {
                                      const nextFrequency = e.target.value;
                                      setMedForm((f) => ({ ...f, frequency: nextFrequency }));
                                      if (!editingMedicationId) {
                                        setReminderForm((prev) => ({
                                          ...prev,
                                          times: frequencyToDefaultTimes(nextFrequency, prev.times),
                                        }));
                                      }
                                    }}
                                    className="patient-medication-modal__input"
                                  >
                                    <option value="">Select frequency</option>
                                    {medicationFrequencyOptions.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Route</label>
                                  <select
                                    value={medForm.route}
                                    onChange={e => setMedForm(f => ({ ...f, route: e.target.value }))}
                                    className="patient-medication-modal__input"
                                  >
                                    {ROUTE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Start Date</label>
                                  <input
                                    type="date"
                                    value={reminderForm.startDate}
                                    onChange={e => setReminderForm(f => ({ ...f, startDate: e.target.value }))}
                                    className="patient-medication-modal__input"
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">End Date</label>
                                  <input
                                    type="date"
                                    value={reminderForm.endDate}
                                    onChange={e => setReminderForm(f => ({ ...f, endDate: e.target.value }))}
                                    className="patient-medication-modal__input"
                                  />
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Notes</label>
                                  <input
                                    value={medForm.notes}
                                    onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Additional instructions or notes"
                                    className="patient-medication-modal__input"
                                  />
                                </div>
                              </div>
                            </div>
                          </section>

                          {editingMedicationId && (
                            <section className="patient-medication-modal__section patient-medication-modal__section--clean">
                              <h5 className="patient-medication-modal__subsection-title">Reminder schedule</h5>
                              <div className="row g-3" style={{ marginBottom: 12 }}>
                                <div className="col-md-4">
                                  <div className="patient-medication-modal__field">
                                    <label className="patient-medication-modal__label">Start Date</label>
                                    <input
                                      type="date"
                                      value={reminderForm.startDate}
                                      onChange={e => setReminderForm(f => ({ ...f, startDate: e.target.value }))}
                                      className="patient-medication-modal__input"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="patient-medication-modal__field">
                                    <label className="patient-medication-modal__label">End Date</label>
                                    <input
                                      type="date"
                                      value={reminderForm.endDate}
                                      onChange={e => setReminderForm(f => ({ ...f, endDate: e.target.value }))}
                                      className="patient-medication-modal__input"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="patient-medication-modal__field">
                                    <label className="patient-medication-modal__label">Notify</label>
                                    <div className="patient-medication-modal__checkboxes">
                                      <label>
                                        <input type="checkbox" checked={reminderForm.notifyNurse} onChange={e => setReminderForm(f => ({ ...f, notifyNurse: e.target.checked }))} style={{ accentColor: '#45B6FE' }} />
                                        Nurse
                                      </label>
                                      <label>
                                        <input type="checkbox" checked={reminderForm.notifyPatient} onChange={e => setReminderForm(f => ({ ...f, notifyPatient: e.target.checked }))} style={{ accentColor: '#45B6FE' }} />
                                        Patient
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="patient-medication-modal__times-header">
                                  <label className="patient-medication-modal__label">Reminder times</label>
                                  <button onClick={addReminderTime} type="button" className="patient-med-card__action">
                                    Add time
                                  </button>
                                </div>
                                <div className="patient-medication-modal__time-list">
                                  {reminderForm.times.map((time, index) => (
                                    <div key={index} className="patient-medication-modal__time-chip patient-medication-modal__time-chip--clean">
                                      <input
                                        type="time"
                                        value={time}
                                        onChange={e => updateReminderTime(index, e.target.value)}
                                      />
                                      {reminderForm.times.length > 1 && (
                                        <button type="button" onClick={() => removeReminderTime(index)}>
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="kh-modal-footer patient-medication-modal__footer patient-medication-modal__footer--clean">
                      <button onClick={resetMedicationComposer} type="button" className="patient-medications-form__btn patient-medications-form__btn--secondary">
                        Cancel
                      </button>
                      <button
                        onClick={handleAddMed}
                        disabled={!medForm.drug || !medForm.dosage || !medForm.frequency || savingMedication}
                        type="button"
                        className="patient-medications-form__btn patient-medications-form__btn--primary"
                      >
                        {savingMedication ? 'Saving…' : editingMedicationId ? 'Save changes' : 'Save medication'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reminder Form (appears after adding a med) */}
              {showReminderForm && (() => {
                const med = addedMeds.find(m => m.id === showReminderForm);
                if (!med) return null;
                return (
                  <div className="patient-medications-reminder-form">
                    <div className="patient-medications-reminder-form__header">
                      <h4 className="patient-medications-reminder-form__title">Set reminder for {med.drug}</h4>
                      <button type="button" className="patient-medications-reminder-form__close" onClick={() => setShowReminderForm(null)}>
                        Close
                      </button>
                    </div>

                    <p className="patient-medications-reminder-form__summary">
                      {[med.dosage, med.frequency, med.route].filter(Boolean).join(' · ')}
                    </p>

                    <div className="row g-2 mb-3">
                      <div className="col-md-3">
                        <label className="patient-medication-modal__label">Schedule</label>
                        <select
                          value={reminderForm.reminderType}
                          onChange={e => setReminderForm(f => ({ ...f, reminderType: e.target.value }))}
                          className="patient-medication-modal__input"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="patient-medication-modal__label">Start date</label>
                        <input
                          type="date"
                          value={reminderForm.startDate}
                          onChange={e => setReminderForm(f => ({ ...f, startDate: e.target.value }))}
                          className="patient-medication-modal__input"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="patient-medication-modal__label">End date</label>
                        <input
                          type="date"
                          value={reminderForm.endDate}
                          onChange={e => setReminderForm(f => ({ ...f, endDate: e.target.value }))}
                          className="patient-medication-modal__input"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="patient-medication-modal__label">Notify</label>
                        <div className="patient-medication-modal__checkboxes">
                          <label>
                            <input type="checkbox" checked={reminderForm.notifyNurse} onChange={e => setReminderForm(f => ({ ...f, notifyNurse: e.target.checked }))} />
                            Nurse
                          </label>
                          <label>
                            <input type="checkbox" checked={reminderForm.notifyPatient} onChange={e => setReminderForm(f => ({ ...f, notifyPatient: e.target.checked }))} />
                            Patient
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="patient-medications-reminder-form__times">
                      <div className="patient-medication-modal__times-header">
                        <label className="patient-medication-modal__label">Reminder times</label>
                        <button type="button" onClick={addReminderTime} className="patient-med-card__action">
                          Add time
                        </button>
                      </div>
                      <div className="patient-medication-modal__time-list">
                        {reminderForm.times.map((t, i) => (
                          <div key={i} className="patient-medication-modal__time-chip patient-medication-modal__time-chip--clean">
                            <input type="time" value={t} onChange={e => updateReminderTime(i, e.target.value)} />
                            {reminderForm.times.length > 1 && (
                              <button type="button" onClick={() => removeReminderTime(i)}>Remove</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="patient-medications-reminder-form__footer">
                      <button type="button" onClick={() => setShowReminderForm(null)} className="patient-medications-form__btn patient-medications-form__btn--secondary">
                        Skip
                      </button>
                      <button type="button" onClick={() => saveReminder(med.id)} className="patient-medications-form__btn patient-medications-form__btn--primary">
                        Save reminder
                      </button>
                    </div>
                  </div>
                );
              })()}

              {activeMedicationRecords.length > 0 ? (
                <div className="patient-med-card-grid">
                  {activeMedicationRecords.map((med) => renderMedicationCard(med))}
                </div>
              ) : (
                <div className="patient-medications-empty">
                  <p className="patient-medications-empty__title">No medications on file</p>
                  <p className="patient-medications-empty__hint">Use &quot;Add medication&quot; to prescribe one.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LIFESTYLE RECORDS ═══ */}
      {tab === 'care' && (
        <div className="row g-3">
          <div className="col-lg-4">
            <Panel title="Sleep" icon={<FiClock size={14} />} action={renderProfileCardActions('care:sleep')}>
              {renderCardSectionError('care:sleep')}
              {isCardEditing('care:sleep') ? (
                <ProfileCardEditForm
                  cardId="care:sleep"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Gets Up at Night" path="sleepNutrition.sleep.wakeUpAtNight" />
                  <ProfileCardEditRow label="Night Sedation" path="sleepNutrition.sleep.UseOfNightSedation" />
                  <ProfileCardEditRow label="Sleeps Well" path="sleepNutrition.sleep.userSleepWell" />
                  <ProfileCardEditRow label="Wake Time" path="sleepNutrition.sleep.usualTimeToWakeUp" kind="text" />
                  <ProfileCardEditRow label="Best Position" path="sleepNutrition.sleep.bestSleepingPosition" kind="text" />
                </div>
                </ProfileCardEditForm>
              ) : (
                <>
                  <DataRow label="Gets Up at Night"><YN val={p.sleep.nightWake} /></DataRow>
                  <DataRow label="Night Sedation"><YN val={p.sleep.sedation} /></DataRow>
                  <DataRow label="Sleeps Well"><YN val={p.sleep.sleepsWell} /></DataRow>
                  <DataRow label="Wake Time">{p.sleep.wakeTime}</DataRow>
                  <DataRow label="Best Position">{p.sleep.bestPosition}</DataRow>
                </>
              )}
            </Panel>

            <Panel title="Nutrition" icon={<FiHeart size={14} />} action={renderProfileCardActions('care:nutrition')}>
              {renderCardSectionError('care:nutrition')}
              {isCardEditing('care:nutrition') ? (
                <ProfileCardEditForm
                  cardId="care:nutrition"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Food Allergies" path="sleepNutrition.nutrition.allergy" />
                  <ProfileCardEditRow label="Special Diet" path="sleepNutrition.nutrition.specialDiet" />
                  <ProfileCardEditRow label="Diet Type" path="sleepNutrition.nutrition.dietType" kind="text" />
                  <ProfileCardEditRow label="Eating Assistance" path="sleepNutrition.nutrition.needHelpInEating" />
                  <ProfileCardEditRow label="Swallowing Issues" path="sleepNutrition.nutrition.swallowingDifficulties" />
                  <ProfileCardEditRow label="NG Tube" path="sleepNutrition.nutrition.ngTube" />
                </div>
                </ProfileCardEditForm>
              ) : (
                <>
                  <DataRow label="Food Allergies"><YN val={p.nutrition.allergies} /></DataRow>
                  <DataRow label="Special Diet"><YN val={p.nutrition.specialDiet} /></DataRow>
                  <DataRow label="Diet Type"><span style={{ fontWeight: 600 }}>{p.nutrition.dietType}</span></DataRow>
                  <DataRow label="Eating Assistance"><YN val={p.nutrition.helpEating} /></DataRow>
                  <DataRow label="Swallowing Issues"><YN val={p.nutrition.swallowing} /></DataRow>
                  <DataRow label="NG Tube"><YN val={p.nutrition.ngTube} /></DataRow>
                </>
              )}
            </Panel>
          </div>

          <div className="col-lg-4">
            <Panel title="Personal Hygiene" icon={<FiCheckCircle size={14} />} action={renderProfileCardActions('care:hygiene')}>
              {renderCardSectionError('care:hygiene')}
              {isCardEditing('care:hygiene') ? (
                <ProfileCardEditForm
                  cardId="care:hygiene"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Independent with hygiene needs" path="hygienePsych.personal.hygieneNeeds" kind="bool" />
                  <ProfileCardEditRow label="Mouth-Care Plan" path="hygienePsych.personal.mouthCarePlan" kind="bool" />
                  <ProfileCardEditRow label="Diabetes (Foot Care)" path="hygienePsych.personal.diabeteFoot" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : (
                <>
                  <DataRow label="Independent with hygiene needs"><YN val={p.hygiene.independent} /></DataRow>
                  <DataRow label="Mouth-Care Plan"><YN val={p.hygiene.mouthCare} /></DataRow>
                  <DataRow label="Diabetes (Foot Care)"><YN val={p.hygiene.diabeteFoot} /></DataRow>
                </>
              )}
            </Panel>

            <Panel title="Bladder & Bowel" icon={<FiActivity size={14} />} action={renderProfileCardActions('care:bladder')}>
              {renderCardSectionError('care:bladder')}
              {isCardEditing('care:bladder') ? (
                <ProfileCardEditForm
                  cardId="care:bladder"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Dysfunction" path="hygienePsych.bladderBowel.bladderDysfunction" kind="bool" />
                  <ProfileCardEditRow label="Catheter care plan" path="hygienePsych.bladderBowel.catheterPlan" kind="bool" />
                  <ProfileCardEditRow label="Catheter details" path="hygienePsych.bladderBowel.catheterDescription" kind="text" />
                  <ProfileCardEditRow label="Incontinent pads" path="hygienePsych.bladderBowel.incontinentPads" kind="bool" />
                </div>
                </ProfileCardEditForm>
              ) : (
                <>
                  <DataRow label="Dysfunction"><YN val={p.bladder.dysfunction} /></DataRow>
                  <DataRow label="Catheter care plan"><YN val={p.bladder.catheter} /></DataRow>
                  {p.bladder.catheterDescription ? (
                    <DataRow label="Catheter details">{p.bladder.catheterDescription}</DataRow>
                  ) : null}
                  <DataRow label="Incontinent pads"><YN val={p.bladder.pads} /></DataRow>
                </>
              )}
            </Panel>

            <Panel title="Physician Contact" icon={<FiPhone size={14} />} action={renderProfileCardActions('care:physician')}>
              {renderCardSectionError('care:physician')}
              {isCardEditing('care:physician') ? (
                <ProfileCardEditForm
                  cardId="care:physician"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Doctor" path="nextOfKin.personalDoctor" kind="text" />
                  <ProfileCardEditRow label="Facility" path="nextOfKin.personalDoctorFacility" kind="text" />
                  <ProfileCardEditRow label="Phone" path="nextOfKin.personalDoctorContact" kind="text" />
                </div>
                </ProfileCardEditForm>
              ) : (
                <>
                  <DataRow label="Doctor">{p.doctor.name}</DataRow>
                  <DataRow label="Facility">{p.doctor.facility}</DataRow>
                  <DataRow label="Phone">{p.doctor.phone}</DataRow>
                </>
              )}
            </Panel>
          </div>

          <div className="col-lg-4">
            <Panel title="Active Care Protocols" icon={<FiClipboard size={14} />} accent="#45B6FE">
              {[
                { label: 'Infection Control Plan', active: p.infection.riskPlan },
                { label: 'Diabetes Care Plan', active: p.diabetes.carePlan },
                { label: 'Mouth-Care Plan', active: p.hygiene.mouthCare },
                { label: 'Pain Management', active: p.pain.present },
                { label: 'Wound Management', active: p.skin.openWounds },
                { label: 'Mobility Support', active: !p.mobility.independent },
              ].filter(c => c.active).map((c, i) => (
                <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <FiCheckCircle size={13} style={{ color: '#45B6FE', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)' }}>{c.label}</span>
                </div>
              ))}
              {[
                { label: 'Infection Control Plan', active: p.infection.riskPlan },
                { label: 'Diabetes Care Plan', active: p.diabetes.carePlan },
                { label: 'Mouth-Care Plan', active: p.hygiene.mouthCare },
                { label: 'Pain Management', active: p.pain.present },
                { label: 'Wound Management', active: p.skin.openWounds },
                { label: 'Mobility Support', active: !p.mobility.independent },
              ].filter(c => c.active).length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '8px 0' }}>No active care protocols</div>
              )}
              <p className="patient-profile-card-edit-hint">Derived from clinical and lifestyle records. Edit the related sections to update.</p>
            </Panel>

            <Panel title="Emergency Contact" icon={<FiAlertTriangle size={14} />} accent="#d97706" action={renderProfileCardActions('care:emergency')}>
              {renderCardSectionError('care:emergency')}
              {isCardEditing('care:emergency') ? (
                <ProfileCardEditForm
                  cardId="care:emergency"
                  initialForm={cardEditSeedRef.current || createPatientUpdateForm(p, effectivePatientId)}
                  onFormChange={handleCardFormChange}
                >
                <div className="patient-profile-card-edit-form">
                  <ProfileCardEditRow label="Name" path="nextOfKin.fullName" kind="text" />
                  <ProfileCardEditRow label="Relationship" path="nextOfKin.relationship" kind="text" />
                  <ProfileCardEditRow label="Phone" path="nextOfKin.contactOne" kind="text" />
                </div>
                </ProfileCardEditForm>
              ) : (
                <>
                  <DataRow label="Name">{p.emergency.name}</DataRow>
                  <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
                  <DataRow label="Phone">{p.emergency.phone}</DataRow>
                </>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ NURSE NOTES — MEGA MODAL ═══ */}
      {showNotesMegaModal && (
        <div
          className="patient-notes-mega-modal"
          onClick={() => { if (!savingNote) setShowNotesMegaModal(false); }}
        >
          <div
            className="patient-notes-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Nurse notes"
          >
            {/* Modal header */}
            <div className="patient-notes-mega-modal__header">
              <div className="patient-notes-mega-modal__header-copy">
                <span className="patient-notes-mega-modal__eyebrow">Nurse care log</span>
                <div className="patient-notes-mega-modal__title-row">
                  <span className="patient-notes-mega-modal__title-icon"><FiEdit2 size={20} /></span>
                  <div>
                    <h3>
                      Nurse Notes
                      {notesLoaded && (
                        <span className="patient-notes-mega-modal__count">{filteredNotes.length}</span>
                      )}
                    </h3>
                    <p>
                      {`Document observations, interventions, and care updates for ${p.name}. Notes sync to the patient timeline immediately.`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="patient-notes-mega-modal__actions">
                <button
                  type="button"
                  className="patient-notes-mega-modal__add-btn"
                  onClick={() => {
                    if (showNoteForm) {
                      setShowNoteForm(false);
                      resetNoteForm();
                    } else {
                      resetNoteForm();
                      setNoteForm((prev) => ({
                        ...prev,
                        nurse:
                          resolveNurseNameFromDirectory(currentNurseId, incidentNurses, { currentNurseId, currentUserName })
                          || currentUserName
                          || prev.nurse,
                      }));
                      setShowNoteForm(true);
                    }
                  }}
                >
                  {showNoteForm ? <><FiX size={14} /> Cancel</> : <><FiPlus size={14} /> Add Note</>}
                </button>
                <button
                  type="button"
                  className="patient-notes-mega-modal__close"
                  onClick={() => { if (!savingNote) setShowNotesMegaModal(false); }}
                  aria-label="Close nurse notes"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="patient-notes-mega-modal__body">
              {/* Toolbar */}
              <div className="patient-notes-toolbar">
                <div className="patient-notes-toolbar__group">
                  <select
                    value={noteFilter}
                    onChange={e => setNoteFilter(e.target.value)}
                    className="patient-notes-toolbar__select"
                  >
                    <option value="All">All Categories</option>
                    {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => loadNurseNotes({ refresh: true })}
                    title="Refresh notes"
                    disabled={notesRefreshing}
                    className={`patient-notes-toolbar__icon-btn${notesRefreshing ? ' is-spinning' : ''}`}
                  >
                    <FiRefreshCw size={13} />
                  </button>
                </div>
              </div>

              {notesError && (
                <div className="patient-notes-toolbar__error">{notesError}</div>
              )}

              {/* Add / Edit Note Form */}
              {showNoteForm && (
                <div className="patient-notes-form">
                  {editingNoteId && (
                    <div className="patient-notes-form__edit-pill">
                      <FiEdit2 size={11} /> Editing existing note
                    </div>
                  )}
                  <div className="row g-2 mb-3">
                    <div className="col-md-3">
                      <label className="patient-notes-form__label">
                        <FiCalendar size={11} /> Date
                      </label>
                      <input
                        type="date"
                        value={noteForm.date}
                        onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                        className="patient-notes-form__input"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-notes-form__label">
                        <FiClock size={11} /> Time
                      </label>
                      <input
                        type="time"
                        value={noteForm.time}
                        onChange={e => setNoteForm({ ...noteForm, time: e.target.value })}
                        className="patient-notes-form__input"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="patient-notes-form__label">
                        <FiUser size={11} /> Recorded by
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={
                          noteForm.nurse
                          || resolveNurseNameFromDirectory(currentNurseId, nurseNotesDirectory, {
                            currentNurseId,
                            currentUserName,
                            sessionNurseIds,
                          })
                          || currentUserName
                          || 'Nurse name unavailable'
                        }
                        className="patient-notes-form__input patient-notes-form__input--readonly"
                        title="Captured from your signed-in nurse profile"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-notes-form__label">Category</label>
                      <select
                        value={noteForm.category}
                        onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                        className="patient-notes-form__input"
                      >
                        {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="patient-notes-form__label">Priority</label>
                      <select
                        value={noteForm.priority}
                        onChange={e => setNoteForm({ ...noteForm, priority: e.target.value })}
                        className="patient-notes-form__input"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="patient-notes-form__label">
                      <FiEdit2 size={11} /> Note Content
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Enter detailed nurse note. Use new lines to separate paragraphs."
                      value={noteForm.content}
                      onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                      className="patient-notes-form__textarea"
                    />
                  </div>
                  {noteSaveError && (
                    <div className="patient-notes-form__error">{noteSaveError}</div>
                  )}
                  <div className="patient-notes-form__footer">
                    <button
                      type="button"
                      onClick={() => { setShowNoteForm(false); resetNoteForm(); }}
                      disabled={savingNote}
                      className="patient-notes-form__btn patient-notes-form__btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!noteForm.content.trim() || savingNote}
                      className="patient-notes-form__btn patient-notes-form__btn--primary"
                    >
                      <FiSend size={13} />
                      {savingNote
                        ? (editingNoteId ? 'Updating…' : 'Saving…')
                        : (editingNoteId ? 'Update Note' : 'Save Note')}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes Timeline */}
              <div className="patient-notes-mega-modal__records">
              {notesLoading && !notesLoaded ? (
                <TablePageLoaderPanel
                  progress={72}
                  title="Loading nurse notes"
                  subtitle="Fetching care records for this patient…"
                  icon={FiEdit2}
                  ariaLabel="Loading nurse notes"
                />
              ) : filteredNotes.length === 0 ? (
                <div className="patient-notes-empty">
                  <span className="patient-notes-empty__icon" aria-hidden>
                    <FiEdit2 size={28} />
                  </span>
                  <div className="patient-notes-empty__title">
                    {noteFilter !== 'All'
                      ? `No records in "${noteFilter}"`
                      : 'No records'}
                  </div>
                  {noteFilter === 'All' && (
                    <div className="patient-notes-empty__hint">
                      Click &quot;Add Note&quot; to create the first nurse note for this patient.
                    </div>
                  )}
                </div>
              ) : (
                <div className={`patient-notes-table-card${notesRefreshing ? ' is-refreshing' : ''}`}>
                  <div className="table-responsive">
                    <table className="patient-notes-table">
                      <thead>
                        <tr>
                          <th>Date &amp; Time</th>
                          <th>Nurse</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Note</th>
                          <th className="patient-notes-table__actions-head">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNotes.map((note, idx) => {
                          const nurseLabel = resolveNoteNurseDisplayName(note, nurseNotesDisplayContext);
                          return (
                            <tr key={note.id} className={idx % 2 === 0 ? '' : 'is-alt'}>
                              <td className="patient-notes-table__when">
                                <span className="patient-notes-table__date">{note.date}</span>
                                <span className="patient-notes-table__time">{note.time}</span>
                                {note.pinned && <span className="patient-notes-table__pin">Pinned</span>}
                              </td>
                              <td className="patient-notes-table__nurse">
                                <span className="patient-notes-table__nurse-avatar" aria-hidden>
                                  <FiUser size={12} />
                                </span>
                                <span>{nurseLabel}</span>
                              </td>
                              <td>
                                <span
                                  className="patient-notes-table__chip"
                                  style={{ background: `${getCategoryColor(note.category)}18`, color: getCategoryColor(note.category) }}
                                >
                                  {note.category}
                                </span>
                              </td>
                              <td>
                                <span className={`patient-notes-table__priority patient-notes-table__priority--${(note.priority || 'normal').toLowerCase()}`}>
                                  {note.priority || 'Normal'}
                                </span>
                              </td>
                              <td className="patient-notes-table__content">{note.content}</td>
                              <td className="patient-notes-table__actions">
                                <button
                                  type="button"
                                  onClick={() => handlePinNote(note.id)}
                                  title={note.pinned ? 'Unpin note' : 'Pin note'}
                                  className={`patient-notes-table__icon-btn${note.pinned ? ' is-pinned' : ''}`}
                                >
                                  <FiAlertCircle size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditNote(note)}
                                  title="Edit note"
                                  className="patient-notes-table__icon-btn patient-notes-table__icon-btn--edit"
                                >
                                  <FiEdit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  disabled={deletingNoteId === note.id}
                                  title="Delete note"
                                  className="patient-notes-table__icon-btn patient-notes-table__icon-btn--danger"
                                >
                                  <FiX size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INCIDENT REPORTS — MEGA MODAL ═══ */}
      {showIncidentsMegaModal && (
        <div
          className="patient-incidents-mega-modal"
          onClick={() => {
            setShowIncidentForm(false);
            resetIncidentForm();
            setConfirmDeleteIncident(null);
            setIncidentDeleteModalError('');
            setShowIncidentsMegaModal(false);
          }}
        >
          <div
            className="patient-incidents-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Incident reports"
          >
            {/* Modal header */}
            <div className="patient-incidents-mega-modal__header">
              <div className="patient-incidents-mega-modal__header-copy">
                <h3 className="patient-incidents-mega-modal__title">
                  Incident Reports
                  <span className="patient-incidents-mega-modal__count">{incidents.length}</span>
                  {incidents.filter(i => i.status === 'open').length > 0 && (
                    <span className="patient-incidents-mega-modal__open-pill">
                      {incidents.filter(i => i.status === 'open').length} open
                    </span>
                  )}
                  {incidentsLoading && (
                    <span className="patient-incidents-mega-modal__open-pill">Loading…</span>
                  )}
                </h3>
                <p className="patient-incidents-mega-modal__subtitle">
                  Safety incidents for {p.name}
                </p>
              </div>
              <div className="patient-incidents-mega-modal__actions">
                <button
                  type="button"
                  className="patient-incidents-mega-modal__add-btn"
                  onClick={() => {
                    if (!showIncidentForm) {
                      resetIncidentForm();
                      setShowIncidentForm(true);
                    } else {
                      setShowIncidentForm(false);
                      resetIncidentForm();
                    }
                  }}
                >
                  {showIncidentForm ? (editingIncidentId ? 'Close editor' : 'Cancel') : 'Report incident'}
                </button>
                <button
                  type="button"
                  className="patient-incidents-mega-modal__close"
                  onClick={() => {
                    setShowIncidentForm(false);
                    resetIncidentForm();
                    setConfirmDeleteIncident(null);
                    setIncidentDeleteModalError('');
                    setShowIncidentsMegaModal(false);
                  }}
                  aria-label="Close incident reports"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="patient-incidents-mega-modal__body">
              {/* Toolbar */}
              <div className="patient-incidents-toolbar">
                <div className="patient-incidents-toolbar__group">
                  <label className="patient-incidents-toolbar__label" htmlFor="incident-type-filter">
                    Filter by type
                  </label>
                  <select
                    id="incident-type-filter"
                    value={incidentFilter}
                    onChange={e => setIncidentFilter(e.target.value)}
                    className="patient-incidents-toolbar__select"
                  >
                    <option value="All">All types</option>
                    {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={loadIncidents}
                    disabled={incidentsLoading}
                    className="patient-incidents-toolbar__refresh"
                  >
                    {incidentsLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
                <p className="patient-incidents-toolbar__hint">
                  {filteredIncidents.length} of {incidents.length} incident{incidents.length === 1 ? '' : 's'}
                </p>
              </div>

              {incidentsError && (
                <div className="patient-notes-toolbar__error">{incidentsError}</div>
              )}

              {/* Add Incident Form */}
              {showIncidentForm && (
                <div className="patient-incidents-form">
                  {editingIncidentId && (
                    <p className="patient-incidents-form__edit-notice">
                      Editing this incident — save to update it on the server.
                    </p>
                  )}
                  <div className="row g-2 mb-3">
                    <div className="col-md-3">
                      <label className="patient-incidents-form__label">Date</label>
                      <input
                        type="date"
                        value={incidentForm.date}
                        onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-incidents-form__label">Time</label>
                      <input
                        type="time"
                        value={incidentForm.time}
                        onChange={e => setIncidentForm({ ...incidentForm, time: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="patient-incidents-form__label">Reported by</label>
                      <input
                        type="text"
                        placeholder="Name of person reporting"
                        value={incidentForm.reportedBy}
                        onChange={e => setIncidentForm({ ...incidentForm, reportedBy: e.target.value })}
                        className="patient-incidents-form__input"
                        autoComplete="name"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-incidents-form__label">Incident type</label>
                      <select
                        value={incidentForm.type}
                        onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })}
                        className="patient-incidents-form__input"
                      >
                        {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="patient-incidents-form__label">Severity</label>
                      <select
                        value={incidentForm.severity}
                        onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                        className="patient-incidents-form__input"
                      >
                        {INCIDENT_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bedroom, Bathroom, Kitchen"
                      value={incidentForm.location}
                      onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                      className="patient-incidents-form__input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label patient-incidents-form__label--required">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe what happened"
                      value={incidentForm.description}
                      onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                      className="patient-incidents-form__textarea"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label">Immediate action taken</label>
                    <textarea
                      rows={2}
                      placeholder="Actions taken immediately after the incident"
                      value={incidentForm.immediateAction}
                      onChange={e => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
                      className="patient-incidents-form__textarea"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="patient-incidents-form__label">Witnesses</label>
                      <input
                        type="text"
                        placeholder="Names of any witnesses"
                        value={incidentForm.witnesses}
                        onChange={e => setIncidentForm({ ...incidentForm, witnesses: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="patient-incidents-form__label">Injury Details</label>
                      <input
                        type="text"
                        placeholder="Describe any injuries (if applicable)"
                        value={incidentForm.injuryDetails}
                        onChange={e => setIncidentForm({ ...incidentForm, injuryDetails: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label">Follow-up plan</label>
                    <textarea
                      rows={2}
                      placeholder="Planned follow-up actions"
                      value={incidentForm.followUp}
                      onChange={e => setIncidentForm({ ...incidentForm, followUp: e.target.value })}
                      className="patient-incidents-form__textarea"
                    />
                  </div>

                  <div className="patient-incidents-form__images">
                    <label className="patient-incidents-form__label">Photos</label>
                    <div className="patient-incidents-form__images-grid">
                      {incidentFormImages.map((img) => (
                        <div key={img.id} className="patient-incidents-form__image-item">
                          <img
                            src={img.previewUrl || img.url}
                            alt="Incident upload preview"
                          />
                          <button
                            type="button"
                            className="patient-incidents-form__image-remove"
                            onClick={() => removeIncidentFormImage(img.id)}
                            disabled={uploadingIncidentImages || savingIncident}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <label
                        className={`patient-incidents-form__image-add${uploadingIncidentImages ? ' is-disabled' : ''}`}
                      >
                        <input
                          ref={incidentImageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          hidden
                          disabled={uploadingIncidentImages || savingIncident}
                          onChange={handleIncidentImageSelect}
                        />
                        {uploadingIncidentImages ? 'Uploading…' : 'Add photo'}
                      </label>
                    </div>
                  </div>

                  <div className="patient-incidents-form__checkrow">
                    <label className="patient-incidents-form__checkbox">
                      <input
                        type="checkbox"
                        checked={incidentForm.physicianNotified}
                        onChange={e => setIncidentForm({ ...incidentForm, physicianNotified: e.target.checked })}
                      />
                      <span>Physician notified</span>
                    </label>
                    <label className="patient-incidents-form__checkbox">
                      <input
                        type="checkbox"
                        checked={incidentForm.familyNotified}
                        onChange={e => setIncidentForm({ ...incidentForm, familyNotified: e.target.checked })}
                      />
                      <span>Family notified</span>
                    </label>
                  </div>

                  {incidentSaveError && (
                    <div className="patient-notes-form__error" style={{ marginBottom: 10 }}>{incidentSaveError}</div>
                  )}
                  <div className="patient-incidents-form__footer">
                    {editingIncidentId && (
                      <button
                        type="button"
                        onClick={() => {
                          const id = String(editingIncidentId || '').trim();
                          if (!id) return;
                          requestDeleteIncident(id);
                        }}
                        disabled={savingIncident}
                        className="patient-incidents-form__btn patient-incidents-form__btn--danger"
                        style={{ marginRight: 'auto' }}
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowIncidentForm(false); resetIncidentForm(); }}
                      disabled={savingIncident}
                      className="patient-incidents-form__btn patient-incidents-form__btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={editingIncidentId ? handleUpdateIncident : handleAddIncident}
                      disabled={!incidentForm.description.trim() || savingIncident}
                      className="patient-incidents-form__btn patient-incidents-form__btn--primary"
                    >
                      {savingIncident ? 'Saving…' : editingIncidentId ? 'Save changes' : 'Submit report'}
                    </button>
                  </div>
                </div>
              )}

              {/* Incident List */}
              {filteredIncidents.length === 0 ? (
                <div className="patient-incidents-empty">
                  <p className="patient-incidents-empty__title">
                    {incidentFilter !== 'All'
                      ? `No incidents for "${incidentFilter}"`
                      : 'No incident reports yet'}
                  </p>
                  <p className="patient-incidents-empty__hint">
                    Use &quot;Report incident&quot; to add one.
                  </p>
                </div>
              ) : (
                <div className="patient-incidents-list">
                  {filteredIncidents.map((inc) => {
                    const statStyle = getIncidentStatusStyle(inc.status);
                    const sevStyle = getIncidentSeverityStyle(inc.severity);
                    const isExpanded = expandedIncident === inc.id;
                    return (
                      <article
                        key={inc.id}
                        className="patient-incidents-card"
                        style={{ '--incident-accent': sevStyle.border }}
                      >
                        <div
                          onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                          className="patient-incidents-card__header"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedIncident(isExpanded ? null : inc.id);
                            }
                          }}
                        >
                          <div className="patient-incidents-card__rail" aria-hidden />
                          <div className="patient-incidents-card__main">
                            <div className="patient-incidents-card__topline">
                              <h4 className="patient-incidents-card__title">{inc.type}</h4>
                              <div className="patient-incidents-card__badges">
                                <span
                                  className="patient-incidents-badge patient-incidents-badge--severity"
                                  style={{
                                    background: sevStyle.bg,
                                    color: sevStyle.color,
                                    borderColor: sevStyle.border,
                                  }}
                                >
                                  {inc.severity}
                                </span>
                                <span
                                  className="patient-incidents-badge patient-incidents-badge--status"
                                  style={{
                                    background: statStyle.bg,
                                    color: statStyle.color,
                                    borderColor: statStyle.border,
                                  }}
                                >
                                  {statStyle.label}
                                </span>
                              </div>
                            </div>
                            <p className="patient-incidents-card__when">
                              {inc.date} at {inc.time}
                              {inc.reportedBy ? ` · Reported by ${inc.reportedBy}` : ''}
                              {inc.location ? ` · ${inc.location}` : ''}
                            </p>
                            {!isExpanded && inc.description && (
                              <p className="patient-incidents-card__preview">
                                {inc.description.length > 140
                                  ? `${inc.description.slice(0, 140).trim()}…`
                                  : inc.description}
                              </p>
                            )}
                            {!isExpanded && inc.images?.length > 0 && (
                              <span className="patient-incidents-card__photo-count">
                                {inc.images.length} photo{inc.images.length === 1 ? '' : 's'} attached
                              </span>
                            )}
                          </div>
                          <div className="patient-incidents-card__actions">
                            {incidentIdIsPersisted(inc.id) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingIncidentId(inc.id);
                                  setIncidentForm({
                                    date: inc.date,
                                    time: inc.time,
                                    reportedBy: inc.reportedBy || '',
                                    type: inc.type,
                                    severity: inc.severity,
                                    location: inc.location || '',
                                    description: inc.description || '',
                                    immediateAction: inc.immediateAction || '',
                                    witnesses: inc.witnesses || '',
                                    injuryDetails: inc.injuryDetails || '',
                                    followUp: inc.followUp || '',
                                    physicianNotified: Boolean(inc.physicianNotified),
                                    familyNotified: Boolean(inc.familyNotified),
                                  });
                                  setIncidentSaveError('');
                                  setShowIncidentForm(true);
                                  setIncidentFormImagesFromIncident(inc);
                                  setExpandedIncident(inc.id);
                                }}
                                className="patient-incidents-card__text-btn"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteIncident(inc.id); }}
                              disabled={deletingIncidentId === inc.id}
                              className="patient-incidents-card__text-btn patient-incidents-card__text-btn--danger"
                            >
                              {deletingIncidentId === inc.id ? 'Deleting…' : 'Delete'}
                            </button>
                            <span className="patient-incidents-card__toggle">
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="patient-incidents-card__body">
                            <div className="patient-incidents-report">
                              <div className="patient-incidents-report__facts">
                                <div className="patient-incidents-fact">
                                  <span className="patient-incidents-fact__label">Date</span>
                                  <span className="patient-incidents-fact__value">{inc.date}</span>
                                </div>
                                <div className="patient-incidents-fact">
                                  <span className="patient-incidents-fact__label">Time</span>
                                  <span className="patient-incidents-fact__value">{inc.time}</span>
                                </div>
                                <div className="patient-incidents-fact">
                                  <span className="patient-incidents-fact__label">Reported by</span>
                                  <span className="patient-incidents-fact__value">{inc.reportedBy || '—'}</span>
                                </div>
                                <div className="patient-incidents-fact">
                                  <span className="patient-incidents-fact__label">Location</span>
                                  <span className="patient-incidents-fact__value">{inc.location || '—'}</span>
                                </div>
                              </div>

                              <section className="patient-incidents-report__section">
                                <h5 className="patient-incidents-report__heading">What happened</h5>
                                <p className="patient-incidents-report__text">{inc.description}</p>
                              </section>

                              <section className="patient-incidents-report__section patient-incidents-report__section--photos">
                                <IncidentImagesSection
                                  images={inc.images}
                                  title="Photos"
                                  emptyMessage="No photos were uploaded with this report."
                                />
                              </section>

                              {inc.witnesses && (
                                <section className="patient-incidents-report__section patient-incidents-report__section--compact">
                                  <h5 className="patient-incidents-report__heading">Witnesses</h5>
                                  <p className="patient-incidents-report__text">{inc.witnesses}</p>
                                </section>
                              )}

                              {inc.injuryDetails && (
                                <section className="patient-incidents-report__section patient-incidents-report__section--highlight">
                                  <h5 className="patient-incidents-report__heading">Injury details</h5>
                                  <p className="patient-incidents-report__text">{inc.injuryDetails}</p>
                                </section>
                              )}

                              {(inc.immediateAction || inc.followUp) && (
                                <div className="patient-incidents-report__split">
                                  {inc.immediateAction && (
                                    <section className="patient-incidents-report__section">
                                      <h5 className="patient-incidents-report__heading">Immediate action</h5>
                                      <p className="patient-incidents-report__text">{inc.immediateAction}</p>
                                    </section>
                                  )}
                                  {inc.followUp && (
                                    <section className="patient-incidents-report__section">
                                      <h5 className="patient-incidents-report__heading">Follow-up plan</h5>
                                      <p className="patient-incidents-report__text">{inc.followUp}</p>
                                    </section>
                                  )}
                                </div>
                              )}

                              <div className="patient-incidents-report__footer">
                                <span className="patient-incidents-report__notify">
                                  Physician notified
                                  <strong className={inc.physicianNotified ? 'is-yes' : 'is-no'}>
                                    {inc.physicianNotified ? 'Yes' : 'No'}
                                  </strong>
                                </span>
                                <span className="patient-incidents-report__notify">
                                  Family notified
                                  <strong className={inc.familyNotified ? 'is-yes' : 'is-no'}>
                                    {inc.familyNotified ? 'Yes' : 'No'}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {inc.status !== 'resolved' && (
                              <div className="patient-incidents-card__status-actions">
                                {inc.status === 'open' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIncidentStatus(inc.id, 'in-progress')}
                                    disabled={updatingIncidentStatusId === inc.id}
                                    className="patient-incidents-card__status-btn"
                                  >
                                    {updatingIncidentStatusId === inc.id ? 'Updating…' : 'Mark in progress'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateIncidentStatus(inc.id, 'resolved')}
                                  disabled={updatingIncidentStatusId === inc.id}
                                  className="patient-incidents-card__status-btn patient-incidents-card__status-btn--primary"
                                >
                                  {updatingIncidentStatusId === inc.id ? 'Updating…' : 'Mark resolved'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Care Plan Tab ── */}
      {tab === 'careplan' && (
        <div className="patient-care-plan">
          {!!carePlanLoadError && (
            <div
              role="alert"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {carePlanLoadError}
            </div>
          )}
          {!!carePlanToggleError && (
            <div
              role="alert"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fff7ed',
                color: '#9a3412',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {carePlanToggleError}
            </div>
          )}
          {carePlanLoading && carePlanItems.length === 0 && !carePlanLoadError && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--kh-text-muted)' }}>Loading care plan…</p>
          )}
          <div className="patient-care-plan__card">
            <div className="patient-care-plan__card-bar">
              <div className="patient-care-plan__card-head-static">
                <span className="patient-care-plan__card-bar-title">Care plan</span>
                <span className="patient-care-plan__card-bar-meta">
                  <span>{carePlanCompletedCount} done</span>
                  <span className="patient-care-plan__card-bar-dot" aria-hidden>·</span>
                  <span>{carePlanRemainingCount} open</span>
                  <span className="patient-care-plan__card-bar-dot" aria-hidden>·</span>
                  <span>{carePlanHighOpenCount} high</span>
                  <span className="patient-care-plan__card-bar-dot" aria-hidden>·</span>
                  <span>{carePlanProgress}%</span>
                </span>
              </div>
              <button
                type="button"
                className="patient-care-plan__add-btn patient-care-plan__add-btn--toolbar"
                onClick={() => {
                  setCarePlanSaveError('');
                  setShowCarePlanForm(true);
                  setEditingCarePlan(null);
                  setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
                }}
              >
                <FiPlus size={16} strokeWidth={2.25} aria-hidden />
                Add care item
              </button>
            </div>

            <div className="patient-care-plan__card-panel">
              <p className="patient-care-plan__panel-hint">
                Plan and complete recurring tasks for {p.name}. Filter by category and mark items during visits.
              </p>

              <section className="patient-care-plan__progress-card" aria-label="Overall completion">
                <div className="patient-care-plan__progress-top">
                  <span className="patient-care-plan__progress-label">Overall completion</span>
                  <span className="patient-care-plan__progress-pct">{carePlanProgress}%</span>
                </div>
                <div className="patient-care-plan__progress-track">
                  <div
                    className={`patient-care-plan__progress-fill${carePlanProgress === 100 ? ' is-complete' : ''}`}
                    style={{ width: `${carePlanProgress}%` }}
                  />
                </div>
              </section>

              <div className="patient-care-plan__filters" role="tablist" aria-label="Filter by category">
                {['All', ...CARE_CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={carePlanFilter === cat}
                    className={`patient-care-plan__filter-btn${carePlanFilter === cat ? ' is-active' : ''}`}
                    onClick={() => setCarePlanFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="patient-care-plan__list-block">
                <button
                  type="button"
                  className="patient-care-plan__list-toggle"
                  id="care-plan-list-toggle"
                  aria-expanded={carePlanListExpanded}
                  aria-controls="care-plan-tasks-panel"
                  onClick={() => setCarePlanListExpanded((v) => !v)}
                >
                  <FiChevronDown className={`patient-care-plan__list-chevron${carePlanListExpanded ? ' is-open' : ''}`} size={18} aria-hidden />
                  <span className="patient-care-plan__list-toggle-label">
                    Care tasks
                    <span className="patient-care-plan__list-toggle-count">{filteredCarePlanItems.length}</span>
                  </span>
                  <span className="patient-care-plan__list-toggle-hint">{carePlanListExpanded ? 'Hide list' : 'Show list'}</span>
                </button>
                <div
                  id="care-plan-tasks-panel"
                  role="region"
                  aria-labelledby="care-plan-list-toggle"
                  className="patient-care-plan__list-panel"
                  hidden={!carePlanListExpanded}
                >
          {filteredCarePlanItems.length === 0 ? (
            <div className="patient-care-plan__empty">
              <div className="patient-care-plan__empty-icon">
                <FiClipboard size={28} strokeWidth={2} aria-hidden />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>
                No items {carePlanFilter !== 'All' ? 'in this category' : 'yet'}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--kh-text-muted)', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
                Start building this patient&apos;s plan with repeatable tasks. Use categories and priority to organize what matters most at each visit.
              </p>
            </div>
          ) : (
            <ul className="patient-care-plan__list">
              {filteredCarePlanItems.map((item) => {
                const prStyle = getCarePriorityStyle(item.priority);
                return (
                  <li
                    key={item.id}
                    className={`patient-care-plan__task${item.checked ? ' is-done' : ''}`}
                  >
                    <div className="patient-care-plan__task-inner">
                      <button
                        type="button"
                        className={`patient-care-plan__check${item.checked ? ' is-checked' : ''}`}
                        onClick={() => handleToggleCarePlanItem(item.id)}
                        aria-pressed={item.checked}
                        aria-label={item.checked ? `Mark incomplete: ${item.task}` : `Mark complete: ${item.task}`}
                      >
                        {item.checked ? <FiCheckCircle size={15} strokeWidth={2.5} aria-hidden /> : null}
                      </button>
                      <div className="patient-care-plan__task-body">
                        <p className={`patient-care-plan__task-title${item.checked ? ' is-struck' : ''}`}>
                          {item.task}
                        </p>
                        <div className="patient-care-plan__meta">
                          <span className="patient-care-plan__badge patient-care-plan__badge--cat">
                            {item.category}
                          </span>
                          <span className="patient-care-plan__badge patient-care-plan__badge--freq">
                            <FiClock size={11} aria-hidden />
                            {item.frequency}
                          </span>
                          <span
                            className="patient-care-plan__badge"
                            style={{
                              background: prStyle.bg,
                              color: prStyle.color,
                              borderColor: prStyle.border,
                            }}
                          >
                            {item.priority}
                          </span>
                          <span className="patient-care-plan__task-date">Added {item.createdDate}</span>
                        </div>
                        {item.notes ? (
                          <div className="patient-care-plan__notes">{item.notes}</div>
                        ) : null}
                      </div>
                      <div className="patient-care-plan__task-actions">
                        <button
                          type="button"
                          className="patient-care-plan__task-action"
                          title="Edit"
                          onClick={() => handleEditCarePlanItem(item)}
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="patient-care-plan__task-action patient-care-plan__task-action--danger"
                          title="Delete"
                          onClick={() => setConfirmDeleteCarePlan(item)}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
                </div>
              </div>

          {carePlanItems.length > 0 && (
            <footer className="patient-care-plan__footer">
              <div className="patient-care-plan__footer-stats">
                <span><strong style={{ color: '#15803d' }}>{carePlanCompletedCount}</strong> completed</span>
                <span><strong style={{ color: '#c2410c' }}>{carePlanRemainingCount}</strong> remaining</span>
                <span><strong>{carePlanHighOpenCount}</strong> high priority open</span>
              </div>
              <span className={`patient-care-plan__footer-pct${carePlanProgress === 100 ? ' is-complete' : ''}`}>
                {carePlanProgress}% complete
              </span>
            </footer>
          )}
            </div>

          {showCarePlanForm && (
            <div
              className="kh-modal-overlay patient-care-plan-form-overlay"
              style={{ zIndex: 2100 }}
              onClick={() => {
                if (savingCarePlan) return;
                setShowCarePlanForm(false);
                setEditingCarePlan(null);
                setCarePlanSaveError('');
              }}
              role="presentation"
            >
              <div
                className="patient-care-plan__modal-shell"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="care-plan-modal-title"
              >
                <section className="patient-care-plan__composer patient-care-plan__composer--modal" aria-label={editingCarePlan ? 'Edit care item' : 'Add care item'}>
                  <div className="patient-care-plan__composer-head">
                    <div>
                      <h4 className="patient-care-plan__composer-title" id="care-plan-modal-title">
                        {editingCarePlan ? 'Edit care item' : 'New care item'}
                      </h4>
                      <p className="patient-care-plan__composer-hint">
                        {editingCarePlan ? 'Update task details and save changes.' : 'Describe the task, cadence, and priority so the team can execute consistently.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="patient-care-plan__icon-btn"
                      disabled={savingCarePlan}
                      onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); setCarePlanSaveError(''); }}
                      aria-label="Close form"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  <div className="patient-care-plan__composer-body">
                    <div className="patient-care-plan__field">
                      <label className="patient-care-plan__field-label" htmlFor="care-plan-task">Care task *</label>
                      <input
                        id="care-plan-task"
                        className="patient-care-plan__input"
                        type="text"
                        placeholder="e.g. Morning medications after breakfast"
                        value={carePlanForm.task}
                        onChange={(e) => setCarePlanForm((f) => ({ ...f, task: e.target.value }))}
                      />
                    </div>
                    <div className="patient-care-plan__grid3">
                      <div className="patient-care-plan__field">
                        <label className="patient-care-plan__field-label" htmlFor="care-plan-category">Category</label>
                        <select
                          id="care-plan-category"
                          className="patient-care-plan__select"
                          value={carePlanForm.category}
                          onChange={(e) => setCarePlanForm((f) => ({ ...f, category: e.target.value }))}
                        >
                          {CARE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="patient-care-plan__field">
                        <label className="patient-care-plan__field-label" htmlFor="care-plan-frequency">Frequency</label>
                        <select
                          id="care-plan-frequency"
                          className="patient-care-plan__select"
                          value={carePlanForm.frequency}
                          onChange={(e) => setCarePlanForm((f) => ({ ...f, frequency: e.target.value }))}
                        >
                          {CARE_FREQUENCIES.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div className="patient-care-plan__field">
                        <label className="patient-care-plan__field-label" htmlFor="care-plan-priority">Priority</label>
                        <select
                          id="care-plan-priority"
                          className="patient-care-plan__select"
                          value={carePlanForm.priority}
                          onChange={(e) => setCarePlanForm((f) => ({ ...f, priority: e.target.value }))}
                        >
                          {CARE_PRIORITIES.map((pr) => (
                            <option key={pr} value={pr}>{pr}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="patient-care-plan__field">
                      <label className="patient-care-plan__field-label" htmlFor="care-plan-notes">Description / notes</label>
                      <textarea
                        id="care-plan-notes"
                        className="patient-care-plan__textarea"
                        rows={3}
                        placeholder="Instructions, precautions, or escalation criteria…"
                        value={carePlanForm.notes}
                        onChange={(e) => setCarePlanForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                    {!!carePlanSaveError && (
                      <div
                        className="patient-care-plan__field"
                        style={{ color: '#b91c1c', fontSize: 13, fontWeight: 600 }}
                        role="alert"
                      >
                        {carePlanSaveError}
                      </div>
                    )}
                    <div className="patient-care-plan__composer-actions">
                      <button
                        type="button"
                        className="patient-care-plan__btn-secondary"
                        disabled={savingCarePlan}
                        onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); setCarePlanSaveError(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="patient-care-plan__btn-primary"
                        onClick={handleAddCarePlanItem}
                        disabled={savingCarePlan || !carePlanForm.task.trim()}
                      >
                        <FiCheckCircle size={15} aria-hidden />
                        {savingCarePlan ? 'Saving…' : (editingCarePlan ? 'Save changes' : 'Add to plan')}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ── Billing Tab ── */}
      {tab === 'billing' && (
        <PatientBillingTab
          key={billingPatientId || effectivePatientId}
          patientId={billingPatientId || effectivePatientId}
          patientName={p?.name}
          patientRecord={billingPatientRecord}
          profileLoading={profileLoading}
        />
      )}

      {/* ── Care Checklist Status Tab ── */}
      {tab === 'checkliststatus' && (() => {
        const checklistToday = new Date().toISOString().slice(0, 10);
        const summaryTone = selectedDatePercent === 100 ? 'complete' : selectedDatePercent >= 50 ? 'warn' : 'low';
        const completionLbl = getCompletionLabel(selectedDatePercent);
        return (
          <section className="patient-checklist-status" aria-labelledby="patient-checklist-status-title">
            <header className="patient-checklist-status__hero">
              <div className="patient-checklist-status__hero-icon" aria-hidden>
                <FiBarChart2 size={16} />
              </div>
              <div className="patient-checklist-status__hero-text">
                <h2 id="patient-checklist-status-title" className="patient-checklist-status__title">Daily care checklist</h2>
                <p className="patient-checklist-status__subtitle">Completed and pending tasks from the daily care plan API.</p>
              </div>
            </header>

            <div className="patient-checklist-status__date-panel">
              <div className="patient-checklist-status__date-primary">
                <label htmlFor="checklist-status-date" className="patient-checklist-status__date-label">Date</label>
                <input
                  id="checklist-status-date"
                  className="patient-checklist-status__date-input"
                  type="date"
                  value={checklistStatusDate}
                  onChange={e => setChecklistStatusDate(e.target.value)}
                  max={checklistToday}
                />
              </div>
              <div className="patient-checklist-status__day-strip" role="group" aria-label="Last seven days">
                {quickDates.map(qd => {
                  const fd = formatShortDate(qd);
                  const isActive = checklistStatusDate === qd;
                  const hasData = Array.isArray(dailyChecklistByDate[qd]?.items);
                  const qdChecklist = getChecklistForDate(qd);
                  const qdPct = qdChecklist ? Math.round((qdChecklist.filter(i => i.completed).length / qdChecklist.length) * 100) : -1;
                  const dayAbbr = fd.day.slice(0, 3);
                  return (
                    <button
                      key={qd}
                      type="button"
                      className={
                        'patient-checklist-status__day-btn'
                        + (isActive ? ' is-active' : '')
                        + (hasData ? '' : ' is-muted')
                      }
                      onClick={() => setChecklistStatusDate(qd)}
                      aria-pressed={isActive}
                    >
                      <span className="patient-checklist-status__day-main">{dayAbbr} {fd.date}</span>
                      <span
                        className={
                          'patient-checklist-status__day-sub'
                          + (!hasData || qdPct < 0 ? ' is-empty' : '')
                          + (hasData && qdPct >= 0
                            ? (qdPct === 100 ? ' is-full' : qdPct >= 50 ? ' is-mid' : ' is-low')
                            : '')
                        }
                      >
                        {hasData && qdPct >= 0 ? `${qdPct}%` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDailyEntry?.loading && selectedDateChecklist == null ? (
              <div className="patient-checklist-status__empty" role="status">
                <p className="patient-checklist-status__empty-title">Loading checklist…</p>
              </div>
            ) : selectedDailyEntry?.error && selectedDateChecklist == null ? (
              <div className="patient-checklist-status__empty" role="alert">
                <p className="patient-checklist-status__empty-title">{selectedDailyEntry.error}</p>
                <p className="patient-checklist-status__empty-hint">Try another date or refresh the page.</p>
              </div>
            ) : selectedDateChecklist ? (
              <>
                <div className="patient-checklist-status__card patient-checklist-status__summary">
                  <div className="patient-checklist-status__summary-main">
                    <div className={`patient-checklist-status__ring patient-checklist-status__ring--${summaryTone}`}>
                      <svg className="patient-checklist-status__ring-svg" width="58" height="58" viewBox="0 0 64 64" aria-hidden>
                        <circle className="patient-checklist-status__ring-track" cx="32" cy="32" r="28" />
                        <circle
                          className="patient-checklist-status__ring-fill"
                          cx="32" cy="32" r="28"
                          strokeDasharray={`${(selectedDatePercent / 100) * 175.9} 175.9`}
                          transform="rotate(-90 32 32)"
                        />
                      </svg>
                      <span className="patient-checklist-status__ring-label">{selectedDatePercent}%</span>
                    </div>
                    <div className="patient-checklist-status__summary-copy">
                      <p className="patient-checklist-status__summary-date">
                        {checklistStatusDate === checklistToday ? 'Today' : checklistStatusDate}
                        {checklistStatusDate === checklistToday && (
                          <span className="patient-checklist-status__summary-date-sub">{checklistStatusDate}</span>
                        )}
                      </p>
                      <span
                        className="patient-checklist-status__pill"
                        style={{
                          background: completionLbl.bg,
                          color: completionLbl.color,
                          borderColor: completionLbl.border,
                        }}
                      >
                        {completionLbl.text}
                      </span>
                    </div>
                  </div>
                  <ul className="patient-checklist-status__stats" aria-label="Completion counts">
                    <li className="patient-checklist-status__stat">
                      <span className="patient-checklist-status__stat-value patient-checklist-status__stat-value--ok">{selectedDateCompleted}</span>
                      <span className="patient-checklist-status__stat-label">Done</span>
                    </li>
                    <li className="patient-checklist-status__stat">
                      <span className="patient-checklist-status__stat-value patient-checklist-status__stat-value--miss">{selectedDateTotal - selectedDateCompleted}</span>
                      <span className="patient-checklist-status__stat-label">Missed</span>
                    </li>
                    <li className="patient-checklist-status__stat">
                      <span className="patient-checklist-status__stat-value">{selectedDateTotal}</span>
                      <span className="patient-checklist-status__stat-label">Total</span>
                    </li>
                  </ul>
                  <div className={`patient-checklist-status__bar-track patient-checklist-status__bar-track--${summaryTone}`}>
                    <div
                      className="patient-checklist-status__bar-fill"
                      style={{ width: `${selectedDatePercent}%` }}
                    />
                  </div>
                </div>

                <div className="patient-checklist-status__card patient-checklist-status__tasks-card">
                  <header className="patient-checklist-status__tasks-head">
                    <h3 className="patient-checklist-status__tasks-title">Completed daily care plans</h3>
                    <span className="patient-checklist-status__tasks-meta">{selectedDateCompleted}/{selectedDateTotal} completed</span>
                  </header>
                  {selectedDateCompletedItems.length > 0 ? (
                    <ul className="patient-checklist-status__task-list patient-checklist-status__task-list--completed">
                      {selectedDateCompletedItems.map((item) => {
                        const prStyle = getCarePriorityStyle(item.priority);
                        return (
                          <li
                            key={`done-${item.id}`}
                            className="patient-checklist-status__task-row is-done"
                          >
                            <div className="patient-checklist-status__task-icon is-done" aria-hidden>
                              <FiCheckCircle size={12} />
                            </div>
                            <div className="patient-checklist-status__task-body">
                              <p className="patient-checklist-status__task-name">{item.task}</p>
                              <div className="patient-checklist-status__task-tags">
                                <span className="patient-checklist-status__tag patient-checklist-status__tag--cat">{item.category}</span>
                                <span className="patient-checklist-status__tag patient-checklist-status__tag--freq">
                                  <FiClock size={10} aria-hidden /> {item.frequency}
                                </span>
                                <span
                                  className="patient-checklist-status__tag patient-checklist-status__tag--pri"
                                  style={{ background: prStyle.bg, color: prStyle.color, borderColor: prStyle.border }}
                                >
                                  {item.priority}
                                </span>
                              </div>
                            </div>
                            <div className="patient-checklist-status__task-aside">
                              <span className="patient-checklist-status__aside-status patient-checklist-status__aside-status--ok">Completed</span>
                              {item.completedAt ? (
                                <span className="patient-checklist-status__aside-line">
                                  <FiClock size={10} aria-hidden /> {item.completedAt}
                                </span>
                              ) : null}
                              {item.completedBy ? (
                                <span className="patient-checklist-status__aside-line">
                                  <FiUser size={10} aria-hidden /> {item.completedBy}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="patient-checklist-status__tasks-empty">No completed tasks for this date.</p>
                  )}
                </div>

                {selectedDateChecklist.some((item) => !item.completed) ? (
                <div className="patient-checklist-status__card patient-checklist-status__tasks-card">
                  <header className="patient-checklist-status__tasks-head">
                    <h3 className="patient-checklist-status__tasks-title">Pending tasks</h3>
                    <span className="patient-checklist-status__tasks-meta">{selectedDateTotal - selectedDateCompleted} remaining</span>
                  </header>
                  <ul className="patient-checklist-status__task-list">
                    {selectedDateChecklist.filter((item) => !item.completed).map(item => {
                      const prStyle = getCarePriorityStyle(item.priority);
                      return (
                        <li
                          key={item.id}
                          className={`patient-checklist-status__task-row${item.completed ? ' is-done' : ''}`}
                        >
                          <div className={`patient-checklist-status__task-icon${item.completed ? ' is-done' : ' is-miss'}`} aria-hidden>
                            {item.completed ? <FiCheckCircle size={12} /> : <FiX size={11} />}
                          </div>
                          <div className="patient-checklist-status__task-body">
                            <p className="patient-checklist-status__task-name">{item.task}</p>
                            <div className="patient-checklist-status__task-tags">
                              <span className="patient-checklist-status__tag patient-checklist-status__tag--cat">
                                {item.category}
                              </span>
                              <span className="patient-checklist-status__tag patient-checklist-status__tag--freq">
                                <FiClock size={10} aria-hidden /> {item.frequency}
                              </span>
                              <span
                                className="patient-checklist-status__tag patient-checklist-status__tag--pri"
                                style={{
                                  background: prStyle.bg,
                                  color: prStyle.color,
                                  borderColor: prStyle.border,
                                }}
                              >
                                {item.priority}
                              </span>
                            </div>
                          </div>
                          <div className="patient-checklist-status__task-aside">
                            {item.completed ? (
                              <>
                                <span className="patient-checklist-status__aside-status patient-checklist-status__aside-status--ok">Completed</span>
                                <span className="patient-checklist-status__aside-line">
                                  <FiClock size={10} aria-hidden /> {item.completedAt}
                                </span>
                                <span className="patient-checklist-status__aside-line">
                                  <FiUser size={10} aria-hidden /> {item.completedBy}
                                </span>
                              </>
                            ) : (
                              <span className="patient-checklist-status__aside-status patient-checklist-status__aside-status--miss">Missed</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                ) : null}

                <div className="patient-checklist-status__card patient-checklist-status__trend-card">
                  <h3 className="patient-checklist-status__trend-title">7-day trend</h3>
                  <div className="patient-checklist-status__trend-chart" role="group" aria-label="Select day on chart">
                    {[...quickDates].reverse().map(qd => {
                      const qdData = getChecklistForDate(qd);
                      const qdPct = qdData ? Math.round((qdData.filter(i => i.completed).length / qdData.length) * 100) : 0;
                      const fd = formatShortDate(qd);
                      const isSelected = checklistStatusDate === qd;
                      const trendTone = qdPct === 100 ? 'full' : qdPct >= 50 ? 'mid' : qdPct > 0 ? 'low' : 'empty';
                      return (
                        <button
                          key={qd}
                          type="button"
                          className={`patient-checklist-status__trend-col${isSelected ? ' is-selected' : ''}`}
                          onClick={() => setChecklistStatusDate(qd)}
                          aria-pressed={isSelected}
                          aria-label={`${fd.day} ${fd.date}: ${qdData ? `${qdPct}% complete` : 'no data'}`}
                        >
                          <span
                            className={`patient-checklist-status__trend-pct patient-checklist-status__trend-pct--${trendTone}`}
                          >
                            {qdData ? `${qdPct}%` : '—'}
                          </span>
                          <span
                            className={`patient-checklist-status__trend-bar patient-checklist-status__trend-bar--${trendTone}${isSelected ? ' is-selected' : ''}`}
                            style={{ height: `${Math.max(qdPct * 0.48, 4)}px` }}
                          />
                          <span className="patient-checklist-status__trend-label">{fd.day} {fd.date}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="patient-checklist-status__empty" role="status">
                <FiCalendar className="patient-checklist-status__empty-icon" size={32} aria-hidden />
                <p className="patient-checklist-status__empty-title">No checklist for this date</p>
                <p className="patient-checklist-status__empty-hint">Choose another day or use the chips above when data exists.</p>
              </div>
            )}
          </section>
        );
      })()}

          </div>
        </div>
          </main>
        </div>
      </div>

      {showGenerateReportModal && (
        <div
          className="kh-modal-overlay app-modal-overlay"
          style={{ zIndex: 10000, padding: 16 }}
          onClick={() => { if (!generateReportSubmitting) setShowGenerateReportModal(false); }}
          role="presentation"
        >
          <div
            className="kh-modal-panel app-modal-panel patient-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-generate-report-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kh-modal-header patient-report-modal__header">
              <div className="patient-report-modal__title-wrap">
                <span className="patient-report-modal__icon" aria-hidden>
                  <FiFileText size={17} />
                </span>
                <span id="patient-generate-report-title">Generating report</span>
              </div>
              <button
                type="button"
                className="patient-update-modal__close-btn patient-report-modal__close-btn"
                aria-label="Close"
                onClick={() => { if (!generateReportSubmitting) setShowGenerateReportModal(false); }}
                disabled={generateReportSubmitting}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="kh-modal-body patient-report-modal__body">
              {generateReportSubmitting && (
                <div className="patient-report-modal__loader" role="status" aria-live="polite">
                  <div className="spinner-border text-primary patient-report-modal__spinner" aria-hidden />
                </div>
              )}
              {!generateReportSubmitting && generateReportDone && !generateReportError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, y: 6 }}
                  animate={{ opacity: 1, scale: [0.8, 1.14, 1], y: [6, -2, 0] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    margin: '2px auto 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.08) 60%, rgba(34,197,94,0) 100%)',
                  }}
                  aria-hidden
                >
                  <FiCheckCircle size={44} style={{ color: '#16a34a' }} />
                </motion.div>
              )}
              <p className="patient-report-modal__message">
                {generateReportSubmitting
                  ? 'Patient Month Health Report Generating , please wait untill report is generated and view the report on the Reports session'
                  : generateReportError
                    ? generateReportError
                    : generateReportDone
                      ? 'Patient medical report generated successfully. You can now view it in the Reports session.'
                      : 'Ready to generate patient medical report.'}
              </p>
            </div>
            <div className="kh-modal-footer patient-report-modal__footer">
              <p className="patient-report-modal__disclaimer">
                Disclaimer: This Patient Health Report is an AI-generated summary derived from medical records and nursing documentation. Clinical staff must review and validate all findings for accuracy before distribution or inclusion in the final medical record.
              </p>
              <div className="patient-report-modal__actions">
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  style={{ borderRadius: 12, fontWeight: 700, padding: '10px 18px' }}
                  onClick={() => setShowGenerateReportModal(false)}
                  disabled={generateReportSubmitting}
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportDeathModal && (
        <div
          className="kh-modal-overlay app-modal-overlay"
          style={{ zIndex: 10001, padding: 16 }}
          onClick={() => { if (!reportDeathSubmitting) setShowReportDeathModal(false); }}
          role="presentation"
        >
          <div
            className="kh-modal-panel app-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-death-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(560px, 94vw)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div className="kh-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
              <div className="d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 800, color: 'var(--kh-text)' }}>
                <FiAlertTriangle size={18} style={{ color: '#b45309' }} aria-hidden />
                <span id="report-death-title">Report death</span>
              </div>
              <button
                type="button"
                className="patient-update-modal__close-btn"
                aria-label="Close"
                disabled={reportDeathSubmitting}
                onClick={() => { if (!reportDeathSubmitting) setShowReportDeathModal(false); }}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="kh-modal-body" style={{ padding: '20px 22px', maxHeight: 'min(72vh, 640px)', overflowY: 'auto' }}>
              {reportDeathDone ? (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <FiCheckCircle size={24} style={{ color: '#16a34a', flexShrink: 0 }} aria-hidden />
                  <div>
                    <p style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: 'var(--kh-text)' }}>Report submitted</p>
                    <p style={{ margin: '10px 0 0', fontSize: 13.5, color: 'var(--kh-text-muted)', lineHeight: 1.55 }}>
                      The death report for <strong>{p?.name || 'this patient'}</strong> has been sent. Continue with statutory notifications, care handover, and records per your organisation’s policies.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#4b5563', lineHeight: 1.55 }}>
                    Complete this record only after death has been verified appropriately. Fields marked <span aria-hidden>*</span> are required.
                  </p>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }} htmlFor="report-death-patient">Patient</label>
                      <input id="report-death-patient" className="form-control form-control-kh" readOnly disabled value={p?.name ? `${p.name} (${String(effectivePatientId || '').trim()})` : String(effectivePatientId || '').trim() || '—'} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }} htmlFor="report-death-date">Date of death *</label>
                      <input
                        id="report-death-date"
                        type="date"
                        className="form-control form-control-kh"
                        value={reportDeathForm.dateOfDeath}
                        onChange={(e) => setReportDeathForm((prev) => ({ ...prev, dateOfDeath: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }} htmlFor="report-death-time">Time of death</label>
                      <input
                        id="report-death-time"
                        type="time"
                        className="form-control form-control-kh"
                        value={reportDeathForm.timeOfDeath}
                        onChange={(e) => setReportDeathForm((prev) => ({ ...prev, timeOfDeath: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }} htmlFor="report-death-place">Place of death</label>
                      <input
                        id="report-death-place"
                        className="form-control form-control-kh"
                        placeholder="e.g. home, hospital name, hospice"
                        value={reportDeathForm.placeOfDeath}
                        onChange={(e) => setReportDeathForm((prev) => ({ ...prev, placeOfDeath: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }} htmlFor="report-death-cause">Cause or circumstances (if appropriate to record here)</label>
                      <textarea
                        id="report-death-cause"
                        className="form-control form-control-kh"
                        rows={3}
                        placeholder="Brief factual summary as allowed by your policy…"
                        value={reportDeathForm.causeOrCircumstances}
                        onChange={(e) => setReportDeathForm((prev) => ({ ...prev, causeOrCircumstances: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }} htmlFor="report-death-notes">Additional notes</label>
                      <textarea
                        id="report-death-notes"
                        className="form-control form-control-kh"
                        rows={3}
                        placeholder="Family present, GP notified, equipment returned, etc."
                        value={reportDeathForm.notes}
                        onChange={(e) => setReportDeathForm((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check" style={{ paddingLeft: 0 }}>
                        <label className="d-flex gap-2 align-items-start" style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            className="form-check-input mt-1 flex-shrink-0"
                            checked={reportDeathForm.nextOfKinNotified}
                            onChange={(e) => setReportDeathForm((prev) => ({ ...prev, nextOfKinNotified: e.target.checked }))}
                            style={{ width: '1.1rem', height: '1.1rem' }}
                          />
                          <span>Next of kin (or appropriate contact) has been notified, or notification is in progress per procedure.</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-check" style={{ paddingLeft: 0 }}>
                        <label className="d-flex gap-2 align-items-start" style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            className="form-check-input mt-1 flex-shrink-0"
                            checked={reportDeathForm.confirmedProcedure}
                            onChange={(e) => setReportDeathForm((prev) => ({ ...prev, confirmedProcedure: e.target.checked }))}
                            style={{ width: '1.1rem', height: '1.1rem' }}
                          />
                          <span>I confirm this report is accurate and complies with my organisation’s procedures. *</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {reportDeathError && (
                    <div
                      style={{
                        marginTop: 14,
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.45,
                      }}
                      role="alert"
                    >
                      {reportDeathError}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="kh-modal-footer" style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              {reportDeathDone ? (
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  style={{ borderRadius: 10, fontWeight: 700, padding: '10px 18px' }}
                  onClick={() => setShowReportDeathModal(false)}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="destructive-confirm-dialog__btn-cancel"
                    disabled={reportDeathSubmitting}
                    onClick={() => { if (!reportDeathSubmitting) setShowReportDeathModal(false); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="destructive-confirm-dialog__btn-danger"
                    disabled={reportDeathSubmitting}
                    onClick={submitReportDeath}
                  >
                    {reportDeathSubmitting ? 'Submitting…' : 'Submit report'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div
          className="kh-modal-overlay"
          style={{
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => { if (!savingProfileUpdate) setShowUpdateModal(false); }}
        >
          <div
            onClick={event => event.stopPropagation()}
            className="kh-modal-panel"
            style={{
              width: 'min(1120px, 96vw)',
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="kh-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--kh-text)' }}>Edit Patient Data</div>
              </div>
              <button onClick={() => { if (!savingProfileUpdate) setShowUpdateModal(false); }} className="patient-update-modal__close-btn" style={{ cursor: savingProfileUpdate ? 'not-allowed' : 'pointer' }}>
                <FiX size={18} />
              </button>
            </div>

            <div className="kh-modal-body" style={{ overflowY: 'auto' }}>
              {profileUpdateError && (
                <div style={{ marginBottom: 12, borderRadius: 4, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
                  {profileUpdateError}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12"><h6 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#2E7DB8' }}>Personal Info</h6></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Patient ID</label><input disabled className="form-control form-control-kh" value={getProfileUpdateValue('patientId') || ''} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Registration Number</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.registrationNumber') || ''} onChange={event => setProfileUpdateField('personalInfo.registrationNumber', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Date of Assessment</label><input type="date" className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.dateOfAssessment') || ''} onChange={event => setProfileUpdateField('personalInfo.dateOfAssessment', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Date of Admission</label><input type="date" className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.dateOfAdmission') || ''} onChange={event => setProfileUpdateField('personalInfo.dateOfAdmission', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>First Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.firstName') || ''} onChange={event => setProfileUpdateField('personalInfo.firstName', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Last Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.lastName') || ''} onChange={event => setProfileUpdateField('personalInfo.lastName', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Preferred Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.preferredName') || ''} onChange={event => setProfileUpdateField('personalInfo.preferredName', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Contact Number</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.contactNumber') || ''} onChange={event => setProfileUpdateField('personalInfo.contactNumber', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Date of Birth</label><input type="date" className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.dateOfBirth') || ''} onChange={event => setProfileUpdateField('personalInfo.dateOfBirth', event.target.value)} /></div>
                <div className="col-md-1"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Age</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.age') || ''} onChange={event => setProfileUpdateField('personalInfo.age', event.target.value)} /></div>
                <div className="col-md-2"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Gender</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.gender') || ''} onChange={event => setProfileUpdateField('personalInfo.gender', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>GPS Code</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.gpsCode') || ''} onChange={event => setProfileUpdateField('personalInfo.gpsCode', event.target.value)} /></div>
                <div className="col-md-6"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Email</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.email') || ''} onChange={event => setProfileUpdateField('personalInfo.email', event.target.value)} /></div>
                <div className="col-12"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Residential Address</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.residentialAddress') || ''} onChange={event => setProfileUpdateField('personalInfo.residentialAddress', event.target.value)} /></div>

                <div className="col-12"><hr style={{ margin: '4px 0', opacity: 0.12 }} /></div>
                <div className="col-12"><h6 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#2E7DB8' }}>Next of Kin / Doctor</h6></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Full Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.fullName') || ''} onChange={event => setProfileUpdateField('nextOfKin.fullName', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Relationship</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.relationship') || ''} onChange={event => setProfileUpdateField('nextOfKin.relationship', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Spiritual Need</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.spiritualNeed') || ''} onChange={event => setProfileUpdateField('nextOfKin.spiritualNeed', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Contact One</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.contactOne') || ''} onChange={event => setProfileUpdateField('nextOfKin.contactOne', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Contact Two</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.contactTwo') || ''} onChange={event => setProfileUpdateField('nextOfKin.contactTwo', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Personal Doctor</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.personalDoctor') || ''} onChange={event => setProfileUpdateField('nextOfKin.personalDoctor', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Doctor Contact</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.personalDoctorContact') || ''} onChange={event => setProfileUpdateField('nextOfKin.personalDoctorContact', event.target.value)} /></div>
                <div className="col-12"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Doctor Facility</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.personalDoctorFacility') || ''} onChange={event => setProfileUpdateField('nextOfKin.personalDoctorFacility', event.target.value)} /></div>

                <div className="col-12"><hr style={{ margin: '4px 0', opacity: 0.12 }} /></div>
                <div className="col-12"><h6 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#2E7DB8' }}>Clinical Quick Update</h6></div>
                {renderBoolControl('Client Handbook Given', 'admissionChecklist.clientHandBookGiven')}
                {renderBoolControl('Infection Supplies', 'admissionChecklist.infectionControlSupplies')}
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Admitting Nurse</label><input className="form-control form-control-kh" value={getProfileUpdateValue('admissionChecklist.admittingNurse') || ''} onChange={event => setProfileUpdateField('admissionChecklist.admittingNurse', event.target.value)} /></div>
                {renderBoolControl('Any Medical History', 'medicalHistory.anyMedicalHistory')}
                <div className="col-md-8"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Medical History Description</label><input className="form-control form-control-kh" value={getProfileUpdateValue('medicalHistory.medicalHistoryDescription') || ''} onChange={event => setProfileUpdateField('medicalHistory.medicalHistoryDescription', event.target.value)} /></div>
                {renderBoolControl('Communication Needs', 'communicationStyle.anyCommunicationNeeds')}
                {renderBoolControl('Hearing Needs', 'communicationStyle.anyHearingNeeds')}
                {renderBoolControl('Speech Impairment', 'communicationStyle.anySpeechImpairment')}
                {renderBoolControl('Visual Impairment', 'communicationStyle.anyVisualImpairment')}
                {renderBoolControl('Understanding Difficulties', 'communicationStyle.anyUnderstandingDifficulties')}
                {renderBoolControl('Diabetes', 'infectionControl.anyDiabetes')}
                {renderBoolControl('Breathing Difficulty', 'breathPain.anyBreathingDifficulties')}
                {renderBoolControl('Pain Present', 'breathPain.painPresent')}
                {renderBoolControl('Analgesia Prescribed', 'breathPain.anagelsiaPrescribed')}
                {renderBoolControl('Open Wounds', 'skinMobility.skinIntegrity.openWounds')}
                {renderBoolControl('Pressure Ulcer', 'skinMobility.skinIntegrity.pressureUlcer')}
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Pain Location</label><input className="form-control form-control-kh" value={getProfileUpdateValue('breathPain.locationOfPain') || ''} onChange={event => setProfileUpdateField('breathPain.locationOfPain', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Pain Score</label><input className="form-control form-control-kh" value={getProfileUpdateValue('breathPain.painScore') || ''} onChange={event => setProfileUpdateField('breathPain.painScore', event.target.value)} /></div>
              </div>
            </div>

            <div className="kh-modal-footer patient-update-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowUpdateModal(false)} disabled={savingProfileUpdate} className="patient-update-modal__action-btn patient-update-modal__action-btn--secondary" style={{ cursor: savingProfileUpdate ? 'not-allowed' : 'pointer' }}>
                Cancel
              </button>
              <button onClick={submitProfileUpdates} disabled={savingProfileUpdate} className="patient-update-modal__action-btn patient-update-modal__action-btn--primary" style={{ cursor: savingProfileUpdate ? 'not-allowed' : 'pointer', opacity: savingProfileUpdate ? 0.75 : 1 }}>
                {savingProfileUpdate ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Care Plan Item Modal ── */}
      {confirmDeleteCarePlan && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (deletingCarePlanId) return;
            setConfirmDeleteCarePlan(null);
            setCarePlanDeleteError('');
          }}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destructive-careplan-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="destructive-careplan-title" className="destructive-confirm-dialog__title">
                Delete care plan item
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={Boolean(deletingCarePlanId)}
                onClick={() => {
                  if (deletingCarePlanId) return;
                  setConfirmDeleteCarePlan(null);
                  setCarePlanDeleteError('');
                }}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete this care plan item? It will be removed from the server and this
                patient&apos;s checklist.
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> The task and its description will be
                  permanently deleted.
                </div>
              </div>

              {carePlanDeleteError && (
                <div className="destructive-confirm-dialog__banner-error">{carePlanDeleteError}</div>
              )}

              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiClipboard size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{confirmDeleteCarePlan.task}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {confirmDeleteCarePlan.category} · {confirmDeleteCarePlan.frequency} · {confirmDeleteCarePlan.priority}{' '}
                    priority
                    {/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(confirmDeleteCarePlan.id || '')) ? (
                      <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                        ID {String(confirmDeleteCarePlan.id)}
                      </span>
                    ) : null}
                  </div>
                  {confirmDeleteCarePlan.notes ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                      {String(confirmDeleteCarePlan.notes).length > 200
                        ? `${String(confirmDeleteCarePlan.notes).slice(0, 200)}…`
                        : confirmDeleteCarePlan.notes}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={Boolean(deletingCarePlanId)}
                onClick={() => {
                  setConfirmDeleteCarePlan(null);
                  setCarePlanDeleteError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={Boolean(deletingCarePlanId)}
                onClick={handleDeleteCarePlanItem}
              >
                {deletingCarePlanId ? 'Deleting…' : 'Delete care plan item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal (incident report) ── */}
      {confirmDeleteIncident && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (incidentDeleteDialogBusy) return;
            setConfirmDeleteIncident(null);
            setIncidentDeleteModalError('');
          }}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destructive-incident-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="destructive-incident-title" className="destructive-confirm-dialog__title">
                Delete incident report
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={incidentDeleteDialogBusy}
                onClick={() => {
                  if (incidentDeleteDialogBusy) return;
                  setConfirmDeleteIncident(null);
                  setIncidentDeleteModalError('');
                }}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete this incident report? This removes it from the patient’s safety record.
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> The incident will be removed from the server and will no longer appear in this list or timeline.
                </div>
              </div>

              {incidentDeleteModalError && (
                <div className="destructive-confirm-dialog__banner-error">{incidentDeleteModalError}</div>
              )}

              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiAlertTriangle size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">
                    {pendingDeleteIncidentDetail?.type || 'Incident'}{' '}
                    <span style={{ fontWeight: 600, color: '#6b7280' }}>
                      · {pendingDeleteIncidentDetail?.severity || '—'}
                    </span>
                  </div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {pendingDeleteIncidentDetail
                      ? `${pendingDeleteIncidentDetail.date || '—'} at ${pendingDeleteIncidentDetail.time || '—'} · ${getIncidentStatusStyle(pendingDeleteIncidentDetail.status).label}`
                      : `ID ${String(confirmDeleteIncident.id).slice(0, 8)}…`}
                  </div>
                  {pendingDeleteIncidentDetail?.description ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                      {String(pendingDeleteIncidentDetail.description).length > 200
                        ? `${String(pendingDeleteIncidentDetail.description).slice(0, 200)}…`
                        : pendingDeleteIncidentDetail.description}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={incidentDeleteDialogBusy}
                onClick={() => {
                  setConfirmDeleteIncident(null);
                  setIncidentDeleteModalError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={incidentDeleteDialogBusy}
                onClick={confirmDeleteIncidentAction}
              >
                {incidentDeleteDialogBusy ? 'Deleting…' : 'Delete incident report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal (medication) ── */}
      {confirmDelete && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={() => !deletingMedication && setConfirmDelete(null)}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destructive-med-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="destructive-med-title" className="destructive-confirm-dialog__title">
                Delete medication
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={deletingMedication}
                onClick={() => setConfirmDelete(null)}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete the following medication from this patient?
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> Deleting this medication removes it from the
                  patient profile. Dosing history, reminders tied to this drug, and related context may be{' '}
                  <strong>permanently lost</strong>.
                </div>
              </div>

              {medicationDeleteError && (
                <div className="destructive-confirm-dialog__banner-error">{medicationDeleteError}</div>
              )}

              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiActivity size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{confirmDelete.name}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {confirmDelete.type === 'existing' ? 'On file · saved medication record' : 'Draft · not yet saved to server'}
                  </div>
                </div>
                <button
                  type="button"
                  className="destructive-confirm-dialog__card-action"
                  disabled={deletingMedication}
                  aria-label={medNameCopied ? 'Medication name copied' : 'Copy medication name'}
                  onClick={copyMedicationNameForDelete}
                >
                  <FiClipboard size={14} />
                  {medNameCopied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <label className="destructive-confirm-dialog__input-label" htmlFor="med-delete-confirm-input">
                To delete, type the medication name <strong>{confirmDelete.name}</strong> below
              </label>
              <div className="destructive-confirm-dialog__input-wrap">
                <span className="destructive-confirm-dialog__input-icon destructive-confirm-dialog__input-icon--danger" aria-hidden>
                  <FiTrash2 size={16} />
                </span>
                <input
                  id="med-delete-confirm-input"
                  className="destructive-confirm-dialog__input"
                  autoComplete="off"
                  disabled={deletingMedication}
                  placeholder={`Enter ${confirmDelete.name}`}
                  value={medDeleteConfirmInput}
                  onChange={(e) => {
                    setMedDeleteConfirmInput(e.target.value);
                    if (medicationDeleteError) setMedicationDeleteError('');
                  }}
                />
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={deletingMedication}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={
                  deletingMedication || medDeleteConfirmInput.trim() !== String(confirmDelete.name || '').trim()
                }
                onClick={confirmDeleteMed}
              >
                {deletingMedication ? 'Deleting…' : 'Yes, delete medication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
