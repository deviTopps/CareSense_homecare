import { apiFetch } from '../api';

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

function sessionsFromNurseBucket(bucket) {
  if (!bucket) return [];
  if (Array.isArray(bucket)) return bucket;
  if (typeof bucket !== 'object') return [];
  for (const key of ['sessions', 'attendance', 'attendances', 'records', 'clocks', 'visits', 'items', 'rows', 'data']) {
    if (Array.isArray(bucket[key])) return bucket[key];
  }
  return [];
}

/**
 * Normalize GET /attendance/nurses/monthly for one nurse (clock-in / clock-out sessions).
 *
 * @param {unknown} json
 * @param {string} [nurseId]
 * @returns {unknown[]}
 */
export function flattenNursesMonthlyAttendanceResponse(json, nurseId) {
  if (!json) return [];
  if (Array.isArray(json)) return json;

  const nid = String(nurseId || '').trim();
  const root = json?.data != null && typeof json.data === 'object' && !Array.isArray(json.data)
    ? { ...json, ...json.data }
    : json;

  const nursesList = root?.nurses ?? root?.nurseRecords ?? root?.byNurse;
  if (Array.isArray(nursesList)) {
    if (!nid) {
      return nursesList.flatMap((bucket) => sessionsFromNurseBucket(bucket));
    }
    const match = nursesList.find((bucket) => nurseBucketMatchesId(bucket, nid));
    return sessionsFromNurseBucket(match);
  }
  if (nursesList && typeof nursesList === 'object' && !Array.isArray(nursesList)) {
    if (nid && Array.isArray(nursesList[nid])) return nursesList[nid];
    if (nid) {
      for (const [key, val] of Object.entries(nursesList)) {
        if (String(key).trim() === nid) return sessionsFromNurseBucket(val);
      }
    }
    return Object.values(nursesList).flatMap((bucket) => sessionsFromNurseBucket(bucket));
  }

  const direct = root?.records
    ?? root?.attendances
    ?? root?.sessions
    ?? root?.items
    ?? root?.rows
    ?? root?.result
    ?? root?.attendance;
  if (Array.isArray(direct)) return direct;
  if (direct && typeof direct === 'object') {
    return sessionsFromNurseBucket(direct);
  }

  return sessionsFromNurseBucket(root);
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
 * Normalize GET /attendance/nurse/:nurseId/daily (clock-in / clock-out sessions).
 *
 * @param {unknown} json
 * @returns {unknown[]}
 */
export function flattenNurseDailyAttendanceResponse(json) {
  return flattenNursesMonthlyAttendanceResponse(json);
}

/**
 * Fetch one nurse's clock-in / clock-out records for a day.
 * GET /attendance/nurse/:nurseId/daily?date=YYYY-MM-DD
 *
 * @param {string} nurseId
 * @param {{ date?: string }} [query] — optional YYYY-MM-DD; omit for backend default (usually today)
 * @param {() => void} [onUnauthorized]
 * @returns {Promise<unknown>}
 */
export async function fetchNurseDailyAttendance(nurseId, query = {}, onUnauthorized) {
  const id = encodeURIComponent(String(nurseId).trim());
  if (!id) throw new Error('Nurse ID is required.');
  const q = new URLSearchParams();
  if (query.date != null && query.date !== '') q.set('date', String(query.date));
  const qs = q.toString();
  const path = `/attendance/nurse/${id}/daily${qs ? `?${qs}` : ''}`;

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
