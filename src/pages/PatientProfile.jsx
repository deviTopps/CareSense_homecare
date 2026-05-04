import { useParams, useNavigate } from 'react-router-dom';
import { Fragment, useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar,
  FiUser, FiHeart, FiActivity, FiShield, FiFileText, FiEdit2,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiThermometer, FiClipboard,
  FiMoreHorizontal, FiClock, FiPlus, FiX, FiSend, FiRefreshCw,
  FiSearch, FiBell, FiChevronDown, FiChevronRight, FiBarChart2,
  FiTrash2, FiGrid,
} from '../icons/hugeicons-feather';
import compressImage from '../utils/compressImage';
import { API_BASE, apiFetch, getToken, getUser } from '../api';

const DEFAULT_PROFILE_PLACEHOLDER = '/images/default-profile-avatar.svg';

/* ── Patient data ── */
const patientsData = [
  {
    id: 'P-1001', name: 'Kwame Boateng', preferredName: 'Kwame', age: 72, gender: 'Male', dob: '1954-03-12',
    diagnosis: 'Hypertension, Type 2 Diabetes', phone: '+233 24 111 2222', email: 'kwame.b@email.com',
    address: '14 Osu Badu St, Accra', gps: 'GA-045-1234', region: 'Accra',
    nurse: 'Efua Mensah', nursePin: 'RN-0042',
    emergency: { name: 'Ama Boateng', relationship: 'Wife', phone: '+233 20 333 4444' },
    doctor: { name: 'Dr. Kwesi Asare', facility: 'Ridge Hospital', phone: '+233 30 278 5678' },
    status: 'active', enrolled: '2024-06-01', regNo: 'KH-2024-001',
    cultural: 'Christian — prefers prayer before meals',
    handbookGiven: true,
    infection: { riskPlan: true, diarrhea: false },
    diabetes: { has: true, carePlan: true, stockings: false },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: true },
    pain: { present: true, analgesia: 'Paracetamol 500mg', location: 'Lower back', score: 1 },
    sleep: { nightWake: true, sedation: false, sleepsWell: true, bestPosition: 'Left side', wakeTime: '06:00' },
    nutrition: { allergies: false, specialDiet: true, dietType: 'Diabetic', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: true, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: false, depression: false, anxiety: false, dementia: false },
    skin: { openWounds: false, pressureUlcer: false },
    mobility: { independent: true, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '138/88', sugar: '7.2 mmol/L', resp: '18', spo2: '97%', pulse: '78', temp: '36.6°C', weight: '82 kg', urinalysis: 'Normal' },
    medications: 'Metformin 500mg BD, Amlodipine 5mg OD, Aspirin 75mg OD',
    communication: { needs: false, hearing: false, speech: false, visual: true, understanding: false },
    medicalHistory: 'Appendectomy (1998), Knee replacement (2018)',
  },
  {
    id: 'P-1002', name: 'Abena Osei', preferredName: 'Abena', age: 65, gender: 'Female', dob: '1961-05-22',
    diagnosis: 'Post-surgical wound care', phone: '+233 20 555 6666', email: 'abena.osei@email.com',
    address: '7 Adum Road, Kumasi', gps: 'AK-012-5678', region: 'Kumasi',
    nurse: 'Yaa Asantewaa', nursePin: 'RN-0018',
    emergency: { name: 'Kofi Osei', relationship: 'Son', phone: '+233 27 777 8888' },
    doctor: { name: 'Dr. Ama Serwaa', facility: 'Komfo Anokye Teaching Hospital', phone: '+233 32 202 3456' },
    status: 'active', enrolled: '2024-08-15', regNo: 'KH-2024-015',
    cultural: 'Muslim — observes Ramadan',
    handbookGiven: true,
    infection: { riskPlan: true, diarrhea: false },
    diabetes: { has: false, carePlan: false, stockings: false },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: false },
    pain: { present: true, analgesia: 'Tramadol 50mg', location: 'Surgical site (abdomen)', score: 2 },
    sleep: { nightWake: true, sedation: true, sleepsWell: false, bestPosition: 'Back', wakeTime: '07:00' },
    nutrition: { allergies: true, specialDiet: false, dietType: 'Normal', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: false, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: true, depression: false, anxiety: true, dementia: false },
    skin: { openWounds: true, pressureUlcer: false },
    mobility: { independent: false, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '125/82', sugar: '5.1 mmol/L', resp: '16', spo2: '99%', pulse: '72', temp: '37.1°C', weight: '65 kg', urinalysis: 'Normal' },
    medications: 'Tramadol 50mg PRN, Amoxicillin 500mg TDS, Omeprazole 20mg OD',
    communication: { needs: false, hearing: false, speech: false, visual: false, understanding: false },
    medicalHistory: 'Hysterectomy (2025), Cholecystectomy (2019)',
  },
  {
    id: 'P-1003', name: 'Kofi Ankrah', preferredName: 'Kofi', age: 58, gender: 'Male', dob: '1968-11-04',
    diagnosis: 'Diabetes, Peripheral Neuropathy', phone: '+233 27 999 0000', email: 'kofi.a@email.com',
    address: '22 Dagomba Line, Tamale', gps: 'NT-034-7890', region: 'Tamale',
    nurse: 'Ama Darko', nursePin: 'RN-0031',
    emergency: { name: 'Yaa Ankrah', relationship: 'Wife', phone: '+233 24 111 0000' },
    doctor: { name: 'Dr. Ibrahim Mahama', facility: 'Tamale Teaching Hospital', phone: '+233 37 202 1234' },
    status: 'active', enrolled: '2024-09-20', regNo: 'KH-2024-022',
    cultural: 'Muslim — Friday prayers, halal diet',
    handbookGiven: true,
    infection: { riskPlan: true, diarrhea: false },
    diabetes: { has: true, carePlan: true, stockings: true },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: false },
    pain: { present: true, analgesia: 'Gabapentin 300mg', location: 'Feet & lower legs', score: 2 },
    sleep: { nightWake: true, sedation: false, sleepsWell: false, bestPosition: 'Back elevated', wakeTime: '05:30' },
    nutrition: { allergies: false, specialDiet: true, dietType: 'Diabetic', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: true, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: false, depression: true, anxiety: false, dementia: false },
    skin: { openWounds: false, pressureUlcer: false },
    mobility: { independent: true, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '145/92', sugar: '9.8 mmol/L', resp: '18', spo2: '96%', pulse: '80', temp: '36.8°C', weight: '75 kg', urinalysis: 'Glucose +' },
    medications: 'Metformin 1g BD, Insulin Glargine 20u ON, Gabapentin 300mg TDS',
    communication: { needs: false, hearing: false, speech: false, visual: false, understanding: false },
    medicalHistory: 'Type 2 Diabetes diagnosed 2010, Peripheral neuropathy 2020',
  },
];

const painLabels = ['No Pain', 'Mild', 'Moderate', 'Severe'];
const painColors = ['#45B6FE', '#d97706', '#ea580c', '#ef4444'];

/* ── EHR components ── */
const YN = ({ val }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
    background:
      val === null || val === undefined || val === ''
        ? '#f3f4f6'
        : val
          ? '#F0F7FE'
          : '#fef2f2',
    color:
      val === null || val === undefined || val === ''
        ? '#6b7280'
        : val
          ? '#1565A0'
          : '#dc2626',
  }}>{val === null || val === undefined || val === '' ? 'No data' : val ? 'Yes' : 'No'}</span>
);

const DataRow = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5 }}>
    <span style={{ flexShrink: 0, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ color: 'var(--kh-text)', fontWeight: 500, textAlign: 'right' }}>
      {children === null || children === undefined || children === ''
        ? <span style={{ color: 'var(--kh-text-muted)', fontWeight: 500 }}>No data</span>
        : children}
    </span>
  </div>
);

const NoDataState = ({ text = 'No data available for this section.' }) => (
  <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', lineHeight: 1.6 }}>{text}</div>
);

function hasMeaningfulSectionData(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.entries(value).some(([key, item]) => {
      if (['id', 'createdAt', 'updatedAt', '__typename'].includes(key)) return false;
      return hasMeaningfulSectionData(item);
    });
  }
  return false;
}

function formatStatusLabel(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return 'No status';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

const VitalTile = ({ label, value, flag = false, showFlagBorder = true }) => {
  const hasValue = value !== null && value !== undefined && String(value).trim().length > 0;
  return (
    <div style={{
      padding: '12px 14px',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      background: flag ? '#fef2f2' : '#fafbfc',
      borderLeft: flag && showFlagBorder ? '3px solid #ef4444' : '3px solid #e5e7eb',
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--kh-text-muted)',
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: 18,
        fontWeight: 800,
        color: flag ? '#ef4444' : 'var(--kh-text)',
        fontVariantNumeric: 'tabular-nums',
      }}>{hasValue ? value : '—'}</div>
    </div>
  );
};

const FlagItem = ({ label, detail }) => (
  <div className="d-flex align-items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--kh-text)', flex: 1 }}>{label}</span>
    <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{detail}</span>
  </div>
);

const TABS = [
  { key: 'chart', label: 'General', icon: <FiGrid size={14} /> },
  { key: 'medications', label: 'Medications' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'care', label: 'Lifestyle records' },
  { key: 'notes', label: 'Nurse Note' },
  { key: 'incidents', label: 'Incident Report' },
  { key: 'careplan', label: 'Care Plan' },
  { key: 'checkliststatus', label: 'Checklist', icon: <FiBarChart2 size={14} /> },
];

const Panel = ({ title, icon, accent, children, action, variant = 'default', bodyClassName = '' }) => {
  const isSummary = variant === 'summary';

  return (
    <div
      className={isSummary ? 'patient-profile-summary-panel' : ''}
      style={{
        background: '#fff',
        border: isSummary ? '1px solid #edf1f5' : '1px solid #e5e7eb',
        borderRadius: isSummary ? 28 : 5,
        overflow: 'hidden',
        marginBottom: 12,
        boxShadow: isSummary ? '0 24px 60px rgba(15, 23, 42, 0.08)' : 'none',
      }}
    >
      <div
        className={isSummary ? 'patient-profile-summary-panel__header' : ''}
        style={{
          padding: isSummary ? '18px 20px 14px' : '10px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderLeft: !isSummary && accent ? `3px solid ${accent}` : 'none',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          {icon && <span style={{ color: accent || '#45B6FE', display: 'flex' }}>{icon}</span>}
          <span
            className={isSummary ? 'nurse-profile-card-heading' : ''}
            style={{
              fontSize: isSummary ? undefined : 12,
              fontWeight: 700,
              textTransform: isSummary ? 'none' : 'capitalize',
              letterSpacing: isSummary ? 'normal' : '0.5px',
              color: 'var(--kh-text)',
              marginBottom: 0,
            }}
          >
            {title}
          </span>
        </div>
        {action && action}
      </div>
      <div className={bodyClassName} style={{ padding: isSummary ? '18px 20px 20px' : '12px 16px' }}>{children}</div>
    </div>
  );
};

const FALLBACK_PATIENT_ID = 'e426444d-02a0-4f90-90d4-930b1745f199';
const PATIENT_PHOTO_CACHE_KEY = 'patientProfilePhotoCache';
const PATIENT_MEDICATION_CACHE_KEY = 'patientProfileMedicationCache';

function readPatientPhotoCache() {
  try {
    const raw = localStorage.getItem(PATIENT_PHOTO_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePatientPhotoCache(cache) {
  try {
    localStorage.setItem(PATIENT_PHOTO_CACHE_KEY, JSON.stringify(cache || {}));
  } catch {
  }
}

function getCachedPatientPhoto(patientId) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId) return null;

  const cache = readPatientPhotoCache();
  const entry = cache[normalizedId];
  return entry && typeof entry === 'object' ? entry : null;
}

function setCachedPatientPhoto(patientId, photoData) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId || !photoData || typeof photoData !== 'object') return;

  const cache = readPatientPhotoCache();
  cache[normalizedId] = {
    ...(cache[normalizedId] || {}),
    ...photoData,
    updatedAt: new Date().toISOString(),
  };
  writePatientPhotoCache(cache);
}

function readPatientMedicationCache() {
  try {
    const raw = localStorage.getItem(PATIENT_MEDICATION_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePatientMedicationCache(cache) {
  try {
    localStorage.setItem(PATIENT_MEDICATION_CACHE_KEY, JSON.stringify(cache || {}));
  } catch {
  }
}

function getCachedPatientMedications(patientId) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId) return [];

  const cache = readPatientMedicationCache();
  const entry = cache[normalizedId];
  return Array.isArray(entry) ? entry : [];
}

function setCachedPatientMedications(patientId, medications) {
  const normalizedId = String(patientId || '').trim();
  if (!normalizedId) return;

  const cache = readPatientMedicationCache();
  cache[normalizedId] = Array.isArray(medications) ? medications : [];
  writePatientMedicationCache(cache);
}

function normalizeAgencyIdentifier(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized || null;
  }

  if (typeof value === 'object') {
    return (
      normalizeAgencyIdentifier(value?.agencyId)
      || normalizeAgencyIdentifier(value?.agencyID)
      || normalizeAgencyIdentifier(value?.id)
      || normalizeAgencyIdentifier(value?._id)
      || null
    );
  }

  return null;
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

function resolveAgencyId(source) {
  const entity = source && typeof source === 'object' ? source : source;
  const candidates = [
    entity,
    entity?.agency,
    entity?.organization,
    entity?.organisation,
    entity?.company,
    entity?.user,
    entity?.data,
    entity?.profile,
  ];

  for (const candidate of candidates) {
    const resolved = (
      normalizeAgencyIdentifier(candidate?.agencyId)
      || normalizeAgencyIdentifier(candidate?.agencyID)
      || normalizeAgencyIdentifier(candidate?.agency)
      || normalizeAgencyIdentifier(candidate?.organizationId)
      || normalizeAgencyIdentifier(candidate?.organisationId)
      || normalizeAgencyIdentifier(candidate?.organization)
      || normalizeAgencyIdentifier(candidate?.organisation)
      || normalizeAgencyIdentifier(candidate?.companyId)
      || normalizeAgencyIdentifier(candidate?.company)
    );

    if (resolved) return resolved;
  }

  return null;
}

function parsePresignResponse(raw) {
  const payload = raw?.data || raw?.result || raw || {};
  const upload = payload?.upload || payload?.presign || payload?.target || {};

  const uploadUrl = (
    payload?.url
    || payload?.uploadUrl
    || payload?.presignedUrl
    || payload?.presignedPostUrl
    || upload?.url
    || upload?.uploadUrl
    || null
  );

  const uploadFields = (
    payload?.fields
    || payload?.formFields
    || upload?.fields
    || upload?.formFields
    || null
  );

  const objectKey = (
    payload?.objectKey
    || payload?.key
    || payload?.path
    || payload?.objectPath
    || upload?.objectKey
    || upload?.key
    || null
  );

  const mediaId = (
    payload?.mediaId
    || payload?.id
    || payload?.media?.id
    || payload?.media?._id
    || upload?.mediaId
    || upload?.id
    || null
  );

  return {
    uploadUrl,
    uploadFields,
    objectKey,
    mediaId,
  };
}

async function uploadFileToPresignedTarget({ uploadUrl, uploadFields, file }) {
  if (!uploadUrl) {
    throw new Error('Upload target URL is missing from presign response.');
  }

  if (uploadFields && typeof uploadFields === 'object') {
    const formData = new FormData();
    Object.entries(uploadFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append('file', file);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      throw new Error(errorText || `Media upload failed (HTTP ${uploadResponse.status}).`);
    }

    return;
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file?.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => '');
    throw new Error(errorText || `Media upload failed (HTTP ${uploadResponse.status}).`);
  }
}

function parseDirectUploadResponse(raw) {
  const payload = raw?.data || raw || {};
  return {
    objectKey: payload?.upload?.objectKey || payload?.objectKey || payload?.key || null,
    mediaId: payload?.media?.id || payload?.mediaId || payload?.id || null,
  };
}

function extractPatientProfileImage(rawPatient) {
  const profileImage = rawPatient?.profileImage || rawPatient?.image || rawPatient?.photo || {};
  const documents = Array.isArray(rawPatient?.documents) ? rawPatient.documents : [];

  const profileDoc = documents.find((doc) => {
    const docType = String(doc?.documentType || '').toLowerCase();
    return docType.includes('profile') || docType.includes('photo') || docType.includes('avatar');
  }) || null;

  return {
    url:
      profileImage?.link?.url
      || profileImage?.url
      || rawPatient?.profileImageUrl
      || rawPatient?.imageUrl
      || rawPatient?.photoUrl
      || rawPatient?.avatarUrl
      || profileDoc?.link?.url
      || null,
    objectKey:
      profileImage?.objectKey
      || rawPatient?.profileImageObjectKey
      || profileDoc?.objectKey
      || null,
    mediaId:
      profileImage?.mediaId
      || profileImage?.media?.id
      || rawPatient?.profileImageMediaId
      || profileDoc?.mediaId
      || profileDoc?.media?.id
      || null,
    previewDataUrl:
      profileImage?.previewDataUrl
      || rawPatient?.profileImagePreviewDataUrl
      || null,
  };
}

function mergeProfileImage(primaryImage, fallbackImage) {
  const primary = primaryImage && typeof primaryImage === 'object' ? primaryImage : {};
  const fallback = fallbackImage && typeof fallbackImage === 'object' ? fallbackImage : {};

  return {
    url: primary.url || fallback.url || null,
    objectKey: primary.objectKey || fallback.objectKey || null,
    mediaId: primary.mediaId || fallback.mediaId || null,
    previewDataUrl: primary.previewDataUrl || fallback.previewDataUrl || null,
  };
}

function extractUrlFromPayload(payload) {
  if (!payload) return null;

  const url =
    payload?.url
    || payload?.link?.url
    || payload?.data?.url
    || payload?.data?.link?.url
    || payload?.media?.link?.url
    || payload?.media?.url
    || payload?.downloadUrl
    || payload?.signedUrl
    || payload?.presignedUrl
    || null;

  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

async function resolvePatientProfileImageUrl({ mediaId, objectKey }) {
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

      if (!response.ok) {
        continue;
      }

      const resolvedUrl = extractUrlFromPayload(payload);
      if (resolvedUrl) return resolvedUrl;
    } catch {
    }
  }

  return null;
}

async function hydratePatientProfile(rawPatient, fallbackId) {
  const normalized = normalizePatientProfile(rawPatient, fallbackId);
  const cachedImage = getCachedPatientPhoto(normalized?.id || fallbackId);
  const mergedProfileImage = mergeProfileImage(normalized?.profileImage, cachedImage);
  const mergedProfile = {
    ...normalized,
    profileImage: mergedProfileImage,
  };

  const existingUrl = mergedProfile?.profileImage?.url || null;

  if (existingUrl) {
    setCachedPatientPhoto(mergedProfile?.id || fallbackId, mergedProfile.profileImage);
    return mergedProfile;
  }

  const resolvedUrl = await resolvePatientProfileImageUrl({
    mediaId: mergedProfile?.profileImage?.mediaId,
    objectKey: mergedProfile?.profileImage?.objectKey,
  });

  if (!resolvedUrl) {
    return mergedProfile;
  }

  const hydratedProfile = {
    ...mergedProfile,
    profileImage: {
      ...(mergedProfile.profileImage || {}),
      url: resolvedUrl,
    },
  };

  setCachedPatientPhoto(hydratedProfile?.id || fallbackId, hydratedProfile.profileImage);
  return hydratedProfile;
}

async function uploadFileViaBackend(file) {
  const formData = new FormData();
  formData.append('file', file);

  let uploadResponse;
  try {
    uploadResponse = await fetch(`${API_BASE}/media/b2/upload/direct`, {
      method: 'POST',
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: formData,
    });
  } catch {
    throw new Error('Could not reach media upload endpoint. Check backend URL, CORS, and network connectivity.');
  }

  const uploadData = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    throw new Error(uploadData?.message || uploadData?.error || `Media upload failed (HTTP ${uploadResponse.status}).`);
  }

  const { objectKey, mediaId } = parseDirectUploadResponse(uploadData);
  if (!objectKey || !mediaId) {
    throw new Error('Direct upload response missing objectKey or mediaId.');
  }

  return { objectKey, mediaId };
}

function normalizePatientProfile(rawPatient, fallbackId) {
  if (!rawPatient || typeof rawPatient !== 'object') {
    return JSON.parse(JSON.stringify(patientsData[0]));
  }

  const firstName = rawPatient?.firstName || '';
  const lastName = rawPatient?.lastName || '';
  const fullName = rawPatient?.fullName || rawPatient?.name || `${firstName} ${lastName}`.trim();

  const nextOfKin = rawPatient?.nextOfKin || {};
  const admissionChecklist = rawPatient?.admissionChecklist || {};
  const communicationStyle = rawPatient?.communicationStyle || {};
  const infectionControl = rawPatient?.infectionControl || {};
  const breathPain = rawPatient?.breathPain || {};
  const sleepNutrition = rawPatient?.sleepNutrition || {};
  const sleep = sleepNutrition?.sleep || rawPatient?.sleep || {};
  const nutrition = sleepNutrition?.nutrition || rawPatient?.nutrition || {};
  const hygienePsychological = rawPatient?.hygienePsychological || {};
  const personal = hygienePsychological?.personal || rawPatient?.personal || {};
  const bladderBowel = hygienePsychological?.bladderBowel || rawPatient?.bladderBowel || {};
  const psychologicalNeeds = hygienePsychological?.psychologicalNeeds || rawPatient?.psychologicalNeeds || {};
  const skinMobility = rawPatient?.skinMobility || {};
  const skinIntegrity = skinMobility?.skinIntegrity || rawPatient?.skinIntegrity || {};
  const handlingAssessment = skinMobility?.handlingAssessment || rawPatient?.handlingAssessment || {};
  const medicalHistoryRecord = rawPatient?.medicalHistory;
  const initialVitals = rawPatient?.initialVitals || {};
  const profileImage = extractPatientProfileImage(rawPatient || {});

  const painPresent = String(rawPatient?.painPresent || '').toLowerCase();
  const boolFromYesNo = (value, fallback = null) => {
    if (value === true || value === false) return value;
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'yes' || normalized === 'true') return true;
    if (normalized === 'no' || normalized === 'false') return false;
    return fallback;
  };

  return {
    id: rawPatient?.id || rawPatient?.patientId || fallbackId || '',
    agencyId: resolveAgencyId(rawPatient),
    name: fullName || '',
    preferredName: rawPatient?.preferredName || firstName || '',
    age: rawPatient?.age ?? '',
    gender: rawPatient?.gender || '',
    dob: toDateInputValue(rawPatient?.dateOfBirth || rawPatient?.dob || ''),
    dateOfAssessment: toDateInputValue(rawPatient?.dateOfAssessment || ''),
    diagnosis: rawPatient?.diagnosis || rawPatient?.primaryDiagnosis || '',
    phone: rawPatient?.contactNumber || rawPatient?.phone || '',
    email: rawPatient?.email || '',
    address: rawPatient?.residentialAddress || rawPatient?.address || '',
    gps: rawPatient?.gpsCode || rawPatient?.gps || '',
    region: rawPatient?.region || rawPatient?.location || rawPatient?.residentialAddress || '',
    nurse: admissionChecklist?.admittingNurse || rawPatient?.admittingNurse || rawPatient?.nurse || '',
    nursePin: rawPatient?.nursePin || '',
    emergency: {
      name: nextOfKin?.fullName || '',
      relationship: nextOfKin?.relationship || '',
      phone: nextOfKin?.contactOne || nextOfKin?.contactTwo || '',
    },
    doctor: {
      name: nextOfKin?.personalDoctor || '',
      facility: nextOfKin?.personalDoctorFacility || '',
      phone: nextOfKin?.personalDoctorContact || '',
    },
    status: rawPatient?.status || '',
    enrolled: toDateInputValue(rawPatient?.dateOfAdmission || rawPatient?.enrolled || ''),
    regNo: rawPatient?.registrationNumber || '',
    profileImage,
    cultural: nextOfKin?.spiritualNeed || rawPatient?.cultural || '',
    notes: rawPatient?.notes || '',
    handbookGiven: boolFromYesNo(admissionChecklist?.clientHandBookGiven ?? rawPatient?.clientHandBookGiven, null),
    infection: {
      riskPlan: boolFromYesNo(infectionControl?.infectionCarePlanCompletion ?? infectionControl?.InfectionCarePlanCompletion, null),
      diarrhea: boolFromYesNo(infectionControl?.diarrhea ?? rawPatient?.diarrhea, null),
    },
    diabetes: {
      has: boolFromYesNo(infectionControl?.anyDiabetes, null),
      carePlan: boolFromYesNo(infectionControl?.diabetesCarePlanCompletion ?? infectionControl?.DiabetesCarePlanCompletion, null),
      stockings: boolFromYesNo(infectionControl?.isThePatientBedBound, null),
    },
    breathing: {
      difficulties: boolFromYesNo(breathPain?.anyBreathingDifficulties, null),
      oxygen: boolFromYesNo(breathPain?.homeOxygenNeeded, null),
      smoker: boolFromYesNo(breathPain?.isSmoker, null),
      everSmoked: boolFromYesNo(breathPain?.everSmoked, null),
    },
    pain: {
      present: painPresent ? painPresent === 'yes' || painPresent === 'true' : boolFromYesNo(breathPain?.painPresent, null),
      analgesia: breathPain?.anagelsiaPrescribed ? 'Prescribed' : '',
      location: breathPain?.locationOfPain || '',
      score: breathPain?.painScore !== '' && breathPain?.painScore !== undefined && breathPain?.painScore !== null ? Number(breathPain.painScore) || 0 : null,
    },
    sleep: {
      nightWake: boolFromYesNo(sleep?.wakeUpAtNight, null),
      sedation: boolFromYesNo(sleep?.UseOfNightSedation, null),
      sleepsWell: boolFromYesNo(sleep?.userSleepWell, null),
      bestPosition: sleep?.bestSleepingPosition || '',
      wakeTime: sleep?.usualTimeToWakeUp || '',
    },
    nutrition: {
      allergies: boolFromYesNo(nutrition?.allergy, null),
      specialDiet: boolFromYesNo(nutrition?.specialDiet, null),
      dietType: nutrition?.dietType || '',
      helpEating: boolFromYesNo(nutrition?.needHelpInEating, null),
      swallowing: boolFromYesNo(nutrition?.swallowingDifficulties, null),
      ngTube: boolFromYesNo(nutrition?.ngTube, null),
    },
    hygiene: {
      independent: boolFromYesNo(personal?.hygieneNeeds, null),
      mouthCare: boolFromYesNo(personal?.mouthCarePlan, null),
    },
    bladder: {
      dysfunction: boolFromYesNo(bladderBowel?.bladderDysfunction, null),
      catheter: boolFromYesNo(bladderBowel?.catheterPlan, null),
      pads: boolFromYesNo(bladderBowel?.incontinentPads, null),
    },
    psych: {
      concerns: boolFromYesNo(psychologicalNeeds?.psychologicalNeeds, null),
      depression: boolFromYesNo(psychologicalNeeds?.depressionHistory, null),
      anxiety: boolFromYesNo(psychologicalNeeds?.anxietyhistory, null),
      dementia: boolFromYesNo(psychologicalNeeds?.signDementia, null),
    },
    skin: {
      openWounds: boolFromYesNo(skinIntegrity?.openWounds, null),
      pressureUlcer: boolFromYesNo(skinIntegrity?.pressureUlcer, null),
    },
    mobility: {
      independent: boolFromYesNo(handlingAssessment?.isPatientMobile, null),
      bedMove: boolFromYesNo(handlingAssessment?.moveInBed, null),
      bedToChair: boolFromYesNo(handlingAssessment?.mobilityFromBedToChair, null),
      toilet: boolFromYesNo(handlingAssessment?.mobilityToWashroom, null),
    },
    vitals: {
      bp: initialVitals?.bloodPressure || rawPatient?.bloodPressure || '',
      sugar: initialVitals?.bloodSugar || rawPatient?.bloodSugar || '',
      resp: initialVitals?.respiration || rawPatient?.respiration || '',
      spo2: initialVitals?.sp02 || rawPatient?.sp02 || '',
      pulse: initialVitals?.pulseRate || rawPatient?.pulseRate || '',
      temp: initialVitals?.temperature || rawPatient?.temperature || '',
      weight: initialVitals?.weight || rawPatient?.weight || '',
      urinalysis: initialVitals?.urinalysis || rawPatient?.urinalysis || '',
    },
    medications: rawPatient?.currentMedications || rawPatient?.medications || '',
    communication: {
      needs: boolFromYesNo(communicationStyle?.anyCommunicationNeeds, null),
      hearing: boolFromYesNo(communicationStyle?.anyHearingNeeds, null),
      speech: boolFromYesNo(communicationStyle?.anySpeechImpairment, null),
      visual: boolFromYesNo(communicationStyle?.anyVisualImpairment, null),
      understanding: boolFromYesNo(communicationStyle?.anyUnderstandingDifficulties, null),
    },
    medicalHistory:
      rawPatient?.medicalHistoryDescription
      || medicalHistoryRecord?.medicalHistoryDescription
      || (typeof medicalHistoryRecord === 'string' ? medicalHistoryRecord : '')
      || '',
    sectionNextOfKin: rawPatient?.nextOfKin || null,
    sectionAdmissionChecklist: rawPatient?.admissionChecklist || null,
    sectionMedicalHistory: rawPatient?.medicalHistory || null,
    sectionCommunicationStyle: rawPatient?.communicationStyle || null,
    sectionInfectionControl: rawPatient?.infectionControl || null,
    sectionBreathPain: rawPatient?.breathPain || null,
    sectionSleepNutrition: rawPatient?.sleepNutrition || null,
    sectionHygienePsychological: rawPatient?.hygienePsychological || null,
    sectionSkinMobility: rawPatient?.skinMobility || null,
    sectionInitialVitals: rawPatient?.initialVitals || null,
  };
}

function toDateInputValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return normalized.includes('T') ? normalized.split('T')[0] : normalized;
}

function splitPatientName(name) {
  const chunks = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (chunks.length === 1) {
    return { firstName: chunks[0], lastName: '' };
  }
  return {
    firstName: chunks[0],
    lastName: chunks.slice(1).join(' '),
  };
}

function createPatientUpdateForm(profile, fallbackId) {
  const person = profile && typeof profile === 'object' ? profile : {};
  const nameParts = splitPatientName(person?.name);
  const nullableBoolean = (value) => (value === true ? true : value === false ? false : null);

  return {
    patientId: String(person?.id || fallbackId || '').trim(),
    personalInfo: {
      registrationNumber: person?.regNo || '',
      dateOfAssessment: toDateInputValue(person?.dateOfAssessment || person?.enrolled || ''),
      dateOfAdmission: toDateInputValue(person?.enrolled || ''),
      firstName: nameParts.firstName || '',
      lastName: nameParts.lastName || '',
      preferredName: person?.preferredName || nameParts.firstName || '',
      contactNumber: person?.phone || '',
      dateOfBirth: toDateInputValue(person?.dob || ''),
      age: person?.age === undefined || person?.age === null ? '' : String(person.age),
      gender: person?.gender || '',
      residentialAddress: person?.address || '',
      gpsCode: person?.gps || '',
      email: person?.email || '',
    },
    nextOfKin: {
      fullName: person?.emergency?.name || '',
      relationship: person?.emergency?.relationship || '',
      contactOne: person?.emergency?.phone || '',
      contactTwo: person?.emergency?.phone || '',
      spiritualNeed: person?.cultural || '',
      personalDoctor: person?.doctor?.name || '',
      personalDoctorFacility: person?.doctor?.facility || '',
      personalDoctorContact: person?.doctor?.phone || '',
    },
    admissionChecklist: {
      clientHandBookGiven: Boolean(person?.handbookGiven),
      admittingNurse: person?.nurse || '',
      infectionControlSupplies: Boolean(person?.infection?.riskPlan),
    },
    medicalHistory: {
      anyMedicalHistory: Boolean(String(person?.medicalHistory || '').trim()),
      medicalHistoryDescription: person?.medicalHistory || '',
    },
    communicationStyle: {
      anyCommunicationNeeds: Boolean(person?.communication?.needs),
      anyHearingNeeds: Boolean(person?.communication?.hearing),
      anySpeechImpairment: Boolean(person?.communication?.speech),
      anyVisualImpairment: Boolean(person?.communication?.visual),
      anyUnderstandingDifficulties: Boolean(person?.communication?.understanding),
      communicationNotes: '',
    },
    infectionControl: {
      InfectionCarePlanCompletion: Boolean(person?.infection?.riskPlan),
      anyDiabetes: Boolean(person?.diabetes?.has),
      DiabetesCarePlanCompletion: Boolean(person?.diabetes?.carePlan),
      isThePatientBedBound: Boolean(person?.diabetes?.stockings),
    },
    breathPain: {
      anyBreathingDifficulties: Boolean(person?.breathing?.difficulties),
      homeOxygenNeeded: Boolean(person?.breathing?.oxygen),
      isSmoker: Boolean(person?.breathing?.smoker),
      everSmoked: Boolean(person?.breathing?.everSmoked),
      painPresent: Boolean(person?.pain?.present),
      anagelsiaPrescribed: Boolean(String(person?.pain?.analgesia || '').trim()),
      locationOfPain: person?.pain?.location || '',
      painScore: person?.pain?.score === undefined || person?.pain?.score === null ? '' : String(person.pain.score),
    },
    sleepNutrition: {
      sleep: {
        wakeUpAtNight: nullableBoolean(person?.sleep?.nightWake),
        UseOfNightSedation: nullableBoolean(person?.sleep?.sedation),
        userSleepWell: nullableBoolean(person?.sleep?.sleepsWell),
        RestDuringTheDay: null,
        usualTimeToWakeUp: person?.sleep?.wakeTime || '',
        bestSleepingPosition: person?.sleep?.bestPosition || '',
      },
      nutrition: {
        allergy: nullableBoolean(person?.nutrition?.allergies),
        specialDiet: nullableBoolean(person?.nutrition?.specialDiet),
        needHelpInEating: nullableBoolean(person?.nutrition?.helpEating),
        feedingAid: null,
        swallowingDifficulties: nullableBoolean(person?.nutrition?.swallowing),
        dietType: person?.nutrition?.dietType || '',
        ngTube: nullableBoolean(person?.nutrition?.ngTube),
        nutritionConcerns: '',
      },
    },
    hygienePsych: {
      personal: {
        hygieneNeeds: Boolean(person?.hygiene?.independent),
        mouthCarePlan: Boolean(person?.hygiene?.mouthCare),
        diabeteFoot: Boolean(person?.diabetes?.stockings),
      },
      bladderBowel: {
        bladderDysfunction: Boolean(person?.bladder?.dysfunction),
        catheterDescription: '',
        catheterPlan: Boolean(person?.bladder?.catheter),
        incontinentPads: Boolean(person?.bladder?.pads),
      },
      psychologicalNeeds: {
        psychologicalNeeds: Boolean(person?.psych?.concerns),
        depressionHistory: Boolean(person?.psych?.depression),
        anxietyhistory: Boolean(person?.psych?.anxiety),
        signDementia: Boolean(person?.psych?.dementia),
        psychologicalNotes: '',
      },
    },
    skinMobility: {
      skinIntegrity: {
        openWounds: Boolean(person?.skin?.openWounds),
        pressureUlcer: Boolean(person?.skin?.pressureUlcer),
        gradeAdmission: '',
        securityItems: '',
      },
      handlingAssessment: {
        isPatientMobile: Boolean(person?.mobility?.independent),
        isEquipmentNeeded: false,
        numberOfStaffNeeded: person?.mobility?.independent ? 0 : 1,
        moveInBed: Boolean(person?.mobility?.bedMove),
        moveInBedEquipment: '',
        mobilityFromBedToChair: Boolean(person?.mobility?.bedToChair),
        mobilityFromBedToChairEquipment: '',
        mobilityToWashroom: Boolean(person?.mobility?.toilet),
        mobilityToWashroomEquipment: '',
      },
    },
    initialVitals: {
      bloodPressure: person?.vitals?.bp || '',
      bloodSugar: person?.vitals?.sugar || '',
      respiration: person?.vitals?.resp || '',
      sp02: person?.vitals?.spo2 || '',
      pulseRate: person?.vitals?.pulse || '',
      temperature: person?.vitals?.temp || '',
      urinalysis: person?.vitals?.urinalysis || '',
      weight: person?.vitals?.weight || '',
    },
  };
}

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function normalizeMedicationTimeValue(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  const meridiemMatch = rawValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiemMatch) {
    const [, rawHours, rawMinutes, period] = meridiemMatch;
    let hours = Number(rawHours);
    const minutes = rawMinutes;
    const normalizedPeriod = period.toUpperCase();

    if (normalizedPeriod === 'AM' && hours === 12) hours = 0;
    if (normalizedPeriod === 'PM' && hours < 12) hours += 12;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const standardMatch = rawValue.match(/^(\d{1,2}):(\d{2})$/);
  if (standardMatch) {
    const [, rawHours, rawMinutes] = standardMatch;
    return `${String(Number(rawHours)).padStart(2, '0')}:${rawMinutes}`;
  }

  return rawValue;
}

function formatMedicationApiTime(value) {
  const normalizedValue = normalizeMedicationTimeValue(value);
  const match = normalizedValue.match(/^(\d{2}):(\d{2})$/);
  if (!match) return normalizedValue;

  const [, rawHours, minutes] = match;
  let hours = Number(rawHours);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes}${suffix}`;
}

function createMedicationReminderState(source = {}) {
  const reminderSource = source?.reminders || {};
  const times = Array.isArray(source?.time)
    ? source.time
    : Array.isArray(reminderSource?.times)
      ? reminderSource.times
      : ['08:00'];

  return {
    times: times.filter(Boolean).map(normalizeMedicationTimeValue),
    startDate: source?.startDate || reminderSource?.startDate || new Date().toISOString().slice(0, 10),
    endDate: source?.endDate || reminderSource?.endDate || '',
    reminderType: source?.reminderType || reminderSource?.reminderType || 'daily',
    notifyNurse: source?.notifyNurse ?? reminderSource?.notifyNurse ?? true,
    notifyPatient: source?.notifyPatient ?? reminderSource?.notifyPatient ?? false,
  };
}

function normalizeMedicationRecord(rawMedication, fallback = {}) {
  const raw = rawMedication && typeof rawMedication === 'object' ? rawMedication : {};
  const fallbackTimes = Array.isArray(fallback?.time) ? fallback.time.filter(Boolean) : [];
  const times = Array.isArray(raw?.time) ? raw.time.filter(Boolean) : fallbackTimes;
  const patientId = raw?.patientId || raw?.patientID || raw?.patient_id || raw?.patient?.id || raw?.patient?._id || raw?.patient?.patientId || fallback?.patientId || '';

  return {
    id: raw?.id || raw?.medicationId || fallback?.id || fallback?.medicationId || Date.now(),
    patientId,
    drug: raw?.drug || fallback?.drug || '',
    dosage: raw?.dosage || fallback?.dosage || '',
    frequency: raw?.frequency || fallback?.frequency || (times.length > 0 ? `${times.length} time${times.length > 1 ? 's' : ''}/day` : 'Scheduled'),
    route: toTitleCase(raw?.intake || fallback?.intake || fallback?.route || 'Oral'),
    notes: raw?.notes || fallback?.notes || '',
    reminders: times.length > 0 ? {
      reminderType: fallback?.reminderType || 'daily',
      times,
      notifyNurse: fallback?.notifyNurse ?? true,
      notifyPatient: fallback?.notifyPatient ?? false,
      startDate: raw?.startDate || fallback?.startDate || new Date().toISOString().slice(0, 10),
      endDate: raw?.endDate || fallback?.endDate || '',
    } : null,
    active: raw?.active ?? fallback?.active ?? true,
    startDate: raw?.startDate || fallback?.startDate || new Date().toISOString().slice(0, 10),
    endDate: raw?.endDate || fallback?.endDate || '',
    prescribedBy: raw?.prescribedBy || fallback?.prescribedBy || 'external',
    source: 'api',
  };
}

function extractMedicationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.medications)) return payload.medications;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.medications)) return payload.data.medications;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.medication && typeof payload.medication === 'object') return [payload.medication];
  if (payload?.data?.medication && typeof payload.data.medication === 'object') return [payload.data.medication];
  if ((payload?.medicationId || payload?.id) && typeof payload === 'object') return [payload];
  return [];
}

function medicationBelongsToPatient(medication, patientId) {
  const directPatientId = medication?.patientId || medication?.patientID || medication?.patient_id;
  const nestedPatientId = medication?.patient?.id || medication?.patient?._id || medication?.patient?.patientId;
  return String(directPatientId || nestedPatientId || '').trim() === String(patientId || '').trim();
}

function buildMedicationSignature(medication) {
  return [
    String(medication?.drug || '').trim().toLowerCase(),
    String(medication?.dosage || '').trim().toLowerCase(),
    String(medication?.frequency || '').trim().toLowerCase(),
    String(medication?.route || '').trim().toLowerCase(),
  ].join('|');
}

function mergeMedicationRecords(records) {
  const result = [];
  const seenIds = new Set();
  const seenSignatures = new Set();

  records.forEach(record => {
    if (!record || !record.drug) return;
    const normalized = normalizeMedicationRecord(record, record);
    const idKey = String(normalized.id || '').trim();
    const signature = buildMedicationSignature(normalized);

    if ((idKey && seenIds.has(idKey)) || seenSignatures.has(signature)) {
      return;
    }

    if (idKey) seenIds.add(idKey);
    seenSignatures.add(signature);
    result.push(normalized);
  });

  return result;
}

function normalizeDrugOption(rawDrug) {
  const raw = rawDrug && typeof rawDrug === 'object' ? rawDrug : {};
  const name = String(
    raw?.name
    || raw?.drug
    || raw?.drugName
    || raw?.genericName
    || raw?.brandName
    || ''
  ).trim();

  return {
    id: raw?.id || raw?.drugId || raw?._id || name,
    name,
    category: String(raw?.category || raw?.class || raw?.type || raw?.group || 'Drug').trim() || 'Drug',
    commonDose: String(raw?.commonDose || raw?.strength || raw?.dose || raw?.defaultDose || '').trim(),
  };
}

function extractDrugList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.drugs)) return payload.drugs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.drugs)) return payload.data.drugs;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.drug && typeof payload.drug === 'object') return [payload.drug];
  if (payload?.data?.drug && typeof payload.data.drug === 'object') return [payload.data.drug];
  return [];
}

function createVitalForm(recordedBy = '') {
  return {
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    bp: '',
    sugar: '',
    resp: '',
    spo2: '',
    pulse: '',
    temp: '',
    weight: '',
    urinalysis: '',
    recordedBy,
    notes: '',
  };
}

function splitBloodPressure(value) {
  const match = String(value || '').trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  return {
    systolic: match?.[1] || '',
    diastolic: match?.[2] || '',
  };
}

function extractVitalList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.vitals)) return payload.vitals;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.vitals)) return payload.data.vitals;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.vital && typeof payload.vital === 'object') return [payload.vital];
  if (payload?.data?.vital && typeof payload.data.vital === 'object') return [payload.data.vital];
  return [];
}

function toVitalDateString(value, fallbackDate) {
  if (!value) return fallbackDate || new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackDate || String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function toVitalTimeString(value, fallbackTime) {
  if (!value) return fallbackTime || new Date().toTimeString().slice(0, 5);
  if (/^\d{2}:\d{2}/.test(String(value))) return String(value).slice(0, 5);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackTime || String(value).slice(0, 5);
  return parsed.toTimeString().slice(0, 5);
}

/** API may return takenBy/recordedBy as a string id, display name, or populated user object */
function vitalRecorderDisplayName(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value !== 'object') return '';
  const u = value?.user;
  const fromUser = u && (typeof u === 'string' ? u : vitalRecorderDisplayName(u));
  const direct =
    value?.name
    || value?.fullName
    || value?.displayName
    || value?.staffName
    || value?.nurseName
    || value?.label
    || fromUser;
  if (direct) return String(direct).trim();
  const first = value?.firstName || value?.givenName || '';
  const last = value?.lastName || value?.familyName || '';
  const combined = `${first} ${last}`.trim();
  return combined || '';
}

function normalizeVitalRecord(rawVital, fallback = {}) {
  const raw = rawVital && typeof rawVital === 'object' ? rawVital : {};
  const systolic = String(raw?.bloodPressureSystolic || raw?.systolic || fallback?.bloodPressureSystolic || '').trim();
  const diastolic = String(raw?.bloodPressureDystolic || raw?.diastolic || fallback?.bloodPressureDystolic || '').trim();
  const fallbackBloodPressure = String(raw?.bloodPressure || fallback?.bp || '').trim();
  const bp = systolic || diastolic
    ? [systolic, diastolic].filter(Boolean).join('/')
    : fallbackBloodPressure;
  const timestamp = raw?.takenAt || raw?.recordedAt || raw?.createdAt || raw?.updatedAt || fallback?.timestamp || '';

  return {
    id: raw?.id || raw?._id || raw?.vitalId || fallback?.id || Date.now(),
    patientId: raw?.patientId || fallback?.patientId || '',
    date: toVitalDateString(raw?.date || raw?.takenDate || timestamp, fallback?.date),
    time: toVitalTimeString(raw?.time || raw?.takenTime || timestamp, fallback?.time),
    bp,
    sugar: String(raw?.bloodSugar ?? fallback?.sugar ?? '').trim(),
    resp: String(raw?.respiration ?? fallback?.resp ?? '').trim(),
    spo2: String(raw?.sp02 ?? raw?.spo2 ?? fallback?.spo2 ?? '').trim(),
    pulse: String(raw?.pulseRate ?? raw?.pulse ?? fallback?.pulse ?? '').trim(),
    temp: String(raw?.temperature ?? fallback?.temp ?? '').trim(),
    weight: String(raw?.weight ?? fallback?.weight ?? '').trim(),
    urinalysis: String(raw?.urinalysis ?? fallback?.urinalysis ?? '').trim(),
    recordedBy:
      vitalRecorderDisplayName(raw?.takenBy)
      || vitalRecorderDisplayName(raw?.recordedBy)
      || vitalRecorderDisplayName(fallback?.recordedBy),
    notes: String(raw?.notes || fallback?.notes || '').trim(),
  };
}

function sortVitalRecords(records) {
  return [...records].sort((left, right) => {
    const leftDate = new Date(`${left.date || '1970-01-01'}T${left.time || '00:00'}`);
    const rightDate = new Date(`${right.date || '1970-01-01'}T${right.time || '00:00'}`);
    return rightDate - leftDate;
  });
}

function extractCarePlanList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.carePlans)) return payload.carePlans;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (
    payload?.data
    && typeof payload.data === 'object'
    && !Array.isArray(payload.data)
    && String(payload.data.task || '').trim()
  ) {
    return [payload.data];
  }
  if (Array.isArray(payload?.data?.carePlans)) return payload.data.carePlans;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.carePlan && typeof payload.carePlan === 'object') return [payload.carePlan];
  if (payload?.data?.carePlan && typeof payload.data.carePlan === 'object') return [payload.data.carePlan];
  /* Root-level single object: { patientId, task, category, frequency, priority, description } */
  if (
    payload
    && typeof payload === 'object'
    && !Array.isArray(payload)
    && String(payload.task || '').trim()
  ) {
    return [payload];
  }
  return [];
}

function carePlanDerivedId(row) {
  const r = row && typeof row === 'object' ? row : {};
  const s = [
    r.patientId,
    r.task,
    r.category,
    r.frequency,
    r.priority,
    r.description ?? r.notes ?? '',
  ].join('\x1e');
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return `cp-${(h >>> 0).toString(36)}`;
}

function normalizeCarePlanRecord(raw, fallback = {}) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const createdRaw = r.createdAt || r.createdDate || r.date || r.updatedAt || fallback.createdDate || '';
  const createdDate = createdRaw
    ? (String(createdRaw).includes('T') ? String(createdRaw).split('T')[0] : String(createdRaw).slice(0, 10))
    : new Date().toISOString().slice(0, 10);
  const desc = r.description ?? r.notes ?? fallback.notes ?? '';
  const checked = Boolean(
    r.completed ?? r.isCompleted ?? r.checked ?? r.isChecked ?? fallback.checked ?? false,
  );
  const explicitId = r.id ?? r._id ?? r.carePlanId ?? fallback.id;
  return {
    id: explicitId != null && String(explicitId).trim() !== '' ? explicitId : carePlanDerivedId(r),
    patientId: String(r.patientId ?? fallback.patientId ?? '').trim(),
    task: String(r.task ?? fallback.task ?? '').trim(),
    category: String(r.category ?? fallback.category ?? 'Other').trim() || 'Other',
    frequency: String(r.frequency ?? fallback.frequency ?? 'Daily').trim() || 'Daily',
    priority: String(r.priority ?? fallback.priority ?? 'Medium').trim() || 'Medium',
    notes: String(desc ?? '').trim(),
    checked,
    createdDate: /^\d{4}-\d{2}-\d{2}$/.test(createdDate) ? createdDate : new Date().toISOString().slice(0, 10),
  };
}

function sortCarePlanItems(items) {
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    const pd = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
    if (pd !== 0) return pd;
    return String(a.task || '').localeCompare(String(b.task || ''));
  });
}

function buildCarePlanApiBody(patientId, form, options = {}) {
  const pid = String(patientId || '').trim();
  const body = {
    patientId: pid,
    task: String(form.task ?? '').trim(),
    category: form.category,
    frequency: form.frequency,
    priority: form.priority,
  };
  const desc = String(form.notes ?? '').trim();
  if (desc) {
    body.description = desc;
  }
  if (options.completed !== undefined) {
    body.completed = Boolean(options.completed);
  }
  return body;
}

/** Read completed flag from POST /care-plan-checklist/mark (or similar) JSON when present. */
function completionFromCarePlanMarkResponse(data) {
  if (!data || typeof data !== 'object') return undefined;
  const v =
    data.completed
    ?? data.isCompleted
    ?? data.is_completed
    ?? data.checked
    ?? data.isChecked
    ?? data.data?.completed
    ?? data.data?.isCompleted
    ?? data.data?.is_completed
    ?? data.carePlan?.completed
    ?? data.carePlan?.isCompleted;
  if (v === undefined || v === null) return undefined;
  return Boolean(v);
}

function extractDailyChecklistList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.checklist)) return payload.checklist;
  if (Array.isArray(payload?.carePlans)) return payload.carePlans;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.dailyItems)) return payload.dailyItems;
  if (typeof payload === 'object' && String(payload.task || '').trim()) return [payload];
  return [];
}

function normalizeDailyChecklistRow(raw, index = 0) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const id = r.id ?? r._id ?? r.carePlanId ?? `daily-${index}`;
  const completed = Boolean(
    r.completed ?? r.isCompleted ?? r.checked ?? r.isChecked ?? r.marked ?? false,
  );
  const completedBy = r.completedBy ?? r.nurseName ?? r.markedBy ?? r.nurse?.name ?? null;
  const completedAt = r.completedAt ?? r.completedTime ?? r.markedAt ?? r.time ?? null;
  return {
    id: String(id),
    task: String(r.task ?? r.title ?? r.name ?? '').trim(),
    category: String(r.category ?? 'Other').trim() || 'Other',
    frequency: String(r.frequency ?? 'Daily').trim() || 'Daily',
    priority: String(r.priority ?? 'Medium').trim() || 'Medium',
    completed,
    completedBy: completedBy != null && String(completedBy).trim() ? String(completedBy) : null,
    completedAt: completedAt != null && String(completedAt).trim() ? String(completedAt) : null,
  };
}

/* ── Nurse Notes helpers ── */
function cleanNoteContent(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function noteContentToApi(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('<br>');
}

function extractNurseNoteList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notes)) return payload.notes;
  if (Array.isArray(payload?.nurseNotes)) return payload.nurseNotes;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.notes)) return payload.data.notes;
  if (Array.isArray(payload?.data?.nurseNotes)) return payload.data.nurseNotes;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.note && typeof payload.note === 'object') return [payload.note];
  if (payload?.nurseNote && typeof payload.nurseNote === 'object') return [payload.nurseNote];
  if (payload?.data?.note && typeof payload.data.note === 'object') return [payload.data.note];
  return [];
}

function toNoteDateString(value, fallbackDate) {
  if (!value) return fallbackDate || new Date().toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackDate || String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function toNoteTimeString(value, fallbackTime) {
  if (!value) return fallbackTime || new Date().toTimeString().slice(0, 5);
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackTime || String(value).slice(0, 5);
  return parsed.toTimeString().slice(0, 5);
}

function normalizeNurseNote(rawNote, fallback = {}) {
  const raw = rawNote && typeof rawNote === 'object' ? rawNote : {};
  const timestamp = raw?.recordedAt || raw?.createdAt || raw?.updatedAt || raw?.takenAt || fallback?.timestamp || '';
  const nurseName = String(
    raw?.nurseName
    || raw?.recordedBy
    || raw?.author
    || raw?.createdByName
    || raw?.staffName
    || (typeof raw?.nurse === 'string' ? raw.nurse : raw?.nurse?.name)
    || fallback?.nurse
    || ''
  ).trim();
  const nurseId = String(
    raw?.nurseId
    || raw?.recordedById
    || raw?.authorId
    || raw?.createdBy
    || (typeof raw?.nurse === 'object' ? raw?.nurse?.id || raw?.nurse?._id : '')
    || fallback?.nurseId
    || ''
  ).trim();
  const rawContent = String(
    raw?.note
    || raw?.content
    || raw?.text
    || raw?.body
    || raw?.description
    || raw?.message
    || fallback?.content
    || ''
  );
  const content = cleanNoteContent(rawContent);
  const category = String(raw?.category || raw?.type || fallback?.category || 'Assessment').trim() || 'Assessment';
  const priority = String(raw?.priority || raw?.severity || fallback?.priority || 'Normal').trim() || 'Normal';
  const pinned = Boolean(raw?.pinned ?? raw?.isPinned ?? fallback?.pinned ?? false);

  return {
    id: raw?.id || raw?._id || raw?.noteId || raw?.nurseNoteId || fallback?.id || `note-${Date.now()}`,
    patientId: String(raw?.patientId || (typeof raw?.patient === 'object' ? raw?.patient?.id || raw?.patient?._id : raw?.patient) || fallback?.patientId || '').trim(),
    nurseId,
    nurse: nurseName,
    date: toNoteDateString(raw?.date || timestamp, fallback?.date),
    time: toNoteTimeString(raw?.time || timestamp, fallback?.time),
    category,
    priority,
    content,
    pinned,
    timestamp,
  };
}

function sortNurseNotes(notes) {
  return [...notes].sort((a, b) => {
    if (Boolean(b.pinned) !== Boolean(a.pinned)) return Boolean(b.pinned) ? 1 : -1;
    const left = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
    const right = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
    return right - left;
  });
}

/* ─── Incident report API helpers ─── */
const INCIDENT_TYPE_LABELS = ['Fall', 'Medication Error', 'Skin Breakdown', 'Behavioral', 'Equipment Failure', 'Missed Visit', 'Injury', 'Allergic Reaction', 'Infection', 'Other'];
const INCIDENT_TYPE_TO_API = INCIDENT_TYPE_LABELS.reduce((acc, label) => {
  acc[label] = label.toLowerCase().replace(/\s+/g, '-');
  return acc;
}, {});
const INCIDENT_TYPE_FROM_API = Object.entries(INCIDENT_TYPE_TO_API).reduce((acc, [label, api]) => {
  acc[api] = label;
  acc[api.replace(/-/g, ' ')] = label;
  acc[label.toLowerCase()] = label;
  return acc;
}, {});

const INCIDENT_SEVERITY_TO_API = { Minor: 'low', Moderate: 'moderate', Serious: 'high', Critical: 'critical' };
const INCIDENT_SEVERITY_FROM_API = { low: 'Minor', minor: 'Minor', moderate: 'Moderate', medium: 'Moderate', high: 'Serious', serious: 'Serious', critical: 'Critical' };

function incidentTypeToApi(label) {
  if (!label) return '';
  return INCIDENT_TYPE_TO_API[label] || String(label).toLowerCase().replace(/\s+/g, '-');
}

function incidentTypeFromApi(value, fallback = 'Fall') {
  if (!value) return fallback;
  const v = String(value).trim();
  if (INCIDENT_TYPE_FROM_API[v]) return INCIDENT_TYPE_FROM_API[v];
  if (INCIDENT_TYPE_FROM_API[v.toLowerCase()]) return INCIDENT_TYPE_FROM_API[v.toLowerCase()];
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

function incidentSeverityToApi(label) {
  if (!label) return '';
  return INCIDENT_SEVERITY_TO_API[label] || String(label).toLowerCase();
}

function incidentSeverityFromApi(value, fallback = 'Minor') {
  if (!value) return fallback;
  const v = String(value).trim().toLowerCase();
  return INCIDENT_SEVERITY_FROM_API[v] || (v.charAt(0).toUpperCase() + v.slice(1));
}

/** PATCH /incidents/:id — API uses snake_case; UI uses `in-progress`. */
function incidentStatusToApi(uiStatus) {
  const s = String(uiStatus || 'open').trim().toLowerCase().replace(/_/g, '-');
  if (s === 'in-progress') return 'in_progress';
  if (s === 'resolved') return 'resolved';
  if (s === 'open') return 'open';
  return s.replace(/-/g, '_');
}

function incidentStatusFromApi(value, fallback = 'open') {
  if (value == null || value === '') return fallback;
  const v = String(value).trim().toLowerCase().replace(/_/g, '-');
  if (v === 'wip' || v === 'inprogress') return 'in-progress';
  if (v === 'in-progress') return 'in-progress';
  if (v === 'resolved' || v === 'closed') return 'resolved';
  if (v === 'open' || v === 'pending') return 'open';
  return v || fallback;
}

function incidentDateToApi(value) {
  if (!value) return '';
  const s = String(value).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().slice(0, 10);
    const [y, m, d] = iso.split('-');
    return `${d}-${m}-${y}`;
  }
  return s;
}

function incidentDateFromApi(value, fallback) {
  if (!value) return fallback || new Date().toISOString().slice(0, 10);
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-');
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return fallback || s;
}

function incidentTimeToApi(value) {
  if (!value) return '';
  const s = String(value).trim();
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (ampmMatch) return `${String(ampmMatch[1]).padStart(2, '0')}:${ampmMatch[2]}${ampmMatch[3].toUpperCase()}`;
  const t24 = s.match(/^(\d{1,2}):(\d{2})/);
  if (t24) {
    let h = parseInt(t24[1], 10);
    const min = t24[2];
    if (Number.isNaN(h)) return s;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${min}${period}`;
  }
  return s;
}

function incidentTimeFromApi(value, fallback) {
  if (!value) return fallback || new Date().toTimeString().slice(0, 5);
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const period = m[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m[2]}`;
  }
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5).padStart(5, '0');
  return fallback || s;
}

function extractIncidentList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.incidents)) return payload.incidents;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.incidents)) return payload.data.incidents;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.incident && typeof payload.incident === 'object') return [payload.incident];
  if (payload?.data?.incident && typeof payload.data.incident === 'object') return [payload.data.incident];
  return [];
}

function isUnknownReporterLabel(name) {
  const s = String(name || '').trim();
  if (!s) return true;
  return /^unknown$/i.test(s);
}

function nurseObjectToDisplayName(nurse) {
  if (!nurse || typeof nurse !== 'object') return '';
  const combined = `${nurse.firstName || ''} ${nurse.lastName || ''}`.trim();
  return String(nurse.name || nurse.fullName || combined || '').trim();
}

function normalizeIncident(rawIncident, fallback = {}) {
  const raw = rawIncident && typeof rawIncident === 'object' ? rawIncident : {};
  const nestedNurseName = nurseObjectToDisplayName(raw?.nurse);
  return {
    id: raw?.id || raw?._id || raw?.incidentId || fallback?.id || `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nurseId: String(raw?.nurseId || (typeof raw?.nurse === 'object' ? raw?.nurse?.id || raw?.nurse?._id : '') || fallback?.nurseId || '').trim(),
    patientId: String(raw?.patientId || (typeof raw?.patient === 'object' ? raw?.patient?.id || raw?.patient?._id : raw?.patient) || fallback?.patientId || '').trim(),
    date: incidentDateFromApi(raw?.date, fallback?.date),
    time: incidentTimeFromApi(raw?.time, fallback?.time),
    type: incidentTypeFromApi(raw?.incidentType ?? raw?.type, fallback?.type),
    severity: incidentSeverityFromApi(raw?.severity, fallback?.severity),
    location: String(raw?.location || fallback?.location || '').trim(),
    description: String(raw?.description || fallback?.description || '').trim(),
    immediateAction: String(raw?.actionTaken ?? raw?.immediateAction ?? fallback?.immediateAction ?? '').trim(),
    injuryDetails: String(raw?.injuryDetail ?? raw?.injuryDetails ?? fallback?.injuryDetails ?? '').trim(),
    followUp: String(raw?.followUpPlan ?? raw?.followUp ?? fallback?.followUp ?? '').trim(),
    witnesses: String(raw?.witnesses ?? fallback?.witnesses ?? '').trim(),
    physicianNotified: Boolean(raw?.physicianNotified ?? fallback?.physicianNotified ?? false),
    familyNotified: Boolean(raw?.familyNotified ?? fallback?.familyNotified ?? false),
    status: incidentStatusFromApi(raw?.status ?? fallback?.status, 'open'),
    reportedBy: String(
      raw?.reportedBy
      || raw?.nurseName
      || raw?.reportedByName
      || raw?.reporterName
      || nestedNurseName
      || fallback?.reportedBy
      || ''
    ).trim(),
    timestamp: raw?.createdAt || raw?.recordedAt || raw?.updatedAt || fallback?.timestamp || '',
  };
}

function sortIncidents(items) {
  return [...items].sort((a, b) => {
    const left = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
    const right = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
    return right - left;
  });
}

function isUuidV4ish(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || '').trim());
}

function isLikelyMongoObjectId(s) {
  return /^[a-f\d]{24}$/i.test(String(s || '').trim());
}

function collectNurseIdCandidates(raw) {
  const out = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !out.includes(s)) out.push(s);
  };
  if (!raw || typeof raw !== 'object') return out;

  push(raw.nurseId);
  push(raw.uuid);
  push(raw.nurseUuid);
  push(raw.nurse_id);
  push(raw.publicId);
  push(raw.id);
  push(raw.userId);
  push(raw.accountId);

  if (raw.user && typeof raw.user === 'object') {
    push(raw.user.nurseId);
    push(raw.user.id);
    push(raw.user._id);
    push(raw.user.uuid);
  }
  if (raw.nurse && typeof raw.nurse === 'object') {
    push(raw.nurse.nurseId);
    push(raw.nurse.id);
    push(raw.nurse._id);
    push(raw.nurse.uuid);
  }

  push(raw._id);
  return out;
}

/** Nurse id for POST /care-plan-checklist/mark — API expects UUID (or Mongo id); avoid email/sub. */
function resolveNurseIdForCarePlanMark(currentUser, tokenPayload) {
  const candidates = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !candidates.includes(s)) candidates.push(s);
  };
  for (const c of collectNurseIdCandidates(currentUser || {})) push(c);
  for (const c of collectNurseIdCandidates(tokenPayload || {})) push(c);

  const uuid = candidates.find(isUuidV4ish);
  if (uuid) return uuid;
  const mongo = candidates.find(isLikelyMongoObjectId);
  if (mongo) return mongo;
  return '';
}

/**
 * Nurses from GET /nurses often expose both a Mongo _id and a UUID the API expects on related routes.
 * Prefer UUID (and non–ObjectId strings) for POST /incidents `nurseId`.
 */
function normalizeIncidentNurseRow(n) {
  const raw = n && typeof n === 'object' ? n : {};
  const candidates = collectNurseIdCandidates(raw);
  if (!candidates.length) return null;

  const uuid = candidates.find(isUuidV4ish);
  const apiId = uuid || candidates.find((c) => !isLikelyMongoObjectId(c)) || candidates[0];
  const idsForMatch = [...new Set(candidates)];

  const first = raw.firstName || '';
  const last = raw.lastName || '';
  const name = String(raw.name || `${first} ${last}`).trim();
  if (!name) return null;
  const jobTitle = String(raw.jobTitle || raw.specialisation || raw.specialization || '').trim();
  return { id: apiId, name, jobTitle, idsForMatch };
}

function resolveCurrentNurseId(currentUser, tokenPayload) {
  const candidates = [];
  const push = (v) => {
    if (v == null) return;
    const s = String(v).trim();
    if (s && !candidates.includes(s)) candidates.push(s);
  };

  push(currentUser?.nurseId);
  push(tokenPayload?.nurseId);
  push(currentUser?.id);
  push(currentUser?._id);
  push(currentUser?.userId);
  push(currentUser?.staffId);
  push(tokenPayload?.userId);
  push(tokenPayload?.id);
  push(tokenPayload?.sub);

  if (!candidates.length) return '';

  const uuid = candidates.find(isUuidV4ish);
  if (uuid) return uuid;

  const nonMongo = candidates.find((c) => !isLikelyMongoObjectId(c));
  if (nonMongo) return nonMongo;

  return candidates[0] || '';
}

export default function PatientProfile() {
  const { patientId } = useParams();
  const effectivePatientId = patientId || FALLBACK_PATIENT_ID;
  const navigate = useNavigate();
  const [tab, setTab] = useState('chart');
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);
  const [remotePatient, setRemotePatient] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState('');
  const [avatarImageError, setAvatarImageError] = useState(false);
  const [photoRefreshLoading, setPhotoRefreshLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [savingProfileUpdate, setSavingProfileUpdate] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState('');
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState('');
  const [showProfileSaveAlert, setShowProfileSaveAlert] = useState(false);
  const [medicationSaveSuccess, setMedicationSaveSuccess] = useState('');
  const [showMedicationSaveAlert, setShowMedicationSaveAlert] = useState(false);
  const [vitalSaveSuccess, setVitalSaveSuccess] = useState('');
  const [showVitalSaveAlert, setShowVitalSaveAlert] = useState(false);
  const [latestRecordedVital, setLatestRecordedVital] = useState(null);
  const [latestVitalLoading, setLatestVitalLoading] = useState(false);
  const [profileUpdateForm, setProfileUpdateForm] = useState(() => createPatientUpdateForm(null, effectivePatientId));
  const currentUser = getUser();
  const currentUserName = String(
    currentUser?.name
    || currentUser?.fullName
    || currentUser?.username
    || currentUser?.staffName
    || currentUser?.nurseName
    || ''
  ).trim();

  const setProfileUpdateField = (path, value) => {
    const keys = String(path || '').split('.').filter(Boolean);
    if (!keys.length) return;

    setProfileUpdateForm(prev => {
      const next = { ...prev };
      let cursor = next;
      let source = prev;

      for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        cursor[key] = { ...(source?.[key] || {}) };
        cursor = cursor[key];
        source = source?.[key] || {};
      }

      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const loadPatientProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const response = await apiFetch(`/patients/${effectivePatientId}`, { method: 'GET' });
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to load patient profile.');
      }

      const rawPatient = data?.patient || data?.data || data;
      const hydratedProfile = await hydratePatientProfile(rawPatient, effectivePatientId);
      setRemotePatient(hydratedProfile);
    } catch (error) {
      setProfileError(error?.message || 'Unable to load patient profile.');
    } finally {
      setProfileLoading(false);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadPatientProfile();
  }, [loadPatientProfile]);

  const loadMedicationRecords = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setAddedMeds([]);
      return;
    }

    const cachedItems = mergeMedicationRecords(
      getCachedPatientMedications(patientIdValue).map(item => normalizeMedicationRecord(item, { patientId: patientIdValue, source: 'cache' }))
    );

    try {
      const patientMedicationResponse = await apiFetch(`/medications/detail/${encodeURIComponent(patientIdValue)}`, { method: 'GET' });

      let patientMedicationPayload = {};
      try {
        patientMedicationPayload = await patientMedicationResponse.json();
      } catch {
        patientMedicationPayload = {};
      }

      if (patientMedicationResponse.ok) {
        const patientMedicationItems = extractMedicationList(patientMedicationPayload)
          .map(item => normalizeMedicationRecord(item, { patientId: patientIdValue }))
          .filter(item => item.drug);
        const mergedItems = mergeMedicationRecords([...patientMedicationItems, ...cachedItems]);
        setAddedMeds(mergedItems);
        setCachedPatientMedications(patientIdValue, mergedItems);
        return;
      }

      setAddedMeds(cachedItems);
    } catch {
      setAddedMeds(cachedItems);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadMedicationRecords();
  }, [loadMedicationRecords]);

  const loadLatestVitalRecord = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setLatestRecordedVital(null);
      setLatestVitalLoading(false);
      return;
    }

    setLatestVitalLoading(true);
    try {
      const response = await apiFetch(`/vitals/patient/${encodeURIComponent(patientIdValue)}/latest`, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        setLatestRecordedVital(null);
        return;
      }

      const latestItem = payload?.vital || payload?.data?.vital || payload?.data || payload;
      const normalizedLatest = normalizeVitalRecord(latestItem, { patientId: patientIdValue });
      const hasVitalData = normalizedLatest.bp || normalizedLatest.sugar || normalizedLatest.spo2 || normalizedLatest.pulse || normalizedLatest.temp || normalizedLatest.resp || normalizedLatest.weight || normalizedLatest.urinalysis;
      setLatestRecordedVital(hasVitalData ? normalizedLatest : null);
    } catch {
      setLatestRecordedVital(null);
    } finally {
      setLatestVitalLoading(false);
    }
  }, [effectivePatientId]);

  const loadVitalRecords = useCallback(async () => {
    try {
      const patientIdValue = String(effectivePatientId || '').trim();
      if (!patientIdValue) {
        setVitalRecords([]);
        return;
      }

      const response = await apiFetch(`/vitals/patient/${encodeURIComponent(patientIdValue)}`, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        setVitalRecords([]);
        return;
      }

      const records = extractVitalList(payload)
        .map((item) => normalizeVitalRecord(item, { patientId: patientIdValue }))
        .filter((item) => item.bp || item.sugar || item.spo2 || item.pulse || item.temp || item.resp || item.weight || item.urinalysis);

      setVitalRecords(sortVitalRecords(records));
    } catch {
      setVitalRecords([]);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadVitalRecords();
  }, [loadVitalRecords]);

  useEffect(() => {
    loadLatestVitalRecord();
  }, [loadLatestVitalRecord]);

  /* Medication database */
  const MEDICATION_DB = [
    { name: 'Metformin', category: 'Antidiabetic', commonDose: '500mg' },
    { name: 'Amlodipine', category: 'Antihypertensive', commonDose: '5mg' },
    { name: 'Aspirin', category: 'Antiplatelet', commonDose: '75mg' },
    { name: 'Amoxicillin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Omeprazole', category: 'Antacid', commonDose: '20mg' },
    { name: 'Paracetamol', category: 'Analgesic', commonDose: '500mg' },
    { name: 'Ibuprofen', category: 'NSAID', commonDose: '400mg' },
    { name: 'Tramadol', category: 'Opioid Analgesic', commonDose: '50mg' },
    { name: 'Gabapentin', category: 'Anticonvulsant', commonDose: '300mg' },
    { name: 'Lisinopril', category: 'ACE Inhibitor', commonDose: '10mg' },
    { name: 'Losartan', category: 'ARB', commonDose: '50mg' },
    { name: 'Atorvastatin', category: 'Statin', commonDose: '20mg' },
    { name: 'Ciprofloxacin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Furosemide', category: 'Diuretic', commonDose: '40mg' },
    { name: 'Prednisolone', category: 'Corticosteroid', commonDose: '5mg' },
    { name: 'Insulin Glargine', category: 'Insulin', commonDose: '20u' },
    { name: 'Salbutamol', category: 'Bronchodilator', commonDose: 'Inhaler' },
    { name: 'Ferrous Sulphate', category: 'Iron Supplement', commonDose: '200mg' },
    { name: 'Calcium Carbonate', category: 'Supplement', commonDose: '500mg' },
    { name: 'Erythropoietin', category: 'Hematopoietic', commonDose: 'Injection' },
    { name: 'Warfarin', category: 'Anticoagulant', commonDose: '5mg' },
    { name: 'Clopidogrel', category: 'Antiplatelet', commonDose: '75mg' },
    { name: 'Doxycycline', category: 'Antibiotic', commonDose: '100mg' },
    { name: 'Azithromycin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Diazepam', category: 'Benzodiazepine', commonDose: '5mg' },
    { name: 'Morphine', category: 'Opioid', commonDose: '10mg' },
    { name: 'Hydrochlorothiazide', category: 'Diuretic', commonDose: '25mg' },
    { name: 'Ceftriaxone', category: 'Antibiotic', commonDose: '1g' },
    { name: 'Cloxacillin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Diclofenac', category: 'NSAID', commonDose: '50mg' },
    { name: 'Carvedilol', category: 'Beta Blocker', commonDose: '6.25mg' },
    { name: 'Nifedipine', category: 'Calcium Channel Blocker', commonDose: '30mg' },
    { name: 'Spironolactone', category: 'Diuretic', commonDose: '25mg' },
    { name: 'Digoxin', category: 'Cardiac Glycoside', commonDose: '0.25mg' },
    { name: 'Chlorpheniramine', category: 'Antihistamine', commonDose: '4mg' },
    { name: 'Cetirizine', category: 'Antihistamine', commonDose: '10mg' },
    { name: 'Multivitamin', category: 'Supplement', commonDose: '1 tab' },
    { name: 'Folic Acid', category: 'Supplement', commonDose: '5mg' },
    { name: 'Vitamin B Complex', category: 'Supplement', commonDose: '1 tab' },
    { name: 'Artemether-Lumefantrine', category: 'Antimalarial', commonDose: '20/120mg' },
  ];

  /* Medication state */
  const [drugCatalog, setDrugCatalog] = useState(MEDICATION_DB);
  const [drugCatalogLoading, setDrugCatalogLoading] = useState(false);
  const [drugCatalogError, setDrugCatalogError] = useState('');
  const [addedMeds, setAddedMeds] = useState([]);
  const [deletedExistingMeds, setDeletedExistingMeds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'existing'|'added', id: number, name: string }
  const [medDeleteConfirmInput, setMedDeleteConfirmInput] = useState('');
  const [showMedForm, setShowMedForm] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState(null);
  const [medicationSaveError, setMedicationSaveError] = useState('');
  const [medicationDeleteError, setMedicationDeleteError] = useState('');
  const [savingMedication, setSavingMedication] = useState(false);
  const [deletingMedication, setDeletingMedication] = useState(false);
  const [medForm, setMedForm] = useState({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' });
  const [drugSearch, setDrugSearch] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [showCustomDrug, setShowCustomDrug] = useState(false);
  const [customDrugName, setCustomDrugName] = useState('');

  /* Vitals state */
  const [vitalRecords, setVitalRecords] = useState([]);
  const [showVitalsMegaModal, setShowVitalsMegaModal] = useState(false);
  const [showNotesMegaModal, setShowNotesMegaModal] = useState(false);
  const [showIncidentsMegaModal, setShowIncidentsMegaModal] = useState(false);
  const [showMedicationsMegaModal, setShowMedicationsMegaModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [vitalForm, setVitalForm] = useState(() => createVitalForm(currentUserName));
  const [expandedVital, setExpandedVital] = useState(null);
  const [savingVital, setSavingVital] = useState(false);
  const [vitalSaveError, setVitalSaveError] = useState('');
  const [editingVitalId, setEditingVitalId] = useState(null);

  /* Reminder state */
  const [showReminderForm, setShowReminderForm] = useState(null); // med id
  const [reminderForm, setReminderForm] = useState(createMedicationReminderState());

  /* Nurse Notes state */
  const [nurseNotes, setNurseNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [notesScope, setNotesScope] = useState('patient'); // 'patient' | 'nurse'
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), nurse: '', category: 'Assessment', priority: 'Normal', content: '' });
  const [noteFilter, setNoteFilter] = useState('All');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const currentNurseId = resolveCurrentNurseId(currentUser, parseJwtPayload(getToken()));

  const FREQ_OPTIONS = ['OD', 'BD', 'TDS', 'QDS', 'PRN', 'ON', 'Weekly', 'Stat'];
  const ROUTE_OPTIONS = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Rectal', 'Sublingual'];

  const loadDrugCatalog = useCallback(async () => {
    setDrugCatalogLoading(true);
    setDrugCatalogError('');

    try {
      const response = await apiFetch('/drugs', { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Unable to load the drug list.');
      }

      const items = extractDrugList(payload)
        .map(normalizeDrugOption)
        .filter(item => item.name)
        .reduce((result, item) => {
          if (result.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
            return result;
          }

          result.push(item);
          return result;
        }, []);

      if (items.length > 0) {
        setDrugCatalog(items);
        setDrugCatalogError('');
      } else {
        setDrugCatalog(MEDICATION_DB);
        setDrugCatalogError('No drugs were returned from `/drugs`.');
      }
    } catch (error) {
      setDrugCatalog(MEDICATION_DB);
      setDrugCatalogError(error?.message || 'Unable to load the drug list.');
    } finally {
      setDrugCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showMedForm) {
      loadDrugCatalog();
    }
  }, [showMedForm, loadDrugCatalog]);

  /* Filtered drug list */
  const filteredDrugs = drugCatalog.filter(d =>
    d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(drugSearch.toLowerCase())
  );
  const drugNotFound = drugSearch.length >= 2 && filteredDrugs.length === 0;

  const selectDrug = (drug) => {
    setMedForm(f => ({ ...f, drug: drug.name, dosage: drug.commonDose }));
    setDrugSearch(drug.name);
    setShowDrugDropdown(false);
    setShowCustomDrug(false);
  };

  const applyCustomDrug = () => {
    if (!customDrugName.trim()) return;
    setMedForm(f => ({ ...f, drug: customDrugName.trim() }));
    setDrugSearch(customDrugName.trim());
    setShowCustomDrug(false);
    setShowDrugDropdown(false);
  };

  const resetMedicationComposer = () => {
    setShowMedForm(false);
    setEditingMedicationId(null);
    setMedicationSaveError('');
    setDrugCatalogError('');
    setMedForm({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' });
    setDrugSearch('');
    setShowDrugDropdown(false);
    setShowCustomDrug(false);
    setCustomDrugName('');
    setReminderForm(createMedicationReminderState());
  };

  const openMedicationEditor = (medication) => {
    if (!medication) return;

    setEditingMedicationId(medication.id);
    setMedicationSaveError('');
    setShowMedForm(true);
    setMedForm({
      drug: medication.drug || '',
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      route: medication.route || 'Oral',
      notes: medication.notes || '',
    });
    setDrugSearch(medication.drug || '');
    setShowDrugDropdown(false);
    setShowCustomDrug(false);
    setCustomDrugName('');
    setReminderForm(createMedicationReminderState(medication));
  };

  const handleAddMed = async () => {
    if (!medForm.drug || !medForm.dosage || !medForm.frequency) return;
    setSavingMedication(true);
    setMedicationSaveError('');

    const currentUser = getUser();
    const addedBy = currentUser?.id || currentUser?._id || currentUser?.userId || currentUser?.staffId || undefined;
    const defaultReminder = createMedicationReminderState(editingMedicationId ? reminderForm : {});
    const medicationPayload = {
      patientId: effectivePatientId,
      prescribedBy: 'external',
      drug: medForm.drug,
      dosage: medForm.dosage,
      intake: medForm.route.toLowerCase(),
      startDate: defaultReminder.startDate,
      endDate: defaultReminder.endDate || null,
      active: true,
      time: defaultReminder.times.filter(Boolean).map(formatMedicationApiTime),
      ...(addedBy ? { addedBy } : {}),
    };

    try {
      const response = await apiFetch(
        editingMedicationId ? `/medications/${encodeURIComponent(editingMedicationId)}` : '/medications',
        {
        method: editingMedicationId ? 'PATCH' : 'POST',
        body: JSON.stringify(medicationPayload),
      });

      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to save medication.');
      }

      const savedMedication = normalizeMedicationRecord(data?.medication || data?.data || data, {
        id: editingMedicationId || undefined,
        ...medForm,
        ...medicationPayload,
        reminderType: defaultReminder.reminderType,
        notifyNurse: defaultReminder.notifyNurse,
        notifyPatient: defaultReminder.notifyPatient,
        startDate: defaultReminder.startDate,
        endDate: defaultReminder.endDate,
      });

      setAddedMeds(prev => {
        const next = editingMedicationId
          ? mergeMedicationRecords([...prev.filter(item => item.id !== editingMedicationId), savedMedication])
          : mergeMedicationRecords([...prev, savedMedication]);
        setCachedPatientMedications(effectivePatientId, next);
        return next;
      });
      setMedicationSaveSuccess(`${savedMedication.drug || 'Medication'} ${editingMedicationId ? 'updated' : 'added'} successfully.`);
      resetMedicationComposer();
      if (!editingMedicationId) {
        setShowReminderForm(savedMedication.id);
        setReminderForm(createMedicationReminderState(savedMedication));
      }
    } catch (error) {
      setMedicationSaveError(error?.message || 'Unable to save medication.');
    } finally {
      setSavingMedication(false);
    }
  };

  const handleRemoveMed = (id) => {
    setAddedMeds(prev => {
      const next = prev.filter(m => m.id !== id);
      setCachedPatientMedications(effectivePatientId, next);
      return next;
    });
    if (showReminderForm === id) setShowReminderForm(null);
  };

  const confirmDeleteMed = async () => {
    if (!confirmDelete || deletingMedication) return;

    if (medDeleteConfirmInput.trim() !== String(confirmDelete.name || '').trim()) {
      setMedicationDeleteError(`Type the medication name exactly as shown to confirm deletion.`);
      return;
    }
    setMedicationDeleteError('');

    if (confirmDelete.type === 'existing') {
      setDeletedExistingMeds(prev => [...prev, confirmDelete.id]);
      setConfirmDelete(null);
      return;
    }

    const medicationToDelete = addedMeds.find(item => String(item.id) === String(confirmDelete.id));
    if (!medicationToDelete) {
      handleRemoveMed(confirmDelete.id);
      setConfirmDelete(null);
      return;
    }

    setDeletingMedication(true);
    setMedicationDeleteError('');

    const deleteCandidates = [
      {
        path: `/medications/${encodeURIComponent(effectivePatientId)}`,
        body: {
          medicationId: medicationToDelete.id,
          patientId: effectivePatientId,
          drug: medicationToDelete.drug,
        },
      },
      ...(String(medicationToDelete.id || '').trim() && String(medicationToDelete.id) !== String(effectivePatientId)
        ? [
            {
              path: `/medications/${encodeURIComponent(medicationToDelete.id)}`,
              body: {
                patientId: effectivePatientId,
              },
            },
          ]
        : []),
    ];

    let deleteSucceeded = false;
    let deleteErrorMessage = 'Unable to delete medication.';

    for (const candidate of deleteCandidates) {
      try {
        const response = await apiFetch(candidate.path, {
          method: 'DELETE',
          body: JSON.stringify(candidate.body),
        });

        const responseText = await response.text().catch(() => '');
        let data = {};

        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }

        if (response.ok) {
          deleteSucceeded = true;
          break;
        }

        deleteErrorMessage = data?.message || data?.error || deleteErrorMessage;
      } catch (error) {
        deleteErrorMessage = error?.message || deleteErrorMessage;
      }
    }

    if (!deleteSucceeded) {
      setMedicationDeleteError(deleteErrorMessage);
      setDeletingMedication(false);
      return;
    }

    handleRemoveMed(confirmDelete.id);
    setMedicationSaveSuccess(`${medicationToDelete.drug || 'Medication'} deleted successfully.`);
    setConfirmDelete(null);
    setDeletingMedication(false);
  };

  const saveReminder = async (medId) => {
    const currentMedication = addedMeds.find(item => item.id === medId);

    if (currentMedication) {
      try {
        const response = await apiFetch(`/medications/${encodeURIComponent(medId)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            patientId: effectivePatientId,
            prescribedBy: currentMedication.prescribedBy || 'external',
            drug: currentMedication.drug,
            dosage: currentMedication.dosage,
            intake: String(currentMedication.route || 'Oral').toLowerCase(),
            startDate: reminderForm.startDate,
            endDate: reminderForm.endDate || null,
            active: currentMedication.active ?? true,
            time: reminderForm.times.filter(Boolean).map(formatMedicationApiTime),
          }),
        });

        const responseText = await response.text().catch(() => '');
        let data = {};
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }

        if (!response.ok) {
          throw new Error(data?.message || data?.error || 'Unable to save medication reminder.');
        }

        const updatedMedication = normalizeMedicationRecord(data?.medication || data?.data || data, {
          ...currentMedication,
          time: reminderForm.times.filter(Boolean).map(formatMedicationApiTime),
          startDate: reminderForm.startDate,
          endDate: reminderForm.endDate,
          reminderType: reminderForm.reminderType,
          notifyNurse: reminderForm.notifyNurse,
          notifyPatient: reminderForm.notifyPatient,
        });

        setAddedMeds(prev => {
          const next = mergeMedicationRecords(prev.map(item => item.id === medId ? updatedMedication : item));
          setCachedPatientMedications(effectivePatientId, next);
          return next;
        });
      } catch (error) {
        setMedicationSaveError(error?.message || 'Unable to save medication reminder.');
        return;
      }
    } else {
      setAddedMeds(prev => {
        const next = prev.map(m => m.id === medId ? { ...m, reminders: { ...reminderForm } } : m);
        setCachedPatientMedications(effectivePatientId, next);
        return next;
      });
    }

    setShowReminderForm(null);
    setReminderForm(createMedicationReminderState());
  };

  const addReminderTime = () => {
    setReminderForm(f => ({ ...f, times: [...f.times, '12:00'] }));
  };

  const removeReminderTime = (idx) => {
    setReminderForm(f => ({ ...f, times: f.times.filter((_, i) => i !== idx) }));
  };

  const updateReminderTime = (idx, val) => {
    setReminderForm(f => ({ ...f, times: f.times.map((t, i) => i === idx ? val : t) }));
  };

  /* Vitals helpers */
  const startEditVital = (record) => {
    if (!record) return;
    setEditingVitalId(record.id);
    setVitalSaveError('');
    setVitalForm({
      date: record.date || new Date().toISOString().slice(0, 10),
      time: record.time || new Date().toTimeString().slice(0, 5),
      bp: record.bp || '',
      sugar: record.sugar || '',
      resp: record.resp || '',
      spo2: record.spo2 || '',
      pulse: record.pulse || '',
      temp: record.temp || '',
      weight: record.weight || '',
      urinalysis: record.urinalysis || '',
      recordedBy: vitalRecorderDisplayName(record.recordedBy) || currentUserName || vitalRecorderDisplayName(p?.nurse) || '',
      notes: record.notes || '',
    });
    setShowVitalForm(true);
  };

  const closeVitalForm = () => {
    if (savingVital) return;
    setShowVitalForm(false);
    setVitalSaveError('');
    setEditingVitalId(null);
  };

  const handleAddVital = async () => {
    if (savingVital) return;
    if (!vitalForm.bp && !vitalForm.sugar && !vitalForm.pulse && !vitalForm.temp && !vitalForm.spo2 && !vitalForm.resp && !vitalForm.weight && !vitalForm.urinalysis) return;

    const tokenPayload = parseJwtPayload(getToken());
    const agencyId = resolveAgencyId(remotePatient) || resolveAgencyId(p) || resolveAgencyId(currentUser) || resolveAgencyId(tokenPayload);

    const { systolic, diastolic } = splitBloodPressure(vitalForm.bp);
    const recordedBy = (vitalRecorderDisplayName(vitalForm.recordedBy) || currentUserName || vitalRecorderDisplayName(p?.nurse) || '').trim();

    const payload = {
      patientId: effectivePatientId,
      ...(agencyId ? { agency: agencyId } : {}),
      bloodPressureSystolic: systolic,
      bloodPressureDystolic: diastolic,
      bloodSugar: String(vitalForm.sugar || '').trim(),
      respiration: String(vitalForm.resp || '').trim(),
      sp02: String(vitalForm.spo2 || '').trim(),
      pulseRate: String(vitalForm.pulse || '').trim(),
      temperature: String(vitalForm.temp || '').trim(),
      urinalysis: String(vitalForm.urinalysis || '').trim(),
      weight: String(vitalForm.weight || '').trim(),
      takenBy: recordedBy,
    };

    const isEditing = Boolean(editingVitalId);
    setSavingVital(true);
    setVitalSaveError('');

    try {
      const response = await apiFetch(
        isEditing ? `/vitals/${encodeURIComponent(editingVitalId)}` : '/vitals',
        {
          method: isEditing ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || (isEditing ? 'Unable to update vital record.' : 'Unable to save vital record.'));
      }

      const savedRecord = normalizeVitalRecord(data?.vital || data?.data || data, {
        id: isEditing ? editingVitalId : Date.now(),
        patientId: effectivePatientId,
        date: vitalForm.date,
        time: vitalForm.time,
        bp: vitalForm.bp,
        sugar: vitalForm.sugar,
        resp: vitalForm.resp,
        spo2: vitalForm.spo2,
        pulse: vitalForm.pulse,
        temp: vitalForm.temp,
        weight: vitalForm.weight,
        urinalysis: vitalForm.urinalysis,
        recordedBy,
        notes: vitalForm.notes,
      });

      await Promise.all([loadVitalRecords(), loadLatestVitalRecord()]);
      setVitalRecords((prev) => {
        if (isEditing) {
          const next = prev.map((item) => (item.id === editingVitalId ? { ...item, ...savedRecord, id: editingVitalId } : item));
          return sortVitalRecords(next);
        }
        return prev.length > 0 ? prev : sortVitalRecords([savedRecord]);
      });
      setEditingVitalId(null);
      setVitalForm(createVitalForm(currentUserName));
      setShowVitalForm(false);
      setVitalSaveSuccess(isEditing ? 'Vital record updated successfully.' : 'Vital record added successfully.');
    } catch (error) {
      setVitalSaveError(error?.message || (isEditing ? 'Unable to update vital record.' : 'Unable to save vital record.'));
    } finally {
      setSavingVital(false);
    }
  };

  const deleteVitalRecord = (id) => {
    setVitalRecords(prev => prev.filter(r => r.id !== id));
    if (expandedVital === id) setExpandedVital(null);
    if (editingVitalId === id) {
      setEditingVitalId(null);
      setShowVitalForm(false);
    }
  };

  /* Get latest vital value (from added records or admission) */
  const getLatestVital = (field) => {
    const latest = vitalRecords.find(r => r[field]);
    return latest ? latest[field] : p.vitals[field];
  };

  /* Check if vital is flagged */
  const isVitalFlagged = (field, value) => {
    if (!value) return false;
    if (field === 'bp') return parseInt(value) >= 140;
    if (field === 'sugar') return parseFloat(value) > 7;
    if (field === 'spo2') return parseInt(value) < 95;
    if (field === 'urinalysis') return value !== 'Normal' && value !== '';
    if (field === 'temp') return parseFloat(value) > 37.5;
    if (field === 'pulse') return parseInt(value) > 100 || parseInt(value) < 60;
    return false;
  };

  /* Nurse Notes handlers */
  const NOTE_CATEGORIES = ['Assessment', 'Medication', 'Care Update', 'Communication', 'Shift Handover', 'Incident', 'Observation', 'Other'];

  const resetNoteForm = () => {
    setNoteForm({
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      nurse: currentUserName || '',
      category: 'Assessment',
      priority: 'Normal',
      content: '',
    });
    setEditingNoteId(null);
    setNoteSaveError('');
  };

  const startEditNote = (note) => {
    if (!note) return;
    setEditingNoteId(note.id);
    setNoteSaveError('');
    setNoteForm({
      date: note.date || new Date().toISOString().slice(0, 10),
      time: note.time || new Date().toTimeString().slice(0, 5),
      nurse: note.nurse || currentUserName || '',
      category: note.category || 'Assessment',
      priority: note.priority || 'Normal',
      content: note.content || '',
    });
    setShowNoteForm(true);
  };

  const loadNurseNotes = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    const nurseIdValue = String(currentNurseId || '').trim();

    let path = '';
    if (notesScope === 'nurse') {
      if (!nurseIdValue) {
        setNurseNotes([]);
        setNotesError('Sign-in info is missing — cannot load your notes.');
        return;
      }
      path = `/nurse-notes/nurse/${encodeURIComponent(nurseIdValue)}`;
    } else {
      if (!patientIdValue) {
        setNurseNotes([]);
        return;
      }
      path = `/nurse-notes/patient/${encodeURIComponent(patientIdValue)}`;
    }

    setNotesLoading(true);
    setNotesError('');

    try {
      const response = await apiFetch(path, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};
      if (responseText) {
        try { payload = JSON.parse(responseText); } catch { payload = { message: responseText }; }
      }

      if (!response.ok) {
        if (response.status === 404) {
          setNurseNotes([]);
          return;
        }
        throw new Error(payload?.message || payload?.error || 'Unable to load nurse notes.');
      }

      const items = extractNurseNoteList(payload)
        .map((item) => normalizeNurseNote(item, { patientId: patientIdValue }))
        .filter((item) => item.content);
      setNurseNotes(sortNurseNotes(items));
    } catch (error) {
      setNurseNotes([]);
      setNotesError(error?.message || 'Unable to load nurse notes.');
    } finally {
      setNotesLoading(false);
    }
  }, [effectivePatientId, currentNurseId, notesScope]);

  useEffect(() => {
    loadNurseNotes();
  }, [loadNurseNotes]);

  const handleAddNote = async () => {
    if (savingNote) return;
    const plainContent = String(noteForm.content || '').trim();
    if (!plainContent) {
      setNoteSaveError('Note content is required.');
      return;
    }

    const isEditing = Boolean(editingNoteId);
    if (!isEditing && !currentNurseId) {
      setNoteSaveError('Cannot create a note without a signed-in nurse identity.');
      return;
    }

    const noteForApi = noteContentToApi(plainContent);
    const payload = isEditing
      ? { note: noteForApi }
      : {
          nurseId: currentNurseId,
          patientId: effectivePatientId,
          note: noteForApi,
        };

    setSavingNote(true);
    setNoteSaveError('');

    try {
      const response = await apiFetch(
        isEditing ? `/nurse-notes/${encodeURIComponent(editingNoteId)}` : '/nurse-notes',
        {
          method: isEditing ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || (isEditing ? 'Unable to update note.' : 'Unable to save note.'));
      }

      const nurseName = String(noteForm.nurse || currentUserName || p?.nurse || '').trim();
      const savedNote = normalizeNurseNote(
        data?.note || data?.nurseNote || data?.data || data,
        {
          id: isEditing ? editingNoteId : undefined,
          patientId: effectivePatientId,
          nurseId: currentNurseId,
          nurse: nurseName,
          content: plainContent,
          date: noteForm.date,
          time: noteForm.time,
          category: noteForm.category,
          priority: noteForm.priority,
        }
      );

      setNurseNotes((prev) => {
        if (isEditing) {
          return sortNurseNotes(prev.map((item) => (String(item.id) === String(editingNoteId) ? { ...item, ...savedNote, id: editingNoteId } : item)));
        }
        return sortNurseNotes([savedNote, ...prev]);
      });

      resetNoteForm();
      setShowNoteForm(false);
      loadNurseNotes();
    } catch (error) {
      setNoteSaveError(error?.message || (isEditing ? 'Unable to update note.' : 'Unable to save note.'));
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!id) return;
    setDeletingNoteId(id);
    try {
      const response = await apiFetch(`/nurse-notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        const responseText = await response.text().catch(() => '');
        let data = {};
        if (responseText) {
          try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
        }
        setNotesError(data?.message || data?.error || 'Unable to delete note.');
        return;
      }
      setNurseNotes((prev) => prev.filter((n) => String(n.id) !== String(id)));
      if (editingNoteId === id) {
        setEditingNoteId(null);
        setShowNoteForm(false);
      }
    } catch (error) {
      setNotesError(error?.message || 'Unable to delete note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handlePinNote = async (id) => {
    const target = nurseNotes.find((n) => String(n.id) === String(id));
    if (!target) return;
    const nextPinned = !target.pinned;

    setNurseNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, pinned: nextPinned } : n)));

    try {
      const response = await apiFetch(`/nurse-notes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: nextPinned, isPinned: nextPinned }),
      });
      if (!response.ok && response.status !== 404) {
        setNurseNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, pinned: !nextPinned } : n)));
      }
    } catch {
      setNurseNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, pinned: !nextPinned } : n)));
    }
  };
  const filteredNotes = nurseNotes
    .filter(n => noteFilter === 'All' || n.category === noteFilter)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getCategoryColor = (cat) => {
    const colors = { Assessment: '#45B6FE', Medication: '#3b82f6', 'Care Update': '#8b5cf6', Communication: '#f59e0b', 'Shift Handover': '#2E7DB8', Incident: '#dc2626', Observation: '#06b6d4', Other: '#6b7280' };
    return colors[cat] || '#6b7280';
  };

  /* ── Incident Report state ── */
  const INCIDENT_TYPES = INCIDENT_TYPE_LABELS;
  const INCIDENT_SEVERITIES = ['Minor', 'Moderate', 'Serious', 'Critical'];
  const [incidents, setIncidents] = useState([]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
    reportedBy: '', type: 'Fall', severity: 'Minor', location: '',
    description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
    physicianNotified: false, familyNotified: false,
  });
  const [incidentFilter, setIncidentFilter] = useState('All');
  const [expandedIncident, setExpandedIncident] = useState(null);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState('');
  const [savingIncident, setSavingIncident] = useState(false);
  const [incidentSaveError, setIncidentSaveError] = useState('');
  const [deletingIncidentId, setDeletingIncidentId] = useState(null);
  const [confirmDeleteIncident, setConfirmDeleteIncident] = useState(null);
  const [incidentDeleteModalError, setIncidentDeleteModalError] = useState('');
  const [updatingIncidentStatusId, setUpdatingIncidentStatusId] = useState(null);
  const [editingIncidentId, setEditingIncidentId] = useState(null);
  const [incidentNurses, setIncidentNurses] = useState([]);
  const [incidentNursesLoading, setIncidentNursesLoading] = useState(false);
  const [incidentNursesError, setIncidentNursesError] = useState('');

  const resetIncidentForm = () => {
    setEditingIncidentId(null);
    setIncidentForm({
      date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
      reportedBy: String(currentUserName || '').trim(),
      type: 'Fall', severity: 'Minor', location: '',
      description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
      physicianNotified: false, familyNotified: false,
    });
    setIncidentSaveError('');
  };

  const loadIncidents = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setIncidents([]);
      return;
    }
    setIncidentsLoading(true);
    setIncidentsError('');
    try {
      const response = await apiFetch(`/incidents/patient/${encodeURIComponent(patientIdValue)}`, { method: 'GET' });
      const responseText = await response.text().catch(() => '');
      let payload = {};
      if (responseText) {
        try { payload = JSON.parse(responseText); } catch { payload = { message: responseText }; }
      }
      console.debug('[incidents] GET response', { status: response.status, payload });
      if (!response.ok) {
        if (response.status === 404) {
          setIncidents([]);
          return;
        }
        throw new Error(payload?.message || payload?.error || 'Unable to load incident reports.');
      }
      const items = extractIncidentList(payload)
        .map((item) => normalizeIncident(item, { patientId: patientIdValue }))
        .filter((item) => item.description || item.type);
      // Merge: if the server hasn't yet caught up, keep any locally-known incidents
      // that aren't in the response (so a just-created entry survives an eager refetch).
      setIncidents((prev) => {
        const serverIds = new Set(items.map((it) => String(it.id)));
        const stillLocal = prev.filter((it) => !serverIds.has(String(it.id)) && String(it.id).startsWith('inc-'));
        return sortIncidents([...items, ...stillLocal]);
      });
    } catch (error) {
      setIncidentsError(error?.message || 'Unable to load incident reports.');
    } finally {
      setIncidentsLoading(false);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const loadIncidentNurses = useCallback(async () => {
    setIncidentNursesLoading(true);
    setIncidentNursesError('');
    try {
      const response = await apiFetch('/nurses', { method: 'GET' });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }
      if (!response.ok) throw new Error(data?.message || data?.error || 'Failed to load nurses.');
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.nurses) ? data.nurses
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.items) ? data.items
        : [];
      const normalized = list
        .map(normalizeIncidentNurseRow)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      setIncidentNurses(normalized);
    } catch (error) {
      setIncidentNurses([]);
      setIncidentNursesError(error?.message || 'Unable to load nurses.');
    } finally {
      setIncidentNursesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showIncidentsMegaModal && incidentNurses.length === 0 && !incidentNursesLoading) {
      loadIncidentNurses();
    }
  }, [showIncidentsMegaModal, incidentNurses.length, incidentNursesLoading, loadIncidentNurses]);

  useEffect(() => {
    if (!incidentNurses.length) return;
    setIncidents((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        if (!isUnknownReporterLabel(it.reportedBy)) return it;
        const nid = String(it.nurseId || '').trim();
        if (!nid) return it;
        const row = incidentNurses.find((n) => n.idsForMatch.includes(nid));
        if (!row?.name) return it;
        changed = true;
        return { ...it, reportedBy: row.name };
      });
      return changed ? next : prev;
    });
  }, [incidentNurses]);

  const handleAddIncident = async () => {
    if (savingIncident) return;
    if (!incidentForm.description.trim() || !incidentForm.type) {
      setIncidentSaveError('Description and type are required.');
      return;
    }
    const pref = String(incidentForm.reportedBy || '').trim();
    if (!pref) {
      setIncidentSaveError('Please enter who reported this incident.');
      return;
    }
    const sessionNurse = String(currentNurseId || '').trim();
    const lower = pref.toLowerCase();
    const nameMatch = incidentNurses.find(
      (n) => n.name && n.name.trim().toLowerCase() === lower
    );
    const idMatch = !nameMatch
      ? incidentNurses.find((n) => n.idsForMatch.includes(pref))
      : null;
    const rowMatch = nameMatch || idMatch;
    let reportingNurseId = '';
    if (rowMatch) {
      reportingNurseId = rowMatch.id;
    } else if (sessionNurse) {
      reportingNurseId = sessionNurse;
    }
    reportingNurseId = String(reportingNurseId || '').trim();
    if (incidentNurses.length) {
      const rowForPost = incidentNurses.find((n) => n.idsForMatch.includes(reportingNurseId));
      if (rowForPost) reportingNurseId = rowForPost.id;
    }
    if (!reportingNurseId) {
      setIncidentSaveError('Sign in to file a report, or enter a nurse name that matches your roster.');
      return;
    }

    const apiPayload = {
      nurseId: reportingNurseId,
      patientId: String(effectivePatientId || '').trim(),
      date: incidentDateToApi(incidentForm.date),
      time: incidentTimeToApi(incidentForm.time),
      incidentType: incidentTypeToApi(incidentForm.type),
      severity: incidentSeverityToApi(incidentForm.severity),
      location: incidentForm.location || '',
      description: incidentForm.description.trim(),
      actionTaken: incidentForm.immediateAction || '',
      injuryDetail: incidentForm.injuryDetails || '',
      followUpPlan: incidentForm.followUp || '',
      physicianNotified: Boolean(incidentForm.physicianNotified),
      familyNotified: Boolean(incidentForm.familyNotified),
    };

    setSavingIncident(true);
    setIncidentSaveError('');
    console.debug('[incidents] POST payload', apiPayload);
    try {
      const response = await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify(apiPayload),
      });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }
      console.debug('[incidents] POST response', { status: response.status, data });

      // Treat as failure if HTTP status is non-OK OR body explicitly signals failure.
      const bodyExplicitlyFailed =
        data && (data.success === false || data.ok === false || (data.error && !data.id && !data._id && !data.incident));
      if (!response.ok || bodyExplicitlyFailed) {
        const errMsg =
          data?.message
          || data?.data?.message
          || (typeof data?.error === 'string' ? data.error : data?.error?.message)
          || `Save failed (HTTP ${response.status}).`;
        throw new Error(errMsg);
      }

      const reporterRow = incidentNurses.find((n) => n.idsForMatch.includes(String(reportingNurseId)));
      const reporterFallback = String(rowMatch?.name || pref || reporterRow?.name || currentUserName || '').trim();
      const savedIncident = normalizeIncident(
        data?.incident || data?.data?.incident || data?.data || data,
        {
          patientId: effectivePatientId,
          nurseId: reportingNurseId,
          date: incidentForm.date,
          time: incidentForm.time,
          type: incidentForm.type,
          severity: incidentForm.severity,
          location: incidentForm.location,
          description: incidentForm.description,
          immediateAction: incidentForm.immediateAction,
          injuryDetails: incidentForm.injuryDetails,
          followUp: incidentForm.followUp,
          witnesses: incidentForm.witnesses,
          physicianNotified: incidentForm.physicianNotified,
          familyNotified: incidentForm.familyNotified,
          reportedBy: reporterFallback,
          status: 'open',
        }
      );

      // Add optimistically. We do NOT immediately refetch — if the backend has any
      // commit delay, an eager GET could return an empty list and wipe the just-saved
      // entry from view. Refresh button + tab re-open will re-sync from the server.
      setIncidents((prev) => {
        const without = prev.filter((it) => String(it.id) !== String(savedIncident.id));
        return sortIncidents([savedIncident, ...without]);
      });
      resetIncidentForm();
      setShowIncidentForm(false);

      // Soft re-sync after a beat — far enough out for typical commit latency.
      setTimeout(() => { loadIncidents(); }, 1200);
    } catch (error) {
      console.error('[incidents] POST failed', error);
      setIncidentSaveError(error?.message || 'Unable to save incident report.');
    } finally {
      setSavingIncident(false);
    }
  };

  const handleUpdateIncident = async () => {
    if (savingIncident) return;
    const incidentId = String(editingIncidentId || '').trim();
    if (!incidentId) return;

    if (!incidentForm.description.trim() || !incidentForm.type) {
      setIncidentSaveError('Description and type are required.');
      return;
    }
    const pref = String(incidentForm.reportedBy || '').trim();
    if (!pref) {
      setIncidentSaveError('Please enter who reported this incident.');
      return;
    }
    const sessionNurse = String(currentNurseId || '').trim();
    const lower = pref.toLowerCase();
    const nameMatch = incidentNurses.find(
      (n) => n.name && n.name.trim().toLowerCase() === lower
    );
    const idMatch = !nameMatch
      ? incidentNurses.find((n) => n.idsForMatch.includes(pref))
      : null;
    const rowMatch = nameMatch || idMatch;
    let reportingNurseId = '';
    if (rowMatch) {
      reportingNurseId = rowMatch.id;
    } else if (sessionNurse) {
      reportingNurseId = sessionNurse;
    }
    reportingNurseId = String(reportingNurseId || '').trim();
    if (incidentNurses.length) {
      const rowForPost = incidentNurses.find((n) => n.idsForMatch.includes(reportingNurseId));
      if (rowForPost) reportingNurseId = rowForPost.id;
    }
    if (!reportingNurseId) {
      setIncidentSaveError('Sign in to update this report, or enter a nurse name that matches your roster.');
      return;
    }

    const currentInc = incidents.find((i) => String(i.id) === incidentId);
    const statusPayload = incidentStatusToApi(currentInc?.status ?? 'open');

    const apiPayload = {
      nurseId: reportingNurseId,
      patientId: String(effectivePatientId || '').trim(),
      date: incidentDateToApi(incidentForm.date),
      time: incidentTimeToApi(incidentForm.time),
      incidentType: incidentTypeToApi(incidentForm.type),
      severity: incidentSeverityToApi(incidentForm.severity),
      location: incidentForm.location || '',
      description: incidentForm.description.trim(),
      actionTaken: incidentForm.immediateAction || '',
      injuryDetail: incidentForm.injuryDetails || '',
      followUpPlan: incidentForm.followUp || '',
      physicianNotified: Boolean(incidentForm.physicianNotified),
      familyNotified: Boolean(incidentForm.familyNotified),
      status: statusPayload,
    };

    setSavingIncident(true);
    setIncidentSaveError('');
    console.debug('[incidents] PATCH payload', incidentId, apiPayload);
    try {
      const response = await apiFetch(`/incidents/${encodeURIComponent(incidentId)}`, {
        method: 'PATCH',
        body: JSON.stringify(apiPayload),
      });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
      }
      console.debug('[incidents] PATCH response', { status: response.status, data });

      const bodyExplicitlyFailed =
        data && (data.success === false || data.ok === false || (data.error && !data.id && !data._id && !data.incident));
      if (!response.ok || bodyExplicitlyFailed) {
        const errMsg =
          data?.message
          || data?.data?.message
          || (typeof data?.error === 'string' ? data.error : data?.error?.message)
          || `Update failed (HTTP ${response.status}).`;
        throw new Error(errMsg);
      }

      const reporterRow = incidentNurses.find((n) => n.idsForMatch.includes(String(reportingNurseId)));
      const reporterFallback = String(rowMatch?.name || pref || reporterRow?.name || currentUserName || '').trim();
      const updatedIncident = normalizeIncident(
        data?.incident || data?.data?.incident || data?.data || data || {},
        {
          id: incidentId,
          patientId: effectivePatientId,
          nurseId: reportingNurseId,
          date: incidentForm.date,
          time: incidentForm.time,
          type: incidentForm.type,
          severity: incidentForm.severity,
          location: incidentForm.location,
          description: incidentForm.description,
          immediateAction: incidentForm.immediateAction,
          injuryDetails: incidentForm.injuryDetails,
          followUp: incidentForm.followUp,
          witnesses: incidentForm.witnesses,
          physicianNotified: incidentForm.physicianNotified,
          familyNotified: incidentForm.familyNotified,
          reportedBy: reporterFallback,
          status: currentInc?.status ?? 'open',
        }
      );

      setIncidents((prev) => {
        const without = prev.filter((it) => String(it.id) !== String(updatedIncident.id));
        return sortIncidents([updatedIncident, ...without]);
      });
      resetIncidentForm();
      setShowIncidentForm(false);
      setTimeout(() => { loadIncidents(); }, 1200);
    } catch (error) {
      console.error('[incidents] PATCH failed', error);
      setIncidentSaveError(error?.message || 'Unable to update incident report.');
    } finally {
      setSavingIncident(false);
    }
  };

  const performDeleteIncident = async (id) => {
    const incidentId = String(id || '').trim();
    if (!incidentId || deletingIncidentId === incidentId) return false;
    setDeletingIncidentId(incidentId);
    setIncidentsError('');
    try {
      const response = await apiFetch(`/incidents/${encodeURIComponent(incidentId)}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        const responseText = await response.text().catch(() => '');
        let data = {};
        if (responseText) {
          try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }
        }
        throw new Error(data?.message || data?.error || 'Unable to delete incident.');
      }
      setIncidents((prev) => prev.filter((inc) => String(inc.id) !== String(incidentId)));
      if (expandedIncident === incidentId) setExpandedIncident(null);
      return true;
    } catch (error) {
      setIncidentDeleteModalError(error?.message || 'Unable to delete incident.');
      return false;
    } finally {
      setDeletingIncidentId(null);
    }
  };

  const requestDeleteIncident = (id) => {
    const incidentId = String(id || '').trim();
    if (!incidentId || deletingIncidentId === incidentId) return;
    setIncidentDeleteModalError('');
    setConfirmDeleteIncident({ id: incidentId });
  };

  const confirmDeleteIncidentAction = async () => {
    if (!confirmDeleteIncident?.id) return;
    const targetId = confirmDeleteIncident.id;
    const ok = await performDeleteIncident(targetId);
    if (ok) {
      setConfirmDeleteIncident(null);
      setIncidentDeleteModalError('');
      if (String(editingIncidentId) === String(targetId)) {
        setShowIncidentForm(false);
        resetIncidentForm();
      }
    }
  };

  const handleDeleteIncident = requestDeleteIncident;

  const handleUpdateIncidentStatus = async (id, newStatus) => {
    const incidentId = String(id || '').trim();
    if (!incidentId || updatingIncidentStatusId === incidentId) return;

    const previous = incidents;
    const statusPayload = incidentStatusToApi(newStatus);

    setUpdatingIncidentStatusId(incidentId);
    setIncidentsError('');
    setIncidents((prev) =>
      prev.map((inc) => (String(inc.id) === incidentId ? { ...inc, status: newStatus } : inc))
    );

    try {
      const response = await apiFetch(`/incidents/${encodeURIComponent(incidentId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusPayload }),
      });
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      const bodyFailed =
        data && (data.success === false || data.ok === false || (data.error && !data.data && !data.incident && !data.id));

      if (!response.ok || bodyFailed) {
        throw new Error(data?.message || data?.error || `Update failed (HTTP ${response.status}).`);
      }

      const updatedRaw = data?.data ?? data?.incident ?? (data?.id ? data : null);
      if (updatedRaw && typeof updatedRaw === 'object') {
        setIncidents((prev) =>
          sortIncidents(
            prev.map((inc) =>
              String(inc.id) === incidentId ? normalizeIncident(updatedRaw, inc) : inc
            )
          )
        );
      }
    } catch (error) {
      setIncidents(previous);
      setIncidentsError(error?.message || 'Unable to update incident.');
    } finally {
      setUpdatingIncidentStatusId(null);
    }
  };

  const incidentIdIsPersisted = (id) => {
    const s = String(id || '').trim();
    return Boolean(s) && !s.startsWith('inc-');
  };

  const filteredIncidents = incidents
    .filter(inc => incidentFilter === 'All' || inc.type === incidentFilter)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getIncidentSeverityStyle = (sev) => {
    const styles = {
      Minor:    { bg: '#fefce8', color: '#a16207', border: '#eab308' },
      Moderate: { bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
      Serious:  { bg: '#fef3c7', color: '#92400e', border: '#d97706' },
      Critical: { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' },
    };
    return styles[sev] || styles.Minor;
  };
  const getIncidentStatusStyle = (st) => {
    const styles = {
      open:          { bg: '#ffffff', color: '#374151', border: '#d1d5db', label: 'Open' },
      'in-progress': { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db', label: 'In Progress' },
      resolved:      { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Resolved' },
    };
    return styles[st] || styles.open;
  };

  const pendingDeleteIncidentDetail = confirmDeleteIncident
    ? incidents.find((i) => String(i.id) === String(confirmDeleteIncident.id))
    : null;
  const incidentDeleteDialogBusy = Boolean(
    confirmDeleteIncident
    && deletingIncidentId
    && String(deletingIncidentId) === String(confirmDeleteIncident.id)
  );

  /* ── Care Plan state ── */
  const CARE_CATEGORIES = ['Personal Care', 'Medication Management', 'Nutrition & Diet', 'Mobility & Exercise', 'Wound Care', 'Monitoring & Vitals', 'Emotional Support', 'Hygiene', 'Safety', 'Therapy', 'Other'];
  const CARE_FREQUENCIES = ['Daily', 'Twice Daily', 'Three Times Daily', 'Weekly', 'Twice Weekly', 'Biweekly', 'Monthly', 'As Needed', 'Once'];
  const CARE_PRIORITIES = ['High', 'Medium', 'Low'];
  const [carePlanItems, setCarePlanItems] = useState([]);
  const [showCarePlanForm, setShowCarePlanForm] = useState(false);
  const [carePlanForm, setCarePlanForm] = useState({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
  const [carePlanFilter, setCarePlanFilter] = useState('All');
  const [editingCarePlan, setEditingCarePlan] = useState(null);
  const [confirmDeleteCarePlan, setConfirmDeleteCarePlan] = useState(null);
  const [carePlanDeleteError, setCarePlanDeleteError] = useState('');
  const [carePlanLoading, setCarePlanLoading] = useState(false);
  const [carePlanLoadError, setCarePlanLoadError] = useState('');
  const [savingCarePlan, setSavingCarePlan] = useState(false);
  const [carePlanSaveError, setCarePlanSaveError] = useState('');
  const [carePlanSaveSuccess, setCarePlanSaveSuccess] = useState('');
  const [carePlanToggleError, setCarePlanToggleError] = useState('');
  const [deletingCarePlanId, setDeletingCarePlanId] = useState(null);
  const [carePlanListExpanded, setCarePlanListExpanded] = useState(false);

  const loadCarePlans = useCallback(async () => {
    const patientIdValue = String(effectivePatientId || '').trim();
    if (!patientIdValue) {
      setCarePlanItems([]);
      return;
    }
    setCarePlanLoading(true);
    setCarePlanLoadError('');
    try {
      let response = await apiFetch(`/care-plan/patient/${encodeURIComponent(patientIdValue)}`, { method: 'GET' });
      if (!response.ok && response.status === 404) {
        response = await apiFetch(`/care-plans/patient/${encodeURIComponent(patientIdValue)}`, { method: 'GET' });
      }
      const responseText = await response.text().catch(() => '');
      let payload = {};
      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { message: responseText };
        }
      }
      if (!response.ok) {
        setCarePlanItems([]);
        if (response.status !== 404) {
          setCarePlanLoadError(payload?.message || payload?.error || 'Unable to load care plan.');
        }
        return;
      }
      const items = extractCarePlanList(payload)
        .map((row) => normalizeCarePlanRecord(row, { patientId: patientIdValue }))
        .filter((item) => item.task);
      setCarePlanItems(sortCarePlanItems(items));
    } catch (error) {
      setCarePlanItems([]);
      setCarePlanLoadError(error?.message || 'Unable to load care plan.');
    } finally {
      setCarePlanLoading(false);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadCarePlans();
  }, [loadCarePlans]);

  const [checklistStatusDate, setChecklistStatusDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyChecklistByDate, setDailyChecklistByDate] = useState({});

  const fetchDailyChecklist = useCallback(async (dateStr) => {
    const pid = String(effectivePatientId || '').trim();
    const d = String(dateStr || '').trim();
    if (!pid || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;

    setDailyChecklistByDate((prev) => ({
      ...prev,
      [d]: { ...prev[d], loading: true, error: '' },
    }));

    try {
      const path = `/care-plan-checklist/patient/${encodeURIComponent(pid)}/daily?date=${encodeURIComponent(d)}`;
      const res = await apiFetch(path, { method: 'GET' });
      const text = await res.text().catch(() => '');
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }
      if (!res.ok) {
        if (res.status === 404) {
          setDailyChecklistByDate((prev) => ({
            ...prev,
            [d]: { items: [], loading: false, error: '' },
          }));
          return;
        }
        const msg = data?.message || data?.error || `Unable to load daily checklist (${res.status}).`;
        setDailyChecklistByDate((prev) => ({
          ...prev,
          [d]: {
            items: null,
            loading: false,
            error: typeof msg === 'string' ? msg : 'Unable to load daily checklist.',
          },
        }));
        return;
      }
      const rawList = extractDailyChecklistList(data);
      const items = rawList.map((row, i) => normalizeDailyChecklistRow(row, i)).filter((row) => row.task);
      setDailyChecklistByDate((prev) => ({
        ...prev,
        [d]: { items, loading: false, error: '' },
      }));
    } catch (e) {
      setDailyChecklistByDate((prev) => ({
        ...prev,
        [d]: { items: null, loading: false, error: e?.message || 'Unable to load daily checklist.' },
      }));
    }
  }, [effectivePatientId]);

  useEffect(() => {
    if (tab !== 'checkliststatus') return;
    const pid = String(effectivePatientId || '').trim();
    if (!pid) return;
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const x = new Date();
      x.setDate(x.getDate() - i);
      return x.toISOString().slice(0, 10);
    });
    const dates = [...new Set([...last7, checklistStatusDate])];
    dates.forEach((dt) => { void fetchDailyChecklist(dt); });
  }, [tab, effectivePatientId, checklistStatusDate, fetchDailyChecklist]);

  const postCarePlanCreate = async (fullBody, patientId) => {
    const pid = encodeURIComponent(patientId);

    const attempts = [
      ['POST', '/care-plan', fullBody],
      ['POST', `/care-plan/patient/${pid}`, fullBody],
      ['PUT', `/care-plan/patient/${pid}`, fullBody],
      ['POST', '/care-plans', fullBody],
      ['POST', `/care-plans/patient/${pid}`, fullBody],
    ];

    let last404Detail = '';
    for (const [method, path, body] of attempts) {
      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(body),
      });
      const lastText = await response.text().catch(() => '');
      let data = {};
      if (lastText) {
        try {
          data = JSON.parse(lastText);
        } catch {
          data = { message: lastText };
        }
      }
      if (response.ok) {
        return { data };
      }
      const msg = data?.message || data?.error || (typeof data === 'string' ? data : '');
      const textErr = typeof lastText === 'string' ? lastText.trim() : '';
      const combined = (typeof msg === 'string' && msg.trim() ? msg : textErr) || `HTTP ${response.status}`;
      if (response.status !== 404) {
        throw new Error(combined);
      }
      last404Detail = combined;
    }
    throw new Error(
      last404Detail
        || 'Care plan API returned "Not found" for every tried create path. Confirm POST /care-plan is deployed.',
    );
  };

  const handleAddCarePlanItem = async () => {
    if (!carePlanForm.task.trim() || savingCarePlan) return;
    const pid = String(effectivePatientId || '').trim();
    if (!pid) {
      setCarePlanSaveError('Patient is not loaded. Save the profile or open a patient record first.');
      return;
    }
    setSavingCarePlan(true);
    setCarePlanSaveError('');
    try {
      const body = buildCarePlanApiBody(pid, carePlanForm, {});
      const isEditing = Boolean(editingCarePlan);
      if (isEditing) {
        let patchResponse = await apiFetch(`/care-plan/${encodeURIComponent(editingCarePlan)}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        if (!patchResponse.ok && patchResponse.status === 404) {
          patchResponse = await apiFetch(`/care-plans/${encodeURIComponent(editingCarePlan)}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          });
        }
        const responseText = await patchResponse.text().catch(() => '');
        let data = {};
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }
        if (!patchResponse.ok) {
          const msg = data?.message || data?.error || `Unable to update care plan item (${patchResponse.status}).`;
          throw new Error(typeof msg === 'string' ? msg : 'Unable to update care plan item.');
        }
        const saved = normalizeCarePlanRecord(data?.carePlan || data?.data || data, {
          patientId: pid,
          id: editingCarePlan,
          task: carePlanForm.task,
          category: carePlanForm.category,
          frequency: carePlanForm.frequency,
          priority: carePlanForm.priority,
          notes: carePlanForm.notes,
          checked: carePlanItems.find((i) => String(i.id) === String(editingCarePlan))?.checked,
        });
        if (!saved.task) {
          await loadCarePlans();
        } else {
          setCarePlanItems((prev) => sortCarePlanItems(
            prev.map((item) => (String(item.id) === String(editingCarePlan) ? { ...item, ...saved } : item)),
          ));
        }
      } else {
        await postCarePlanCreate(body, pid);
        await loadCarePlans();
        setCarePlanSaveSuccess(`${carePlanForm.task.trim()} is now on the checklist.`);
      }
      setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
      setEditingCarePlan(null);
      setShowCarePlanForm(false);
      setCarePlanListExpanded(true);
    } catch (error) {
      setCarePlanSaveError(error?.message || 'Could not save care plan item.');
    } finally {
      setSavingCarePlan(false);
    }
  };
  const handleToggleCarePlanItem = async (id) => {
    const item = carePlanItems.find((i) => String(i.id) === String(id));
    if (!item) return;
    const pid = String(effectivePatientId || '').trim();
    if (!pid) return;
    setCarePlanToggleError('');
    const tokenPayload = parseJwtPayload(getToken());
    const markNurseId = resolveNurseIdForCarePlanMark(currentUser, tokenPayload);
    const carePlanIdStr = String(id).trim();
    const next = !item.checked;
    setCarePlanItems((prev) => sortCarePlanItems(prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: next } : i))));
    const todayIso = new Date().toISOString().slice(0, 10);

    const useCarePlanChecklistMark =
      Boolean(markNurseId)
      && !carePlanIdStr.startsWith('cp-')
      && (isUuidV4ish(pid) || isLikelyMongoObjectId(pid))
      && (isUuidV4ish(carePlanIdStr) || isLikelyMongoObjectId(carePlanIdStr));

    const runLegacyPatch = async () => {
      const body = buildCarePlanApiBody(pid, {
        task: item.task,
        category: item.category,
        frequency: item.frequency,
        priority: item.priority,
        notes: item.notes,
      }, { completed: next });
      let toggleRes = await apiFetch(`/care-plan/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!toggleRes.ok && toggleRes.status === 404) {
        toggleRes = await apiFetch(`/care-plans/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      const legacyText = await toggleRes.text().catch(() => '');
      let legacyData = {};
      if (legacyText) {
        try {
          legacyData = JSON.parse(legacyText);
        } catch {
          legacyData = { message: legacyText };
        }
      }
      if (!toggleRes.ok) {
        const msg = legacyData?.message || legacyData?.error || legacyText || 'Update failed';
        throw new Error(typeof msg === 'string' ? msg : 'Update failed.');
      }
      const resolvedLegacy = completionFromCarePlanMarkResponse(legacyData);
      if (resolvedLegacy !== undefined) {
        setCarePlanItems((prev) =>
          sortCarePlanItems(
            prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: resolvedLegacy } : i)),
          ));
      }
    };

    try {
      if (useCarePlanChecklistMark) {
        const markPayload = {
          patientId: pid,
          carePlanId: carePlanIdStr,
          nurseId: markNurseId,
        };
        const response = await apiFetch('/care-plan-checklist/mark', {
          method: 'POST',
          body: JSON.stringify(markPayload),
        });
        const responseText = await response.text().catch(() => '');
        let data = {};
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            data = { message: responseText };
          }
        }

        if (!response.ok) {
          await runLegacyPatch();
        } else {
          const resolved = completionFromCarePlanMarkResponse(data);
          if (resolved !== undefined) {
            setCarePlanItems((prev) =>
              sortCarePlanItems(
                prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: resolved } : i)),
              ));
          }
        }
      } else {
        await runLegacyPatch();
      }

      void fetchDailyChecklist(todayIso);
      /* Do not await loadCarePlans() here — GET /care-plan/patient may lag behind POST mark/PATCH
         and would replace the list with stale `completed` flags, making the checkbox snap back. */
    } catch (err) {
      const msg = err?.message || 'Could not update this item.';
      setCarePlanToggleError(msg);
      setCarePlanItems((prev) => sortCarePlanItems(prev.map((i) => (String(i.id) === String(id) ? { ...i, checked: !next } : i))));
    }
  };

  const handleDeleteCarePlanItem = async () => {
    if (!confirmDeleteCarePlan) return;
    const deleteId = confirmDeleteCarePlan.id;
    setCarePlanDeleteError('');
    setDeletingCarePlanId(deleteId);
    try {
      let response = await apiFetch(`/care-plans/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
      if (!response.ok && response.status === 404) {
        response = await apiFetch(`/care-plan/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
      }
      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to remove care plan item.');
      }
      setCarePlanItems((prev) => prev.filter((item) => String(item.id) !== String(deleteId)));
      setConfirmDeleteCarePlan(null);
      await loadCarePlans();
    } catch (error) {
      setCarePlanDeleteError(error?.message || 'Unable to remove care plan item.');
    } finally {
      setDeletingCarePlanId(null);
    }
  };
  const handleEditCarePlanItem = (item) => {
    setCarePlanSaveError('');
    setCarePlanForm({ task: item.task, category: item.category, frequency: item.frequency, priority: item.priority, notes: item.notes });
    setEditingCarePlan(item.id);
    setCarePlanListExpanded(true);
    setShowCarePlanForm(true);
  };
  const filteredCarePlanItems = carePlanItems
    .filter(item => carePlanFilter === 'All' || item.category === carePlanFilter)
    .sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
  const carePlanProgress = carePlanItems.length > 0
    ? Math.round((carePlanItems.filter(i => i.checked).length / carePlanItems.length) * 100)
    : 0;
  const carePlanCompletedCount = carePlanItems.filter((i) => i.checked).length;
  const carePlanRemainingCount = carePlanItems.length - carePlanCompletedCount;
  const carePlanHighOpenCount = carePlanItems.filter((i) => i.priority === 'High' && !i.checked).length;
  const getCarePriorityStyle = (p) => {
    const styles = { High: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }, Medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }, Low: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD' } };
    return styles[p] || styles.Medium;
  };
  /* ── Care Checklist Status (daily checklist API) ── */
  const getChecklistForDate = (dateStr) => {
    const e = dailyChecklistByDate[dateStr];
    if (e && Array.isArray(e.items)) return e.items;
    return null;
  };
  const selectedDailyEntry = dailyChecklistByDate[checklistStatusDate];
  const selectedDateChecklist = getChecklistForDate(checklistStatusDate);
  const selectedDateCompleted = selectedDateChecklist ? selectedDateChecklist.filter(i => i.completed).length : 0;
  const selectedDateTotal = selectedDateChecklist ? selectedDateChecklist.length : 0;
  const selectedDatePercent = selectedDateTotal > 0 ? Math.round((selectedDateCompleted / selectedDateTotal) * 100) : 0;
  const getCompletionLabel = (pct) => {
    if (pct === 100) return { text: 'Fully completed', bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
    if (pct >= 75) return { text: 'Mostly completed', bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
    if (pct >= 50) return { text: 'Partially completed', bg: '#fffbeb', color: '#92400e', border: '#fde68a' };
    if (pct > 0) return { text: 'Minimal progress', bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' };
    return { text: 'Not started', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
  };
  /* Quick nav dates for the last 7 days */
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] };
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarImageError(false);
    setPhotoUploadError('');
    setPhotoUploadSuccess('');
    setPhotoUploading(true);

    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.75 });
      const previewDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(compressed);
      });

      if (previewDataUrl) {
        setPhoto(previewDataUrl);
        setCachedPatientPhoto(effectivePatientId, {
          previewDataUrl,
          url: previewDataUrl,
        });
      }

      const user = getUser();
      const agencyId = resolveAgencyId(remotePatient) || resolveAgencyId(user);

      let objectKey = '';
      let mediaId = '';

      try {
        const presignResponse = await apiFetch('/media/b2/upload/presign', {
          method: 'POST',
          body: JSON.stringify({
            patientId: effectivePatientId,
            agencyId,
            purpose: 'patient_profile_image',
            fileName: compressed?.name || file?.name || `patient-${effectivePatientId}.jpg`,
            contentType: compressed?.type || file?.type || 'image/jpeg',
          }),
        });

        let presignData = {};
        try {
          presignData = await presignResponse.json();
        } catch {
          presignData = {};
        }

        if (!presignResponse.ok) {
          throw new Error(presignData?.message || presignData?.error || 'Unable to prepare image upload.');
        }

        const parsed = parsePresignResponse(presignData);
        objectKey = parsed.objectKey || '';
        mediaId = parsed.mediaId || '';

        if (!objectKey || !mediaId) {
          throw new Error('Upload metadata is incomplete. Missing objectKey or mediaId.');
        }

        await uploadFileToPresignedTarget({
          uploadUrl: parsed.uploadUrl,
          uploadFields: parsed.uploadFields,
          file: compressed,
        });
      } catch (uploadError) {
        const direct = await uploadFileViaBackend(compressed);
        objectKey = direct.objectKey;
        mediaId = direct.mediaId;

        if (!objectKey || !mediaId) {
          throw uploadError;
        }
      }

      const response = await apiFetch('/patients/profile-image', {
        method: 'POST',
        body: JSON.stringify({
          patientId: effectivePatientId,
          objectKey,
          mediaId,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to save patient profile image.');
      }

      setCachedPatientPhoto(effectivePatientId, { objectKey, mediaId });

      let latestProfileData = {};
      try {
        const latestResponse = await apiFetch(`/patients/${effectivePatientId}`, { method: 'GET' });
        const latestPayload = await latestResponse.json().catch(() => ({}));
        if (latestResponse.ok) {
          latestProfileData = latestPayload?.patient || latestPayload?.data || latestPayload || {};
          const hydratedProfile = await hydratePatientProfile(latestProfileData, effectivePatientId);
          setRemotePatient(hydratedProfile);
          if (hydratedProfile?.profileImage) {
            setCachedPatientPhoto(effectivePatientId, hydratedProfile.profileImage);
          }
        }
      } catch {
      }

      setPhotoUploadSuccess('Patient photo uploaded successfully.');
    } catch (error) {
      const message = error?.message || 'Unable to upload patient photo.';
      if (message.toLowerCase().includes('objectkey does not belong to your agency')) {
        setPhotoUploadError('Image ownership check failed for your agency. Please retry the upload and contact support if it persists.');
      } else if (message.toLowerCase().includes('failed to fetch')) {
        setPhotoUploadError('Network error while uploading image. Please confirm backend is running and reachable, then retry.');
      } else {
        setPhotoUploadError(message);
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRefreshStoredPhoto = async () => {
    setPhotoUploadError('');
    setPhotoUploadSuccess('');
    setPhotoRefreshLoading(true);

    try {
      const cachedPhoto = getCachedPatientPhoto(effectivePatientId);
      const sourceImage = mergeProfileImage(remotePatient?.profileImage, cachedPhoto);

      if (!sourceImage?.mediaId && !sourceImage?.objectKey) {
        throw new Error('No stored photo metadata found to refresh. Please upload a photo again.');
      }

      const resolvedUrl = await resolvePatientProfileImageUrl({
        mediaId: sourceImage?.mediaId,
        objectKey: sourceImage?.objectKey,
      });

      if (!resolvedUrl) {
        throw new Error('Unable to resolve a current photo URL from stored metadata.');
      }

      const nextImage = {
        ...sourceImage,
        url: resolvedUrl,
      };

      setCachedPatientPhoto(effectivePatientId, nextImage);
      setRemotePatient(prev => (prev ? {
        ...prev,
        profileImage: {
          ...(prev.profileImage || {}),
          ...nextImage,
        },
      } : prev));
      setPhoto(null);
      setAvatarImageError(false);
      setPhotoUploadSuccess('Stored photo refreshed successfully.');
    } catch (error) {
      setPhotoUploadError(error?.message || 'Unable to refresh stored photo.');
    } finally {
      setPhotoRefreshLoading(false);
    }
  };

  const submitProfileUpdates = async () => {
    setSavingProfileUpdate(true);
    setProfileUpdateError('');
    setProfileUpdateSuccess('');

    const toBooleanString = (value) => (value ? 'true' : 'false');
    const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '');
    const optionalBoolean = (value) => (value === true || value === false ? value : undefined);
    const optionalText = (value) => {
      const normalized = String(value ?? '').trim();
      return normalized ? normalized : undefined;
    };
    const pruneEmpty = (value) => {
      if (value === undefined || value === '') return undefined;
      if (Array.isArray(value)) {
        const next = value.map(pruneEmpty).filter(item => item !== undefined);
        return next.length ? next : undefined;
      }
      if (value && typeof value === 'object') {
        const nextEntries = Object.entries(value)
          .map(([key, item]) => [key, pruneEmpty(item)])
          .filter(([, item]) => item !== undefined);
        return nextEntries.length ? Object.fromEntries(nextEntries) : undefined;
      }
      return value;
    };

    const patchJson = async (path, payload) => {
      const response = await apiFetch(path, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const responseText = await response.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || `Failed request: ${path}`);
      }

      return data;
    };

    try {
      const patientIdForPatch = String(profileUpdateForm?.patientId || effectivePatientId || '').trim();
      if (!patientIdForPatch) {
        throw new Error('Patient ID is required before updating patient information.');
      }

      await patchJson('/patients/personal-info', {
        patientId: patientIdForPatch,
        registrationNumber: profileUpdateForm.personalInfo.registrationNumber,
        dateOfAssessment: profileUpdateForm.personalInfo.dateOfAssessment,
        dateOfAdmission: profileUpdateForm.personalInfo.dateOfAdmission,
        firstName: profileUpdateForm.personalInfo.firstName,
        lastName: profileUpdateForm.personalInfo.lastName,
        preferredName: profileUpdateForm.personalInfo.preferredName,
        contactNumber: profileUpdateForm.personalInfo.contactNumber,
        dateOfBirth: profileUpdateForm.personalInfo.dateOfBirth,
        age: profileUpdateForm.personalInfo.age,
        gender: profileUpdateForm.personalInfo.gender,
        residentialAddress: profileUpdateForm.personalInfo.residentialAddress,
        gpsCode: profileUpdateForm.personalInfo.gpsCode,
        email: profileUpdateForm.personalInfo.email,
      });

      await patchJson('/patients/next-of-kin', {
        patientId: patientIdForPatch,
        fullName: profileUpdateForm.nextOfKin.fullName,
        relationship: profileUpdateForm.nextOfKin.relationship,
        contactOne: profileUpdateForm.nextOfKin.contactOne,
        contactTwo: profileUpdateForm.nextOfKin.contactTwo,
        spiritualNeed: profileUpdateForm.nextOfKin.spiritualNeed,
        personalDoctor: profileUpdateForm.nextOfKin.personalDoctor,
        personalDoctorFacility: profileUpdateForm.nextOfKin.personalDoctorFacility,
        personalDoctorContact: profileUpdateForm.nextOfKin.personalDoctorContact,
      });

      await patchJson('/patients/admission-checklist', {
        patientId: patientIdForPatch,
        clientHandBookGiven: Boolean(profileUpdateForm.admissionChecklist.clientHandBookGiven),
        admittingNurse: profileUpdateForm.admissionChecklist.admittingNurse,
        infectionControlSupplies: Boolean(profileUpdateForm.admissionChecklist.infectionControlSupplies),
      });

      await patchJson('/patients/medical-history', {
        patientId: patientIdForPatch,
        anyMedicalHistory: Boolean(profileUpdateForm.medicalHistory.anyMedicalHistory),
        medicalHistoryDescription: profileUpdateForm.medicalHistory.medicalHistoryDescription,
      });

      await patchJson('/patients/communication-style', {
        patientId: patientIdForPatch,
        anyCommunicationNeeds: Boolean(profileUpdateForm.communicationStyle.anyCommunicationNeeds),
        anyHearingNeeds: Boolean(profileUpdateForm.communicationStyle.anyHearingNeeds),
        anySpeechImpairment: Boolean(profileUpdateForm.communicationStyle.anySpeechImpairment),
        anyVisualImpairment: Boolean(profileUpdateForm.communicationStyle.anyVisualImpairment),
        anyUnderstandingDifficulties: Boolean(profileUpdateForm.communicationStyle.anyUnderstandingDifficulties),
        communicationNotes: profileUpdateForm.communicationStyle.communicationNotes,
      });

      await patchJson('/patients/infection-control', {
        patientId: patientIdForPatch,
        InfectionCarePlanCompletion: Boolean(profileUpdateForm.infectionControl.InfectionCarePlanCompletion),
        anyDiabetes: Boolean(profileUpdateForm.infectionControl.anyDiabetes),
        DiabetesCarePlanCompletion: Boolean(profileUpdateForm.infectionControl.DiabetesCarePlanCompletion),
        isThePatientBedBound: Boolean(profileUpdateForm.infectionControl.isThePatientBedBound),
      });

      await patchJson('/patients/breath-pain', {
        patientId: patientIdForPatch,
        anyBreathingDifficulties: Boolean(profileUpdateForm.breathPain.anyBreathingDifficulties),
        homeOxygenNeeded: Boolean(profileUpdateForm.breathPain.homeOxygenNeeded),
        isSmoker: Boolean(profileUpdateForm.breathPain.isSmoker),
        everSmoked: Boolean(profileUpdateForm.breathPain.everSmoked),
        painPresent: toBooleanString(profileUpdateForm.breathPain.painPresent),
        anagelsiaPrescribed: Boolean(profileUpdateForm.breathPain.anagelsiaPrescribed),
        locationOfPain: profileUpdateForm.breathPain.locationOfPain,
        painScore: profileUpdateForm.breathPain.painScore,
      });

      const sleepNutritionPayload = pruneEmpty({
        patientId: patientIdForPatch,
        sleep: {
          wakeUpAtNight: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.wakeUpAtNight),
          UseOfNightSedation: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.UseOfNightSedation),
          userSleepWell: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.userSleepWell),
          RestDuringTheDay: optionalBoolean(profileUpdateForm.sleepNutrition.sleep.RestDuringTheDay),
          usualTimeToWakeUp: optionalText(profileUpdateForm.sleepNutrition.sleep.usualTimeToWakeUp),
          bestSleepingPosition: optionalText(profileUpdateForm.sleepNutrition.sleep.bestSleepingPosition),
        },
        nutrition: {
          allergy: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.allergy),
          specialDiet: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.specialDiet),
          needHelpInEating: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.needHelpInEating),
          feedingAid: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.feedingAid),
          swallowingDifficulties: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.swallowingDifficulties),
          dietType: optionalText(profileUpdateForm.sleepNutrition.nutrition.dietType),
          ngTube: optionalBoolean(profileUpdateForm.sleepNutrition.nutrition.ngTube),
          nutritionConcerns: optionalText(profileUpdateForm.sleepNutrition.nutrition.nutritionConcerns),
        },
        personal: {
          hygieneNeeds: yesNo(profileUpdateForm.hygienePsych.personal.hygieneNeeds),
          mouthCarePlan: yesNo(profileUpdateForm.hygienePsych.personal.mouthCarePlan),
          diabeteFoot: yesNo(profileUpdateForm.hygienePsych.personal.diabeteFoot),
        },
        bladderBowel: {
          bladderDysfunction: yesNo(profileUpdateForm.hygienePsych.bladderBowel.bladderDysfunction),
          catheterDescription: profileUpdateForm.hygienePsych.bladderBowel.catheterDescription,
          catheterPlan: yesNo(profileUpdateForm.hygienePsych.bladderBowel.catheterPlan),
          incontinentPads: yesNo(profileUpdateForm.hygienePsych.bladderBowel.incontinentPads),
        },
        psychologicalNeeds: {
          psychologicalNeeds: yesNo(profileUpdateForm.hygienePsych.psychologicalNeeds.psychologicalNeeds),
          depressionHistory: yesNo(profileUpdateForm.hygienePsych.psychologicalNeeds.depressionHistory),
          anxietyhistory: yesNo(profileUpdateForm.hygienePsych.psychologicalNeeds.anxietyhistory),
          signDementia: yesNo(profileUpdateForm.hygienePsych.psychologicalNeeds.signDementia),
          psychologicalNotes: profileUpdateForm.hygienePsych.psychologicalNeeds.psychologicalNotes,
        },
      });

      if (sleepNutritionPayload?.sleep || sleepNutritionPayload?.nutrition) {
        await patchJson('/patients/sleep-nutrition', sleepNutritionPayload);
      }

      try {
        await patchJson('/patients/skin-mobility', {
          patientId: patientIdForPatch,
          skinIntegrity: {
            openWounds: Boolean(profileUpdateForm.skinMobility.skinIntegrity.openWounds),
            pressureUlcer: Boolean(profileUpdateForm.skinMobility.skinIntegrity.pressureUlcer),
            gradeAdmission: profileUpdateForm.skinMobility.skinIntegrity.gradeAdmission,
            securityItems: profileUpdateForm.skinMobility.skinIntegrity.securityItems,
          },
          handlingAssessment: {
            isPatientMobile: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isPatientMobile),
            isEquipmentNeeded: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isEquipmentNeeded),
            numberOfStaffNeeded: Number(profileUpdateForm.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
            moveInBed: Boolean(profileUpdateForm.skinMobility.handlingAssessment.moveInBed),
            moveInBedEquipment: profileUpdateForm.skinMobility.handlingAssessment.moveInBedEquipment,
            mobilityFromBedToChair: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChair),
            mobilityFromBedToChairEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
            mobilityToWashroom: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroom),
            mobilityToWashroomEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
          },
        });
      } catch {
        await patchJson('/patients/initial-vitals', {
          patientId: patientIdForPatch,
          skinIntegrity: {
            openWounds: Boolean(profileUpdateForm.skinMobility.skinIntegrity.openWounds),
            pressureUlcer: Boolean(profileUpdateForm.skinMobility.skinIntegrity.pressureUlcer),
            gradeAdmission: profileUpdateForm.skinMobility.skinIntegrity.gradeAdmission,
            securityItems: profileUpdateForm.skinMobility.skinIntegrity.securityItems,
          },
          handlingAssessment: {
            isPatientMobile: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isPatientMobile),
            isEquipmentNeeded: Boolean(profileUpdateForm.skinMobility.handlingAssessment.isEquipmentNeeded),
            numberOfStaffNeeded: Number(profileUpdateForm.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
            moveInBed: Boolean(profileUpdateForm.skinMobility.handlingAssessment.moveInBed),
            moveInBedEquipment: profileUpdateForm.skinMobility.handlingAssessment.moveInBedEquipment,
            mobilityFromBedToChair: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChair),
            mobilityFromBedToChairEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
            mobilityToWashroom: Boolean(profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroom),
            mobilityToWashroomEquipment: profileUpdateForm.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
          },
        });
      }

      await patchJson('/patients/initial-vitals', {
        patientId: patientIdForPatch,
        bloodPressure: profileUpdateForm.initialVitals.bloodPressure,
        bloodSugar: profileUpdateForm.initialVitals.bloodSugar,
        respiration: profileUpdateForm.initialVitals.respiration,
        sp02: profileUpdateForm.initialVitals.sp02,
        pulseRate: profileUpdateForm.initialVitals.pulseRate,
        temperature: profileUpdateForm.initialVitals.temperature,
        urinalysis: profileUpdateForm.initialVitals.urinalysis,
        weight: profileUpdateForm.initialVitals.weight,
      });

      const latestResponse = await apiFetch(`/patients/${patientIdForPatch}`, { method: 'GET' });
      const latestPayload = await latestResponse.json().catch(() => ({}));
      if (latestResponse.ok) {
        const latestRawPatient = latestPayload?.patient || latestPayload?.data || latestPayload;
        const hydratedProfile = await hydratePatientProfile(latestRawPatient, patientIdForPatch);
        setRemotePatient(hydratedProfile);
      }

      setShowUpdateModal(false);
      setProfileUpdateSuccess('Patient profile details updated successfully.');
    } catch (error) {
      setProfileUpdateError(error?.message || 'Unable to update patient profile details.');
    } finally {
      setSavingProfileUpdate(false);
    }
  };

  const localPatient = patientsData.find((pt) => {
    const candidateIds = [
      pt?.id,
      pt?.patientId,
      pt?.uuid,
      pt?.regNo,
      pt?._id,
    ].filter(Boolean).map((value) => String(value));
    return candidateIds.includes(String(patientId || ''));
  });
  const p = remotePatient || localPatient;
  const persistedPhotoUrl = p?.profileImage?.url || null;
  const persistedPreviewDataUrl = p?.profileImage?.previewDataUrl || null;
  const avatarSrc = photo || persistedPhotoUrl || persistedPreviewDataUrl || null;
  const showAvatarImage = Boolean(avatarSrc) && !avatarImageError;
  const avatarDisplaySrc = showAvatarImage ? avatarSrc : DEFAULT_PROFILE_PLACEHOLDER;
  const cachedPhotoMeta = getCachedPatientPhoto(effectivePatientId);
  const canRefreshStoredPhoto = Boolean(
    p?.profileImage?.mediaId
    || p?.profileImage?.objectKey
    || cachedPhotoMeta?.mediaId
    || cachedPhotoMeta?.objectKey
  );

  useEffect(() => {
    if (!showUpdateModal || !p) return;
    setProfileUpdateError('');
    setProfileUpdateSuccess('');
    setProfileUpdateForm(createPatientUpdateForm(p, effectivePatientId));
  }, [showUpdateModal, p, effectivePatientId]);

  useEffect(() => {
    if (!profileUpdateSuccess) {
      setShowProfileSaveAlert(false);
      return undefined;
    }

    setShowProfileSaveAlert(true);
    const timer = window.setTimeout(() => {
      setShowProfileSaveAlert(false);
      setProfileUpdateSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [profileUpdateSuccess]);

  useEffect(() => {
    if (!medicationSaveSuccess) {
      setShowMedicationSaveAlert(false);
      return undefined;
    }

    setShowMedicationSaveAlert(true);
    const timer = window.setTimeout(() => {
      setShowMedicationSaveAlert(false);
      setMedicationSaveSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [medicationSaveSuccess]);

  useEffect(() => {
    if (!vitalSaveSuccess) {
      setShowVitalSaveAlert(false);
      return undefined;
    }

    setShowVitalSaveAlert(true);
    const timer = window.setTimeout(() => {
      setShowVitalSaveAlert(false);
      setVitalSaveSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [vitalSaveSuccess]);

  useEffect(() => {
    if (!carePlanSaveSuccess) return undefined;

    const timer = window.setTimeout(() => {
      setCarePlanSaveSuccess('');
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [carePlanSaveSuccess]);

  useEffect(() => {
    if (showVitalForm && !editingVitalId) {
      setVitalSaveError('');
      setVitalForm((prev) => ({
        ...createVitalForm(currentUserName),
        recordedBy: vitalRecorderDisplayName(prev.recordedBy) || currentUserName || vitalRecorderDisplayName(p?.nurse) || '',
      }));
    }
  }, [showVitalForm, editingVitalId, currentUserName, p?.nurse]);

  useEffect(() => {
    if (!confirmDelete) {
      setMedicationDeleteError('');
      setDeletingMedication(false);
      setMedDeleteConfirmInput('');
    } else {
      setMedDeleteConfirmInput('');
      setMedicationDeleteError('');
    }
  }, [confirmDelete]);

  useEffect(() => {
    if (!confirmDeleteCarePlan) {
      setCarePlanDeleteError('');
    } else {
      setCarePlanDeleteError('');
    }
  }, [confirmDeleteCarePlan]);

  useEffect(() => {
    setAvatarImageError(false);
  }, [avatarSrc]);

  if (profileLoading && !p) {
    return (
      <div className="page-wrapper text-center py-5">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '4px solid #dbeafe',
            borderTopColor: '#45B6FE',
            margin: '0 auto 16px',
            animation: 'kh-spin 0.9s linear infinite',
          }}
        />
        <style>
          {`@keyframes kh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
        <h6 style={{ color: 'var(--kh-text-muted)' }}>Loading patient profile...</h6>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="page-wrapper text-center py-5">
        <FiUser size={48} style={{ color: 'var(--kh-border)', marginBottom: 16 }} />
        <h6 style={{ color: 'var(--kh-text-muted)' }}>{profileError || 'Patient record not found'}</h6>
        <button className="btn btn-kh-primary mt-3" onClick={() => navigate('/patients')}>Return to Registry</button>
      </div>
    );
  }

  /* flag calculations */
  const flags = [];
  if (p.pain.present) flags.push({ label: `Pain — ${p.pain.location}`, status: p.pain.score >= 2 ? 'alert' : 'warn', detail: `Score ${p.pain.score}/3` });
  if (p.diabetes.has) flags.push({ label: 'Diabetes', status: 'warn', detail: p.nutrition.dietType });
  if (p.skin.openWounds) flags.push({ label: 'Open Wounds', status: 'alert', detail: 'Active' });
  if (p.skin.pressureUlcer) flags.push({ label: 'Pressure Ulcer', status: 'alert', detail: 'Active' });
  if (p.psych.depression) flags.push({ label: 'Depression', status: 'warn', detail: 'Flagged' });
  if (p.psych.anxiety) flags.push({ label: 'Anxiety', status: 'warn', detail: 'Flagged' });
  if (p.communication.visual) flags.push({ label: 'Visual Impairment', status: 'warn', detail: 'Noted' });
  if (!p.mobility.independent) flags.push({ label: 'Mobility Assist Required', status: 'warn', detail: 'Not independent' });
  if (flags.length === 0) flags.push({ label: 'No active clinical flags', status: 'ok', detail: '' });

  const medicationList = String(p.medications || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const existingMedicationEntries = medicationList
    .map((entry, index) => {
      const parts = entry.split(' ');
      const drug = parts.slice(0, -2).join(' ') || entry;
      const dose = parts.length >= 3 ? parts[parts.length - 2] : '—';
      const freq = parts.length >= 3 ? parts[parts.length - 1] : '—';
      return { id: `existing-${index}`, drug, dosage: dose, frequency: freq, route: 'Oral', notes: '', source: 'existing', originalIndex: index };
    })
    .filter(item => !deletedExistingMeds.includes(item.originalIndex));
  const existingMedicationSignatures = new Set(existingMedicationEntries.map(buildMedicationSignature));
  const persistedMedicationEntries = addedMeds.filter(item => !existingMedicationSignatures.has(buildMedicationSignature(item)));
  const activeMedicationRecords = [...existingMedicationEntries, ...persistedMedicationEntries];
  const medicationReminderCount = activeMedicationRecords.filter(item => Array.isArray(item?.reminders?.times) && item.reminders.times.length > 0).length;
  const medicationOralCount = activeMedicationRecords.filter(item => String(item?.route || '').trim().toLowerCase() === 'oral').length;
  const medicationNewCount = persistedMedicationEntries.length;
  const latestVitalRecord = latestRecordedVital || vitalRecords[0] || null;
  const latestVitalSummary = latestVitalRecord
    ? `${latestVitalRecord.date} at ${latestVitalRecord.time}`
    : `Admitted ${p.enrolled}`;
  const latestDisplayedVitals = {
    bp: latestVitalRecord?.bp || p.vitals.bp,
    sugar: latestVitalRecord?.sugar || p.vitals.sugar,
    spo2: latestVitalRecord?.spo2 || p.vitals.spo2,
    pulse: latestVitalRecord?.pulse || p.vitals.pulse,
    temp: latestVitalRecord?.temp || p.vitals.temp,
    resp: latestVitalRecord?.resp || p.vitals.resp,
    weight: latestVitalRecord?.weight || p.vitals.weight,
    urinalysis: latestVitalRecord?.urinalysis || p.vitals.urinalysis,
  };
  const hasNextOfKinData = hasMeaningfulSectionData(p.sectionNextOfKin);
  const hasAdmissionChecklistData = hasMeaningfulSectionData(p.sectionAdmissionChecklist);
  const hasMedicalHistoryData = hasMeaningfulSectionData(p.sectionMedicalHistory) || Boolean(String(p.medicalHistory || '').trim());
  const hasCommunicationData = hasMeaningfulSectionData(p.sectionCommunicationStyle);
  const hasInfectionControlData = hasMeaningfulSectionData(p.sectionInfectionControl);
  const hasBreathPainData = hasMeaningfulSectionData(p.sectionBreathPain);
  const hasSleepNutritionData = hasMeaningfulSectionData(p.sectionSleepNutrition);
  const hasHygienePsychData = hasMeaningfulSectionData(p.sectionHygienePsychological);
  const hasSkinMobilityData = hasMeaningfulSectionData(p.sectionSkinMobility);
  const hasInitialVitalsData = hasMeaningfulSectionData(p.sectionInitialVitals);
  const patientStatusLabel = formatStatusLabel(p.status);
  const patientStatusClass = p.status === 'active' ? ' is-active' : ' is-pending';
  const patientProfileDetails = [
    { label: 'Patient ID', value: p.id || '—' },
    { label: 'Date of Birth', value: p.dob || '—' },
    { label: 'Phone', value: p.phone || '—' },
    { label: 'Address', value: p.address || '—' },
    { label: 'Primary Nurse', value: p.nurse || '—' },
    { label: 'Physician', value: p.doctor?.name || '—' },
  ];
  const patientHighlights = [
    `Emergency contact: ${p.emergency?.name || '—'}${p.emergency?.relationship ? ` (${p.emergency.relationship})` : ''}`,
    `Clinical focus: ${p.diagnosis || 'No diagnosis recorded'}`,
    `Latest vitals update: ${latestVitalSummary}`,
  ];
  const patientSnapshotItems = [
    { label: 'Registration No.', value: p.regNo || '—' },
    { label: 'Region', value: p.region || '—' },
    { label: 'Medication Count', value: activeMedicationRecords.length || 0 },
    { label: 'Clinical Flags', value: flags[0]?.label || 'None' },
  ];
  const patientOverviewRows = [
    {
      label: 'Primary Nurse',
      detail: p.nurse || 'No nurse assigned',
      meta: p.nursePin || 'PIN unavailable',
      status: p.nurse ? 'Assigned' : 'Pending',
    },
    {
      label: 'Physician',
      detail: p.doctor?.name || 'No physician on file',
      meta: p.doctor?.facility || 'Facility unavailable',
      status: p.doctor?.name ? 'On file' : 'Pending',
    },
    {
      label: 'Emergency Contact',
      detail: p.emergency?.name || 'No contact set',
      meta: p.emergency?.phone || p.emergency?.relationship || 'No contact details',
      status: hasNextOfKinData ? (p.emergency?.phone ? 'Reachable' : 'Recorded') : 'No data',
    },
    {
      label: 'Latest Vitals',
      detail: latestVitalRecord ? `${latestVitalRecord.bp} • SpO₂ ${latestVitalRecord.spo2}` : 'No recent vitals',
      meta: latestVitalSummary,
      status: latestVitalRecord ? 'Updated' : hasInitialVitalsData ? 'On file' : 'No data',
    },
  ];
  const patientNameParts = (() => {
    const full = String(p.name || '').trim();
    if (!full) return { first: '—', last: '—' };
    const parts = full.split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '—' };
    return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
  })();
  const sidebarAllergies = (() => {
    const rows = [];
    if (p.nutrition?.allergies) {
      rows.push({ label: 'Food allergy noted', severity: 'Medium', tone: 'med' });
    }
    const d = String(p.diagnosis || '');
    if (/allerg/i.test(d)) {
      const head = d.split(',')[0].trim().slice(0, 56);
      if (head) rows.push({ label: head, severity: 'High', tone: 'high' });
    }
    if (!rows.length) {
      rows.push({ label: 'No allergies recorded', severity: null, tone: 'none' });
    }
    return rows;
  })();
  const sidebarLanguage = String(p.region || p.cultural || 'English').split('—')[0].trim().slice(0, 24) || 'English';
  const sidebarHeightDisplay = String(p.sectionInitialVitals?.height || p.sectionInitialVitals?.Height || '').trim() || '—';
  const sidebarNotesPreview = (() => {
    const raw = String(filteredNotes[0]?.content || '')
      .replace(/<br\s*\/?>/gi, ', ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (raw) return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
    if (String(p.diagnosis || '').trim()) return String(p.diagnosis).trim();
    return 'No notes yet.';
  })();

  const handlePrimaryAction = () => {
    if (p.phone) {
      window.location.href = `tel:${String(p.phone).replace(/\s+/g, '')}`;
      return;
    }
    if (p.email) {
      window.location.href = `mailto:${p.email}`;
    }
  };

  const getProfileUpdateValue = (path) => {
    const keys = String(path || '').split('.').filter(Boolean);
    return keys.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), profileUpdateForm);
  };

  const handleProfileTabChange = (nextTab) => {
    const closeAll = () => {
      setShowVitalsMegaModal(false);
      setShowNotesMegaModal(false);
      setShowIncidentsMegaModal(false);
      setShowMedicationsMegaModal(false);
      setShowIncidentForm(false);
      setConfirmDeleteIncident(null);
      setIncidentDeleteModalError('');
      resetIncidentForm();
    };

    if (nextTab === 'vitals') { closeAll(); setShowVitalsMegaModal(true); return; }
    if (nextTab === 'notes') { closeAll(); setShowNotesMegaModal(true); return; }
    if (nextTab === 'incidents') { closeAll(); setShowIncidentsMegaModal(true); loadIncidents(); return; }
    if (nextTab === 'medications') { closeAll(); setShowMedicationsMegaModal(true); return; }

    closeAll();
    setTab(nextTab);
  };

  const renderBoolControl = (label, path) => (
    <div className="col-md-4">
      <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--kh-text-muted)' }}>{label}</label>
      <select
        className="form-select form-control-kh"
        value={getProfileUpdateValue(path) ? 'true' : 'false'}
        onChange={(event) => setProfileUpdateField(path, event.target.value === 'true')}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  );

  return (
    <motion.div className="page-wrapper nurse-profile-page patient-profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
      {showProfileSaveAlert && (
        <div className="patient-profile-save-alert" role="status" aria-live="polite">
          <div className="patient-profile-save-alert__icon">
            <FiCheckCircle size={18} />
          </div>
          <div className="patient-profile-save-alert__content">
            <strong>Changes saved</strong>
            <span>{profileUpdateSuccess}</span>
          </div>
          <button
            type="button"
            className="patient-profile-save-alert__close"
            onClick={() => {
              setShowProfileSaveAlert(false);
              setProfileUpdateSuccess('');
            }}
            aria-label="Dismiss save alert"
          >
            <FiX size={16} />
          </button>
        </div>
      )}
      {showMedicationSaveAlert && (
        <div className="patient-profile-save-alert" role="status" aria-live="polite" style={{ top: showProfileSaveAlert ? 92 : 24 }}>
          <div className="patient-profile-save-alert__icon">
            <FiCheckCircle size={18} />
          </div>
          <div className="patient-profile-save-alert__content">
            <strong>Medication added</strong>
            <span>{medicationSaveSuccess}</span>
          </div>
          <button
            type="button"
            className="patient-profile-save-alert__close"
            onClick={() => {
              setShowMedicationSaveAlert(false);
              setMedicationSaveSuccess('');
            }}
            aria-label="Dismiss medication save alert"
          >
            <FiX size={16} />
          </button>
        </div>
      )}
      {showVitalSaveAlert && (
        <div className="patient-profile-save-alert" role="status" aria-live="polite" style={{ top: `${24 + (showProfileSaveAlert ? 68 : 0) + (showMedicationSaveAlert ? 68 : 0)}px` }}>
          <div className="patient-profile-save-alert__icon">
            <FiCheckCircle size={18} />
          </div>
          <div className="patient-profile-save-alert__content">
            <strong>Vital recorded</strong>
            <span>{vitalSaveSuccess}</span>
          </div>
          <button
            type="button"
            className="patient-profile-save-alert__close"
            onClick={() => {
              setShowVitalSaveAlert(false);
              setVitalSaveSuccess('');
            }}
            aria-label="Dismiss vital save alert"
          >
            <FiX size={16} />
          </button>
        </div>
      )}
      {carePlanSaveSuccess && (
        <div
          className="patient-profile-save-alert"
          role="status"
          aria-live="polite"
          style={{
            top: `${24
              + (showProfileSaveAlert ? 68 : 0)
              + (showMedicationSaveAlert ? 68 : 0)
              + (showVitalSaveAlert ? 68 : 0)}px`,
          }}
        >
          <div className="patient-profile-save-alert__icon">
            <FiCheckCircle size={18} />
          </div>
          <div className="patient-profile-save-alert__content">
            <strong>Care plan item added</strong>
            <span>{carePlanSaveSuccess}</span>
          </div>
          <button
            type="button"
            className="patient-profile-save-alert__close"
            onClick={() => setCarePlanSaveSuccess('')}
            aria-label="Dismiss care plan save alert"
          >
            <FiX size={16} />
          </button>
        </div>
      )}
      <div className="nurse-profile-shell">
        <input type="file" accept="image/*" ref={fileRef} onChange={handlePhoto} style={{ display: 'none' }} />
        <div className="nurse-profile-topbar pp-pharm-topbar">
          <div className="nurse-profile-topbar__left pp-pharm-topbar__left">
            <button type="button" className="pp-pharm-back" onClick={() => navigate('/patients')}>
              <FiArrowLeft size={16} />
              Patients
            </button>
          </div>
          <div className="pp-pharm-topbar__actions">
            <button type="button" className="pp-pharm-btn-yellow" onClick={() => setShowGenerateReportModal(true)}>
              Generate Report
            </button>
            <button
              type="button"
              className="pp-pharm-btn-yellow"
              onClick={() => setShowUpdateModal(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="pp-pharm-btn-yellow pp-pharm-btn-yellow--icon"
              title="More options"
              onClick={() => setShowUpdateModal(true)}
            >
              <FiMoreHorizontal size={18} />
            </button>
            <button type="button" className="pp-pharm-icon-quiet" title="Refresh" onClick={loadPatientProfile}>
              <FiRefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="pp-pharm-desk">
          <aside className="pp-pharm-sidebar" aria-label="Patient summary">
            <div className="pp-pharm-side-card pp-pharm-side-card--profile">
              <div className="pp-pharm-side-profile">
                <div
                  className="pp-pharm-side-profile__photo"
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
                  role="button"
                  tabIndex={0}
                  title="Upload patient photo"
                >
                  <img
                    src={avatarDisplaySrc}
                    alt={showAvatarImage ? p.name : 'Patient'}
                    loading="lazy"
                    onError={() => { if (showAvatarImage) setAvatarImageError(true); }}
                  />
                </div>
                <div className="pp-pharm-side-profile__body">
                  <h2 className="pp-pharm-side-profile__name">{p.name}</h2>
                  <div className={`pp-pharm-side-profile__status${patientStatusClass}`}>{patientStatusLabel}</div>
                  <dl className="pp-pharm-side-profile__facts">
                    <div><dt>Gender</dt><dd>{p.gender || '—'}</dd></div>
                    <div><dt>Age</dt><dd>{p.age != null && p.age !== '' ? p.age : '—'}</dd></div>
                    <div><dt>Language</dt><dd>{sidebarLanguage}</dd></div>
                    <div><dt>Height</dt><dd>{sidebarHeightDisplay}</dd></div>
                  </dl>
                  {(photoUploading || photoUploadSuccess || photoUploadError) && (
                    <div className={`pp-pharm-side-profile__photo-msg${photoUploadError ? ' is-error' : ''}${photoUploadSuccess ? ' is-success' : ''}`}>
                      {photoUploading ? 'Uploading photo…' : (photoUploadSuccess || photoUploadError)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pp-pharm-side-card">
              <div className="pp-pharm-side-card__title">Allergies</div>
              <ul className="pp-pharm-allergy-list">
                {sidebarAllergies.map((row) => (
                  <li key={`${row.label}-${row.tone}`}>
                    <span className="pp-pharm-allergy-list__name">{row.label}</span>
                    {row.severity && (
                      <span className={`pp-pharm-allergy-list__sev pp-pharm-allergy-list__sev--${row.tone}`}>{row.severity}</span>
                    )}
                  </li>
                ))}
              </ul>
              <button type="button" className="pp-pharm-side-muted-link" onClick={() => setTab('clinical')}>
                + Add allergy
              </button>
            </div>

            <div className="pp-pharm-side-card">
              <div className="pp-pharm-side-card__title">Notes</div>
              <p className="pp-pharm-side-notes">{sidebarNotesPreview}</p>
              <button type="button" className="pp-pharm-side-muted-link" onClick={() => handleProfileTabChange('notes')}>
                Open Nurse Note
              </button>
            </div>

            <div className="pp-pharm-side-quick">
              <button type="button" className="pp-pharm-side-quick__btn" onClick={() => handleProfileTabChange('vitals')}>
                <FiActivity size={14} /> Vitals
              </button>
              <button type="button" className="pp-pharm-side-quick__btn" onClick={() => handleProfileTabChange('medications')}>
                <FiFileText size={14} /> Medications
              </button>
              <button type="button" className="pp-pharm-side-quick__btn" onClick={handlePrimaryAction}>
                <FiPhone size={14} /> Call
              </button>
            </div>
          </aside>

          <main className="pp-pharm-main">
        <div className="kh-card nurse-profile-board pp-pharm-board">
          <div className="nurse-profile-tabs pp-pharm-tabs">
            {TABS.map((item) => (
              <button key={item.key} type="button" onClick={() => handleProfileTabChange(item.key)} className={`nurse-profile-tab${tab === item.key || (item.key === 'vitals' && showVitalsMegaModal) || (item.key === 'notes' && showNotesMegaModal) || (item.key === 'incidents' && showIncidentsMegaModal) || (item.key === 'medications' && showMedicationsMegaModal) ? ' active' : ''}`}>
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className="nurse-profile-tab pp-pharm-tab-plus"
              title="Edit profile"
              onClick={() => setShowUpdateModal(true)}
            >
              <FiPlus size={14} />
            </button>
          </div>

          <div className="nurse-profile-board__content">

      {/* ═══ CHART SUMMARY ═══ */}
      {tab === 'chart' && (
        <>
          <div className="pp-pharm-general-stack">
            <div className="pp-pharm-panel">
              <div className="pp-pharm-panel__section-title">Personal details</div>
              <div className="pp-pharm-personal-grid">
                <div><span className="pp-pharm-field-label">Last name</span><span className="pp-pharm-field-value">{patientNameParts.last}</span></div>
                <div><span className="pp-pharm-field-label">First name</span><span className="pp-pharm-field-value">{patientNameParts.first}</span></div>
                <div><span className="pp-pharm-field-label">Salutation</span><span className="pp-pharm-field-value">—</span></div>
                <div><span className="pp-pharm-field-label">Birthdate</span><span className="pp-pharm-field-value">{p.dob || '—'}</span></div>
                <div className="pp-pharm-personal-grid__wide"><span className="pp-pharm-field-label">Address</span><span className="pp-pharm-field-value">{p.address || '—'}</span></div>
                <div><span className="pp-pharm-field-label">Phone</span><span className="pp-pharm-field-value">{p.phone || '—'}</span></div>
                <div><span className="pp-pharm-field-label">Email</span><span className="pp-pharm-field-value">{p.email || '—'}</span></div>
              </div>

              <div className="pp-pharm-panel__section-title pp-pharm-panel__section-title--mt">Care routing</div>
              <div className="pp-pharm-faux-selects">
                <div><span className="pp-pharm-faux-label">Delivery type</span><div className="pp-pharm-faux-select">Home visit (default)</div></div>
                <div><span className="pp-pharm-faux-label">Care route</span><div className="pp-pharm-faux-select">{p.region || p.gps || '—'}</div></div>
                <div><span className="pp-pharm-faux-label">Risk level</span><div className="pp-pharm-faux-select">{flags[0]?.label || 'Standard'}</div></div>
                <div><span className="pp-pharm-faux-label">Service line 1</span><div className="pp-pharm-faux-select">{p.nurse ? 'Assigned RN' : 'Unassigned'}</div></div>
                <div><span className="pp-pharm-faux-label">Service line 2</span><div className="pp-pharm-faux-select">{String(p.diagnosis || 'General care').slice(0, 42)}{String(p.diagnosis || '').length > 42 ? '…' : ''}</div></div>
              </div>
              <div className="pp-pharm-inline-meta">
                <span className="pp-pharm-inline-meta__label">Handbook</span>
                <span className="pp-pharm-inline-meta__value">{p.handbookGiven ? 'On file' : 'Not recorded'}</span>
              </div>
              <div className="pp-pharm-check-row">
                <label className="pp-pharm-check"><input type="checkbox" readOnly checked={Boolean(p.handbookGiven)} /> Cultural preferences documented</label>
                <label className="pp-pharm-check"><input type="checkbox" readOnly checked={hasNextOfKinData} /> Emergency contacts verified</label>
                <label className="pp-pharm-check"><input type="checkbox" readOnly checked={Boolean(p.doctor?.name)} /> Physician on file</label>
              </div>
            </div>

            <div className="pp-pharm-panel pp-pharm-panel--table">
              <div className="pp-pharm-used-head">
                <h3 className="pp-pharm-used-title">Used drugs</h3>
                <button type="button" className="pp-pharm-used-add" onClick={() => handleProfileTabChange('medications')}>
                  <FiPlus size={14} /> Add drug
                </button>
              </div>
              <div className="pp-pharm-table-wrap">
                <table className="pp-pharm-used-table">
                  <thead>
                    <tr>
                      <th>Brand name</th>
                      <th>Generic name</th>
                      <th>Strength</th>
                      <th>Pack</th>
                      <th>Form</th>
                      <th>Care team notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMedicationRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="pp-pharm-used-table__empty">No medications on file — add from Medications.</td>
                      </tr>
                    ) : activeMedicationRecords.map((med, idx) => (
                      <tr key={`${med.drug}-${idx}`}>
                        <td><strong>{med.drug || '—'}</strong></td>
                        <td>—</td>
                        <td>{med.dosage && med.dosage !== '—' ? med.dosage : '—'}</td>
                        <td>—</td>
                        <td>{med.route || '—'}</td>
                        <td className="pp-pharm-used-table__notes">{med.frequency && med.frequency !== '—' ? med.frequency : (med.notes || '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="nurse-profile-overview-grid" style={{ marginBottom: 18 }}>
            <div className="nurse-profile-card nurse-profile-card--timeline">
              <div className="nurse-profile-card-heading nurse-profile-card-heading--with-action">
                <span>Care Summary</span>
                <button type="button" className="nurse-profile-inline-btn" onClick={() => setTab('clinical')}>Clinical details</button>
              </div>
              <div className="nurse-profile-timeline-table">
                <div className="nurse-profile-timeline-head">
                  <span>Category</span>
                  <span>Detail</span>
                  <span>Context</span>
                  <span>Status</span>
                </div>
                {patientOverviewRows.map((row) => (
                  <div key={row.label} className="nurse-profile-timeline-row" style={{ cursor: 'default' }}>
                    <span>
                      <strong>{row.label}</strong>
                      <small>{row.meta}</small>
                    </span>
                    <span>{row.detail}</span>
                    <span>{row.meta}</span>
                    <span>
                      <em className={row.status === 'Assigned' || row.status === 'Updated' || row.status === 'Reachable' ? 'is-active' : ''}>{row.status}</em>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="nurse-profile-card nurse-profile-card--snapshot">
              <div className="nurse-profile-card-heading">Profile Snapshot</div>
              <div className="nurse-profile-snapshot-list">
                {patientSnapshotItems.map((item) => (
                  <div key={item.label} className="nurse-profile-snapshot-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row g-3">
          {/* Left column */}
          <div className="col-lg-4">
            <Panel title="Next of kin Info" variant="summary">
              {hasNextOfKinData ? (
                <>
                  <DataRow label="Full Name">{p.emergency.name}</DataRow>
                  <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
                  <DataRow label="Contact One">{p.sectionNextOfKin?.contactOne}</DataRow>
                  <DataRow label="Contact Two">{p.sectionNextOfKin?.contactTwo}</DataRow>
                  <DataRow label="Personal Doctor">{p.doctor.name}</DataRow>
                  <DataRow label="Doctor Facility">{p.doctor.facility}</DataRow>
                  <DataRow label="Doctor Contact">{p.doctor.phone}</DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Emergency Contact" variant="summary">
              {hasNextOfKinData ? (
                <>
                  <DataRow label="Name">{p.emergency.name}</DataRow>
                  <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
                  <DataRow label="Phone">{p.emergency.phone}</DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Cultural / Religious" variant="summary">
              {String(p.cultural || '').trim()
                ? <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.6 }}>{p.cultural}</div>
                : <NoDataState />}
            </Panel>
          </div>

          {/* Center column */}
          <div className="col-lg-4">
            <Panel title="Primary Diagnosis" variant="summary">
              {String(p.diagnosis || '').trim() || hasMedicalHistoryData ? (
                <>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 8 }}>{p.diagnosis || 'No diagnosis recorded'}</div>
                  <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600 }}>History:</span> {p.medicalHistory || 'No medical history recorded'}
                  </div>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Clinical Flags">
              {flags.map((f, i) => <FlagItem key={i} label={f.label} detail={f.detail} />)}
            </Panel>

            <Panel title="Admission Record" variant="summary">
              <DataRow label="Reg No.">{p.regNo}</DataRow>
              <DataRow label="Date of Assessment">{p.dateOfAssessment}</DataRow>
              <DataRow label="Date Admitted">{p.enrolled}</DataRow>
              <DataRow label="Handbook Given"><YN val={p.handbookGiven} /></DataRow>
              <DataRow label="Primary Nurse">{p.nurse} ({p.nursePin})</DataRow>
              <DataRow label="Physician">{p.doctor.name}</DataRow>
              <DataRow label="Facility">{p.doctor.facility}</DataRow>
              {!hasAdmissionChecklistData && <NoDataState text="Admission checklist data is not available from the endpoint yet." />}
            </Panel>
          </div>

          {/* Right column — Quick vitals */}
          <div className="col-lg-4">
            <Panel title="Latest Vitals"
              variant="summary"
              action={(
                <span style={{ fontSize: 10.5, color: 'var(--kh-text-muted)' }}>
                  {latestRecordedVital
                    ? `Recorded ${latestRecordedVital.date}${latestRecordedVital.time ? ` at ${latestRecordedVital.time}` : ''}`
                    : hasInitialVitalsData ? 'On admission' : 'No reading'}
                </span>
              )}
            >
              {latestVitalLoading && !latestRecordedVital ? (
                <div style={{ padding: '12px 4px', fontSize: 12.5, color: 'var(--kh-text-muted)' }}>
                  Loading latest vitals…
                </div>
              ) : (latestRecordedVital || hasInitialVitalsData) ? (
                <div className="row g-2">
                  <div className="col-6"><VitalTile label="Blood Pressure" value={latestDisplayedVitals.bp} flag={parseInt(latestDisplayedVitals.bp, 10) >= 140} /></div>
                  <div className="col-6"><VitalTile label="Blood Sugar" value={latestDisplayedVitals.sugar} flag={parseFloat(latestDisplayedVitals.sugar) > 7} showFlagBorder={false} /></div>
                  <div className="col-6"><VitalTile label="SPO2" value={latestDisplayedVitals.spo2} /></div>
                  <div className="col-6"><VitalTile label="Pulse" value={latestDisplayedVitals.pulse ? `${latestDisplayedVitals.pulse} bpm` : ''} /></div>
                  <div className="col-6"><VitalTile label="Temperature" value={latestDisplayedVitals.temp} /></div>
                  <div className="col-6"><VitalTile label="Weight" value={latestDisplayedVitals.weight} /></div>
                </div>
              ) : <NoDataState text="No vitals data is available for this patient yet." />}
            </Panel>

            <Panel title="Current Medications" variant="summary">
              {activeMedicationRecords.length > 0 ? activeMedicationRecords.map((med, i) => (
                <div key={i} className="d-flex align-items-center" style={{
                  padding: '7px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 12.5,
                }}>
                  <span style={{ color: 'var(--kh-text)', fontWeight: 500 }}>{med.drug}{med.dosage && med.dosage !== '—' ? ` ${med.dosage}` : ''}{med.frequency && med.frequency !== '—' ? ` ${med.frequency}` : ''}</span>
                </div>
              )) : <NoDataState text="No current medications are available from the endpoint." />}
            </Panel>
          </div>
          </div>
        </>
      )}

      {/* ═══ CLINICAL ASSESSMENT ═══ */}
      {tab === 'clinical' && (
        <div className="row g-3">
          <div className="col-lg-6">
            <Panel title="Communication" icon={<FiUser size={14} />}>
              {hasCommunicationData ? (
                <>
                  <DataRow label="Communication Needs"><YN val={p.communication.needs} /></DataRow>
                  <DataRow label="Hearing Impairment"><YN val={p.communication.hearing} /></DataRow>
                  <DataRow label="Speech Impairment"><YN val={p.communication.speech} /></DataRow>
                  <DataRow label="Visual Impairment"><YN val={p.communication.visual} /></DataRow>
                  <DataRow label="Understanding Issues"><YN val={p.communication.understanding} /></DataRow>
                  <DataRow label="Notes">{p.sectionCommunicationStyle?.communicationNotes}</DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Infection Control" icon={<FiShield size={14} />}>
              {hasInfectionControlData ? (
                <>
                  <DataRow label="Risk Assessment Plan"><YN val={p.infection.riskPlan} /></DataRow>
                  <DataRow label="Diarrhea on Admission"><YN val={p.infection.diarrhea} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Diabetes Management" icon={<FiActivity size={14} />} accent={p.diabetes.has ? '#d97706' : undefined}>
              {hasInfectionControlData ? (
                <>
                  <DataRow label="Diabetes Present"><YN val={p.diabetes.has} /></DataRow>
                  <DataRow label="Care Plan Active"><YN val={p.diabetes.carePlan} /></DataRow>
                  <DataRow label="Patient Bed Bound"><YN val={p.diabetes.stockings} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Breathing" icon={<FiActivity size={14} />}>
              {hasBreathPainData ? (
                <>
                  <DataRow label="Breathing Difficulties"><YN val={p.breathing.difficulties} /></DataRow>
                  <DataRow label="Home O₂ / CPAP"><YN val={p.breathing.oxygen} /></DataRow>
                  <DataRow label="Current Smoker"><YN val={p.breathing.smoker} /></DataRow>
                  <DataRow label="Smoking History"><YN val={p.breathing.everSmoked} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>
          </div>
          <div className="col-lg-6">
            <Panel title="Pain Assessment" icon={<FiAlertTriangle size={14} />} accent={p.pain.present ? painColors[p.pain.score] : undefined}>
              {hasBreathPainData ? (
                <>
                  <DataRow label="Pain Present"><YN val={p.pain.present} /></DataRow>
                  <DataRow label="Pain Score">
                    {p.pain.score === null || p.pain.score === undefined ? (
                      <span style={{ color: 'var(--kh-text-muted)', fontWeight: 500 }}>No data</span>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[0,1,2,3].map(s => (
                            <div key={s} style={{
                              width: 24, height: 8, borderRadius: 1,
                              background: s <= p.pain.score ? painColors[p.pain.score] : '#e5e7eb',
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: painColors[p.pain.score] }}>{p.pain.score}/3 {painLabels[p.pain.score]}</span>
                      </div>
                    )}
                  </DataRow>
                  <DataRow label="Location">{p.pain.location}</DataRow>
                  <DataRow label="Analgesia">{p.pain.analgesia}</DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Psychological" icon={<FiShield size={14} />} accent={p.psych.concerns || p.psych.depression || p.psych.anxiety ? '#d97706' : undefined}>
              {hasHygienePsychData ? (
                <>
                  <DataRow label="Concerns Flagged"><YN val={p.psych.concerns} /></DataRow>
                  <DataRow label="Depression"><YN val={p.psych.depression} /></DataRow>
                  <DataRow label="Anxiety"><YN val={p.psych.anxiety} /></DataRow>
                  <DataRow label="Dementia / Delirium"><YN val={p.psych.dementia} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Skin Integrity" icon={<FiAlertTriangle size={14} />} accent={p.skin.openWounds || p.skin.pressureUlcer ? '#ef4444' : undefined}>
              {hasSkinMobilityData ? (
                <>
                  <DataRow label="Open Wounds"><YN val={p.skin.openWounds} /></DataRow>
                  <DataRow label="Pressure Ulcer"><YN val={p.skin.pressureUlcer} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>

            <Panel title="Mobility" icon={<FiUser size={14} />}>
              {hasSkinMobilityData ? (
                <>
                  <DataRow label="Independently Mobile"><YN val={p.mobility.independent} /></DataRow>
                  <DataRow label="Move in Bed"><YN val={p.mobility.bedMove} /></DataRow>
                  <DataRow label="Bed to Chair"><YN val={p.mobility.bedToChair} /></DataRow>
                  <DataRow label="Transfer to Toilet"><YN val={p.mobility.toilet} /></DataRow>
                </>
              ) : <NoDataState />}
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ VITALS ═══ */}
      {showVitalsMegaModal && (
        <div
          className="patient-vitals-mega-modal"
          onClick={() => { if (!showVitalForm) setShowVitalsMegaModal(false); }}
        >
          <div
            className="patient-vitals-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Patient vitals records"
          >
            <div className="patient-vitals-mega-modal__header">
              <div className="patient-vitals-mega-modal__header-copy">
                <span className="patient-vitals-mega-modal__eyebrow">Patient vitals</span>
                <div className="patient-vitals-mega-modal__title-row">
                  <span className="patient-vitals-mega-modal__title-icon"><FiActivity size={20} /></span>
                  <div>
                    <h3>Vitals Records</h3>
                    <p>{vitalRecords.length > 0 ? `Last updated on ${vitalRecords[0].date} at ${vitalRecords[0].time}.` : `Admission baseline captured on ${p.enrolled}.`} Review trends and add new readings from one place.</p>
                  </div>
                </div>
              </div>
              <div className="patient-vitals-mega-modal__actions">
                <button type="button" className="patient-vitals-mega-modal__add-btn" onClick={() => { setEditingVitalId(null); setShowVitalForm(true); }}>
                  <FiPlus size={14} /> Add Vital Record
                </button>
                <button type="button" className="patient-vitals-mega-modal__close" onClick={() => setShowVitalsMegaModal(false)}>
                  <FiX size={14} />
                </button>
              </div>
            </div>

            <div className="patient-vitals-mega-modal__body">

          {/* ── Add / Edit Vital Record Modal ── */}
          {showVitalForm && (
            <div
              className="patient-vital-modal"
              onClick={closeVitalForm}
            >
              <div
                className="patient-vital-modal__panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={editingVitalId ? 'Edit vital record' : 'Add vital record'}
              >
                <div className="patient-vital-modal__header">
                  <div className="patient-vital-modal__header-copy">
                    <span className="patient-vital-modal__eyebrow">{editingVitalId ? 'Update reading' : 'Vitals capture'}</span>
                    <div className="patient-vital-modal__title-row">
                      <span className="patient-vital-modal__title-icon">
                        <FiActivity size={20} />
                      </span>
                      <div>
                        <h3>{editingVitalId ? 'Update Vital Record' : 'Record New Vitals'}</h3>
                        <p>
                          {editingVitalId
                            ? `Adjust the measurements or notes for this reading recorded for ${p.name}. Changes sync to the patient timeline immediately.`
                            : `Capture the latest measurements and observations for ${p.name}. Saved records sync to the patient timeline immediately.`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeVitalForm}
                    disabled={savingVital}
                    type="button"
                    className="patient-vital-modal__close"
                  >
                    <FiX size={14} />
                  </button>
                </div>
                <div className="patient-vital-modal__body">
                  <div className="patient-vital-modal__layout">
                    <div className="patient-vital-modal__main">
                      <div className="patient-vital-modal__section">
                        <div className="patient-vital-modal__section-header">
                          <div>
                            <div className="patient-vital-modal__section-title">Recording details</div>
                            <div className="patient-vital-modal__section-copy">Add when the reading was taken and who recorded it.</div>
                          </div>
                          <span className="patient-vital-modal__pill">Required context</span>
                        </div>
                        <div className="patient-vital-modal__grid patient-vital-modal__grid--meta">
                          <div className="patient-vital-modal__field">
                            <label className="patient-vital-modal__label">Date *</label>
                            <input
                              className="patient-vital-modal__input"
                              type="date"
                              value={vitalForm.date}
                              onChange={e => setVitalForm(f => ({ ...f, date: e.target.value }))}
                            />
                          </div>
                          <div className="patient-vital-modal__field">
                            <label className="patient-vital-modal__label">Time *</label>
                            <input
                              className="patient-vital-modal__input"
                              type="time"
                              value={vitalForm.time}
                              onChange={e => setVitalForm(f => ({ ...f, time: e.target.value }))}
                            />
                          </div>
                          <div className="patient-vital-modal__field patient-vital-modal__field--wide">
                            <label className="patient-vital-modal__label">Recorded By</label>
                            <input
                              className="patient-vital-modal__input"
                              type="text"
                              value={vitalForm.recordedBy}
                              onChange={e => setVitalForm(f => ({ ...f, recordedBy: e.target.value }))}
                              placeholder="Nurse or staff name"
                              autoComplete="name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="patient-vital-modal__section">
                        <div className="patient-vital-modal__section-header">
                          <div>
                            <div className="patient-vital-modal__section-title">Vital measurements</div>
                            <div className="patient-vital-modal__section-copy">Enter the latest readings captured for this patient.</div>
                          </div>
                        </div>
                        <div className="patient-vital-modal__grid">
                          {[
                            { key: 'bp', label: 'Blood Pressure', placeholder: 'e.g. 130/85' },
                            { key: 'sugar', label: 'Blood Sugar', placeholder: 'e.g. 6.5 mmol/L' },
                            { key: 'spo2', label: 'SPO₂', placeholder: 'e.g. 97%' },
                            { key: 'pulse', label: 'Pulse', placeholder: 'e.g. 78 bpm' },
                            { key: 'temp', label: 'Temperature', placeholder: 'e.g. 36.6°C' },
                            { key: 'resp', label: 'Respiration', placeholder: 'e.g. 18' },
                            { key: 'weight', label: 'Weight', placeholder: 'e.g. 82 kg' },
                            { key: 'urinalysis', label: 'Urinalysis', placeholder: 'e.g. Normal' },
                          ].map((field) => (
                            <div key={field.key} className="patient-vital-modal__field">
                              <label className="patient-vital-modal__label">{field.label}</label>
                              <input
                                className="patient-vital-modal__input"
                                value={vitalForm[field.key]}
                                onChange={e => setVitalForm(f => ({ ...f, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="patient-vital-modal__section">
                        <div className="patient-vital-modal__section-header patient-vital-modal__section-header--compact">
                          <div>
                            <div className="patient-vital-modal__section-title">Clinical notes</div>
                            <div className="patient-vital-modal__section-copy">Optional observations to support the measurements recorded.</div>
                          </div>
                        </div>
                        <div className="patient-vital-modal__field">
                          <label className="patient-vital-modal__label">Notes</label>
                          <textarea
                            className="patient-vital-modal__textarea"
                            value={vitalForm.notes}
                            onChange={e => setVitalForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="Add any relevant patient observation or escalation note..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>

                    <aside className="patient-vital-modal__aside">
                      <div className="patient-vital-modal__summary-card">
                        <div className="patient-vital-modal__summary-title">Summary</div>
                        <div className="patient-vital-modal__summary-copy">Review the key details before saving this record.</div>
                        <div className="patient-vital-modal__summary-list">
                          <div>
                            <span>Patient</span>
                            <strong>{p.name}</strong>
                          </div>
                          <div>
                            <span>Recorded On</span>
                            <strong>{vitalForm.date || 'Select date'} {vitalForm.time ? `at ${vitalForm.time}` : ''}</strong>
                          </div>
                          <div>
                            <span>Captured By</span>
                            <strong>{vitalForm.recordedBy || 'Not provided yet'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="patient-vital-modal__summary-card patient-vital-modal__summary-card--soft">
                        <div className="patient-vital-modal__summary-title">Tips</div>
                        <div className="patient-vital-modal__tip-list">
                          <div>Use the `systolic/diastolic` format for blood pressure.</div>
                          <div>Include units where helpful for blood sugar, temperature, and weight.</div>
                          <div>Add notes when readings are unusual or need follow-up.</div>
                        </div>
                      </div>
                    </aside>
                  </div>

                  <div className="patient-vital-modal__footer">
                    <button
                      onClick={closeVitalForm}
                      disabled={savingVital}
                      type="button"
                      className="patient-vital-modal__btn patient-vital-modal__btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddVital}
                      disabled={savingVital}
                      type="button"
                      className="patient-vital-modal__btn patient-vital-modal__btn--primary"
                    >
                      {savingVital
                        ? (editingVitalId ? 'Updating...' : 'Saving...')
                        : (editingVitalId ? 'Update Vital Record' : 'Save Vital Record')}
                    </button>
                  </div>
                  {!!vitalSaveError && <div className="patient-vital-modal__error">{vitalSaveError}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── Vitals History Table ── */}
            <div className="patient-vitals-mega-modal__table-card">
              <div style={{
                padding: '12px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                borderLeft: '3px solid #2E7DB8',
              }}>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ color: '#2E7DB8', display: 'flex' }}><FiClock size={14} /></span>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text)' }}>Vitals History</span>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--kh-text-muted)' }}>{vitalRecords.length + 1} records</span>
              </div>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F7FE' }}>
                      {['Date & Time', 'BP', 'Sugar', 'SPO₂', 'Pulse', 'Temp', 'Resp', 'Weight', 'Recorded By', 'Actions'].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: '#45B6FE', borderBottom: '2px solid #45B6FE',
                          textAlign: 'left', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Added vital records */}
                    {vitalRecords.map((r, idx) => (
                      <Fragment key={r.id}>
                        <tr
                          style={{ background: idx % 2 === 0 ? 'transparent' : '#fafbfc', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => setExpandedVital(expandedVital === r.id ? null : r.id)}
                          onMouseEnter={e => e.currentTarget.style.background = '#F0F7FE'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : '#fafbfc'}
                        >
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{r.date}</div>
                            <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginBottom: 4 }}>{r.time}</div>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditVital(r); }}
                              title="Edit this vital record"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#2E7DB8', border: '1px solid #2E7DB8',
                                color: '#fff', cursor: 'pointer',
                                padding: '4px 9px', borderRadius: 4,
                                fontSize: 11, fontWeight: 700, lineHeight: 1, letterSpacing: '0.3px',
                              }}
                            >
                              <FiEdit2 size={11} /> Edit
                            </button>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.bp ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('bp', r.bp) ? '#ef4444' : 'var(--kh-text)' }}>{r.bp}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.sugar ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('sugar', r.sugar) ? '#d97706' : 'var(--kh-text)' }}>{r.sugar}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.spo2 ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('spo2', r.spo2) ? '#ef4444' : 'var(--kh-text)' }}>{r.spo2}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.pulse ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('pulse', r.pulse) ? '#8b5cf6' : 'var(--kh-text)' }}>{r.pulse}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.temp ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('temp', r.temp) ? '#ef4444' : 'var(--kh-text)' }}>{r.temp}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.resp ? <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{r.resp}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.weight ? <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{r.weight}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{vitalRecorderDisplayName(r.recordedBy) || '—'}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--kh-text-muted)' }}>{vitalRecorderDisplayName(p?.nurse) || 'No nurse assigned'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ display: 'flex', color: '#45B6FE', cursor: 'pointer' }} title="Expand">
                                {expandedVital === r.id ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); startEditVital(r); }}
                                title="Edit this vital record"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: '#EAF4FE', border: '1px solid #BBDDFB',
                                  color: '#1F5A8B', cursor: 'pointer',
                                  padding: '4px 10px', borderRadius: 4,
                                  fontSize: 11.5, fontWeight: 700, lineHeight: 1,
                                }}
                              >
                                <FiEdit2 size={12} /> Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteVitalRecord(r.id); }}
                                title="Delete this vital record"
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: '#dc2626', display: 'flex', padding: 2,
                                }}
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded detail row */}
                        {expandedVital === r.id && (
                          <tr>
                            <td colSpan={10} style={{ padding: 0, background: '#f9fafb' }}>
                              <div style={{ padding: '12px 18px', borderBottom: '2px solid #e5e7eb' }}>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                  {[
                                    r.bp && { label: 'Blood Pressure', value: r.bp, flagged: isVitalFlagged('bp', r.bp), color: '#45B6FE' },
                                    r.sugar && { label: 'Blood Sugar', value: r.sugar, flagged: isVitalFlagged('sugar', r.sugar), color: '#45B6FE' },
                                    r.spo2 && { label: 'SPO₂', value: r.spo2, flagged: isVitalFlagged('spo2', r.spo2), color: '#2E7DB8' },
                                    r.pulse && { label: 'Pulse', value: r.pulse, flagged: isVitalFlagged('pulse', r.pulse), color: '#45B6FE' },
                                    r.temp && { label: 'Temperature', value: r.temp, flagged: isVitalFlagged('temp', r.temp), color: '#2E7DB8' },
                                    r.resp && { label: 'Respiration', value: r.resp, flagged: false, color: '#45B6FE' },
                                    r.weight && { label: 'Weight', value: r.weight, flagged: false, color: '#2E7DB8' },
                                    r.urinalysis && { label: 'Urinalysis', value: r.urinalysis, flagged: isVitalFlagged('urinalysis', r.urinalysis), color: '#2E7DB8' },
                                  ].filter(Boolean).map((v, vi) => (
                                    <div key={vi} style={{
                                      padding: '8px 14px', borderRadius: 2, minWidth: 100,
                                      background: v.flagged ? '#fef2f2' : '#fff',
                                      border: `1px solid ${v.flagged ? '#fecaca' : '#e5e7eb'}`,
                                      borderLeft: `3px solid ${v.flagged ? '#ef4444' : v.color}`,
                                    }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--kh-text-muted)', marginBottom: 2 }}>{v.label}</div>
                                      <div style={{ fontSize: 15, fontWeight: 800, color: v.flagged ? '#ef4444' : 'var(--kh-text)' }}>{v.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {r.notes && (
                                  <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 4 }}>
                                    <span style={{ fontWeight: 700 }}>Notes:</span> {r.notes}
                                  </div>
                                )}
                                <div className="d-flex justify-content-end mt-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); startEditVital(r); }}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      background: '#2E7DB8', border: '1px solid #2E7DB8',
                                      color: '#fff', cursor: 'pointer',
                                      padding: '7px 14px', borderRadius: 4,
                                      fontSize: 12, fontWeight: 700, letterSpacing: '0.3px',
                                    }}
                                  >
                                    <FiEdit2 size={13} /> Edit Record
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}

                    {/* Admission vitals row (always last) */}
                    <tr style={{
                      background: vitalRecords.length % 2 === 0 ? 'transparent' : '#fafbfc',
                      borderBottom: '1px solid #f3f4f6',
                    }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{p.enrolled}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 2, background: '#F0F7FE', color: '#45B6FE', border: '1px solid #A8D8FC', marginTop: 2 }}>ADMISSION</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('bp', p.vitals.bp) ? '#ef4444' : 'var(--kh-text)' }}>{p.vitals.bp}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('sugar', p.vitals.sugar) ? '#d97706' : 'var(--kh-text)' }}>{p.vitals.sugar}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('spo2', p.vitals.spo2) ? '#ef4444' : 'var(--kh-text)' }}>{p.vitals.spo2}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('pulse', p.vitals.pulse) ? '#8b5cf6' : 'var(--kh-text)' }}>{p.vitals.pulse}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('temp', p.vitals.temp) ? '#ef4444' : 'var(--kh-text)' }}>{p.vitals.temp}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{p.vitals.resp}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{p.vitals.weight}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{vitalRecorderDisplayName(p.nurse) || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#45B6FE' }}>Baseline</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ═══ MEDICATIONS — MEGA MODAL ═══ */}
      {showMedicationsMegaModal && (
        <div
          className="patient-medications-mega-modal"
          onClick={() => { if (!showMedForm && !showReminderForm) setShowMedicationsMegaModal(false); }}
        >
          <div
            className="patient-medications-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Active medications"
          >
            <div className="patient-medications-mega-modal__header">
              <div className="patient-medications-mega-modal__header-copy">
                <span className="patient-medications-mega-modal__eyebrow">Medication management</span>
                <div className="patient-medications-mega-modal__title-row">
                  <span className="patient-medications-mega-modal__title-icon"><FiFileText size={20} /></span>
                  <div>
                    <h3>
                      Active Medications
                      <span className="patient-medications-mega-modal__count">{activeMedicationRecords.length}</span>
                    </h3>
                    <p>Review, prescribe, and schedule reminders for {p.name}. Drug catalog is sourced live from <code>/drugs</code>.</p>
                  </div>
                </div>
              </div>
              <div className="patient-medications-mega-modal__actions">
                <button
                  type="button"
                  className="patient-medications-mega-modal__add-btn"
                  onClick={() => { setShowMedForm(true); setDrugSearch(''); setShowCustomDrug(false); setShowDrugDropdown(false); }}
                >
                  <FiPlus size={14} /> Add Medication
                </button>
                <button
                  type="button"
                  className="patient-medications-mega-modal__close"
                  onClick={() => { if (!showMedForm && !showReminderForm) setShowMedicationsMegaModal(false); }}
                  aria-label="Close medications"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            <div className="patient-medications-mega-modal__body">
              {/* Add Medication Modal */}
              {showMedForm && (
                <div
                  className="kh-modal-overlay"
                  style={{ zIndex: 9998, padding: 16 }}
                  onClick={resetMedicationComposer}
                >
                  <div
                    className="kh-modal-panel"
                    style={{
                      width: 'min(980px, 96vw)',
                      maxHeight: '90vh',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onClick={event => event.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={editingMedicationId ? 'Edit medication' : 'Add medication'}
                  >
                    <div className="kh-modal-header patient-medication-modal__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div className="patient-medication-modal__header-copy">
                        <div className="patient-medication-modal__eyebrow">Medication workflow</div>
                        <div className="patient-medication-modal__title-row">
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--kh-text)' }}>{editingMedicationId ? 'Edit Medication' : 'Add Medication'}</div>
                          <span className={`patient-medication-modal__status${drugCatalogError ? ' is-warning' : ''}`}>
                            {drugCatalogLoading
                              ? 'Syncing /drugs'
                              : drugCatalogError
                                ? 'Using fallback list'
                                : `${drugCatalog.length} drugs available`}
                          </span>
                        </div>
                        <div className="patient-medication-modal__header-text">
                          {editingMedicationId
                            ? 'Update the medication details and reminder schedule in one place.'
                            : 'Search the live drug catalog, confirm the prescription details, then continue to reminders.'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetMedicationComposer}
                        className="patient-update-modal__close-btn"
                        style={{ cursor: 'pointer' }}
                      >
                        <FiX size={18} />
                      </button>
                    </div>

                    <div className="kh-modal-body patient-medication-modal__body" style={{ overflowY: 'auto' }}>
                      {medicationSaveError && (
                        <div style={{ marginBottom: 12, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
                          {medicationSaveError}
                        </div>
                      )}
                      <div className="patient-medication-modal__layout">
                        <div className="patient-medication-modal__main">
                          <section className="patient-medication-modal__section">
                            <div className="patient-medication-modal__section-header">
                              <div>
                                <div className="patient-medication-modal__section-title">Drug selection</div>
                                <div className="patient-medication-modal__section-copy">
                                  {drugCatalogLoading
                                    ? 'Loading the latest drugs from `/drugs`.'
                                    : drugCatalogError
                                      ? `${drugCatalogError} The default list is available below.`
                                      : 'Search and select a medication from the live catalog.'}
                                </div>
                              </div>
                              <span className="patient-medication-modal__pill">{editingMedicationId ? 'Edit mode' : 'New entry'}</span>
                            </div>

                            <div className="patient-medication-modal__field">
                              <label className="patient-medication-modal__label">Drug Name *</label>
                              <div className="patient-medication-modal__search-wrap">
                                <FiSearch size={14} className="patient-medication-modal__search-icon" />
                                <input
                                  value={drugSearch}
                                  onChange={e => { setDrugSearch(e.target.value); setShowDrugDropdown(true); setMedForm(f => ({ ...f, drug: '' })); setShowCustomDrug(false); }}
                                  onFocus={() => setShowDrugDropdown(true)}
                                  placeholder="Search medication"
                                  className="patient-medication-modal__search-input"
                                />
                                <FiChevronDown size={14} className="patient-medication-modal__search-caret" />

                                {showDrugDropdown && drugSearch.length >= 1 && (
                                  <div className="patient-medication-modal__search-dropdown">
                                    {drugCatalogLoading ? (
                                      <div className="patient-medication-modal__search-empty">Loading available drugs...</div>
                                    ) : filteredDrugs.length > 0 ? (
                                      filteredDrugs.map((drugOption, index) => (
                                        <button
                                          key={drugOption.id || index}
                                          type="button"
                                          onClick={() => selectDrug(drugOption)}
                                          className="patient-medication-modal__search-option"
                                        >
                                          <span>{drugOption.name}</span>
                                          <small>{drugOption.category}{drugOption.commonDose ? ` · ${drugOption.commonDose}` : ''}</small>
                                        </button>
                                      ))
                                    ) : (
                                      <div style={{ padding: '12px' }}>
                                        <div className="patient-medication-modal__search-miss">
                                          <FiAlertTriangle size={12} /> "{drugSearch}" not found in the drug list
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => { setShowCustomDrug(true); setCustomDrugName(drugSearch); setShowDrugDropdown(false); }}
                                          className="patient-medication-modal__custom-trigger"
                                        >
                                          <FiPlus size={12} /> Add as Custom Medication
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {medForm.drug && (
                                <div className="patient-medication-modal__selected-chip">
                                  <span className="patient-medication-modal__selected-chip-icon"><FiCheckCircle size={11} /></span>
                                  <span>{medForm.drug}</span>
                                  <button
                                    type="button"
                                    onClick={() => { setMedForm(f => ({ ...f, drug: '', dosage: '' })); setDrugSearch(''); }}
                                  >
                                    <FiX size={11} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {showCustomDrug && (
                              <div className="patient-medication-modal__custom-card">
                                <div className="patient-medication-modal__custom-title">Custom medication</div>
                                <div className="patient-medication-modal__custom-copy">Use this when the searched drug is not yet available from `/drugs`.</div>
                                <div className="patient-medication-modal__custom-actions">
                                  <input
                                    value={customDrugName}
                                    onChange={e => setCustomDrugName(e.target.value)}
                                    placeholder="Enter medication name"
                                    className="patient-medication-modal__input"
                                  />
                                  <button
                                    type="button"
                                    onClick={applyCustomDrug}
                                    disabled={!customDrugName.trim()}
                                    className="patient-medication-modal__inline-btn patient-medication-modal__inline-btn--primary"
                                  >
                                    <FiCheckCircle size={12} /> Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setShowCustomDrug(false); setCustomDrugName(''); }}
                                    className="patient-medication-modal__inline-btn"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </section>

                          <section className="patient-medication-modal__section">
                            <div className="patient-medication-modal__section-header">
                              <div>
                                <div className="patient-medication-modal__section-title">Prescription details</div>
                                <div className="patient-medication-modal__section-copy">Complete the core details before saving the medication.</div>
                              </div>
                              <span className="patient-medication-modal__required-note">Required fields are marked with *</span>
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Dosage *</label>
                                  <input
                                    value={medForm.dosage}
                                    onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))}
                                    placeholder="e.g. 500mg"
                                    className="patient-medication-modal__input"
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Frequency *</label>
                                  <select
                                    value={medForm.frequency}
                                    onChange={e => setMedForm(f => ({ ...f, frequency: e.target.value }))}
                                    className="patient-medication-modal__input"
                                  >
                                    <option value="">Select</option>
                                    {FREQ_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Route</label>
                                  <select
                                    value={medForm.route}
                                    onChange={e => setMedForm(f => ({ ...f, route: e.target.value }))}
                                    className="patient-medication-modal__input"
                                  >
                                    {ROUTE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="patient-medication-modal__field">
                                  <label className="patient-medication-modal__label">Notes</label>
                                  <input
                                    value={medForm.notes}
                                    onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Additional instructions or notes"
                                    className="patient-medication-modal__input"
                                  />
                                </div>
                              </div>
                            </div>
                          </section>

                          {editingMedicationId && (
                            <section className="patient-medication-modal__section">
                              <div className="patient-medication-modal__section-header">
                                <div>
                                  <div className="patient-medication-modal__section-title">Reminder schedule</div>
                                  <div className="patient-medication-modal__section-copy">Update dates, notifications, and reminder times for this medication.</div>
                                </div>
                              </div>

                              <div className="row g-3" style={{ marginBottom: 12 }}>
                                <div className="col-md-4">
                                  <div className="patient-medication-modal__field">
                                    <label className="patient-medication-modal__label">Start Date</label>
                                    <input
                                      type="date"
                                      value={reminderForm.startDate}
                                      onChange={e => setReminderForm(f => ({ ...f, startDate: e.target.value }))}
                                      className="patient-medication-modal__input"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="patient-medication-modal__field">
                                    <label className="patient-medication-modal__label">End Date</label>
                                    <input
                                      type="date"
                                      value={reminderForm.endDate}
                                      onChange={e => setReminderForm(f => ({ ...f, endDate: e.target.value }))}
                                      className="patient-medication-modal__input"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="patient-medication-modal__field">
                                    <label className="patient-medication-modal__label">Notify</label>
                                    <div className="patient-medication-modal__checkboxes">
                                      <label>
                                        <input type="checkbox" checked={reminderForm.notifyNurse} onChange={e => setReminderForm(f => ({ ...f, notifyNurse: e.target.checked }))} style={{ accentColor: '#45B6FE' }} />
                                        Nurse
                                      </label>
                                      <label>
                                        <input type="checkbox" checked={reminderForm.notifyPatient} onChange={e => setReminderForm(f => ({ ...f, notifyPatient: e.target.checked }))} style={{ accentColor: '#45B6FE' }} />
                                        Patient
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="patient-medication-modal__section-header patient-medication-modal__section-header--compact">
                                  <div>
                                    <div className="patient-medication-modal__section-title">Reminder times</div>
                                  </div>
                                  <button onClick={addReminderTime} type="button" className="patient-medications-table__action">
                                    <FiPlus size={11} /> Add Time
                                  </button>
                                </div>
                                <div className="patient-medication-modal__time-list">
                                  {reminderForm.times.map((time, index) => (
                                    <div key={index} className="patient-medication-modal__time-chip">
                                      <FiClock size={12} style={{ color: '#45B6FE' }} />
                                      <input
                                        type="time"
                                        value={time}
                                        onChange={e => updateReminderTime(index, e.target.value)}
                                      />
                                      {reminderForm.times.length > 1 && (
                                        <button type="button" onClick={() => removeReminderTime(index)}>
                                          <FiX size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          )}
                        </div>

                        <aside className="patient-medication-modal__aside">
                          <div className="patient-medication-modal__summary-card">
                            <div className="patient-medication-modal__summary-title">Medication summary</div>
                            <div className="patient-medication-modal__summary-list">
                              <div><span>Drug</span><strong>{medForm.drug || 'Select a drug'}</strong></div>
                              <div><span>Dosage</span><strong>{medForm.dosage || 'Not set'}</strong></div>
                              <div><span>Frequency</span><strong>{medForm.frequency || 'Not set'}</strong></div>
                              <div><span>Route</span><strong>{medForm.route || 'Oral'}</strong></div>
                            </div>
                          </div>

                          <div className="patient-medication-modal__summary-card patient-medication-modal__summary-card--soft">
                            <div className="patient-medication-modal__summary-title">Next step</div>
                            <div className="patient-medication-modal__summary-copy">
                              {editingMedicationId
                                ? 'Save your changes to update both the medication details and its reminder schedule.'
                                : 'Save the medication first, then continue to reminder setup right away.'}
                            </div>
                          </div>

                          <div className="patient-medication-modal__summary-card patient-medication-modal__summary-card--soft">
                            <div className="patient-medication-modal__summary-title">Drug source</div>
                            <div className="patient-medication-modal__summary-copy">
                              {drugCatalogLoading
                                ? 'Checking `/drugs` for the latest medication list.'
                                : drugCatalogError
                                  ? 'The modal is showing the local fallback list because the live drug list is unavailable.'
                                  : 'The dropdown is powered by the live `/drugs` endpoint.'}
                            </div>
                          </div>
                        </aside>
                      </div>
                    </div>

                    <div className="kh-modal-footer patient-update-modal__footer patient-medication-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={resetMedicationComposer}
                        type="button"
                        className="patient-update-modal__action-btn patient-update-modal__action-btn--secondary"
                        style={{ cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button onClick={handleAddMed} disabled={!medForm.drug || !medForm.dosage || !medForm.frequency || savingMedication}
                        type="button"
                        className="patient-update-modal__action-btn patient-update-modal__action-btn--primary"
                        style={{
                          cursor: medForm.drug && medForm.dosage && medForm.frequency && !savingMedication ? 'pointer' : 'not-allowed',
                          opacity: medForm.drug && medForm.dosage && medForm.frequency && !savingMedication ? 1 : 0.55,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}>
                        <FiSend size={12} /> {savingMedication ? 'Saving...' : editingMedicationId ? 'Save Changes' : 'Save & Continue'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reminder Form (appears after adding a med) */}
              {showReminderForm && (() => {
                const med = addedMeds.find(m => m.id === showReminderForm);
                if (!med) return null;
                return (
                  <div style={{ padding: '16px', marginBottom: 16, borderRadius: 2, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 12 }}>
                      <div className="d-flex align-items-center gap-2">
                        <FiBell size={14} style={{ color: '#d97706' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Set Reminder for {med.drug}</span>
                      </div>
                      <button onClick={() => setShowReminderForm(null)}
                        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '4px 6px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}>
                        <FiX size={14} />
                      </button>
                    </div>

                    {/* Medication summary */}
                    <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 2, background: '#fff', border: '1px solid #e5e7eb' }}>
                      <div className="d-flex align-items-center gap-3">
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{med.drug}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2, background: '#F0F7FE', color: '#45B6FE', border: '1px solid #A8D8FC' }}>{med.dosage} · {med.frequency}</span>
                        <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>via {med.route}</span>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      {/* Reminder Type */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>Schedule</label>
                        <select value={reminderForm.reminderType} onChange={e => setReminderForm(f => ({ ...f, reminderType: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #fde68a', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer' }}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {/* Start Date */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>Start Date</label>
                        <input type="date" value={reminderForm.startDate} onChange={e => setReminderForm(f => ({ ...f, startDate: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #fde68a', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                      </div>

                      {/* End Date */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>End Date</label>
                        <input type="date" value={reminderForm.endDate} onChange={e => setReminderForm(f => ({ ...f, endDate: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #fde68a', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                      </div>

                      {/* Notify */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>Notify</label>
                        <div className="d-flex flex-column gap-1">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={reminderForm.notifyNurse} onChange={e => setReminderForm(f => ({ ...f, notifyNurse: e.target.checked }))} style={{ accentColor: '#d97706' }} />
                            Nurse
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={reminderForm.notifyPatient} onChange={e => setReminderForm(f => ({ ...f, notifyPatient: e.target.checked }))} style={{ accentColor: '#d97706' }} />
                            Patient
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Reminder Times */}
                    <div style={{ marginBottom: 14 }}>
                      <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 6 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e' }}>
                          <FiClock size={11} style={{ marginRight: 4 }} /> Reminder Times
                        </label>
                        <button onClick={addReminderTime} style={{
                          padding: '3px 10px', fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                          background: '#fff', color: '#d97706', border: '1px solid #fde68a',
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <FiPlus size={11} /> Add Time
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {reminderForm.times.map((t, i) => (
                          <div key={i} className="d-flex align-items-center gap-1" style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 2, padding: '4px 8px' }}>
                            <input type="time" value={t} onChange={e => updateReminderTime(i, e.target.value)}
                              style={{ border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--kh-text)', background: 'transparent', width: 90, outline: 'none' }} />
                            {reminderForm.times.length > 1 && (
                              <button onClick={() => removeReminderTime(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 0 }}>
                                <FiX size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save / Skip */}
                    <div className="d-flex gap-2 justify-content-end">
                      <button onClick={() => setShowReminderForm(null)}
                        style={{ padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer', background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db' }}>
                        Skip Reminder
                      </button>
                      <button onClick={() => saveReminder(med.id)}
                        style={{
                          padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, border: 'none', cursor: 'pointer',
                          background: '#d97706', color: '#fff',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                        <FiBell size={12} /> Save Reminder
                      </button>
                    </div>
                  </div>
                );
              })()}

              {activeMedicationRecords.length > 0 ? (
                <div className="patient-medications-table-wrap">
                  <div className="table-responsive">
                    <table className="patient-medications-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Drug Name</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Route</th>
                          <th>Reminder</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingMedicationEntries.map((med, visibleIdx) => (
                          <tr key={med.id}>
                            <td>{visibleIdx + 1}</td>
                            <td>
                              <div className="patient-medications-table__name-cell">
                                <strong>{med.drug}</strong>
                                <span>Patient record</span>
                              </div>
                            </td>
                            <td>{med.dosage || '—'}</td>
                            <td>{med.frequency || '—'}</td>
                            <td>{med.route || '—'}</td>
                            <td><span className="patient-medications-table__reminder is-muted">No reminder</span></td>
                            <td><span className="patient-medications-table__status">Active</span></td>
                            <td>
                              <button
                                onClick={() => setConfirmDelete({ type: 'existing', id: med.originalIndex, name: med.drug })}
                                className="patient-medications-table__action patient-medications-table__action--danger"
                                title="Delete medication"
                              >
                                <FiX size={12} /> Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {persistedMedicationEntries.map((med, i) => {
                          const existingCount = existingMedicationEntries.length;
                          const reminderTargets = med.reminders
                            ? [med.reminders.notifyNurse && 'Nurse', med.reminders.notifyPatient && 'Patient'].filter(Boolean)
                            : [];

                          return (
                            <tr key={med.id}>
                              <td>{existingCount + i + 1}</td>
                              <td>
                                <div className="patient-medications-table__name-cell">
                                  <strong>{med.drug}</strong>
                                  {med.notes ? <span>{med.notes}</span> : null}
                                </div>
                              </td>
                              <td>{med.dosage || '—'}</td>
                              <td>{med.frequency || '—'}</td>
                              <td>{med.route || '—'}</td>
                              <td>
                                {med.reminders ? (
                                  <div className="patient-medications-table__badges">
                                    {med.reminders.times.map((time, timeIndex) => (
                                      <span key={timeIndex} className="patient-medications-table__badge">
                                        {time}
                                      </span>
                                    ))}
                                    {reminderTargets.map((target) => (
                                      <span key={target} className="patient-medications-table__badge patient-medications-table__badge--soft">
                                        {target}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setShowReminderForm(med.id); setReminderForm({ times: ['08:00'], startDate: new Date().toISOString().slice(0, 10), endDate: '', reminderType: 'daily', notifyNurse: true, notifyPatient: false }); }}
                                    className="patient-medications-table__action"
                                  >
                                    <FiBell size={12} /> Set Reminder
                                  </button>
                                )}
                              </td>
                              <td><span className="patient-medications-table__status patient-medications-table__status--new">New</span></td>
                              <td>
                                <div className="patient-medications-table__actions">
                                  <button
                                    onClick={() => openMedicationEditor(med)}
                                    className="patient-medications-table__action patient-medications-table__action--secondary"
                                    title="Edit medication"
                                  >
                                    <FiEdit2 size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete({ type: 'added', id: med.id, name: med.drug })}
                                    className="patient-medications-table__action patient-medications-table__action--danger"
                                    title="Remove medication"
                                  >
                                    <FiX size={12} /> Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <NoDataState text="No active medications have been recorded for this patient yet." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LIFESTYLE RECORDS ═══ */}
      {tab === 'care' && (
        <div className="row g-3">
          <div className="col-lg-4">
            <Panel title="Sleep" icon={<FiClock size={14} />}>
              <DataRow label="Gets Up at Night"><YN val={p.sleep.nightWake} /></DataRow>
              <DataRow label="Night Sedation"><YN val={p.sleep.sedation} /></DataRow>
              <DataRow label="Sleeps Well"><YN val={p.sleep.sleepsWell} /></DataRow>
              <DataRow label="Wake Time">{p.sleep.wakeTime}</DataRow>
              <DataRow label="Best Position">{p.sleep.bestPosition}</DataRow>
            </Panel>

            <Panel title="Nutrition" icon={<FiHeart size={14} />}>
              <DataRow label="Food Allergies"><YN val={p.nutrition.allergies} /></DataRow>
              <DataRow label="Special Diet"><YN val={p.nutrition.specialDiet} /></DataRow>
              <DataRow label="Diet Type"><span style={{ fontWeight: 600 }}>{p.nutrition.dietType}</span></DataRow>
              <DataRow label="Eating Assistance"><YN val={p.nutrition.helpEating} /></DataRow>
              <DataRow label="Swallowing Issues"><YN val={p.nutrition.swallowing} /></DataRow>
              <DataRow label="NG Tube"><YN val={p.nutrition.ngTube} /></DataRow>
            </Panel>
          </div>

          <div className="col-lg-4">
            <Panel title="Personal Hygiene" icon={<FiCheckCircle size={14} />}>
              <DataRow label="Independent"><YN val={p.hygiene.independent} /></DataRow>
              <DataRow label="Mouth-Care Plan"><YN val={p.hygiene.mouthCare} /></DataRow>
            </Panel>

            <Panel title="Bladder & Bowel" icon={<FiActivity size={14} />}>
              <DataRow label="Dysfunction"><YN val={p.bladder.dysfunction} /></DataRow>
              <DataRow label="Catheter"><YN val={p.bladder.catheter} /></DataRow>
              <DataRow label="Incontinent Pads"><YN val={p.bladder.pads} /></DataRow>
            </Panel>

            <Panel title="Physician Contact" icon={<FiPhone size={14} />}>
              <DataRow label="Doctor">{p.doctor.name}</DataRow>
              <DataRow label="Facility">{p.doctor.facility}</DataRow>
              <DataRow label="Phone">{p.doctor.phone}</DataRow>
            </Panel>
          </div>

          <div className="col-lg-4">
            <Panel title="Active Care Protocols" icon={<FiClipboard size={14} />} accent="#45B6FE">
              {[
                { label: 'Infection Control Plan', active: p.infection.riskPlan },
                { label: 'Diabetes Care Plan', active: p.diabetes.carePlan },
                { label: 'Mouth-Care Plan', active: p.hygiene.mouthCare },
                { label: 'Pain Management', active: p.pain.present },
                { label: 'Wound Management', active: p.skin.openWounds },
                { label: 'Mobility Support', active: !p.mobility.independent },
              ].filter(c => c.active).map((c, i) => (
                <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <FiCheckCircle size={13} style={{ color: '#45B6FE', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)' }}>{c.label}</span>
                </div>
              ))}
              {[
                { label: 'Infection Control Plan', active: p.infection.riskPlan },
                { label: 'Diabetes Care Plan', active: p.diabetes.carePlan },
                { label: 'Mouth-Care Plan', active: p.hygiene.mouthCare },
                { label: 'Pain Management', active: p.pain.present },
                { label: 'Wound Management', active: p.skin.openWounds },
                { label: 'Mobility Support', active: !p.mobility.independent },
              ].filter(c => c.active).length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '8px 0' }}>No active care protocols</div>
              )}
            </Panel>

            <Panel title="Emergency Contact" icon={<FiAlertTriangle size={14} />} accent="#d97706">
              <DataRow label="Name">{p.emergency.name}</DataRow>
              <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
              <DataRow label="Phone">{p.emergency.phone}</DataRow>
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ NURSE NOTES — MEGA MODAL ═══ */}
      {showNotesMegaModal && (
        <div
          className="patient-notes-mega-modal"
          onClick={() => { if (!savingNote) setShowNotesMegaModal(false); }}
        >
          <div
            className="patient-notes-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Nurse notes"
          >
            {/* Modal header */}
            <div className="patient-notes-mega-modal__header">
              <div className="patient-notes-mega-modal__header-copy">
                <span className="patient-notes-mega-modal__eyebrow">Nurse care log</span>
                <div className="patient-notes-mega-modal__title-row">
                  <span className="patient-notes-mega-modal__title-icon"><FiEdit2 size={20} /></span>
                  <div>
                    <h3>
                      Nurse Notes
                      <span className="patient-notes-mega-modal__count">{nurseNotes.length}</span>
                      {notesLoading && <span className="patient-notes-mega-modal__loading">Loading…</span>}
                    </h3>
                    <p>
                      {notesScope === 'nurse'
                        ? `All nurse notes you have authored across patients.`
                        : `Document observations, interventions, and care updates for ${p.name}. Notes sync to the patient timeline immediately.`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="patient-notes-mega-modal__actions">
                <button
                  type="button"
                  className="patient-notes-mega-modal__add-btn"
                  onClick={() => {
                    if (showNoteForm) {
                      setShowNoteForm(false);
                      resetNoteForm();
                    } else {
                      resetNoteForm();
                      setNoteForm((prev) => ({ ...prev, nurse: currentUserName || prev.nurse }));
                      setShowNoteForm(true);
                    }
                  }}
                >
                  {showNoteForm ? <><FiX size={14} /> Cancel</> : <><FiPlus size={14} /> Add Note</>}
                </button>
                <button
                  type="button"
                  className="patient-notes-mega-modal__close"
                  onClick={() => { if (!savingNote) setShowNotesMegaModal(false); }}
                  aria-label="Close nurse notes"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="patient-notes-mega-modal__body">
              {/* Toolbar */}
              <div className="patient-notes-toolbar">
                <div className="patient-notes-toolbar__group">
                  <div className="patient-notes-toolbar__scope">
                    <button
                      type="button"
                      onClick={() => setNotesScope('patient')}
                      className={`patient-notes-toolbar__scope-btn${notesScope === 'patient' ? ' is-active' : ''}`}
                    >
                      <FiUser size={12} /> This patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesScope('nurse')}
                      disabled={!currentNurseId}
                      title={currentNurseId ? 'View all notes I authored' : 'Nurse identity unavailable'}
                      className={`patient-notes-toolbar__scope-btn${notesScope === 'nurse' ? ' is-active' : ''}${!currentNurseId ? ' is-disabled' : ''}`}
                    >
                      <FiClipboard size={12} /> All my notes
                    </button>
                  </div>
                </div>
                <div className="patient-notes-toolbar__group">
                  <select
                    value={noteFilter}
                    onChange={e => setNoteFilter(e.target.value)}
                    className="patient-notes-toolbar__select"
                  >
                    <option value="All">All Categories</option>
                    {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={loadNurseNotes}
                    title="Refresh notes"
                    className="patient-notes-toolbar__icon-btn"
                  >
                    <FiRefreshCw size={13} />
                  </button>
                </div>
              </div>

              {notesError && (
                <div className="patient-notes-toolbar__error">{notesError}</div>
              )}

              {/* Add / Edit Note Form */}
              {showNoteForm && (
                <div className="patient-notes-form">
                  {editingNoteId && (
                    <div className="patient-notes-form__edit-pill">
                      <FiEdit2 size={11} /> Editing existing note
                    </div>
                  )}
                  <div className="row g-2 mb-3">
                    <div className="col-md-3">
                      <label className="patient-notes-form__label">
                        <FiCalendar size={11} /> Date
                      </label>
                      <input
                        type="date"
                        value={noteForm.date}
                        onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                        className="patient-notes-form__input"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-notes-form__label">
                        <FiClock size={11} /> Time
                      </label>
                      <input
                        type="time"
                        value={noteForm.time}
                        onChange={e => setNoteForm({ ...noteForm, time: e.target.value })}
                        className="patient-notes-form__input"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="patient-notes-form__label">
                        <FiUser size={11} /> Nurse
                      </label>
                      <input
                        type="text"
                        placeholder="Nurse name"
                        value={noteForm.nurse}
                        onChange={e => setNoteForm({ ...noteForm, nurse: e.target.value })}
                        className="patient-notes-form__input"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-notes-form__label">Category</label>
                      <select
                        value={noteForm.category}
                        onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                        className="patient-notes-form__input"
                      >
                        {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="patient-notes-form__label">Priority</label>
                      <select
                        value={noteForm.priority}
                        onChange={e => setNoteForm({ ...noteForm, priority: e.target.value })}
                        className="patient-notes-form__input"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="patient-notes-form__label">
                      <FiEdit2 size={11} /> Note Content
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Enter detailed nurse note. Use new lines to separate paragraphs."
                      value={noteForm.content}
                      onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                      className="patient-notes-form__textarea"
                    />
                  </div>
                  {noteSaveError && (
                    <div className="patient-notes-form__error">{noteSaveError}</div>
                  )}
                  <div className="patient-notes-form__footer">
                    <button
                      type="button"
                      onClick={() => { setShowNoteForm(false); resetNoteForm(); }}
                      disabled={savingNote}
                      className="patient-notes-form__btn patient-notes-form__btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!noteForm.content.trim() || savingNote}
                      className="patient-notes-form__btn patient-notes-form__btn--primary"
                    >
                      <FiSend size={13} />
                      {savingNote
                        ? (editingNoteId ? 'Updating…' : 'Saving…')
                        : (editingNoteId ? 'Update Note' : 'Save Note')}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes Timeline */}
              {filteredNotes.length === 0 ? (
                <div className="patient-notes-empty">
                  <FiEdit2 size={32} className="patient-notes-empty__icon" />
                  <div className="patient-notes-empty__title">
                    {notesLoading
                      ? 'Loading nurse notes…'
                      : noteFilter !== 'All'
                        ? `No notes found in "${noteFilter}" category`
                        : notesScope === 'nurse'
                          ? 'You have not created any nurse notes yet'
                          : 'No nurse notes yet for this patient'}
                  </div>
                  {!notesLoading && (
                    <div className="patient-notes-empty__hint">
                      {notesScope === 'nurse'
                        ? 'Switch to "This patient" and click "Add Note" to create one.'
                        : 'Click "Add Note" to create the first nurse note for this patient.'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="patient-notes-list">
                  {filteredNotes.map((note) => (
                    <article
                      key={note.id}
                      className="patient-notes-card"
                      style={{ borderLeftColor: getCategoryColor(note.category) }}
                    >
                      <header className="patient-notes-card__header">
                        <div className="patient-notes-card__chips">
                          <span
                            className="patient-notes-card__chip"
                            style={{ background: getCategoryColor(note.category) + '18', color: getCategoryColor(note.category) }}
                          >
                            {note.category}
                          </span>
                          {note.priority === 'High' && (
                            <span className="patient-notes-card__chip patient-notes-card__chip--warn">High Priority</span>
                          )}
                          {note.priority === 'Urgent' && (
                            <span className="patient-notes-card__chip patient-notes-card__chip--danger">Urgent</span>
                          )}
                          {note.pinned && (
                            <span className="patient-notes-card__chip patient-notes-card__chip--pin">Pinned</span>
                          )}
                          <span className="patient-notes-card__meta">
                            <FiCalendar size={11} /> {note.date}
                          </span>
                          <span className="patient-notes-card__meta">
                            <FiClock size={11} /> {note.time}
                          </span>
                        </div>
                        <div className="patient-notes-card__actions">
                          <button
                            type="button"
                            onClick={() => handlePinNote(note.id)}
                            title={note.pinned ? 'Unpin note' : 'Pin note'}
                            className={`patient-notes-card__icon-btn${note.pinned ? ' is-pinned' : ''}`}
                          >
                            <FiAlertCircle size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditNote(note)}
                            title="Edit note"
                            className="patient-notes-card__edit-btn"
                          >
                            <FiEdit2 size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            title="Delete note"
                            className="patient-notes-card__icon-btn patient-notes-card__icon-btn--danger"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      </header>
                      <div className="patient-notes-card__body">
                        <div className="patient-notes-card__content">{note.content}</div>
                        <div className="patient-notes-card__author">
                          <span className="patient-notes-card__author-avatar"><FiUser size={11} /></span>
                          <span>{note.nurse || 'Unknown Nurse'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ INCIDENT REPORTS — MEGA MODAL ═══ */}
      {showIncidentsMegaModal && (
        <div
          className="patient-incidents-mega-modal"
          onClick={() => {
            setShowIncidentForm(false);
            resetIncidentForm();
            setConfirmDeleteIncident(null);
            setIncidentDeleteModalError('');
            setShowIncidentsMegaModal(false);
          }}
        >
          <div
            className="patient-incidents-mega-modal__panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Incident reports"
          >
            {/* Modal header */}
            <div className="patient-incidents-mega-modal__header">
              <div className="patient-incidents-mega-modal__header-copy">
                <span className="patient-incidents-mega-modal__eyebrow">Safety incidents</span>
                <div className="patient-incidents-mega-modal__title-row">
                  <span className="patient-incidents-mega-modal__title-icon"><FiAlertTriangle size={20} /></span>
                  <div>
                    <h3>
                      Incident Reports
                      <span className="patient-incidents-mega-modal__count">{incidents.length}</span>
                      {incidents.filter(i => i.status === 'open').length > 0 && (
                        <span className="patient-incidents-mega-modal__open-pill">
                          {incidents.filter(i => i.status === 'open').length} Open
                        </span>
                      )}
                      {incidentsLoading && (
                        <span className="patient-incidents-mega-modal__open-pill">Loading…</span>
                      )}
                    </h3>
                    <p>File and track safety incidents for {p.name}. Records sync to the patient timeline immediately.</p>
                  </div>
                </div>
              </div>
              <div className="patient-incidents-mega-modal__actions">
                <button
                  type="button"
                  className="patient-incidents-mega-modal__add-btn"
                  onClick={() => {
                    if (!showIncidentForm) {
                      resetIncidentForm();
                      setShowIncidentForm(true);
                    } else {
                      setShowIncidentForm(false);
                      resetIncidentForm();
                    }
                  }}
                >
                  {showIncidentForm ? <><FiX size={14} /> {editingIncidentId ? 'Close editor' : 'Cancel'}</> : <><FiPlus size={14} /> Report Incident</>}
                </button>
                <button
                  type="button"
                  className="patient-incidents-mega-modal__close"
                  onClick={() => {
                    setShowIncidentForm(false);
                    resetIncidentForm();
                    setConfirmDeleteIncident(null);
                    setIncidentDeleteModalError('');
                    setShowIncidentsMegaModal(false);
                  }}
                  aria-label="Close incident reports"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="patient-incidents-mega-modal__body">
              {/* Toolbar */}
              <div className="patient-incidents-toolbar">
                <div className="patient-incidents-toolbar__group">
                  <select
                    value={incidentFilter}
                    onChange={e => setIncidentFilter(e.target.value)}
                    className="patient-incidents-toolbar__select"
                  >
                    <option value="All">All Types</option>
                    {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={loadIncidents}
                    title="Refresh incidents"
                    disabled={incidentsLoading}
                    className="patient-notes-toolbar__icon-btn"
                    style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                  >
                    <FiRefreshCw size={13} />
                  </button>
                </div>
                <div className="patient-incidents-toolbar__hint">
                  <FiAlertCircle size={12} />
                  <span>Showing {filteredIncidents.length} of {incidents.length} incident{incidents.length === 1 ? '' : 's'}</span>
                </div>
              </div>

              {incidentsError && (
                <div className="patient-notes-toolbar__error">{incidentsError}</div>
              )}

              {/* Add Incident Form */}
              {showIncidentForm && (
                <div className="patient-incidents-form">
                  {editingIncidentId && (
                    <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 12.5, fontWeight: 600, color: '#1e40af' }}>
                      Editing this incident report — save to update it on the server.
                    </div>
                  )}
                  <div className="row g-2 mb-3">
                    <div className="col-md-3">
                      <label className="patient-incidents-form__label">
                        <FiCalendar size={11} /> Date
                      </label>
                      <input
                        type="date"
                        value={incidentForm.date}
                        onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-incidents-form__label">
                        <FiClock size={11} /> Time
                      </label>
                      <input
                        type="time"
                        value={incidentForm.time}
                        onChange={e => setIncidentForm({ ...incidentForm, time: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="patient-incidents-form__label">
                        <FiUser size={11} /> Reported By
                      </label>
                      <input
                        type="text"
                        placeholder="Name of person reporting"
                        value={incidentForm.reportedBy}
                        onChange={e => setIncidentForm({ ...incidentForm, reportedBy: e.target.value })}
                        className="patient-incidents-form__input"
                        autoComplete="name"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="patient-incidents-form__label">Incident Type</label>
                      <select
                        value={incidentForm.type}
                        onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })}
                        className="patient-incidents-form__input"
                      >
                        {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="patient-incidents-form__label">Severity</label>
                      <select
                        value={incidentForm.severity}
                        onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                        className="patient-incidents-form__input"
                      >
                        {INCIDENT_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label">
                      <FiMapPin size={11} /> Location of Incident
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bedroom — bedside, Bathroom, Kitchen..."
                      value={incidentForm.location}
                      onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                      className="patient-incidents-form__input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label patient-incidents-form__label--required">
                      <FiAlertTriangle size={11} /> Incident Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe what happened in detail..."
                      value={incidentForm.description}
                      onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                      className="patient-incidents-form__textarea"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label">
                      <FiShield size={11} /> Immediate Action Taken
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe immediate actions taken..."
                      value={incidentForm.immediateAction}
                      onChange={e => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
                      className="patient-incidents-form__textarea"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="patient-incidents-form__label">Witnesses</label>
                      <input
                        type="text"
                        placeholder="Names of any witnesses"
                        value={incidentForm.witnesses}
                        onChange={e => setIncidentForm({ ...incidentForm, witnesses: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="patient-incidents-form__label">Injury Details</label>
                      <input
                        type="text"
                        placeholder="Describe any injuries (if applicable)"
                        value={incidentForm.injuryDetails}
                        onChange={e => setIncidentForm({ ...incidentForm, injuryDetails: e.target.value })}
                        className="patient-incidents-form__input"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="patient-incidents-form__label">Follow-Up Plan</label>
                    <textarea
                      rows={2}
                      placeholder="Describe follow-up actions planned..."
                      value={incidentForm.followUp}
                      onChange={e => setIncidentForm({ ...incidentForm, followUp: e.target.value })}
                      className="patient-incidents-form__textarea"
                    />
                  </div>

                  <div className="patient-incidents-form__checkrow">
                    <label className="patient-incidents-form__checkbox">
                      <input
                        type="checkbox"
                        checked={incidentForm.physicianNotified}
                        onChange={e => setIncidentForm({ ...incidentForm, physicianNotified: e.target.checked })}
                      />
                      <span>Physician Notified</span>
                    </label>
                    <label className="patient-incidents-form__checkbox">
                      <input
                        type="checkbox"
                        checked={incidentForm.familyNotified}
                        onChange={e => setIncidentForm({ ...incidentForm, familyNotified: e.target.checked })}
                      />
                      <span>Family/Next of Kin Notified</span>
                    </label>
                  </div>

                  {incidentSaveError && (
                    <div className="patient-notes-form__error" style={{ marginBottom: 10 }}>{incidentSaveError}</div>
                  )}
                  <div className="patient-incidents-form__footer">
                    {editingIncidentId && (
                      <button
                        type="button"
                        onClick={() => {
                          const id = String(editingIncidentId || '').trim();
                          if (!id) return;
                          requestDeleteIncident(id);
                        }}
                        disabled={savingIncident}
                        className="patient-incidents-form__btn patient-incidents-form__btn--danger"
                        style={{ marginRight: 'auto' }}
                      >
                        <FiTrash2 size={13} /> Delete report
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowIncidentForm(false); resetIncidentForm(); }}
                      disabled={savingIncident}
                      className="patient-incidents-form__btn patient-incidents-form__btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={editingIncidentId ? handleUpdateIncident : handleAddIncident}
                      disabled={!incidentForm.description.trim() || savingIncident}
                      className="patient-incidents-form__btn patient-incidents-form__btn--primary"
                    >
                      <FiSend size={13} /> {savingIncident ? 'Saving…' : editingIncidentId ? 'Save changes' : 'Submit Incident Report'}
                    </button>
                  </div>
                </div>
              )}

              {/* Incident List */}
              {filteredIncidents.length === 0 ? (
                <div className="patient-incidents-empty">
                  <FiAlertTriangle size={32} className="patient-incidents-empty__icon" />
                  <div className="patient-incidents-empty__title">
                    {incidentFilter !== 'All'
                      ? `No incidents found for "${incidentFilter}" type`
                      : 'No incident reports filed'}
                  </div>
                  <div className="patient-incidents-empty__hint">
                    Click "Report Incident" to file a new incident report for this patient
                  </div>
                </div>
              ) : (
                <div className="patient-incidents-list">
                  {filteredIncidents.map((inc) => {
                    const sevStyle = getIncidentSeverityStyle(inc.severity);
                    const statStyle = getIncidentStatusStyle(inc.status);
                    const isExpanded = expandedIncident === inc.id;
                    return (
                      <article
                        key={inc.id}
                        className="patient-incidents-card"
                        style={{ borderLeftColor: sevStyle.color }}
                      >
                        <div
                          onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                          className="patient-incidents-card__header"
                          role="button"
                          tabIndex={0}
                        >
                          <div className="patient-incidents-card__chips">
                            <FiChevronRight
                              size={14}
                              className="patient-incidents-card__chevron"
                              style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                            />
                            <span
                              className="patient-incidents-card__chip patient-incidents-card__chip--severity"
                              style={{ background: sevStyle.bg, color: sevStyle.color, borderColor: sevStyle.border }}
                            >
                              {inc.severity}
                            </span>
                            <span className="patient-incidents-card__chip patient-incidents-card__chip--type">
                              {inc.type}
                            </span>
                            <span
                              className="patient-incidents-card__chip"
                              style={{ background: statStyle.bg, color: statStyle.color, borderColor: statStyle.border, textTransform: 'capitalize' }}
                            >
                              {statStyle.label}
                            </span>
                            <span className="patient-incidents-card__meta">
                              <FiCalendar size={11} /> {inc.date}
                            </span>
                            <span className="patient-incidents-card__meta">
                              <FiClock size={11} /> {inc.time}
                            </span>
                          </div>
                          <div className="patient-incidents-card__actions">
                            <span className="patient-incidents-card__reporter">{inc.reportedBy || 'Unknown'}</span>
                            {incidentIdIsPersisted(inc.id) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingIncidentId(inc.id);
                                  setIncidentForm({
                                    date: inc.date,
                                    time: inc.time,
                                    reportedBy: inc.reportedBy || '',
                                    type: inc.type,
                                    severity: inc.severity,
                                    location: inc.location || '',
                                    description: inc.description || '',
                                    immediateAction: inc.immediateAction || '',
                                    witnesses: inc.witnesses || '',
                                    injuryDetails: inc.injuryDetails || '',
                                    followUp: inc.followUp || '',
                                    physicianNotified: Boolean(inc.physicianNotified),
                                    familyNotified: Boolean(inc.familyNotified),
                                  });
                                  setIncidentSaveError('');
                                  setShowIncidentForm(true);
                                  setExpandedIncident(inc.id);
                                }}
                                title="Edit incident report"
                                className="patient-incidents-card__icon-btn"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteIncident(inc.id); }}
                              disabled={deletingIncidentId === inc.id}
                              title={deletingIncidentId === inc.id ? 'Deleting…' : 'Delete incident report'}
                              className="patient-incidents-card__icon-btn patient-incidents-card__icon-btn--danger"
                              style={{ opacity: deletingIncidentId === inc.id ? 0.55 : 1 }}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="patient-incidents-card__body">
                            <section className="patient-incidents-card__section">
                              <header className="patient-incidents-card__section-title patient-incidents-card__section-title--danger">
                                <FiAlertTriangle size={11} /> Incident Description
                              </header>
                              <div className="patient-incidents-card__text">{inc.description}</div>
                            </section>

                            {(inc.location || inc.witnesses) && (
                              <div className="row g-2 mb-3">
                                {inc.location && (
                                  <div className="col-md-6">
                                    <div className="patient-incidents-card__factbox">
                                      <div className="patient-incidents-card__factbox-label">Location</div>
                                      <div className="patient-incidents-card__factbox-value">
                                        <FiMapPin size={12} /> {inc.location}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {inc.witnesses && (
                                  <div className="col-md-6">
                                    <div className="patient-incidents-card__factbox">
                                      <div className="patient-incidents-card__factbox-label">Witnesses</div>
                                      <div className="patient-incidents-card__factbox-value">
                                        <FiUser size={12} /> {inc.witnesses}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {inc.injuryDetails && (
                              <div className="patient-incidents-card__injury">
                                <div className="patient-incidents-card__injury-label">Injury Details</div>
                                <div className="patient-incidents-card__injury-text">{inc.injuryDetails}</div>
                              </div>
                            )}

                            {inc.immediateAction && (
                              <section className="patient-incidents-card__section">
                                <header className="patient-incidents-card__section-title patient-incidents-card__section-title--info">
                                  <FiShield size={11} /> Immediate Action Taken
                                </header>
                                <div className="patient-incidents-card__highlight patient-incidents-card__highlight--info">
                                  {inc.immediateAction}
                                </div>
                              </section>
                            )}

                            {inc.followUp && (
                              <section className="patient-incidents-card__section">
                                <header className="patient-incidents-card__section-title patient-incidents-card__section-title--accent">
                                  <FiClipboard size={11} /> Follow-Up Plan
                                </header>
                                <div className="patient-incidents-card__highlight patient-incidents-card__highlight--accent">
                                  {inc.followUp}
                                </div>
                              </section>
                            )}

                            <div className="patient-incidents-card__notify-row">
                              <div className="patient-incidents-card__notify-pills">
                                {inc.physicianNotified && (
                                  <span className="patient-incidents-card__notify-pill patient-incidents-card__notify-pill--ok">
                                    <FiCheckCircle size={11} /> Physician Notified
                                  </span>
                                )}
                                {inc.familyNotified && (
                                  <span className="patient-incidents-card__notify-pill patient-incidents-card__notify-pill--ok">
                                    <FiCheckCircle size={11} /> Family Notified
                                  </span>
                                )}
                                {!inc.physicianNotified && (
                                  <span className="patient-incidents-card__notify-pill patient-incidents-card__notify-pill--warn">
                                    <FiAlertCircle size={11} /> Physician Not Notified
                                  </span>
                                )}
                              </div>
                              {inc.status !== 'resolved' && (
                                <div className="patient-incidents-card__status-actions">
                                  {inc.status === 'open' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateIncidentStatus(inc.id, 'in-progress')}
                                      disabled={updatingIncidentStatusId === inc.id}
                                      className="patient-incidents-card__status-btn patient-incidents-card__status-btn--progress"
                                    >
                                      <FiClock size={12} /> {updatingIncidentStatusId === inc.id ? 'Updating…' : 'Mark In Progress'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIncidentStatus(inc.id, 'resolved')}
                                    disabled={updatingIncidentStatusId === inc.id}
                                    className="patient-incidents-card__status-btn patient-incidents-card__status-btn--resolve"
                                  >
                                    <FiCheckCircle size={12} /> {updatingIncidentStatusId === inc.id ? 'Updating…' : 'Resolve'}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="patient-incidents-card__footer">
                              <span className="patient-incidents-card__footer-avatar"><FiUser size={11} /></span>
                              <span className="patient-incidents-card__footer-text">
                                Reported by <strong>{inc.reportedBy || 'Unknown'}</strong> on {inc.date} at {inc.time}
                              </span>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Care Plan Tab ── */}
      {tab === 'careplan' && (
        <div className="patient-care-plan">
          {!!carePlanLoadError && (
            <div
              role="alert"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {carePlanLoadError}
            </div>
          )}
          {!!carePlanToggleError && (
            <div
              role="alert"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #fecaca',
                background: '#fff7ed',
                color: '#9a3412',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {carePlanToggleError}
            </div>
          )}
          {carePlanLoading && carePlanItems.length === 0 && !carePlanLoadError && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--kh-text-muted)' }}>Loading care plan…</p>
          )}
          <div className="patient-care-plan__card">
            <div className="patient-care-plan__card-bar">
              <div className="patient-care-plan__card-head-static">
                <span className="patient-care-plan__card-bar-title">Care plan</span>
                <span className="patient-care-plan__card-bar-meta">
                  <span>{carePlanCompletedCount} done</span>
                  <span className="patient-care-plan__card-bar-dot" aria-hidden>·</span>
                  <span>{carePlanRemainingCount} open</span>
                  <span className="patient-care-plan__card-bar-dot" aria-hidden>·</span>
                  <span>{carePlanHighOpenCount} high</span>
                  <span className="patient-care-plan__card-bar-dot" aria-hidden>·</span>
                  <span>{carePlanProgress}%</span>
                </span>
              </div>
              <button
                type="button"
                className="patient-care-plan__add-btn patient-care-plan__add-btn--toolbar"
                onClick={() => {
                  setCarePlanSaveError('');
                  setShowCarePlanForm(true);
                  setEditingCarePlan(null);
                  setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
                }}
              >
                <FiPlus size={16} strokeWidth={2.25} aria-hidden />
                Add care item
              </button>
            </div>

            <div className="patient-care-plan__card-panel">
              <p className="patient-care-plan__panel-hint">
                Plan and complete recurring tasks for {p.name}. Filter by category and mark items during visits.
              </p>

              <section className="patient-care-plan__progress-card" aria-label="Overall completion">
                <div className="patient-care-plan__progress-top">
                  <span className="patient-care-plan__progress-label">Overall completion</span>
                  <span className="patient-care-plan__progress-pct">{carePlanProgress}%</span>
                </div>
                <div className="patient-care-plan__progress-track">
                  <div
                    className={`patient-care-plan__progress-fill${carePlanProgress === 100 ? ' is-complete' : ''}`}
                    style={{ width: `${carePlanProgress}%` }}
                  />
                </div>
              </section>

              <div className="patient-care-plan__filters" role="tablist" aria-label="Filter by category">
                {['All', ...CARE_CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={carePlanFilter === cat}
                    className={`patient-care-plan__filter-btn${carePlanFilter === cat ? ' is-active' : ''}`}
                    onClick={() => setCarePlanFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="patient-care-plan__list-block">
                <button
                  type="button"
                  className="patient-care-plan__list-toggle"
                  id="care-plan-list-toggle"
                  aria-expanded={carePlanListExpanded}
                  aria-controls="care-plan-tasks-panel"
                  onClick={() => setCarePlanListExpanded((v) => !v)}
                >
                  <FiChevronDown className={`patient-care-plan__list-chevron${carePlanListExpanded ? ' is-open' : ''}`} size={18} aria-hidden />
                  <span className="patient-care-plan__list-toggle-label">
                    Care tasks
                    <span className="patient-care-plan__list-toggle-count">{filteredCarePlanItems.length}</span>
                  </span>
                  <span className="patient-care-plan__list-toggle-hint">{carePlanListExpanded ? 'Hide list' : 'Show list'}</span>
                </button>
                <div
                  id="care-plan-tasks-panel"
                  role="region"
                  aria-labelledby="care-plan-list-toggle"
                  className="patient-care-plan__list-panel"
                  hidden={!carePlanListExpanded}
                >
          {filteredCarePlanItems.length === 0 ? (
            <div className="patient-care-plan__empty">
              <div className="patient-care-plan__empty-icon">
                <FiClipboard size={28} strokeWidth={2} aria-hidden />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>
                No items {carePlanFilter !== 'All' ? 'in this category' : 'yet'}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--kh-text-muted)', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
                Start building this patient&apos;s plan with repeatable tasks. Use categories and priority to organize what matters most at each visit.
              </p>
            </div>
          ) : (
            <ul className="patient-care-plan__list">
              {filteredCarePlanItems.map((item) => {
                const prStyle = getCarePriorityStyle(item.priority);
                return (
                  <li
                    key={item.id}
                    className={`patient-care-plan__task${item.checked ? ' is-done' : ''}`}
                  >
                    <div className="patient-care-plan__task-inner">
                      <button
                        type="button"
                        className={`patient-care-plan__check${item.checked ? ' is-checked' : ''}`}
                        onClick={() => handleToggleCarePlanItem(item.id)}
                        aria-pressed={item.checked}
                        aria-label={item.checked ? `Mark incomplete: ${item.task}` : `Mark complete: ${item.task}`}
                      >
                        {item.checked ? <FiCheckCircle size={15} strokeWidth={2.5} aria-hidden /> : null}
                      </button>
                      <div className="patient-care-plan__task-body">
                        <p className={`patient-care-plan__task-title${item.checked ? ' is-struck' : ''}`}>
                          {item.task}
                        </p>
                        <div className="patient-care-plan__meta">
                          <span className="patient-care-plan__badge patient-care-plan__badge--cat">
                            {item.category}
                          </span>
                          <span className="patient-care-plan__badge patient-care-plan__badge--freq">
                            <FiClock size={11} aria-hidden />
                            {item.frequency}
                          </span>
                          <span
                            className="patient-care-plan__badge"
                            style={{
                              background: prStyle.bg,
                              color: prStyle.color,
                              borderColor: prStyle.border,
                            }}
                          >
                            {item.priority}
                          </span>
                          <span className="patient-care-plan__task-date">Added {item.createdDate}</span>
                        </div>
                        {item.notes ? (
                          <div className="patient-care-plan__notes">{item.notes}</div>
                        ) : null}
                      </div>
                      <div className="patient-care-plan__task-actions">
                        <button
                          type="button"
                          className="patient-care-plan__task-action"
                          title="Edit"
                          onClick={() => handleEditCarePlanItem(item)}
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="patient-care-plan__task-action patient-care-plan__task-action--danger"
                          title="Delete"
                          onClick={() => setConfirmDeleteCarePlan(item)}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
                </div>
              </div>

          {carePlanItems.length > 0 && (
            <footer className="patient-care-plan__footer">
              <div className="patient-care-plan__footer-stats">
                <span><strong style={{ color: '#15803d' }}>{carePlanCompletedCount}</strong> completed</span>
                <span><strong style={{ color: '#c2410c' }}>{carePlanRemainingCount}</strong> remaining</span>
                <span><strong>{carePlanHighOpenCount}</strong> high priority open</span>
              </div>
              <span className={`patient-care-plan__footer-pct${carePlanProgress === 100 ? ' is-complete' : ''}`}>
                {carePlanProgress}% complete
              </span>
            </footer>
          )}
            </div>

          {showCarePlanForm && (
            <div
              className="kh-modal-overlay patient-care-plan-form-overlay"
              style={{ zIndex: 2100 }}
              onClick={() => {
                if (savingCarePlan) return;
                setShowCarePlanForm(false);
                setEditingCarePlan(null);
                setCarePlanSaveError('');
              }}
              role="presentation"
            >
              <div
                className="patient-care-plan__modal-shell"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="care-plan-modal-title"
              >
                <section className="patient-care-plan__composer patient-care-plan__composer--modal" aria-label={editingCarePlan ? 'Edit care item' : 'Add care item'}>
                  <div className="patient-care-plan__composer-head">
                    <div>
                      <h4 className="patient-care-plan__composer-title" id="care-plan-modal-title">
                        {editingCarePlan ? 'Edit care item' : 'New care item'}
                      </h4>
                      <p className="patient-care-plan__composer-hint">
                        {editingCarePlan ? 'Update task details and save changes.' : 'Describe the task, cadence, and priority so the team can execute consistently.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="patient-care-plan__icon-btn"
                      disabled={savingCarePlan}
                      onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); setCarePlanSaveError(''); }}
                      aria-label="Close form"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  <div className="patient-care-plan__composer-body">
                    <div className="patient-care-plan__field">
                      <label className="patient-care-plan__field-label" htmlFor="care-plan-task">Care task *</label>
                      <input
                        id="care-plan-task"
                        className="patient-care-plan__input"
                        type="text"
                        placeholder="e.g. Morning medications after breakfast"
                        value={carePlanForm.task}
                        onChange={(e) => setCarePlanForm((f) => ({ ...f, task: e.target.value }))}
                      />
                    </div>
                    <div className="patient-care-plan__grid3">
                      <div className="patient-care-plan__field">
                        <label className="patient-care-plan__field-label" htmlFor="care-plan-category">Category</label>
                        <select
                          id="care-plan-category"
                          className="patient-care-plan__select"
                          value={carePlanForm.category}
                          onChange={(e) => setCarePlanForm((f) => ({ ...f, category: e.target.value }))}
                        >
                          {CARE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="patient-care-plan__field">
                        <label className="patient-care-plan__field-label" htmlFor="care-plan-frequency">Frequency</label>
                        <select
                          id="care-plan-frequency"
                          className="patient-care-plan__select"
                          value={carePlanForm.frequency}
                          onChange={(e) => setCarePlanForm((f) => ({ ...f, frequency: e.target.value }))}
                        >
                          {CARE_FREQUENCIES.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div className="patient-care-plan__field">
                        <label className="patient-care-plan__field-label" htmlFor="care-plan-priority">Priority</label>
                        <select
                          id="care-plan-priority"
                          className="patient-care-plan__select"
                          value={carePlanForm.priority}
                          onChange={(e) => setCarePlanForm((f) => ({ ...f, priority: e.target.value }))}
                        >
                          {CARE_PRIORITIES.map((pr) => (
                            <option key={pr} value={pr}>{pr}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="patient-care-plan__field">
                      <label className="patient-care-plan__field-label" htmlFor="care-plan-notes">Description / notes</label>
                      <textarea
                        id="care-plan-notes"
                        className="patient-care-plan__textarea"
                        rows={3}
                        placeholder="Instructions, precautions, or escalation criteria…"
                        value={carePlanForm.notes}
                        onChange={(e) => setCarePlanForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                    {!!carePlanSaveError && (
                      <div
                        className="patient-care-plan__field"
                        style={{ color: '#b91c1c', fontSize: 13, fontWeight: 600 }}
                        role="alert"
                      >
                        {carePlanSaveError}
                      </div>
                    )}
                    <div className="patient-care-plan__composer-actions">
                      <button
                        type="button"
                        className="patient-care-plan__btn-secondary"
                        disabled={savingCarePlan}
                        onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); setCarePlanSaveError(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="patient-care-plan__btn-primary"
                        onClick={handleAddCarePlanItem}
                        disabled={savingCarePlan || !carePlanForm.task.trim()}
                      >
                        <FiCheckCircle size={15} aria-hidden />
                        {savingCarePlan ? 'Saving…' : (editingCarePlan ? 'Save changes' : 'Add to plan')}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ── Care Checklist Status Tab ── */}
      {tab === 'checkliststatus' && (() => {
        const checklistToday = new Date().toISOString().slice(0, 10);
        const summaryTone = selectedDatePercent === 100 ? 'complete' : selectedDatePercent >= 50 ? 'warn' : 'low';
        const completionLbl = getCompletionLabel(selectedDatePercent);
        return (
          <section className="patient-checklist-status" aria-labelledby="patient-checklist-status-title">
            <header className="patient-checklist-status__hero">
              <div className="patient-checklist-status__hero-icon" aria-hidden>
                <FiBarChart2 size={16} />
              </div>
              <div className="patient-checklist-status__hero-text">
                <h2 id="patient-checklist-status-title" className="patient-checklist-status__title">Care Checklist Status</h2>
                <p className="patient-checklist-status__subtitle">Completion for the day you select below.</p>
              </div>
            </header>

            <div className="patient-checklist-status__date-panel">
              <div className="patient-checklist-status__date-primary">
                <label htmlFor="checklist-status-date" className="patient-checklist-status__date-label">Date</label>
                <input
                  id="checklist-status-date"
                  className="patient-checklist-status__date-input"
                  type="date"
                  value={checklistStatusDate}
                  onChange={e => setChecklistStatusDate(e.target.value)}
                  max={checklistToday}
                />
              </div>
              <div className="patient-checklist-status__day-strip" role="group" aria-label="Last seven days">
                {quickDates.map(qd => {
                  const fd = formatShortDate(qd);
                  const isActive = checklistStatusDate === qd;
                  const hasData = Array.isArray(dailyChecklistByDate[qd]?.items);
                  const qdChecklist = getChecklistForDate(qd);
                  const qdPct = qdChecklist ? Math.round((qdChecklist.filter(i => i.completed).length / qdChecklist.length) * 100) : -1;
                  const dayAbbr = fd.day.slice(0, 3);
                  return (
                    <button
                      key={qd}
                      type="button"
                      className={
                        'patient-checklist-status__day-btn'
                        + (isActive ? ' is-active' : '')
                        + (hasData ? '' : ' is-muted')
                      }
                      onClick={() => setChecklistStatusDate(qd)}
                      aria-pressed={isActive}
                    >
                      <span className="patient-checklist-status__day-main">{dayAbbr} {fd.date}</span>
                      <span
                        className={
                          'patient-checklist-status__day-sub'
                          + (!hasData || qdPct < 0 ? ' is-empty' : '')
                          + (hasData && qdPct >= 0
                            ? (qdPct === 100 ? ' is-full' : qdPct >= 50 ? ' is-mid' : ' is-low')
                            : '')
                        }
                      >
                        {hasData && qdPct >= 0 ? `${qdPct}%` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDailyEntry?.loading && selectedDateChecklist == null ? (
              <div className="patient-checklist-status__empty" role="status">
                <p className="patient-checklist-status__empty-title">Loading checklist…</p>
              </div>
            ) : selectedDailyEntry?.error && selectedDateChecklist == null ? (
              <div className="patient-checklist-status__empty" role="alert">
                <p className="patient-checklist-status__empty-title">{selectedDailyEntry.error}</p>
                <p className="patient-checklist-status__empty-hint">Try another date or refresh the page.</p>
              </div>
            ) : selectedDateChecklist ? (
              <>
                <div className="patient-checklist-status__card patient-checklist-status__summary">
                  <div className="patient-checklist-status__summary-main">
                    <div className={`patient-checklist-status__ring patient-checklist-status__ring--${summaryTone}`}>
                      <svg className="patient-checklist-status__ring-svg" width="58" height="58" viewBox="0 0 64 64" aria-hidden>
                        <circle className="patient-checklist-status__ring-track" cx="32" cy="32" r="28" />
                        <circle
                          className="patient-checklist-status__ring-fill"
                          cx="32" cy="32" r="28"
                          strokeDasharray={`${(selectedDatePercent / 100) * 175.9} 175.9`}
                          transform="rotate(-90 32 32)"
                        />
                      </svg>
                      <span className="patient-checklist-status__ring-label">{selectedDatePercent}%</span>
                    </div>
                    <div className="patient-checklist-status__summary-copy">
                      <p className="patient-checklist-status__summary-date">
                        {checklistStatusDate === checklistToday ? 'Today' : checklistStatusDate}
                        {checklistStatusDate === checklistToday && (
                          <span className="patient-checklist-status__summary-date-sub">{checklistStatusDate}</span>
                        )}
                      </p>
                      <span
                        className="patient-checklist-status__pill"
                        style={{
                          background: completionLbl.bg,
                          color: completionLbl.color,
                          borderColor: completionLbl.border,
                        }}
                      >
                        {completionLbl.text}
                      </span>
                    </div>
                  </div>
                  <ul className="patient-checklist-status__stats" aria-label="Completion counts">
                    <li className="patient-checklist-status__stat">
                      <span className="patient-checklist-status__stat-value patient-checklist-status__stat-value--ok">{selectedDateCompleted}</span>
                      <span className="patient-checklist-status__stat-label">Done</span>
                    </li>
                    <li className="patient-checklist-status__stat">
                      <span className="patient-checklist-status__stat-value patient-checklist-status__stat-value--miss">{selectedDateTotal - selectedDateCompleted}</span>
                      <span className="patient-checklist-status__stat-label">Missed</span>
                    </li>
                    <li className="patient-checklist-status__stat">
                      <span className="patient-checklist-status__stat-value">{selectedDateTotal}</span>
                      <span className="patient-checklist-status__stat-label">Total</span>
                    </li>
                  </ul>
                  <div className={`patient-checklist-status__bar-track patient-checklist-status__bar-track--${summaryTone}`}>
                    <div
                      className="patient-checklist-status__bar-fill"
                      style={{ width: `${selectedDatePercent}%` }}
                    />
                  </div>
                </div>

                <div className="patient-checklist-status__card patient-checklist-status__tasks-card">
                  <header className="patient-checklist-status__tasks-head">
                    <h3 className="patient-checklist-status__tasks-title">Checklist items</h3>
                    <span className="patient-checklist-status__tasks-meta">{selectedDateCompleted}/{selectedDateTotal} completed</span>
                  </header>
                  <ul className="patient-checklist-status__task-list">
                    {selectedDateChecklist.map(item => {
                      const prStyle = getCarePriorityStyle(item.priority);
                      return (
                        <li
                          key={item.id}
                          className={`patient-checklist-status__task-row${item.completed ? ' is-done' : ''}`}
                        >
                          <div className={`patient-checklist-status__task-icon${item.completed ? ' is-done' : ' is-miss'}`} aria-hidden>
                            {item.completed ? <FiCheckCircle size={12} /> : <FiX size={11} />}
                          </div>
                          <div className="patient-checklist-status__task-body">
                            <p className="patient-checklist-status__task-name">{item.task}</p>
                            <div className="patient-checklist-status__task-tags">
                              <span className="patient-checklist-status__tag patient-checklist-status__tag--cat">
                                {item.category}
                              </span>
                              <span className="patient-checklist-status__tag patient-checklist-status__tag--freq">
                                <FiClock size={10} aria-hidden /> {item.frequency}
                              </span>
                              <span
                                className="patient-checklist-status__tag patient-checklist-status__tag--pri"
                                style={{
                                  background: prStyle.bg,
                                  color: prStyle.color,
                                  borderColor: prStyle.border,
                                }}
                              >
                                {item.priority}
                              </span>
                            </div>
                          </div>
                          <div className="patient-checklist-status__task-aside">
                            {item.completed ? (
                              <>
                                <span className="patient-checklist-status__aside-status patient-checklist-status__aside-status--ok">Completed</span>
                                <span className="patient-checklist-status__aside-line">
                                  <FiClock size={10} aria-hidden /> {item.completedAt}
                                </span>
                                <span className="patient-checklist-status__aside-line">
                                  <FiUser size={10} aria-hidden /> {item.completedBy}
                                </span>
                              </>
                            ) : (
                              <span className="patient-checklist-status__aside-status patient-checklist-status__aside-status--miss">Missed</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="patient-checklist-status__card patient-checklist-status__trend-card">
                  <h3 className="patient-checklist-status__trend-title">7-day trend</h3>
                  <div className="patient-checklist-status__trend-chart" role="group" aria-label="Select day on chart">
                    {[...quickDates].reverse().map(qd => {
                      const qdData = getChecklistForDate(qd);
                      const qdPct = qdData ? Math.round((qdData.filter(i => i.completed).length / qdData.length) * 100) : 0;
                      const fd = formatShortDate(qd);
                      const isSelected = checklistStatusDate === qd;
                      const trendTone = qdPct === 100 ? 'full' : qdPct >= 50 ? 'mid' : qdPct > 0 ? 'low' : 'empty';
                      return (
                        <button
                          key={qd}
                          type="button"
                          className={`patient-checklist-status__trend-col${isSelected ? ' is-selected' : ''}`}
                          onClick={() => setChecklistStatusDate(qd)}
                          aria-pressed={isSelected}
                          aria-label={`${fd.day} ${fd.date}: ${qdData ? `${qdPct}% complete` : 'no data'}`}
                        >
                          <span
                            className={`patient-checklist-status__trend-pct patient-checklist-status__trend-pct--${trendTone}`}
                          >
                            {qdData ? `${qdPct}%` : '—'}
                          </span>
                          <span
                            className={`patient-checklist-status__trend-bar patient-checklist-status__trend-bar--${trendTone}${isSelected ? ' is-selected' : ''}`}
                            style={{ height: `${Math.max(qdPct * 0.48, 4)}px` }}
                          />
                          <span className="patient-checklist-status__trend-label">{fd.day} {fd.date}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="patient-checklist-status__empty" role="status">
                <FiCalendar className="patient-checklist-status__empty-icon" size={32} aria-hidden />
                <p className="patient-checklist-status__empty-title">No checklist for this date</p>
                <p className="patient-checklist-status__empty-hint">Choose another day or use the chips above when data exists.</p>
              </div>
            )}
          </section>
        );
      })()}

          </div>
        </div>
          </main>
        </div>
      </div>

      {showGenerateReportModal && (
        <div
          className="kh-modal-overlay app-modal-overlay"
          style={{ zIndex: 10000, padding: 16 }}
          onClick={() => setShowGenerateReportModal(false)}
          role="presentation"
        >
          <div
            className="kh-modal-panel app-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-generate-report-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(440px, 94vw)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div className="kh-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
              <div className="d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 800, color: 'var(--kh-text)' }}>
                <FiFileText size={18} style={{ color: '#2E7DB8' }} />
                <span id="patient-generate-report-title">Monthly care report</span>
              </div>
              <button
                type="button"
                className="patient-update-modal__close-btn"
                aria-label="Close"
                onClick={() => setShowGenerateReportModal(false)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="kh-modal-body" style={{ padding: '24px 22px' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--kh-text)', lineHeight: 1.45 }}>
                Generating Patient Monthly Care Report
              </p>
            </div>
            <div className="kh-modal-footer" style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn-kh-primary"
                style={{ borderRadius: 10, fontWeight: 700, padding: '10px 18px' }}
                onClick={() => setShowGenerateReportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && (
        <div
          className="kh-modal-overlay"
          style={{
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => { if (!savingProfileUpdate) setShowUpdateModal(false); }}
        >
          <div
            onClick={event => event.stopPropagation()}
            className="kh-modal-panel"
            style={{
              width: 'min(1120px, 96vw)',
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="kh-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--kh-text)' }}>Edit Patient Data</div>
              </div>
              <button onClick={() => { if (!savingProfileUpdate) setShowUpdateModal(false); }} className="patient-update-modal__close-btn" style={{ cursor: savingProfileUpdate ? 'not-allowed' : 'pointer' }}>
                <FiX size={18} />
              </button>
            </div>

            <div className="kh-modal-body" style={{ overflowY: 'auto' }}>
              {profileUpdateError && (
                <div style={{ marginBottom: 12, borderRadius: 4, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
                  {profileUpdateError}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12"><h6 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#2E7DB8' }}>Personal Info</h6></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Patient ID</label><input disabled className="form-control form-control-kh" value={getProfileUpdateValue('patientId') || ''} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Registration Number</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.registrationNumber') || ''} onChange={event => setProfileUpdateField('personalInfo.registrationNumber', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Date of Assessment</label><input type="date" className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.dateOfAssessment') || ''} onChange={event => setProfileUpdateField('personalInfo.dateOfAssessment', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Date of Admission</label><input type="date" className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.dateOfAdmission') || ''} onChange={event => setProfileUpdateField('personalInfo.dateOfAdmission', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>First Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.firstName') || ''} onChange={event => setProfileUpdateField('personalInfo.firstName', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Last Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.lastName') || ''} onChange={event => setProfileUpdateField('personalInfo.lastName', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Preferred Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.preferredName') || ''} onChange={event => setProfileUpdateField('personalInfo.preferredName', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Contact Number</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.contactNumber') || ''} onChange={event => setProfileUpdateField('personalInfo.contactNumber', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Date of Birth</label><input type="date" className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.dateOfBirth') || ''} onChange={event => setProfileUpdateField('personalInfo.dateOfBirth', event.target.value)} /></div>
                <div className="col-md-1"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Age</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.age') || ''} onChange={event => setProfileUpdateField('personalInfo.age', event.target.value)} /></div>
                <div className="col-md-2"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Gender</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.gender') || ''} onChange={event => setProfileUpdateField('personalInfo.gender', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>GPS Code</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.gpsCode') || ''} onChange={event => setProfileUpdateField('personalInfo.gpsCode', event.target.value)} /></div>
                <div className="col-md-6"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Email</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.email') || ''} onChange={event => setProfileUpdateField('personalInfo.email', event.target.value)} /></div>
                <div className="col-12"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Residential Address</label><input className="form-control form-control-kh" value={getProfileUpdateValue('personalInfo.residentialAddress') || ''} onChange={event => setProfileUpdateField('personalInfo.residentialAddress', event.target.value)} /></div>

                <div className="col-12"><hr style={{ margin: '4px 0', opacity: 0.12 }} /></div>
                <div className="col-12"><h6 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#2E7DB8' }}>Next of Kin / Doctor</h6></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Full Name</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.fullName') || ''} onChange={event => setProfileUpdateField('nextOfKin.fullName', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Relationship</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.relationship') || ''} onChange={event => setProfileUpdateField('nextOfKin.relationship', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Spiritual Need</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.spiritualNeed') || ''} onChange={event => setProfileUpdateField('nextOfKin.spiritualNeed', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Contact One</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.contactOne') || ''} onChange={event => setProfileUpdateField('nextOfKin.contactOne', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Contact Two</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.contactTwo') || ''} onChange={event => setProfileUpdateField('nextOfKin.contactTwo', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Personal Doctor</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.personalDoctor') || ''} onChange={event => setProfileUpdateField('nextOfKin.personalDoctor', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Doctor Contact</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.personalDoctorContact') || ''} onChange={event => setProfileUpdateField('nextOfKin.personalDoctorContact', event.target.value)} /></div>
                <div className="col-12"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Doctor Facility</label><input className="form-control form-control-kh" value={getProfileUpdateValue('nextOfKin.personalDoctorFacility') || ''} onChange={event => setProfileUpdateField('nextOfKin.personalDoctorFacility', event.target.value)} /></div>

                <div className="col-12"><hr style={{ margin: '4px 0', opacity: 0.12 }} /></div>
                <div className="col-12"><h6 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#2E7DB8' }}>Clinical / Vitals Quick Update</h6></div>
                {renderBoolControl('Client Handbook Given', 'admissionChecklist.clientHandBookGiven')}
                {renderBoolControl('Infection Supplies', 'admissionChecklist.infectionControlSupplies')}
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Admitting Nurse</label><input className="form-control form-control-kh" value={getProfileUpdateValue('admissionChecklist.admittingNurse') || ''} onChange={event => setProfileUpdateField('admissionChecklist.admittingNurse', event.target.value)} /></div>
                {renderBoolControl('Any Medical History', 'medicalHistory.anyMedicalHistory')}
                <div className="col-md-8"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Medical History Description</label><input className="form-control form-control-kh" value={getProfileUpdateValue('medicalHistory.medicalHistoryDescription') || ''} onChange={event => setProfileUpdateField('medicalHistory.medicalHistoryDescription', event.target.value)} /></div>
                {renderBoolControl('Communication Needs', 'communicationStyle.anyCommunicationNeeds')}
                {renderBoolControl('Hearing Needs', 'communicationStyle.anyHearingNeeds')}
                {renderBoolControl('Speech Impairment', 'communicationStyle.anySpeechImpairment')}
                {renderBoolControl('Visual Impairment', 'communicationStyle.anyVisualImpairment')}
                {renderBoolControl('Understanding Difficulties', 'communicationStyle.anyUnderstandingDifficulties')}
                {renderBoolControl('Diabetes', 'infectionControl.anyDiabetes')}
                {renderBoolControl('Breathing Difficulty', 'breathPain.anyBreathingDifficulties')}
                {renderBoolControl('Pain Present', 'breathPain.painPresent')}
                {renderBoolControl('Open Wounds', 'skinMobility.skinIntegrity.openWounds')}
                {renderBoolControl('Pressure Ulcer', 'skinMobility.skinIntegrity.pressureUlcer')}
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Pain Location</label><input className="form-control form-control-kh" value={getProfileUpdateValue('breathPain.locationOfPain') || ''} onChange={event => setProfileUpdateField('breathPain.locationOfPain', event.target.value)} /></div>
                <div className="col-md-4"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Pain Score</label><input className="form-control form-control-kh" value={getProfileUpdateValue('breathPain.painScore') || ''} onChange={event => setProfileUpdateField('breathPain.painScore', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Blood Pressure</label><input className="form-control form-control-kh" value={getProfileUpdateValue('initialVitals.bloodPressure') || ''} onChange={event => setProfileUpdateField('initialVitals.bloodPressure', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Blood Sugar</label><input className="form-control form-control-kh" value={getProfileUpdateValue('initialVitals.bloodSugar') || ''} onChange={event => setProfileUpdateField('initialVitals.bloodSugar', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>SpO2</label><input className="form-control form-control-kh" value={getProfileUpdateValue('initialVitals.sp02') || ''} onChange={event => setProfileUpdateField('initialVitals.sp02', event.target.value)} /></div>
                <div className="col-md-3"><label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>Temperature</label><input className="form-control form-control-kh" value={getProfileUpdateValue('initialVitals.temperature') || ''} onChange={event => setProfileUpdateField('initialVitals.temperature', event.target.value)} /></div>
              </div>
            </div>

            <div className="kh-modal-footer patient-update-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowUpdateModal(false)} disabled={savingProfileUpdate} className="patient-update-modal__action-btn patient-update-modal__action-btn--secondary" style={{ cursor: savingProfileUpdate ? 'not-allowed' : 'pointer' }}>
                Cancel
              </button>
              <button onClick={submitProfileUpdates} disabled={savingProfileUpdate} className="patient-update-modal__action-btn patient-update-modal__action-btn--primary" style={{ cursor: savingProfileUpdate ? 'not-allowed' : 'pointer', opacity: savingProfileUpdate ? 0.75 : 1 }}>
                {savingProfileUpdate ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Care Plan Item Modal ── */}
      {confirmDeleteCarePlan && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (deletingCarePlanId) return;
            setConfirmDeleteCarePlan(null);
            setCarePlanDeleteError('');
          }}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destructive-careplan-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="destructive-careplan-title" className="destructive-confirm-dialog__title">
                Delete care plan item
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={Boolean(deletingCarePlanId)}
                onClick={() => {
                  if (deletingCarePlanId) return;
                  setConfirmDeleteCarePlan(null);
                  setCarePlanDeleteError('');
                }}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete this care plan item? It will be removed from the server and this
                patient&apos;s checklist.
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> The task and its description will be
                  permanently deleted.
                </div>
              </div>

              {carePlanDeleteError && (
                <div className="destructive-confirm-dialog__banner-error">{carePlanDeleteError}</div>
              )}

              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiClipboard size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{confirmDeleteCarePlan.task}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {confirmDeleteCarePlan.category} · {confirmDeleteCarePlan.frequency} · {confirmDeleteCarePlan.priority}{' '}
                    priority
                    {/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(confirmDeleteCarePlan.id || '')) ? (
                      <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                        ID {String(confirmDeleteCarePlan.id)}
                      </span>
                    ) : null}
                  </div>
                  {confirmDeleteCarePlan.notes ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                      {String(confirmDeleteCarePlan.notes).length > 200
                        ? `${String(confirmDeleteCarePlan.notes).slice(0, 200)}…`
                        : confirmDeleteCarePlan.notes}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={Boolean(deletingCarePlanId)}
                onClick={() => {
                  setConfirmDeleteCarePlan(null);
                  setCarePlanDeleteError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={Boolean(deletingCarePlanId)}
                onClick={handleDeleteCarePlanItem}
              >
                {deletingCarePlanId ? 'Deleting…' : 'Delete care plan item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal (incident report) ── */}
      {confirmDeleteIncident && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={() => {
            if (incidentDeleteDialogBusy) return;
            setConfirmDeleteIncident(null);
            setIncidentDeleteModalError('');
          }}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destructive-incident-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="destructive-incident-title" className="destructive-confirm-dialog__title">
                Delete incident report
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={incidentDeleteDialogBusy}
                onClick={() => {
                  if (incidentDeleteDialogBusy) return;
                  setConfirmDeleteIncident(null);
                  setIncidentDeleteModalError('');
                }}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete this incident report? This removes it from the patient’s safety record.
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> The incident will be removed from the server and will no longer appear in this list or timeline.
                </div>
              </div>

              {incidentDeleteModalError && (
                <div className="destructive-confirm-dialog__banner-error">{incidentDeleteModalError}</div>
              )}

              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiAlertTriangle size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">
                    {pendingDeleteIncidentDetail?.type || 'Incident'}{' '}
                    <span style={{ fontWeight: 600, color: '#6b7280' }}>
                      · {pendingDeleteIncidentDetail?.severity || '—'}
                    </span>
                  </div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {pendingDeleteIncidentDetail
                      ? `${pendingDeleteIncidentDetail.date || '—'} at ${pendingDeleteIncidentDetail.time || '—'} · ${getIncidentStatusStyle(pendingDeleteIncidentDetail.status).label}`
                      : `ID ${String(confirmDeleteIncident.id).slice(0, 8)}…`}
                  </div>
                  {pendingDeleteIncidentDetail?.description ? (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                      {String(pendingDeleteIncidentDetail.description).length > 200
                        ? `${String(pendingDeleteIncidentDetail.description).slice(0, 200)}…`
                        : pendingDeleteIncidentDetail.description}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={incidentDeleteDialogBusy}
                onClick={() => {
                  setConfirmDeleteIncident(null);
                  setIncidentDeleteModalError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={incidentDeleteDialogBusy}
                onClick={confirmDeleteIncidentAction}
              >
                {incidentDeleteDialogBusy ? 'Deleting…' : 'Delete incident report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal (medication) ── */}
      {confirmDelete && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={() => !deletingMedication && setConfirmDelete(null)}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destructive-med-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="destructive-med-title" className="destructive-confirm-dialog__title">
                Delete medication
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={deletingMedication}
                onClick={() => setConfirmDelete(null)}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete the following medication from this patient?
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> Deleting this medication removes it from the
                  patient profile. Dosing history, reminders tied to this drug, and related context may be{' '}
                  <strong>permanently lost</strong>.
                </div>
              </div>

              {medicationDeleteError && (
                <div className="destructive-confirm-dialog__banner-error">{medicationDeleteError}</div>
              )}

              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiActivity size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{confirmDelete.name}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {confirmDelete.type === 'existing' ? 'On file · saved medication record' : 'Draft · not yet saved to server'}
                  </div>
                </div>
                <button
                  type="button"
                  className="destructive-confirm-dialog__card-action"
                  disabled={deletingMedication}
                  onClick={() => {
                    setConfirmDelete(null);
                    navigate('/dashboard');
                  }}
                >
                  <FiGrid size={14} />
                  Go to dashboard
                </button>
              </div>

              <label className="destructive-confirm-dialog__input-label" htmlFor="med-delete-confirm-input">
                To delete, type the medication name <strong>{confirmDelete.name}</strong> below
              </label>
              <div className="destructive-confirm-dialog__input-wrap">
                <span className="destructive-confirm-dialog__input-icon destructive-confirm-dialog__input-icon--danger" aria-hidden>
                  <FiTrash2 size={16} />
                </span>
                <input
                  id="med-delete-confirm-input"
                  className="destructive-confirm-dialog__input"
                  autoComplete="off"
                  disabled={deletingMedication}
                  placeholder={`Enter ${confirmDelete.name}`}
                  value={medDeleteConfirmInput}
                  onChange={(e) => {
                    setMedDeleteConfirmInput(e.target.value);
                    if (medicationDeleteError) setMedicationDeleteError('');
                  }}
                />
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={deletingMedication}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={
                  deletingMedication || medDeleteConfirmInput.trim() !== String(confirmDelete.name || '').trim()
                }
                onClick={confirmDeleteMed}
              >
                {deletingMedication ? 'Deleting…' : 'Yes, delete medication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
