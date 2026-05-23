import { apiFetch } from '../api';

export function isLikelyMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim());
}

export function isUuidV4ish(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

/**
 * Patient id for PATCH/POST bodies (`patientId` field).
 * Backend accepts MongoDB `_id` (24 hex) or patient uuid — not registration numbers.
 */
export function resolvePatientMutationId(record, routeFallback = '') {
  if (!record || typeof record !== 'object') {
    const route = String(routeFallback || '').trim();
    if (isUuidV4ish(route) || isLikelyMongoObjectId(route)) return route;
    return '';
  }

  const candidates = [
    record.patientId,
    record.patientID,
    record.patient_id,
    record.uuid,
    record.patientUuid,
    record.patientUUID,
    record.recordId,
    record.patient?.patientId,
    record.patient?.patientID,
    record.patient?.patient_id,
    record.patient?.uuid,
    record.patient?.patientUuid,
    record.patient?.patientUUID,
    record.patient?._id,
    record._id,
    record.id,
    record.patient?.id,
  ];

  for (const value of candidates) {
    const normalized = String(value || '').trim();
    if (!normalized) continue;
    if (isUuidV4ish(normalized) || isLikelyMongoObjectId(normalized)) return normalized;
  }

  const route = String(routeFallback || '').trim();
  if (isUuidV4ish(route) || isLikelyMongoObjectId(route)) return route;
  return '';
}

/** Canonical patient id for `/patients/:patientId/*` routes — prefers uuid over Mongo `_id`. */
export function extractApiPatientId(record) {
  if (!record || typeof record !== 'object') return '';

  const explicitIds = [
    record.patientId,
    record.patientID,
    record.patient_id,
    record.uuid,
    record.patientUuid,
    record.patientUUID,
    record.patient?.patientId,
    record.patient?.patientID,
    record.patient?.patient_id,
    record.patient?.uuid,
    record.patient?.patientUuid,
    record.patient?.patientUUID,
  ];

  for (const value of explicitIds) {
    const normalized = String(value || '').trim();
    if (!normalized || isLikelyMongoObjectId(normalized)) continue;
    return normalized;
  }

  const nestedPatientId = String(record.patient?.id || '').trim();
  if (nestedPatientId && !isLikelyMongoObjectId(nestedPatientId)) return nestedPatientId;

  const topLevelId = String(record.id || '').trim();
  if (topLevelId && !isLikelyMongoObjectId(topLevelId)) return topLevelId;

  return '';
}

/** First MongoDB ObjectId (24 hex) on a patient or nurse record. */
export function extractMongoObjectId(record) {
  if (!record || typeof record !== 'object') return '';

  const fields = [
    record._id,
    record.recordId,
    record.patient?._id,
    record.patient?.id,
    record.nurse?._id,
    record.nurse?.id,
    record.id,
    record.patientId,
    record.nurseId,
  ];

  for (const value of fields) {
    const normalized = String(value || '').trim();
    if (isLikelyMongoObjectId(normalized)) return normalized;
  }
  return '';
}

/** Prefer Mongo `_id` for POST /assignments; UUID only if no Mongo id exists on the record. */
export function collectPatientAssignmentIds(record, routeFallback = '') {
  const mongoIds = [];
  const addMongo = (value) => {
    const normalized = String(value || '').trim();
    if (!isLikelyMongoObjectId(normalized) || mongoIds.includes(normalized)) return;
    mongoIds.push(normalized);
  };

  if (record && typeof record === 'object') {
    addMongo(record._id);
    addMongo(record.recordId);
    addMongo(record.patient?._id);
    addMongo(record.patient?.id);
    addMongo(record.id);
    addMongo(record.patientId);
    addMongo(record.patient_id);
    addMongo(record.nurse?._id);
  }

  addMongo(routeFallback);
  addMongo(extractMongoObjectId(record));

  if (mongoIds.length > 0) return mongoIds;

  const uuidIds = [];
  const addUuid = (value) => {
    const normalized = String(value || '').trim();
    if (!isUuidV4ish(normalized) || uuidIds.includes(normalized)) return;
    uuidIds.push(normalized);
  };

  if (record && typeof record === 'object') {
    addUuid(record.uuid);
    addUuid(record.patientUuid);
    addUuid(record.patientUUID);
    addUuid(record.patientId);
    addUuid(record.patient?.uuid);
    addUuid(extractApiPatientId(record));
  }

  addUuid(routeFallback);
  addUuid(resolvePatientMutationId(record, routeFallback));

  return uuidIds;
}

/** Mongo `_id` from a list of id candidates (e.g. nurse `idsForMatch`). */
export function resolveMongoIdFromCandidates(candidates) {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const value of list) {
    const normalized = String(value || '').trim();
    if (isLikelyMongoObjectId(normalized)) return normalized;
  }
  return '';
}

/** Resolve API patient id from a normalized medical report row. */
export function resolveMedicalReportPatientId(report) {
  if (!report || typeof report !== 'object') return '';

  const patient = (report.patient && typeof report.patient === 'object') ? report.patient : {};

  return extractApiPatientId(report)
    || extractApiPatientId({ patient })
    || extractApiPatientId(patient)
    || '';
}

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

  const totalPagesNum = Number(totalPages);
  if (Number.isFinite(totalPagesNum) && totalPagesNum > 1) {
    const maxPage = Math.min(Math.floor(totalPagesNum), MAX_PATIENT_PAGES);
    if (maxPage > 1) {
      const extraPageNums = [];
      for (let p = 2; p <= maxPage; p += 1) {
        extraPageNums.push(p);
      }
      const pageResults = await Promise.all(extraPageNums.map((pnum) => fetchPatientsPage(pnum)));
      pageResults.forEach((pageResult) => appendPatients(pageResult.items));
    }
    return allPatients;
  }

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