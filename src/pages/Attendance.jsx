import { useState, useMemo } from 'react';
import { FiCheckCircle, FiAlertCircle, FiXCircle, FiMapPin, FiClock, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter } from '../icons/hugeicons-feather';

/* ── All Clock-in Records ── */
const records = [
  /* ── March 2026 ── */
  { id: 'A-301', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2026-03-24', clockIn: '08:55', clockOut: '09:42', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-302', nurse: 'Efua Mensah', patient: 'Akosua Mensah', date: '2026-03-24', clockIn: '10:30', clockOut: '11:15', gps: { lat: 5.6145, lng: -0.1790 }, distance: '5m', status: 'verified', region: 'Accra' },
  { id: 'A-303', nurse: 'Yaa Asantewaa', patient: 'Abena Osei', date: '2026-03-24', clockIn: '10:28', clockOut: '11:30', gps: { lat: 6.6884, lng: -1.6244 }, distance: '8m', status: 'verified', region: 'Kumasi' },
  { id: 'A-304', nurse: 'Ama Darko', patient: 'Kofi Ankrah', date: '2026-03-24', clockIn: '10:58', clockOut: '11:40', gps: { lat: 9.4034, lng: -0.8393 }, distance: '15m', status: 'verified', region: 'Tamale' },
  { id: 'A-305', nurse: 'Abena Fosu', patient: 'Samuel Asante', date: '2026-03-24', clockIn: '14:58', clockOut: '15:50', gps: { lat: 5.1036, lng: -1.2437 }, distance: '22m', status: 'verified', region: 'Cape Coast' },
  { id: 'A-306', nurse: 'Akua Owusu', patient: 'Grace Ampofo', date: '2026-03-24', clockIn: '09:00', clockOut: '10:00', gps: { lat: 5.6350, lng: -0.1675 }, distance: '10m', status: 'verified', region: 'Accra' },
  { id: 'A-307', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2026-03-23', clockIn: '09:00', clockOut: '09:50', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-308', nurse: 'Efua Mensah', patient: 'Akosua Mensah', date: '2026-03-23', clockIn: '11:00', clockOut: '11:45', gps: { lat: 5.6145, lng: -0.1790 }, distance: '5m', status: 'verified', region: 'Accra' },
  { id: 'A-309', nurse: 'Yaa Asantewaa', patient: 'Abena Osei', date: '2026-03-23', clockIn: '10:15', clockOut: '11:20', gps: { lat: 6.6884, lng: -1.6244 }, distance: '8m', status: 'verified', region: 'Kumasi' },
  { id: 'A-310', nurse: 'Ama Darko', patient: 'Kofi Ankrah', date: '2026-03-23', clockIn: '11:00', clockOut: '11:45', gps: { lat: 9.4034, lng: -0.8393 }, distance: '145m', status: 'flagged', region: 'Tamale' },
  { id: 'A-311', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2026-03-22', clockIn: '08:45', clockOut: '09:30', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-312', nurse: 'Yaa Asantewaa', patient: 'Kwadwo Appiah', date: '2026-03-22', clockIn: '12:30', clockOut: '13:20', gps: { lat: 6.6900, lng: -1.6250 }, distance: '180m', status: 'flagged', region: 'Kumasi' },
  { id: 'A-313', nurse: 'Adwoa Badu', patient: 'Yaw Frimpong', date: '2026-03-22', clockIn: null, clockOut: null, gps: null, distance: null, status: 'missed', region: 'Takoradi' },
  { id: 'A-314', nurse: 'Abena Fosu', patient: 'Samuel Asante', date: '2026-03-22', clockIn: '14:30', clockOut: '15:30', gps: { lat: 5.1036, lng: -1.2437 }, distance: '22m', status: 'verified', region: 'Cape Coast' },
  { id: 'A-315', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2026-03-21', clockIn: '09:05', clockOut: '09:48', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-316', nurse: 'Yaa Asantewaa', patient: 'Abena Osei', date: '2026-03-21', clockIn: '10:00', clockOut: '11:05', gps: { lat: 6.6884, lng: -1.6244 }, distance: '8m', status: 'verified', region: 'Kumasi' },
  { id: 'A-317', nurse: 'Akua Owusu', patient: 'Grace Ampofo', date: '2026-03-21', clockIn: null, clockOut: null, gps: null, distance: null, status: 'missed', region: 'Accra' },
  { id: 'A-318', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2026-03-20', clockIn: null, clockOut: null, gps: null, distance: null, status: 'missed', region: 'Accra' },
  { id: 'A-319', nurse: 'Ama Darko', patient: 'Kofi Ankrah', date: '2026-03-20', clockIn: '10:30', clockOut: '11:15', gps: { lat: 9.4034, lng: -0.8393 }, distance: '15m', status: 'verified', region: 'Tamale' },
  { id: 'A-320', nurse: 'Abena Fosu', patient: 'Samuel Asante', date: '2026-03-20', clockIn: '15:10', clockOut: '15:55', gps: { lat: 5.1036, lng: -1.2437 }, distance: '22m', status: 'verified', region: 'Cape Coast' },
  /* ── February 2026 ── */
  { id: 'A-250', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2026-02-28', clockIn: '09:10', clockOut: '09:55', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-251', nurse: 'Yaa Asantewaa', patient: 'Abena Osei', date: '2026-02-27', clockIn: '10:20', clockOut: '11:15', gps: { lat: 6.6884, lng: -1.6244 }, distance: '8m', status: 'verified', region: 'Kumasi' },
  { id: 'A-252', nurse: 'Ama Darko', patient: 'Kofi Ankrah', date: '2026-02-26', clockIn: '11:05', clockOut: '11:50', gps: { lat: 9.4034, lng: -0.8393 }, distance: '200m', status: 'flagged', region: 'Tamale' },
  { id: 'A-253', nurse: 'Efua Mensah', patient: 'Akosua Mensah', date: '2026-02-25', clockIn: '10:30', clockOut: '11:20', gps: { lat: 5.6145, lng: -0.1790 }, distance: '5m', status: 'verified', region: 'Accra' },
  { id: 'A-254', nurse: 'Adwoa Badu', patient: 'Yaw Frimpong', date: '2026-02-20', clockIn: '09:15', clockOut: '10:10', gps: { lat: 4.8965, lng: -1.7500 }, distance: '18m', status: 'verified', region: 'Takoradi' },
  { id: 'A-255', nurse: 'Akua Owusu', patient: 'Grace Ampofo', date: '2026-02-18', clockIn: '08:50', clockOut: '09:50', gps: { lat: 5.6350, lng: -0.1675 }, distance: '10m', status: 'verified', region: 'Accra' },
  { id: 'A-256', nurse: 'Abena Fosu', patient: 'Samuel Asante', date: '2026-02-15', clockIn: '14:50', clockOut: '15:35', gps: { lat: 5.1036, lng: -1.2437 }, distance: '22m', status: 'verified', region: 'Cape Coast' },
  { id: 'A-257', nurse: 'Yaa Asantewaa', patient: 'Kwadwo Appiah', date: '2026-02-12', clockIn: null, clockOut: null, gps: null, distance: null, status: 'missed', region: 'Kumasi' },
  /* ── January 2026 ── */
  { id: 'A-200', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2026-01-28', clockIn: '08:50', clockOut: '09:40', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-201', nurse: 'Yaa Asantewaa', patient: 'Abena Osei', date: '2026-01-25', clockIn: '10:30', clockOut: '11:25', gps: { lat: 6.6884, lng: -1.6244 }, distance: '8m', status: 'verified', region: 'Kumasi' },
  { id: 'A-202', nurse: 'Ama Darko', patient: 'Kofi Ankrah', date: '2026-01-22', clockIn: '10:45', clockOut: '11:30', gps: { lat: 9.4034, lng: -0.8393 }, distance: '15m', status: 'verified', region: 'Tamale' },
  { id: 'A-203', nurse: 'Efua Mensah', patient: 'Akosua Mensah', date: '2026-01-18', clockIn: '11:00', clockOut: '11:50', gps: { lat: 5.6145, lng: -0.1790 }, distance: '5m', status: 'verified', region: 'Accra' },
  { id: 'A-204', nurse: 'Adwoa Badu', patient: 'Yaw Frimpong', date: '2026-01-15', clockIn: '09:30', clockOut: '10:20', gps: { lat: 4.8965, lng: -1.7500 }, distance: '18m', status: 'verified', region: 'Takoradi' },
  /* ── December 2025 ── */
  { id: 'A-150', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2025-12-20', clockIn: '09:00', clockOut: '09:45', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-151', nurse: 'Yaa Asantewaa', patient: 'Abena Osei', date: '2025-12-18', clockIn: '10:15', clockOut: '11:10', gps: { lat: 6.6884, lng: -1.6244 }, distance: '8m', status: 'verified', region: 'Kumasi' },
  { id: 'A-152', nurse: 'Ama Darko', patient: 'Kofi Ankrah', date: '2025-12-15', clockIn: '11:00', clockOut: '11:40', gps: { lat: 9.4034, lng: -0.8393 }, distance: '160m', status: 'flagged', region: 'Tamale' },
  { id: 'A-153', nurse: 'Abena Fosu', patient: 'Samuel Asante', date: '2025-12-12', clockIn: '14:40', clockOut: '15:30', gps: { lat: 5.1036, lng: -1.2437 }, distance: '22m', status: 'verified', region: 'Cape Coast' },
  { id: 'A-154', nurse: 'Adwoa Badu', patient: 'Yaw Frimpong', date: '2025-12-10', clockIn: null, clockOut: null, gps: null, distance: null, status: 'missed', region: 'Takoradi' },
  /* ── November 2025 ── */
  { id: 'A-100', nurse: 'Efua Mensah', patient: 'Kwame Boateng', date: '2025-11-28', clockIn: '08:55', clockOut: '09:40', gps: { lat: 5.6037, lng: -0.1870 }, distance: '12m', status: 'verified', region: 'Accra' },
  { id: 'A-101', nurse: 'Yaa Asantewaa', patient: 'Abena Osei', date: '2025-11-25', clockIn: '10:00', clockOut: '11:00', gps: { lat: 6.6884, lng: -1.6244 }, distance: '8m', status: 'verified', region: 'Kumasi' },
  { id: 'A-102', nurse: 'Akua Owusu', patient: 'Grace Ampofo', date: '2025-11-20', clockIn: '09:10', clockOut: '10:05', gps: { lat: 5.6350, lng: -0.1675 }, distance: '10m', status: 'verified', region: 'Accra' },
];

const nursesList = ['All Nurses', 'Efua Mensah', 'Yaa Asantewaa', 'Ama Darko', 'Adwoa Badu', 'Akua Owusu', 'Abena Fosu'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [nurseFilter, setNurseFilter] = useState('All Nurses');
  const [selectedDate, setSelectedDate] = useState('');        // specific date YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState('');       // 0-11
  const [selectedYear, setSelectedYear] = useState('');         // e.g. 2026
  const [page, setPage] = useState(1);
  const perPage = 10;

  /* Derive available years */
  const years = useMemo(() => {
    const ySet = new Set(records.map(r => r.date.slice(0, 4)));
    return ['', ...Array.from(ySet).sort().reverse()];
  }, []);

  /* Filter records */
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter.toLowerCase()) return false;
      if (nurseFilter !== 'All Nurses' && r.nurse !== nurseFilter) return false;
      if (selectedDate && r.date !== selectedDate) return false;
      if (selectedYear && !selectedDate) {
        if (r.date.slice(0, 4) !== selectedYear) return false;
        if (selectedMonth !== '' && r.date.slice(5, 7) !== String(Number(selectedMonth) + 1).padStart(2, '0')) return false;
      }
      return true;
    });
  }, [statusFilter, nurseFilter, selectedDate, selectedMonth, selectedYear]);

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

      {/* ── Filter Bar ── */}
      <div className="kh-card" style={{ marginBottom: 16, padding: 0 }}>
        {/* Green header */}
        <div style={{ background: '#45B6FE', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="d-flex align-items-center gap-2">
            <FiFilter size={16} style={{ color: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Clock-in Records</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{filtered.length} records</span>
        </div>

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
      <div className="d-flex gap-3" style={{ minHeight: 400 }}>
        <div className="kh-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--kh-text-muted)' }}>
              <FiSearch size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No records found</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Adjust the filters above to view clock-in records.</div>
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
