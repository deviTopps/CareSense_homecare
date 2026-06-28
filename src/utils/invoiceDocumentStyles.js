/** Hex-only CSS shared by invoice preview and PDF export (html2canvas-safe). */
export const INVOICE_DOCUMENT_CSS = `
  .invoice-doc {
    --invoice-accent: #1d4ed8;
    --invoice-accent-dark: #1e3a8a;
    --invoice-text: #111827;
    --invoice-muted: #6b7280;
    --invoice-border: #e5e7eb;
    --invoice-bg: #ffffff;
    --invoice-soft: #f8fafc;
    font-family: Inter, "Segoe UI", Arial, sans-serif;
    color: var(--invoice-text);
    background: var(--invoice-bg);
    border: 1px solid var(--invoice-border);
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
    max-width: 820px;
    margin: 0 auto;
  }

  .invoice-doc__accent-bar {
    height: 6px;
    background: linear-gradient(90deg, var(--invoice-accent-dark) 0%, var(--invoice-accent) 100%);
  }

  .invoice-doc__body {
    padding: 32px 36px 28px;
  }

  .invoice-doc__masthead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 2px solid var(--invoice-border);
  }

  .invoice-doc__brand {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    min-width: 0;
    flex: 1;
  }

  .invoice-doc__logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border-radius: 8px;
    border: 1px solid var(--invoice-border);
    background: #ffffff;
    flex-shrink: 0;
  }

  .invoice-doc__company-name {
    margin: 0 0 6px;
    font-size: 20px;
    font-weight: 800;
    color: var(--invoice-text);
    line-height: 1.2;
  }

  .invoice-doc__company-meta {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--invoice-muted);
  }

  .invoice-doc__title-block {
    text-align: right;
    flex-shrink: 0;
  }

  .invoice-doc__title {
    margin: 0 0 4px;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--invoice-accent-dark);
    line-height: 1;
  }

  .invoice-doc__number {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--invoice-text);
  }

  .invoice-doc__status {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .invoice-doc__status--paid { background: #ecfdf5; color: #047857; }
  .invoice-doc__status--partial { background: #fff7ed; color: #c2410c; }
  .invoice-doc__status--unpaid { background: #fef2f2; color: #b91c1c; }

  .invoice-doc__parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }

  .invoice-doc__section-label {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--invoice-accent);
  }

  .invoice-doc__party-name {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 700;
    color: var(--invoice-text);
  }

  .invoice-doc__party-detail {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--invoice-muted);
  }

  .invoice-doc__details-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .invoice-doc__details-list li {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 5px 0;
    font-size: 13px;
    border-bottom: 1px solid #f1f5f9;
  }

  .invoice-doc__details-list li:last-child {
    border-bottom: none;
  }

  .invoice-doc__details-list span {
    color: var(--invoice-muted);
  }

  .invoice-doc__details-list strong {
    color: var(--invoice-text);
    font-weight: 600;
    text-align: right;
  }

  .invoice-doc__table-wrap {
    margin-bottom: 24px;
    border: 1px solid var(--invoice-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .invoice-doc__table {
    width: 100%;
    border-collapse: collapse;
  }

  .invoice-doc__table thead {
    background: var(--invoice-soft);
  }

  .invoice-doc__table th {
    padding: 12px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--invoice-muted);
    border-bottom: 1px solid var(--invoice-border);
  }

  .invoice-doc__table th:last-child,
  .invoice-doc__table td:last-child {
    text-align: right;
  }

  .invoice-doc__table td {
    padding: 14px;
    font-size: 13px;
    color: var(--invoice-text);
    border-bottom: 1px solid var(--invoice-border);
    vertical-align: top;
  }

  .invoice-doc__table tbody tr:last-child td {
    border-bottom: none;
  }

  .invoice-doc__item-title {
    display: block;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .invoice-doc__item-note {
    display: block;
    font-size: 12px;
    color: var(--invoice-muted);
  }

  .invoice-doc__bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .invoice-doc__notes {
    flex: 1;
    min-width: 0;
    padding: 14px 16px;
    background: var(--invoice-soft);
    border-radius: 6px;
    border: 1px solid var(--invoice-border);
  }

  .invoice-doc__notes-title {
    margin: 0 0 6px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--invoice-muted);
  }

  .invoice-doc__notes-text {
    margin: 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--invoice-text);
  }

  .invoice-doc__summary {
    width: 280px;
    flex-shrink: 0;
    border: 1px solid var(--invoice-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .invoice-doc__summary-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--invoice-muted);
    border-bottom: 1px solid var(--invoice-border);
    background: #ffffff;
  }

  .invoice-doc__summary-row strong {
    color: var(--invoice-text);
    font-weight: 700;
    text-align: right;
  }

  .invoice-doc__summary-row--deduction strong {
    color: #b45309;
  }

  .invoice-doc__summary-row--total {
    background: var(--invoice-soft);
    font-size: 15px;
    font-weight: 700;
    color: var(--invoice-text);
    border-bottom: none;
  }

  .invoice-doc__summary-row--total strong {
    color: var(--invoice-accent-dark);
    font-size: 16px;
  }

  .invoice-doc__summary-row--balance {
    background: var(--invoice-accent-dark);
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    border-bottom: none;
  }

  .invoice-doc__summary-row--balance span,
  .invoice-doc__summary-row--balance strong {
    color: #ffffff;
  }

  .invoice-doc__footer {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid var(--invoice-border);
    text-align: center;
  }

  .invoice-doc__footer p {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--invoice-muted);
  }

  .invoice-doc__footer strong {
    color: var(--invoice-text);
  }

  @media (max-width: 640px) {
    .invoice-doc__body { padding: 20px; }
    .invoice-doc__masthead,
    .invoice-doc__parties,
    .invoice-doc__bottom {
      grid-template-columns: 1fr;
      flex-direction: column;
    }
    .invoice-doc__title-block { text-align: left; }
    .invoice-doc__summary { width: 100%; }
  }
`;

/** A4 content width at 96dpi — matches medical report PDF export. */
export const INVOICE_PDF_PAGE_WIDTH_PX = 794;

export const INVOICE_PDF_EXTRA_STYLES = `
  html, body {
    width: ${INVOICE_PDF_PAGE_WIDTH_PX}px;
    min-width: ${INVOICE_PDF_PAGE_WIDTH_PX}px;
    padding: 0;
    margin: 0;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .invoice-doc {
    max-width: none;
    width: 100%;
    border: none;
    border-radius: 0;
    margin: 0;
  }
  .invoice-doc__body {
    padding: 28px 32px 24px;
  }
`;

export const INVOICE_PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    padding: 0;
    width: 100%;
  }
  .invoice-doc {
    max-width: none;
    width: 100%;
    border: none;
    border-radius: 0;
    box-shadow: none;
    margin: 0;
    page-break-inside: avoid;
  }
  .invoice-doc__body {
    padding: 24px 28px 20px;
  }
  .invoice-doc__table-wrap,
  .invoice-doc__summary {
    page-break-inside: avoid;
  }
  .invoice-doc__accent-bar,
  .invoice-doc__summary-row--balance,
  .invoice-doc__status {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    html, body {
      width: 210mm;
    }
  }
`;
