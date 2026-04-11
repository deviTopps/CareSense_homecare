import { useState, useEffect } from 'react';
import { FiUsers, FiCheckCircle, FiDownload, FiCalendar, FiX, FiPlus, FiInfo, FiSmartphone, FiCreditCard } from 'react-icons/fi';
import { BsBank2 } from 'react-icons/bs';
import { apiFetch } from '../api';

const RATE_PER_PATIENT = 30; // ₵ per patient per month

const DURATION_OPTIONS = [
  { months: 6,  label: '6 months',  discount: 0 },
  { months: 9,  label: '9 months',  discount: 5 },
  { months: 12, label: '12 months', discount: 10 },
  { months: 18, label: '18 months', discount: 15 },
  { months: 24, label: '24 months', discount: 20 },
];

const PAYMENT_TYPES = [
  { key: 'bank', label: 'Bank Transfer',      desc: 'Pay directly from your bank account', Icon: BsBank2 },
  { key: 'momo', label: 'Mobile Money',        desc: 'MTN, Vodafone Cash, AirtelTigo',      Icon: FiSmartphone },
  { key: 'card', label: 'Debit / Credit Card', desc: 'Visa, Mastercard',                    Icon: FiCreditCard },
];

const INVOICES = [
  { id: 'INV-0043', date: '01 Mar 2026', patients: 14, months: 6,  amount: 2520 },
  { id: 'INV-0042', date: '01 Sep 2025', patients: 12, months: 6,  amount: 2160 },
  { id: 'INV-0041', date: '01 Mar 2025', patients: 10, months: 6,  amount: 1800 },
];

function fmt(n) { return `₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`; }

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Billing() {
  const [patientCount, setPatientCount]     = useState(null);
  const [loadingPx, setLoadingPx]           = useState(true);
  const [duration, setDuration]             = useState(DURATION_OPTIONS[0]);
  const [showPayModal, setShowPayModal]     = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAddBank, setShowAddBank]       = useState(false);
  const [bankForm, setBankForm]             = useState({ bankName: '', accountName: '', accountNumber: '', branch: '' });
  const [savedBank, setSavedBank]           = useState(null);

  useEffect(() => {
    apiFetch('/patients')
      .then(data => setPatientCount(Array.isArray(data) ? data.length : (data?.total ?? data?.count ?? 0)))
      .catch(() => setPatientCount(0))
      .finally(() => setLoadingPx(false));
  }, []);

  const count        = patientCount ?? 0;
  const monthlyBase  = count * RATE_PER_PATIENT;
  const subtotal     = monthlyBase * duration.months;
  const discountAmt  = Math.round(subtotal * duration.discount / 100);
  const total        = subtotal - discountAmt;
  const nextBilling  = addMonths(new Date(), duration.months);

  function handleSaveBank(e) {
    e.preventDefault();
    setSavedBank({ ...bankForm });
    setShowAddBank(false);
  }

  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h5 style={{ fontWeight: 800, color: 'var(--kh-text)', marginBottom: 2 }}>Billing & Subscription</h5>
        <p style={{ fontSize: 13, color: 'var(--kh-text-muted)', margin: 0 }}>Billing is calculated at <strong>₵{RATE_PER_PATIENT} per patient / month</strong> based on your active patient count.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">

          {/* ── Cost Breakdown ── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--kh-text)' }}>Cost Breakdown</span>
              {loadingPx && <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>Loading…</span>}
            </div>
            <div style={{ padding: '20px' }}>

              {/* Patient count badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 7 }}>
                <FiUsers size={18} style={{ color: 'var(--kh-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 1 }}>Active Patients This Month</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--kh-text)', lineHeight: 1 }}>
                    {loadingPx ? '—' : count}
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--kh-text-muted)', marginLeft: 8 }}>patients</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginBottom: 1 }}>Monthly Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--kh-text)' }}>{fmt(monthlyBase)}</div>
                </div>
              </div>

              {/* Duration selector */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 10 }}>Select Payment Duration</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.months}
                      onClick={() => setDuration(opt)}
                      style={{
                        padding: '8px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        border: `1.5px solid ${duration.months === opt.months ? 'var(--kh-primary)' : '#e5e7eb'}`,
                        background: duration.months === opt.months ? 'var(--kh-primary)' : '#fff',
                        color: duration.months === opt.months ? '#fff' : 'var(--kh-text)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FiInfo size={11} /> Paying for 9+ months unlocks a discount on the total.
                </div>
              </div>

              {/* Line items */}
              <div style={{ border: '1px solid #f3f4f6', borderRadius: 7, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { label: 'Patients', value: `${count}` },
                  { label: 'Rate per patient / month', value: fmt(RATE_PER_PATIENT) },
                  { label: `Monthly cost  (${count} × ₵${RATE_PER_PATIENT})`, value: fmt(monthlyBase) },
                  { label: `Duration`, value: `${duration.months} months` },
                  { label: `Subtotal  (${fmt(monthlyBase)} × ${duration.months})`, value: fmt(subtotal) },
                ].map(({ label, value }, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <span style={{ fontSize: 13, color: 'var(--kh-text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{value}</span>
                  </div>
                ))}

                {/* Discount row — only shown when applicable */}
                {duration.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#f8f9fa' }}>
                    <span style={{ fontSize: 13, color: 'var(--kh-text-muted)' }}>Discount ({duration.discount}% for {duration.label})</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-primary)' }}>− {fmt(discountAmt)}</span>
                  </div>
                )}

                {/* Total row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '2px solid var(--kh-primary)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Total Due</div>
                    <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FiCalendar size={10} /> Covers until {nextBilling}
                    </div>
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--kh-text)' }}>{fmt(total)}</span>
                </div>
              </div>

              {/* Pay now */}
              <button
                onClick={() => setShowPayModal(true)}
                style={{ padding: '7px 18px', background: 'var(--kh-primary)', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.3px', display: 'inline-flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--kh-primary-dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--kh-primary)'}
              >
                Pay {fmt(total)} for {duration.label}
              </button>
            </div>
          </div>

          {/* ── Billing History ── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--kh-text)' }}>Billing History</span>
              <button style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiDownload size={12} /> Export All
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Invoice', 'Date', 'Patients', 'Duration', 'Amount', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', borderBottom: '1px solid #f3f4f6', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVOICES.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{inv.id}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--kh-text-muted)' }}>{inv.date}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--kh-text)' }}>{inv.patients}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--kh-text-muted)' }}>{inv.months} months</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{fmt(inv.amount)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#374151', padding: '3px 10px', borderRadius: 7 }}>Paid</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiDownload size={12} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-4">
          {/* ── Payment Method ── */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--kh-text)' }}>Payment Method</span>
            </div>
            <div style={{ padding: '16px' }}>
              {savedBank && (
                <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 7, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🏦</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{savedBank.bankName}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--kh-primary)', color: '#fff', padding: '2px 8px', borderRadius: 7 }}>ACTIVE</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>{savedBank.accountName}</span>
                    <span style={{ fontWeight: 700, color: 'var(--kh-text)', letterSpacing: '1px' }}>•••• {savedBank.accountNumber.slice(-4)}</span>
                    {savedBank.branch && <span>Branch: {savedBank.branch}</span>}
                  </div>
                  <button onClick={() => setSavedBank(null)} style={{ marginTop: 10, background: 'none', border: 'none', fontSize: 11.5, fontWeight: 700, color: 'var(--kh-text-muted)', cursor: 'pointer', padding: 0 }}>Remove</button>
                </div>
              )}

              {!savedBank && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {PAYMENT_TYPES.map(pt => (
                    <button
                      key={pt.key}
                      onClick={() => setSelectedPayment(selectedPayment === pt.key ? null : pt.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                        border: `1.5px solid ${selectedPayment === pt.key ? 'var(--kh-primary)' : '#e5e7eb'}`,
                        borderRadius: 7, background: selectedPayment === pt.key ? '#f8f9fa' : '#fff',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      <pt.Icon size={18} style={{ flexShrink: 0, color: selectedPayment === pt.key ? 'var(--kh-primary)' : '#6b7280' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 1 }}>{pt.label}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>{pt.desc}</div>
                      </div>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${selectedPayment === pt.key ? 'var(--kh-primary)' : '#d1d5db'}`, background: selectedPayment === pt.key ? 'var(--kh-primary)' : '#fff', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}

              {selectedPayment === 'bank' && !savedBank && (
                <button onClick={() => setShowAddBank(true)} style={{ width: '100%', padding: '9px', background: 'var(--kh-primary)', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--kh-primary-dark)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--kh-primary)'}>
                  <FiPlus size={13} /> Add Bank Account
                </button>
              )}
              {(selectedPayment === 'momo' || selectedPayment === 'card') && (
                <button style={{ width: '100%', padding: '9px', background: 'var(--kh-primary)', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--kh-primary-dark)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--kh-primary)'}>
                  <FiPlus size={13} /> Add {selectedPayment === 'momo' ? 'Mobile Money' : 'Card'}
                </button>
              )}
              {savedBank && (
                <button onClick={() => setSavedBank(null)} style={{ width: '100%', padding: '9px', background: '#f3f4f6', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)', cursor: 'pointer' }}>
                  Change Payment Method
                </button>
              )}
            </div>
          </div>

          {/* ── Pricing Info ── */}
          <div style={{ background: 'var(--kh-primary)', border: 'none', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#fff' }}>Pricing Summary</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 16 }}>
                Your monthly cost is calculated as:<br />
                <strong style={{ color: '#fff' }}>Patients × ₵{RATE_PER_PATIENT}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DURATION_OPTIONS.map(opt => (
                  <div key={opt.months} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ color: 'rgba(255,255,255,0.75)' }}>{opt.label}</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>
                      {fmt(Math.round(count * RATE_PER_PATIENT * opt.months * (1 - opt.discount / 100)))}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                Patient count is checked at the start of each billing period. Adding patients mid-cycle affects your next invoice.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pay Now Modal ── */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 7, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--kh-text)' }}>Confirm Payment</span>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '24px 20px' }}>
              {/* Summary lines */}
              {[
                ['Active Patients', `${count}`],
                ['Rate', `₵${RATE_PER_PATIENT} / patient / month`],
                ['Monthly Cost', fmt(monthlyBase)],
                ['Duration', duration.label],
                ['Subtotal', fmt(subtotal)],
                ...(duration.discount > 0 ? [[`Discount (${duration.discount}%)`, `− ${fmt(discountAmt)}`]] : []),
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--kh-text-muted)', marginBottom: 8 }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--kh-text)' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid var(--kh-primary)', marginTop: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--kh-text)' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--kh-text)' }}>{fmt(total)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCalendar size={12} /> Covers {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — {nextBilling}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowPayModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Back</button>
                <button style={{ background: 'var(--kh-primary)', border: 'none', borderRadius: 7, padding: '9px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--kh-primary-dark)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--kh-primary)'}>
                  Confirm & Pay {fmt(total)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Bank Account Modal ── */}
      {showAddBank && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 7, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--kh-text)' }}>Add Bank Account</span>
              <button onClick={() => setShowAddBank(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiX size={18} /></button>
            </div>
            <form onSubmit={handleSaveBank} style={{ padding: '24px 20px' }}>
              {[
                { field: 'bankName',      label: 'Bank Name',          placeholder: 'e.g. GCB Bank, Ecobank' },
                { field: 'accountName',   label: 'Account Name',       placeholder: 'Full name on account' },
                { field: 'accountNumber', label: 'Account Number',     placeholder: 'Enter account number' },
                { field: 'branch',        label: 'Branch (optional)',   placeholder: 'e.g. Accra Main' },
              ].map(({ field, label, placeholder }) => (
                <div key={field} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                  <input
                    type="text"
                    value={bankForm[field]}
                    onChange={e => setBankForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    required={field !== 'branch'}
                    style={{ width: '100%', border: 'none', borderBottom: '2px solid #e5e7eb', padding: '8px 0', fontSize: 13.5, background: 'transparent', outline: 'none', color: 'var(--kh-text)' }}
                    onFocus={e => e.target.style.borderBottomColor = 'var(--kh-primary)'}
                    onBlur={e => e.target.style.borderBottomColor = '#e5e7eb'}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddBank(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: 'var(--kh-primary)', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
