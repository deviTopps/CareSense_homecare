import { apiFetch } from '../api';

const CACHE_KEY = 'caresense.patientBilling';

export const BILLING_CATEGORIES = [
  'Visit',
  'Medication',
  'Equipment',
  'Assessment',
  'Supplies',
  'Other',
];

export const BILLING_STATUSES = ['Pending', 'Paid', 'Partial', 'Overdue', 'Waived'];

export const PAYMENT_METHODS = [
  'Cash',
  'Mobile Money',
  'Bank Transfer',
  'Card',
  'Insurance',
  'Other',
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
  return `bill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function unwrapBillingPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.billing && typeof payload.billing === 'object') return payload.billing;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload;
}

function extractBillingRecords(payload) {
  const root = unwrapBillingPayload(payload);
  if (!root) return [];
  const list = root.records || root.items || root.charges || root.invoices || root.entries;
  if (Array.isArray(list)) return list;
  if (Array.isArray(root)) return root;
  return [];
}

function extractBillingProfile(payload) {
  const root = unwrapBillingPayload(payload);
  if (!root || typeof root !== 'object') return { ...EMPTY_BILLING_PROFILE };
  const profile = root.profile || root.billingProfile || root.billingInfo || root;
  return {
    ...EMPTY_BILLING_PROFILE,
    payerName: profile.payerName || profile.billingContactName || '',
    payerRelationship: profile.payerRelationship || profile.billingContactRelationship || '',
    payerPhone: profile.payerPhone || profile.billingPhone || '',
    payerEmail: profile.payerEmail || profile.billingEmail || '',
    insuranceProvider: profile.insuranceProvider || profile.insuranceCompany || '',
    insurancePolicyNumber: profile.insurancePolicyNumber || profile.policyNumber || '',
    billingAddress: profile.billingAddress || profile.billingContactAddress || '',
    preferredPaymentMethod: profile.preferredPaymentMethod || profile.paymentMethod || '',
    billingNotes: profile.billingNotes || profile.notes || '',
  };
}

export function normalizeBillingRecord(raw, { patientId } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const amount = Number(raw.amount ?? raw.total ?? raw.chargeAmount);
  const statusRaw = String(raw.status || raw.paymentStatus || 'Pending').trim();
  const status = BILLING_STATUSES.find((s) => s.toLowerCase() === statusRaw.toLowerCase()) || 'Pending';
  const categoryRaw = String(raw.category || raw.type || raw.serviceType || 'Other').trim();
  const category = BILLING_CATEGORIES.find((c) => c.toLowerCase() === categoryRaw.toLowerCase()) || 'Other';
  const dateValue = raw.date || raw.serviceDate || raw.invoiceDate || raw.createdAt || '';

  return {
    id: String(raw.id || raw._id || makeId()),
    patientId: String(raw.patientId || patientId || '').trim(),
    date: toDateInputValue(dateValue),
    displayDate: formatDisplayDate(dateValue),
    description: String(raw.description || raw.title || raw.service || '').trim(),
    category,
    amount: Number.isFinite(amount) ? amount : 0,
    currency: String(raw.currency || 'GHS').trim() || 'GHS',
    status,
    paymentMethod: String(raw.paymentMethod || raw.paymentType || '').trim(),
    referenceNumber: String(raw.referenceNumber || raw.reference || raw.invoiceNumber || '').trim(),
    notes: String(raw.notes || raw.details || '').trim(),
    createdAt: raw.createdAt || raw.date || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

export function createEmptyBillingRecordForm(defaults = {}) {
  return {
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    currency: defaults.currency || 'GHS',
    status: 'Pending',
    paymentMethod: defaults.paymentMethod || '',
    referenceNumber: '',
    notes: '',
  };
}

export function readPatientBillingCache(patientId) {
  try {
    const raw = localStorage.getItem(storageKey(patientId));
    if (!raw) {
      return { profile: { ...EMPTY_BILLING_PROFILE }, records: [] };
    }
    const parsed = JSON.parse(raw);
    const profile = { ...EMPTY_BILLING_PROFILE, ...(parsed?.profile || {}) };
    const records = Array.isArray(parsed?.records)
      ? parsed.records.map((row) => normalizeBillingRecord(row, { patientId })).filter(Boolean)
      : [];
    return { profile, records };
  } catch {
    return { profile: { ...EMPTY_BILLING_PROFILE }, records: [] };
  }
}

export function writePatientBillingCache(patientId, data) {
  try {
    localStorage.setItem(storageKey(patientId), JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

function sortBillingRecords(records) {
  return [...records].sort((a, b) => {
    const da = new Date(a.date || a.createdAt).getTime();
    const db = new Date(b.date || b.createdAt).getTime();
    return db - da;
  });
}

export function summarizeBillingRecords(records) {
  const totals = records.reduce(
    (acc, row) => {
      const amount = Number(row.amount) || 0;
      acc.billed += amount;
      if (row.status === 'Paid') acc.paid += amount;
      else if (row.status === 'Partial') acc.paid += amount * 0.5;
      else if (row.status !== 'Waived') acc.outstanding += amount;
      if (row.status === 'Pending' || row.status === 'Overdue') acc.openCount += 1;
      return acc;
    },
    { billed: 0, paid: 0, outstanding: 0, openCount: 0 },
  );
  return totals;
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

async function tryFetchBillingPaths(patientId) {
  const q = encodeURIComponent(String(patientId || '').trim());
  if (!q) return null;

  const paths = [
    `/patients/${q}/billing`,
    `/patient/${q}/billing`,
    `/billing/patient/${q}`,
    `/billing/patients/${q}`,
  ];

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const text = await response.text().catch(() => '');
      let payload = {};
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = {};
        }
      }
      if (response.ok) {
        return {
          profile: extractBillingProfile(payload),
          records: sortBillingRecords(
            extractBillingRecords(payload)
              .map((row) => normalizeBillingRecord(row, { patientId }))
              .filter(Boolean),
          ),
          fromApi: true,
        };
      }
      if (response.status !== 404) break;
    } catch {
      // try next path
    }
  }

  return null;
}

export async function fetchPatientBilling(patientId) {
  const pid = String(patientId || '').trim();
  if (!pid) {
    return { profile: { ...EMPTY_BILLING_PROFILE }, records: [], source: 'empty' };
  }

  const apiResult = await tryFetchBillingPaths(pid);
  if (apiResult) {
    writePatientBillingCache(pid, { profile: apiResult.profile, records: apiResult.records });
    return { ...apiResult, source: 'api' };
  }

  const cached = readPatientBillingCache(pid);
  return { ...cached, source: 'local' };
}

async function persistBillingToApi(patientId, body) {
  const q = encodeURIComponent(String(patientId || '').trim());
  const paths = [
    { method: 'PUT', path: `/patients/${q}/billing` },
    { method: 'PATCH', path: `/patients/${q}/billing` },
    { method: 'POST', path: `/billing/patient/${q}` },
  ];

  for (const { method, path } of paths) {
    try {
      const response = await apiFetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        quiet: true,
      });
      if (response.ok) return true;
      if (response.status !== 404 && response.status !== 405) return false;
    } catch {
      // try next
    }
  }
  return false;
}

export async function savePatientBillingBundle(patientId, bundle) {
  const pid = String(patientId || '').trim();
  const profile = { ...EMPTY_BILLING_PROFILE, ...(bundle?.profile || {}) };
  const records = sortBillingRecords(
    (Array.isArray(bundle?.records) ? bundle.records : [])
      .map((row) => normalizeBillingRecord(row, { patientId: pid }))
      .filter(Boolean),
  );

  writePatientBillingCache(pid, { profile, records });
  await persistBillingToApi(pid, { profile, records });
  return { profile, records };
}

export function buildBillingRecordFromForm(form, { patientId, recordId } = {}) {
  const amount = Number(form.amount);
  const now = new Date().toISOString();
  return normalizeBillingRecord(
    {
      id: recordId || makeId(),
      patientId,
      date: form.date,
      description: form.description,
      amount: Number.isFinite(amount) ? amount : 0,
      currency: form.currency || 'GHS',
      status: form.status || 'Pending',
      paymentMethod: form.paymentMethod,
      referenceNumber: form.referenceNumber,
      notes: form.notes,
      createdAt: now,
      updatedAt: now,
    },
    { patientId },
  );
}
