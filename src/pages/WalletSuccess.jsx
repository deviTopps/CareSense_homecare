import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { FiCheckCircle, FiCreditCard, FiArrowLeft } from '../icons/hugeicons-feather';
import { fetchWallet } from '../utils/wallet';
import './WalletSuccess.css';

function parseAmount(value) {
  const n = Number(String(value || '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function currencySymbolFromCode(code) {
  const c = String(code || '').trim().toUpperCase();
  if (c === 'GHS') return 'GH₵';
  if (c === 'NGN') return '₦';
  if (c === 'USD') return '$';
  if (c === 'EUR') return '€';
  return '';
}

function formatMoney(amount, currencyCode) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  const symbol = currencySymbolFromCode(currencyCode);
  if (!Number.isFinite(n)) return `${symbol || ''}0.00`;
  return `${symbol || ''}${n.toFixed(2)}${symbol ? '' : ` ${String(currencyCode || '').trim().toUpperCase() || ''}`}`.trim();
}

export default function WalletSuccess() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const amountParam = parseAmount(params.get('amount'));
  const currencyParam = String(params.get('currency') || 'GHS').trim().toUpperCase();
  const reference = String(params.get('reference') || params.get('trxref') || params.get('reference') || '').trim();

  const [walletAmount, setWalletAmount] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingWallet(true);
    fetchWallet()
      .then(({ wallet }) => {
        if (!mounted) return;
        const latest = Array.isArray(wallet?.transactions) ? wallet.transactions[0] : null;
        const latestAmount = Number(latest?.amount);
        if (Number.isFinite(latestAmount) && latestAmount > 0) {
          setWalletAmount(latestAmount);
        }
      })
      .catch(() => {
        // ignore: show query param amount
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingWallet(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const amountToShow = amountParam ?? walletAmount;
  const amountLabel = amountToShow != null ? formatMoney(amountToShow, currencyParam) : null;

  return (
    <motion.div
      className="wallet-success"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="wallet-success__card">
        <div className="wallet-success__icon" aria-hidden>
          <FiCheckCircle size={26} />
        </div>

        <h1 className="wallet-success__title">Payment successful</h1>
        <p className="wallet-success__subtitle">Your wallet deposit has been confirmed.</p>

        <div className="wallet-success__details">
          <div className="wallet-success__row">
            <div className="wallet-success__label">
              <FiCreditCard size={14} aria-hidden /> Amount paid
            </div>
            <div className="wallet-success__value">
              {amountLabel || (loadingWallet ? 'Loading…' : '—')}
            </div>
          </div>

          {reference ? (
            <div className="wallet-success__row">
              <div className="wallet-success__label">Reference</div>
              <div className="wallet-success__value wallet-success__value--mono">{reference}</div>
            </div>
          ) : null}
        </div>

        <div className="wallet-success__actions">
          <Link className="wallet-success__btn wallet-success__btn--primary" to="/billing">
            Back to Billing
          </Link>
          <Link className="wallet-success__btn wallet-success__btn--ghost" to="/dashboard">
            <FiArrowLeft size={14} aria-hidden />
            Dashboard
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

