const MEDICATION_FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QDS', 'PRN', 'ON', 'Weekly', 'Stat'];

const MEDICATION_FREQUENCY_ALIASES = {
  od: 'OD',
  'once daily': 'OD',
  'once a day': 'OD',
  bd: 'BD',
  bid: 'BD',
  'twice daily': 'BD',
  tds: 'TDS',
  tid: 'TDS',
  qds: 'QDS',
  qid: 'QDS',
  prn: 'PRN',
  'as needed': 'PRN',
  on: 'ON',
  nightly: 'ON',
  weekly: 'Weekly',
  stat: 'Stat',
};

const ADMISSION_MEDICATIONS_CACHE_KEY = 'caresense.patientAdmissionMedications';

function normalizeMedicationFrequency(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (MEDICATION_FREQUENCY_OPTIONS.includes(upper)) return upper;
  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (MEDICATION_FREQUENCY_OPTIONS.includes(titled)) return titled;
  return MEDICATION_FREQUENCY_ALIASES[raw.toLowerCase()] || raw;
}

function frequencyToDefaultTimes(frequency) {
  switch (String(frequency || '').trim().toUpperCase()) {
    case 'OD':
      return ['08:00'];
    case 'BD':
      return ['08:00', '20:00'];
    case 'TDS':
      return ['08:00', '14:00', '20:00'];
    case 'QDS':
      return ['08:00', '12:00', '16:00', '20:00'];
    case 'ON':
      return ['20:00'];
    case 'WEEKLY':
      return ['08:00'];
    default:
      return ['08:00'];
  }
}

function todayIsoDateLocal() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function readAdmissionMedicationCache() {
  try {
    const raw = localStorage.getItem(ADMISSION_MEDICATIONS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAdmissionMedicationCache(cache) {
  try {
    localStorage.setItem(ADMISSION_MEDICATIONS_CACHE_KEY, JSON.stringify(cache || {}));
  } catch {
    // ignore quota errors
  }
}

/** Split admission free-text meds (comma, semicolon, or newline separated). */
export function splitAdmissionMedicationText(text) {
  const seen = new Set();
  const items = [];
  String(text || '')
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push(item);
    });
  return items;
}

/** Parse one admission medication line, e.g. "Metformin 500mg BD". */
export function parseAdmissionMedicationLine(entry) {
  const tokens = String(entry || '').trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return { drug: '', dosage: '', frequency: 'OD' };
  }

  const last = tokens[tokens.length - 1];
  const normalizedFreq = normalizeMedicationFrequency(last);
  const looksLikeFrequency = Boolean(
    normalizedFreq
    && (
      MEDICATION_FREQUENCY_OPTIONS.includes(normalizedFreq)
      || MEDICATION_FREQUENCY_ALIASES[last.toLowerCase()]
    ),
  );

  if (looksLikeFrequency && tokens.length >= 2) {
    return {
      drug: tokens.slice(0, -2).join(' ') || entry,
      dosage: tokens[tokens.length - 2] || '',
      frequency: normalizedFreq,
    };
  }

  return { drug: entry, dosage: '', frequency: 'OD' };
}

export function admissionMedicationsTextFromVitals(vitals = {}) {
  return String(
    vitals?.currentMedications
    || vitals?.current_medications
    || vitals?.medications
    || '',
  ).trim();
}

/** Read medication free-text from a patient API payload (nested initial vitals, etc.). */
export function extractMedicationTextFromPatientRaw(raw) {
  if (!raw || typeof raw !== 'object') return '';

  const initialVitals = raw.initialVitals || raw.initial_vitals || {};
  const vitals = raw.vitals || {};

  const candidates = [
    initialVitals.currentMedications,
    initialVitals.current_medications,
    initialVitals.medications,
    vitals.currentMedications,
    vitals.current_medications,
    vitals.medications,
    raw.currentMedications,
    raw.current_medications,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  if (typeof raw.medications === 'string' && raw.medications.trim()) {
    return raw.medications.trim();
  }

  return '';
}

export function buildInitialVitalsMedicationFields(text) {
  const currentMedications = String(text || '').trim();
  if (!currentMedications) return {};
  return {
    currentMedications,
    current_medications: currentMedications,
    medications: currentMedications,
  };
}

export function cachePatientAdmissionMedications(patientId, text) {
  const pid = String(patientId || '').trim();
  const value = String(text || '').trim();
  if (!pid || !value) return;

  const cache = readAdmissionMedicationCache();
  cache[pid] = value;
  cache[pid.toLowerCase()] = value;
  writeAdmissionMedicationCache(cache);
}

export function getCachedPatientAdmissionMedications(patientId) {
  const pid = String(patientId || '').trim();
  if (!pid) return '';
  const cache = readAdmissionMedicationCache();
  return String(cache[pid] || cache[pid.toLowerCase()] || '').trim();
}

export function collectCachedAdmissionMedicationTexts(patientIds = []) {
  for (const id of patientIds) {
    const hit = getCachedPatientAdmissionMedications(id);
    if (hit) return hit;
  }
  return '';
}

/** Convert admission textarea lines into profile medication row objects. */
export function admissionMedicationTextToRecords(text, { patientId = '', source = 'admission' } = {}) {
  return splitAdmissionMedicationText(text)
    .map((line, index) => {
      const parsed = parseAdmissionMedicationLine(line);
      const drug = String(parsed.drug || '').trim();
      if (!drug) return null;
      return {
        id: `admission-${source}-${index}-${drug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        drug,
        dosage: parsed.dosage || '—',
        frequency: parsed.frequency || 'OD',
        route: 'Oral',
        notes: '',
        source,
        patientId: String(patientId || '').trim(),
      };
    })
    .filter(Boolean);
}

/** POST structured medication records from admission free-text (best-effort). */
export async function syncAdmissionMedicationsToApi(patientId, currentMedicationsText, postJson) {
  const pid = String(patientId || '').trim();
  const lines = splitAdmissionMedicationText(currentMedicationsText);
  if (!pid || !lines.length || typeof postJson !== 'function') return;

  const startDate = todayIsoDateLocal();
  const seen = new Set();

  for (const line of lines) {
    const parsed = parseAdmissionMedicationLine(line);
    const drug = String(parsed.drug || '').trim();
    if (!drug) continue;

    const frequency = normalizeMedicationFrequency(parsed.frequency) || 'OD';
    const dosage = String(parsed.dosage || '').trim() || '—';
    const dedupeKey = [
      drug.toLowerCase(),
      dosage.toLowerCase(),
      frequency.toLowerCase(),
    ].join('|');
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    try {
      await postJson('/medications', {
        patientId: pid,
        prescribedBy: 'external',
        drug,
        drugRef: null,
        dosage,
        frequency,
        intake: 'oral',
        startDate,
        endDate: null,
        active: true,
        time: frequencyToDefaultTimes(frequency),
      });
    } catch {
      // keep saving other medications
    }
  }
}
