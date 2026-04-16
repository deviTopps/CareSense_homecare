import { useState, useMemo } from 'react';
import {
  FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiClock, FiX, FiSearch,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiFilter, FiUser, FiMapPin, FiPhone, FiActivity, FiHeart,
  FiThermometer, FiFileText, FiSend, FiShield, FiRefreshCw,
  FiChevronDown, FiChevronUp, FiXCircle, FiEdit3
} from '../icons/hugeicons-feather';

/* ── Emergency Cases Data ── */
const initialCases = [
  {
    id: 'FL-001', patientId: 'P-1001', patient: 'Kwame Boateng', age: 72, gender: 'Male',
    type: 'Vitals Alert', severity: 'critical', reason: 'Blood pressure elevated — 158/98 mmHg',
    flaggedBy: 'Efua Mensah', flaggedDate: '2026-03-23', nurse: 'Efua Mensah', region: 'Accra',
    phone: '+233 24 555 0101', diagnosis: 'Hypertension, Type 2 Diabetes', caseStatus: 'open',
    activities: [
      { time: '08:30', action: 'Morning vitals check', note: 'BP 158/98 — flagged for review', status: 'alert' },
      { time: '09:00', action: 'Medication administered', note: 'Amlodipine 5mg given as scheduled', status: 'done' },
      { time: '09:45', action: 'Nurse escalation', note: 'Contacted Dr. Kwesi Asare for BP review', status: 'alert' },
      { time: '10:15', action: 'Doctor callback', note: 'Increase Amlodipine to 10mg, recheck in 2hrs', status: 'pending' },
      { time: '12:30', action: 'Follow-up vitals', note: 'Pending — scheduled recheck', status: 'pending' },
    ],
    vitals: { bp: '158/98', sugar: '7.8 mmol/L', pulse: '88', temp: '36.7°C', spo2: '96%' },
    medications: ['Metformin 500mg BD', 'Amlodipine 10mg OD (updated)', 'Aspirin 75mg OD'],
  },
  {
    id: 'FL-002', patientId: 'P-1002', patient: 'Abena Osei', age: 65, gender: 'Female',
    type: 'Wound Infection', severity: 'high', reason: 'Post-surgical wound showing signs of infection',
    flaggedBy: 'Yaa Asantewaa', flaggedDate: '2026-03-23', nurse: 'Yaa Asantewaa', region: 'Kumasi',
    phone: '+233 24 555 0202', diagnosis: 'Post-surgical wound care', caseStatus: 'open',
    activities: [
      { time: '07:45', action: 'Wound dressing change', note: 'Redness and warmth around incision site noted', status: 'alert' },
      { time: '08:00', action: 'Temperature check', note: '37.8°C — low-grade fever', status: 'alert' },
      { time: '08:30', action: 'Photo documentation', note: 'Wound photo captured and uploaded', status: 'done' },
      { time: '09:15', action: 'Nurse escalation', note: 'Contacted Dr. Ama Serwaa — possible wound infection', status: 'alert' },
      { time: '10:00', action: 'Lab order placed', note: 'CBC and wound culture requested', status: 'pending' },
      { time: '11:00', action: 'Antibiotic adjustment', note: 'Pending lab results', status: 'pending' },
    ],
    vitals: { bp: '130/84', sugar: '5.3 mmol/L', pulse: '76', temp: '37.8°C', spo2: '98%' },
    medications: ['Tramadol 50mg PRN', 'Amoxicillin 500mg TDS', 'Omeprazole 20mg OD'],
  },
  {
    id: 'FL-003', patientId: 'P-1003', patient: 'Kofi Ankrah', age: 58, gender: 'Male',
    type: 'Blood Sugar', severity: 'high', reason: 'Blood sugar dangerously high — 14.2 mmol/L',
    flaggedBy: 'Ama Darko', flaggedDate: '2026-03-22', nurse: 'Ama Darko', region: 'Tamale',
    phone: '+233 24 555 0303', diagnosis: 'Diabetes, Peripheral Neuropathy', caseStatus: 'in-progress',
    activities: [
      { time: '06:00', action: 'Fasting blood sugar', note: '14.2 mmol/L — critically elevated', status: 'alert' },
      { time: '06:30', action: 'Insulin administered', note: 'Insulin Glargine 20u given', status: 'done' },
      { time: '07:00', action: 'Dietary review', note: 'Patient admitted to eating non-compliant foods yesterday', status: 'alert' },
      { time: '08:00', action: 'Nurse escalation', note: 'Dr. Ibrahim Mahama notified', status: 'done' },
      { time: '09:30', action: 'Recheck blood sugar', note: '11.1 mmol/L — still elevated', status: 'alert' },
      { time: '10:00', action: 'Additional insulin dose', note: 'Rapid-acting insulin 5u ordered', status: 'pending' },
    ],
    vitals: { bp: '148/94', sugar: '14.2 mmol/L', pulse: '82', temp: '36.9°C', spo2: '95%' },
    medications: ['Metformin 1g BD', 'Insulin Glargine 20u ON', 'Gabapentin 300mg TDS'],
    resolution: { resolvedBy: 'Ama Darko', resolvedDate: '2026-03-22', action: 'Insulin dosage adjusted. Patient re-educated on diet compliance. Follow-up in 24hrs.' },
  },
  {
    id: 'FL-004', patientId: 'P-1005', patient: 'Esi Quartey', age: 80, gender: 'Female',
    type: 'Fall Risk', severity: 'critical', reason: 'Patient fell during transfer — no fracture but bruising',
    flaggedBy: 'Efua Mensah', flaggedDate: '2026-03-23', nurse: 'Efua Mensah', region: 'Accra',
    phone: '+233 24 555 0505', diagnosis: 'Osteoarthritis, Mobility impairment', caseStatus: 'open',
    activities: [
      { time: '14:00', action: 'Transfer attempt', note: 'Patient slipped during bed-to-chair transfer', status: 'alert' },
      { time: '14:05', action: 'Injury assessment', note: 'Bruising on left hip, no visible fracture', status: 'alert' },
      { time: '14:20', action: 'Vitals checked', note: 'BP 142/88, Pulse 92 — stable', status: 'done' },
      { time: '14:30', action: 'Incident report filed', note: 'Fall incident documented in system', status: 'done' },
      { time: '15:00', action: 'Doctor consultation', note: 'X-ray ordered to rule out hairline fracture', status: 'pending' },
    ],
    vitals: { bp: '142/88', sugar: '5.6 mmol/L', pulse: '92', temp: '36.5°C', spo2: '97%' },
    medications: ['Paracetamol 500mg QDS', 'Ibuprofen 400mg BD'],
  },
  {
    id: 'FL-005', patientId: 'P-1008', patient: 'Nana Agyemang', age: 77, gender: 'Male',
    type: 'Missed Visit', severity: 'medium', reason: 'Scheduled home visit missed — nurse reassignment needed',
    flaggedBy: 'System', flaggedDate: '2026-03-23', nurse: 'Unassigned', region: 'Cape Coast',
    phone: '+233 24 555 0808', diagnosis: 'COPD, Heart failure', caseStatus: 'open',
    activities: [
      { time: '09:00', action: 'Scheduled visit', note: 'Visit was scheduled but nurse called in sick', status: 'alert' },
      { time: '09:30', action: 'Auto-flag triggered', note: 'System flagged missed visit', status: 'alert' },
      { time: '10:00', action: 'Reassignment attempt', note: 'Checking nurse availability in Cape Coast', status: 'pending' },
    ],
    vitals: { bp: '135/82', sugar: '6.1 mmol/L', pulse: '74', temp: '36.4°C', spo2: '94%' },
    medications: ['Furosemide 40mg OD', 'Salbutamol inhaler PRN', 'Lisinopril 10mg OD'],
  },
  {
    id: 'FL-006', patientId: 'P-1004', patient: 'Akosua Mensah', age: 45, gender: 'Female',
    type: 'Medication Error', severity: 'high', reason: 'Wrong dosage of Omeprazole administered (40mg instead of 20mg)',
    flaggedBy: 'Efua Mensah', flaggedDate: '2026-03-21', nurse: 'Efua Mensah', region: 'Accra',
    phone: '+233 24 555 0404', diagnosis: 'GERD, Mild Anaemia', caseStatus: 'resolved',
    activities: [
      { time: '10:00', action: 'Medication round', note: 'Omeprazole 40mg given in error (should be 20mg)', status: 'alert' },
      { time: '10:15', action: 'Error detected', note: 'Nurse self-reported dosage error', status: 'alert' },
      { time: '10:30', action: 'Patient monitored', note: 'No adverse reaction observed', status: 'done' },
      { time: '11:00', action: 'Incident report filed', note: 'Medication error documented', status: 'done' },
      { time: '11:30', action: 'Supervisor notified', note: 'Case reviewed by Supervisor Ama', status: 'done' },
    ],
    vitals: { bp: '118/76', sugar: '4.9 mmol/L', pulse: '68', temp: '36.6°C', spo2: '98%' },
    medications: ['Omeprazole 20mg OD', 'Ferrous Sulphate 200mg BD'],
    resolution: { resolvedBy: 'Supervisor Ama', resolvedDate: '2026-03-21', action: 'No adverse effect on patient. Nurse counseled. Double-check protocol reinforced for all medication rounds.' },
  },
  {
    id: 'FL-007', patientId: 'P-1006', patient: 'Yaw Frimpong', age: 68, gender: 'Male',
    type: 'GPS Flag', severity: 'medium', reason: 'Nurse clock-in location 350m away from patient address',
    flaggedBy: 'System', flaggedDate: '2026-03-22', nurse: 'Adwoa Badu', region: 'Takoradi',
    phone: '+233 24 555 0606', diagnosis: 'Chronic Kidney Disease', caseStatus: 'resolved',
    activities: [
      { time: '09:15', action: 'Clock-in detected', note: 'GPS coordinates 350m from registered address', status: 'alert' },
      { time: '09:20', action: 'Auto-flag triggered', note: 'Distance exceeds 100m threshold', status: 'alert' },
      { time: '10:00', action: 'Nurse contacted', note: 'Nurse explains patient relocated temporarily to family house', status: 'done' },
      { time: '10:30', action: 'Address updated', note: 'Temporary address added to patient profile', status: 'done' },
    ],
    vitals: { bp: '128/80', sugar: '5.8 mmol/L', pulse: '72', temp: '36.5°C', spo2: '97%' },
    medications: ['Erythropoietin injection weekly', 'Calcium Carbonate 500mg TDS'],
    resolution: { resolvedBy: 'Adwoa Badu', resolvedDate: '2026-03-22', action: 'Patient temporarily at family house. Address updated in system. GPS flag dismissed.' },
  },
  {
    id: 'FL-008', patientId: 'P-1009', patient: 'Grace Ampofo', age: 55, gender: 'Female',
    type: 'Vitals Alert', severity: 'medium', reason: 'Oxygen saturation dropped to 91% during routine check',
    flaggedBy: 'Akua Owusu', flaggedDate: '2026-03-24', nurse: 'Akua Owusu', region: 'Accra',
    phone: '+233 24 555 0909', diagnosis: 'Asthma, Hypertension', caseStatus: 'open',
    activities: [
      { time: '09:00', action: 'Routine vitals', note: 'SpO2 reading at 91% — below threshold', status: 'alert' },
      { time: '09:10', action: 'Oxygen administered', note: '2L nasal cannula applied', status: 'done' },
      { time: '09:30', action: 'SpO2 recheck', note: 'Improved to 94%', status: 'done' },
      { time: '10:00', action: 'Doctor notified', note: 'Awaiting callback from Dr. Adu', status: 'pending' },
    ],
    vitals: { bp: '138/86', sugar: '5.5 mmol/L', pulse: '78', temp: '36.8°C', spo2: '91%' },
    medications: ['Salbutamol inhaler PRN', 'Amlodipine 5mg OD', 'Prednisolone 5mg OD'],
  },
];

const TYPE_TABS = [
  { key: 'all', label: 'All Cases' },
  { key: 'Vitals Alert', label: 'Vitals Alert' },
  { key: 'Wound Infection', label: 'Wound' },
  { key: 'Blood Sugar', label: 'Blood Sugar' },
  { key: 'Fall Risk', label: 'Fall Risk' },
  { key: 'Missed Visit', label: 'Missed Visit' },
  { key: 'Medication Error', label: 'Medication' },
  { key: 'GPS Flag', label: 'GPS Flag' },
];

const STATUS_OPTIONS = ['All', 'Open', 'In-Progress', 'Resolved'];

const SOLUTIONS = [
  'Medication dosage adjusted',
  'Patient referred to specialist',
  'Nurse reassigned to patient',
  'Emergency services contacted',
  'Family/caregiver notified',
  'Follow-up visit scheduled',
  'Incident report filed & reviewed',
  'GPS flag dismissed — address verified',
  'Patient vitals stabilized — monitoring continues',
  'Wound treatment protocol updated',
  'Other (specify in notes)',
];

const severityStyle = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
};

const caseStatusStyle = {
  open: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: <FiAlertCircle size={12} /> },
  'in-progress': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: <FiRefreshCw size={12} /> },
  resolved: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', icon: <FiCheckCircle size={12} /> },
};

const activityStatusDot = {
  alert: { bg: '#dc2626' },
  done: { bg: '#45B6FE' },
  pending: { bg: '#d97706' },
};

export default function ClinicalDocs() {
  const [cases, setCases] = useState(initialCases);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  /* Resolution form state */
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  /* Filtered cases */
  const filtered = useMemo(() => {
    return cases.filter(c => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'All' && c.caseStatus !== statusFilter.toLowerCase().replace('-', '-')) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return c.patient.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.nurse.toLowerCase().includes(q) || c.region.toLowerCase().includes(q);
      }
      return true;
    });
  }, [cases, typeFilter, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  /* Stats */
  const stats = useMemo(() => ({
    total: cases.length,
    open: cases.filter(c => c.caseStatus === 'open').length,
    inProgress: cases.filter(c => c.caseStatus === 'in-progress').length,
    resolved: cases.filter(c => c.caseStatus === 'resolved').length,
    critical: cases.filter(c => c.severity === 'critical' && c.caseStatus !== 'resolved').length,
  }), [cases]);

  const resetFilters = () => { setTypeFilter('all'); setStatusFilter('All'); setSearchTerm(''); setPage(1); };
  const hasFilters = typeFilter !== 'all' || statusFilter !== 'All' || searchTerm;

  /* Apply resolution */
  const applyResolution = () => {
    if (!selected || !selectedSolution || !newStatus) return;
    setCases(prev => prev.map(c => {
      if (c.id !== selected.id) return c;
      const updated = { ...c, caseStatus: newStatus };
      if (newStatus === 'resolved') {
        updated.resolution = {
          resolvedBy: 'Admin',
          resolvedDate: new Date().toISOString().slice(0, 10),
          action: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}`,
        };
      }
      /* Add activity entry */
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      updated.activities = [...(c.activities || []), {
        time: timeStr,
        action: newStatus === 'resolved' ? 'Case resolved' : 'Status updated',
        note: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}`,
        status: newStatus === 'resolved' ? 'done' : newStatus === 'in-progress' ? 'pending' : 'alert',
      }];
      return updated;
    }));
    /* Update selected to reflect changes */
    setSelected(prev => {
      if (!prev) return null;
      const updated = cases.find(c => c.id === prev.id);
      if (!updated) return prev;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return {
        ...prev,
        caseStatus: newStatus,
        resolution: newStatus === 'resolved' ? { resolvedBy: 'Admin', resolvedDate: new Date().toISOString().slice(0, 10), action: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}` } : prev.resolution,
        activities: [...(prev.activities || []), { time: timeStr, action: newStatus === 'resolved' ? 'Case resolved' : 'Status updated', note: `${selectedSolution}${resolutionNotes ? ' — ' + resolutionNotes : ''}`, status: newStatus === 'resolved' ? 'done' : 'pending' }],
      };
    });
    setShowResolveForm(false);
    setSelectedSolution('');
    setResolutionNotes('');
    setNewStatus('');
  };

  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>

      {/* ── Summary Cards ── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Cases', value: stats.total, color: '#2E7DB8', bg: '#F0F7FE', icon: <FiFileText size={20} /> },
          { label: 'Open', value: stats.open, color: '#dc2626', bg: '#fef2f2', icon: <FiAlertCircle size={20} /> },
          { label: 'In Progress', value: stats.inProgress, color: '#2563eb', bg: '#eff6ff', icon: <FiRefreshCw size={20} /> },
          { label: 'Resolved', value: stats.resolved, color: '#1565A0', bg: '#F0F7FE', icon: <FiCheckCircle size={20} /> },
          { label: 'Critical Active', value: stats.critical, color: '#dc2626', bg: '#fef2f2', icon: <FiAlertTriangle size={20} /> },
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

      {/* ── Filter Bar ── */}
      <div className="kh-card" style={{ marginBottom: 16, padding: 0 }}>
        <div style={{ background: '#ef4444', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="d-flex align-items-center gap-2">
            <FiAlertTriangle size={16} style={{ color: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Emergency Case Management</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{filtered.length} cases</span>
        </div>

        {/* Type tabs + filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {TYPE_TABS.map(t => (
              <button key={t.key} onClick={() => { setTypeFilter(t.key); setPage(1); }} style={{
                padding: '5px 14px', fontSize: 11.5, fontWeight: 600, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                background: typeFilter === t.key ? '#ef4444' : '#fff',
                color: typeFilter === t.key ? '#fff' : 'var(--kh-text-muted)',
                border: `1px solid ${typeFilter === t.key ? '#ef4444' : '#d1d5db'}`,
              }}>{t.label}</button>
            ))}
          </div>

          <div className="d-flex flex-wrap align-items-end gap-3">
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Search</label>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Patient, case ID, nurse, region..."
                  style={{ width: '100%', padding: '7px 12px 7px 32px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Case Status</label>
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

      {/* ── Table + Detail Panel ── */}
      <div className="d-flex gap-3" style={{ minHeight: 500 }}>

        {/* Table */}
        <div className="kh-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--kh-text-muted)' }}>
              <FiSearch size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No cases found</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Adjust filters to view emergency cases.</div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                  <thead>
                    <tr style={{ background: '#fef2f2' }}>
                      {['#', 'Case ID', 'Patient', 'Type', 'Severity', 'Flagged By', 'Date', 'Status', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: '#ef4444', borderBottom: '2px solid #ef4444',
                          border: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c, idx) => {
                      const sev = severityStyle[c.severity] || severityStyle.medium;
                      const cs = caseStatusStyle[c.caseStatus] || caseStatusStyle.open;
                      return (
                        <tr key={c.id}
                          onClick={() => { setSelected(c); setShowResolveForm(false); }}
                          style={{
                            cursor: 'pointer', transition: 'background 0.15s',
                            background: selected?.id === c.id ? '#fef2f2' : idx % 2 === 1 ? '#fafbfc' : 'transparent',
                          }}
                          onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = idx % 2 === 1 ? '#fafbfc' : 'transparent'; }}
                        >
                          <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 700, border: '1px solid #e5e7eb' }}>
                            {(page - 1) * perPage + idx + 1}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#ef4444', border: '1px solid #e5e7eb' }}>{c.id}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{c.patient}</div>
                            <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{c.patientId} · {c.region}</div>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>{c.type}</span>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{c.severity}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)', border: '1px solid #e5e7eb' }}>{c.flaggedBy}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>{c.flaggedDate}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2,
                              background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`,
                              display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize',
                            }}>{cs.icon} {c.caseStatus}</span>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap' }}>View →</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '2px solid #fecaca', background: '#fffbfb' }}>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                  Showing <span style={{ fontWeight: 700, color: '#ef4444' }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</span> of {filtered.length}
                </span>
                <div className="d-flex gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronsLeft size={14} /></button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => {
                    const els = [];
                    if (idx > 0 && p - arr[idx - 1] > 1) els.push(<span key={`e-${p}`} style={{ padding: '5px 4px', fontSize: 12, color: '#9ca3af' }}>…</span>);
                    els.push(<button key={p} onClick={() => setPage(p)} style={{ background: page === p ? '#ef4444' : '#fff', color: page === p ? '#fff' : 'var(--kh-text-muted)', border: `1px solid ${page === p ? '#ef4444' : '#e5e7eb'}`, borderRadius: 2, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minWidth: 32 }}>{p}</button>);
                    return els;
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronsRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Detail Panel ── */}
        {selected && (
          <div className="kh-card" style={{ width: 420, flexShrink: 0, padding: 0, overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            {/* Panel header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fef2f2', position: 'sticky', top: 0, zIndex: 2 }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{selected.id}</span>
                    {(() => { const cs = caseStatusStyle[selected.caseStatus] || caseStatusStyle.open; return (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, display: 'inline-flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>{cs.icon} {selected.caseStatus}</span>
                    ); })()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>{selected.patient}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>{selected.age}y · {selected.gender} · {selected.patientId}</div>
                </div>
                <button onClick={() => { setSelected(null); setShowResolveForm(false); }} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 7px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiX size={14} /></button>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Quick info */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {[
                  { icon: <FiMapPin size={11} />, text: selected.region },
                  { icon: <FiUser size={11} />, text: selected.nurse },
                  { icon: <FiPhone size={11} />, text: selected.phone },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>

              {/* Reason */}
              <div style={{ padding: '12px 14px', borderRadius: 2, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#dc2626', marginBottom: 4 }}>Flag Reason</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', lineHeight: 1.5 }}>{selected.reason}</div>
              </div>

              {/* Severity + Type badges */}
              <div className="d-flex gap-2 mb-4">
                {(() => { const sev = severityStyle[selected.severity]; return (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 2, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, textTransform: 'uppercase' }}>⚠ {selected.severity}</span>
                ); })()}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 2, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>{selected.type}</span>
              </div>

              {/* Diagnosis */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 6 }}>Diagnosis</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{selected.diagnosis}</div>
              </div>

              {/* Vitals */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 8 }}>
                  <FiActivity size={11} style={{ marginRight: 4 }} />Current Vitals
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(selected.vitals || {}).map(([k, v]) => (
                    <div key={k} style={{ padding: '8px 12px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb', minWidth: 80 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medications */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 8 }}>Medications</div>
                <div className="d-flex flex-column gap-1">
                  {(selected.medications || []).map((m, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: 'var(--kh-text)', padding: '6px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 2 }}>💊 {m}</div>
                  ))}
                </div>
              </div>

              {/* Activity timeline */}
              <div style={{ marginBottom: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 10 }}>
                  <FiClock size={11} style={{ marginRight: 4 }} />Activity Timeline
                </div>
                <div className="d-flex flex-column gap-0" style={{ position: 'relative' }}>
                  {/* vertical line */}
                  <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, background: '#e5e7eb' }} />
                  {(selected.activities || []).map((a, i) => {
                    const dot = activityStatusDot[a.status] || activityStatusDot.pending;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', position: 'relative' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: dot.bg, border: '2px solid #fff', flexShrink: 0, marginTop: 2, zIndex: 1, boxShadow: '0 0 0 1px #e5e7eb' }} />
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--kh-text-muted)' }}>{a.time}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text)' }}>{a.action}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', lineHeight: 1.4, marginTop: 2 }}>{a.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resolution (if resolved) */}
              {selected.resolution && (
                <div style={{ padding: '12px 14px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #BAE0FD', marginBottom: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1565A0', marginBottom: 6 }}>
                    <FiCheckCircle size={11} style={{ marginRight: 4 }} />Resolution
                  </div>
                  <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5, marginBottom: 4 }}>{selected.resolution.action}</div>
                  <div style={{ fontSize: 11, color: '#4ade80' }}>Resolved by {selected.resolution.resolvedBy} on {selected.resolution.resolvedDate}</div>
                </div>
              )}

              {/* ── Action Buttons ── */}
              {selected.caseStatus !== 'resolved' && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  {!showResolveForm ? (
                    <div className="d-flex gap-2">
                      <button onClick={() => { setShowResolveForm(true); setNewStatus('in-progress'); }} style={{
                        flex: 1, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiRefreshCw size={13} /> Update Status
                      </button>
                      <button onClick={() => { setShowResolveForm(true); setNewStatus('resolved'); }} style={{
                        flex: 1, padding: '10px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                        background: '#45B6FE', color: '#fff', border: '1px solid #45B6FE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiCheckCircle size={13} /> Resolve Case
                      </button>
                    </div>
                  ) : (
                    /* Resolution form */
                    <div style={{ padding: '16px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>
                          {newStatus === 'resolved' ? '✅ Resolve Case' : '🔄 Update Status'}
                        </span>
                        <button onClick={() => { setShowResolveForm(false); setSelectedSolution(''); setResolutionNotes(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)' }}><FiX size={14} /></button>
                      </div>

                      {/* Status select */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>New Status</label>
                        <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{
                          width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
                        }}>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      {/* Solution select */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Solution Applied</label>
                        <select value={selectedSolution} onChange={e => setSelectedSolution(e.target.value)} style={{
                          width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
                        }}>
                          <option value="">— Select a solution —</option>
                          {SOLUTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Notes */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Additional Notes</label>
                        <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={3} placeholder="Add any additional details about the resolution..."
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', resize: 'vertical', fontFamily: 'inherit' }} />
                      </div>

                      {/* Submit */}
                      <button onClick={applyResolution} disabled={!selectedSolution} style={{
                        width: '100%', padding: '10px 16px', fontSize: 13, fontWeight: 700, borderRadius: 2, cursor: selectedSolution ? 'pointer' : 'not-allowed',
                        background: selectedSolution ? (newStatus === 'resolved' ? '#45B6FE' : '#2563eb') : '#e5e7eb',
                        color: selectedSolution ? '#fff' : '#9ca3af',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <FiSend size={13} /> {newStatus === 'resolved' ? 'Apply Solution & Resolve' : 'Update Case Status'}
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
