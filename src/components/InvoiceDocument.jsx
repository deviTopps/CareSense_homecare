import { forwardRef } from 'react';
import { formatBillingMoney } from '../utils/patientBilling';
import { formatInvoiceMonthLabel } from '../utils/finance';
import { INVOICE_DOCUMENT_CSS } from '../utils/invoiceDocumentStyles';

function statusClass(status) {
  if (status === 'paid') return 'invoice-doc__status--paid';
  if (status === 'partial') return 'invoice-doc__status--partial';
  return 'invoice-doc__status--unpaid';
}

function statusLabel(status) {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  return 'Unpaid';
}

function formatDisplayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const InvoiceDocument = forwardRef(function InvoiceDocument(
  {
    invoice,
    breakdown,
    agencyName = 'CareSense',
    agencyLogoUrl = '',
    showLogo = true,
    agencyAddress = '',
    agencyPhone = '',
    agencyEmail = '',
    onLogoError,
  },
  ref,
) {
  if (!invoice) return null;

  const currency = invoice.currency || 'GHS';
  const subtotal = breakdown?.subtotal ?? invoice.amount ?? 0;
  const discountPct = breakdown?.discountPercentage ?? 0;
  const discountAmount = breakdown?.discountAmount ?? 0;
  const taxPct = breakdown?.taxPercentage ?? 0;
  const taxAmount = breakdown?.taxAmount ?? 0;
  const total = breakdown?.total ?? invoice.amount ?? 0;
  const qty = breakdown?.numberOfTime ?? invoice.numberOfTime ?? 1;
  const rate = breakdown?.rate ?? invoice.rate ?? 0;

  const contactLines = [agencyAddress, agencyPhone, agencyEmail].filter(Boolean);

  return (
    <article className="invoice-doc" ref={ref}>
      <style>{INVOICE_DOCUMENT_CSS}</style>
      <div className="invoice-doc__accent-bar" aria-hidden />

      <div className="invoice-doc__body">
        <header className="invoice-doc__masthead">
          <div className="invoice-doc__brand">
            {showLogo && agencyLogoUrl ? (
              <img
                src={agencyLogoUrl}
                alt=""
                className="invoice-doc__logo"
                crossOrigin="anonymous"
                onError={onLogoError}
              />
            ) : null}
            <div>
              <h1 className="invoice-doc__company-name">{agencyName}</h1>
              {contactLines.length > 0 && (
                <p className="invoice-doc__company-meta">
                  {contactLines.map((line, index) => (
                    <span key={line}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          <div className="invoice-doc__title-block">
            <p className="invoice-doc__title">INVOICE</p>
            <p className="invoice-doc__number">{invoice.invoiceNumber}</p>
            <span className={`invoice-doc__status ${statusClass(invoice.status)}`}>
              {statusLabel(invoice.status)}
            </span>
          </div>
        </header>

        <div className="invoice-doc__parties">
          <section>
            <p className="invoice-doc__section-label">Bill to</p>
            <p className="invoice-doc__party-name">{invoice.patientName}</p>
            <p className="invoice-doc__party-detail">Home care patient</p>
          </section>

          <section>
            <p className="invoice-doc__section-label">Invoice details</p>
            <ul className="invoice-doc__details-list">
              <li>
                <span>Issue date</span>
                <strong>{formatDisplayDate(invoice.issueDate)}</strong>
              </li>
              <li>
                <span>Billing period</span>
                <strong>{invoice.month ? formatInvoiceMonthLabel(invoice.month) : '—'}</strong>
              </li>
              {invoice.dueDate ? (
                <li>
                  <span>Due date</span>
                  <strong>{formatDisplayDate(invoice.dueDate)}</strong>
                </li>
              ) : null}
              <li>
                <span>Currency</span>
                <strong>{currency}</strong>
              </li>
            </ul>
          </section>
        </div>

        <div className="invoice-doc__table-wrap">
          <table className="invoice-doc__table">
            <thead>
              <tr>
                <th style={{ width: '44%' }}>Description</th>
                <th style={{ width: '12%' }}>Qty</th>
                <th style={{ width: '22%' }}>Unit price</th>
                <th style={{ width: '22%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="invoice-doc__item-title">Home care services</span>
                  {invoice.note ? (
                    <span className="invoice-doc__item-note">{invoice.note}</span>
                  ) : null}
                </td>
                <td>{qty}</td>
                <td>{formatBillingMoney(rate, currency)}</td>
                <td>{formatBillingMoney(subtotal, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="invoice-doc__bottom">
          <div className="invoice-doc__notes">
            <p className="invoice-doc__notes-title">Payment information</p>
            <p className="invoice-doc__notes-text">
              Please reference invoice <strong>{invoice.invoiceNumber}</strong> with your payment.
              {agencyEmail ? (
                <>
                  {' '}
                  For billing enquiries, contact <strong>{agencyEmail}</strong>.
                </>
              ) : null}
            </p>
          </div>

          <div className="invoice-doc__summary">
            <div className="invoice-doc__summary-row">
              <span>Subtotal</span>
              <strong>{formatBillingMoney(subtotal, currency)}</strong>
            </div>
            <div className="invoice-doc__summary-row invoice-doc__summary-row--deduction">
              <span>Discount ({discountPct}%)</span>
              <strong>
                {discountAmount > 0
                  ? `-${formatBillingMoney(discountAmount, currency)}`
                  : formatBillingMoney(0, currency)}
              </strong>
            </div>
            <div className="invoice-doc__summary-row">
              <span>Tax ({taxPct}%)</span>
              <strong>{formatBillingMoney(taxAmount, currency)}</strong>
            </div>
            <div className="invoice-doc__summary-row invoice-doc__summary-row--total">
              <span>Total</span>
              <strong>{formatBillingMoney(total, currency)}</strong>
            </div>
            <div className="invoice-doc__summary-row">
              <span>Amount paid</span>
              <strong>{formatBillingMoney(invoice.amountPaid, currency)}</strong>
            </div>
            <div className="invoice-doc__summary-row invoice-doc__summary-row--balance">
              <span>Balance due</span>
              <strong>{formatBillingMoney(invoice.balance, currency)}</strong>
            </div>
          </div>
        </div>

        <footer className="invoice-doc__footer">
          <p>
            Thank you for choosing <strong>{agencyName}</strong>.
          </p>
        </footer>
      </div>
    </article>
  );
});

export default InvoiceDocument;
