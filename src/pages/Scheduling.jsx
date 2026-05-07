import { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiCalendar, FiUser, FiXCircle, FiCheckCircle } from '../icons/hugeicons-feather';
import { fetchAllPatients } from '../utils/patients';
import { apiFetch, createCareVisit, fetchOtherCareVisits, fetchUpcomingCareVisits } from '../api';

const VISIT_FILTER_OPTIONS = ['All Visits', 'Up Coming Visits'];

function isUpcomingVisitRow(v) {
  if (v.status === 'cancelled' || v.status === 'completed') return false;
  if (!v.nextVisit) return true;
  const t = new Date(`${v.nextVisit}T12:00:00`).getTime();
  if (Number.isNaN(t)) return true;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return t >= start.getTime();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice_weekly', label: 'Twice a week' },
  { value: 'biweekly', label: 'Once every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

/** Default dates / frequency for schedule form (patient & nurse chosen from lists). */
const SAMPLE_SCHEDULE_VISIT = {
  patientId: 'e426444d-02a0-4f90-90d4-930b1745f199',
  visitingNurse: 'cfcfc648-5d30-44ba-9c94-9d921d1b3d05',
  lastVisit: '2026-05-01',
  nextVisit: '2026-05-12',
  frequency: 'weekly',
};

function isLikelyMongoId(s) {
  return /^[a-f\d]{24}$/i.test(String(s || ''));
}

function pickPatientApiId(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const keys = ['uuid', 'patientUuid', 'patientId', 'id', '_id'];
  const cands = keys.flatMap((k) => (raw[k] != null ? [String(raw[k]).trim()] : [])).filter(Boolean);
  const u = cands.find((x) => UUID_RE.test(x));
  if (u) return u;
  const nonMongo = cands.find((x) => !isLikelyMongoId(x));
  return nonMongo || cands[0] || '';
}

function pickVisitingNurseApiId(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const keys = ['uuid', 'userUuid', 'nurseUuid', 'nurseId', 'staffId', 'id', '_id', 'userId'];
  const cands = keys.flatMap((k) => (raw[k] != null ? [String(raw[k]).trim()] : [])).filter(Boolean);
  const u = cands.find((x) => UUID_RE.test(x));
  if (u) return u;
  const nonMongo = cands.find((x) => !isLikelyMongoId(x));
  return nonMongo || cands[0] || '';
}

function patientDisplayName(p) {
  const first = p?.firstName || '';
  const last = p?.lastName || '';
  const name = `${first} ${last}`.trim() || String(p?.name || '').trim();
  return name || 'Patient';
}

/** Backend may send `visitingNurse` / `assignedNurse` as a populated object. */
function nurseDisplayFromObject(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return '';
  const nestedUser = o.user && typeof o.user === 'object' ? o.user : null;
  const nestedNurse = !nestedUser && o.nurse && typeof o.nurse === 'object' ? o.nurse : null;
  const src = nestedUser || nestedNurse || o;
  const composed = `${src.firstName || ''} ${src.lastName || ''}`.trim();
  return String(src.fullName || src.name || composed || '').trim();
}

function normalizeNurseIdString(nid) {
  if (nid == null || nid === '') return '';
  if (typeof nid === 'object') {
    const direct =
      pickVisitingNurseApiId(nid) ||
      String(nid.id ?? nid._id ?? nid.uuid ?? nid.userId ?? nid.nurseId ?? '').trim();
    if (direct) return direct;
    if (nid.nurse && typeof nid.nurse === 'object') return normalizeNurseIdString(nid.nurse);
    if (nid.user && typeof nid.user === 'object') return normalizeNurseIdString(nid.user);
    return '';
  }
  return String(nid).trim();
}

function formatYmdFromIsoInput(ymd) {
  if (!ymd || typeof ymd !== 'string') return '';
  const parts = ymd.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '';
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

/** Parse backend strings like `1-5-2026` or ISO dates to `YYYY-MM-DD` for display/sorting */
function normalizeVisitDateForUi(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\b|T|$)/;
  const im = iso.exec(s);
  if (im) {
    const y = Number(im[1]);
    const mo = Number(im[2]);
    const d = Number(im[3]);
    const dt = new Date(y, mo - 1, d);
    if (!Number.isNaN(dt.getTime())) return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const bits = s.split(/[-/]/).map((x) => parseInt(x, 10));
  if (bits.length === 3 && bits.every((n) => Number.isFinite(n))) {
    let d = bits[0];
    let mo = bits[1];
    let y = bits[2];
    if (d > 31) {
      y = bits[0];
      mo = bits[1];
      d = bits[2];
    }
    const dt = new Date(y, mo - 1, d);
    if (!Number.isNaN(dt.getTime()))
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const guess = new Date(s);
  if (!Number.isNaN(guess.getTime())) return guess.toISOString().slice(0, 10);
  return '';
}

function extractCareVisitsList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const LIST_KEYS = [
    'data',
    'visits',
    'items',
    'results',
    'records',
    'careVisits',
    'care_visits',
    'upcoming',
    'upcomingVisits',
    'upcoming_visits',
    'rows',
    'list',
    'content',
    'payload',
    'value',
  ];

  const tryArray = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      for (const nk of LIST_KEYS) {
        const inner = v[nk];
        if (Array.isArray(inner)) return inner;
      }
    }
    return null;
  };

  for (const k of LIST_KEYS) {
    const v = payload[k];
    const arr = tryArray(v);
    if (arr) return arr;
    if (Array.isArray(v)) return v;
  }

  if (Array.isArray(payload?.edges)) {
    const fromEdges = payload.edges.map((e) => e?.node).filter(Boolean);
    if (fromEdges.length) return fromEdges;
  }

  for (const v of Object.values(payload)) {
    const arr = tryArray(v);
    if (arr) return arr;
    if (Array.isArray(v) && v.length > 0 && v[0] != null && typeof v[0] === 'object') return v;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const inner of Object.values(v)) {
        if (Array.isArray(inner) && inner.length > 0 && inner[0] != null && typeof inner[0] === 'object')
          return inner;
      }
    }
  }

  if (typeof payload === 'object' && !Array.isArray(payload) && isCareVisitLikeRow(payload)) return [payload];

  return [];
}

function isCareVisitLikeRow(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  return (
    ['patientId', 'patient_id', 'nextVisit', 'next_visit', 'lastVisit', 'visitingNurse', 'nurseId'].some(
      (k) => o[k] !== undefined && o[k] !== null && o[k] !== '',
    ) || (o.patient && typeof o.patient === 'object')
  );
}

function normalizeStatus(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
  if (!s) return 'scheduled';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('completed') || s === 'done' || s === 'complete') return 'completed';
  if (s.includes('progress') || s === 'in-progress') return 'in-progress';
  if (s === 'active' || s === 'pending') return 'scheduled';
  if (s.includes('schedul')) return 'scheduled';
  if (s.includes('upcoming')) return 'scheduled';
  return 'scheduled';
}

function mapCareVisitRow(raw, index, lookups) {
  const idSrc =
    raw?.id ?? raw?._id ?? raw?.uuid ?? raw?.visitId ?? raw?.careVisitId ?? raw?.care_visit_id ?? `cv-${index}`;

  const pid =
    raw?.patientId ??
    raw?.patient_id ??
    raw?.patient?.id ??
    raw?.patient?.uuid ??
    raw?.patient?._id ??
    raw?.serviceUserId ??
    raw?.service_user_id ??
    '';

  let embeddedNurseName = '';
  const visitingRef = raw?.visitingNurse ?? raw?.visiting_nurse;
  const assignedRef = raw?.assignedNurse ?? raw?.assigned_nurse;

  let nid = '';
  if (visitingRef != null && visitingRef !== '') {
    if (typeof visitingRef === 'object') {
      embeddedNurseName = nurseDisplayFromObject(visitingRef) || embeddedNurseName;
      nid = normalizeNurseIdString(visitingRef);
    } else {
      nid = String(visitingRef).trim();
    }
  }
  if (!nid && assignedRef != null && assignedRef !== '') {
    if (typeof assignedRef === 'object') {
      if (!embeddedNurseName) embeddedNurseName = nurseDisplayFromObject(assignedRef) || embeddedNurseName;
      nid = normalizeNurseIdString(assignedRef);
    } else {
      nid = String(assignedRef).trim();
    }
  }
  if (!nid) {
    nid = normalizeNurseIdString(
      raw?.nurseId ??
        raw?.nurse_id ??
        raw?.assignedNurseId ??
        raw?.assigned_nurse_id ??
        raw?.nurse?.id ??
        raw?.nurse?._id ??
        raw?.nurse?.uuid ??
        '',
    );
  }

  let patientLabel =
    String(
      raw?.patientName ??
        raw?.patient_name ??
        raw?.patientFullName ??
        (typeof raw?.patient === 'string' ? raw.patient : ''),
    ).trim();

  if (!patientLabel && raw?.patient?.name) {
    patientLabel = String(raw.patient.name).trim();
  }

  if (!patientLabel && typeof raw?.patient === 'object' && raw.patient) {
    const p = raw.patient;
    patientLabel =
      patientDisplayName({
        firstName: p.firstName,
        lastName: p.lastName,
        name: p.name,
      }) || '';
  }

  if (!patientLabel && pid) {
    patientLabel =
      lookups.patientNamesById.get(String(pid)) ||
      lookups.patientNamesById.get(String(pid).toLowerCase()) ||
      '';
  }
  if (!patientLabel) patientLabel = pid ? `Patient (${String(pid).slice(0, 8)}…)` : 'Patient';

  const addrSrc =
    raw?.address ??
    raw?.patient?.residentialAddress ??
    raw?.patient?.address ??
    raw?.patientAddress ??
    '';

  const addrTrim = String(addrSrc ?? '').trim();
  /** Avoid showing a lone em dash when address is unknown. */
  const addressUi = addrTrim && addrTrim !== '—' ? addrTrim : '';

  const prevVisit = normalizeVisitDateForUi(
    raw?.lastVisit ??
      raw?.last_visit ??
      raw?.previousVisit ??
      raw?.previous_visit ??
      raw?.prevVisit ??
      raw?.lastVisitDate ??
      raw?.last_visit_date,
  );
  const nextVisit = normalizeVisitDateForUi(
    raw?.nextVisit ??
      raw?.next_visit ??
      raw?.scheduledDate ??
      raw?.scheduled_date ??
      raw?.scheduledFor ??
      raw?.visitDate ??
      raw?.visit_date ??
      raw?.appointmentDate ??
      raw?.appointment_date,
  );

  let nurseHint = embeddedNurseName;
  if (!nurseHint && nid) {
    nurseHint =
      lookups.nurseNamesById.get(String(nid)) ||
      lookups.nurseNamesById.get(String(nid).toLowerCase()) ||
      '';
  }
  if (!nurseHint && raw?.nurse && typeof raw.nurse === 'object') {
    nurseHint = nurseDisplayFromObject(raw.nurse) || nurseHint;
  }

  const idTail = nid && !String(nid).startsWith('[object ') ? `${String(nid).slice(0, 8)}…` : '';
  const nurseName = String(nurseHint || '').trim() || (idTail ? `Nurse (${idTail})` : '—');

  const frequencyRaw = raw?.frequency ?? raw?.visitFrequency ?? raw?.visit_frequency ?? '—';

  return {
    id: String(idSrc),
    patient: patientLabel,
    patientLine: patientLabel,
    date: nextVisit || prevVisit || '',
    time: String(raw?.time ?? raw?.visitTime ?? raw?.scheduledTime ?? raw?.scheduled_time ?? '—'),
    duration: String(raw?.duration ?? raw?.visitDuration ?? raw?.visit_duration ?? '—'),
    type: String(raw?.visitType ?? raw?.visit_type ?? raw?.type ?? 'Care visit'),
    frequency: String(frequencyRaw).replace(/_/g, ' '),
    prevVisit,
    nextVisit,
    nurseName,
    status: normalizeStatus(raw?.status ?? raw?.state),
    address: addressUi,
    raw,
  };
}

export default function Scheduling() {
  const navigate = useNavigate();
  const onUnauthorized = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const [upcomingVisitRowsRaw, setUpcomingVisitRowsRaw] = useState([]);
  const [otherVisitRowsRaw, setOtherVisitRowsRaw] = useState([]);
  const [visitsUpcomingLoading, setVisitsUpcomingLoading] = useState(true);
  const [visitsOtherLoading, setVisitsOtherLoading] = useState(true);
  const [visitsUpcomingError, setVisitsUpcomingError] = useState('');
  const [visitsOtherError, setVisitsOtherError] = useState('');

  const [patientsRaw, setPatientsRaw] = useState([]);
  const [nursesRaw, setNursesRaw] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [refsError, setRefsError] = useState('');

  const [filter, setFilter] = useState('All Visits');
  const [cancelTarget, setCancelTarget] = useState(null);

  const [scheduleForm, setScheduleForm] = useState(() => ({
    patientId: '',
    visitingNurse: '',
    lastVisit: SAMPLE_SCHEDULE_VISIT.lastVisit,
    nextVisit: SAMPLE_SCHEDULE_VISIT.nextVisit,
    frequency: SAMPLE_SCHEDULE_VISIT.frequency,
  }));
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccessModal, setScheduleSuccessModal] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const lookups = useMemo(() => {
    const patientNamesById = new Map();
    for (const p of patientsRaw) {
      const id = pickPatientApiId(p);
      const key = String(id || '').trim();
      const name = patientDisplayName(p);
      if (key) {
        patientNamesById.set(key, name);
        patientNamesById.set(key.toLowerCase(), name);
      }
    }
    const nurseNamesById = new Map();
    for (const n of nursesRaw) {
      const id = pickVisitingNurseApiId(n);
      const first = n?.firstName || '';
      const last = n?.lastName || '';
      const name = String(n?.name || `${first} ${last}`.trim()).trim();
      const key = String(id || '').trim();
      if (key && name) {
        nurseNamesById.set(key, name);
        nurseNamesById.set(key.toLowerCase(), name);
      }
    }
    return { patientNamesById, nurseNamesById };
  }, [patientsRaw, nursesRaw]);

  const patientOptions = useMemo(() => {
    return patientsRaw
      .map((p, i) => {
        const apiId = pickPatientApiId(p);
        const label = patientDisplayName(p);
        return { apiId, label, key: `${apiId || label}-${i}` };
      })
      .filter((o) => o.apiId && o.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [patientsRaw]);

  const nurseOptions = useMemo(() => {
    return nursesRaw
      .map((n, i) => {
        const apiId = pickVisitingNurseApiId(n);
        const first = n?.firstName || '';
        const last = n?.lastName || '';
        const name = String(n?.name || `${first} ${last}`.trim()).trim();
        const role = String(n?.jobTitle || n?.specialisation || n?.specialization || '').trim();
        const label = role ? `${name} · ${role}` : name;
        return { apiId, label: label || 'Nurse', name, key: `${apiId || name}-${i}` };
      })
      .filter((o) => o.apiId && o.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [nursesRaw]);

  /** When directories load (or refresh), ensure selected IDs stay valid or default to sample / first row. */
  useEffect(() => {
    if (!patientOptions.length) return;
    setScheduleForm((f) => {
      if (patientOptions.some((o) => o.apiId === f.patientId)) return f;
      const preferSample = SAMPLE_SCHEDULE_VISIT.patientId;
      const next =
        patientOptions.some((o) => o.apiId === preferSample) ? preferSample : patientOptions[0].apiId;
      return { ...f, patientId: next };
    });
  }, [patientOptions]);

  useEffect(() => {
    if (!nurseOptions.length) return;
    setScheduleForm((f) => {
      if (nurseOptions.some((o) => o.apiId === f.visitingNurse)) return f;
      const preferSample = SAMPLE_SCHEDULE_VISIT.visitingNurse;
      const next =
        nurseOptions.some((o) => o.apiId === preferSample) ? preferSample : nurseOptions[0].apiId;
      return { ...f, visitingNurse: next };
    });
  }, [nurseOptions]);

  useEffect(() => {
    if (!showScheduleModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape' || scheduleSaving) return;
      e.preventDefault();
      setShowScheduleModal(false);
      setScheduleError('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showScheduleModal, scheduleSaving]);

  const loadUpcomingVisitRows = useCallback(async () => {
    setVisitsUpcomingError('');
    setVisitsUpcomingLoading(true);
    try {
      const res = await fetchUpcomingCareVisits({}, onUnauthorized);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Could not load upcoming visits (${res.status})`);
      }
      const list = extractCareVisitsList(json);
      if (import.meta.env.DEV && list.length === 0 && json && typeof json === 'object' && !Array.isArray(json)) {
        const keys = Object.keys(json);
        if (keys.length) {
          console.warn('[Care Visits] upcoming: parsed 0 rows. Response keys:', keys);
        }
      }
      setUpcomingVisitRowsRaw(list);
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setVisitsUpcomingError(e.message || 'Could not load upcoming care visits.');
      }
      setUpcomingVisitRowsRaw([]);
    } finally {
      setVisitsUpcomingLoading(false);
    }
  }, [onUnauthorized]);

  const loadOtherVisitRows = useCallback(async () => {
    setVisitsOtherError('');
    setVisitsOtherLoading(true);
    try {
      const res = await fetchOtherCareVisits({}, onUnauthorized);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Could not load all visits (${res.status})`);
      }
      const list = extractCareVisitsList(json);
      if (import.meta.env.DEV && list.length === 0 && json && typeof json === 'object' && !Array.isArray(json)) {
        const keys = Object.keys(json);
        if (keys.length) {
          console.warn('[Care Visits] other: parsed 0 rows. Response keys:', keys);
        }
      }
      setOtherVisitRowsRaw(list);
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setVisitsOtherError(e.message || 'Could not load care visits (other).');
      }
      setOtherVisitRowsRaw([]);
    } finally {
      setVisitsOtherLoading(false);
    }
  }, [onUnauthorized]);

  const reloadVisitLists = useCallback(async () => {
    await Promise.all([loadUpcomingVisitRows(), loadOtherVisitRows()]);
  }, [loadUpcomingVisitRows, loadOtherVisitRows]);

  const activeVisitRowsRaw =
    filter === 'All Visits' ? otherVisitRowsRaw : upcomingVisitRowsRaw;

  const visits = useMemo(
    () => activeVisitRowsRaw.map((row, i) => mapCareVisitRow(row, i, lookups)),
    [activeVisitRowsRaw, lookups],
  );

  const loadReferences = useCallback(async () => {
    setRefsError('');
    setRefsLoading(true);
    try {
      const [patientList, nurseRes] = await Promise.all([
        fetchAllPatients(),
        apiFetch('/nurses', { method: 'GET', quiet: true }, onUnauthorized),
      ]);
      setPatientsRaw(Array.isArray(patientList) ? patientList : []);

      let nurseData = {};
      try {
        nurseData = await nurseRes.json();
      } catch {
        nurseData = {};
      }
      if (!nurseRes.ok) {
        throw new Error(nurseData?.message || nurseData?.error || 'Failed to load nurses.');
      }
      const nurseList = Array.isArray(nurseData)
        ? nurseData
        : Array.isArray(nurseData?.nurses)
          ? nurseData.nurses
          : Array.isArray(nurseData?.data)
            ? nurseData.data
            : Array.isArray(nurseData?.items)
              ? nurseData.items
              : [];
      setNursesRaw(nurseList);
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setRefsError(e.message || 'Could not load patients or nurses.');
      }
      setPatientsRaw([]);
      setNursesRaw([]);
    } finally {
      setRefsLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    if (refsLoading) return;
    reloadVisitLists();
  }, [refsLoading, reloadVisitLists]);

  const filtered = visits.filter((v) => {
    if (filter === 'All Visits') return true;
    if (filter === 'Up Coming Visits') return isUpcomingVisitRow(v);
    return true;
  });

  const visitsListLoading =
    filter === 'All Visits' ? visitsOtherLoading : visitsUpcomingLoading;
  const visitsSourceLabel =
    filter === 'All Visits' ? 'GET /care-visits/other' : 'GET /care-visits/upcoming';

  const handleCancel = () => {
    if (!cancelTarget) return;
    const cid = cancelTarget.id;
    const patch = (prev) =>
      prev.map((r, i) => {
        const rid = String(r?.id ?? r?._id ?? r?.uuid ?? r?.visitId ?? `cv-${i}`);
        return rid === cid ? { ...r, status: 'cancelled' } : r;
      });
    setUpcomingVisitRowsRaw(patch);
    setOtherVisitRowsRaw(patch);
    setCancelTarget(null);
  };

  const resetScheduleFormSample = () => {
    setScheduleError('');
    setScheduleForm((f) => {
      const pid =
        patientOptions.some((o) => o.apiId === SAMPLE_SCHEDULE_VISIT.patientId)
          ? SAMPLE_SCHEDULE_VISIT.patientId
          : patientOptions[0]?.apiId ?? f.patientId;
      const nid =
        nurseOptions.some((o) => o.apiId === SAMPLE_SCHEDULE_VISIT.visitingNurse)
          ? SAMPLE_SCHEDULE_VISIT.visitingNurse
          : nurseOptions[0]?.apiId ?? f.visitingNurse;
      return {
        ...f,
        patientId: pid,
        visitingNurse: nid,
        lastVisit: SAMPLE_SCHEDULE_VISIT.lastVisit,
        nextVisit: SAMPLE_SCHEDULE_VISIT.nextVisit,
        frequency: SAMPLE_SCHEDULE_VISIT.frequency,
      };
    });
  };

  const handleScheduleSubmit = async () => {
    setScheduleError('');
    const patientId = String(scheduleForm.patientId || '').trim();
    const visitingNurse = String(scheduleForm.visitingNurse || '').trim();
    const lastVisit = formatYmdFromIsoInput(scheduleForm.lastVisit);
    const nextVisit = formatYmdFromIsoInput(scheduleForm.nextVisit);

    if (!patientId) {
      setScheduleError('Select a patient.');
      return;
    }
    if (!visitingNurse) {
      setScheduleError('Select a visiting nurse.');
      return;
    }
    if (!lastVisit || !nextVisit) {
      setScheduleError('Choose both last visit and next visit dates.');
      return;
    }

    const payload = {
      patientId,
      visitingNurse,
      lastVisit,
      nextVisit,
      frequency: scheduleForm.frequency,
    };

    setScheduleSaving(true);
    try {
      const res = await createCareVisit(payload, onUnauthorized);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Could not create visit (${res.status})`);
      }
      const patientLabel =
        patientOptions.find((o) => o.apiId === patientId)?.label ||
        lookups.patientNamesById.get(patientId) ||
        'Patient';
      const nurseLabel =
        nurseOptions.find((o) => o.apiId === visitingNurse)?.label ||
        lookups.nurseNamesById.get(visitingNurse) ||
        '';
      /** Show immediately so refresh errors do not block feedback. */
      setShowScheduleModal(false);
      setScheduleSuccessModal({
        patientLabel,
        nurseLabel,
        nextVisitLabel: nextVisit,
        frequency: payload.frequency,
      });
      try {
        await reloadVisitLists();
      } catch {
        /* list refresh failed — visit still created */
      }
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setScheduleError(e.message || 'Could not create care visit.');
      }
    } finally {
      setScheduleSaving(false);
    }
  };

  const listBanner = [refsError, visitsUpcomingError, visitsOtherError].filter(Boolean).join(' ');

  return (
    <div className="page-wrapper">
      {listBanner ? (
        <div
          className="alert alert-warning py-2 px-3 mb-3"
          style={{ fontSize: 13, borderRadius: 8 }}
          role="status"
        >
          {listBanner}
        </div>
      ) : null}

      {/* Controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="filter-pills">
          {VISIT_FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-pill${filter === s ? ' active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-kh-primary d-flex align-items-center gap-2"
          onClick={() => {
            setScheduleError('');
            setShowScheduleModal(true);
          }}
          disabled={refsLoading || !patientOptions.length || !nurseOptions.length}
          title={
            refsLoading || !patientOptions.length || !nurseOptions.length
              ? 'Load patients and nurses first.'
              : undefined
          }
        >
          <FiPlus size={15} /> Schedule a visit
        </button>
      </div>

      {/* Table */}
      <div className="kh-card mb-4">
        <div className="card-header-custom">
          <h6>{filter === 'All Visits' ? 'All visits' : 'Upcoming visits'}</h6>
          <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
            {visitsListLoading ? 'Loading…' : `${filtered.length} · ${visitsSourceLabel}`}
          </span>
        </div>
        <div className="table-responsive care-visits-schedule-wrap">
          <table className="table kh-table care-visits-schedule-table">
            <thead>
              <tr>
                <th className="cv-th-patient">Patient</th>
                <th className="cv-th-prev text-nowrap">Previous visit</th>
                <th className="cv-th-next text-nowrap">Next visit</th>
                <th className="cv-th-time">Time</th>
                <th className="cv-th-duration text-nowrap">Duration</th>
                <th className="cv-th-frequency">Frequency</th>
                <th className="cv-th-nurse">Nurse</th>
                <th className="cv-th-status">Status</th>
                <th className="cv-th-actions text-end text-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id}>
                  <td className="cv-cell-patient">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="avatar sm flex-shrink-0 d-flex align-items-center justify-content-center"
                        style={{
                          background: i % 2 === 0 ? '#45B6FE' : '#2E7DB8',
                          color: '#fff',
                        }}
                        aria-hidden
                      >
                        <FiUser size={15} strokeWidth={2} />
                      </div>
                      <div className="cv-patient-stack">
                        <div
                          className="cv-patient-name"
                          style={{ fontWeight: 600, color: 'var(--kh-text)', fontSize: 13 }}
                          title={v.patientLine || v.patient}
                        >
                          {v.patientLine || v.patient}
                        </div>
                        {v.address ? (
                          <div
                            className="cv-patient-addr"
                            style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}
                          >
                            <span title={v.address}>{v.address}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="cv-cell-date">
                    {v.prevVisit
                      ? new Date(`${v.prevVisit}T12:00:00`).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="cv-cell-date">
                    <span style={{ fontWeight: 600, color: '#45B6FE' }}>
                      {v.nextVisit
                        ? new Date(`${v.nextVisit}T12:00:00`).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </td>
                  <td className="cv-cell-time">{v.time}</td>
                  <td className="cv-cell-duration">{v.duration}</td>
                  <td>
                    <span className="badge-kh text-nowrap d-inline-block" style={{ background: '#F0F7FE', color: '#2E7DB8', maxWidth: '100%' }}>
                      {v.frequency}
                    </span>
                  </td>
                  <td className="cv-cell-nurse" title={v.nurseName}>
                    {v.nurseName}
                  </td>
                  <td className="cv-cell-status align-middle">
                    <span className={`badge-kh ${v.status}`}>
                      {v.status === 'cancelled' ? 'cancelled' : v.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="cv-cell-actions">
                    <div className="cv-actions-inner">
                      {v.status === 'scheduled' ? (
                        <button
                          type="button"
                          className="cv-btn-cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCancelTarget(v);
                          }}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visitsListLoading && filtered.length === 0 ? (
            <div className="text-center py-5 text-muted" style={{ fontSize: 13 }}>
              No visits to show for this tab. Schedule a visit or try the other filter.
            </div>
          ) : null}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="modal d-block" style={{ zIndex: 1060 }} onClick={() => setCancelTarget(null)}>
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-body" style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <FiXCircle size={28} style={{ color: '#dc2626' }} />
                </div>
                <h6 style={{ fontWeight: 700, fontSize: 16, color: 'var(--kh-text)', marginBottom: 8 }}>
                  Cancel Visit
                </h6>
                <p style={{ fontSize: 13, color: 'var(--kh-text-muted)', lineHeight: 1.6, marginBottom: 4 }}>
                  Are you sure you want to cancel the visit for
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 4 }}>
                  {cancelTarget.patientLine || cancelTarget.patient}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', marginBottom: 24 }}>
                  <FiCalendar size={11} style={{ marginRight: 4 }} />
                  {cancelTarget.nextVisit
                    ? new Date(`${cancelTarget.nextVisit}T12:00:00`).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}{' '}
                  {cancelTarget.time && cancelTarget.time !== '—' ? `at ${cancelTarget.time}` : ''}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    type="button"
                    onClick={() => setCancelTarget(null)}
                    style={{
                      padding: '10px 28px',
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 2,
                      cursor: 'pointer',
                      background: '#fff',
                      color: 'var(--kh-text)',
                      border: '1px solid #d1d5db',
                    }}
                  >
                    Keep Visit
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                      padding: '10px 28px',
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 2,
                      cursor: 'pointer',
                      background: '#dc2626',
                      color: '#fff',
                      border: '1px solid #dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <FiXCircle size={14} /> Cancel Visit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => {
              if (!scheduleSaving) setShowScheduleModal(false);
            }}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-modal-title"
              className="bg-white shadow-lg"
              style={{
                borderRadius: 12,
                maxWidth: 560,
                width: '100%',
                maxHeight: 'calc(100vh - 32px)',
                outline: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid var(--kh-border-light, #e5e7eb)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <h6 id="schedule-modal-title" className="mb-0" style={{ fontWeight: 700, fontSize: 16 }}>
                  Schedule a visit
                </h6>
                <div className="d-flex flex-shrink-0 gap-2 align-items-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-kh-outline"
                    onClick={resetScheduleFormSample}
                    disabled={scheduleSaving}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={scheduleSaving}
                    onClick={() => !scheduleSaving && setShowScheduleModal(false)}
                  />
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
                {scheduleError ? (
                  <div className="alert alert-danger py-2 small mb-3" role="alert">
                    {scheduleError}
                  </div>
                ) : null}
                {refsLoading ? (
                  <p className="text-muted small mb-3">Loading patients and nurses…</p>
                ) : null}
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Patient
                    </label>
                    <select
                      className="form-select form-control-kh"
                      value={scheduleForm.patientId}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, patientId: e.target.value }))}
                      disabled={!patientOptions.length || scheduleSaving}
                    >
                      {patientOptions.length === 0 ? (
                        <option value="">No patients loaded</option>
                      ) : (
                        patientOptions.map((o) => (
                          <option key={o.key} value={o.apiId}>
                            {o.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="col-12 col-lg-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Visiting nurse
                    </label>
                    <select
                      className="form-select form-control-kh"
                      value={scheduleForm.visitingNurse}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, visitingNurse: e.target.value }))}
                      disabled={!nurseOptions.length || scheduleSaving}
                    >
                      {nurseOptions.length === 0 ? (
                        <option value="">No nurses loaded</option>
                      ) : (
                        nurseOptions.map((o) => (
                          <option key={o.key} value={o.apiId}>
                            {o.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Last visit
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-kh"
                      value={scheduleForm.lastVisit}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, lastVisit: e.target.value }))}
                      disabled={scheduleSaving}
                    />
                  </div>
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Next visit
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-kh"
                      value={scheduleForm.nextVisit}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, nextVisit: e.target.value }))}
                      disabled={scheduleSaving}
                    />
                  </div>
                  <div className="col-12">
                    <label
                      className="form-label"
                      style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}
                    >
                      Frequency
                    </label>
                    <select
                      className="form-select form-control-kh"
                      value={scheduleForm.frequency}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, frequency: e.target.value }))}
                      disabled={scheduleSaving}
                    >
                      {FREQUENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label} ({o.value})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--kh-border-light, #e5e7eb)',
                  flexShrink: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  background: '#fafbfd',
                }}
              >
                <button
                  type="button"
                  className="btn btn-kh-outline"
                  disabled={scheduleSaving}
                  onClick={() => !scheduleSaving && setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  onClick={handleScheduleSubmit}
                  disabled={scheduleSaving || !patientOptions.length || !nurseOptions.length || refsLoading}
                >
                  {scheduleSaving ? 'Saving…' : 'Save visit'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Portal: Framer Motion on layout uses transform → fixed modals inside page would not cover the viewport. */}
      {scheduleSuccessModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setScheduleSuccessModal(null)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-success-title"
              className="bg-white shadow-lg"
              style={{
                borderRadius: 12,
                maxWidth: 420,
                width: '100%',
                outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <FiCheckCircle size={28} style={{ color: '#059669' }} aria-hidden />
                </div>
                <h6
                  id="schedule-success-title"
                  style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 10 }}
                >
                  Care visit created
                </h6>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 8 }}>
                  <strong style={{ color: '#0f172a' }}>{scheduleSuccessModal.patientLabel}</strong>
                  {scheduleSuccessModal.nurseLabel ? (
                    <>
                      {' '}
                      with <strong style={{ color: '#0f172a' }}>{scheduleSuccessModal.nurseLabel}</strong>
                    </>
                  ) : null}{' '}
                  is scheduled. Next visit:{' '}
                  <strong style={{ color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                    {scheduleSuccessModal.nextVisitLabel}
                  </strong>
                  {scheduleSuccessModal.frequency ? (
                    <span>
                      {' '}
                      · {String(scheduleSuccessModal.frequency).replace(/_/g, ' ')}
                    </span>
                  ) : null}
                  .
                </p>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 22 }}>
                  Visit lists were refreshed.
                </p>
                <button
                  type="button"
                  className="btn btn-kh-primary"
                  style={{ minWidth: 140, fontWeight: 700 }}
                  onClick={() => setScheduleSuccessModal(null)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

    </div>
  );
}
