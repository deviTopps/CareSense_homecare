import { apiFetch } from '../api';
import { extractApiPatientId, fetchAllPatients } from './patients';

const REPORTS_CACHE_KEY = 'caresense.medicalReports.list.v1';
const REPORTS_CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_PATIENT_CONCURRENCY = 6;
const MAX_FALLBACK_PATIENTS = 80;

let memoryCache = null;
let memoryCacheAt = 0;

export function extractMedicalReportArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === 'object' && (payload.data.report || payload.data.reportMarkdown || payload.data.patient)) return [payload.data];
  if (Array.isArray(payload?.data?.reports)) return payload.data.reports;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload?.report && typeof payload.report === 'object') return [payload.report];
  if (payload && typeof payload === 'object' && (payload.report || payload.reportMarkdown || payload.patient)) return [payload];
  if (payload?.data?.report && typeof payload.data.report === 'object') return [payload.data.report];
  return [];
}

function dedupeReports(reports) {
  return Array.from(
    new Map((Array.isArray(reports) ? reports : []).map((entry) => [String(entry?.reportId || ''), entry])).values(),
  ).filter((entry) => entry?.reportId);
}

export function readMedicalReportsCache() {
  const now = Date.now();
  if (memoryCache && now - memoryCacheAt < REPORTS_CACHE_TTL_MS) {
    return memoryCache;
  }

  try {
    const raw = sessionStorage.getItem(REPORTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed.reports)) return null;
    if (now - parsed.savedAt > REPORTS_CACHE_TTL_MS) return null;
    memoryCache = parsed.reports;
    memoryCacheAt = parsed.savedAt;
    return parsed.reports;
  } catch {
    return null;
  }
}

export function writeMedicalReportsCache(reports) {
  const list = dedupeReports(reports);
  memoryCache = list;
  memoryCacheAt = Date.now();
  try {
    sessionStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify({ savedAt: memoryCacheAt, reports: list }));
  } catch {
    // Ignore quota or private-mode errors.
  }
}

export function invalidateMedicalReportsCache() {
  memoryCache = null;
  memoryCacheAt = 0;
  try {
    sessionStorage.removeItem(REPORTS_CACHE_KEY);
  } catch {
  }
}

async function runWithConcurrency(items, worker, concurrency = FALLBACK_PATIENT_CONCURRENCY) {
  if (!items.length) return [];
  const results = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

function shouldUsePerPatientFallback(response, payload) {
  if (response.status === 404 || response.status === 405) return true;
  const message = String(payload?.message || payload?.error || '').toLowerCase();
  return message.includes('not found') || message.includes('not allowed');
}

async function fetchMedicalReportList() {
  const response = await apiFetch('/ai/medical-report', { method: 'GET', quiet: true });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function fetchPatientMedicalReport(patientId) {
  const query = `/ai/medical-report?patientId=${encodeURIComponent(patientId)}`;
  let response = await apiFetch(query, { method: 'GET', quiet: true });
  let payload = await response.json().catch(() => ({}));

  if (response.ok) {
    return { response, payload };
  }

  if (response.status !== 404 && response.status !== 405) {
    return { response, payload };
  }

  response = await apiFetch('/ai/medical-report', {
    method: 'POST',
    body: JSON.stringify({ patientId }),
    quiet: true,
  });
  payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function fetchReportsViaPatientFallback(mapReport) {
  const patients = await fetchAllPatients();
  const patientEntries = (Array.isArray(patients) ? patients : [])
    .map((patient) => ({ patient, patientId: extractApiPatientId(patient) }))
    .filter(({ patientId }) => Boolean(patientId))
    .slice(0, MAX_FALLBACK_PATIENTS);

  const chunks = await runWithConcurrency(
    patientEntries,
    async ({ patient, patientId }) => {
      try {
        const { response, payload } = await fetchPatientMedicalReport(patientId);
        if (!response.ok) return [];

        const extracted = extractMedicalReportArray(payload);
        if (!extracted.length && payload && typeof payload === 'object') {
          extracted.push(payload);
        }

        return extracted
          .map((entry, index) => mapReport(
            {
              ...entry,
              patient: entry?.patient || patient,
              patientId: extractApiPatientId(entry) || extractApiPatientId({ patient: entry?.patient || patient }) || patientId,
              patientName: entry?.patientName
                || entry?.name
                || [patient?.firstName || patient?.first_name, patient?.lastName || patient?.last_name].filter(Boolean).join(' ').trim()
                || patient?.name
                || patient?.fullName,
            },
            index,
          ))
          .filter((entry) => entry?.reportId);
      } catch {
        return [];
      }
    },
  );

  return chunks.flat();
}

/**
 * Load normalized medical reports for the Reports page.
 * Uses list GET first; optional per-patient fallback only when the list route is unavailable.
 */
export async function loadMedicalReportsCatalog(mapReport) {
  const { response, payload } = await fetchMedicalReportList();

  if (response.ok) {
    const reports = extractMedicalReportArray(payload)
      .map((entry, index) => mapReport(entry, index))
      .filter((entry) => entry?.reportId);
    return dedupeReports(reports);
  }

  if (shouldUsePerPatientFallback(response, payload)) {
    const reports = await fetchReportsViaPatientFallback(mapReport);
    return dedupeReports(reports);
  }

  throw new Error(payload?.message || payload?.error || 'Unable to load generated medical reports.');
}

/** Patient profiles for report viewer enrichment — does not block the reports table. */
export async function loadPatientProfilesForReports() {
  try {
    const patients = await fetchAllPatients();
    const profileMap = {};
    (Array.isArray(patients) ? patients : []).forEach((patient) => {
      const id = extractApiPatientId(patient);
      if (id) profileMap[id] = patient;
    });
    return profileMap;
  } catch {
    return {};
  }
}
