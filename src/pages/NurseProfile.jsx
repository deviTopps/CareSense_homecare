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
import { stashContinueNurseRegistration } from '../utils/nurseRegistrationResume';
import { extractUrlFromPayload, resolveStoredMediaUrl } from '../utils/resolveStoredMediaUrl';
import compressImage, { createThumbnailURL } from '../utils/compressImage';
import { TablePageLoaderPanel } from '../components/TablePageLoader';
import { useLoadProgress } from '../hooks/useLoadProgress';
import './NurseProfile.css';

const ROLE_LABELS = {
  head_nurse: 'Head Nurse',
  supervising_nurse: 'Supervising Nurse',
  office_nurse: 'Office Nurse',
  field_nurse: 'Field Nurse',
};

/* ── Tiny shared components ── */
const DataRow = ({ label, children, missing }) => (
  <dl className={`np-field${missing ? ' np-field--missing' : ''}`}>
    <dt>{label}</dt>
    <dd>{children || (missing ? 'Not provided' : '—')}</dd>
  </dl>
);

const Panel = ({ title, icon, accent, children, action, style }) => (
  <section className="np-panel" style={{ '--np-panel-accent': accent || '#45B6FE', ...style }}>
    <header className="np-panel__head">
      <div className="d-flex align-items-center gap-2">
        {icon && <span className="np-panel__icon">{icon}</span>}
        <span className="np-panel__title">{title}</span>
      </div>
      {action && action}
    </header>
    <div className="np-panel__body">{children}</div>
  </section>
);

const NP_EDIT_INPUT_CLASS = 'form-control form-control-kh np-edit-input';

/** Module-level so inputs keep focus while typing (not recreated each parent render). */
function EditRow({ label, field, type = 'text', options, children, wide, getValue, setValue }) {
  return (
    <div className={`np-edit-field${wide ? ' np-edit-field--wide' : ''}`}>
      <label className="np-edit-field__label">{label}</label>
      <div className="np-edit-field__control">
        {children || (
          options ? (
            <select
              className={NP_EDIT_INPUT_CLASS}
              value={getValue(field)}
              onChange={(e) => setValue(field, e.target.value)}
            >
              <option value="">Select...</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={type}
              className={NP_EDIT_INPUT_CLASS}
              value={getValue(field)}
              onChange={(e) => setValue(field, e.target.value)}
            />
          )
        )}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: <FiUser size={14} /> },
  { key: 'diversity', label: 'Diversity', icon: <FiShield size={14} /> },
  { key: 'education', label: 'Education', icon: <FiAward size={14} /> },
  { key: 'supporting', label: 'Supporting', icon: <FiClipboard size={14} /> },
  { key: 'documents', label: 'Documents', icon: <FiFileText size={14} /> },
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

const EDIT_ENDPOINT_BY_SECTION = {
  personal: '/nurses/update/personal-info',
  professional: '/nurses/update/personal-info',
  diversity: '/nurses/update/diversity-info',
  qualifications: '/nurses/update/education-info',
  training: '/nurses/update/education-info',
  employment: '/nurses/update/education-info',
  supporting: '/nurses/update/supporting-info',
  'supporting-staff': '/nurses/update/supporting-info',
  'supporting-referees': '/nurses/update/supporting-info',
};

const EDIT_MODAL_TITLES = {
  personal: 'Edit personal details',
  diversity: 'Edit diversity & health',
  qualifications: 'Edit qualifications',
  training: 'Edit training courses',
  employment: 'Edit employment history',
  supporting: 'Edit supporting information',
  'supporting-staff': 'Edit staff relationship',
  'supporting-referees': 'Edit referees',
};

function applyNurseSectionEdit(section, form, { setNurse, setDiversity, setEducation, setSupporting }) {
  switch (section) {
    case 'personal':
      setNurse((prev) => ({ ...(prev || {}), ...form }));
      break;
    case 'diversity':
      setDiversity((prev) => ({ ...(prev || {}), ...form }));
      break;
    case 'qualifications':
      setEducation((prev) => ({ ...(prev || {}), qualifications: form.qualifications || [] }));
      break;
    case 'training':
      setEducation((prev) => ({ ...(prev || {}), trainingCourses: form.trainingCourses || [] }));
      break;
    case 'employment':
      setEducation((prev) => ({ ...(prev || {}), employmentHistory: form.employmentHistory || [] }));
      break;
    case 'supporting-staff':
      setSupporting((prev) => ({ ...(prev || {}), ...form }));
      break;
    case 'supporting-referees':
      setSupporting((prev) => ({ ...(prev || {}), referees: form.referees || [] }));
      break;
    default:
      break;
  }
}

/** Keeps edit typing fast by isolating form state from the full profile page. */
function NurseProfileEditModal({
  section,
  initialData,
  subtitle,
  saving,
  error,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState(initialData || {});

  useEffect(() => {
    setForm(initialData || {});
  }, [section, initialData]);

  const getEditField = (field) => form[field] ?? '';
  const setEditField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const uf = setEditField;
  const ef = getEditField;

  const renderForm = () => {
    switch (section) {
      case 'personal':
        return (
          <div className="np-edit-form np-edit-form--grid">
            <EditRow label="Title" field="title" getValue={getEditField} setValue={setEditField} />
            <EditRow label="First name" field="firstName" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Last name" field="lastName" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Email" field="email" type="email" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Phone" field="phone" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Home telephone" field="homeTelephone" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Gender" field="gender" options={['Male', 'Female', 'Other']} getValue={getEditField} setValue={setEditField} />
            <EditRow label="Citizenship" field="citizenship" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Address" field="address" wide getValue={getEditField} setValue={setEditField} />
          </div>
        );
      case 'diversity':
        return (
          <div className="np-edit-form np-edit-form--grid">
            <EditRow label="Race / ethnicity" field="race" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Religion" field="religion" getValue={getEditField} setValue={setEditField} />
            <EditRow label="Disability" field="disability" options={['No', 'Yes']} getValue={getEditField} setValue={setEditField} />
            {ef('disability') === 'Yes' && <EditRow label="Disability detail" field="disability_detail" wide getValue={getEditField} setValue={setEditField} />}
            <EditRow label="Criminal records" field="criminal_records" options={['No', 'Yes']} getValue={getEditField} setValue={setEditField} />
            {ef('criminal_records') === 'Yes' && <EditRow label="Criminal record detail" field="criminal_record_detail" wide getValue={getEditField} setValue={setEditField} />}
          </div>
        );
      case 'qualifications':
        return (
          <div className="np-edit-form">
            {(form.qualifications || []).map((q, i) => (
              <div key={i} className="np-edit-block">
                <div className="np-edit-block__head">
                  <span>Qualification {i + 1}</span>
                  {form.qualifications.length > 1 && (
                    <button type="button" className="np-edit-block__remove" onClick={() => uf('qualifications', form.qualifications.filter((_, j) => j !== i))}>
                      <FiTrash2 size={12} /> Remove
                    </button>
                  )}
                </div>
                <div className="np-edit-form np-edit-form--grid">
                  <EditRow label="Qualification" field={`q-${i}-name`} children={
                    <input className={NP_EDIT_INPUT_CLASS} value={q.name} onChange={(e) => { const arr = [...form.qualifications]; arr[i] = { ...arr[i], name: e.target.value }; uf('qualifications', arr); }} />
                  } />
                  <EditRow label="Institution" field={`q-${i}-inst`} children={
                    <input className={NP_EDIT_INPUT_CLASS} value={q.institution} onChange={(e) => { const arr = [...form.qualifications]; arr[i] = { ...arr[i], institution: e.target.value }; uf('qualifications', arr); }} />
                  } />
                  <EditRow label="Result / grade" field={`q-${i}-result`} children={
                    <input className={NP_EDIT_INPUT_CLASS} value={q.result} onChange={(e) => { const arr = [...form.qualifications]; arr[i] = { ...arr[i], result: e.target.value }; uf('qualifications', arr); }} />
                  } />
                  <EditRow label="Year" field={`q-${i}-year`} children={
                    <input className={NP_EDIT_INPUT_CLASS} value={q.year} onChange={(e) => { const arr = [...form.qualifications]; arr[i] = { ...arr[i], year: e.target.value }; uf('qualifications', arr); }} />
                  } />
                </div>
              </div>
            ))}
            <button type="button" className="np-edit-add-btn" onClick={() => uf('qualifications', [...(form.qualifications || []), { name: '', institution: '', result: '', year: '' }])}>
              <FiPlus size={14} /> Add qualification
            </button>
          </div>
        );
      case 'training':
        return (
          <div className="np-edit-form">
            {(form.trainingCourses || []).map((course, i) => (
              <div key={i} className="np-edit-inline-row">
                <input className={NP_EDIT_INPUT_CLASS} value={course} onChange={(e) => { const arr = [...form.trainingCourses]; arr[i] = e.target.value; uf('trainingCourses', arr); }} placeholder="Course name" />
                {form.trainingCourses.length > 1 && (
                  <button type="button" className="np-edit-block__remove" onClick={() => uf('trainingCourses', form.trainingCourses.filter((_, j) => j !== i))}>
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="np-edit-add-btn" onClick={() => uf('trainingCourses', [...(form.trainingCourses || []), ''])}>
              <FiPlus size={14} /> Add course
            </button>
          </div>
        );
      case 'employment':
        return (
          <div className="np-edit-form">
            {(form.employmentHistory || []).map((emp, i) => (
              <div key={i} className="np-edit-block">
                <div className="np-edit-block__head">
                  <span>Employment {i + 1}</span>
                  {form.employmentHistory.length > 1 && (
                    <button type="button" className="np-edit-block__remove" onClick={() => uf('employmentHistory', form.employmentHistory.filter((_, j) => j !== i))}>
                      <FiTrash2 size={12} /> Remove
                    </button>
                  )}
                </div>
                <div className="np-edit-form np-edit-form--grid">
                  <EditRow label="Job title" field={`emp-${i}-title`} children={<input className={NP_EDIT_INPUT_CLASS} value={emp.jobTitle} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], jobTitle: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Employer" field={`emp-${i}-emp`} children={<input className={NP_EDIT_INPUT_CLASS} value={emp.employerName} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], employerName: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Business type" field={`emp-${i}-biz`} children={<input className={NP_EDIT_INPUT_CLASS} value={emp.businessType} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], businessType: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Start date" field={`emp-${i}-date`} children={<input type="date" className={NP_EDIT_INPUT_CLASS} value={emp.startDate} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], startDate: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Grade" field={`emp-${i}-grade`} children={<input className={NP_EDIT_INPUT_CLASS} value={emp.grade} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], grade: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Reporting officer" field={`emp-${i}-ro`} children={<input className={NP_EDIT_INPUT_CLASS} value={emp.reportingOfficer} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], reportingOfficer: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Contact person" field={`emp-${i}-cp`} children={<input className={NP_EDIT_INPUT_CLASS} value={emp.contactPerson} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], contactPerson: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Address" field={`emp-${i}-addr`} children={<input className={NP_EDIT_INPUT_CLASS} value={emp.address} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], address: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Description of duties" field={`emp-${i}-duties`} wide children={<textarea className={NP_EDIT_INPUT_CLASS} rows={3} value={emp.descriptionOfDuties} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], descriptionOfDuties: e.target.value }; uf('employmentHistory', arr); }} />} />
                  <EditRow label="Reason for leaving" field={`emp-${i}-leave`} wide children={<input className={NP_EDIT_INPUT_CLASS} value={emp.reasonForLeaving} onChange={(e) => { const arr = [...form.employmentHistory]; arr[i] = { ...arr[i], reasonForLeaving: e.target.value }; uf('employmentHistory', arr); }} />} />
                </div>
              </div>
            ))}
            <button type="button" className="np-edit-add-btn" onClick={() => uf('employmentHistory', [...(form.employmentHistory || []), { jobTitle: '', employerName: '', businessType: '', startDate: '', grade: '', reportingOfficer: '', contactPerson: '', address: '', descriptionOfDuties: '', reasonForLeaving: '' }])}>
              <FiPlus size={14} /> Add employment
            </button>
          </div>
        );
      case 'supporting-staff':
        return (
          <div className="np-edit-form np-edit-form--grid">
            <EditRow label="Has staff relation" field="staffRelation" options={['No', 'Yes']} getValue={getEditField} setValue={setEditField} />
            {ef('staffRelation') === 'Yes' && <EditRow label="Relation detail" field="staffRelationDetail" wide getValue={getEditField} setValue={setEditField} />}
            <EditRow label="How applied" field="vacancyAdvertised" wide getValue={getEditField} setValue={setEditField} />
          </div>
        );
      case 'supporting-referees':
        return (
          <div className="np-edit-form">
            {(form.referees || []).map((ref, i) => (
              <div key={i} className="np-edit-block">
                <div className="np-edit-block__head"><span>Referee {i + 1}</span></div>
                <div className="np-edit-form np-edit-form--grid">
                  <EditRow label="Name" field={`ref-${i}-name`} children={<input className={NP_EDIT_INPUT_CLASS} value={ref.name} onChange={(e) => { const refs = [...form.referees]; refs[i] = { ...refs[i], name: e.target.value }; uf('referees', refs); }} />} />
                  <EditRow label="Address" field={`ref-${i}-addr`} children={<input className={NP_EDIT_INPUT_CLASS} value={ref.address} onChange={(e) => { const refs = [...form.referees]; refs[i] = { ...refs[i], address: e.target.value }; uf('referees', refs); }} />} />
                  <EditRow label="Phone" field={`ref-${i}-tel`} children={<input className={NP_EDIT_INPUT_CLASS} value={ref.telephone} onChange={(e) => { const refs = [...form.referees]; refs[i] = { ...refs[i], telephone: e.target.value }; uf('referees', refs); }} />} />
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="app-modal-dialog app-modal-dialog--xl np-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nurse-edit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal-dialog__header np-edit-modal__header">
          <div>
            <p className="np-edit-modal__kicker">Edit nurse profile</p>
            <h2 id="nurse-edit-modal-title" className="app-modal-dialog__title">
              {EDIT_MODAL_TITLES[section] || 'Edit section'}
            </h2>
            <p className="np-edit-modal__sub">{subtitle}</p>
          </div>
          <button type="button" className="app-modal-dialog__close" onClick={onCancel} aria-label="Close edit form">
            <FiX size={20} strokeWidth={1.75} />
          </button>
        </div>
        <div className="app-modal-dialog__body np-edit-modal__body">
          {error && (
            <div className="np-edit-modal__error">
              <FiAlertCircle size={14} />
              {error}
            </div>
          )}
          {renderForm()}
        </div>
        <div className="app-modal-dialog__footer np-edit-modal__footer">
          <button type="button" className="app-modal-dialog__btn-cancel" disabled={saving} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary workforce-modal-primary-btn np-edit-modal__save"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(form);
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
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
  const { progress: loadProgress, finishProgress } = useLoadProgress(loading);

  // ── Avatar upload ──
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingKey, setUploadingKey] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null); // { url, fileName, fileType, label }
  const [editingSection, setEditingSection] = useState(null);
  const [editInitialData, setEditInitialData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [nurseStatusConfirm, setNurseStatusConfirm] = useState(null); // { action: 'deactivate' | 'reactivate' }
  const [nurseStatusConfirmError, setNurseStatusConfirmError] = useState('');
  const [deactivatingNurse, setDeactivatingNurse] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showRegistrationBanner, setShowRegistrationBanner] = useState(true);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    if (!showMoreMenu) return undefined;
    const onPointerDown = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setShowMoreMenu(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showMoreMenu]);

  const startEditing = (section, data) => {
    setEditingSection(section);
    setEditInitialData(data || {});
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditInitialData(null);
    setEditError('');
  };

  const resolveNurseIdForUpdate = () => {
    const candidates = [
      nurse?._id,
      nurse?.id,
      nurse?.uuid,
      nurse?.nurseId,
      nurseId,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    const mongoId = candidates.find((id) => /^[a-f\d]{24}$/i.test(id));
    if (mongoId) return mongoId;

    const uuid = candidates.find((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
    if (uuid) return uuid;

    return candidates[0] || '';
  };

  /** Deactivate/reactivate APIs expect the nurse UUID, e.g. /nurses/:uuid/deactivate */
  const resolveNurseIdForStatusAction = () => {
    const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
    const candidates = [
      nurse?.uuid,
      nurse?.nurseId,
      nurse?.id,
      nurseId,
      nurse?._id,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    const uuid = candidates.find(isUuid);
    if (uuid) return uuid;

    return candidates[0] || resolveNurseIdForUpdate();
  };

  const handleSaveSection = async (form) => {
    const endpoint = EDIT_ENDPOINT_BY_SECTION[editingSection];
    if (!endpoint) {
      setEditError('This section cannot be saved. Please close and try again.');
      return;
    }

    const resolvedId = resolveNurseIdForUpdate();
    if (!resolvedId) {
      setEditError('Nurse ID is missing. Refresh the page and try again.');
      return;
    }

    setSavingEdit(true);
    setEditError('');
    try {
      const res = await apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ nurseId: resolvedId, ...form }),
      });

      const responseText = await res.text().catch(() => '');
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Update failed (HTTP ${res.status})`);
      }

      applyNurseSectionEdit(editingSection, form, {
        setNurse,
        setDiversity,
        setEducation,
        setSupporting,
      });
      setEditingSection(null);
      setEditInitialData(null);
    } catch (err) {
      setEditError(err?.message || 'Failed to save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const avatarInputRef = useRef(null);

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
      const [nurseRes, assignmentsRes, patientsList] = await Promise.all([
        apiFetch(`/nurses/${nurseId}`),
        apiFetch('/assignments', { method: 'GET' }).catch(() => null),
        fetchAllPatients().catch(() => []),
      ]);

      if (!nurseRes.ok) {
        if (nurseRes.status === 404) { setError('not_found'); setLoading(false); return; }
        throw new Error(`HTTP ${nurseRes.status}`);
      }
      const data = await nurseRes.json();
      const personalData = data.personal || data.nurse || data;
      const statusIdCandidates = [
        personalData?.uuid,
        personalData?.nurseId,
        personalData?.id,
        data?.uuid,
        data?.nurseId,
        data?.id,
        data?.nurse?.uuid,
        data?.nurse?.id,
        nurseId,
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      const statusUuid = statusIdCandidates.find((id) => (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      ));
      // API returns { personal, diversity, education, supportingInfo, documents }
      setNurse({
        ...personalData,
        ...(statusUuid ? { uuid: personalData?.uuid || statusUuid } : {}),
      });
      setDiversity(data.diversity || null);
      setEducation(data.education || null);
      setSupporting(data.supportingInfo || null);

      try {
        let assignmentsPayload = {};
        if (assignmentsRes) {
          try {
            assignmentsPayload = await assignmentsRes.json();
          } catch {
            assignmentsPayload = {};
          }
        }

        const patientList = Array.isArray(patientsList) ? patientsList : [];

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
      const persistedDocuments = Array.isArray(data.documents) ? data.documents : [];

      const profilePhotoUrlPromise = persistedProfilePhoto.url
        ? Promise.resolve(persistedProfilePhoto.url)
        : resolveStoredMediaUrl({
          mediaId: persistedProfilePhoto.mediaId,
          objectKey: persistedProfilePhoto.objectKey,
        });

      const [resolvedProfilePhotoUrl, docsWithUrls] = await Promise.all([
        profilePhotoUrlPromise,
        Promise.all(
          persistedDocuments.map(async (doc) => ({
            doc,
            resolvedUrl:
              doc.link?.url
              || doc.url
              || await resolveStoredMediaUrl({
                mediaId: doc.mediaId || doc.media?.id,
                objectKey: doc.objectKey,
              }),
          })),
        ),
      ]);

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

      for (const { doc, resolvedUrl } of docsWithUrls) {
        const possibleSlots = DOC_TYPE_TO_SLOTS[doc.documentType] || [];
        const targetSlot = possibleSlots.find(s => !filled[s]);
        if (!targetSlot) continue;
        filled[targetSlot] = true;

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
      finishProgress(() => setLoading(false));
    }
  }, [nurseId, finishProgress]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Error / not-found screens ──
  if (loading) {
    return (
      <div className="page-wrapper nurse-profile-page nurse-profile-page--loading">
        <TablePageLoaderPanel
          progress={loadProgress}
          ariaLabel="Loading nurse profile"
        />
      </div>
    );
  }

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

  const hasDiversity = !!diversity;
  const hasEducation = !!education;
  const hasSupporting = !!supporting;
  const stepsComplete = [true, hasDiversity, hasEducation, hasSupporting].filter(Boolean).length;
  const isFullyComplete = stepsComplete === 4;

  const goContinueRegistration = () => {
    const id = String(
      nurse?._id || nurse?.id || nurseId || '',
    ).trim();
    if (!id) {
      navigate('/workforce');
      return;
    }
    stashContinueNurseRegistration(id);
    navigate(`/workforce?continueRegistration=${encodeURIComponent(id)}`, {
      state: { continueRegistration: id },
    });
  };

  // ── Patients assigned to this nurse ──
  const currentPatients = assignedPatients.filter(p => p.status === 'active');
  const overviewRoster = (currentPatients.length ? currentPatients : assignedPatients).slice(0, 8);
  const docCount = Object.values(kycDocs).filter(Boolean).length;
  const qualCount = education?.qualifications?.filter(q => q?.name || q?.institution)?.length || 0;

  const buildPersonalEditForm = () => ({
    firstName: n.firstName || '',
    lastName: n.lastName || '',
    email: n.email || '',
    phone: n.phone || '',
    homeTelephone: n.homeTelephone || '',
    gender: n.gender || '',
    address: n.address || '',
    citizenship: n.citizenship || '',
    title: n.title || '',
  });

  const openPersonalEdit = () => startEditing('personal', buildPersonalEditForm());

  const openDiversityEdit = () => startEditing('diversity', {
    race: diversity?.race || '',
    religion: diversity?.religion || '',
    disability: diversity?.disability || 'No',
    disability_detail: diversity?.disability_detail || '',
    criminal_records: diversity?.criminal_records || 'No',
    criminal_record_detail: diversity?.criminal_record_detail || '',
  });

  const statusNormalized = String(status || '').toLowerCase();
  const isNurseDeactivated = statusNormalized.includes('deactiv') || statusNormalized.includes('inactive');
  const statusLabel = isNurseDeactivated
    ? 'Deactivated'
    : (statusNormalized === 'active' ? 'Active' : status);
  const statusBadgeClass = isNurseDeactivated
    ? ' np-badge--deactivated'
    : (statusNormalized === 'active' ? ' np-badge--active' : ' np-badge--pending');

  const closeNurseStatusConfirm = () => {
    if (deactivatingNurse) return;
    setNurseStatusConfirm(null);
    setNurseStatusConfirmError('');
  };

  const runNurseStatusAction = async (action, successMessage, failureMessage) => {
    const id = resolveNurseIdForStatusAction();
    if (!id) {
      setNurseStatusConfirmError(`Unable to ${action} this nurse because a valid nurse ID was not found.`);
      return;
    }

    setDeactivatingNurse(true);
    setDeactivateSuccess('');
    setNurseStatusConfirmError('');

    try {
      const response = await apiFetch(`/nurses/${encodeURIComponent(id)}/${action}`, {
        method: 'PATCH',
        quiet: true,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || failureMessage);
      }

      const nextStatus = action === 'deactivate' ? 'deactivated' : 'active';
      setNurse((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      setNurseStatusConfirm(null);
      setDeactivateSuccess(payload?.message || successMessage);
    } catch (err) {
      setNurseStatusConfirmError(err?.message || failureMessage);
    } finally {
      setDeactivatingNurse(false);
    }
  };

  const confirmNurseStatusAction = async () => {
    if (!nurseStatusConfirm) return;
    if (nurseStatusConfirm.action === 'deactivate') {
      await runNurseStatusAction(
        'deactivate',
        'Nurse has been deactivated successfully.',
        'Unable to deactivate nurse.',
      );
      return;
    }
    await runNurseStatusAction(
      'reactivate',
      'Nurse has been reactivated successfully.',
      'Unable to reactivate nurse.',
    );
  };

  /* ── RENDER ── */
  return (
    <div className="page-wrapper nurse-profile-page nurse-profile-page--simple">

      {deactivateSuccess && (
        <div className="np-alert np-alert--success">
          <FiCheckCircle size={15} style={{ flexShrink: 0 }} />
          <span>{deactivateSuccess}</span>
          <button type="button" className="np-alert__btn" onClick={() => setDeactivateSuccess('')}>
            Dismiss
          </button>
        </div>
      )}

      {!isFullyComplete && showRegistrationBanner && (
        <div className="np-progress-banner" role="status">
          <div className="np-progress-banner__icon" aria-hidden>
            <FiClipboard size={18} />
          </div>
          <div className="np-progress-banner__body">
            <div className="np-progress-banner__copy">
              <strong>Registration incomplete</strong>
              <span>{stepsComplete} of 4 steps done — finish onboarding to activate the full nurse record.</span>
            </div>
            <div className="np-progress-banner__track" aria-hidden>
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={`np-progress-banner__step${step <= stepsComplete ? ' is-done' : ''}`}
                />
              ))}
            </div>
          </div>
          <button type="button" onClick={goContinueRegistration} className="np-progress-banner__cta">
            Complete registration
            <FiArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} aria-hidden />
          </button>
          <button
            type="button"
            className="np-progress-banner__close"
            aria-label="Dismiss registration banner"
            onClick={() => setShowRegistrationBanner(false)}
          >
            <FiX size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="nurse-profile-shell">
        <nav className="np-nav">
          <button type="button" onClick={() => navigate('/workforce')} className="np-back">
            <FiArrowLeft size={15} />
            Nurses
          </button>
          <div className="np-nav__actions">
            <button type="button" className="np-cta-btn" onClick={openPersonalEdit}>
              <span className="np-cta-btn__icon"><FiEdit2 size={14} /></span>
              <span className="np-cta-btn__label">Edit profile</span>
            </button>
            <button type="button" title="Refresh" onClick={fetchProfile} className="np-icon-btn">
              <FiRefreshCw size={15} />
            </button>
            <div className="np-more" ref={moreMenuRef}>
              <button
                type="button"
                className={`np-icon-btn${showMoreMenu ? ' is-open' : ''}`}
                aria-expanded={showMoreMenu}
                aria-haspopup="menu"
                title="More actions"
                onClick={() => setShowMoreMenu((v) => !v)}
              >
                <FiMoreHorizontal size={16} />
              </button>
              {showMoreMenu && (
                <div className="np-more__menu" role="menu">
                  {isNurseDeactivated ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={deactivatingNurse}
                      onClick={() => {
                        setShowMoreMenu(false);
                        setNurseStatusConfirmError('');
                        setNurseStatusConfirm({ action: 'reactivate' });
                      }}
                    >
                      Reactivate nurse
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="is-danger"
                      disabled={deactivatingNurse}
                      onClick={() => {
                        setShowMoreMenu(false);
                        setNurseStatusConfirmError('');
                        setNurseStatusConfirm({ action: 'deactivate' });
                      }}
                    >
                      Deactivate nurse
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        <header className="np-hero">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <div className="np-hero__identity">
            <div
              className="np-avatar"
              onClick={() => avatarInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter') avatarInputRef.current?.click(); }}
              role="button"
              tabIndex={0}
              title="Upload photo"
              style={{ background: avatarUrl ? 'transparent' : undefined }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="" loading="lazy" />
                : initials}
              <span className="np-avatar__hint">
                <FiCamera size={14} />
                Photo
              </span>
            </div>
            <div className="np-hero__copy">
              <p className="np-hero__kicker">Nurse profile</p>
              <h1 className="np-hero__name">{fullName}</h1>
              <p className="np-hero__meta">
                <span>{roleLabel}</span>
                {n.phone && n.phone !== '—' ? <span>· {n.phone}</span> : null}
                {n.email ? <span>· {n.email}</span> : null}
              </p>
              <div className="np-hero__badges">
                <span className={`np-badge${statusBadgeClass}`}>{statusLabel}</span>
                {!isFullyComplete && (
                  <span className="np-badge np-badge--warn">Registration {stepsComplete}/4</span>
                )}
              </div>
            </div>
          </div>

          <div className="np-hero__stats" aria-label="Profile summary">
            <div className="np-stat">
              <strong>{currentPatients.length}</strong>
              <span>Patients</span>
            </div>
            <div className="np-stat">
              <strong>{docCount}</strong>
              <span>Documents</span>
            </div>
            <div className="np-stat">
              <strong>{qualCount}</strong>
              <span>Qualifications</span>
            </div>
            <div className={`np-stat${isFullyComplete ? ' np-stat--complete' : ''}`}>
              <strong>{isFullyComplete ? 'Done' : `${stepsComplete}/4`}</strong>
              <span>Registration</span>
            </div>
          </div>
        </header>

        <div className="np-board">
          <div className="np-tabs" role="tablist" aria-label="Nurse profile sections">
            {TABS.map((t) => {
              const tabHasData = t.key === 'overview'
                ? true
                : t.key === 'diversity'
                  ? hasDiversity
                  : t.key === 'education'
                    ? hasEducation
                    : t.key === 'supporting'
                      ? hasSupporting
                      : true;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`np-tab${tab === t.key ? ' active' : ''}`}
                >
                  {t.icon}
                  {t.label}
                  {t.key !== 'overview' && t.key !== 'documents' && (
                    <span className={`np-tab__dot${tabHasData ? ' is-ready' : ''}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="np-content">

          {tab === 'overview' && (
            <div className="np-overview-grid">
            <Panel
              title="Personal details"
              icon={<FiUser size={14} />}
              accent="#45B6FE"
              action={(
                <button type="button" onClick={openPersonalEdit} className="np-edit-btn">
                  <FiEdit2 size={12} /> Edit
                </button>
              )}
            >
              <DataRow label="Name">{fullName}</DataRow>
              <DataRow label="Email" missing={!n.email}>{n.email}</DataRow>
              <DataRow label="Phone" missing={!n.phone || n.phone === '—'}>{n.phone}</DataRow>
              <DataRow label="Gender" missing={!n.gender}>{n.gender}</DataRow>
              <DataRow label="Address" missing={!n.address || n.address === '—'}>{n.address}</DataRow>
              <DataRow label="License">{n.mmcPinNo}</DataRow>
            </Panel>

            <section className="np-overview-patients">
              <h3 className="np-section-title">Assigned patients</h3>
              {overviewRoster.length === 0 ? (
                <p className="np-empty">No patients assigned to this nurse yet.</p>
              ) : (
                <ul className="np-patient-list">
                  {overviewRoster.map((patient) => (
                    <li
                      key={patient.id}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/patients/${patient.id}`); }}
                      role="button"
                      tabIndex={0}
                    >
                      <div>
                        <span className="np-patient-list__name">{patient.name}</span>
                        <span className="np-patient-list__sub">{patient.diagnosis}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--np-muted)' }}>{patient.region}</span>
                      <span className={`np-badge${patient.status === 'active' ? ' np-badge--active' : ' np-badge--pending'}`}>
                        {patient.status === 'active' ? 'Active' : 'Discharged'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            </div>
          )}

          {/* ═══ DIVERSITY & HEALTH ═══ */}
          {tab === 'diversity' && (
            <div className="row g-3">
              {!hasDiversity ? (
                <div className="col-12">
                  <div className="nurse-profile-empty-state">
                    <FiAlertCircle size={36} className="nurse-profile-empty-state__icon" />
                    <div className="nurse-profile-empty-state__title">Diversity & Health information not yet submitted</div>
                    <div className="nurse-profile-empty-state__text">Step 2 of the nurse registration has not been completed.</div>
                    <button type="button" onClick={goContinueRegistration} className="nurse-profile-empty-state__btn">
                      Complete Registration
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="col-md-6">
                    <Panel title="Diversity Information" icon={<FiUser size={14} />} accent="#45B6FE"
                      action={<button type="button" onClick={openDiversityEdit} className="np-edit-btn"><FiEdit2 size={11} /> Edit</button>}
                    >
                      <DataRow label="Race / Ethnicity" missing={!diversity.race}>{diversity.race}</DataRow>
                      <DataRow label="Religion" missing={!diversity.religion}>{diversity.religion}</DataRow>
                    </Panel>
                  </div>
                  <div className="col-md-6">
                    <Panel title="Health Disclosures" icon={<FiShield size={14} />} accent="#2E7DB8"
                      action={<button type="button" onClick={openDiversityEdit} className="np-edit-btn"><FiEdit2 size={11} /> Edit</button>}
                    >
                      <DataRow label="Disability">{diversity.disability || 'No'}</DataRow>
                      {diversity.disability === 'Yes' && (
                        <DataRow label="Disability Detail">{diversity.disability_detail}</DataRow>
                      )}
                      <DataRow label="Criminal Records">{diversity.criminal_records || 'No'}</DataRow>
                      {diversity.criminal_records === 'Yes' && (
                        <DataRow label="Criminal Record Detail">{diversity.criminal_record_detail}</DataRow>
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
                <div className="nurse-profile-empty-state">
                  <FiAlertCircle size={36} className="nurse-profile-empty-state__icon" />
                  <div className="nurse-profile-empty-state__title">Education & Employment not yet submitted</div>
                  <div className="nurse-profile-empty-state__text">Step 3 of the nurse registration has not been completed.</div>
                  <button type="button" onClick={goContinueRegistration} className="nurse-profile-empty-state__btn">
                    Complete Registration
                  </button>
                </div>
              ) : (
                  <>
                  {/* ── Qualifications ── */}
                  <div className="col-12">
                    <Panel title="Qualifications" icon={<FiAward size={14} />} accent="#45B6FE"
                      action={(
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{(education.qualifications || []).length} records</span>
                          <button type="button" onClick={() => startEditing('qualifications', { qualifications: (education.qualifications || []).map((q) => ({ name: q.name || '', institution: q.institution || '', result: q.result || '', year: q.year || '' })) })} className="np-edit-btn"><FiEdit2 size={11} /> Edit</button>
                        </div>
                      )}
                    >
                        {(education.qualifications || []).length === 0 ? (
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
                        )}
                    </Panel>
                  </div>

                  {/* ── Training Courses ── */}
                  <div className="col-md-5">
                    <Panel title="Training Courses" icon={<FiCheckCircle size={14} />} accent="#2E7DB8"
                      action={(
                        <button type="button" onClick={() => startEditing('training', { trainingCourses: (education.trainingCourses || []).filter((t) => t).length > 0 ? [...education.trainingCourses.filter((t) => t)] : [''] })} className="np-edit-btn"><FiEdit2 size={11} /> Edit</button>
                      )}
                    >
                        {(education.trainingCourses || []).filter((t) => t).length === 0 ? (
                          <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '12px 0', textAlign: 'center' }}>No training courses recorded</div>
                        ) : (
                          education.trainingCourses.filter(t => t).map((course, i) => (
                            <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <FiCheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, color: 'var(--kh-text)' }}>{course}</span>
                            </div>
                          ))
                        )}
                    </Panel>
                  </div>

                  {/* ── Employment History ── */}
                  <div className="col-12">
                    <Panel title="Employment History" icon={<FiClipboard size={14} />} accent="#45B6FE"
                      action={(
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '2px 10px' }}>{(education.employmentHistory || []).length} {(education.employmentHistory || []).length === 1 ? 'record' : 'records'}</span>
                          <button type="button" onClick={() => startEditing('employment', { employmentHistory: (education.employmentHistory || []).map((emp) => ({ jobTitle: emp.jobTitle || '', employerName: emp.employerName || '', businessType: emp.businessType || '', startDate: emp.startDate ? emp.startDate.split('T')[0] : '', grade: emp.grade || '', reportingOfficer: emp.reportingOfficer || '', contactPerson: emp.contactPerson || '', address: emp.address || '', descriptionOfDuties: emp.descriptionOfDuties || '', reasonForLeaving: emp.reasonForLeaving || '' })) })} className="np-edit-btn"><FiEdit2 size={11} /> Edit</button>
                        </div>
                      )}
                    >
                        {(education.employmentHistory || []).length === 0 ? (
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
                  <div className="nurse-profile-empty-state">
                    <FiAlertCircle size={36} className="nurse-profile-empty-state__icon" />
                    <div className="nurse-profile-empty-state__title">Supporting Information not yet submitted</div>
                    <div className="nurse-profile-empty-state__text">Step 4 of the nurse registration has not been completed.</div>
                    <button type="button" onClick={goContinueRegistration} className="nurse-profile-empty-state__btn">
                      Complete Registration
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="col-md-6">
                    <Panel title="Staff Relationship" icon={<FiUser size={14} />} accent="#45B6FE"
                      action={<button type="button" onClick={() => startEditing('supporting-staff', { staffRelation: supporting.staffRelation || 'No', staffRelationDetail: supporting.staffRelationDetail || '', vacancyAdvertised: supporting.vacancyAdvertised || '' })} className="np-edit-btn"><FiEdit2 size={11} /> Edit</button>}
                    >
                      <DataRow label="Has Staff Relation">{supporting.staffRelation || 'No'}</DataRow>
                      {supporting.staffRelation === 'Yes' && (
                        <DataRow label="Relation Detail">{supporting.staffRelationDetail}</DataRow>
                      )}
                    </Panel>
                    <Panel title="Vacancy Source" icon={<FiFileText size={14} />} accent="#45B6FE">
                      <DataRow label="How Applied">{supporting.vacancyAdvertised || '—'}</DataRow>
                      {supporting.vacancyDetail && Object.entries(supporting.vacancyDetail).map(([k, v]) => (
                        <DataRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')}>{v}</DataRow>
                      ))}
                    </Panel>
                  </div>
                  <div className="col-md-6">
                    <Panel title="Referees" icon={<FiUser size={14} />} accent="#2E7DB8"
                      action={(
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{(supporting.referees || []).filter((r) => r.name).length} provided</span>
                          <button type="button" onClick={() => { const refs = (supporting.referees || []).map((r) => ({ name: r.name || '', address: r.address || '', telephone: r.telephone || '' })); while (refs.length < 2) refs.push({ name: '', address: '', telephone: '' }); startEditing('supporting-referees', { referees: refs }); }} className="np-edit-btn"><FiEdit2 size={11} /> Edit</button>
                        </div>
                      )}
                    >
                        {(supporting.referees || []).filter((r) => r.name).length === 0 ? (
                          <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '12px 0', textAlign: 'center' }}>No referees provided</div>
                        ) : (
                          (supporting.referees || []).filter(r => r.name).map((ref, i) => (
                            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 4 }}>Referee {i + 1}: {ref.name}</div>
                              {ref.address && <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 2 }}><FiMapPin size={11} style={{ marginRight: 4 }} />{ref.address}</div>}
                              {ref.telephone && <div style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}><FiPhone size={11} style={{ marginRight: 4 }} />{ref.telephone}</div>}
                            </div>
                          ))
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

      {/* ═══ EDIT MODAL ═══ */}
      {editingSection && (
        <NurseProfileEditModal
          section={editingSection}
          initialData={editInitialData}
          subtitle={fullName}
          saving={savingEdit}
          error={editError}
          onCancel={cancelEditing}
          onSave={handleSaveSection}
        />
      )}

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

      {nurseStatusConfirm && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={closeNurseStatusConfirm}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nurse-status-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="nurse-status-confirm-title" className="destructive-confirm-dialog__title">
                {nurseStatusConfirm.action === 'deactivate' ? 'Deactivate nurse' : 'Reactivate nurse'}
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={deactivatingNurse}
                onClick={closeNurseStatusConfirm}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                {nurseStatusConfirm.action === 'deactivate'
                  ? 'Are you sure you want to deactivate this nurse? They will be moved out of the active workforce list.'
                  : 'Are you sure you want to reactivate this nurse? They will return to the active workforce list.'}
              </p>
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  {nurseStatusConfirm.action === 'deactivate' ? (
                    <>
                      <strong>Warning:</strong> Deactivated nurses cannot receive new patient assignments until reactivated.
                    </>
                  ) : (
                    <>
                      <strong>Note:</strong> Reactivating restores this nurse to active status for care and scheduling.
                    </>
                  )}
                </div>
              </div>
              {nurseStatusConfirmError && (
                <div className="destructive-confirm-dialog__banner-error">{nurseStatusConfirmError}</div>
              )}
              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiUser size={18} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{fullName}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {roleLabel}
                    {nurseId ? ` · ${nurseId}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={deactivatingNurse}
                onClick={closeNurseStatusConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={nurseStatusConfirm.action === 'deactivate'
                  ? 'destructive-confirm-dialog__btn-danger'
                  : 'btn btn-kh-primary'}
                disabled={deactivatingNurse}
                onClick={confirmNurseStatusAction}
              >
                {deactivatingNurse
                  ? (nurseStatusConfirm.action === 'deactivate' ? 'Deactivating…' : 'Reactivating…')
                  : (nurseStatusConfirm.action === 'deactivate' ? 'Deactivate Nurse' : 'Reactivate Nurse')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
