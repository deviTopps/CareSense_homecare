export const EMPTY_INVOICE_FORM = {
  rate: '',
  numberOfTime: '1',
  taxPercentage: '0',
  discountPercentage: '0',
  status: 'pending',
  paid: false,
};

export function statusLabel(status) {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  return 'Unpaid';
}

export function invoiceRowStatusModifier(invoice) {
  if (invoice?.status === 'paid') return 'paid';
  if (invoice?.status === 'partial') return 'partial';
  return 'unpaid';
}

export function invoicePaidProgress(invoice) {
  const total = Number(invoice?.amount) || 0;
  if (total <= 0) return invoice?.status === 'paid' ? 100 : 0;
  return Math.min(100, Math.round(((Number(invoice?.amountPaid) || 0) / total) * 100));
}

export function patientInitial(name) {
  const text = String(name || 'P').trim();
  return text.charAt(0).toUpperCase();
}

export function isInvoiceOverdue(invoice) {
  if (!invoice?.dueDate || invoice.status === 'paid') return false;
  const due = new Date(invoice.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function formatShortDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function currentBillingMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatBillingMonthLabel(value) {
  const [year, month] = String(value || '').split('-').map(Number);
  if (!year || !month) return value || '';
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function buildEmptyPaymentForm(month = currentBillingMonth()) {
  return {
    patientId: '',
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    month,
    paymentMethod: 'bank_transfer',
    reference: '',
    note: '',
  };
}

export function getCurrencyPrefix(currency = 'GHS') {
  const code = String(currency || 'GHS').trim().toUpperCase();
  if (code === 'USD') return '$';
  if (code === 'EUR') return '€';
  if (code === 'NGN') return '₦';
  if (code === 'GBP') return '£';
  return 'GH₵';
}

export function sanitizeAmountInput(value) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const [whole, ...rest] = cleaned.split('.');
  if (!rest.length) return whole;
  return `${whole}.${rest.join('').slice(0, 2)}`;
}
