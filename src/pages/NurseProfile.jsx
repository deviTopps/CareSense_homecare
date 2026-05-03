import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar,
  FiUser, FiFileText, FiEdit2, FiDownload, FiEye,
  FiCheckCircle, FiClock, FiPrinter, FiMoreHorizontal,
  FiShield, FiAward, FiClipboard, FiUpload, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiRefreshCw, FiCheck, FiCamera, FiX, FiSave, FiPlus, FiTrash2, FiUsers,
} from '../icons/hugeicons-feather';
import { apiFetch, API_BASE } from '../api';
import { fetchAllPatients } from '../utils/patients';
import compressImage, { createThumbnailURL } from '../utils/compressImage';

const ROLE_LABELS = {
  head_nurse: 'Head Nurse',
  supervising_nurse: 'Supervising Nurse',
  office_nurse: 'Office Nurse',
  field_nurse: 'Field Nurse',
};

/* ── Tiny shared components ── */
const DataRow = ({ label, children, missing }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5 }}>
    <span style={{ flexShrink: 0, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ color: missing ? '#d97706' : 'var(--kh-text)', fontWeight: 500, textAlign: 'right', fontStyle: missing ? 'italic' : 'normal' }}>
      {children || (missing ? 'Not provided' : '—')}
    </span>
  </div>
);

const Panel = ({ title, icon, accent, children, action, style }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 12, ...style }}>
    <div style={{
      padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderLeft: accent ? `3px solid ${accent}` : 'none',
    }}>
      <div className="d-flex align-items-center gap-2">
        {icon && <span style={{ color: accent || '#45B6FE', display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text)' }}>{title}</span>
      </div>
      {action && action}
    </div>
    <div style={{ padding: '12px 16px' }}>{children}</div>
  </div>
);

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
    <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#45B6FE' }} />
    <span style={{ fontSize: 14, color: 'var(--kh-text-muted)' }}>Loading nurse profile…</span>
  </div>
);

const TABS = [
  { key: 'overview',   label: 'Overview',           icon: <FiUser size={14} /> },
  { key: 'diversity',  label: 'Diversity & Health',  icon: <FiShield size={14} /> },
  { key: 'education',  label: 'Education',           icon: <FiAward size={14} /> },
  { key: 'supporting', label: 'Supporting Info',     icon: <FiClipboard size={14} /> },
  { key: 'documents',  label: 'Documents',           icon: <FiFileText size={14} /> },
];

const DOCUMENT_TYPE_MAP = {
  profilePhoto: 'Other',
  idCard: 'ID',
  passport: 'ID',
  nursingLicense: 'License',
  dbsCertificate: 'Certificate',
};

/* Reverse-map: try to match an API document to a kycDocs slot by documentType.
   Since multiple slots share the same type (e.g. idCard & passport → 'ID'),
   we fill the first unoccupied slot that matches. */
const DOC_TYPE_TO_SLOTS = {
  Other: ['profilePhoto'],
  ID: ['idCard', 'passport'],
  License: ['nursingLicense'],
  Certificate: ['dbsCertificate'],
};

const MIME_TYPES_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

function extractUrlFromPayload(payload) {
  if (!payload) return null;

  const url =
    payload?.url
    || payload?.link?.url
    || payload?.data?.url
    || payload?.data?.link?.url
    || payload?.media?.link?.url
    || payload?.media?.url
    || payload?.upload?.url
    || payload?.downloadUrl
    || payload?.signedUrl
    || payload?.presignedUrl
    || null;

  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

function inferMimeType(value) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';
  if (normalizedValue.includes('/')) return normalizedValue;

  const sanitizedValue = normalizedValue.split('?')[0].split('#')[0];
  const extension = sanitizedValue.split('.').pop()?.toLowerCase();
  return extension ? MIME_TYPES_BY_EXTENSION[extension] || '' : '';
}

function normalizeAssignedNurseEntry(nurse, index = 0) {
  if (!nurse) return null;

  if (typeof nurse === 'string') {
    const name = nurse.trim();
    return name ? { id: `name:${name.toLowerCase()}:${index}`, name } : null;
  }

  const firstName = nurse?.firstName || nurse?.personal?.firstName || nurse?.nurse?.firstName || '';
  const lastName = nurse?.lastName || nurse?.personal?.lastName || nurse?.nurse?.lastName || '';
  const name = nurse?.name || nurse?.fullName || nurse?.nurse?.name || `${firstName} ${lastName}`.trim();

  if (!name) return null;

  return {
    id: nurse?._id || nurse?.id || nurse?.uuid || nurse?.nurseId || nurse?.nurse?._id || nurse?.nurse?.id || nurse?.nurse?.uuid || `name:${name.toLowerCase()}`,
    uuid: nurse?.uuid || nurse?.nurse?.uuid || null,
    name,
  };
}

function normalizeAssignedPatient(patient, index = 0) {
  const firstName = patient?.firstName || '';
  const lastName = patient?.lastName || '';
  const name = patient?.name || patient?.fullName || `${firstName} ${lastName}`.trim() || 'Unknown Patient';
  const assignedSource = patient?.nurses || patient?.assignedNurses || patient?.assigned_nurses || [];
  const assignedNurses = Array.isArray(assignedSource)
    ? assignedSource.map((entry, assignedIndex) => normalizeAssignedNurseEntry(entry, assignedIndex)).filter(Boolean)
    : [];
  const enrolledRaw = patient?.dateOfAdmission || patient?.admissionDate || patient?.createdAt || patient?.created_at || '';
  const enrolled = typeof enrolledRaw === 'string' && enrolledRaw.includes('T') ? enrolledRaw.split('T')[0] : (enrolledRaw || '—');
  const statusRaw = String(patient?.status || 'active').toLowerCase();

  return {
    id: patient?.patientId || patient?.registrationNumber || patient?.regNo || patient?.id || patient?._id || `patient-${index + 1}`,
    uuid: patient?.uuid || patient?.patientUuid || patient?.patientUUID || patient?.patient?.uuid || null,
    name,
    diagnosis: patient?.diagnosis || patient?.medicalCondition || patient?.careNeeds || '—',
    region: patient?.region || patient?.location || patient?.residentialAddress || '—',
    status: statusRaw === 'discharged' ? 'discharged' : 'active',
    enrolled,
    assignedNurses,
  };
}

function normalizeAssignmentRecord(assignment, index = 0) {
  if (!assignment || typeof assignment !== 'object') return null;

  const patient = assignment?.patient || assignment?.client || assignment?.patientInfo || null;
  const nurse = assignment?.nurse || assignment?.staff || assignment?.caregiver || null;

  return {
    id: assignment?._id || assignment?.id || `assignment-${index + 1}`,
    patientId: assignment?.patientId || assignment?.patient?.id || assignment?.patient?._id || assignment?.patient?.patientId || null,
    patientUuid: assignment?.patientUuid || assignment?.patientUUID || assignment?.patient?.uuid || null,
    patientName: assignment?.patientName || patient?.name || [patient?.firstName, patient?.lastName].filter(Boolean).join(' '),
    nurseId: assignment?.nurseId || nurse?.id || nurse?._id || assignment?.staffId || null,
    nurseUuid: assignment?.nurseUuid || assignment?.staffUuid || nurse?.uuid || null,
    nurseName: assignment?.nurseName || nurse?.name || [nurse?.firstName, nurse?.lastName].filter(Boolean).join(' '),
  };
}

function assignmentMatchesNurse(assignment, nurseProfile, fallbackRouteId) {
  const candidateValues = [
    nurseProfile?._id,
    nurseProfile?.id,
    nurseProfile?.uuid,
    nurseProfile?.nurseId,
    fallbackRouteId,
    nurseProfile?.email,
    [nurseProfile?.firstName, nurseProfile?.lastName].filter(Boolean).join(' '),
    nurseProfile?.name,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  const assignmentValues = [assignment?.nurseId, assignment?.nurseUuid, assignment?.nurseName]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return assignmentValues.some((value) => candidateValues.includes(value));
}

function patientMatchesAssignment(patient, assignment) {
  const patientValues = [patient?.id, patient?.uuid, patient?.name]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  const assignmentValues = [assignment?.patientId, assignment?.patientUuid, assignment?.patientName]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return assignmentValues.some((value) => patientValues.includes(value));
}

function patientMatchesNurse(patient, nurseProfile, fallbackRouteId) {
  const candidateValues = [
    nurseProfile?._id,
    nurseProfile?.id,
    nurseProfile?.uuid,
    nurseProfile?.nurseId,
    fallbackRouteId,
    nurseProfile?.email,
    [nurseProfile?.firstName, nurseProfile?.lastName].filter(Boolean).join(' '),
    nurseProfile?.name,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return patient.assignedNurses.some((assigned) => {
    const assignedValues = [assigned?.id, assigned?.uuid, assigned?.name]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);

    return assignedValues.some((value) => candidateValues.includes(value));
  });
}

function extractNurseProfileImage(rawPayload) {
  const personal = rawPayload?.personal || rawPayload?.nurse || rawPayload || {};
  const profileImage = personal?.profileImage || personal?.profilePicture || personal?.image || personal?.photo || {};
  const documents = Array.isArray(rawPayload?.documents)
    ? rawPayload.documents
    : Array.isArray(personal?.documents)
      ? personal.documents
      : [];

  const profileDoc = documents.find((doc) => {
    const docType = String(doc?.documentType || '').toLowerCase();
    return docType.includes('profile') || docType.includes('photo') || docType.includes('avatar');
  }) || null;

  return {
    url:
      profileImage?.link?.url
      || profileImage?.url
      || personal?.profileImageUrl
      || personal?.profilePictureUrl
      || personal?.imageUrl
      || personal?.photoUrl
      || personal?.avatarUrl
      || rawPayload?.profileImageUrl
      || profileDoc?.link?.url
      || profileDoc?.url
      || null,
    objectKey:
      profileImage?.objectKey
      || personal?.profileImageObjectKey
      || personal?.profilePictureObjectKey
      || profileDoc?.objectKey
      || null,
    mediaId:
      profileImage?.mediaId
      || profileImage?.media?.id
      || personal?.profileImageMediaId
      || personal?.profilePictureMediaId
      || profileDoc?.mediaId
      || profileDoc?.media?.id
      || null,
    fileName:
      profileImage?.fileName
      || profileImage?.name
      || profileDoc?.fileName
      || profileDoc?.objectKey?.split('/').pop()
      || 'profile-photo',
    fileType:
      inferMimeType(profileImage?.mimeType)
      || inferMimeType(profileImage?.contentType)
      || inferMimeType(profileImage?.fileType)
      || inferMimeType(profileDoc?.mimeType)
      || inferMimeType(profileDoc?.contentType)
      || inferMimeType(profileDoc?.fileType)
      || inferMimeType(profileDoc?.objectKey)
      || 'image/jpeg',
    uploadedAt:
      profileImage?.createdAt
      || profileDoc?.createdAt
      || null,
  };
}

/* ── Main Component ── */
export default function NurseProfile() {
  const { nurseId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  // ── Data state ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nurse, setNurse] = useState(null);
  const [diversity, setDiversity] = useState(null);
  const [education, setEducation] = useState(null);
  const [supporting, setSupporting] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);

  // ── Avatar upload ──
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingKey, setUploadingKey] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null); // { url, fileName, fileType, label }
  const [editingSection, setEditingSection] = useState(null); // 'personal' | 'diversity' | 'education' | 'supporting'
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const ef = (field) => editForm[field] ?? '';
  const uf = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

  const SECTION_ENDPOINTS = {
    personal:       '/nurses/update/personal-info',
    professional:   '/nurses/update/personal-info',
    diversity:      '/nurses/update/diversity-info',
    education:      '/nurses/update/education-info',
    qualifications: '/nurses/update/education-info',
    training:       '/nurses/update/education-info',
    employment:     '/nurses/update/education-info',
    supporting:     '/nurses/update/supporting-info',
  };

  const startEditing = (section, data) => {
    setEditingSection(section);
    setEditForm(data || {});
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditForm({});
    setEditError('');
  };

  const handleSaveSection = async () => {
    const endpoint = SECTION_ENDPOINTS[editingSection];
    if (!endpoint) return;
    const resolvedId = nurse?._id || nurse?.id || nurseId;
    setSavingEdit(true);
    setEditError('');
    try {
      const res = await apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ nurseId: resolvedId, ...editForm }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.message || `Update failed (HTTP ${res.status})`);
      }
      // Refresh profile data from server
      await fetchProfile();
      setEditingSection(null);
      setEditForm({});
    } catch (err) {
      setEditError(err.message || 'Failed to save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const editInputStyle = { width: '100%', padding: '7px 10px', fontSize: 12.5, border: '1px solid #d1d5db', borderRadius: 4, background: '#fff', color: 'var(--kh-text)', outline: 'none' };
  const editSelectStyle = { ...editInputStyle, appearance: 'auto' };
  const EditRow = ({ label, field, type = 'text', options, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5, gap: 12 }}>
      <span style={{ flexShrink: 0, color: 'var(--kh-text-muted)', fontWeight: 500, minWidth: 110 }}>{label}</span>
      {children || (
        options ? (
          <select style={editSelectStyle} value={ef(field)} onChange={e => uf(field, e.target.value)}>
            <option value="">Select...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} style={editInputStyle} value={ef(field)} onChange={e => uf(field, e.target.value)} />
        )
      )}
    </div>
  );

  const EditActions = () => (
    <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
      {editError && <div style={{ flex: 1, fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><FiAlertCircle size={12} />{editError}</div>}
      <button onClick={cancelEditing} disabled={savingEdit} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#374151', cursor: 'pointer' }}>
        Cancel
      </button>
      <button onClick={handleSaveSection} disabled={savingEdit} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 6, background: '#45B6FE', color: '#fff', cursor: savingEdit ? 'not-allowed' : 'pointer', opacity: savingEdit ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}>
        <FiSave size={12} /> {savingEdit ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
  const avatarInputRef = useRef(null);
  const resolveStoredMediaUrl = useCallback(async ({ mediaId, objectKey }) => {
    const normalizedMediaId = String(mediaId || '').trim();
    const normalizedObjectKey = String(objectKey || '').trim();

    if (!normalizedMediaId && !normalizedObjectKey) return null;

    const requestCandidates = [
      {
        path: '/media/b2/view-url',
        method: 'POST',
        body: {
          ...(normalizedMediaId ? { mediaId: normalizedMediaId } : {}),
          ...(normalizedObjectKey ? { objectKey: normalizedObjectKey } : {}),
        },
      },
      {
        path: '/media/b2/download-url',
        method: 'POST',
        body: {
          ...(normalizedMediaId ? { mediaId: normalizedMediaId } : {}),
          ...(normalizedObjectKey ? { objectKey: normalizedObjectKey } : {}),
        },
      },
      ...(normalizedMediaId
        ? [
            { path: `/media/${normalizedMediaId}`, method: 'GET' },
            { path: `/media/${normalizedMediaId}/link`, method: 'GET' },
          ]
        : []),
    ];

    for (const candidate of requestCandidates) {
      try {
        const response = await apiFetch(candidate.path, {
          method: candidate.method,
          ...(candidate.body ? { body: JSON.stringify(candidate.body) } : {}),
        });

        const responseText = await response.text().catch(() => '');
        let payload = {};
        if (responseText) {
          try {
            payload = JSON.parse(responseText);
          } catch {
            payload = { url: responseText };
          }
        }

        if (!response.ok) continue;

        const resolvedUrl = extractUrlFromPayload(payload);
        if (resolvedUrl) return resolvedUrl;
      } catch {
      }
    }

    return null;
  }, []);

  const uploadNurseDocument = useCallback(async (file, key, { registerEndpoint } = {}) => {
    const resolvedNurseId = nurse?._id || nurse?.id || nurseId;

    if (!resolvedNurseId) {
      throw new Error('Nurse ID is missing for upload.');
    }

    /* ── Step 1: Upload file to storage via server ── */
    const formData = new FormData();
    formData.append('file', file);

    let uploadResponse;
    try {
      const token = localStorage.getItem('token');
      uploadResponse = await fetch(
        `${API_BASE}/media/b2/upload/direct`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        },
      );
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        throw new Error('Could not reach upload endpoint. Check backend URL, CORS, and network connectivity.');
      }
      throw requestError;
    }

    const uploadResult = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error || uploadResult.message || `Upload failed (HTTP ${uploadResponse.status})`);
    }

    const objectKey = uploadResult.upload?.objectKey;
    const mediaId = uploadResult.media?.id;

    if (!objectKey || !mediaId) {
      throw new Error('Upload response missing objectKey or mediaId.');
    }

    /* ── Step 2: Register the document/profile picture ── */
    let endpoint, body, method;
    if (registerEndpoint) {
      // Profile picture — try multiple common route patterns
      endpoint = registerEndpoint.replace(':nurseId', resolvedNurseId);
      body = { nurseId: resolvedNurseId, objectKey, mediaId };
      method = 'PUT';
    } else {
      endpoint = '/nurses/add/documents';
      body = { nurseId: resolvedNurseId, documentType: DOCUMENT_TYPE_MAP[key] || 'Certificate', objectKey, mediaId };
      method = 'POST';
    }

    let registerResponse;
    try {
      registerResponse = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(body),
      });

      // If PUT returns 404, retry with PATCH
      if (registerEndpoint && registerResponse.status === 404) {
        registerResponse = await apiFetch(endpoint, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      // If still 404, retry with POST
      if (registerEndpoint && registerResponse.status === 404) {
        registerResponse = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }


    } catch (registerError) {
      if (registerError instanceof TypeError) {
        throw new Error('File uploaded but registration failed due to network/CORS issue reaching backend.');
      }
      throw registerError;
    }

    const result = await registerResponse.json().catch(() => ({}));
    if (!registerResponse.ok) {
      throw new Error(result.error || result.message || `Registration failed (HTTP ${registerResponse.status})`);
    }

    return result;
  }, [nurse, nurseId]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_DOC_TYPES   = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('Only JPG, PNG, or WebP images are allowed.'); e.target.value = ''; return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('File must be under 5 MB.'); e.target.value = ''; return;
    }

    setUploadingKey('profilePhoto');
    try {
      // Compress image before uploading (faster upload + less bandwidth)
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.75 });
      const uploadResult = await uploadNurseDocument(compressed, 'profilePhoto', { registerEndpoint: '/nurses/update/profile-picture' });
      // Use a small thumbnail for the avatar preview
      const thumbUrl = await createThumbnailURL(compressed, 200);
      const persistedUrl = extractUrlFromPayload(uploadResult);
      const url = thumbUrl || persistedUrl || URL.createObjectURL(compressed);
      setAvatarUrl(url);
      setKycDocs(prev => ({
        ...prev,
        profilePhoto: {
          url,
          fullUrl: persistedUrl || url,
          fileName: file.name,
          fileType: file.type,
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
      }));
    } catch (uploadError) {
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingKey('');
      e.target.value = '';
    }
  };

  // ── KYC document uploads ──
  const [kycDocs, setKycDocs] = useState({
    profilePhoto: null,   // { url, fileName, uploadedAt }
    idCard:       null,
    passport:     null,
    nursingLicense: null,
    dbsCertificate: null,
  });
  const kycInputRefs = {
    profilePhoto:   useRef(null),
    idCard:         useRef(null),
    passport:       useRef(null),
    nursingLicense: useRef(null),
    dbsCertificate: useRef(null),
  };
  const handleKycUpload = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = key === 'profilePhoto' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
    if (!allowed.includes(file.type)) {
      alert(key === 'profilePhoto' ? 'Only JPG, PNG, or WebP images are allowed.' : 'Only JPG, PNG, WebP, or PDF files are allowed.');
      e.target.value = ''; return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('File must be under 5 MB.'); e.target.value = ''; return;
    }

    setUploadingKey(key);
    try {
      // Compress images before upload (smaller payload = faster upload)
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
      const opts = key === 'profilePhoto' ? { registerEndpoint: '/nurses/update/profile-picture' } : undefined;
      const uploadResult = await uploadNurseDocument(compressed, key, opts);

      const isImage = compressed.type.startsWith('image/');
      // Use small thumbnail for card grid (loads instantly), keep original URL for full preview
      const thumbUrl = isImage ? await createThumbnailURL(compressed, 300) : null;
      const persistedUrl = extractUrlFromPayload(uploadResult);
      setKycDocs(prev => ({
        ...prev,
        [key]: {
          url: thumbUrl || persistedUrl,
          fullUrl: persistedUrl || (isImage ? URL.createObjectURL(compressed) : null),
          fileName: file.name,
          fileType: file.type,
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
      }));

      if (key === 'profilePhoto') {
        setAvatarUrl(thumbUrl || persistedUrl || null);
      }
    } catch (uploadError) {
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingKey('');
      e.target.value = '';
    }
  };

  // ── Fetch all profile sections ──
  // GET /nurses/:id returns a single combined object:
  // { personal, diversity, education, supportingInfo }
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/nurses/${nurseId}`);
      if (!res.ok) {
        if (res.status === 404) { setError('not_found'); setLoading(false); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const personalData = data.personal || data.nurse || data;
      // API returns { personal, diversity, education, supportingInfo, documents }
      setNurse(personalData);
      setDiversity(data.diversity || null);
      setEducation(data.education || null);
      setSupporting(data.supportingInfo || null);

      try {
        const [assignmentsRes, patientsRes] = await Promise.all([
          apiFetch('/assignments', { method: 'GET' }).catch(() => null),
          fetchAllPatients().catch(() => []),
        ]);

        let assignmentsPayload = {};
        if (assignmentsRes) {
          try {
            assignmentsPayload = await assignmentsRes.json();
          } catch {
            assignmentsPayload = {};
          }
        }

        const patientList = Array.isArray(patientsRes) ? patientsRes : [];

        if (patientList.length > 0) {

            const assignmentList = Array.isArray(assignmentsPayload)
              ? assignmentsPayload
              : Array.isArray(assignmentsPayload?.assignments)
                ? assignmentsPayload.assignments
                : Array.isArray(assignmentsPayload?.data)
                  ? assignmentsPayload.data
                  : Array.isArray(assignmentsPayload?.items)
                    ? assignmentsPayload.items
                    : [];

            const normalizedAssignments = assignmentList
              .map((assignment, index) => normalizeAssignmentRecord(assignment, index))
              .filter(Boolean)
              .filter((assignment) => assignmentMatchesNurse(assignment, personalData, nurseId));

            let matchedPatients = patientList
            .map((patient, index) => normalizeAssignedPatient(patient, index))
              .filter((patient) => patientMatchesNurse(patient, personalData, nurseId));

            if (normalizedAssignments.length > 0) {
              matchedPatients = patientList
                .map((patient, index) => normalizeAssignedPatient(patient, index))
                .filter((patient) => normalizedAssignments.some((assignment) => patientMatchesAssignment(patient, assignment)));
            }

          setAssignedPatients(matchedPatients);
        } else {
          setAssignedPatients([]);
        }
      } catch {
        setAssignedPatients([]);
      }

      const filled = {};
      const newKyc = {
        profilePhoto: null,
        idCard: null,
        passport: null,
        nursingLicense: null,
        dbsCertificate: null,
      };

      const persistedProfilePhoto = extractNurseProfileImage({ ...data, personal: personalData });
      const resolvedProfilePhotoUrl = persistedProfilePhoto.url || await resolveStoredMediaUrl({
        mediaId: persistedProfilePhoto.mediaId,
        objectKey: persistedProfilePhoto.objectKey,
      });

      if (resolvedProfilePhotoUrl) {
        newKyc.profilePhoto = {
          url: resolvedProfilePhotoUrl,
          fullUrl: resolvedProfilePhotoUrl,
          fileName: persistedProfilePhoto.fileName,
          fileType: persistedProfilePhoto.fileType,
          uploadedAt: persistedProfilePhoto.uploadedAt
            ? new Date(persistedProfilePhoto.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          mediaId: persistedProfilePhoto.mediaId,
          objectKey: persistedProfilePhoto.objectKey,
        };
        filled.profilePhoto = true;
        setAvatarUrl(resolvedProfilePhotoUrl);
      } else {
        setAvatarUrl(null);
      }

      const persistedDocuments = Array.isArray(data.documents) ? data.documents : [];
      for (const doc of persistedDocuments) {
        const possibleSlots = DOC_TYPE_TO_SLOTS[doc.documentType] || [];
        const targetSlot = possibleSlots.find(s => !filled[s]);
        if (!targetSlot) continue;
        filled[targetSlot] = true;

        const resolvedUrl = doc.link?.url || doc.url || await resolveStoredMediaUrl({
          mediaId: doc.mediaId || doc.media?.id,
          objectKey: doc.objectKey,
        });
        const hydratedFileType =
          inferMimeType(doc.mimeType)
          || inferMimeType(doc.contentType)
          || inferMimeType(doc.link?.contentType)
          || inferMimeType(doc.fileType)
          || inferMimeType(doc.fileName)
          || inferMimeType(doc.objectKey);

        newKyc[targetSlot] = {
          url: resolvedUrl,
          fullUrl: resolvedUrl,
          fileName: doc.fileName || doc.objectKey?.split('/').pop() || doc.documentType,
          fileType: hydratedFileType,
          uploadedAt: doc.createdAt
            ? new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          mediaId: doc.mediaId || doc.media?.id,
          objectKey: doc.objectKey,
          docId: doc.id,
        };

        if (targetSlot === 'profilePhoto' && resolvedUrl) {
          setAvatarUrl(resolvedUrl);
        }
      }

      setKycDocs(newKyc);
    } catch (e) {
      setAssignedPatients([]);
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [nurseId, resolveStoredMediaUrl]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Error / not-found screens ──
  if (loading) return <div className="page-wrapper"><Spinner /></div>;

  if (error === 'not_found') return (
    <div className="page-wrapper text-center py-5">
      <FiUser size={48} style={{ color: 'var(--kh-border)', marginBottom: 16 }} />
      <h6 style={{ color: 'var(--kh-text-muted)' }}>Nurse record not found</h6>
      <button className="btn btn-kh-primary mt-3" onClick={() => navigate('/workforce')}>
        Return to Nurse List
      </button>
    </div>
  );

  if (error) return (
    <div className="page-wrapper text-center py-5">
      <FiAlertCircle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
      <h6 style={{ color: 'var(--kh-text-muted)', marginBottom: 16 }}>{error}</h6>
      <div className="d-flex gap-2 justify-content-center">
        <button className="btn btn-kh-outline" onClick={() => navigate('/workforce')}>← Back</button>
        <button className="btn btn-kh-primary" onClick={fetchProfile}>
          <FiRefreshCw size={13} style={{ marginRight: 6 }} /> Retry
        </button>
      </div>
    </div>
  );

  if (!nurse) return null;

  // ── Derived values ──
  const n = nurse;
  const fullName = [n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—';
  const roleLabel = ROLE_LABELS[n.role] || n.role || '—';
  const status = n.status || 'active';
  const initials = fullName !== '—' ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const joinedDate = n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : '—';

  const hasDiversity = !!diversity;
  const hasEducation = !!education;
  const hasSupporting = !!supporting;
  const stepsComplete = [true, hasDiversity, hasEducation, hasSupporting].filter(Boolean).length;
  const isFullyComplete = stepsComplete === 4;

  // ── Patients assigned to this nurse ──
  const currentPatients = assignedPatients.filter(p => p.status === 'active');
  const pastPatients = assignedPatients.filter(p => p.status !== 'active');
  const profileDetails = [
    { label: 'Gender', value: n.gender || '—' },
    { label: 'Joined', value: joinedDate },
    { label: 'Phone', value: n.phone || '—' },
    { label: 'Address', value: n.address || '—' },
    { label: 'Citizenship', value: n.citizenship || '—' },
    { label: 'License', value: n.mmcPinNo || '—' },
  ];
  const profileNotes = [
    supporting?.staffRelation === 'Yes' ? `Related to staff: ${supporting?.staffRelationDetail || 'Yes'}` : 'No staff relationship disclosed',
    supporting?.vacancyAdvertised ? `Vacancy source: ${supporting.vacancyAdvertised}` : 'Vacancy source not recorded',
    education?.trainingCourses?.filter(Boolean)?.length ? `${education.trainingCourses.filter(Boolean).length} training course(s) recorded` : 'No training courses recorded',
    supporting?.referees?.length ? `${supporting.referees.length} referee(s) on file` : 'No referees added yet',
  ].filter(Boolean);
  const documentsPreview = Object.entries(kycDocs)
    .filter(([, doc]) => !!doc)
    .slice(0, 4)
    .map(([key, doc]) => ({ key, ...doc }));
  const overviewRoster = (currentPatients.length ? currentPatients : assignedPatients).slice(0, 4);
  const snapshotItems = [
    { label: 'Current Patients', value: currentPatients.length },
    { label: 'Documents Uploaded', value: Object.values(kycDocs).filter(Boolean).length },
    { label: 'Qualifications', value: education?.qualifications?.filter(q => q?.name || q?.institution)?.length || 0 },
    { label: 'Referees', value: supporting?.referees?.length || 0 },
  ];

  /* ── RENDER ── */
  return (
    <div className="page-wrapper nurse-profile-page">

      {/* Incomplete banner */}
      {!isFullyComplete && (
        <div className="nurse-profile-banner">
          <FiClock size={15} style={{ color: '#d97706', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            Registration incomplete — {stepsComplete}/4 steps completed.
          </span>
          <button
            onClick={() => navigate('/workforce')}
            className="nurse-profile-banner__btn"
          >
            Complete Registration
          </button>
        </div>
      )}

      <div className="nurse-profile-shell">
      <div className="nurse-profile-topbar">
        <div className="nurse-profile-topbar__left">
          <button onClick={() => navigate('/workforce')} className="nurse-profile-icon-btn"><FiArrowLeft size={15} /></button>
          <div className="nurse-profile-breadcrumbs">
            <span>Nurses</span>
            <FiChevronRight size={12} />
            <span className="is-current">{fullName}</span>
          </div>
        </div>
        <div className="nurse-profile-topbar__actions">
          <button title="Print" className="nurse-profile-icon-btn"><FiPrinter size={14} /></button>
          <button title="Edit" onClick={() => { setTab('overview'); startEditing('personal', { firstName: n.firstName || '', lastName: n.lastName || '', email: n.email || '', phone: n.phone || '', homeTelephone: n.homeTelephone || '', gender: n.gender || '', address: n.address || '', citizenship: n.citizenship || '', title: n.title || '' }); }} className="nurse-profile-icon-btn"><FiEdit2 size={14} /></button>
          <button title="Refresh" onClick={fetchProfile} className="nurse-profile-icon-btn"><FiRefreshCw size={14} /></button>
        </div>
      </div>

      <div className="nurse-profile-header-card">
        <div className="nurse-profile-header-card__meta">
          <div className="nurse-profile-kicker">Medical staff profile</div>
          <h2>{fullName}</h2>
          <p>{roleLabel} profile overview with registration progress, documents, patient roster, and onboarding notes.</p>
        </div>
        <div className="nurse-profile-header-card__actions">
          <button
            type="button"
            className="nurse-profile-primary-btn"
            onClick={() => {
              if (n.email) window.location.href = `mailto:${n.email}`;
            }}
          >
            <span className="nurse-profile-primary-btn__icon"><FiMail size={14} /></span>
            Send Message
          </button>
        </div>
      </div>

      {/* Header bar */}
      <div className="nurse-profile-summary-shell">
        <div className="nurse-profile-summary-grid">
          <div className="nurse-profile-card nurse-profile-card--hero">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            <div
              onClick={() => avatarInputRef.current?.click()}
              title="Click to upload photo"
              className="nurse-profile-avatar"
              style={{
                background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #45B6FE, #2E8FD4)',
              }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>{initials}</span>
              }
              <div className="nurse-profile-avatar__overlay">
                <FiCamera size={16} color="#fff" />
                <span>Photo</span>
              </div>
            </div>

            <div className="nurse-profile-card__title">{fullName}</div>
            <div className="nurse-profile-card__subtitle">{n.email || 'No email provided'}</div>
            <div className="nurse-profile-status-row">
              <span className={`nurse-profile-status-badge${status === 'active' ? ' is-active' : ' is-pending'}`}>{status === 'active' ? 'Active' : status}</span>
              {!isFullyComplete && <span className="nurse-profile-status-badge is-warning">Step {stepsComplete}/4</span>}
            </div>
            <div className="nurse-profile-mini-stats">
              <div>
                <strong>{currentPatients.length}</strong>
                <span>Patients</span>
              </div>
              <div>
                <strong>{Object.values(kycDocs).filter(Boolean).length}</strong>
                <span>Files</span>
              </div>
            </div>
          </div>

          <div className="nurse-profile-card nurse-profile-card--details">
            <div className="nurse-profile-card-heading">Profile Details</div>
            <div className="nurse-profile-info-grid">
              {profileDetails.map((item) => (
                <div key={item.label} className="nurse-profile-info-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="nurse-profile-card nurse-profile-card--notes">
            <div className="nurse-profile-card-heading nurse-profile-card-heading--with-action">
              <span>Notes</span>
              <button type="button" className="nurse-profile-link-btn" onClick={() => setTab('supporting')}>See all</button>
            </div>
            <div className="nurse-profile-note-list">
              {profileNotes.map((note, index) => (
                <div key={`${note}-${index}`} className="nurse-profile-note-item">• {note}</div>
              ))}
            </div>
            <button type="button" className="nurse-profile-inline-btn" onClick={() => setTab('supporting')}>Open supporting info</button>
          </div>

          <div className="nurse-profile-card nurse-profile-card--files">
            <div className="nurse-profile-card-heading nurse-profile-card-heading--with-action">
              <span>Files / Documents</span>
              <button type="button" className="nurse-profile-link-btn" onClick={() => setTab('documents')}>
                <FiUpload size={12} /> Add files
              </button>
            </div>
            <div className="nurse-profile-doc-list">
              {documentsPreview.length > 0 ? documentsPreview.map((doc) => (
                <button key={doc.key} type="button" className="nurse-profile-doc-item" onClick={() => setTab('documents')}>
                  <span className="nurse-profile-doc-item__icon"><FiFileText size={14} /></span>
                  <span className="nurse-profile-doc-item__content">
                    <strong>{doc.fileName || doc.key}</strong>
                    <small>{doc.uploadedAt || 'Uploaded'}</small>
                  </span>
                </button>
              )) : (
                <div className="nurse-profile-empty-note">No documents uploaded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab card */}
      <div className="kh-card nurse-profile-board">
        <div className="nurse-profile-tabs">
          {TABS.map(t => {
            const tabHasData = t.key === 'overview' ? true
              : t.key === 'diversity'  ? hasDiversity
              : t.key === 'education'  ? hasEducation
              : t.key === 'supporting' ? hasSupporting
              : true;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={`nurse-profile-tab${tab === t.key ? ' active' : ''}`}>
                {t.icon} {t.label}
                {t.key !== 'overview' && t.key !== 'documents' && (
                  <span className={`nurse-profile-tab__dot${tabHasData ? ' is-ready' : ''}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="nurse-profile-board__content">

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <div className="nurse-profile-overview-grid">
              <div className="nurse-profile-card nurse-profile-card--timeline">
                <div className="nurse-profile-card-heading nurse-profile-card-heading--with-action">
                  <span>Assigned Care Roster</span>
                  <button type="button" className="nurse-profile-inline-btn" onClick={() => setTab('overview')}>Current patients</button>
                </div>
                {overviewRoster.length === 0 ? (
                  <div className="nurse-profile-empty-note">No patients assigned to this nurse yet.</div>
                ) : (
                  <div className="nurse-profile-timeline-table">
                    <div className="nurse-profile-timeline-head">
                      <span>Patient</span>
                      <span>Care Focus</span>
                      <span>Region</span>
                      <span>Status</span>
                    </div>
                    {overviewRoster.map((patient) => (
                      <button key={patient.id} type="button" className="nurse-profile-timeline-row" onClick={() => navigate(`/patients/${patient.id}`)}>
                        <span>
                          <strong>{patient.name}</strong>
                          <small>{patient.id}</small>
                        </span>
                        <span>{patient.diagnosis}</span>
                        <span>{patient.region}</span>
                        <span>
                          <em className={patient.status === 'active' ? 'is-active' : ''}>{patient.status === 'active' ? 'Active' : 'Discharged'}</em>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="nurse-profile-card nurse-profile-card--snapshot">
                <div className="nurse-profile-card-heading">Profile Snapshot</div>
                <div className="nurse-profile-snapshot-list">
                  {snapshotItems.map((item) => (
                    <div key={item.label} className="nurse-profile-snapshot-item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ DIVERSITY & HEALTH ═══ */}
          {tab === 'diversity' && (
            <div className="row g-3">
              {!hasDiversity ? (
                <div className="col-12">
                  <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <FiAlertCircle size={36} style={{ color: '#d97706', marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Diversity & Health information not yet submitted</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Step 2 of the nurse registration has not been completed.</div>
                    <button onClick={() => navigate('/workforce')} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, padding: '9px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                      Complete Registration
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="col-md-6">
                    <Panel title="Diversity Information" icon={<FiUser size={14} />} accent="#8b5cf6"
                      action={editingSection !== 'diversity' && <button onClick={() => startEditing('diversity', { race: diversity.race || '', religion: diversity.religion || '' })} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4 }}><FiEdit2 size={11} /> Edit</button>}
                    >
                      {editingSection === 'diversity' ? (
                        <>
                          <EditRow label="Race / Ethnicity" field="race" />
                          <EditRow label="Religion" field="religion" />
                          <EditActions />
                        </>
                      ) : (
                        <>
                          <DataRow label="Race / Ethnicity" missing={!diversity.race}>{diversity.race}</DataRow>
                          <DataRow label="Religion" missing={!diversity.religion}>{diversity.religion}</DataRow>
                        </>
                      )}
                    </Panel>
                  </div>
                  <div className="col-md-6">
                    <Panel title="Health Disclosures" icon={<FiShield size={14} />} accent="#ef4444"
                      action={editingSection !== 'diversity' && <button onClick={() => startEditing('diversity', { disability: diversity.disability || 'No', disability_detail: diversity.disability_detail || '', criminal_records: diversity.criminal_records || 'No', criminal_record_detail: diversity.criminal_record_detail || '' })} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><FiEdit2 size={11} /> Edit</button>}
                    >
                      {editingSection === 'diversity' && editForm.disability !== undefined ? (
                        <>
                          <EditRow label="Disability" field="disability" options={['No', 'Yes']} />
                          {ef('disability') === 'Yes' && <EditRow label="Disability Detail" field="disability_detail" />}
                          <EditRow label="Criminal Records" field="criminal_records" options={['No', 'Yes']} />
                          {ef('criminal_records') === 'Yes' && <EditRow label="Criminal Record Detail" field="criminal_record_detail" />}
                          <EditActions />
                        </>
                      ) : (
                        <>
                          <DataRow label="Disability">{diversity.disability || 'No'}</DataRow>
                          {diversity.disability === 'Yes' && (
                            <DataRow label="Disability Detail">{diversity.disability_detail}</DataRow>
                          )}
                          <DataRow label="Criminal Records">{diversity.criminal_records || 'No'}</DataRow>
                          {diversity.criminal_records === 'Yes' && (
                            <DataRow label="Criminal Record Detail">{diversity.criminal_record_detail}</DataRow>
                          )}
                        </>
                      )}
                    </Panel>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ EDUCATION ═══ */}
          {tab === 'education' && (
              <div className="row g-3">
                {!hasEducation ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                  <FiAlertCircle size={36} style={{ color: '#d97706', marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Education & Employment not yet submitted</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Step 3 of the nurse registration has not been completed.</div>
                  <button onClick={() => navigate('/workforce')} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, padding: '9px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                    Complete Registration
                  </button>
                </div>
              ) : (
                  <>
                  {/* ── Qualifications ── */}
                  <div className="col-12">
                    <Panel title="Qualifications" icon={<FiAward size={14} />} accent="#3b82f6"
                      action={
                        editingSection === 'qualifications'
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>Editing…</span>
                          : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{(education.qualifications || []).length} records</span>
                              <button onClick={() => startEditing('qualifications', { qualifications: (education.qualifications || []).map(q => ({ name: q.name || '', institution: q.institution || '', result: q.result || '', year: q.year || '' })) })} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}><FiEdit2 size={11} /> Edit</button>
                            </div>
                      }
                    >
                      {editingSection === 'qualifications' ? (
                        <>
                          {(editForm.qualifications || []).map((q, i) => (
                            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Qualification</div><input style={editInputStyle} value={q.name} onChange={e => { const arr = [...editForm.qualifications]; arr[i] = { ...arr[i], name: e.target.value }; uf('qualifications', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Institution</div><input style={editInputStyle} value={q.institution} onChange={e => { const arr = [...editForm.qualifications]; arr[i] = { ...arr[i], institution: e.target.value }; uf('qualifications', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Result / Grade</div><input style={editInputStyle} value={q.result} onChange={e => { const arr = [...editForm.qualifications]; arr[i] = { ...arr[i], result: e.target.value }; uf('qualifications', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Year</div><input style={editInputStyle} value={q.year} onChange={e => { const arr = [...editForm.qualifications]; arr[i] = { ...arr[i], year: e.target.value }; uf('qualifications', arr); }} /></div>
                              </div>
                              {editForm.qualifications.length > 1 && <button onClick={() => { const arr = editForm.qualifications.filter((_, j) => j !== i); uf('qualifications', arr); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', marginTop: 16 }}><FiTrash2 size={12} /></button>}
                            </div>
                          ))}
                          <button onClick={() => uf('qualifications', [...(editForm.qualifications || []), { name: '', institution: '', result: '', year: '' }])} style={{ marginTop: 10, background: '#f0f7fe', border: '1px solid #d6ecfc', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#2E7DB8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><FiPlus size={12} /> Add Qualification</button>
                          <EditActions />
                        </>
                      ) : (
                        (education.qualifications || []).length === 0 ? (
                          <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '12px 0', textAlign: 'center' }}>No qualifications recorded</div>
                        ) : (
                          <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fafbfc' }}>
                                  {['Qualification', 'Institution', 'Result / Grade', 'Year'].map((h, i) => (
                                    <th key={i} style={{ padding: '8px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', borderBottom: '1px solid #f3f4f6', textAlign: 'left' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {education.qualifications.map((q, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{q.name || '—'}</td>
                                    <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text)' }}>{q.institution || '—'}</td>
                                    <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text)' }}>{q.result || '—'}</td>
                                    <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)' }}>{q.year || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </Panel>
                  </div>

                  {/* ── Training Courses ── */}
                  <div className="col-md-5">
                    <Panel title="Training Courses" icon={<FiCheckCircle size={14} />} accent="#10b981"
                      action={
                        editingSection === 'training'
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Editing…</span>
                          : <button onClick={() => startEditing('training', { trainingCourses: (education.trainingCourses || []).filter(t => t).length > 0 ? [...education.trainingCourses.filter(t => t)] : [''] })} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><FiEdit2 size={11} /> Edit</button>
                      }
                    >
                      {editingSection === 'training' ? (
                        <>
                          {(editForm.trainingCourses || []).map((course, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <input style={{ ...editInputStyle, flex: 1 }} value={course} onChange={e => { const arr = [...editForm.trainingCourses]; arr[i] = e.target.value; uf('trainingCourses', arr); }} placeholder="Course name" />
                              {editForm.trainingCourses.length > 1 && <button onClick={() => uf('trainingCourses', editForm.trainingCourses.filter((_, j) => j !== i))} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex' }}><FiTrash2 size={12} /></button>}
                            </div>
                          ))}
                          <button onClick={() => uf('trainingCourses', [...(editForm.trainingCourses || []), ''])} style={{ marginTop: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#059669', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><FiPlus size={12} /> Add Course</button>
                          <EditActions />
                        </>
                      ) : (
                        (education.trainingCourses || []).filter(t => t).length === 0 ? (
                          <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '12px 0', textAlign: 'center' }}>No training courses recorded</div>
                        ) : (
                          education.trainingCourses.filter(t => t).map((course, i) => (
                            <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <FiCheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, color: 'var(--kh-text)' }}>{course}</span>
                            </div>
                          ))
                        )
                      )}
                    </Panel>
                  </div>

                  {/* ── Employment History ── */}
                  <div className="col-12">
                    <Panel title="Employment History" icon={<FiClipboard size={14} />} accent="#f59e0b" style={{ background: '#fffbeb', border: '1px solid #e5e7eb' }}
                      action={
                        editingSection === 'employment'
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>Editing…</span>
                          : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '2px 10px' }}>{(education.employmentHistory || []).length} {(education.employmentHistory || []).length === 1 ? 'record' : 'records'}</span>
                              <button onClick={() => startEditing('employment', { employmentHistory: (education.employmentHistory || []).map(emp => ({ jobTitle: emp.jobTitle || '', employerName: emp.employerName || '', businessType: emp.businessType || '', startDate: emp.startDate ? emp.startDate.split('T')[0] : '', grade: emp.grade || '', reportingOfficer: emp.reportingOfficer || '', contactPerson: emp.contactPerson || '', address: emp.address || '', descriptionOfDuties: emp.descriptionOfDuties || '', reasonForLeaving: emp.reasonForLeaving || '' })) })} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}><FiEdit2 size={11} /> Edit</button>
                            </div>
                      }
                    >
                      {editingSection === 'employment' ? (
                        <>
                          {(editForm.employmentHistory || []).map((emp, i) => (
                            <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #f3f4f6', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>Employment {i + 1}</span>
                                {editForm.employmentHistory.length > 1 && <button onClick={() => uf('employmentHistory', editForm.employmentHistory.filter((_, j) => j !== i))} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><FiTrash2 size={11} /> Remove</button>}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Job Title</div><input style={editInputStyle} value={emp.jobTitle} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], jobTitle: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Employer Name</div><input style={editInputStyle} value={emp.employerName} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], employerName: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Business Type</div><input style={editInputStyle} value={emp.businessType} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], businessType: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Start Date</div><input type="date" style={editInputStyle} value={emp.startDate} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], startDate: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Grade</div><input style={editInputStyle} value={emp.grade} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], grade: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Reporting Officer</div><input style={editInputStyle} value={emp.reportingOfficer} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], reportingOfficer: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Contact Person</div><input style={editInputStyle} value={emp.contactPerson} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], contactPerson: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Address</div><input style={editInputStyle} value={emp.address} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], address: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Description of Duties</div><textarea style={{ ...editInputStyle, minHeight: 60, resize: 'vertical' }} value={emp.descriptionOfDuties} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], descriptionOfDuties: e.target.value }; uf('employmentHistory', arr); }} /></div>
                                <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginBottom: 3 }}>Reason for Leaving</div><input style={editInputStyle} value={emp.reasonForLeaving} onChange={e => { const arr = [...editForm.employmentHistory]; arr[i] = { ...arr[i], reasonForLeaving: e.target.value }; uf('employmentHistory', arr); }} /></div>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => uf('employmentHistory', [...(editForm.employmentHistory || []), { jobTitle: '', employerName: '', businessType: '', startDate: '', grade: '', reportingOfficer: '', contactPerson: '', address: '', descriptionOfDuties: '', reasonForLeaving: '' }])} style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#92400e', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><FiPlus size={12} /> Add Employment</button>
                          <EditActions />
                        </>
                      ) : (
                        (education.employmentHistory || []).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--kh-text-muted)', fontSize: 13 }}>No employment history recorded</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {education.employmentHistory.map((emp, i) => (
                              <div key={i} style={{
                                display: 'flex', gap: 0,
                                borderBottom: i < education.employmentHistory.length - 1 ? '1px solid #f3f4f6' : 'none',
                                paddingBottom: 20, marginBottom: 20,
                              }}>
                                {/* Timeline spine */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16, flexShrink: 0 }}>
                                  <div style={{
                                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 13, fontWeight: 800,
                                    boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                                  }}>{i + 1}</div>
                                  {i < education.employmentHistory.length - 1 && (
                                    <div style={{ width: 2, flex: 1, background: '#f3f4f6', marginTop: 6, minHeight: 24 }} />
                                  )}
                                </div>

                                {/* Card body */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Header row */}
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <div>
                                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--kh-text)', lineHeight: 1.3 }}>{emp.jobTitle || '—'}</div>
                                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#45B6FE', marginTop: 2 }}>{emp.employerName || '—'}</div>
                                    </div>
                                    {emp.startDate && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#92400e', whiteSpace: 'nowrap' }}>
                                        <FiCalendar size={11} />
                                        {new Date(emp.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Info grid */}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 20px', marginBottom: 10 }}>
                                    {[
                                      { label: 'Business Type',     value: emp.businessType },
                                      { label: 'Grade',             value: emp.grade },
                                      { label: 'Reporting Officer', value: emp.reportingOfficer },
                                      { label: 'Contact Person',    value: emp.contactPerson },
                                    ].filter(f => f.value).map(({ label, value }) => (
                                      <div key={label}>
                                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 1 }}>{label}</div>
                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)' }}>{value}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Address */}
                                  {emp.address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 6 }}>
                                      <FiMapPin size={12} style={{ marginTop: 2, flexShrink: 0, color: '#9ca3af' }} />
                                      <span>{emp.address}</span>
                                    </div>
                                  )}

                                  {/* Full-width fields */}
                                  {emp.descriptionOfDuties && (
                                    <div style={{ background: '#f8f9fa', border: '1px solid #f3f4f6', borderRadius: 6, padding: '8px 12px', marginBottom: 6 }}>
                                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 3 }}>Description of Duties</div>
                                      <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.5 }}>{emp.descriptionOfDuties}</div>
                                    </div>
                                  )}

                                  {emp.reasonForLeaving && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}>
                                      <span style={{ fontWeight: 700, color: '#991b1b' }}>Reason for leaving:</span>
                                      <span style={{ color: '#7f1d1d' }}>{emp.reasonForLeaving}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </Panel>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ SUPPORTING INFO ═══ */}
          {tab === 'supporting' && (
            <div className="row g-3">
              {!hasSupporting ? (
                <div className="col-12">
                  <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <FiAlertCircle size={36} style={{ color: '#d97706', marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Supporting Information not yet submitted</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Step 4 of the nurse registration has not been completed.</div>
                    <button onClick={() => navigate('/workforce')} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, padding: '9px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                      Complete Registration
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="col-md-6">
                    <Panel title="Staff Relationship" icon={<FiUser size={14} />} accent="#8b5cf6"
                      action={editingSection !== 'supporting' && <button onClick={() => startEditing('supporting', { staffRelation: supporting.staffRelation || 'No', staffRelationDetail: supporting.staffRelationDetail || '', vacancyAdvertised: supporting.vacancyAdvertised || '' })} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4 }}><FiEdit2 size={11} /> Edit</button>}
                    >
                      {editingSection === 'supporting' && editForm.staffRelation !== undefined ? (
                        <>
                          <EditRow label="Has Staff Relation" field="staffRelation" options={['No', 'Yes']} />
                          {ef('staffRelation') === 'Yes' && <EditRow label="Relation Detail" field="staffRelationDetail" />}
                          <EditRow label="How Applied" field="vacancyAdvertised" />
                          <EditActions />
                        </>
                      ) : (
                        <>
                          <DataRow label="Has Staff Relation">{supporting.staffRelation || 'No'}</DataRow>
                          {supporting.staffRelation === 'Yes' && (
                            <DataRow label="Relation Detail">{supporting.staffRelationDetail}</DataRow>
                          )}
                        </>
                      )}
                    </Panel>
                    {editingSection !== 'supporting' && (
                      <Panel title="Vacancy Source" icon={<FiFileText size={14} />} accent="#3b82f6">
                        <DataRow label="How Applied">{supporting.vacancyAdvertised || '—'}</DataRow>
                        {supporting.vacancyDetail && Object.entries(supporting.vacancyDetail).map(([k, v]) => (
                          <DataRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')}>{v}</DataRow>
                        ))}
                      </Panel>
                    )}
                  </div>
                  <div className="col-md-6">
                    <Panel title="Referees" icon={<FiUser size={14} />} accent="#10b981"
                      action={editingSection !== 'supporting' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{(supporting.referees || []).filter(r => r.name).length} provided</span>
                          <button onClick={() => { const refs = (supporting.referees || []).map(r => ({ name: r.name || '', address: r.address || '', telephone: r.telephone || '' })); while (refs.length < 2) refs.push({ name: '', address: '', telephone: '' }); startEditing('supporting', { referees: refs }); }} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><FiEdit2 size={11} /> Edit</button>
                        </div>
                      ) : null}
                    >
                      {editingSection === 'supporting' && editForm.referees !== undefined ? (
                        <>
                          {(editForm.referees || []).map((ref, i) => (
                            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 6 }}>Referee {i + 1}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', minWidth: 60 }}>Name</span>
                                  <input style={editInputStyle} value={ref.name} onChange={e => { const refs = [...editForm.referees]; refs[i] = { ...refs[i], name: e.target.value }; uf('referees', refs); }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', minWidth: 60 }}>Address</span>
                                  <input style={editInputStyle} value={ref.address} onChange={e => { const refs = [...editForm.referees]; refs[i] = { ...refs[i], address: e.target.value }; uf('referees', refs); }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', minWidth: 60 }}>Phone</span>
                                  <input style={editInputStyle} value={ref.telephone} onChange={e => { const refs = [...editForm.referees]; refs[i] = { ...refs[i], telephone: e.target.value }; uf('referees', refs); }} />
                                </div>
                              </div>
                            </div>
                          ))}
                          <EditActions />
                        </>
                      ) : (
                        (supporting.referees || []).filter(r => r.name).length === 0 ? (
                          <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '12px 0', textAlign: 'center' }}>No referees provided</div>
                        ) : (
                          (supporting.referees || []).filter(r => r.name).map((ref, i) => (
                            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 4 }}>Referee {i + 1}: {ref.name}</div>
                              {ref.address && <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 2 }}><FiMapPin size={11} style={{ marginRight: 4 }} />{ref.address}</div>}
                              {ref.telephone && <div style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}><FiPhone size={11} style={{ marginRight: 4 }} />{ref.telephone}</div>}
                            </div>
                          ))
                        )
                      )}
                    </Panel>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ DOCUMENTS / KYC ═══ */}
          {tab === 'documents' && (() => {
            const KYC_SLOTS = [
              { key: 'idCard',         label: 'National ID Card', hint: 'Front & back scan (PDF/IMG)', isPhoto: false, accent: '#8b5cf6', accentBg: '#f3f0ff' },
              { key: 'passport',       label: 'Passport',         hint: 'Bio-data page (PDF/IMG)',    isPhoto: false, accent: '#3b82f6', accentBg: '#eff6ff' },
              { key: 'nursingLicense', label: 'Nursing License',  hint: 'Valid license document',    isPhoto: false, accent: '#10b981', accentBg: '#ecfdf5' },
              { key: 'dbsCertificate', label: 'DBS Certificate',  hint: 'Enhanced DBS check',        isPhoto: false, accent: '#f59e0b', accentBg: '#fffbeb' },
            ];
            const uploadedCount = KYC_SLOTS.filter(({ key }) => Boolean(kycDocs[key])).length;
            const allVerified = uploadedCount === KYC_SLOTS.length;

            return (
              <div>
                {uploadingKey && (
                  <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>
                    Uploading {DOCUMENT_TYPE_MAP[uploadingKey] || uploadingKey}...
                  </div>
                )}
                {/* ── KYC Status Banner ── */}
                <div style={{
                  background: allVerified ? '#ecfdf5' : uploadedCount > 0 ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${allVerified ? '#a7f3d0' : uploadedCount > 0 ? '#fde68a' : '#fecaca'}`,
                  borderRadius: 7, padding: '12px 18px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: allVerified ? '#10b981' : uploadedCount > 0 ? '#f59e0b' : '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {allVerified
                      ? <FiCheckCircle size={18} color="#fff" />
                      : <FiShield size={18} color="#fff" />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: allVerified ? '#065f46' : uploadedCount > 0 ? '#92400e' : '#991b1b' }}>
                      {allVerified ? 'KYC Verification Complete' : uploadedCount > 0 ? 'KYC Verification In Progress' : 'KYC Documents Required'}
                    </div>
                    <div style={{ fontSize: 12, color: allVerified ? '#047857' : uploadedCount > 0 ? '#b45309' : '#b91c1c', marginTop: 2 }}>
                      {uploadedCount}/{KYC_SLOTS.length} documents uploaded
                      {!allVerified && ' — please upload all required documents to complete KYC verification.'}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: 120, flexShrink: 0 }}>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, transition: 'width 0.4s',
                        width: `${(uploadedCount / KYC_SLOTS.length) * 100}%`,
                        background: allVerified ? '#10b981' : uploadedCount > 0 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginTop: 3, textAlign: 'right' }}>
                      {Math.round((uploadedCount / KYC_SLOTS.length) * 100)}%
                    </div>
                  </div>
                </div>

                {/* ── Other KYC document slots ── */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderLeft: '3px solid #8b5cf6',
                  }}>
                    <div className="d-flex align-items-center gap-2">
                      <FiFileText size={14} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identity & Compliance Documents</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>
                      {uploadedCount}/{KYC_SLOTS.length} uploaded
                    </span>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                      {KYC_SLOTS.map(slot => {
                        const doc = kycDocs[slot.key];
                        return (
                          <div key={slot.key} style={{
                            border: doc ? '1.5px solid #e5e7eb' : '1.5px dashed #d1d5db',
                            borderRadius: 7, overflow: 'hidden',
                            background: '#f3f4f6',
                            transition: 'all 0.15s',
                          }}>
                            {/* Header strip */}
                            <div style={{
                              padding: '8px 12px', borderBottom: '1px solid #e5e7eb',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: '#eef0f3',
                            }}>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: doc ? slot.accent : '#6b7280' }}>{slot.label}</span>
                              <span style={{
                                fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                                background: doc ? '#ecfdf5' : '#fef2f2',
                                color: doc ? '#065f46' : '#991b1b',
                              }}>
                                {doc ? '✓ Uploaded' : 'Missing'}
                              </span>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '14px 12px' }}>
                              {doc ? (
                                <>
                                  {doc.url && doc.fileType?.startsWith?.('image') ? (
                                    <img src={doc.url} alt="" loading="lazy" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 5, marginBottom: 8, display: 'block' }} />
                                  ) : (
                                    <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', borderRadius: 5, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                                      <FiFileText size={32} style={{ color: slot.accent }} />
                                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--kh-text)', textAlign: 'center', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{doc.fileName}</div>
                                    </div>
                                  )}
                                  <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginBottom: 8 }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</div>
                                    <div style={{ color: '#6b7280' }}>Uploaded: {doc.uploadedAt}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button title="View" onClick={() => setPreviewDoc({ ...doc, url: doc.fullUrl || doc.url, label: slot.label })} style={{ flex: 1, background: '#fff', border: `1px solid ${slot.accent}`, borderRadius: 6, padding: '5px 0', fontSize: 11.5, fontWeight: 700, color: slot.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                      <FiEye size={12} /> View
                                    </button>
                                    <input ref={kycInputRefs[slot.key]} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleKycUpload(slot.key)} />
                                    <button onClick={() => kycInputRefs[slot.key].current?.click()} disabled={uploadingKey === slot.key} style={{ flex: 1, background: slot.accent, border: 'none', borderRadius: 6, padding: '5px 0', fontSize: 11.5, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: uploadingKey === slot.key ? 0.75 : 1 }}>
                                      <FiUpload size={12} /> {uploadingKey === slot.key ? 'Uploading...' : 'Replace'}
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
                                    <FiUpload size={22} style={{ color: '#9ca3af', marginBottom: 6 }} />
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 3 }}>No file uploaded</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>{slot.hint}</div>
                                    <input ref={kycInputRefs[slot.key]} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleKycUpload(slot.key)} />
                                    <button
                                      onClick={() => kycInputRefs[slot.key].current?.click()}
                                      disabled={uploadingKey === slot.key}
                                      style={{ background: slot.accent, border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: uploadingKey === slot.key ? 0.75 : 1 }}
                                    >
                                      <FiUpload size={12} /> {uploadingKey === slot.key ? 'Uploading...' : `Upload ${slot.label}`}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
      </div>

      {/* ═══ DOCUMENT PREVIEW MODAL ═══ */}
      {previewDoc && (
        <div className="app-modal-overlay app-modal-overlay--danger-flow" role="presentation" onClick={() => setPreviewDoc(null)}>
          <div
            className="app-modal-dialog app-modal-dialog--lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nurse-doc-preview-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: 'min(90vh, 900px)' }}
          >
            <div className="app-modal-dialog__header" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 16, marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" style={{ width: 40, height: 40 }} aria-hidden>
                  <FiFileText size={18} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <h2 id="nurse-doc-preview-title" className="app-modal-dialog__title" style={{ fontSize: '1rem' }}>
                    {previewDoc.label}
                  </h2>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {previewDoc.fileName}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {previewDoc.url && (
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-modal-dialog__btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12 }}
                  >
                    <FiEye size={13} /> Open in new tab
                  </a>
                )}
                <button type="button" className="app-modal-dialog__close" onClick={() => setPreviewDoc(null)} aria-label="Close preview">
                  <FiX size={20} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', minHeight: 280 }}>
              {previewDoc.url && previewDoc.fileType?.startsWith?.('image') ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.label}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', padding: 20 }}
                />
              ) : previewDoc.url && previewDoc.fileType === 'application/pdf' ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.fileName}
                  style={{ width: '100%', height: '75vh', border: 'none' }}
                />
              ) : previewDoc.url ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <FiFileText size={48} style={{ color: '#9ca3af', marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--kh-text, #1a1a2e)', marginBottom: 4 }}>{previewDoc.fileName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>This file type cannot be previewed inline. Click below to open it.</div>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                      background: '#45B6FE', color: '#fff', textDecoration: 'none',
                    }}
                  >
                    <FiEye size={14} /> Open file
                  </a>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <FiAlertCircle size={40} style={{ color: '#d97706', marginBottom: 10 }} />
                  <div style={{ fontSize: 13, color: '#6b7280' }}>No preview available for this document.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
