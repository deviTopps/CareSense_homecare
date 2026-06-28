import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiPlus,
  FiX,
  FiFileText,
  FiPrinter,
  FiRefreshCw,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiBarChart2,
  FiUser,
  FiMail,
  FiMessageCircle,
  FiEdit2,
  FiTrash2,
  FiDownload,
} from '../icons/hugeicons-feather';
import { getUser } from '../api';
import { BRAND_LOGO_SRC } from '../constants/brandAssets';
import { extractAgencyLogoUrl, extractAgencyAddress, extractAgencyContact } from '../utils/medicalReportTemplate';
import { downloadInvoicePdf, openInvoicePrintWindow } from '../utils/invoicePdf';
import InvoiceDocument from '../components/InvoiceDocument';
import { fetchAllPatientBillingRecords, formatBillingMoney } from '../utils/patientBilling';
import {
  buildEmptyPaymentForm,
  currentBillingMonth,
  formatBillingMonthLabel,
  formatShortDate,
  getCurrencyPrefix,
  invoicePaidProgress,
  invoiceRowStatusModifier,
  patientInitial,
  sanitizeAmountInput,
  statusLabel,
  isInvoiceOverdue,
  EMPTY_INVOICE_FORM,
} from '../utils/financeUiHelpers';
import {
  PAYMENT_METHODS,
  INVOICE_CREATE_STATUSES,
  buildInvoiceShareText,
  buildInvoiceEmailShareUrl,
  buildInvoiceWhatsAppShareUrl,
  breakdownInvoiceAmounts,
  computeInvoiceAmount,
  updateFinanceInvoice,
  deleteFinanceInvoice,
  formatInvoiceMonthLabel,
  loadFinanceInvoicesWithApi,
  loadFinancePayments,
  loadFinancePaymentsWithApi,
  recordPatientPaymentViaApi,
  summarizeFinance,
} from '../utils/finance';
import './Finance.css';

const TABS = [
  { id: 'invoices', label: 'Invoices', icon: FiFileText },
  { id: 'payments', label: 'Payments', icon: FiCheckCircle },
];

export default function InvoicesPayments() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useMemo(() => getUser(), []);
  const agencyName = user?.agency?.name || user?.agencyName || 'CareSense';
  const agencyLogoUrl = useMemo(() => extractAgencyLogoUrl(user) || BRAND_LOGO_SRC, [user]);
  const agencyAddress = useMemo(() => extractAgencyAddress(user), [user]);
  const agencyContact = useMemo(() => extractAgencyContact(user), [user]);
  const currentUserId = useMemo(
    () => String(user?.id || user?._id || user?.userId || '').trim(),
    [user],
  );
  const currentUserName = useMemo(() => {
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    return full || user?.name || user?.email || 'Current user';
  }, [user]);
  const printRef = useRef(null);

  const initialTab = searchParams.get('tab') === 'payments' ? 'payments' : 'invoices';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [billingMonth, setBillingMonth] = useState(currentBillingMonth);

  const [billingRecords, setBillingRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState(() => loadFinancePayments());

  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [editInvoiceTarget, setEditInvoiceTarget] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE_FORM);
  const [shareInvoice, setShareInvoice] = useState(null);
  const [shareContact, setShareContact] = useState({ email: '', phone: '' });
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentChoiceTarget, setPaymentChoiceTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState(() => buildEmptyPaymentForm());
  const [saving, setSaving] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState('');
  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState(null);
  const [deleteInvoiceError, setDeleteInvoiceError] = useState('');
  const [invoiceLogoFailed, setInvoiceLogoFailed] = useState(false);

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
      setError(err?.message || 'Unable to load finance data.');
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
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    if (shareInvoice) setInvoiceLogoFailed(false);
  }, [shareInvoice]);

  useEffect(() => {
    const tab = searchParams.get('tab') === 'payments' ? 'payments' : 'invoices';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const shareFromNav = location.state?.shareInvoice;
    if (shareFromNav?.id) {
      setShareInvoice(shareFromNav);
      setSuccess(`Invoice ${shareFromNav.invoiceNumber || ''} ready to share.`);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if ((!editInvoiceTarget) || saving) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setEditInvoiceTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editInvoiceTarget, saving]);

  const summary = useMemo(
    () => summarizeFinance({ billingRecords, invoices, payments }),
    [billingRecords, invoices, payments],
  );

  const currency = billingRecords[0]?.currency || invoices[0]?.currency || 'GHS';

  const unpaidInvoices = useMemo(
    () => invoices.filter((row) => row.status !== 'paid'),
    [invoices],
  );

  const overdueInvoices = useMemo(
    () => unpaidInvoices.filter(isInvoiceOverdue),
    [unpaidInvoices],
  );

  const recentPayments = useMemo(() => payments.slice(0, 5), [payments]);

  const query = searchQuery.trim().toLowerCase();

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (invoiceFilter === 'unpaid') list = list.filter((row) => row.status !== 'paid');
    if (invoiceFilter === 'paid') list = list.filter((row) => row.status === 'paid');
    if (invoiceFilter === 'overdue') list = list.filter(isInvoiceOverdue);
    if (!query) return list;
    return list.filter((row) => [
      row.invoiceNumber,
      row.patientName,
      row.note,
    ].some((v) => String(v || '').toLowerCase().includes(query)));
  }, [invoices, invoiceFilter, query]);

  const filteredPayments = useMemo(() => {
    if (!query) return payments;
    return payments.filter((row) => [
      row.patientName,
      row.invoiceNumber,
      row.reference,
      row.note,
      row.methodLabel,
    ].some((v) => String(v || '').toLowerCase().includes(query)));
  }, [payments, query]);

  const tabCounts = useMemo(() => ({
    invoices: invoices.length,
    payments: payments.length,
  }), [invoices.length, payments.length]);

  const paymentPatientOptions = useMemo(() => {
    const map = new Map();
    billingRecords.forEach((row) => {
      if (row.patientId) map.set(row.patientId, row.patientName || 'Patient');
    });
    invoices.forEach((row) => {
      if (row.patientId) map.set(row.patientId, row.patientName || 'Patient');
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [billingRecords, invoices]);

  const paymentModalPatientName = useMemo(() => {
    if (paymentModal?.type === 'invoice') return paymentModal.invoice.patientName;
    return paymentPatientOptions.find((row) => row.id === paymentForm.patientId)?.name || '';
  }, [paymentForm.patientId, paymentModal, paymentPatientOptions]);

  const paymentFormYear = useMemo(() => {
    const monthParam = String(paymentForm.month || '').trim();
    return monthParam.split('-')[0] || String(new Date().getFullYear());
  }, [paymentForm.month]);

  const paymentCurrency = paymentModal?.type === 'invoice'
    ? paymentModal.invoice.currency || currency
    : currency;

  const paymentCurrencyPrefix = useMemo(
    () => getCurrencyPrefix(paymentCurrency),
    [paymentCurrency],
  );

  const invoicePreviewTotal = useMemo(
    () => computeInvoiceAmount({
      rate: invoiceForm.rate,
      numberOfTime: invoiceForm.numberOfTime,
      taxPercentage: invoiceForm.taxPercentage,
      discountPercentage: invoiceForm.discountPercentage,
    }),
    [invoiceForm.discountPercentage, invoiceForm.numberOfTime, invoiceForm.rate, invoiceForm.taxPercentage],
  );

  const shareInvoiceBreakdown = useMemo(
    () => (shareInvoice ? breakdownInvoiceAmounts(shareInvoice) : null),
    [shareInvoice],
  );

  const activeInvoiceMonth = editInvoiceTarget?.month || billingMonth;

  const closeInvoiceModal = () => {
    setEditInvoiceTarget(null);
    setInvoiceForm(EMPTY_INVOICE_FORM);
  };

  const openEditInvoice = (invoice) => {
    setEditInvoiceTarget(invoice);
    setInvoiceForm({
      rate: String(invoice?.rate ?? invoice?.amount ?? ''),
      numberOfTime: String(invoice?.numberOfTime ?? 1),
      taxPercentage: String(invoice?.taxPercentage ?? 0),
      discountPercentage: String(invoice?.discountPercentage ?? 0),
      status: invoice?.paid || invoice?.status === 'paid' || invoice?.invoiceStatus === 'paid'
        ? 'paid'
        : 'pending',
      paid: Boolean(invoice?.paid || invoice?.status === 'paid'),
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

  const openShareInvoice = (invoice) => {
    setShareInvoice(invoice);
    setShareContact({
      email: '',
      phone: '',
    });
  };

  const handleUpdateInvoice = async () => {
    if (!editInvoiceTarget) return;
    const invoiceNumber = editInvoiceTarget.invoiceNumber;
    setSaving(true);
    setError('');
    try {
      await updateFinanceInvoice(editInvoiceTarget, {
        month: activeInvoiceMonth,
        rate: invoiceForm.rate,
        numberOfTime: invoiceForm.numberOfTime,
        taxPercentage: invoiceForm.taxPercentage,
        discountPercentage: invoiceForm.discountPercentage,
        status: invoiceForm.status,
        paid: invoiceForm.paid,
      });
      const invoiceRows = await loadFinanceInvoicesWithApi({ month: billingMonth });
      setInvoices(invoiceRows);
      closeInvoiceModal();
      setSuccess(`Invoice ${invoiceNumber} updated.`);
    } catch (err) {
      setError(err?.message || 'Unable to update invoice.');
    } finally {
      setSaving(false);
    }
  };

  const openPaymentChoice = (invoice) => {
    if (!invoice?.id) return;
    setPaymentChoiceTarget(invoice);
  };

  const closePaymentChoice = () => {
    setPaymentChoiceTarget(null);
  };

  const openPaymentForInvoice = (invoice) => {
    setPaymentChoiceTarget(null);
    setPaymentModal({ type: 'invoice', invoice });
    setPaymentForm({
      patientId: invoice.patientId || '',
      amount: String(invoice.balance || invoice.amount || ''),
      paymentDate: new Date().toISOString().slice(0, 10),
      month: invoice.month || billingMonth,
      paymentMethod: 'bank_transfer',
      reference: '',
      note: '',
    });
  };

  const openManualPayment = (invoice = null) => {
    setPaymentChoiceTarget(null);
    setPaymentModal({ type: 'manual' });
    setPaymentForm({
      ...buildEmptyPaymentForm(invoice?.month || billingMonth),
      patientId: invoice?.patientId || '',
    });
  };

  const handleChoosePaymentByInvoice = () => {
    if (!paymentChoiceTarget) return;
    openPaymentForInvoice(paymentChoiceTarget);
  };

  const handleChooseManualPayment = () => {
    openManualPayment(paymentChoiceTarget || undefined);
  };

  const closePaymentModal = () => {
    if (saving) return;
    setPaymentModal(null);
  };

  const handleRecordPayment = async () => {
    setSaving(true);
    setError('');
    try {
      const invoice = paymentModal?.type === 'invoice' ? paymentModal.invoice : null;
      const patientId = invoice?.patientId || paymentForm.patientId;
      const patientName = invoice?.patientName
        || paymentPatientOptions.find((row) => row.id === patientId)?.name
        || 'Patient';

      await recordPatientPaymentViaApi({
        ...paymentForm,
        patientId,
        patientName,
        year: paymentFormYear,
        invoiceId: invoice?.id || '',
        invoiceNumber: invoice?.invoiceNumber || '',
      });

      const [invoiceRows, paymentRows] = await Promise.all([
        loadFinanceInvoicesWithApi({ month: billingMonth }),
        loadFinancePaymentsWithApi({ month: billingMonth }),
      ]);
      setInvoices(invoiceRows);
      setPayments(paymentRows);
      setPaymentModal(null);
      setSuccess(
        invoice
          ? `Payment recorded for ${invoice.invoiceNumber}.`
          : 'Payment recorded successfully.',
      );
      setActiveTab('payments');
      setSearchParams({ tab: 'payments' });
    } catch (err) {
      setError(err?.message || 'Unable to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareViaEmail = () => {
    if (!shareInvoice) return;
    const url = buildInvoiceEmailShareUrl(shareInvoice, {
      agencyName,
      recipientEmail: shareContact.email,
    });
    window.location.href = url;
    setSuccess(shareContact.email
      ? `Opening email to ${shareContact.email}…`
      : 'Opening your email app…');
  };

  const handleShareViaWhatsApp = () => {
    if (!shareInvoice) return;
    const url = buildInvoiceWhatsAppShareUrl(shareInvoice, {
      agencyName,
      phone: shareContact.phone,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
    setSuccess(shareContact.phone
      ? 'Opening WhatsApp with this invoice…'
      : 'Opening WhatsApp — choose a contact to share with.');
  };

  const handleCopyInvoice = async () => {
    if (!shareInvoice) return;
    const text = buildInvoiceShareText(shareInvoice, agencyName);
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Invoice copied to clipboard.');
    } catch {
      setError('Could not copy invoice. Use Print instead.');
    }
  };

  const handlePrintInvoice = async () => {
    if (!printRef.current || !shareInvoice) return;
    try {
      await openInvoicePrintWindow(printRef.current, {
        title: shareInvoice.invoiceNumber || 'Invoice',
      });
    } catch (err) {
      setError(err?.message || 'Unable to open print view.');
    }
  };

  const closeDeleteInvoiceModal = () => {
    if (deletingInvoiceId) return;
    setDeleteInvoiceTarget(null);
    setDeleteInvoiceError('');
  };

  const openDeleteInvoiceModal = (invoice) => {
    if (!invoice?.id) return;
    setDeleteInvoiceError('');
    setDeleteInvoiceTarget(invoice);
  };

  const confirmDeleteInvoice = async () => {
    const invoice = deleteInvoiceTarget;
    if (!invoice?.id) return;

    const label = invoice.invoiceNumber || invoice.id;
    setDeletingInvoiceId(invoice.id);
    setDeleteInvoiceError('');
    setError('');
    try {
      await deleteFinanceInvoice(invoice);
      if (shareInvoice?.id === invoice.id) setShareInvoice(null);
      if (editInvoiceTarget?.id === invoice.id) closeInvoiceModal();
      const invoiceRows = await loadFinanceInvoicesWithApi({ month: billingMonth });
      setInvoices(invoiceRows);
      setSuccess(`Invoice ${label} deleted.`);
      setDeleteInvoiceTarget(null);
    } catch (err) {
      setDeleteInvoiceError(err?.message || 'Unable to delete invoice.');
    } finally {
      setDeletingInvoiceId('');
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (!printRef.current || !shareInvoice || pdfDownloading) return;
    setPdfDownloading(true);
    setError('');
    try {
      await downloadInvoicePdf(printRef.current, shareInvoice);
      setSuccess('Invoice PDF downloaded.');
    } catch (err) {
      setError(err?.message || 'Unable to generate invoice PDF.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'payments' ? { tab: 'payments' } : {});
  };

  const panelMeta = {
    invoices: {
      title: 'Invoices',
      desc: `Shareable invoices for ${formatBillingMonthLabel(billingMonth)}.`,
      count: filteredInvoices.length,
      searchPlaceholder: 'Search invoice #, patient, or note…',
    },
    payments: {
      title: 'Payment history',
      desc: `Payments recorded for ${formatBillingMonthLabel(billingMonth)}.`,
      count: filteredPayments.length,
      searchPlaceholder: 'Search patient, reference, or method…',
    },
  }[activeTab];

  return (
    <div className="page-wrapper finance-page">
      <header className="finance-hero">
        <div className="finance-hero__copy">
          <p className="finance-hero__eyebrow">Finance</p>
          <h1 className="finance-hero__title">Invoices & payments</h1>
          <p className="finance-hero__subtitle">
            Manage invoices, record payments, and track collections for {agencyName}.
          </p>
        </div>
        <div className="finance-hero__actions">
          <Link to="/finance" className="finance-btn finance-btn--ghost">
            <FiCreditCard size={15} aria-hidden />
            Patient billing
          </Link>
          <button type="button" className="finance-btn finance-btn--ghost" onClick={reloadFinanceData} disabled={loading}>
            <FiRefreshCw size={15} aria-hidden className={loading ? 'finance-spin' : undefined} />
            Refresh
          </button>
          <button type="button" className="finance-btn finance-btn--primary" onClick={() => openManualPayment()}>
            <FiPlus size={15} aria-hidden />
            Record payment
          </button>
        </div>
      </header>

      {!!error && <div className="finance-alert finance-alert--error" role="alert">{error}</div>}
      {!!success && <div className="finance-alert finance-alert--success" role="status">{success}</div>}

      <div className="finance-layout">
        <section className="finance-main">
          <div className="finance-tabs" role="tablist" aria-label="Finance sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`finance-tab${activeTab === tab.id ? ' is-active' : ''}`}
                  onClick={() => switchTab(tab.id)}
                >
                  <Icon size={15} aria-hidden />
                  {tab.label}
                  <span className="finance-tab__count">{tabCounts[tab.id]}</span>
                </button>
              );
            })}
          </div>

          <motion.div
            key={activeTab}
            className="finance-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="finance-panel__head">
              <div>
                <h2 className="finance-panel__title">{panelMeta.title}</h2>
                <p className="finance-panel__desc">{panelMeta.desc}</p>
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
                    placeholder={panelMeta.searchPlaceholder}
                    aria-label={panelMeta.searchPlaceholder}
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
                {activeTab === 'invoices' && (
                  <div className="finance-filters">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'unpaid', label: 'Unpaid' },
                      { id: 'overdue', label: 'Overdue' },
                      { id: 'paid', label: 'Paid' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`finance-filter${invoiceFilter === filter.id ? ' is-active' : ''}`}
                        onClick={() => setInvoiceFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="finance-loading">
                <span className="finance-loading__spinner" aria-hidden />
                Loading invoices & payments…
              </div>
            ) : (
              <>
                {activeTab === 'invoices' && (
                  filteredInvoices.length === 0 ? (
                    <div className="finance-empty">
                      <div className="finance-empty__icon"><FiFileText size={26} /></div>
                      <h3>{query || invoiceFilter !== 'all' ? 'No invoices match your filters' : 'No invoices yet'}</h3>
                      <p>Create an invoice from a patient billing record on the Finance page.</p>
                      {!query && invoiceFilter === 'all' && (
                        <Link to="/finance" className="finance-btn finance-btn--primary">
                          Go to patient billing
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="finance-table-wrap">
                      <div className="finance-invoice-list">
                        <div className="finance-invoice-list__head" aria-hidden="true">
                          <span className="finance-invoice-list__col finance-invoice-list__col--invoice">Invoice</span>
                          <span className="finance-invoice-list__col finance-invoice-list__col--patient">Patient</span>
                          <span className="finance-invoice-list__col finance-invoice-list__col--total">Total</span>
                          <span className="finance-invoice-list__col finance-invoice-list__col--balance">Balance</span>
                          <span className="finance-invoice-list__col finance-invoice-list__col--status">Status</span>
                          <span className="finance-invoice-list__col finance-invoice-list__col--period">Period</span>
                          <span className="finance-invoice-list__col finance-invoice-list__col--actions">Actions</span>
                        </div>
                      <ul className="finance-invoice-list__body">
                        {filteredInvoices.map((row) => {
                          const statusMod = invoiceRowStatusModifier(row);
                          const paidPct = invoicePaidProgress(row);
                          const hasTax = Number(row.taxPercentage) > 0;
                          const hasDiscount = Number(row.discountPercentage) > 0;

                          return (
                            <li
                              key={row.id}
                              className={`finance-invoice-row finance-invoice-row--${statusMod}`}
                            >
                              <div className="finance-invoice-row__invoice finance-invoice-list__col finance-invoice-list__col--invoice">
                                <span className="finance-invoice-row__doc-icon" aria-hidden="true">
                                  <FiFileText size={16} />
                                </span>
                                <div className="finance-invoice-row__invoice-text">
                                  <strong>{row.invoiceNumber}</strong>
                                  <span>Issued {formatShortDate(row.issueDate)}</span>
                                </div>
                              </div>

                              <div className="finance-invoice-row__patient finance-invoice-list__col finance-invoice-list__col--patient">
                                <span className="finance-avatar">{patientInitial(row.patientName)}</span>
                                {row.patientId ? (
                                  <Link
                                    to={`/patients/${encodeURIComponent(row.patientId)}`}
                                    className="finance-link finance-invoice-row__patient-name"
                                  >
                                    {row.patientName}
                                  </Link>
                                ) : (
                                  <span className="finance-invoice-row__patient-name">{row.patientName}</span>
                                )}
                              </div>

                              <div className="finance-invoice-row__amount finance-invoice-list__col finance-invoice-list__col--total">
                                <strong>{formatBillingMoney(row.amount, row.currency)}</strong>
                                <span>
                                  {formatBillingMoney(row.rate, row.currency)}
                                  {' × '}
                                  {row.numberOfTime || 1}
                                </span>
                                {(hasTax || hasDiscount) && (
                                  <div className="finance-invoice-row__tags">
                                    {hasDiscount && (
                                      <span className="finance-invoice-row__tag finance-invoice-row__tag--discount">
                                        −{row.discountPercentage}%
                                      </span>
                                    )}
                                    {hasTax && (
                                      <span className="finance-invoice-row__tag finance-invoice-row__tag--tax">
                                        +{row.taxPercentage}% tax
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="finance-invoice-row__balance finance-invoice-list__col finance-invoice-list__col--balance">
                                <strong className={row.balance > 0 ? 'finance-invoice-row__balance-due' : 'finance-invoice-row__balance-clear'}>
                                  {formatBillingMoney(row.balance, row.currency)}
                                </strong>
                                <div
                                  className="finance-invoice-row__progress"
                                  role="progressbar"
                                  aria-valuenow={paidPct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`${paidPct}% paid`}
                                >
                                  <span style={{ width: `${paidPct}%` }} />
                                </div>
                                <span className="finance-invoice-row__paid-note">
                                  {formatBillingMoney(row.amountPaid, row.currency)} paid
                                </span>
                              </div>

                              <div className="finance-invoice-row__status finance-invoice-list__col finance-invoice-list__col--status">
                                <span className={`finance-invoice-status finance-invoice-status--${statusMod}`}>
                                  <span className="finance-invoice-status__dot" aria-hidden="true" />
                                  {statusLabel(row.status)}
                                </span>
                              </div>

                              <div className="finance-invoice-row__period finance-invoice-list__col finance-invoice-list__col--period">
                                {row.month ? (
                                  <span className="finance-invoice-row__month" title={row.month}>
                                    {formatInvoiceMonthLabel(row.month)}
                                  </span>
                                ) : (
                                  <span className="finance-invoice-row__month finance-invoice-row__month--empty">—</span>
                                )}
                              </div>

                              <div className="finance-invoice-row__actions finance-invoice-list__col finance-invoice-list__col--actions">
                                <button
                                  type="button"
                                  className="finance-icon-btn"
                                  onClick={() => openShareInvoice(row)}
                                  aria-label={`Share invoice ${row.invoiceNumber}`}
                                  title="Share"
                                >
                                  <FiMail size={15} aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  className="finance-icon-btn"
                                  onClick={() => openEditInvoice(row)}
                                  aria-label={`Edit invoice ${row.invoiceNumber}`}
                                  title="Edit"
                                >
                                  <FiEdit2 size={15} aria-hidden />
                                </button>
                                {row.status !== 'paid' ? (
                                  <button
                                    type="button"
                                    className="finance-icon-btn finance-icon-btn--primary"
                                    onClick={() => openPaymentChoice(row)}
                                    aria-label={`Record payment for ${row.invoiceNumber}`}
                                    title="Record payment"
                                  >
                                    <FiCreditCard size={15} aria-hidden />
                                  </button>
                                ) : (
                                  <span className="finance-icon-btn finance-icon-btn--placeholder" aria-hidden="true" />
                                )}
                                <button
                                  type="button"
                                  className="finance-icon-btn finance-icon-btn--danger"
                                  onClick={() => openDeleteInvoiceModal(row)}
                                  disabled={deletingInvoiceId === row.id}
                                  aria-label={`Delete invoice ${row.invoiceNumber}`}
                                  title={deletingInvoiceId === row.id ? 'Deleting…' : 'Delete'}
                                >
                                  <FiTrash2 size={15} aria-hidden />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      </div>
                    </div>
                  )
                )}

                {activeTab === 'payments' && (
                  filteredPayments.length === 0 ? (
                    <div className="finance-empty">
                      <div className="finance-empty__icon"><FiCheckCircle size={26} /></div>
                      <h3>{query ? 'No payments match your search' : 'No payments recorded'}</h3>
                      <p>Record a payment against an invoice or log a manual receipt.</p>
                      <button type="button" className="finance-btn finance-btn--primary" onClick={() => openManualPayment()}>
                        Record payment
                      </button>
                    </div>
                  ) : (
                    <div className="finance-table-wrap">
                      <table className="finance-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Patient</th>
                            <th>Invoice</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((row) => (
                            <tr key={row.id}>
                              <td>{formatShortDate(row.paymentDate || row.recordedAt)}</td>
                              <td>{row.patientName}</td>
                              <td>{row.invoiceNumber || 'Manual'}</td>
                              <td className="finance-table__amount finance-table__amount--good">{formatBillingMoney(row.amount, row.currency)}</td>
                              <td><span className="finance-pill finance-pill--muted">{row.methodLabel}</span></td>
                              <td>{row.reference || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </>
            )}

            {!loading && panelMeta.count > 0 && (
              <footer className="finance-panel__foot">
                Showing {panelMeta.count} {activeTab === 'payments' ? 'payment' : 'invoice'}{panelMeta.count === 1 ? '' : 's'}
              </footer>
            )}
          </motion.div>
        </section>

        <aside className="finance-aside">
          <div className="finance-widget">
            <h3 className="finance-widget__title">Quick actions</h3>
            <div className="finance-quick-actions">
              <button type="button" className="finance-quick-action" onClick={() => openManualPayment()}>
                <FiPlus size={16} aria-hidden />
                Record payment
              </button>
              <button type="button" className="finance-quick-action" onClick={() => { switchTab('invoices'); setInvoiceFilter('unpaid'); }}>
                <FiAlertCircle size={16} aria-hidden />
                View unpaid ({summary.unpaidCount})
              </button>
              <Link to="/finance" className="finance-quick-action finance-quick-action--link">
                <FiCreditCard size={16} aria-hidden />
                Create invoice from billing
              </Link>
            </div>
          </div>

          <div className="finance-widget">
            <div className="finance-widget__head">
              <h3 className="finance-widget__title">Unpaid invoices</h3>
              {unpaidInvoices.length > 0 && (
                <button type="button" className="finance-link-btn" onClick={() => { switchTab('invoices'); setInvoiceFilter('unpaid'); }}>
                  View all
                </button>
              )}
            </div>
            {unpaidInvoices.length === 0 ? (
              <p className="finance-widget__empty">All invoices are paid up.</p>
            ) : (
              <ul className="finance-mini-list">
                {unpaidInvoices.slice(0, 5).map((row) => (
                  <li key={row.id} className="finance-mini-list__item">
                    <div>
                      <strong>{row.invoiceNumber}</strong>
                      <span>{row.patientName}</span>
                    </div>
                    <div className="finance-mini-list__meta">
                      <strong>{formatBillingMoney(row.balance, row.currency)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="finance-widget">
            <div className="finance-widget__head">
              <h3 className="finance-widget__title">Recent payments</h3>
              {payments.length > 0 && (
                <button type="button" className="finance-link-btn" onClick={() => switchTab('payments')}>
                  View all
                </button>
              )}
            </div>
            {recentPayments.length === 0 ? (
              <p className="finance-widget__empty">No payments recorded yet.</p>
            ) : (
              <ul className="finance-mini-list">
                {recentPayments.map((row) => (
                  <li key={row.id} className="finance-mini-list__item">
                    <div>
                      <strong>{row.patientName}</strong>
                      <span>{formatShortDate(row.recordedAt)} · {row.methodLabel}</span>
                    </div>
                    <strong className="finance-mini-list__amount">{formatBillingMoney(row.amount, row.currency)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="finance-widget finance-widget--tip">
            <FiBarChart2 size={18} aria-hidden />
            <div>
              <strong>Tip</strong>
              <p>Create invoices from patient billing, then share or record payment here.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* modals unchanged structure */}
      {editInvoiceTarget && (
        <motion.div
          className="finance-modal-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
                  <FiEdit2 size={22} />
                </div>
                <div className="finance-invoice-create__banner-text">
                  <span className="finance-invoice-create__kicker">Update invoice</span>
                  <h3 id="finance-invoice-modal-title">
                    Edit {editInvoiceTarget.invoiceNumber}
                  </h3>
                  <p>Update invoice details and save changes to the server.</p>
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
                  {patientInitial(editInvoiceTarget.patientName)}
                </span>
                <div className="finance-invoice-create__patient-text">
                  <span className="finance-invoice-create__patient-label">Bill to</span>
                  <strong>{editInvoiceTarget.patientName}</strong>
                  {editInvoiceTarget.patientId && (
                    <Link
                      to={`/patients/${encodeURIComponent(editInvoiceTarget.patientId)}`}
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
                    {formatBillingMonthLabel(activeInvoiceMonth)}
                  </span>
                </div>
                <strong className="finance-invoice-create__amount-value">
                  {formatBillingMoney(
                    invoicePreviewTotal,
                    editInvoiceTarget.currency || currency,
                  )}
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
                  <strong>{activeInvoiceMonth}</strong>
                </div>
                <div className="finance-invoice-create__meta-item">
                  <span>Year</span>
                  <strong>{activeInvoiceMonth.split('-')[0]}</strong>
                </div>
              </div>
            </div>

            <footer className="finance-modal__footer finance-invoice-create__footer">
              <button
                type="button"
                className="finance-btn finance-btn--ghost"
                onClick={closeInvoiceModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="finance-btn finance-btn--primary finance-invoice-create__submit"
                onClick={handleUpdateInvoice}
                disabled={saving}
              >
                <FiEdit2 size={15} aria-hidden />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}

      {paymentChoiceTarget && (
        <motion.div
          className="finance-modal-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePaymentChoice}
        >
          <motion.div
            className="finance-modal finance-modal--payment-choice"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-payment-choice-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="finance-payment-choice__head">
              <div>
                <span className="finance-payment-choice__kicker">Payment options</span>
                <h3 id="finance-payment-choice-title">How would you like to record this payment?</h3>
                <p>
                  Choose whether to apply the payment to{' '}
                  <strong>{paymentChoiceTarget.invoiceNumber}</strong> or enter it manually.
                </p>
              </div>
              <button
                type="button"
                className="finance-modal__close"
                onClick={closePaymentChoice}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </header>

            <div className="finance-modal__body finance-payment-choice__body">
              <div className="finance-payment-choice__invoice-chip">
                <FiFileText size={16} aria-hidden />
                <div>
                  <strong>{paymentChoiceTarget.invoiceNumber}</strong>
                  <span>
                    {paymentChoiceTarget.patientName}
                    {' · '}
                    Balance {formatBillingMoney(paymentChoiceTarget.balance, paymentChoiceTarget.currency)}
                  </span>
                </div>
              </div>

              <div className="finance-payment-choice__options">
                <button
                  type="button"
                  className="finance-payment-choice__option finance-payment-choice__option--invoice"
                  onClick={handleChoosePaymentByInvoice}
                >
                  <span className="finance-payment-choice__option-icon" aria-hidden>
                    <FiFileText size={20} />
                  </span>
                  <span className="finance-payment-choice__option-text">
                    <strong>Payment by invoice</strong>
                    <span>
                      Apply payment to this invoice and update the balance for{' '}
                      {paymentChoiceTarget.invoiceNumber}.
                    </span>
                  </span>
                  <span className="finance-payment-choice__option-action" aria-hidden>→</span>
                </button>

                <button
                  type="button"
                  className="finance-payment-choice__option finance-payment-choice__option--manual"
                  onClick={handleChooseManualPayment}
                >
                  <span className="finance-payment-choice__option-icon" aria-hidden>
                    <FiCreditCard size={20} />
                  </span>
                  <span className="finance-payment-choice__option-text">
                    <strong>Manual payment entry</strong>
                    <span>
                      Enter payment details manually with your own reference, date, and method.
                    </span>
                  </span>
                  <span className="finance-payment-choice__option-action" aria-hidden>→</span>
                </button>
              </div>
            </div>

            <footer className="finance-modal__footer finance-payment-choice__footer">
              <button type="button" className="finance-btn finance-btn--ghost" onClick={closePaymentChoice}>
                Cancel
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}

      {paymentModal && (
        <motion.div
          className="finance-modal-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePaymentModal}
        >
          <motion.div
            className="finance-modal finance-modal--payment-create"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-payment-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="finance-payment-create__banner">
              <div className="finance-payment-create__banner-main">
                <div className="finance-payment-create__icon" aria-hidden>
                  <FiCheckCircle size={22} />
                </div>
                <div className="finance-payment-create__banner-text">
                  <span className="finance-payment-create__kicker">Payment receipt</span>
                  <h3 id="finance-payment-title">
                    {paymentModal.type === 'invoice'
                      ? `Record payment — ${paymentModal.invoice.invoiceNumber}`
                      : 'Record payment'}
                  </h3>
                  <p>
                    {paymentModal.type === 'invoice'
                      ? 'Log a payment against this invoice and sync it to your finance records.'
                      : 'Record a patient payment for the selected billing period.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="finance-modal__close"
                onClick={closePaymentModal}
                disabled={saving}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </header>

            <div className="finance-modal__body finance-payment-create__body">
              {paymentModal.type === 'invoice' ? (
                <div className="finance-payment-create__summary">
                  <div className="finance-payment-create__summary-item">
                    <span>Patient</span>
                    <strong>{paymentModal.invoice.patientName}</strong>
                  </div>
                  <div className="finance-payment-create__summary-item">
                    <span>Invoice total</span>
                    <strong>{formatBillingMoney(paymentModal.invoice.amount, paymentModal.invoice.currency)}</strong>
                  </div>
                  <div className="finance-payment-create__summary-item finance-payment-create__summary-item--highlight">
                    <span>Balance due</span>
                    <strong>{formatBillingMoney(paymentModal.invoice.balance, paymentModal.invoice.currency)}</strong>
                  </div>
                </div>
              ) : (
                <div className="finance-payment-create__patient">
                  <span className="finance-avatar finance-avatar--lg">
                    {patientInitial(paymentModalPatientName || 'P')}
                  </span>
                  <div className="finance-payment-create__patient-text">
                    <span className="finance-payment-create__patient-label">Patient</span>
                    <select
                      id="finance-payment-patient"
                      className="finance-input finance-payment-create__patient-select"
                      value={paymentForm.patientId}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, patientId: e.target.value }))}
                    >
                      <option value="">Select patient</option>
                      {paymentPatientOptions.map((row) => (
                        <option key={row.id} value={row.id}>{row.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="finance-payment-create__amount-card">
                <label className="finance-payment-create__amount-label" htmlFor="finance-payment-amount">
                  Amount received
                </label>
                <div className="finance-payment-create__amount-field">
                  <span className="finance-payment-create__amount-prefix" aria-hidden="true">
                    {paymentCurrencyPrefix}
                  </span>
                  <input
                    id="finance-payment-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className="finance-payment-create__amount-input"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({
                      ...prev,
                      amount: sanitizeAmountInput(e.target.value),
                    }))}
                    placeholder="0.00"
                    aria-describedby="finance-payment-amount-hint"
                  />
                  <span className="finance-payment-create__amount-code">{paymentCurrency}</span>
                </div>
                <p id="finance-payment-amount-hint" className="finance-payment-create__amount-hint">
                  Enter the amount received from the patient or payer.
                </p>
                {paymentModal.type === 'invoice' && (
                  <button
                    type="button"
                    className="finance-payment-create__fill-balance"
                    onClick={() => setPaymentForm((prev) => ({
                      ...prev,
                      amount: sanitizeAmountInput(
                        String(paymentModal.invoice.balance || paymentModal.invoice.amount || ''),
                      ),
                    }))}
                  >
                    Use full balance ({formatBillingMoney(paymentModal.invoice.balance, paymentCurrency)})
                  </button>
                )}
              </div>

              <div className="finance-payment-create__fields">
                <div className="finance-payment-create__field">
                  <label className="finance-label" htmlFor="finance-payment-date">Payment date</label>
                  <input
                    id="finance-payment-date"
                    type="date"
                    className="finance-input"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                  />
                </div>
                <div className="finance-payment-create__field">
                  <label className="finance-label" htmlFor="finance-payment-month">Billing month</label>
                  <input
                    id="finance-payment-month"
                    type="month"
                    className="finance-input"
                    value={paymentForm.month}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, month: e.target.value }))}
                  />
                </div>
                <div className="finance-payment-create__field">
                  <label className="finance-label" htmlFor="finance-payment-method">Payment method</label>
                  <select
                    id="finance-payment-method"
                    className="finance-input"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
                <div className="finance-payment-create__field">
                  <label className="finance-label" htmlFor="finance-payment-reference">Reference</label>
                  <input
                    id="finance-payment-reference"
                    className="finance-input"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
                    placeholder="TXN-12345"
                  />
                </div>
                <div className="finance-payment-create__field finance-payment-create__field--full">
                  <label className="finance-label" htmlFor="finance-payment-note">Note</label>
                  <textarea
                    id="finance-payment-note"
                    className="finance-textarea"
                    rows={3}
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="June care payment"
                  />
                </div>
              </div>

              <div className="finance-payment-create__meta">
                <div className="finance-payment-create__meta-item">
                  <span>Recorded by</span>
                  <strong>{currentUserName}</strong>
                </div>
                <div className="finance-payment-create__meta-item">
                  <span>Billing year</span>
                  <strong>{paymentFormYear}</strong>
                </div>
                <div className="finance-payment-create__meta-item">
                  <span>Period</span>
                  <strong>{formatBillingMonthLabel(paymentForm.month)}</strong>
                </div>
              </div>

              {!currentUserId && (
                <div className="finance-payment-create__callout" role="alert">
                  Unable to identify the signed-in user. Sign in again before recording a payment.
                </div>
              )}
            </div>

            <footer className="finance-modal__footer finance-payment-create__footer">
              <button
                type="button"
                className="finance-btn finance-btn--ghost"
                onClick={closePaymentModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="finance-btn finance-btn--primary finance-payment-create__submit"
                onClick={handleRecordPayment}
                disabled={
                  saving
                  || !currentUserId
                  || !paymentForm.amount
                  || !paymentForm.month
                  || (paymentModal.type === 'manual' && !paymentForm.patientId)
                }
              >
                <FiCheckCircle size={15} aria-hidden />
                {saving ? 'Saving…' : 'Record payment'}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}

      {shareInvoice && (
        <div className="finance-modal-overlay" role="presentation" onClick={() => setShareInvoice(null)}>
          <div className="finance-modal finance-modal--wide" role="dialog" aria-modal="true" aria-labelledby="finance-share-title" onClick={(e) => e.stopPropagation()}>
            <div className="finance-modal__head">
              <h3 id="finance-share-title">Invoice ready to share</h3>
              <button type="button" className="finance-modal__close" onClick={() => setShareInvoice(null)} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <div className="finance-modal__body finance-modal__body--invoice">
              <InvoiceDocument
                ref={printRef}
                invoice={shareInvoice}
                breakdown={shareInvoiceBreakdown}
                agencyName={agencyName}
                agencyLogoUrl={agencyLogoUrl}
                showLogo={Boolean(agencyLogoUrl && !invoiceLogoFailed)}
                agencyAddress={agencyAddress}
                agencyPhone={agencyContact.phone}
                agencyEmail={agencyContact.email}
                onLogoError={() => setInvoiceLogoFailed(true)}
              />

              <div className="finance-share-options">
                <p className="finance-share-options__title">Share this invoice</p>
                <div className="finance-share-options__fields">
                  <div className="finance-share-options__field">
                    <label htmlFor="finance-share-email">Recipient email</label>
                    <input
                      id="finance-share-email"
                      type="email"
                      className="finance-input"
                      placeholder="family@example.com"
                      value={shareContact.email}
                      onChange={(e) => setShareContact((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="finance-share-options__field">
                    <label htmlFor="finance-share-phone">WhatsApp number</label>
                    <input
                      id="finance-share-phone"
                      type="tel"
                      className="finance-input"
                      placeholder="+233 XX XXX XXXX"
                      value={shareContact.phone}
                      onChange={(e) => setShareContact((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="finance-share-options__actions">
                  <button
                    type="button"
                    className="finance-btn finance-btn--share finance-btn--share-email"
                    onClick={handleShareViaEmail}
                  >
                    <FiMail size={15} aria-hidden />
                    Share via email
                  </button>
                  <button
                    type="button"
                    className="finance-btn finance-btn--share finance-btn--share-whatsapp"
                    onClick={handleShareViaWhatsApp}
                  >
                    <FiMessageCircle size={15} aria-hidden />
                    Share via WhatsApp
                  </button>
                </div>
              </div>
            </div>
            <div className="finance-modal__footer finance-modal__footer--share">
              <button type="button" className="finance-btn finance-btn--ghost" onClick={handleCopyInvoice}>
                Copy details
              </button>
              <button
                type="button"
                className="finance-btn finance-btn--ghost"
                onClick={handleDownloadInvoicePdf}
                disabled={pdfDownloading}
              >
                <FiDownload size={14} aria-hidden />
                {pdfDownloading ? 'Generating…' : 'Download PDF'}
              </button>
              <button type="button" className="finance-btn finance-btn--ghost" onClick={handlePrintInvoice}>
                <FiPrinter size={14} aria-hidden />
                Print
              </button>
              {shareInvoice.status !== 'paid' && (
                <button type="button" className="finance-btn finance-btn--primary" onClick={() => { openPaymentChoice(shareInvoice); setShareInvoice(null); }}>
                  Record payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteInvoiceTarget && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={closeDeleteInvoiceModal}
        >
          <div
            className="destructive-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="finance-delete-invoice-title"
            aria-describedby="finance-delete-invoice-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="finance-delete-invoice-title" className="destructive-confirm-dialog__title">
                Delete invoice?
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={Boolean(deletingInvoiceId)}
                onClick={closeDeleteInvoiceModal}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p id="finance-delete-invoice-desc" className="destructive-confirm-dialog__lead">
                This invoice will be permanently removed from your records. Any linked payment history
                for this invoice may no longer be accessible.
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> You will need to create a new
                  invoice if billing for this patient is required again.
                </div>
              </div>

              {deleteInvoiceError ? (
                <div className="destructive-confirm-dialog__banner-error" role="alert">
                  {deleteInvoiceError}
                </div>
              ) : null}

              <div className="destructive-confirm-dialog__card">
                <div
                  className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand"
                  aria-hidden
                >
                  <FiFileText size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">
                    {deleteInvoiceTarget.invoiceNumber}
                  </div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {deleteInvoiceTarget.patientName}
                    {' · '}
                    {formatBillingMoney(deleteInvoiceTarget.amount, deleteInvoiceTarget.currency)}
                    {deleteInvoiceTarget.month
                      ? ` · ${formatInvoiceMonthLabel(deleteInvoiceTarget.month)}`
                      : ''}
                    {' · '}
                    {statusLabel(deleteInvoiceTarget.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={Boolean(deletingInvoiceId)}
                onClick={closeDeleteInvoiceModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={Boolean(deletingInvoiceId)}
                onClick={confirmDeleteInvoice}
              >
                <FiTrash2 size={14} aria-hidden />
                {deletingInvoiceId ? 'Deleting…' : 'Delete invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
