import { getUser } from '../api';
import {
  extractApiPatientId,
  isLikelyMongoObjectId,
  resolvePatientMutationId,
} from './patients';

const STORAGE_PREFIX = 'caresense.admissionDrafts';
const ALIAS_PREFIX = 'alias:';

function storageKey() {
  const user = getUser();
  const scope = String(
    user?.id
    || user?._id
    || user?.userId
    || user?.uuid
    || user?.email
    || 'default',
  ).trim();
  return `${STORAGE_PREFIX}:${scope}`;
}

function readStore() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(store));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('admission-drafts-changed'));
    }
  } catch {
    // ignore quota errors
  }
}

export function buildAdmissionPatientLabel(form) {
  const first = String(form?.personal?.firstName || '').trim();
  const last = String(form?.personal?.lastName || '').trim();
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  const reg = String(form?.personal?.registrationNumber || '').trim();
  return reg || 'Incomplete admission';
}

export function hasAdmissionFormContent(form) {
  if (!form || typeof form !== 'object') return false;
  const personal = form.personal || {};
  return Boolean(
    String(personal.registrationNumber || '').trim()
    || String(personal.firstName || '').trim()
    || String(personal.lastName || '').trim(),
  );
}

export function isPersistedAdmissionDraftId(patientId) {
  const id = String(patientId || '').trim();
  return Boolean(id) && !id.startsWith('draft-') && id !== '__pending__' && !id.startsWith(ALIAS_PREFIX);
}

export function collectAdmissionDraftLookupIds(patientId, extraIds = []) {
  const ids = new Set();
  const add = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized || !isPersistedAdmissionDraftId(normalized)) return;
    ids.add(normalized);
  };

  add(patientId);
  extraIds.forEach(add);
  return [...ids];
}

function resolveCanonicalDraft(store, lookupId) {
  const id = String(lookupId || '').trim();
  if (!id) return null;

  const direct = store[id];
  if (direct && !direct.aliasOf && direct.form) return direct;

  const alias = store[`${ALIAS_PREFIX}${id}`];
  if (alias?.aliasOf) {
    const canonical = store[alias.aliasOf];
    if (canonical && !canonical.aliasOf && canonical.form) return canonical;
  }

  return Object.values(store).find((entry) => {
    if (!entry || entry.aliasOf || !entry.form) return false;
    const keys = collectAdmissionDraftLookupIds(entry.patientId, entry.lookupIds || []);
    return keys.includes(id);
  }) || null;
}

export function listAdmissionDrafts() {
  const store = readStore();
  const seen = new Set();
  const results = [];

  Object.values(store).forEach((entry) => {
    if (!entry || entry.aliasOf || !isPersistedAdmissionDraftId(entry.patientId) || entry.admissionComplete === true) {
      return;
    }
    if (seen.has(entry.patientId)) return;
    seen.add(entry.patientId);
    results.push(entry);
  });

  return results.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

export function getAdmissionDraft(patientId) {
  const id = String(patientId || '').trim();
  if (!id) return null;
  const entry = resolveCanonicalDraft(readStore(), id);
  if (!entry || entry.admissionComplete === true) return null;
  return entry;
}

export function upsertAdmissionDraft({
  patientId,
  form,
  completedTabs = [],
  activeTab = 0,
  savedSections = [],
  lookupIds = [],
}) {
  const primaryId = String(patientId || '').trim();
  if (!primaryId || !isPersistedAdmissionDraftId(primaryId) || !form) return null;

  const store = readStore();
  const now = new Date().toISOString();
  const existing = resolveCanonicalDraft(store, primaryId) || store[primaryId] || {};

  const allLookupIds = collectAdmissionDraftLookupIds(primaryId, [
    ...(Array.isArray(lookupIds) ? lookupIds : []),
    ...(Array.isArray(existing.lookupIds) ? existing.lookupIds : []),
  ]);

  const entry = {
    patientId: primaryId,
    lookupIds: allLookupIds,
    form,
    completedTabs: Array.isArray(completedTabs) ? [...completedTabs] : [],
    activeTab: Number.isFinite(activeTab) ? activeTab : 0,
    savedSections: Array.isArray(savedSections) ? [...new Set(savedSections)] : [],
    patientName: buildAdmissionPatientLabel(form),
    registrationNumber: String(form?.personal?.registrationNumber || '').trim(),
    updatedAt: now,
    createdAt: existing.createdAt || now,
    admissionComplete: false,
  };

  allLookupIds.forEach((id) => {
    if (id === primaryId) {
      store[id] = entry;
    } else {
      store[`${ALIAS_PREFIX}${id}`] = { aliasOf: primaryId };
    }
  });

  writeStore(store);
  return entry;
}

export function removeAdmissionDraft(patientId) {
  const id = String(patientId || '').trim();
  if (!id) return;

  const store = readStore();
  const entry = resolveCanonicalDraft(store, id);
  if (!entry) return;

  const keysToRemove = collectAdmissionDraftLookupIds(entry.patientId, entry.lookupIds || []);
  keysToRemove.forEach((key) => {
    delete store[key];
    delete store[`${ALIAS_PREFIX}${key}`];
  });

  writeStore(store);
}

export function markAdmissionDraftComplete(patientId) {
  removeAdmissionDraft(patientId);
}
