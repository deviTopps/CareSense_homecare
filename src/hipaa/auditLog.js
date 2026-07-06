import {
  AUDIT_MAX_QUEUE,
  AUDIT_QUEUE_KEY,
  PHI_API_PREFIXES,
} from './config';

const API_BASE = 'https://care-sense-backend.onrender.com/api';

function readToken() {
  try {
    return localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

function readUserSnapshot() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readQueue() {
  try {
    const raw = sessionStorage.getItem(AUDIT_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(entries) {
  try {
    sessionStorage.setItem(
      AUDIT_QUEUE_KEY,
      JSON.stringify(entries.slice(-AUDIT_MAX_QUEUE)),
    );
  } catch {
    // ignore quota
  }
}

export function isPhiApiPath(path) {
  const normalized = String(path || '').split('?')[0];
  return PHI_API_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix),
  );
}

/**
 * Record PHI access / security events (Audit Controls — HIPAA §164.312(b)).
 * Queues locally and POSTs to backend when available.
 */
export function logAuditEvent({
  action,
  resourceType = 'system',
  resourceId = '',
  outcome = 'success',
  metadata = {},
} = {}) {
  if (typeof window === 'undefined') return;

  const user = readUserSnapshot();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    resourceType,
    resourceId: String(resourceId || ''),
    outcome,
    userId: user?.id || user?._id || user?.userId || '',
    userEmail: user?.email || '',
    userRole: user?.role || '',
    metadata,
    userAgent: navigator.userAgent,
  };

  const queue = readQueue();
  queue.push(entry);
  writeQueue(queue);

  flushAuditQueue().catch(() => {});
}

export async function flushAuditQueue() {
  if (typeof window === 'undefined') return;
  const token = readToken();
  if (!token) return;

  const queue = readQueue();
  if (!queue.length) return;

  const response = await fetch(`${API_BASE}/compliance/audit-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ events: queue }),
  }).catch(() => null);

  if (response?.ok) {
    writeQueue([]);
  }
}

export function logPhiApiAccess(method, path, status) {
  if (!isPhiApiPath(path)) return;
  logAuditEvent({
    action: 'phi_api_access',
    resourceType: 'api',
    resourceId: path,
    outcome: status >= 200 && status < 400 ? 'success' : 'failure',
    metadata: { method: method || 'GET', status },
  });
}

export function logSessionEvent(action, metadata = {}) {
  logAuditEvent({
    action,
    resourceType: 'session',
    metadata,
  });
}

export function getLocalAuditEntries(limit = 50) {
  return readQueue().slice(-limit).reverse();
}
