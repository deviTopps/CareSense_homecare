import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Overlay from 'react-bootstrap/Overlay';
import { FiPlus, FiCalendar, FiUser, FiXCircle, FiCheckCircle, FiTrash2 } from '../icons/hugeicons-feather';
import DataTableHeader, { HospitalStatus } from '../components/DataTableHeader';
import TablePageLoader from '../components/TablePageLoader';
import { fetchAllPatients } from '../utils/patients';
import {
  apiFetch,
  cancelCareVisit,
  createCareVisit,
  deleteCareVisit,
  fetchAllCareVisits,
  fetchAuthUsers,
  fetchOtherCareVisits,
  fetchUpcomingCareVisits,
  getToken,
  getUser,
} from '../api';

const VISIT_FILTER_OPTIONS = ['All Visits', 'Up Coming Visits'];

function visitStatusLabel(status) {
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'completed') return 'Completed';
  if (status === 'scheduled') return 'Scheduled';
  return String(status || '—').replace(/-/g, ' ');
}

function visitStatusTone(status) {
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  if (status === 'scheduled') return 'info';
  return 'warning';
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice_weekly', label: 'Twice a week' },
  { value: 'biweekly', label: 'Once every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

/** Default dates / frequency for schedule form (patient & nurse from fetched lists). */
const SAMPLE_SCHEDULE_VISIT = {
  patientId: 'e426444d-02a0-4f90-90d4-930b1745f199',
  visitingNurse: 'cfcfc648-5d30-44ba-9c94-9d921d1b3d05',
  lastVisit: '2026-05-01',
  nextVisit: '2026-05-12',
  frequency: 'weekly',
};

function isIdLikeNurseValue(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  return UUID_RE.test(s) || isLikelyMongoId(s);
}

function parseJwtPayload(token) {
  const rawToken = String(token || '').trim();
  if (!rawToken) return null;
  try {
    const base64Url = rawToken.split('.')[1] || '';
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function collectSessionNurseIds() {
  const user = getUser();
  const token = parseJwtPayload(getToken());
  const ids = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !ids.includes(s)) ids.push(s);
  };
  push(user?.nurseId);
  push(user?.id);
  push(user?._id);
  push(user?.userId);
  push(user?.staffId);
  push(user?.uuid);
  push(token?.nurseId);
  push(token?.userId);
  push(token?.id);
  push(token?.sub);
  return ids;
}

function collectNurseRecordIds(n) {
  const out = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !out.includes(s)) out.push(s);
  };
  if (!n || typeof n !== 'object') return out;
  push(n.nurseId);
  push(n.uuid);
  push(n.userUuid);
  push(n.nurseUuid);
  push(n.id);
  push(n._id);
  push(n.userId);
  push(n.staffId);
  return out;
}

function isStaffRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'staff' || normalized === 'stuff';
}

function extractAuthUserArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function mapStaffUserToNurseShape(user) {
  const id = String(user?._id || user?.id || user?.userId || '').trim();
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
    || String(user?.name || user?.email || '').trim();
  return {
    _id: id,
    id,
    userId: id,
    firstName,
    lastName,
    name,
    email: user?.email || '',
    role: user?.role || 'staff',
    jobTitle: 'Staff',
    isStaff: true,
  };
}

function mergeNursesWithStaffUsers(nurseList, userList) {
  const nurses = Array.isArray(nurseList) ? [...nurseList] : [];
  const users = Array.isArray(userList) ? userList : [];

  const emailToAuthUserId = new Map();
  users.forEach((user) => {
    const email = String(user?.email || '').trim().toLowerCase();
    const authId = String(user?._id || user?.id || user?.userId || '').trim();
    if (email && authId) emailToAuthUserId.set(email, authId);
  });

  const mergedNurses = nurses.map((n) => {
    if (!isStaffRole(n?.role)) return n;
    const email = String(n?.email || '').trim().toLowerCase();
    const authUserId = email ? emailToAuthUserId.get(email) : '';
    if (!authUserId) return { ...n, isStaff: true };
    return {
      ...n,
      id: authUserId,
      _id: authUserId,
      userId: authUserId,
      isStaff: true,
    };
  });

  const knownEmails = new Set(
    mergedNurses.map((n) => String(n?.email || '').trim().toLowerCase()).filter(Boolean),
  );
  const knownIds = new Set();
  mergedNurses.forEach((n) => {
    collectNurseRecordIds(n).forEach((id) => knownIds.add(id));
  });

  const extraStaff = users
    .filter((user) => isStaffRole(user?.role))
    .filter((user) => {
      const email = String(user?.email || '').trim().toLowerCase();
      const id = String(user?._id || user?.id || user?.userId || '').trim();
      if (email && knownEmails.has(email)) return false;
      if (id && knownIds.has(id)) return false;
      return Boolean(id);
    })
    .map(mapStaffUserToNurseShape);

  return [...mergedNurses, ...extraStaff];
}

function pickDefaultVisitingNurseId(nurseOptions) {
  if (!Array.isArray(nurseOptions) || !nurseOptions.length) return '';
  const sessionIds = collectSessionNurseIds();
  for (const option of nurseOptions) {
    if (sessionIds.includes(option.apiId)) return option.apiId;
    if (Array.isArray(option.idsForMatch) && sessionIds.some((sid) => option.idsForMatch.includes(sid))) {
      return option.apiId;
    }
  }
  const sample = nurseOptions.find((o) => o.apiId === SAMPLE_SCHEDULE_VISIT.visitingNurse);
  return sample?.apiId || nurseOptions[0].apiId;
}

function isLikelyMongoId(s) {
  return /^[a-f\d]{24}$/i.test(String(s || ''));
}

function pickPatientApiId(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const keys = ['uuid', 'patientUuid', 'patientId', 'id', '_id'];
  const cands = keys.flatMap((k) => (raw[k] != null ? [String(raw[k]).trim()] : [])).filter(Boolean);
  const u = cands.find((x) => UUID_RE.test(x));
  if (u) return u;
  const nonMongo = cands.find((x) => !isLikelyMongoId(x));
  return nonMongo || cands[0] || '';
}

function pickVisitingNurseApiId(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const keys = ['uuid', 'userUuid', 'nurseUuid', 'nurseId', 'staffId', 'id', '_id', 'userId'];
  const cands = keys.flatMap((k) => (raw[k] != null ? [String(raw[k]).trim()] : [])).filter(Boolean);
  const u = cands.find((x) => UUID_RE.test(x));
  if (u) return u;
  const nonMongo = cands.find((x) => !isLikelyMongoId(x));
  return nonMongo || cands[0] || '';
}

function patientDisplayName(p) {
  const first = p?.firstName || '';
  const last = p?.lastName || '';
  const name = `${first} ${last}`.trim() || String(p?.name || '').trim();
  return name || 'Patient';
}

function isCareVisitPatientPlaceholder(label) {
  return /^patient\s*\([a-f0-9-]{4,}/i.test(String(label || '').trim());
}

function registerPatientNameAliases(patientNamesById, patientRecord, name) {
  const displayName = String(name || '').trim();
  if (!displayName || isCareVisitPatientPlaceholder(displayName)) return;

  const aliasSource = {
    patientId: pickPatientApiId(patientRecord),
    patient_id: patientRecord?.patientId,
    patient: patientRecord,
  };
  collectCareVisitPatientIds(aliasSource).forEach((id) => {
    patientNamesById.set(id, displayName);
    patientNamesById.set(String(id).toLowerCase(), displayName);
    const token = normalizeIdentityToken(id);
    if (token.length >= 6) {
      patientNamesById.set(token.slice(0, 8), displayName);
    }
  });
}

function resolvePatientLabelForVisit(raw, lookups) {
  const embedded = pickPatientLabelFromVisitRaw(raw);
  if (embedded && !isCareVisitPatientPlaceholder(embedded)) return embedded;

  const visitIds = expandCareVisitPatientIdentity(raw, embedded, lookups);
  for (const id of visitIds) {
    const direct =
      lookups?.patientNamesById?.get(id)
      || lookups?.patientNamesById?.get(String(id).toLowerCase())
      || lookups?.patientNamesById?.get(normalizeIdentityToken(id).slice(0, 8));
    if (direct && !isCareVisitPatientPlaceholder(direct)) return direct;
  }

  if (lookups?.patientNamesById) {
    for (const [registryId, name] of lookups.patientNamesById.entries()) {
      if (!name || isCareVisitPatientPlaceholder(name)) continue;
      const registryToken = normalizeIdentityToken(registryId);
      if (!registryToken) continue;
      for (const visitId of visitIds) {
        const visitToken = normalizeIdentityToken(visitId);
        if (!visitToken) continue;
        if (
          registryToken === visitToken
          || (visitToken.length >= 6 && registryToken.startsWith(visitToken.slice(0, 8)))
          || (registryToken.length >= 6 && visitToken.startsWith(registryToken.slice(0, 8)))
        ) {
          return name;
        }
      }
    }
  }

  return '';
}

/** Backend may send `visitingNurse` / `assignedNurse` as a populated object. */
function nurseDisplayFromObject(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return '';
  const nestedUser = o.user && typeof o.user === 'object' ? o.user : null;
  const nestedNurse = !nestedUser && o.nurse && typeof o.nurse === 'object' ? o.nurse : null;
  const src = nestedUser || nestedNurse || o;
  const composed = `${src.firstName || ''} ${src.lastName || ''}`.trim();
  return String(src.fullName || src.name || composed || '').trim();
}

function normalizeNurseIdString(nid) {
  if (nid == null || nid === '') return '';
  if (typeof nid === 'object') {
    const direct =
      pickVisitingNurseApiId(nid) ||
      String(nid.id ?? nid._id ?? nid.uuid ?? nid.userId ?? nid.nurseId ?? '').trim();
    if (direct) return direct;
    if (nid.nurse && typeof nid.nurse === 'object') return normalizeNurseIdString(nid.nurse);
    if (nid.user && typeof nid.user === 'object') return normalizeNurseIdString(nid.user);
    return '';
  }
  return String(nid).trim();
}

function formatYmdFromIsoInput(ymd) {
  if (!ymd || typeof ymd !== 'string') return '';
  const parts = ymd.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '';
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

function todayIsoDateLocal() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

const CARE_VISIT_DATE_CACHE_KEY = 'caresense.careVisitDates';

function readCareVisitDateCache() {
  try {
    const raw = localStorage.getItem(CARE_VISIT_DATE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCareVisitDateCache(cache) {
  try {
    localStorage.setItem(CARE_VISIT_DATE_CACHE_KEY, JSON.stringify(cache || {}));
  } catch {
    // ignore quota errors
  }
}

function careVisitOverrideKeys({ visitId, patientId, visitingNurse, patientName }) {
  const keys = new Set();
  const vid = String(visitId || '').trim();
  const pid = String(patientId || '').trim();
  const nid = String(visitingNurse || '').trim();
  const name = String(patientName || '').trim().toLowerCase();
  if (vid && !vid.startsWith('cv-')) keys.add(vid);
  if (pid && nid) keys.add(`${pid}::${nid}`);
  if (pid) keys.add(pid);
  if (name) keys.add(`name::${name}`);
  return [...keys];
}

function pickPatientLabelFromVisitRaw(raw) {
  if (!raw || typeof raw !== 'object') return '';
  let label = String(
    raw?.patientName ??
      raw?.patient_name ??
      raw?.patientFullName ??
      (typeof raw?.patient === 'string' ? raw.patient : ''),
  ).trim();
  if (!label && raw?.patient?.name) label = String(raw.patient.name).trim();
  if (!label && typeof raw?.patient === 'object' && raw.patient) {
    label =
      patientDisplayName({
        firstName: raw.patient.firstName,
        lastName: raw.patient.lastName,
        name: raw.patient.name,
      }) || '';
  }
  return label;
}

function nurseLabelFromVisitRaw(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const visitingRef = raw?.visitingNurse ?? raw?.visiting_nurse;
  const assignedRef = raw?.assignedNurse ?? raw?.assigned_nurse;
  if (visitingRef && typeof visitingRef === 'object') return nurseDisplayFromObject(visitingRef);
  if (assignedRef && typeof assignedRef === 'object') return nurseDisplayFromObject(assignedRef);
  if (raw?.nurse && typeof raw.nurse === 'object') return nurseDisplayFromObject(raw.nurse);
  return '';
}

function lookupCareVisitStatusOverride(lookups, keys) {
  if (!lookups?.visitStatusByKey) return '';
  for (const key of keys) {
    const hit = lookups.visitStatusByKey.get(String(key));
    if (hit) return hit;
  }
  return '';
}

function careVisitRowApiId(raw) {
  return String(
    raw?.id ?? raw?._id ?? raw?.uuid ?? raw?.visitId ?? raw?.careVisitId ?? raw?.care_visit_id ?? '',
  ).trim();
}

function collectCareVisitPatientIds(raw) {
  const ids = new Set();
  const push = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized) ids.add(normalized);
  };
  if (!raw || typeof raw !== 'object') return ids;
  push(raw.patientId);
  push(raw.patient_id);
  if (typeof raw.patient === 'string') {
    push(raw.patient);
  } else if (raw.patient && typeof raw.patient === 'object') {
    ['uuid', 'patientUuid', 'patientId', 'id', '_id'].forEach((key) => push(raw.patient[key]));
  }
  push(pickPatientApiId(raw.patient));
  push(pickPatientIdFromVisitRaw(raw));
  return ids;
}

function collectCareVisitNurseIds(raw) {
  const ids = new Set();
  const push = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized && !normalized.startsWith('[object')) ids.add(normalized);
  };
  if (!raw || typeof raw !== 'object') return ids;
  push(raw.nurseId);
  push(raw.nurse_id);
  push(raw.assignedNurseId);
  push(raw.assigned_nurse_id);
  const visitingRef = raw.visitingNurse ?? raw.visiting_nurse;
  const assignedRef = raw.assignedNurse ?? raw.assigned_nurse;
  if (typeof visitingRef === 'string') push(visitingRef);
  else if (visitingRef && typeof visitingRef === 'object') {
    collectNurseRecordIds(visitingRef).forEach(push);
    push(pickVisitingNurseApiId(visitingRef));
  }
  if (typeof assignedRef === 'string') push(assignedRef);
  else if (assignedRef && typeof assignedRef === 'object') {
    collectNurseRecordIds(assignedRef).forEach(push);
    push(pickVisitingNurseApiId(assignedRef));
  }
  if (raw.nurse && typeof raw.nurse === 'object') {
    collectNurseRecordIds(raw.nurse).forEach(push);
    push(pickVisitingNurseApiId(raw.nurse));
  }
  push(pickNurseIdFromVisitRaw(raw));
  return ids;
}

function parsePatientPlaceholderPrefix(label) {
  const match = String(label || '').trim().match(/^patient\s*\(([a-f0-9-]{6,})/i);
  if (!match) return '';
  return match[1].replace(/[^a-f0-9]/gi, '').toLowerCase();
}

function resolvePatientIdsFromDisplayName(name, lookups) {
  const ids = new Set();
  const normalized = String(name || '').trim().toLowerCase();
  if (!normalized || /^patient\s*\(/i.test(normalized)) return ids;
  if (!lookups?.patientNamesById) return ids;
  for (const [id, patientName] of lookups.patientNamesById.entries()) {
    if (String(patientName).trim().toLowerCase() === normalized) {
      ids.add(String(id).toLowerCase());
    }
  }
  return ids;
}

function normalizeIdentityToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-f0-9]/gi, '');
}

function identityTokensOverlap(leftIds, rightIds) {
  for (const left of leftIds) {
    for (const right of rightIds) {
      if (left === right) return true;
      const ln = normalizeIdentityToken(left);
      const rn = normalizeIdentityToken(right);
      if (ln.length >= 6 && rn.length >= 6 && (ln.startsWith(rn.slice(0, 8)) || rn.startsWith(ln.slice(0, 8)))) {
        return true;
      }
    }
  }
  return false;
}

function expandCareVisitPatientIdentity(raw, displayLine = '', lookups = null) {
  const ids = new Set(collectCareVisitPatientIds(raw));
  const labels = [
    displayLine,
    pickPatientLabelFromVisitRaw(raw),
  ].filter(Boolean);

  labels.forEach((label) => {
    const prefix = parsePatientPlaceholderPrefix(label);
    if (prefix) ids.add(prefix);
    resolvePatientIdsFromDisplayName(label, lookups).forEach((id) => ids.add(id));
  });

  return [...ids];
}

function careVisitPatientIdentityOverlaps(a, b, lookups = null, displayA = '', displayB = '') {
  const left = expandCareVisitPatientIdentity(a, displayA, lookups);
  const right = expandCareVisitPatientIdentity(b, displayB, lookups);
  if (identityTokensOverlap(left, right)) return true;

  const nameA = String(displayA || pickPatientLabelFromVisitRaw(a)).trim().toLowerCase();
  const nameB = String(displayB || pickPatientLabelFromVisitRaw(b)).trim().toLowerCase();
  return Boolean(
    nameA
    && nameB
    && nameA === nameB
    && !/^patient\s*\(/i.test(nameA),
  );
}

function careVisitNurseIdsOverlap(a, b) {
  const left = collectCareVisitNurseIds(a);
  const right = collectCareVisitNurseIds(b);
  if (!left.size && !right.size) return true;
  for (const id of left) {
    if (right.has(id)) return true;
  }
  const nameA = nurseLabelFromVisitRaw(a).toLowerCase();
  const nameB = nurseLabelFromVisitRaw(b).toLowerCase();
  if (nameA && nameB) return nameA === nameB;
  return !left.size || !right.size;
}

function careVisitDatesOverlap(a, b) {
  const nextA = normalizeVisitDateForUi(a?.nextVisit ?? a?.next_visit ?? '');
  const nextB = normalizeVisitDateForUi(b?.nextVisit ?? b?.next_visit ?? '');
  const lastA = normalizeVisitDateForUi(a?.lastVisit ?? a?.last_visit ?? '');
  const lastB = normalizeVisitDateForUi(b?.lastVisit ?? b?.last_visit ?? '');

  if (nextA && nextB) return nextA === nextB;
  if (!nextA && !nextB) return !lastA || !lastB || lastA === lastB;
  if (nextA && lastB) return nextA === lastB;
  if (nextB && lastA) return nextB === lastA;
  return false;
}

function careVisitRowsRepresentSameVisit(a, b, lookups = null, displayA = '', displayB = '') {
  if (!a || !b) return false;
  const idA = careVisitRowApiId(a);
  const idB = careVisitRowApiId(b);
  if (idA && idB && !idA.startsWith('cv-') && idA === idB) return true;
  if (!careVisitDatesOverlap(a, b)) return false;
  if (!careVisitPatientIdentityOverlaps(a, b, lookups, displayA, displayB)) return false;
  return careVisitNurseIdsOverlap(a, b);
}

function careVisitRowStableKey(raw, index = 0) {
  const id = careVisitRowApiId(raw);
  if (id && !id.startsWith('cv-')) return `id:${id}`;
  const assignmentKey = careVisitRowAssignmentKey(raw);
  if (assignmentKey) return `assign:${assignmentKey}`;
  const name = pickPatientLabelFromVisitRaw(raw).toLowerCase();
  const nurse = nurseLabelFromVisitRaw(raw).toLowerCase();
  const nextVisit = normalizeVisitDateForUi(raw?.nextVisit ?? raw?.next_visit ?? '');
  const lastVisit = normalizeVisitDateForUi(raw?.lastVisit ?? raw?.last_visit ?? '');
  if (name) return `name:${name}::${nurse}::${nextVisit || lastVisit}::${index}`;
  return `row:${index}`;
}

function careVisitRowAssignmentKey(raw) {
  const patientId = pickPatientIdFromVisitRaw(raw).toLowerCase();
  const nurseId = pickNurseIdFromVisitRaw(raw).toLowerCase();
  const nextVisit = normalizeVisitDateForUi(raw?.nextVisit ?? raw?.next_visit ?? '');
  const lastVisit = normalizeVisitDateForUi(raw?.lastVisit ?? raw?.last_visit ?? '');
  const date = nextVisit || lastVisit;
  if (!patientId) return '';
  if (nurseId) return `${patientId}::${nurseId}::${date}`;
  return `${patientId}::${date}`;
}

function careVisitRowLooseAssignmentKey(raw) {
  const patientId = pickPatientIdFromVisitRaw(raw).toLowerCase();
  const nurseId = pickNurseIdFromVisitRaw(raw).toLowerCase();
  if (!patientId || !nurseId) return '';
  return `${patientId}::${nurseId}`;
}

function careVisitRowRichnessScore(raw) {
  let score = 0;
  const id = careVisitRowApiId(raw);
  if (id && !id.startsWith('cv-')) score += 20;
  const patientLabel = pickPatientLabelFromVisitRaw(raw);
  if (patientLabel && !isCareVisitPatientPlaceholder(patientLabel)) score += 6;
  if (raw?.patient && typeof raw.patient === 'object') score += 4;
  if (nurseLabelFromVisitRaw(raw)) score += 2;
  if (normalizeVisitDateForUi(raw?.nextVisit ?? raw?.next_visit ?? '')) score += 1;
  if (normalizeVisitDateForUi(raw?.lastVisit ?? raw?.last_visit ?? '')) score += 1;
  if (raw?.frequency) score += 1;
  return score;
}

function mergeCareVisitRowPair(primary, secondary) {
  const richer = careVisitRowRichnessScore(secondary) > careVisitRowRichnessScore(primary)
    ? { ...primary, ...secondary }
    : { ...secondary, ...primary };
  return richer;
}

function mergeCareVisitRowLists(...lists) {
  const merged = [];

  function findMatch(row) {
    return merged.find((existing) => careVisitRowsRepresentSameVisit(existing, row)) || null;
  }

  lists.flat().forEach((row) => {
    if (!row || typeof row !== 'object') return;
    const hit = findMatch(row);
    if (hit) {
      const hitIndex = merged.indexOf(hit);
      const combined = mergeCareVisitRowPair(hit, row);
      if (hitIndex >= 0) merged[hitIndex] = combined;
      return;
    }
    merged.push(row);
  });

  return merged;
}

function mergeCareVisitRowListsWithLookups(rows, lookups) {
  if (!Array.isArray(rows) || !rows.length) return [];
  const merged = [];

  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    const hit = merged.find((existing) => careVisitRowsRepresentSameVisit(existing, row, lookups));
    if (hit) {
      const hitIndex = merged.indexOf(hit);
      const combined = mergeCareVisitRowPair(hit, row);
      if (hitIndex >= 0) merged[hitIndex] = combined;
      return;
    }
    merged.push(row);
  });

  return merged;
}

function pruneRedundantCareVisitCacheEntries(apiRows) {
  if (!Array.isArray(apiRows) || !apiRows.length) return;
  const cache = readCareVisitDateCache();
  let changed = false;

  apiRows.forEach((row) => {
    const cacheKeys = careVisitOverrideKeys({
      visitId: careVisitRowApiId(row),
      patientId: pickPatientIdFromVisitRaw(row),
      visitingNurse: pickNurseIdFromVisitRaw(row),
      patientName: pickPatientLabelFromVisitRaw(row),
    });

    cacheKeys.forEach((key) => {
      const entry = cache[key];
      if (!entry || entry.status) return;

      const apiNext = normalizeVisitDateForUi(row?.nextVisit ?? row?.next_visit ?? '');
      const apiLast = normalizeVisitDateForUi(row?.lastVisit ?? row?.last_visit ?? '');
      const cacheNext = normalizeVisitDateForUi(entry?.nextVisit ?? '');
      const cacheLast = normalizeVisitDateForUi(entry?.lastVisit ?? '');
      const datesMatch =
        (!cacheNext || !apiNext || cacheNext === apiNext)
        && (!cacheLast || !apiLast || cacheLast === apiLast);

      if (datesMatch) {
        delete cache[key];
        changed = true;
      }
    });
  });

  if (changed) writeCareVisitDateCache(cache);
}

function mergeCareVisitRowsWithCacheFallback(baseRows) {
  const base = mergeCareVisitRowLists(baseRows);
  if (base.length > 0) {
    pruneRedundantCareVisitCacheEntries(base);
  }
  const supplemental = base.length === 0
    ? buildSupplementalRowsFromCache(readCareVisitDateCache(), base)
    : [];
  return applyCachedOverridesToRows(mergeCareVisitRowLists(base, supplemental));
}

function mappedCareVisitRichnessScore(row) {
  let score = careVisitRowRichnessScore(row?.raw || {});
  const patientLine = String(row?.patientLine || row?.patient || '').trim();
  if (patientLine && !/^patient\s*\(/i.test(patientLine)) score += 10;
  if (row?.nurseName && row.nurseName !== '—') score += 10;
  if (row?.address) score += 2;
  return score;
}

function mappedCareVisitsRepresentSameVisit(a, b, lookups) {
  const rawA = a?.raw || {};
  const rawB = b?.raw || {};
  const displayA = a?.patientLine || a?.patient || '';
  const displayB = b?.patientLine || b?.patient || '';

  if (careVisitRowsRepresentSameVisit(rawA, rawB, lookups, displayA, displayB)) return true;

  const nextA = a?.nextVisit || '';
  const nextB = b?.nextVisit || '';
  const prevA = a?.prevVisit || '';
  const prevB = b?.prevVisit || '';
  if (!nextA || nextA !== nextB || prevA !== prevB) return false;

  return careVisitPatientIdentityOverlaps(rawA, rawB, lookups, displayA, displayB);
}

function dedupeMappedCareVisits(rows, lookups = null) {
  if (!Array.isArray(rows) || !rows.length) return [];
  const result = [];
  rows.forEach((row) => {
    const hit = result.find((existing) => mappedCareVisitsRepresentSameVisit(existing, row, lookups));
    if (hit) {
      const hitIndex = result.indexOf(hit);
      if (hitIndex >= 0) {
        result[hitIndex] = mappedCareVisitRichnessScore(row) > mappedCareVisitRichnessScore(hit)
          ? row
          : hit;
      }
      return;
    }
    result.push(row);
  });
  return result;
}

function filterPlaceholderCareVisitRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.filter((row) => !isCareVisitPatientPlaceholder(row.patientLine));
}

function buildSupplementalRowsFromCache(cache, existingRows) {
  if (!cache || typeof cache !== 'object') return [];
  const existingKeys = new Set();
  existingRows.forEach((row, index) => {
    careVisitOverrideKeys({
      visitId: row?.id ?? row?._id ?? row?.visitId ?? row?.careVisitId ?? `cv-${index}`,
      patientId: pickPatientIdFromVisitRaw(row),
      visitingNurse: pickNurseIdFromVisitRaw(row),
      patientName: pickPatientLabelFromVisitRaw(row),
    }).forEach((key) => existingKeys.add(key));

    const nextVisit = normalizeVisitDateForUi(row?.nextVisit ?? row?.next_visit ?? '');
    const lastVisit = normalizeVisitDateForUi(row?.lastVisit ?? row?.last_visit ?? '');
    const patientIds = collectCareVisitPatientIds(row);
    const nurseIds = collectCareVisitNurseIds(row);
    patientIds.forEach((patientId) => {
      existingKeys.add(patientId);
      nurseIds.forEach((nurseId) => {
        existingKeys.add(`${patientId}::${nurseId}`);
        existingKeys.add(`${patientId}::${nurseId}::${nextVisit || lastVisit}`);
      });
    });
  });

  const supplemental = [];
  const seen = new Set();
  for (const [key, entry] of Object.entries(cache)) {
    if (!entry || typeof entry !== 'object') continue;
    if (key.startsWith('name::') || key.startsWith('cv-')) continue;
    if (existingKeys.has(key)) continue;
    if (!entry.nextVisit && !entry.lastVisit) continue;

    let patientId = '';
    let visitingNurse = '';
    if (key.includes('::')) {
      [patientId, visitingNurse] = key.split('::');
    } else {
      patientId = key;
    }
    if (!patientId) continue;

    const dedupeKey = `${patientId}::${visitingNurse}::${entry.nextVisit || entry.lastVisit || ''}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    supplemental.push({
      patientId,
      visitingNurse,
      visiting_nurse: visitingNurse,
      lastVisit: entry.lastVisit || '',
      nextVisit: entry.nextVisit || '',
      frequency: entry.frequency || 'weekly',
      status: entry.status || 'scheduled',
    });
  }
  return supplemental;
}

function isUpcomingVisitRow(v) {
  if (v.status === 'cancelled' || v.status === 'completed') return false;
  if (!v.nextVisit) return true;
  const t = new Date(`${v.nextVisit}T12:00:00`).getTime();
  if (Number.isNaN(t)) return true;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return t >= start.getTime();
}

function applyCachedOverridesToRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return rows;
  const cache = readCareVisitDateCache();
  return rows.map((row, i) => {
    const keys = careVisitOverrideKeys({
      visitId: row?.id ?? row?._id ?? row?.visitId ?? row?.careVisitId ?? `cv-${i}`,
      patientId: pickPatientIdFromVisitRaw(row),
      visitingNurse: pickNurseIdFromVisitRaw(row),
      patientName: pickPatientLabelFromVisitRaw(row),
    });
    for (const key of keys) {
      const entry = cache[key];
      if (entry?.status) {
        return { ...row, status: normalizeStatus(entry.status) };
      }
    }
    return row;
  });
}

function saveCareVisitOverride({
  visitId,
  patientId,
  visitingNurse,
  patientName,
  lastVisit,
  nextVisit,
  frequency,
  status,
}) {
  const cache = readCareVisitDateCache();
  const keys = careVisitOverrideKeys({ visitId, patientId, visitingNurse, patientName });
  keys.forEach((key) => {
    const prev = cache[key] && typeof cache[key] === 'object' ? cache[key] : {};
    cache[key] = {
      ...prev,
      ...(lastVisit != null && lastVisit !== ''
        ? { lastVisit: normalizeVisitDateForUi(lastVisit) || '' }
        : {}),
      ...(nextVisit != null && nextVisit !== ''
        ? { nextVisit: normalizeVisitDateForUi(nextVisit) || '' }
        : {}),
      ...(frequency ? { frequency } : {}),
      ...(status ? { status: normalizeStatus(status) } : {}),
      updatedAt: new Date().toISOString(),
    };
  });
  writeCareVisitDateCache(cache);
}

function removeCareVisitOverride({ visitId, patientId, visitingNurse, patientName }) {
  const cache = readCareVisitDateCache();
  const keys = careVisitOverrideKeys({ visitId, patientId, visitingNurse, patientName });
  let changed = false;
  keys.forEach((key) => {
    if (cache[key]) {
      delete cache[key];
      changed = true;
    }
  });
  if (changed) writeCareVisitDateCache(cache);
}

function careVisitRowMatchesTarget(rawRow, rowIndex, target) {
  const targetRaw = target?.raw && typeof target.raw === 'object' ? target.raw : {};
  const rowId = String(
    rawRow?.id ?? rawRow?._id ?? rawRow?.uuid ?? rawRow?.visitId ?? rawRow?.careVisitId ?? '',
  ).trim();
  const targetId = String(target?.id || '').trim();

  if (targetId && rowId && !targetId.startsWith('cv-') && targetId === rowId) return true;

  if (targetId.startsWith('cv-') && targetId === `cv-${rowIndex}`) {
    const targetName = String(target?.patientLine || target?.patient || '').trim().toLowerCase();
    const rowName = pickPatientLabelFromVisitRaw(rawRow).toLowerCase();
    if (targetName && rowName && targetName === rowName) return true;
  }

  const rowPatient = pickPatientIdFromVisitRaw(rawRow);
  const rowNurse = pickNurseIdFromVisitRaw(rawRow);
  const targetPatient = pickPatientIdFromVisitRaw(targetRaw);
  const targetNurse = pickNurseIdFromVisitRaw(targetRaw);

  if (rowPatient && targetPatient && rowPatient === targetPatient) {
    if (rowNurse && targetNurse) return rowNurse === targetNurse;
    return true;
  }

  const targetName = String(target?.patientLine || target?.patient || '').trim().toLowerCase();
  const rowName = pickPatientLabelFromVisitRaw(rawRow).toLowerCase();
  if (targetName && rowName && targetName === rowName) {
    const targetNurseName = String(target?.nurseName || '').trim().toLowerCase();
    const rowNurseName = nurseLabelFromVisitRaw(rawRow).toLowerCase();
    if (!targetNurseName || !rowNurseName || rowNurseName === targetNurseName) return true;
  }

  return false;
}

function lookupCachedCareVisitDates(lookups, keys) {
  if (!lookups?.visitDatesById) return null;
  for (const key of keys) {
    const hit = lookups.visitDatesById.get(String(key));
    if (hit) return hit;
  }
  return null;
}

/** Next visit YYYY-MM-DD from a completed visit date and recurrence (for date inputs). */
function computeNextVisitIso(visitYmd, frequency) {
  if (!visitYmd || typeof visitYmd !== 'string') return '';
  const parts = visitYmd.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return '';
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return '';
  switch (frequency) {
    case 'weekly':
      dt.setDate(dt.getDate() + 7);
      break;
    case 'twice_weekly':
      dt.setDate(dt.getDate() + 3);
      break;
    case 'biweekly':
      dt.setDate(dt.getDate() + 14);
      break;
    case 'monthly':
      dt.setMonth(dt.getMonth() + 1);
      break;
    default:
      dt.setDate(dt.getDate() + 7);
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Parse backend strings like `1-5-2026` or ISO dates to `YYYY-MM-DD` for display/sorting */
function normalizeVisitDateForUi(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  if (typeof value === 'object') {
    if (value.$date != null) return normalizeVisitDateForUi(value.$date);
    return normalizeVisitDateForUi(value.date ?? value.iso ?? value.value ?? '');
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) {
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    }
  }

  const s = String(value).trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\b|T|$)/;
  const im = iso.exec(s);
  if (im) {
    const y = Number(im[1]);
    const mo = Number(im[2]);
    const d = Number(im[3]);
    const dt = new Date(y, mo - 1, d);
    if (!Number.isNaN(dt.getTime())) return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const bits = s.split(/[-/]/).map((x) => parseInt(x, 10));
  if (bits.length === 3 && bits.every((n) => Number.isFinite(n))) {
    let d = bits[0];
    let mo = bits[1];
    let y = bits[2];
    if (d > 31) {
      y = bits[0];
      mo = bits[1];
      d = bits[2];
    }
    const dt = new Date(y, mo - 1, d);
    if (!Number.isNaN(dt.getTime()))
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const guess = new Date(s);
  if (!Number.isNaN(guess.getTime())) {
    return `${guess.getFullYear()}-${String(guess.getMonth() + 1).padStart(2, '0')}-${String(guess.getDate()).padStart(2, '0')}`;
  }
  return '';
}

function resolveCareVisitDates(raw, lookups, { visitId, patientId, nurseId, patientName } = {}) {
  let visitStatus = normalizeStatus(raw?.status ?? raw?.state);
  const frequencyKey = normalizeFrequencyForForm(raw);

  let prevVisit = firstNormalizedVisitDate(
    raw?.lastVisit,
    raw?.last_visit,
    raw?.previousVisit,
    raw?.previous_visit,
    raw?.prevVisit,
    raw?.lastVisitDate,
    raw?.last_visit_date,
    visitStatus === 'completed' ? raw?.visitDate : null,
    visitStatus === 'completed' ? raw?.visit_date : null,
    visitStatus === 'completed' ? raw?.completedAt : null,
    visitStatus === 'completed' ? raw?.completed_at : null,
  );

  let nextVisit = firstNormalizedVisitDate(
    raw?.nextVisit,
    raw?.next_visit,
    raw?.nextVisitDate,
    raw?.next_visit_date,
    raw?.scheduledDate,
    raw?.scheduled_date,
    raw?.scheduledFor,
    raw?.scheduled_for,
    raw?.appointmentDate,
    raw?.appointment_date,
    raw?.upcomingVisit,
    raw?.upcoming_visit,
    raw?.upcomingDate,
    raw?.upcoming_date,
  );

  if (!nextVisit && visitStatus !== 'completed') {
    nextVisit = firstNormalizedVisitDate(raw?.visitDate, raw?.visit_date);
  }

  const cacheKeys = careVisitOverrideKeys({
    visitId,
    patientId,
    visitingNurse: nurseId,
    patientName,
  });
  const cached = lookupCachedCareVisitDates(lookups, cacheKeys);
  if (cached?.lastVisit) prevVisit = cached.lastVisit;
  if (cached?.nextVisit) {
    nextVisit = cached.nextVisit;
  } else if (cached?.lastVisit && !nextVisit) {
    nextVisit = computeNextVisitIso(cached.lastVisit, cached.frequency || frequencyKey);
  }
  const statusOverride = lookupCareVisitStatusOverride(lookups, cacheKeys);
  if (statusOverride) {
    visitStatus = statusOverride;
  } else if (cached?.status) {
    visitStatus = normalizeStatus(cached.status);
  }

  if (!nextVisit && prevVisit && visitStatus !== 'cancelled') {
    nextVisit = computeNextVisitIso(prevVisit, frequencyKey);
  }

  if (nextVisit && prevVisit && nextVisit <= prevVisit) {
    const computed = computeNextVisitIso(prevVisit, frequencyKey);
    if (computed && computed > prevVisit) nextVisit = computed;
  }

  return { prevVisit, nextVisit, visitStatus, frequencyKey };
}

function firstNormalizedVisitDate(...values) {
  for (const value of values) {
    const normalized = normalizeVisitDateForUi(value);
    if (normalized) return normalized;
  }
  return '';
}

function formatVisitDateDisplay(ymd) {
  if (!ymd) return '—';
  const dt = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function extractCareVisitsList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return mergeCareVisitRowLists(payload);

  const LIST_KEYS = [
    'data',
    'visits',
    'items',
    'results',
    'records',
    'careVisits',
    'care_visits',
    'all',
    'allVisits',
    'all_visits',
    'upcoming',
    'upcomingVisits',
    'upcoming_visits',
    'other',
    'otherVisits',
    'other_visits',
    'history',
    'past',
    'rows',
    'list',
    'content',
    'payload',
    'value',
  ];

  const collected = [];
  const collectFromObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const key of LIST_KEYS) {
      const value = obj[key];
      if (Array.isArray(value) && value.length) {
        collected.push(...value);
      }
    }
  };

  collectFromObject(payload);
  if (payload?.data != null && typeof payload.data === 'object') {
    collectFromObject(payload.data);
  }

  if (Array.isArray(payload?.edges) && payload.edges.length) {
    collected.push(...payload.edges.map((edge) => edge?.node).filter(Boolean));
  }

  if (collected.length) {
    return mergeCareVisitRowLists(collected);
  }

  if (typeof payload === 'object' && !Array.isArray(payload) && isCareVisitLikeRow(payload)) {
    return [payload];
  }

  return [];
}

function isCareVisitLikeRow(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  return (
    ['patientId', 'patient_id', 'nextVisit', 'next_visit', 'lastVisit', 'visitingNurse', 'nurseId'].some(
      (k) => o[k] !== undefined && o[k] !== null && o[k] !== '',
    ) || (o.patient && typeof o.patient === 'object')
  );
}

function normalizeStatus(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
  if (!s) return 'scheduled';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('completed') || s === 'done' || s === 'complete') return 'completed';
  if (s.includes('progress') || s === 'in-progress') return 'in-progress';
  if (s === 'active' || s === 'pending') return 'scheduled';
  if (s.includes('schedul')) return 'scheduled';
  if (s.includes('upcoming')) return 'scheduled';
  return 'scheduled';
}

function pickPatientIdFromVisitRaw(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const id =
    raw.patientId ??
    raw.patient_id ??
    pickPatientApiId(raw.patient) ??
    '';
  return String(id || '').trim();
}

function pickNurseIdFromVisitRaw(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const visitingRef = raw.visitingNurse ?? raw.visiting_nurse;
  const assignedRef = raw.assignedNurse ?? raw.assigned_nurse;
  if (visitingRef != null && visitingRef !== '') {
    if (typeof visitingRef === 'object') return normalizeNurseIdString(visitingRef);
    return String(visitingRef).trim();
  }
  if (assignedRef != null && assignedRef !== '') {
    if (typeof assignedRef === 'object') return normalizeNurseIdString(assignedRef);
    return String(assignedRef).trim();
  }
  return normalizeNurseIdString(
    raw.nurseId ?? raw.nurse_id ?? raw.assignedNurseId ?? raw.assigned_nurse_id ?? raw.nurse ?? '',
  );
}

function normalizeFrequencyForForm(raw) {
  const source =
    typeof raw === 'string'
      ? raw
      : raw?.frequency
        ?? raw?.visitFrequency
        ?? raw?.visit_frequency
        ?? raw?.recurrence?.frequency
        ?? raw?.schedule?.frequency
        ?? raw?.repeatFrequency
        ?? raw?.repeat_frequency
        ?? 'weekly';
  const f = String(source)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
  if (FREQUENCY_OPTIONS.some((o) => o.value === f)) return f;
  if (f.includes('twice') && f.includes('week')) return 'twice_weekly';
  if (f.includes('biweekly') || f.includes('every_2') || f.includes('2_week') || f.includes('fortnight')) return 'biweekly';
  if (f.includes('month')) return 'monthly';
  if (f.includes('week')) return 'weekly';
  return 'weekly';
}

function formatFrequencyDisplay(raw) {
  const normalized = normalizeFrequencyForForm(raw);
  const option = FREQUENCY_OPTIONS.find((o) => o.value === normalized);
  if (option) return option.label;

  const rawValue =
    typeof raw === 'string'
      ? raw
      : raw?.frequency
        ?? raw?.visitFrequency
        ?? raw?.visit_frequency
        ?? raw?.recurrence?.frequency
        ?? '';
  const text = String(rawValue || '').trim().replace(/_/g, ' ');
  if (!text || text === '—') return '—';
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Map a table row (with .raw) into schedule form fields for "Update visit". */
function scheduleFormFromVisitRow(v) {
  const raw = v?.raw && typeof v.raw === 'object' ? v.raw : {};
  return {
    patientId: pickPatientIdFromVisitRaw(raw),
    visitingNurse: pickNurseIdFromVisitRaw(raw),
    lastVisit: v?.prevVisit || '',
    nextVisit: v?.nextVisit || '',
    frequency: v?.frequencyKey ?? normalizeFrequencyForForm(raw),
  };
}

/** API payload fields from an existing visit row (may be id or name). */
function visitApiFieldsFromRow(v) {
  const raw = v?.raw && typeof v.raw === 'object' ? v.raw : {};
  const visitingRef = raw?.visitingNurse ?? raw?.visiting_nurse;
  const assignedRef = raw?.assignedNurse ?? raw?.assigned_nurse;
  let visitingNurse = pickNurseIdFromVisitRaw(raw);

  if (!visitingNurse && typeof visitingRef === 'string') visitingNurse = visitingRef.trim();
  if (!visitingNurse && typeof assignedRef === 'string') visitingNurse = assignedRef.trim();
  return {
    patientId: pickPatientIdFromVisitRaw(raw),
    visitingNurse: String(visitingNurse || '').trim(),
  };
}

function mapCareVisitRow(raw, index, lookups) {
  const idSrc =
    raw?.id ?? raw?._id ?? raw?.uuid ?? raw?.visitId ?? raw?.careVisitId ?? raw?.care_visit_id ?? `cv-${index}`;

  const pid = pickPatientIdFromVisitRaw(raw);

  let embeddedNurseName = '';
  const visitingRef = raw?.visitingNurse ?? raw?.visiting_nurse;
  const assignedRef = raw?.assignedNurse ?? raw?.assigned_nurse;

  let nid = '';
  if (visitingRef != null && visitingRef !== '') {
    if (typeof visitingRef === 'object') {
      embeddedNurseName = nurseDisplayFromObject(visitingRef) || embeddedNurseName;
      nid = normalizeNurseIdString(visitingRef);
    } else {
      nid = String(visitingRef).trim();
    }
  }
  if (!nid && assignedRef != null && assignedRef !== '') {
    if (typeof assignedRef === 'object') {
      if (!embeddedNurseName) embeddedNurseName = nurseDisplayFromObject(assignedRef) || embeddedNurseName;
      nid = normalizeNurseIdString(assignedRef);
    } else {
      nid = String(assignedRef).trim();
    }
  }
  if (!nid) {
    nid = normalizeNurseIdString(
      raw?.nurseId ??
        raw?.nurse_id ??
        raw?.assignedNurseId ??
        raw?.assigned_nurse_id ??
        raw?.nurse?.id ??
        raw?.nurse?._id ??
        raw?.nurse?.uuid ??
        '',
    );
  }

  const patientLabel = resolvePatientLabelForVisit(raw, lookups);

  const addrSrc =
    raw?.address ??
    raw?.patient?.residentialAddress ??
    raw?.patient?.address ??
    raw?.patientAddress ??
    '';

  const addrTrim = String(addrSrc ?? '').trim();
  /** Avoid showing a lone em dash when address is unknown. */
  const addressUi = addrTrim && addrTrim !== '—' ? addrTrim : '';

  const {
    prevVisit,
    nextVisit,
    visitStatus: resolvedStatus,
    frequencyKey,
  } = resolveCareVisitDates(raw, lookups, {
    visitId: String(idSrc),
    patientId: String(pid || '').trim(),
    nurseId: String(nid || '').trim(),
    patientName: patientLabel,
  });

  let nurseHint = embeddedNurseName;
  if (!nurseHint && nid) {
    nurseHint =
      lookups.nurseNamesById.get(String(nid)) ||
      lookups.nurseNamesById.get(String(nid).toLowerCase()) ||
      '';
  }
  if (!nurseHint && raw?.nurse && typeof raw.nurse === 'object') {
    nurseHint = nurseDisplayFromObject(raw.nurse) || nurseHint;
  }

  const idTail = nid && !String(nid).startsWith('[object ') ? `${String(nid).slice(0, 8)}…` : '';
  const nurseName = String(nurseHint || '').trim() || (idTail ? `Nurse (${idTail})` : '—');
  const frequencyLabel = formatFrequencyDisplay(raw);

  return {
    id: String(idSrc),
    patient: patientLabel,
    patientLine: patientLabel,
    date: nextVisit || prevVisit || '',
    time: String(raw?.time ?? raw?.visitTime ?? raw?.scheduledTime ?? raw?.scheduled_time ?? '—'),
    duration: String(raw?.duration ?? raw?.visitDuration ?? raw?.visit_duration ?? '—'),
    type: String(raw?.visitType ?? raw?.visit_type ?? 'Care visit'),
    frequency: frequencyLabel,
    frequencyKey,
    prevVisit,
    nextVisit,
    nurseName,
    status: resolvedStatus,
    address: addressUi,
    raw,
  };
}

/** Portals the menu to document.body so it is not clipped by .table-responsive or layout transforms. */
function CareVisitRowActions({ visit, onMarkCompleted, onOpenUpdate, onRequestCancel, onRequestDelete }) {
  const toggleRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [overlayContainer, setOverlayContainer] = useState(null);
  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    setOverlayContainer(document.body);
  }, []);

  return (
    <div className="care-visits-actions-dropdown patients-row-actions d-inline-flex">
      <Button
        ref={toggleRef}
        variant="light"
        size="sm"
        id={`care-visit-actions-${visit.id}`}
        type="button"
        className="cv-actions-dropdown-toggle patients-row-actions__toggle dropdown-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${visit.patientLine || visit.patient || 'visit'}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span>Actions</span>
      </Button>
      <Overlay
        show={open && overlayContainer}
        target={toggleRef}
        placement="bottom-end"
        rootClose
        rootCloseEvent="click"
        flip
        transition={false}
        offset={[0, 6]}
        container={overlayContainer}
        popperConfig={{ strategy: 'fixed' }}
        onHide={close}
      >
        {({ ref: menuRef, style, className: popperClassName }) => (
          <div
            ref={menuRef}
            role="menu"
            aria-labelledby={`care-visit-actions-${visit.id}`}
            style={style}
            className={`dropdown-menu care-visits-actions-menu show dropdown-menu-end${popperClassName ? ` ${popperClassName}` : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="dropdown-item small"
              onClick={() => {
                close();
                onMarkCompleted(visit);
              }}
            >
              Mark as Completed
            </button>
            <button
              type="button"
              role="menuitem"
              className="dropdown-item small"
              onClick={() => {
                close();
                onOpenUpdate(visit);
              }}
            >
              Update Visit
            </button>
            <hr className="dropdown-divider" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="dropdown-item small text-danger"
              onClick={() => {
                close();
                window.setTimeout(() => onRequestCancel(visit), 0);
              }}
            >
              Cancel visit
            </button>
            <button
              type="button"
              role="menuitem"
              className="dropdown-item small text-danger"
              onClick={() => {
                close();
                window.setTimeout(() => onRequestDelete(visit), 0);
              }}
            >
              Delete visit
            </button>
          </div>
        )}
      </Overlay>
    </div>
  );
}

export default function Scheduling() {
  const navigate = useNavigate();
  const onUnauthorized = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const [upcomingVisitRowsRaw, setUpcomingVisitRowsRaw] = useState([]);
  const [otherVisitRowsRaw, setOtherVisitRowsRaw] = useState([]);
  const [visitsUpcomingLoading, setVisitsUpcomingLoading] = useState(true);
  const [visitsOtherLoading, setVisitsOtherLoading] = useState(true);
  const [visitsUpcomingError, setVisitsUpcomingError] = useState('');
  const [visitsOtherError, setVisitsOtherError] = useState('');

  const [patientsRaw, setPatientsRaw] = useState([]);
  const [nursesRaw, setNursesRaw] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [refsError, setRefsError] = useState('');

  const [filter, setFilter] = useState('All Visits');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [completeVisitRow, setCompleteVisitRow] = useState(null);
  const [completeVisitForm, setCompleteVisitForm] = useState({
    visitDate: '',
    frequency: 'weekly',
    nextVisit: '',
  });
  const [completeVisitSaving, setCompleteVisitSaving] = useState(false);
  const [completeVisitError, setCompleteVisitError] = useState('');

  const [scheduleForm, setScheduleForm] = useState(() => ({
    patientId: '',
    visitingNurse: '',
    lastVisit: SAMPLE_SCHEDULE_VISIT.lastVisit,
    nextVisit: SAMPLE_SCHEDULE_VISIT.nextVisit,
    frequency: SAMPLE_SCHEDULE_VISIT.frequency,
  }));
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccessModal, setScheduleSuccessModal] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [visitDateCacheVersion, setVisitDateCacheVersion] = useState(0);
  const [visitStatusOverrides, setVisitStatusOverrides] = useState({});

  const lookups = useMemo(() => {
    const patientNamesById = new Map();
    for (const p of patientsRaw) {
      registerPatientNameAliases(patientNamesById, p, patientDisplayName(p));
    }
    const nurseNamesById = new Map();
    for (const n of nursesRaw) {
      const id = pickVisitingNurseApiId(n);
      const first = n?.firstName || '';
      const last = n?.lastName || '';
      const name = String(n?.name || `${first} ${last}`.trim()).trim();
      const key = String(id || '').trim();
      if (key && name) {
        nurseNamesById.set(key, name);
        nurseNamesById.set(key.toLowerCase(), name);
      }
    }
    const visitDatesById = new Map();
    const visitStatusByKey = new Map();
    const cache = readCareVisitDateCache();
    Object.entries(cache).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        visitDatesById.set(key, value);
        if (value.status) visitStatusByKey.set(key, normalizeStatus(value.status));
      }
    });
    Object.entries(visitStatusOverrides).forEach(([key, status]) => {
      if (status) visitStatusByKey.set(key, normalizeStatus(status));
    });
    return { patientNamesById, nurseNamesById, visitDatesById, visitStatusByKey };
  }, [patientsRaw, nursesRaw, visitDateCacheVersion, visitStatusOverrides]);

  const patientOptions = useMemo(() => {
    return patientsRaw
      .map((p, i) => {
        const apiId = pickPatientApiId(p);
        const label = patientDisplayName(p);
        return { apiId, label, key: `${apiId || label}-${i}` };
      })
      .filter((o) => o.apiId && o.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [patientsRaw]);

  const nurseOptions = useMemo(() => {
    return nursesRaw
      .map((n, i) => {
        const apiId = pickVisitingNurseApiId(n);
        const first = n?.firstName || '';
        const last = n?.lastName || '';
        const name = String(n?.name || `${first} ${last}`.trim()).trim();
        const role = isStaffRole(n?.role) || n?.isStaff
          ? 'Staff'
          : String(n?.jobTitle || n?.specialisation || n?.specialization || '').trim();
        const label = role ? `${name} · ${role}` : name;
        return {
          apiId,
          label: label || 'Nurse',
          name,
          idsForMatch: collectNurseRecordIds(n),
          key: `${apiId || name}-${i}`,
        };
      })
      .filter((o) => o.apiId && o.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [nursesRaw]);

  /** When directories load (or refresh), ensure selected IDs stay valid or default to sample / first row. */
  useEffect(() => {
    if (!patientOptions.length) return;
    setScheduleForm((f) => {
      if (patientOptions.some((o) => o.apiId === f.patientId)) return f;
      const preferSample = SAMPLE_SCHEDULE_VISIT.patientId;
      const next =
        patientOptions.some((o) => o.apiId === preferSample) ? preferSample : patientOptions[0].apiId;
      return { ...f, patientId: next };
    });
  }, [patientOptions]);

  useEffect(() => {
    if (!nurseOptions.length) return;
    setScheduleForm((f) => {
      if (nurseOptions.some((o) => o.apiId === f.visitingNurse)) return f;
      return { ...f, visitingNurse: pickDefaultVisitingNurseId(nurseOptions) };
    });
  }, [nurseOptions]);

  useEffect(() => {
    if (!showScheduleModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape' || scheduleSaving) return;
      e.preventDefault();
      setShowScheduleModal(false);
      setScheduleError('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showScheduleModal, scheduleSaving]);

  useEffect(() => {
    if (!completeVisitRow) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape' || completeVisitSaving) return;
      e.preventDefault();
      setCompleteVisitRow(null);
      setCompleteVisitError('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [completeVisitRow, completeVisitSaving]);

  useEffect(() => {
    if (!completeVisitRow) return;
    const next = computeNextVisitIso(completeVisitForm.visitDate, completeVisitForm.frequency);
    if (!next) return;
    setCompleteVisitForm((f) => (f.nextVisit === next ? f : { ...f, nextVisit: next }));
  }, [completeVisitRow, completeVisitForm.visitDate, completeVisitForm.frequency]);

  const loadUpcomingVisitRows = useCallback(async () => {
    setVisitsUpcomingError('');
    setVisitsUpcomingLoading(true);
    try {
      const res = await fetchUpcomingCareVisits({}, onUnauthorized);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Could not load upcoming visits (${res.status})`);
      }
      const list = mergeCareVisitRowsWithCacheFallback(extractCareVisitsList(json));
      if (import.meta.env.DEV && list.length === 0 && json && typeof json === 'object' && !Array.isArray(json)) {
        const keys = Object.keys(json);
        if (keys.length) {
          console.warn('[Care Visits] upcoming: parsed 0 rows. Response keys:', keys);
        }
      }
      setUpcomingVisitRowsRaw(list);
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setVisitsUpcomingError(e.message || 'Could not load upcoming care visits.');
      }
      setUpcomingVisitRowsRaw([]);
    } finally {
      setVisitsUpcomingLoading(false);
    }
  }, [onUnauthorized]);

  const loadOtherVisitRows = useCallback(async () => {
    setVisitsOtherError('');
    setVisitsOtherLoading(true);
    try {
      let list = [];
      let source = 'GET /care-visits';

      const allRes = await fetchAllCareVisits({}, onUnauthorized);
      const allJson = await allRes.json().catch(() => ({}));
      if (allRes.ok) {
        list = extractCareVisitsList(allJson);
      }

      if (!list.length) {
        const [otherRes, upcomingRes] = await Promise.all([
          fetchOtherCareVisits({}, onUnauthorized),
          fetchUpcomingCareVisits({}, onUnauthorized),
        ]);
        const otherJson = await otherRes.json().catch(() => ({}));
        const upcomingJson = await upcomingRes.json().catch(() => ({}));
        const otherList = otherRes.ok ? extractCareVisitsList(otherJson) : [];
        const upcomingList = upcomingRes.ok ? extractCareVisitsList(upcomingJson) : [];

        if (!otherRes.ok && !upcomingRes.ok) {
          throw new Error(
            otherJson?.message ||
              otherJson?.error ||
              upcomingJson?.message ||
              upcomingJson?.error ||
              `Could not load all visits (${otherRes.status || upcomingRes.status})`,
          );
        }

        list = mergeCareVisitRowLists(otherList, upcomingList);
        source = 'GET /care-visits/other + /upcoming';
        if (import.meta.env.DEV && list.length === 0) {
          console.warn('[Care Visits] all: parsed 0 rows from other+upcoming.', {
            otherKeys: otherJson && typeof otherJson === 'object' ? Object.keys(otherJson) : [],
            upcomingKeys: upcomingJson && typeof upcomingJson === 'object' ? Object.keys(upcomingJson) : [],
          });
        }
      } else if (import.meta.env.DEV && list.length === 0 && allJson && typeof allJson === 'object' && !Array.isArray(allJson)) {
        console.warn('[Care Visits] all: parsed 0 rows. Response keys:', Object.keys(allJson));
      }

      if (import.meta.env.DEV && list.length) {
        console.info(`[Care Visits] loaded ${list.length} rows via ${source}`);
      }

      setOtherVisitRowsRaw(mergeCareVisitRowsWithCacheFallback(list));
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setVisitsOtherError(e.message || 'Could not load care visits.');
      }
      setOtherVisitRowsRaw([]);
    } finally {
      setVisitsOtherLoading(false);
    }
  }, [onUnauthorized]);

  const reloadVisitLists = useCallback(async () => {
    await Promise.all([loadUpcomingVisitRows(), loadOtherVisitRows()]);
  }, [loadUpcomingVisitRows, loadOtherVisitRows]);

  const mergedAllVisitRowsRaw = useMemo(() => {
    const base = otherVisitRowsRaw.length > 0 ? otherVisitRowsRaw : upcomingVisitRowsRaw;
    return mergeCareVisitRowLists(base);
  }, [upcomingVisitRowsRaw, otherVisitRowsRaw]);

  const activeVisitRowsRaw =
    filter === 'All Visits' ? mergedAllVisitRowsRaw : upcomingVisitRowsRaw;

  const visits = useMemo(() => {
    const withOverrides = applyCachedOverridesToRows(activeVisitRowsRaw);
    const dedupedRaw = mergeCareVisitRowListsWithLookups(withOverrides, lookups);
    const mapped = dedupedRaw
      .map((row, i) => mapCareVisitRow(row, i, lookups))
      .filter((row) => String(row.patientLine || row.patient || '').trim());
    const deduped = dedupeMappedCareVisits(mapped, lookups);
    return filterPlaceholderCareVisitRows(deduped);
  }, [activeVisitRowsRaw, lookups, visitDateCacheVersion]);

  const loadReferences = useCallback(async () => {
    setRefsError('');
    setRefsLoading(true);
    try {
      const [patientList, nurseRes, usersRes] = await Promise.all([
        fetchAllPatients(),
        apiFetch('/nurses', { method: 'GET', quiet: true }, onUnauthorized),
        fetchAuthUsers({ limit: 500 }, onUnauthorized).catch(() => null),
      ]);
      setPatientsRaw(Array.isArray(patientList) ? patientList : []);

      let nurseData = {};
      try {
        nurseData = await nurseRes.json();
      } catch {
        nurseData = {};
      }
      if (!nurseRes.ok) {
        throw new Error(nurseData?.message || nurseData?.error || 'Failed to load nurses.');
      }
      const nurseList = Array.isArray(nurseData)
        ? nurseData
        : Array.isArray(nurseData?.nurses)
          ? nurseData.nurses
          : Array.isArray(nurseData?.data)
            ? nurseData.data
            : Array.isArray(nurseData?.items)
              ? nurseData.items
              : [];

      let userList = [];
      if (usersRes?.ok) {
        const usersPayload = await usersRes.json().catch(() => ({}));
        userList = extractAuthUserArray(usersPayload);
      }
      setNursesRaw(mergeNursesWithStaffUsers(nurseList, userList));
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setRefsError(e.message || 'Could not load patients, nurses, or staff.');
      }
      setPatientsRaw([]);
      setNursesRaw([]);
    } finally {
      setRefsLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    if (refsLoading) return;
    reloadVisitLists();
  }, [refsLoading, reloadVisitLists]);

  /** All Visits merges upcoming + other (+ local cache). Upcoming tab filters to future scheduled rows. */
  const filtered = useMemo(() => {
    if (filter === 'All Visits') return visits;
    return visits.filter(isUpcomingVisitRow);
  }, [visits, filter]);

  const visitsListLoading =
    filter === 'All Visits'
      ? visitsOtherLoading || visitsUpcomingLoading
      : visitsUpcomingLoading;
  const visitsSourceLabel =
    filter === 'All Visits'
      ? 'GET /care-visits (+ upcoming/other)'
      : 'GET /care-visits/upcoming';

  const patchCareVisitAcrossLists = useCallback((target, updates = {}) => {
    const patch = (prev) =>
      prev.map((r, i) => {
        if (!careVisitRowMatchesTarget(r, i, target)) return r;
        return { ...r, ...updates };
      });
    setUpcomingVisitRowsRaw(patch);
    setOtherVisitRowsRaw(patch);
  }, []);

  const removeCareVisitAcrossLists = useCallback((target) => {
    const remove = (prev) => prev.filter((r, i) => !careVisitRowMatchesTarget(r, i, target));
    setUpcomingVisitRowsRaw(remove);
    setOtherVisitRowsRaw(remove);
  }, []);

  const handleCancel = async () => {
    if (!cancelTarget || cancelSaving) return;
    setCancelSaving(true);

    const targetRaw = cancelTarget?.raw && typeof cancelTarget.raw === 'object' ? cancelTarget.raw : {};
    const patientId = pickPatientIdFromVisitRaw(targetRaw);
    const visitingNurse = pickNurseIdFromVisitRaw(targetRaw);
    const patientName = cancelTarget.patientLine || cancelTarget.patient || pickPatientLabelFromVisitRaw(targetRaw);
    const overrideKeys = careVisitOverrideKeys({
      visitId: cancelTarget.id,
      patientId,
      visitingNurse,
      patientName,
    });

    patchCareVisitAcrossLists(cancelTarget, { status: 'cancelled' });
    saveCareVisitOverride({
      visitId: cancelTarget.id,
      patientId,
      visitingNurse,
      patientName,
      status: 'cancelled',
    });
    setVisitStatusOverrides((prev) => {
      const next = { ...prev };
      overrideKeys.forEach((key) => {
        next[key] = 'cancelled';
      });
      return next;
    });
    setVisitDateCacheVersion((v) => v + 1);

    try {
      const visitId = String(cancelTarget.id || '').trim();
      if (visitId && !visitId.startsWith('cv-')) {
        await cancelCareVisit(
          visitId,
          {
            patientId,
            visitingNurse,
          },
          onUnauthorized,
        );
      }
    } catch {
      /* keep local cancelled state */
    } finally {
      setCancelSaving(false);
      setCancelTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteSaving) return;
    setDeleteSaving(true);

    const targetRaw = deleteTarget?.raw && typeof deleteTarget.raw === 'object' ? deleteTarget.raw : {};
    const patientId = pickPatientIdFromVisitRaw(targetRaw);
    const visitingNurse = pickNurseIdFromVisitRaw(targetRaw);
    const patientName = deleteTarget.patientLine || deleteTarget.patient || pickPatientLabelFromVisitRaw(targetRaw);
    const overrideKeys = careVisitOverrideKeys({
      visitId: deleteTarget.id,
      patientId,
      visitingNurse,
      patientName,
    });

    removeCareVisitAcrossLists(deleteTarget);
    removeCareVisitOverride({
      visitId: deleteTarget.id,
      patientId,
      visitingNurse,
      patientName,
    });
    setVisitStatusOverrides((prev) => {
      const next = { ...prev };
      overrideKeys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
    setVisitDateCacheVersion((v) => v + 1);

    try {
      const visitId = String(deleteTarget.id || '').trim();
      if (visitId && !visitId.startsWith('cv-')) {
        await deleteCareVisit(
          visitId,
          {
            patientId,
            visitingNurse,
          },
          onUnauthorized,
        );
      }
    } catch {
      /* keep local removed state */
    } finally {
      setDeleteSaving(false);
      setDeleteTarget(null);
    }
  };

  const patchVisitRowCompleted = useCallback((target, updates = {}) => {
    patchCareVisitAcrossLists(target, { status: 'completed', ...updates });
  }, [patchCareVisitAcrossLists]);

  const openCompleteVisitModal = useCallback((v) => {
    const base = scheduleFormFromVisitRow(v);
    const visitDate = v.prevVisit || base.lastVisit || todayIsoDateLocal();
    const frequency = base.frequency;
    const nextVisit = computeNextVisitIso(visitDate, frequency);
    setCompleteVisitError('');
    setCompleteVisitRow(v);
    setCompleteVisitForm({
      visitDate,
      frequency,
      nextVisit: nextVisit || visitDate,
    });
  }, []);

  const openVisitUpdateModal = useCallback((v) => {
    setScheduleError('');
    setScheduleForm(scheduleFormFromVisitRow(v));
    setShowScheduleModal(true);
  }, []);

  const resetScheduleFormSample = () => {
    setScheduleError('');
    setScheduleForm((f) => {
      const pid =
        patientOptions.some((o) => o.apiId === SAMPLE_SCHEDULE_VISIT.patientId)
          ? SAMPLE_SCHEDULE_VISIT.patientId
          : patientOptions[0]?.apiId ?? f.patientId;
      return {
        ...f,
        patientId: pid,
        visitingNurse: pickDefaultVisitingNurseId(nurseOptions),
        lastVisit: SAMPLE_SCHEDULE_VISIT.lastVisit,
        nextVisit: SAMPLE_SCHEDULE_VISIT.nextVisit,
        frequency: SAMPLE_SCHEDULE_VISIT.frequency,
      };
    });
  };

  const handleScheduleSubmit = async () => {
    setScheduleError('');
    const patientId = String(scheduleForm.patientId || '').trim();
    const visitingNurse = String(scheduleForm.visitingNurse || '').trim();
    const lastVisit = formatYmdFromIsoInput(scheduleForm.lastVisit);
    const nextVisit = formatYmdFromIsoInput(scheduleForm.nextVisit);

    if (!patientId) {
      setScheduleError('Select a patient.');
      return;
    }
    if (!visitingNurse) {
      setScheduleError('Select a visiting nurse.');
      return;
    }
    if (!isIdLikeNurseValue(visitingNurse)) {
      setScheduleError('Visiting nurse must be a Mongo id or nurse UUID.');
      return;
    }
    if (!lastVisit || !nextVisit) {
      setScheduleError('Choose both last visit and next visit dates.');
      return;
    }

    const payload = {
      patientId,
      visitingNurse,
      lastVisit,
      nextVisit,
      frequency: scheduleForm.frequency,
    };

    setScheduleSaving(true);
    try {
      const res = await createCareVisit(payload, onUnauthorized);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Could not create visit (${res.status})`);
      }
      const patientLabel =
        patientOptions.find((o) => o.apiId === patientId)?.label ||
        lookups.patientNamesById.get(patientId) ||
        'Patient';
      const nurseLabel =
        nurseOptions.find((o) => o.apiId === visitingNurse)?.label
        || lookups.nurseNamesById.get(visitingNurse)
        || '';
      /** Show immediately so refresh errors do not block feedback. */
      setShowScheduleModal(false);
      saveCareVisitOverride({
        visitId: json?.visit?.id ?? json?.visit?._id ?? json?.id ?? json?._id ?? json?.data?.id,
        patientId,
        visitingNurse,
        lastVisit,
        nextVisit,
        frequency: payload.frequency,
        status: 'scheduled',
      });
      setVisitDateCacheVersion((v) => v + 1);
      setScheduleSuccessModal({
        patientLabel,
        nurseLabel,
        nextVisitLabel: nextVisit,
        frequency: payload.frequency,
      });
      try {
        await reloadVisitLists();
      } catch {
        /* list refresh failed — visit still created */
      }
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setScheduleError(e.message || 'Could not create care visit.');
      }
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleCompleteVisitSubmit = async () => {
    if (!completeVisitRow) return;
    setCompleteVisitError('');
    const visitYmdApi = formatYmdFromIsoInput(completeVisitForm.visitDate);
    const nextYmdApi = formatYmdFromIsoInput(completeVisitForm.nextVisit);
    if (!visitYmdApi || !nextYmdApi) {
      setCompleteVisitError('Choose both the visit date and the next visit date.');
      return;
    }
    const { patientId, visitingNurse } = visitApiFieldsFromRow(completeVisitRow);
    const visitingNurseId = String(visitingNurse || '').trim();
    if (!String(patientId || '').trim()) {
      setCompleteVisitError('Patient could not be determined for this visit.');
      return;
    }
    if (!visitingNurseId) {
      setCompleteVisitError('Visiting nurse could not be determined for this visit.');
      return;
    }
    if (!isIdLikeNurseValue(visitingNurseId)) {
      setCompleteVisitError('Visiting nurse must be a Mongo id or nurse UUID.');
      return;
    }
    const payload = {
      patientId: String(patientId).trim(),
      visitingNurse: visitingNurseId,
      lastVisit: visitYmdApi,
      nextVisit: nextYmdApi,
      frequency: completeVisitForm.frequency,
    };
    const patientLabel =
      completeVisitRow.patientLine || completeVisitRow.patient || 'Patient';
    const nurseLabel = completeVisitRow.nurseName || '';

    setCompleteVisitSaving(true);
    try {
      const res = await createCareVisit(payload, onUnauthorized);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Could not save visit (${res.status})`);
      }
      patchVisitRowCompleted(completeVisitRow, {
        lastVisit: visitYmdApi,
        nextVisit: nextYmdApi,
        frequency: completeVisitForm.frequency,
      });
      saveCareVisitOverride({
        visitId: completeVisitRow.id,
        patientId: String(patientId).trim(),
        visitingNurse: visitingNurseId,
        lastVisit: visitYmdApi,
        nextVisit: nextYmdApi,
        frequency: completeVisitForm.frequency,
        status: 'completed',
      });
      setVisitDateCacheVersion((v) => v + 1);
      setCompleteVisitRow(null);
      setScheduleSuccessModal({
        patientLabel,
        nurseLabel,
        nextVisitLabel: formatYmdFromIsoInput(completeVisitForm.nextVisit) || completeVisitForm.nextVisit,
        frequency: payload.frequency,
        title: 'Visit marked complete',
        variant: 'markComplete',
      });
      try {
        await reloadVisitLists();
      } catch {
        /* list refresh failed */
      }
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setCompleteVisitError(e.message || 'Could not mark visit complete.');
      }
    } finally {
      setCompleteVisitSaving(false);
    }
  };

  const listBanner = [refsError, visitsUpcomingError, visitsOtherError].filter(Boolean).join(' ');

  return (
    <div className="page-wrapper scheduling-page">
      {listBanner ? (
        <div
          className="alert alert-warning py-2 px-3 mb-3"
          style={{ fontSize: 13, borderRadius: 8 }}
          role="status"
        >
          {listBanner}
        </div>
      ) : null}

      <div className="kh-card mb-4 patients-board-card scheduling-visits-board">
        <div className="patients-topbar">
          <div className="patients-segmented-control">
            {VISIT_FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`patients-segmented-control__item${filter === s ? ' is-active' : ''}`}
                onClick={() => setFilter(s)}
              >
                <span>{s}</span>
              </button>
            ))}
          </div>
          <div className="patients-topbar-actions">
            <button
              type="button"
              className="patients-cta-btn patients-cta-btn--compact"
              onClick={() => {
                setScheduleError('');
                setScheduleForm((f) => ({
                  ...f,
                  visitingNurse: nurseOptions.some((o) => o.apiId === f.visitingNurse)
                    ? f.visitingNurse
                    : pickDefaultVisitingNurseId(nurseOptions),
                }));
                setShowScheduleModal(true);
              }}
              disabled={refsLoading || !patientOptions.length || !nurseOptions.length}
              title={
                refsLoading || !patientOptions.length || !nurseOptions.length
                  ? 'Load patients, nurses, and staff first.'
                  : undefined
              }
            >
              <span className="patients-cta-btn__icon"><FiPlus size={15} /></span>
              <span>Schedule visit</span>
            </button>
          </div>
        </div>

        <DataTableHeader
          title={filter === 'All Visits' ? 'All visits' : 'Upcoming visits'}
          legend={[
            { label: 'Scheduled', tone: 'info' },
            { label: 'Completed', tone: 'success' },
            { label: 'Cancelled', tone: 'danger' },
          ]}
        />

        <div className="table-responsive patients-table-wrap hospital-table-wrap care-visits-table-wrap">
          <table className="table kh-table patients-table hospital-table care-visits-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th className="cv-th-patient">Patient</th>
                <th className="cv-th-prev text-nowrap">Previous visit</th>
                <th className="cv-th-next text-nowrap">Next visit</th>
                <th className="cv-th-frequency">Frequency</th>
                <th className="cv-th-nurse">Nurse</th>
                <th className="cv-th-status">Status</th>
                <th className="patients-table-actions-col cv-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visitsListLoading && (
                <TablePageLoader
                  title="Loading care visits"
                  subtitle="Fetching scheduled, completed, and upcoming visits…"
                  colSpan={8}
                  skeletonColumns={8}
                  icon={FiCalendar}
                />
              )}
              {!visitsListLoading && filtered.map((v, i) => (
                <tr key={`${careVisitRowStableKey(v.raw || {}, i)}-${i}`} className="patients-row-card">
                  <td className="col-num" data-label="#">{i + 1}</td>
                  <td data-label="Patient">
                    <div className="d-flex align-items-center gap-2 patients-name-cell">
                      <div
                        className="avatar sm patients-avatar d-flex align-items-center justify-content-center"
                        style={{
                          background: i % 2 === 0 ? '#45B6FE' : '#2E7DB8',
                          color: '#fff',
                          borderRadius: '50%',
                        }}
                        aria-hidden
                      >
                        <FiUser size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="patients-name-primary" title={v.patientLine || v.patient}>
                          {v.patientLine || v.patient}
                        </div>
                        {v.address ? (
                          <div className="patients-name-secondary hospital-table__truncate" title={v.address}>
                            {v.address}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="patients-table-date" data-label="Previous visit">
                    {formatVisitDateDisplay(v.prevVisit)}
                  </td>
                  <td className="patients-table-date" data-label="Next visit">
                    <span className={v.nextVisit ? 'cv-next-highlight' : ''}>
                      {formatVisitDateDisplay(v.nextVisit)}
                    </span>
                  </td>
                  <td className="patients-table-value" data-label="Frequency">
                    {v.frequency || '—'}
                  </td>
                  <td className="patients-table-value hospital-table__truncate" data-label="Nurse" title={v.nurseName}>
                    {v.nurseName}
                  </td>
                  <td data-label="Status">
                    <HospitalStatus
                      label={visitStatusLabel(v.status)}
                      tone={visitStatusTone(v.status)}
                    />
                  </td>
                  <td
                    className="patients-table-actions-cell hospital-table-actions-cell"
                    data-label="Actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {v.status === 'scheduled' ? (
                      <div className="hospital-table-actions">
                        <CareVisitRowActions
                          visit={v}
                          onMarkCompleted={openCompleteVisitModal}
                          onOpenUpdate={openVisitUpdateModal}
                          onRequestCancel={setCancelTarget}
                          onRequestDelete={setDeleteTarget}
                        />
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!visitsListLoading && filtered.length === 0 && (
                <tr className="hospital-table-empty-row">
                  <td colSpan={8}>No visits to show for this tab. Schedule a visit or try the other filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portal: page layout uses transform (Framer Motion) — fixed modals must mount on document.body */}
      {cancelTarget &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => {
              if (!cancelSaving) setCancelTarget(null);
            }}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-visit-modal-title"
              className="bg-white shadow-lg"
              style={{
                borderRadius: 12,
                maxWidth: 420,
                width: '100%',
                outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cv-cancel-modal">
                <div className="cv-cancel-modal__icon" aria-hidden>
                  <FiXCircle size={28} style={{ color: '#dc2626' }} strokeWidth={2} />
                </div>
                <h6 id="cancel-visit-modal-title" className="cv-cancel-modal__title">
                  Cancel Visit
                </h6>
                <p className="cv-cancel-modal__lead">
                  Are you sure you want to cancel the visit for
                </p>
                <p className="cv-cancel-modal__patient">
                  {cancelTarget.patientLine || cancelTarget.patient}
                </p>
                <p className="cv-cancel-modal__meta">
                  <span className="cv-cancel-modal__meta-icon" aria-hidden>
                    <FiCalendar size={13} strokeWidth={2} />
                  </span>
                  <span>
                    {formatVisitDateDisplay(cancelTarget.nextVisit)}
                    {cancelTarget.time && cancelTarget.time !== '—' ? ` at ${cancelTarget.time}` : ''}
                  </span>
                </p>
                <div className="cv-cancel-modal__actions">
                  <button
                    type="button"
                    className="cv-cancel-modal__btn cv-cancel-modal__btn--ghost"
                    onClick={() => setCancelTarget(null)}
                    disabled={cancelSaving}
                  >
                    Keep Visit
                  </button>
                  <button
                    type="button"
                    className="cv-cancel-modal__btn cv-cancel-modal__btn--danger"
                    onClick={handleCancel}
                    disabled={cancelSaving}
                  >
                    <span className="cv-cancel-modal__btn-icon" aria-hidden>
                      <FiXCircle size={14} strokeWidth={2.25} />
                    </span>
                    <span>{cancelSaving ? 'Cancelling…' : 'Cancel Visit'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {deleteTarget &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => {
              if (!deleteSaving) setDeleteTarget(null);
            }}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-visit-modal-title"
              className="bg-white shadow-lg"
              style={{
                borderRadius: 12,
                maxWidth: 420,
                width: '100%',
                outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cv-cancel-modal">
                <div className="cv-cancel-modal__icon cv-delete-modal__icon" aria-hidden>
                  <FiTrash2 size={26} style={{ color: '#dc2626' }} strokeWidth={2} />
                </div>
                <h6 id="delete-visit-modal-title" className="cv-cancel-modal__title">
                  Delete Visit
                </h6>
                <p className="cv-cancel-modal__lead">
                  This permanently removes the visit record for
                </p>
                <p className="cv-cancel-modal__patient">
                  {deleteTarget.patientLine || deleteTarget.patient}
                </p>
                <p className="cv-cancel-modal__meta">
                  <span className="cv-cancel-modal__meta-icon" aria-hidden>
                    <FiCalendar size={13} strokeWidth={2} />
                  </span>
                  <span>
                    {formatVisitDateDisplay(deleteTarget.nextVisit)}
                    {deleteTarget.time && deleteTarget.time !== '—' ? ` at ${deleteTarget.time}` : ''}
                  </span>
                </p>
                <div className="cv-cancel-modal__actions">
                  <button
                    type="button"
                    className="cv-cancel-modal__btn cv-cancel-modal__btn--ghost"
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteSaving}
                  >
                    Keep Visit
                  </button>
                  <button
                    type="button"
                    className="cv-cancel-modal__btn cv-cancel-modal__btn--danger"
                    onClick={handleDelete}
                    disabled={deleteSaving}
                  >
                    <span className="cv-cancel-modal__btn-icon" aria-hidden>
                      <FiTrash2 size={14} strokeWidth={2.25} />
                    </span>
                    <span>{deleteSaving ? 'Deleting…' : 'Delete Visit'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {completeVisitRow &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => {
              if (!completeVisitSaving) {
                setCompleteVisitRow(null);
                setCompleteVisitError('');
              }
            }}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="complete-visit-modal-title"
              className="bg-white shadow-lg"
              style={{
                borderRadius: 12,
                maxWidth: 480,
                width: '100%',
                maxHeight: 'calc(100vh - 32px)',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid var(--kh-border-light, #e5e7eb)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <h6 id="complete-visit-modal-title" className="mb-0" style={{ fontWeight: 700, fontSize: 16 }}>
                  Mark visit complete
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  disabled={completeVisitSaving}
                  onClick={() => {
                    if (completeVisitSaving) return;
                    setCompleteVisitRow(null);
                    setCompleteVisitError('');
                  }}
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
                {completeVisitError ? (
                  <div className="alert alert-danger py-2 small mb-3" role="alert">
                    {completeVisitError}
                  </div>
                ) : null}
                <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                  Record when this visit took place, confirm how often visits should repeat, and set the next visit date
                  (filled automatically from the frequency — you can adjust it).
                </p>
                <p className="small mb-3" style={{ fontWeight: 600, color: 'var(--kh-text)' }}>
                  {completeVisitRow.patientLine || completeVisitRow.patient}
                </p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Visit date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-kh"
                      value={completeVisitForm.visitDate}
                      onChange={(e) =>
                        setCompleteVisitForm((f) => ({ ...f, visitDate: e.target.value }))
                      }
                      disabled={completeVisitSaving}
                    />
                  </div>
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Frequency
                    </label>
                    <select
                      className="form-select form-control-kh"
                      value={completeVisitForm.frequency}
                      onChange={(e) =>
                        setCompleteVisitForm((f) => ({ ...f, frequency: e.target.value }))
                      }
                      disabled={completeVisitSaving}
                    >
                      {FREQUENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Next visit
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-kh"
                      value={completeVisitForm.nextVisit}
                      onChange={(e) =>
                        setCompleteVisitForm((f) => ({ ...f, nextVisit: e.target.value }))
                      }
                      disabled={completeVisitSaving}
                    />
                    <div className="form-text small" style={{ marginTop: 6 }}>
                      Suggested from visit date + frequency (e.g. weekly +7 days, twice-weekly +3 days, monthly +1 month).
                  </div>
                  </div>
                  </div>
              </div>
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--kh-border-light, #e5e7eb)',
                  flexShrink: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  background: '#fafbfd',
                }}
              >
                <button
                  type="button"
                  className="btn btn-kh-outline"
                  disabled={completeVisitSaving}
                  onClick={() => {
                    if (completeVisitSaving) return;
                    setCompleteVisitRow(null);
                    setCompleteVisitError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  onClick={handleCompleteVisitSubmit}
                  disabled={completeVisitSaving}
                >
                  {completeVisitSaving ? 'Saving…' : 'Confirm & schedule next'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showScheduleModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => {
              if (!scheduleSaving) setShowScheduleModal(false);
            }}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-modal-title"
              className="bg-white shadow-lg"
              style={{
                borderRadius: 12,
                maxWidth: 560,
                width: '100%',
                maxHeight: 'calc(100vh - 32px)',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid var(--kh-border-light, #e5e7eb)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <h6 id="schedule-modal-title" className="mb-0" style={{ fontWeight: 700, fontSize: 16 }}>
                  Schedule a visit
                </h6>
                <div className="d-flex flex-shrink-0 gap-2 align-items-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-kh-outline"
                    onClick={resetScheduleFormSample}
                    disabled={scheduleSaving}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={scheduleSaving}
                    onClick={() => !scheduleSaving && setShowScheduleModal(false)}
                  />
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
                {scheduleError ? (
                  <div className="alert alert-danger py-2 small mb-3" role="alert">
                    {scheduleError}
                  </div>
                ) : null}
                {refsLoading ? (
                  <p className="text-muted small mb-3">Loading patients, nurses, and staff…</p>
                ) : null}
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Patient
                    </label>
                    <select
                      className="form-select form-control-kh"
                      value={scheduleForm.patientId}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, patientId: e.target.value }))}
                      disabled={!patientOptions.length || scheduleSaving}
                    >
                      {patientOptions.length === 0 ? (
                        <option value="">No patients loaded</option>
                      ) : (
                        patientOptions.map((o) => (
                          <option key={o.key} value={o.apiId}>
                            {o.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="col-12 col-lg-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Visiting nurse / staff
                    </label>
                    <select
                      className="form-select form-control-kh"
                      value={scheduleForm.visitingNurse}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, visitingNurse: e.target.value }))}
                      disabled={!nurseOptions.length || scheduleSaving}
                    >
                      {nurseOptions.length === 0 ? (
                        <option value="">No nurses or staff loaded</option>
                      ) : (
                        nurseOptions.map((o) => (
                          <option key={o.key} value={o.apiId}>
                            {o.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Last visit
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-kh"
                      value={scheduleForm.lastVisit}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, lastVisit: e.target.value }))}
                      disabled={scheduleSaving}
                    />
                  </div>
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Next visit
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-kh"
                      value={scheduleForm.nextVisit}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, nextVisit: e.target.value }))}
                      disabled={scheduleSaving}
                    />
                  </div>
                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Frequency
                    </label>
                    <select
                      className="form-select form-control-kh"
                      value={scheduleForm.frequency}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, frequency: e.target.value }))}
                      disabled={scheduleSaving}
                    >
                      {FREQUENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label} ({o.value})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--kh-border-light, #e5e7eb)',
                  flexShrink: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  background: '#fafbfd',
                }}
              >
                <button
                  type="button"
                  className="btn btn-kh-outline"
                  disabled={scheduleSaving}
                  onClick={() => !scheduleSaving && setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  onClick={handleScheduleSubmit}
                  disabled={scheduleSaving || !patientOptions.length || !nurseOptions.length || refsLoading}
                >
                  {scheduleSaving ? 'Saving…' : 'Save visit'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Portal: Framer Motion on layout uses transform → fixed modals inside page would not cover the viewport. */}
      {scheduleSuccessModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setScheduleSuccessModal(null)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-success-title"
              className="bg-white shadow-lg"
              style={{
                borderRadius: 12,
                maxWidth: 420,
                width: '100%',
                outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <FiCheckCircle size={28} style={{ color: '#059669' }} aria-hidden />
          </div>
                <h6
                  id="schedule-success-title"
                  style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 10 }}
                >
                  {scheduleSuccessModal.title || 'Care visit created'}
                </h6>
                {scheduleSuccessModal.lead ? (
                  <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 10 }}>
                    {scheduleSuccessModal.lead}
                  </p>
                ) : null}
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 8 }}>
                  <strong style={{ color: '#0f172a' }}>{scheduleSuccessModal.patientLabel}</strong>
                  {scheduleSuccessModal.nurseLabel ? (
                    <>
                      {' '}
                      · <strong style={{ color: '#0f172a' }}>{scheduleSuccessModal.nurseLabel}</strong>
                    </>
                  ) : null}
                  {scheduleSuccessModal.variant === 'markComplete'
                    ? ' · Visit marked complete. Next visit: '
                    : scheduleSuccessModal.nurseLabel
                      ? ' is scheduled. Next visit: '
                      : ' Next visit: '}
                  <strong style={{ color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                    {scheduleSuccessModal.nextVisitLabel}
                  </strong>
                  {scheduleSuccessModal.frequency ? (
                    <span>
                      {' '}
                      · {String(scheduleSuccessModal.frequency).replace(/_/g, ' ')}
                    </span>
                  ) : null}
                  .
                </p>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 22 }}>
                  Visit lists were refreshed.
                </p>
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  style={{ minWidth: 140, fontWeight: 700 }}
                  onClick={() => setScheduleSuccessModal(null)}
                >
                  OK
                </button>
        </div>
            </div>
          </div>,
          document.body,
      )}

    </div>
  );
}
