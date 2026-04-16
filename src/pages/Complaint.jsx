import { useState, useMemo } from 'react';
import {
  FiAlertCircle, FiCheckCircle, FiClock, FiX, FiSearch,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiUser, FiMapPin, FiPhone, FiFileText, FiSend, FiMessageSquare,
  FiCalendar, FiFlag, FiEye
} from '../icons/hugeicons-feather';

/* ── Complaints Data ── */
const initialComplaints = [
  {
    id: 'CMP-001', date: '2026-03-24', patient: 'Kwame Boateng', patientId: 'P-1001',
    region: 'Accra', phone: '+233 24 555 0101', nurse: 'Efua Mensah',
    category: 'Service Quality', priority: 'high',
    subject: 'Late arrival for scheduled morning visit',
    description: 'Patient reports that the assigned nurse arrived 45 minutes late for the scheduled 8:00 AM visit. Morning medications were delayed as a result. Family caregiver had to leave for work before the nurse arrived.',
    status: 'open',
    responses: [],
  },
  {
    id: 'CMP-002', date: '2026-03-23', patient: 'Abena Osei', patientId: 'P-1002',
    region: 'Kumasi', phone: '+233 24 555 0202', nurse: 'Yaa Asantewaa',
    category: 'Communication', priority: 'medium',
    subject: 'Lack of follow-up after wound dressing change',
    description: 'Patient\'s daughter reports that no follow-up call was made after the wound dressing was changed. They were told to expect a call within 2 hours to check on the wound status but never received one.',
    status: 'in-progress',
    responses: [
      { by: 'Supervisor Ama', date: '2026-03-23', note: 'Contacted nurse Yaa Asantewaa. She confirmed the oversight. Follow-up protocol has been reinforced.' },
    ],
  },
  {
    id: 'CMP-003', date: '2026-03-22', patient: 'Kofi Ankrah', patientId: 'P-1003',
    region: 'Tamale', phone: '+233 24 555 0303', nurse: 'Ama Darko',
    category: 'Billing', priority: 'low',
    subject: 'Incorrect charge on monthly invoice',
    description: 'Patient was charged for 5 home visits in February but records show only 4 visits were completed. Requesting correction on the next invoice cycle.',
    status: 'resolved',
    responses: [
      { by: 'Billing Dept', date: '2026-03-22', note: 'Verified visit logs — confirmed only 4 visits. Credit of GHS 150 applied to next invoice.' },
      { by: 'Admin', date: '2026-03-22', note: 'Patient notified of the correction. Case closed.' },
    ],
    resolution: { resolvedBy: 'Admin', resolvedDate: '2026-03-22', action: 'Invoice corrected. GHS 150 credit applied. Patient confirmed satisfaction.' },
  },
  {
    id: 'CMP-004', date: '2026-03-23', patient: 'Esi Quartey', patientId: 'P-1005',
    region: 'Accra', phone: '+233 24 555 0505', nurse: 'Efua Mensah',
    category: 'Staff Conduct', priority: 'critical',
    subject: 'Rude behaviour during patient transfer',
    description: 'Family member reports that the nurse spoke harshly to the patient during a bed-to-chair transfer. The patient felt embarrassed and upset. Family is requesting a different nurse be assigned.',
    status: 'open',
    responses: [],
  },
  {
    id: 'CMP-005', date: '2026-03-21', patient: 'Nana Agyemang', patientId: 'P-1008',
    region: 'Cape Coast', phone: '+233 24 555 0808', nurse: 'Unassigned',
    category: 'Missed Visit', priority: 'high',
    subject: 'No nurse showed up for scheduled visit',
    description: 'Patient waited all morning for a scheduled visit but no nurse arrived. The system shows the visit was scheduled but no nurse was assigned after the original nurse called in sick.',
    status: 'in-progress',
    responses: [
      { by: 'Operations', date: '2026-03-22', note: 'Investigating nurse availability in Cape Coast region. Emergency reassignment initiated.' },
    ],
  },
  {
    id: 'CMP-006', date: '2026-03-20', patient: 'Grace Ampofo', patientId: 'P-1009',
    region: 'Accra', phone: '+233 24 555 0909', nurse: 'Akua Owusu',
    category: 'Equipment', priority: 'medium',
    subject: 'Blood pressure monitor giving inaccurate readings',
    description: 'Patient reports that the nurse\'s BP monitor showed readings significantly different from their personal device. Requesting equipment calibration or replacement.',
    status: 'resolved',
    responses: [
      { by: 'Equipment Mgr', date: '2026-03-20', note: 'BP monitor serial #BPM-442 recalled for calibration. Replacement unit issued to nurse.' },
    ],
    resolution: { resolvedBy: 'Equipment Mgr', resolvedDate: '2026-03-21', action: 'Defective BP monitor replaced. Nurse issued calibrated unit #BPM-558.' },
  },
  {
    id: 'CMP-007', date: '2026-03-19', patient: 'Akosua Mensah', patientId: 'P-1004',
    region: 'Accra', phone: '+233 24 555 0404', nurse: 'Efua Mensah',
    category: 'Medication', priority: 'high',
    subject: 'Wrong medication dosage administered',
    description: 'Patient was given 40mg of Omeprazole instead of the prescribed 20mg. While no adverse effects were observed, the family is concerned about medication safety protocols.',
    status: 'resolved',
    responses: [
      { by: 'Supervisor Ama', date: '2026-03-19', note: 'Incident investigated. Nurse counseled on double-check protocol. No harm to patient confirmed by Dr. Adu.' },
      { by: 'Admin', date: '2026-03-20', note: 'Family contacted and reassured. Enhanced medication verification protocol implemented.' },
    ],
    resolution: { resolvedBy: 'Supervisor Ama', resolvedDate: '2026-03-20', action: 'Nurse retrained on medication protocols. Double-verification now mandatory. Family satisfied with response.' },
  },
];

const CATEGORIES = ['All', 'Service Quality', 'Communication', 'Billing', 'Staff Conduct', 'Missed Visit', 'Equipment', 'Medication'];
const STATUS_OPTIONS = ['All', 'Open', 'In-Progress', 'Resolved'];
const PRIORITY_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low'];

const priorityStyle = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  low: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD' },
};

const statusStyle = {
  open: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: <FiAlertCircle size={11} /> },
  'in-progress': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: <FiClock size={11} /> },
  resolved: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', icon: <FiCheckCircle size={11} /> },
};

export default function Complaint() {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [selected, setSelected] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 6;

  /* Response form */
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseNote, setResponseNote] = useState('');
  const [resolveOnSubmit, setResolveOnSubmit] = useState(false);

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter.toLowerCase()) return false;
      if (priorityFilter !== 'All' && c.priority !== priorityFilter.toLowerCase()) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return c.patient.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.nurse.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
      }
      return true;
    });
  }, [complaints, categoryFilter, statusFilter, priorityFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  }), [complaints]);

  const resetFilters = () => { setCategoryFilter('All'); setStatusFilter('All'); setPriorityFilter('All'); setSearchTerm(''); setPage(1); };
  const hasFilters = categoryFilter !== 'All' || statusFilter !== 'All' || priorityFilter !== 'All' || searchTerm;

  const submitResponse = () => {
    if (!selected || !responseNote.trim()) return;
    const newResponse = { by: 'Admin', date: new Date().toISOString().slice(0, 10), note: responseNote.trim() };
    setComplaints(prev => prev.map(c => {
      if (c.id !== selected.id) return c;
      const updated = { ...c, responses: [...(c.responses || []), newResponse] };
      if (resolveOnSubmit) {
        updated.status = 'resolved';
        updated.resolution = { resolvedBy: 'Admin', resolvedDate: new Date().toISOString().slice(0, 10), action: responseNote.trim() };
      } else if (c.status === 'open') {
        updated.status = 'in-progress';
      }
      return updated;
    }));
    setSelected(prev => {
      if (!prev) return null;
      const updated = { ...prev, responses: [...(prev.responses || []), newResponse] };
      if (resolveOnSubmit) {
        updated.status = 'resolved';
        updated.resolution = { resolvedBy: 'Admin', resolvedDate: new Date().toISOString().slice(0, 10), action: responseNote.trim() };
      } else if (prev.status === 'open') {
        updated.status = 'in-progress';
      }
      return updated;
    });
    setResponseNote('');
    setShowResponseForm(false);
    setResolveOnSubmit(false);
  };

  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Complaints', value: stats.total, color: '#2E7DB8', bg: '#F0F7FE', icon: <FiMessageSquare size={20} /> },
          { label: 'Open', value: stats.open, color: '#dc2626', bg: '#fef2f2', icon: <FiAlertCircle size={20} /> },
          { label: 'In Progress', value: stats.inProgress, color: '#2563eb', bg: '#eff6ff', icon: <FiClock size={20} /> },
          { label: 'Resolved', value: stats.resolved, color: '#1565A0', bg: '#F0F7FE', icon: <FiCheckCircle size={20} /> },
        ].map((s, i) => (
          <div key={i} className="col">
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '20px 18px',
              borderLeft: `4px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--kh-text)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--kh-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="kh-card" style={{ marginBottom: 16, padding: 0 }}>
        <div style={{ background: '#2E7DB8', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="d-flex align-items-center gap-2">
            <FiMessageSquare size={16} style={{ color: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Complaint Management</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{filtered.length} complaints</span>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div className="d-flex flex-wrap align-items-end gap-3">
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Search</label>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Patient, complaint ID, nurse, subject..."
                  style={{ width: '100%', padding: '7px 12px 7px 32px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Category</label>
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} style={{
                padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
              }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Priority</label>
              <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} style={{
                padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
              }}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Status</label>
              <div className="d-flex gap-1">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
                    padding: '6px 14px', fontSize: 11.5, fontWeight: 600, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                    background: statusFilter === s ? '#45B6FE' : '#fff',
                    color: statusFilter === s ? '#fff' : 'var(--kh-text-muted)',
                    border: `1px solid ${statusFilter === s ? '#45B6FE' : '#d1d5db'}`,
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button onClick={resetFilters} style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <FiX size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table + Detail Panel */}
      <div className="d-flex gap-3" style={{ minHeight: 500 }}>

        {/* Table */}
        <div className="kh-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--kh-text-muted)' }}>
              <FiSearch size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No complaints found</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Adjust filters to view complaints.</div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                  <thead>
                    <tr style={{ background: '#F0F7FE' }}>
                      {['#', 'ID', 'Patient', 'Category', 'Priority', 'Subject', 'Date', 'Status', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: '#2E7DB8', borderBottom: '2px solid #45B6FE',
                          border: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c, idx) => {
                      const pri = priorityStyle[c.priority] || priorityStyle.medium;
                      const st = statusStyle[c.status] || statusStyle.open;
                      return (
                        <tr key={c.id}
                          onClick={() => { setSelected(c); setShowResponseForm(false); }}
                          style={{
                            cursor: 'pointer', transition: 'background 0.15s',
                            background: selected?.id === c.id ? '#F0F7FE' : idx % 2 === 1 ? '#fafbfc' : 'transparent',
                          }}
                          onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = '#F0F7FE'; }}
                          onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = idx % 2 === 1 ? '#fafbfc' : 'transparent'; }}
                        >
                          <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 700, border: '1px solid #e5e7eb' }}>
                            {(page - 1) * perPage + idx + 1}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#2E7DB8', border: '1px solid #e5e7eb' }}>{c.id}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{c.patient}</div>
                            <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{c.patientId} · {c.region}</div>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #d1e7dd' }}>{c.category}</span>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: pri.bg, color: pri.color, border: `1px solid ${pri.border}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{c.priority}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text)', border: '1px solid #e5e7eb', maxWidth: 220 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</div>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>{c.date}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2,
                              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                              display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize',
                            }}>{st.icon} {c.status}</span>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', whiteSpace: 'nowrap' }}>View →</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '2px solid #d1e7dd', background: '#f8fdfb' }}>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                  Showing <span style={{ fontWeight: 700, color: '#2E7DB8' }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</span> of {filtered.length}
                </span>
                <div className="d-flex gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronsLeft size={14} /></button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => {
                    const els = [];
                    if (idx > 0 && p - arr[idx - 1] > 1) els.push(<span key={`e-${p}`} style={{ padding: '5px 4px', fontSize: 12, color: '#9ca3af' }}>…</span>);
                    els.push(<button key={p} onClick={() => setPage(p)} style={{ background: page === p ? '#45B6FE' : '#fff', color: page === p ? '#fff' : 'var(--kh-text-muted)', border: `1px solid ${page === p ? '#45B6FE' : '#e5e7eb'}`, borderRadius: 2, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minWidth: 32 }}>{p}</button>);
                    return els;
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronsRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="kh-card" style={{ width: 420, flexShrink: 0, padding: 0, overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#F0F7FE', position: 'sticky', top: 0, zIndex: 2 }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#2E7DB8' }}>{selected.id}</span>
                    {(() => { const st = statusStyle[selected.status] || statusStyle.open; return (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: st.bg, color: st.color, border: `1px solid ${st.border}`, display: 'inline-flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>{st.icon} {selected.status}</span>
                    ); })()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>{selected.patient}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>{selected.patientId} · {selected.region}</div>
                </div>
                <button onClick={() => { setSelected(null); setShowResponseForm(false); }} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 7px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiX size={14} /></button>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Quick info */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {[
                  { icon: <FiMapPin size={11} />, text: selected.region },
                  { icon: <FiUser size={11} />, text: selected.nurse },
                  { icon: <FiPhone size={11} />, text: selected.phone },
                  { icon: <FiCalendar size={11} />, text: selected.date },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>

              {/* Subject */}
              <div style={{ padding: '12px 14px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #d1e7dd', marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7DB8', marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2d3c', lineHeight: 1.5 }}>{selected.subject}</div>
              </div>

              {/* Category + Priority badges */}
              <div className="d-flex gap-2 mb-4">
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 2, background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #d1e7dd' }}>{selected.category}</span>
                {(() => { const pri = priorityStyle[selected.priority]; return (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 2, background: pri.bg, color: pri.color, border: `1px solid ${pri.border}`, textTransform: 'uppercase' }}>⚑ {selected.priority}</span>
                ); })()}
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: 13, color: 'var(--kh-text)', lineHeight: 1.6 }}>{selected.description}</div>
              </div>

              {/* Responses */}
              {(selected.responses || []).length > 0 && (
                <div style={{ marginBottom: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 10 }}>
                    <FiMessageSquare size={11} style={{ marginRight: 4 }} />Responses ({selected.responses.length})
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {selected.responses.map((r, i) => (
                      <div key={i} style={{ padding: '10px 14px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text)' }}>{r.by}</span>
                          <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{r.date}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', lineHeight: 1.5 }}>{r.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selected.resolution && (
                <div style={{ padding: '12px 14px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #BAE0FD', marginBottom: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1565A0', marginBottom: 6 }}>
                    <FiCheckCircle size={11} style={{ marginRight: 4 }} />Resolution
                  </div>
                  <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5, marginBottom: 4 }}>{selected.resolution.action}</div>
                  <div style={{ fontSize: 11, color: '#4ade80' }}>Resolved by {selected.resolution.resolvedBy} on {selected.resolution.resolvedDate}</div>
                </div>
              )}

              {/* Action */}
              {selected.status !== 'resolved' && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  {!showResponseForm ? (
                    <div className="d-flex gap-2">
                      <button onClick={() => { setShowResponseForm(true); setResolveOnSubmit(false); }} style={{
                        flex: 1, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiMessageSquare size={13} /> Respond
                      </button>
                      <button onClick={() => { setShowResponseForm(true); setResolveOnSubmit(true); }} style={{
                        flex: 1, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                        background: '#45B6FE', color: '#fff', border: '1px solid #45B6FE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiCheckCircle size={13} /> Resolve
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>
                          {resolveOnSubmit ? '✅ Resolve Complaint' : '💬 Add Response'}
                        </span>
                        <button onClick={() => { setShowResponseForm(false); setResponseNote(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)' }}><FiX size={14} /></button>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>
                          {resolveOnSubmit ? 'Resolution Details' : 'Response'}
                        </label>
                        <textarea value={responseNote} onChange={e => setResponseNote(e.target.value)} rows={4} placeholder={resolveOnSubmit ? 'Describe how the complaint was resolved...' : 'Type your response...'}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', resize: 'vertical', fontFamily: 'inherit' }} />
                      </div>
                      <button onClick={submitResponse} disabled={!responseNote.trim()} style={{
                        width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 700, borderRadius: 2,
                        cursor: responseNote.trim() ? 'pointer' : 'not-allowed',
                        background: responseNote.trim() ? (resolveOnSubmit ? '#45B6FE' : '#2563eb') : '#e5e7eb',
                        color: responseNote.trim() ? '#fff' : '#9ca3af',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiSend size={13} /> {resolveOnSubmit ? 'Resolve Complaint' : 'Submit Response'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
