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
 * @param {RequestInit} options — fetch options
 * @param {Function} onUnauthorized — callback when token is invalid/expired
 */
export async function apiFetch(path, options = {}, onUnauthorized) {
  const token = getToken();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Don't set Content-Type for FormData — browser sets it with the correct boundary
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const requestUrl = `${API_BASE}${normalizedPath}`;
  const requestOptions = { ...options, headers };

  console.log('[apiFetch] →', requestOptions.method || 'GET', requestUrl);
  console.log('[apiFetch] headers:', JSON.stringify(headers));
  if (options.body) console.log('[apiFetch] body:', options.body);

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
        console.warn(`[apiFetch] attempt ${attempt + 1} failed (${error.message}), retrying in ${delays[attempt]}ms…`);
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
