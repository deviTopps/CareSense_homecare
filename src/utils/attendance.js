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

/**
 * Fetch one nurse's attendance for a calendar month.
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
 * Fetch one nurse's clock-in / clock-out records for a day.
 * GET /attendance/nurse/:nurseId/daily
 *
 * @param {string} nurseId
 * @param {{ date?: string }} [query] — optional YYYY-MM-DD (backend-dependent)
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
