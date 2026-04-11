import { useState } from 'react';
import {
  FiPlus, FiCalendar, FiClock, FiMapPin, FiUser, FiRepeat,
  FiChevronLeft, FiChevronRight, FiFilter, FiX, FiCheck, FiRefreshCw,
  FiArrowRight, FiAlertCircle, FiEdit2, FiTrash2
} from 'react-icons/fi';

/* ── Nurses ── */
const NURSES = [
  { id: 'N-101', name: 'Ama Darko', region: 'Accra', shift: 'Morning', avatar: 'AD', status: 'available', phone: '+233 24 111 2233' },
  { id: 'N-102', name: 'Kwesi Mensah', region: 'Accra', shift: 'Afternoon', avatar: 'KM', status: 'available', phone: '+233 20 222 3344' },
  { id: 'N-103', name: 'Efua Nyarko', region: 'Kumasi', shift: 'Morning', avatar: 'EN', status: 'on-leave', phone: '+233 27 333 4455' },
  { id: 'N-104', name: 'Yaw Asante', region: 'Kumasi', shift: 'Night', avatar: 'YA', status: 'available', phone: '+233 24 444 5566' },
  { id: 'N-105', name: 'Akosua Boateng', region: 'Tamale', shift: 'Morning', avatar: 'AB', status: 'available', phone: '+233 20 555 6677' },
  { id: 'N-106', name: 'Kofi Owusu', region: 'Takoradi', shift: 'Afternoon', avatar: 'KO', status: 'available', phone: '+233 27 666 7788' },
  { id: 'N-107', name: 'Adwoa Poku', region: 'Accra', shift: 'Night', avatar: 'AP', status: 'available', phone: '+233 24 777 8899' },
  { id: 'N-108', name: 'Nana Afia', region: 'Kumasi', shift: 'Morning', avatar: 'NA', status: 'available', phone: '+233 20 888 9900' },
];

/* ── Patients ── */
const PATIENTS = [
  { id: 'P-001', name: 'Kwame Boateng', region: 'Accra', address: '14 Osu Badu St, Accra' },
  { id: 'P-002', name: 'Abena Osei', region: 'Kumasi', address: '7 Adum Road, Kumasi' },
  { id: 'P-003', name: 'Kofi Ankrah', region: 'Tamale', address: '22 Dagomba Line, Tamale' },
  { id: 'P-004', name: 'Akosua Mensah', region: 'Accra', address: '3 Cantonments Rd, Accra' },
  { id: 'P-005', name: 'Yaw Frimpong', region: 'Takoradi', address: '18 Market Circle, Takoradi' },
  { id: 'P-006', name: 'Esi Appiah', region: 'Accra', address: '9 Spintex Rd, Accra' },
];

const SHIFTS = ['Morning', 'Afternoon', 'Night'];
const ROTATION_TYPES = ['Weekly', 'Bi-weekly', 'Monthly'];
const REGIONS = ['All', 'Accra', 'Kumasi', 'Tamale', 'Takoradi'];

/* ── Initial schedule assignments ── */
const initialAssignments = [
  { id: 1, nurseId: 'N-101', patientId: 'P-001', date: '2026-03-24', shift: 'Morning', rotation: 'Weekly', notes: 'Routine vitals & medication check' },
  { id: 2, nurseId: 'N-102', patientId: 'P-004', date: '2026-03-24', shift: 'Afternoon', rotation: 'Weekly', notes: 'Wound dressing change' },
  { id: 3, nurseId: 'N-104', patientId: 'P-002', date: '2026-03-24', shift: 'Night', rotation: 'Bi-weekly', notes: 'Overnight monitoring' },
  { id: 4, nurseId: 'N-105', patientId: 'P-003', date: '2026-03-25', shift: 'Morning', rotation: 'Monthly', notes: 'Comprehensive assessment' },
  { id: 5, nurseId: 'N-106', patientId: 'P-005', date: '2026-03-25', shift: 'Afternoon', rotation: 'Weekly', notes: 'Physiotherapy session' },
  { id: 6, nurseId: 'N-107', patientId: 'P-006', date: '2026-03-26', shift: 'Night', rotation: 'Bi-weekly', notes: 'Post-surgery follow-up' },
  { id: 7, nurseId: 'N-108', patientId: 'P-002', date: '2026-03-26', shift: 'Morning', rotation: 'Weekly', notes: 'Daily care routine' },
  { id: 8, nurseId: 'N-101', patientId: 'P-006', date: '2026-03-27', shift: 'Morning', rotation: 'Weekly', notes: 'Vitals monitoring' },
  { id: 9, nurseId: 'N-102', patientId: 'P-001', date: '2026-03-28', shift: 'Afternoon', rotation: 'Bi-weekly', notes: 'Medication review' },
  { id: 10, nurseId: 'N-105', patientId: 'P-003', date: '2026-03-28', shift: 'Morning', rotation: 'Monthly', notes: 'Comprehensive assessment' },
];

/* ── Helpers ── */
const getWeekDates = (baseDate) => {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const nd = new Date(monday);
    nd.setDate(monday.getDate() + i);
    dates.push(nd);
  }
  return dates;
};

const fmtDate = (d) => d.toISOString().slice(0, 10);
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const shiftColor = (s) => {
  if (s === 'Morning') return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
  if (s === 'Afternoon') return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
  return { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };
};

const rotationBadge = (r) => {
  if (r === 'Weekly') return { bg: '#F0F7FE', color: '#1565A0' };
  if (r === 'Bi-weekly') return { bg: '#fef3c7', color: '#92400e' };
  return { bg: '#fce7f3', color: '#9d174d' };
};

export default function NurseScheduling() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterShift, setFilterShift] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ nurseId: '', patientId: '', date: '', shift: 'Morning', rotation: 'Weekly', notes: '' });

  const today = new Date();
  const baseDate = new Date(today);
  baseDate.setDate(today.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);

  const filtered = assignments.filter(a => {
    const nurse = NURSES.find(n => n.id === a.nurseId);
    if (filterRegion !== 'All' && nurse?.region !== filterRegion) return false;
    if (filterShift !== 'All' && a.shift !== filterShift) return false;
    return true;
  });

  const getForDate = (dateStr) => filtered.filter(a => a.date === dateStr);

  /* ── Modal helpers ── */
  const openAdd = () => {
    setEditTarget(null);
    setForm({ nurseId: '', patientId: '', date: fmtDate(today), shift: 'Morning', rotation: 'Weekly', notes: '' });
    setShowModal(true);
  };
  const openEdit = (a) => {
    setEditTarget(a);
    setForm({ nurseId: a.nurseId, patientId: a.patientId, date: a.date, shift: a.shift, rotation: a.rotation, notes: a.notes });
    setShowModal(true);
  };
  const handleSave = () => {
    if (!form.nurseId || !form.patientId || !form.date) return;
    if (editTarget) {
      setAssignments(prev => prev.map(a => a.id === editTarget.id ? { ...a, ...form } : a));
    } else {
      setAssignments(prev => [...prev, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
    setEditTarget(null);
  };
  const handleDelete = () => {
    if (!deleteTarget) return;
    setAssignments(prev => prev.filter(a => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  /* ── Auto-rotate: generate next cycle suggestions ── */
  const handleAutoRotate = () => {
    const nextWeekStart = new Date(weekDates[6]);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    const currentWeekAssignments = assignments.filter(a => {
      const d = new Date(a.date);
      return d >= weekDates[0] && d <= weekDates[6];
    });
    if (currentWeekAssignments.length === 0) return;

    const available = NURSES.filter(n => n.status === 'available');
    const newAssignments = currentWeekAssignments.map((a, idx) => {
      const nurseIdx = available.findIndex(n => n.id === a.nurseId);
      const nextNurse = available[(nurseIdx + 1) % available.length];
      const newDate = new Date(nextWeekStart);
      newDate.setDate(nextWeekStart.getDate() + (new Date(a.date).getDay() - 1 + 7) % 7);
      return {
        id: Date.now() + idx,
        nurseId: nextNurse.id,
        patientId: a.patientId,
        date: fmtDate(newDate),
        shift: a.shift,
        rotation: a.rotation,
        notes: a.notes + ' (rotated)',
      };
    });
    setAssignments(prev => [...prev, ...newAssignments]);
    setWeekOffset(o => o + 1);
  };

  /* ── Stats ── */
  const thisWeekAssignments = filtered.filter(a => {
    const d = new Date(a.date);
    return d >= weekDates[0] && d <= weekDates[6];
  });
  const uniqueNurses = new Set(thisWeekAssignments.map(a => a.nurseId)).size;
  const uniquePatients = new Set(thisWeekAssignments.map(a => a.patientId)).size;

  const statCards = [
    { label: 'This Week', value: thisWeekAssignments.length, sub: 'Assignments', color: '#45B6FE' },
    { label: 'Active Nurses', value: uniqueNurses, sub: 'On rotation', color: '#2E7DB8' },
    { label: 'Patients Covered', value: uniquePatients, sub: 'This week', color: '#1d4ed8' },
    { label: 'On Leave', value: NURSES.filter(n => n.status === 'on-leave').length, sub: 'Nurses', color: '#dc2626' },
  ];

  const weekLabel = `${weekDates[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — ${weekDates[6].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <div className="page-wrapper">
      {/* ── Controls ── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Week nav */}
          <div className="d-flex align-items-center gap-1" style={{ background: '#fff', border: '1px solid var(--kh-border)', borderRadius: 2, padding: '2px' }}>
            <button onClick={() => setWeekOffset(o => o - 1)} style={{ background: 'none', border: 'none', padding: '6px 8px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}>
              <FiChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)', padding: '0 8px', whiteSpace: 'nowrap' }}>
              <FiCalendar size={12} style={{ marginRight: 5, verticalAlign: -1 }} />{weekLabel}
            </span>
            <button onClick={() => setWeekOffset(o => o + 1)} style={{ background: 'none', border: 'none', padding: '6px 8px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}>
              <FiChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => setWeekOffset(0)} style={{
            background: '#fff', border: '1px solid var(--kh-border)', borderRadius: 2, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--kh-text-muted)',
          }}>Today</button>

          {/* Region filter */}
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: '1px solid var(--kh-border)', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer' }}>
            {REGIONS.map(r => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
          </select>

          {/* Shift filter */}
          <select value={filterShift} onChange={e => setFilterShift(e.target.value)}
            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: '1px solid var(--kh-border)', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer' }}>
            <option value="All">All Shifts</option>
            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--kh-border)', borderRadius: 2, overflow: 'hidden' }}>
            {['calendar', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: view === v ? '#45B6FE' : '#fff', color: view === v ? '#fff' : 'var(--kh-text-muted)',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>{v}</button>
            ))}
          </div>
        </div>

        <div className="d-flex gap-2">
          <button onClick={handleAutoRotate} className="btn btn-kh-outline d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
            <FiRefreshCw size={14} /> Auto-Rotate
          </button>
          <button onClick={openAdd} className="btn btn-kh-primary d-flex align-items-center gap-2">
            <FiPlus size={15} /> Assign Nurse
          </button>
        </div>
      </div>

      {/* ── Calendar View ── */}
      {view === 'calendar' && (
        <div className="kh-card mb-4" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', minWidth: 900 }}>
              {/* Day headers */}
              {weekDates.map((d, i) => {
                const isToday = fmtDate(d) === fmtDate(today);
                const dayCount = getForDate(fmtDate(d)).length;
                return (
                  <div key={i} style={{
                    padding: '16px 12px 14px', textAlign: 'center',
                    borderBottom: `2px solid ${isToday ? '#45B6FE' : 'var(--kh-border-light)'}`,
                    borderRight: i < 6 ? '1px solid var(--kh-border-light)' : 'none',
                    background: isToday ? '#F0F7FE' : '#fff',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#45B6FE' : 'var(--kh-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{dayNames[i]}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isToday ? '#45B6FE' : 'var(--kh-text)', marginTop: 4, lineHeight: 1 }}>{d.getDate()}</div>
                    {dayCount > 0 && (
                      <div style={{
                        display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700,
                        padding: '1px 8px', borderRadius: 10,
                        background: isToday ? '#45B6FE' : 'var(--kh-border-light)',
                        color: isToday ? '#fff' : 'var(--kh-text-muted)',
                      }}>{dayCount} visit{dayCount !== 1 ? 's' : ''}</div>
                    )}
                  </div>
                );
              })}
              {/* Day cells */}
              {weekDates.map((d, i) => {
                const dayAssignments = getForDate(fmtDate(d));
                const isToday = fmtDate(d) === fmtDate(today);
                return (
                  <div key={`cell-${i}`} style={{
                    padding: '10px 8px', minHeight: 220,
                    borderRight: i < 6 ? '1px solid var(--kh-border-light)' : 'none',
                    background: isToday ? '#fafffe' : '#fff',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {dayAssignments.length === 0 && (
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: 6,
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--kh-off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiCalendar size={14} style={{ color: '#d1d5db' }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#d1d5db', fontWeight: 500 }}>No assignments</div>
                      </div>
                    )}
                    {dayAssignments.map(a => {
                      const nurse = NURSES.find(n => n.id === a.nurseId);
                      const patient = PATIENTS.find(p => p.id === a.patientId);
                      const sc = shiftColor(a.shift);
                      const rb = rotationBadge(a.rotation);
                      return (
                        <div key={a.id} style={{
                          padding: '10px 12px', borderRadius: 2,
                          background: sc.bg, borderLeft: `3px solid ${sc.text}`,
                          cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.1s',
                        }}
                          onClick={() => openEdit(a)}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                        >
                          {/* Nurse */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: sc.text, color: '#fff', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}><FiUser size={12} /></div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: sc.text, lineHeight: 1.2 }}>{nurse?.name}</span>
                          </div>
                          {/* Patient */}
                          <div style={{ fontSize: 11, color: 'var(--kh-text-secondary)', marginBottom: 6, paddingLeft: 31 }}>
                            <FiArrowRight size={9} style={{ marginRight: 4, opacity: 0.6 }} />{patient?.name}
                          </div>
                          {/* Badges */}
                          <div style={{ display: 'flex', gap: 4, paddingLeft: 31 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 2, background: 'rgba(0,0,0,0.05)', color: sc.text }}>{a.shift}</span>
                            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 2, background: rb.bg, color: rb.color }}>{a.rotation}</span>
                          </div>
                          {/* Notes preview */}
                          {a.notes && (
                            <div style={{ fontSize: 10, color: 'var(--kh-text-muted)', marginTop: 5, paddingLeft: 31, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shift legend */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--kh-border-light)',
            display: 'flex', alignItems: 'center', gap: 20, background: 'var(--kh-off-white)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--kh-text-muted)' }}>Shifts:</span>
            {SHIFTS.map(s => {
              const sc = shiftColor(s);
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: sc.text }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--kh-text-muted)' }}>{s}</span>
                </div>
              );
            })}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
              {thisWeekAssignments.length} assignment{thisWeekAssignments.length !== 1 ? 's' : ''} this week
            </span>
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {view === 'list' && (
        <div className="kh-card mb-4">
          <div className="card-header-custom">
            <h6>Assignment List</h6>
            <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{filtered.length} total</span>
          </div>
          <div className="table-responsive">
            <table className="table kh-table">
              <thead>
                <tr>
                  <th>Nurse</th><th>Patient</th><th>Date</th><th>Shift</th><th>Rotation</th><th>Region</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .filter(a => {
                    const d = new Date(a.date);
                    return d >= weekDates[0] && d <= weekDates[6];
                  })
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(a => {
                    const nurse = NURSES.find(n => n.id === a.nurseId);
                    const patient = PATIENTS.find(p => p.id === a.patientId);
                    const sc = shiftColor(a.shift);
                    const rb = rotationBadge(a.rotation);
                    return (
                      <tr key={a.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar sm" style={{ background: '#45B6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser size={14} style={{ color: '#fff' }} /></div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--kh-text)' }}>{nurse?.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{nurse?.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{patient?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}><FiMapPin size={9} /> {patient?.address}</div>
                        </td>
                        <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                          <FiCalendar size={10} style={{ marginRight: 4, color: 'var(--kh-text-muted)' }} />
                          {new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 2,
                            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                          }}>{a.shift}</span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 2,
                            background: rb.bg, color: rb.color,
                          }}>{a.rotation}</span>
                        </td>
                        <td style={{ fontSize: 13 }}>{nurse?.region}</td>
                        <td style={{ fontSize: 12, color: 'var(--kh-text-muted)', maxWidth: 160 }}>
                          {a.notes || '—'}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button onClick={() => openEdit(a)} style={{
                              background: '#F0F7FE', border: '1px solid #BAE0FD', borderRadius: 2,
                              padding: '4px 8px', cursor: 'pointer', display: 'flex', color: '#45B6FE',
                            }}><FiEdit2 size={12} /></button>
                            <button onClick={() => setDeleteTarget(a)} style={{
                              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2,
                              padding: '4px 8px', cursor: 'pointer', display: 'flex', color: '#dc2626',
                            }}><FiTrash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Assign/Edit Modal ── */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', zIndex: 1060 }} onClick={() => { setShowModal(false); setEditTarget(null); }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: 2, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--kh-border-light)', padding: '20px 24px' }}>
                <h6 className="modal-title" style={{ fontWeight: 700, fontSize: 16 }}>
                  {editTarget ? 'Edit Assignment' : 'Assign Nurse to Patient'}
                </h6>
                <button className="btn-close" onClick={() => { setShowModal(false); setEditTarget(null); }} />
              </div>
              <div className="modal-body" style={{ padding: 24 }}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Nurse</label>
                    <select className="form-select form-control-kh" value={form.nurseId}
                      onChange={e => setForm(f => ({ ...f, nurseId: e.target.value }))}>
                      <option value="">Select nurse...</option>
                      {NURSES.filter(n => n.status === 'available').map(n => (
                        <option key={n.id} value={n.id}>{n.name} — {n.region} ({n.shift})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Patient</label>
                    <select className="form-select form-control-kh" value={form.patientId}
                      onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
                      <option value="">Select patient...</option>
                      {PATIENTS.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {p.region}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Date</label>
                    <input type="date" className="form-control form-control-kh" value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="col-4">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Shift</label>
                    <select className="form-select form-control-kh" value={form.shift}
                      onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
                      {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Rotation</label>
                    <select className="form-select form-control-kh" value={form.rotation}
                      onChange={e => setForm(f => ({ ...f, rotation: e.target.value }))}>
                      {ROTATION_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Notes</label>
                    <textarea className="form-control form-control-kh" rows={2} placeholder="Optional care notes..."
                      value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--kh-border-light)', padding: '16px 24px' }}>
                <button className="btn btn-kh-outline" onClick={() => { setShowModal(false); setEditTarget(null); }}>Cancel</button>
                <button className="btn btn-kh-primary d-flex align-items-center gap-2" onClick={handleSave}>
                  <FiCheck size={14} /> {editTarget ? 'Update' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', zIndex: 1060 }} onClick={() => setDeleteTarget(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: 2, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
              <div className="modal-body" style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FiTrash2 size={24} style={{ color: '#dc2626' }} />
                </div>
                <h6 style={{ fontWeight: 700, fontSize: 16, color: 'var(--kh-text)', marginBottom: 8 }}>Remove Assignment</h6>
                <p style={{ fontSize: 13, color: 'var(--kh-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                  Remove <strong>{NURSES.find(n => n.id === deleteTarget.nurseId)?.name}</strong>'s assignment to <strong>{PATIENTS.find(p => p.id === deleteTarget.patientId)?.name}</strong>?
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button onClick={() => setDeleteTarget(null)} style={{
                    padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: '#fff', color: 'var(--kh-text)', border: '1px solid #d1d5db',
                  }}>Keep</button>
                  <button onClick={handleDelete} style={{
                    padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: '#dc2626', color: '#fff', border: '1px solid #dc2626',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FiTrash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
