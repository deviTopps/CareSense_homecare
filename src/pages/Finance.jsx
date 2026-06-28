import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiX,
  FiFileText,
  FiRefreshCw,
  FiCreditCard,
  FiCheckCircle,
  FiSearch,
  FiBarChart2,
} from '../icons/hugeicons-feather';
import { getUser } from '../api';
import { fetchAllPatientBillingRecords, formatBillingMoney } from '../utils/patientBilling';
import {
  EMPTY_INVOICE_FORM,
  currentBillingMonth,
  formatBillingMonthLabel,
  patientInitial,
} from '../utils/financeUiHelpers';
import {
  INVOICE_CREATE_STATUSES,
  computeInvoiceAmount,
  createFinanceInvoiceFromBilling,
  loadFinanceInvoicesWithApi,
  loadFinancePaymentsWithApi,
  summarizeFinance,
} from '../utils/finance';
import './Finance.css';

export default function Finance() {
  const navigate = useNavigate();
  const user = useMemo(() => getUser(), []);
  const agencyName = user?.agency?.name || user?.agencyName || 'CareSense';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [billingMonth, setBillingMonth] = useState(currentBillingMonth);
  const [billingRecords, setBillingRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [createInvoiceTarget, setCreateInvoiceTarget] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE_FORM);
  const [saving, setSaving] = useState(false);

  const reloadFinanceData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [billing, invoiceRows, paymentRows] = await Promise.all([
        fetchAllPatientBillingRecords({ month: billingMonth }),
        loadFinanceInvoicesWithApi({ month: billingMonth }),
        loadFinancePaymentsWithApi({ month: billingMonth }),
      ]);
      setBillingRecords(billing);
      setInvoices(invoiceRows);
      setPayments(paymentRows);
    } catch (err) {
      setError(err?.message || 'Unable to load billing data.');
    } finally {
      setLoading(false);
    }
  }, [billingMonth]);

  useEffect(() => {
    reloadFinanceData();
  }, [reloadFinanceData]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 3200);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!createInvoiceTarget || saving) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeInvoiceModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createInvoiceTarget, saving]);

  const summary = useMemo(
    () => summarizeFinance({ billingRecords, invoices, payments }),
    [billingRecords, invoices, payments],
  );

  const currency = billingRecords[0]?.currency || invoices[0]?.currency || 'GHS';
  const query = searchQuery.trim().toLowerCase();

  const filteredBilling = useMemo(() => {
    if (!query) return billingRecords;
    return billingRecords.filter((row) => [
      row.patientName,
      row.note,
      row.frequency,
      row.frequencyLabel,
    ].some((v) => String(v || '').toLowerCase().includes(query)));
  }, [billingRecords, query]);

  const invoicePreviewTotal = useMemo(
    () => computeInvoiceAmount({
      rate: invoiceForm.rate,
      numberOfTime: invoiceForm.numberOfTime,
      taxPercentage: invoiceForm.taxPercentage,
      discountPercentage: invoiceForm.discountPercentage,
    }),
    [invoiceForm.discountPercentage, invoiceForm.numberOfTime, invoiceForm.rate, invoiceForm.taxPercentage],
  );

  const closeInvoiceModal = () => {
    setCreateInvoiceTarget(null);
    setInvoiceForm(EMPTY_INVOICE_FORM);
  };

  const openCreateInvoice = (row) => {
    setCreateInvoiceTarget(row);
    setInvoiceForm({
      ...EMPTY_INVOICE_FORM,
      rate: String(row?.rate ?? ''),
    });
  };

  const updateInvoiceForm = (patch) => {
    setInvoiceForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.status === 'paid') next.paid = true;
      if (patch.status === 'pending') next.paid = false;
      if (patch.paid === true) next.status = 'paid';
      if (patch.paid === false && next.status === 'paid') next.status = 'pending';
      return next;
    });
  };

  const handleCreateInvoice = async () => {
    if (!createInvoiceTarget) return;
    setSaving(true);
    setError('');
    try {
      const invoice = await createFinanceInvoiceFromBilling(createInvoiceTarget, {
        patientName: createInvoiceTarget.patientName,
        month: billingMonth,
        rate: invoiceForm.rate,
        numberOfTime: invoiceForm.numberOfTime,
        taxPercentage: invoiceForm.taxPercentage,
        discountPercentage: invoiceForm.discountPercentage,
        status: invoiceForm.status,
        paid: invoiceForm.paid,
      });
      closeInvoiceModal();
      setSuccess(`Invoice ${invoice.invoiceNumber} created.`);
      navigate('/invoices-payments', { state: { shareInvoice: invoice } });
    } catch (err) {
      setError(err?.message || 'Unable to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper finance-page">
      <header className="finance-hero">
        <div className="finance-hero__copy">
          <p className="finance-hero__eyebrow">Finance</p>
          <h1 className="finance-hero__title">Patient billing</h1>
          <p className="finance-hero__subtitle">
            Manage patient rates for {agencyName}, then create invoices on the Invoices &amp; payments page.
          </p>
        </div>
        <div className="finance-hero__actions">
          <Link to="/invoices-payments" className="finance-btn finance-btn--ghost">
            <FiFileText size={15} aria-hidden />
            Invoices &amp; payments
          </Link>
          <button type="button" className="finance-btn finance-btn--ghost" onClick={reloadFinanceData} disabled={loading}>
            <FiRefreshCw size={15} aria-hidden className={loading ? 'finance-spin' : undefined} />
            Refresh
          </button>
        </div>
      </header>

      <div className="finance-stats">
        <div className="finance-stat">
          <span className="finance-stat__icon finance-stat__icon--blue"><FiCreditCard size={18} /></span>
          <div>
            <span className="finance-stat__label">Billing total</span>
            <strong className="finance-stat__value">{formatBillingMoney(summary.billingTotal, currency)}</strong>
            <span className="finance-stat__meta">{summary.billingCount} active rates</span>
          </div>
        </div>
        <Link to="/invoices-payments" className="finance-stat finance-stat--clickable">
          <span className="finance-stat__icon finance-stat__icon--amber"><FiFileText size={18} /></span>
          <div>
            <span className="finance-stat__label">Outstanding</span>
            <strong className="finance-stat__value finance-stat__value--warn">{formatBillingMoney(summary.unpaidTotal, currency)}</strong>
            <span className="finance-stat__meta">{summary.unpaidCount} unpaid invoices</span>
          </div>
        </Link>
        <Link to="/invoices-payments?tab=payments" className="finance-stat finance-stat--clickable">
          <span className="finance-stat__icon finance-stat__icon--green"><FiCheckCircle size={18} /></span>
          <div>
            <span className="finance-stat__label">Collected</span>
            <strong className="finance-stat__value finance-stat__value--good">{formatBillingMoney(summary.paymentsTotal, currency)}</strong>
            <span className="finance-stat__meta">{summary.paymentCount} payments logged</span>
          </div>
        </Link>
        <div className="finance-stat finance-stat--progress">
          <span className="finance-stat__icon finance-stat__icon--purple"><FiBarChart2 size={18} /></span>
          <div className="finance-stat__progress-body">
            <span className="finance-stat__label">Invoices this month</span>
            <strong className="finance-stat__value">{summary.invoiceCount}</strong>
            <span className="finance-stat__meta">{summary.paidInvoiceCount} paid · view on Invoices &amp; payments</span>
          </div>
        </div>
      </div>

      {!!error && <div className="finance-alert finance-alert--error" role="alert">{error}</div>}
      {!!success && <div className="finance-alert finance-alert--success" role="status">{success}</div>}

      <div className="finance-layout finance-layout--single">
        <section className="finance-main">
          <motion.div
            className="finance-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="finance-panel__head">
              <div>
                <h2 className="finance-panel__title">All patient billing</h2>
                <p className="finance-panel__desc">
                  Billing loaded per patient for {formatBillingMonthLabel(billingMonth)}.
                </p>
              </div>
              <div className="finance-panel__tools">
                <label className="finance-month-field">
                  <span className="finance-month-field__label">Month</span>
                  <input
                    type="month"
                    className="finance-month-field__input"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    aria-label="Billing month"
                  />
                </label>
                <div className="finance-search">
                  <FiSearch className="finance-search__icon" size={15} aria-hidden />
                  <input
                    type="text"
                    className="finance-search__input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients, rates, or notes…"
                    aria-label="Search billing"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="finance-search__clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <FiX size={14} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="finance-loading">
                <span className="finance-loading__spinner" aria-hidden />
                Loading billing data…
              </div>
            ) : filteredBilling.length === 0 ? (
              <div className="finance-empty">
                <div className="finance-empty__icon"><FiCreditCard size={26} /></div>
                <h3>{query ? 'No billing matches your search' : 'No patient billing records'}</h3>
                <p>
                  {query
                    ? 'Try a different patient name or note.'
                    : `No billing found for ${formatBillingMonthLabel(billingMonth)}. Add rates on patient profiles or try another month.`}
                </p>
                {!query && (
                  <Link to="/patients" className="finance-btn finance-btn--primary">Go to patients</Link>
                )}
              </div>
            ) : (
              <div className="finance-table-wrap">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Rate</th>
                      <th>Frequency</th>
                      <th>Note</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBilling.map((row) => (
                      <tr key={`${row.patientId}-${row.id}`}>
                        <td>
                          <div className="finance-patient-cell">
                            <span className="finance-avatar">{patientInitial(row.patientName)}</span>
                            <Link to={`/patients/${encodeURIComponent(row.patientId)}`} className="finance-link">
                              {row.patientName}
                            </Link>
                          </div>
                        </td>
                        <td className="finance-table__amount">{formatBillingMoney(row.rate, row.currency || currency)}</td>
                        <td><span className="finance-pill">{row.frequencyLabel || row.frequency}</span></td>
                        <td className="finance-table__note">{row.note || '—'}</td>
                        <td>{row.displayDate || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="finance-btn finance-btn--small finance-btn--accent"
                            onClick={() => openCreateInvoice(row)}
                          >
                            <FiFileText size={13} aria-hidden />
                            Create invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredBilling.length > 0 && (
              <footer className="finance-panel__foot">
                Showing {filteredBilling.length} billing record{filteredBilling.length === 1 ? '' : 's'}
              </footer>
            )}
          </motion.div>
        </section>
      </div>

      {createInvoiceTarget && (
        <motion.div
          className="finance-modal-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => !saving && closeInvoiceModal()}
        >
          <motion.div
            className="finance-modal finance-modal--invoice-create"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-invoice-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="finance-invoice-create__banner">
              <div className="finance-invoice-create__banner-main">
                <div className="finance-invoice-create__icon" aria-hidden>
                  <FiFileText size={22} />
                </div>
                <div className="finance-invoice-create__banner-text">
                  <span className="finance-invoice-create__kicker">New invoice</span>
                  <h3 id="finance-invoice-modal-title">Create invoice</h3>
                  <p>Turn this patient&apos;s billing rate into a shareable invoice.</p>
                </div>
              </div>
              <button
                type="button"
                className="finance-modal__close"
                onClick={closeInvoiceModal}
                disabled={saving}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </header>

            <div className="finance-modal__body finance-invoice-create__body">
              <div className="finance-invoice-create__patient">
                <span className="finance-avatar finance-avatar--lg">
                  {patientInitial(createInvoiceTarget.patientName)}
                </span>
                <div className="finance-invoice-create__patient-text">
                  <span className="finance-invoice-create__patient-label">Bill to</span>
                  <strong>{createInvoiceTarget.patientName}</strong>
                  {createInvoiceTarget.patientId && (
                    <Link
                      to={`/patients/${encodeURIComponent(createInvoiceTarget.patientId)}`}
                      className="finance-invoice-create__profile-link"
                      onClick={closeInvoiceModal}
                    >
                      View patient profile
                    </Link>
                  )}
                </div>
              </div>

              <div className="finance-invoice-create__amount-card">
                <div className="finance-invoice-create__amount-top">
                  <span className="finance-invoice-create__amount-label">Estimated total</span>
                  <span className="finance-pill finance-pill--soft">
                    {formatBillingMonthLabel(billingMonth)}
                  </span>
                </div>
                <strong className="finance-invoice-create__amount-value">
                  {formatBillingMoney(invoicePreviewTotal, createInvoiceTarget.currency || currency)}
                </strong>
                <p className="finance-invoice-create__amount-note">
                  Rate × times, with tax and discount applied.
                </p>
              </div>

              <div className="finance-invoice-create__fields">
                <div className="finance-invoice-create__field">
                  <label htmlFor="finance-invoice-rate">Rate</label>
                  <input
                    id="finance-invoice-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    className="finance-input"
                    value={invoiceForm.rate}
                    onChange={(e) => updateInvoiceForm({ rate: e.target.value })}
                  />
                </div>
                <div className="finance-invoice-create__field">
                  <label htmlFor="finance-invoice-times">Number of times</label>
                  <input
                    id="finance-invoice-times"
                    type="number"
                    min="1"
                    step="1"
                    className="finance-input"
                    value={invoiceForm.numberOfTime}
                    onChange={(e) => updateInvoiceForm({ numberOfTime: e.target.value })}
                  />
                </div>
                <div className="finance-invoice-create__field">
                  <label htmlFor="finance-invoice-tax">Tax (%)</label>
                  <input
                    id="finance-invoice-tax"
                    type="number"
                    min="0"
                    step="0.01"
                    className="finance-input"
                    value={invoiceForm.taxPercentage}
                    onChange={(e) => updateInvoiceForm({ taxPercentage: e.target.value })}
                  />
                </div>
                <div className="finance-invoice-create__field">
                  <label htmlFor="finance-invoice-discount">Discount (%)</label>
                  <input
                    id="finance-invoice-discount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="finance-input"
                    value={invoiceForm.discountPercentage}
                    onChange={(e) => updateInvoiceForm({ discountPercentage: e.target.value })}
                  />
                </div>
                <div className="finance-invoice-create__field">
                  <label htmlFor="finance-invoice-status">Status</label>
                  <select
                    id="finance-invoice-status"
                    className="finance-input"
                    value={invoiceForm.status}
                    onChange={(e) => updateInvoiceForm({ status: e.target.value })}
                  >
                    {INVOICE_CREATE_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="finance-invoice-create__field finance-invoice-create__field--checkbox">
                  <label htmlFor="finance-invoice-paid" className="finance-invoice-create__checkbox">
                    <input
                      id="finance-invoice-paid"
                      type="checkbox"
                      checked={invoiceForm.paid}
                      onChange={(e) => updateInvoiceForm({ paid: e.target.checked })}
                    />
                    Mark as paid
                  </label>
                </div>
              </div>

              <div className="finance-invoice-create__meta">
                <div className="finance-invoice-create__meta-item">
                  <span>Month</span>
                  <strong>{billingMonth}</strong>
                </div>
                <div className="finance-invoice-create__meta-item">
                  <span>Year</span>
                  <strong>{billingMonth.split('-')[0]}</strong>
                </div>
              </div>

              <div className="finance-invoice-create__callout" role="note">
                <FiCheckCircle size={16} aria-hidden />
                <p>
                  After creation you&apos;ll be taken to <strong>Invoices &amp; payments</strong> to share, print, or record payment.
                </p>
              </div>
            </div>

            <footer className="finance-modal__footer finance-invoice-create__footer">
              <button type="button" className="finance-btn finance-btn--ghost" onClick={closeInvoiceModal} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className="finance-btn finance-btn--primary finance-invoice-create__submit"
                onClick={handleCreateInvoice}
                disabled={saving}
              >
                <FiFileText size={15} aria-hidden />
                {saving ? 'Creating…' : 'Create invoice'}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
