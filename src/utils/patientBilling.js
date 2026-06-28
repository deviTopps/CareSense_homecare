import { apiFetch } from '../api';
import {
  extractApiPatientId,
  extractMongoObjectId,
  isLikelyMongoObjectId,
  isPatientUuid,
  isUuidV4ish,
  resolvePatientMutationId,
} from './patients';

const CACHE_KEY = 'caresense.patientBilling';

export const INVOICE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const EMPTY_BILLING_PROFILE = {
  payerName: '',
  payerRelationship: '',
  payerPhone: '',
  payerEmail: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  billingAddress: '',
  preferredPaymentMethod: '',
  billingNotes: '',
};

function storageKey(patientId) {
  return `${CACHE_KEY}:${String(patientId || '').trim()}`;
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseJsonResponse(response) {
  return response.text().then((text) => {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  });
}

function isBillingLikeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return value.rate != null
    || value.amount != null
    || value.billingRate != null
    || value.billing_rate != null
    || value.frequency
    || value.billingFrequency
    || value.billing_frequency
    || value.note
    || value.notes
    || value.billingNote
    || value.billing_note;
}

function coerceBillingRecordsFromPayload(payload) {
  const direct = extractInvoiceList(payload);
  if (direct.length) return direct;

  if (!payload || typeof payload !== 'object') return [];

  const queue = [payload];
  const seen = new Set();

  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((entry) => {
        if (entry && typeof entry === 'object') queue.push(entry);
      });
      continue;
    }

    if (isBillingLikeObject(node)) return [node];

    Object.values(node).forEach((value) => {
      if (value && typeof value === 'object') queue.push(value);
    });
  }

  return [];
}

function extractInvoiceList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const keys = [
    'billing',
    'billingRecord',
    'billingRecords',
    'patientBilling',
    'patient_billing',
    'patientBillingRecord',
    'invoices',
    'patientInvoices',
    'patient_invoices',
    'data',
    'payload',
    'body',
    'response',
    'content',
    'items',
    'results',
    'records',
    'rows',
    'list',
    'result',
    'record',
  ];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isBillingLikeObject(value)) return [value];
  }

  if (payload.data && typeof payload.data === 'object') {
    for (const key of keys) {
      const value = payload.data[key];
      if (Array.isArray(value)) return value;
      if (isBillingLikeObject(value)) return [value];
    }
    if (Array.isArray(payload.data)) return payload.data;
    if (isBillingLikeObject(payload.data)) return [payload.data];
  }

  if (isBillingLikeObject(payload)) return [payload];

  return [];
}

function extractBillingFromPatientRecord(patientRecord, billingUuid = '') {
  if (!patientRecord || typeof patientRecord !== 'object') return [];

  const rows = [];
  const addNode = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(addNode);
      return;
    }
    if (isBillingLikeObject(node)) rows.push(node);
  };

  const keys = [
    'billing',
    'billingRecord',
    'billingRecords',
    'patientBilling',
    'patient_billing',
    'patientBillingRecord',
  ];

  for (const key of keys) {
    addNode(patientRecord[key]);
  }

  if (patientRecord.patient && typeof patientRecord.patient === 'object') {
    for (const key of keys) {
      addNode(patientRecord.patient[key]);
    }
  }

  return rows;
}

function mapBillingRows(rows, billingUuid) {
  const uuid = String(billingUuid || '').trim();
  return sortInvoices(
    rows
      .map((row) => {
        const normalized = normalizePatientInvoice(row, { patientId: uuid });
        if (!normalized) return null;
        return {
          ...normalized,
          patientId: uuid || normalized.patientId,
        };
      })
      .filter(Boolean),
  );
}

function extractPatientUuidFromRecord(patientRecord) {
  if (!patientRecord || typeof patientRecord !== 'object') return '';

  const candidates = [
    patientRecord.uuid,
    patientRecord.patientUuid,
    patientRecord.patientUUID,
    patientRecord.id,
    patientRecord.patientId,
    patientRecord.patientID,
    patientRecord.patient_id,
    patientRecord.patient?.uuid,
    patientRecord.patient?.patientUuid,
    patientRecord.patient?.patientUUID,
    patientRecord.patient?.patientId,
    patientRecord.patient?.patientID,
    patientRecord.patient?.patient_id,
    extractApiPatientId(patientRecord),
    extractApiPatientId(patientRecord?.patient),
  ];

  for (const value of candidates) {
    const normalized = String(value || '').trim();
    if (isPatientUuid(normalized)) return normalized;
  }

  return '';
}

/** Patient UUID for all `/patient-billing` requests (GET/POST/PATCH/DELETE). */
export function resolvePatientBillingRouteId(routeId, patientRecord) {
  const fromRecord = extractPatientUuidFromRecord(patientRecord);
  if (fromRecord) return fromRecord;

  const route = String(routeId || '').trim();
  if (isPatientUuid(route)) return route;

  const mutationId = resolvePatientMutationId(patientRecord, routeId);
  if (isPatientUuid(mutationId)) return mutationId;

  return '';
}


function billingRecordMatchesPatient(record, routeId) {
  const requested = String(routeId || '').trim();
  if (!requested || !record) return false;

  const embedded = extractBillingPatientId(record, requested);
  if (!embedded) return true;

  if (isUuidV4ish(requested) && isUuidV4ish(embedded) && embedded !== requested) {
    return false;
  }

  if (isLikelyMongoObjectId(requested) && isLikelyMongoObjectId(embedded) && embedded !== requested) {
    return false;
  }

  return true;
}

function isNotFoundMessage(value) {
  const message = String(value || '').toLowerCase();
  return message.includes('not found') || message.includes('404');
}

function isNotFoundResponse(response, payload) {
  if (response?.status === 404) return true;
  if (response?.status >= 200 && response?.status < 300) return false;
  return isNotFoundMessage(payload?.message || payload?.error);
}

function extractApiErrorMessage(payload, fallback = '') {
  if (!payload || typeof payload !== 'object') return fallback;
  for (const key of ['message', 'error', 'detail', 'msg']) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function isBillingAlreadyExistsMessage(value) {
  const message = String(value || '').toLowerCase();
  return message.includes('already exists')
    || message.includes('use update')
    || message.includes('use patch');
}

function isBillingAlreadyExistsError(error) {
  return isBillingAlreadyExistsMessage(error?.message);
}

function normalizeFrequency(value) {
  const raw = String(value || 'daily').trim().toLowerCase();
  if (raw === 'weekly') return 'weekly';
  if (raw === 'monthly') return 'monthly';
  return 'daily';
}

function formatFrequencyLabel(frequency) {
  const match = INVOICE_FREQUENCIES.find((entry) => entry.value === frequency);
  return match?.label || 'Daily';
}

function formatDisplayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function displayNameFromPatientLike(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const full = [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (raw.fullName) return String(raw.fullName).trim();
  if (raw.name) return String(raw.name).trim();
  return '';
}

function extractBillingPatientName(raw) {
  const nestedName = displayNameFromPatientLike(raw?.patient);
  if (nestedName) return nestedName;
  return String(raw?.patientName || raw?.patient_name || '').trim();
}

function extractBillingPatientRef(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.patient && typeof raw.patient === 'object') return raw.patient;
  if (raw.patientId && typeof raw.patientId === 'object') return raw.patientId;
  return null;
}

export function extractBillingPatientId(raw, fallbackPatientId = '') {
  const patientRef = extractBillingPatientRef(raw);
  const scalarCandidates = [
    raw?.patientId,
    raw?.patient_id,
    raw?.patientID,
    patientRef?.patientId,
    patientRef?.patient_id,
    patientRef?.patientID,
    patientRef?.uuid,
    patientRef?.patientUuid,
    patientRef?.patientUUID,
    fallbackPatientId,
  ];

  for (const value of scalarCandidates) {
    if (value == null || typeof value === 'object') continue;
    const normalized = String(value).trim();
    if (isUuidV4ish(normalized)) return normalized;
  }

  for (const value of scalarCandidates) {
    if (value == null || typeof value === 'object') continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }

  if (patientRef) {
    return extractApiPatientId(patientRef)
      || resolvePatientMutationId(patientRef)
      || extractMongoObjectId(patientRef)
      || '';
  }

  return String(fallbackPatientId || '').trim();
}

export function normalizePatientInvoice(raw, { patientId } = {}) {
  if (!raw || typeof raw !== 'object') return null;

  const rate = Number(
    raw.rate ?? raw.amount ?? raw.billingRate ?? raw.billing_rate,
  ) || 0;
  const frequency = normalizeFrequency(
    raw.frequency ?? raw.billingFrequency ?? raw.billing_frequency,
  );
  const note = String(
    raw.note || raw.notes || raw.billingNote || raw.billing_note || '',
  ).trim();
  const createdAt = raw.createdAt || raw.created_at || '';
  const patientRef = extractBillingPatientRef(raw);
  const resolvedPatientId = extractBillingPatientId(raw, patientId);
  const patientName = extractBillingPatientName({ ...raw, patient: patientRef || raw.patient });

  return {
    id: String(raw.id || raw._id || makeId()),
    patientId: resolvedPatientId,
    patientName: patientName || undefined,
    patient: patientRef,
    rate,
    frequency,
    frequencyLabel: formatFrequencyLabel(frequency),
    note,
    displayDate: formatDisplayDate(createdAt),
    currency: String(raw.currency || 'GHS').trim() || 'GHS',
    createdAt,
    updatedAt: raw.updatedAt || raw.updated_at || '',
  };
}

export function createEmptyInvoiceForm(defaults = {}) {
  return {
    rate: defaults.rate != null ? String(defaults.rate) : '',
    frequency: normalizeFrequency(defaults.frequency),
    note: defaults.note != null ? String(defaults.note) : '',
  };
}

export function invoiceFormFromRecord(record) {
  return createEmptyInvoiceForm({
    rate: record?.rate,
    frequency: record?.frequency,
    note: record?.note,
  });
}

export function buildInvoicePayloadFromForm(form, { patientId } = {}) {
  const pid = String(patientId || '').trim();
  return {
    patientId: pid,
    rate: Number(form.rate),
    frequency: normalizeFrequency(form.frequency),
    note: String(form.note || '').trim(),
  };
}

function sortInvoices(records) {
  return [...records].sort((a, b) => {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    return db - da;
  });
}

export function readPatientInvoiceCache(patientId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.records) ? parsed.records : Array.isArray(parsed) ? parsed : [];
    return sortInvoices(
      list.map((row) => normalizePatientInvoice(row, { patientId })).filter(Boolean),
    );
  } catch {
    return [];
  }
}

export function writePatientInvoiceCache(patientId, records) {
  try {
    localStorage.setItem(storageKey(patientId), JSON.stringify({ records }));
  } catch {
    // ignore quota errors
  }
}

export function summarizeBillingRecords(records) {
  return records.reduce(
    (acc, row) => {
      const amount = Number(row.rate) || 0;
      acc.billed += amount;
      acc.count += 1;
      return acc;
    },
    { billed: 0, count: 0 },
  );
}

export function formatBillingMoney(amount, currency = 'GHS') {
  const n = typeof amount === 'number' ? amount : Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  const c = String(currency || 'GHS').trim().toUpperCase();
  let symbol = 'GH₵';
  if (c === 'USD') symbol = '$';
  else if (c === 'EUR') symbol = '€';
  else if (c === 'NGN') symbol = '₦';
  else if (c === 'GBP') symbol = '£';
  return `${symbol}${value.toFixed(2)}`;
}

/** Normalize a value to `YYYY-MM` for GET /patient-billing?month=… */
export function formatBillingMonthParam(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;

  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function fetchPatientBillingByIdOnce(patientUuid) {
  const uuid = String(patientUuid || '').trim();
  if (!uuid) return [];
  if (!isPatientUuid(uuid)) {
    throw new Error('Billing fetch requires a patient UUID.');
  }

  const response = await apiFetch(`/patient-billing/${encodeURIComponent(uuid)}`, {
    method: 'GET',
    quiet: true,
  });
  const payload = await parseJsonResponse(response);

  let rows = coerceBillingRecordsFromPayload(payload);
  if (!rows.length && isBillingLikeObject(payload)) {
    rows = [payload];
  }

  if (rows.length) {
    return mapBillingRows(rows, uuid);
  }

  if (isNotFoundResponse(response, payload)) return [];

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(payload, `Unable to load billing (${response.status})`),
    );
  }

  return [];
}

/** GET /patient-billing/:patientUuid — fetch billing for one patient. */
export async function fetchPatientBillingByUuid(patientUuid) {
  return fetchPatientBillingByIdOnce(patientUuid);
}

export async function fetchPatientInvoices(patientId, { patientRecord } = {}) {
  const billingUuid = resolvePatientBillingRouteId(patientId, patientRecord);
  if (!billingUuid || !isPatientUuid(billingUuid)) {
    return { records: [], source: 'empty' };
  }

  const embeddedRecords = mapBillingRows(
    extractBillingFromPatientRecord(patientRecord, billingUuid),
    billingUuid,
  );
  const cachedRecords = readPatientInvoiceCache(billingUuid);

  try {
    const apiRecords = await fetchPatientBillingByUuid(billingUuid);

    if (apiRecords.length) {
      writePatientInvoiceCache(billingUuid, apiRecords);
      return { records: apiRecords, source: 'api' };
    }

    if (embeddedRecords.length) {
      writePatientInvoiceCache(billingUuid, embeddedRecords);
      return { records: embeddedRecords, source: 'patient' };
    }

    if (cachedRecords.length) {
      return { records: cachedRecords, source: 'local' };
    }

    return { records: [], source: 'api' };
  } catch (err) {
    if (cachedRecords.length) {
      return { records: cachedRecords, source: 'local' };
    }
    if (embeddedRecords.length) {
      writePatientInvoiceCache(billingUuid, embeddedRecords);
      return { records: embeddedRecords, source: 'patient' };
    }
    throw err;
  }
}

/** @deprecated use fetchPatientInvoices */
export async function fetchPatientBilling(patientId) {
  const result = await fetchPatientInvoices(patientId);
  return {
    profile: { ...EMPTY_BILLING_PROFILE },
    records: result.records,
    source: result.source,
  };
}

async function postPatientInvoice(payload) {
  const response = await apiFetch('/patient-billing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    quiet: true,
  });
  const data = await parseJsonResponse(response);
  const apiError = extractApiErrorMessage(data, '');

  if (!response.ok && isBillingAlreadyExistsMessage(apiError)) {
    const err = new Error(apiError || 'Billing record already exists for this patient. Use update instead.');
    err.code = 'BILLING_ALREADY_EXISTS';
    throw err;
  }

  if (!response.ok) {
    throw new Error(apiError || `Unable to create billing (${response.status})`);
  }

  const saved = data?.billing || data?.invoice || data?.data || data;
  return normalizePatientInvoice(saved, { patientId: payload.patientId })
    || normalizePatientInvoice(payload, { patientId: payload.patientId });
}

async function updatePatientBilling(billingUuid, payload) {
  const patientId = String(payload?.patientId || billingUuid || '').trim();
  if (!patientId) throw new Error('Patient UUID is required for billing.');

  const fullBody = {
    patientId,
    rate: payload.rate,
    frequency: payload.frequency,
    note: payload.note,
  };
  const patchBody = {
    rate: payload.rate,
    frequency: payload.frequency,
    note: payload.note,
  };

  const attempts = [
    { method: 'PATCH', path: '/patient-billing', body: fullBody },
    { method: 'PUT', path: '/patient-billing', body: fullBody },
    { method: 'PATCH', path: `/patient-billing/${encodeURIComponent(patientId)}`, body: fullBody },
    { method: 'PUT', path: `/patient-billing/${encodeURIComponent(patientId)}`, body: fullBody },
    { method: 'PATCH', path: `/patient-billing/${encodeURIComponent(patientId)}`, body: patchBody },
    { method: 'PUT', path: `/patient-billing/${encodeURIComponent(patientId)}`, body: patchBody },
  ];

  let lastError = 'Unable to update billing record.';
  let sawNotFound = false;

  for (const attempt of attempts) {
    try {
      const response = await apiFetch(attempt.path, {
        method: attempt.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt.body),
        quiet: true,
      });
      const data = await parseJsonResponse(response);
      const apiError = extractApiErrorMessage(data, '');

      if (response.ok) {
        const saved = data?.billing || data?.invoice || data?.data || data;
        return normalizePatientInvoice(saved, { patientId })
          || normalizePatientInvoice(fullBody, { patientId });
      }

      lastError = apiError || lastError;

      if (isNotFoundResponse(response, data)) {
        sawNotFound = true;
        continue;
      }

      if (response.status === 405) continue;

      if (isBillingAlreadyExistsMessage(apiError)) continue;
    } catch (err) {
      lastError = err?.message || lastError;
      if (isNotFoundMessage(lastError)) sawNotFound = true;
    }
  }

  if (sawNotFound) {
    throw new Error(
      'Unable to update billing — the server has no PATCH/PUT route for patient billing yet. Ask your backend team to add PATCH /patient-billing with { patientId, rate, frequency, note }.',
    );
  }

  throw new Error(lastError);
}

/** @deprecated use updatePatientBilling */
async function patchPatientBillingOnce(patientId, payload) {
  return updatePatientBilling(patientId, payload);
}

async function patchPatientBillingForPatientIds(patientId, patientRecord, payload) {
  const billingUuid = resolvePatientBillingRouteId(patientId, patientRecord);
  if (!billingUuid) {
    throw new Error('Patient UUID is required for billing.');
  }

  return updatePatientBilling(billingUuid, {
    ...payload,
    patientId: billingUuid,
  });
}

async function patchPatientBillingForPatient(routeId, patientRecord, payload) {
  const id = resolvePatientBillingRouteId(routeId, patientRecord);
  if (!id) throw new Error('Patient id is required.');
  return patchPatientBillingOnce(id, payload);
}

async function deletePatientBillingRequest(patientId, { patientRecord, routeId } = {}) {
  const id = resolvePatientBillingRouteId(routeId || patientId, patientRecord);
  if (!id) throw new Error('Patient id is required.');

  const response = await apiFetch(`/patient-billing/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    quiet: true,
  });

  if (response.ok) return true;

  const data = await parseJsonResponse(response);
  throw new Error(data?.message || data?.error || 'Unable to delete billing record.');
}

export async function savePatientInvoice(patientId, form, { invoiceId, patientRecord } = {}) {
  const billingUuid = resolvePatientBillingRouteId(patientId, patientRecord);
  if (!billingUuid) {
    throw new Error('Patient UUID is required for billing. Refresh the patient profile and try again.');
  }
  if (!isPatientUuid(billingUuid)) {
    throw new Error('Billing only accepts a patient UUID. Refresh the patient profile and try again.');
  }

  const payload = buildInvoicePayloadFromForm(form, { patientId: billingUuid });

  if (!Number.isFinite(payload.rate) || payload.rate <= 0) {
    throw new Error('Enter a valid rate greater than zero.');
  }
  if (!payload.note) throw new Error('Note is required.');

  const updateExisting = () => updatePatientBilling(billingUuid, payload);

  const existingResult = await fetchPatientInvoices(billingUuid, { patientRecord }).catch(() => ({
    records: [],
  }));
  const existingRecords = existingResult.records || [];
  const shouldUpdate = Boolean(invoiceId) || existingRecords.length > 0;

  let saved;
  if (shouldUpdate) {
    saved = await updateExisting();
  } else {
    try {
      saved = await postPatientInvoice(payload);
    } catch (postErr) {
      if (isBillingAlreadyExistsError(postErr) || postErr?.code === 'BILLING_ALREADY_EXISTS') {
        saved = await updateExisting();
      } else {
        const message = String(postErr?.message || '');
        if (isNotFoundMessage(message)) {
          throw new Error(
            'Patient not found for billing. POST /patient-billing needs a valid patient UUID — refresh the profile and try again.',
          );
        }
        throw postErr;
      }
    }
  }

  const persisted = saved
    || normalizePatientInvoice(payload, { patientId: billingUuid });
  if (persisted) {
    writePatientInvoiceCache(billingUuid, [persisted]);
  }
  return saved || persisted;
}

export async function deletePatientInvoice(patientId, { patientRecord } = {}) {
  const billingUuid = resolvePatientBillingRouteId(patientId, patientRecord);
  if (!billingUuid) throw new Error('Patient UUID is required for billing.');

  await deletePatientBillingRequest(billingUuid, { patientRecord, routeId: billingUuid });
  writePatientInvoiceCache(billingUuid, []);
  return refreshPatientInvoicesAfterMutation(billingUuid, { patientRecord });
}

export async function refreshPatientInvoicesAfterMutation(patientId, { patientRecord } = {}) {
  const pid = String(patientId || '').trim();
  const result = await fetchPatientInvoices(pid, { patientRecord });
  return result.records;
}

function resolveFinancePatientRouteId(patient) {
  return resolvePatientBillingRouteId('', patient);
}

function indexPatientsByBillingId(patients) {
  const map = new Map();
  if (!Array.isArray(patients)) return map;

  for (const patient of patients) {
    const ids = [
      resolveFinancePatientRouteId(patient),
      patient?.uuid,
      patient?.patientUuid,
      patient?.patientUUID,
      patient?.patientId,
      extractApiPatientId(patient),
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    for (const id of ids) {
      if (!map.has(id)) map.set(id, patient);
    }
  }

  return map;
}

function enrichBillingRecordsWithPatients(records, patients) {
  const patientById = indexPatientsByBillingId(patients);

  return records.map((row) => {
    const patientId = String(
      row.patientId || extractBillingPatientId(row) || '',
    ).trim();
    const patient = patientById.get(patientId)
      || (row.patient && typeof row.patient === 'object' ? row.patient : null);

    return {
      ...row,
      patientId: patientId || row.patientId,
      patientName: row.patientName
        || displayNameFromPatientLike(patient)
        || displayNameFromPatientLike(row.patient)
        || 'Patient',
      patient: patient || row.patient,
    };
  });
}

/** GET /patient-billing?month=YYYY-MM — all billing records for a month. */
export async function fetchPatientBillingByMonth(month) {
  const monthParam = formatBillingMonthParam(month);
  const response = await apiFetch(
    `/patient-billing?month=${encodeURIComponent(monthParam)}`,
    { method: 'GET', quiet: true },
  );
  const payload = await parseJsonResponse(response);

  let rows = coerceBillingRecordsFromPayload(payload);
  if (!rows.length && isBillingLikeObject(payload)) {
    rows = [payload];
  }

  if (rows.length) {
    return mapBillingRows(rows, '');
  }

  if (isNotFoundResponse(response, payload)) return [];

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(payload, `Unable to load billing (${response.status})`),
    );
  }

  return [];
}

export async function fetchAllPatientBillingRecords({ month, patients: patientsInput } = {}) {
  const monthParam = formatBillingMonthParam(month);
  const apiRecords = await fetchPatientBillingByMonth(monthParam);

  let patients = Array.isArray(patientsInput) ? patientsInput : [];
  if (!patients.length) {
    const { fetchAllPatients: loadPatients } = await import('./patients');
    patients = await loadPatients().catch(() => []);
  }

  const enriched = enrichBillingRecordsWithPatients(apiRecords, patients);
  return sortInvoices(enriched);
}
