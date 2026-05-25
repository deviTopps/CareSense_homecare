import { apiFetch } from '../api';

const PENDING_NURSE_RESUME_KEY = 'caresense.continueNurseRegistration';

/** Stash nurse id before navigating to Workforce so resume survives route change. */
export function stashContinueNurseRegistration(nurseId) {
  const id = String(nurseId || '').trim();
  if (!id) return;
  try {
    sessionStorage.setItem(PENDING_NURSE_RESUME_KEY, id);
  } catch {
    // ignore quota errors
  }
}

/** Read pending resume id without clearing (safe for Strict Mode double mount). */
export function peekContinueNurseRegistration() {
  try {
    return String(sessionStorage.getItem(PENDING_NURSE_RESUME_KEY) || '').trim();
  } catch {
    return '';
  }
}

/** Clear pending resume after the modal has been opened. */
export function clearContinueNurseRegistration() {
  try {
    sessionStorage.removeItem(PENDING_NURSE_RESUME_KEY);
  } catch {
    // ignore
  }
}

export async function fetchNurseRegistrationData(lookupId) {
  const id = encodeURIComponent(String(lookupId || '').trim());
  if (!id) throw new Error('Nurse id is required to resume registration.');

  const paths = [`/nurses/${id}`];
  let lastError = 'Unable to load nurse registration data.';

  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;
      lastError = data?.message || data?.error || lastError;
    } catch (error) {
      lastError = error?.message || lastError;
    }
  }

  throw new Error(lastError);
}

/** Helpers to resume incomplete nurse registration in the Workforce modal. */

function hasSectionData(section) {
  if (!section || typeof section !== 'object') return false;
  return Object.values(section).some((value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

export function deriveNurseRegistrationResumeState(apiData) {
  const hasDiversity = hasSectionData(apiData?.diversity);
  const hasEducation = hasSectionData(apiData?.education);
  const supporting = apiData?.supportingInfo || apiData?.supporting;
  const hasSupporting = hasSectionData(supporting);

  const completedSteps = [0];
  if (hasDiversity) completedSteps.push(1);
  if (hasEducation) completedSteps.push(2);
  if (hasSupporting) completedSteps.push(3);

  let step = 1;
  if (!hasDiversity) step = 1;
  else if (!hasEducation) step = 2;
  else if (!hasSupporting) step = 3;
  else step = 4;

  return { completedSteps, step };
}

export function resolveNurseRecordId(apiData, fallbackId = '') {
  const personal = apiData?.personal || apiData?.nurse || apiData;
  return String(
    personal?._id
    || personal?.id
    || apiData?.nurseId
    || apiData?._id
    || fallbackId
    || '',
  ).trim();
}

export function buildWorkforceFormFromNurseApi(
  apiData,
  initialFormState,
  emptyQualification,
  emptyEmployment,
  emptyReferee,
) {
  const personal = apiData?.personal || apiData?.nurse || apiData || {};
  const diversity = apiData?.diversity || {};
  const education = apiData?.education || {};
  const supporting = apiData?.supportingInfo || apiData?.supporting || {};

  const qualifications = Array.isArray(education.qualifications) && education.qualifications.length
    ? education.qualifications.map((q) => ({
      name: q?.name || '',
      institution: q?.institution || '',
      result: q?.result || '',
      year: q?.year !== undefined && q?.year !== null ? String(q.year) : '',
    }))
    : [{ ...emptyQualification }];

  const trainingCourses = Array.isArray(education.trainingCourses) && education.trainingCourses.length
    ? education.trainingCourses.map((t) => String(t || ''))
    : [''];

  const employmentHistory = Array.isArray(education.employmentHistory) && education.employmentHistory.length
    ? education.employmentHistory.map((e) => ({
      employerName: e?.employerName || '',
      address: e?.address || '',
      businessType: e?.businessType || '',
      jobTitle: e?.jobTitle || '',
      startDate: e?.startDate || '',
      grade: e?.grade || '',
      reportingOfficer: e?.reportingOfficer || '',
      reasonForLeaving: e?.reasonForLeaving || '',
      descriptionOfDuties: e?.descriptionOfDuties || '',
      contactPerson: e?.contactPerson || '',
    }))
    : [{ ...emptyEmployment }];

  const referees = Array.isArray(supporting.referees) && supporting.referees.length
    ? supporting.referees.map((r) => ({
      name: r?.name || '',
      address: r?.address || '',
      telephone: r?.telephone || r?.phone || '',
    }))
    : [{ ...emptyReferee }, { ...emptyReferee }];

  const dob = personal.dateOfBirh || personal.dateOfBirth || '';

  return {
    ...initialFormState,
    title: personal.title || '',
    firstName: personal.firstName || '',
    lastName: personal.lastName || '',
    gender: personal.gender || '',
    email: personal.email || '',
    address: personal.address || '',
    mmcPinNo: personal.mmcPinNo || '',
    phone: personal.phone || '',
    homeTelephone: personal.homeTelephone || '',
    dateOfBirh: typeof dob === 'string' && dob.includes('T') ? dob.split('T')[0] : String(dob || ''),
    jobReference: personal.jobReference || '',
    jobTitle: personal.jobTitle || '',
    citizenship: personal.citizenship || initialFormState.citizenship || 'Ghana',
    role: personal.role || initialFormState.role || 'field_nurse',
    password: '',
    race: diversity.race || '',
    religion: diversity.religion || '',
    disability: diversity.disability || 'No',
    disability_detail: diversity.disability_detail || diversity.disabilityDetail || '',
    criminal_records: diversity.criminal_records || diversity.criminalRecords || 'No',
    criminal_record_detail: diversity.criminal_record_detail || diversity.criminalRecordDetail || '',
    qualifications,
    trainingCourses,
    employmentHistory,
    staffRelation: supporting.staffRelation || 'No',
    staffRelationDetail: supporting.staffRelationDetail || '',
    vacancyAdvertised: supporting.vacancyAdvertised || '',
    vacancyDetail: supporting.vacancyDetail || {},
    referees,
    documents: {},
  };
}
