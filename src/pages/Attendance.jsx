import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiXCircle, FiMapPin, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from '../icons/hugeicons-feather';
import { getUser, getToken } from '../api';
import {
  clockInAttendance,
  clockOutAttendance,
  fetchNurseDailyAttendance,
  fetchNurseMonthlyAttendance,
  flattenNurseDailyAttendanceResponse,
  flattenNurseMonthlyAttendanceResponse,
} from '../utils/attendance';
import './Attendance.css';

const ACTIVE_ATTENDANCE_SESSION_KEY = 'attendanceActiveSessionId';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pickFirst(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
  }
  return null;
}

function resolveNurseIdFromUser(u) {
  if (u && typeof u === 'object') {
    const id = u.nurseId ?? u.nurse_id ?? u.nurse?.id ?? u.nurse?._id ?? u.id ?? u._id;
    if (id != null && id !== '') {
      const s = String(id).trim();
      if (s) return s;
    }
  }
  try {
    const t = getToken();
    if (!t) return null;
    const payload = JSON.parse(atob(t.split('.')[1]));
    const j = payload.nurseId ?? payload.nurse_id ?? payload.userId ?? payload.id ?? payload._id;
    if (j != null && String(j).trim()) return String(j).trim();
  } catch {
    /* ignore */
  }
  return null;
}

/** Prefer nested `attendance` object when API wraps the record. */
function mergeAttendanceShape(data) {
  const nested = data?.attendance && typeof data.attendance === 'object' ? data.attendance : null;
  return nested ? { ...nested, ...data } : data;
}

/** True if object looks like an attendance / clock-in record (narrow deep search). */
function hasClockRecordHints(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return ['clockIn', 'clockInTime', 'clockedInAt', 'checkInTime', 'clock_out', 'clockOut'].some((k) => obj[k] != null);
}

/**
 * ID for POST /attendance/:id/clock-out must be the attendance (clock) document id.
 * Handles common API envelopes (data, payload, etc.) and uuid field names.
 */
function extractServerAttendanceId(data) {
  if (!data || typeof data !== 'object') return null;

  const tryObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    const nestedAtt = obj.attendance && typeof obj.attendance === 'object' ? obj.attendance : null;
    if (nestedAtt) {
      const v = pickFirst(nestedAtt, ['uuid', 'attendanceId', 'attendance_id', '_id', 'id']);
      if (v != null && String(v).trim()) return String(v).trim();
    }
    const v = pickFirst(obj, [
      'uuid', 'attendanceUuid', 'attendance_uuid', 'attendanceId', 'attendance_id',
      'clockId', 'clock_id', 'clockInId', 'clock_in_id', 'clockRecordId', 'visitAttendanceId',
    ]);
    if (v != null && String(v).trim()) return String(v).trim();
    const flat = pickFirst(obj, ['_id', 'id']);
    return flat != null && String(flat).trim() ? String(flat).trim() : null;
  };

  const candidates = [];
  const add = (x) => {
    if (x && typeof x === 'object' && !Array.isArray(x)) candidates.push(x);
  };
  add(data);
  add(data.data);
  add(data.record);
  add(data.result);
  add(data.payload);
  add(data.attendance);
  add(data.clock);
  add(data.session);
  add(data.visit);
  if (data.data && typeof data.data === 'object') {
    add(data.data.attendance);
    add(data.data.clock);
    add(data.data.record);
  }

  for (const obj of candidates) {
    const sid = tryObject(obj);
    if (sid) return sid;
    for (const sk of ['session', 'clock', 'visit', 'record', 'clockRecord']) {
      const sub = obj[sk];
      if (sub && typeof sub === 'object' && !Array.isArray(sub)) {
        const inner = tryObject(sub);
        if (inner) return inner;
      }
    }
  }

  const visited = new WeakSet();
  const walk = (obj, depth) => {
    if (!obj || typeof obj !== 'object' || depth < 0 || visited.has(obj)) return null;
    visited.add(obj);
    if (hasClockRecordHints(obj)) {
      const hit = tryObject(obj);
      if (hit) return hit;
    }
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const w = walk(v, depth - 1);
        if (w) return w;
      }
    }
    return null;
  };
  return walk(data, 5);
}

function formatHHMMFromApi(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'string' && raw.includes('T')) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  return typeof raw === 'string' ? raw : String(raw);
}

/** Milliseconds since epoch from API value, or null. */
function extractTimestampMs(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 1e12 ? raw : raw * 1000;
  }
  if (typeof raw === 'string' && /\d/.test(raw)) {
    const d = new Date(raw.trim());
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return null;
}

function coerceNonNegativeMinutes(v) {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? parseFloat(String(v).replace(/,/g, '')) : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Minutes from clock display "HH:MM" or "HH:MM:SS" (local same-day). */
function minutesFromClockDisplay(str) {
  if (str == null || str === '') return null;
  const s = String(str).trim();
  if (s.includes('T')) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes() + Math.round(d.getSeconds() / 60);
    return null;
  }
  const parts = s.split(':').map((p) => parseInt(String(p).trim(), 10));
  if (parts.length < 2 || parts.some((x) => Number.isNaN(x))) return null;
  const h = parts[0]|0;
  const m = parts[1]|0;
  const sec = parts[2]|0;
  return h * 60 + m + Math.round(sec / 60);
}

function formatMinutesTotal(totalMinutes) {
  const m = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h ${r}m`;
  if (h > 0) return `${h}h`;
  return `${r}m`;
}

/** Prefer API duration hints, then full timestamps, then same-day time-of-day pairs. */
function formatAttendanceDuration(row) {
  if (!row) return '—';

  const apiDur = coerceNonNegativeMinutes(row.durationMinutesFromApi);
  if (apiDur != null) return formatMinutesTotal(apiDur);

  if (row.clockInMs != null && row.clockOutMs != null) {
    const diff = row.clockOutMs - row.clockInMs;
    if (diff > 60_000) return formatMinutesTotal(diff / 60_000);
    if (diff > 0) return '< 1m';
  }

  const cin = row.clockIn;
  const cout = row.clockOut;
  if (!cin || !cout) return '—';

  const mi = minutesFromClockDisplay(cin);
  const mo = minutesFromClockDisplay(cout);
  if (mi == null || mo == null) return '—';

  let dm = mo - mi;
  if (dm <= 0) dm += 24 * 60;
  return formatMinutesTotal(dm);
}

/** Normalize API clock-in response into a table row (best-effort for varying backends). */
function attendanceRowFromApiResponse(data, user) {
  const src = mergeAttendanceShape(data);
  const nurseFallback = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Current user';
  const nurseRaw = pickFirst(src, ['nurseName', 'nurseFullName', 'nurse']);
  const nurse = resolveNamedField(nurseRaw, nurseFallback);

  const now = new Date();
  const serverId = extractServerAttendanceId(data);
  const id = serverId || `clk-${now.getTime()}`;
  const clockInRaw = pickFirst(src, ['clockIn', 'clockInTime', 'clockedInAt', 'checkInTime']);
  let clockIn = formatHHMMFromApi(clockInRaw);
  if (!clockIn) {
    clockIn = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  let dateVal = pickFirst(src, ['date', 'visitDate']);
  if (dateVal && typeof dateVal === 'string' && dateVal.includes('T')) {
    dateVal = dateVal.slice(0, 10);
  }
  if (!dateVal && clockInRaw && typeof clockInRaw === 'string' && clockInRaw.includes('T')) {
    dateVal = clockInRaw.slice(0, 10);
  }
  if (!dateVal) dateVal = now.toISOString().slice(0, 10);

  const patientRaw = pickFirst(src, ['patientName', 'patient']);
  const patient = patientRaw != null && patientRaw !== ''
    ? resolveNamedField(patientRaw, '—')
    : (src.patientId != null ? String(src.patientId) : '—');
  const lat = pickFirst(src, ['latitude', 'lat']);
  const lng = pickFirst(src, ['longitude', 'lng', 'lon']);
  let gps = null;
  if (lat != null && lng != null) {
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isNaN(la) && !Number.isNaN(ln)) gps = { lat: la, lng: ln };
  }
  const statusRaw = (pickFirst(src, ['status']) || 'verified').toString().toLowerCase();
  const status = ['verified', 'flagged', 'missed'].includes(statusRaw) ? statusRaw : 'verified';

  const clockOutRaw = pickFirst(src, ['clockOut', 'clockOutTime', 'clockedOutAt', 'checkOutTime']);
  const clockOut = formatHHMMFromApi(clockOutRaw);

  const clockInMs = extractTimestampMs(clockInRaw);
  const clockOutMs = extractTimestampMs(clockOutRaw);

  let durationMinutesFromApi = coerceNonNegativeMinutes(pickFirst(src, [
    'durationMinutes',
    'duration_minutes',
    'visitDurationMinutes',
    'totalMinutes',
    'minutesWorked',
    'workedMinutes',
  ]));
  if (durationMinutesFromApi == null) {
    const hrs = coerceNonNegativeMinutes(pickFirst(src, ['durationHours', 'totalHours', 'hoursWorked']));
    if (hrs != null) durationMinutesFromApi = hrs * 60;
  }

  return {
    id,
    nurse,
    patient,
    date: typeof dateVal === 'string' ? dateVal.slice(0, 10) : dateVal,
    clockIn,
    clockOut: clockOut || null,
    clockInMs,
    clockOutMs,
    durationMinutesFromApi,
    gps,
    distance: src.distanceFromPatient != null ? `${src.distanceFromPatient}` : (src.distance != null ? String(src.distance) : null),
    status,
    region: pickFirst(src, ['region']) || '—',
  };
}

function attendanceListFromDailyResponse(json) {
  return flattenNurseDailyAttendanceResponse(json);
}

function attendanceListFromMonthlyResponse(json) {
  return flattenNurseMonthlyAttendanceResponse(json);
}

function resolveNamedField(val, fallbackStr) {
  if (val == null || val === '') return fallbackStr;
  if (typeof val === 'object') {
    const n = [val.firstName, val.lastName].filter(Boolean).join(' ').trim() || val.name || val.email || val.fullName;
    return n ? String(n) : fallbackStr;
  }
  return String(val);
}

function sortRecordsByDateDesc(rows) {
  return [...rows].sort((a, b) => {
    const d = (b.date || '').localeCompare(a.date || '');
    if (d !== 0) return d;
    return String(b.clockIn || '').localeCompare(String(a.clockIn || ''));
  });
}

function readGeoPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

const statusIcon = {
  verified: <FiCheckCircle size={14} style={{ color: '#45B6FE' }} />,
  flagged: <FiAlertCircle size={14} style={{ color: '#ea580c' }} />,
  missed: <FiXCircle size={14} style={{ color: '#dc2626' }} />,
};

function isSyntheticClientRowId(id) {
  return typeof id === 'string' && id.startsWith('clk-');
}

/** Most recent row that is clocked in without clock-out, with a usable server attendance id. */
function deriveOpenAttendanceIdFromRecords(rows) {
  const open = (rows || []).filter((r) => {
    if (!r?.clockIn) return false;
    const cout = r.clockOut;
    if (cout != null && String(cout).trim() !== '' && cout !== '—') return false;
    const rid = String(r?.id ?? '').trim();
    if (!rid || isSyntheticClientRowId(rid)) return false;
    return true;
  });
  if (!open.length) return null;
  open.sort((a, b) => {
    const ka = `${a.date || ''} ${a.clockIn || ''}`;
    const kb = `${b.date || ''} ${b.clockIn || ''}`;
    return kb.localeCompare(ka);
  });
  return String(open[0].id).trim();
}

export default function Attendance() {
  const navigate = useNavigate();
  const user = getUser();
  const authToken = getToken();
  const nurseIdResolved = useMemo(
    () => resolveNurseIdFromUser(getUser()),
    [
      authToken,
      user?.nurseId,
      user?.nurse_id,
      user?.id,
      user?._id,
      user?.nurse?.id,
      user?.nurse?._id,
    ],
  );
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [nurseFilter, setNurseFilter] = useState('All Nurses');
  const [selectedDate, setSelectedDate] = useState('');        // specific date YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState('');       // 0-11
  const [selectedYear, setSelectedYear] = useState('');         // e.g. 2026
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [apiRecords, setApiRecords] = useState([]);
  const [includeGps, setIncludeGps] = useState(true);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [activeAttendanceId, setActiveAttendanceId] = useState(null);

  const [dailyRecords, setDailyRecords] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const lastDailyQueryRef = useRef(null);
  const lastMonthlyQueryRef = useRef(null);

  const serverRecords = useMemo(
    () => (selectedDate ? dailyRecords : monthlyRecords),
    [selectedDate, dailyRecords, monthlyRecords],
  );

  const allRecords = useMemo(() => {
    const map = new Map();
    for (const r of serverRecords) map.set(r.id, r);
    for (const r of apiRecords) map.set(r.id, r);
    return sortRecordsByDateDesc(Array.from(map.values()));
  }, [serverRecords, apiRecords]);

  /** Open shift id from server-backed lists when this tab never stored clock-in uuid. */
  const inferredOpenAttendanceId = useMemo(
    () =>
      deriveOpenAttendanceIdFromRecords(dailyRecords)
      || deriveOpenAttendanceIdFromRecords(monthlyRecords)
      || deriveOpenAttendanceIdFromRecords(apiRecords),
    [dailyRecords, monthlyRecords, apiRecords],
  );

  const displayOpenAttendanceId = useMemo(() => {
    const a = String(activeAttendanceId || '').trim();
    if (a && !isSyntheticClientRowId(a)) return a;
    return String(inferredOpenAttendanceId || '').trim();
  }, [activeAttendanceId, inferredOpenAttendanceId]);

  useEffect(() => {
    if (!inferredOpenAttendanceId) return;
    const a = String(activeAttendanceId || '').trim();
    if (a && !isSyntheticClientRowId(a)) return;
    setActiveAttendanceId(inferredOpenAttendanceId);
    try {
      sessionStorage.setItem(ACTIVE_ATTENDANCE_SESSION_KEY, inferredOpenAttendanceId);
    } catch {
      /* ignore */
    }
  }, [inferredOpenAttendanceId, activeAttendanceId]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(ACTIVE_ATTENDANCE_SESSION_KEY);
      if (stored) setActiveAttendanceId(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const nursesList = useMemo(() => {
    const names = new Set();
    allRecords.forEach((r) => { if (r.nurse) names.add(r.nurse); });
    return ['All Nurses', ...Array.from(names).sort()];
  }, [allRecords]);

  /* Derive available years */
  const years = useMemo(() => {
    const ySet = new Set(allRecords.map(r => r.date.slice(0, 4)));
    return ['', ...Array.from(ySet).sort().reverse()];
  }, [allRecords]);

  /* Filter records */
  const filtered = useMemo(() => {
    return allRecords.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter.toLowerCase()) return false;
      if (nurseFilter !== 'All Nurses' && r.nurse !== nurseFilter) return false;
      if (selectedDate && r.date !== selectedDate) return false;
      if (selectedYear && !selectedDate) {
        if (r.date.slice(0, 4) !== selectedYear) return false;
        if (selectedMonth !== '' && r.date.slice(5, 7) !== String(Number(selectedMonth) + 1).padStart(2, '0')) return false;
      }
      return true;
    });
  }, [statusFilter, nurseFilter, selectedDate, selectedMonth, selectedYear, allRecords]);

  const onUnauthorized = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const loadMonthlyAttendance = useCallback(async (year, month1to12) => {
    setListLoading(true);
    setListError('');
    const nid = String(nurseIdResolved || '').trim();
    if (!nid) {
      setListLoading(false);
      setMonthlyRecords([]);
      return;
    }
    const y = Number(year);
    const m = Number(month1to12);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
      setListLoading(false);
      setListError('Invalid month.');
      return;
    }
    const monthParam = `${y}-${String(m).padStart(2, '0')}`;
    try {
      const body = await fetchNurseMonthlyAttendance(nid, { month: monthParam }, onUnauthorized);
      const list = attendanceListFromMonthlyResponse(body);
      const u = getUser();
      const rows = list.map((item) => attendanceRowFromApiResponse(item, u));
      setMonthlyRecords(sortRecordsByDateDesc(rows));
      lastMonthlyQueryRef.current = { year: y, month: m, monthParam };
    } catch (e) {
      setListError(e.message || 'Could not load monthly attendance.');
      setMonthlyRecords([]);
    } finally {
      setListLoading(false);
    }
  }, [onUnauthorized, nurseIdResolved]);

  const loadDailyAttendance = useCallback(async (dateYYYYMMDD) => {
    setListLoading(true);
    setListError('');
    const nid = String(nurseIdResolved || '').trim();
    if (!nid) {
      setListLoading(false);
      setDailyRecords([]);
      return;
    }
    const date = String(dateYYYYMMDD || '').trim();
    if (!date) {
      setListLoading(false);
      return;
    }
    try {
      const body = await fetchNurseDailyAttendance(nid, { date }, onUnauthorized);
      const list = attendanceListFromDailyResponse(body);
      const u = getUser();
      const rows = list.map((item) => attendanceRowFromApiResponse(item, u));
      setDailyRecords(sortRecordsByDateDesc(rows));
      lastDailyQueryRef.current = { nurseId: nid, date };
    } catch (e) {
      setListError(e.message || 'Could not load daily attendance.');
      setDailyRecords([]);
    } finally {
      setListLoading(false);
    }
  }, [onUnauthorized, nurseIdResolved]);

  const reloadAttendanceLists = useCallback(() => {
    if (selectedDate) {
      void loadDailyAttendance(selectedDate);
      return;
    }
    const q = lastMonthlyQueryRef.current;
    if (q?.year != null && q?.month != null) {
      void loadMonthlyAttendance(q.year, q.month);
      return;
    }
    const now = new Date();
    void loadMonthlyAttendance(now.getFullYear(), now.getMonth() + 1);
  }, [selectedDate, loadDailyAttendance, loadMonthlyAttendance]);

  useEffect(() => {
    if (!nurseIdResolved) {
      setDailyRecords([]);
      setMonthlyRecords([]);
      setListError('');
      return;
    }
    if (selectedDate) {
      loadDailyAttendance(selectedDate);
      return;
    }
    const now = new Date();
    if (selectedYear && selectedMonth !== '') {
      loadMonthlyAttendance(Number(selectedYear), Number(selectedMonth) + 1);
      return;
    }
    if (selectedYear) {
      loadMonthlyAttendance(Number(selectedYear), now.getMonth() + 1);
      return;
    }
    loadMonthlyAttendance(now.getFullYear(), now.getMonth() + 1);
  }, [nurseIdResolved, selectedDate, selectedYear, selectedMonth, loadDailyAttendance, loadMonthlyAttendance]);

  const handleClockIn = async () => {
    setSessionError('');
    setSessionSuccess('');
    const nid = String(nurseIdResolved || resolveNurseIdFromUser(getUser()) || '').trim();
    if (!nid) {
      setSessionError('Clock-in requires a nurse ID on your account (or in your login token). Contact your administrator.');
      return;
    }
    setClockInLoading(true);
    try {
      let coords = null;
      if (includeGps) {
        try {
          coords = await readGeoPosition();
        } catch {
          /* optional: still allow clock-in without coordinates */
        }
      }
      const payload = {
        nurseId: nid,
        ...(coords && {
          latitude: coords.latitude,
          longitude: coords.longitude,
          ...(coords.accuracy != null && { accuracy: coords.accuracy }),
        }),
      };
      const data = await clockInAttendance(payload, onUnauthorized);
      const row = attendanceRowFromApiResponse(data, user);
      const serverId = extractServerAttendanceId(data);
      if (serverId) {
        row.id = serverId;
        setActiveAttendanceId(serverId);
        try {
          sessionStorage.setItem(ACTIVE_ATTENDANCE_SESSION_KEY, serverId);
        } catch {
          /* ignore */
        }
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[Attendance] Clock-in returned no recognizable attendance/session id.', data);
      }
      setApiRecords((prev) => [row, ...prev]);
      setSessionSuccess(`Clock-in recorded at ${row.clockIn}. Use Clock out when the visit ends.`);
      setPage(1);
      reloadAttendanceLists();
    } catch (err) {
      setSessionError(err.message || 'Clock-in failed.');
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    let id = String(activeAttendanceId || '').trim();
    if (!id || isSyntheticClientRowId(id)) {
      try {
        id = String(sessionStorage.getItem(ACTIVE_ATTENDANCE_SESSION_KEY) || '').trim();
      } catch {
        id = '';
      }
    }
    if (!id || isSyntheticClientRowId(id)) {
      id = String(inferredOpenAttendanceId || '').trim();
    }
    setSessionError('');
    setSessionSuccess('');
    if (!id) {
      setSessionError(
        'No open attendance session was found. Use Date = today (or the day you clocked in), wait for records to load, then try Clock out again.',
      );
      return;
    }
    setClockOutLoading(true);
    try {
      let coords = null;
      if (includeGps) {
        try {
          coords = await readGeoPosition();
        } catch {
          /* optional */
        }
      }
      const payload = {
        ...(coords && {
          latitude: coords.latitude,
          longitude: coords.longitude,
          ...(coords.accuracy != null && { accuracy: coords.accuracy }),
        }),
      };
      const data = await clockOutAttendance(id, payload, onUnauthorized);
      const src = mergeAttendanceShape(data);
      const outTime = formatHHMMFromApi(
        pickFirst(src, ['clockOut', 'clockOutTime', 'clockedOutAt', 'checkOutTime']),
      ) || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      const outRaw = pickFirst(src, ['clockOut', 'clockOutTime', 'clockedOutAt', 'checkOutTime']);
      const outMs = extractTimestampMs(outRaw);

      setApiRecords((prev) => prev.map((r) => (r.id === id ? {
        ...r,
        clockOut: outTime,
        clockOutMs: outMs ?? r.clockOutMs,
        durationMinutesFromApi: coerceNonNegativeMinutes(pickFirst(src, [
          'durationMinutes', 'duration_minutes', 'totalMinutes', 'minutesWorked',
        ])) ?? r.durationMinutesFromApi,
      } : r)));

      if (activeAttendanceId === id) {
        setActiveAttendanceId(null);
      }
      try {
        if (sessionStorage.getItem(ACTIVE_ATTENDANCE_SESSION_KEY) === id) {
          sessionStorage.removeItem(ACTIVE_ATTENDANCE_SESSION_KEY);
        }
      } catch {
        /* ignore */
      }
      setSessionSuccess(`Clock-out recorded at ${outTime}.`);
      reloadAttendanceLists();
    } catch (err) {
      setSessionError(err.message || 'Clock-out failed.');
    } finally {
      setClockOutLoading(false);
    }
  };

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => {
    setStatusFilter('All'); setNurseFilter('All Nurses');
    setSelectedDate(''); setSelectedMonth(''); setSelectedYear('');
    setPage(1);
  };

  const hasFilters = statusFilter !== 'All' || nurseFilter !== 'All Nurses' || selectedDate || selectedMonth !== '' || selectedYear;
  const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'user';
  const onShift = Boolean(displayOpenAttendanceId);

  const monthlyPeriodLabel = useMemo(() => {
    if (selectedDate) return '';
    const now = new Date();
    if (selectedYear && selectedMonth !== '') {
      return `${selectedYear}-${String(Number(selectedMonth) + 1).padStart(2, '0')}`;
    }
    if (selectedYear) {
      return `${selectedYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedDate, selectedYear, selectedMonth]);

  const statusTagClass = (status) => {
    if (status === 'verified') return 'attendance-status-tag attendance-status-tag--verified';
    if (status === 'flagged') return 'attendance-status-tag attendance-status-tag--flagged';
    return 'attendance-status-tag attendance-status-tag--missed';
  };

  return (
    <div className="page-wrapper attendance-page">

      <section className="attendance-shift">
        <div className="attendance-shift__top">
          <div>
            <h2 className="attendance-shift__title">Today&apos;s shift</h2>
            <p className="attendance-shift__meta">Signed in as {userDisplayName}</p>
            {onShift && (
              <span className="attendance-shift__badge">
                <span className="attendance-shift__badge-dot" aria-hidden />
                On shift — remember to clock out when you finish
              </span>
            )}
            {!nurseIdResolved && user && (
              <p className="attendance-shift__meta" style={{ marginTop: 8, color: '#b45309' }}>
                No nurse ID on this account. Contact your administrator if records do not load.
              </p>
            )}
          </div>
          <div className="attendance-shift__actions">
            <button
              type="button"
              className="attendance-btn attendance-btn--in"
              onClick={handleClockIn}
              disabled={clockInLoading || clockOutLoading}
            >
              {clockInLoading ? 'Submitting…' : 'Clock in'}
            </button>
            <button
              type="button"
              className="attendance-btn attendance-btn--out"
              onClick={handleClockOut}
              disabled={clockInLoading || clockOutLoading}
            >
              {clockOutLoading ? 'Submitting…' : 'Clock out'}
            </button>
          </div>
        </div>
        <div className="attendance-shift__footer">
          <label className="attendance-gps-toggle">
            <input type="checkbox" checked={includeGps} onChange={(e) => setIncludeGps(e.target.checked)} />
            Share location when clocking in or out
          </label>
          <span className="attendance-shift__hint">GPS is optional if your browser blocks location access.</span>
        </div>
        {sessionError && <div className="attendance-alert attendance-alert--error">{sessionError}</div>}
        {sessionSuccess && <div className="attendance-alert attendance-alert--success">{sessionSuccess}</div>}
      </section>

      <section className="attendance-records kh-card attendance-table-card">
        <div className="attendance-records__head">
          <h3>{selectedDate ? 'Daily sessions' : 'Monthly sessions'}</h3>
          <span className="attendance-records__count">
            {listLoading ? 'Loading…' : `${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
            {!listLoading && monthlyPeriodLabel && (
              <span style={{ marginLeft: 6 }}>· {monthlyPeriodLabel}</span>
            )}
          </span>
        </div>
        {listError && <div className="attendance-alert--warn">{listError}</div>}

        <div className="attendance-filters">
          <div className="attendance-field">
            <label>Nurse</label>
            <select value={nurseFilter} onChange={(e) => { setNurseFilter(e.target.value); setPage(1); }}>
              {nursesList.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="attendance-field">
            <label>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedMonth(''); setSelectedYear(''); setPage(1); }}
            />
          </div>
          <span className="attendance-filters__or">or</span>
          <div className="attendance-field">
            <label>Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedDate('');
                setPage(1);
                if (!e.target.value) setSelectedMonth('');
              }}
            >
              <option value="">All years</option>
              {years.filter(Boolean).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="attendance-field">
            <label>Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDate(''); setPage(1); }}
              disabled={!selectedYear}
            >
              <option value="">All months</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="attendance-field" style={{ marginLeft: 'auto' }}>
            <label>Status</label>
            <div className="attendance-status-pills">
              {['All', 'Verified', 'Flagged', 'Missed'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={statusFilter === f ? 'is-active' : ''}
                  onClick={() => { setStatusFilter(f); setPage(1); }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button type="button" className="attendance-clear-btn" onClick={resetFilters}>
              <FiX size={13} /> Clear
            </button>
          )}
        </div>

        <div className="attendance-layout">
          <div className="attendance-layout__main kh-card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div className="attendance-empty">
                <span className="attendance-empty__icon" aria-hidden>
                  <FiSearch size={32} />
                </span>
                <div className="attendance-empty__title">No records found</div>
                <p style={{ fontSize: 12.5, marginTop: 4, marginBottom: 0 }}>Try a different date or clear your filters.</p>
              </div>
            ) : (
              <>
                <div className="attendance-table-wrap">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        {['#', 'Date', 'Nurse', 'Patient', 'In', 'Out', 'Duration', 'GPS', 'Status'].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={selected?.id === r.id ? 'is-selected' : ''}
                          onClick={() => setSelected(r)}
                        >
                          <td className="col-num">{(page - 1) * perPage + idx + 1}</td>
                          <td>{r.date}</td>
                          <td>{r.nurse}</td>
                          <td>{r.patient}</td>
                          <td>
                            {r.clockIn ? (
                              <span className="attendance-time-in">
                                <span className="attendance-time-dot" />
                                {r.clockIn}
                              </span>
                            ) : '—'}
                          </td>
                          <td>{r.clockOut || '—'}</td>
                          <td>{formatAttendanceDuration(r)}</td>
                          <td style={{ color: 'var(--kh-text-muted)' }}>{r.distance || '—'}</td>
                          <td><span className={statusTagClass(r.status)}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="attendance-pagination">
                  <span className="attendance-pagination__info">
                    {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                  </span>
                  <div className="attendance-pagination__nav">
                    <button type="button" className="attendance-page-btn" onClick={() => setPage(1)} disabled={page === 1}><FiChevronsLeft size={14} /></button>
                    <button type="button" className="attendance-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><FiChevronLeft size={14} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => {
                        const els = [];
                        if (idx > 0 && p - arr[idx - 1] > 1) {
                          els.push(<span key={`e-${p}`} style={{ padding: '5px 4px', fontSize: 12, color: '#9ca3af' }}>…</span>);
                        }
                        els.push(
                          <button
                            key={p}
                            type="button"
                            className={`attendance-page-btn${page === p ? ' is-active' : ''}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>,
                        );
                        return els;
                      })}
                    <button type="button" className="attendance-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><FiChevronRight size={14} /></button>
                    <button type="button" className="attendance-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}><FiChevronsRight size={14} /></button>
                  </div>
                </div>
              </>
            )}
          </div>

          {selected && (
            <aside className="attendance-detail kh-card">
              <div className="attendance-detail__inner">
                <div className="attendance-detail__head">
                  <h4>Visit details</h4>
                  <button type="button" className="attendance-detail__close" onClick={() => setSelected(null)} aria-label="Close">
                    <FiX size={14} />
                  </button>
                </div>
                {[
                  { label: 'Nurse', value: selected.nurse },
                  { label: 'Patient', value: selected.patient },
                  { label: 'Region', value: selected.region },
                  { label: 'Date', value: selected.date },
                ].map((item) => (
                  <div key={item.label} className="attendance-detail__row">
                    <label>{item.label}</label>
                    <p>{item.value}</p>
                  </div>
                ))}
                <div className="attendance-timeline">
                  <div className="attendance-timeline__grid">
                    <div className="attendance-timeline__cell">
                      <span>Clock in</span>
                      <strong>{selected.clockIn || '—'}</strong>
                    </div>
                    <div className="attendance-timeline__cell">
                      <span>Clock out</span>
                      <strong>{selected.clockOut || '—'}</strong>
                    </div>
                  </div>
                  <div className="attendance-timeline__cell" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Duration</span>
                    <strong>{formatAttendanceDuration(selected)}</strong>
                  </div>
                </div>
                {selected.gps && (
                  <div className="attendance-timeline" style={{ marginTop: 12 }}>
                    <div className="attendance-detail__row">
                      <label><FiMapPin size={11} style={{ marginRight: 4 }} />GPS</label>
                      <p style={{ marginBottom: 4 }}>
                        {selected.gps.lat.toFixed(4)}, {selected.gps.lng.toFixed(4)}
                      </p>
                      {selected.distance && (
                        <p style={{ fontSize: 12, color: 'var(--kh-text-muted)', margin: 0 }}>
                          Distance: {selected.distance}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="d-flex align-items-center gap-2" style={{ marginTop: 14 }}>
                  {statusIcon[selected.status]}
                  <span className={statusTagClass(selected.status)}>{selected.status}</span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
