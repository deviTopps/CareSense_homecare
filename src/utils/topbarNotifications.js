import { apiFetch, fetchUpcomingCareVisits } from '../api';
import { extractApiPatientId, extractPatientList, fetchAllPatients } from './patients';

const VISIT_LIST_KEYS = [
  'data', 'visits', 'items', 'results', 'records', 'careVisits', 'care_visits',
  'upcoming', 'upcomingVisits', 'upcoming_visits', 'rows', 'list', 'content',
];

const MED_LIST_KEYS = [
  'medications', 'data', 'items', 'results', 'records', 'rows', 'list', 'content',
];

function extractArrayPayload(payload, keys) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const collected = [];
  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) collected.push(...value);
  }
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    for (const key of keys) {
      const value = payload.data?.[key];
      if (Array.isArray(value)) collected.push(...value);
    }
  }
  return collected;
}

function patientDisplayName(record) {
  if (!record || typeof record !== 'object') return 'Patient';
  if (typeof record === 'string') return record.trim() || 'Patient';

  const nested = record.patient && typeof record.patient === 'object' ? record.patient : null;
  const first = record.firstName || record.first_name || nested?.firstName || nested?.first_name || '';
  const last = record.lastName || record.last_name || nested?.lastName || nested?.last_name || '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  if (full) return full;

  const direct = record.name || record.patientName || record.patient_name || nested?.name || nested?.patientName;
  if (direct && String(direct).trim()) return String(direct).trim();

  return 'Patient';
}

function buildPatientLookup(patients) {
  const byId = new Map();
  (Array.isArray(patients) ? patients : []).forEach((patient) => {
    const label = patientDisplayName(patient);
    const ids = [
      patient?.id,
      patient?._id,
      patient?.uuid,
      patient?.patientId,
      patient?.patient_id,
      extractApiPatientId(patient),
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    ids.forEach((id) => {
      byId.set(id, label);
      byId.set(id.toLowerCase(), label);
    });
  });
  return byId;
}

function resolvePatientLabel(patientRef, lookup) {
  if (patientRef && typeof patientRef === 'object') {
    return patientDisplayName(patientRef);
  }
  const id = String(patientRef || '').trim();
  if (!id) return 'Patient';
  return lookup.get(id) || lookup.get(id.toLowerCase()) || 'Patient';
}

function parseVisitDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(value) {
  const date = parseVisitDate(value);
  if (!date) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTimeLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;
  const hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

function medicationReminderTimes(med) {
  const reminderTimes = med?.reminders?.times;
  if (Array.isArray(reminderTimes) && reminderTimes.length) {
    return reminderTimes.map((time) => String(time || '').trim()).filter(Boolean);
  }
  if (Array.isArray(med?.time) && med.time.length) {
    return med.time.map((time) => String(time || '').trim()).filter(Boolean);
  }
  return [];
}

function hasMedicationReminder(med) {
  return medicationReminderTimes(med).length > 0;
}

function medicationDrugName(med) {
  return String(
    med?.drug
    || med?.drugName
    || med?.drug_name
    || med?.name
    || med?.medicationName
    || 'Medication',
  ).trim();
}

function visitStatus(raw) {
  const status = String(
    raw?.status
    || raw?.visitStatus
    || raw?.visit_status
    || 'scheduled',
  ).trim().toLowerCase();
  if (status.includes('cancel')) return 'cancelled';
  if (status.includes('complete') || status === 'done') return 'completed';
  return 'scheduled';
}

function normalizeMedicationNotification(med, lookup) {
  const times = medicationReminderTimes(med);
  if (!times.length) return null;

  const patientId = String(
    med?.patientId
    || med?.patientID
    || med?.patient_id
    || med?.patient?.id
    || med?.patient?._id
    || med?.patient?.uuid
    || '',
  ).trim();

  const patientName = resolvePatientLabel(med?.patient || patientId, lookup);
  const timeLabel = times.map(formatTimeLabel).join(', ');
  const id = String(med?.id || med?._id || med?.medicationId || `${patientId}-${medicationDrugName(med)}`).trim();

  return {
    id: `med-${id}`,
    kind: 'medication',
    title: medicationDrugName(med),
    meta: patientName,
    detail: `Reminder · ${timeLabel}`,
    href: patientId ? `/patients/${encodeURIComponent(patientId)}` : '/patients',
    sortKey: times[0] || '99:99',
  };
}

function normalizeVisitNotification(raw, index, lookup) {
  const status = visitStatus(raw);
  if (status === 'cancelled' || status === 'completed') return null;

  const nextVisit = raw?.nextVisit || raw?.next_visit || raw?.scheduledDate || raw?.scheduled_date || raw?.date;
  const visitDate = parseVisitDate(nextVisit);
  if (!visitDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);
  if (visitDate < today || visitDate > horizon) return null;

  const patientId = String(
    raw?.patientId
    || raw?.patient_id
    || raw?.patient?.id
    || raw?.patient?._id
    || raw?.patient?.uuid
    || '',
  ).trim();

  const patientName = resolvePatientLabel(raw?.patient || patientId, lookup);
  const nurseRef = raw?.visitingNurse || raw?.visiting_nurse || raw?.nurse;
  let nurseName = '';
  if (nurseRef && typeof nurseRef === 'object') {
    nurseName = patientDisplayName(nurseRef);
  } else if (typeof nurseRef === 'string' && !/^[0-9a-f-]{20,}$/i.test(nurseRef.trim())) {
    nurseName = nurseRef.trim();
  }

  const visitTime = String(raw?.time || raw?.visitTime || raw?.scheduledTime || raw?.scheduled_time || '').trim();
  const id = String(raw?.id || raw?._id || raw?.visitId || raw?.careVisitId || `visit-${index}`).trim();

  return {
    id: `visit-${id}`,
    kind: 'visit',
    title: patientName,
    meta: formatShortDate(nextVisit),
    detail: [
      visitTime && visitTime !== '—' ? formatTimeLabel(visitTime) : null,
      nurseName ? `Nurse · ${nurseName}` : 'Care visit',
    ].filter(Boolean).join(' · '),
    href: '/scheduling',
    sortKey: visitDate.toISOString(),
  };
}

async function fetchMedicationRecords(onUnauthorized) {
  const attempts = [
    '/medications?limit=500',
    '/medications/reminders?limit=500',
    '/medications/upcoming?limit=500',
  ];

  for (const path of attempts) {
    try {
      const res = await apiFetch(path, { method: 'GET', quiet: true }, onUnauthorized);
      if (!res.ok) continue;
      const json = await res.json().catch(() => ({}));
      const list = extractArrayPayload(json, MED_LIST_KEYS);
      if (list.length) return list;
    } catch {
      // try next route
    }
  }

  const patients = await fetchAllPatients().catch(() => []);
  const meds = [];

  const batch = patients.slice(0, 40);
  await Promise.all(batch.map(async (patient) => {
    const patientId = extractApiPatientId(patient) || String(patient?.id || patient?._id || '').trim();
    if (!patientId) return;

    try {
      const res = await apiFetch(
        `/medications?patientId=${encodeURIComponent(patientId)}`,
        { method: 'GET', quiet: true },
        onUnauthorized,
      );
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      const list = extractArrayPayload(json, MED_LIST_KEYS);
      list.forEach((item) => {
        meds.push({
          ...item,
          patientId: item?.patientId || patientId,
          patient: item?.patient || patient,
        });
      });
    } catch {
      // skip patient
    }
  }));

  return meds;
}

export async function fetchTopbarNotifications(onUnauthorized) {
  const patients = await fetchAllPatients().catch(() => []);
  const patientLookup = buildPatientLookup(Array.isArray(patients) ? patients : extractPatientList(patients));

  const [visitRes, medicationRecords] = await Promise.all([
    fetchUpcomingCareVisits({ limit: 100 }, onUnauthorized).catch(() => null),
    fetchMedicationRecords(onUnauthorized).catch(() => []),
  ]);

  let visitRows = [];
  if (visitRes?.ok) {
    const visitJson = await visitRes.json().catch(() => ({}));
    visitRows = extractArrayPayload(visitJson, VISIT_LIST_KEYS);
  }

  const medicationItems = (Array.isArray(medicationRecords) ? medicationRecords : [])
    .filter(hasMedicationReminder)
    .map((med) => normalizeMedicationNotification(med, patientLookup))
    .filter(Boolean)
    .sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)));

  const visitItems = visitRows
    .map((row, index) => normalizeVisitNotification(row, index, patientLookup))
    .filter(Boolean)
    .sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)));

  const items = [...medicationItems, ...visitItems];

  return {
    items,
    medicationCount: medicationItems.length,
    visitCount: visitItems.length,
    totalCount: items.length,
  };
}
