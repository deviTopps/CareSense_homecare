import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiDownload,
  FiCreditCard,
  FiCheckCircle,
  FiCalendar,
  FiFileText,
  FiPlus,
} from '../icons/hugeicons-feather';
import { getUser } from '../api';
import {
  WALLET_PAYMENT_TYPES,
  buildWalletCallbackUrl,
  depositWallet,
  fetchWallet,
  resolveUserEmail,
} from '../utils/wallet';
import './Billing.css';

const ORDER_HISTORY = [
  { id: '1', date: 'Oct. 21, 2021', type: 'Pro Annual', amount: '£299.00' },
  { id: '2', date: 'Aug. 21, 2021', type: 'Pro Portfolio', amount: '£149.00' },
  { id: '3', date: 'July. 21, 2021', type: 'Sponsored Post', amount: '£49.00' },
  { id: '4', date: 'Jun. 21, 2021', type: 'Sponsored Post', amount: '£49.00' },
  { id: '5', date: 'May. 21, 2021', type: 'Pro Annual', amount: '£299.00' },
  { id: '6', date: 'Apr. 21, 2021', type: 'Sponsored Post', amount: '£49.00' },
];

const INITIAL_VISIBLE = 4;
const PAGE_SIZE = 2;

function currencySymbolFromUser(user) {
  const currency =
    user?.currency
    || user?.agency?.currency
    || user?.billingCurrency
    || user?.agencyCurrency
    || 'GHS';
  const c = String(currency || '').trim().toUpperCase();
  if (c === 'USD') return '$';
  // Force Ghana Cedi for wallet flows
  if (c === 'EUR') return 'GH₵';
  if (c === 'GHS') return 'GH₵';
  if (c === 'NGN') return '₦';
  return '£';
}

function formatMoney(amount, symbol = '£') {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return `${symbol}0.00`;
  return `${symbol}${n.toFixed(2)}`;
}

function walletStorageKey(user) {
  const userId = String(user?.id || user?._id || user?.userId || user?.staffId || 'anon').trim();
  return `caresense.wallet:${userId}`;
}

function readWallet(user) {
  try {
    const raw = localStorage.getItem(walletStorageKey(user));
    if (!raw) return { balance: 0, transactions: [] };
    const parsed = JSON.parse(raw);
    const balance = Number(parsed?.balance);
    const transactions = Array.isArray(parsed?.transactions) ? parsed.transactions : [];
    return {
      balance: Number.isFinite(balance) ? balance : 0,
      transactions,
    };
  } catch {
    return { balance: 0, transactions: [] };
  }
}

function writeWallet(user, wallet) {
  try {
    localStorage.setItem(walletStorageKey(user), JSON.stringify(wallet));
  } catch {
    // ignore
  }
}

function resolvePlanLabel(user) {
  const raw = user?.plan ?? user?.subscriptionPlan ?? user?.planName ?? user?.tier ?? user?.agency?.plan;
  if (raw && typeof raw === 'object') {
    return String(raw.name || raw.label || raw.title || 'Standard Plan').trim() || 'Standard Plan';
  }
  const label = String(raw || '').trim();
  return label || 'Standard Plan';
}

function formatRenewalDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function planTypeVariant(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('annual') || t.includes('pro')) return 'pro';
  if (t.includes('portfolio')) return 'portfolio';
  return 'other';
}

export default function Billing() {
  const user = useMemo(() => getUser(), []);
  const planName = 'Standard Plan';
  const renewalLabel = `Renews on ${formatRenewalDate()}`;
  const currencySymbol = currencySymbolFromUser(user);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [activeOrderId, setActiveOrderId] = useState('2');
  const [statusMessage, setStatusMessage] = useState('');
  const [wallet, setWallet] = useState(() => readWallet(user));
  const [walletLoading, setWalletLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpPaymentType, setTopUpPaymentType] = useState('paystack');
  const [topUpError, setTopUpError] = useState('');
  const [depositing, setDepositing] = useState(false);

  const walletCurrency = useMemo(() => {
    const c = user?.currency || user?.agency?.currency || user?.billingCurrency || 'GHS';
    return String(c || 'GHS').trim().toUpperCase();
  }, [user]);

  const applyWallet = useCallback((next) => {
    setWallet(next);
    writeWallet(user, next);
  }, [user]);

  const showStatus = useCallback((message) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(''), 3600);
  }, []);

  const loadWallet = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!silent) setWalletLoading(true);
    try {
      const { wallet: apiWallet } = await fetchWallet();
      applyWallet(apiWallet);
      return apiWallet;
    } catch {
      if (!silent) {
        applyWallet(readWallet(user));
      }
      return null;
    } finally {
      if (!silent) setWalletLoading(false);
    }
  }, [applyWallet, user]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    if (params.get('wallet') !== 'deposit') return undefined;

    loadWallet({ silent: false }).then(() => {
      showStatus('Wallet updated after payment.');
      params.delete('wallet');
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
      window.history.replaceState({}, '', nextUrl);
    });

    return undefined;
  }, [loadWallet, showStatus]);

  const visibleOrders = ORDER_HISTORY.slice(0, visibleCount);
  const canLoadMore = visibleCount < ORDER_HISTORY.length;
  const totalShown = visibleOrders.length;

  const handleLoadMore = () => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, ORDER_HISTORY.length));
  };

  const handleDownload = (order) => {
    showStatus(`Preparing receipt for ${order.type}…`);
  };

  const openTopUp = () => {
    setTopUpError('');
    setTopUpAmount('');
    setTopUpPaymentType('paystack');
    setTopUpOpen(true);
  };

  const closeTopUp = () => {
    if (depositing) return;
    setTopUpOpen(false);
    setTopUpError('');
    setTopUpAmount('');
    setTopUpPaymentType('paystack');
  };

  const submitTopUp = async () => {
    const n = Number(String(topUpAmount || '').replace(/,/g, '').trim());
    if (!Number.isFinite(n) || n <= 0) {
      setTopUpError('Enter a valid amount greater than 0.');
      return;
    }
    if (n > 1000000) {
      setTopUpError('Amount is too large.');
      return;
    }

    const email = resolveUserEmail(user);
    if (!email) {
      setTopUpError('Your account needs an email address before loading the wallet.');
      return;
    }

    setDepositing(true);
    setTopUpError('');

    try {
      const result = await depositWallet({
        paymentType: topUpPaymentType,
        amount: n,
        email,
        currency: walletCurrency,
        callbackUrl: buildWalletCallbackUrl({ amount: n, currency: walletCurrency }),
      });

      if (result.wallet && (result.wallet.balance > 0 || result.wallet.transactions.length > 0)) {
        applyWallet(result.wallet);
      }

      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }

      closeTopUp();
      await loadWallet({ silent: true });

      if (topUpPaymentType === 'paystack') {
        showStatus('Deposit started. Complete payment if you were not redirected.');
      } else {
        showStatus(`Deposit of ${formatMoney(n, currencySymbol)} submitted.`);
      }
    } catch (error) {
      setTopUpError(error?.message || 'Unable to load wallet. Please try again.');
    } finally {
      setDepositing(false);
    }
  };

  const handleCancelSubscription = () => {
    showStatus('Contact support to cancel your subscription.');
  };

  return (
    <motion.div
      className="page-wrapper billing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24 }}
    >
      <header className="billing-page__header">
        <div className="billing-page__header-copy">
          <h1 className="billing-page__title">Billing</h1>
          <p className="billing-page__subtitle">
            Manage your subscription, payment methods, and download receipts.
          </p>
        </div>
        <div className="billing-page__header-meta">
          <div className="billing-stat-pill">
            <FiFileText size={16} aria-hidden />
            <span>
              <strong>{ORDER_HISTORY.length}</strong> invoices
            </span>
          </div>
          <div className="billing-stat-pill billing-stat-pill--accent">
            <FiCheckCircle size={16} aria-hidden />
            <span>Plan active</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {statusMessage ? (
          <motion.div
            className="billing-toast"
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <FiCheckCircle size={16} aria-hidden />
            {statusMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="billing-page__layout">
        <div className="billing-page__main">
          <section className="billing-panel" aria-labelledby="billing-order-history">
            <div className="billing-panel__head">
              <div>
                <h2 id="billing-order-history" className="billing-panel__title">Order History</h2>
                <p className="billing-panel__desc">Manage billing information and view receipts</p>
              </div>
              <span className="billing-panel__badge">{totalShown} of {ORDER_HISTORY.length}</span>
            </div>

            <div className="billing-order-list" role="table" aria-label="Order history">
              <div className="billing-order-list__header" role="row">
                <span role="columnheader">Date</span>
                <span role="columnheader">Type</span>
                <span role="columnheader" className="billing-order-list__col-amount">Amount</span>
                <span role="columnheader" className="billing-order-list__col-action">Receipt</span>
              </div>

              <ul className="billing-order-list__body">
                {visibleOrders.map((order, index) => (
                  <motion.li
                    key={order.id}
                    role="row"
                    className={`billing-order-row${activeOrderId === order.id ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveOrderId(order.id)}
                    onFocus={() => setActiveOrderId(order.id)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                  >
                    <span className="billing-order-row__date" role="cell">{order.date}</span>
                    <span className="billing-order-row__type" role="cell">
                      <span className={`billing-type-badge billing-type-badge--${planTypeVariant(order.type)}`}>
                        {order.type}
                      </span>
                    </span>
                    <span className="billing-order-row__amount billing-order-list__col-amount" role="cell">
                      {order.amount}
                    </span>
                    <span className="billing-order-row__action billing-order-list__col-action" role="cell">
                      <button
                        type="button"
                        className="billing-btn billing-btn--ghost"
                        onClick={() => handleDownload(order)}
                      >
                        <FiDownload size={14} aria-hidden />
                        Download
                      </button>
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {canLoadMore ? (
              <button type="button" className="billing-load-more" onClick={handleLoadMore}>
                Load more
              </button>
            ) : null}
          </section>

          <section className="billing-panel" aria-labelledby="billing-wallet">
            <div className="billing-panel__head">
              <div>
                <h2 id="billing-wallet" className="billing-panel__title">Wallet</h2>
                <p className="billing-panel__desc">Load funds to your wallet to pay for services.</p>
              </div>
            </div>

            <div className="billing-wallet-card">
              <div className="billing-wallet-card__left">
                <div className="billing-wallet-card__icon" aria-hidden>
                  <FiCreditCard size={20} />
                </div>
                <div className="billing-wallet-card__meta">
                  <p className="billing-wallet-card__label">Available balance</p>
                  <p className="billing-wallet-card__balance">
                    {walletLoading ? '…' : formatMoney(wallet.balance, currencySymbol)}
                  </p>
                </div>
              </div>
              <div className="billing-wallet-card__actions">
                <button type="button" className="billing-btn billing-btn--primary" onClick={openTopUp}>
                  <FiPlus size={14} aria-hidden />
                  Load wallet
                </button>
              </div>
            </div>

            <div className="billing-wallet-ledger">
              <div className="billing-wallet-ledger__head">
                <span>Recent wallet activity</span>
                <span className="billing-wallet-ledger__hint">{walletCurrency}</span>
              </div>
              {wallet.transactions.length > 0 ? (
                <ul className="billing-wallet-ledger__list">
                  {wallet.transactions.map((tx) => (
                    <li key={tx.id} className="billing-wallet-ledger__row">
                      <div>
                        <div className="billing-wallet-ledger__title">{tx.label || 'Wallet activity'}</div>
                        <div className="billing-wallet-ledger__meta">
                          {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                          • {new Date(tx.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="billing-wallet-ledger__amount">
                        +{formatMoney(tx.amount, currencySymbol)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="billing-wallet-empty">
                  <p className="billing-wallet-empty__title">No wallet activity yet</p>
                  <p className="billing-wallet-empty__text">Load your wallet to start making payments.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="billing-page__aside">
          <div className="billing-plan-card">
            <div className="billing-plan-card__glow" aria-hidden />
            <div className="billing-plan-card__content">
              <span className="billing-plan-card__eyebrow">Your plan</span>
              <h3 className="billing-plan-card__name">{planName}</h3>
              <p className="billing-plan-card__renewal">
                <FiCalendar size={14} aria-hidden />
                {renewalLabel}
              </p>
              <ul className="billing-plan-card__features">
                <li><FiCheckCircle size={14} aria-hidden /> Unlimited patient records</li>
                <li><FiCheckCircle size={14} aria-hidden /> Care visit scheduling</li>
                <li><FiCheckCircle size={14} aria-hidden /> Workforce management</li>
              </ul>
              <button type="button" className="billing-plan-card__cancel" onClick={handleCancelSubscription}>
                Cancel subscription
              </button>
            </div>
          </div>

          <div className="billing-help-card">
            <p className="billing-help-card__title">Need help with billing?</p>
            <p className="billing-help-card__text">
              Contact our team for invoices, plan changes, or refund questions.
            </p>
            <a href="mailto:services.caresense@gmail.com" className="billing-help-card__link">
              services.caresense@gmail.com
            </a>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {topUpOpen ? (
          <motion.div
            className="billing-modal-overlay"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTopUp}
          >
            <motion.div
              className="billing-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Load wallet"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="billing-modal__head">
                <div>
                  <div className="billing-modal__kicker">Wallet</div>
                  <div className="billing-modal__title">Load wallet</div>
                </div>
                <button type="button" className="billing-modal__close" onClick={closeTopUp} aria-label="Close">
                  ✕
                </button>
              </div>

              <div className="billing-modal__body">
                <label className="billing-modal__label" htmlFor="wallet-topup-payment-type">Payment method</label>
                <select
                  id="wallet-topup-payment-type"
                  className="billing-modal__select"
                  value={topUpPaymentType}
                  disabled={depositing}
                  onChange={(e) => {
                    setTopUpError('');
                    setTopUpPaymentType(e.target.value);
                  }}
                >
                  {WALLET_PAYMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <label className="billing-modal__label billing-modal__label--spaced" htmlFor="wallet-topup-amount">Amount</label>
                <div className="billing-modal__input-wrap">
                  <span className="billing-modal__prefix" aria-hidden>{currencySymbol}</span>
                  <input
                    id="wallet-topup-amount"
                    value={topUpAmount}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={depositing}
                    onChange={(e) => {
                      setTopUpError('');
                      setTopUpAmount(e.target.value);
                    }}
                    className="billing-modal__input"
                  />
                </div>
                {topUpError ? <div className="billing-modal__error" role="alert">{topUpError}</div> : null}
                <div className="billing-modal__helper">
                  {topUpPaymentType === 'paystack'
                    ? 'You will be redirected to Paystack to complete payment. Funds are added after confirmation.'
                    : 'Your deposit request will be sent for processing.'}
                </div>
              </div>

              <div className="billing-modal__footer">
                <button type="button" className="billing-btn billing-btn--ghost" onClick={closeTopUp} disabled={depositing}>Cancel</button>
                <button type="button" className="billing-btn billing-btn--primary" onClick={submitTopUp} disabled={depositing}>
                  <FiPlus size={14} aria-hidden />
                  {depositing ? 'Processing…' : 'Load wallet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
