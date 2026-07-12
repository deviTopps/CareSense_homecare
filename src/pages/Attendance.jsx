import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiXCircle, FiMapPin, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiRefreshCw, FiUsers, FiFilter, FiClock } from '../icons/hugeicons-feather';
import { getUser, getToken } from '../api';
import { TablePageLoaderPanel } from '../components/TablePageLoader';
import { useLoadProgress } from '../hooks/useLoadProgress';
import {
  clockInAttendance,
  clockOutAttendance,
  attendanceSummaryFromDailyResponse,
  fetchAllNursesAttendanceRecords,
  getAttendanceColumnValues,
  isCompletedAttendanceTableRow,
  isOpenAttendanceTableRow,
  mapAttendanceRecordToTableRow,
  pickAttendanceField,
  resolveNurseIdForAttendance,
} from '../utils/attendance';
import './Attendance.css';

const ACTIVE_ATTENDANCE_SESSION_KEY = 'attendanceActiveSessionId';

function pickFirst(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
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

function parseLatLngPair(lat, lng) {
  if (lat == null || lng == null || lat === '' || lng === '') return null;
  const la = Number(lat);
  const ln = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;
  return { lat: la, lng: ln };
}

function gpsFromLocationObject(loc) {
  if (!loc || typeof loc !== 'object') return null;
  return parseLatLngPair(
    loc.latitude ?? loc.lat ?? loc.Latitude,
    loc.longitude ?? loc.lng ?? loc.lon ?? loc.Longitude,
  );
}

/** Clock-in / clock-out GPS from common API field names. */
function extractGpsForKind(src, kind) {
  if (!src || typeof src !== 'object') return null;
  const stems = kind === 'in'
    ? ['clockIn', 'clockedIn', 'checkIn', 'check_in', 'clock_in', 'start']
    : ['clockOut', 'clockedOut', 'checkOut', 'check_out', 'clock_out', 'end'];

  for (const stem of stems) {
    const gps = parseLatLngPair(
      src[`${stem}Latitude`] ?? src[`${stem}_latitude`] ?? src[`${stem}Lat`] ?? src[`${stem}_lat`],
      src[`${stem}Longitude`] ?? src[`${stem}_longitude`] ?? src[`${stem}Lng`] ?? src[`${stem}_lng`],
    );
    if (gps) return gps;

    const loc = src[`${stem}Location`] ?? src[`${stem}Gps`] ?? src[`${stem}GPS`] ?? src[`${stem}Coordinates`];
    const fromLoc = gpsFromLocationObject(loc);
    if (fromLoc) return fromLoc;
  }
  return null;
}

function formatClockForTable(raw, dateFallback) {
  if (raw == null || raw === '') return { time: null, sub: null };
  if (typeof raw === 'string' && raw.includes('T')) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const date = d.toISOString().slice(0, 10);
      return {
        time,
        sub: date !== dateFallback ? date : null,
      };
    }
  }
  const time = formatHHMMFromApi(raw);
  return { time: time || String(raw), sub: null };
}

/** Human-readable clock time for table (date + time when API sends ISO). */
function formatClockTimeLabel(raw, fallbackDate) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw > 1e12 ? raw : raw * 1000);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }
  }
  if (typeof raw === 'string' && (raw.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(raw))) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }
  }
  const hm = formatHHMMFromApi(raw);
  if (hm) {
    const d = String(fallbackDate || '').trim();
    return d ? `${d} ${hm}` : hm;
  }
  return typeof raw === 'string' ? raw : null;
}

function AttendanceClockCell({ label, variant }) {
  if (!label) return <span className="attendance-clock-empty">—</span>;
  return (
    <span className={variant === 'in' ? 'attendance-time-in' : 'attendance-cell-clock'}>
      {variant === 'in' && <span className="attendance-time-dot" aria-hidden />}
      <strong className="attendance-clock-value">{label}</strong>
    </span>
  );
}

function AttendancePatientCell({ name, id, registrationNumber }) {
  const display = String(name || '').trim() || '—';
  return (
    <div className="attendance-cell-patient">
      <span className="attendance-cell-patient__name">{display}</span>
      {registrationNumber && (
        <span className="attendance-cell-patient__meta">Reg: {registrationNumber}</span>
      )}
      {id && id !== display && (
        <span className="attendance-cell-patient__meta">ID: {id}</span>
      )}
    </div>
  );
}

function formatGpsCoordinates(gps) {
  if (!gps) return null;
  return `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`;
}

function mapsUrlForGps(gps) {
  if (!gps) return null;
  return `https://www.google.com/maps?q=${gps.lat},${gps.lng}`;
}

function AttendanceGpsCell({ gpsIn, gpsOut, gps, distance, locationIn, locationOut }) {
  const lines = [];
  const hasOut = Boolean(locationOut || gpsOut);

  if (locationIn) {
    lines.push({ label: hasOut ? 'In' : 'Location', text: String(locationIn), gps: gpsIn });
  } else if (gpsIn) {
    lines.push({ label: hasOut ? 'In' : 'GPS', text: formatGpsCoordinates(gpsIn), gps: gpsIn });
  }

  if (locationOut) lines.push({ label: 'Out', text: String(locationOut), gps: gpsOut });
  else if (gpsOut) lines.push({ label: 'Out', text: formatGpsCoordinates(gpsOut), gps: gpsOut });

  if (!lines.length && gps) {
    lines.push({ label: 'GPS', text: formatGpsCoordinates(gps), gps });
  }

  if (!lines.length) {
    if (distance) return <span className="attendance-gps-distance">{distance}</span>;
    return <span className="attendance-gps-empty">—</span>;
  }

  return (
    <div className="attendance-gps-cell">
      {lines.map(({ label, text, gps: g }) => (
        <div key={label} className="attendance-gps-line">
          <span className="attendance-gps-line__label">{label}</span>
          {g && mapsUrlForGps(g) ? (
            <a
              href={mapsUrlForGps(g)}
              target="_blank"
              rel="noopener noreferrer"
              className="attendance-gps-link"
              onClick={(e) => e.stopPropagation()}
              title={text}
            >
              <FiMapPin size={12} aria-hidden />
              <span className="attendance-gps-text">{text}</span>
            </a>
          ) : (
            <span className="attendance-gps-text" title={text}>{text}</span>
          )}
        </div>
      ))}
      {distance && <span className="attendance-gps-distance">{distance}</span>}
    </div>
  );
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
  const clockInRaw = pickAttendanceField(src, 'in') ?? pickFirst(src, ['clockIn', 'clockInTime', 'clockedInAt', 'checkInTime']);
  const clockIn = formatHHMMFromApi(clockInRaw);

  let dateVal = pickFirst(src, ['date', 'visitDate']);
  if (dateVal && typeof dateVal === 'string' && dateVal.includes('T')) {
    dateVal = dateVal.slice(0, 10);
  }
  if (!dateVal && clockInRaw && typeof clockInRaw === 'string' && clockInRaw.includes('T')) {
    dateVal = clockInRaw.slice(0, 10);
  }
  if (!dateVal) dateVal = now.toISOString().slice(0, 10);

  const patientObj = src.patient && typeof src.patient === 'object' && !Array.isArray(src.patient)
    ? src.patient
    : null;
  const patientRaw = pickFirst(src, ['patientName', 'patientFullName', 'patient']);
  const patientName = patientRaw != null && patientRaw !== ''
    ? resolveNamedField(patientRaw, '')
    : (patientObj
      ? [patientObj.firstName, patientObj.lastName].filter(Boolean).join(' ').trim() || patientObj.name || ''
      : '');
  const patientId = pickFirst(src, ['patientId', 'patient_id', 'patientUuid'])
    || (patientObj ? pickFirst(patientObj, ['id', '_id', 'patientId']) : null);
  const patientRegistration = patientObj
    ? pickFirst(patientObj, ['registrationNumber', 'registration_number', 'mrn'])
    : pickFirst(src, ['registrationNumber', 'registration_number']);
  const patientPhone = pickFirst(src, ['patientPhone', 'patient_phone', 'phone'])
    || (patientObj ? pickFirst(patientObj, ['phone', 'phoneNumber', 'mobile']) : null);
  const patientAddress = pickFirst(src, ['patientAddress', 'patient_address', 'address'])
    || (patientObj ? pickFirst(patientObj, ['address', 'residentialAddress']) : null);
  const locationIn = pickFirst(src, ['location', 'clockInLocation', 'clock_in_location']);
  const locationOut = pickFirst(src, ['clockOutLocation', 'clock_out_location']);
  const patient = patientName
    || (patientId != null ? String(patientId) : '—');

  const lat = pickFirst(src, ['latitude', 'lat']);
  const lng = pickFirst(src, ['longitude', 'lng', 'lon']);
  let gps = parseLatLngPair(lat, lng);
  const gpsIn = extractGpsForKind(src, 'in');
  const gpsOut = extractGpsForKind(src, 'out');
  if (!gps && gpsIn) gps = gpsIn;
  const statusRaw = (pickFirst(src, ['status']) || '').toString().toLowerCase();
  let status = 'verified';
  if (src.flaggedForReview === true) status = 'flagged';
  else if (statusRaw === 'missed') status = 'missed';
  else if (statusRaw === 'flagged') status = 'flagged';
  else if (statusRaw === 'clocked-out' || statusRaw === 'completed') status = 'verified';

  const clockOutRaw = pickAttendanceField(src, 'out') ?? pickFirst(src, ['clockOut', 'clockOutTime', 'clockedOutAt', 'checkOutTime']);
  const clockOut = formatHHMMFromApi(clockOutRaw);
  const dateStr = typeof dateVal === 'string' ? dateVal.slice(0, 10) : '';
  const clockInApiDisplay = pickFirst(src, ['clockInDisplay']);
  const clockOutApiDisplay = pickFirst(src, ['clockOutDisplay']);
  const clockInDisplay = formatClockForTable(clockInRaw, dateStr);
  const clockOutDisplay = formatClockForTable(clockOutRaw, dateStr);
  const clockInTimeLabel = (clockInApiDisplay != null ? String(clockInApiDisplay) : null)
    || formatClockTimeLabel(clockInRaw, dateStr)
    || clockInDisplay?.time
    || null;
  const clockOutTimeLabel = (clockOutApiDisplay != null ? String(clockOutApiDisplay) : null)
    || formatClockTimeLabel(clockOutRaw, dateStr)
    || clockOutDisplay?.time
    || null;
  const patientServed = patientName || patient;

  const clockInMs = extractTimestampMs(clockInRaw);
  const clockOutMs = extractTimestampMs(clockOutRaw);

  let durationMinutesFromApi = coerceNonNegativeMinutes(pickFirst(src, [
    'durationMinutes',
    'duration_minutes',
    'visitDurationMinutes',
    'totalMinutes',
    'minutesWorked',
    'workedMinutes',
    'totalDurationMinutes',
  ]));
  if (durationMinutesFromApi == null) {
    const hrs = coerceNonNegativeMinutes(pickFirst(src, ['durationHours', 'totalHours', 'hoursWorked']));
    if (hrs != null) durationMinutesFromApi = hrs * 60;
  }

  const nurseId = pickFirst(src, ['nurseId', 'nurse_id', 'nurseUuid'])
    || (src.nurse && typeof src.nurse === 'object' ? pickFirst(src.nurse, ['id', '_id', 'uuid', 'nurseId']) : null);

  return {
    id,
    nurseId: nurseId != null ? String(nurseId).trim() : '',
    nurse,
    patient,
    patientServed: patientServed || '—',
    patientName: patientName || patientServed || '—',
    patientId: patientId != null ? String(patientId).trim() : '',
    patientRegistration: patientRegistration != null ? String(patientRegistration).trim() : '',
    patientPhone: patientPhone != null ? String(patientPhone).trim() : '',
    patientAddress: patientAddress != null ? String(patientAddress).trim() : '',
    date: typeof dateVal === 'string' ? dateVal.slice(0, 10) : dateVal,
    clockIn,
    clockOut: clockOut || null,
    clockInDisplay,
    clockOutDisplay,
    clockInTimeLabel,
    clockOutTimeLabel,
    clockInMs,
    clockOutMs,
    durationMinutesFromApi,
    gps,
    gpsIn,
    gpsOut,
    locationIn: locationIn != null ? String(locationIn).trim() : '',
    locationOut: locationOut != null ? String(locationOut).trim() : '',
    distance: src.distanceFromPatient != null ? `${src.distanceFromPatient}` : (src.distance != null ? String(src.distance) : null),
    status,
    region: pickFirst(src, ['region']) || '—',
    _daySummary: Boolean(src._daySummary),
    _fromDailyApi: true,
  };
}

/** Query for GET /attendance/nurse/:id/daily?date=YYYY-MM-DD (all nurses aggregated). */
function buildNursesAttendanceQuery(dateYYYYMMDD, selectedYear) {
  const date = String(dateYYYYMMDD || '').trim();
  const year = String(selectedYear || '').trim();
  const now = new Date();
  let resolvedDate = date;
  if (!resolvedDate) {
    if (year) {
      resolvedDate = year === String(now.getFullYear())
        ? now.toISOString().slice(0, 10)
        : `${year}-01-01`;
    } else {
      resolvedDate = now.toISOString().slice(0, 10);
    }
  }
  return {
    date: resolvedDate,
    month: resolvedDate.slice(0, 7),
  };
}

function isCompletedAttendanceRow(row) {
  return isCompletedAttendanceTableRow(row);
}

function isOpenAttendanceRow(row) {
  return isOpenAttendanceTableRow(row);
}

function isDisplayableAttendanceRow(row) {
  if (!row) return false;
  return true;
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

function mapSessionsToTableRows(sessions, user) {
  const u = user || getUser();
  return sortRecordsByDateDesc(
    sessions
      .map((item) => {
        const mapped = mapAttendanceRecordToTableRow(
          item && typeof item === 'object' ? item : null,
        );
        return mapped || attendanceRowFromApiResponse(item, u);
      })
      .filter(Boolean),
  );
}

function mergeAttendanceRows(existing, incoming) {
  const map = new Map();
  for (const row of existing) map.set(row.id, row);
  for (const row of incoming) map.set(row.id, row);
  return sortRecordsByDateDesc(Array.from(map.values()));
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
  open: <FiAlertCircle size={14} style={{ color: '#2563eb' }} />,
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
    () => resolveNurseIdForAttendance(getUser()),
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
  const [completionFilter, setCompletionFilter] = useState('All');
  const [nurseFilter, setNurseFilter] = useState('All Nurses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedYear, setSelectedYear] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [apiRecords, setApiRecords] = useState([]);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [activeAttendanceId, setActiveAttendanceId] = useState(null);

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState('');
  const [listError, setListError] = useState('');
  const [listMeta, setListMeta] = useState(null);
  const lastMonthlyQueryRef = useRef(null);
  const loadRequestRef = useRef(0);
  const { progress: loadProgress, setProgressTarget, finishProgress } = useLoadProgress(listLoading, { finishDelay: 280 });

  const serverRecords = attendanceRecords;

  const allRecords = useMemo(() => {
    const map = new Map();
    for (const r of serverRecords) map.set(r.id, r);
    for (const r of apiRecords) map.set(r.id, r);
    return sortRecordsByDateDesc(Array.from(map.values()));
  }, [serverRecords, apiRecords]);

  const inferredOpenAttendanceId = useMemo(
    () =>
      deriveOpenAttendanceIdFromRecords(
        attendanceRecords.filter((r) => {
          const rid = String(r.nurseId || '').trim();
          const nid = String(nurseIdResolved || '').trim();
          return !nid || !rid || rid === nid;
        }),
      )
      || deriveOpenAttendanceIdFromRecords(apiRecords),
    [attendanceRecords, apiRecords, nurseIdResolved],
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
    const ySet = new Set(allRecords.map((r) => (r.date ? String(r.date).slice(0, 4) : '')).filter(Boolean));
    if (listMeta?.year) ySet.add(String(listMeta.year));
    return ['', ...Array.from(ySet).sort().reverse()];
  }, [allRecords, listMeta]);

  /* Client filters */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRecords.filter((r) => {
      if (statusFilter === 'Verified' && r.status !== 'verified') return false;
      if (statusFilter === 'Flagged' && r.status !== 'flagged') return false;
      if (statusFilter === 'Missed' && r.status !== 'missed') return false;
      if (nurseFilter !== 'All Nurses' && r.nurse !== nurseFilter) return false;
      if (completionFilter === 'Completed' && !isCompletedAttendanceRow(r)) return false;
      if (completionFilter === 'Open' && !isOpenAttendanceRow(r)) return false;
      if (q) {
        const haystack = [r.nurse, r.patient, r.patientName, r.patientServed, r.patientRegistration]
          .map((v) => String(v || '').toLowerCase());
        if (!haystack.some((v) => v.includes(q))) return false;
      }
      return true;
    });
  }, [statusFilter, completionFilter, nurseFilter, searchQuery, allRecords]);

  const stats = useMemo(() => {
    const base = filtered;
    return {
      total: base.length,
      nurses: new Set(base.map((r) => r.nurse).filter(Boolean)).size,
      verified: base.filter((r) => r.status === 'verified').length,
      flagged: base.filter((r) => r.status === 'flagged').length,
      missed: base.filter((r) => r.status === 'missed').length,
      open: base.filter((r) => isOpenAttendanceRow(r)).length,
    };
  }, [filtered]);

  const onUnauthorized = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const loadAllNursesAttendance = useCallback(async (dateYYYYMMDD, year) => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setListLoading(true);
    setListError('');
    setLoadStatus('Connecting to server…');
    setProgressTarget(4);
    const query = buildNursesAttendanceQuery(dateYYYYMMDD, year);
    try {
      const {
        sessions,
        source,
        dailyBody,
        nursesFetched,
        date: loadedDate,
      } = await fetchAllNursesAttendanceRecords(
        { month: query.month, date: query.date },
        onUnauthorized,
        {
          onProgress: (value) => {
            if (loadRequestRef.current !== requestId) return;
            setProgressTarget(value);
          },
          onChunk: (chunkSessions, { completedNurses, totalNurses }) => {
            if (loadRequestRef.current !== requestId) return;
            const chunkRows = mapSessionsToTableRows(chunkSessions);
            if (!chunkRows.length) return;
            setAttendanceRecords((prev) => mergeAttendanceRows(prev, chunkRows));
            setLoadStatus(
              totalNurses > 0
                ? `Loaded ${completedNurses} of ${totalNurses} nurses…`
                : 'Loading attendance records…',
            );
          },
        },
      );
      if (loadRequestRef.current !== requestId) return;

      const tableRows = mapSessionsToTableRows(sessions);
      setAttendanceRecords(tableRows);
      const nurseNames = new Set(tableRows.map((r) => r.nurse).filter(Boolean));
      const summaryBody = dailyBody || {};
      setListMeta({
        ...attendanceSummaryFromDailyResponse(summaryBody, { date: loadedDate, month: query.month }),
        parsedSessionCount: sessions.length,
        openSessionCount: tableRows.filter((r) => isOpenAttendanceTableRow(r)).length,
        nurseCount: nurseNames.size || nursesFetched,
        month: query.month,
        loadDate: loadedDate,
        loadSource: source,
        nursesFetched,
      });
      lastMonthlyQueryRef.current = query;
      setLoadStatus('');
      if (!sessions.length && typeof console !== 'undefined' && console.warn) {
        console.warn('[Attendance] No sessions after monthly + per-nurse daily fetch', {
          query,
          source,
          nursesFetched,
        });
      }
    } catch (e) {
      if (loadRequestRef.current !== requestId) return;
      setListError(e.message || 'Could not load nurses attendance.');
      setAttendanceRecords((prev) => (prev.length > 0 ? prev : []));
      setListMeta(null);
      setLoadStatus('');
    } finally {
      if (loadRequestRef.current !== requestId) return;
      finishProgress(() => setListLoading(false));
    }
  }, [onUnauthorized, setProgressTarget, finishProgress]);

  const reloadAttendanceLists = useCallback(() => {
    void loadAllNursesAttendance(selectedDate, selectedYear);
  }, [selectedDate, selectedYear, loadAllNursesAttendance]);

  useEffect(() => {
    loadAllNursesAttendance(selectedDate, selectedYear);
  }, [selectedDate, selectedYear, loadAllNursesAttendance]);

  const handleClockIn = async () => {
    setSessionError('');
    setSessionSuccess('');
    const nid = String(nurseIdResolved || resolveNurseIdForAttendance(getUser()) || '').trim();
    if (!nid) {
      setSessionError('Clock-in requires a nurse ID on your account (or in your login token). Contact your administrator.');
      return;
    }
    setClockInLoading(true);
    try {
      let coords = null;
      try {
        coords = await readGeoPosition();
      } catch {
        /* still allow clock-in without coordinates */
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
      try {
        coords = await readGeoPosition();
      } catch {
        /* optional */
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
    setStatusFilter('All');
    setCompletionFilter('All');
    setNurseFilter('All Nurses');
    setSearchQuery('');
    setSelectedYear('');
    setPage(1);
  };

  const hasFilters = statusFilter !== 'All'
    || completionFilter !== 'All'
    || nurseFilter !== 'All Nurses'
    || Boolean(searchQuery.trim())
    || selectedYear;

  const periodLabel = useMemo(() => {
    if (selectedDate) return selectedDate;
    if (listMeta?.loadDate) return listMeta.loadDate;
    if (listMeta?.periodLabel) return listMeta.periodLabel;
    if (listMeta?.month) return listMeta.month;
    if (selectedYear) return selectedYear;
    return 'Today';
  }, [selectedDate, selectedYear, listMeta]);

  const statusTagClass = (status) => {
    if (status === 'verified') return 'attendance-status-tag attendance-status-tag--verified';
    if (status === 'flagged') return 'attendance-status-tag attendance-status-tag--flagged';
    if (status === 'open') return 'attendance-status-tag attendance-status-tag--open';
    return 'attendance-status-tag attendance-status-tag--missed';
  };

  return (
    <div className="page-wrapper attendance-page">

      <div className="attendance-hero">
        <div>
          <div className="patients-kicker">Field operations</div>
          <h2 className="patients-title">Attendance</h2>
          <p className="patients-subtitle">
            Track nurse clock-ins, visit times, and GPS verification for {periodLabel}.
          </p>
        </div>
        <div className="patients-hero-actions">
          <button
            type="button"
            className="patients-toolbar-btn"
            onClick={reloadAttendanceLists}
            disabled={listLoading}
          >
            <FiRefreshCw size={15} />
            <span>{listLoading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="attendance-stats">
        <div className="attendance-stat">
          <span className="attendance-stat__label">Visits</span>
          <strong className="attendance-stat__value">{listLoading ? '—' : stats.total}</strong>
        </div>
        <div className="attendance-stat">
          <span className="attendance-stat__label">Nurses</span>
          <strong className="attendance-stat__value">{listLoading ? '—' : stats.nurses}</strong>
        </div>
        <div className="attendance-stat attendance-stat--verified">
          <span className="attendance-stat__label">Verified</span>
          <strong className="attendance-stat__value">{listLoading ? '—' : stats.verified}</strong>
        </div>
        <div className="attendance-stat attendance-stat--flagged">
          <span className="attendance-stat__label">Flagged</span>
          <strong className="attendance-stat__value">{listLoading ? '—' : stats.flagged}</strong>
        </div>
        <div className="attendance-stat attendance-stat--missed">
          <span className="attendance-stat__label">Missed</span>
          <strong className="attendance-stat__value">{listLoading ? '—' : stats.missed}</strong>
        </div>
        <div className="attendance-stat attendance-stat--open">
          <span className="attendance-stat__label">Open</span>
          <strong className="attendance-stat__value">{listLoading ? '—' : stats.open}</strong>
        </div>
      </div>

      <section className="attendance-board kh-card">
        <div className="attendance-toolbar">
          <div className="attendance-toolbar__search">
            <FiSearch size={15} aria-hidden />
            <input
              type="search"
              placeholder="Search nurse or patient…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              aria-label="Search attendance records"
            />
            {searchQuery && (
              <button type="button" className="attendance-toolbar__clear-search" onClick={() => setSearchQuery('')} aria-label="Clear search">
                <FiX size={14} />
              </button>
            )}
          </div>

          <div className="attendance-toolbar__filters">
            <div className="attendance-field attendance-field--inline">
              <label htmlFor="attendance-date">Date</label>
              <input
                id="attendance-date"
                type="date"
                value={selectedDate || listMeta?.loadDate || ''}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedYear('');
                  setPage(1);
                }}
              />
            </div>
            <div className="attendance-field attendance-field--inline">
              <label htmlFor="attendance-nurse">Nurse</label>
              <select id="attendance-nurse" value={nurseFilter} onChange={(e) => { setNurseFilter(e.target.value); setPage(1); }}>
                {nursesList.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="attendance-field attendance-field--inline">
              <label htmlFor="attendance-year">Year</label>
              <select
                id="attendance-year"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedDate('');
                  setPage(1);
                }}
              >
                <option value="">All years</option>
                {years.filter(Boolean).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="attendance-toolbar attendance-toolbar--secondary">
          <div className="attendance-filter-group">
            <span className="attendance-filter-group__label"><FiFilter size={12} /> Status</span>
            <div className="attendance-segment">
              {['All', 'Verified', 'Flagged', 'Missed'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`attendance-segment__btn${statusFilter === f ? ' is-active' : ''}`}
                  onClick={() => { setStatusFilter(f); setPage(1); }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="attendance-filter-group">
            <span className="attendance-filter-group__label"><FiUsers size={12} /> Shift</span>
            <div className="attendance-segment">
              {['All', 'Completed', 'Open'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`attendance-segment__btn${completionFilter === f ? ' is-active' : ''}`}
                  onClick={() => { setCompletionFilter(f); setPage(1); }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button type="button" className="attendance-clear-btn" onClick={resetFilters}>
              <FiX size={13} /> Clear filters
            </button>
          )}
          <span className="attendance-toolbar__count">
            {listLoading ? 'Loading…' : `${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {listError && <div className="attendance-alert--warn">{listError}</div>}
        {!listLoading && !listError && filtered.length === 0 && attendanceRecords.length === 0 && (
          <p className="attendance-board__hint">
            {listMeta?.parsedSessionCount > 0
              ? `Found ${listMeta.parsedSessionCount} session(s) in the API but could not map them to table rows.`
              : `No attendance records for ${listMeta?.periodLabel || periodLabel}.`}
            {hasFilters ? ' Try clearing filters.' : ' Change the visit date or confirm nurses have visits for that day.'}
          </p>
        )}
        {!listLoading && !listError && attendanceRecords.length > 0 && filtered.length === 0 && (
          <p className="attendance-board__hint">
            {attendanceRecords.length} record{attendanceRecords.length === 1 ? '' : 's'} loaded for {periodLabel} but hidden by filters.
          </p>
        )}

        <div className="attendance-table-shell">
          {listLoading && attendanceRecords.length === 0 ? (
            <TablePageLoaderPanel
              progress={loadProgress}
              ariaLabel="Loading attendance records"
            />
          ) : filtered.length === 0 ? (
            <div className="attendance-empty">
              <span className="attendance-empty__icon" aria-hidden>
                <FiSearch size={32} />
              </span>
              <div className="attendance-empty__title">No records found</div>
              <p>
                {attendanceRecords.length > 0
                  ? `${attendanceRecords.length} visit(s) loaded for ${periodLabel} but hidden by filters.`
                  : `No visits for ${periodLabel}. Pick a date above and wait for data to load.`}
              </p>
            </div>
          ) : (
            <>
              {listLoading && (
                <div className="attendance-board__loading-bar" role="status" aria-live="polite">
                  <span className="attendance-board__loading-bar-fill" style={{ width: `${loadProgress}%` }} />
                  <span className="attendance-board__loading-bar-label">
                    {loadStatus || 'Refreshing attendance…'}
                  </span>
                </div>
              )}
              <div className="attendance-table-wrap">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      {['#', 'Date', 'Nurse', 'Patient', 'Clock in', 'Clock out', 'Duration', 'Status', 'GPS'].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r, idx) => {
                      const cols = getAttendanceColumnValues(r);
                      return (
                        <tr
                          key={r.id}
                          className={selected?.id === r.id ? 'is-selected' : ''}
                          onClick={() => setSelected(r)}
                        >
                          <td className="col-num">{(page - 1) * perPage + idx + 1}</td>
                          <td className="attendance-col-date">{r.date}</td>
                          <td className="attendance-col-nurse">{r.nurse}</td>
                          <td className="attendance-col-patient">
                            <span className="attendance-col-patient__name">{cols.patientServed}</span>
                            {r.patientRegistration && (
                              <span className="attendance-col-patient__meta">Reg: {r.patientRegistration}</span>
                            )}
                          </td>
                          <td className="attendance-col-clock attendance-col-clock--in">{cols.clockIn}</td>
                          <td className="attendance-col-clock attendance-col-clock--out">{cols.clockOut}</td>
                          <td className="attendance-col-duration">
                            {String(r.duration || '').trim() || formatAttendanceDuration(r)}
                          </td>
                          <td>
                            <span className={statusTagClass(r.status)}>{r.status}</span>
                          </td>
                          <td className="attendance-col-gps">
                            <span className="attendance-col-gps__text">{cols.gps}</span>
                          </td>
                        </tr>
                      );
                    })}
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
                        els.push(<span key={`e-${p}`} className="attendance-pagination__ellipsis">…</span>);
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
      </section>

      {selected && (
        <>
          <button type="button" className="attendance-drawer-backdrop" onClick={() => setSelected(null)} aria-label="Close details" />
          <aside className="attendance-drawer kh-card" role="dialog" aria-label="Visit details">
            <div className="attendance-detail__inner">
              <div className="attendance-detail__head">
                <div>
                  <p className="attendance-detail__kicker">Visit details</p>
                  <h4>{selected.patientName || selected.patient || 'Patient visit'}</h4>
                </div>
                <button type="button" className="attendance-detail__close" onClick={() => setSelected(null)} aria-label="Close">
                  <FiX size={16} />
                </button>
              </div>

              <div className="attendance-detail__status">
                {statusIcon[selected.status]}
                <span className={statusTagClass(selected.status)}>{selected.status}</span>
              </div>

              <div className="attendance-detail__grid">
                {[
                  { label: 'Nurse', value: selected.nurse },
                  { label: 'Patient ID', value: selected.patientId || '—' },
                  { label: 'Date', value: selected.date },
                  { label: 'Duration', value: formatAttendanceDuration(selected) },
                ].map((item) => (
                  <div key={item.label} className="attendance-detail__row">
                    <label>{item.label}</label>
                    <p>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="attendance-timeline">
                <div className="attendance-timeline__grid">
                  <div className="attendance-timeline__cell">
                    <span>Clock in</span>
                    <strong>{selected.clockInTimeLabel || selected.clockIn || '—'}</strong>
                  </div>
                  <div className="attendance-timeline__cell">
                    <span>Clock out</span>
                    <strong>{selected.clockOutTimeLabel || selected.clockOut || '—'}</strong>
                  </div>
                </div>
              </div>

              {(selected.gpsIn || selected.gpsOut || selected.gps) && (
                <div className="attendance-detail__gps">
                  <label><FiMapPin size={12} /> GPS</label>
                  <AttendanceGpsCell
                    gpsIn={selected.gpsIn}
                    gpsOut={selected.gpsOut}
                    gps={selected.gps}
                    distance={selected.distance}
                    locationIn={selected.locationIn}
                    locationOut={selected.locationOut}
                  />
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
