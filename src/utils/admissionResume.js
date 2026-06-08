import { apiFetch } from '../api';
import { ADMISSION_TAB_KEYS } from './admissionProgress';
import { buildAdmissionFormFromApiPatient } from './admissionFormFromPatient';

export const ADMISSION_SECTION_COUNT = ADMISSION_TAB_KEYS.length;

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function hasTri(value) {
  return value === true || value === false;
}

function objectHasTriOrText(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).some((value) => {
    if (value && typeof value === 'object') return objectHasTriOrText(value);
    return hasTri(value) || hasText(value);
  });
}

function mergeSectionRecord(raw, key, record) {
  if (!record || typeof record !== 'object') return raw;
  const unwrapped = record.data || record.record || record;
  return { ...raw, [key]: { ...(raw?.[key] || {}), ...unwrapped } };
}

async function fetchOptionalSection(paths) {
  for (const path of paths) {
    try {
      const response = await apiFetch(path, { method: 'GET', quiet: true });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) continue;
      return payload?.data || payload?.record || payload;
    } catch {
      // try next path
    }
  }
  return null;
}

/** Load patient + related admission sections for resume. */
export async function fetchAdmissionPatientBundle(patientId) {
  const id = String(patientId || '').trim();
  if (!id) throw new Error('Patient ID is required to resume admission.');

  const encoded = encodeURIComponent(id);
  const response = await apiFetch(`/patients/${encoded}`, { method: 'GET', quiet: true });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Unable to load patient for admission resume.');
  }

  let raw = payload?.patient || payload?.data?.patient || payload?.data || payload;

  const [hygienePsych, sleepNutrition, breathPain, infectionControl, initialVitals] = await Promise.all([
    fetchOptionalSection([
      `/patients/hygiene-psychological?patientId=${encoded}`,
      `/patients/hygiene-psychological/${encoded}`,
      `/patients/${encoded}/hygiene-psychological`,
    ]),
    fetchOptionalSection([
      `/patients/sleep-nutrition?patientId=${encoded}`,
      `/patients/sleep-nutrition/${encoded}`,
      `/patients/${encoded}/sleep-nutrition`,
    ]),
    fetchOptionalSection([
      `/patients/breath-pain?patientId=${encoded}`,
      `/patients/breath-pain/${encoded}`,
      `/patients/${encoded}/breath-pain`,
    ]),
    fetchOptionalSection([
      `/patients/infection-control?patientId=${encoded}`,
      `/patients/infection-control/${encoded}`,
      `/patients/${encoded}/infection-control`,
    ]),
    fetchOptionalSection([
      `/patients/initial-vitals?patientId=${encoded}`,
      `/patients/initial-vitals/${encoded}`,
      `/patients/${encoded}/initial-vitals`,
    ]),
  ]);

  if (hygienePsych) {
    raw = mergeSectionRecord(raw, 'hygienePsychological', hygienePsych.hygienePsychological || hygienePsych);
  }
  if (sleepNutrition) {
    raw = mergeSectionRecord(raw, 'sleepNutrition', sleepNutrition.sleepNutrition || sleepNutrition);
  }
  if (breathPain) {
    raw = mergeSectionRecord(raw, 'breathPain', breathPain.breathPain || breathPain);
  }
  if (infectionControl) {
    raw = mergeSectionRecord(raw, 'infectionControl', infectionControl.infectionControl || infectionControl);
  }
  if (initialVitals) {
    raw = mergeSectionRecord(raw, 'initialVitals', initialVitals.initialVitals || initialVitals);
  }

  return raw;
}

export function inferAdmissionCompletedTabs(form) {
  if (!form || typeof form !== 'object') {
    return { completedTabs: [], savedSections: [] };
  }

  const completedTabs = [];
  const savedSections = [];

  const mark = (index, key, done) => {
    if (!done) return;
    completedTabs.push(index);
    savedSections.push(key);
  };

  const personal = form.personal || {};
  mark(0, 'personal', hasText(personal.registrationNumber) && (hasText(personal.firstName) || hasText(personal.lastName)));

  const nok = form.nextOfKin || {};
  mark(1, 'nok', hasText(nok.fullName) || hasText(nok.contactOne) || hasText(nok.relationship));

  const checklist = form.checklist || {};
  mark(
    2,
    'checklist',
    hasTri(checklist.clientHandBookGiven)
      || hasTri(checklist.infectionControlSupplies)
      || hasText(checklist.admittingNurse),
  );

  const medical = form.medical || {};
  mark(3, 'medical', hasTri(medical.anyMedicalHistory) || hasText(medical.medicalHistoryDescription));

  mark(4, 'communication', objectHasTriOrText(form.communication));
  mark(5, 'infection', objectHasTriOrText(form.infection));
  mark(6, 'breathing', objectHasTriOrText(form.breathing));
  mark(7, 'sleep', objectHasTriOrText(form.sleepNutrition));
  mark(8, 'hygiene', objectHasTriOrText(form.hygienePsych));
  mark(9, 'skin', objectHasTriOrText(form.skinMobility));

  const vitals = form.vitals || {};
  const profileImage = form.profileImage || {};
  mark(
    10,
    'vitals',
    objectHasTriOrText(vitals)
      || hasText(vitals.currentMedications)
      || hasText(profileImage.objectKey),
  );

  return {
    completedTabs: [...new Set(completedTabs)].sort((a, b) => a - b),
    savedSections: [...new Set(savedSections)],
  };
}

export function inferAdmissionActiveTab(completedTabs, tabCount = ADMISSION_SECTION_COUNT) {
  const done = new Set(Array.isArray(completedTabs) ? completedTabs : []);
  for (let index = 0; index < tabCount; index += 1) {
    if (!done.has(index)) return index;
  }
  return Math.max(0, tabCount - 1);
}

export function isAdmissionIncomplete(completedTabs, tabCount = ADMISSION_SECTION_COUNT) {
  const count = Array.isArray(completedTabs) ? completedTabs.length : 0;
  return count > 0 && count < tabCount;
}

export function mergeAdmissionCompletedTabs(primary = [], secondary = []) {
  return [...new Set([...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])])]
    .sort((a, b) => a - b);
}

export function buildAdmissionResumeDraft(rawPatient, baseForm, fallbackPatientId = '', existingDraft = null) {
  const form = buildAdmissionFormFromApiPatient(rawPatient, baseForm);
  const inferred = inferAdmissionCompletedTabs(form);
  const completedTabs = mergeAdmissionCompletedTabs(existingDraft?.completedTabs, inferred.completedTabs);
  const savedSections = [
    ...new Set([
      ...(Array.isArray(existingDraft?.savedSections) ? existingDraft.savedSections : []),
      ...inferred.savedSections,
    ]),
  ];
  const activeTab = Number.isFinite(existingDraft?.activeTab)
    ? existingDraft.activeTab
    : inferAdmissionActiveTab(completedTabs);

  return {
    form: existingDraft?.form || form,
    completedTabs,
    activeTab,
    savedSections,
    patientId: String(existingDraft?.patientId || fallbackPatientId || '').trim(),
  };
}
