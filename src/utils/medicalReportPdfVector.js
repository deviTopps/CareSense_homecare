import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { REPORT_BRAND_GREEN, REPORT_BRAND_GREEN_DARK } from './medicalReportTemplate';

const GREEN = [45, 106, 79];
const GREEN_DARK = [27, 67, 50];
const TEXT = [26, 26, 26];
const MUTED = [119, 119, 119];
const MARGIN = 14;
const LINE = 5.2;
const SECTION_GAP = 8;

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '');
  if (value.length !== 6) return GREEN;
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

const GREEN_RGB = hexToRgb(REPORT_BRAND_GREEN);
const GREEN_DARK_RGB = hexToRgb(REPORT_BRAND_GREEN_DARK);

function formatDoctorName(name) {
  const value = String(name || '').trim();
  if (!value || value === '—') return '—';
  return /^dr\.?\s/i.test(value) ? value : `Dr. ${value}`;
}

function pageMetrics(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  return {
    pageWidth,
    pageHeight,
    contentWidth: pageWidth - MARGIN * 2,
    bottomLimit: pageHeight - MARGIN,
  };
}

function ensureSpace(pdf, y, needed = 12) {
  const { bottomLimit } = pageMetrics(pdf);
  if (y + needed <= bottomLimit) return y;
  pdf.addPage();
  return MARGIN;
}

function addWrappedText(pdf, text, x, y, maxWidth, options = {}) {
  const {
    fontSize = 10,
    fontStyle = 'normal',
    color = TEXT,
    lineHeight = LINE,
  } = options;

  pdf.setFont('helvetica', fontStyle);
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...color);

  const lines = pdf.splitTextToSize(String(text || '—'), maxWidth);
  let cursorY = ensureSpace(pdf, y, lines.length * lineHeight + 2);
  pdf.text(lines, x, cursorY);
  return cursorY + lines.length * lineHeight;
}

function addSectionTitle(pdf, title, y) {
  let cursorY = ensureSpace(pdf, y, 14);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...GREEN_RGB);
  pdf.text(String(title), MARGIN, cursorY);
  return cursorY + 7;
}

function addInfoPair(pdf, label, value, x, y, colWidth) {
  const labelText = `${label}:`;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...TEXT);
  pdf.text(labelText, x, y);

  pdf.setFont('helvetica', 'normal');
  const valueLines = pdf.splitTextToSize(String(value || '—'), colWidth - 2);
  pdf.text(valueLines, x, y + 4.5);
  return y + 4.5 + valueLines.length * LINE;
}

function addTwoColumnInfo(pdf, leftRows, rightRows, startY) {
  const { contentWidth } = pageMetrics(pdf);
  const colWidth = (contentWidth - 8) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colWidth + 8;

  let leftY = startY;
  let rightY = startY;

  leftRows.forEach(([label, value]) => {
    leftY = Math.max(leftY, addInfoPair(pdf, label, value, leftX, leftY, colWidth));
    leftY += 2;
  });

  rightRows.forEach(([label, value]) => {
    rightY = Math.max(rightY, addInfoPair(pdf, label, value, rightX, rightY, colWidth));
    rightY += 2;
  });

  return Math.max(leftY, rightY) + SECTION_GAP;
}

function addOverallSummaryBox(pdf, summary, startY) {
  const text = String(summary || '').trim();
  if (!text) return startY;

  const { contentWidth } = pageMetrics(pdf);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  const bodyLines = pdf.splitTextToSize(text, contentWidth - 16);
  const boxHeight = bodyLines.length * LINE + 22;

  let y = ensureSpace(pdf, startY, boxHeight + 4);

  pdf.setDrawColor(...GREEN_RGB);
  pdf.setFillColor(241, 248, 244);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(MARGIN, y - 4, contentWidth, boxHeight, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(...GREEN_RGB);
  pdf.roundedRect(MARGIN + 6, y, 28, 5.5, 1, 1, 'F');
  pdf.text('IMPORTANT', MARGIN + 8, y + 4);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...GREEN_DARK_RGB);
  pdf.text('Overall Summary', MARGIN + 6, y + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(...TEXT);
  pdf.text(bodyLines, MARGIN + 6, y + 18);

  return y + boxHeight + SECTION_GAP;
}

function addTable(pdf, headers, rows, startY) {
  if (!headers?.length || !rows?.length) return startY;

  let y = ensureSpace(pdf, startY, 20);

  autoTable(pdf, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.5,
      textColor: TEXT,
      lineColor: [212, 212, 212],
      lineWidth: 0.2,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: GREEN_RGB,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    tableWidth: 'auto',
  });

  return (pdf.lastAutoTable?.finalY || y) + SECTION_GAP;
}

function renderAssessmentContent(pdf, content, startY) {
  if (!content) return startY;

  if (content.type === 'table') {
    return addTable(pdf, content.headers, content.rows, startY);
  }

  if (content.type === 'kv-list') {
    let y = startY;
    content.items.forEach(({ label, value }) => {
      y = ensureSpace(pdf, y, LINE * 2);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...TEXT);
      pdf.text(String(label), MARGIN, y);
      pdf.setFont('helvetica', 'normal');
      const valueLines = pdf.splitTextToSize(String(value || '—'), 90);
      pdf.text(valueLines, MARGIN + 95, y);
      y += Math.max(LINE, valueLines.length * LINE) + 2;
    });
    return y + 4;
  }

  if (content.type === 'list') {
    let y = startY;
    content.items.forEach((item) => {
      y = addWrappedText(pdf, `• ${item}`, MARGIN + 2, y, pageMetrics(pdf).contentWidth - 4, {
        fontSize: 9.5,
      });
      y += 1;
    });
    return y + 4;
  }

  return addWrappedText(pdf, content.text, MARGIN, startY, pageMetrics(pdf).contentWidth, {
    fontSize: 9.5,
  });
}

function addAssessmentSection(pdf, assessment, blocks, startY) {
  let y = addSectionTitle(pdf, 'Assessment', startY);

  const intro = String(assessment || '').trim();
  if (intro) {
    y = addWrappedText(pdf, intro, MARGIN, y, pageMetrics(pdf).contentWidth, { fontSize: 9.5 });
    y += 4;
  }

  (blocks || []).forEach((block) => {
    if (block.type !== 'subsection') return;
    y = ensureSpace(pdf, y, 16);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...GREEN_RGB);
    pdf.text(String(block.title), MARGIN, y);
    y += 6;
    y = renderAssessmentContent(pdf, block.content, y);
    y += 4;
  });

  if (!intro && !(blocks || []).length) {
    y = addWrappedText(
      pdf,
      'Patient assessed during the reporting period.',
      MARGIN,
      y,
      pageMetrics(pdf).contentWidth,
      { fontSize: 9.5 },
    );
  }

  return y + SECTION_GAP;
}

function addNarrativeBlock(pdf, title, text, startY) {
  let y = addSectionTitle(pdf, title, startY);
  return addWrappedText(pdf, text, MARGIN, y, pageMetrics(pdf).contentWidth, { fontSize: 10 }) + SECTION_GAP;
}

export function generateVectorPdfBlob(model) {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({
    title: 'Medical Report',
    subject: model?.patient?.fullName || 'Patient',
    creator: model?.agencyName || 'CareSense',
  });

  const { contentWidth, pageWidth } = pageMetrics(pdf);
  let y = MARGIN;

  pdf.setDrawColor(197, 197, 197);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN + 20, y + 2, pageWidth - MARGIN - 20, y + 2);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...GREEN_RGB);
  const agencyLines = pdf.splitTextToSize(String(model.agencyName || 'CareSense Homecare'), contentWidth - 40);
  pdf.text(agencyLines, pageWidth / 2, y + 10, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED);
  pdf.text(String(model.agencyAddress || ''), pageWidth / 2, y + 10 + agencyLines.length * 4.5, { align: 'center' });

  y += 10 + agencyLines.length * 4.5 + 8;
  pdf.line(MARGIN + 20, y, pageWidth - MARGIN - 20, y);
  y += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...TEXT);
  pdf.text('MEDICAL REPORT', pageWidth / 2, y, { align: 'center' });
  y += 14;

  y = addSectionTitle(pdf, 'Visit Info', y);
  y = addTwoColumnInfo(
    pdf,
    [
      ["Doctor's Name", formatDoctorName(model.visit?.doctorName)],
      ['Specialization', model.visit?.specialization],
    ],
    [['Visit Date', model.visit?.visitDate]],
    y,
  );

  y = addSectionTitle(pdf, 'Patient Info', y);
  y = addTwoColumnInfo(
    pdf,
    [
      ['Full Name', model.patient?.fullName],
      ['Birth Date', model.patient?.birthDate],
      ['Gender', model.patient?.gender],
    ],
    [
      ['Phone', model.patient?.phone],
      ['Address', model.patient?.address],
    ],
    y,
  );

  y = addOverallSummaryBox(pdf, model.overallSummary || model.narratives?.overallSummary, y);

  y = addAssessmentSection(
    pdf,
    model.narratives?.assessment,
    model.narratives?.assessmentBlocks,
    y,
  );

  y = addNarrativeBlock(pdf, 'Diagnosis', model.narratives?.diagnosis, y);
  y = addNarrativeBlock(pdf, 'Prescription', model.narratives?.prescription, y);

  y = ensureSpace(pdf, y, 20);
  const sigY = y + 8;
  const half = contentWidth / 2 - 4;
  pdf.setDrawColor(204, 204, 204);
  pdf.line(MARGIN, sigY, MARGIN + half, sigY);
  pdf.line(MARGIN + half + 8, sigY, MARGIN + contentWidth, sigY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED);
  pdf.text(`Attending Nurse: ${model.signature?.nurseName || '—'}`, MARGIN + half / 2, sigY + 5, { align: 'center' });
  pdf.text(`Date: ${model.signature?.date || '—'}`, MARGIN + half + 8 + half / 2, sigY + 5, { align: 'center' });

  y = sigY + 16;
  y = ensureSpace(pdf, y, 20);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...MUTED);
  const footerParts = [
    'For inquiries and appointments, feel free to contact us.',
    [
      model.contactPhone !== '—' ? `phone: ${model.contactPhone}` : '',
      model.contactEmail !== '—' ? `email: ${model.contactEmail}` : '',
    ].filter(Boolean).join(', '),
    model.contactWebsite,
    `Confidential medical document — ${model.agencyName}`,
  ].filter(Boolean);

  footerParts.forEach((line) => {
    pdf.text(String(line), pageWidth / 2, y, { align: 'center' });
    y += 4.5;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - MARGIN, pdf.internal.pageSize.getHeight() - 6, { align: 'right' });
  }

  return pdf.output('blob');
}

export function generateVectorPdfFile(model, filename) {
  const blob = generateVectorPdfBlob(model);
  const pdfName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  return new File([blob], pdfName, { type: 'application/pdf' });
}
