import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { FiCheckCircle, FiCreditCard, FiArrowLeft } from '../icons/hugeicons-feather';
import { verifyWalletPayment } from '../utils/wallet';
import './WalletSuccess.css';

function parseAmount(value) {
  const n = Number(String(value || '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function formatGhs(amount) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return 'GH₵0.00';
  return `GH₵${n.toFixed(2)}`;
}

function resolvePaymentReference(params) {
  return String(
    params.get('reference')
    || params.get('trxref')
    || params.get('ref')
    || '',
  ).trim();
}

export default function WalletSuccess() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const amountParam = parseAmount(params.get('amount'));
  const reference = resolvePaymentReference(params);

  const [verifiedAmount, setVerifiedAmount] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function verifyPayment() {
      if (!reference) {
        if (!mounted) return;
        setVerifyError('Missing payment reference. Return to Billing and try again.');
        setVerifying(false);
        return;
      }

      setVerifying(true);
      setVerifyError('');

      try {
        const result = await verifyWalletPayment(reference);
        if (!mounted) return;
        const amount = result.amount ?? amountParam;
        if (amount != null) setVerifiedAmount(amount);
      } catch (error) {
        if (!mounted) return;
        setVerifyError(error?.message || 'Unable to verify payment.');
        if (amountParam != null) setVerifiedAmount(amountParam);
      } finally {
        if (mounted) setVerifying(false);
      }
    }

    verifyPayment();
    return () => {
      mounted = false;
    };
  }, [reference, amountParam]);

  const amountToShow = verifiedAmount ?? amountParam;
  const amountLabel = amountToShow != null ? formatGhs(amountToShow) : null;
  const isVerified = !verifying && !verifyError;

  return (
    <motion.div
      className="wallet-success"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="wallet-success__card">
        <div className={`wallet-success__icon${verifyError ? ' wallet-success__icon--error' : ''}`} aria-hidden>
          <FiCheckCircle size={26} />
        </div>

        <h1 className="wallet-success__title">
          {verifying ? 'Verifying payment…' : isVerified ? 'Payment successful' : 'Verification issue'}
        </h1>
        <p className="wallet-success__subtitle">
          {verifying
            ? 'Confirming your Paystack payment with CareSense.'
            : isVerified
              ? 'Your wallet deposit has been confirmed.'
              : 'We could not confirm this payment automatically.'}
        </p>

        {verifyError ? (
          <div className="wallet-success__error" role="alert">{verifyError}</div>
        ) : null}

        <div className="wallet-success__details">
          <div className="wallet-success__row">
            <div className="wallet-success__label">
              <FiCreditCard size={14} aria-hidden /> Amount paid
            </div>
            <div className="wallet-success__value">
              {verifying ? 'Verifying…' : amountLabel || '—'}
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
