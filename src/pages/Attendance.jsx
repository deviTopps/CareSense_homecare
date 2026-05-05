import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiXCircle, FiMapPin, FiClock, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter } from '../icons/hugeicons-feather';
import { getUser, getToken } from '../api';
import { clockInAttendance, clockOutAttendance, fetchNurseMonthlyAttendance, fetchNurseDailyAttendance } from '../utils/attendance';

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

function extractServerAttendanceId(data) {
  const m = mergeAttendanceShape(data);
  const id = pickFirst(m, ['id', '_id', 'attendanceId']);
  return id != null ? String(id) : null;
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

/** Normalize API clock-in response into a table row (best-effort for varying backends). */
function attendanceRowFromApiResponse(data, user) {
  const src = mergeAttendanceShape(data);
  const nurseFallback = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Current user';
  const nurseRaw = pickFirst(src, ['nurseName', 'nurseFullName', 'nurse']);
  const nurse = resolveNamedField(nurseRaw, nurseFallback);

  const now = new Date();
  const serverId = extractServerAttendanceId(data);
  const id = serverId || String(pickFirst(src, ['id', '_id', 'attendanceId']) || `clk-${now.getTime()}`);
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

  return {
    id,
    nurse,
    patient,
    date: typeof dateVal === 'string' ? dateVal.slice(0, 10) : dateVal,
    clockIn,
    clockOut: clockOut || null,
    gps,
    distance: src.distanceFromPatient != null ? `${src.distanceFromPatient}` : (src.distance != null ? String(src.distance) : null),
    status,
    region: pickFirst(src, ['region']) || '—',
  };
}

function attendanceListFromMonthlyResponse(json) {
  if (Array.isArray(json)) return json;
  const raw = json?.data ?? json?.records ?? json?.attendances ?? json?.items ?? json?.rows ?? json?.result;
  return Array.isArray(raw) ? raw : [];
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

const calcDuration = (cin, cout) => {
  if (!cin || !cout) return '—';
  const [h1, m1] = cin.split(':').map(Number);
  const [h2, m2] = cout.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff <= 0) return '—';
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

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
  const [clockPatientId, setClockPatientId] = useState('');
  const [clockNotes, setClockNotes] = useState('');
  const [includeGps, setIncludeGps] = useState(true);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [activeAttendanceId, setActiveAttendanceId] = useState(null);
  const [clockOutAttendanceId, setClockOutAttendanceId] = useState('');
  const [clockOutNotes, setClockOutNotes] = useState('');

  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [dailyError, setDailyError] = useState('');
  const lastMonthlyQueryRef = useRef(null);
  const lastDailyQueryRef = useRef(null);

  const allRecords = useMemo(() => {
    const map = new Map();
    for (const r of monthlyRecords) map.set(r.id, r);
    for (const r of dailyRecords) map.set(r.id, r);
    for (const r of apiRecords) map.set(r.id, r);
    return sortRecordsByDateDesc(Array.from(map.values()));
  }, [monthlyRecords, dailyRecords, apiRecords]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(ACTIVE_ATTENDANCE_SESSION_KEY);
      if (stored) {
        setActiveAttendanceId(stored);
        setClockOutAttendanceId((prev) => prev || stored);
      }
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
      setListError(e.message || 'Could not load attendance.');
      setMonthlyRecords([]);
    } finally {
      setListLoading(false);
    }
  }, [onUnauthorized, nurseIdResolved]);

  const loadDailyAttendance = useCallback(async (nurseId, dateYYYYMMDD) => {
    const nid = String(nurseId || '').trim();
    if (!nid) {
      setDailyRecords([]);
      setDailyError('');
      return;
    }
    setDailyLoading(true);
    setDailyError('');
    try {
      const body = await fetchNurseDailyAttendance(
        nid,
        dateYYYYMMDD ? { date: dateYYYYMMDD } : {},
        onUnauthorized,
      );
      const list = attendanceListFromMonthlyResponse(body);
      const u = getUser();
      const rows = list.map((item) => attendanceRowFromApiResponse(item, u));
      setDailyRecords(sortRecordsByDateDesc(rows));
      lastDailyQueryRef.current = { nurseId: nid, date: dateYYYYMMDD || new Date().toISOString().slice(0, 10) };
    } catch (e) {
      setDailyError(e.message || 'Could not load daily attendance.');
      setDailyRecords([]);
    } finally {
      setDailyLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    const now = new Date();
    if (selectedYear && selectedMonth !== '') {
      loadMonthlyAttendance(Number(selectedYear), Number(selectedMonth) + 1);
    } else {
      loadMonthlyAttendance(now.getFullYear(), now.getMonth() + 1);
    }
  }, [selectedYear, selectedMonth, loadMonthlyAttendance]);

  useEffect(() => {
    if (!nurseIdResolved) {
      setDailyRecords([]);
      setDailyError('');
      return;
    }
    const date = selectedDate || new Date().toISOString().slice(0, 10);
    loadDailyAttendance(nurseIdResolved, date);
  }, [nurseIdResolved, selectedDate, loadDailyAttendance]);

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
        ...(clockPatientId.trim() && { patientId: clockPatientId.trim() }),
        ...(clockNotes.trim() && { notes: clockNotes.trim() }),
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
        setClockOutAttendanceId(serverId);
        try {
          sessionStorage.setItem(ACTIVE_ATTENDANCE_SESSION_KEY, serverId);
        } catch {
          /* ignore */
        }
      }
      setApiRecords((prev) => [row, ...prev]);
      setSessionSuccess(`Clock-in recorded at ${row.clockIn}. Use Clock out when the visit ends.`);
      setPage(1);
      const q = lastMonthlyQueryRef.current;
      if (q?.year != null && q?.month != null) {
        void loadMonthlyAttendance(q.year, q.month);
      }
      if (nurseIdResolved) {
        const d = selectedDate || new Date().toISOString().slice(0, 10);
        void loadDailyAttendance(nurseIdResolved, d);
      }
    } catch (err) {
      setSessionError(err.message || 'Clock-in failed.');
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    const id = (clockOutAttendanceId.trim() || activeAttendanceId || '').trim();
    setSessionError('');
    setSessionSuccess('');
    if (!id) {
      setSessionError('Enter an attendance ID, or clock in first.');
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
        ...(clockOutNotes.trim() && { notes: clockOutNotes.trim() }),
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

      setApiRecords((prev) => prev.map((r) => (r.id === id ? { ...r, clockOut: outTime } : r)));

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
      setClockOutNotes('');
      setClockOutAttendanceId('');
      setSessionSuccess(`Clock-out recorded at ${outTime}.`);
      const q = lastMonthlyQueryRef.current;
      if (q?.year != null && q?.month != null) {
        void loadMonthlyAttendance(q.year, q.month);
      }
      if (nurseIdResolved) {
        const d = selectedDate || new Date().toISOString().slice(0, 10);
        void loadDailyAttendance(nurseIdResolved, d);
      }
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

  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>

      {/* ── Clock in / Clock out (API) ── */}
      <div className="kh-card" style={{ marginBottom: 16, padding: 0 }}>
        <div style={{ background: '#1565A0', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className="d-flex align-items-center gap-2">
            <FiClock size={18} style={{ color: '#fff' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Attendance</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                Signed in as {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'user'}
                {!nurseIdResolved && user && (
                  <span style={{ display: 'block', marginTop: 4, fontSize: 11, opacity: 0.88 }}>
                    No nurse ID on this account — daily attendance from the server is skipped.
                  </span>
                )}
                {activeAttendanceId && (
                  <span style={{ display: 'block', marginTop: 4, opacity: 0.95 }}>
                    Open session: <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.15)', padding: '2px 6px', borderRadius: 2 }}>{activeAttendanceId}</code>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleClockIn}
              disabled={clockInLoading || clockOutLoading}
              style={{
                padding: '10px 22px', fontSize: 13, fontWeight: 800, borderRadius: 2, cursor: clockInLoading ? 'wait' : 'pointer',
                background: '#fff', color: '#1565A0', border: 'none',
                opacity: clockInLoading || clockOutLoading ? 0.85 : 1,
              }}
            >
              {clockInLoading ? 'Submitting…' : 'Clock in'}
            </button>
            <button
              type="button"
              onClick={handleClockOut}
              disabled={clockInLoading || clockOutLoading}
              style={{
                padding: '10px 22px', fontSize: 13, fontWeight: 800, borderRadius: 2, cursor: clockOutLoading ? 'wait' : 'pointer',
                background: '#0d4f7c', color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
                opacity: clockInLoading || clockOutLoading ? 0.85 : 1,
              }}
            >
              {clockOutLoading ? 'Submitting…' : 'Clock out'}
            </button>
          </div>
        </div>
        <div style={{ padding: '16px 20px', display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', alignItems: 'end', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Patient ID (optional · clock in)</label>
            <input
              value={clockPatientId}
              onChange={(e) => setClockPatientId(e.target.value)}
              placeholder="e.g. visit / patient id"
              className="form-control form-control-kh"
              style={{ fontSize: 13, fontWeight: 600 }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Notes (optional · clock in)</label>
            <input
              value={clockNotes}
              onChange={(e) => setClockNotes(e.target.value)}
              placeholder="Short note for this check-in"
              className="form-control form-control-kh"
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ gridColumn: 'minmax(200px, 1fr)' }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Attendance ID (clock out)</label>
            <input
              value={clockOutAttendanceId}
              onChange={(e) => setClockOutAttendanceId(e.target.value)}
              placeholder="Filled after clock-in, or paste ID"
              className="form-control form-control-kh"
              style={{ fontSize: 13, fontFamily: 'ui-monospace, monospace' }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Notes (optional · clock out)</label>
            <input
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              placeholder="Short note for this check-out"
              className="form-control form-control-kh"
              style={{ fontSize: 13 }}
            />
          </div>
          <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--kh-text)', userSelect: 'none' }}>
            <input type="checkbox" checked={includeGps} onChange={(e) => setIncludeGps(e.target.checked)} style={{ width: 16, height: 16 }} />
            Include GPS on clock in / clock out
          </label>
        </div>
        {sessionError && (
          <div style={{ padding: '12px 20px', background: '#fef2f2', color: '#b91c1c', fontSize: 13, fontWeight: 600, borderTop: '1px solid #fecaca' }}>
            {sessionError}
          </div>
        )}
        {sessionSuccess && (
          <div style={{ padding: '12px 20px', background: '#ecfdf5', color: '#047857', fontSize: 13, fontWeight: 600, borderTop: '1px solid #a7f3d0' }}>
            {sessionSuccess}
          </div>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div className="kh-card" style={{ marginBottom: 16, padding: 0 }}>
        {/* Green header */}
        <div style={{ background: '#45B6FE', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div className="d-flex align-items-center gap-2">
            <FiFilter size={16} style={{ color: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Clock-in Records</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500, minWidth: 140, textAlign: 'right' }}>
            {listLoading || dailyLoading ? 'Loading records…' : `${filtered.length} records`}
          </span>
        </div>
        {listError && (
          <div style={{ padding: '10px 20px', background: '#fff7ed', color: '#9a3412', fontSize: 12.5, fontWeight: 600, borderBottom: '1px solid #fed7aa' }}>
            {listError}
          </div>
        )}
        {dailyError && (
          <div style={{ padding: '10px 20px', background: '#fef2f2', color: '#991b1b', fontSize: 12.5, fontWeight: 600, borderBottom: '1px solid #fecaca' }}>
            Daily attendance: {dailyError}
          </div>
        )}

        {/* Filters row */}
        <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, borderBottom: '1px solid #e5e7eb' }}>
          {/* Nurse */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Nurse</label>
            <select value={nurseFilter} onChange={e => { setNurseFilter(e.target.value); setPage(1); }} style={{
              padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2,
              background: '#fff', color: 'var(--kh-text)', cursor: 'pointer', minWidth: 170,
            }}>
              {nursesList.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Date</label>
            <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedMonth(''); setSelectedYear(''); setPage(1); }} style={{
              padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2,
              background: '#fff', color: 'var(--kh-text)', cursor: 'pointer', minWidth: 160,
            }} />
          </div>

          <div style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, alignSelf: 'center', paddingBottom: 4 }}>or</div>

          {/* Year */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Year</label>
            <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setSelectedDate(''); setPage(1); if (!e.target.value) setSelectedMonth(''); }} style={{
              padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2,
              background: '#fff', color: 'var(--kh-text)', cursor: 'pointer', minWidth: 100,
            }}>
              <option value="">All Years</option>
              {years.filter(Boolean).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Month */}
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Month</label>
            <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedDate(''); setPage(1); }} disabled={!selectedYear} style={{
              padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2,
              background: !selectedYear ? '#f3f4f6' : '#fff', color: 'var(--kh-text)', cursor: selectedYear ? 'pointer' : 'not-allowed', minWidth: 140,
              opacity: selectedYear ? 1 : 0.5,
            }}>
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>

          {/* Status pills */}
          <div style={{ marginLeft: 'auto' }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Status</label>
            <div className="d-flex gap-1">
              {['All', 'Verified', 'Flagged', 'Missed'].map(f => (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }} style={{
                  padding: '6px 14px', fontSize: 11.5, fontWeight: 600, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                  background: statusFilter === f ? '#45B6FE' : '#fff',
                  color: statusFilter === f ? '#fff' : 'var(--kh-text-muted)',
                  border: `1px solid ${statusFilter === f ? '#45B6FE' : '#d1d5db'}`,
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button onClick={resetFilters} style={{
              padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', gap: 5, alignSelf: 'flex-end',
            }}>
              <FiX size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table + Detail ── */}
      <div className="d-flex gap-3" style={{ minHeight: 420, alignItems: 'stretch' }}>
        <div className="kh-card" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 380 }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              color: 'var(--kh-text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <FiSearch size={32} style={{ opacity: 0.3 }} />
              </span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No records found</div>
              <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 360 }}>Adjust the filters above to view clock-in records.</div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                  <thead>
                    <tr style={{ background: '#F0F7FE' }}>
                      {['#', 'Date', 'Nurse', 'Patient', 'Clock In', 'Clock Out', 'Duration', 'GPS Dist.', 'Status'].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: '#2E7DB8', borderBottom: '2px solid #45B6FE',
                          border: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r, idx) => (
                      <tr key={r.id}
                        onClick={() => setSelected(r)}
                        style={{
                          cursor: 'pointer', transition: 'background 0.15s',
                          background: selected?.id === r.id ? '#F0F7FE' : idx % 2 === 1 ? '#fafbfc' : 'transparent',
                        }}
                        onMouseEnter={e => { if (selected?.id !== r.id) e.currentTarget.style.background = '#F0F7FE'; }}
                        onMouseLeave={e => { if (selected?.id !== r.id) e.currentTarget.style.background = idx % 2 === 1 ? '#fafbfc' : 'transparent'; }}
                      >
                        <td className="col-num" style={{ padding: '10px 12px', fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 700, border: '1px solid #e5e7eb' }}>
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>{r.date}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--kh-text)', border: '1px solid #e5e7eb' }}>{r.nurse}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--kh-text)', border: '1px solid #e5e7eb' }}>{r.patient}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: r.clockIn ? '#1565A0' : '#dc2626', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>
                          {r.clockIn ? (
                            <span className="d-flex align-items-center gap-1">
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#45B6FE', display: 'inline-block' }} />
                              {r.clockIn}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: r.clockOut ? '#1e40af' : '#dc2626', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>
                          {r.clockOut || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>
                          {calcDuration(r.clockIn, r.clockOut)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)', border: '1px solid #e5e7eb' }}>
                          {r.distance || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, textTransform: 'capitalize',
                            ...(r.status === 'verified' ? { background: '#F0F7FE', color: '#1565A0', border: '1px solid #BAE0FD' }
                              : r.status === 'flagged' ? { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }
                              : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }),
                          }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '2px solid #D6ECFC', background: '#fafbfc' }}>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                  Showing <span style={{ fontWeight: 700, color: '#45B6FE' }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</span> of {filtered.length}
                </span>
                <div className="d-flex gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} style={{
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex',
                  }}><FiChevronsLeft size={14} /></button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex',
                  }}><FiChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const els = [];
                      if (idx > 0 && p - arr[idx - 1] > 1) els.push(<span key={`e-${p}`} style={{ padding: '5px 4px', fontSize: 12, color: '#9ca3af' }}>…</span>);
                      els.push(
                        <button key={p} onClick={() => setPage(p)} style={{
                          background: page === p ? '#45B6FE' : '#fff', color: page === p ? '#fff' : 'var(--kh-text-muted)',
                          border: `1px solid ${page === p ? '#45B6FE' : '#e5e7eb'}`, borderRadius: 2,
                          padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minWidth: 32,
                        }}>{p}</button>
                      );
                      return els;
                    })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex',
                  }}><FiChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex',
                  }}><FiChevronsRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="kh-card" style={{ width: 340, flexShrink: 0 }}>
            <div style={{ padding: '16px 20px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Visit Details</h6>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 7px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiX size={14} /></button>
              </div>

              <div className="d-flex flex-column gap-3">
                {[
                  { label: 'Record ID', value: selected.id },
                  { label: 'Nurse', value: selected.nurse },
                  { label: 'Patient', value: selected.patient },
                  { label: 'Region', value: selected.region },
                  { label: 'Date', value: selected.date },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--kh-text)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #f3f4f6', margin: '16px 0', paddingTop: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 10 }}>
                  <FiClock size={11} style={{ marginRight: 4 }} />Timeline
                </div>
                <div className="d-flex gap-3">
                  <div style={{ padding: '10px 16px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #BAE0FD', flex: 1 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Clock In</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1565A0' }}>{selected.clockIn || '—'}</div>
                  </div>
                  <div style={{ padding: '10px 16px', borderRadius: 2, background: '#eff6ff', border: '1px solid #bfdbfe', flex: 1 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Clock Out</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e40af' }}>{selected.clockOut || '—'}</div>
                  </div>
                </div>
                <div style={{ padding: '10px 16px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Duration</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--kh-text)' }}>{calcDuration(selected.clockIn, selected.clockOut)}</span>
                </div>
              </div>

              {selected.gps && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 10 }}>
                    <FiMapPin size={11} style={{ marginRight: 4 }} />GPS Verification
                  </div>
                  <div style={{ padding: 12, borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 4 }}>Coordinates: {selected.gps.lat.toFixed(4)}, {selected.gps.lng.toFixed(4)}</div>
                    <div style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>Distance: <strong style={{ color: selected.distance && parseInt(selected.distance) > 100 ? '#dc2626' : '#45B6FE' }}>{selected.distance}</strong> from patient</div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div className="d-flex align-items-center gap-2">
                  {statusIcon[selected.status]}
                  <span style={{
                    fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                    color: selected.status === 'verified' ? '#1565A0' : selected.status === 'flagged' ? '#ea580c' : '#dc2626',
                  }}>{selected.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
