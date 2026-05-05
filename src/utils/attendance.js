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

/**
 * Clock out an attendance session.
 * POST /attendance/:attendanceId/clock-out
 *
 * @param {string} attendanceId
 * @param {Record<string, unknown>} [payload]
 * @param {() => void} [onUnauthorized]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function clockOutAttendance(attendanceId, payload = {}, onUnauthorized) {
  const id = encodeURIComponent(String(attendanceId).trim());
  if (!id) throw new Error('Attendance ID is required to clock out.');
  const res = await apiFetch(
    `/attendance/${id}/clock-out`,
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
    const errText = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : text || `Clock-out failed (${res.status})`);
    throw new Error(errText);
  }
  return data;
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
