import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiPlus, FiSearch, FiX, FiChevronRight, FiChevronLeft, FiChevronDown, FiCheck, FiSave,
  FiChevronsLeft, FiChevronsRight, FiCheckCircle, FiInfo, FiDownload, FiUser,
  FiMoreHorizontal, FiTrash2, FiAlertCircle, FiRefreshCw, FiFileText, FiArrowRight,
} from '../icons/hugeicons-feather';
import {
  collectPatientAssignmentIds,
  extractApiPatientId,
  fetchAllPatients,
  isLikelyMongoObjectId,
  resolveMongoIdFromCandidates,
  resolvePatientMutationId,
} from '../utils/patients';
import {
  resolveAdmissionResumePatientId,
} from '../utils/admissionFormFromPatient';
import {
  collectAdmissionDraftLookupIds,
  findAdmissionDraftForPatient,
  getAdmissionDraft,
  listAdmissionDrafts,
  markAdmissionDraftComplete,
  upsertAdmissionDraft,
} from '../utils/admissionDrafts';
import {
  ADMISSION_SECTION_COUNT,
  buildAdmissionResumeDraft,
  fetchAdmissionPatientBundle,
} from '../utils/admissionResume';
import TablePageLoader from '../components/TablePageLoader';
import DataTableHeader, { HospitalStatus } from '../components/DataTableHeader';
import HospitalBoardToolbar from '../components/HospitalBoardToolbar';
import HospitalTableActions from '../components/HospitalTableActions';
import PatientNurseAssignDropdown from '../components/PatientNurseAssignDropdown';
import { useLoadProgress } from '../hooks/useLoadProgress';
import { apiFetch } from '../api';
import {
  ADMISSION_TAB_KEYS,
  buildHygienePsychologicalAdmissionPayload,
  createAdmissionApiHelpers,
  saveAdmissionProgressForTab,
  saveAdmissionTab,
} from '../utils/admissionProgress';

function extractPatientRegistrationNumber(patient) {
  const personal = patient?.personalInfo || patient?.personal || {};
  return String(
    personal.registrationNumber
    || personal.regNo
    || patient?.registrationNumber
    || patient?.regNo
    || patient?.registration_number
    || '',
  ).trim();
}

function buildRegistrationExcludeIds(excludePatientId) {
  const excludeIds = new Set();
  const add = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized) excludeIds.add(normalized);
  };

  add(excludePatientId);
  const draft = getAdmissionDraft(excludePatientId);
  if (draft) {
    add(draft.patientId);
    (draft.lookupIds || []).forEach(add);
  }

  return excludeIds;
}

async function findPatientIdByRegistration(rawRegistrationNumber) {
  const normalized = String(rawRegistrationNumber || '').trim().toLowerCase();
  if (!normalized) return '';

  const patientList = await fetchAllPatients();
  for (const patient of patientList) {
    if (String(extractPatientRegistrationNumber(patient)).trim().toLowerCase() !== normalized) continue;
    return (
      resolvePatientMutationId(patient)
      || extractApiPatientId(patient)
      || String(patient?._id || patient?.id || '').trim()
      || ''
    );
  }

  return '';
}

const patientsData = [
  { id: 'P-1001', name: 'Kwame Boateng', age: 72, gender: 'Male', diagnosis: 'Hypertension, Type 2 Diabetes', phone: '+233 24 111 2222', address: '14 Osu Badu St, Accra', region: 'Accra', nurses: ['Efua Mensah'], emergency: 'Ama Boateng (+233 20 333 4444)', status: 'active', enrolled: '2024-06-01' },
  { id: 'P-1002', name: 'Abena Osei', age: 65, gender: 'Female', diagnosis: 'Post-surgical wound care', phone: '+233 20 555 6666', address: '7 Adum Road, Kumasi', region: 'Kumasi', nurses: ['Yaa Asantewaa', 'Ama Darko'], emergency: 'Kofi Osei (+233 27 777 8888)', status: 'active', enrolled: '2024-08-15' },
  { id: 'P-1003', name: 'Kofi Ankrah', age: 58, gender: 'Male', diagnosis: 'Diabetes, Peripheral Neuropathy', phone: '+233 27 999 0000', address: '22 Dagomba Line, Tamale', region: 'Tamale', nurses: ['Ama Darko'], emergency: 'Yaa Ankrah (+233 24 111 0000)', status: 'active', enrolled: '2024-09-20' },
  { id: 'P-1004', name: 'Akosua Mensah', age: 80, gender: 'Female', diagnosis: 'GERD, Osteoarthritis', phone: '+233 26 222 3333', address: '3 Cantonments Rd, Accra', region: 'Accra', nurses: [], emergency: 'Kwesi Mensah (+233 55 444 5555)', status: 'active', enrolled: '2025-01-10' },
  { id: 'P-1005', name: 'Yaw Frimpong', age: 45, gender: 'Male', diagnosis: 'Stroke rehabilitation', phone: '+233 23 666 7777', address: '18 Market Circle, Takoradi', region: 'Takoradi', nurses: [], emergency: 'Esi Frimpong (+233 20 888 9999)', status: 'active', enrolled: '2025-03-01' },
  { id: 'P-1006', name: 'Esi Appiah', age: 68, gender: 'Female', diagnosis: 'COPD, Asthma', phone: '+233 55 000 1111', address: '9 Spintex Rd, Accra', region: 'Accra', nurses: ['Yaa Asantewaa'], emergency: 'Kojo Appiah (+233 24 222 3333)', status: 'active', enrolled: '2025-06-15' },
  { id: 'P-1007', name: 'Nana Agyemang', age: 77, gender: 'Male', diagnosis: 'Heart failure, Chronic kidney disease', phone: '+233 27 444 5555', address: '12 Ridge Rd, Accra', region: 'Accra', nurses: ['Efua Mensah'], emergency: 'Adwoa Agyemang (+233 20 666 7777)', status: 'discharged', enrolled: '2024-04-01' },
  { id: 'P-1008', name: 'Afia Kumah', age: 55, gender: 'Female', diagnosis: 'Rheumatoid Arthritis', phone: '+233 26 888 9999', address: '5 Castle Rd, Cape Coast', region: 'Cape Coast', nurses: [], emergency: 'Kwame Kumah (+233 55 000 1111)', status: 'active', enrolled: '2025-11-01' },
  { id: 'P-1009', name: 'Kwesi Mensah', age: 63, gender: 'Male', diagnosis: 'Chronic Kidney Disease Stage 3', phone: '+233 24 333 4444', address: '11 Liberation Rd, Accra', region: 'Accra', nurses: ['Efua Mensah'], emergency: 'Akua Mensah (+233 20 111 2222)', status: 'active', enrolled: '2025-02-10' },
  { id: 'P-1010', name: 'Adwoa Darko', age: 70, gender: 'Female', diagnosis: 'Parkinson Disease', phone: '+233 27 555 6666', address: '8 Asafo Market Rd, Kumasi', region: 'Kumasi', nurses: ['Yaa Asantewaa'], emergency: 'Yaw Darko (+233 26 777 8888)', status: 'active', enrolled: '2025-04-20' },
  { id: 'P-1011', name: 'Kojo Asante', age: 82, gender: 'Male', diagnosis: 'Dementia, Hypertension', phone: '+233 55 111 2222', address: '15 Airport Rd, Accra', region: 'Accra', nurses: [], emergency: 'Ama Asante (+233 24 555 6666)', status: 'active', enrolled: '2025-07-01' },
  { id: 'P-1012', name: 'Efua Aidoo', age: 48, gender: 'Female', diagnosis: 'Multiple Sclerosis', phone: '+233 20 999 0000', address: '6 Beach Rd, Takoradi', region: 'Takoradi', nurses: ['Adwoa Badu'], emergency: 'Kofi Aidoo (+233 27 333 4444)', status: 'active', enrolled: '2025-09-15' },
  { id: 'P-1013', name: 'Yaa Ofosu', age: 74, gender: 'Female', diagnosis: 'Congestive Heart Failure', phone: '+233 26 444 5555', address: '20 Sunyani Rd, Sunyani', region: 'Sunyani', nurses: ['Yaa Asantewaa'], emergency: 'Kwame Ofosu (+233 55 888 9999)', status: 'active', enrolled: '2025-08-01' },
  { id: 'P-1014', name: 'Ama Boahen', age: 60, gender: 'Female', diagnosis: 'Breast cancer post-mastectomy', phone: '+233 24 666 7777', address: '9 Ho Bypass Rd, Ho', region: 'Ho', nurses: ['Ama Darko'], emergency: 'Kofi Boahen (+233 20 000 1111)', status: 'active', enrolled: '2025-10-05' },
  { id: 'P-1015', name: 'Kwaku Mensah', age: 69, gender: 'Male', diagnosis: 'COPD, Emphysema', phone: '+233 27 222 3333', address: '4 Bolgatanga Rd, Bolga', region: 'Bolgatanga', nurses: ['Adwoa Badu'], emergency: 'Abena Mensah (+233 26 555 6666)', status: 'discharged', enrolled: '2024-11-20' },
];

const ROWS_OPTIONS = [5, 10, 15];

const PATIENT_ROW_ACTIONS = [
  { value: 'continue_admission', label: 'Continue admission', icon: FiFileText, tone: 'default', disabledWhen: () => false },
  { value: 'deactivate', label: 'Deactivate', icon: FiX, tone: 'default', disabledWhen: (p) => p.status !== 'active' },
  { value: 'reactivate', label: 'Reactivate', icon: FiRefreshCw, tone: 'default', disabledWhen: (p) => p.status === 'active' },
  { value: 'report_dead', label: 'Report as dead', icon: FiAlertCircle, tone: 'warning', disabledWhen: (p) => p.status !== 'active' },
  { value: 'delete', label: 'Delete patient', icon: FiTrash2, tone: 'danger', disabledWhen: () => false },
];

function PatientRowActions({ patient, onAction }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const wrapRef = useRef(null);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    const btn = toggleRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 196;
    const menuHeight = menuRef.current?.offsetHeight || 160;
    const gap = 6;
    const padding = 8;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding));

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 1075,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return undefined;
    }
    updateMenuPosition();
    const raf = requestAnimationFrame(() => updateMenuPosition());
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      const target = e.target;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menuPortal = open && menuStyle
    ? createPortal(
        <div
          ref={menuRef}
          className="patients-row-actions__menu patients-row-actions__menu--portal"
          role="menu"
          style={menuStyle}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {PATIENT_ROW_ACTIONS.map((action) => {
            const Icon = action.icon;
            const disabled = action.disabledWhen(patient);
            return (
              <button
                key={action.value}
                type="button"
                role="menuitem"
                className={`patients-row-actions__item patients-row-actions__item--${action.tone}${disabled ? ' is-disabled' : ''}`}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (disabled) return;
                  setOpen(false);
                  onAction(patient, action.value, e);
                }}
              >
                <Icon size={14} aria-hidden />
                {action.label}
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="patients-row-actions" ref={wrapRef}>
      <button
        ref={toggleRef}
        type="button"
        className={`patients-row-actions__toggle${open ? ' is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${patient.name}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span>Actions</span>
        <FiChevronDown size={14} className="patients-row-actions__chevron" aria-hidden />
      </button>
      {menuPortal}
    </div>
  );
}
const PATIENT_PHOTO_CACHE_KEY = 'patientProfilePhotoCache';
const NURSE_ROLE_LABELS = {
  head_nurse: 'Head Nurse',
  supervising_nurse: 'Supervising Nurse',
  office_nurse: 'Office Nurse',
  field_nurse: 'Field Nurse',
};

const TABS = [
  { key: 'personal', label: 'Personal Details', num: 1 },
  { key: 'nok', label: 'Next of Kin', num: 2 },
  { key: 'checklist', label: 'Admission Checklist', num: 3 },
  { key: 'medical', label: 'Medical History', num: 4 },
  { key: 'communication', label: 'Communication', num: 5 },
  { key: 'infection', label: 'Infection Control', num: 6 },
  { key: 'breathing', label: 'Breathing & Pain', num: 7 },
  { key: 'sleep', label: 'Sleep & Nutrition', num: 8 },
  { key: 'hygiene', label: 'Hygiene & Psych', num: 9 },
  { key: 'skin', label: 'Skin & Mobility', num: 10 },
  { key: 'vitals', label: 'Vitals & Meds', num: 11 },
];

const lbl = { fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)', marginBottom: 4 };
const inp = 'form-control form-control-kh';
const sel = 'form-select form-control-kh';

const initialAdmissionForm = {
  personal: {
    registrationNumber: '',
    dateOfAssessment: '',
    dateOfAdmission: '',
    firstName: '',
    lastName: '',
    preferredName: '',
    contactNumber: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    residentialAddress: '',
    gpsCode: '',
    email: '',
  },
  nextOfKin: {
    fullName: '',
    relationship: '',
    contactOne: '',
    contactTwo: '',
    spiritualNeed: '',
    personalDoctor: '',
    personalDoctorFacility: '',
    personalDoctorContact: '',
  },
  checklist: {
    clientHandBookGiven: null,
    admittingNurse: '',
    nursePin: '',
    infectionControlSupplies: null,
  },
  medical: {
    anyMedicalHistory: null,
    medicalHistoryDescription: '',
  },
  communication: {
    anyCommunicationNeeds: null,
    anyHearingNeeds: null,
    anySpeechImpairment: null,
    anyVisualImpairment: null,
    anyUnderstandingDifficulties: null,
    communicationNotes: '',
  },
  infection: {
    InfectionCarePlanCompletion: null,
    anyDiabetes: null,
    DiabetesCarePlanCompletion: null,
    isThePatientBedBound: null,
  },
  breathing: {
    anyBreathingDifficulties: null,
    homeOxygenNeeded: null,
    isSmoker: null,
    everSmoked: null,
    painPresent: null,
    anagelsiaPrescribed: null,
    locationOfPain: '',
    painScore: '',
  },
  sleepNutrition: {
    sleep: {
      wakeUpAtNight: null,
      UseOfNightSedation: null,
      userSleepWell: null,
      RestDuringTheDay: null,
      usualTimeToWakeUp: '',
      bestSleepingPosition: '',
    },
    nutrition: {
      allergy: null,
      specialDiet: null,
      needHelpInEating: null,
      feedingAid: null,
      swallowingDifficulties: null,
      dietType: '',
      ngTube: null,
      nutritionConcerns: '',
    },
  },
  
  hygienePsych: {
    personal: {
      hygieneNeeds: null,
      mouthCarePlan: null,
      diabeteFoot: null,
    },
    bladderBowel: {
      bladderDysfunction: null,
      catheterDescription: '',
      catheterPlan: null,
      incontinentPads: null,
    },
    psychologicalNeeds: {
      psychologicalNeeds: null,
      depressionHistory: null,
      anxietyhistory: null,
      signDementia: null,
      psychologicalNotes: '',
    },
  },
  skinMobility: {
    skinIntegrity: {
      openWounds: null,
      pressureUlcer: null,
      gradeAdmission: '',
      securityItems: '',
    },
    handlingAssessment: {
      isPatientMobile: null,
      isEquipmentNeeded: null,
      numberOfStaffNeeded: '',
      moveInBed: null,
      moveInBedEquipment: '',
      mobilityFromBedToChair: null,
      mobilityFromBedToChairEquipment: '',
      mobilityToWashroom: null,
      mobilityToWashroomEquipment: '',
    },
  },
  vitals: {
    bloodPressure: '',
    bloodSugar: '',
    respiration: '',
    sp02: '',
    pulseRate: '',
    temperature: '',
    urinalysis: '',
    weight: '',
  },
  profileImage: {
    objectKey: '',
    mediaId: '',
  },
};

const normalizeNurseAssignment = (nurse, index = 0) => {
  if (!nurse) return null;

  if (typeof nurse === 'string') {
    const name = nurse.trim();
    return name ? { id: `name:${name.toLowerCase()}:${index}`, name } : null;
  }

  const firstName = nurse?.firstName || nurse?.personal?.firstName || nurse?.nurse?.firstName || '';
  const lastName = nurse?.lastName || nurse?.personal?.lastName || nurse?.nurse?.lastName || '';
  const name = nurse?.name || nurse?.fullName || nurse?.nurse?.name || `${firstName} ${lastName}`.trim();
  const assignmentId = nurse?.assignmentId
    || nurse?.assignment?._id
    || nurse?.assignment?.id
    || nurse?.assignmentRecordId
    || nurse?.linkId
    || (nurse?.nurse && (nurse?._id || nurse?.id))
    || null;

  if (!name) return null;

  return {
    id: nurse?._id || nurse?.id || nurse?.nurseId || nurse?.nurse?._id || nurse?.nurse?.id || `name:${name.toLowerCase()}`,
    assignmentId: assignmentId ? String(assignmentId) : null,
    name,
    role: nurse?.jobTitle || NURSE_ROLE_LABELS[nurse?.role] || nurse?.specialisation || nurse?.specialization || '',
    region: nurse?.region || nurse?.location || nurse?.address || nurse?.nurse?.region || '',
  };
};

const dedupeAssignedNurses = (assignedNurses) => {
  const seen = new Set();

  return assignedNurses.filter((entry) => {
    if (!entry?.name) return false;
    const key = String(entry.id || entry.name).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeAssignableNurse = (nurse) => {
  const firstName = nurse?.firstName || '';
  const lastName = nurse?.lastName || '';
  const name = nurse?.name || `${firstName} ${lastName}`.trim();

  if (!name) return null;

  return {
    id: nurse?._id || nurse?.id || null,
    _id: nurse?._id || null,
    name,
    specialisation: nurse?.jobTitle || NURSE_ROLE_LABELS[nurse?.role] || nurse?.specialisation || nurse?.specialization || 'Nurse',
    region: nurse?.region || nurse?.location || nurse?.address || '—',
  };
};

const Field = ({ label, children, col = 'col-md-6' }) => (
  <div className={col}><label className="form-label" style={lbl}>{label}</label>{children}</div>
);
const YesNo = ({ label, col = 'col-md-6', value, onChange }) => (
  <Field label={label} col={col}>
    <select
      className={sel}
      value={value === true ? 'yes' : value === false ? 'no' : ''}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'yes')}
    >
      <option value="">Select...</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  </Field>
);
const SectionTitle = ({ children }) => (
  <div className="col-12"><h6 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)', margin: '8px 0 0', paddingBottom: 8, borderBottom: '1px solid var(--kh-border-light)' }}>{children}</h6></div>
);

function TabPersonal({ form, setField, onRegistrationBlur, registrationCheck }) {
  const trimmedReg = String(form.personal.registrationNumber || '').trim();
  return (<div className="row g-3">
    <Field label="Reg No." col="col-md-3">
      <input
        className={inp}
        placeholder="e.g. KH-2026-001"
        value={form.personal.registrationNumber}
        onChange={(e) => setField('personal.registrationNumber', e.target.value)}
        onBlur={onRegistrationBlur}
      />
      {trimmedReg && registrationCheck?.loading && <div style={{ fontSize: 11, marginTop: 4, color: 'var(--kh-text-muted)' }}>Checking registration number...</div>}
      {trimmedReg && !registrationCheck?.loading && registrationCheck?.exists && <div style={{ fontSize: 11, marginTop: 4, color: '#dc2626', fontWeight: 600 }}>Registration number already exists.</div>}
      {trimmedReg && !registrationCheck?.loading && !registrationCheck?.exists && registrationCheck?.checkedValue === trimmedReg.toLowerCase() && !registrationCheck?.error && <div style={{ fontSize: 11, marginTop: 4, color: '#059669', fontWeight: 600 }}>Registration number is available.</div>}
      {trimmedReg && !registrationCheck?.loading && registrationCheck?.error && <div style={{ fontSize: 11, marginTop: 4, color: '#b45309', fontWeight: 600 }}>{registrationCheck.error}</div>}
    </Field>
    <Field label="Date of Assessment" col="col-md-3"><input type="date" className={inp} value={form.personal.dateOfAssessment} onChange={(e) => setField('personal.dateOfAssessment', e.target.value)} /></Field>
    <Field label="Date of Admission" col="col-md-3"><input type="date" className={inp} value={form.personal.dateOfAdmission} onChange={(e) => setField('personal.dateOfAdmission', e.target.value)} /></Field>
    <Field label="First Name" col="col-md-3"><input className={inp} placeholder="First name" value={form.personal.firstName} onChange={(e) => setField('personal.firstName', e.target.value)} /></Field>
    <Field label="Last Name" col="col-md-3"><input className={inp} placeholder="Last name" value={form.personal.lastName} onChange={(e) => setField('personal.lastName', e.target.value)} /></Field>
    <Field label="Preferred Name" col="col-md-3"><input className={inp} placeholder="Preferred name" value={form.personal.preferredName} onChange={(e) => setField('personal.preferredName', e.target.value)} /></Field>
    <Field label="Contact Number" col="col-md-3"><input className={inp} placeholder="+233..." value={form.personal.contactNumber} onChange={(e) => setField('personal.contactNumber', e.target.value)} /></Field>
    <Field label="Date of Birth" col="col-md-3"><input type="date" className={inp} value={form.personal.dateOfBirth} onChange={(e) => setField('personal.dateOfBirth', e.target.value)} /></Field>
    <Field label="Age" col="col-md-1"><input type="number" className={inp} value={form.personal.age} onChange={(e) => setField('personal.age', e.target.value)} /></Field>
    <Field label="Sex" col="col-md-2"><select className={sel} value={form.personal.gender} onChange={(e) => setField('personal.gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option></select></Field>
    <Field label="Residential Address" col="col-md-6"><input className={inp} placeholder="Full address" value={form.personal.residentialAddress} onChange={(e) => setField('personal.residentialAddress', e.target.value)} /></Field>
    <Field label="GPS Code" col="col-md-3"><input className={inp} placeholder="e.g. GA-123-4567" value={form.personal.gpsCode} onChange={(e) => setField('personal.gpsCode', e.target.value)} /></Field>
    <Field label="Email Address" col="col-md-3"><input type="email" className={inp} placeholder="email@example.com" value={form.personal.email} onChange={(e) => setField('personal.email', e.target.value)} /></Field>
  </div>);
}
function TabNextOfKin({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Next of Kin</SectionTitle>
    <Field label="Name"><input className={inp} placeholder="Full name" value={form.nextOfKin.fullName} onChange={(e) => setField('nextOfKin.fullName', e.target.value)} /></Field>
    <Field label="Relationship to Service User"><input className={inp} placeholder="e.g. Daughter" value={form.nextOfKin.relationship} onChange={(e) => setField('nextOfKin.relationship', e.target.value)} /></Field>
    <Field label="Contact Details"><input className={inp} placeholder="+233..." value={form.nextOfKin.contactOne} onChange={(e) => setField('nextOfKin.contactOne', e.target.value)} /></Field>
    <Field label="Preferred Contact Details"><input className={inp} placeholder="Alternative contact" value={form.nextOfKin.contactTwo} onChange={(e) => setField('nextOfKin.contactTwo', e.target.value)} /></Field>
    <SectionTitle>Cultural / Spiritual / Religious Needs</SectionTitle>
    <Field label="Cultural / Spiritual / Religious Needs" col="col-md-12"><textarea className={inp} rows={3} placeholder="Describe any cultural, spiritual or religious needs..." value={form.nextOfKin.spiritualNeed} onChange={(e) => setField('nextOfKin.spiritualNeed', e.target.value)} /></Field>
    <SectionTitle>Personal Doctor</SectionTitle>
    <Field label="Personal Doctor Name" col="col-md-4"><input className={inp} placeholder="Doctor name" value={form.nextOfKin.personalDoctor} onChange={(e) => setField('nextOfKin.personalDoctor', e.target.value)} /></Field>
    <Field label="Health Facility" col="col-md-4"><input className={inp} placeholder="Hospital / Clinic" value={form.nextOfKin.personalDoctorFacility} onChange={(e) => setField('nextOfKin.personalDoctorFacility', e.target.value)} /></Field>
    <Field label="Personal Mobile Number" col="col-md-4"><input className={inp} placeholder="+233..." value={form.nextOfKin.personalDoctorContact} onChange={(e) => setField('nextOfKin.personalDoctorContact', e.target.value)} /></Field>
  </div>);
}
function TabChecklist({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Admission Checklist</SectionTitle>
    <YesNo label="Client's Handbook Given" value={form.checklist.clientHandBookGiven} onChange={(v) => setField('checklist.clientHandBookGiven', v)} />
    <Field label="Nurse's Name"><input className={inp} placeholder="Admitting nurse" value={form.checklist.admittingNurse} onChange={(e) => setField('checklist.admittingNurse', e.target.value)} /></Field>
    <Field label="Nurse's PIN Number"><input className={inp} placeholder="PIN" value={form.checklist.nursePin} onChange={(e) => setField('checklist.nursePin', e.target.value)} /></Field>
    <YesNo label="Infection Control Supplies Advised (Gloves, Aprons, Bin Bags, Disinfectant)" col="col-md-12" value={form.checklist.infectionControlSupplies} onChange={(v) => setField('checklist.infectionControlSupplies', v)} />
  </div>);
}
function TabMedical({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>History of Medical & Surgery</SectionTitle>
    <YesNo label="Any History of Medical Conditions or Surgery?" col="col-md-4" value={form.medical.anyMedicalHistory} onChange={(v) => setField('medical.anyMedicalHistory', v)} />
    <Field label="Details (if yes)" col="col-md-8"><textarea className={inp} rows={3} placeholder="Describe medical/surgical history..." value={form.medical.medicalHistoryDescription} onChange={(e) => setField('medical.medicalHistoryDescription', e.target.value)} /></Field>
  </div>);
}
function TabCommunication({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Communication</SectionTitle>
    <YesNo label="Any Communication Needs" col="col-md-4" value={form.communication.anyCommunicationNeeds} onChange={(v) => setField('communication.anyCommunicationNeeds', v)} />
    <YesNo label="Any Hearing Impairment" col="col-md-4" value={form.communication.anyHearingNeeds} onChange={(v) => setField('communication.anyHearingNeeds', v)} />
    <YesNo label="Any Speech Impairment" col="col-md-4" value={form.communication.anySpeechImpairment} onChange={(v) => setField('communication.anySpeechImpairment', v)} />
    <YesNo label="Any Visual Impairment" col="col-md-4" value={form.communication.anyVisualImpairment} onChange={(v) => setField('communication.anyVisualImpairment', v)} />
    <YesNo label="Any Understanding Difficulties" col="col-md-4" value={form.communication.anyUnderstandingDifficulties} onChange={(v) => setField('communication.anyUnderstandingDifficulties', v)} />
    <Field label="Communication Notes" col="col-md-12"><textarea className={inp} rows={2} placeholder="Additional details..." value={form.communication.communicationNotes} onChange={(e) => setField('communication.communicationNotes', e.target.value)} /></Field>
  </div>);
}
function TabInfection({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Infection Control</SectionTitle>
    <YesNo label="Infection Prevention & Control Risk Assessment Care Plan Completed" value={form.infection.InfectionCarePlanCompletion} onChange={(v) => setField('infection.InfectionCarePlanCompletion', v)} />
    <YesNo label="Patient Bed Bound" value={form.infection.isThePatientBedBound} onChange={(v) => setField('infection.isThePatientBedBound', v)} />
    <SectionTitle>Diabetes</SectionTitle>
    <YesNo label="Does the Patient Have Diabetes?" col="col-md-4" value={form.infection.anyDiabetes} onChange={(v) => setField('infection.anyDiabetes', v)} />
    <YesNo label="Diabetes Care Plan Completed (if yes)" col="col-md-4" value={form.infection.DiabetesCarePlanCompletion} onChange={(v) => setField('infection.DiabetesCarePlanCompletion', v)} />
    <YesNo label="Anti-embolism Stockings for Stroke / Bed Bound" col="col-md-4" value={form.infection.isThePatientBedBound} onChange={(v) => setField('infection.isThePatientBedBound', v)} />
  </div>);
}
function TabBreathing({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Breathing</SectionTitle>
    <YesNo label="Any Breathing Difficulties" col="col-md-3" value={form.breathing.anyBreathingDifficulties} onChange={(v) => setField('breathing.anyBreathingDifficulties', v)} />
    <YesNo label="Home Oxygen / Nebs / CPAP / BiPAP" col="col-md-3" value={form.breathing.homeOxygenNeeded} onChange={(v) => setField('breathing.homeOxygenNeeded', v)} />
    <YesNo label="Smoker" col="col-md-3" value={form.breathing.isSmoker} onChange={(v) => setField('breathing.isSmoker', v)} />
    <YesNo label="Ever Smoked" col="col-md-3" value={form.breathing.everSmoked} onChange={(v) => setField('breathing.everSmoked', v)} />
    <SectionTitle>Pain</SectionTitle>
    <YesNo label="Pain Present" col="col-md-3" value={form.breathing.painPresent} onChange={(v) => setField('breathing.painPresent', v)} />
    <YesNo label="Analgesia Prescribed" col="col-md-3" value={form.breathing.anagelsiaPrescribed} onChange={(v) => setField('breathing.anagelsiaPrescribed', v)} />
    <Field label="Location of Pain" col="col-md-3"><input className={inp} placeholder="e.g. Lower back" value={form.breathing.locationOfPain} onChange={(e) => setField('breathing.locationOfPain', e.target.value)} /></Field>
    <Field label="Pain Score" col="col-md-3"><select className={sel} value={form.breathing.painScore} onChange={(e) => setField('breathing.painScore', e.target.value)}><option value="">Select...</option><option value="0">0 — No Pain</option><option value="1">1 — Mild Pain</option><option value="2">2 — Moderate Pain</option><option value="3">3 — Severe Pain</option></select></Field>
  </div>);
}
function TabSleep({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Sleep</SectionTitle>
    <YesNo label="Gets Up at Night" col="col-md-4" value={form.sleepNutrition.sleep.wakeUpAtNight} onChange={(v) => setField('sleepNutrition.sleep.wakeUpAtNight', v)} />
    <YesNo label="Night Sedation Used" col="col-md-4" value={form.sleepNutrition.sleep.UseOfNightSedation} onChange={(v) => setField('sleepNutrition.sleep.UseOfNightSedation', v)} />
    <YesNo label="Sleeps Well" col="col-md-4" value={form.sleepNutrition.sleep.userSleepWell} onChange={(v) => setField('sleepNutrition.sleep.userSleepWell', v)} />
    <YesNo label="Sleep / Rest During Day" col="col-md-4" value={form.sleepNutrition.sleep.RestDuringTheDay} onChange={(v) => setField('sleepNutrition.sleep.RestDuringTheDay', v)} />
    <Field label="Usual Time to Get Up" col="col-md-4"><input type="time" className={inp} value={form.sleepNutrition.sleep.usualTimeToWakeUp} onChange={(e) => setField('sleepNutrition.sleep.usualTimeToWakeUp', e.target.value)} /></Field>
    <Field label="Best Position for Sleeping" col="col-md-4"><input className={inp} placeholder="e.g. Left side" value={form.sleepNutrition.sleep.bestSleepingPosition} onChange={(e) => setField('sleepNutrition.sleep.bestSleepingPosition', e.target.value)} /></Field>
    <SectionTitle>Nutrition</SectionTitle>
    <YesNo label="Any Food Allergies or Intolerances" col="col-md-4" value={form.sleepNutrition.nutrition.allergy} onChange={(v) => setField('sleepNutrition.nutrition.allergy', v)} />
    <YesNo label="Any Special Diets" col="col-md-4" value={form.sleepNutrition.nutrition.specialDiet} onChange={(v) => setField('sleepNutrition.nutrition.specialDiet', v)} />
    <YesNo label="Need Help in Eating or Drinking" col="col-md-4" value={form.sleepNutrition.nutrition.needHelpInEating} onChange={(v) => setField('sleepNutrition.nutrition.needHelpInEating', v)} />
    <YesNo label="Need / Use of Feeding Aid" col="col-md-4" value={form.sleepNutrition.nutrition.feedingAid} onChange={(v) => setField('sleepNutrition.nutrition.feedingAid', v)} />
    <YesNo label="Any Swallowing Difficulties" col="col-md-4" value={form.sleepNutrition.nutrition.swallowingDifficulties} onChange={(v) => setField('sleepNutrition.nutrition.swallowingDifficulties', v)} />
    <Field label="Diet Type" col="col-md-4"><select className={sel} value={form.sleepNutrition.nutrition.dietType} onChange={(e) => setField('sleepNutrition.nutrition.dietType', e.target.value)}><option value="">Select...</option><option>Diabetic</option><option>Hypertensive</option><option>Normal</option><option>Puree</option></select></Field>
    <YesNo label="Does Service User Have an NG Tube" col="col-md-4" value={form.sleepNutrition.nutrition.ngTube} onChange={(v) => setField('sleepNutrition.nutrition.ngTube', v)} />
    <Field label="Nutrition Concerns" col="col-md-8"><textarea className={inp} rows={2} placeholder="Any concerns..." value={form.sleepNutrition.nutrition.nutritionConcerns} onChange={(e) => setField('sleepNutrition.nutrition.nutritionConcerns', e.target.value)} /></Field>
  </div>);
}
function TabHygiene({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Personal Hygiene & Grooming</SectionTitle>
    <YesNo label="Independent with Hygiene Needs" col="col-md-4" value={form.hygienePsych.personal.hygieneNeeds} onChange={(v) => setField('hygienePsych.personal.hygieneNeeds', v)} />
    <YesNo label="Mouth-Care Plan" col="col-md-4" value={form.hygienePsych.personal.mouthCarePlan} onChange={(v) => setField('hygienePsych.personal.mouthCarePlan', v)} />
    <YesNo label="Diabetes (Foot Care)" col="col-md-4" value={form.hygienePsych.personal.diabeteFoot} onChange={(v) => setField('hygienePsych.personal.diabeteFoot', v)} />
    <SectionTitle>Bladder & Bowel</SectionTitle>
    <YesNo label="Bladder and Bowel Dysfunction" col="col-md-3" value={form.hygienePsych.bladderBowel.bladderDysfunction} onChange={(v) => setField('hygienePsych.bladderBowel.bladderDysfunction', v)} />
    <Field label="Catheter Details" col="col-md-3"><input className={inp} placeholder="Type if applicable" value={form.hygienePsych.bladderBowel.catheterDescription} onChange={(e) => setField('hygienePsych.bladderBowel.catheterDescription', e.target.value)} /></Field>
    <YesNo label="Catheter Care Plan" col="col-md-3" value={form.hygienePsych.bladderBowel.catheterPlan} onChange={(v) => setField('hygienePsych.bladderBowel.catheterPlan', v)} />
    <YesNo label="Incontinent Pads" col="col-md-3" value={form.hygienePsych.bladderBowel.incontinentPads} onChange={(v) => setField('hygienePsych.bladderBowel.incontinentPads', v)} />
    <SectionTitle>Psychological</SectionTitle>
    <YesNo label="Psychological Concerns" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.psychologicalNeeds} onChange={(v) => setField('hygienePsych.psychologicalNeeds.psychologicalNeeds', v)} />
    <YesNo label="History of Depression" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.depressionHistory} onChange={(v) => setField('hygienePsych.psychologicalNeeds.depressionHistory', v)} />
    <YesNo label="History of Anxiety" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.anxietyhistory} onChange={(v) => setField('hygienePsych.psychologicalNeeds.anxietyhistory', v)} />
    <YesNo label="Signs of Dementia / Delirium" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.signDementia} onChange={(v) => setField('hygienePsych.psychologicalNeeds.signDementia', v)} />
    <Field label="Psychological Notes" col="col-md-12"><textarea className={inp} rows={2} placeholder="Additional details..." value={form.hygienePsych.psychologicalNeeds.psychologicalNotes} onChange={(e) => setField('hygienePsych.psychologicalNeeds.psychologicalNotes', e.target.value)} /></Field>
  </div>);
}
function TabSkin({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Skin Integrity</SectionTitle>
    <YesNo label="Open Wounds" col="col-md-3" value={form.skinMobility.skinIntegrity.openWounds} onChange={(v) => setField('skinMobility.skinIntegrity.openWounds', v)} />
    <YesNo label="Pressure Ulcer" col="col-md-3" value={form.skinMobility.skinIntegrity.pressureUlcer} onChange={(v) => setField('skinMobility.skinIntegrity.pressureUlcer', v)} />
    <Field label="Grade on Admission" col="col-md-3"><input className={inp} placeholder="Grade" value={form.skinMobility.skinIntegrity.gradeAdmission} onChange={(e) => setField('skinMobility.skinIntegrity.gradeAdmission', e.target.value)} /></Field>
    <Field label="Security Items" col="col-md-3"><input className={inp} placeholder="Items / Lost" value={form.skinMobility.skinIntegrity.securityItems} onChange={(e) => setField('skinMobility.skinIntegrity.securityItems', e.target.value)} /></Field>
    <SectionTitle>Manual Handling Risk Assessment</SectionTitle>
    <YesNo label="Is the Patient Independently Mobile?" col="col-md-6" value={form.skinMobility.handlingAssessment.isPatientMobile} onChange={(v) => setField('skinMobility.handlingAssessment.isPatientMobile', v)} />
    <YesNo label="If No, Equipment Needed" col="col-md-6" value={form.skinMobility.handlingAssessment.isEquipmentNeeded} onChange={(v) => setField('skinMobility.handlingAssessment.isEquipmentNeeded', v)} />
    <Field label="How Much Assistance Required (No. of Staff)" col="col-md-6"><input className={inp} type="number" min="0" placeholder="e.g. 2 staff" value={form.skinMobility.handlingAssessment.numberOfStaffNeeded} onChange={(e) => setField('skinMobility.handlingAssessment.numberOfStaffNeeded', e.target.value === '' ? '' : Number(e.target.value))} /></Field>
    <YesNo label="Can the Patient Move in the Bed?" col="col-md-6" value={form.skinMobility.handlingAssessment.moveInBed} onChange={(v) => setField('skinMobility.handlingAssessment.moveInBed', v)} />
    <Field label="If No, Equipment / Staff Needed" col="col-md-6"><input className={inp} placeholder="Equipment or staff count" value={form.skinMobility.handlingAssessment.moveInBedEquipment} onChange={(e) => setField('skinMobility.handlingAssessment.moveInBedEquipment', e.target.value)} /></Field>
    <YesNo label="Can the Patient Mobilise from Bed to Chair?" col="col-md-6" value={form.skinMobility.handlingAssessment.mobilityFromBedToChair} onChange={(v) => setField('skinMobility.handlingAssessment.mobilityFromBedToChair', v)} />
    <Field label="If No, Equipment Needed" col="col-md-6"><input className={inp} placeholder="Equipment" value={form.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment} onChange={(e) => setField('skinMobility.handlingAssessment.mobilityFromBedToChairEquipment', e.target.value)} /></Field>
    <YesNo label="Can the Patient Transfer to the Toilet?" col="col-md-6" value={form.skinMobility.handlingAssessment.mobilityToWashroom} onChange={(v) => setField('skinMobility.handlingAssessment.mobilityToWashroom', v)} />
    <Field label="If No, Equipment Needed" col="col-md-6"><input className={inp} placeholder="Equipment" value={form.skinMobility.handlingAssessment.mobilityToWashroomEquipment} onChange={(e) => setField('skinMobility.handlingAssessment.mobilityToWashroomEquipment', e.target.value)} /></Field>
  </div>);
}
function TabVitals({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Vitals</SectionTitle>
    <Field label="Blood Pressure" col="col-md-3"><input className={inp} placeholder="e.g. 120/80 mmHg" value={form.vitals.bloodPressure} onChange={(e) => setField('vitals.bloodPressure', e.target.value)} /></Field>
    <Field label="Blood Sugar" col="col-md-3"><input className={inp} placeholder="e.g. 5.6 mmol/L" value={form.vitals.bloodSugar} onChange={(e) => setField('vitals.bloodSugar', e.target.value)} /></Field>
    <Field label="Respiration" col="col-md-3"><input className={inp} placeholder="e.g. 18 bpm" value={form.vitals.respiration} onChange={(e) => setField('vitals.respiration', e.target.value)} /></Field>
    <Field label="SPO2" col="col-md-3"><input className={inp} placeholder="e.g. 98%" value={form.vitals.sp02} onChange={(e) => setField('vitals.sp02', e.target.value)} /></Field>
    <Field label="Pulse" col="col-md-3"><input className={inp} placeholder="e.g. 72 bpm" value={form.vitals.pulseRate} onChange={(e) => setField('vitals.pulseRate', e.target.value)} /></Field>
    <Field label="Temperature" col="col-md-3"><input className={inp} placeholder="e.g. 36.8°C" value={form.vitals.temperature} onChange={(e) => setField('vitals.temperature', e.target.value)} /></Field>
    <Field label="Urinalysis" col="col-md-3"><input className={inp} placeholder="Results" value={form.vitals.urinalysis} onChange={(e) => setField('vitals.urinalysis', e.target.value)} /></Field>
    <Field label="Weight" col="col-md-3"><input className={inp} placeholder="e.g. 68 kg" value={form.vitals.weight} onChange={(e) => setField('vitals.weight', e.target.value)} /></Field>
    <SectionTitle>Admission</SectionTitle>
    <YesNo label="Client Handbook Given" col="col-md-4" value={form.checklist.clientHandBookGiven} onChange={(v) => setField('checklist.clientHandBookGiven', v)} />
    <SectionTitle>Medications</SectionTitle>
    <Field label="Current Medications" col="col-md-12"><textarea className={inp} rows={4} placeholder="List all current medications, dosages and frequency..." value={form.vitals.currentMedications || ''} onChange={(e) => setField('vitals.currentMedications', e.target.value)} /></Field>
  </div>);
}

const TAB_COMPONENTS = {
  personal: TabPersonal, nok: TabNextOfKin, checklist: TabChecklist,
  medical: TabMedical, communication: TabCommunication, infection: TabInfection,
  breathing: TabBreathing, sleep: TabSleep, hygiene: TabHygiene,
  skin: TabSkin, vitals: TabVitals,
};

export default function Patients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [completedTabs, setCompletedTabs] = useState([]);
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [patients, setPatients] = useState([]);
  const [deceasedPatients, setDeceasedPatients] = useState([]);
  const [deactivatedPatients, setDeactivatedPatients] = useState([]);
  const [assignableNurses, setAssignableNurses] = useState([]);
  const [openNurseDropdownId, setOpenNurseDropdownId] = useState(null);
  const [assigningNurseId, setAssigningNurseId] = useState('');
  const [nursesLoading, setNursesLoading] = useState(false);
  const [nursesError, setNursesError] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');
  const [unassigningAssignmentId, setUnassigningAssignmentId] = useState('');
  const [admissionForm, setAdmissionForm] = useState(initialAdmissionForm);
  const [admissionPatientId, setAdmissionPatientId] = useState('');
  const [resumingAdmission, setResumingAdmission] = useState(false);
  const admissionStateRef = useRef({
    patientId: '',
    form: initialAdmissionForm,
    completedTabs: [],
    activeTab: 0,
    savedSections: [],
  });
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [savingAdmissionProgress, setSavingAdmissionProgress] = useState(false);
  const [admissionError, setAdmissionError] = useState('');
  const [partialSaveAlert, setPartialSaveAlert] = useState('');
  const [successModal, setSuccessModal] = useState(null);
  const [patientStatusConfirm, setPatientStatusConfirm] = useState(null);
  const [patientStatusSubmitting, setPatientStatusSubmitting] = useState(false);
  const [patientStatusError, setPatientStatusError] = useState('');
  const [registrationCheck, setRegistrationCheck] = useState({ loading: false, exists: false, checkedValue: '', error: '' });
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState('');
  const { progress: patientsLoadProgress, setProgressTarget: setPatientsProgress, finishProgress: finishPatientsProgress } = useLoadProgress(patientsLoading);
  const { progress: nursesLoadProgress, setProgressTarget: setNursesProgress, finishProgress: finishNursesProgress } = useLoadProgress(nursesLoading);
  const [avatarLoadErrors, setAvatarLoadErrors] = useState({});
  const [incompleteAdmissions, setIncompleteAdmissions] = useState([]);
  const patientsSearchRef = useRef(null);

  const refreshIncompleteAdmissions = useCallback(() => {
    setIncompleteAdmissions(listAdmissionDrafts());
  }, []);

  useEffect(() => {
    refreshIncompleteAdmissions();
    const refresh = () => refreshIncompleteAdmissions();
    window.addEventListener('admission-drafts-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('admission-drafts-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refreshIncompleteAdmissions]);

  useEffect(() => {
    if (!partialSaveAlert) return undefined;
    const timeout = window.setTimeout(() => setPartialSaveAlert(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [partialSaveAlert]);

  const readPatientPhotoCache = () => {
    try {
      const raw = localStorage.getItem(PATIENT_PHOTO_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const getCachedPatientPhotoUrl = (patient) => {
    const cache = readPatientPhotoCache();
    const identifiers = [
      patient?.id,
      patient?.patientId,
      patient?.registrationNumber,
      patient?.regNo,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    for (const id of identifiers) {
      const entry = cache[id];
      if (!entry || typeof entry !== 'object') continue;
      const url = String(entry?.url || '').trim();
      const preview = String(entry?.previewDataUrl || '').trim();
      if (url) return url;
      if (preview) return preview;
    }

    return null;
  };

  const extractPatientProfileImageUrl = (patient) => {
    const profileImage = patient?.profileImage || patient?.image || patient?.photo || {};
    const documents = Array.isArray(patient?.documents) ? patient.documents : [];

    const profileDoc = documents.find((doc) => {
      const documentType = String(doc?.documentType || '').toLowerCase();
      return documentType.includes('profile') || documentType.includes('photo') || documentType.includes('avatar');
    }) || null;

    return (
      profileImage?.link?.url
      || profileImage?.url
      || patient?.profileImageUrl
      || patient?.imageUrl
      || patient?.photoUrl
      || patient?.avatarUrl
      || profileDoc?.link?.url
      || null
    );
  };

  const normalizePatient = (patient, index, forcedStatus) => {
    const firstName = patient?.firstName || '';
    const lastName = patient?.lastName || '';
    const fullName = patient?.name || patient?.fullName || `${firstName} ${lastName}`.trim();

    const nurseCandidates = patient?.nurses
      || patient?.assignedNurses
      || patient?.assigned_nurses
      || [];

    const assignedNurseRecords = Array.isArray(nurseCandidates)
      ? dedupeAssignedNurses(nurseCandidates.map((nurse, nurseIndex) => normalizeNurseAssignment(nurse, nurseIndex)).filter(Boolean))
      : [];

    const nurses = assignedNurseRecords.map((nurse) => nurse.name);

    const enrolledRaw = patient?.dateOfAdmission || patient?.admissionDate || patient?.createdAt || patient?.created_at || '';
    const enrolled = typeof enrolledRaw === 'string' && enrolledRaw.includes('T') ? enrolledRaw.split('T')[0] : (enrolledRaw || '-');

    const statusRaw = String(forcedStatus || patient?.status || 'active').toLowerCase();
    const status = statusRaw.includes('deceased') || statusRaw.includes('dead')
      ? 'deceased'
      : (statusRaw.includes('deactiv') || statusRaw.includes('discharg') || statusRaw.includes('inactive'))
        ? 'deactivated'
        : 'active';
    const profileImageUrl = extractPatientProfileImageUrl(patient) || getCachedPatientPhotoUrl(patient);
    const apiPatientId = extractApiPatientId(patient);
    const mutationPatientId = resolvePatientMutationId(patient);
    const displayId = patient?.registrationNumber || patient?.regNo || apiPatientId || `P-${String(index + 1).padStart(4, '0')}`;
    const recordId = patient?._id || (isLikelyMongoObjectId(patient?.id) ? patient.id : null) || null;
    const uuid = patient?.uuid || patient?.patientUuid || patient?.patientUUID || patient?.patient?.uuid || null;

    return {
      id: displayId,
      patientId: mutationPatientId || apiPatientId || null,
      profileRouteId: mutationPatientId || apiPatientId || uuid || displayId,
      recordId,
      uuid,
      name: fullName || 'Unknown Patient',
      age: patient?.age ?? '-',
      gender: patient?.gender || '-',
      diagnosis: patient?.diagnosis || '-',
      phone: patient?.contactNumber || patient?.phone || '-',
      address: patient?.residentialAddress || patient?.address || '-',
      region: patient?.region || patient?.location || patient?.residentialAddress || '-',
      nurses,
      emergency: patient?.emergency || '-',
      status,
      enrolled,
      profileImageUrl,
      assignedNurseRecords,
    };
  };

  const extractPatientArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.patients)) return payload.patients;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  const patientIdentity = (entry) => String(
    entry?.patientId || entry?.profileRouteId || entry?.uuid || entry?.recordId || entry?.id || '',
  ).trim().toLowerCase();

  const samePatient = (left, right) => {
    const a = patientIdentity(left);
    const b = patientIdentity(right);
    if (a && b) return a === b;
    return String(left?.id || '').trim().toLowerCase() === String(right?.id || '').trim().toLowerCase();
  };

  const dedupePatientsByIdentity = (list) => {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter((entry) => {
      const key = patientIdentity(entry) || String(entry?.id || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    setPatientsError('');
    setPatientsProgress(6);

    try {
      setPatientsProgress(16);
      const [patientList, deceasedResponse, deactivatedResponse] = await Promise.all([
        fetchAllPatients(),
        apiFetch('/patients/deceased', { method: 'GET', quiet: true }),
        apiFetch('/patients/deactivated', { method: 'GET', quiet: true }),
      ]);
      setPatientsProgress(52);

      const deceasedPayload = await deceasedResponse.json().catch(() => ({}));
      if (!deceasedResponse.ok) {
        throw new Error(deceasedPayload?.message || deceasedPayload?.error || 'Unable to fetch deceased patients.');
      }
      const deactivatedPayload = await deactivatedResponse.json().catch(() => ({}));
      if (!deactivatedResponse.ok) {
        throw new Error(deactivatedPayload?.message || deactivatedPayload?.error || 'Unable to fetch deactivated patients.');
      }
      setPatientsProgress(72);

      const normalizedPatients = patientList.map((patient, index) => normalizePatient(patient, index));
      const normalizedDeceased = extractPatientArray(deceasedPayload)
        .map((patient, index) => normalizePatient(patient, index, 'deceased'));
      const normalizedDeactivated = extractPatientArray(deactivatedPayload)
        .map((patient, index) => normalizePatient(patient, index, 'deactivated'));
      setPatientsProgress(90);

      setPatients(normalizedPatients);
      setDeceasedPatients(normalizedDeceased);
      setDeactivatedPatients(dedupePatientsByIdentity(normalizedDeactivated));
      setPatientsProgress(100);
    } catch (error) {
      setPatientsError(error?.message || 'Unable to fetch patients right now.');
      setPatients([]);
      setDeceasedPatients([]);
      setDeactivatedPatients([]);
    } finally {
      finishPatientsProgress(() => setPatientsLoading(false));
    }
  }, [finishPatientsProgress, setPatientsProgress]);

  const loadAssignableNurses = useCallback(async () => {
    setNursesLoading(true);
    setNursesError('');
    setNursesProgress(8);

    try {
      const response = await apiFetch('/nurses', { method: 'GET' });
      setNursesProgress(42);
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to load nurses.');
      }

      const nurseList = Array.isArray(data)
        ? data
        : Array.isArray(data?.nurses)
          ? data.nurses
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
              ? data.items
              : [];
      setNursesProgress(68);

      const normalized = nurseList
        .map(normalizeAssignableNurse)
        .filter((nurse) => nurse?.id && nurse?.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      setNursesProgress(92);

      setAssignableNurses(normalized);
      if (normalized.length === 0) {
        setNursesError('No nurses are available to assign yet.');
      }
      setNursesProgress(100);
    } catch (error) {
      setNursesError(error?.message || 'Unable to load nurses right now.');
      setAssignableNurses([]);
    } finally {
      finishNursesProgress(() => setNursesLoading(false));
    }
  }, [finishNursesProgress, setNursesProgress]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    loadAssignableNurses();
  }, [loadAssignableNurses]);

  /* ── filtering ── */
  const activeCount = patients.filter((patient) => patient.status === 'active').length;
  const dischargedCount = deceasedPatients.length;
  const deactivatedCount = deactivatedPatients.length;
  const assignedCount = patients.filter((patient) => Array.isArray(patient.nurses) && patient.nurses.length > 0).length;
  const filterCounts = {
    All: patients.length,
    Active: activeCount,
    Deactivated: deactivatedCount,
    'Death Records': dischargedCount,
  };

  const activeSource = filter === 'Death Records'
    ? deceasedPatients
    : filter === 'Deactivated'
      ? deactivatedPatients
      : patients;

  const filtered = activeSource.filter(p => {
    const sl = search.toLowerCase();
    const sm = !search || p.name.toLowerCase().includes(sl) || p.id.toLowerCase().includes(sl) || p.nurses.some(n => n.toLowerCase().includes(sl));
    const fm = filter === 'All'
      || (filter === 'Active' && p.status === 'active')
      || (filter === 'Deactivated' && p.status === 'deactivated')
      || (filter === 'Death Records');
    return sm && fm;
  });

  /* ── sorting ── */
  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (sortCol === 'nurse') { va = (a.nurses || []).join(', '); vb = (b.nurses || []).join(', '); }
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  /* ── pagination ── */
  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paged = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startRow = (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, sorted.length);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  /* ── modal helpers ── */
  const markComplete = (idx) => { if (!completedTabs.includes(idx)) setCompletedTabs([...completedTabs, idx]); };
  const showPartialSaveMessage = (tabIndex = activeTab, patientId = admissionPatientId) => {
    const completedCount = new Set([...completedTabs, tabIndex]).size;
    const serverNote = patientId ? ' Progress is saved on the server.' : '';
    setPartialSaveAlert(`${TABS[tabIndex].label} saved.${serverNote} ${completedCount} of ${TABS.length} sections completed — continue anytime from the dashboard.`);
  };

  useEffect(() => {
    admissionStateRef.current = {
      patientId: admissionPatientId,
      form: admissionForm,
      completedTabs,
      activeTab,
      savedSections: admissionStateRef.current.savedSections || [],
    };
  }, [admissionPatientId, admissionForm, completedTabs, activeTab]);

  const persistAdmissionDraft = useCallback((overrides = {}) => {
    const snapshot = admissionStateRef.current;
    const patientId = String(overrides.patientId ?? snapshot.patientId ?? '').trim();
    if (!patientId || patientId.startsWith('draft-')) return null;
    return upsertAdmissionDraft({
      patientId,
      form: overrides.form ?? snapshot.form,
      completedTabs: overrides.completedTabs ?? snapshot.completedTabs,
      activeTab: overrides.activeTab ?? snapshot.activeTab,
      savedSections: overrides.savedSections ?? snapshot.savedSections ?? [],
      lookupIds: overrides.lookupIds ?? [],
    });
  }, []);

  const saveAdmissionProgress = async (tabIndex = activeTab) => {
    setSavingAdmissionProgress(true);
    setAdmissionError('');

    try {
      const tabKey = TABS[tabIndex]?.key || ADMISSION_TAB_KEYS[tabIndex];
      let currentPatientId = String(admissionPatientId || '').trim();

      if (tabKey === 'personal') {
        const reg = String(admissionForm.personal.registrationNumber || '').trim();
        if (!reg) {
          throw new Error('Enter a registration number before saving personal details.');
        }
        if (!currentPatientId) {
          currentPatientId = await findPatientIdByRegistration(reg) || '';
        }
        const exists = await checkRegistrationNumberExists(reg, currentPatientId);
        if (exists) {
          throw new Error(`Registration number "${reg}" already exists in your organization.`);
        }
      }

      const api = createAdmissionApiHelpers();
      const { patientId, savedSections, lookupIds } = await saveAdmissionProgressForTab(
        tabIndex,
        admissionForm,
        currentPatientId || admissionPatientId,
        api,
      );

      if (patientId) setAdmissionPatientId(patientId);
      markComplete(tabIndex);
      const nextCompleted = completedTabs.includes(tabIndex)
        ? completedTabs
        : [...completedTabs, tabIndex];
      const mergedSavedSections = [
        ...new Set([...(admissionStateRef.current.savedSections || []), ...savedSections]),
      ];
      admissionStateRef.current.savedSections = mergedSavedSections;

      if (patientId) {
        upsertAdmissionDraft({
          patientId,
          form: admissionForm,
          completedTabs: nextCompleted,
          activeTab: tabIndex,
          savedSections: mergedSavedSections,
          lookupIds,
        });
      }
      showPartialSaveMessage(tabIndex, patientId);
      await loadPatients();
      return patientId;
    } catch (error) {
      const message = String(error?.message || 'Unable to save admission progress.');
      setAdmissionError(message);
      throw error;
    } finally {
      setSavingAdmissionProgress(false);
    }
  };

  const handleNext = async () => {
    if (savingAdmissionProgress || savingAdmission) return;
    try {
      await saveAdmissionProgress(activeTab);
      if (activeTab < TABS.length - 1) setActiveTab(activeTab + 1);
    } catch {
      // error shown in admissionError
    }
  };
  const handlePrev = () => { if (activeTab > 0) setActiveTab(activeTab - 1); };
  const handleSave = async () => {
    if (savingAdmissionProgress || savingAdmission) return;
    try {
      await saveAdmissionProgress(activeTab);
    } catch {
      // error shown in admissionError
    }
  };
  const setAdmissionField = (path, value) => {
    const keys = path.split('.');
    setAdmissionForm(prev => {
      const next = { ...prev };
      let cursor = next;
      let source = prev;

      for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        cursor[key] = { ...(source?.[key] || {}) };
        cursor = cursor[key];
        source = source?.[key] || {};
      }

      cursor[keys[keys.length - 1]] = value;
      return next;
    });

    if (path === 'personal.registrationNumber') {
      setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
    }
  };

  const openModal = useCallback(() => {
    setShowModal(true);
    setActiveTab(0);
    setCompletedTabs([]);
    setAdmissionPatientId('');
    setAdmissionError('');
    setPartialSaveAlert('');
    setAdmissionForm(initialAdmissionForm);
    setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
  }, []);

  const openAdmissionDraft = useCallback((draft) => {
    if (!draft?.form) return;
    const draftPatientId = String(draft.patientId || '').trim();
    const resolvedPatientId = draftPatientId.startsWith('draft-') ? '' : draftPatientId;
    setShowModal(true);
    setAdmissionForm(draft.form);
    setCompletedTabs(Array.isArray(draft.completedTabs) ? draft.completedTabs : []);
    setActiveTab(
      Number.isFinite(draft.activeTab)
        ? Math.max(0, Math.min(draft.activeTab, TABS.length - 1))
        : 0,
    );
    setAdmissionPatientId(resolvedPatientId);
    admissionStateRef.current = {
      patientId: resolvedPatientId,
      form: draft.form,
      completedTabs: Array.isArray(draft.completedTabs) ? draft.completedTabs : [],
      activeTab: Number.isFinite(draft.activeTab) ? draft.activeTab : 0,
      savedSections: Array.isArray(draft.savedSections) ? draft.savedSections : [],
    };
    setAdmissionError('');
    setPartialSaveAlert(resolvedPatientId ? 'Admission draft loaded. Continue where you left off.' : '');
    setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
  }, []);

  const closeAdmissionModal = useCallback(() => {
    persistAdmissionDraft();
    setShowModal(false);
    setAdmissionError('');
    setPartialSaveAlert('');
  }, [persistAdmissionDraft]);

  const resumeAdmissionForPatient = useCallback(async (resumePatientId) => {
    const resumeId = String(resumePatientId || '').trim();
    if (!resumeId) return;

    setResumingAdmission(true);
    setAdmissionError('');

    try {
      const existingDraft = getAdmissionDraft(resumeId);
      if (existingDraft?.form) {
        openAdmissionDraft(existingDraft);
        return;
      }

      const raw = await fetchAdmissionPatientBundle(resumeId);
      const canonicalId = resolveAdmissionResumePatientId(raw, resumeId);
      const resumeDraft = buildAdmissionResumeDraft(raw, initialAdmissionForm, canonicalId);
      const lookupIds = collectAdmissionDraftLookupIds(canonicalId, [resumeId]);

      if (!resumeDraft.completedTabs.length) {
        throw new Error('No saved admission progress found for this patient yet. Save at least one section first.');
      }

      const draftEntry = {
        patientId: canonicalId,
        form: resumeDraft.form,
        completedTabs: resumeDraft.completedTabs,
        activeTab: resumeDraft.activeTab,
        savedSections: resumeDraft.savedSections,
        lookupIds,
      };

      upsertAdmissionDraft(draftEntry);
      openAdmissionDraft(draftEntry);
    } catch (error) {
      setAdmissionError(error?.message || 'Unable to resume admission form.');
    } finally {
      setResumingAdmission(false);
    }
  }, [openAdmissionDraft, openModal]);

  useEffect(() => {
    const flag = searchParams.get('admit');
    const resumePatientId = String(searchParams.get('resume') || searchParams.get('patientId') || '').trim();

    const clearResumeParams = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('resume');
          next.delete('patientId');
          next.delete('admit');
          return next;
        },
        { replace: true },
      );
    };

    if (resumePatientId) {
      resumeAdmissionForPatient(resumePatientId).finally(clearResumeParams);
      return;
    }

    if (flag !== '1' && flag !== 'true') return;
    openModal();
    clearResumeParams();
  }, [searchParams, openModal, resumeAdmissionForPatient, setSearchParams]);

  const normalizeRegistrationNumber = (value) => String(value || '').trim().toLowerCase();

  const checkRegistrationNumberExists = async (rawRegistrationNumber, excludePatientId = '') => {
    const normalized = normalizeRegistrationNumber(rawRegistrationNumber);
    if (!normalized) {
      setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
      return false;
    }

    const excludeIds = buildRegistrationExcludeIds(excludePatientId);
    const cacheKey = `${normalized}::${[...excludeIds].sort().join('|')}`;
    if (registrationCheck.checkedValue === cacheKey && !registrationCheck.error) {
      return registrationCheck.exists;
    }

    setRegistrationCheck({ loading: true, exists: false, checkedValue: cacheKey, error: '' });

    try {
      const patientList = await fetchAllPatients();

      const exists = patientList.some((patient) => {
        if (normalizeRegistrationNumber(extractPatientRegistrationNumber(patient)) !== normalized) {
          return false;
        }
        if (excludeIds.size === 0) return true;

        const identityKeys = collectPatientAssignmentIds(patient, excludePatientId)
          .map((value) => String(value || '').trim().toLowerCase());

        return !identityKeys.some((key) => excludeIds.has(key));
      });

      setRegistrationCheck({ loading: false, exists, checkedValue: cacheKey, error: '' });
      return exists;
    } catch {
      setRegistrationCheck({
        loading: false,
        exists: false,
        checkedValue: cacheKey,
        error: 'Could not verify now; check will run again on submit.',
      });
      return false;
    }
  };

  const handleRegistrationBlur = async () => {
    const reg = String(admissionForm.personal.registrationNumber || '').trim();
    if (!reg) {
      setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
      return;
    }
    await checkRegistrationNumberExists(reg, admissionPatientId);
  };

  const handleAssignNurse = async (patient, nurse) => {
    const patientIdentifierCandidates = collectPatientAssignmentIds(
      { _id: patient?.recordId, uuid: patient?.uuid, patientId: patient?.patientId, id: patient?.id },
      patient?.profileRouteId || patient?.patientId || '',
    );

    const nurseId = resolveMongoIdFromCandidates([nurse?._id, nurse?.id])
      || String(nurse?.id || '').trim();

    if (patientIdentifierCandidates.length === 0 || !nurseId) {
      setAssignmentError('Missing patient or nurse identifier for assignment.');
      return;
    }

    const currentAssigned = Array.isArray(patient?.assignedNurseRecords) ? patient.assignedNurseRecords : [];
    const alreadyAssigned = currentAssigned.some((entry) => String(entry?.id || entry?.name).trim().toLowerCase() === nurseId.toLowerCase()
      || String(entry?.name || '').trim().toLowerCase() === nurse.name.toLowerCase());

    if (alreadyAssigned) {
      setAssignmentSuccess(`${nurse.name} is already assigned to ${patient.name}.`);
      return;
    }

    setAssigningNurseId(nurseId);
    setAssignmentError('');
    setAssignmentSuccess('');

    let lastError = 'Unable to assign nurse right now.';

    for (const patientId of patientIdentifierCandidates) {
      try {
        const response = await apiFetch('/assignments', {
          method: 'POST',
          body: JSON.stringify({ patientId, nurseId }),
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          lastError = data?.message || data?.error || `Assignment failed for patient ${patientId}.`;
          continue;
        }

        setPatients((prev) => prev.map((entry) => {
          if (entry.id !== patient.id) return entry;

          const assignedNurseRecords = dedupeAssignedNurses([
            ...(entry.assignedNurseRecords || []),
            {
              id: nurseId,
              name: nurse.name,
              role: nurse.specialisation,
              region: nurse.region,
            },
          ]);

          return {
            ...entry,
            nurses: assignedNurseRecords.map((assigned) => assigned.name),
            assignedNurseRecords,
          };
        }));

        setAssignmentSuccess(data?.message || `${nurse.name} assigned to ${patient.name}.`);
        setAssigningNurseId('');
        loadPatients();
        return;
      } catch (error) {
        lastError = error?.message || lastError;
      }
    }

    setAssignmentError(lastError);
    setAssigningNurseId('');
  };

  const handleUnassignNurse = async (patient, assignedNurse) => {
    const assignmentId = String(assignedNurse?.assignmentId || '').trim();
    if (!assignmentId) {
      setAssignmentError('This nurse assignment does not include an assignment ID and cannot be removed.');
      return;
    }

    setUnassigningAssignmentId(assignmentId);
    setAssignmentError('');
    setAssignmentSuccess('');

    try {
      const response = await apiFetch(`/assignments/${encodeURIComponent(assignmentId)}`, {
        method: 'DELETE',
        quiet: true,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Unable to remove this assigned nurse.');
      }

      setPatients((prev) => prev.map((entry) => {
        if (!samePatient(entry, patient)) return entry;
        const nextAssigned = (entry.assignedNurseRecords || []).filter((item) => String(item?.assignmentId || '').trim() !== assignmentId);
        return {
          ...entry,
          assignedNurseRecords: nextAssigned,
          nurses: nextAssigned.map((item) => item.name),
        };
      }));
      setAssignmentSuccess(payload?.message || `${assignedNurse?.name || 'Assigned nurse'} removed successfully.`);
      loadPatients();
    } catch (error) {
      setAssignmentError(error?.message || 'Unable to remove this assigned nurse.');
    } finally {
      setUnassigningAssignmentId('');
    }
  };

  const ActiveTabComponent = TAB_COMPONENTS[TABS[activeTab].key];
  const progress = Math.round((completedTabs.length / TABS.length) * 100);

  const pgBtn = (onClick, disabled, children) => (
    <button onClick={onClick} disabled={disabled} className="patients-page-btn">{children}</button>
  );

  const handleExportPatients = () => {
    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Region', 'Assigned Nurses', 'Enrolled', 'Status'];
    const rows = sorted.map((patient) => [
      patient.id,
      patient.name,
      patient.age,
      patient.gender,
      patient.region,
      patient.nurses.join('; '),
      patient.enrolled,
      patient.status === 'active' ? 'Active' : (patient.status === 'deactivated' ? 'Deactivated' : 'Death Records'),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `patients-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const closePatientStatusConfirm = () => {
    if (patientStatusSubmitting) return;
    setPatientStatusConfirm(null);
    setPatientStatusError('');
  };

  const confirmPatientStatusAction = async () => {
    if (!patientStatusConfirm) return;

    const { patient, action } = patientStatusConfirm;
    const patientId = String(patient?.patientId || '').trim();

    if (!patientId) {
      setPatientStatusError(`Unable to ${action} this patient because a valid patient ID was not found.`);
      return;
    }

    setPatientStatusSubmitting(true);
    setPatientStatusError('');

    try {
      const response = await apiFetch(`/patients/${encodeURIComponent(patientId)}/${action}`, {
        method: 'PATCH',
        quiet: true,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.message
          || payload?.error
          || `Unable to ${action} this patient right now.`,
        );
      }

      if (action === 'deactivate') {
        const updatedPatient = { ...patient, status: 'deactivated' };
        setPatients((prev) =>
          prev.map((entry) => (samePatient(entry, patient) ? { ...entry, status: 'deactivated' } : entry)),
        );
        setDeactivatedPatients((prev) => {
          if (prev.some((entry) => samePatient(entry, patient))) {
            return prev.map((entry) => (samePatient(entry, patient) ? { ...entry, status: 'deactivated' } : entry));
          }
          return dedupePatientsByIdentity([...prev, updatedPatient]);
        });
        setDeceasedPatients((prev) => prev.filter((entry) => !samePatient(entry, patient)));
      } else {
        setPatients((prev) =>
          prev.map((entry) => (samePatient(entry, patient) ? { ...entry, status: 'active' } : entry)),
        );
        setDeceasedPatients((prev) => prev.filter((entry) => !samePatient(entry, patient)));
        setDeactivatedPatients((prev) => prev.filter((entry) => !samePatient(entry, patient)));
      }

      setPatientStatusConfirm(null);
      loadPatients();
    } catch (error) {
      setPatientStatusError(error?.message || `Unable to ${action} this patient right now.`);
    } finally {
      setPatientStatusSubmitting(false);
    }
  };

  const handlePatientActionSelect = async (patient, actionValue) => {
    if (!patient || !actionValue) return;

    if (actionValue === 'continue_admission') {
      await resumeAdmissionForPatient(patient.patientId || patient.profileRouteId || patient.id);
      return;
    }

    if (actionValue === 'deactivate' || actionValue === 'reactivate') {
      setPatientStatusError('');
      setPatientStatusConfirm({ patient, action: actionValue });
      return;
    }

    if (actionValue === 'report_dead') {
      navigate(`/patients/${patient.patientId || patient.profileRouteId || patient.id}?reportDeath=1`);
      return;
    }

    if (actionValue === 'delete') {
      const shouldDelete = window.confirm(`Delete ${patient.name} from the patient list?`);
      if (!shouldDelete) return;
      setPatients((prev) => prev.filter((entry) => !samePatient(entry, patient)));
      setDeceasedPatients((prev) => prev.filter((entry) => !samePatient(entry, patient)));
      setDeactivatedPatients((prev) => prev.filter((entry) => !samePatient(entry, patient)));
    }
  };

  const extractPatientId = (data) => (
    resolvePatientMutationId(data)
    || resolvePatientMutationId(data?.patient)
    || extractApiPatientId(data)
    || extractApiPatientId(data?.patient)
    || null
  );

  const createPatientAdmission = async () => {
    setSavingAdmission(true);
    setAdmissionError('');

    try {
      const requestJson = async (path, method, body) => {
        const response = await apiFetch(path, {
          method,
          body: JSON.stringify(body),
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data?.message || data?.error || `Failed request: ${path}`);
        }

        return data;
      };

      const postJson = (path, body) => requestJson(path, 'POST', body);
      const patchJson = (path, body) => requestJson(path, 'PATCH', body);

      const typedRegistrationNumber = String(admissionForm.personal.registrationNumber || '').trim();
      if (!typedRegistrationNumber) {
        throw new Error('Please enter a registration number before submitting the admission form.');
      }

      const personalInfoPayload = {
        registrationNumber: typedRegistrationNumber,
        dateOfAssessment: admissionForm.personal.dateOfAssessment,
        dateOfAdmission: admissionForm.personal.dateOfAdmission,
        firstName: admissionForm.personal.firstName,
        lastName: admissionForm.personal.lastName,
        preferredName: admissionForm.personal.preferredName,
        contactNumber: admissionForm.personal.contactNumber,
        dateOfBirth: admissionForm.personal.dateOfBirth,
        age: admissionForm.personal.age,
        gender: admissionForm.personal.gender,
        residentialAddress: admissionForm.personal.residentialAddress,
        gpsCode: admissionForm.personal.gpsCode,
        email: admissionForm.personal.email,
      };

      let patientId = String(admissionPatientId || '').trim();
      if (!patientId) {
        patientId = await findPatientIdByRegistration(typedRegistrationNumber) || '';
      }

      const alreadyExists = await checkRegistrationNumberExists(typedRegistrationNumber, patientId);
      if (alreadyExists) {
        throw new Error(`Registration number "${typedRegistrationNumber}" already exists in your organization.`);
      }

      if (patientId) {
        const api = createAdmissionApiHelpers();
        for (const tabKey of ADMISSION_TAB_KEYS) {
          const result = await saveAdmissionTab(tabKey, admissionForm, patientId, api);
          if (result?.patientId) patientId = result.patientId;
        }

        await loadPatients();
        setSuccessModal({
          patientId,
          name: `${personalInfoPayload.firstName} ${personalInfoPayload.lastName}`.trim() || 'Patient',
          registrationNumber: typedRegistrationNumber,
        });
        markAdmissionDraftComplete(patientId);
        markComplete(activeTab);
        setShowModal(false);
        setActiveTab(0);
        setCompletedTabs([]);
        setAdmissionPatientId('');
        setAdmissionForm(initialAdmissionForm);
        setPartialSaveAlert('');
        setAdmissionError('');
        setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
        return;
      }

      const personalInfoResponse = await postJson('/patients/personal-info', personalInfoPayload);
      patientId = extractPatientId(personalInfoResponse);

      if (!patientId) {
        throw new Error('Patient created but patientId was not returned by /patients/personal-info');
      }

      await postJson('/patients/next-of-kin', {
        patientId,
        fullName: admissionForm.nextOfKin.fullName,
        relationship: admissionForm.nextOfKin.relationship,
        contactOne: admissionForm.nextOfKin.contactOne,
        contactTwo: admissionForm.nextOfKin.contactTwo,
        spiritualNeed: admissionForm.nextOfKin.spiritualNeed,
        personalDoctor: admissionForm.nextOfKin.personalDoctor,
        personalDoctorFacility: admissionForm.nextOfKin.personalDoctorFacility,
        personalDoctorContact: admissionForm.nextOfKin.personalDoctorContact,
      });

      await postJson('/patients/admission-checklist', {
        patientId,
        clientHandBookGiven: Boolean(admissionForm.checklist.clientHandBookGiven),
        admittingNurse: admissionForm.checklist.admittingNurse,
        infectionControlSupplies: Boolean(admissionForm.checklist.infectionControlSupplies),
      });

      await postJson('/patients/medical-history', {
        patientId,
        anyMedicalHistory: Boolean(admissionForm.medical.anyMedicalHistory),
        medicalHistoryDescription: admissionForm.medical.medicalHistoryDescription,
      });

      await postJson('/patients/communication-style', {
        patientId,
        anyCommunicationNeeds: Boolean(admissionForm.communication.anyCommunicationNeeds),
        anyHearingNeeds: Boolean(admissionForm.communication.anyHearingNeeds),
        anySpeechImpairment: Boolean(admissionForm.communication.anySpeechImpairment),
        anyVisualImpairment: Boolean(admissionForm.communication.anyVisualImpairment),
        anyUnderstandingDifficulties: Boolean(admissionForm.communication.anyUnderstandingDifficulties),
        communicationNotes: admissionForm.communication.communicationNotes,
      });

      await postJson('/patients/infection-control', {
        patientId,
        InfectionCarePlanCompletion: Boolean(admissionForm.infection.InfectionCarePlanCompletion),
        anyDiabetes: Boolean(admissionForm.infection.anyDiabetes),
        DiabetesCarePlanCompletion: Boolean(admissionForm.infection.DiabetesCarePlanCompletion),
        isThePatientBedBound: Boolean(admissionForm.infection.isThePatientBedBound),
      });

      await postJson('/patients/breath-pain', {
        patientId,
        anyBreathingDifficulties: Boolean(admissionForm.breathing.anyBreathingDifficulties),
        homeOxygenNeeded: Boolean(admissionForm.breathing.homeOxygenNeeded),
        isSmoker: Boolean(admissionForm.breathing.isSmoker),
        everSmoked: Boolean(admissionForm.breathing.everSmoked),
        painPresent: admissionForm.breathing.painPresent ? 'Yes' : 'No',
        anagelsiaPrescribed: Boolean(admissionForm.breathing.anagelsiaPrescribed),
        locationOfPain: admissionForm.breathing.locationOfPain,
        painScore: admissionForm.breathing.painScore,
      });

      const sleepNutritionPayload = {
        patientId,
        sleep: {
          wakeUpAtNight: Boolean(admissionForm.sleepNutrition.sleep.wakeUpAtNight),
          UseOfNightSedation: Boolean(admissionForm.sleepNutrition.sleep.UseOfNightSedation),
          userSleepWell: Boolean(admissionForm.sleepNutrition.sleep.userSleepWell),
          RestDuringTheDay: Boolean(admissionForm.sleepNutrition.sleep.RestDuringTheDay),
          usualTimeToWakeUp: admissionForm.sleepNutrition.sleep.usualTimeToWakeUp,
          bestSleepingPosition: admissionForm.sleepNutrition.sleep.bestSleepingPosition,
        },
        nutrition: {
          allergy: Boolean(admissionForm.sleepNutrition.nutrition.allergy),
          specialDiet: Boolean(admissionForm.sleepNutrition.nutrition.specialDiet),
          needHelpInEating: Boolean(admissionForm.sleepNutrition.nutrition.needHelpInEating),
          feedingAid: Boolean(admissionForm.sleepNutrition.nutrition.feedingAid),
          swallowingDifficulties: Boolean(admissionForm.sleepNutrition.nutrition.swallowingDifficulties),
          dietType: admissionForm.sleepNutrition.nutrition.dietType,
          ngTube: Boolean(admissionForm.sleepNutrition.nutrition.ngTube),
          nutritionConcerns: admissionForm.sleepNutrition.nutrition.nutritionConcerns,
        },
      };

      try {
        await postJson('/patients/sleep-nutrition', sleepNutritionPayload);
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        if (message.includes('already exists') || message.includes('use patch')) {
          await patchJson('/patients/sleep-nutrition', sleepNutritionPayload);
        } else {
          throw error;
        }
      }

      try {
        await postJson('/patients/hygiene-psychological', buildHygienePsychologicalAdmissionPayload(admissionForm, patientId));
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        if (message.includes('already exists') || message.includes('use patch')) {
          await patchJson('/patients/hygiene-psychological', buildHygienePsychologicalAdmissionPayload(admissionForm, patientId));
        } else {
          throw error;
        }
      }

      await postJson('/patients/skin-mobility', {
        patientId,
        skinIntegrity: {
          openWounds: Boolean(admissionForm.skinMobility.skinIntegrity.openWounds),
          pressureUlcer: Boolean(admissionForm.skinMobility.skinIntegrity.pressureUlcer),
          gradeAdmission: admissionForm.skinMobility.skinIntegrity.gradeAdmission,
          securityItems: admissionForm.skinMobility.skinIntegrity.securityItems,
        },
        handlingAssessment: {
          isPatientMobile: Boolean(admissionForm.skinMobility.handlingAssessment.isPatientMobile),
          isEquipmentNeeded: Boolean(admissionForm.skinMobility.handlingAssessment.isEquipmentNeeded),
          numberOfStaffNeeded: Number(admissionForm.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
          moveInBed: Boolean(admissionForm.skinMobility.handlingAssessment.moveInBed),
          moveInBedEquipment: admissionForm.skinMobility.handlingAssessment.moveInBedEquipment,
          mobilityFromBedToChair: Boolean(admissionForm.skinMobility.handlingAssessment.mobilityFromBedToChair),
          mobilityFromBedToChairEquipment: admissionForm.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
          mobilityToWashroom: Boolean(admissionForm.skinMobility.handlingAssessment.mobilityToWashroom),
          mobilityToWashroomEquipment: admissionForm.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
        },
      });

      await postJson('/patients/initial-vitals', {
        patientId,
        bloodPressure: admissionForm.vitals.bloodPressure,
        bloodSugar: admissionForm.vitals.bloodSugar,
        respiration: admissionForm.vitals.respiration,
        sp02: admissionForm.vitals.sp02,
        pulseRate: admissionForm.vitals.pulseRate,
        temperature: admissionForm.vitals.temperature,
        urinalysis: admissionForm.vitals.urinalysis,
        weight: admissionForm.vitals.weight,
      });

      const objectKey = String(admissionForm.profileImage.objectKey || '').trim();
      const mediaId = String(admissionForm.profileImage.mediaId || '').trim();
      if (objectKey && mediaId) {
        await postJson('/patients/profile-image', {
          patientId,
          objectKey,
          mediaId,
        });
      }

      setPatients(prev => ([
        {
          id: patientId,
          profileRouteId: personalInfoResponse?.uuid || personalInfoResponse?.patientUuid || personalInfoResponse?.patient?.uuid || patientId,
          recordId: patientId,
          uuid: personalInfoResponse?.uuid || personalInfoResponse?.patientUuid || personalInfoResponse?.patient?.uuid || patientId,
          name: `${personalInfoPayload.firstName} ${personalInfoPayload.lastName}`,
          age: Number(personalInfoPayload.age) || '-',
          gender: personalInfoPayload.gender,
          diagnosis: '-',
          phone: personalInfoPayload.contactNumber,
          address: personalInfoPayload.residentialAddress,
          region: personalInfoPayload.residentialAddress,
          nurses: [],
          emergency: '-',
          status: 'active',
          enrolled: personalInfoPayload.dateOfAdmission,
          assignedNurseRecords: [],
        },
        ...prev,
      ]));

      setSuccessModal({
        patientId,
        name: `${personalInfoPayload.firstName} ${personalInfoPayload.lastName}`.trim() || 'Patient',
        registrationNumber: typedRegistrationNumber,
      });
      markAdmissionDraftComplete(patientId);
      markComplete(activeTab);
      setShowModal(false);
      setActiveTab(0);
      setCompletedTabs([]);
      setAdmissionPatientId('');
      setAdmissionForm(initialAdmissionForm);
      setPartialSaveAlert('');
      setAdmissionError('');
      setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
    } catch (error) {
      const message = String(error?.message || 'Unable to submit admission form.');
      const typedRegistrationNumber = String(admissionForm.personal.registrationNumber || '').trim();
      if (message.toLowerCase().includes('registration number already exists') && typedRegistrationNumber) {
        setAdmissionError(`Registration number "${typedRegistrationNumber}" already exists in your organization.`);
      } else {
        setAdmissionError(message);
      }
    } finally {
      setSavingAdmission(false);
    }
  };

  return (
    <motion.div className="page-wrapper patients-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
      <div className="patients-board-shell">
        <div className="patients-hero">
          <div>
            <div className="patients-kicker">Patient workspace</div>
            <h2 className="patients-title">Patients</h2>
            <p className="patients-subtitle">
              Manage admissions, assignments, and patient status from one list.
            </p>
          </div>
        </div>

        {incompleteAdmissions.length > 0 && (
          <div className="patients-incomplete-admissions">
            <div className="patients-incomplete-admissions__header">
              <div>
                <h3 className="patients-incomplete-admissions__title">Incomplete admissions</h3>
                <p className="patients-incomplete-admissions__subtitle">
                  Pick up client admission forms that were saved but not finished.
                </p>
              </div>
              <span className="patients-incomplete-admissions__count">{incompleteAdmissions.length}</span>
            </div>
            <div className="patients-incomplete-admissions__list">
              {incompleteAdmissions.map((draft) => {
                const completed = Array.isArray(draft.completedTabs) ? draft.completedTabs.length : 0;
                const progressPct = Math.round((completed / ADMISSION_SECTION_COUNT) * 100);
                return (
                  <div key={draft.patientId} className="patients-incomplete-admissions__item">
                    <div className="patients-incomplete-admissions__item-main">
                      <strong>{draft.patientName || 'Incomplete admission'}</strong>
                      <span>
                        {draft.registrationNumber ? `Reg. ${draft.registrationNumber}` : 'No registration number'}
                        {' · '}
                        {progressPct}% complete ({completed} of {ADMISSION_SECTION_COUNT} sections)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="patients-incomplete-admissions__cta"
                      onClick={() => resumeAdmissionForPatient(draft.patientId)}
                    >
                      Continue form
                      <FiArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {admissionError && !showModal && (
          <div className="patients-admission-error" role="alert">
            {admissionError}
          </div>
        )}

        <motion.div className="kh-card patients-board-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
          <div className="patients-topbar">
            <div className="patients-segmented-control">
              {['All', 'Active', 'Deactivated', 'Death Records'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setFilter(item); setPage(1); }}
                  className={`patients-segmented-control__item${filter === item ? ' is-active' : ''}`}
                >
                  <span>{item === 'All' ? 'All Patients' : item}</span>
                  <span className="patients-segmented-control__count">{filterCounts[item]}</span>
                </button>
              ))}
            </div>

            <div className="patients-topbar-actions">
              <div className="patients-topbar-stats" aria-label="List summary">
                <span className="patients-topbar-stats__item">
                  <strong>{filtered.length}</strong> visible
                </span>
                <span className="patients-topbar-stats__item">
                  <strong>{assignedCount}</strong> assigned
                </span>
              </div>
              <HospitalBoardToolbar
                onDownload={handleExportPatients}
                downloadLabel="Download report"
                onFilter={() => patientsSearchRef.current?.focus()}
              />
            </div>
          </div>

          <div className="patients-subtoolbar">
            <div className="patients-searchbox">
              <FiSearch className="patients-searchbox__icon" size={16} />
              <input
                ref={patientsSearchRef}
                className="form-control form-control-kh patients-searchbox__input"
                placeholder="Search patients, IDs, or assigned nurses"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <div className="patients-subtoolbar-actions">
              <label className="patients-meta-pill patients-meta-pill--select">
                <span className="patients-meta-pill__label">Rows</span>
                <span className="patients-select-field patients-select-field--compact">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                    className="patients-select-field__input"
                    aria-label="Rows per page"
                  >
                    {ROWS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <FiChevronDown size={14} className="patients-select-field__chevron" aria-hidden />
                </span>
              </label>

              <button type="button" className="patients-cta-btn patients-cta-btn--compact" onClick={openModal}>
                <span className="patients-cta-btn__icon"><FiPlus size={15} /></span>
                <span>Admit Client</span>
              </button>
            </div>
          </div>

          <DataTableHeader
            title="Patients list"
            legend={[
              { label: 'Active', tone: 'active' },
              { label: 'Deactivated', tone: 'neutral' },
              { label: 'Death records', tone: 'warning' },
            ]}
          />

          <div className="table-responsive patients-table-wrap hospital-table-wrap">
            <table className="table kh-table patients-table hospital-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>Patient <SortIcon col="name" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('age')}>Age <SortIcon col="age" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('gender')}>Gender <SortIcon col="gender" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('address')}>Address <SortIcon col="address" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('nurse')}>Assigned Nurse <SortIcon col="nurse" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('enrolled')}>Enrolled <SortIcon col="enrolled" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>Status <SortIcon col="status" /></th>
                <th className="patients-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patientsLoading && (
                <TablePageLoader
                  progress={patientsLoadProgress}
                  title="Loading patients"
                  subtitle="Fetching active, deceased, and deactivated patient records…"
                  colSpan={9}
                  skeletonColumns={9}
                  icon={FiUser}
                />
              )}
              {!patientsLoading && patientsError && (
                <tr className="hospital-table-empty-row hospital-table-empty-row--error">
                  <td colSpan={9}>{patientsError}</td>
                </tr>
              )}
              {!patientsLoading && !patientsError && paged.map((p, i) => (
                <tr key={p.id} className="patients-row-card" onClick={() => navigate(`/patients/${p.patientId || p.profileRouteId || p.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="col-num" data-label="#">{startRow + i}</td>
                  <td data-label="Patient">
                    <div className="d-flex align-items-center gap-2 patients-name-cell">
                      {(() => {
                        const avatarKey = `${p.id}::${p.profileImageUrl || ''}`;
                        const showImage = Boolean(p.profileImageUrl) && !avatarLoadErrors[avatarKey];
                        return (
                      <div className="avatar sm patients-avatar" style={{
                        background: showImage ? '#fff' : (i % 2 === 0 ? '#45B6FE' : '#2E7DB8'),
                        overflow: 'hidden',
                        borderRadius: '50%',
                      }}>
                        {showImage
                          ? <img
                              src={p.profileImageUrl}
                              alt={p.name}
                              loading="lazy"
                              onError={() => setAvatarLoadErrors(prev => ({ ...prev, [avatarKey]: true }))}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            />
                          : <FiUser size={16} aria-hidden="true" />}
                      </div>
                        );
                      })()}
                      <div>
                        <div className="patients-name-primary">{p.name}</div>
                        <div className="patients-name-secondary">{p.id}</div>
                        {findAdmissionDraftForPatient(p) ? (
                          <span className="patients-incomplete-pill">Admission in progress</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="patients-table-value" data-label="Age">{p.age}</td>
                  <td className="patients-table-value" data-label="Gender">{p.gender}</td>
                  <td className="patients-table-value hospital-table__truncate" data-label="Address" title={p.address}>{p.address}</td>
                  <td className="patients-table-value patients-nurse-cell" data-label="Assigned Nurse" onClick={(e) => e.stopPropagation()}>
                    <PatientNurseAssignDropdown
                      patient={p}
                      assignableNurses={assignableNurses}
                      nursesLoading={nursesLoading}
                      nursesError={nursesError}
                      assigningNurseId={assigningNurseId}
                      unassigningAssignmentId={unassigningAssignmentId}
                      assignmentError={openNurseDropdownId === p.id ? assignmentError : ''}
                      assignmentSuccess={openNurseDropdownId === p.id ? assignmentSuccess : ''}
                      isOpen={openNurseDropdownId === p.id}
                      onOpenChange={(open) => setOpenNurseDropdownId(open ? p.id : null)}
                      onAssign={handleAssignNurse}
                      onUnassign={handleUnassignNurse}
                      onClearMessages={() => {
                        setAssignmentError('');
                        setAssignmentSuccess('');
                        setAssigningNurseId('');
                        setUnassigningAssignmentId('');
                      }}
                    />
                  </td>
                  <td className="patients-table-date" data-label="Enrolled">{p.enrolled}</td>
                  <td data-label="Status">
                    <HospitalStatus
                      label={p.status === 'active' ? 'Active' : (p.status === 'deactivated' ? 'Deactivated' : 'Death records')}
                      tone={p.status === 'active' ? 'active' : (p.status === 'deactivated' ? 'neutral' : 'warning')}
                    />
                  </td>
                  <td className="patients-table-actions-cell hospital-table-actions-cell" data-label="Actions" onClick={(e) => e.stopPropagation()}>
                    <HospitalTableActions
                      onEdit={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${p.patientId || p.profileRouteId || p.id}`);
                      }}
                      onDelete={(e) => handlePatientActionSelect(p, 'delete', e)}
                      editLabel={`View ${p.name}`}
                      deleteLabel={`Delete ${p.name}`}
                    >
                      <PatientRowActions
                        patient={p}
                        onAction={(patient, actionValue, e) => {
                          e.stopPropagation();
                          handlePatientActionSelect(patient, actionValue, e);
                        }}
                      />
                    </HospitalTableActions>
                  </td>
                </tr>
              ))}
              {!patientsLoading && !patientsError && paged.length === 0 && (
                <tr className="hospital-table-empty-row">
                  <td colSpan={9}>No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="patients-pagination-footer">
          <div className="patients-pagination-summary">
            <span>Showing</span>
            <strong>{startRow}–{endRow}</strong>
            <span>of</span>
            <strong>{sorted.length}</strong>
          </div>
          <div className="d-flex gap-1 patients-pagination-actions">
            {pgBtn(() => setPage(1), page === 1, <FiChevronsLeft size={14} />)}
            {pgBtn(() => setPage(p => p - 1), page === 1, <FiChevronLeft size={14} />)}
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <span key={p}>
                  {showEllipsis && <span className="patients-pagination-ellipsis">…</span>}
                  <button onClick={() => setPage(p)} className={`patients-page-number${page === p ? ' active' : ''}`}>{p}</button>
                </span>
              );
            })}
            {pgBtn(() => setPage(p => p + 1), page === totalPages, <FiChevronRight size={14} />)}
            {pgBtn(() => setPage(totalPages), page === totalPages, <FiChevronsRight size={14} />)}
          </div>
        </div>
        </motion.div>
      </div>

      {/* ═══ ADMISSION MODAL ═══ */}
      {resumingAdmission && (
        <div className="patients-resume-loading" role="status">Loading admission draft…</div>
      )}

      {showModal && (
        <div className="modal modal-open patients-modal-shell" onClick={closeAdmissionModal}>
          <div style={{ display: 'flex', height: '100vh', padding: 30, maxWidth: 'calc(100vw - 40px)', margin: '0 auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', width: '100%', background: '#fff', borderRadius: 2, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.15)' }}>
              {/* LEFT: Tab Navigation */}
              <div className="bg-base-200" style={{ width: 260, borderRight: '1px solid var(--kh-border-light)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid var(--kh-border-light)' }}>
                  <h6 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--kh-text)' }}>Client Admission</h6>
                  <p style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', margin: '4px 0 12px' }}>
                    Complete each section. Use Save &amp; Continue to save progress and finish later.
                  </p>
                  {admissionPatientId && (
                    <p style={{ fontSize: 11, color: '#1d4ed8', margin: '0 0 8px', fontWeight: 600 }}>
                      Draft saved — resume from Dashboard anytime.
                    </p>
                  )}
                  <div style={{ background: 'var(--kh-border-light)', borderRadius: 10, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#45B6FE', borderRadius: 10, transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginTop: 6, fontWeight: 600 }}>{progress}% complete — {completedTabs.length} of {TABS.length} sections</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                  {TABS.map((tab, i) => {
                    const isActive = activeTab === i;
                    const isDone = completedTabs.includes(i);
                    return (
                      <button key={tab.key} onClick={() => setActiveTab(i)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 12px', marginBottom: 2, border: 'none', borderRadius: 2,
                        background: isActive ? '#fff' : 'transparent',
                        boxShadow: isActive ? 'var(--kh-shadow-sm)' : 'none',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                          background: isDone ? '#45B6FE' : isActive ? 'var(--kh-primary-light)' : 'var(--kh-border-light)',
                          color: isDone ? '#fff' : isActive ? '#45B6FE' : 'var(--kh-text-muted)',
                        }}>{isDone ? <FiCheck size={13} /> : tab.num}</div>
                        <span style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--kh-text)' : 'var(--kh-text-muted)' }}>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* RIGHT: Form Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--kh-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div>
                    <h6 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Client Admission Form</h6>
                    <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>Step {activeTab + 1} of {TABS.length} — {TABS[activeTab].label}</span>
                  </div>
                  <button onClick={closeAdmissionModal} className="btn btn-sm btn-ghost" style={{ color: 'var(--kh-text-muted)' }}><FiX size={20} /></button>
                </div>
                {partialSaveAlert && (
                  <div style={{ padding: '14px 28px 0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
                      <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                        <FiInfo size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 2 }}>Partial save recorded</div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{partialSaveAlert}</div>
                      </div>
                      <button onClick={() => setPartialSaveAlert('')} className="btn btn-xs btn-ghost" style={{ color: '#9A3412', padding: 0, minHeight: 'auto', height: 'auto' }}><FiX size={16} /></button>
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}><ActiveTabComponent form={admissionForm} setField={setAdmissionField} onRegistrationBlur={handleRegistrationBlur} registrationCheck={registrationCheck} /></div>
                <div style={{ padding: '14px 28px', borderTop: '1px solid var(--kh-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div>{activeTab > 0 && <button onClick={handlePrev} className="btn btn-kh-outline d-flex align-items-center gap-1" style={{ fontSize: 13 }}><FiChevronLeft size={15} /> Previous</button>}</div>
                  <div className="d-flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={savingAdmissionProgress || savingAdmission}
                      className="btn btn-kh-outline d-flex align-items-center gap-1"
                      style={{ fontSize: 13, opacity: savingAdmissionProgress || savingAdmission ? 0.7 : 1 }}
                    >
                      <FiSave size={14} /> {savingAdmissionProgress ? 'Saving…' : 'Save Progress'}
                    </button>
                    {activeTab < TABS.length - 1 ? (
                      <button
                        onClick={handleNext}
                        disabled={savingAdmissionProgress || savingAdmission}
                        className="btn btn-kh-primary d-flex align-items-center gap-1"
                        style={{ fontSize: 13, opacity: savingAdmissionProgress || savingAdmission ? 0.7 : 1 }}
                      >
                        {savingAdmissionProgress ? 'Saving…' : 'Save & Continue'} <FiChevronRight size={15} />
                      </button>
                    ) : (
                      <button onClick={createPatientAdmission} disabled={savingAdmission || savingAdmissionProgress} className="btn btn-kh-primary d-flex align-items-center gap-1" style={{ fontSize: 13, opacity: savingAdmission || savingAdmissionProgress ? 0.75 : 1, cursor: savingAdmission || savingAdmissionProgress ? 'not-allowed' : 'pointer' }}>
                        <FiCheck size={15} /> {savingAdmission ? 'Submitting...' : 'Complete Admission'}
                      </button>
                    )}
                  </div>
                </div>
                {admissionError && (
                  <div style={{ padding: '0 28px 14px', color: '#dc2626', fontSize: 12.5, fontWeight: 600 }}>
                    {admissionError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {patientStatusConfirm && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={closePatientStatusConfirm}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patients-status-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="patients-status-confirm-title" className="destructive-confirm-dialog__title">
                {patientStatusConfirm.action === 'deactivate' ? 'Deactivate patient' : 'Reactivate patient'}
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={patientStatusSubmitting}
                onClick={closePatientStatusConfirm}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                {patientStatusConfirm.action === 'deactivate'
                  ? 'Are you sure you want to deactivate this patient? They will be moved out of the active patient list.'
                  : 'Are you sure you want to reactivate this patient? They will return to the active patient list.'}
              </p>
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  {patientStatusConfirm.action === 'deactivate' ? (
                    <>
                      <strong>Warning:</strong> Deactivated patients cannot receive new care assignments until reactivated.
                    </>
                  ) : (
                    <>
                      <strong>Note:</strong> Reactivating restores this patient to active status for care and scheduling.
                    </>
                  )}
                </div>
              </div>
              {patientStatusError && (
                <div className="destructive-confirm-dialog__banner-error">{patientStatusError}</div>
              )}
              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  <FiUser size={16} />
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{patientStatusConfirm.patient?.name || 'Patient'}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {patientStatusConfirm.patient?.patientId || patientStatusConfirm.patient?.id || 'Patient ID unavailable'}
                  </div>
                </div>
              </div>
            </div>

            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={patientStatusSubmitting}
                onClick={closePatientStatusConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={patientStatusConfirm.action === 'deactivate'
                  ? 'destructive-confirm-dialog__btn-danger'
                  : 'btn btn-kh-primary'}
                disabled={patientStatusSubmitting}
                onClick={confirmPatientStatusAction}
              >
                {patientStatusSubmitting
                  ? (patientStatusConfirm.action === 'deactivate' ? 'Deactivating…' : 'Reactivating…')
                  : (patientStatusConfirm.action === 'deactivate' ? 'Deactivate Patient' : 'Reactivate Patient')}
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="modal modal-open patients-modal-shell patients-modal-shell--success" onClick={() => setSuccessModal(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content kh-modal-panel" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '28px 28px 20px', background: 'linear-gradient(135deg, #ECFDF3 0%, #F0FDF4 100%)', borderBottom: '1px solid #D1FAE5', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 14px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <FiCheckCircle size={28} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#065F46', marginBottom: 6 }}>Patient created successfully</div>
                <div style={{ fontSize: 13, color: '#047857', lineHeight: 1.6 }}>
                  <strong>{successModal.name}</strong> has been added to the patient list and the full admission form has been submitted.
                </div>
              </div>
              <div style={{ padding: '20px 28px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setSuccessModal(null)} className="btn btn-kh-outline" style={{ fontSize: 13 }}>Close</button>
                  <button onClick={() => { navigate(`/patients/${successModal.patientId}`); setSuccessModal(null); }} className="btn btn-kh-primary" style={{ fontSize: 13, fontWeight: 700 }}>View Patient</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
