import { apiFetch } from '../api';

/** Common keys where backends nest list payloads */
const LIST_CONTAINER_KEYS = [
  'data',
  'results',
  'items',
  'records',
  'enquiries',
  'entities',
  'docs',
  'rows',
  'list',
  'payload',
  'content',
  'values',
  'response',
  'result',
  'body',
];

function arrayFromContainer(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  for (const key of LIST_CONTAINER_KEYS) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

/**
 * Normalize list response: arrays at root, under `data`, nested pagination objects, etc.
 */
export function extractEnquiriesList(json) {
  if (json == null) return [];
  if (Array.isArray(json)) return json;

  let found = arrayFromContainer(json);
  if (found) return found;

  const d = json.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    found = arrayFromContainer(d);
    if (found) return found;
    const inner = d.data;
    if (Array.isArray(inner)) return inner;
    if (inner && typeof inner === 'object') {
      found = arrayFromContainer(inner);
      if (found) return found;
    }
  }

  if (typeof json.response === 'object' && json.response !== null) {
    if (Array.isArray(json.response)) return json.response;
    found = arrayFromContainer(json.response);
    if (found) return found;
  }

  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.records)) return json.records;
  if (Array.isArray(json.enquiries)) return json.enquiries;
  if (Array.isArray(json.result)) return json.result;

  return [];
}

/**
 * Map API snake_case / alternate keys onto the camelCase shape the UI expects.
 */
export function normalizeEnquiryRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw._id ?? raw.uuid;
  return {
    ...raw,
    id: id != null ? id : raw.id,
    status: raw.status ?? raw.enquiryStatus ?? raw.enquiry_status ?? raw.state ?? raw.enquiry_state,
    nameOfClient: raw.nameOfClient ?? raw.name_of_client ?? raw.clientName ?? raw.client_name ?? raw.name ?? '',
    dateOfContact: raw.dateOfContact ?? raw.date_of_contact ?? '',
    relationToPatient: raw.relationToPatient ?? raw.relation_to_patient ?? '',
    phoneNumber: raw.phoneNumber ?? raw.phone_number ?? raw.phone ?? '',
    email: raw.email ?? '',
    location: raw.location ?? raw.address ?? '',
    gps: raw.gps ?? raw.GPS ?? '',
    landMark: raw.landMark ?? raw.land_mark ?? raw.landmark ?? '',
    gateColour: raw.gateColour ?? raw.gate_colour ?? '',
    notes: raw.notes ?? raw.note ?? '',
    recordedBy: raw.recordedBy ?? raw.recorded_by,
  };
}

function readMessage(res, json, fallback) {
  const msg = json?.message ?? json?.error;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return fallback;
}

/** GET `/enquiries?page=1&limit=100` */
export async function fetchEnquiries(params = {}, onUnauthorized) {
  const page = params.page != null ? Number(params.page) : 1;
  const limit = params.limit != null ? Number(params.limit) : 100;
  const path = `/enquiries?page=${page}&limit=${limit}`;
  const res = await apiFetch(path, { method: 'GET' }, onUnauthorized);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(res, json, `Could not load enquiries (${res.status})`));
  }
  return json;
}

/**
 * POST `/enquiries` — body omits ids; backend sets agency, recordedBy, etc.
 */
export async function createEnquiry(body, onUnauthorized) {
  const res = await apiFetch('/enquiries', {
    method: 'POST',
    body: JSON.stringify(body),
  }, onUnauthorized);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(res, json, `Could not create enquiry (${res.status})`));
  }
  /** `{ success, data }` shape */
  if (json && typeof json.data === 'object' && json.data !== null && !Array.isArray(json.data)) {
    return json.data;
  }
  return json;
}

/** PATCH `/enquiries/:id` — follow-up (notes/status); tolerant if backend differs. */
export async function patchEnquiry(id, body, onUnauthorized) {
  const enc = encodeURIComponent(String(id ?? '').trim());
  if (!enc) throw new Error('Enquiry id is required.');
  const res = await apiFetch(`/enquiries/${enc}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, onUnauthorized);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(res, json, `Could not update enquiry (${res.status})`));
  }
  if (json && typeof json.data === 'object' && json.data !== null && !Array.isArray(json.data)) {
    return json.data;
  }
  return json;
}

/** DELETE `/enquiries/:id` — removes the enquiry when supported by the backend */
export async function deleteEnquiry(id, onUnauthorized) {
  const enc = encodeURIComponent(String(id ?? '').trim());
  if (!enc) throw new Error('Enquiry id is required.');
  const res = await apiFetch(`/enquiries/${enc}`, {
    method: 'DELETE',
  }, onUnauthorized);
  if (res.ok) return true;
  const json = await res.json().catch(() => ({}));
  throw new Error(readMessage(res, json, `Could not delete enquiry (${res.status})`));
}
