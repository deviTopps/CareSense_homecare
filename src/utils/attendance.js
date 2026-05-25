import { apiFetch, getToken, getUser } from '../api';

/** Session key for nurse UUID returned by GET /attendance/nurse/:id/daily */
export const ATTENDANCE_NURSE_ID_KEY = 'attendanceNurseId';

function isUuidV4ish(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

function getJwtPayload() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split('.')[1]));
  } catch {
    return null;
  }
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
  push(raw.nurse_id);
  push(raw.nurseUuid);
  push(raw.staffUuid);
  push(raw.uuid);
  push(raw.publicId);
  push(raw.accountId);
  push(raw.staffId);
  if (raw.nurse && typeof raw.nurse === 'object') {
    push(raw.nurse.id);
    push(raw.nurse._id);
    push(raw.nurse.nurseId);
    push(raw.nurse.nurseUuid);
    push(raw.nurse.uuid);
  }
  if (raw.user && typeof raw.user === 'object') {
    push(raw.user.nurseId);
    push(raw.user.id);
    push(raw.user._id);
    push(raw.user.uuid);
  }
  push(raw.id);
  push(raw._id);
  push(raw.userId);
  push(raw.sub);
  return out;
}

/** Find every UUID on a nurse row (GET /attendance/nurse/:uuid/daily requires UUID). */
function collectNurseUuidIdsFromRecord(nurse) {
  const uuids = new Set();
  for (const c of collectNurseIdCandidates(nurse || {})) {
    if (isUuidV4ish(c)) uuids.add(c);
  }
  const visited = new WeakSet();
  const walk = (obj, depth) => {
    if (!obj || typeof obj !== 'object' || depth > 6) return;
    if (visited.has(obj)) return;
    visited.add(obj);
    if (Array.isArray(obj)) {
      obj.forEach((item) => walk(item, depth + 1));
      return;
    }
    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && isUuidV4ish(value)) uuids.add(value.trim());
      else if (value && typeof value === 'object') walk(value, depth + 1);
    }
  };
  walk(nurse, 0);
  return [...uuids];
}

/**
 * Nurse IDs for GET /attendance/nurse/:id/daily?date=YYYY-MM-DD (all UUIDs per roster row).
 *
 * @param {Record<string, unknown>[]} nurses
 * @param {Record<string, unknown> | null} [user]
 * @returns {string[]}
 */
export function collectNurseIdsForDailyAttendanceFetch(nurses, user) {
  const ids = new Set();

  for (const n of nurses || []) {
    const uuids = collectNurseUuidIdsFromRecord(n);
    if (uuids.length) {
      uuids.forEach((u) => ids.add(u));
    } else {
      const fallback = resolveNurseApiIdFromNurseRecord(n);
      if (fallback) ids.add(fallback);
    }
  }

  const fromUser = resolveNurseIdForAttendance(user);
  if (fromUser) ids.add(fromUser);

  try {
    const stored = sessionStorage.getItem(ATTENDANCE_NURSE_ID_KEY);
    if (stored && isUuidV4ish(stored)) ids.add(stored.trim());
  } catch {
    /* ignore */
  }

  const uuidOnly = [...ids].filter(isUuidV4ish);
  if (uuidOnly.length) return uuidOnly;

  const fallback = new Set();
  for (const n of nurses || []) {
    const any = resolveNurseApiIdFromNurseRecord(n);
    if (any) fallback.add(any);
  }
  if (fromUser) fallback.add(fromUser);
  return [...fallback];
}

/**
 * Nurse UUID for GET /attendance/nurse/:nurseId/daily (prefers stored id from prior daily response).
 *
 * @param {Record<string, unknown> | null} [user]
 * @returns {string}
 */
export function resolveNurseIdForAttendance(user) {
  const candidates = [];
  for (const c of collectNurseIdCandidates(user || {})) {
    if (!candidates.includes(c)) candidates.push(c);
  }
  for (const c of collectNurseIdCandidates(getJwtPayload() || {})) {
    if (!candidates.includes(c)) candidates.push(c);
  }

  const fromAccount = candidates.find(isUuidV4ish);
  if (fromAccount) return fromAccount;

  try {
    const stored = sessionStorage.getItem(ATTENDANCE_NURSE_ID_KEY);
    if (stored && isUuidV4ish(stored)) return stored.trim();
  } catch {
    /* ignore */
  }

  return candidates[0] || '';
}

/** Best id for GET /attendance/nurse/:id/daily (prefers UUID). */
export function resolveNurseApiIdFromNurseRecord(nurse) {
  const candidates = collectNurseIdCandidates(nurse || {});
  const uuid = candidates.find(isUuidV4ish);
  return uuid || candidates[0] || '';
}

/**
 * Remember nurse.id from a daily attendance payload for subsequent requests.
 *
 * @param {unknown} json
 */
export function persistNurseIdFromAttendanceResponse(json, requestedNurseId) {
  const root = json && typeof json === 'object' && json.data && typeof json.data === 'object'
    ? json.data
    : json;
  if (!root || typeof root !== 'object') return;
  const nurseObj = root.nurse && typeof root.nurse === 'object' ? root.nurse : null;
  const id = nurseObj?.id ?? nurseObj?._id ?? nurseObj?.uuid;
  if (id == null || !isUuidV4ish(id)) return;
  const req = String(requestedNurseId || '').trim();
  const resolved = String(id).trim();
  if (req && resolved !== req) return;
  try {
    sessionStorage.setItem(ATTENDANCE_NURSE_ID_KEY, resolved);
  } catch {
    /* ignore */
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseYearMonthFromDateStr(dateStr) {
  const d = String(dateStr || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return { year: null, month: null };
  return { year: Number(d.slice(0, 4)), month: Number(d.slice(5, 7)) };
}

function formatAttendancePeriodLabel(year, month, fallback = '') {
  const y = Number(year);
  const m = Number(month);
  if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }
  const fb = String(fallback || '').trim();
  if (fb) return fb;
  return '';
}

/**
 * @param {unknown} json
 * @param {{ date?: string, month?: string }} [query]
 */
export function attendanceSummaryFromDailyResponse(json, query = {}) {
  const root = json && typeof json === 'object' && json.data && typeof json.data === 'object'
    ? { ...json, ...json.data }
    : json;
  if (!root || typeof root !== 'object') return null;

  let year = root.year;
  let month = root.month;

  if ((year == null || month == null) && Array.isArray(root.days) && root.days.length > 0) {
    for (const day of root.days) {
      const parsed = parseYearMonthFromDateStr(day?.date);
      if (parsed.year != null && parsed.month != null) {
        year = year ?? parsed.year;
        month = month ?? parsed.month;
        break;
      }
    }
  }

  const queryDate = query.date != null ? String(query.date).trim() : '';
  const queryMonth = query.month != null ? String(query.month).trim() : '';
  if (queryDate) {
    const parsed = parseYearMonthFromDateStr(queryDate);
    year = year ?? parsed.year;
    month = month ?? parsed.month;
  } else if (queryMonth && /^\d{4}-\d{2}$/.test(queryMonth)) {
    const [y, m] = queryMonth.split('-');
    year = year ?? Number(y);
    month = month ?? Number(m);
  }

  const periodLabel = formatAttendancePeriodLabel(year, month, queryDate || queryMonth);

  const presentDays = Number(root.presentDays);
  const absentDays = Number(root.absentDays);

  const totalRecords = Number(root.totalRecords);
  return {
    year: Number.isFinite(Number(year)) ? Number(year) : null,
    month: Number.isFinite(Number(month)) ? Number(month) : null,
    periodLabel,
    presentDays: Number.isFinite(presentDays) ? presentDays : null,
    absentDays: Number.isFinite(absentDays) ? absentDays : null,
    totalDays: root.totalDays,
    patientCount: root.patientCount,
    totalRecords: Number.isFinite(totalRecords) ? totalRecords : null,
    totalDuration: root.totalDuration,
    totalDurationMinutes: root.totalDurationMinutes,
  };
}

/** @param {unknown} json */
export function monthQueryFromDailyResponse(json) {
  const root = json && typeof json === 'object' && json.data && typeof json.data === 'object'
    ? { ...json, ...json.data }
    : json;
  if (!root || typeof root !== 'object') return '';
  const y = root.year;
  const m = root.month;
  if (y == null || m == null) return '';
  const monthNum = Number(m);
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return '';
  return `${Number(y)}-${String(monthNum).padStart(2, '0')}`;
}

function recordsFromPatientBucket(bucket) {
  if (!bucket || typeof bucket !== 'object') return [];
  for (const key of ['records', 'sessions', 'visits', 'attendance', 'attendances', 'clocks']) {
    if (Array.isArray(bucket[key])) return bucket[key];
  }
  return [];
}

function normalizeAttendanceRecord(record, extras = {}) {
  const base = record && typeof record === 'object' ? { ...record } : { value: record };
  const nested = base.attendance && typeof base.attendance === 'object'
    ? { ...base.attendance, ...base }
    : base;
  return { ...nested, ...extras };
}

/**
 * Clock in the signed-in user (nurse or staff).
 * POST /attendance/clock-in — body shape depends on backend; pass optional GPS, patientId, notes, etc.
 *
 * @param {Record<string, unknown>} payload
 * @param {() => void} [onUnauthorized]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function clockInAttendance(payload = {}, onUnauthorized) {
  const res = await apiFetch(
    '/attendance/clock-in',
    { method: 'POST', body: JSON.stringify(payload) },
    onUnauthorized,
  );
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const msg = data.error || data.message;
    const errText = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : text || `Clock-in failed (${res.status})`);
    throw new Error(errText);
  }
  return data;
}

function parseJsonBody(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function clockOutErrorFromResponse(res, text, data) {
  const msg = data.error ?? data.message;
  if (typeof msg === 'string') return msg;
  if (msg) return JSON.stringify(msg);
  if (text) return text;
  return `Clock-out failed (${res.status})`;
}

/**
 * Clock out an attendance session.
 *
 * Tries several URL + method + body shapes common in Express/Nest apps. The
 * path-style POST /attendance/:id/clock-out often 404s even when a body-style
 * POST /attendance/clock-out endpoint exists.
 */
export async function clockOutAttendance(attendanceId, payload = {}, onUnauthorized) {
  const rawId = String(attendanceId).trim();
  if (!rawId) throw new Error('Attendance ID is required to clock out.');
  const encodePath = encodeURIComponent(rawId);

  const base = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? { ...payload }
    : {};

  /** @type {{ method?: string, path: string, body: string }[]} */
  const strategies = [
    { path: '/attendance/clock-out', body: JSON.stringify({ ...base, attendanceId: rawId }) },
    { path: '/attendance/clock-out', body: JSON.stringify({ ...base, attendance_id: rawId }) },
    { path: '/attendance/clock-out', body: JSON.stringify({ ...base, id: rawId }) },
    { path: '/attendance/clock-out', body: JSON.stringify({ ...base, clockId: rawId }) },
    {
      path: `/attendance/clock-out?attendanceId=${encodeURIComponent(rawId)}`,
      body: JSON.stringify(base),
    },
    {
      path: `/attendance/clock-out?id=${encodeURIComponent(rawId)}`,
      body: JSON.stringify(base),
    },
    { path: `/attendance/${encodePath}/clock-out`, body: JSON.stringify(base), method: 'POST' },
    { path: `/attendance/${encodePath}/clock-out`, body: JSON.stringify(base), method: 'PATCH' },
    { path: `/attendance/${encodePath}/clock-out`, body: JSON.stringify(base), method: 'PUT' },
    { path: `/attendance/${encodePath}/checkout`, body: JSON.stringify(base), method: 'POST' },
    { path: `/attendances/${encodePath}/clock-out`, body: JSON.stringify(base) },
    { path: `/attendance/${encodePath}/clockOut`, body: JSON.stringify(base) },
    { path: '/attendance/clockOut', body: JSON.stringify({ ...base, attendanceId: rawId }) },
  ];

  let lastFail = null;

  for (let i = 0; i < strategies.length; i++) {
    const { path, body, method: m } = strategies[i];
    const method = m || 'POST';
    const res = await apiFetch(path, { method, body }, onUnauthorized);
    const text = await res.text();
    const data = parseJsonBody(text);

    if (res.ok) return data;

    lastFail = { res, text, data };

    /** First four POSTs to /attendance/clock-out use different JSON id keys — retry on 400. */
    const bodyKeyVariant = i <= 3;
    const tryNext =
      i < strategies.length - 1 &&
      (res.status === 404 ||
        res.status === 405 ||
        (bodyKeyVariant && res.status === 400));

    if (tryNext) continue;

    throw new Error(clockOutErrorFromResponse(res, text, data));
  }

  throw new Error(lastFail ? clockOutErrorFromResponse(lastFail.res, lastFail.text, lastFail.data) : 'Clock-out failed.');
}

function nurseBucketMatchesId(bucket, nurseId) {
  const nid = String(nurseId || '').trim();
  if (!nid || !bucket || typeof bucket !== 'object') return false;
  const ids = [
    bucket.nurseId,
    bucket.nurse_id,
    bucket.id,
    bucket._id,
    bucket.uuid,
    bucket.nurse?.id,
    bucket.nurse?._id,
    bucket.nurse?.uuid,
  ]
    .filter((v) => v != null && v !== '')
    .map((v) => String(v).trim());
  return ids.some((id) => id === nid);
}

function nurseMetaFromBucket(bucket) {
  if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) {
    return { nurseId: '', nurseName: '' };
  }
  const nurseObj = bucket.nurse && typeof bucket.nurse === 'object' ? bucket.nurse : null;
  const nurseId = [
    bucket.nurseId,
    bucket.nurse_id,
    bucket.id,
    bucket._id,
    bucket.uuid,
    nurseObj?.id,
    nurseObj?._id,
    nurseObj?.uuid,
    nurseObj?.nurseId,
  ]
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';

  const nurseName = [
    bucket.nurseName,
    bucket.nurseFullName,
    bucket.fullName,
    bucket.name,
    nurseObj?.name,
    nurseObj?.fullName,
    [bucket.firstName, bucket.lastName].filter(Boolean).join(' '),
    [nurseObj?.firstName, nurseObj?.lastName].filter(Boolean).join(' '),
  ]
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';

  return { nurseId, nurseName };
}

function enrichSessionsWithNurseMeta(bucket, sessions) {
  const { nurseId, nurseName } = nurseMetaFromBucket(bucket);
  if (!nurseId && !nurseName) return sessions;
  return sessions.map((session) => {
    if (!session || typeof session !== 'object') return session;
    return {
      ...session,
      nurseId: session.nurseId ?? session.nurse_id ?? nurseId ?? undefined,
      nurseName: session.nurseName ?? session.nurseFullName ?? nurseName ?? undefined,
      nurse: session.nurse ?? nurseName ?? undefined,
    };
  });
}

function sessionsFromNurseBucket(bucket) {
  if (!bucket) return [];
  if (Array.isArray(bucket)) return bucket;
  if (typeof bucket !== 'object') return [];
  for (const key of [
    'sessions',
    'attendance',
    'attendances',
    'records',
    'clocks',
    'visits',
    'items',
    'rows',
    'data',
    'completedSessions',
    'completed',
    'completedRecords',
    'finishedSessions',
    'clockInSessions',
    'dailySessions',
  ]) {
    if (Array.isArray(bucket[key])) return bucket[key];
  }
  return [];
}

/**
 * Flatten calendar payloads: { nurse, days: [{ date, records: [...] }] }.
 *
 * @param {unknown} root
 * @returns {unknown[] | null} — null when root has no days array
 */
function flattenDaysCalendarAttendanceResponse(root) {
  if (!root || typeof root !== 'object' || Array.isArray(root)) return null;
  const days = root.days;
  const hasDays = Array.isArray(days);
  const byPatient = root.byPatient;

  const sessions = [];

  if (hasDays) {
    for (const day of days) {
      if (!day || typeof day !== 'object') continue;
      const date = String(day.date || '').trim().slice(0, 10);
      const dayDate = date || undefined;
      const records = recordsForCalendarDay(day);

      for (const record of records) {
        const merged = normalizeAttendanceRecord(record, {
          date: dayDate,
          visitDate: dayDate,
        });
        if (
          merged.durationMinutes == null
          && merged.duration_minutes == null
          && day.totalDurationMinutes != null
          && records.length === 1
        ) {
          merged.durationMinutes = day.totalDurationMinutes;
        }
        sessions.push(merged);
      }

      if (
        records.length === 0
        && day.present
        && (Number(day.totalDurationMinutes) > 0 || day.totalDuration)
      ) {
        sessions.push({
          date: dayDate,
          visitDate: dayDate,
          present: true,
          durationMinutes: day.totalDurationMinutes,
          totalDuration: day.totalDuration,
          _daySummary: true,
        });
      }
    }
  }

  if (Array.isArray(byPatient)) {
    for (const bucket of byPatient) {
      if (!bucket || typeof bucket !== 'object') continue;
      const patientName = bucket.patientName ?? bucket.name
        ?? (bucket.patient && typeof bucket.patient === 'object'
          ? [bucket.patient.firstName, bucket.patient.lastName].filter(Boolean).join(' ')
          : null);
      const patientId = bucket.patientId ?? bucket.id
        ?? (bucket.patient && typeof bucket.patient === 'object' ? bucket.patient.id : null);
      const dateHint = String(bucket.date || bucket.visitDate || '').trim().slice(0, 10) || undefined;

      for (const record of recordsFromPatientBucket(bucket)) {
        sessions.push(normalizeAttendanceRecord(record, {
          date: dateHint,
          visitDate: dateHint,
          patientId,
          patientName,
          patient: patientName ?? bucket.patient,
        }));
      }
    }
  }

  if (!hasDays && !Array.isArray(byPatient)) return null;

  return enrichSessionsWithNurseMeta(root, sessions);
}

/** True when API item has both clock-in and clock-out timestamps. */
export function isCompletedAttendanceSession(item) {
  if (!item || typeof item !== 'object') return false;
  if (item._daySummary) return true;
  const clockIn = pickAttendanceField(item, 'in');
  const clockOut = pickAttendanceField(item, 'out');
  if (clockIn != null && clockIn !== '' && clockOut != null && String(clockOut).trim() !== '') {
    return true;
  }
  const dur = item.durationMinutes ?? item.duration_minutes ?? item.totalDurationMinutes;
  return dur != null && Number(dur) > 0;
}

function unwrapAttendanceTimeValue(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'object' && !Array.isArray(val)) {
    const nested = val.time ?? val.at ?? val.timestamp ?? val.dateTime ?? val.datetime ?? val.date;
    if (nested != null && nested !== '') return nested;
    return null;
  }
  return val;
}

/** @param {Record<string, unknown>} item @param {'in'|'out'} kind */
export function pickAttendanceField(item, kind) {
  if (!item || typeof item !== 'object') return null;
  const keys = kind === 'in'
    ? [
      'clockInTime', 'clockIn', 'clockedInAt', 'checkInTime', 'clock_in', 'clock_in_time',
      'clocked_in_at', 'check_in_time', 'checkIn', 'check_in', 'startTime', 'start_time',
      'timeIn', 'time_in', 'inTime', 'in_time', 'checkInAt', 'check_in_at',
    ]
    : [
      'clockOutTime', 'clockOut', 'clockedOutAt', 'checkOutTime', 'clock_out', 'clock_out_time',
      'clocked_out_at', 'check_out_time', 'checkOut', 'check_out', 'endTime', 'end_time',
      'timeOut', 'time_out', 'outTime', 'out_time', 'checkOutAt', 'check_out_at',
    ];
  for (const key of keys) {
    const v = unwrapAttendanceTimeValue(item[key]);
    if (v != null && v !== '') return v;
  }
  const clock = item.clock;
  if (clock && typeof clock === 'object' && !Array.isArray(clock)) {
    const slot = kind === 'in'
      ? (clock.in ?? clock.inTime ?? clock.start)
      : (clock.out ?? clock.outTime ?? clock.end);
    const v = unwrapAttendanceTimeValue(slot);
    if (v != null && v !== '') return v;
  }
  const times = item.times;
  if (times && typeof times === 'object' && !Array.isArray(times)) {
    const slot = kind === 'in' ? times.in : times.out;
    const v = unwrapAttendanceTimeValue(slot);
    if (v != null && v !== '') return v;
  }
  return null;
}

/** @param {unknown} item */
export function attendanceHasRecordContent(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  if (Array.isArray(item.days) && (item.month != null || item.totalDays != null)) return false;
  if (Array.isArray(item.records) && (item.totalRecords != null || item.nurse)) return false;
  if (item._daySummary) return true;
  if (item.id && (item.clockInTime || item.clockOutTime || item.date)) return true;
  if (pickAttendanceField(item, 'in') || pickAttendanceField(item, 'out')) return true;
  const dur = item.durationMinutes ?? item.duration_minutes ?? item.totalDurationMinutes;
  if (dur != null && Number(dur) > 0) return true;
  if (item.attendanceId || item.attendance_id || item.clockId || item.clock_id) return true;
  if (item.visitId || item.visit_id) return true;
  if (
    (item.patientId || item.patientName || item.patient)
    && (pickAttendanceField(item, 'in') || pickAttendanceField(item, 'out') || (dur != null && Number(dur) > 0))
  ) {
    return true;
  }
  if (item.present && (dur != null && Number(dur) > 0)) return true;
  return false;
}

function isAttendanceCalendarEnvelope(obj) {
  return Boolean(
    obj && typeof obj === 'object' && Array.isArray(obj.days)
    && (obj.month != null || obj.year != null || obj.totalDays != null),
  );
}

function dedupeAttendanceSessions(sessions) {
  const seen = new Set();
  const out = [];
  for (const session of sessions) {
    if (!session || typeof session !== 'object') continue;
    const key = [
      session.id,
      session._id,
      session.uuid,
      session.attendanceId,
      session.date,
      session.visitDate,
      pickAttendanceField(session, 'in'),
      pickAttendanceField(session, 'out'),
    ].map((v) => String(v ?? '').trim()).filter(Boolean).join('|');
    if (!key) {
      out.push(session);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(session);
  }
  return out;
}

/**
 * Walk API JSON and collect attendance-like objects (fallback when calendar flatten is empty).
 *
 * @param {unknown} root
 * @param {number} [maxDepth]
 * @returns {unknown[]}
 */
function collectAttendanceRecordsDeep(root, maxDepth = 12) {
  const out = [];
  const seen = new WeakSet();

  const visit = (node, depth, parentDate) => {
    if (node == null || depth > maxDepth) return;
    if (typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1, parentDate);
      return;
    }

    if (isAttendanceCalendarEnvelope(node)) {
      const fromCal = flattenDaysCalendarAttendanceResponse(node);
      if (fromCal?.length) out.push(...fromCal);
      return;
    }

    const dateHint = String(node.date || node.visitDate || parentDate || '').trim().slice(0, 10) || parentDate;

    if (attendanceHasRecordContent(node)) {
      out.push(normalizeAttendanceRecord(node, {
        date: dateHint || undefined,
        visitDate: dateHint || undefined,
      }));
      return;
    }

    for (const val of Object.values(node)) {
      if (val && typeof val === 'object') visit(val, depth + 1, dateHint || parentDate);
    }
  };

  visit(root, 0, '');
  return dedupeAttendanceSessions(out.filter(attendanceHasRecordContent));
}

function recordsForCalendarDay(day) {
  if (!day || typeof day !== 'object') return [];
  const out = [];
  for (const key of [
    'records', 'sessions', 'visits', 'attendance', 'attendances', 'clocks', 'clockRecords', 'visitRecords',
  ]) {
    const val = day[key];
    if (Array.isArray(val)) out.push(...val);
    else if (val && typeof val === 'object') out.push(val);
  }
  if (
    !out.length
    && (pickAttendanceField(day, 'in') || pickAttendanceField(day, 'out') || day.present)
  ) {
    out.push(day);
  }
  return out;
}

/**
 * Normalize GET /attendance/nurses/monthly for one nurse (clock-in / clock-out sessions).
 *
 * @param {unknown} json
 * @param {string} [nurseId]
 * @returns {unknown[]}
 */
function flattenSessionsFromNurseBucket(bucket) {
  if (!bucket || typeof bucket !== 'object') return [];
  const fromDays = flattenDaysCalendarAttendanceResponse(bucket);
  if (fromDays != null && fromDays.length > 0) {
    return fromDays;
  }
  const sessions = sessionsFromNurseBucket(bucket);
  if (sessions.length > 0) {
    return enrichSessionsWithNurseMeta(bucket, sessions.filter(attendanceHasRecordContent));
  }
  const deep = collectAttendanceRecordsDeep(bucket);
  if (deep.length > 0) return enrichSessionsWithNurseMeta(bucket, deep);
  return [];
}

export function flattenNursesMonthlyAttendanceResponse(json, nurseId) {
  if (!json) return [];
  if (Array.isArray(json)) {
    return dedupeAttendanceSessions(json.filter(attendanceHasRecordContent));
  }

  const nid = String(nurseId || '').trim();
  const root = json?.data != null && typeof json.data === 'object' && !Array.isArray(json.data)
    ? { ...json, ...json.data }
    : json;

  const fromDays = flattenDaysCalendarAttendanceResponse(root);
  if (fromDays != null && fromDays.length > 0) {
    return fromDays;
  }

  const nursesList = root?.nurses ?? root?.nurseRecords ?? root?.byNurse ?? root?.nurseAttendances;
  if (Array.isArray(nursesList)) {
    if (!nid) {
      return dedupeAttendanceSessions(
        nursesList.flatMap((bucket) => flattenSessionsFromNurseBucket(bucket)),
      );
    }
    const match = nursesList.find((bucket) => nurseBucketMatchesId(bucket, nid));
    return flattenSessionsFromNurseBucket(match);
  }
  if (nursesList && typeof nursesList === 'object' && !Array.isArray(nursesList)) {
    if (nid) {
      for (const [key, val] of Object.entries(nursesList)) {
        if (String(key).trim() === nid || nurseBucketMatchesId(val, nid)) {
          return flattenSessionsFromNurseBucket(
            val && typeof val === 'object' ? { ...val, nurseId: val.nurseId || key } : val,
          );
        }
      }
    }
    return dedupeAttendanceSessions(
      Object.entries(nursesList).flatMap(([key, val]) => {
        const bucket = val && typeof val === 'object' ? { ...val } : { sessions: val };
        if (!bucket.nurseId && !bucket.id) bucket.nurseId = key;
        return flattenSessionsFromNurseBucket(bucket);
      }),
    );
  }

  const direct = root?.records
    ?? root?.attendances
    ?? root?.sessions
    ?? root?.items
    ?? root?.rows
    ?? root?.result
    ?? root?.attendance;
  if (Array.isArray(direct) && direct.length > 0) {
    return enrichSessionsWithNurseMeta(root, direct.filter(attendanceHasRecordContent));
  }
  if (direct && typeof direct === 'object') {
    const fromBucket = flattenSessionsFromNurseBucket(direct);
    if (fromBucket.length > 0) return fromBucket;
  }

  const deep = collectAttendanceRecordsDeep(root);
  if (deep.length > 0) return enrichSessionsWithNurseMeta(root, deep);

  return collectAttendanceRecordsDeep(json);
}

/**
 * Normalize GET /attendance/nurse/:nurseId/monthly (clock-in / clock-out sessions).
 *
 * @param {unknown} json
 * @returns {unknown[]}
 */
export function flattenNurseMonthlyAttendanceResponse(json) {
  return flattenNursesMonthlyAttendanceResponse(json);
}

/**
 * Fetch all nurses' clock-in / clock-out sessions for a calendar month.
 * GET /attendance/nurses/monthly?month=YYYY-MM
 *
 * @param {{ month?: string }} [query] — month as "2026-06"; defaults to current month when omitted
 * @param {() => void} [onUnauthorized]
 * @returns {Promise<unknown>}
 */
export async function fetchNursesMonthlyAttendance(query = {}, onUnauthorized) {
  const q = new URLSearchParams();
  const month = query?.month != null ? String(query.month).trim() : '';
  if (month) {
    q.set('month', month);
  } else {
    const now = new Date();
    q.set('month', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }
  const path = `/attendance/nurses/monthly?${q.toString()}`;

  const res = await apiFetch(path, { method: 'GET' }, onUnauthorized);
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const msg = data.error || data.message;
    const errText = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : text || `Failed to load nurses monthly attendance (${res.status})`);
    throw new Error(errText);
  }
  return data;
}

/**
 * @param {() => void} [onUnauthorized]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function fetchNursesDirectory(onUnauthorized) {
  const res = await apiFetch('/nurses', { method: 'GET', quiet: true }, onUnauthorized);
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const msg = data.error || data.message;
    throw new Error(typeof msg === 'string' ? msg : `Failed to load nurses (${res.status})`);
  }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.nurses)) return data.nurses;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

const ATTENDANCE_FETCH_CONCURRENCY = 6;

/**
 * Load all nurses' attendance: monthly bundle, then per-nurse daily as fallback.
 *
 * @param {{ month?: string, date?: string }} query
 * @param {() => void} [onUnauthorized]
 */
export async function fetchAllNursesAttendanceRecords(query = {}, onUnauthorized) {
  const month = query.month != null ? String(query.month).trim() : '';
  let date = query.date != null ? String(query.date).trim() : '';
  if (!date) {
    const now = new Date();
    if (month) {
      const [y, m] = month.split('-');
      const isCurrentMonth = y === String(now.getFullYear())
        && m === String(now.getMonth() + 1).padStart(2, '0');
      date = isCurrentMonth
        ? now.toISOString().slice(0, 10)
        : `${y}-${m}-01`;
    } else {
      date = now.toISOString().slice(0, 10);
    }
  }
  const dailyQuery = { date };

  let nurses = [];
  try {
    nurses = await fetchNursesDirectory(onUnauthorized);
  } catch {
    return { sessions: [], source: 'none', dailyBody: null, nursesFetched: 0, date };
  }

  const ids = collectNurseIdsForDailyAttendanceFetch(nurses, getUser());

  const aggregated = [];
  let lastDailyBody = null;
  for (let i = 0; i < ids.length; i += ATTENDANCE_FETCH_CONCURRENCY) {
    const chunk = ids.slice(i, i + ATTENDANCE_FETCH_CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((nurseId) => fetchNurseDailyAttendance(nurseId, dailyQuery, onUnauthorized)),
    );
    for (let j = 0; j < results.length; j += 1) {
      const result = results[j];
      if (result.status !== 'fulfilled') continue;
      lastDailyBody = result.value;
      persistNurseIdFromAttendanceResponse(result.value, chunk[j]);
      const nurseMeta = nurses.find(
        (n) => collectNurseUuidIdsFromRecord(n).includes(chunk[j])
          || resolveNurseApiIdFromNurseRecord(n) === chunk[j],
      ) || {};
      const flat = flattenNurseDailyAttendanceResponse(result.value);
      aggregated.push(
        ...flat.map((session) => ({
          ...session,
          nurseId: session.nurseId ?? chunk[j],
          nurseName: session.nurseName
            ?? [nurseMeta.firstName, nurseMeta.lastName].filter(Boolean).join(' ').trim()
            ?? nurseMeta.name,
        })),
      );
    }
  }

  const sessions = dedupeAttendanceSessions(aggregated);
  if (sessions.length > 0) {
    return {
      sessions,
      source: 'daily',
      dailyBody: lastDailyBody,
      nursesFetched: ids.length,
      date,
    };
  }

  let monthlyBody = null;
  try {
    monthlyBody = await fetchNursesMonthlyAttendance({ month: month || date.slice(0, 7) }, onUnauthorized);
    const monthlySessions = flattenNursesMonthlyAttendanceResponse(monthlyBody);
    if (monthlySessions.length > 0) {
      return {
        sessions: monthlySessions,
        source: 'monthly',
        dailyBody: monthlyBody,
        nursesFetched: ids.length,
        date,
      };
    }
  } catch {
    monthlyBody = null;
  }

  return {
    sessions: [],
    source: 'daily',
    dailyBody: lastDailyBody,
    nursesFetched: ids.length,
    date,
  };
}

/**
 * Fetch one nurse's clock-in / clock-out sessions for a calendar month.
 * GET /attendance/nurse/:nurseId/monthly?month=YYYY-MM
 *
 * @param {string} nurseId
 * @param {{ month: string }} query — month as "2026-06"
 * @param {() => void} [onUnauthorized]
 * @returns {Promise<unknown>}
 */
export async function fetchNurseMonthlyAttendance(nurseId, query, onUnauthorized) {
  const id = encodeURIComponent(String(nurseId).trim());
  if (!id) throw new Error('Nurse ID is required.');
  const month = query?.month != null ? String(query.month).trim() : '';
  if (!month) throw new Error('Month query (YYYY-MM) is required.');
  const q = new URLSearchParams();
  q.set('month', month);
  const path = `/attendance/nurse/${id}/monthly?${q.toString()}`;

  const res = await apiFetch(path, { method: 'GET' }, onUnauthorized);
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const msg = data.error || data.message;
    const errText = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : text || `Failed to load monthly attendance (${res.status})`);
    throw new Error(errText);
  }
  return data;
}

/**
 * GET /attendance/nurse/:id/daily?date=YYYY-MM-DD → { nurse, records: [...] }
 *
 * @param {unknown} root
 * @returns {unknown[] | null}
 */
function flattenNurseDailyRecordsPayload(root) {
  if (!root || typeof root !== 'object' || Array.isArray(root)) return null;
  const body = unwrapAttendanceApiPayload(root);
  if (!Array.isArray(body.records)) return null;
  root = body;

  const nurseMeta = root.nurse && typeof root.nurse === 'object' ? root.nurse : {};
  const sessions = root.records.map((record) => {
    const base = normalizeAttendanceRecord(record, {
      date: record?.date,
      nurse: record?.nurse ?? nurseMeta,
    });
    if (!base.nurseName && nurseMeta) {
      const name = [nurseMeta.firstName, nurseMeta.lastName].filter(Boolean).join(' ').trim();
      if (name) base.nurseName = name;
    }
    return base;
  });

  return enrichSessionsWithNurseMeta({ nurse: nurseMeta, ...root }, sessions);
}

function formatPatientDisplayName(patientObj) {
  if (!patientObj || typeof patientObj !== 'object') return '';
  return [patientObj.firstName, patientObj.lastName].filter(Boolean).join(' ').trim()
    || String(patientObj.name || patientObj.fullName || '').trim();
}

function formatNurseDisplayName(nurseObj) {
  if (!nurseObj || typeof nurseObj !== 'object') return '';
  return [nurseObj.firstName, nurseObj.lastName].filter(Boolean).join(' ').trim()
    || String(nurseObj.name || nurseObj.fullName || '').trim();
}

/** Unwrap nested { data } / { success, records } envelopes from attendance API responses. */
export function unwrapAttendanceApiPayload(json) {
  let root = json;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!root || typeof root !== 'object' || Array.isArray(root)) break;
    const inner = root.data ?? root.payload ?? root.result ?? root.body;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      root = { ...root, ...inner };
    } else break;
  }
  return root;
}

/** Same path as GET /attendance/nurse/:nurseId/daily?date=YYYY-MM-DD */
export function nurseDailyAttendanceApiPath(nurseId, dateYYYYMMDD) {
  const id = encodeURIComponent(String(nurseId || '').trim());
  const date = String(dateYYYYMMDD || '').trim();
  return date
    ? `/attendance/nurse/${id}/daily?date=${encodeURIComponent(date)}`
    : `/attendance/nurse/${id}/daily`;
}

function stringFromClockDisplayField(displayField) {
  if (displayField == null || displayField === '') return '';
  if (typeof displayField === 'object' && !Array.isArray(displayField)) {
    const t = displayField.time ?? displayField.label ?? displayField.value;
    return t != null ? String(t).trim() : '';
  }
  return String(displayField).trim();
}

/** Table-friendly clock label: prefer API display, else short local time from ISO. */
function formatAttendanceTimeForTable(raw, displayField) {
  const fromDisplay = stringFromClockDisplayField(displayField);
  if (fromDisplay) return fromDisplay;
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (s.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
  }
  return s;
}

function parseGpsFromRecord(record) {
  if (!record || typeof record !== 'object') return { gps: null, gpsIn: null, gpsOut: null };
  const lat = record.latitude ?? record.lat;
  const lng = record.longitude ?? record.lng ?? record.lon;
  const pair = (la, ln) => {
    if (la == null || ln == null || la === '' || ln === '') return null;
    const a = Number(la);
    const b = Number(ln);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return { lat: a, lng: b };
  };
  let gpsIn = pair(
    record.clockInLatitude ?? record.clock_in_latitude,
    record.clockInLongitude ?? record.clock_in_longitude,
  );
  let gpsOut = pair(
    record.clockOutLatitude ?? record.clock_out_latitude,
    record.clockOutLongitude ?? record.clock_out_longitude,
  );
  const gps = pair(lat, lng) || gpsIn || gpsOut;
  if (!gpsIn && gps) gpsIn = gps;
  return { gps, gpsIn, gpsOut };
}

function resolveAttendanceStatus(record) {
  if (!record || typeof record !== 'object') return 'verified';
  if (record.flaggedForReview === true) return 'flagged';
  const raw = String(record.status || '').toLowerCase();
  if (raw === 'missed') return 'missed';
  if (raw === 'flagged') return 'flagged';
  if (raw === 'clocked-out' || raw === 'completed' || raw === 'verified') return 'verified';
  return 'verified';
}

/**
 * Map one daily API record → table row (GET /attendance/nurse/:id/daily?date=).
 *
 * @param {Record<string, unknown>} record
 * @returns {Record<string, unknown> | null}
 */
export function mapAttendanceRecordToTableRow(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;

  const hasContent = Boolean(
    record.id
    || record.clockInTime
    || record.clockOutTime
    || record.clockInDisplay
    || record.clockOutDisplay
    || pickAttendanceField(record, 'in')
    || pickAttendanceField(record, 'out')
    || record.patient
    || record.patientName
    || record.patientId,
  );
  if (!hasContent) return null;

  const nurseRaw = record.nurse;
  const nurseObj = nurseRaw && typeof nurseRaw === 'object' && !Array.isArray(nurseRaw) ? nurseRaw : null;
  const patientRaw = record.patient;
  const patientObj = patientRaw && typeof patientRaw === 'object' && !Array.isArray(patientRaw) ? patientRaw : null;

  let nurseName = formatNurseDisplayName(nurseObj) || String(record.nurseName || record.nurseFullName || '').trim();
  if (!nurseName && typeof nurseRaw === 'string') nurseName = nurseRaw.trim();

  let patientName = formatPatientDisplayName(patientObj) || String(record.patientName || record.patientFullName || '').trim();
  if (!patientName && typeof patientRaw === 'string') patientName = patientRaw.trim();

  const patientId = (patientObj?.id != null ? String(patientObj.id).trim() : '')
    || String(record.patientId || record.patient_id || '').trim();
  const registration = (patientObj?.registrationNumber != null
    ? String(patientObj.registrationNumber).trim()
    : '')
    || String(record.registrationNumber || record.registration_number || '').trim();

  const date = String(record.date || record.visitDate || '').trim().slice(0, 10);
  const clockInRaw = record.clockInTime ?? pickAttendanceField(record, 'in');
  const clockOutRaw = record.clockOutTime ?? pickAttendanceField(record, 'out');
  const clockInTimeLabel = formatAttendanceTimeForTable(clockInRaw, record.clockInDisplay);
  const clockOutTimeLabel = formatAttendanceTimeForTable(clockOutRaw, record.clockOutDisplay);

  const locationIn = String(
    record.location ?? record.clockInLocation ?? record.clock_in_location ?? '',
  ).trim();
  const locationOut = String(
    record.clockOutLocation ?? record.clock_out_location ?? '',
  ).trim();
  const { gps, gpsIn, gpsOut } = parseGpsFromRecord(record);

  const durationLabel = record.duration != null ? String(record.duration).trim() : '';

  return {
    id: String(record.id || record._id || '').trim() || `att-${date}-${clockInRaw || Date.now()}`,
    nurseId: (nurseObj?.id != null ? String(nurseObj.id).trim() : '')
      || String(record.nurseId || record.nurse_id || '').trim(),
    nurse: nurseName || '—',
    patient: patientName || patientId || '—',
    patientServed: patientName || patientId || '—',
    patientName: patientName || '—',
    patientId,
    patientRegistration: registration,
    patientPhone: '',
    patientAddress: '',
    date: date || '—',
    clockIn: clockInTimeLabel,
    clockOut: clockOutTimeLabel,
    clockInTimeLabel,
    clockOutTimeLabel,
    clockInMs: clockInRaw ? new Date(String(clockInRaw)).getTime() : null,
    clockOutMs: clockOutRaw ? new Date(String(clockOutRaw)).getTime() : null,
    durationMinutesFromApi: record.durationMinutes ?? record.duration_minutes,
    duration: durationLabel,
    gps,
    gpsIn,
    gpsOut,
    locationIn,
    locationOut,
    distance: record.distanceFromPatient != null
      ? String(record.distanceFromPatient)
      : (record.distance != null ? String(record.distance) : null),
    status: resolveAttendanceStatus(record),
    region: '—',
    _fromDailyApi: true,
  };
}

/** Plain-text values for Patient served, Clock in/out, GPS table columns. */
export function getAttendanceColumnValues(row) {
  if (!row || typeof row !== 'object') {
    return { patientServed: '—', clockIn: '—', clockOut: '—', gps: '—' };
  }

  const patientServed = String(
    row.patientServed || row.patientName || row.patient || '',
  ).trim() || '—';

  const clockIn = stringFromClockDisplayField(row.clockInTimeLabel)
    || stringFromClockDisplayField(row.clockInDisplay)
    || stringFromClockDisplayField(row.clockIn)
    || '—';

  const clockOut = stringFromClockDisplayField(row.clockOutTimeLabel)
    || stringFromClockDisplayField(row.clockOutDisplay)
    || stringFromClockDisplayField(row.clockOut)
    || '—';

  const gpsParts = [];
  const locIn = String(row.locationIn || '').trim();
  const locOut = String(row.locationOut || '').trim();
  if (locIn) gpsParts.push(locIn);
  else if (row.gpsIn?.lat != null && row.gpsIn?.lng != null) {
    gpsParts.push(`${Number(row.gpsIn.lat).toFixed(5)}, ${Number(row.gpsIn.lng).toFixed(5)}`);
  } else if (row.gps?.lat != null && row.gps?.lng != null) {
    gpsParts.push(`${Number(row.gps.lat).toFixed(5)}, ${Number(row.gps.lng).toFixed(5)}`);
  }
  if (locOut) gpsParts.push(locOut);
  else if (row.gpsOut?.lat != null && row.gpsOut?.lng != null) {
    gpsParts.push(`${Number(row.gpsOut.lat).toFixed(5)}, ${Number(row.gpsOut.lng).toFixed(5)}`);
  }

  return {
    patientServed,
    clockIn,
    clockOut,
    gps: gpsParts.length ? gpsParts.join(' · ') : '—',
  };
}

/**
 * @param {unknown[]} sessions
 * @returns {Record<string, unknown>[]}
 */
export function mapAttendanceSessionsToTableRows(sessions) {
  if (!Array.isArray(sessions)) return [];
  return sessions
    .map((item) => mapAttendanceRecordToTableRow(
      item && typeof item === 'object' ? item : null,
    ))
    .filter((row) => row != null && row.id);
}

/**
 * Normalize GET /attendance/nurse/:nurseId/daily (completed clock-in / clock-out sessions).
 *
 * @param {unknown} json
 * @returns {unknown[]}
 */
export function flattenNurseDailyAttendanceResponse(json) {
  if (!json) return [];
  if (Array.isArray(json)) {
    return dedupeAttendanceSessions(json.filter(attendanceHasRecordContent));
  }

  const unwrapped = unwrapAttendanceApiPayload(json);
  const roots = [unwrapped, json, json?.data, json?.payload, json?.result].filter(
    (value) => value && typeof value === 'object' && !Array.isArray(value),
  );

  for (const root of roots) {
    const fromRecords = flattenNurseDailyRecordsPayload(root);
    if (fromRecords != null) return fromRecords;

    const fromDays = flattenDaysCalendarAttendanceResponse(root);
    if (fromDays != null && fromDays.length > 0) {
      return fromDays;
    }

    for (const key of [
      'completedSessions',
      'completed',
      'completedRecords',
      'finishedSessions',
      'sessions',
      'attendance',
      'attendances',
      'records',
      'attendanceRecords',
      'visitRecords',
      'visits',
      'clocks',
      'data',
    ]) {
      if (Array.isArray(root[key]) && root[key].length > 0) {
        const rows = root[key].filter(attendanceHasRecordContent);
        if (rows.length > 0) return enrichSessionsWithNurseMeta(root, rows);
      }
    }

    const deep = collectAttendanceRecordsDeep(root);
    if (deep.length > 0) return enrichSessionsWithNurseMeta(root, deep);
  }

  const monthly = flattenNursesMonthlyAttendanceResponse(json);
  if (monthly.length > 0) return monthly.filter(attendanceHasRecordContent);

  return collectAttendanceRecordsDeep(json);
}

/**
 * Fetch one nurse's clock-in / clock-out records for a day.
 * GET /attendance/nurse/:nurseId/daily?date=YYYY-MM-DD
 *
 * @param {string} nurseId
 * @param {{ date?: string, month?: string }} [query] — optional YYYY-MM-DD or YYYY-MM calendar month
 * @param {() => void} [onUnauthorized]
 * @returns {Promise<unknown>}
 */
export async function fetchNurseDailyAttendance(nurseId, query = {}, onUnauthorized) {
  const rawId = String(nurseId).trim();
  if (!rawId) throw new Error('Nurse ID is required.');
  const date = query.date != null ? String(query.date).trim() : '';
  const month = query.month != null ? String(query.month).trim() : '';
  const path = date
    ? nurseDailyAttendanceApiPath(rawId, date)
    : (() => {
      const q = new URLSearchParams();
      if (month) q.set('month', month);
      const qs = q.toString();
      return `/attendance/nurse/${encodeURIComponent(rawId)}/daily${qs ? `?${qs}` : ''}`;
    })();

  const res = await apiFetch(path, { method: 'GET' }, onUnauthorized);
  const text = await res.text();
  let parsed = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }
  }
  if (!res.ok) {
    const msg = parsed.error || parsed.message;
    const errText = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : text || `Failed to load daily attendance (${res.status})`);
    throw new Error(errText);
  }
  return parsed;
}
