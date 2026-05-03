import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiChevronRight, FiChevronLeft, FiChevronsLeft, FiChevronsRight, FiArrowUp, FiArrowDown, FiUpload, FiX, FiCheck, FiSave, FiArrowRight, FiAlertCircle, FiClock, FiEdit, FiTrash2, FiUsers } from '../icons/hugeicons-feather';
import { apiFetch, isTokenValid } from '../api';

const ROLE_LABELS = { head_nurse: 'Head Nurse', supervising_nurse: 'Supervising Nurse', office_nurse: 'Office Nurse', field_nurse: 'Field Nurse' };

// Track fully-completed nurse registrations locally so we don't depend on API field presence
const getCompletedNurseIds = () => { try { return new Set(JSON.parse(localStorage.getItem('completedNurseIds') || '[]')); } catch { return new Set(); } };
const markNurseComplete = (id) => { const s = getCompletedNurseIds(); s.add(id); localStorage.setItem('completedNurseIds', JSON.stringify([...s])); };

const ROWS_OPTIONS = [5, 10, 15];

const NURSE_ENDPOINTS = {
  list: '/nurses',
  deleteById: '/nurses',
  createPersonal: '/nurses/create/personal-info',
  createDiversity: '/nurses/create/diversity-info',
  createEducation: '/nurses/create/education-info',
  createSupporting: '/nurses/create/supporting-info',
  addDocuments: '/nurses/add/documents',
};

const STEPS = [
  { key: 'personal',   label: 'Personal Info',          endpoint: NURSE_ENDPOINTS.createPersonal },
  { key: 'diversity',  label: 'Diversity Info',           endpoint: NURSE_ENDPOINTS.createDiversity },
  { key: 'education',  label: 'Education & Employment',   endpoint: NURSE_ENDPOINTS.createEducation },
  { key: 'supporting', label: 'Supporting Info',          endpoint: NURSE_ENDPOINTS.createSupporting },
  { key: 'documents',  label: 'Documents',                endpoint: NURSE_ENDPOINTS.addDocuments },
];

const DOCUMENT_TYPES = [
  { key: 'cv',          label: 'CV / Resume',                  required: false },
  { key: 'nationalId',  label: 'National ID / Passport',       required: false },
  { key: 'certificate', label: 'Professional Certificate',     required: false },
  { key: 'training',    label: 'Training Certificate',         required: false },
  { key: 'reference',   label: 'Reference Letter',             required: false },
  { key: 'dbs',         label: 'DBS / Criminal Record Check',  required: false },
];

const DOCUMENT_TYPE_MAP = {
  cv: 'Other',
  nationalId: 'ID',
  certificate: 'Certificate',
  training: 'Certificate',
  reference: 'Other',
  dbs: 'Certificate',
};

const emptyQualification = { name: '', institution: '', result: '', year: '' };
const emptyEmployment = { employerName: '', address: '', businessType: '', jobTitle: '', startDate: '', grade: '', reportingOfficer: '', reasonForLeaving: '', descriptionOfDuties: '', contactPerson: '' };
const emptyReferee = { name: '', address: '', telephone: '' };

const extractUrlFromPayload = (payload) => {
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
};

const extractNurseProfileImage = (nurse) => {
  const profileImage = nurse?.profileImage || nurse?.profilePicture || nurse?.image || nurse?.photo || {};
  const documents = Array.isArray(nurse?.documents) ? nurse.documents : [];

  const profileDoc = documents.find((doc) => {
    const documentType = String(doc?.documentType || '').toLowerCase();
    return documentType.includes('profile') || documentType.includes('photo') || documentType.includes('avatar');
  }) || null;

  return {
    url:
      profileImage?.link?.url
      || profileImage?.url
      || nurse?.profileImageUrl
      || nurse?.profilePictureUrl
      || nurse?.imageUrl
      || nurse?.photoUrl
      || nurse?.avatarUrl
      || profileDoc?.link?.url
      || profileDoc?.url
      || null,
    objectKey:
      profileImage?.objectKey
      || nurse?.profileImageObjectKey
      || nurse?.profilePictureObjectKey
      || profileDoc?.objectKey
      || null,
    mediaId:
      profileImage?.mediaId
      || profileImage?.media?.id
      || nurse?.profileImageMediaId
      || nurse?.profilePictureMediaId
      || profileDoc?.mediaId
      || profileDoc?.media?.id
      || null,
  };
};

const initialFormState = {
  // Step 1 — Personal Info
  title: '', lastName: '', firstName: '', gender: '', email: '', address: '', mmcPinNo: '', phone: '', homeTelephone: '', dateOfBirh: '', jobReference: '', jobTitle: '', citizenship: 'Ghana', role: 'field_nurse', password: '',
  // Step 2 — Diversity Info
  race: '', religion: '', disability: 'No', disability_detail: '', criminal_records: 'No', criminal_record_detail: '',
  // Step 3 — Education & Employment
  qualifications: [{ ...emptyQualification }],
  trainingCourses: [''],
  employmentHistory: [{ ...emptyEmployment }],
  // Step 4 — Supporting Info
  staffRelation: 'No', staffRelationDetail: '', vacancyAdvertised: '', vacancyDetail: {},
  referees: [{ ...emptyReferee }, { ...emptyReferee }],
  // Step 5 — Documents
  documents: {},  // { [docKey]: File }
};

export default function Workforce() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarLoadErrors, setAvatarLoadErrors] = useState({});

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

  const resolveNurseProfilePhotoUrl = useCallback(async (nurseSummary) => {
    const directProfileImage = extractNurseProfileImage(nurseSummary);
    const directUrl = directProfileImage.url || await resolveStoredMediaUrl({
      mediaId: directProfileImage.mediaId,
      objectKey: directProfileImage.objectKey,
    });

    if (directUrl) return directUrl;

    const nurseId = nurseSummary?._id || nurseSummary?.id;
    if (!nurseId) return null;

    try {
      const detailResponse = await apiFetch(`/nurses/${nurseId}`);
      if (!detailResponse.ok) return null;

      const detailPayload = await detailResponse.json().catch(() => null);
      const detailedNurse = detailPayload?.personal || detailPayload?.nurse || detailPayload;
      const detailedProfileImage = extractNurseProfileImage({
        ...detailPayload,
        ...(detailedNurse ? { personal: detailedNurse } : {}),
        documents: detailPayload?.documents || detailedNurse?.documents || [],
      });

      return detailedProfileImage.url || await resolveStoredMediaUrl({
        mediaId: detailedProfileImage.mediaId,
        objectKey: detailedProfileImage.objectKey,
      });
    } catch {
      return null;
    }
  }, [resolveStoredMediaUrl]);

  // ── Fetch nurses from API ──
  const fetchNurses = useCallback(async () => {
    if (!NURSE_ENDPOINTS.list) {
      setNurses([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(NURSE_ENDPOINTS.list);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.nurses || data.data || [];
      const completedIds = getCompletedNurseIds();
      const mapped = await Promise.all(list.map(async (n) => {
        const id = n._id || n.id;
        const profilePhotoUrl = await resolveNurseProfilePhotoUrl(n);
        // Trust API-provided flag first, then localStorage, then assume incomplete
        const isComplete = n.registrationComplete === true || n.isComplete === true || completedIds.has(id);
        const completedStep = isComplete ? 4 : (n.registrationStep ?? 1);
        return {
          id,
          name: [n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—',
          initials: ([n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—') !== '—'
            ? ([n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            : '?',
          profilePhotoUrl,
          license: n.mmcPinNo || '—',
          role: ROLE_LABELS[n.role] || n.role || n.jobTitle || '—',
          phone: n.phone || '—',
          email: n.email || '—',
          gender: n.gender || '—',
          joined: n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : '—',
          address: n.address || '—',
          completedStep,
          isComplete,
        };
      }));
      setNurses(mapped);
      setAvatarLoadErrors({});
    } catch (err) {
      console.error('Failed to fetch nurses:', err);
    } finally {
      setLoading(false);
    }
  }, [resolveNurseProfilePhotoUrl]);

  useEffect(() => { fetchNurses(); }, [fetchNurses]);

  // ── Multi-step form state ──
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...initialFormState, qualifications: [{ ...emptyQualification }], trainingCourses: [''], employmentHistory: [{ ...emptyEmployment }], referees: [{ ...emptyReferee }, { ...emptyReferee }] });
  const [nurseId, setNurseId] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // nurse to delete
  const [deleting, setDeleting] = useState(false);

  // ── Table logic ──
  const incompleteNurses = nurses.filter(n => !n.isComplete);
  const filtered = nurses.filter(n => {
    const sm = !search || n.name.toLowerCase().includes(search.toLowerCase()) || n.license.toLowerCase().includes(search.toLowerCase()) || n.email.toLowerCase().includes(search.toLowerCase());
    const fm = filter === 'All' || (filter === 'Incomplete' ? !n.isComplete : true);
    return sm && fm;
  });
  const handleSort = col => { if (sortField === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortField(col); setSortDir('asc'); } };
  const SortIcon = ({ col }) => { if (sortField !== col) return null; return sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />; };
  const sorted = [...filtered].sort((a, b) => { if (!sortField) return 0; const av = a[sortField], bv = b[sortField]; const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv; return sortDir === 'asc' ? cmp : -cmp; });
  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const startRow = (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, sorted.length);
  const paged = sorted.slice(startRow - 1, endRow);
  const pgBtn = (onClick, disabled, children) => (<button onClick={onClick} disabled={disabled} style={{ minWidth: 36, height: 36, padding: '0 12px', border: '1px solid #e6ebf1', borderRadius: 999, background: disabled ? '#f5f7fa' : '#fff', cursor: disabled ? 'default' : 'pointer', color: disabled ? '#9aa5b1' : '#304353', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: disabled ? 'none' : '0 8px 16px rgba(15, 23, 42, 0.04)' }}>{children}</button>);

  const removeEmptyValues = (value) => {
    if (Array.isArray(value)) {
      return value
        .map(item => removeEmptyValues(item))
        .filter(item => item !== undefined);
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([key, item]) => [key, removeEmptyValues(item)])
        .filter(([, item]) => item !== undefined);
      return Object.fromEntries(entries);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }

    if (value === null || value === undefined) return undefined;
    return value;
  };

  // ── Form helpers ──
  const u = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const updateArrayItem = (field, idx, key, value) => {
    setForm(p => {
      const arr = [...p[field]];
      if (typeof arr[idx] === 'object') arr[idx] = { ...arr[idx], [key]: value };
      else arr[idx] = value;
      return { ...p, [field]: arr };
    });
  };
  const addArrayItem = (field, template) => setForm(p => ({ ...p, [field]: [...p[field], typeof template === 'object' ? { ...template } : template] }));
  const removeArrayItem = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));

  const uploadAndRegisterDocument = useCallback(async ({ file, resolvedNurseId, documentType }) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await apiFetch('/media/b2/upload/direct', {
      method: 'POST',
      body: uploadFormData,
    });

    const uploadResult = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error || uploadResult.message || `Upload failed (HTTP ${uploadResponse.status})`);
    }

    const objectKey = uploadResult.upload?.objectKey;
    const mediaId = uploadResult.media?.id;

    if (!objectKey || !mediaId) {
      throw new Error('Upload response missing objectKey or mediaId.');
    }

    const registerResponse = await apiFetch(NURSE_ENDPOINTS.addDocuments, {
      method: 'POST',
      body: JSON.stringify({
        nurseId: resolvedNurseId,
        documentType,
        objectKey,
        mediaId,
      }),
    });

    const registerResult = await registerResponse.json().catch(() => ({}));
    if (!registerResponse.ok) {
      throw new Error(registerResult.error || registerResult.message || `Registration failed (HTTP ${registerResponse.status})`);
    }

    return registerResult;
  }, []);

  const resetAll = () => {
    setStep(0); setForm({ ...initialFormState, qualifications: [{ ...emptyQualification }], trainingCourses: [''], employmentHistory: [{ ...emptyEmployment }], referees: [{ ...emptyReferee }, { ...emptyReferee }] });
    setNurseId(null); setCompletedSteps([]); setSaving(false); setApiError(''); setDebugInfo(null);
  };

  const handleDeleteNurse = async (nurse, e) => {
    e.stopPropagation();
    setDeleteTarget(nurse);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!NURSE_ENDPOINTS.deleteById) {
      setApiError('Nurse delete endpoint is cleared. Reconnect endpoints before deleting records.');
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await apiFetch(`${NURSE_ENDPOINTS.deleteById}/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Delete failed (HTTP ${res.status})`);
      }
      setNurses(prev => prev.filter(n => n.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete nurse. Please try again.');
    } finally {
      setDeleting(false);
    }
  };
  const closeModal = () => { setShowModal(false); resetAll(); fetchNurses(); };

  const continueRegistration = (nurse, e) => {
    e.stopPropagation();
    const completedCount = Math.min(Math.max(nurse.completedStep || 1, 1), STEPS.length);
    const doneSteps = Array.from({ length: completedCount }, (_, index) => index);
    const nextStep = Math.min(completedCount, STEPS.length - 1);
    setNurseId(nurse.id);
    setCompletedSteps(doneSteps);
    setStep(nextStep);
    setShowModal(true);
  };

  // ── Save current step to API ──
  const saveStep = async () => {
    // Skip API call if this step was already completed (e.g. continuing an incomplete registration)
    if (completedSteps.includes(step)) {
      if (step < STEPS.length - 1) setStep(step + 1);
      return;
    }
    // Check token validity before attempting
    if (!isTokenValid()) {
      setApiError('Your session has expired. Please log out and log back in, then try again.');
      return;
    }
    setSaving(true); setApiError('');
    try {
      let body;
      let requestBodies = [];
      if (step === 0) {
        const requiredStep0 = {
          title: form.title,
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          email: form.email,
          address: form.address,
          mmcPinNo: form.mmcPinNo,
          phone: form.phone,
          homeTelephone: form.homeTelephone,
          citizenship: form.citizenship,
          role: form.role,
          password: form.password,
          jobReference: form.jobReference,
          jobTitle: form.jobTitle,
        };
        const missingRequired = Object.entries(requiredStep0)
          .filter(([, value]) => !String(value || '').trim())
          .map(([key]) => key);

        if (missingRequired.length > 0) {
          setApiError(`Please fill required fields before continuing: ${missingRequired.join(', ')}`);
          return;
        }

        const normalizedEmail = form.email.trim().toLowerCase();
        const normalizedMmcPin = form.mmcPinNo.trim().toLowerCase();
        const duplicateByEmail = nurses.find((n) => String(n.email || '').trim().toLowerCase() === normalizedEmail);
        if (duplicateByEmail) {
          setApiError('A nurse with this email already exists. Please use a different email address.');
          return;
        }

        const duplicateByMmcPin = nurses.find((n) => String(n.license || '').trim().toLowerCase() === normalizedMmcPin);
        if (normalizedMmcPin && duplicateByMmcPin) {
          setApiError('A nurse with this MMC Pin No. already exists. Please use a different pin.');
          return;
        }

        const step0Body = {
          title: form.title.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          gender: form.gender,
          email: form.email.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          homeTelephone: form.homeTelephone.trim(),
          dateOfBirh: form.dateOfBirh,
          dateOfBirth: form.dateOfBirh,
          mmcPinNo: form.mmcPinNo.trim(),
          citizenship: form.citizenship.trim(),
          role: form.role,
          password: form.password,
          jobReference: form.jobReference.trim(),
          jobTitle: form.jobTitle.trim(),
        };
        body = step0Body;
        const { dateOfBirth, ...step0TypoOnlyBody } = step0Body;
        const { dateOfBirh, ...step0StandardBirthBody } = step0Body;
        requestBodies = [step0Body, step0TypoOnlyBody, step0StandardBirthBody]
          .filter(candidate => Object.keys(candidate).length > 0)
          .filter((candidate, index, arr) => index === arr.findIndex(item => JSON.stringify(item) === JSON.stringify(candidate)));
      } else if (step === 1) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        body = removeEmptyValues({
          nurseId, race: form.race, religion: form.religion,
          disability: form.disability,
          disability_detail: form.disability === 'Yes' ? form.disability_detail || 'N/A' : 'N/A',
          criminal_records: form.criminal_records,
          criminal_record_detail: form.criminal_records === 'Yes' ? form.criminal_record_detail || 'N/A' : 'N/A',
        });
      } else if (step === 2) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        body = removeEmptyValues({
          nurseId,
          qualifications: form.qualifications.filter(q => q.name || q.institution),
          trainingCourses: form.trainingCourses.filter(t => t.trim()),
          employmentHistory: form.employmentHistory.filter(e => e.employerName),
        });
      } else if (step === 3) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        body = removeEmptyValues({
          nurseId,
          staffRelation: form.staffRelation, staffRelationDetail: form.staffRelation === 'Yes' ? form.staffRelationDetail || 'N/A' : 'N/A',
          vacancyAdvertised: form.vacancyAdvertised,
          referees: form.referees.filter(r => r.name),
        });
      } else if (step === 4) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        const docEntries = Object.entries(form.documents).filter(([, file]) => file instanceof File);
        if (docEntries.length === 0) {
          // No files — skip upload and just advance
          setCompletedSteps(prev => [...new Set([...prev, step])]);
          markNurseComplete(nurseId);
          setSaving(false);
          return;
        }

        setDebugInfo({
          step,
          endpoint: '/media/b2/upload/direct → /nurses/add/documents',
          method: 'POST',
          attempt: `0/${docEntries.length}`,
          requestBody: JSON.stringify(docEntries.map(([key, file]) => ({
            slot: key,
            documentType: DOCUMENT_TYPE_MAP[key] || 'Other',
            fileName: file.name,
            size: file.size,
            mimeType: file.type || 'unknown',
          })), null, 2),
          responseStatus: null,
          responseBody: 'Uploading selected nurse documents…',
        });

        for (let index = 0; index < docEntries.length; index += 1) {
          const [key, file] = docEntries[index];
          const documentType = DOCUMENT_TYPE_MAP[key] || 'Other';

          setDebugInfo({
            step,
            endpoint: '/media/b2/upload/direct → /nurses/add/documents',
            method: 'POST',
            attempt: `${index + 1}/${docEntries.length}`,
            requestBody: JSON.stringify({
              nurseId,
              slot: key,
              documentType,
              fileName: file.name,
              size: file.size,
              mimeType: file.type || 'unknown',
            }, null, 2),
            responseStatus: null,
            responseBody: `Uploading ${file.name}…`,
          });

          await uploadAndRegisterDocument({
            file,
            resolvedNurseId: nurseId,
            documentType,
          });
        }

        setDebugInfo({
          step,
          endpoint: '/media/b2/upload/direct → /nurses/add/documents',
          method: 'POST',
          attempt: `${docEntries.length}/${docEntries.length}`,
          requestBody: JSON.stringify(docEntries.map(([key, file]) => ({
            slot: key,
            documentType: DOCUMENT_TYPE_MAP[key] || 'Other',
            fileName: file.name,
          })), null, 2),
          responseStatus: 200,
          responseBody: `Uploaded and registered ${docEntries.length} document${docEntries.length === 1 ? '' : 's'} successfully.`,
        });

        setCompletedSteps(prev => [...new Set([...prev, step])]);
        markNurseComplete(nurseId);
        return;
      }
      if (requestBodies.length === 0) requestBodies = [body];
      if (!STEPS[step].endpoint) {
        setApiError('Nurse registration endpoint not configured for this step.');
        return;
      }
      let res;
      let rawText = '';
      let activeBody = body;
      let activeAttempt = 1;
      for (let index = 0; index < requestBodies.length; index += 1) {
        activeBody = requestBodies[index];
        activeAttempt = index + 1;
        const fetchBody = activeBody instanceof FormData ? activeBody : JSON.stringify(activeBody);
        setDebugInfo({
          step,
          endpoint: STEPS[step].endpoint,
          method: 'POST',
          attempt: `${activeAttempt}/${requestBodies.length}`,
          requestBody: activeBody instanceof FormData
            ? '[FormData payload – see selected files in the form]'
            : JSON.stringify(activeBody, null, 2),
          responseStatus: null,
          responseBody: '',
        });
        console.log(`[saveStep] STEP ${step} → POST ${STEPS[step].endpoint} (attempt ${activeAttempt}/${requestBodies.length})`);
        if (!(activeBody instanceof FormData)) console.log('[saveStep] payload:', JSON.stringify(activeBody, null, 2));
        res = await apiFetch(STEPS[step].endpoint, { method: 'POST', body: fetchBody });
        rawText = await res.text();
        setDebugInfo({
          step,
          endpoint: STEPS[step].endpoint,
          method: 'POST',
          attempt: `${activeAttempt}/${requestBodies.length}`,
          requestBody: activeBody instanceof FormData
            ? '[FormData payload – see selected files in the form]'
            : JSON.stringify(activeBody, null, 2),
          responseStatus: res.status,
          responseBody: rawText,
        });
        if (!(step === 0 && res.status >= 500 && index < requestBodies.length - 1)) break;
      }
      console.log('[saveStep] response status:', res.status, 'body:', rawText);
      let data;
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }

      // Resolve the nurse id — prefer body.nurseId (always fresh) over stale state
      const resolvedId = activeBody?.nurseId || nurseId;

      if (!res.ok) {
        const msg = (data.error || data.message || '').toLowerCase();
        // If data already exists for this step, treat as completed and advance
        if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('already registered')) {
          setCompletedSteps(prev => [...new Set([...prev, step])]);
          if (step < STEPS.length - 1) {
            setStep(step + 1);
          } else {
            if (resolvedId) markNurseComplete(resolvedId);
          }
          return;
        }
        throw new Error(data.error || data.message || data.details || (Array.isArray(data.errors) ? data.errors.map(e => e.message || e.msg || JSON.stringify(e)).join('; ') : null) || JSON.stringify(data) || 'Failed to save');
      }
      // Step 0 returns nurseId — extract and store it
      let currentNurseId = resolvedId;
      if (step === 0) {
        const id = data.nurse?._id || data.nurse?.id || data.nurseId || data._id || data.id || data.nurse?.uuid || data.uuid;
        if (id) { setNurseId(id); currentNurseId = id; }
      }
      setCompletedSteps(prev => [...new Set([...prev, step])]);
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        // All 4 steps done — persist completion so the table shows Active on reload
        if (currentNurseId) markNurseComplete(currentNurseId);
      }
    } catch (err) {
      const message = String(err?.message || 'Failed to save');
      setDebugInfo(prev => prev ? { ...prev, responseStatus: prev.responseStatus ?? 'NETWORK_ERROR', responseBody: message } : {
        step,
        endpoint: STEPS[step]?.endpoint || 'Unknown endpoint',
        method: 'POST',
        attempt: '1/1',
        requestBody: '',
        responseStatus: 'NETWORK_ERROR',
        responseBody: message,
      });
      if (message.toLowerCase().includes('cannot reach') || message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('network')) {
        setApiError('Cannot reach the server. It may be starting up (this can take ~15 seconds on the free tier) — please wait a moment and try again.');
      } else {
        setApiError(`Error: ${message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──
  const sectionTitleStyle = { fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e5d53', marginBottom: 16 };
  const fieldLabelStyle = { fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 };
  const sectionCardStyle = { padding: 22, border: '1px solid #edf1f5', borderRadius: 24, background: '#fff', boxShadow: '0 12px 30px rgba(148, 163, 184, 0.08)' };
  const inp = 'form-control form-control-kh workforce-form-input';
  const sel = 'form-select form-control-kh workforce-form-input';

  // ── Step content renderers ──
  const renderStep0 = () => (
    <div className="d-grid" style={{ gap: 18 }}>
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Personal Details</div>
        <div className="row g-3">
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Title *</label><input className={inp} value={form.title} onChange={e => u('title', e.target.value)} placeholder="e.g. Care Nurse" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>First Name *</label><input className={inp} value={form.firstName} onChange={e => u('firstName', e.target.value)} placeholder="First name" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Last Name *</label><input className={inp} value={form.lastName} onChange={e => u('lastName', e.target.value)} placeholder="Last name" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Gender *</label>
            <select className={sel} value={form.gender} onChange={e => u('gender', e.target.value)}>
              <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
            </select>
          </div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Email *</label><input type="email" className={inp} value={form.email} onChange={e => u('email', e.target.value)} placeholder="nurse@email.com" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>MMC Pin No. *</label><input className={inp} value={form.mmcPinNo} onChange={e => u('mmcPinNo', e.target.value)} placeholder="License pin number" /></div>
          <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Address *</label><input className={inp} value={form.address} onChange={e => u('address', e.target.value)} placeholder="Residential address" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Phone *</label><input className={inp} value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="024 XXX XXXX" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Home Telephone</label><input className={inp} value={form.homeTelephone} onChange={e => u('homeTelephone', e.target.value)} placeholder="Optional" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Date of Birth</label><input type="date" className={inp} value={form.dateOfBirh} onChange={e => u('dateOfBirh', e.target.value)} /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Citizenship</label><input className={inp} value={form.citizenship} onChange={e => u('citizenship', e.target.value)} placeholder="Ghana" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Role *</label>
            <select className={sel} value={form.role} onChange={e => u('role', e.target.value)}>
              <option value="">Select role</option>
              <option value="head_nurse">Head Nurse</option><option value="supervising_nurse">Supervising Nurse</option>
              <option value="office_nurse">Office Nurse</option><option value="field_nurse">Field Nurse</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Password *</label><input type="password" className={inp} value={form.password} onChange={e => u('password', e.target.value)} placeholder="Min 8 characters" /></div>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Job Details</div>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Job Reference *</label><input className={inp} value={form.jobReference} onChange={e => u('jobReference', e.target.value)} placeholder="e.g. REF-001" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Job Title *</label><input className={inp} value={form.jobTitle} onChange={e => u('jobTitle', e.target.value)} placeholder="e.g. Care Nurse" /></div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div style={sectionCardStyle}>
      <div style={sectionTitleStyle}>Equality & Diversity</div>
      <div className="row g-3">
        <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Race / Ethnic Origin</label>
          <select className={sel} value={form.race} onChange={e => u('race', e.target.value)}>
            <option value="">Select</option><option value="Black Ghanaian">Black Ghanaian</option><option value="Any other African">Any other African</option><option value="White">White</option><option value="Asian">Asian</option><option value="Mixed">Mixed</option><option value="Prefer not to disclose">Prefer not to disclose</option>
          </select>
        </div>
        <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Religion</label>
          <select className={sel} value={form.religion} onChange={e => u('religion', e.target.value)}>
            <option value="">Select</option><option value="Christian">Christian</option><option value="Muslim">Muslim</option><option value="Traditional">Traditional</option><option value="Other">Other</option><option value="None">None</option>
          </select>
        </div>
        <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Disability</label>
          <select className={sel} value={form.disability} onChange={e => u('disability', e.target.value)}>
            <option value="No">No</option><option value="Yes">Yes</option>
          </select>
        </div>
        {form.disability === 'Yes' && <div className="col-md-8"><label className="form-label" style={fieldLabelStyle}>Disability Detail</label><textarea className={inp} rows={2} value={form.disability_detail} onChange={e => u('disability_detail', e.target.value)} placeholder="Provide details" /></div>}
        <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Criminal Records</label>
          <select className={sel} value={form.criminal_records} onChange={e => u('criminal_records', e.target.value)}>
            <option value="No">No</option><option value="Yes">Yes</option>
          </select>
        </div>
        {form.criminal_records === 'Yes' && <div className="col-md-8"><label className="form-label" style={fieldLabelStyle}>Criminal Record Detail</label><textarea className={inp} rows={2} value={form.criminal_record_detail} onChange={e => u('criminal_record_detail', e.target.value)} placeholder="Provide details" /></div>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="d-grid" style={{ gap: 18 }}>
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={sectionTitleStyle}>Qualifications</div>
          <button className="btn btn-sm" onClick={() => addArrayItem('qualifications', emptyQualification)} style={{ fontSize: 12, fontWeight: 700, color: '#2E7DB8', background: '#F0F7FE', border: '1px solid #D6ECFC', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><FiPlus size={12} /> Add</button>
        </div>
        {form.qualifications.map((q, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 8, background: '#fafbfc', border: '1px solid var(--kh-border-light)', marginBottom: i < form.qualifications.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)' }}>Qualification {i + 1}</span>
              {form.qualifications.length > 1 && <button onClick={() => removeArrayItem('qualifications', i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>}
            </div>
            <div className="row g-2">
              <div className="col-md-3"><input className={inp} value={q.name} onChange={e => updateArrayItem('qualifications', i, 'name', e.target.value)} placeholder="Name" /></div>
              <div className="col-md-4"><input className={inp} value={q.institution} onChange={e => updateArrayItem('qualifications', i, 'institution', e.target.value)} placeholder="Institution" /></div>
              <div className="col-md-3"><input className={inp} value={q.result} onChange={e => updateArrayItem('qualifications', i, 'result', e.target.value)} placeholder="Result" /></div>
              <div className="col-md-2"><input className={inp} value={q.year} onChange={e => updateArrayItem('qualifications', i, 'year', e.target.value)} placeholder="Year" /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={sectionTitleStyle}>Training Courses</div>
          <button className="btn btn-sm" onClick={() => addArrayItem('trainingCourses', '')} style={{ fontSize: 12, fontWeight: 700, color: '#2E7DB8', background: '#F0F7FE', border: '1px solid #D6ECFC', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><FiPlus size={12} /> Add</button>
        </div>
        {form.trainingCourses.map((tc, i) => (
          <div key={i} className="d-flex gap-2 align-items-center" style={{ marginBottom: i < form.trainingCourses.length - 1 ? 8 : 0 }}>
            <input className={inp} value={tc} onChange={e => updateArrayItem('trainingCourses', i, null, e.target.value)} placeholder={`Course ${i + 1}`} />
            {form.trainingCourses.length > 1 && <button onClick={() => removeArrayItem('trainingCourses', i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', flexShrink: 0 }}><FiX size={14} /></button>}
          </div>
        ))}
      </div>

      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={sectionTitleStyle}>Employment History</div>
          <button className="btn btn-sm" onClick={() => addArrayItem('employmentHistory', emptyEmployment)} style={{ fontSize: 12, fontWeight: 700, color: '#2E7DB8', background: '#F0F7FE', border: '1px solid #D6ECFC', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><FiPlus size={12} /> Add</button>
        </div>
        {form.employmentHistory.map((emp, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 8, background: '#fafbfc', border: '1px solid var(--kh-border-light)', marginBottom: i < form.employmentHistory.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)' }}>Employer {i + 1}</span>
              {form.employmentHistory.length > 1 && <button onClick={() => removeArrayItem('employmentHistory', i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>}
            </div>
            <div className="row g-2">
              <div className="col-md-6"><input className={inp} value={emp.employerName} onChange={e => updateArrayItem('employmentHistory', i, 'employerName', e.target.value)} placeholder="Employer name" /></div>
              <div className="col-md-6"><input className={inp} value={emp.address} onChange={e => updateArrayItem('employmentHistory', i, 'address', e.target.value)} placeholder="Address" /></div>
              <div className="col-md-4"><input className={inp} value={emp.businessType} onChange={e => updateArrayItem('employmentHistory', i, 'businessType', e.target.value)} placeholder="Business type" /></div>
              <div className="col-md-4"><input className={inp} value={emp.jobTitle} onChange={e => updateArrayItem('employmentHistory', i, 'jobTitle', e.target.value)} placeholder="Job title" /></div>
              <div className="col-md-4"><input className={inp} value={emp.startDate} onChange={e => updateArrayItem('employmentHistory', i, 'startDate', e.target.value)} placeholder="Start date (year)" /></div>
              <div className="col-md-3"><input className={inp} value={emp.grade} onChange={e => updateArrayItem('employmentHistory', i, 'grade', e.target.value)} placeholder="Grade" /></div>
              <div className="col-md-3"><input className={inp} value={emp.reportingOfficer} onChange={e => updateArrayItem('employmentHistory', i, 'reportingOfficer', e.target.value)} placeholder="Reporting officer" /></div>
              <div className="col-md-3"><input className={inp} value={emp.reasonForLeaving} onChange={e => updateArrayItem('employmentHistory', i, 'reasonForLeaving', e.target.value)} placeholder="Reason for leaving" /></div>
              <div className="col-md-3"><input className={inp} value={emp.contactPerson} onChange={e => updateArrayItem('employmentHistory', i, 'contactPerson', e.target.value)} placeholder="Contact person" /></div>
              <div className="col-12"><textarea className={inp} rows={2} value={emp.descriptionOfDuties} onChange={e => updateArrayItem('employmentHistory', i, 'descriptionOfDuties', e.target.value)} placeholder="Description of duties" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const updateVacancyDetail = (key, value) => setForm(p => ({ ...p, vacancyDetail: { ...p.vacancyDetail, [key]: value } }));

  const handleVacancyChange = (value) => {
    setForm(p => ({ ...p, vacancyAdvertised: value, vacancyDetail: {} }));
  };

  const renderVacancyFollowUp = () => {
    const v = form.vacancyAdvertised;
    const d = form.vacancyDetail;
    if (!v) return null;

    const card = (children) => (
      <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: '#F0F7FE', border: '1px solid #D6ECFC' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#2E8FD4', marginBottom: 12 }}>
          {v} Details
        </div>
        <div className="row g-3">{children}</div>
      </div>
    );

    switch (v) {
      case 'Social Media':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Platform</label>
            <select className={sel} value={d.platform || ''} onChange={e => updateVacancyDetail('platform', e.target.value)}>
              <option value="">Select platform</option><option value="Facebook">Facebook</option><option value="Instagram">Instagram</option><option value="Twitter / X">Twitter / X</option><option value="LinkedIn">LinkedIn</option><option value="TikTok">TikTok</option><option value="WhatsApp">WhatsApp</option><option value="YouTube">YouTube</option><option value="Other">Other</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Account / Page Name</label><input className={inp} value={d.accountName || ''} onChange={e => updateVacancyDetail('accountName', e.target.value)} placeholder="e.g. @kulobalhomecare" /></div>
          {d.platform === 'Other' && <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Specify Platform</label><input className={inp} value={d.otherPlatform || ''} onChange={e => updateVacancyDetail('otherPlatform', e.target.value)} placeholder="Platform name" /></div>}
        </>);
      case 'Search Engine':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Search Engine</label>
            <select className={sel} value={d.engine || ''} onChange={e => updateVacancyDetail('engine', e.target.value)}>
              <option value="">Select</option><option value="Google">Google</option><option value="Bing">Bing</option><option value="Yahoo">Yahoo</option><option value="Other">Other</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Search Term Used</label><input className={inp} value={d.searchTerm || ''} onChange={e => updateVacancyDetail('searchTerm', e.target.value)} placeholder="e.g. home care jobs Ghana" /></div>
        </>);
      case 'Radio':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Radio Station</label><input className={inp} value={d.station || ''} onChange={e => updateVacancyDetail('station', e.target.value)} placeholder="e.g. Joy FM" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Program / Show Name</label><input className={inp} value={d.program || ''} onChange={e => updateVacancyDetail('program', e.target.value)} placeholder="e.g. Morning Show" /></div>
        </>);
      case 'Newspaper':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Newspaper Name</label><input className={inp} value={d.newspaperName || ''} onChange={e => updateVacancyDetail('newspaperName', e.target.value)} placeholder="e.g. Daily Graphic" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Date of Publication</label><input type="date" className={inp} value={d.publicationDate || ''} onChange={e => updateVacancyDetail('publicationDate', e.target.value)} /></div>
        </>);
      case 'Referral':
        return card(<>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Referrer's Name</label><input className={inp} value={d.referrerName || ''} onChange={e => updateVacancyDetail('referrerName', e.target.value)} placeholder="Full name" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Referrer's Phone</label><input className={inp} value={d.referrerPhone || ''} onChange={e => updateVacancyDetail('referrerPhone', e.target.value)} placeholder="024 XXX XXXX" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Relationship</label>
            <select className={sel} value={d.referrerRelation || ''} onChange={e => updateVacancyDetail('referrerRelation', e.target.value)}>
              <option value="">Select</option><option value="Friend">Friend</option><option value="Family">Family</option><option value="Colleague">Colleague</option><option value="Former Employer">Former Employer</option><option value="Other">Other</option>
            </select>
          </div>
        </>);
      case 'Other':
        return card(<>
          <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Please Specify</label><input className={inp} value={d.otherSource || ''} onChange={e => updateVacancyDetail('otherSource', e.target.value)} placeholder="How did you find out about this vacancy?" /></div>
        </>);
      default: return null;
    }
  };

  const renderStep3 = () => (
    <div className="d-grid" style={{ gap: 18 }}>
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Relationships & Vacancy Source</div>
        <div className="row g-3">
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Related to any staff?</label>
            <select className={sel} value={form.staffRelation} onChange={e => u('staffRelation', e.target.value)}><option value="No">No</option><option value="Yes">Yes</option></select>
          </div>
          {form.staffRelation === 'Yes' && <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Relationship Detail</label><input className={inp} value={form.staffRelationDetail} onChange={e => u('staffRelationDetail', e.target.value)} placeholder="e.g. A friend" /></div>}
          <div className={form.staffRelation === 'Yes' ? 'col-md-4' : 'col-md-8'}><label className="form-label" style={fieldLabelStyle}>Where did you hear about us?</label>
            <select className={sel} value={form.vacancyAdvertised} onChange={e => handleVacancyChange(e.target.value)}>
              <option value="">Select</option><option value="Social Media">Social Media</option><option value="Search Engine">Search Engine</option><option value="Radio">Radio</option><option value="Newspaper">Newspaper</option><option value="Referral">Referral</option><option value="Other">Other</option>
            </select>
          </div>
        </div>
        {renderVacancyFollowUp()}
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Referees</div>
        <div className="row g-4">
          {form.referees.map((ref, i) => (
            <div className="col-md-6" key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 10 }}>Referee {i + 1}</div>
              <div className="row g-3">
                <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Name</label><input className={inp} value={ref.name} onChange={e => updateArrayItem('referees', i, 'name', e.target.value)} placeholder="Full name" /></div>
                <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Address</label><input className={inp} value={ref.address} onChange={e => updateArrayItem('referees', i, 'address', e.target.value)} placeholder="Address" /></div>
                <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Telephone</label><input className={inp} value={ref.telephone} onChange={e => updateArrayItem('referees', i, 'telephone', e.target.value)} placeholder="Phone number" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={sectionCardStyle}>
      <div style={sectionTitleStyle}>Upload Documents</div>
      <div style={{ fontSize: 13, color: 'var(--kh-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Upload any relevant supporting documents for this nurse. All fields are optional — you can skip and complete later.
      </div>
      <div className="row g-3">
        {DOCUMENT_TYPES.map(({ key, label }) => {
          const file = form.documents[key];
          return (
            <div className="col-md-6" key={key}>
              <label style={fieldLabelStyle}>{label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${file ? '#86efac' : 'var(--kh-border-light)'}`, background: file ? '#f0fdf4' : '#fafbfc', transition: 'all 0.15s' }}>
                {file ? (
                  <>
                    <div style={{ flex: 1, fontSize: 12.5, color: '#15803d', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <FiCheck size={12} style={{ marginRight: 6, color: '#16a34a' }} />{file.name}
                    </div>
                    <button onClick={() => u('documents', { ...form.documents, [key]: undefined })} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <FiX size={14} />
                    </button>
                  </>
                ) : (
                  <label htmlFor={`doc-${key}`} style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--kh-text-muted)', margin: 0 }}>
                    <FiUpload size={13} style={{ color: '#2E7DB8', flexShrink: 0 }} />
                    <span>Click to upload</span>
                    <input
                      id={`doc-${key}`}
                      type="file"
                      accept="*/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) u('documents', { ...form.documents, [key]: f });
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginTop: 4 }}>Any file type supported — max 10 MB</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];
  const isLastStep = step === STEPS.length - 1;
  const allCompleted = completedSteps.length === STEPS.length;

  return (
    <div className="page-wrapper workforce-page">
      <div className="workforce-shell">
        <div className="workforce-page-header">
          <div>
            <div className="workforce-eyebrow">Workforce Management</div>
            <h2 className="workforce-title">Nurse Directory</h2>
            <p className="workforce-subtitle">Manage nurse registrations, continue incomplete applications, and review staffing records in one clean workspace.</p>
          </div>
          <div className="workforce-header-badge">
            <span className="workforce-header-badge__icon"><FiUsers size={16} /></span>
            <span>{filtered.length} active records</span>
          </div>
        </div>

        <div className="workforce-board kh-card">
          <div className="workforce-board__topbar">
            <div className="workforce-tabs" role="tablist" aria-label="Nurse views">
              {['All', 'Incomplete'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`workforce-tab${filter === f ? ' active' : ''}`}
                  onClick={() => { setFilter(f); setPage(1); }}
                >
                  <span>{f === 'All' ? 'All Nurses' : 'Incomplete'}</span>
                  {f === 'Incomplete' && incompleteNurses.length > 0 && (
                    <span className="workforce-tab__count">{incompleteNurses.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="workforce-top-actions">
              <button type="button" className="workforce-action-chip workforce-action-chip--ghost">
                <FiClock size={14} /> This Month
              </button>
              <button type="button" className="workforce-action-chip workforce-action-chip--ghost">
                <FiSave size={14} /> Export
              </button>
              <button type="button" className="workforce-action-chip workforce-action-chip--primary" onClick={() => setShowModal(true)}>
                <span className="workforce-action-chip__icon"><FiPlus size={16} /></span>
                Register Nurse
              </button>
            </div>
          </div>

          <div className="workforce-board__toolbar">
            <div className="workforce-summary-pills">
              <div className="workforce-summary-pill">
                <span className="workforce-summary-pill__label">Total Nurses</span>
                <strong>{nurses.length}</strong>
              </div>
              <div className="workforce-summary-pill workforce-summary-pill--highlight">
                <span className="workforce-summary-pill__label">Pending Review</span>
                <strong>{incompleteNurses.length}</strong>
              </div>
            </div>

            <label className="workforce-searchbar">
              <FiSearch size={16} />
              <input
                className="form-control form-control-kh"
                placeholder="Search nurse, email or license"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </label>
          </div>

          <div className="workforce-table-wrap table-responsive">
            <table className="table kh-table workforce-table" style={{ marginBottom: 0 }}>
            <thead><tr>
              <th className="col-num">#</th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>Nurse <SortIcon col="name" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('role')}>Role <SortIcon col="role" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('license')}>License <SortIcon col="license" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('joined')}>Joined <SortIcon col="joined" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('phone')}>Phone <SortIcon col="phone" /></th>
              <th style={{ width: 180, textAlign: 'center' }}>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-5">
                  <div className="d-flex align-items-center justify-content-center gap-2" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>
                    <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#45B6FE' }} />
                    <span>Loading nurses…</span>
                  </div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>
                  {nurses.length === 0 ? 'No nurses registered yet. Click "Register Nurse" to add one.' : 'No nurses match your search.'}
                </td></tr>
              ) : paged.map((n, i) => (
                <tr key={n.id} onClick={() => navigate(`/workforce/${n.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="col-num" data-label="#">{startRow + i}</td>
                  <td data-label="Nurse">
                    <div className="d-flex align-items-center gap-2 workforce-person-cell">
                    <div className="workforce-avatar">
                      {n.profilePhotoUrl && !avatarLoadErrors[n.id] ? (
                        <img
                          src={n.profilePhotoUrl}
                          alt={n.name}
                          loading="lazy"
                          onError={() => setAvatarLoadErrors(prev => ({ ...prev, [n.id]: true }))}
                        />
                      ) : (
                        n.initials
                      )}
                    </div>
                    <div>
                      <div className="workforce-person-name">{n.name}</div>
                      <div className="workforce-person-email">{n.email}</div>
                    </div>
                  </div></td>
                  <td data-label="Role"><span className="workforce-role-chip">{n.role}</span></td>
                  <td data-label="License" style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#2E7DB8' }}>{n.license}</td>
                  <td data-label="Joined" className="workforce-date-cell">{n.joined}</td>
                  <td data-label="Phone" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{n.phone}</td>
                  <td data-label="Actions" style={{ textAlign: 'center' }}>
                    <div className="workforce-row-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/workforce/${n.id}`); }}
                        title="Edit nurse"
                        className="workforce-row-btn workforce-row-btn--edit"
                      >
                        <FiEdit size={11} /> Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteNurse(n, e)}
                        title="Delete nurse"
                        className="workforce-row-btn workforce-row-btn--delete"
                      >
                        <FiTrash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          <div className="workforce-pagination-bar">
          <div className="d-flex align-items-center gap-2" style={{ fontSize: 12.5, color: 'var(--kh-text-muted)' }}>
            <span>Rows per page:</span>
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="workforce-pagination-select">
              {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#1c5b51' }}>Showing {startRow}–{endRow} of {sorted.length}</span>
          </div>
          <div className="d-flex gap-1 workforce-pagination-actions">
            {pgBtn(() => setPage(1), page === 1, <FiChevronsLeft size={14} />)}
            {pgBtn(() => setPage(p => p - 1), page === 1, <FiChevronLeft size={14} />)}
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => {
              const prev = arr[idx - 1]; const showEllipsis = prev && p - prev > 1;
              return (<span key={p}>{showEllipsis && <span style={{ padding: '6px 4px', fontSize: 12, color: 'var(--kh-text-muted)' }}>…</span>}<button onClick={() => setPage(p)} style={{ minWidth: 38, height: 38, padding: '0 14px', border: '1px solid #e6ebf1', borderRadius: 999, background: page === p ? '#145d52' : '#fff', color: page === p ? '#fff' : '#304353', cursor: 'pointer', fontSize: 12.5, fontWeight: page === p ? 700 : 500, boxShadow: page === p ? '0 12px 24px rgba(20, 93, 82, 0.18)' : '0 8px 16px rgba(15, 23, 42, 0.04)' }}>{p}</button></span>);
            })}
            {pgBtn(() => setPage(p => p + 1), page === totalPages, <FiChevronRight size={14} />)}
            {pgBtn(() => setPage(totalPages), page === totalPages, <FiChevronsRight size={14} />)}
          </div>
        </div>
      </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          className="app-modal-overlay app-modal-overlay--danger-flow"
          role="presentation"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div className="app-modal-dialog app-modal-dialog--md" role="dialog" aria-modal="true" aria-labelledby="workforce-delete-title" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-dialog__header">
              <h2 id="workforce-delete-title" className="app-modal-dialog__title">Delete nurse</h2>
              <button
                type="button"
                className="app-modal-dialog__close"
                aria-label="Close"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="app-modal-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete this team member? This will remove their profile from the workforce
                directory.
              </p>
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> All associated onboarding data and references
                  for this nurse may be <strong>permanently lost</strong>.
                </div>
              </div>
              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand">
                  {deleteTarget.name !== '—'
                    ? deleteTarget.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                    : '?'}
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{deleteTarget.name}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {deleteTarget.role} · {deleteTarget.email}
                  </div>
                </div>
              </div>
            </div>
            <div className="app-modal-dialog__footer">
              <button type="button" className="app-modal-dialog__btn-cancel" disabled={deleting} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="app-modal-dialog__btn-danger" disabled={deleting} onClick={confirmDelete}>
                <FiTrash2 size={13} /> {deleting ? 'Deleting…' : 'Delete nurse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-step Registration Modal ── */}
      {showModal && (
        <div className="modal modal-open workforce-modal" onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable workforce-modal-dialog" style={{ maxWidth: 1060 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content kh-modal-panel workforce-modal-panel" style={{ border: 'none' }}>

              {/* Header */}
              <div className="modal-header workforce-modal-header">
                <div style={{ flex: 1 }}>
                  <div className="workforce-modal-header__top">
                    <div>
                      <div className="workforce-modal-kicker">Nurse onboarding</div>
                      <h6 className="modal-title workforce-modal-title">Register Nurse</h6>
                    </div>
                    <button type="button" className="workforce-modal-close" onClick={closeModal} aria-label="Close register nurse modal"><FiX size={16} /></button>
                  </div>
                  <div className="workforce-step-tabs">
                    {STEPS.map((s, i) => {
                      const isDone = completedSteps.includes(i);
                      const isActive = step === i;
                      return (
                        <div key={s.key} className={`workforce-step-tab${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                          <span className="workforce-step-tab__index">{isDone ? <FiCheck size={12} strokeWidth={3} /> : i + 1}</span>
                          <span className="workforce-step-tab__label">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="modal-body workforce-modal-body">
                {apiError && (
                  <div className="workforce-modal-alert">
                    <FiAlertCircle size={15} /> {apiError}
                  </div>
                )}
                {allCompleted ? (
                  <div className="workforce-modal-success">
                    <div className="workforce-modal-success__icon">
                      <FiCheck size={28} style={{ color: '#fff', strokeWidth: 3 }} />
                    </div>
                    <div className="workforce-modal-success__title">Nurse Registered Successfully!</div>
                    <div className="workforce-modal-success__text">All steps have been completed. The nurse has been added to the system.</div>
                    <button className="btn btn-primary workforce-modal-primary-btn" onClick={closeModal}>Close</button>
                  </div>
                ) : (
                  <div className="workforce-form-stage">{stepRenderers[step]()}</div>
                )}
              </div>

              {/* Footer */}
              {!allCompleted && (
                <div className="modal-footer workforce-modal-footer">
                  <div>
                    {step > 0 && (
                      <button className="btn btn-outline workforce-modal-secondary-btn" onClick={() => setStep(step - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiChevronLeft size={14} /> Back
                      </button>
                    )}
                  </div>
                  <div className="d-flex gap-2 workforce-modal-footer__actions">
                    <button className="btn btn-outline workforce-modal-secondary-btn" onClick={closeModal}>
                      <FiSave size={13} style={{ marginRight: 6 }} /> Save & Exit
                    </button>
                    <button className="btn btn-primary workforce-modal-primary-btn" disabled={saving} onClick={saveStep} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Saving…' : isLastStep ? <><FiCheck size={14} /> Complete Registration</> : <>Save & Continue <FiArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
