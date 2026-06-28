import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  INVOICE_DOCUMENT_CSS,
  INVOICE_PDF_EXTRA_STYLES,
  INVOICE_PDF_PAGE_WIDTH_PX,
  INVOICE_PRINT_STYLES,
} from './invoiceDocumentStyles';

const PDF_MARGIN_MM = 10;
const PDF_CAPTURE_SCALE = 3;

function resolveCaptureScale() {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(PDF_CAPTURE_SCALE, Math.max(2, Math.round(dpr * 1.5)));
}

function stripUnsupportedColorFunctions(html) {
  return String(html || '')
    .replace(/\boklch\([^)]*\)/gi, '#1a1a1a')
    .replace(/\boklab\([^)]*\)/gi, '#1a1a1a')
    .replace(/\bcolor-mix\([^)]*\)/gi, '#1a1a1a');
}

function sanitizeClonedStyles(root) {
  if (!root) return;
  const colorProps = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'fill',
    'stroke',
  ];

  root.querySelectorAll('*').forEach((el) => {
    colorProps.forEach((prop) => {
      const value = el.style[prop];
      if (value && /oklch|oklab|color-mix/i.test(value)) {
        el.style[prop] = prop === 'backgroundColor' ? '#ffffff' : '#0f172a';
      }
    });
  });
}

function waitForFrameImages(doc) {
  const images = Array.from(doc?.images || []);
  if (!images.length) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) => new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        if (img.complete) done();
      }),
    ),
  );
}

function mountInvoiceInIsolatedFrame(innerHtml) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', 'Invoice PDF render');
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${INVOICE_PDF_PAGE_WIDTH_PX}px;border:0;visibility:hidden;pointer-events:none`;

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Unable to create PDF render frame.');
  }

  const safeHtml = stripUnsupportedColorFunctions(innerHtml);

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${INVOICE_DOCUMENT_CSS}
    ${INVOICE_PDF_EXTRA_STYLES}
  </style>
</head>
<body>
  ${safeHtml}
</body>
</html>`);
  doc.close();

  const target = doc.querySelector('.invoice-doc') || doc.body;
  return { iframe, target, doc };
}

function addCanvasToPdf(pdf, canvas, pageWidthMm, pageHeightMm, marginMm) {
  const contentWidthMm = pageWidthMm - marginMm * 2;
  const contentHeightMm = pageHeightMm - marginMm * 2;
  const pxPerMm = canvas.width / contentWidthMm;
  const pageHeightPx = Math.floor(contentHeightMm * pxPerMm);

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const heightPx = Math.min(pageHeightPx, canvas.height - offsetY);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = heightPx;
    const ctx = sliceCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      heightPx,
      0,
      0,
      canvas.width,
      heightPx,
    );

    const imgData = sliceCanvas.toDataURL('image/png', 1.0);
    const sliceHeightMm = (heightPx * contentWidthMm) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      imgData,
      'PNG',
      marginMm,
      marginMm,
      contentWidthMm,
      sliceHeightMm,
      undefined,
      'SLOW',
    );

    offsetY += heightPx;
    pageIndex += 1;
  }
}

export function invoicePdfFilename(invoice) {
  const base = String(invoice?.invoiceNumber || invoice?.id || 'invoice')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
  return `${base || 'invoice'}.pdf`;
}

export async function buildInvoicePdfFile(element, invoice) {
  if (!element) throw new Error('Invoice preview not found.');

  const innerHtml = element.outerHTML;
  const { iframe, target, doc } = mountInvoiceInIsolatedFrame(innerHtml);
  const captureScale = resolveCaptureScale();

  try {
    await waitForFrameImages(doc);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    iframe.style.height = `${Math.max(target.scrollHeight + 48, INVOICE_PDF_PAGE_WIDTH_PX)}px`;

    const canvas = await html2canvas(target, {
      scale: captureScale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      window: iframe.contentWindow,
      width: INVOICE_PDF_PAGE_WIDTH_PX,
      windowWidth: INVOICE_PDF_PAGE_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 15000,
      removeContainer: true,
      onclone: (clonedDoc) => {
        sanitizeClonedStyles(clonedDoc.body);
      },
    });

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: false,
    });
    pdf.setProperties({
      title: invoice?.invoiceNumber || 'Invoice',
      subject: 'Patient invoice',
      creator: 'CareSense',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    addCanvasToPdf(pdf, canvas, pageWidth, pageHeight, PDF_MARGIN_MM);

    const filename = invoicePdfFilename(invoice);
    const blob = pdf.output('blob');
    return new File([blob], filename, { type: 'application/pdf' });
  } finally {
    document.body.removeChild(iframe);
  }
}

export function downloadInvoicePdfFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name || 'invoice.pdf';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadInvoicePdf(element, invoice) {
  const file = await buildInvoicePdfFile(element, invoice);
  downloadInvoicePdfFile(file);
  return file;
}

function escapeHtmlTitle(title) {
  return String(title || 'Invoice')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getInvoicePrintMarkup(element) {
  const clone = element.cloneNode(true);
  clone.querySelector('style')?.remove();
  return clone.outerHTML;
}

function waitForDocumentImages(doc) {
  const images = Array.from(doc?.images || []);
  if (!images.length) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) => new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        if (img.complete) done();
      }),
    ),
  );
}

export function openInvoicePrintWindow(element, { title = 'Invoice' } = {}) {
  if (!element) {
    return Promise.reject(new Error('Invoice preview not found.'));
  }

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', String(title));
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;left:-9999px;top:0';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;

    if (!doc || !win) {
      iframe.remove();
      reject(new Error('Unable to open print view.'));
      return;
    }

    const markup = getInvoicePrintMarkup(element);
    const safeTitle = escapeHtmlTitle(title);

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    ${INVOICE_DOCUMENT_CSS}
    ${INVOICE_PRINT_STYLES}
  </style>
</head>
<body>${markup}</body>
</html>`);
    doc.close();

    const cleanup = () => {
      window.setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 300);
      resolve();
    };

    (async () => {
      try {
        await waitForDocumentImages(doc);
        await new Promise((r) => window.setTimeout(r, 200));
        win.focus();
        win.print();
        win.addEventListener('afterprint', cleanup, { once: true });
        window.setTimeout(cleanup, 120000);
      } catch (err) {
        iframe.remove();
        reject(err);
      }
    })();
  });
}
