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
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const requestUrl = `${API_BASE}${normalizedPath}`;
  const requestOptions = { ...options, headers };

  console.log('[apiFetch] →', requestOptions.method || 'GET', requestUrl);
  console.log('[apiFetch] headers:', JSON.stringify(headers));
  if (options.body) console.log('[apiFetch] body:', options.body);

  let res;
  try {
    res = await fetch(requestUrl, requestOptions);
  } catch (error) {
    if (error instanceof TypeError) {
      await new Promise(resolve => setTimeout(resolve, 900));
      try {
        res = await fetch(requestUrl, requestOptions);
      } catch {
        throw new Error('Unable to reach server. Please check your internet connection and try again in a few seconds.');
      }
    } else {
      throw error;
    }
  }

  if (res.status === 401) {
    clearAuth();
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}
