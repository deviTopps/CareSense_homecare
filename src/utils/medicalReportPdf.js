import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  REPORT_PRINT_STYLES,
  REPORT_VIEWER_STYLES,
  buildMedicalReportHtml,
  buildMedicalReportModel,
} from './medicalReportTemplate';
import { generateVectorPdfFile } from './medicalReportPdfVector';

export { REPORT_PRINT_STYLES, REPORT_VIEWER_STYLES };

const PDF_PAGE_WIDTH_PX = 794;
const PDF_MARGIN_MM = 12;

export const REPORT_PDF_EXTRA_STYLES = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #1a1a1a;
  }
  body {
    width: ${PDF_PAGE_WIDTH_PX}px;
    min-width: ${PDF_PAGE_WIDTH_PX}px;
  }
  .reports-document--styled.medical-report {
    width: ${PDF_PAGE_WIDTH_PX}px !important;
    max-width: ${PDF_PAGE_WIDTH_PX}px !important;
    min-width: ${PDF_PAGE_WIDTH_PX}px !important;
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 40px 48px !important;
  }
  img {
    max-width: 100%;
    height: auto;
  }
`;

function stripUnsupportedColorFunctions(html) {
  return String(html || '')
    .replace(/\boklch\([^)]*\)/gi, '#1a1a1a')
    .replace(/\boklab\([^)]*\)/gi, '#1a1a1a')
    .replace(/\bcolor-mix\([^)]*\)/gi, '#1a1a1a');
}

function prepareReportHtmlForPdf(html) {
  return stripUnsupportedColorFunctions(html)
    .replace(/\s*contenteditable="[^"]*"/gi, '')
    .replace(/\s*suppresscontenteditablewarning="[^"]*"/gi, '')
    .replace(/<\/?motion\.div\b/gi, (tag) => (tag.startsWith('</') ? '</div>' : '<div'));
}

function applyPdfLayoutFixes(root) {
  if (!root) return;
  root.querySelectorAll('.mr-info-grid').forEach((grid) => {
    grid.style.display = 'table';
    grid.style.width = '100%';
    grid.style.tableLayout = 'fixed';
  });
  root.querySelectorAll('.mr-info-col').forEach((col) => {
    col.style.display = 'table-cell';
    col.style.verticalAlign = 'top';
    col.style.width = '50%';
  });
  root.querySelectorAll('.mr-signature').forEach((row) => {
    row.style.display = 'table';
    row.style.width = '100%';
    row.style.tableLayout = 'fixed';
  });
  root.querySelectorAll('.mr-signature__cell').forEach((cell) => {
    cell.style.display = 'table-cell';
    cell.style.width = '50%';
    cell.style.textAlign = 'center';
  });
  root.querySelectorAll('.mr-overall-summary').forEach((box) => {
    box.style.display = 'block';
    box.style.width = '100%';
    box.style.pageBreakInside = 'avoid';
    box.style.breakInside = 'avoid';
  });
  root.querySelectorAll('.mr-assessment__kv').forEach((row) => {
    row.style.display = 'flex';
    row.style.flexDirection = 'row';
    row.style.justifyContent = 'space-between';
    row.style.gap = '16px';
  });
  root.querySelectorAll('.mr-table').forEach((table) => {
    table.style.display = 'table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
  });
}

function waitForFrameImages(doc) {
  const images = Array.from(doc?.images || []);
  if (!images.length) return Promise.resolve();
  return Promise.all(images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }));
}

function mountReportInIsolatedFrame(innerHtml) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', 'Medical report PDF render');
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_PAGE_WIDTH_PX}px;border:0;visibility:hidden;pointer-events:none`;

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Unable to create PDF render frame.');
  }

  const safeHtml = prepareReportHtmlForPdf(innerHtml);
  const bodyContent = prepareReportHtmlForPdf(
    /class="[^"]*\bmedical-report\b/i.test(safeHtml)
      ? safeHtml
      : `<article class="reports-document reports-document--styled medical-report">${safeHtml}</article>`,
  );

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${REPORT_VIEWER_STYLES}
    ${REPORT_PDF_EXTRA_STYLES}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`);
  doc.close();

  const target = doc.querySelector('.medical-report') || doc.body;
  applyPdfLayoutFixes(target);

  return { iframe, target, doc };
}

function addCanvasToPdf(pdf, canvas, pageWidthMm, pageHeightMm, marginMm) {
  const contentWidthMm = pageWidthMm - marginMm * 2;
  const contentHeightMm = pageHeightMm - marginMm * 2;
  const sliceHeightPx = Math.floor((canvas.width * contentHeightMm) / contentWidthMm);
  const sliceCanvas = document.createElement('canvas');
  const sliceCtx = sliceCanvas.getContext('2d');

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const heightPx = Math.min(sliceHeightPx, canvas.height - offsetY);
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = heightPx;
    sliceCtx.fillStyle = '#ffffff';
    sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    sliceCtx.drawImage(
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

    const imgData = sliceCanvas.toDataURL('image/png');
    const sliceHeightMm = (heightPx * contentWidthMm) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, sliceHeightMm, undefined, 'FAST');

    offsetY += heightPx;
    pageIndex += 1;
  }
}

function safeFileBaseName(report) {
  return String(report.patientName || 'patient').replace(/[^\w\s-]/g, '').trim() || 'patient';
}

export function buildMedicalReportHtmlFromReport(report) {
  const model = buildMedicalReportModel(report);
  return buildMedicalReportHtml(model);
}

/** Fallback: rasterized PDF from HTML (used only if vector export fails). */
export async function generatePdfFileFromHtml(innerHtml, filename) {
  const { iframe, target, doc } = mountReportInIsolatedFrame(innerHtml);

  try {
    await waitForFrameImages(doc);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    iframe.style.height = `${Math.max(target.scrollHeight + 40, PDF_PAGE_WIDTH_PX)}px`;

    const canvas = await html2canvas(target, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      window: iframe.contentWindow,
      width: PDF_PAGE_WIDTH_PX,
      windowWidth: PDF_PAGE_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.querySelector('.medical-report') || clonedDoc.body;
        applyPdfLayoutFixes(clonedRoot);
      },
    });

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    addCanvasToPdf(pdf, canvas, pageWidth, pageHeight, PDF_MARGIN_MM);

    const blob = pdf.output('blob');
    const pdfName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    return new File([blob], pdfName, { type: 'application/pdf' });
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Builds a readable vector PDF (selectable text, sharp at any zoom).
 * Falls back to HTML capture only if vector generation fails.
 */
export async function buildMedicalReportPdfFile(report, options = {}) {
  const filename = `${safeFileBaseName(report)}-medical-report.pdf`;
  const model = buildMedicalReportModel(report);

  try {
    return generateVectorPdfFile(model, filename);
  } catch (vectorError) {
    console.warn('Vector PDF export failed, using HTML fallback:', vectorError);
    const innerHtml = String(options.attachmentHtml || '').trim()
      || buildMedicalReportHtml(model);
    return generatePdfFileFromHtml(innerHtml, filename);
  }
}

export function downloadPdfFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name || 'medical-report.pdf';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
