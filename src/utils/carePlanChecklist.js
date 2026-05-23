/** GET /care-plan-checklist/patient/:patientId/daily?date=YYYY-MM-DD */
export function buildDailyCarePlanChecklistPath(patientId, dateStr) {
  const pid = String(patientId || '').trim();
  const d = String(dateStr || '').trim();
  if (!pid || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  return `/care-plan-checklist/patient/${encodeURIComponent(pid)}/daily?date=${encodeURIComponent(d)}`;
}

export const COMPLETED_CARE_PLAN_LOOKBACK_DAYS = 30;

export function buildPatientCompletedCarePlansPaths(patientId) {
  const pid = String(patientId || '').trim();
  if (!pid) return [];
  const encoded = encodeURIComponent(pid);
  return [
    `/care-plan-checklist/patient/${encoded}/completed`,
    `/care-plan-checklist/patient/${encoded}/daily/completed`,
  ];
}

export function listRecentIsoDates(count = COMPLETED_CARE_PLAN_LOOKBACK_DAYS, endDate = new Date()) {
  const total = Math.max(1, Math.min(Number(count) || COMPLETED_CARE_PLAN_LOOKBACK_DAYS, 90));
  return Array.from({ length: total }, (_, i) => {
    const x = new Date(endDate);
    x.setDate(x.getDate() - i);
    return x.toISOString().slice(0, 10);
  });
}

function resolvePersonName(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value !== 'object') return '';
  const full = [value.firstName || value.first_name, value.lastName || value.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return full || String(value.name || value.fullName || value.email || '').trim();
}

export function formatDailyChecklistDateTime(raw) {
  if (raw == null || raw === '') return '—';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(raw);
  }
}

export function extractDailyChecklistList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const arrayCandidates = [
    payload.items,
    payload.checklist,
    payload.carePlans,
    payload.rows,
    payload.dailyItems,
    payload.completedItems,
    payload.completed,
    payload.completedCarePlans,
    payload.dailyChecklist,
    payload.tasks,
    payload.data,
    payload?.data?.items,
    payload?.data?.checklist,
    payload?.data?.carePlans,
    payload?.data?.completedItems,
    payload?.data?.completed,
    payload?.data?.dailyItems,
    payload?.data?.tasks,
  ];

  for (const candidate of arrayCandidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (typeof payload === 'object' && String(payload.task || payload.title || payload.name || '').trim()) {
    return [payload];
  }
  if (payload?.data && typeof payload.data === 'object' && String(payload.data.task || payload.data.title || '').trim()) {
    return [payload.data];
  }

  return [];
}

export function normalizeDailyChecklistRow(raw, index = 0, careDate = '') {
  const r = raw && typeof raw === 'object' ? raw : {};
  const id = r.id ?? r._id ?? r.carePlanId ?? r.checklistId ?? `daily-${index}`;
  const completed = Boolean(
    r.completed ?? r.isCompleted ?? r.is_completed ?? r.checked ?? r.isChecked ?? r.marked ?? r.done ?? false,
  );
  const completedByRaw = r.completedBy ?? r.completed_by ?? r.nurseName ?? r.markedBy ?? r.nurse ?? null;
  const completedAtRaw = r.completedAt ?? r.completed_at ?? r.completedTime ?? r.markedAt ?? r.time ?? null;
  const dateKey = String(
    careDate || r.careDate || r.date || r.day || r.checklistDate || '',
  ).trim().slice(0, 10);

  return {
    id: String(id),
    careDate: dateKey,
    task: String(r.task ?? r.title ?? r.name ?? r.carePlanTask ?? '').trim(),
    category: String(r.category ?? r.carePlanCategory ?? 'Other').trim() || 'Other',
    frequency: String(r.frequency ?? 'Daily').trim() || 'Daily',
    priority: String(r.priority ?? 'Medium').trim() || 'Medium',
    notes: String(r.notes ?? r.note ?? '').trim(),
    completed,
    completedBy: resolvePersonName(completedByRaw) || null,
    completedAt: completedAtRaw != null && String(completedAtRaw).trim()
      ? formatDailyChecklistDateTime(completedAtRaw)
      : null,
  };
}

export function parseDailyChecklistResponsePayload(data, careDate = '') {
  return extractDailyChecklistList(data)
    .map((row, i) => normalizeDailyChecklistRow(row, i, careDate))
    .filter((row) => row.task);
}

function dedupeCompletedRows(rows) {
  const seen = new Set();
  const out = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = `${row.careDate}|${row.id}|${row.task}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(row);
  });
  return out;
}

/** Group completed care-plan rows by ISO date from multi-day API payloads. */
export function extractCompletedCarePlansByDate(payload, fallbackDate = '') {
  const byDate = {};

  const mergeDay = (dateKey, rawItems, onlyCompleted = true) => {
    const d = String(dateKey || fallbackDate || '').trim().slice(0, 10);
    if (!d) return;
    const parsed = parseDailyChecklistResponsePayload(
      { items: Array.isArray(rawItems) ? rawItems : extractDailyChecklistList(rawItems) },
      d,
    ).filter((row) => (onlyCompleted ? row.completed : true));
    if (!parsed.length) return;
    byDate[d] = dedupeCompletedRows([...(byDate[d] || []), ...parsed.map((row) => ({ ...row, careDate: d }))]);
  };

  const groupedArrays = [
    payload?.days,
    payload?.history,
    payload?.dailyRecords,
    payload?.records,
    payload?.completedByDate,
    payload?.data?.days,
    payload?.data?.history,
    payload?.data?.dailyRecords,
    payload?.data?.records,
  ];

  for (const groups of groupedArrays) {
    if (!Array.isArray(groups)) continue;
    groups.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const dateKey = entry.date ?? entry.careDate ?? entry.day ?? entry.checklistDate;
      const items = entry.completedItems
        ?? entry.completed
        ?? entry.completedCarePlans
        ?? entry.items
        ?? entry.checklist
        ?? entry.tasks;
      mergeDay(dateKey, items, true);
    });
    if (Object.keys(byDate).length > 0) return byDate;
  }

  const completedOnly = extractDailyChecklistList(payload).length
    ? parseDailyChecklistResponsePayload(payload, fallbackDate).filter((row) => row.completed)
    : [];

  if (completedOnly.length > 0) {
    completedOnly.forEach((row) => {
      const d = row.careDate || fallbackDate;
      if (!d) return;
      byDate[d] = dedupeCompletedRows([...(byDate[d] || []), { ...row, careDate: d }]);
    });
    if (Object.keys(byDate).length > 0) return byDate;
  }

  if (fallbackDate) {
    const dayItems = parseDailyChecklistResponsePayload(payload, fallbackDate)
      .filter((row) => row.completed)
      .map((row) => ({ ...row, careDate: fallbackDate }));
    if (dayItems.length) byDate[fallbackDate] = dayItems;
  }

  return byDate;
}

export function flattenCompletedByDate(byDate) {
  return Object.entries(byDate || {})
    .flatMap(([careDate, items]) => (
      (Array.isArray(items) ? items : []).map((item) => ({ ...item, careDate: item.careDate || careDate }))
    ))
    .sort((a, b) => {
      const dateCmp = String(b.careDate || '').localeCompare(String(a.careDate || ''));
      if (dateCmp !== 0) return dateCmp;
      return String(a.task || '').localeCompare(String(b.task || ''));
    });
}

async function readJsonResponse(res) {
  const text = await res.text().catch(() => '');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function runPool(items, worker, concurrency = 6) {
  if (!items.length) return;
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

/**
 * Load all completed daily care plans for a patient.
 * Tries patient-level completed routes, then aggregates GET .../daily?date= per day.
 */
export async function fetchPatientCompletedDailyCarePlans(apiFetch, patientId, options = {}) {
  const pid = String(patientId || '').trim();
  const {
    lookbackDays = COMPLETED_CARE_PLAN_LOOKBACK_DAYS,
    quiet = true,
    onUnauthorized,
  } = options;

  if (!pid) {
    return { byDate: {}, flat: [], error: 'Patient ID is missing.' };
  }

  for (const path of buildPatientCompletedCarePlansPaths(pid)) {
    try {
      const res = await apiFetch(path, { method: 'GET', quiet }, onUnauthorized);
      const data = await readJsonResponse(res);
      if (!res.ok) continue;
      const byDate = extractCompletedCarePlansByDate(data);
      const flat = flattenCompletedByDate(byDate);
      if (flat.length > 0) {
        return { byDate, flat, error: '' };
      }
    } catch {
      // Try next path.
    }
  }

  try {
    const res = await apiFetch(
      `/care-plan-checklist/patient/${encodeURIComponent(pid)}/daily`,
      { method: 'GET', quiet },
      onUnauthorized,
    );
    const data = await readJsonResponse(res);
    if (res.ok) {
      const byDate = extractCompletedCarePlansByDate(data);
      const flat = flattenCompletedByDate(byDate);
      if (flat.length > 0) {
        return { byDate, flat, error: '' };
      }
    }
  } catch {
    // Fall through to per-day requests.
  }

  const dates = listRecentIsoDates(lookbackDays);
  const byDate = {};

  await runPool(dates, async (dateStr) => {
    const path = buildDailyCarePlanChecklistPath(pid, dateStr);
    if (!path) return;
    try {
      const res = await apiFetch(path, { method: 'GET', quiet }, onUnauthorized);
      const data = await readJsonResponse(res);
      if (!res.ok) return;
      const completed = parseDailyChecklistResponsePayload(data, dateStr)
        .filter((row) => row.completed)
        .map((row) => ({ ...row, careDate: dateStr }));
      if (completed.length) {
        byDate[dateStr] = dedupeCompletedRows(completed);
      }
    } catch {
      // Skip failed day.
    }
  });

  const flat = flattenCompletedByDate(byDate);
  return {
    byDate,
    flat,
    error: '',
  };
}
