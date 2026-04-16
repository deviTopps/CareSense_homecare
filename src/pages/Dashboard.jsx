import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FiUsers, FiCalendar, FiActivity, FiClock,
  FiCheckCircle, FiAlertTriangle, FiHeart, FiX,
  FiUser, FiMapPin, FiPhone, FiThermometer, FiFileText
} from '../icons/hugeicons-feather';

/* ── Flagged Issues Data ── */
const flaggedIssues = [
  {
    id: 'FL-001', patientId: 'P-1001', patient: 'Kwame Boateng', age: 72, gender: 'Male',
    type: 'Vitals', severity: 'critical', reason: 'Blood pressure elevated — 158/98 mmHg',
    flaggedBy: 'Efua Mensah', flaggedDate: '2026-03-23', nurse: 'Efua Mensah', region: 'Accra',
    diagnosis: 'Hypertension, Type 2 Diabetes',
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
    type: 'Wound', severity: 'high', reason: 'Post-surgical wound showing signs of infection',
    flaggedBy: 'Yaa Asantewaa', flaggedDate: '2026-03-23', nurse: 'Yaa Asantewaa', region: 'Kumasi',
    diagnosis: 'Post-surgical wound care',
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
    diagnosis: 'Diabetes, Peripheral Neuropathy',
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
  },
  {
    id: 'FL-004', patientId: 'P-1005', patient: 'Esi Quartey', age: 80, gender: 'Female',
    type: 'Fall Risk', severity: 'critical', reason: 'Patient fell during transfer — no fracture but bruising',
    flaggedBy: 'Efua Mensah', flaggedDate: '2026-03-23', nurse: 'Efua Mensah', region: 'Accra',
    diagnosis: 'Osteoarthritis, Mobility impairment',
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
    diagnosis: 'COPD, Heart failure',
    activities: [
      { time: '09:00', action: 'Scheduled visit', note: 'Visit was scheduled but nurse called in sick', status: 'alert' },
      { time: '09:30', action: 'Auto-flag triggered', note: 'System flagged missed visit', status: 'alert' },
      { time: '10:00', action: 'Reassignment attempt', note: 'Checking nurse availability in Cape Coast', status: 'pending' },
    ],
    vitals: { bp: '135/82', sugar: '6.1 mmol/L', pulse: '74', temp: '36.4°C', spo2: '94%' },
    medications: ['Furosemide 40mg OD', 'Salbutamol inhaler PRN', 'Lisinopril 10mg OD'],
  },
];

const FLAG_TABS = [
  { key: 'all', label: 'All Flags' },
  { key: 'Vitals', label: 'Vitals' },
  { key: 'Wound', label: 'Wound' },
  { key: 'Blood Sugar', label: 'Blood Sugar' },
  { key: 'Fall Risk', label: 'Fall Risk' },
  { key: 'Missed Visit', label: 'Missed Visit' },
];

const severityStyle = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
};

export default function Dashboard() {
  const [flagTab, setFlagTab] = useState('all');
  const [selectedFlag, setSelectedFlag] = useState(null);

  const filtered = flagTab === 'all' ? flaggedIssues : flaggedIssues.filter(f => f.type === flagTab);

  return (
    <motion.div className="page-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      {/* Welcome Banner */}
      <motion.div style={{
        background: '#f3f4f6',
        borderRadius: 2, padding: '16px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid #e5e7eb',
      }} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Dashboard Overview
          </div>
          <h5 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4, color: 'var(--kh-text)' }}>
            Good morning, Ama 👋
          </h5>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0F7FE', border: '1px solid #bfe0fd', borderRadius: 10, padding: '3px 12px', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1565A0' }}>Kulobal Homecare Agency</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--kh-text-muted)', margin: 0 }}>
            Here's what's happening across your homecare operations today.
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--kh-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div style={{ width: 1, height: 36, background: '#d1d5db' }} />
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: '#45B6FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>AA</span>
          </div>
        </div>
      </motion.div>

      {/* Big Overview Cards */}
      <div className="row g-3 mb-4">
        {/* Current Patients */}
        <motion.div className="col-lg-3" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.02, duration: 0.28 }}>
          <div style={{ background: 'linear-gradient(135deg, #E8F4FE 0%, #A8D8FC 50%, #45B6FE 100%)', border: '1px solid #A8D8FC', borderRadius: 2, padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <FiUsers size={26} style={{ color: '#1A7ABF' }} />
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#1a2d3c', lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>248</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2d3c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Current Patients</div>
            <div style={{ fontSize: 12.5, color: '#2d5a7a', lineHeight: 1.5 }}>Enrolled across all regions</div>
          </div>
        </motion.div>

        {/* Emergency Issues */}
        <motion.div className="col-lg-3" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.06, duration: 0.28 }}>
          <div style={{ background: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 50%, #b91c1c 100%)', borderRadius: 2, padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <FiAlertTriangle size={26} style={{ color: '#fff' }} />
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>2</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Emergency Issues</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Requires immediate attention</div>
          </div>
        </motion.div>

        {/* Pending Care Visits */}
        <motion.div className="col-lg-3" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.28 }}>
          <div style={{ background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #d97706 100%)', borderRadius: 2, padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <FiClock size={26} style={{ color: '#fff' }} />
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>14</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Pending Care Visits</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Scheduled today · awaiting check-in</div>
          </div>
        </motion.div>

        {/* Active Nurses */}
        <motion.div className="col-lg-3" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.14, duration: 0.28 }}>
          <div style={{ background: 'linear-gradient(135deg, #7EC8FE 0%, #45B6FE 50%, #1565A0 100%)', borderRadius: 2, padding: '32px 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <FiUsers size={26} style={{ color: '#fff' }} />
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>36</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Active Nurses</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>32 on duty · 4 on leave</div>
          </div>
        </motion.div>
      </div>

      {/* ── Emergency Issues Data Table ── */}
      <motion.div className="kh-card" style={{ overflow: 'hidden' }} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18, duration: 0.28 }}>
        <div className="card-header-custom" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <h6 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertTriangle size={16} style={{ color: '#ef4444' }} />
            Emergency Issues
          </h6>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fef2f2', padding: '3px 10px', borderRadius: 10 }}>
            {flaggedIssues.length} active
          </span>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f3f4f6', padding: '0 16px' }}>
          {FLAG_TABS.map(t => {
            const count = t.key === 'all' ? flaggedIssues.length : flaggedIssues.filter(f => f.type === t.key).length;
            return (
              <button key={t.key} onClick={() => setFlagTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', fontSize: 12.5,
                fontWeight: flagTab === t.key ? 700 : 500, border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: flagTab === t.key ? '#ef4444' : 'var(--kh-text-muted)',
                borderBottom: flagTab === t.key ? '2px solid #ef4444' : '2px solid transparent',
                marginBottom: -2, transition: 'all 0.15s',
              }}>
                {t.label}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                  background: flagTab === t.key ? '#fef2f2' : '#f3f4f6',
                  color: flagTab === t.key ? '#ef4444' : '#6b7280',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#fef2f2' }}>
                {['Flag ID', 'Patient', 'Type', 'Severity', 'Reason', 'Flagged By', 'Date', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.5px', color: '#ef4444', borderBottom: '2px solid #ef4444',
                    border: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const sev = severityStyle[f.severity];
                return (
                  <tr key={f.id}
                    onClick={() => setSelectedFlag(f)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 700, color: '#ef4444', border: '1px solid #e5e7eb' }}>{f.id}</td>
                    <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{f.patient}</div>
                      <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{f.patientId} · {f.region}</div>
                    </td>
                    <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2,
                        background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                      }}>{f.type}</span>
                    </td>
                    <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2,
                        background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.3px',
                      }}>{f.severity}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--kh-text)', maxWidth: 280, border: '1px solid #e5e7eb' }}>{f.reason}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--kh-text-muted)', border: '1px solid #e5e7eb' }}>{f.flaggedBy}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--kh-text-muted)', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>{f.flaggedDate}</td>
                    <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap' }}>View →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ═══ Flagged Alert Portal (Modal) ═══ */}
      {selectedFlag && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => setSelectedFlag(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 2, width: '100%', maxWidth: 860,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            {/* Portal header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#fef2f2',
            }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FiAlertTriangle size={18} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>Flagged Alert — {selectedFlag.id}</div>
                  <div style={{ fontSize: 12, color: '#ef4444' }}>{selectedFlag.type} · {selectedFlag.severity.toUpperCase()}</div>
                </div>
              </div>
              <button onClick={() => setSelectedFlag(null)} style={{
                background: 'none', border: '1px solid #fecaca', borderRadius: 2, padding: '6px 8px',
                cursor: 'pointer', color: '#ef4444', display: 'flex',
              }}><FiX size={16} /></button>
            </div>

            {/* Patient banner */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', background: '#fafbfc' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 16,
                }}>
                  {selectedFlag.patient.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--kh-text)' }}>{selectedFlag.patient}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2,
                      background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>FLAGGED</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 2 }}>
                    <span style={{ fontWeight: 600, color: 'var(--kh-text)' }}>{selectedFlag.patientId}</span>
                    <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
                    {selectedFlag.gender}, {selectedFlag.age} yrs
                    <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
                    <FiMapPin size={11} style={{ marginRight: 3 }} />{selectedFlag.region}
                    <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
                    Nurse: <span style={{ fontWeight: 600 }}>{selectedFlag.nurse}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div style={{ padding: '14px 24px', background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#dc2626', marginBottom: 4 }}>Flag Reason</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#991b1b' }}>{selectedFlag.reason}</div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div className="row g-3">
                {/* Left — Activities timeline */}
                <div className="col-lg-7">
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 12 }}>
                    Patient Activity Timeline
                  </div>
                  {selectedFlag.activities.map((a, i) => (
                    <div key={i} className="d-flex gap-3" style={{ marginBottom: i < selectedFlag.activities.length - 1 ? 0 : 0 }}>
                      {/* Timeline line */}
                      <div className="d-flex flex-column align-items-center" style={{ width: 20 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: a.status === 'alert' ? '#ef4444' : a.status === 'done' ? '#45B6FE' : '#d97706',
                          border: `2px solid ${a.status === 'alert' ? '#fecaca' : a.status === 'done' ? '#BAE0FD' : '#fde68a'}`,
                        }} />
                        {i < selectedFlag.activities.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: '#e5e7eb', minHeight: 30 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: 16, flex: 1 }}>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--kh-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{a.time}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{a.action}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 2 }}>{a.note}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right — Vitals & Meds */}
                <div className="col-lg-5">
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 12 }}>
                    Current Vitals
                  </div>
                  <div className="row g-2 mb-3">
                    {Object.entries(selectedFlag.vitals).map(([key, val]) => {
                      const labels = { bp: 'Blood Pressure', sugar: 'Blood Sugar', pulse: 'Pulse', temp: 'Temperature', spo2: 'SPO2' };
                      const isFlag = (key === 'bp' && parseInt(val) >= 140) || (key === 'sugar' && parseFloat(val) > 7) || (key === 'spo2' && parseInt(val) < 95);
                      return (
                        <div key={key} className="col-6">
                          <div style={{
                            padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 2,
                            background: isFlag ? '#fef2f2' : '#fafbfc',
                            borderLeft: isFlag ? '3px solid #ef4444' : '3px solid #e5e7eb',
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)' }}>{labels[key] || key}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: isFlag ? '#ef4444' : 'var(--kh-text)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{val}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 8 }}>
                    Active Medications
                  </div>
                  {selectedFlag.medications.map((med, i) => (
                    <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)' }}>{med}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 8 }}>
                    Diagnosis
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{selectedFlag.diagnosis}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px', borderTop: '1px solid #f3f4f6', background: '#fafbfc',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>
                Flagged by <span style={{ fontWeight: 600 }}>{selectedFlag.flaggedBy}</span> on {selectedFlag.flaggedDate}
              </div>
              <div className="d-flex gap-2">
                <button onClick={() => setSelectedFlag(null)} style={{
                  background: 'none', border: '1px solid #e5e7eb', borderRadius: 2,
                  padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: 'var(--kh-text)',
                }}>Close</button>
                <button style={{
                  background: '#ef4444', border: 'none', borderRadius: 2,
                  padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', color: '#fff',
                }}>Resolve Flag</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
