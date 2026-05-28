import { apiFetch } from '../api';

export const WALLET_PAYMENT_TYPES = [
  { value: 'paystack', label: 'Paystack' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'offline_payment', label: 'Offline payment' },
];

export function resolveUserEmail(user) {
  return String(user?.email || user?.userEmail || '').trim();
}

export function buildWalletCallbackUrl(options = {}) {
  const { amount, currency, reference } = options || {};
  if (typeof window === 'undefined') {
    const url = new URL('/wallet/success', 'http://localhost:5173');
    if (Number.isFinite(Number(amount))) url.searchParams.set('amount', String(amount));
    if (currency) url.searchParams.set('currency', String(currency));
    if (reference) url.searchParams.set('reference', String(reference));
    return url.toString();
  }
  const url = new URL('/wallet/success', window.location.origin);
  if (Number.isFinite(Number(amount))) url.searchParams.set('amount', String(amount));
  if (currency) url.searchParams.set('currency', String(currency));
  if (reference) url.searchParams.set('reference', String(reference));
  return url.toString();
}

function parseJsonResponse(response, responseText) {
  if (!responseText) return {};
  try {
    return JSON.parse(responseText);
  } catch {
    return { message: responseText };
  }
}

function extractPaymentUrl(payload) {
  const root = payload && typeof payload === 'object' ? payload : {};
  const data = root.data && typeof root.data === 'object' ? root.data : root;
  return String(
    data.authorizationUrl
    || data.authorization_url
    || data.paymentUrl
    || data.payment_url
    || data.checkoutUrl
    || data.checkout_url
    || data.paystackUrl
    || data.paystack_url
    || data.url
    || root.authorizationUrl
    || root.authorization_url
    || root.url
    || '',
  ).trim();
}

export function normalizeWalletTransaction(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const amount = Number(raw.amount ?? raw.value ?? raw.depositAmount);
  const createdAt = raw.createdAt || raw.date || raw.timestamp || new Date().toISOString();
  const paymentType = raw.paymentType || raw.type || 'deposit';

  return {
    id: String(raw.id || raw._id || raw.reference || raw.transactionId || `tx-${index}-${createdAt}`),
    type: paymentType,
    amount: Number.isFinite(amount) ? amount : 0,
    createdAt,
    label: raw.label || raw.description || `${String(paymentType).replace(/_/g, ' ')} deposit`,
    status: String(raw.status || 'success').toLowerCase(),
  };
}

export function normalizeWalletFromApi(payload) {
  const root = payload && typeof payload === 'object' ? payload : {};
  const data = root.wallet && typeof root.wallet === 'object'
    ? root.wallet
    : root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? root.data
      : root;

  const balance = Number(
    data.balance
    ?? data.availableBalance
    ?? data.available_balance
    ?? data.walletBalance
    ?? data.wallet_balance,
  );

  const txSource = Array.isArray(data.transactions)
    ? data.transactions
    : Array.isArray(data.history)
      ? data.history
      : Array.isArray(data.deposits)
        ? data.deposits
        : Array.isArray(root.transactions)
          ? root.transactions
          : [];

  return {
    balance: Number.isFinite(balance) ? balance : 0,
    transactions: txSource
      .map((item, index) => normalizeWalletTransaction(item, index))
      .filter(Boolean),
  };
}

export async function fetchWallet() {
  const paths = ['/wallet', '/wallet/balance', '/wallet/me'];
  let lastError = 'Unable to load wallet.';

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const responseText = await response.text().catch(() => '');
      const data = parseJsonResponse(response, responseText);

      if (response.ok) {
        return { wallet: normalizeWalletFromApi(data), raw: data };
      }

      lastError = data?.message || data?.error || lastError;
      if (response.status !== 404) break;
    } catch (error) {
      lastError = error?.message || lastError;
    }
  }

  throw new Error(lastError);
}

export async function depositWallet({
  paymentType = 'paystack',
  amount,
  email,
  currency = 'GHS',
  callbackUrl,
}) {
  const payload = {
    paymentType,
    amount: Number(amount),
    email: String(email || '').trim(),
    currency: String(currency || 'GHS').trim().toUpperCase(),
    callbackUrl: callbackUrl || buildWalletCallbackUrl(),
  };

  const response = await apiFetch('/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const responseText = await response.text().catch(() => '');
  const data = parseJsonResponse(response, responseText);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Unable to start wallet deposit.');
  }

  const paymentUrl = extractPaymentUrl(data);
  const wallet = normalizeWalletFromApi(data);

  return {
    paymentUrl,
    wallet,
    raw: data,
  };
}
