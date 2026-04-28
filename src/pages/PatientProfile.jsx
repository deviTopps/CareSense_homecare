import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar,
  FiUser, FiHeart, FiActivity, FiShield, FiFileText, FiEdit2,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiThermometer, FiClipboard,
  FiPrinter, FiMoreHorizontal, FiClock, FiPlus, FiX, FiSend, FiRefreshCw,
  FiSearch, FiBell, FiChevronDown, FiChevronRight, FiBarChart2
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

const FlagItem = ({ label, detail }) => (
  <div className="d-flex align-items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--kh-text)', flex: 1 }}>{label}</span>
    <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{detail}</span>
  </div>
);

const TABS = [
  { key: 'chart', label: 'Chart Summary', icon: <FiClipboard size={14} /> },
  { key: 'clinical', label: 'Clinical Assessment', icon: <FiActivity size={14} /> },
  { key: 'vitals', label: 'Vitals', icon: <FiThermometer size={14} /> },
  { key: 'medications', label: 'Medications', icon: <FiFileText size={14} /> },
  { key: 'care', label: 'Lifestyle Records', icon: <FiHeart size={14} /> },
  { key: 'notes', label: 'Nurse Notes', icon: <FiEdit2 size={14} /> },
  { key: 'incidents', label: 'Incident Reports', icon: <FiAlertTriangle size={14} /> },
  { key: 'careplan', label: 'Care Plan', icon: <FiCheckCircle size={14} /> },
  { key: 'checkliststatus', label: 'Checklist Status', icon: <FiBarChart2 size={14} /> },
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

function resolveAgencyId(user) {
  return (
    user?.agencyId
    || user?.agencyID
    || user?.agency?.id
    || user?.agency?._id
    || user?.organizationId
    || user?.organisationId
    || null
  );
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
    agencyId:
      rawPatient?.agencyId
      || rawPatient?.agencyID
      || rawPatient?.agency?._id
      || rawPatient?.agency?.id
      || rawPatient?.organizationId
      || rawPatient?.organisationId
      || null,
    name: fullName || '',
    preferredName: rawPatient?.preferredName || firstName || '',
    age: rawPatient?.age ?? '',
    gender: rawPatient?.gender || '',
    dob: rawPatient?.dateOfBirth || rawPatient?.dob || '',
    dateOfAssessment: rawPatient?.dateOfAssessment || '',
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
    enrolled: rawPatient?.dateOfAdmission || rawPatient?.enrolled || '',
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
  const [profileUpdateForm, setProfileUpdateForm] = useState(() => createPatientUpdateForm(null, effectivePatientId));

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

      const listResponse = await apiFetch('/medications', { method: 'GET' });

      let listPayload = {};
      try {
        listPayload = await listResponse.json();
      } catch {
        listPayload = {};
      }

      if (!listResponse.ok) {
        setAddedMeds(cachedItems);
        return;
      }

      const listItems = extractMedicationList(listPayload)
        .filter(item => medicationBelongsToPatient(item, patientIdValue))
        .map(item => normalizeMedicationRecord(item, { patientId: patientIdValue }))
        .filter(item => item.drug);

      const mergedItems = mergeMedicationRecords([...listItems, ...cachedItems]);
      setAddedMeds(mergedItems);
      setCachedPatientMedications(patientIdValue, mergedItems);
    } catch {
      setAddedMeds(cachedItems);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadMedicationRecords();
  }, [loadMedicationRecords]);

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
  const [vitalRecords, setVitalRecords] = useState([
    { id: 1001, date: '2026-03-24', time: '06:45', bp: '158/102', sugar: '14.2', resp: '24', spo2: '91', pulse: '112', temp: '38.6', weight: '78kg', urinalysis: 'Protein ++', recordedBy: 'Amina Mensah, RN', notes: 'Patient reported feeling dizzy and short of breath upon waking. Elevated BP and tachycardia noted. Blood sugar significantly above target. Low oxygen saturation — supplemental O₂ initiated at 2L via nasal cannula. Fever detected. Physician Dr. Kwesi Asare notified immediately for review.' },
  ]);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [vitalForm, setVitalForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    bp: '', sugar: '', resp: '', spo2: '', pulse: '', temp: '', weight: '', urinalysis: '',
    recordedBy: '', notes: '',
  });
  const [expandedVital, setExpandedVital] = useState(null);

  /* Reminder state */
  const [showReminderForm, setShowReminderForm] = useState(null); // med id
  const [reminderForm, setReminderForm] = useState(createMedicationReminderState());

  /* Nurse Notes state */
  const [nurseNotes, setNurseNotes] = useState([
    { id: 1, date: '2025-01-15', time: '08:30', nurse: 'Amina Mensah, RN', category: 'Assessment', priority: 'Normal', content: 'Patient appears well-rested this morning. Vital signs stable. Reports mild discomfort in lower back, rated 3/10 on pain scale. Administered prescribed analgesic. Will reassess in 2 hours.', pinned: false },
    { id: 2, date: '2025-01-14', time: '14:15', nurse: 'Grace Osei, RN', category: 'Medication', priority: 'High', content: 'Patient experienced mild nausea after afternoon medications. Withheld evening dose of Metformin per physician order. Blood glucose monitored – within normal range (6.8 mmol/L). Physician notified and awaiting further instructions.', pinned: false },
    { id: 3, date: '2025-01-14', time: '09:00', nurse: 'Amina Mensah, RN', category: 'Care Update', priority: 'Normal', content: 'Wound dressing changed on left lower leg. Wound healing well, no signs of infection. Surrounding skin intact. Saline irrigation performed. Fresh sterile dressing applied. Next dressing change scheduled for 16 Jan.', pinned: false },
    { id: 4, date: '2025-01-13', time: '16:45', nurse: 'Kwame Boateng, RN', category: 'Communication', priority: 'Normal', content: 'Spoke with patient\'s daughter (emergency contact) regarding care progress. She expressed satisfaction with care plan. Requested update on next physician visit. Informed her visit is scheduled for 20 Jan.', pinned: false },
    { id: 5, date: '2025-01-13', time: '07:00', nurse: 'Amina Mensah, RN', category: 'Shift Handover', priority: 'Normal', content: 'Night shift report: Patient slept through the night with one bathroom break at 03:00. No falls. Vitals checked at 06:00 – all within normal limits. Morning medications due at 08:00.', pinned: false },
  ]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), nurse: '', category: 'Assessment', priority: 'Normal', content: '' });
  const [noteFilter, setNoteFilter] = useState('All');

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
  const handleAddVital = () => {
    if (!vitalForm.bp && !vitalForm.sugar && !vitalForm.pulse && !vitalForm.temp && !vitalForm.spo2 && !vitalForm.resp && !vitalForm.weight) return;
    const newRecord = { ...vitalForm, id: Date.now() };
    setVitalRecords(prev => [newRecord, ...prev]);
    setVitalForm({
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      bp: '', sugar: '', resp: '', spo2: '', pulse: '', temp: '', weight: '', urinalysis: '',
      recordedBy: '', notes: '',
    });
    setShowVitalForm(false);
  };

  const deleteVitalRecord = (id) => {
    setVitalRecords(prev => prev.filter(r => r.id !== id));
    if (expandedVital === id) setExpandedVital(null);
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
  const handleAddNote = () => {
    if (!noteForm.content.trim()) return;
    const newNote = { ...noteForm, id: Date.now(), pinned: false };
    setNurseNotes(prev => [newNote, ...prev]);
    setNoteForm({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), nurse: '', category: 'Assessment', priority: 'Normal', content: '' });
    setShowNoteForm(false);
  };
  const handleDeleteNote = (id) => {
    setNurseNotes(prev => prev.filter(n => n.id !== id));
  };
  const handlePinNote = (id) => {
    setNurseNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };
  const filteredNotes = nurseNotes
    .filter(n => noteFilter === 'All' || n.category === noteFilter)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getCategoryColor = (cat) => {
    const colors = { Assessment: '#45B6FE', Medication: '#3b82f6', 'Care Update': '#8b5cf6', Communication: '#f59e0b', 'Shift Handover': '#2E7DB8', Incident: '#dc2626', Observation: '#06b6d4', Other: '#6b7280' };
    return colors[cat] || '#6b7280';
  };

  /* ── Incident Report state ── */
  const INCIDENT_TYPES = ['Fall', 'Medication Error', 'Skin Breakdown', 'Behavioral', 'Equipment Failure', 'Missed Visit', 'Injury', 'Allergic Reaction', 'Infection', 'Other'];
  const INCIDENT_SEVERITIES = ['Minor', 'Moderate', 'Serious', 'Critical'];
  const [incidents, setIncidents] = useState([
    { id: 1, date: '2026-03-22', time: '14:05', reportedBy: 'Efua Mensah, RN', type: 'Fall', severity: 'Moderate', location: 'Bedroom — bedside', description: 'Patient slipped during bed-to-chair transfer. Grabbed side rail but lost footing. Assisted to floor safely by nurse. Bruising noted on left hip — no visible fracture. Patient alert and oriented after incident.', immediateAction: 'Ice pack applied to left hip. Vitals checked — BP 142/88, Pulse 92, stable. Patient kept in bed for observation. Physician notified.', witnesses: 'Nurse Efua Mensah', injuryDetails: 'Bruising on left hip, no open wound, no fracture suspected', followUp: 'X-ray ordered to rule out hairline fracture. Fall risk reassessment scheduled. Bed rails raised.', status: 'open', physicianNotified: true, familyNotified: true },
    { id: 2, date: '2026-03-18', time: '10:15', reportedBy: 'Amina Mensah, RN', type: 'Medication Error', severity: 'Minor', location: 'Patient home — living room', description: 'Omeprazole 40mg administered instead of prescribed 20mg during morning medication round. Error identified by nurse upon reviewing medication chart 15 minutes after administration.', immediateAction: 'Patient monitored for 2 hours. No adverse reaction observed. Physician Dr. Kwesi Asare notified immediately. Incident documented.', witnesses: 'Patient (self-report of receiving pill)', injuryDetails: 'No adverse reaction or injury', followUp: 'Double-check protocol reinforced. Medication labels reviewed. No further action needed — single dose overage within safe limits per physician.', status: 'resolved', physicianNotified: true, familyNotified: false },
    { id: 3, date: '2026-03-10', time: '08:30', reportedBy: 'Grace Osei, RN', type: 'Skin Breakdown', severity: 'Moderate', location: 'Patient home — bedroom', description: 'Stage 2 pressure ulcer identified on sacral area during morning personal care. Approximately 3cm x 2cm area of partial-thickness skin loss. Surrounding skin erythematous.', immediateAction: 'Wound cleaned with normal saline. Hydrocolloid dressing applied. Repositioning schedule initiated — every 2 hours. Nutrition assessment requested.', witnesses: 'Nurse Grace Osei', injuryDetails: 'Stage 2 pressure ulcer, sacral area, 3cm x 2cm', followUp: 'Wound care plan initiated. Pressure-relieving mattress requested. Daily wound assessment. Dietitian referral for protein supplementation.', status: 'in-progress', physicianNotified: true, familyNotified: true },
  ]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
    reportedBy: '', type: 'Fall', severity: 'Minor', location: '',
    description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
    physicianNotified: false, familyNotified: false,
  });
  const [incidentFilter, setIncidentFilter] = useState('All');
  const [expandedIncident, setExpandedIncident] = useState(null);

  const handleAddIncident = () => {
    if (!incidentForm.description.trim() || !incidentForm.type) return;
    const newIncident = { ...incidentForm, id: Date.now(), status: 'open' };
    setIncidents(prev => [newIncident, ...prev]);
    setIncidentForm({
      date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
      reportedBy: '', type: 'Fall', severity: 'Minor', location: '',
      description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
      physicianNotified: false, familyNotified: false,
    });
    setShowIncidentForm(false);
  };
  const handleDeleteIncident = (id) => {
    setIncidents(prev => prev.filter(inc => inc.id !== id));
    if (expandedIncident === id) setExpandedIncident(null);
  };
  const handleUpdateIncidentStatus = (id, newSt) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newSt } : inc));
  };
  const filteredIncidents = incidents
    .filter(inc => incidentFilter === 'All' || inc.type === incidentFilter)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getIncidentSeverityStyle = (sev) => {
    const styles = { Minor: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD' }, Moderate: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' }, Serious: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }, Critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' } };
    return styles[sev] || styles.Minor;
  };
  const getIncidentStatusStyle = (st) => {
    const styles = { open: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Open' }, 'in-progress': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'In Progress' }, resolved: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', label: 'Resolved' } };
    return styles[st] || styles.open;
  };

  /* ── Care Plan state ── */
  const CARE_CATEGORIES = ['Personal Care', 'Medication Management', 'Nutrition & Diet', 'Mobility & Exercise', 'Wound Care', 'Monitoring & Vitals', 'Emotional Support', 'Hygiene', 'Safety', 'Therapy', 'Other'];
  const CARE_FREQUENCIES = ['Daily', 'Twice Daily', 'Three Times Daily', 'Weekly', 'Twice Weekly', 'Biweekly', 'Monthly', 'As Needed', 'Once'];
  const CARE_PRIORITIES = ['High', 'Medium', 'Low'];
  const [carePlanItems, setCarePlanItems] = useState([
    { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', notes: 'Patient requires help getting in and out of the tub. Use non-slip mat.', checked: true, createdDate: '2026-03-01' },
    { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', notes: 'Metformin 500mg, Amlodipine 5mg, Aspirin 75mg — after breakfast.', checked: true, createdDate: '2026-03-01' },
    { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', notes: 'Record BP and blood sugar morning and evening. Flag if BP > 140/90 or glucose > 10 mmol/L.', checked: false, createdDate: '2026-03-01' },
    { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', notes: 'Low-sugar, low-sodium meals. Include vegetables and lean protein. Avoid fried foods.', checked: false, createdDate: '2026-03-02' },
    { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', notes: '15–20 minutes gentle walk. Use walking frame. Stop if patient reports dizziness or pain.', checked: false, createdDate: '2026-03-02' },
    { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', notes: 'Clean with normal saline. Apply hydrocolloid dressing. Monitor for signs of infection.', checked: false, createdDate: '2026-03-05' },
    { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', notes: 'Discuss daily news, family updates. Encourage participation in light activities. Monitor mood.', checked: false, createdDate: '2026-03-01' },
    { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', notes: 'Check for loose rugs, wet floors, poor lighting. Ensure grab bars in bathroom are secure.', checked: false, createdDate: '2026-03-03' },
  ]);
  const [showCarePlanForm, setShowCarePlanForm] = useState(false);
  const [carePlanForm, setCarePlanForm] = useState({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
  const [carePlanFilter, setCarePlanFilter] = useState('All');
  const [editingCarePlan, setEditingCarePlan] = useState(null);
  const [confirmDeleteCarePlan, setConfirmDeleteCarePlan] = useState(null);

  const handleAddCarePlanItem = () => {
    if (!carePlanForm.task.trim()) return;
    if (editingCarePlan) {
      setCarePlanItems(prev => prev.map(item => item.id === editingCarePlan ? { ...item, ...carePlanForm } : item));
      setEditingCarePlan(null);
    } else {
      const newItem = { ...carePlanForm, id: Date.now(), checked: false, createdDate: new Date().toISOString().slice(0, 10) };
      setCarePlanItems(prev => [...prev, newItem]);
    }
    setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
    setShowCarePlanForm(false);
  };
  const handleToggleCarePlanItem = (id) => {
    setCarePlanItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };
  const handleDeleteCarePlanItem = () => {
    if (!confirmDeleteCarePlan) return;
    setCarePlanItems(prev => prev.filter(item => item.id !== confirmDeleteCarePlan.id));
    setConfirmDeleteCarePlan(null);
  };
  const handleEditCarePlanItem = (item) => {
    setCarePlanForm({ task: item.task, category: item.category, frequency: item.frequency, priority: item.priority, notes: item.notes });
    setEditingCarePlan(item.id);
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
  const getCarePriorityStyle = (p) => {
    const styles = { High: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }, Medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }, Low: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD' } };
    return styles[p] || styles.Medium;
  };
  const getCareCategoryIcon = (cat) => {
    const icons = { 'Personal Care': '🛁', 'Medication Management': '💊', 'Nutrition & Diet': '🥗', 'Mobility & Exercise': '🚶', 'Wound Care': '🩹', 'Monitoring & Vitals': '📊', 'Emotional Support': '💬', Hygiene: '🧼', Safety: '🛡️', Therapy: '🏥', Other: '📋' };
    return icons[cat] || '📋';
  };

  /* ── Care Checklist Status state ── */
  const [checklistStatusDate, setChecklistStatusDate] = useState(new Date().toISOString().slice(0, 10));
  const [checklistHistory] = useState({
    '2026-03-24': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '07:15' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:05' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:30' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Grace Osei, RN', completedAt: '10:00' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
    ],
    '2026-03-23': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '07:30' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:00' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '09:00' },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:00' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '16:00' },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '10:30' },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Grace Osei, RN', completedAt: '14:00' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '11:00' },
    ],
    '2026-03-22': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '07:45' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '08:10' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:30' },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:15' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '15:00' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
    ],
    '2026-03-21': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '07:20' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '07:55' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '08:00' },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '11:45' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '16:30' },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '09:00' },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '13:30' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '10:00' },
    ],
    '2026-03-20': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '07:00' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:15' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:00' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '15:00' },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '09:30' },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: false, completedBy: null, completedAt: null },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '11:00' },
    ],
  });

  /* Get checklist data for a specific date — use history if available, else fallback to live carePlanItems for today */
  const getChecklistForDate = (dateStr) => {
    if (checklistHistory[dateStr]) return checklistHistory[dateStr];
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr === today) {
      return carePlanItems.map(item => ({
        id: item.id, task: item.task, category: item.category, frequency: item.frequency,
        priority: item.priority, completed: item.checked, completedBy: item.checked ? 'Current Session' : null,
        completedAt: item.checked ? '—' : null,
      }));
    }
    return null;
  };
  const selectedDateChecklist = getChecklistForDate(checklistStatusDate);
  const selectedDateCompleted = selectedDateChecklist ? selectedDateChecklist.filter(i => i.completed).length : 0;
  const selectedDateTotal = selectedDateChecklist ? selectedDateChecklist.length : 0;
  const selectedDatePercent = selectedDateTotal > 0 ? Math.round((selectedDateCompleted / selectedDateTotal) * 100) : 0;
  const getCompletionLabel = (pct) => {
    if (pct === 100) return { text: 'Fully Completed', bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', icon: '✅' };
    if (pct >= 75) return { text: 'Mostly Completed', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: '🔵' };
    if (pct >= 50) return { text: 'Partially Completed', bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: '🟡' };
    if (pct > 0) return { text: 'Minimally Completed', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', icon: '🟠' };
    return { text: 'Not Started', bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '🔴' };
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
    if (!confirmDelete) {
      setMedicationDeleteError('');
      setDeletingMedication(false);
    }
  }, [confirmDelete]);

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
  const latestVitalRecord = vitalRecords[0] || null;
  const latestVitalSummary = latestVitalRecord
    ? `${latestVitalRecord.date} at ${latestVitalRecord.time}`
    : `Admitted ${p.enrolled}`;
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
      <div className="nurse-profile-shell">
        <div className="nurse-profile-topbar">
          <div className="nurse-profile-topbar__left">
            <button onClick={() => navigate('/patients')} className="nurse-profile-icon-btn"><FiArrowLeft size={15} /></button>
            <div className="nurse-profile-breadcrumbs">
              <span>Patients</span>
              <FiChevronRight size={12} />
              <span className="is-current">{p.name}</span>
            </div>
          </div>
          <div className="nurse-profile-topbar__actions">
            <button type="button" title="Print" className="nurse-profile-icon-btn" onClick={() => window.print()}><FiPrinter size={14} /></button>
            <button type="button" title="Edit" className="nurse-profile-icon-btn nurse-profile-icon-btn--primary" onClick={() => setShowUpdateModal(true)}><FiEdit2 size={14} /></button>
            <button type="button" title="Refresh" className="nurse-profile-icon-btn" onClick={loadPatientProfile}><FiRefreshCw size={14} /></button>
          </div>
        </div>

        <div className="nurse-profile-header-card">
          <div className="nurse-profile-header-card__meta">
            <div className="nurse-profile-kicker">Patient profile</div>
            <h2>{p.name}</h2>
            <p>Patient overview with clinical status, care team, vitals, medications, and nursing records in the same layout style as the nurse profile page.</p>
          </div>
          <div className="nurse-profile-header-card__actions">
            <button type="button" className="nurse-profile-primary-btn" onClick={handlePrimaryAction}>
              <span className="nurse-profile-primary-btn__icon"><FiFileText size={14} /></span>
              Generate Report
            </button>
          </div>
        </div>

        <div className="nurse-profile-summary-shell">
          <div className="nurse-profile-summary-grid">
            <div className="nurse-profile-card nurse-profile-card--hero">
              <input type="file" accept="image/*" ref={fileRef} onChange={handlePhoto} style={{ display: 'none' }} />
              <div
                onClick={() => fileRef.current?.click()}
                title="Upload patient photo"
                className="nurse-profile-avatar"
                style={{ background: '#fff' }}
              >
                <img
                  src={avatarDisplaySrc}
                  alt={showAvatarImage ? p.name : 'Default patient profile avatar'}
                  loading="lazy"
                  onError={() => {
                    if (showAvatarImage) setAvatarImageError(true);
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div className="nurse-profile-avatar__overlay">
                  {showAvatarImage
                    ? <>
                        <FiUser size={16} color="#fff" />
                        <span>Update</span>
                      </>
                    : <>
                        <FiUser size={16} color="#fff" />
                        <span>Avatar</span>
                      </>
                  }
                </div>
              </div>

              <div className="nurse-profile-card__title">{p.name}</div>
              <div className="nurse-profile-card__subtitle">{p.email || p.phone || 'No direct contact provided'}</div>
              <div className="nurse-profile-status-row">
                <span className={`nurse-profile-status-badge${patientStatusClass}`}>{patientStatusLabel}</span>
                <span className="nurse-profile-status-badge is-warning">{p.regNo || 'No Reg. No.'}</span>
              </div>
              <div className="nurse-profile-mini-stats">
                <div>
                  <strong>{vitalRecords.length}</strong>
                  <span>Vitals</span>
                </div>
                <div>
                  <strong>{activeMedicationRecords.length}</strong>
                  <span>Meds</span>
                </div>
              </div>
              {photoUploading && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 10, fontWeight: 600 }}>Uploading patient photo...</div>}
              {!photoUploading && photoUploadSuccess && <div style={{ fontSize: 11, color: '#059669', marginTop: 10, fontWeight: 600 }}>{photoUploadSuccess}</div>}
              {!photoUploading && photoUploadError && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 10, fontWeight: 600 }}>{photoUploadError}</div>}
              {!!profileUpdateError && !showUpdateModal && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 10, fontWeight: 600 }}>{profileUpdateError}</div>}
              {!photoUploading && canRefreshStoredPhoto && (
                <button
                  type="button"
                  className="nurse-profile-inline-btn"
                  onClick={handleRefreshStoredPhoto}
                  disabled={photoRefreshLoading}
                  style={{ marginTop: 12, opacity: photoRefreshLoading ? 0.7 : 1, cursor: photoRefreshLoading ? 'not-allowed' : 'pointer' }}
                >
                  {photoRefreshLoading ? 'Refreshing photo...' : 'Refresh stored photo'}
                </button>
              )}
            </div>

            <div className="nurse-profile-card nurse-profile-card--details">
              <div className="nurse-profile-card-heading">Profile Details</div>
              <div className="nurse-profile-info-grid">
                {patientProfileDetails.map((item) => (
                  <div key={item.label} className="nurse-profile-info-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="nurse-profile-card nurse-profile-card--notes">
              <div className="nurse-profile-card-heading nurse-profile-card-heading--with-action">
                <span>Care Highlights</span>
                <button type="button" className="nurse-profile-link-btn" onClick={() => setTab('notes')}>Open notes</button>
              </div>
              <div className="nurse-profile-note-list">
                {patientHighlights.map((item, index) => (
                  <div key={`${item}-${index}`} className="nurse-profile-note-item">• {item}</div>
                ))}
              </div>
              <button type="button" className="nurse-profile-inline-btn" onClick={() => setTab('clinical')}>View clinical assessment</button>
            </div>

            <div className="nurse-profile-card nurse-profile-card--files">
              <div className="nurse-profile-card-heading nurse-profile-card-heading--with-action">
                <span>Quick Access</span>
                <button type="button" className="nurse-profile-link-btn" onClick={() => setTab('chart')}>Open summary</button>
              </div>
              <div className="nurse-profile-doc-list">
                {[
                  { key: 'vitals', label: 'Vitals Records', hint: latestVitalSummary, icon: <FiThermometer size={14} /> },
                  { key: 'medications', label: 'Medication List', hint: `${activeMedicationRecords.length} active items`, icon: <FiFileText size={14} /> },
                  { key: 'notes', label: 'Nurse Notes', hint: `${nurseNotes.length} entries recorded`, icon: <FiEdit2 size={14} /> },
                ].map((item) => (
                  <button key={item.key} type="button" className="nurse-profile-doc-item" onClick={() => setTab(item.key)}>
                    <span className="nurse-profile-doc-item__icon">{item.icon}</span>
                    <span className="nurse-profile-doc-item__content">
                      <strong>{item.label}</strong>
                      <small>{item.hint}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="kh-card nurse-profile-board">
          <div className="nurse-profile-tabs">
            {TABS.map((item) => (
              <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`nurse-profile-tab${tab === item.key ? ' active' : ''}`}>
                {item.icon} {item.label}
                {item.key !== 'chart' && <span className="nurse-profile-tab__dot is-ready" />}
              </button>
            ))}
          </div>

          <div className="nurse-profile-board__content">

      {/* ═══ CHART SUMMARY ═══ */}
      {tab === 'chart' && (
        <>
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
              action={<span style={{ fontSize: 10.5, color: 'var(--kh-text-muted)' }}>On admission</span>}
            >
              {hasInitialVitalsData ? (
                <div className="row g-2">
                  <div className="col-6"><VitalTile label="Blood Pressure" value={p.vitals.bp} flag={parseInt(p.vitals.bp, 10) >= 140} /></div>
                  <div className="col-6"><VitalTile label="Blood Sugar" value={p.vitals.sugar} flag={parseFloat(p.vitals.sugar) > 7} showFlagBorder={false} /></div>
                  <div className="col-6"><VitalTile label="SPO2" value={p.vitals.spo2} /></div>
                  <div className="col-6"><VitalTile label="Pulse" value={p.vitals.pulse ? `${p.vitals.pulse} bpm` : ''} /></div>
                  <div className="col-6"><VitalTile label="Temperature" value={p.vitals.temp} /></div>
                  <div className="col-6"><VitalTile label="Weight" value={p.vitals.weight} /></div>
                </div>
              ) : <NoDataState text="No initial vitals data is available for this patient." />}
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
      {tab === 'vitals' && (
        <div className="row g-3">
          {/* ── Vitals Header ── */}
          <div className="col-lg-12">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#45B6FE', display: 'flex' }}><FiActivity size={15} /></span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>Vitals</span>
                <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginLeft: 4 }}>
                  {vitalRecords.length > 0 ? `Last updated: ${vitalRecords[0].date} at ${vitalRecords[0].time}` : `Admission: ${p.enrolled}`}
                </span>
              </div>
              <button onClick={() => setShowVitalForm(true)} style={{
                padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                background: '#45B6FE', color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <FiPlus size={14} /> Add Vital Record
              </button>
            </div>
          </div>

          {/* ── Add New Vital Record Modal ── */}
          {showVitalForm && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                zIndex: 1700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
              onClick={() => setShowVitalForm(false)}
            >
              <div
                style={{
                  width: 'min(1100px, 96vw)',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
                }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Add vital record"
              >
                <div style={{
                  padding: '12px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  background: '#F0F7FE', borderLeft: '3px solid #45B6FE',
                }}>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7DB8' }}>Record New Vitals</span>
                  </div>
                  <button onClick={() => setShowVitalForm(false)}
                    style={{ background: 'none', border: '1px solid #A8D8FC', borderRadius: 2, padding: '4px 6px', cursor: 'pointer', color: '#45B6FE', display: 'flex' }}>
                    <FiX size={14} />
                  </button>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  {/* Date/Time/Nurse row */}
                  <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Date *</label>
                      <input type="date" value={vitalForm.date} onChange={e => setVitalForm(f => ({ ...f, date: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Time *</label>
                      <input type="time" value={vitalForm.time} onChange={e => setVitalForm(f => ({ ...f, time: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Recorded By</label>
                      <input value={vitalForm.recordedBy} onChange={e => setVitalForm(f => ({ ...f, recordedBy: e.target.value }))} placeholder="Nurse name"
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Notes</label>
                      <input value={vitalForm.notes} onChange={e => setVitalForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..."
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                  </div>

                  {/* Vital fields */}
                  <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                    {[
                      { key: 'bp', label: 'Blood Pressure', placeholder: 'e.g. 130/85' },
                      { key: 'sugar', label: 'Blood Sugar', placeholder: 'e.g. 6.5 mmol/L' },
                      { key: 'spo2', label: 'SPO₂', placeholder: 'e.g. 97%' },
                      { key: 'pulse', label: 'Pulse', placeholder: 'e.g. 78' },
                      { key: 'temp', label: 'Temperature', placeholder: 'e.g. 36.6°C' },
                      { key: 'resp', label: 'Respiration', placeholder: 'e.g. 18' },
                      { key: 'weight', label: 'Weight', placeholder: 'e.g. 82 kg' },
                      { key: 'urinalysis', label: 'Urinalysis', placeholder: 'e.g. Normal' },
                    ].map((field, i) => (
                      <div key={i}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>
                          {field.label}
                        </label>
                        <input value={vitalForm[field.key]} onChange={e => setVitalForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                      </div>
                    ))}
                  </div>

                  {/* Submit row */}
                  <div className="d-flex justify-content-end gap-2">
                    <button onClick={() => setShowVitalForm(false)} style={{
                      padding: '8px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                      background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db',
                    }}>Cancel</button>
                    <button onClick={handleAddVital} style={{
                      padding: '8px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                      background: '#45B6FE', color: '#fff', border: 'none',
                      opacity: (!vitalForm.bp && !vitalForm.sugar && !vitalForm.pulse && !vitalForm.temp && !vitalForm.spo2 && !vitalForm.resp && !vitalForm.weight) ? 0.5 : 1,
                    }}>
                      Save Vital Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Vitals History Table ── */}
          <div className="col-lg-12">
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
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
                      {['Date & Time', 'BP', 'Sugar', 'SPO₂', 'Pulse', 'Temp', 'Resp', 'Weight', 'Recorded By', ''].map((h, i) => (
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
                      <>
                        <tr key={r.id}
                          style={{ background: idx % 2 === 0 ? 'transparent' : '#fafbfc', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => setExpandedVital(expandedVital === r.id ? null : r.id)}
                          onMouseEnter={e => e.currentTarget.style.background = '#F0F7FE'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : '#fafbfc'}
                        >
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{r.date}</div>
                            <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{r.time}</div>
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
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{r.recordedBy || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div className="d-flex align-items-center gap-1">
                              <span style={{ display: 'flex', color: '#45B6FE', cursor: 'pointer' }} title="Expand">
                                {expandedVital === r.id ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); deleteVitalRecord(r.id); }} style={{
                                background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 2,
                              }} title="Delete record"><FiX size={14} /></button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded detail row */}
                        {expandedVital === r.id && (
                          <tr key={`exp-${r.id}`}>
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
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{p.nurse}</td>
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
      )}

      {/* ═══ MEDICATIONS ═══ */}
      {tab === 'medications' && (
        <div className="row g-3">
          <div className="col-lg-12">
            <Panel title="Active Medications" icon={<FiFileText size={14} />} accent="#45B6FE" bodyClassName="patient-medications-panel"
              action={
                <div className="patient-medications-panel__action">
                  <span className="patient-medications-panel__count">{activeMedicationRecords.length} active</span>
                  <button onClick={() => { setShowMedForm(true); setDrugSearch(''); setShowCustomDrug(false); setShowDrugDropdown(false); }} className="patient-medications-panel__add-btn">
                    <FiPlus size={13} /> Add Medication
                  </button>
                </div>
              }
            >
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
            </Panel>
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

      {/* ═══ NURSE NOTES ═══ */}
      {tab === 'notes' && (
        <div>
          {/* Header with Add Note button */}
          <div style={{
            background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
            marginBottom: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderLeft: '3px solid #45B6FE',
            }}>
              <div className="d-flex align-items-center gap-2">
                <FiEdit2 size={15} style={{ color: '#45B6FE' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)' }}>Nurse Notes</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: '#45B6FE', color: '#fff',
                  padding: '2px 8px', borderRadius: 10, marginLeft: 4,
                }}>{nurseNotes.length}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Category filter */}
                <select
                  value={noteFilter}
                  onChange={e => setNoteFilter(e.target.value)}
                  style={{
                    fontSize: 12, padding: '6px 10px', borderRadius: 2,
                    border: '1px solid #d1d5db', color: 'var(--kh-text)', cursor: 'pointer',
                    background: '#fff',
                  }}
                >
                  <option value="All">All Categories</option>
                  {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: showNoteForm ? '#fff' : '#45B6FE',
                    color: showNoteForm ? '#45B6FE' : '#fff',
                    border: showNoteForm ? '1px solid #45B6FE' : 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {showNoteForm ? <><FiX size={13} /> Cancel</> : <><FiPlus size={13} /> Add Note</>}
                </button>
              </div>
            </div>

            {/* Add Note Form */}
            {showNoteForm && (
              <div style={{ padding: '18px', background: '#F0F7FE', borderBottom: '1px solid #e5e7eb' }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCalendar size={11} /> Date
                    </label>
                    <input type="date" value={noteForm.date} onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock size={11} /> Time
                    </label>
                    <input type="time" value={noteForm.time} onChange={e => setNoteForm({ ...noteForm, time: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiUser size={11} /> Nurse
                    </label>
                    <input type="text" placeholder="Nurse name" value={noteForm.nurse} onChange={e => setNoteForm({ ...noteForm, nurse: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4 }}>Category</label>
                    <select value={noteForm.category} onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4 }}>Priority</label>
                    <select value={noteForm.priority} onChange={e => setNoteForm({ ...noteForm, priority: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiEdit2 size={11} /> Note Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter detailed nurse note..."
                    value={noteForm.content}
                    onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3,
                      border: '1px solid #d1d5db', background: '#fff', resize: 'vertical',
                      lineHeight: 1.6,
                    }}
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button onClick={handleAddNote} disabled={!noteForm.content.trim()} style={{
                    padding: '9px 24px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: noteForm.content.trim() ? '#45B6FE' : '#d1d5db',
                    color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FiSend size={13} /> Save Note
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes Timeline */}
          {filteredNotes.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
              padding: '40px 20px', textAlign: 'center',
            }}>
              <FiEdit2 size={32} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                {noteFilter !== 'All' ? `No notes found in "${noteFilter}" category` : 'No nurse notes yet'}
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                Click "Add Note" to create the first nurse note for this patient
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredNotes.map((note, idx) => (
                <div key={note.id} style={{
                  background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
                  overflow: 'hidden', transition: 'box-shadow 0.15s',
                  borderLeft: `3px solid ${getCategoryColor(note.category)}`,
                }}>
                  {/* Note header */}
                  <div style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid #f3f4f6',
                  }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: getCategoryColor(note.category) + '18',
                        color: getCategoryColor(note.category),
                      }}>{note.category}</span>
                      {note.priority === 'High' && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#d97706' }}>
                          High Priority
                        </span>
                      )}
                      {note.priority === 'Urgent' && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fee2e2', color: '#dc2626' }}>
                          Urgent
                        </span>
                      )}
                      {note.pinned && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#e0f2fe', color: '#0284c7' }}>
                          Pinned
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>•</span>
                      <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiCalendar size={11} /> {note.date}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiClock size={11} /> {note.time}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button onClick={() => handlePinNote(note.id)} title={note.pinned ? 'Unpin' : 'Pin'} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 2,
                        color: note.pinned ? '#0284c7' : '#9ca3af', fontSize: 12,
                      }}>
                        <FiAlertCircle size={14} />
                      </button>
                      <button onClick={() => handleDeleteNote(note.id)} title="Delete note" style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 2,
                        color: '#9ca3af', fontSize: 12,
                      }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Note body */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: '#2E7DB8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FiUser size={11} style={{ color: '#fff' }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2E7DB8' }}>{note.nurse || 'Unknown Nurse'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ INCIDENT REPORTS ═══ */}
      {tab === 'incidents' && (
        <div>
          {/* Header */}
          <div style={{
            background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
            marginBottom: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderLeft: '3px solid #dc2626',
            }}>
              <div className="d-flex align-items-center gap-2">
                <FiAlertTriangle size={15} style={{ color: '#dc2626' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)' }}>Incident Reports</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: '#dc2626', color: '#fff',
                  padding: '2px 8px', borderRadius: 10, marginLeft: 4,
                }}>{incidents.length}</span>
                {incidents.filter(i => i.status === 'open').length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626',
                    padding: '2px 8px', borderRadius: 10, border: '1px solid #fecaca',
                  }}>{incidents.filter(i => i.status === 'open').length} Open</span>
                )}
              </div>
              <div className="d-flex align-items-center gap-2">
                <select
                  value={incidentFilter}
                  onChange={e => setIncidentFilter(e.target.value)}
                  style={{
                    fontSize: 12, padding: '6px 10px', borderRadius: 2,
                    border: '1px solid #d1d5db', color: 'var(--kh-text)', cursor: 'pointer',
                    background: '#fff',
                  }}
                >
                  <option value="All">All Types</option>
                  {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={() => setShowIncidentForm(!showIncidentForm)}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: showIncidentForm ? '#fff' : '#dc2626',
                    color: showIncidentForm ? '#dc2626' : '#fff',
                    border: showIncidentForm ? '1px solid #dc2626' : 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {showIncidentForm ? <><FiX size={13} /> Cancel</> : <><FiPlus size={13} /> Report Incident</>}
                </button>
              </div>
            </div>

            {/* Add Incident Form */}
            {showIncidentForm && (
              <div style={{ padding: '18px', background: '#fef8f8', borderBottom: '1px solid #e5e7eb' }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCalendar size={11} /> Date
                    </label>
                    <input type="date" value={incidentForm.date} onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock size={11} /> Time
                    </label>
                    <input type="time" value={incidentForm.time} onChange={e => setIncidentForm({ ...incidentForm, time: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiUser size={11} /> Reported By
                    </label>
                    <input type="text" placeholder="Nurse name" value={incidentForm.reportedBy} onChange={e => setIncidentForm({ ...incidentForm, reportedBy: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Incident Type</label>
                    <select value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Severity</label>
                    <select value={incidentForm.severity} onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      {INCIDENT_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-12">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiMapPin size={11} /> Location of Incident
                    </label>
                    <input type="text" placeholder="e.g. Bedroom — bedside, Bathroom, Kitchen..." value={incidentForm.location} onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiAlertTriangle size={11} /> Incident Description *
                  </label>
                  <textarea rows={3} placeholder="Describe what happened in detail..." value={incidentForm.description}
                    onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiShield size={11} /> Immediate Action Taken
                  </label>
                  <textarea rows={2} placeholder="Describe immediate actions taken..." value={incidentForm.immediateAction}
                    onChange={e => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Witnesses</label>
                    <input type="text" placeholder="Names of any witnesses" value={incidentForm.witnesses}
                      onChange={e => setIncidentForm({ ...incidentForm, witnesses: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-6">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Injury Details</label>
                    <input type="text" placeholder="Describe any injuries (if applicable)" value={incidentForm.injuryDetails}
                      onChange={e => setIncidentForm({ ...incidentForm, injuryDetails: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Follow-Up Plan</label>
                  <textarea rows={2} placeholder="Describe follow-up actions planned..." value={incidentForm.followUp}
                    onChange={e => setIncidentForm({ ...incidentForm, followUp: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                {/* Notification checkboxes */}
                <div className="d-flex gap-4 mb-3">
                  <label style={{ fontSize: 12, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={incidentForm.physicianNotified} onChange={e => setIncidentForm({ ...incidentForm, physicianNotified: e.target.checked })} />
                    <span style={{ fontWeight: 600 }}>Physician Notified</span>
                  </label>
                  <label style={{ fontSize: 12, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={incidentForm.familyNotified} onChange={e => setIncidentForm({ ...incidentForm, familyNotified: e.target.checked })} />
                    <span style={{ fontWeight: 600 }}>Family/Next of Kin Notified</span>
                  </label>
                </div>

                <div className="d-flex justify-content-end">
                  <button onClick={handleAddIncident} disabled={!incidentForm.description.trim()} style={{
                    padding: '9px 24px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: incidentForm.description.trim() ? '#dc2626' : '#d1d5db',
                    color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FiSend size={13} /> Submit Incident Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Incident List */}
          {filteredIncidents.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
              padding: '40px 20px', textAlign: 'center',
            }}>
              <FiAlertTriangle size={32} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                {incidentFilter !== 'All' ? `No incidents found for "${incidentFilter}" type` : 'No incident reports filed'}
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                Click "Report Incident" to file a new incident report for this patient
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredIncidents.map((inc) => {
                const sevStyle = getIncidentSeverityStyle(inc.severity);
                const statStyle = getIncidentStatusStyle(inc.status);
                const isExpanded = expandedIncident === inc.id;
                return (
                  <div key={inc.id} style={{
                    background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
                    overflow: 'hidden', borderLeft: `3px solid ${sevStyle.color}`,
                  }}>
                    {/* Incident header — clickable */}
                    <div
                      onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                      style={{
                        padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <FiChevronRight size={14} style={{ color: 'var(--kh-text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: sevStyle.bg, color: sevStyle.color, border: `1px solid ${sevStyle.border}`,
                          textTransform: 'uppercase', letterSpacing: '0.3px',
                        }}>{inc.severity}</span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        }}>{inc.type}</span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: statStyle.bg, color: statStyle.color, border: `1px solid ${statStyle.border}`,
                          textTransform: 'capitalize',
                        }}>{statStyle.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>•</span>
                        <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiCalendar size={11} /> {inc.date}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiClock size={11} /> {inc.time}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: 11.5, color: '#2E7DB8', fontWeight: 600 }}>{inc.reportedBy || 'Unknown'}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteIncident(inc.id); }} title="Delete incident" style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 2,
                          color: '#9ca3af', fontSize: 12,
                        }}>
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ padding: '16px 18px' }}>
                        {/* Description */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#dc2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiAlertTriangle size={11} /> Incident Description
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{inc.description}</div>
                        </div>

                        {/* Location & Witnesses */}
                        <div className="row g-2 mb-3">
                          {inc.location && (
                            <div className="col-md-6">
                              <div style={{ padding: '10px 14px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--kh-text-muted)', marginBottom: 3 }}>Location</div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 5 }}><FiMapPin size={12} style={{ color: '#2E7DB8' }} /> {inc.location}</div>
                              </div>
                            </div>
                          )}
                          {inc.witnesses && (
                            <div className="col-md-6">
                              <div style={{ padding: '10px 14px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--kh-text-muted)', marginBottom: 3 }}>Witnesses</div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 5 }}><FiUser size={12} style={{ color: '#2E7DB8' }} /> {inc.witnesses}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Injury Details */}
                        {inc.injuryDetails && (
                          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 2, background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#dc2626', marginBottom: 3 }}>Injury Details</div>
                            <div style={{ fontSize: 12.5, color: '#991b1b', lineHeight: 1.5 }}>{inc.injuryDetails}</div>
                          </div>
                        )}

                        {/* Immediate Action */}
                        {inc.immediateAction && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7DB8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiShield size={11} /> Immediate Action Taken
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, padding: '10px 14px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #d1fae5' }}>{inc.immediateAction}</div>
                          </div>
                        )}

                        {/* Follow-Up Plan */}
                        {inc.followUp && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563eb', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiClipboard size={11} /> Follow-Up Plan
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, padding: '10px 14px', borderRadius: 2, background: '#eff6ff', border: '1px solid #bfdbfe' }}>{inc.followUp}</div>
                          </div>
                        )}

                        {/* Notification flags & status controls */}
                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div className="d-flex gap-2">
                            {inc.physicianNotified && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: '#F0F7FE', color: '#1565A0', border: '1px solid #BAE0FD', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiCheckCircle size={11} /> Physician Notified
                              </span>
                            )}
                            {inc.familyNotified && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: '#F0F7FE', color: '#1565A0', border: '1px solid #BAE0FD', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiCheckCircle size={11} /> Family Notified
                              </span>
                            )}
                            {!inc.physicianNotified && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiAlertCircle size={11} /> Physician Not Notified
                              </span>
                            )}
                          </div>
                          {inc.status !== 'resolved' && (
                            <div className="d-flex gap-2">
                              {inc.status === 'open' && (
                                <button onClick={() => handleUpdateIncidentStatus(inc.id, 'in-progress')} style={{
                                  padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                                  background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                  <FiClock size={12} /> Mark In Progress
                                </button>
                              )}
                              <button onClick={() => handleUpdateIncidentStatus(inc.id, 'resolved')} style={{
                                padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                                background: '#45B6FE', color: '#fff', border: 'none',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <FiCheckCircle size={12} /> Resolve
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reported by footer */}
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', background: '#991b1b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <FiUser size={11} style={{ color: '#fff' }} />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#991b1b' }}>Reported by {inc.reportedBy || 'Unknown'}</span>
                          <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>on {inc.date} at {inc.time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Care Plan Tab ── */}
      {tab === 'careplan' && (
        <div style={{ padding: '0 2px' }}>

          {/* Header & Progress */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>
                <FiCheckCircle size={15} style={{ color: '#45B6FE', marginRight: 6, verticalAlign: -2 }} />
                Care Plan
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginTop: 2 }}>Custom care checklist for this patient — {carePlanItems.filter(i => i.checked).length} of {carePlanItems.length} completed</div>
            </div>
            <button onClick={() => { setShowCarePlanForm(true); setEditingCarePlan(null); setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' }); }} style={{
              padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
              background: '#45B6FE', color: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <FiPlus size={14} /> Add Care Item
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ background: '#f3f4f6', borderRadius: 2, height: 8, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{
              width: `${carePlanProgress}%`, height: '100%', borderRadius: 2,
              background: carePlanProgress === 100 ? '#45B6FE' : 'linear-gradient(90deg, #45B6FE, #2E7DB8)',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Category Filter */}
          <div className="d-flex align-items-center gap-2 mb-3" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {['All', ...CARE_CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setCarePlanFilter(cat)} style={{
                padding: '5px 14px', fontSize: 11.5, fontWeight: 600, borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap',
                background: carePlanFilter === cat ? '#45B6FE' : '#fff',
                color: carePlanFilter === cat ? '#fff' : 'var(--kh-text-muted)',
                border: `1px solid ${carePlanFilter === cat ? '#45B6FE' : '#e5e7eb'}`,
              }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Add / Edit Care Item Form */}
          {showCarePlanForm && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 5, padding: 20, marginBottom: 16 }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--kh-text)' }}>
                  {editingCarePlan ? 'Edit Care Item' : 'Add New Care Item'}
                </div>
                <button onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <FiX size={16} style={{ color: 'var(--kh-text-muted)' }} />
                </button>
              </div>

              {/* Task description */}
              <div className="mb-3">
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Care Task *</label>
                <input
                  type="text" placeholder="Describe the care task to be administered..."
                  value={carePlanForm.task} onChange={e => setCarePlanForm(f => ({ ...f, task: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none' }}
                />
              </div>

              <div className="row g-2 mb-3">
                {/* Category */}
                <div className="col-md-4">
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    value={carePlanForm.category} onChange={e => setCarePlanForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', background: '#fff' }}
                  >
                    {CARE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Frequency */}
                <div className="col-md-4">
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Frequency</label>
                  <select
                    value={carePlanForm.frequency} onChange={e => setCarePlanForm(f => ({ ...f, frequency: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', background: '#fff' }}
                  >
                    {CARE_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Priority */}
                <div className="col-md-4">
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Priority</label>
                  <select
                    value={carePlanForm.priority} onChange={e => setCarePlanForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', background: '#fff' }}
                  >
                    {CARE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-3">
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Additional Notes</label>
                <textarea
                  rows={2} placeholder="Any additional instructions or details..."
                  value={carePlanForm.notes} onChange={e => setCarePlanForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Form actions */}
              <div className="d-flex gap-2 justify-content-end">
                <button onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); }} style={{
                  padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db',
                }}>Cancel</button>
                <button onClick={handleAddCarePlanItem} style={{
                  padding: '8px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#45B6FE', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                  opacity: !carePlanForm.task.trim() ? 0.5 : 1,
                }}>
                  <FiCheckCircle size={13} /> {editingCarePlan ? 'Save Changes' : 'Add to Plan'}
                </button>
              </div>
            </div>
          )}

          {/* Care Plan Checklist */}
          {filteredCarePlanItems.length === 0 ? (
            <div className="text-center py-5">
              <FiCheckCircle size={36} style={{ color: '#e5e7eb', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text-muted)' }}>No care items {carePlanFilter !== 'All' ? 'in this category' : 'yet'}</div>
              <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 4 }}>Click "Add Care Item" to build this patient's care plan</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filteredCarePlanItems.map(item => {
                const prStyle = getCarePriorityStyle(item.priority);
                return (
                  <div key={item.id} style={{
                    background: item.checked ? '#fafafa' : '#fff',
                    border: `1px solid ${item.checked ? '#e5e7eb' : '#e5e7eb'}`,
                    borderRadius: 2, padding: '14px 16px',
                    borderLeft: `3px solid ${item.checked ? '#d1d5db' : prStyle.color}`,
                    transition: 'all 0.2s ease',
                    opacity: item.checked ? 0.7 : 1,
                  }}>
                    <div className="d-flex align-items-start gap-3">
                      {/* Checkbox */}
                      <div
                        onClick={() => handleToggleCarePlanItem(item.id)}
                        style={{
                          width: 22, height: 22, borderRadius: 2, flexShrink: 0, cursor: 'pointer', marginTop: 1,
                          border: item.checked ? 'none' : '2px solid #d1d5db',
                          background: item.checked ? '#45B6FE' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {item.checked && <FiCheckCircle size={14} style={{ color: '#fff' }} />}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span style={{
                            fontSize: 13.5, fontWeight: 600, color: item.checked ? 'var(--kh-text-muted)' : 'var(--kh-text)',
                            textDecoration: item.checked ? 'line-through' : 'none',
                          }}>
                            {item.task}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ marginTop: 6 }}>
                          {/* Category badge */}
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
                            background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #dcfce7',
                          }}>
                            {getCareCategoryIcon(item.category)} {item.category}
                          </span>

                          {/* Frequency badge */}
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
                            background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
                          }}>
                            <FiClock size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{item.frequency}
                          </span>

                          {/* Priority badge */}
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
                            background: prStyle.bg, color: prStyle.color, border: `1px solid ${prStyle.border}`,
                          }}>
                            {item.priority}
                          </span>

                          {/* Created date */}
                          <span style={{ fontSize: 10.5, color: 'var(--kh-text-muted)' }}>
                            Added {item.createdDate}
                          </span>
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <div style={{
                            fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 8,
                            padding: '8px 12px', background: '#f9fafb', borderRadius: 2,
                            borderLeft: '2px solid #e5e7eb', lineHeight: 1.5,
                          }}>
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                        <button onClick={() => handleEditCarePlanItem(item)} title="Edit" style={{
                          width: 30, height: 30, borderRadius: 2, border: 'none', cursor: 'pointer',
                          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FiEdit2 size={13} style={{ color: 'var(--kh-text-muted)' }} />
                        </button>
                        <button onClick={() => setConfirmDeleteCarePlan(item)} title="Delete" style={{
                          width: 30, height: 30, borderRadius: 2, border: 'none', cursor: 'pointer',
                          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FiX size={14} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary footer */}
          {carePlanItems.length > 0 && (
            <div className="d-flex align-items-center justify-content-between mt-3 px-1" style={{ paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
              <div className="d-flex align-items-center gap-3">
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>
                  <strong style={{ color: '#45B6FE' }}>{carePlanItems.filter(i => i.checked).length}</strong> completed
                </span>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>
                  <strong style={{ color: '#d97706' }}>{carePlanItems.filter(i => !i.checked).length}</strong> remaining
                </span>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>
                  <strong>{carePlanItems.filter(i => i.priority === 'High' && !i.checked).length}</strong> high priority
                </span>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: carePlanProgress === 100 ? '#45B6FE' : '#2E7DB8',
              }}>
                {carePlanProgress}% Complete
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Care Checklist Status Tab ── */}
      {tab === 'checkliststatus' && (
        <div style={{ padding: '0 2px' }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>
                <FiBarChart2 size={15} style={{ color: '#45B6FE', marginRight: 6, verticalAlign: -2 }} />
                Care Checklist Status
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginTop: 2 }}>Track daily care checklist completion — select a date to review</div>
            </div>
          </div>

          {/* Date Picker & Quick Nav */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 5, padding: 16, marginBottom: 16 }}>
            <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Select Date</label>
                <input
                  type="date" value={checklistStatusDate}
                  onChange={e => setChecklistStatusDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  style={{ padding: '8px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Quick Select — Last 7 Days</label>
                <div className="d-flex gap-1 flex-wrap">
                  {quickDates.map(qd => {
                    const fd = formatShortDate(qd);
                    const isActive = checklistStatusDate === qd;
                    const hasData = !!checklistHistory[qd] || qd === new Date().toISOString().slice(0, 10);
                    const qdChecklist = getChecklistForDate(qd);
                    const qdPct = qdChecklist ? Math.round((qdChecklist.filter(i => i.completed).length / qdChecklist.length) * 100) : -1;
                    return (
                      <button key={qd} onClick={() => setChecklistStatusDate(qd)} style={{
                        padding: '6px 10px', borderRadius: 2, cursor: 'pointer', textAlign: 'center', minWidth: 52,
                        background: isActive ? '#45B6FE' : '#fff',
                        color: isActive ? '#fff' : hasData ? 'var(--kh-text)' : 'var(--kh-text-muted)',
                        border: `1px solid ${isActive ? '#45B6FE' : '#e5e7eb'}`,
                        opacity: hasData ? 1 : 0.5,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{fd.day}</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{fd.date}</div>
                        <div style={{ fontSize: 9.5, fontWeight: 500 }}>{fd.month}</div>
                        {hasData && qdPct >= 0 && (
                          <div style={{
                            fontSize: 9, fontWeight: 700, marginTop: 2,
                            color: isActive ? 'rgba(255,255,255,0.85)' : qdPct === 100 ? '#1565A0' : qdPct >= 50 ? '#d97706' : '#dc2626',
                          }}>{qdPct}%</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary Card */}
          {selectedDateChecklist ? (
            <>
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 5, padding: 20, marginBottom: 16,
              }}>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-3">
                    {/* Circular progress */}
                    <div style={{ position: 'relative', width: 64, height: 64 }}>
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                        <circle cx="32" cy="32" r="28" fill="none"
                          stroke={selectedDatePercent === 100 ? '#45B6FE' : selectedDatePercent >= 50 ? '#d97706' : '#dc2626'}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${(selectedDatePercent / 100) * 175.9} 175.9`}
                          transform="rotate(-90 32 32)" style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 800,
                        color: selectedDatePercent === 100 ? '#45B6FE' : selectedDatePercent >= 50 ? '#d97706' : '#dc2626',
                      }}>{selectedDatePercent}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--kh-text)' }}>
                        {checklistStatusDate === new Date().toISOString().slice(0, 10) ? 'Today' : checklistStatusDate}
                      </div>
                      <div style={{
                        display: 'inline-block', fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 2, marginTop: 4,
                        background: getCompletionLabel(selectedDatePercent).bg,
                        color: getCompletionLabel(selectedDatePercent).color,
                        border: `1px solid ${getCompletionLabel(selectedDatePercent).border}`,
                      }}>
                        {getCompletionLabel(selectedDatePercent).icon} {getCompletionLabel(selectedDatePercent).text}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-4">
                    <div className="text-center">
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#45B6FE' }}>{selectedDateCompleted}</div>
                      <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Completed</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{selectedDateTotal - selectedDateCompleted}</div>
                      <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Missed</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--kh-text)' }}>{selectedDateTotal}</div>
                      <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Total</div>
                    </div>
                  </div>
                </div>

                {/* Full-width progress bar */}
                <div style={{ background: '#f3f4f6', borderRadius: 2, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${selectedDatePercent}%`, height: '100%', borderRadius: 2,
                    background: selectedDatePercent === 100 ? '#45B6FE' : selectedDatePercent >= 50 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #dc2626, #ef4444)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Checklist Items for Selected Date */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>Checklist Items</span>
                    <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', fontWeight: 600 }}>{selectedDateCompleted}/{selectedDateTotal} completed</span>
                  </div>
                </div>

                {selectedDateChecklist.map((item, idx) => {
                  const prStyle = getCarePriorityStyle(item.priority);
                  return (
                    <div key={item.id} style={{
                      padding: '14px 16px', borderBottom: idx < selectedDateChecklist.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: item.completed ? '#fafffe' : '#fff',
                    }}>
                      <div className="d-flex align-items-start gap-3">
                        {/* Status icon */}
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                          background: item.completed ? '#45B6FE' : '#fef2f2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {item.completed
                            ? <FiCheckCircle size={13} style={{ color: '#fff' }} />
                            : <FiX size={12} style={{ color: '#dc2626' }} />
                          }
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{item.task}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap" style={{ marginTop: 5 }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 2,
                              background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #dcfce7',
                            }}>
                              {getCareCategoryIcon(item.category)} {item.category}
                            </span>
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 2,
                              background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
                            }}>
                              <FiClock size={9} style={{ marginRight: 2, verticalAlign: -1 }} />{item.frequency}
                            </span>
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 2,
                              background: prStyle.bg, color: prStyle.color, border: `1px solid ${prStyle.border}`,
                            }}>
                              {item.priority}
                            </span>
                          </div>
                        </div>

                        {/* Completion detail */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {item.completed ? (
                            <>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#45B6FE' }}>Completed</div>
                              <div style={{ fontSize: 10.5, color: 'var(--kh-text-muted)', marginTop: 2 }}>
                                <FiClock size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{item.completedAt}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--kh-text-muted)', marginTop: 1 }}>
                                <FiUser size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{item.completedBy}
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626' }}>Missed</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 7-Day Trend */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 5, padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 12 }}>7-Day Completion Trend</div>
                <div className="d-flex align-items-end gap-2" style={{ height: 80 }}>
                  {[...quickDates].reverse().map(qd => {
                    const qdData = getChecklistForDate(qd);
                    const qdPct = qdData ? Math.round((qdData.filter(i => i.completed).length / qdData.length) * 100) : 0;
                    const fd = formatShortDate(qd);
                    const isSelected = checklistStatusDate === qd;
                    return (
                      <div key={qd} className="d-flex flex-column align-items-center" style={{ flex: 1, cursor: 'pointer' }} onClick={() => setChecklistStatusDate(qd)}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: qdPct === 100 ? '#45B6FE' : qdPct >= 50 ? '#d97706' : qdPct > 0 ? '#dc2626' : '#d1d5db', marginBottom: 4 }}>
                          {qdData ? `${qdPct}%` : '—'}
                        </div>
                        <div style={{
                          width: '100%', borderRadius: '2px 2px 0 0', minHeight: 4,
                          height: `${Math.max(qdPct * 0.6, 4)}px`,
                          background: isSelected
                            ? '#45B6FE'
                            : qdPct === 100 ? '#BAE0FD' : qdPct >= 50 ? '#fde68a' : qdPct > 0 ? '#fecaca' : '#f3f4f6',
                          border: isSelected ? '2px solid #45B6FE' : 'none',
                          transition: 'all 0.3s ease',
                        }} />
                        <div style={{
                          fontSize: 10, fontWeight: isSelected ? 700 : 500, marginTop: 4,
                          color: isSelected ? '#45B6FE' : 'var(--kh-text-muted)',
                        }}>{fd.day} {fd.date}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-5" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 5 }}>
              <FiCalendar size={36} style={{ color: '#e5e7eb', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text-muted)' }}>No checklist data for this date</div>
              <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 4 }}>Select a date with recorded care activity to view completion status</div>
            </div>
          )}
        </div>
      )}

          </div>
        </div>
      </div>

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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setConfirmDeleteCarePlan(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 2, width: 400, maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                <FiAlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Remove Care Item</div>
                <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 1 }}>This action cannot be undone</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, color: 'var(--kh-text)', lineHeight: 1.6, marginBottom: 16 }}>
                Are you sure you want to remove <strong style={{ color: '#dc2626' }}>{confirmDeleteCarePlan.task}</strong> from the care plan?
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button onClick={() => setConfirmDeleteCarePlan(null)} style={{
                  padding: '9px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db',
                }}>Cancel</button>
                <button onClick={handleDeleteCarePlanItem} style={{
                  padding: '9px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#dc2626', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <FiX size={13} /> Remove Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={() => setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 16, width: 380, maxWidth: '100%',
            boxShadow: '0 24px 50px rgba(15, 23, 42, 0.16)', padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                <FiAlertTriangle size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--kh-text)' }}>Delete Medication</div>
                <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', marginTop: 4 }}>This action cannot be undone.</div>
              </div>
            </div>

            {medicationDeleteError && (
              <div style={{ marginBottom: 14, borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>
                {medicationDeleteError}
              </div>
            )}

            <div style={{ fontSize: 13.5, color: 'var(--kh-text)', lineHeight: 1.6, marginBottom: 20 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--kh-text)' }}>{confirmDelete.name}</strong> from the medication list?
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e5e7eb', marginBottom: 20 }}>
              <div className="d-flex align-items-center gap-2">
                <FiAlertCircle size={13} style={{ color: 'var(--kh-text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>The medication and its reminders will be removed from this profile.</span>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button onClick={() => setConfirmDelete(null)} style={{
                padding: '10px 18px', fontSize: 12.5, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
                background: '#fff', color: 'var(--kh-text)', border: '1px solid #d1d5db',
              }} disabled={deletingMedication}>Cancel</button>
              <button onClick={confirmDeleteMed} style={{
                padding: '10px 18px', fontSize: 12.5, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
                background: '#dc2626', color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', gap: 6, opacity: deletingMedication ? 0.7 : 1,
              }}>
                <FiX size={13} /> {deletingMedication ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
