import { apiFetch } from '../api';

const PATIENTS_PAGE_LIMIT = 100;
const FALLBACK_PAGE_SIZE = 20;
const MAX_PATIENT_PAGES = 50;

export function extractPatientList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.patients)) return payload.patients;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.patients)) return payload.data.patients;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function extractPaginationMeta(payload) {
  const sources = [
    payload,
    payload?.meta,
    payload?.pagination,
    payload?.pageInfo,
    payload?.data?.meta,
    payload?.data?.pagination,
    payload?.data?.pageInfo,
  ].filter(Boolean);

  const readNumber = (...keys) => {
    for (const source of sources) {
      for (const key of keys) {
        const value = source?.[key];
        if (value === null || value === undefined || value === '') continue;
        const parsed = Number(value);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return null;
  };

  const readBoolean = (...keys) => {
    for (const source of sources) {
      for (const key of keys) {
        const value = source?.[key];
        if (typeof value === 'boolean') return value;
      }
    }
    return null;
  };

  return {
    currentPage: readNumber('page', 'currentPage', 'pageNumber'),
    totalPages: readNumber('totalPages', 'pages', 'pageCount', 'lastPage'),
    nextPage: readNumber('nextPage'),
    pageSize: readNumber('limit', 'pageSize', 'perPage', 'per_page'),
    hasMore: readBoolean('hasMore', 'hasNextPage', 'more'),
  };
}

function buildPatientKey(patient, index) {
  return String(
    patient?._id
    || patient?.id
    || patient?.patientId
    || patient?.uuid
    || patient?.patientUuid
    || patient?.registrationNumber
    || patient?.regNo
    || `${patient?.firstName || ''}-${patient?.lastName || ''}-${index}`
  ).trim().toLowerCase();
}

async function fetchPatientsPage(page) {
  const response = await apiFetch(`/patients?page=${page}&limit=${PATIENTS_PAGE_LIMIT}`, { method: 'GET' });
  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Failed to load patients.');
  }

  return {
    items: extractPatientList(payload),
    meta: extractPaginationMeta(payload),
  };
}

export async function fetchAllPatients() {
  const firstPage = await fetchPatientsPage(1);
  const allPatients = [];
  const seenKeys = new Set();

  const appendPatients = (patientItems) => {
    patientItems.forEach((patient, index) => {
      const key = buildPatientKey(patient, index);
      if (!key || seenKeys.has(key)) return;
      seenKeys.add(key);
      allPatients.push(patient);
    });
  };

  appendPatients(firstPage.items);

  let currentPage = firstPage.meta.currentPage || 1;
  let totalPages = firstPage.meta.totalPages;
  let nextPage = firstPage.meta.nextPage;
  let hasMore = firstPage.meta.hasMore;
  let shouldProbeAdditionalPages = !totalPages && !nextPage && hasMore == null && firstPage.items.length === FALLBACK_PAGE_SIZE;

  for (let attempts = 0; attempts < MAX_PATIENT_PAGES; attempts += 1) {
    let targetPage = null;

    if (typeof nextPage === 'number' && nextPage > currentPage) {
      targetPage = nextPage;
    } else if (typeof totalPages === 'number' && currentPage < totalPages) {
      targetPage = currentPage + 1;
    } else if (hasMore === true) {
      targetPage = currentPage + 1;
    } else if (shouldProbeAdditionalPages) {
      targetPage = currentPage + 1;
    }

    if (!targetPage) break;

    const pageResult = await fetchPatientsPage(targetPage);
    const previousLength = allPatients.length;
    appendPatients(pageResult.items);

    currentPage = pageResult.meta.currentPage || targetPage;
    totalPages = pageResult.meta.totalPages || totalPages;
    nextPage = pageResult.meta.nextPage;
    hasMore = pageResult.meta.hasMore;
    shouldProbeAdditionalPages = !totalPages && !nextPage && hasMore == null && pageResult.items.length === FALLBACK_PAGE_SIZE;

    if (pageResult.items.length === 0 || allPatients.length === previousLength) {
      break;
    }

    if (!totalPages && !nextPage && hasMore == null && pageResult.items.length < FALLBACK_PAGE_SIZE) {
      break;
    }
  }

  return allPatients;
}