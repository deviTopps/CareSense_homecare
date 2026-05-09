const API_BASE = 'https://care-sense-backend.onrender.com/api';

export { API_BASE };

/**
 * Helper: get the stored auth token.
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Helper: get the stored user object.
 */
export function getUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Helper: check if the JWT token is still valid (not expired).
 */
export function isTokenValid() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/**
 * Clear all auth data from storage.
 */
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Bearer token and handles 401 responses.
 * @param {string} path — API path (e.g. '/nurses')
 * @param {RequestInit & { quiet?: boolean }} options — fetch options; set `quiet: true` to omit verbose console logging
 * @param {Function} onUnauthorized — callback when token is invalid/expired
 */
export async function apiFetch(path, options = {}, onUnauthorized) {
  const quiet = Boolean(options.quiet);
  const { quiet: _quiet, ...restOptions } = options || {};
  const token = getToken();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Don't set Content-Type for FormData — browser sets it with the correct boundary
  const isFormData = restOptions.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(restOptions.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const requestUrl = `${API_BASE}${normalizedPath}`;
  const requestOptions = { ...restOptions, headers };

  if (!quiet) {
    console.log('[apiFetch] →', requestOptions.method || 'GET', requestUrl);
    console.log('[apiFetch] headers:', JSON.stringify(headers));
    if (restOptions.body) console.log('[apiFetch] body:', restOptions.body);
  }

  let res;
  const delays = [2000, 5000, 8000]; // Render free tier can take 10-30s to wake
  let lastError;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      res = await fetch(requestUrl, requestOptions);
      break; // success
    } catch (error) {
      lastError = error;
      if (attempt < delays.length) {
        if (!quiet) console.warn(`[apiFetch] attempt ${attempt + 1} failed (${error.message}), retrying in ${delays[attempt]}ms…`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }
  if (!res) {
    // Check if it looks like a CORS or network issue
    const msg = lastError?.message || '';
    if (msg.toLowerCase().includes('cors') || msg.toLowerCase().includes('blocked')) {
      throw new Error('Request blocked by CORS policy. Check the server CORS configuration.');
    }
    throw new Error(`Cannot reach the server after 3 attempts. The server may be starting up — please wait a moment and try again. (${msg})`);
  }

  if (res.status === 401) {
    clearAuth();
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}

/**
 * Change password for the signed-in user (requires Bearer token).
 * Body: { currentPassword, newPassword }
 */
export async function changePassword({ currentPassword, newPassword }, onUnauthorized) {
  return apiFetch(
    '/auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    onUnauthorized,
  );
}

/**
 * Create a user for the authenticated agency/workspace.
 * Backend: POST /auth/users — body: { firstName, lastName, email, phone, role, password }
 */
export async function createPlatformUser(payload, onUnauthorized) {
  return apiFetch(
    '/auth/users',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );
}

/** GET `/users` — all created users for the workspace (page/limit if supported by backend). */
export async function fetchAuthUsers(params = {}, onUnauthorized) {
  const page = params.page != null ? Number(params.page) : 1;
  const limit = params.limit != null ? Number(params.limit) : 200;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/users?${qs}`, { method: 'GET', quiet: true }, onUnauthorized);
}

function unwrapDashboardSummaryPayload(json) {
  if (json == null || typeof json !== 'object') return {};
  const layered = [json.data, json.summary, json.stats, json.counts, json.totals, json.dashboard];
  for (const layer of layered) {
    if (layer != null && typeof layer === 'object' && !Array.isArray(layer)) return layer;
  }
  return json;
}

function readFirstNumericField(source, keys) {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    const raw = source[key];
    if (raw == null || raw === '') continue;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Map GET `/dashboard/summary` JSON to dashboard stat card values.
 * Supports nested `data` / `summary` and common field name variants.
 */
export function normalizeDashboardSummary(json) {
  const payload = unwrapDashboardSummaryPayload(json);
  const patients = readFirstNumericField(payload, [
    'patientCount',
    'patients',
    'totalPatients',
    'total_patients',
    'registeredPatients',
    'registered_patients',
  ]);
  const enquiries = readFirstNumericField(payload, [
    'enquiryCount',
    'enquiries',
    'totalEnquiries',
    'total_enquiries',
    'leadCount',
    'leads',
    'totalLeads',
  ]);
  const nurses = readFirstNumericField(payload, [
    'nurseCount',
    'nurses',
    'activeNurses',
    'active_nurses',
    'totalNurses',
    'total_nurses',
    'staffCount',
    'careStaff',
  ]);
  const emergency = readFirstNumericField(payload, [
    'emergencyCount',
    'emergency',
    'urgentCases',
    'urgent_cases',
    'criticalCount',
    'critical_count',
    'activeUrgentCases',
    'flaggedUrgent',
    'urgent',
  ]);
  return {
    patients: patients ?? 0,
    enquiries: enquiries ?? 0,
    nurses: nurses ?? 0,
    emergency: emergency ?? 0,
  };
}

/** GET `/dashboard/summary` — aggregated counts for dashboard overview cards. */
export async function fetchDashboardSummary(onUnauthorized) {
  return apiFetch('/dashboard/summary', { method: 'GET', quiet: true }, onUnauthorized);
}

/** GET `/alerts/pending` — pending alerts for dashboard watchlist (paginated). */
export async function fetchPendingAlerts(params = {}, onUnauthorized) {
  const page = params.page != null ? Number(params.page) : 1;
  const limit = params.limit != null ? Number(params.limit) : 100;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/alerts/pending?${qs}`, { method: 'GET', quiet: true }, onUnauthorized);
}

/**
 * Create a care visit.
 * POST /care-visits — body: { patientId, visitingNurse, lastVisit, nextVisit, frequency }
 */
export async function createCareVisit(payload, onUnauthorized) {
  return apiFetch(
    '/care-visits',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );
}

/** GET `/care-visits/upcoming` — upcoming visits list. */
export async function fetchUpcomingCareVisits(params = {}, onUnauthorized) {
  const qs = new URLSearchParams();
  if (params.page != null) qs.set('page', String(params.page));
  if (params.limit != null) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return apiFetch(`/care-visits/upcoming${q ? `?${q}` : ''}`, { method: 'GET', quiet: true }, onUnauthorized);
}

/** GET `/care-visits/other` — all/other visits list (backend-defined). */
export async function fetchOtherCareVisits(params = {}, onUnauthorized) {
  const qs = new URLSearchParams();
  if (params.page != null) qs.set('page', String(params.page));
  if (params.limit != null) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return apiFetch(`/care-visits/other${q ? `?${q}` : ''}`, { method: 'GET', quiet: true }, onUnauthorized);
}
