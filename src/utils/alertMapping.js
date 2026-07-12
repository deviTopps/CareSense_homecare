/** Shared alert row normalization for dashboard watchlist and emergency cases. */

import { extractUrlFromPayload } from './resolveStoredMediaUrl';

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function coerceNonEmptyStr(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s || null;
}

export function formatAlertDate(v) {
  if (v == null || v === '') return '';
  try {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch { /* ignore */ }
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
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

function nameFromPersonObject(p) {
  if (!p || typeof p !== 'object') return null;
  const fn = coerceNonEmptyStr(pickFirst(p, ['firstName', 'first_name', 'givenName', 'forename']));
  const ln = coerceNonEmptyStr(pickFirst(p, ['lastName', 'last_name', 'familyName', 'surname']));
  const combined = [fn, ln].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return coerceNonEmptyStr(pickFirst(p, [
    'fullName', 'full_name', 'displayName', 'display_name',
    'name', 'patientName', 'patient_name', 'label', 'preferredName',
  ]));
}

export function patientDisplayName(a) {
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
    o.patient, o.patientInfo, o.patient_info, o.client, o.serviceUser, o.service_user, o.subject, o.person,
  ];
  for (const obj of nestedObjects) {
    if (obj && typeof obj === 'object') {
      const n = nameFromPersonObject(obj);
      if (n) return n;
    }
  }
  if (o.data && typeof o.data === 'object') {
    const inner = pickFirst(o.data, ['patient', 'patientInfo', 'patient_info']);
    if (typeof inner === 'string') {
      const s = coerceNonEmptyStr(inner);
      if (s) return s;
    }
    if (inner && typeof inner === 'object') {
      const n = nameFromPersonObject(inner);
      if (n) return n;
    }
  }
  const uuidOnly = coerceNonEmptyStr(pickFirst(o, ['patientUuid', 'patient_uuid']));
  if (uuidOnly) return `Patient (${uuidOnly.slice(0, 8)}…)`;
  return 'Unknown patient';
}

/** Resolve assigned nurse display name from common alert payload shapes. */
export function nurseDisplayName(a) {
  const o = a && typeof a === 'object' ? a : {};
  const dataObj = o.data && typeof o.data === 'object' ? o.data : null;

  const topString = coerceNonEmptyStr(pickFirst(o, [
    'nurseName', 'nurse_name', 'assignedNurseName', 'assigned_nurse_name',
    'assigneeName', 'assignee_name', 'caregiverName', 'caregiver_name',
  ]));
  if (topString) return topString;

  const candidates = [
    o.nurse,
    o.assignedNurse,
    o.assigned_nurse,
    o.assignee,
    o.assignedTo,
    o.assigned_to,
    o.caregiver,
    dataObj?.nurse,
    dataObj?.assignedNurse,
    dataObj?.assigned_nurse,
    dataObj?.assignee,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const s = coerceNonEmptyStr(candidate);
      if (s && s !== '—' && !s.startsWith('[object ')) return s;
    }
    if (candidate && typeof candidate === 'object') {
      const n = nameFromPersonObject(candidate);
      if (n) return n;
    }
  }

  return '';
}

export function patientIdFrom(a) {
  const o = a && typeof a === 'object' ? a : {};
  const fromPerson = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const raw = pickFirst(obj, ['patientId', 'patient_id', 'id', '_id', 'uuid', 'patientUuid', 'patient_uuid']);
    if (raw != null && raw !== '') return String(raw).trim();
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
  }
  return '';
}

export function normalizeWatchlistSeverity(raw) {
  const v = String(raw ?? '').toLowerCase().trim();
  if (['critical', 'high', 'medium', 'low'].includes(v)) {
    return v === 'low' ? 'medium' : v;
  }
  if (v === 'severe' || v === 'urgent') return 'critical';
  if (v === 'warn' || v === 'warning') return 'high';
  return 'medium';
}

export function normalizeCaseStatus(raw) {
  let v = String(raw ?? 'open').toLowerCase().trim().replace(/_/g, '-');
  const compact = v.replace(/[\s-]+/g, '');
  if (compact === 'inprogress') return 'in-progress';
  if (v === 'pending' || v === 'active') v = 'open';
  if (v === 'closed' || v === 'completed') v = 'resolved';
  if (['open', 'in-progress', 'resolved'].includes(v)) return v;
  return 'open';
}

export function extractAlertsFromPayload(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  const KEYS = ['data', 'alerts', 'items', 'results', 'pending', 'records', 'rows', 'content'];
  const tryNest = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      for (const nk of KEYS) {
        const inner = v[nk];
        if (Array.isArray(inner)) return inner;
      }
    }
    return null;
  };
  for (const k of KEYS) {
    const arr = tryNest(payload[k]);
    if (arr) return arr;
  }
  if (payload?.edges && Array.isArray(payload.edges)) {
    return payload.edges.map((e) => e?.node ?? e?.alert).filter(Boolean);
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
  }
  return fallback;
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
    raw.forEach((item, i) => {
      if (item == null || typeof item !== 'object') return;
      const k = String(pickFirst(item, ['label', 'name', 'key', 'type', 'vital']) || `Reading ${i + 1}`).trim();
      const val = pickFirst(item, ['value', 'reading', 'amount', 'display', 'result', 'text']);
      out[k] = vitalValueToString(val);
    });
    return out;
  }
  if (typeof raw === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(raw)) {
      if (val != null && val !== '') out[k] = vitalValueToString(val);
    }
    return out;
  }
  return {};
}

function normalizeMedications(raw) {
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      if (typeof m === 'string') return m.trim();
      if (m && typeof m === 'object') {
        return String(pickFirst(m, ['name', 'label', 'medication', 'drug', 'title']) || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function normalizeActivities(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((act) => {
      if (act == null) return null;
      if (typeof act === 'string') {
        const s = act.trim();
        return s ? { time: '', action: s, note: '', status: 'pending' } : null;
      }
      if (typeof act !== 'object') return null;
      const st = String(pickFirst(act, ['status']) || '').toLowerCase();
      const status = ['alert', 'done', 'pending'].includes(st) ? st : 'pending';
      return {
        time: formatActivityTime(pickFirst(act, ['time', 'at', 'timestamp', 'createdAt', 'date'])),
        action: String(pickFirst(act, ['action', 'title', 'label', 'type', 'event']) || '—'),
        note: String(pickFirst(act, ['note', 'message', 'description', 'details']) || ''),
        status,
      };
    })
    .filter(Boolean);
}

export function isFallbackAlertId(id) {
  return /^AL-\d+$/i.test(String(id ?? '').trim());
}

function isLikelyImageUrl(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  if (s.startsWith('data:image/')) return true;
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(s) || s.includes('/image') || s.includes('media');
  }
  return false;
}

function parseImageAttachmentValue(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'string') {
    const url = value.trim();
    if (!url) return null;
    if (isLikelyImageUrl(url)) {
      return { url, mediaId: null, objectKey: null };
    }
    return null;
  }

  if (typeof value !== 'object' || Array.isArray(value)) return null;

  const url = String(
    extractUrlFromPayload(value)
    || pickFirst(value, ['url', 'imageUrl', 'image_url', 'photoUrl', 'photo_url', 'src', 'href', 'link'])
    || value?.link?.url
    || '',
  ).trim();

  const mediaId = String(
    pickFirst(value, ['mediaId', 'media_id', 'mediaID'])
    || value?.media?.id
    || value?.media?.mediaId
    || '',
  ).trim();

  const objectKey = String(
    pickFirst(value, ['objectKey', 'object_key', 'key', 'storageKey', 'storage_key'])
    || value?.media?.objectKey
    || '',
  ).trim();

  const mimeType = String(
    pickFirst(value, ['mimeType', 'mime_type', 'contentType', 'content_type', 'fileType', 'file_type'])
    || value?.media?.mimeType
    || '',
  ).trim();

  if (!url && !mediaId && !objectKey) return null;
  if (mimeType && !mimeType.toLowerCase().startsWith('image/')) return null;

  return {
    url: url || null,
    mediaId: mediaId || null,
    objectKey: objectKey || null,
    mimeType: mimeType || null,
  };
}

/** Extract wound/case photo attachment from alert API payloads. */
export function extractCaseImageAttachment(raw) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const dataObj = a.data && typeof a.data === 'object' ? a.data : null;

  const scalarCandidates = [
    a.image,
    a.imageUrl,
    a.image_url,
    a.photoUrl,
    a.photo_url,
    a.attachmentUrl,
    a.attachment_url,
    a.caseImage,
    a.case_image,
    a.woundImage,
    a.wound_image,
    a.attachedImage,
    a.attached_image,
    a.attachmentImage,
    a.attachment_image,
    a.evidenceImage,
    a.evidence_image,
    a.photo,
    a.picture,
    a.snapshot,
    a.attachment,
    a.media,
    a.imageAttachment,
    a.caseAttachment,
    dataObj?.image,
    dataObj?.imageUrl,
    dataObj?.attachment,
    dataObj?.media,
    dataObj?.caseImage,
    dataObj?.woundImage,
  ];

  for (const candidate of scalarCandidates) {
    const parsed = parseImageAttachmentValue(candidate);
    if (parsed) return parsed;
  }

  const arrayCandidates = [
    a.images,
    a.attachments,
    a.photos,
    a.mediaFiles,
    a.files,
    dataObj?.images,
    dataObj?.attachments,
    dataObj?.photos,
    dataObj?.mediaFiles,
  ];

  for (const arr of arrayCandidates) {
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      const parsed = parseImageAttachmentValue(entry);
      if (parsed) return parsed;
    }
  }

  const mediaId = String(
    pickFirst(a, ['imageMediaId', 'image_media_id', 'attachmentMediaId', 'attachment_media_id', 'mediaId', 'media_id'])
    || pickFirst(dataObj || {}, ['imageMediaId', 'attachmentMediaId', 'mediaId'])
    || '',
  ).trim();
  const objectKey = String(
    pickFirst(a, ['imageObjectKey', 'image_object_key', 'attachmentObjectKey', 'attachment_object_key', 'objectKey', 'object_key'])
    || pickFirst(dataObj || {}, ['imageObjectKey', 'attachmentObjectKey', 'objectKey'])
    || '',
  ).trim();

  if (mediaId || objectKey) {
    return { url: null, mediaId: mediaId || null, objectKey: objectKey || null };
  }

  return null;
}

function attachmentDedupeKey(attachment) {
  if (!attachment) return '';
  return String(
    attachment.url
    || `${attachment.mediaId || ''}|${attachment.objectKey || ''}`,
  ).trim();
}

/** Extract all image attachments from incident API payloads. */
export function extractIncidentImages(raw) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const dataObj = a.data && typeof a.data === 'object' ? a.data : null;
  const seen = new Set();
  const images = [];

  const push = (candidate) => {
    const parsed = parseImageAttachmentValue(candidate);
    const key = attachmentDedupeKey(parsed);
    if (!parsed || !key || seen.has(key)) return;
    seen.add(key);
    images.push(parsed);
  };

  const scalarCandidates = [
    a.image,
    a.imageUrl,
    a.image_url,
    a.photoUrl,
    a.photo_url,
    a.attachmentUrl,
    a.attachment_url,
    a.attachedImage,
    a.attached_image,
    a.evidenceImage,
    a.evidence_image,
    a.photo,
    a.picture,
    a.snapshot,
    a.attachment,
    a.media,
    a.imageAttachment,
    dataObj?.image,
    dataObj?.imageUrl,
    dataObj?.attachment,
    dataObj?.media,
  ];

  scalarCandidates.forEach(push);

  const arrayCandidates = [
    a.images,
    a.attachments,
    a.photos,
    a.mediaFiles,
    a.files,
    a.incidentImages,
    a.incident_images,
    dataObj?.images,
    dataObj?.attachments,
    dataObj?.photos,
    dataObj?.mediaFiles,
  ];

  arrayCandidates.forEach((arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach(push);
  });

  const mediaIds = [
    ...(Array.isArray(a.mediaIds) ? a.mediaIds : []),
    ...(Array.isArray(a.media_ids) ? a.media_ids : []),
    ...(Array.isArray(dataObj?.mediaIds) ? dataObj.mediaIds : []),
  ];
  mediaIds.forEach((id) => {
    const mediaId = String(id || '').trim();
    if (!mediaId) return;
    const key = `${mediaId}|`;
    if (seen.has(key)) return;
    seen.add(key);
    images.push({ url: null, mediaId, objectKey: null });
  });

  return images;
}

function normalizeAlertRecordId(raw, index) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const asString = (v) => {
    if (v == null || v === '') return null;
    if (typeof v === 'string') {
      const s = v.trim();
      return s || null;
    }
    if (typeof v === 'object' && typeof v.$oid === 'string' && v.$oid.trim()) return v.$oid.trim();
    const s = String(v).trim();
    return s && s !== '[object Object]' ? s : null;
  };
  const keys = ['id', '_id', 'alertId', 'alert_id', 'uuid'];
  for (const k of keys) {
    const out = asString(a[k]);
    if (out) return out;
  }
  return `AL-${index + 1}`;
}

/** Map API pending alert row to dashboard / modal view model. */
export function mapAlertToCase(raw, index) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const id = normalizeAlertRecordId(raw, index);
  const patient = patientDisplayName(a);
  const patientId = patientIdFrom(a);
  const type = String(pickFirst(a, ['type', 'alertType', 'alert_type', 'category', 'title']) || 'Alert');
  const reason = coerceAlertNote(pickFirst(a, ['reason', 'message', 'description', 'details', 'note', 'body']));
  const severity = normalizeWatchlistSeverity(pickFirst(a, ['severity', 'priority', 'level']));
  const caseStatus = normalizeCaseStatus(pickFirst(a, ['caseStatus', 'case_status', 'status', 'state']));
  const flaggedBy = String(pickFirst(a, ['flaggedBy', 'flagged_by', 'createdBy', 'created_by', 'reportedBy', 'source']) || '—');
  const flaggedDate = formatAlertDate(pickFirst(a, ['flaggedDate', 'flagged_date', 'createdAt', 'created_at', 'updatedAt', 'raisedAt'])) || '—';
  const nurse = nurseDisplayName(a) || (flaggedBy !== '—' ? flaggedBy : '') || 'Unassigned';
  const region = String(pickFirst(a, ['region', 'location', 'area', 'address']) || '—');
  const phone = String(pickFirst(a, ['phone', 'phoneNumber', 'phone_number', 'contact']) || '—');
  const dataObj = a.data && typeof a.data === 'object' ? a.data : null;
  const diagnosis = String(
    pickFirst(a, ['diagnosis', 'clinicalDiagnosis', 'primaryDiagnosis'])
    || (dataObj ? pickFirst(dataObj, ['diagnosis', 'clinicalDiagnosis']) : '')
    || '',
  );
  const ageRaw = pickFirst(a, ['age']);
  const ageNum = ageRaw != null && ageRaw !== '' ? Number(ageRaw) : NaN;
  const gender = String(pickFirst(a, ['gender']) || '');
  const vitalsRaw = pickFirst(a, ['vitals']) ?? (dataObj ? pickFirst(dataObj, ['vitals']) : undefined);
  const medsRaw = pickFirst(a, ['medications']) ?? (dataObj ? pickFirst(dataObj, ['medications', 'meds']) : undefined);
  const activitiesRaw = pickFirst(a, ['activities', 'timeline', 'history'])
    ?? (dataObj ? pickFirst(dataObj, ['activities', 'timeline', 'history']) : undefined);
  const code = coerceNonEmptyStr(pickFirst(a, ['code', 'caseCode', 'case_code', 'alertCode', 'alert_code']));

  const vitalKey = coerceNonEmptyStr(a.vitalKey);
  const vitalLabel = coerceNonEmptyStr(a.vitalLabel) || vitalKey;
  const vitals = normalizeVitals(vitalsRaw);
  if (a.value != null && String(a.value).trim() !== '' && vitalLabel) {
    vitals[vitalLabel] = String(a.value);
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
    flaggedDate,
    nurse: nurse,
    region: region || '—',
    phone: phone || '—',
    diagnosis,
    caseStatus,
    activities: normalizeActivities(activitiesRaw),
    vitals,
    medications: normalizeMedications(medsRaw),
    attachedImage: extractCaseImageAttachment(a),
  };
}

export function formatCaseStatusLabel(caseStatus) {
  const v = String(caseStatus ?? '').toLowerCase();
  if (v === 'open') return 'Open';
  if (v === 'in-progress') return 'In progress';
  if (v === 'resolved') return 'Resolved';
  return String(caseStatus ?? '').replace(/-/g, ' ') || '—';
}

export function formatSeverityLabel(severity) {
  const s = String(severity ?? '').toLowerCase();
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function patientInitials(name) {
  const parts = String(name || '').split(/\s+/).filter(Boolean);
  return parts.map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}
