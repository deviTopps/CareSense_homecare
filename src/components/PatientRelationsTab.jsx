import { useCallback, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import {
  FiPlus,
  FiRefreshCw,
  FiUser,
  FiAlertCircle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiX,
  FiGrid,
  FiChevronRight,
  FiPhone,
  FiMail,
  FiLock,
  FiEdit2,
  FiTrash2,
} from '../icons/hugeicons-feather';
import { apiFetch } from '../api';
import './PatientRelationsTab.css';

export const PATIENT_RELATION_OPTIONS = [
  'Father',
  'Mother',
  'Husband',
  'Wife',
  'Sibling',
  'Others',
];

const EMPTY_FORM = {
  relationship: 'Father',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
};

function pickFirstString(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'object') continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

const PHONE_KEY_RE = /phone|tel|mobile|msisdn|whatsapp|contact|gsm|cell|dial/i;
const PHONE_KEY_SKIP_RE = /email|patientId|patient_id|relationship|created|updated|password|address|country/i;

function sanitizePhoneCandidate(value, { strict = true } = {}) {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text || text === '—') return '';
  if (/^(null|undefined|n\/a|na|none)$/i.test(text)) return '';
  if (text.includes('@')) return '';
  // Ignore ids that sometimes leak into nested user objects
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) return '';
  if (/^[0-9a-f]{24}$/i.test(text)) return '';
  const digits = text.replace(/\D/g, '');
  if (strict && (digits.length < 7 || digits.length > 15)) return '';
  if (!strict && digits.length < 5) return '';
  return text;
}

function coercePhoneValue(value, depth = 0) {
  if (value == null || depth > 6) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return sanitizePhoneCandidate(String(Math.trunc(value)), { strict: false });
  }
  if (typeof value === 'bigint') {
    return sanitizePhoneCandidate(String(value), { strict: false });
  }
  if (typeof value === 'string') {
    return sanitizePhoneCandidate(value, { strict: false });
  }
  if (typeof value !== 'object') return '';

  // Extended JSON / typed number wrappers
  if (value.$numberLong != null || value.$numberInt != null || value.$numberDecimal != null || value.$numberDouble != null) {
    return coercePhoneValue(
      value.$numberLong ?? value.$numberInt ?? value.$numberDecimal ?? value.$numberDouble,
      depth + 1,
    );
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = coercePhoneValue(item, depth + 1);
      if (found) return found;
    }
    return '';
  }

  return pickFirstString(
    coercePhoneValue(value.phone, depth + 1),
    coercePhoneValue(value.telephone, depth + 1),
    coercePhoneValue(value.phoneNumber, depth + 1),
    coercePhoneValue(value.phone_number, depth + 1),
    coercePhoneValue(value.homeTelephone, depth + 1),
    coercePhoneValue(value.telephoneNumber, depth + 1),
    coercePhoneValue(value.contactNumber, depth + 1),
    coercePhoneValue(value.contact, depth + 1),
    coercePhoneValue(value.number, depth + 1),
    coercePhoneValue(value.value, depth + 1),
    coercePhoneValue(value.primary, depth + 1),
    coercePhoneValue(value.mobile, depth + 1),
    coercePhoneValue(value.e164, depth + 1),
    coercePhoneValue(value.msisdn, depth + 1),
    coercePhoneValue(value.nationalNumber, depth + 1),
    coercePhoneValue(value.national_number, depth + 1),
  );
}

function findPhoneInTree(node, depth = 0, seen = new WeakSet()) {
  if (node == null || depth > 8) return '';
  if (typeof node !== 'object') return coercePhoneValue(node);
  if (seen.has(node)) return '';
  seen.add(node);

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findPhoneInTree(item, depth + 1, seen);
      if (found) return found;
    }
    return '';
  }

  const preferredKeys = [
    'phone',
    'telephone',
    'phoneNumber',
    'phone_number',
    'phoneNo',
    'phone_no',
    'phones',
    'phoneNumbers',
    'homeTelephone',
    'home_telephone',
    'telephoneNumber',
    'telephone_number',
    'mobile',
    'mobileNumber',
    'mobile_number',
    'mobileNo',
    'contactNumber',
    'contact_number',
    'contactOne',
    'contact_one',
    'contactTwo',
    'contact_two',
    'primaryPhone',
    'primary_phone',
    'tel',
    'msisdn',
    'whatsapp',
    'whatsApp',
    'gsm',
    'cell',
    'cellPhone',
    'cell_phone',
  ];

  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const found = coercePhoneValue(node[key]);
      if (found) return found;
    }
  }

  for (const [key, val] of Object.entries(node)) {
    if (!PHONE_KEY_RE.test(key)) continue;
    if (PHONE_KEY_SKIP_RE.test(key)) continue;
    const found = coercePhoneValue(val);
    if (found) return found;
    if (val && typeof val === 'object') {
      const nested = findPhoneInTree(val, depth + 1, seen);
      if (nested) return nested;
    }
  }

  for (const val of Object.values(node)) {
    if (!val || typeof val !== 'object') continue;
    const found = findPhoneInTree(val, depth + 1, seen);
    if (found) return found;
  }

  return '';
}

function unwrapRelationRecord(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const nestedCandidates = [
    raw.user,
    typeof raw.userId === 'object' ? raw.userId : null,
    raw.client,
    typeof raw.clientId === 'object' ? raw.clientId : null,
    raw.patientClient,
    raw.account,
    raw.profile,
    raw.personal,
    raw.personalInfo,
    raw.clientUser,
    raw.clientDetails,
    raw.attributes,
    raw.data,
  ].filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry));

  if (nestedCandidates.length === 0) return raw;

  const nested = nestedCandidates.reduce((acc, entry) => ({ ...acc, ...entry }), {});
  return {
    ...nested,
    ...raw,
    // Prefer nested contact fields when the wrapper omits them
    phone: raw.phone ?? nested.phone,
    telephone: raw.telephone ?? nested.telephone,
    phoneNumber: raw.phoneNumber ?? nested.phoneNumber,
    phone_number: raw.phone_number ?? nested.phone_number,
    homeTelephone: raw.homeTelephone ?? nested.homeTelephone,
    contactNumber: raw.contactNumber ?? nested.contactNumber,
    mobile: raw.mobile ?? nested.mobile,
    firstName: raw.firstName ?? nested.firstName,
    lastName: raw.lastName ?? nested.lastName,
    email: raw.email ?? nested.email,
  };
}

function relationSourceObjects(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const unwrapped = unwrapRelationRecord(raw);
  return [
    unwrapped,
    raw,
    raw.user,
    typeof raw.userId === 'object' ? raw.userId : null,
    raw.client,
    typeof raw.clientId === 'object' ? raw.clientId : null,
    raw.patientClient,
    raw.account,
    raw.profile,
    raw.personal,
    raw.personalInfo,
    raw.clientUser,
    raw.clientDetails,
    raw.contact,
    raw.contacts,
    Array.isArray(raw.contacts) ? raw.contacts[0] : null,
    Array.isArray(raw.phones) ? raw.phones[0] : null,
    raw.data,
    raw.attributes,
  ].filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry));
}

const PHONE_CACHE_KEY = 'caresense.patientRelationPhones';

function readPhoneCache() {
  try {
    const raw = sessionStorage.getItem(PHONE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePhoneCache(cache) {
  try {
    sessionStorage.setItem(PHONE_CACHE_KEY, JSON.stringify(cache || {}));
  } catch {
    // ignore quota / private mode
  }
}

function cacheRelationPhone(relationId, phone) {
  const id = String(relationId || '').trim();
  const value = sanitizePhoneCandidate(phone, { strict: false });
  if (!id || !value || id.startsWith('relation-')) return;
  const cache = readPhoneCache();
  cache[id] = value;
  writePhoneCache(cache);
}

function cachedRelationPhone(relationId) {
  const id = String(relationId || '').trim();
  if (!id) return '';
  return sanitizePhoneCandidate(readPhoneCache()[id], { strict: false });
}

function extractRelationArray(payload) {
  const candidates = [
    payload,
    payload?.patientClients,
    payload?.patient_clients,
    payload?.clients,
    payload?.relations,
    payload?.patientRelations,
    payload?.data,
    payload?.items,
    payload?.results,
    payload?.docs,
    payload?.rows,
    payload?.data?.patientClients,
    payload?.data?.patient_clients,
    payload?.data?.clients,
    payload?.data?.relations,
    payload?.data?.items,
    payload?.data?.results,
    payload?.data?.docs,
    payload?.result?.patientClients,
    payload?.result?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(Boolean);
  }
  return [];
}

function normalizeRelationRecord(raw, index = 0) {
  const sources = relationSourceObjects(raw);

  const relationship = pickFirstString(
    ...sources.map((s) => s.relationship),
    ...sources.map((s) => s.relation),
    ...sources.map((s) => s.relationType),
    ...sources.map((s) => s.relationshipType),
    ...sources.map((s) => s.type),
  );

  const firstName = pickFirstString(
    ...sources.map((s) => s.firstName),
    ...sources.map((s) => s.first_name),
    ...sources.map((s) => s.givenName),
    ...sources.map((s) => s.given_name),
  );

  const lastName = pickFirstString(
    ...sources.map((s) => s.lastName),
    ...sources.map((s) => s.last_name),
    ...sources.map((s) => s.familyName),
    ...sources.map((s) => s.family_name),
    ...sources.map((s) => s.surname),
  );

  const name = pickFirstString(
    ...sources.map((s) => s.name),
    ...sources.map((s) => s.fullName),
    ...sources.map((s) => s.full_name),
    ...sources.map((s) => s.displayName),
    ...sources.map((s) => s.display_name),
    [firstName, lastName].filter(Boolean).join(' '),
  );

  const phone = pickFirstString(
    ...sources.map((s) => coercePhoneValue(s.phone)),
    ...sources.map((s) => coercePhoneValue(s.telephone)),
    ...sources.map((s) => coercePhoneValue(s.phoneNumber)),
    ...sources.map((s) => coercePhoneValue(s.phone_number)),
    ...sources.map((s) => coercePhoneValue(s.phoneNo)),
    ...sources.map((s) => coercePhoneValue(s.phone_no)),
    ...sources.map((s) => coercePhoneValue(s.phones)),
    ...sources.map((s) => coercePhoneValue(s.phoneNumbers)),
    ...sources.map((s) => coercePhoneValue(s.homeTelephone)),
    ...sources.map((s) => coercePhoneValue(s.home_telephone)),
    ...sources.map((s) => coercePhoneValue(s.telephoneNumber)),
    ...sources.map((s) => coercePhoneValue(s.contactNumber)),
    ...sources.map((s) => coercePhoneValue(s.contact_number)),
    ...sources.map((s) => coercePhoneValue(s.contactOne)),
    ...sources.map((s) => coercePhoneValue(s.contact)),
    ...sources.map((s) => coercePhoneValue(s.mobile)),
    ...sources.map((s) => coercePhoneValue(s.mobileNumber)),
    ...sources.map((s) => coercePhoneValue(s.mobile_number)),
    ...sources.map((s) => coercePhoneValue(s.primaryPhone)),
    ...sources.map((s) => coercePhoneValue(s.tel)),
    ...sources.map((s) => coercePhoneValue(s.msisdn)),
    findPhoneInTree(raw),
    findPhoneInTree(unwrapRelationRecord(raw)),
  );

  const email = pickFirstString(
    ...sources.map((s) => s.email),
    ...sources.map((s) => s.emailAddress),
    ...sources.map((s) => s.email_address),
    ...sources.map((s) => s.mail),
  );

  const id = pickFirstString(
    // Prefer the patient-client record id — never the nested patient id.
    typeof raw?.id === 'string' || typeof raw?.id === 'number' ? raw.id : '',
    typeof raw?._id === 'string' || typeof raw?._id === 'number' ? raw._id : '',
    typeof raw?.uuid === 'string' || typeof raw?.uuid === 'number' ? raw.uuid : '',
    raw?.patientClientId,
    raw?.patient_client_id,
  );

  const userId = pickFirstString(
    typeof raw?.userId === 'string' || typeof raw?.userId === 'number' ? raw.userId : '',
    raw?.user?.id,
    raw?.user?._id,
    raw?.user?.uuid,
    typeof raw?.userId === 'object'
      ? pickFirstString(raw.userId?.id, raw.userId?._id, raw.userId?.uuid)
      : '',
  );

  const relationId = id || userId || `relation-${index}`;

  const resolvedPhone = (
    phone
    || cachedRelationPhone(relationId)
    || cachedRelationPhone(userId)
    || ''
  );
  if (resolvedPhone) {
    cacheRelationPhone(relationId, resolvedPhone);
    if (userId) cacheRelationPhone(userId, resolvedPhone);
  }

  const linkedPatientId = pickFirstString(
    typeof raw?.patientId === 'string' || typeof raw?.patientId === 'number' ? raw.patientId : '',
    raw?.patient_id,
    raw?.patientUuid,
    raw?.patient_uuid,
    raw?.patient?.uuid,
    raw?.patient?.patientId,
    raw?.patient?.id,
    raw?.patient?._id,
    typeof raw?.patient === 'string' ? raw.patient : '',
  );

  return {
    id: relationId,
    userId: userId || '',
    patientId: linkedPatientId,
    relationship: relationship || '—',
    firstName,
    lastName,
    name: name || '—',
    phone: resolvedPhone || '—',
    telephone: resolvedPhone || '—',
    email: email || '—',
    createdAt: raw?.createdAt || raw?.created_at || raw?.user?.createdAt || null,
  };
}

function samePatientId(left, right) {
  const a = String(left || '').trim().toLowerCase();
  const b = String(right || '').trim().toLowerCase();
  return Boolean(a && b && a === b);
}

async function enrichMissingRelationPhones(rows) {
  const missing = rows.filter((row) => (!row.phone || row.phone === '—') && row.id && !String(row.id).startsWith('relation-'));
  if (missing.length === 0) return rows;

  const enrichedById = new Map();
  await Promise.all(missing.slice(0, 25).map(async (row) => {
    try {
      const response = await apiFetch(`/patient-clients/${encodeURIComponent(row.id)}`, {
        method: 'GET',
        quiet: true,
      });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      const detail = normalizeRelationRecord(
        payload?.patientClient || payload?.client || payload?.relation || payload?.data || payload,
        0,
      );
      if (detail.phone && detail.phone !== '—') {
        cacheRelationPhone(row.id, detail.phone);
        enrichedById.set(row.id, detail.phone);
      }
    } catch {
      // Keep list phone blank if detail endpoint is unavailable.
    }
  }));

  if (enrichedById.size === 0) return rows;
  return rows.map((row) => {
    const phone = enrichedById.get(row.id);
    if (!phone) return row;
    return { ...row, phone, telephone: phone };
  });
}

async function fetchPatientRelations(patientId) {
  const currentPatientId = String(patientId || '').trim();
  const response = await apiFetch('/patient-clients', { method: 'GET', quiet: true });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Unable to load patient relations.');
  }

  const rawList = extractRelationArray(payload);
  if (import.meta.env.DEV && rawList[0]) {
    const sample = unwrapRelationRecord(rawList[0]);
    console.debug('[PatientRelations] sample /patient-clients record', rawList[0]);
    console.debug('[PatientRelations] unwrapped keys', Object.keys(sample || {}));
    console.debug('[PatientRelations] normalized phone', normalizeRelationRecord(rawList[0], 0).phone);
  }

  let allRelations = rawList.map((entry, index) => normalizeRelationRecord(entry, index));

  // Prefer records linked to this patient when patientId is present on the response.
  if (currentPatientId) {
    const forPatient = allRelations.filter((row) => samePatientId(row.patientId, currentPatientId));
    if (forPatient.length > 0) {
      allRelations = forPatient;
    } else if (allRelations.some((row) => row.patientId)) {
      allRelations = forPatient;
    }
  }

  return enrichMissingRelationPhones(allRelations);
}

async function syncRelationUserPhone(createdOrUpdated, phone) {
  const phoneValue = String(phone || '').trim();
  if (!phoneValue) return;

  const userId = pickFirstString(
    typeof createdOrUpdated?.userId === 'string' || typeof createdOrUpdated?.userId === 'number'
      ? createdOrUpdated.userId
      : '',
    createdOrUpdated?.user?.id,
    createdOrUpdated?.user?._id,
    createdOrUpdated?.user?.uuid,
    typeof createdOrUpdated?.userId === 'object'
      ? pickFirstString(createdOrUpdated.userId?.id, createdOrUpdated.userId?._id, createdOrUpdated.userId?.uuid)
      : '',
  );
  if (!userId) return;

  // Backend list returns user.phone as "" even after POST /patient-clients with phone.
  // Persist it on the user record so GET /patient-clients can show it.
  try {
    const response = await apiFetch(`/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      quiet: true,
      body: JSON.stringify({ phone: phoneValue }),
    });
    if (!response.ok) {
      // Some workspaces expose phone updates under /auth/users/:id
      await apiFetch(`/auth/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        quiet: true,
        body: JSON.stringify({ phone: phoneValue }),
      }).catch(() => null);
    }
  } catch {
    // Non-blocking — table still shows the submitted phone via local cache.
  }

  cacheRelationPhone(userId, phoneValue);
  const relationId = pickFirstString(
    createdOrUpdated?.id,
    createdOrUpdated?._id,
    createdOrUpdated?.uuid,
    userId,
  );
  if (relationId) cacheRelationPhone(relationId, phoneValue);
}

async function createPatientRelation(patientId, form) {
  const id = String(patientId || '').trim();
  if (!id) {
    throw new Error('Patient UUID is required to create a relation.');
  }

  const body = {
    patientId: id,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    password: form.password,
    relationship: form.relationship.trim(),
  };

  const response = await apiFetch('/patient-clients', {
    method: 'POST',
    quiet: true,
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Unable to add patient relation.');
  }
  const created = payload?.patientClient || payload?.client || payload?.relation || payload?.data || payload;
  await syncRelationUserPhone(created, form.phone);
  return created;
}

async function updatePatientRelation(relationId, patientId, form, existingRow = null) {
  const id = String(relationId || '').trim();
  if (!id) throw new Error('Relation ID is required to update.');

  const body = {
    patientId: String(patientId || '').trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    relationship: form.relationship.trim(),
  };
  if (form.password.trim()) {
    body.password = form.password.trim();
  }

  const paths = [
    `/patient-clients/${encodeURIComponent(id)}`,
  ];

  let lastError = 'Unable to update patient relation.';
  let updated = null;
  for (const path of paths) {
    for (const method of ['PATCH', 'PUT']) {
      try {
        const response = await apiFetch(path, {
          method,
          quiet: true,
          body: JSON.stringify(body),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          updated = payload?.patientClient || payload?.client || payload?.relation || payload?.data || payload;
          break;
        }
        if (response.status === 404 || response.status === 405) continue;
        lastError = payload?.message || payload?.error || lastError;
      } catch (err) {
        lastError = err?.message || lastError;
      }
    }
    if (updated) break;
  }

  if (!updated) throw new Error(lastError);

  await syncRelationUserPhone(
    {
      ...existingRow,
      ...updated,
      userId: updated?.userId || existingRow?.userId || updated?.user?.id,
      user: updated?.user || existingRow?.user,
      id: updated?.id || updated?.uuid || updated?._id || id,
    },
    form.phone,
  );
  return updated;
}

async function deletePatientRelation(relationId) {
  const id = String(relationId || '').trim();
  if (!id) throw new Error('Relation ID is required to delete.');

  const response = await apiFetch(`/patient-clients/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    quiet: true,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 204) {
    throw new Error(payload?.message || payload?.error || 'Unable to delete patient relation.');
  }
  return payload;
}

function formFromRelationRow(row) {
  const nameParts = String(row?.name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = String(row?.firstName || '').trim() || nameParts[0] || '';
  const lastName = String(row?.lastName || '').trim() || nameParts.slice(1).join(' ') || '';
  const relationship = PATIENT_RELATION_OPTIONS.includes(row?.relationship)
    ? row.relationship
    : (row?.relationship && row.relationship !== '—' ? row.relationship : 'Father');

  return {
    relationship,
    firstName,
    lastName,
    phone: row?.phone && row.phone !== '—' ? row.phone : '',
    email: row?.email && row.email !== '—' ? row.email : '',
    password: '',
  };
}

function relationInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function PatientRelationsTab({ patientId, patientName }) {
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [detailTab, setDetailTab] = useState('details');
  const [editingRelation, setEditingRelation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const isEditing = Boolean(editingRelation?.id);

  const loadRelations = useCallback(async () => {
    if (!patientId) {
      setRelations([]);
      setLoading(false);
      setListError('Patient ID is required to load relations.');
      return;
    }

    setLoading(true);
    setListError('');
    try {
      const list = await fetchPatientRelations(patientId);
      setRelations(list);
    } catch (err) {
      setRelations([]);
      setListError(err?.message || 'Unable to load patient relations.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadRelations();
  }, [loadRelations]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateModal = () => {
    setEditingRelation(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setFormError('');
    setSuccess('');
    setDetailTab('details');
    setShowModal(true);
  };

  const openEditModal = (row) => {
    setEditingRelation(row);
    setForm(formFromRelationRow(row));
    setShowPassword(false);
    setFormError('');
    setSuccess('');
    setDetailTab('details');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingRelation(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setFormError('');
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess('');
    setFormError('');

    if (!form.relationship.trim()) {
      setFormError('Select a relationship type.');
      return;
    }
    if (!form.firstName.trim()) {
      setFormError('Enter the relation’s first name.');
      return;
    }
    if (!form.lastName.trim()) {
      setFormError('Enter the relation’s last name.');
      return;
    }
    if (!form.phone.trim()) {
      setFormError('Enter a phone number.');
      return;
    }
    if (!form.email.trim()) {
      setFormError('Enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (!isEditing && (!form.password || form.password.length < 8)) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (isEditing && form.password && form.password.length < 8) {
      setFormError('New password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const updated = await updatePatientRelation(
          editingRelation.id,
          patientId,
          form,
          editingRelation,
        );
        const normalized = normalizeRelationRecord({
          ...editingRelation,
          ...updated,
          id: updated?.id || updated?.uuid || updated?._id || editingRelation.id,
          userId: updated?.userId || editingRelation.userId || updated?.user?.id,
          patientId: updated?.patientId || patientId,
          firstName: updated?.firstName || form.firstName,
          lastName: updated?.lastName || form.lastName,
          phone: form.phone.trim() || updated?.phone || updated?.user?.phone || '',
          user: {
            ...(editingRelation.user || {}),
            ...(updated?.user || {}),
            phone: form.phone.trim(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
          },
          email: updated?.email || form.email,
          relationship: updated?.relationship || form.relationship,
        }, 0);
        cacheRelationPhone(normalized.id, form.phone);
        if (normalized.userId) cacheRelationPhone(normalized.userId, form.phone);
        setRelations((prev) => prev.map((row) => (row.id === editingRelation.id ? normalized : row)));
        setSuccess(`${normalized.name} updated successfully.`);
      } else {
        const created = await createPatientRelation(patientId, form);
        const normalized = normalizeRelationRecord({
          ...created,
          patientId: created?.patientId || patientId,
          firstName: created?.firstName || created?.user?.firstName || form.firstName,
          lastName: created?.lastName || created?.user?.lastName || form.lastName,
          phone: form.phone.trim() || created?.phone || created?.user?.phone || '',
          user: {
            ...(created?.user || {}),
            phone: form.phone.trim(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
          },
          email: created?.email || created?.user?.email || form.email,
          relationship: created?.relationship || form.relationship,
        }, relations.length);
        cacheRelationPhone(normalized.id, form.phone);
        if (normalized.userId) cacheRelationPhone(normalized.userId, form.phone);
        setRelations((prev) => {
          const next = [normalized, ...prev.filter((row) => row.id !== normalized.id)];
          return next;
        });
        setSuccess(`${normalized.name} added as ${normalized.relationship}.`);
      }
      setForm(EMPTY_FORM);
      setShowPassword(false);
      setEditingRelation(null);
      setShowModal(false);
      loadRelations().catch(() => {});
    } catch (err) {
      setFormError(err?.message || (isEditing ? 'Unable to update patient relation.' : 'Unable to add patient relation.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelation = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deletePatientRelation(deleteTarget.id);
      setRelations((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      setSuccess(`${deleteTarget.name || 'Relation'} deleted successfully.`);
      setDeleteTarget(null);
      loadRelations().catch(() => {});
    } catch (err) {
      setDeleteError(err?.message || 'Unable to delete patient relation.');
    } finally {
      setDeleting(false);
    }
  };

  const canMutateRelation = (row) => Boolean(row?.id) && !String(row.id).startsWith('relation-');

  const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ').trim();
  const titlePreview = fullName || (isEditing ? 'Update relation' : 'New relation record');
  const relationshipOptions = (
    PATIENT_RELATION_OPTIONS.includes(form.relationship) || !form.relationship
      ? PATIENT_RELATION_OPTIONS
      : [...PATIENT_RELATION_OPTIONS, form.relationship]
  );
  const checklist = [
    { key: 'name', label: 'First and last name added', done: Boolean(form.firstName.trim() && form.lastName.trim()) },
    { key: 'contact', label: 'Phone & email provided', done: Boolean(form.phone.trim() && form.email.trim()) },
    {
      key: 'password',
      label: isEditing ? 'Password unchanged or updated (8+)' : 'Password set (8+ characters)',
      done: isEditing ? (!form.password || form.password.length >= 8) : form.password.length >= 8,
    },
  ];
  const checklistDone = checklist.filter((item) => item.done).length;
  const checklistProgress = Math.round((checklistDone / checklist.length) * 100);

  return (
    <section className="pp-relations" aria-labelledby="pp-relations-title">
      <header className="pp-relations__hero">
        <div className="pp-relations__hero-text">
          <h2 id="pp-relations-title" className="pp-relations__title">Patient Relation</h2>
          <p className="pp-relations__subtitle">
            Add family relations for {patientName || 'this patient'} — Father, Mother, Husband, Wife, Sibling, or Others.
          </p>
        </div>
        <div className="pp-relations__hero-actions">
          <button
            type="button"
            className="pp-relations__btn pp-relations__btn--ghost"
            onClick={loadRelations}
            disabled={loading || saving}
          >
            <FiRefreshCw size={15} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            className="pp-relations__btn pp-relations__btn--primary"
            onClick={openCreateModal}
          >
            <FiPlus size={15} aria-hidden />
            Add relation
          </button>
        </div>
      </header>

      {success ? (
        <div className="pp-relations__banner pp-relations__banner--success" role="status">
          <FiCheck size={15} aria-hidden />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')}>Dismiss</button>
        </div>
      ) : null}

      {listError ? (
        <div className="pp-relations__banner pp-relations__banner--error" role="alert">
          <FiAlertCircle size={15} aria-hidden />
          <span>{listError}</span>
          <button type="button" onClick={() => setListError('')}>Dismiss</button>
        </div>
      ) : null}

      <div className="pp-relations__list-card">
        <div className="pp-relations__list-head">
          <h3>Relation records</h3>
          <span>{relations.length} saved</span>
        </div>

        {loading ? (
          <div className="pp-relations__empty">Loading relations…</div>
        ) : relations.length === 0 ? (
          <div className="pp-relations__empty">
            <FiUser size={22} aria-hidden />
            <p>No relation records yet. Add a Father, Mother, Husband, Wife, Sibling, or Other.</p>
          </div>
        ) : (
          <div className="pp-relations__table-wrap">
            <table className="pp-relations__table">
              <thead>
                <tr>
                  <th>Relationship</th>
                  <th>Name</th>
                  <th>Telephone</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {relations.map((row) => {
                  const mutable = canMutateRelation(row);
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className="pp-relations__chip">{row.relationship}</span>
                      </td>
                      <td className="pp-relations__strong">{row.name}</td>
                      <td data-label="Telephone" className="pp-relations__phone">
                        {row.phone && row.phone !== '—' ? row.phone : (row.telephone && row.telephone !== '—' ? row.telephone : '—')}
                      </td>
                      <td>{row.email}</td>
                      <td data-label="Actions">
                        <div className="pp-relations__actions">
                          <button
                            type="button"
                            className="pp-relations__action-btn pp-relations__action-btn--update"
                            onClick={() => openEditModal(row)}
                            disabled={!mutable || saving || deleting}
                            title={mutable ? 'Update relation' : 'Cannot update this record'}
                          >
                            <FiEdit2 size={14} aria-hidden />
                            Update
                          </button>
                          <button
                            type="button"
                            className="pp-relations__action-btn pp-relations__action-btn--delete"
                            onClick={() => {
                              setDeleteError('');
                              setDeleteTarget(row);
                            }}
                            disabled={!mutable || saving || deleting}
                            title={mutable ? 'Delete relation' : 'Cannot delete this record'}
                          >
                            <FiTrash2 size={14} aria-hidden />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        show={showModal}
        onHide={closeModal}
        animation={false}
        centered
        scrollable
        backdrop={saving ? 'static' : true}
        keyboard={!saving}
        className="prm-modal"
        dialogClassName="prm-modal__dialog"
        contentClassName="prm-modal__content"
      >
        <form id="patient-relation-form" className="prm-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="prm-modal__shell">
            <div className="prm-modal__main">
              <div className="prm-modal__topbar">
                <div className="prm-modal__breadcrumb">
                  Patients / <span>{isEditing ? 'Update relation' : 'Create a relation'}</span>
                </div>
                <button
                  type="button"
                  className="prm-modal__icon-btn"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="prm-modal__name-row">
                <input
                  className="prm-modal__title-input"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  aria-label="First name"
                />
                <input
                  className="prm-modal__title-input"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  aria-label="Last name"
                />
              </div>

              <div className="prm-modal__tabs" role="tablist" aria-label="Relation form sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'details'}
                  className={`prm-modal__tab${detailTab === 'details' ? ' is-active' : ''}`}
                  onClick={() => setDetailTab('details')}
                >
                  Details
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'preview'}
                  className={`prm-modal__tab${detailTab === 'preview' ? ' is-active' : ''}`}
                  onClick={() => setDetailTab('preview')}
                >
                  Preview
                </button>
              </div>

              {formError ? (
                <div className="prm-modal__error" role="alert">
                  <FiAlertCircle size={15} aria-hidden />
                  <span>{formError}</span>
                </div>
              ) : null}

              {detailTab === 'details' ? (
                <>
                  <div className="prm-modal__card">
                    <label className="prm-modal__field">
                      <span>Phone</span>
                      <div className="prm-modal__input-wrap">
                        <FiPhone size={16} aria-hidden />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setField('phone', e.target.value)}
                          placeholder="08012345678"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </label>

                    <label className="prm-modal__field">
                      <span>Email</span>
                      <div className="prm-modal__input-wrap">
                        <FiMail size={16} aria-hidden />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder="Enter email address"
                          autoComplete="email"
                          required
                        />
                      </div>
                    </label>

                    <label className="prm-modal__field">
                      <span>{isEditing ? 'Password (optional)' : 'Password'}</span>
                      <div className="prm-modal__input-wrap prm-modal__input-wrap--password">
                        <FiLock size={16} aria-hidden />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setField('password', e.target.value)}
                          placeholder={isEditing ? 'Leave blank to keep current' : 'Min 8 characters'}
                          autoComplete="new-password"
                          required={!isEditing}
                          minLength={isEditing ? undefined : 8}
                        />
                        <button
                          type="button"
                          className="prm-modal__password-toggle"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="prm-modal__checklist">
                    <div className="prm-modal__checklist-head">
                      <span>CHECKLIST</span>
                      <div className="prm-modal__progress" aria-hidden>
                        <span style={{ width: `${checklistProgress}%` }} />
                      </div>
                    </div>
                    <ul className="prm-modal__checklist-list">
                      {checklist.map((item) => (
                        <li key={item.key} className={item.done ? 'is-done' : ''}>
                          <span className={`prm-modal__check${item.done ? ' is-checked' : ''}`} aria-hidden>
                            {item.done ? <FiCheck size={12} /> : null}
                          </span>
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="prm-modal__preview-card">
                  <div className="prm-modal__preview-avatar" aria-hidden>
                    {relationInitials(titlePreview)}
                  </div>
                  <div className="prm-modal__preview-body">
                    <strong>{titlePreview}</strong>
                    <span>{form.relationship}</span>
                    <span>{form.phone.trim() || 'No phone yet'}</span>
                    <span>{form.email.trim() || 'No email yet'}</span>
                  </div>
                </div>
              )}
            </div>

            <aside className="prm-modal__sidebar" aria-label="Relation attributes">
              <button type="button" className="prm-modal__project-row" tabIndex={-1}>
                <span className="prm-modal__project-icon" aria-hidden>
                  <FiGrid size={18} />
                </span>
                <span className="prm-modal__project-label">
                  {patientName || 'Selected patient'}
                </span>
                <FiChevronRight size={18} className="prm-modal__project-chevron" aria-hidden />
              </button>

              <div className="prm-modal__attr-head">
                <span>ATTRIBUTES</span>
              </div>

              <div className="prm-modal__attr-list">
                <div className="prm-modal__attr-row">
                  <span className="prm-modal__attr-label">Relationship</span>
                  <label className="prm-modal__attr-select-wrap">
                    <select
                      value={form.relationship}
                      onChange={(e) => setField('relationship', e.target.value)}
                      aria-label="Relationship"
                      required
                    >
                      {relationshipOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="prm-modal__attr-row">
                  <span className="prm-modal__attr-label">Status</span>
                  <span className="prm-modal__badge prm-modal__badge--progress">
                    <span className="prm-modal__badge-dot" aria-hidden />
                    {isEditing ? 'Editing' : 'Draft'}
                  </span>
                </div>

                <div className="prm-modal__attr-row">
                  <span className="prm-modal__attr-label">Patient</span>
                  <span className="prm-modal__assignee">
                    <span className="prm-modal__assignee-avatar" aria-hidden>
                      {relationInitials(patientName || 'P')}
                    </span>
                    <span>{patientName || 'Patient'}</span>
                  </span>
                </div>

                <div className="prm-modal__attr-row is-highlight">
                  <span className="prm-modal__attr-label">Access</span>
                  <span className="prm-modal__date-chip">
                    <FiLock size={14} aria-hidden />
                    Login enabled
                  </span>
                </div>
              </div>

              <div className="prm-modal__sidebar-actions">
                <button
                  type="button"
                  className="prm-modal__btn prm-modal__btn--ghost"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="prm-modal__btn prm-modal__btn--create"
                  disabled={saving}
                >
                  {saving
                    ? (isEditing ? 'Saving…' : 'Creating…')
                    : (isEditing ? 'Update' : '+ Create')}
                </button>
              </div>
            </aside>
          </div>
        </form>
      </Modal>

      {deleteTarget ? (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pr-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="pr-delete-title" className="destructive-confirm-dialog__title">
                Delete relation
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={deleting}
                onClick={closeDeleteModal}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete this patient relation? Their login access for this patient will be removed.
              </p>
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> This relation record may be{' '}
                  <strong>permanently deleted</strong>.
                </div>
              </div>
              {deleteError ? (
                <div className="destructive-confirm-dialog__banner-error" role="alert">{deleteError}</div>
              ) : null}
              <div className="destructive-confirm-dialog__card">
                <div
                  className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand"
                  aria-hidden
                >
                  {relationInitials(deleteTarget.name)}
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">
                    {deleteTarget.name || 'Relation'}
                  </div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {[deleteTarget.relationship, deleteTarget.email].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            </div>
            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={deleting}
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={deleting}
                onClick={handleDeleteRelation}
              >
                <FiTrash2 size={14} aria-hidden />
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
