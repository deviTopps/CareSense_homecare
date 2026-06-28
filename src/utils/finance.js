import { apiFetch, getUser } from '../api';
import { extractApiPatientId, isPatientUuid } from './patients';
import { extractBillingPatientId, formatBillingMoney, formatBillingMonthParam } from './patientBilling';

const FINANCE_CACHE_KEY = 'caresense.finance';

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export const INVOICE_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
];

export const INVOICE_CREATE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
];

function financeStorageKey() {
  const user = getUser();
  const userId = String(user?.id || user?._id || user?.userId || 'agency').trim();
  return `${FINANCE_CACHE_KEY}:${userId}`;
}

function makeId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readFinanceStore() {
  try {
    const raw = localStorage.getItem(financeStorageKey());
    if (!raw) return { invoices: [], payments: [] };
    const parsed = JSON.parse(raw);
    return {
      invoices: Array.isArray(parsed?.invoices) ? parsed.invoices : [],
      payments: Array.isArray(parsed?.payments) ? parsed.payments : [],
    };
  } catch {
    return { invoices: [], payments: [] };
  }
}

function writeFinanceStore(store) {
  try {
    localStorage.setItem(financeStorageKey(), JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
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

function extractApiErrorMessage(payload, fallback = '') {
  if (!payload || typeof payload !== 'object') return fallback;
  for (const key of ['message', 'error', 'detail', 'msg']) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function isInvoiceLikeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return value.rate != null
    || value.amount != null
    || value.numberOfTime != null
    || value.invoiceNumber != null
    || value.number != null
    || value.patientId != null
    || value.frequency != null
    || value.note != null;
}

function extractInvoiceListFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const keys = [
    'invoices',
    'patientInvoices',
    'patient_invoices',
    'invoice',
    'data',
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
    if (isInvoiceLikeObject(value)) return [value];
  }

  if (payload.data && typeof payload.data === 'object') {
    for (const key of keys) {
      const value = payload.data[key];
      if (Array.isArray(value)) return value;
      if (isInvoiceLikeObject(value)) return [value];
    }
    if (Array.isArray(payload.data)) return payload.data;
    if (isInvoiceLikeObject(payload.data)) return [payload.data];
  }

  if (isInvoiceLikeObject(payload)) return [payload];

  return [];
}

function getCurrentUserId() {
  const user = getUser();
  return String(user?.id || user?._id || user?.userId || '').trim();
}

function isPaymentLikeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return value.amount != null
    || value.paymentMethod != null
    || value.payment_method != null
    || value.patientId != null
    || value.reference != null;
}

function extractPaymentListFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const keys = [
    'payments',
    'patientPayments',
    'patient_payments',
    'payment',
    'data',
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
    if (isPaymentLikeObject(value)) return [value];
  }

  if (payload.data && typeof payload.data === 'object') {
    for (const key of keys) {
      const value = payload.data[key];
      if (Array.isArray(value)) return value;
      if (isPaymentLikeObject(value)) return [value];
    }
    if (Array.isArray(payload.data)) return payload.data;
    if (isPaymentLikeObject(payload.data)) return [payload.data];
  }

  if (isPaymentLikeObject(payload)) return [payload];

  return [];
}

function buildPatientPaymentPayload(paymentDetails = {}) {
  const userId = getCurrentUserId();
  const monthParam = paymentDetails.month
    ? formatBillingMonthParam(paymentDetails.month)
    : '';
  const year = paymentDetails.year
    || (monthParam ? monthParam.split('-')[0] : String(new Date().getFullYear()));
  const receivedById = String(paymentDetails.receivedById || userId).trim();
  const authorizedById = String(paymentDetails.authorizedById || receivedById || userId).trim();
  const paymentMethod = String(
    paymentDetails.paymentMethod || paymentDetails.method || 'bank_transfer',
  ).trim();

  return {
    patientId: String(paymentDetails.patientId || '').trim(),
    amount: Number(paymentDetails.amount) || 0,
    paymentDate: String(
      paymentDetails.paymentDate || new Date().toISOString().slice(0, 10),
    ).slice(0, 10),
    month: monthParam,
    year: String(year),
    paymentMethod,
    reference: String(paymentDetails.reference || '').trim(),
    receivedById,
    authorizedById,
    note: String(paymentDetails.note || '').trim(),
  };
}

function cacheFinancePayment(payment) {
  if (!payment) return payment;
  const store = readFinanceStore();
  const existing = store.payments.map(normalizeFinancePayment).filter(Boolean);
  const next = [payment, ...existing.filter((row) => row.id !== payment.id)];
  store.payments = next;
  writeFinanceStore(store);
  return payment;
}

function normalizeInvoiceStatus(status, amountPaid = 0, amount = 0, paid = false) {
  const raw = String(status || '').trim().toLowerCase();
  if (raw === 'paid' || paid || (amount > 0 && amountPaid >= amount)) return 'paid';
  if (raw === 'partial' || (amountPaid > 0 && amountPaid < amount)) return 'partial';
  if (raw === 'pending') return 'unpaid';
  return 'unpaid';
}

export function breakdownInvoiceAmounts(invoice = {}) {
  const rate = Number(invoice.rate) || 0;
  const numberOfTime = Number(invoice.numberOfTime) || 1;
  const taxPercentage = Number(invoice.taxPercentage) || 0;
  const discountPercentage = Number(invoice.discountPercentage) || 0;
  const subtotal = rate * numberOfTime;
  const discountAmount = subtotal * (discountPercentage / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercentage / 100);
  const computedTotal = afterDiscount + taxAmount;
  const total = Number(invoice.amount) || computedTotal;

  return {
    rate,
    numberOfTime,
    taxPercentage,
    discountPercentage,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
}

export function computeInvoiceAmount({
  rate = 0,
  numberOfTime = 1,
  taxPercentage = 0,
  discountPercentage = 0,
} = {}) {
  return breakdownInvoiceAmounts({
    rate,
    numberOfTime,
    taxPercentage,
    discountPercentage,
  }).total;
}

function extractInvoiceMonth(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const direct = String(raw.month || raw.billingMonth || raw.billing_month || '').trim();
  if (/^\d{4}-\d{2}$/.test(direct)) return direct;

  const year = String(raw.year || '').trim();
  const monthNumber = raw.monthNumber ?? raw.month_number ?? null;
  if (year && monthNumber != null && /^\d{4}$/.test(year)) {
    return `${year}-${String(monthNumber).padStart(2, '0')}`;
  }

  if (year && direct && /^\d{1,2}$/.test(direct) && /^\d{4}$/.test(year)) {
    return `${year}-${String(direct).padStart(2, '0')}`;
  }

  return /^\d{4}-\d{2}$/.test(direct) ? direct : '';
}

export function formatInvoiceMonthLabel(value) {
  const monthParam = formatBillingMonthParam(value);
  if (!monthParam) return '—';
  const [year, month] = monthParam.split('-').map(Number);
  if (!year || !month) return monthParam;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function nextInvoiceNumber(invoices) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const max = invoices.reduce((acc, row) => {
    const num = String(row.invoiceNumber || '');
    if (!num.startsWith(prefix)) return acc;
    const part = Number(num.slice(prefix.length));
    return Number.isFinite(part) ? Math.max(acc, part) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function normalizeFinanceInvoice(raw, { patientName: patientNameFallback } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const rate = Number(raw.rate) || 0;
  const numberOfTime = Number(raw.numberOfTime ?? raw.number_of_time) || 1;
  const taxPercentage = Number(raw.taxPercentage ?? raw.tax_percentage) || 0;
  const discountPercentage = Number(raw.discountPercentage ?? raw.discount_percentage) || 0;
  const computedAmount = computeInvoiceAmount({ rate, numberOfTime, taxPercentage, discountPercentage });
  const amount = Number(raw.amount ?? raw.total) || computedAmount || rate;
  const paidFlag = raw.paid === true || String(raw.paid).toLowerCase() === 'true';
  const amountPaid = Number(raw.amountPaid ?? raw.paidAmount ?? (paidFlag ? amount : 0)) || 0;
  const status = normalizeInvoiceStatus(raw.status, amountPaid, amount, paidFlag);
  const patientId = String(
    raw.patientId || extractBillingPatientId(raw) || '',
  ).trim();
  const patientName = String(
    raw.patientName || patientNameFallback || patientDisplayName(raw.patient) || 'Patient',
  ).trim();
  const month = extractInvoiceMonth(raw);
  const year = String(raw.year || (month ? month.split('-')[0] : '')).trim();

  return {
    id: String(raw.id || raw._id || raw.invoiceId || makeId('fin-inv')),
    invoiceNumber: String(
      raw.invoiceNumber || raw.number || raw.invoiceNo || raw.reference || '',
    ).trim() || `INV-${String(raw.id || raw._id || '').slice(0, 8) || 'NEW'}`,
    patientId,
    patientName,
    billingRecordId: String(raw.billingRecordId || raw.billingId || '').trim(),
    rate,
    numberOfTime,
    taxPercentage,
    discountPercentage,
    month,
    year,
    amount,
    frequency: String(raw.frequency || 'daily').trim(),
    note: String(raw.note || raw.description || '').trim(),
    status,
    invoiceStatus: String(raw.status || (paidFlag ? 'paid' : 'pending')).trim(),
    paid: paidFlag || status === 'paid',
    amountPaid,
    balance: Math.max(0, amount - amountPaid),
    dueDate: String(raw.dueDate || raw.due_date || '').slice(0, 10),
    issueDate: String(
      raw.issueDate || raw.issue_date || raw.createdAt || raw.created_at || new Date().toISOString(),
    ).slice(0, 10),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    currency: String(raw.currency || 'GHS').trim() || 'GHS',
  };
}

export function normalizeFinancePayment(raw, { patientName: patientNameFallback } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const method = String(raw.paymentMethod || raw.payment_method || raw.method || 'bank_transfer').trim();
  const paymentDate = String(
    raw.paymentDate || raw.payment_date || raw.recordedAt || raw.createdAt || '',
  ).slice(0, 10);
  const month = extractInvoiceMonth(raw);
  return {
    id: String(raw.id || raw._id || makeId('fin-pay')),
    invoiceId: String(raw.invoiceId || '').trim(),
    invoiceNumber: String(raw.invoiceNumber || '').trim(),
    patientId: String(raw.patientId || '').trim(),
    patientName: String(raw.patientName || patientNameFallback || 'Patient').trim(),
    amount: Number(raw.amount) || 0,
    method,
    methodLabel: PAYMENT_METHODS.find((m) => m.value === method)?.label
      || method.replace(/_/g, ' '),
    paymentDate,
    month,
    year: String(raw.year || (month ? month.split('-')[0] : '')).trim(),
    reference: String(raw.reference || '').trim(),
    note: String(raw.note || '').trim(),
    receivedById: String(raw.receivedById || '').trim(),
    authorizedById: String(raw.authorizedById || '').trim(),
    recordedAt: paymentDate || raw.recordedAt || raw.createdAt || new Date().toISOString(),
    currency: String(raw.currency || 'GHS').trim() || 'GHS',
  };
}

export function loadFinanceInvoices() {
  const store = readFinanceStore();
  return store.invoices
    .map(normalizeFinanceInvoice)
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function loadFinancePayments() {
  const store = readFinanceStore();
  return store.payments
    .map(normalizeFinancePayment)
    .filter(Boolean)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

/** POST /patient-payments */
export async function createPatientPaymentViaApi(paymentDetails = {}) {
  const patientUuid = String(paymentDetails.patientId || '').trim();
  if (!patientUuid || !isPatientUuid(patientUuid)) {
    throw new Error('Patient UUID is required to record a payment.');
  }

  const payload = buildPatientPaymentPayload({ ...paymentDetails, patientId: patientUuid });
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new Error('Enter a valid payment amount.');
  }
  if (!payload.month) {
    throw new Error('Billing month is required.');
  }
  if (!payload.receivedById || !payload.authorizedById) {
    throw new Error('Unable to identify the current user for this payment.');
  }

  const response = await apiFetch('/patient-payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    quiet: true,
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(data, `Unable to record payment (${response.status})`),
    );
  }

  const saved = extractPaymentListFromPayload(data)[0]
    || data?.payment
    || data?.data
    || data;

  return normalizeFinancePayment(saved, { patientName: paymentDetails.patientName })
    || normalizeFinancePayment(
      { ...payload, id: saved?.id, _id: saved?._id },
      { patientName: paymentDetails.patientName },
    );
}

/** GET /patient-payments?month=YYYY-MM */
export async function fetchFinancePaymentsFromApi({ month } = {}) {
  const monthParam = month ? formatBillingMonthParam(month) : '';
  const query = monthParam ? `?month=${encodeURIComponent(monthParam)}` : '';
  const response = await apiFetch(`/patient-payments${query}`, {
    method: 'GET',
    quiet: true,
  });
  const payload = await parseJsonResponse(response);

  if (response.status === 404) return [];

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(payload, `Unable to load payments (${response.status})`),
    );
  }

  return extractPaymentListFromPayload(payload)
    .map((row) => normalizeFinancePayment(row))
    .filter(Boolean)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export async function recordPatientPaymentViaApi(paymentDetails = {}) {
  const payment = await createPatientPaymentViaApi(paymentDetails);
  if (payment && paymentDetails.patientName && payment.patientName === 'Patient') {
    payment.patientName = paymentDetails.patientName;
  }
  if (paymentDetails.invoiceNumber && !payment.invoiceNumber) {
    payment.invoiceNumber = paymentDetails.invoiceNumber;
  }
  if (paymentDetails.invoiceId && !payment.invoiceId) {
    payment.invoiceId = paymentDetails.invoiceId;
  }
  return cacheFinancePayment(payment);
}

export async function loadFinancePaymentsWithApi({ month } = {}) {
  try {
    const apiPayments = await fetchFinancePaymentsFromApi({ month });
    if (apiPayments.length) {
      const store = readFinanceStore();
      store.payments = apiPayments;
      writeFinanceStore(store);
      return apiPayments;
    }
  } catch {
    // fall back to cache below
  }
  return loadFinancePayments();
}

function cacheFinanceInvoice(invoice) {
  if (!invoice) return invoice;
  const store = readFinanceStore();
  const existing = store.invoices.map(normalizeFinanceInvoice).filter(Boolean);
  const next = [invoice, ...existing.filter((row) => row.id !== invoice.id)];
  store.invoices = next;
  writeFinanceStore(store);
  return invoice;
}

function removeFinanceInvoiceFromCache(invoiceId) {
  const id = String(invoiceId || '').trim();
  if (!id) return;
  const store = readFinanceStore();
  store.invoices = (store.invoices || []).filter(
    (row) => String(row?.id || '').trim() !== id,
  );
  writeFinanceStore(store);
}

function buildPatientInvoicePayload(billing, invoiceDetails = {}) {
  const patientUuid = String(billing?.patientId || invoiceDetails?.patientId || '').trim();
  const monthParam = invoiceDetails.month
    ? formatBillingMonthParam(invoiceDetails.month)
    : '';
  const year = invoiceDetails.year
    || (monthParam ? monthParam.split('-')[0] : String(new Date().getFullYear()));
  const status = String(invoiceDetails.status || 'pending').trim().toLowerCase();
  const paid = invoiceDetails.paid === true || status === 'paid';

  return {
    patientId: patientUuid,
    rate: Number(invoiceDetails.rate ?? billing?.rate) || 0,
    numberOfTime: Number(invoiceDetails.numberOfTime) || 1,
    taxPercentage: Number(invoiceDetails.taxPercentage) || 0,
    discountPercentage: Number(invoiceDetails.discountPercentage) || 0,
    month: monthParam,
    year: String(year),
    status: paid ? 'paid' : (status === 'paid' ? 'paid' : 'pending'),
    paid,
  };
}

/** POST /patient-invoices */
export async function createPatientInvoiceViaApi(billing, invoiceDetails = {}) {
  const patientUuid = String(billing?.patientId || invoiceDetails?.patientId || '').trim();
  if (!patientUuid || !isPatientUuid(patientUuid)) {
    throw new Error('Patient UUID is required to create an invoice.');
  }

  const payload = buildPatientInvoicePayload(billing, invoiceDetails);
  const response = await apiFetch('/patient-invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    quiet: true,
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(data, `Unable to create invoice (${response.status})`),
    );
  }

  const saved = extractInvoiceListFromPayload(data)[0]
    || data?.invoice
    || data?.data
    || data;

  return normalizeFinanceInvoice(saved, { patientName: billing?.patientName })
    || normalizeFinanceInvoice(
      { ...payload, id: saved?.id, _id: saved?._id },
      { patientName: billing?.patientName },
    );
}

/** GET /patient-invoices?month=YYYY-MM */
export async function fetchFinanceInvoicesFromApi({ month } = {}) {
  const monthParam = month ? formatBillingMonthParam(month) : '';
  const query = monthParam ? `?month=${encodeURIComponent(monthParam)}` : '';
  const response = await apiFetch(`/patient-invoices${query}`, {
    method: 'GET',
    quiet: true,
  });
  const payload = await parseJsonResponse(response);

  if (response.status === 404) return [];

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(payload, `Unable to load invoices (${response.status})`),
    );
  }

  return extractInvoiceListFromPayload(payload)
    .map((row) => normalizeFinanceInvoice(row))
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createFinanceInvoiceFromBilling(
  billing,
  { patientName, month, ...invoiceDetails } = {},
) {
  const invoice = await createPatientInvoiceViaApi(billing, { month, ...invoiceDetails });
  if (invoice && patientName && invoice.patientName === 'Patient') {
    invoice.patientName = patientName;
  }
  if (invoice && billing?.id && !invoice.billingRecordId) {
    invoice.billingRecordId = billing.id;
  }
  return cacheFinanceInvoice(invoice);
}

function buildPatientInvoiceUpdatePayload(invoice, invoiceDetails = {}) {
  const monthSource = invoiceDetails.month || invoice?.month || '';
  const monthParam = monthSource ? formatBillingMonthParam(monthSource) : '';
  const year = invoiceDetails.year
    || invoice?.year
    || (monthParam ? monthParam.split('-')[0] : String(new Date().getFullYear()));
  const status = String(
    invoiceDetails.status || invoice?.invoiceStatus || invoice?.status || 'pending',
  ).trim().toLowerCase();
  const paid = invoiceDetails.paid === true || status === 'paid';

  return {
    patientId: String(invoice?.patientId || invoiceDetails?.patientId || '').trim(),
    rate: Number(invoiceDetails.rate ?? invoice?.rate) || 0,
    numberOfTime: Number(invoiceDetails.numberOfTime ?? invoice?.numberOfTime) || 1,
    taxPercentage: Number(invoiceDetails.taxPercentage ?? invoice?.taxPercentage) || 0,
    discountPercentage: Number(invoiceDetails.discountPercentage ?? invoice?.discountPercentage) || 0,
    month: monthParam,
    year: String(year),
    status: paid ? 'paid' : (status === 'paid' ? 'paid' : 'pending'),
    paid,
  };
}

/** PATCH /patient-invoices/:invoiceId */
export async function updatePatientInvoiceViaApi(invoice, invoiceDetails = {}) {
  const invoiceId = String(invoice?.id || invoiceDetails?.id || '').trim();
  if (!invoiceId) {
    throw new Error('Invoice ID is required to update.');
  }

  const payload = buildPatientInvoiceUpdatePayload(invoice, invoiceDetails);
  const response = await apiFetch(
    `/patient-invoices/${encodeURIComponent(invoiceId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      quiet: true,
    },
  );
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(data, `Unable to update invoice (${response.status})`),
    );
  }

  const saved = extractInvoiceListFromPayload(data)[0]
    || data?.invoice
    || data?.data
    || data;

  return normalizeFinanceInvoice(saved, { patientName: invoice?.patientName })
    || normalizeFinanceInvoice(
      { ...invoice, ...payload, id: invoiceId, ...saved },
      { patientName: invoice?.patientName },
    );
}

export async function updateFinanceInvoice(invoice, invoiceDetails = {}) {
  const updated = await updatePatientInvoiceViaApi(invoice, invoiceDetails);
  if (updated && invoice?.patientName && updated.patientName === 'Patient') {
    updated.patientName = invoice.patientName;
  }
  if (updated && invoice?.billingRecordId && !updated.billingRecordId) {
    updated.billingRecordId = invoice.billingRecordId;
  }
  return cacheFinanceInvoice(updated);
}

/** DELETE /patient-invoices/:invoiceId */
export async function deletePatientInvoiceViaApi(invoice) {
  const invoiceId = String(invoice?.id || '').trim();
  if (!invoiceId) {
    throw new Error('Invoice ID is required to delete.');
  }

  const response = await apiFetch(
    `/patient-invoices/${encodeURIComponent(invoiceId)}`,
    {
      method: 'DELETE',
      quiet: true,
    },
  );
  const data = await parseJsonResponse(response);

  if (response.status === 404) {
    return { id: invoiceId, deleted: true };
  }

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(data, `Unable to delete invoice (${response.status})`),
    );
  }

  return { id: invoiceId, deleted: true };
}

export async function deleteFinanceInvoice(invoice) {
  const result = await deletePatientInvoiceViaApi(invoice);
  removeFinanceInvoiceFromCache(invoice?.id);
  return result;
}

/** @deprecated synchronous local-only create — use createFinanceInvoiceFromBilling */
export function createFinanceInvoiceFromBillingLocal(billing, { patientName, dueDate } = {}) {
  const store = readFinanceStore();
  const amount = Number(billing?.rate) || 0;
  const invoice = normalizeFinanceInvoice({
    id: makeId('fin-inv'),
    invoiceNumber: nextInvoiceNumber(store.invoices),
    patientId: billing?.patientId,
    patientName: patientName || 'Patient',
    billingRecordId: billing?.id,
    amount,
    frequency: billing?.frequency,
    note: billing?.note,
    status: 'unpaid',
    amountPaid: 0,
    dueDate: dueDate || '',
    issueDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    currency: billing?.currency || 'GHS',
  });

  store.invoices = [invoice, ...store.invoices];
  writeFinanceStore(store);
  return invoice;
}

export async function loadFinanceInvoicesWithApi({ month } = {}) {
  try {
    const apiInvoices = await fetchFinanceInvoicesFromApi({ month });
    if (apiInvoices.length) {
      const store = readFinanceStore();
      store.invoices = apiInvoices;
      writeFinanceStore(store);
      return apiInvoices;
    }
  } catch {
    // fall back to cache below
  }
  return loadFinanceInvoices();
}

export function recordFinancePayment({
  invoiceId,
  amount,
  method = 'manual',
  reference = '',
  note = '',
}) {
  const store = readFinanceStore();
  const invoices = store.invoices.map(normalizeFinanceInvoice).filter(Boolean);
  const payments = store.payments.map(normalizeFinancePayment).filter(Boolean);

  const invoice = invoices.find((row) => row.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found.');

  const paymentAmount = Number(amount);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error('Enter a valid payment amount.');
  }

  const payment = normalizeFinancePayment({
    id: makeId('fin-pay'),
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    patientId: invoice.patientId,
    patientName: invoice.patientName,
    amount: paymentAmount,
    method,
    reference,
    note,
    recordedAt: new Date().toISOString(),
    currency: invoice.currency,
  });

  const nextPaid = Math.min(invoice.amount, invoice.amountPaid + paymentAmount);
  const updatedInvoice = normalizeFinanceInvoice({
    ...invoice,
    amountPaid: nextPaid,
    status: normalizeInvoiceStatus(null, nextPaid, invoice.amount),
  });

  store.invoices = invoices.map((row) => (row.id === invoice.id ? updatedInvoice : row));
  store.payments = [payment, ...payments];
  writeFinanceStore(store);

  return { payment, invoice: updatedInvoice };
}

export function recordManualFinancePayment({
  patientId,
  patientName,
  amount,
  method = 'manual',
  reference = '',
  note = '',
}) {
  const paymentAmount = Number(amount);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error('Enter a valid payment amount.');
  }

  const store = readFinanceStore();
  const payment = normalizeFinancePayment({
    id: makeId('fin-pay'),
    patientId: String(patientId || '').trim(),
    patientName: patientName || 'Patient',
    amount: paymentAmount,
    method,
    reference,
    note,
    recordedAt: new Date().toISOString(),
  });

  store.payments = [payment, ...(store.payments || [])];
  writeFinanceStore(store);
  return payment;
}

export function summarizeFinance({ billingRecords = [], invoices = [], payments = [] } = {}) {
  const billingTotal = billingRecords.reduce((sum, row) => sum + (Number(row.rate) || 0), 0);
  const unpaidInvoices = invoices.filter((row) => row.status !== 'paid');
  const unpaidTotal = unpaidInvoices.reduce((sum, row) => sum + (row.balance || 0), 0);
  const paidInvoices = invoices.filter((row) => row.status === 'paid');
  const paymentsTotal = payments.reduce((sum, row) => sum + (row.amount || 0), 0);

  return {
    billingCount: billingRecords.length,
    billingTotal,
    invoiceCount: invoices.length,
    unpaidCount: unpaidInvoices.length,
    unpaidTotal,
    paidInvoiceCount: paidInvoices.length,
    paymentCount: payments.length,
    paymentsTotal,
  };
}

export function buildInvoiceShareText(invoice, agencyName = 'CareSense') {
  const statusLabel = invoice.invoiceStatus || invoice.status || 'pending';
  const breakdown = breakdownInvoiceAmounts(invoice);
  const lines = [
    `${agencyName} — Invoice ${invoice.invoiceNumber}`,
    '',
    `Patient: ${invoice.patientName}`,
    breakdown.rate ? `Rate: ${formatBillingMoney(breakdown.rate, invoice.currency)}` : null,
    breakdown.numberOfTime > 1 ? `Number of times: ${breakdown.numberOfTime}` : null,
    breakdown.subtotal > 0 ? `Subtotal: ${formatBillingMoney(breakdown.subtotal, invoice.currency)}` : null,
    `Discount (${breakdown.discountPercentage}%): ${breakdown.discountAmount > 0 ? '-' : ''}${formatBillingMoney(breakdown.discountAmount, invoice.currency)}`,
    `Tax (${breakdown.taxPercentage}%): ${formatBillingMoney(breakdown.taxAmount, invoice.currency)}`,
    `Total: ${formatBillingMoney(breakdown.total, invoice.currency)}`,
    invoice.month ? `Billing month: ${invoice.month}` : null,
    invoice.frequency ? `Frequency: ${invoice.frequency}` : null,
    invoice.note ? `Description: ${invoice.note}` : null,
    invoice.dueDate ? `Due date: ${invoice.dueDate}` : null,
    invoice.issueDate ? `Issue date: ${invoice.issueDate}` : null,
    `Status: ${statusLabel}`,
    invoice.amountPaid > 0 ? `Paid: ${formatBillingMoney(invoice.amountPaid, invoice.currency)}` : null,
    invoice.balance > 0 ? `Balance due: ${formatBillingMoney(invoice.balance, invoice.currency)}` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

export function buildInvoiceEmailShareUrl(
  invoice,
  { agencyName = 'CareSense', recipientEmail = '' } = {},
) {
  const subject = encodeURIComponent(`${agencyName} — Invoice ${invoice.invoiceNumber}`);
  const body = encodeURIComponent(buildInvoiceShareText(invoice, agencyName));
  const to = String(recipientEmail || '').trim();
  return to ? `mailto:${to}?subject=${subject}&body=${body}` : `mailto:?subject=${subject}&body=${body}`;
}

export function buildInvoiceWhatsAppShareUrl(
  invoice,
  { agencyName = 'CareSense', phone = '' } = {},
) {
  const text = encodeURIComponent(buildInvoiceShareText(invoice, agencyName));
  const cleanedPhone = String(phone || '').replace(/\D/g, '');
  if (cleanedPhone) return `https://wa.me/${cleanedPhone}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

export function patientDisplayName(patient) {
  if (!patient || typeof patient !== 'object') return 'Patient';
  const full = [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (patient.fullName) return String(patient.fullName).trim();
  if (patient.name) return String(patient.name).trim();
  return 'Patient';
}

function buildPatientIdentityLookup(patients) {
  const byAnyId = new Map();

  (Array.isArray(patients) ? patients : []).forEach((patient) => {
    const routeId = extractApiPatientId(patient)
      || String(patient?.uuid || patient?.patientId || patient?.id || '').trim();
    if (!routeId) return;

    const name = patientDisplayName(patient);
    [
      patient.id,
      patient._id,
      patient.uuid,
      patient.patientId,
      patient.patientUuid,
      patient.patientID,
      patient.patient_id,
      patient.registrationNumber,
      patient.regNo,
    ].forEach((value) => {
      const key = String(value || '').trim().toLowerCase();
      if (key) byAnyId.set(key, { routeId, name, patient });
    });
  });

  return byAnyId;
}

function collectBillingRowIdKeys(row) {
  const ref = row.patient || (row.patientId && typeof row.patientId === 'object' ? row.patientId : null);
  const keys = new Set();
  const add = (value) => {
    if (value == null || typeof value === 'object') return;
    const key = String(value).trim().toLowerCase();
    if (key) keys.add(key);
  };

  add(row.patientId);
  add(extractBillingPatientId(row));

  if (ref) {
    add(ref.patientId);
    add(ref.patient_id);
    add(ref.uuid);
    add(ref._id);
    add(ref.id);
  }

  return keys;
}

function dedupeBillingRowsByPatient(records) {
  const byPatient = new Map();

  records.forEach((row) => {
    const key = String(row.patientId || '').trim().toLowerCase();
    if (!key) return;

    const existing = byPatient.get(key);
    if (!existing) {
      byPatient.set(key, row);
      return;
    }

    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const rowTime = new Date(row.updatedAt || row.createdAt || 0).getTime();
    if (rowTime >= existingTime) byPatient.set(key, row);
  });

  return Array.from(byPatient.values());
}

/** @deprecated use enrichBillingWithPatientNames(records, patients) */
export function buildPatientNameLookup(patients) {
  return buildPatientIdentityLookup(patients);
}

function collectPatientKeys(patient) {
  const keys = new Set();
  const add = (value) => {
    if (value == null || typeof value === 'object') return;
    const key = String(value).trim().toLowerCase();
    if (key) keys.add(key);
  };

  if (!patient || typeof patient !== 'object') return keys;

  add(extractApiPatientId(patient));
  add(patient.uuid);
  add(patient.patientId);
  add(patient.patientUuid);
  add(patient.patientID);
  add(patient.patient_id);
  add(patient.id);
  add(patient._id);
  add(patient.registrationNumber);
  add(patient.regNo);

  return keys;
}

function billingRecordMatchesPatient(record, patientKeys) {
  for (const key of collectBillingRowIdKeys(record)) {
    if (patientKeys.has(key)) return true;
  }
  return false;
}

/** Map month billing rows onto agency patients — one billing row per patient, no cross-assignment. */
export function assignBillingRecordsToPatients(billingRecords, patients = []) {
  const records = Array.isArray(billingRecords) ? billingRecords : [];
  const usedRecordIds = new Set();
  const result = [];

  (Array.isArray(patients) ? patients : []).forEach((patient) => {
    const routeId = extractApiPatientId(patient)
      || String(patient?.uuid || patient?.patientId || patient?.id || '').trim();
    if (!routeId) return;

    const patientKeys = collectPatientKeys(patient);
    if (!patientKeys.size) return;

    let matchedRecord = null;
    let matchedKey = '';

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const recordKey = String(record?.id || `row-${index}`).trim();
      if (usedRecordIds.has(recordKey)) continue;
      if (!billingRecordMatchesPatient(record, patientKeys)) continue;
      matchedRecord = record;
      matchedKey = recordKey;
      break;
    }

    if (!matchedRecord) return;

    usedRecordIds.add(matchedKey);

    result.push({
      ...matchedRecord,
      patientId: routeId,
      patientName: patientDisplayName(patient),
      patient,
    });
  });

  return result;
}

export function enrichBillingWithPatientNames(records, patients = []) {
  return assignBillingRecordsToPatients(records, patients);
}
