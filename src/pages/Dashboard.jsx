import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  FiAlertTriangle,
  FiX,
  FiMapPin,
  FiPhone,
  FiMoreHorizontal,
  FiUser,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
} from '../icons/hugeicons-feather';
import { fetchAllPatients } from '../utils/patients';

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
      { time: '10:15', action: 'Doctor callback', note: 'Increase Amlodipine to 10mg, recheck in 2hrs', status: 'alert' },
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

const WORKSPACE_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'watchlist', label: 'Watchlist' },
  { key: 'activity', label: 'Activity' },
  { key: 'programs', label: 'Programs' },
];

const severityStyle = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
};

const carePrograms = [
  { name: 'Chronic Care', current: '$18,400', target: '$24,000', progress: 76 },
  { name: 'Post-Surgery Recovery', current: '$9,800', target: '$15,000', progress: 65 },
  { name: 'Palliative Support', current: '$12,250', target: '$20,000', progress: 61 },
];

const activityFeed = [
  { title: 'Jamie Smith updated wound dressing notes', time: '16:05', accent: 'green' },
  { title: 'Alex Johnson logged in for a new care visit', time: '13:05', accent: 'lime' },
  { title: 'Morgan Lee added a new diabetes monitoring plan', time: '12:05', accent: 'teal' },
  { title: 'Taylor Green reviewed missed visit escalations', time: '21:05', accent: 'gold' },
  { title: 'Wilson Baptista reassigned an emergency visit', time: '09:05', accent: 'green' },
];

function FlagDetailPanel({ flag, onClose, dense }) {
  const hPad = dense ? '12px 14px' : '18px 24px';
  const gapSm = dense ? '10px' : '14px';

  return (
    <>
      <div style={{ padding: dense ? '10px 14px' : hPad, borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: dense ? 36 : 44, height: dense ? 36 : 44, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiAlertTriangle size={dense ? 15 : 18} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: dense ? 14 : 16, fontWeight: 800, color: '#111827' }} id={dense ? undefined : 'dashboard-flag-detail-title'}>Flagged Alert — {flag.id}</div>
            <div style={{ fontSize: 11.5, color: '#6b7280' }}>{flag.type} · {flag.severity.toUpperCase()}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '6px 8px', cursor: 'pointer', color: '#6b7280', display: 'flex' }} aria-label="Close"><FiX size={16} /></button>
      </div>

      <div style={{ padding: dense ? '10px 14px' : hPad, borderBottom: '1px solid #f3f4f6', background: '#fcfcfd' }}>
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: dense ? 44 : 52, height: dense ? 44 : 52, borderRadius: '50%', background: '#1f5e59', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: dense ? 14 : 16 }}>
            {flag.patient.split(' ').map((name) => name[0]).join('')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span style={{ fontSize: dense ? 15 : 17, fontWeight: 800, color: 'var(--kh-text)' }}>{flag.patient}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flagged</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: dense ? 8 : 12 }}>
              <span><FiMapPin size={11} style={{ marginRight: 4 }} />{flag.region}</span>
              <span><FiPhone size={11} style={{ marginRight: 4 }} />{flag.nurse}</span>
              <span>ID: <strong>{flag.patientId}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: dense ? '10px 14px' : '14px 24px', background: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c2410c', marginBottom: 4 }}>Flag reason</div>
        <div style={{ fontSize: dense ? 13 : 14, fontWeight: 600, color: '#9a3412', lineHeight: 1.45 }}>{flag.reason}</div>
      </div>

      <div style={{ padding: dense ? '12px 14px' : '22px 24px', flex: 1, minHeight: 0, overflow: 'auto' }} className="dashboard-flag-detail__body">
        <div className="row g-3">
          <div className="col-lg-7">
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: gapSm }}>Activity timeline</div>
            {flag.activities.map((activity, index) => (
              <div key={`${activity.time}-${activity.action}`} className="d-flex gap-2">
                <div className="d-flex flex-column align-items-center" style={{ width: 18 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: activity.status === 'alert' ? '#ef4444' : activity.status === 'done' ? '#1f5e59' : '#ca8a04', border: `2px solid ${activity.status === 'alert' ? '#fecaca' : activity.status === 'done' ? '#bbf7d0' : '#fde68a'}` }} />
                  {index < flag.activities.length - 1 && <div style={{ width: 2, flex: 1, background: '#e5e7eb', minHeight: dense ? 24 : 32 }} />}
                </div>
                <div style={{ paddingBottom: dense ? 12 : 16, flex: 1 }}>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kh-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{activity.time}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{activity.action}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 2 }}>{activity.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-lg-5">
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: gapSm }}>Vitals</div>
            <div className="row g-2 mb-3">
              {Object.entries(flag.vitals).map(([key, value]) => {
                const labels = { bp: 'BP', sugar: 'Glucose', pulse: 'Pulse', temp: 'Temp', spo2: 'SpO2' };
                const isFlag = (key === 'bp' && parseInt(value, 10) >= 140) || (key === 'sugar' && parseFloat(value) > 7) || (key === 'spo2' && parseInt(value, 10) < 95);
                return (
                  <div key={key} className="col-6">
                    <div style={{ padding: dense ? '8px 10px' : '12px 14px', border: '1px solid #e5e7eb', borderRadius: dense ? 10 : 14, background: isFlag ? '#fef2f2' : '#fafbfc' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--kh-text-muted)' }}>{labels[key] || key}</div>
                      <div style={{ fontSize: dense ? 14 : 16, fontWeight: 800, color: isFlag ? '#dc2626' : 'var(--kh-text)', marginTop: 3 }}>{value}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: 8 }}>Medications</div>
            {flag.medications.map((medication) => (
              <div key={medication} className="d-flex align-items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#84cc16', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--kh-text)' }}>{medication}</span>
              </div>
            ))}

            <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: 6 }}>Diagnosis</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)', lineHeight: 1.4 }}>{flag.diagnosis}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: dense ? '10px 14px' : '16px 24px', borderTop: '1px solid #f3f4f6', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>By <strong>{flag.flaggedBy}</strong> · {flag.flaggedDate}</div>
        <div className="d-flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-kh-outline" style={{ fontSize: 12 }}>Close</button>
          <button type="button" className="btn btn-kh-primary" style={{ fontSize: 12, background: '#ef4444', borderColor: '#ef4444' }}>Resolve</button>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const [workspaceTab, setWorkspaceTab] = useState('overview');
  const [flagTab, setFlagTab] = useState('all');
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [watchlistInspectorOpen, setWatchlistInspectorOpen] = useState(true);
  const [patientCount, setPatientCount] = useState(0);
  const [isDashboardCardsLoading, setIsDashboardCardsLoading] = useState(true);
  const [wideLayout, setWideLayout] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 992px)').matches,
  );

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 992px)');
    const handler = () => setWideLayout(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (workspaceTab !== 'watchlist') {
      setSelectedFlag(null);
    }
  }, [workspaceTab]);

  useEffect(() => {
    let cancelled = false;

    const loadPatientCount = async () => {
      try {
        const patientList = await fetchAllPatients();

        if (!cancelled) {
          setPatientCount(patientList.length);
        }
      } catch {
        if (!cancelled) {
          setPatientCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsDashboardCardsLoading(false);
        }
      }
    };

    loadPatientCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = flagTab === 'all' ? flaggedIssues : flaggedIssues.filter((flag) => flag.type === flagTab);
  const criticalCount = flaggedIssues.filter((flag) => flag.severity === 'critical').length;
  const statisticCards = [
    {
      key: 'patients',
      title: 'Patients',
      value: `${patientCount}`,
      note: 'Total registered patients',
      Icon: FiUsers,
    },
    {
      key: 'nures',
      title: 'Nurses',
      value: '36',
      note: 'Active care staff',
      Icon: FiUser,
    },
    {
      key: 'emerency',
      title: 'Emerency',
      value: `${criticalCount}`,
      note: 'Active urgent cases',
      Icon: FiAlertTriangle,
    },
  ];

  const showDockedInspector = workspaceTab === 'watchlist' && wideLayout && selectedFlag && watchlistInspectorOpen;
  const showFlagModal = selectedFlag && (!wideLayout || workspaceTab !== 'watchlist' || !watchlistInspectorOpen);

  return (
    <motion.div className="page-wrapper dashboard-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="dashboard-shell">
        <div className="dashboard-workspace-bar" role="tablist" aria-label="Dashboard workspace">
          {WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={workspaceTab === tab.key}
              className={`dashboard-workspace-tab${workspaceTab === tab.key ? ' active' : ''}`}
              onClick={() => setWorkspaceTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div className="dashboard-welcome-banner dashboard-welcome-banner--compact" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.22 }}>
          <div className="dashboard-welcome-banner__lead">
            <span className="dashboard-welcome-banner__eyebrow">Dashboard</span>
            Welcome back — patient activity, workforce, and escalations.
          </div>
          <div className="dashboard-welcome-banner__date">{todayLabel}</div>
        </motion.div>

        {workspaceTab === 'overview' && (
          <>
            <div className="dashboard-top-grid">
              {statisticCards.map((card, index) => (
                <motion.div key={card.key} className="dashboard-stat-card" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.24, delay: 0.04 * index }}>
                  <div className="dashboard-section-header compact">
                    <div className="dashboard-stat-card__title">
                      <span className="dashboard-summary-card__icon"><card.Icon size={16} /></span>
                      <div>
                        <h4>{card.title}</h4>
                        {isDashboardCardsLoading ? (
                          <span className="dashboard-skeleton dashboard-skeleton--text dashboard-stat-card__skeleton-note" aria-hidden="true" />
                        ) : (
                          <p>{card.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="dashboard-stat-card__center">
                    {isDashboardCardsLoading ? (
                      <div className="dashboard-stat-card__loading" role="status" aria-live="polite" aria-label={`${card.title} data is loading`}>
                        <span className="dashboard-skeleton dashboard-skeleton--value" aria-hidden="true" />
                        <small>Loading data...</small>
                      </div>
                    ) : (
                      <strong>{card.value}</strong>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="dashboard-workspace-hint">Use the workspace tabs above for watchlist, live activity, and program budgets.</p>
          </>
        )}

        {workspaceTab === 'activity' && (
          <motion.div className="dashboard-activity-card" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.22 }}>
            <div className="dashboard-section-header compact">
              <div>
                <h4>Recent activity</h4>
                <p>Today</p>
              </div>
              <button type="button" className="dashboard-icon-ghost"><FiMoreHorizontal size={15} /></button>
            </div>
            <div className="dashboard-activity-list">
              {activityFeed.map((activity) => (
                <div key={`${activity.title}-${activity.time}`} className="dashboard-activity-item">
                  <div className={`dashboard-activity-item__avatar tone-${activity.accent}`}>{activity.title.split(' ')[0][0]}</div>
                  <div className="dashboard-activity-item__content">
                    <strong>{activity.title}</strong>
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {workspaceTab === 'programs' && (
          <motion.div className="dashboard-programs-card dashboard-programs-card--tall" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.22 }}>
            <div className="dashboard-section-header compact">
              <div>
                <h4>Care programs</h4>
                <p>Total savings</p>
              </div>
              <button type="button" className="dashboard-link-btn">+ Add Plan</button>
            </div>
            <div className="dashboard-programs-total">$84,500</div>
            <div className="dashboard-program-list">
              {carePrograms.map((program) => (
                <div key={program.name} className="dashboard-program-item">
                  <div className="dashboard-program-item__head">
                    <div className="dashboard-program-item__label">
                      <span className="dashboard-program-item__dot" />
                      <strong>{program.name}</strong>
                    </div>
                    <button type="button" className="dashboard-icon-ghost"><FiMoreHorizontal size={14} /></button>
                  </div>
                  <div className="dashboard-progress small"><span style={{ width: `${program.progress}%` }} /></div>
                  <div className="dashboard-program-item__meta">
                    <span>{program.current} · {program.progress}%</span>
                    <span>Target: {program.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {workspaceTab === 'watchlist' && (
          <motion.div
            className={`dashboard-watchlist-workspace${showDockedInspector ? '' : ' dashboard-watchlist-workspace--single'}`}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.22 }}
          >
            <div className="dashboard-watchlist-card dashboard-watchlist-card--workspace">
              <div className="dashboard-section-header dashboard-section-header--toolbar">
                <div>
                  <h4>Critical watchlist</h4>
                  <p>Flagged exceptions · {filtered.length} shown</p>
                </div>
                <div className="dashboard-watchlist-toolbar">
                  {wideLayout && (
                    <button
                      type="button"
                      className="dashboard-toolbar-btn"
                      onClick={() => setWatchlistInspectorOpen((o) => !o)}
                      title={watchlistInspectorOpen ? 'Hide detail pane' : 'Show detail pane'}
                    >
                      {watchlistInspectorOpen ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
                      <span>Detail</span>
                    </button>
                  )}
                  <div className="dashboard-watchlist-card__filters">
                    {FLAG_TABS.map((tab) => {
                      const count = tab.key === 'all' ? flaggedIssues.length : flaggedIssues.filter((issue) => issue.type === tab.key).length;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setFlagTab(tab.key)}
                          className={`dashboard-tab-pill${flagTab === tab.key ? ' active' : ''}`}
                        >
                          <span>{tab.label}</span>
                          <small>{count}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="dashboard-watchlist-table">
                <div className="dashboard-watchlist-table__head">
                  <span>Patient</span>
                  <span>Concern</span>
                  <span>Severity</span>
                  <span>Region</span>
                  <span>Date</span>
                  <span>Action</span>
                </div>
                <div className="dashboard-watchlist-table__body">
                  {filtered.map((flag) => {
                    const sev = severityStyle[flag.severity];
                    return (
                      <button
                        key={flag.id}
                        type="button"
                        className={`dashboard-watchlist-row${selectedFlag?.id === flag.id ? ' dashboard-watchlist-row--active' : ''}`}
                        onClick={() => {
                          setSelectedFlag(flag);
                          if (wideLayout) setWatchlistInspectorOpen(true);
                        }}
                      >
                        <span>
                          <strong>{flag.patient}</strong>
                          <small>{flag.patientId}</small>
                        </span>
                        <span>
                          <strong>{flag.type}</strong>
                          <small>{flag.reason}</small>
                        </span>
                        <span>
                          <em style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}>{flag.severity}</em>
                        </span>
                        <span>{flag.region}</span>
                        <span>{flag.flaggedDate}</span>
                        <span className="dashboard-watchlist-row__action">View</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {showDockedInspector && (
              <aside className="dashboard-flag-inspector" aria-label="Flag detail">
                <div className="dashboard-flag-inspector__inner">
                  <FlagDetailPanel flag={selectedFlag} onClose={() => setSelectedFlag(null)} dense />
                </div>
              </aside>
            )}
          </motion.div>
        )}
      </div>

      {showFlagModal && selectedFlag && (
        <div className="kh-modal-overlay" style={{ zIndex: 2000 }} onClick={() => setSelectedFlag(null)} role="presentation">
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 920, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-flag-detail-title"
          >
            <FlagDetailPanel flag={selectedFlag} onClose={() => setSelectedFlag(null)} dense={false} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
