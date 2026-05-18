/**
 * Parses AI report markdown / structured data into formatted assessment blocks.
 */

const SKIP_SECTION_TITLES = new Set([
  'home care patient monthly report',
  'patient information',
  'care plan start date',
  'summary overview',
  'summary overview (very important)',
  'key message',
  'visit info',
  'patient info',
]);

const SECTION_SPLIT_PATTERN = /(?=(?:Vital Signs Summary|Daily Living Activities(?:\s*\(ADLs\))?|Weekly Activity Log(?:\s*\(Simplified\))?|Medication Summary|Health Observations(?:\s*&\s*|\s+and\s+)Incidents|Progress Evaluation|Caregiver Notes|Recommendations|Next Month Plan)\b)/gi;

function normalizeTitle(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function shouldSkipSection(title) {
  const key = normalizeTitle(title).toLowerCase();
  return SKIP_SECTION_TITLES.has(key) || /^summary overview\b/i.test(key);
}

function parsePipeTable(text) {
  const raw = String(text || '').trim();
  if (!raw.includes('|')) return null;

  const cells = raw.split(/\s*\|\s*/).map((c) => c.trim()).filter(Boolean);
  if (cells.length < 4) return null;

  let colCount = 3;
  if (cells.length >= 5) {
    const first = cells[0].toLowerCase();
    if (/^(medication|drug|medicine)\b/.test(first) || first.includes('medication')) colCount = 5;
    else if (cells[0].toLowerCase() === 'activity') colCount = 3;
    else if (cells[0].toLowerCase() === 'metric') colCount = 3;
  }

  if (cells.length % colCount !== 0 && cells.length >= colCount + 1) {
    colCount = 3;
  }

  const headers = cells.slice(0, colCount);
  const rows = [];
  for (let i = colCount; i < cells.length; i += colCount) {
    const row = cells.slice(i, i + colCount);
    if (row.length === colCount) rows.push(row);
  }

  if (!rows.length) return null;
  return { headers, rows };
}

function parseKeyValueLines(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];

  const pairs = [];
  const regex = /([A-Za-z][A-Za-z\s/&-]{1,40}):\s*([^:]+?)(?=(?:\s+[A-Z][A-Za-z]+(?:\s+[A-Za-z]+)*:)|$)/g;
  let match = regex.exec(raw);
  while (match) {
    pairs.push({ label: match[1].trim(), value: match[2].trim() });
    match = regex.exec(raw);
  }
  return pairs;
}

function parseListItems(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];

  if (/^week\s+\d+/i.test(raw)) {
    return raw.split(/(?=Week\s+\d+)/i).map((s) => s.trim()).filter(Boolean);
  }

  const sentences = raw.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length > 1) return sentences;

  if (raw.includes('•')) {
    return raw.split('•').map((s) => s.trim()).filter(Boolean);
  }

  return [raw];
}

function parseSectionBody(title, body) {
  const text = String(body || '').trim();
  if (!text) return { type: 'paragraph', text: '—' };

  const table = parsePipeTable(text);
  if (table) return { type: 'table', ...table };

  const kv = parseKeyValueLines(text);
  if (kv.length >= 2) return { type: 'kv-list', items: kv };

  const list = parseListItems(text);
  if (list.length > 1 || /^week\s+\d+/i.test(text)) {
    return { type: 'list', items: list };
  }

  return { type: 'paragraph', text };
}

function splitMarkdownIntoSections(markdown) {
  const raw = String(markdown || '').trim();
  if (!raw) return [];

  const normalized = raw.includes('\n')
    ? raw
    : raw.replace(SECTION_SPLIT_PATTERN, '\n$1');

  const chunks = normalized.split(/\n+/).join('\n').split(SECTION_SPLIT_PATTERN);
  const sections = [];

  for (const chunk of chunks) {
    const piece = String(chunk || '').trim();
    if (!piece) continue;

    const lines = piece.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let title = lines[0].replace(/^\d+\.\s*/, '').trim();
    let body = lines.slice(1).join(' ').trim();

    if (!body && title.includes('|')) {
      body = title;
      title = 'Report Details';
    }

    if (!body && lines.length === 1) {
      const colonIdx = title.indexOf(':');
      if (colonIdx > 0 && colonIdx < 60) {
        body = title.slice(colonIdx + 1).trim();
        title = title.slice(0, colonIdx).trim();
      }
    }

    if (shouldSkipSection(title)) continue;
    sections.push({ title: normalizeTitle(title), body });
  }

  return sections;
}

function tableBlockFromObjectRows(title, rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const headers = Object.keys(rows[0] || {});
  if (!headers.length) return null;
  return {
    type: 'subsection',
    title,
    content: {
      type: 'table',
      headers,
      rows: rows.map((row) => headers.map((h) => String(row?.[h] ?? '—'))),
    },
  };
}

export function buildAssessmentBlocksFromAiReport(aiReport) {
  if (!aiReport || typeof aiReport !== 'object') return [];

  const blocks = [];

  const vitalRows = aiReport?.vital_signs_summary?.rows;
  const vitalBlock = tableBlockFromObjectRows('Vital Signs Summary', vitalRows);
  if (vitalBlock) blocks.push(vitalBlock);

  const adlRows = aiReport?.daily_living_activities?.rows;
  const adlBlock = tableBlockFromObjectRows('Daily Living Activities (ADLs)', adlRows);
  if (adlBlock) blocks.push(adlBlock);

  const medRows = aiReport?.medication_summary?.rows;
  const medBlock = tableBlockFromObjectRows('Medication Summary', medRows);
  if (medBlock) blocks.push(medBlock);

  const weekly = Array.isArray(aiReport?.weekly_activity_log) ? aiReport.weekly_activity_log : [];
  if (weekly.length) {
    const items = weekly.flatMap((w) => {
      const label = w?.week || 'Week';
      const bullets = Array.isArray(w?.bullets) ? w.bullets : (Array.isArray(w?.items) ? w.items : []);
      return bullets.map((b) => `${label}: ${b}`);
    });
    if (items.length) {
      blocks.push({ type: 'subsection', title: 'Weekly Activity Log', content: { type: 'list', items } });
    }
  }

  const obsSection = aiReport?.health_observations_and_incidents;
  const obsBullets = Array.isArray(obsSection?.bullets) ? obsSection.bullets.filter(Boolean) : [];
  const obsText = String(obsSection?.summary || obsSection?.text || '').trim();
  if (obsBullets.length) {
    blocks.push({
      type: 'subsection',
      title: 'Health Observations & Incidents',
      content: { type: 'list', items: obsBullets },
    });
  } else if (obsText) {
    blocks.push({
      type: 'subsection',
      title: 'Health Observations & Incidents',
      content: { type: 'paragraph', text: obsText },
    });
  } else if (obsSection) {
    blocks.push({
      type: 'subsection',
      title: 'Health Observations & Incidents',
      content: { type: 'paragraph', text: 'No incidents reported this period.' },
    });
  }

  const progress = aiReport?.progress_evaluation;
  if (progress && typeof progress === 'object') {
    const items = Object.entries(progress)
      .filter(([, v]) => String(v ?? '').trim())
      .map(([k, v]) => ({
        label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: String(v),
      }));
    if (items.length) {
      blocks.push({ type: 'subsection', title: 'Progress Evaluation', content: { type: 'kv-list', items } });
    }
  }

  const caregiverNotes = String(aiReport?.caregiver_notes || '').trim();
  if (caregiverNotes) {
    blocks.push({
      type: 'subsection',
      title: 'Caregiver Notes',
      content: { type: 'paragraph', text: caregiverNotes },
    });
  }

  const recs = Array.isArray(aiReport?.recommendations) ? aiReport.recommendations.filter(Boolean) : [];
  if (recs.length) {
    blocks.push({ type: 'subsection', title: 'Recommendations', content: { type: 'list', items: recs } });
  }

  const plan = Array.isArray(aiReport?.next_month_plan) ? aiReport.next_month_plan.filter(Boolean) : [];
  if (plan.length) {
    blocks.push({ type: 'subsection', title: 'Next Month Plan', content: { type: 'list', items: plan } });
  }

  return blocks;
}

export function buildAssessmentBlocksFromMarkdown(markdown) {
  const sections = splitMarkdownIntoSections(markdown);
  return sections.map(({ title, body }) => ({
    type: 'subsection',
    title,
    content: parseSectionBody(title, body),
  }));
}

export function buildAssessmentBlocks(report, patient, aiReport) {
  const structured = buildAssessmentBlocksFromAiReport(aiReport);
  if (structured.length) return structured;

  const markdown = String(patient?.aiReportMarkdown || patient?.aiReportText || '').trim();
  if (markdown) return buildAssessmentBlocksFromMarkdown(markdown);

  return [];
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderContentHtml(content) {
  if (!content) return '';
  if (content.type === 'paragraph') {
    return `<p class="mr-assessment__p">${escapeHtml(content.text)}</p>`;
  }
  if (content.type === 'list') {
    return `<ul class="mr-assessment__list">${content.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }
  if (content.type === 'kv-list') {
    return `<div class="mr-assessment__kv-list">${content.items.map(({ label, value }) => `
      <div class="mr-assessment__kv">
        <span class="mr-assessment__kv-label">${escapeHtml(label)}</span>
        <span class="mr-assessment__kv-value">${escapeHtml(value)}</span>
      </div>
    `).join('')}</div>`;
  }
  if (content.type === 'table') {
    return `
      <table class="mr-table">
        <thead><tr>${content.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>
          ${content.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;
  }
  return '';
}

export function renderAssessmentBlocksHtml(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) return '';

  return blocks.map((block) => {
    if (block.type !== 'subsection') return '';
    return `
      <div class="mr-assessment__subsection">
        <h4 class="mr-assessment__subsection-title">${escapeHtml(block.title)}</h4>
        ${renderContentHtml(block.content)}
      </div>
    `;
  }).join('');
}
