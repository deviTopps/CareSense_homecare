import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import { apiFetch, getUser } from '../api';
import {
  resolveAlertViaApi,
  updateAlertStatusViaApi,
  fetchPatientResolvedAlerts,
  fetchAllResolvedAlerts,
  fetchAlertsOptionalPath,
} from '../utils/alerts';
import { extractCaseImageAttachment } from '../utils/alertMapping';
import CaseAttachedImageSection from '../components/CaseAttachedImageSection';
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

function coerceNonEmptyStr(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s || null;
}

/** Build display name from a person-like object (patient, client, populated ref, etc.). */
function nameFromPersonObject(p) {
  if (!p || typeof p !== 'object') return null;
  const fn = coerceNonEmptyStr(pickFirst(p, ['firstName', 'first_name', 'givenName', 'forename']));
  const ln = coerceNonEmptyStr(pickFirst(p, ['lastName', 'last_name', 'familyName', 'surname']));
  const combined = [fn, ln].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  const single = coerceNonEmptyStr(pickFirst(p, [
    'fullName', 'full_name', 'displayName', 'display_name',
    'name', 'patientName', 'patient_name', 'label', 'preferredName',
  ]));
  return single;
}

function patientDisplayName(a) {
  const o = a && typeof a === 'object' ? a : {};

  const topStringName = coerceNonEmptyStr(pickFirst(o, [
    'patientName', 'patient_name', 'patientFullName', 'fullPatientName',
    'clientName', 'client_name', 'serviceUserName', 'service_user_name',
    'subjectName', 'subject_name', 'personName', 'person_name',
  ]));
  if (topStringName) return topStringName;

  if (typeof o.patient === 'string') {
    const s = coerceNonEmptyStr(o.patient);
    if (s) return s;
  }

  const nestedObjects = [
    o.patient,
    o.patientInfo,
    o.patient_info,
    o.patientData,
    o.patient_data,
    o.patientRecord,
    o.patient_record,
    o.relatedPatient,
    o.related_patient,
    o.careRecipient,
    o.care_recipient,
    o.client,
    o.serviceUser,
    o.service_user,
    o.subject,
    o.person,
    o.user,
  ];
  for (const obj of nestedObjects) {
    if (obj && typeof obj === 'object') {
      const n = nameFromPersonObject(obj);
      if (n) return n;
    }
  }

  if (o.data && typeof o.data === 'object') {
    const d = o.data;
    const inner = pickFirst(d, ['patient', 'patientInfo', 'patient_info']);
    if (typeof inner === 'string') {
      const s = coerceNonEmptyStr(inner);
      if (s) return s;
    }
    if (inner && typeof inner === 'object') {
      const n = nameFromPersonObject(inner);
      if (n) return n;
    }
    const dn = coerceNonEmptyStr(pickFirst(d, ['patientName', 'patient_name', 'fullName']));
    if (dn) return dn;
  }

  if (o.metadata && typeof o.metadata === 'object') {
    const md = coerceNonEmptyStr(pickFirst(o.metadata, ['patientName', 'patient_name', 'fullName', 'name']));
    if (md) return md;
    if (o.metadata.patient && typeof o.metadata.patient === 'object') {
      const n = nameFromPersonObject(o.metadata.patient);
      if (n) return n;
    }
  }

  const uuidOnly = coerceNonEmptyStr(pickFirst(o, ['patientUuid', 'patient_uuid']));
  if (uuidOnly) return `Patient (${uuidOnly.slice(0, 8)}…)`;

  const pid = o.patientId;
  if (pid && typeof pid === 'object') {
    const n = nameFromPersonObject(pid);
    if (n) return n;
  }

  return 'Unknown patient';
}

function patientIdFrom(a) {
  const o = a && typeof a === 'object' ? a : {};

  const fromPerson = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const raw = pickFirst(obj, ['patientId', 'patient_id', 'id', '_id', 'registrationNumber', 'nhsNumber', 'nhs_number']);
    if (raw != null && raw !== '') return String(raw);
    return '';
  };

  let s = fromPerson(o.patient);
  if (s) return s;

  const pidTop = pickFirst(o, ['patientId', 'patient_id', 'patientUuid', 'patient_uuid']);
  if (pidTop != null && typeof pidTop !== 'object') return String(pidTop).trim();
  if (pidTop && typeof pidTop === 'object') return fromPerson(pidTop);

  if (o.data && typeof o.data === 'object') {
    s = fromPerson(o.data.patient);
    if (s) return s;
    const pidD = pickFirst(o.data, ['patientId', 'patient_id']);
    if (pidD != null && typeof pidD !== 'object') return String(pidD);
    if (pidD && typeof pidD === 'object') return fromPerson(pidD);
  }

  return '';
}

function normalizeSeverity(raw) {
  const v = String(raw ?? '').toLowerCase().trim();
  if (['critical', 'high', 'medium', 'low'].includes(v)) {
    return v === 'low' ? 'medium' : v;
  }
  if (v === 'severe' || v === 'urgent') return 'critical';
  if (v === 'warn' || v === 'warning') return 'high';
  if (v === 'high-risk' || v === 'highrisk') return 'high';
  return 'medium';
}

function normalizeCaseStatus(raw) {
  let v = String(raw ?? 'open').toLowerCase().trim().replace(/_/g, '-');
  const compact = v.replace(/[\s-]+/g, '');
  if (compact === 'inprogress') return 'in-progress';
  if (['investigating', 'assigned', 'processing', 'acknowledged', 'handling'].includes(compact)) {
    return 'in-progress';
  }
  if (v === 'in progress') v = 'in-progress';
  if (v === 'pending' || v === 'active') v = 'open';
  if (v === 'closed' || v === 'completed') v = 'resolved';
  if (['open', 'in-progress', 'resolved'].includes(v)) return v;
  return 'open';
}

function extractAlertsArray(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  /** Common list keys on root and under `data` (resolved endpoint shapes vary by backend). */
  const listKeys = ['alerts', 'items', 'results', 'resolvedAlerts', 'resolved', 'history', 'records', 'rows', 'documents'];
  for (const k of listKeys) {
    if (Array.isArray(json[k])) return json[k];
  }
  const d = json.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    for (const k of listKeys) {
      if (Array.isArray(d[k])) return d[k];
    }
  }
  return [];
}

function coerceAlertNote(raw, fallback = '—') {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    const s = String(raw).trim();
    return s || fallback;
  }
  if (typeof raw === 'object') {
    const nested = raw.message ?? raw.msg ?? raw.text ?? raw.description ?? raw.reason;
    if (nested != null && String(nested).trim()) return String(nested).trim();
    try {
      const j = JSON.stringify(raw);
      return j.length > 420 ? `${j.slice(0, 417)}…` : j;
    } catch {
      return fallback;
    }
  }
  return String(raw);
}

function formatActivityTime(v) {
  if (v == null || v === '') return '';
  const s = String(v).trim();
  if (!s) return '';
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  } catch { /* ignore */ }
  if (s.includes('T') && s.length >= 16) {
    const slice = s.slice(11, 16);
    if (/^\d{2}:\d{2}$/.test(slice)) return slice;
  }
  return s.length > 8 ? s.slice(0, 8) : s;
}

function vitalValueToString(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object' && !Array.isArray(v)) {
    const inner = pickFirst(v, ['value', 'reading', 'display', 'text', 'amount', 'result']);
    if (inner != null && inner !== '') return vitalValueToString(inner);
    return coerceAlertNote(v, '—');
  }
  return coerceAlertNote(v, '—');
}

function normalizeVitals(raw) {
  if (raw == null || raw === '') return {};
  if (Array.isArray(raw)) {
    const out = {};
    for (let i = 0; i < raw.length; i++) {
      const item = raw[i];
      if (item == null) continue;
      if (typeof item === 'string' || typeof item === 'number') {
        const label = vitalValueToString(item);
        if (label && label !== '—') out[`Reading ${i + 1}`] = label;
        continue;
      }
      if (typeof item !== 'object') continue;
      const k = String(
        pickFirst(item, ['label', 'name', 'key', 'type', 'vital', 'metric']) || '',
      ).trim();
      const val = pickFirst(item, ['value', 'reading', 'amount', 'display', 'result', 'text']);
      const keyLabel = k || `Reading ${i + 1}`;
      out[keyLabel] = vitalValueToString(val);
    }
    return out;
  }
  if (typeof raw === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(raw)) {
      if (val == null || val === '') continue;
      out[k] = vitalValueToString(val);
    }
    return out;
  }
  return {};
}

function normalizeMedications(raw) {
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t ? [t] : [];
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      if (m == null || m === '') return '';
      if (typeof m === 'string') return m.trim();
      if (typeof m === 'object') {
        const name = String(
          pickFirst(m, ['name', 'label', 'medication', 'drug', 'title', 'displayName']) || '',
        ).trim();
        if (name) return name;
        return coerceAlertNote(m, '').trim();
      }
      return String(m).trim();
    })
    .filter(Boolean);
}

function normalizeActivities(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((act) => {
      if (act == null || act === '') return null;
      if (typeof act === 'string') {
        const s = act.trim();
        return s ? { time: '', action: s, note: '', status: 'pending' } : null;
      }
      if (typeof act !== 'object') return null;
      const st = String(pickFirst(act, ['status']) || '').toLowerCase();
      const status = ['alert', 'done', 'pending'].includes(st) ? st : 'pending';
      const timeRaw = pickFirst(act, ['time', 'at', 'timestamp', 'createdAt', 'created_at', 'date']);
      return {
        time: formatActivityTime(timeRaw),
        action: String(pickFirst(act, ['action', 'title', 'label', 'type', 'event']) || '—'),
        note: String(pickFirst(act, ['note', 'message', 'description', 'details']) || ''),
        status,
      };
    })
    .filter(Boolean);
}

/** True if id is UI-only fallback when the API omitted a real identifier */
function isFallbackAlertId(id) {
  return /^AL-\d+$/i.test(String(id ?? '').trim());
}

/**
 * Extract backend alert id from common shapes: string keys, Mongo _id / Extended JSON $oid,
 * BSON ObjectId-like toHexString, nested data.
 */
function normalizeAlertRecordId(raw, index) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const dataObj = a.data && typeof a.data === 'object' ? a.data : null;
  const metaObj = a.metadata && typeof a.metadata === 'object' ? a.metadata : null;

  const asString = (v) => {
    if (v == null || v === '') return null;
    if (typeof v === 'string') {
      const s = v.trim();
      return s ? s : null;
    }
    if (typeof v === 'object') {
      if (typeof v.$oid === 'string' && v.$oid.trim()) return v.$oid.trim();
      if (typeof v.toHexString === 'function') {
        try {
          const h = v.toHexString();
          if (h && typeof h === 'string' && h.trim()) return h.trim();
        } catch { /* ignore */ }
      }
    }
    const s = String(v).trim();
    if (!s || s === '[object Object]') return null;
    return s;
  };

  const tryObject = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const keys = ['id', '_id', 'alertId', 'alert_id', 'uuid', 'alertUUID', 'alert_uuid'];
    for (const k of keys) {
      const out = asString(obj[k]);
      if (out) return out;
    }
    return null;
  };

  return (
    tryObject(a)
    || tryObject(metaObj || {})
    || (dataObj ? tryObject(dataObj) : null)
    || asString(a._id)
    || `AL-${index + 1}`
  );
}

/** Merge overlapping alert lists (/pending vs /in-progress); keep higher-ranked status when ids collide. */
function alertStatusRankFromRaw(raw) {
  const s = normalizeCaseStatus(pickFirst(raw && typeof raw === 'object' ? raw : {}, [
    'caseStatus', 'case_status', 'status', 'state',
  ]));
  if (s === 'resolved') return 3;
  if (s === 'in-progress') return 2;
  return 1;
}

function dedupeMergedAlertRows(rows) {
  const byId = new Map();
  rows.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const id = normalizeAlertRecordId(raw, idx);
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, raw);
      return;
    }
    if (alertStatusRankFromRaw(raw) >= alertStatusRankFromRaw(existing)) {
      byId.set(id, raw);
    }
  });
  return [...byId.values()];
}

/** Backend `/alerts/resolved` rows: vitals-based alerts with flat fields (Postman sample). */
function isFlatResolvedVitalsAlert(raw) {
  if (!raw || typeof raw !== 'object') return false;
  if (String(raw.status ?? '').toLowerCase().trim() !== 'resolved') return false;
  return raw.vitalKey != null || raw.vitalId != null || raw.vitalLabel != null;
}

function mapFlatResolvedVitalToCase(raw, index) {
  const id = coerceNonEmptyStr(raw.id) || normalizeAlertRecordId(raw, index);
  const patientId = coerceNonEmptyStr(raw.patientUuid) || coerceNonEmptyStr(raw.patientId) || '';
  const vitalLabel = String(raw.vitalLabel || raw.vitalKey || 'Vital').trim();
  const typeTag = coerceNonEmptyStr(raw.type);
  const severity = normalizeSeverity(raw.severity || (typeTag === 'high-risk' ? 'high' : typeTag));

  const resolvedByObj = raw.resolvedBy && typeof raw.resolvedBy === 'object' ? raw.resolvedBy : null;
  const resolvedByStr = resolvedByObj
    ? (nameFromPersonObject(resolvedByObj) || '')
    : coerceNonEmptyStr(raw.resolvedBy) || '';

  const reason = coerceNonEmptyStr(raw.description) || coerceNonEmptyStr(raw.resolveMessage) || '—';
  const flaggedDateRaw = raw.date || raw.triggeredAt || raw.createdAt;

  const vitals = {};
  if (raw.value != null && String(raw.value).trim() !== '') {
    vitals[vitalLabel || 'Reading'] = String(raw.value);
  }

  const diagParts = [vitalLabel, raw.value != null ? String(raw.value) : ''].filter(Boolean);
  const diagnosis = diagParts.join(': ') || '';
  const code =
    coerceNonEmptyStr(raw.code)
    || coerceNonEmptyStr(raw.caseCode)
    || coerceNonEmptyStr(raw.case_code);

  return {
    id,
    code: code || undefined,
    patientId,
    patient: patientDisplayName(raw),
    age: undefined,
    gender: undefined,
    type: 'Vitals Alert',
    severity,
    reason,
    flaggedBy: 'Vitals',
    flaggedDate: formatAlertDate(flaggedDateRaw) || '—',
    nurse: resolvedByStr || '—',
    region: '',
    phone: '',
    diagnosis,
    caseStatus: 'resolved',
    activities: [],
    vitals,
    medications: [],
    attachedImage: extractCaseImageAttachment(raw),
    resolution: {
      resolvedBy: resolvedByStr || '—',
      resolvedDate: formatAlertDate(raw.resolvedAt) || formatAlertDate(raw.updatedAt),
      action: coerceNonEmptyStr(raw.resolveMessage) || '',
    },
  };
}

function mapResolvedRowToCase(raw, index) {
  if (isFlatResolvedVitalsAlert(raw)) {
    return mapFlatResolvedVitalToCase(raw, index);
  }
  const c = mapAlertToCase(raw, index);
  return c.caseStatus === 'resolved' ? c : { ...c, caseStatus: 'resolved' };
}

function mapAlertToCase(raw, index) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const id = normalizeAlertRecordId(raw, index);
  const patient = patientDisplayName(a);
  const patientId = patientIdFrom(a);
  const type = String(pickFirst(a, ['type', 'alertType', 'alert_type', 'category', 'title']) || 'Alert');
  const reason = coerceAlertNote(pickFirst(a, ['reason', 'message', 'description', 'details', 'note', 'body']));
  const severity = normalizeSeverity(pickFirst(a, ['severity', 'priority', 'level']));
  const caseStatus = normalizeCaseStatus(pickFirst(a, ['caseStatus', 'case_status', 'status', 'state']));
  const flaggedBy = String(pickFirst(a, ['flaggedBy', 'flagged_by', 'createdBy', 'created_by', 'reportedBy', 'source']) || '—');
  const flaggedDate = formatAlertDate(pickFirst(a, ['flaggedDate', 'flagged_date', 'createdAt', 'created_at', 'updatedAt', 'updated_at']));
  const nurse = String(pickFirst(a, ['nurse', 'nurseName', 'nurse_name', 'assignedNurse', 'assigned_to']) || flaggedBy);
  const region = String(pickFirst(a, ['region', 'location', 'area']) || '');
  const phone = String(pickFirst(a, ['phone', 'phoneNumber', 'phone_number', 'contact']) || '');
  const dataObj = a.data && typeof a.data === 'object' ? a.data : null;
  const diagnosis = String(
    pickFirst(a, ['diagnosis', 'clinicalDiagnosis', 'primaryDiagnosis', 'clinical_notes'])
    || (dataObj ? pickFirst(dataObj, ['diagnosis', 'clinicalDiagnosis', 'primaryDiagnosis']) : '')
    || '',
  );
  const ageRaw = pickFirst(a, ['age']);
  const ageNum = ageRaw != null && ageRaw !== '' ? Number(ageRaw) : NaN;
  const gender = String(pickFirst(a, ['gender']) || '');
  const vitalsRaw = pickFirst(a, ['vitals']) ?? (dataObj ? pickFirst(dataObj, ['vitals']) : undefined);
  const medsRaw = pickFirst(a, ['medications']) ?? (dataObj ? pickFirst(dataObj, ['medications', 'meds']) : undefined);
  const activitiesRaw = pickFirst(a, ['activities', 'timeline', 'history'])
    ?? (dataObj ? pickFirst(dataObj, ['activities', 'timeline', 'history']) : undefined);
  const resNested = a.resolution && typeof a.resolution === 'object' ? a.resolution : null;

  const code =
    coerceNonEmptyStr(pickFirst(a, ['code', 'caseCode', 'case_code', 'alertCode', 'alert_code']));

  let resolution;
  if (caseStatus === 'resolved') {
    const rbRaw = pickFirst(a, ['resolvedBy', 'resolved_by'])
      || pickFirst(resNested || {}, ['resolvedBy', 'resolved_by']);
    const resolvedByLabel = rbRaw != null && typeof rbRaw === 'object'
      ? (nameFromPersonObject(rbRaw) || '')
      : String(rbRaw ?? '').trim();

    resolution = {
      resolvedBy: resolvedByLabel,
      resolvedDate: formatAlertDate(
        pickFirst(a, ['resolvedDate', 'resolved_date', 'resolvedAt'])
        || pickFirst(resNested || {}, ['resolvedDate', 'resolved_date', 'resolvedAt']),
      ),
      action: String(
        pickFirst(a, ['resolution', 'resolutionNote', 'resolveMessage'])
        || pickFirst(resNested || {}, ['action', 'notes', 'description'])
        || '',
      ),
    };
    const hasResolveMeta = !!(resolution.action || resolution.resolvedBy || resolution.resolvedDate);
    if (!hasResolveMeta) resolution = undefined;
  }

  return {
    id,
    code: code || undefined,
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
    activities: normalizeActivities(activitiesRaw),
    vitals: normalizeVitals(vitalsRaw),
    medications: normalizeMedications(medsRaw),
    attachedImage: extractCaseImageAttachment(a),
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

function formatCaseStatusLabel(caseStatus) {
  const v = String(caseStatus ?? '').toLowerCase();
  if (v === 'open') return 'Open';
  if (v === 'in-progress') return 'In progress';
  if (v === 'resolved') return 'Resolved';
  return String(caseStatus ?? '').replace(/-/g, ' ') || '—';
}

function formatSeverityLabel(severity) {
  const s = String(severity ?? '').toLowerCase();
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortenTableText(text, maxLen) {
  const t = String(text ?? '').trim();
  if (!t) return '—';
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

export default function ClinicalDocs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [caseQueue, setCaseQueue] = useState('pending');
  const [resolvedPatientId, setResolvedPatientId] = useState('');
  const pendingSnapshotRef = useRef([]);
  const resolvedReloadRef = useRef({ kind: 'none' });
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  /** Pending → Resolved (or URL) with status/type still on e.g. Open hides every resolved row — reset when switching queue. */
  const resetListFilters = useCallback(() => {
    setTypeFilter('all');
    setStatusFilter('All');
    setSearchTerm('');
  }, []);

  const loadPendingAlerts = useCallback(async () => {
    setAlertsError(null);
    setAlertsLoading(true);
    const on401 = () => navigate('/login', { replace: true });
    try {
      const response = await apiFetch('/alerts/pending?page=1&limit=100', { method: 'GET' }, on401);
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = json.message || json.error || `Could not load alerts (${response.status})`;
        throw new Error(typeof msg === 'string' ? msg : 'Could not load alerts');
      }
      const mergedRaw = [...extractAlertsArray(json)];
      /** Backends often exclude in-progress rows from `/alerts/pending`; merge optional lists when they exist */
      const secondaryPaths = [
        '/alerts/in-progress?page=1&limit=100',
        '/alerts/in_progress?page=1&limit=100',
        '/alerts/inProgress?page=1&limit=100',
        '/alerts/active?page=1&limit=100',
      ];
      const extras = await Promise.all(
        secondaryPaths.map((path) =>
          fetchAlertsOptionalPath(path, on401).catch((e) => {
            const msg = String(e.message || '').toLowerCase();
            if (msg.includes('session expired') || msg.includes('log in')) throw e;
            return null;
          }),
        ),
      );
      extras.forEach((extraJson) => {
        if (extraJson) mergedRaw.push(...extractAlertsArray(extraJson));
      });
      const deduped = dedupeMergedAlertRows(mergedRaw);
      const mapped = deduped.map((row, i) => mapAlertToCase(row, i));
      pendingSnapshotRef.current = mapped;
      resolvedReloadRef.current = { kind: 'none' };
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

  const mapRowsToCasesDeduped = (rows) => {
    const byId = new Map();
    rows.forEach((row, i) => {
      const c = mapResolvedRowToCase(row, i);
      byId.set(c.id, c);
    });
    return [...byId.values()];
  };

  const loadGlobalResolvedAlerts = useCallback(async () => {
    setAlertsError(null);
    setAlertsLoading(true);
    try {
      const json = await fetchAllResolvedAlerts(
        { page: 1, limit: 100 },
        () => navigate('/login', { replace: true }),
      );
      const rows = extractAlertsArray(json);
      const mapped = mapRowsToCasesDeduped(rows);
      mapped.sort((a, b) => String(b.flaggedDate).localeCompare(String(a.flaggedDate)));
      resolvedReloadRef.current = { kind: 'global' };
      setCases(mapped);
      setSelected((prev) => {
        if (!prev) return null;
        return mapped.find((item) => item.id === prev.id) || null;
      });
      setPage(1);
    } catch (e) {
      setCases([]);
      setSelected(null);
      setAlertsError(e.message || 'Failed to load resolved alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, [navigate]);

  const loadResolvedForPatient = useCallback(async (patientId) => {
    const pid = String(patientId ?? '').trim();
    if (!pid) {
      setAlertsError('Enter a patient UUID to load resolved cases.');
      return;
    }
    setAlertsError(null);
    setAlertsLoading(true);
    try {
      const json = await fetchPatientResolvedAlerts(
        pid,
        { page: 1, limit: 100 },
        () => navigate('/login', { replace: true }),
      );
      const rows = extractAlertsArray(json);
      const mapped = mapRowsToCasesDeduped(rows);
      resolvedReloadRef.current = { kind: 'patient', patientId: pid };
      setCases(mapped);
      setSelected((prev) => {
        if (!prev) return null;
        return mapped.find((item) => item.id === prev.id) || null;
      });
      setPage(1);
    } catch (e) {
      setCases([]);
      setSelected(null);
      setAlertsError(e.message || 'Failed to load resolved alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, [navigate]);

  const loadAllResolvedAcrossPendingPatients = useCallback(async () => {
    await loadGlobalResolvedAlerts();
  }, [loadGlobalResolvedAlerts]);

  const selectPendingQueue = useCallback(() => {
    resetListFilters();
    setCaseQueue('pending');
    setPage(1);
    if (searchParams.get('patientId')?.trim()) {
      navigate('/clinical', { replace: true });
    } else {
      loadPendingAlerts();
    }
  }, [loadPendingAlerts, navigate, searchParams, resetListFilters]);

  const selectResolvedQueue = useCallback(() => {
    resetListFilters();
    setCaseQueue('resolved');
    setPage(1);
    const pid = resolvedPatientId.trim();
    if (pid) {
      loadResolvedForPatient(pid);
    } else {
      loadGlobalResolvedAlerts();
    }
  }, [resolvedPatientId, loadResolvedForPatient, loadGlobalResolvedAlerts, resetListFilters]);

  const handleRefreshAlerts = useCallback(() => {
    if (caseQueue === 'pending') {
      loadPendingAlerts();
      return;
    }
    const r = resolvedReloadRef.current;
    if (r.kind === 'patient' && r.patientId) {
      loadResolvedForPatient(r.patientId);
    } else if (r.kind === 'global') {
      loadGlobalResolvedAlerts();
    } else {
      const pid = resolvedPatientId.trim();
      if (pid) loadResolvedForPatient(pid);
      else loadGlobalResolvedAlerts();
    }
  }, [
    caseQueue,
    loadPendingAlerts,
    loadResolvedForPatient,
    loadGlobalResolvedAlerts,
    resolvedPatientId,
  ]);

  /** Deep link `/clinical?patientId=uuid` opens Resolved + GET `/alerts/patient/{patientId}/resolved`. No query → Pending. */
  useEffect(() => {
    const p = searchParams.get('patientId')?.trim() ?? '';
    setResolvedPatientId(p);
    resetListFilters();
    if (p) {
      setCaseQueue('resolved');
      loadResolvedForPatient(p);
    } else {
      loadPendingAlerts();
    }
  }, [searchParams, loadPendingAlerts, loadResolvedForPatient, resetListFilters]);

  /* Resolution form state */
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionSubmitting, setResolutionSubmitting] = useState(false);
  const [resolutionError, setResolutionError] = useState('');

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
          || (c.code && String(c.code).toLowerCase().includes(q))
          || (c.patientId && String(c.patientId).toLowerCase().includes(q))
          || (c.nurse && c.nurse.toLowerCase().includes(q))
          || (c.region && c.region.toLowerCase().includes(q))
          || (c.reason && c.reason.toLowerCase().includes(q))
          || (c.diagnosis && String(c.diagnosis).toLowerCase().includes(q))
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

  /* Apply resolution — API: see resolveAlertViaApi (POST /alerts/:id/resolve, etc.) */
  const applyResolution = async () => {
    if (!selected || !selectedSolution || !newStatus) return;
    setResolutionError('');
    const notesTrim = resolutionNotes.trim();
    const actionNote = `${selectedSolution}${notesTrim ? ` — ${notesTrim}` : ''}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const user = getUser();
    const resolvedByLabel = String(
      pickFirst(user || {}, ['name', 'fullName', 'displayName', 'email', 'username']),
    ).trim()
      || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
      || String(user?.email || '').trim()
      || 'Admin';

    const applyLocalCaseUpdate = () => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== selected.id) return c;
          const updated = { ...c, caseStatus: newStatus };
          if (newStatus === 'resolved') {
            updated.resolution = {
              resolvedBy: resolvedByLabel,
              resolvedDate: new Date().toISOString().slice(0, 10),
              action: actionNote,
            };
          }
          updated.activities = [...(c.activities || []), {
            time: timeStr,
            action: newStatus === 'resolved' ? 'Case resolved' : 'Status updated',
            note: actionNote,
            status: newStatus === 'resolved' ? 'done' : newStatus === 'in-progress' ? 'pending' : 'alert',
          }];
          return updated;
        }),
      );
      setSelected((prev) => {
        if (!prev || prev.id !== selected.id) return prev;
        const next = {
          ...prev,
          caseStatus: newStatus,
          activities: [...(prev.activities || []), {
            time: timeStr,
            action: newStatus === 'resolved' ? 'Case resolved' : 'Status updated',
            note: actionNote,
            status: newStatus === 'resolved' ? 'done' : 'pending',
          }],
        };
        if (newStatus === 'resolved') {
          next.resolution = {
            resolvedBy: resolvedByLabel,
            resolvedDate: new Date().toISOString().slice(0, 10),
            action: actionNote,
          };
        }
        return next;
      });
    };

    setResolutionSubmitting(true);
    try {
      if (newStatus === 'resolved') {
        if (isFallbackAlertId(selected.id)) {
          throw new Error(
            'This alert does not include a backend id — the pending-alerts API should return id or _id per row.',
          );
        }
        await resolveAlertViaApi(
          selected.id,
          {
            solution: selectedSolution,
            notes: notesTrim || undefined,
            resolution: actionNote,
          },
          () => navigate('/login', { replace: true }),
        );
        await loadPendingAlerts();
        setCaseQueue('pending');
      } else if (newStatus === 'in-progress') {
        if (isFallbackAlertId(selected.id)) {
          throw new Error(
            'This alert does not include a backend id — the pending-alerts API should return id or _id per row.',
          );
        }
        await updateAlertStatusViaApi(
          selected.id,
          {
            caseStatus: 'in-progress',
            solution: selectedSolution,
            notes: notesTrim || undefined,
            actionNote,
          },
          () => navigate('/login', { replace: true }),
        );
        await loadPendingAlerts();
      } else {
        applyLocalCaseUpdate();
      }
      setShowResolveForm(false);
      setSelectedSolution('');
      setResolutionNotes('');
      setNewStatus('');
    } catch (e) {
      setResolutionError(e.message || 'Request failed');
    } finally {
      setResolutionSubmitting(false);
    }
  };

  const closeCaseModal = useCallback(() => {
    setSelected(null);
    setShowResolveForm(false);
    setSelectedSolution('');
    setResolutionNotes('');
    setNewStatus('');
    setResolutionError('');
    setResolutionSubmitting(false);
  }, []);

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
              onClick={handleRefreshAlerts}
              disabled={alertsLoading}
              aria-busy={alertsLoading}
            >
              <FiRefreshCw size={14} aria-hidden /> Refresh
            </button>
          </div>
        </div>

        <div className="emergency-cases-toolbar__body">
          <div className="emergency-case-queue-row mb-3">
            <span className="emergency-field-label d-block mb-2" style={{ color: '#64748b' }}>Alert queue</span>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className={`emergency-status-chip${caseQueue === 'pending' ? ' is-active' : ''}`}
                onClick={selectPendingQueue}
              >
                Pending
              </button>
              <button
                type="button"
                className={`emergency-status-chip${caseQueue === 'resolved' ? ' is-active' : ''}`}
                onClick={selectResolvedQueue}
              >
                Resolved
              </button>
              {caseQueue === 'resolved' && (
                <>
                  <label className="visually-hidden" htmlFor="resolved-patient-uuid">Patient UUID</label>
                  <input
                    id="resolved-patient-uuid"
                    type="text"
                    className="emergency-search-input"
                    style={{ flex: '1 1 220px', minWidth: 200, maxWidth: 420, paddingLeft: 10 }}
                    value={resolvedPatientId}
                    onChange={(e) => setResolvedPatientId(e.target.value)}
                    placeholder="Patient UUID…"
                    title="Paste the patient id, then choose Load resolved. You can also open this page with ?patientId= in the URL to load automatically."
                  />
                  <button
                    type="button"
                    className="emergency-clear-filters"
                    disabled={alertsLoading}
                    onClick={() => loadResolvedForPatient(resolvedPatientId)}
                  >
                    Load resolved
                  </button>
                  <button
                    type="button"
                    className="emergency-clear-filters"
                    disabled={alertsLoading}
                    onClick={loadAllResolvedAcrossPendingPatients}
                    title="Reload the full resolved list from the server"
                  >
                    Reload all resolved
                  </button>
                </>
              )}
            </div>
          </div>

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
                  placeholder="Patient, code, nurse, region…"
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

      <div className="emergency-cases-shell">

        <div className="emergency-cases-main">
          {alertsLoading && cases.length === 0 ? (
            <div className="emergency-cases-empty">
              <div className="emergency-cases-empty__graphic">
                <FiRefreshCw size={36} style={{ opacity: 0.45 }} className="emergency-cases-loading-icon" aria-hidden />
              </div>
              <p className="emergency-cases-empty__title">
                {caseQueue === 'resolved' ? 'Loading resolved alerts…' : 'Loading pending alerts…'}
              </p>
              <p className="emergency-cases-empty__hint">Fetching from the server.</p>
            </div>
          ) : alertsError ? (
            <div className="emergency-cases-empty">
              <div className="emergency-cases-empty__graphic">
                <FiAlertCircle size={36} style={{ opacity: 0.5, color: '#b91c1c' }} aria-hidden />
              </div>
              <p className="emergency-cases-empty__title">Could not load alerts</p>
              <p className="emergency-cases-empty__hint">{alertsError}</p>
              <button type="button" className="emergency-clear-filters" style={{ marginTop: 12 }} onClick={handleRefreshAlerts}>
                <FiRefreshCw size={14} aria-hidden /> Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="emergency-cases-empty">
              <div className="emergency-cases-empty__graphic">
                <FiSearch size={36} style={{ opacity: 0.35 }} aria-hidden />
              </div>
              <p className="emergency-cases-empty__title">
                {cases.length === 0
                  ? (caseQueue === 'resolved' ? 'No resolved cases loaded' : 'No pending alerts')
                  : 'No cases found'}
              </p>
              <p className="emergency-cases-empty__hint">
                {cases.length === 0
                  ? (
                    caseQueue === 'resolved'
                      ? 'Enter a patient id and tap Load resolved, or use Reload all resolved / Refresh. You can also open Emergency Cases with ?patientId= in the address bar to filter by patient.'
                      : 'There are no items in the pending queue right now.'
                  )
                  : 'Try widening your filters or search terms.'}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive emergency-cases-table-wrap">
                <table className="emergency-cases-table">
                  <colgroup>
                    <col className="emergency-cases-table__col emergency-cases-table__col--code" />
                    <col className="emergency-cases-table__col emergency-cases-table__col--patient" />
                    <col className="emergency-cases-table__col emergency-cases-table__col--type" />
                    <col className="emergency-cases-table__col emergency-cases-table__col--severity" />
                    <col className="emergency-cases-table__col emergency-cases-table__col--status" />
                    <col className="emergency-cases-table__col emergency-cases-table__col--people" />
                    <col className="emergency-cases-table__col emergency-cases-table__col--date" />
                    <col className="emergency-cases-table__col emergency-cases-table__col--summary" />
                  </colgroup>
                  <thead>
                    <tr>
                      {['Code', 'Patient', 'Type', 'Severity', 'Status', 'Assigned / Flagged', 'Flagged date', 'Summary'].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c) => {
                      const sev = severityStyle[c.severity] || severityStyle.medium;
                      const cs = caseStatusStyle[c.caseStatus] || caseStatusStyle.open;
                      const sevKey = c.severity === 'critical' ? 'critical' : c.severity === 'high' ? 'high' : 'medium';
                      const reasonFull = String(c.reason ?? '').trim() || '—';
                      const reasonShort = shortenTableText(reasonFull, 160);
                      const typeDisplay = shortenTableText(c.type, 80);
                      return (
                        <tr
                          key={c.id}
                          tabIndex={0}
                          role="button"
                          className={`emergency-cases-table__row emergency-cases-table__row--${sevKey}${selected?.id === c.id ? ' is-selected' : ''}`}
                          onClick={() => { setSelected(c); setShowResolveForm(false); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelected(c);
                              setShowResolveForm(false);
                            }
                          }}
                          aria-current={selected?.id === c.id ? 'true' : undefined}
                        >
                          <td className="emergency-cases-table__mono">{c.code ?? c.id}</td>
                          <td className="emergency-cases-table__break">
                            <div className="emergency-cases-table__patient">{c.patient}</div>
                            {c.phone?.trim() ? (
                              <div className="emergency-cases-table__sub">{c.phone.trim()}</div>
                            ) : null}
                          </td>
                          <td className="emergency-cases-table__break"><span className="emergency-cases-table__type-chip" title={c.type}>{typeDisplay}</span></td>
                          <td className="emergency-cases-table__pill-cell">
                            <span
                              className="emergency-cases-table__pill"
                              style={{
                                background: sev.bg,
                                color: sev.color,
                                border: `1px solid ${sev.border}`,
                              }}
                            >
                              {formatSeverityLabel(c.severity)}
                            </span>
                          </td>
                          <td className="emergency-cases-table__pill-cell">
                            <span
                              className="emergency-cases-table__pill emergency-cases-table__pill--status"
                              style={{
                                background: cs.bg,
                                color: cs.color,
                                border: `1px solid ${cs.border}`,
                              }}
                            >
                              <span className="emergency-cases-table__pill-icon" aria-hidden>{cs.icon}</span>
                              <span>{formatCaseStatusLabel(c.caseStatus)}</span>
                            </span>
                          </td>
                          <td className="emergency-cases-table__break">
                            <div className="emergency-cases-table__stack-row">
                              <span className="emergency-cases-table__inline-label">Assigned</span>
                              <span className="emergency-cases-table__muted-strong">{c.nurse || '—'}</span>
                            </div>
                            <div className="emergency-cases-table__stack-row">
                              <span className="emergency-cases-table__inline-label">Flagged by</span>
                              <span className="emergency-cases-table__sub emergency-cases-table__inline-value">{c.flaggedBy}</span>
                            </div>
                          </td>
                          <td className="emergency-cases-table__muted-strong emergency-cases-table__break emergency-cases-table__nowrap-ish">{c.flaggedDate}</td>
                          <td className="emergency-cases-table__summary-cell"><span className="emergency-cases-table__reason" title={reasonFull}>{reasonShort}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
      </div>

      <Modal
        show={Boolean(selected)}
        onHide={closeCaseModal}
        animation={false}
        size="lg"
        centered
        scrollable
        className="emergency-case-modal"
        dialogClassName="emergency-case-modal__dialog"
        contentClassName="emergency-case-modal__content"
      >
        {selected ? (
          <>
            <Modal.Header closeButton className="emergency-case-modal__header">
              <Modal.Title as="div" className="w-100 mb-0 pe-1">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c' }}>{selected.code ?? selected.id}</span>
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
                          <span>{formatCaseStatusLabel(selected.caseStatus)}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--kh-text)', letterSpacing: '-0.02em' }}>{selected.patient}</div>
                  {(selected.age != null || String(selected.gender ?? '').trim()) ? (
                    <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', fontWeight: 600 }}>
                      {[
                        selected.age != null ? `${selected.age}y` : null,
                        String(selected.gender ?? '').trim() || null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  ) : null}
                </div>
            </Modal.Title>
            </Modal.Header>

            <Modal.Body className="emergency-case-modal__body">
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
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Flag Reason</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)', lineHeight: 1.5 }}>{selected.reason}</div>
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
                      {formatSeverityLabel(selected.severity)}
                    </span>
                  );
                })()}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{selected.type}</span>
              </div>

              <div className="emergency-case-modal__sections">
                <section className="emergency-case-modal__section">
                  <h3 className="emergency-case-modal__section-title">Diagnosis</h3>
                  <p className="emergency-case-modal__section-body">
                    {selected.diagnosis?.trim() ? selected.diagnosis : 'No diagnosis on file for this alert.'}
                  </p>
                </section>

                {selected.attachedImage ? (
                  <section className="emergency-case-modal__section emergency-case-modal__section--image">
                    <CaseAttachedImageSection attachment={selected.attachedImage} />
                  </section>
                ) : null}

                <section className="emergency-case-modal__section">
                  <h3 className="emergency-case-modal__section-title">
                    <FiActivity size={12} aria-hidden className="emergency-case-modal__section-title-icon" />
                    Current vitals
                  </h3>
                  {Object.keys(selected.vitals || {}).length === 0 ? (
                    <p className="emergency-case-modal__empty">No vitals captured for this case.</p>
                  ) : (
                    <div className="emergency-case-modal__vitals-grid">
                      {Object.entries(selected.vitals || {}).map(([k, v]) => (
                        <div key={k} className="emergency-case-modal__vital-chip">
                          <div className="emergency-case-modal__vital-label">{k}</div>
                          <div className="emergency-case-modal__vital-value">{vitalValueToString(v)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="emergency-case-modal__section">
                  <h3 className="emergency-case-modal__section-title">Medications</h3>
                  {(selected.medications || []).length === 0 ? (
                    <p className="emergency-case-modal__empty">No medications listed.</p>
                  ) : (
                    <ul className="emergency-case-modal__med-list">
                      {(selected.medications || []).map((m, i) => (
                        <li key={i} className="emergency-case-modal__med-item">
                          <FiShield size={14} className="emergency-case-modal__med-icon" aria-hidden />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="emergency-case-modal__section emergency-case-modal__section--timeline">
                  <h3 className="emergency-case-modal__section-title">
                    <FiClock size={12} aria-hidden className="emergency-case-modal__section-title-icon" />
                    Activity timeline
                  </h3>
                  {(selected.activities || []).length === 0 ? (
                    <p className="emergency-case-modal__empty">No activity history yet.</p>
                  ) : (
                    <div className="emergency-case-modal__timeline">
                      <div className="emergency-case-modal__timeline-line" aria-hidden />
                      {(selected.activities || []).map((a, i) => {
                        const dot = activityStatusDot[a.status] || activityStatusDot.pending;
                        return (
                          <div key={i} className="emergency-case-modal__timeline-row">
                            <div
                              className="emergency-case-modal__timeline-dot"
                              style={{
                                background: dot.bg,
                                boxShadow: '0 0 0 1px #e5e7eb',
                              }}
                            />
                            <div className="emergency-case-modal__timeline-content">
                              <div className="emergency-case-modal__timeline-meta">
                                {a.time ? <span className="emergency-case-modal__timeline-time">{a.time}</span> : null}
                                <span className="emergency-case-modal__timeline-action">{a.action}</span>
                              </div>
                              {a.note ? <div className="emergency-case-modal__timeline-note">{a.note}</div> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
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
                      <button onClick={() => { setResolutionError(''); setShowResolveForm(true); setNewStatus('in-progress'); }} style={{
                        flex: 1, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiRefreshCw size={13} /> Update Status
                      </button>
                      <button onClick={() => { setResolutionError(''); setShowResolveForm(true); setNewStatus('resolved'); }} style={{
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
                        <button onClick={() => { setShowResolveForm(false); setSelectedSolution(''); setResolutionNotes(''); setResolutionError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)' }}><FiX size={14} /></button>
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

                      {resolutionError ? (
                        <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5, fontWeight: 600 }}>
                          {resolutionError}
                        </div>
                      ) : null}

                      {/* Submit */}
                      <button type="button" onClick={() => applyResolution()} disabled={!selectedSolution || resolutionSubmitting} style={{
                        width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 700, borderRadius: 2, cursor: selectedSolution && !resolutionSubmitting ? 'pointer' : 'not-allowed',
                        background: selectedSolution && !resolutionSubmitting ? (newStatus === 'resolved' ? '#45B6FE' : '#2563eb') : '#e5e7eb',
                        color: selectedSolution && !resolutionSubmitting ? '#fff' : '#9ca3af',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiSend size={13} /> {resolutionSubmitting ? 'Saving…' : (newStatus === 'resolved' ? 'Apply Solution & Resolve' : 'Update Case Status')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
