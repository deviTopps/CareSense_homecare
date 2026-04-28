import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  FiUsers,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
  FiHeart,
  FiX,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiTrendingUp,
  FiBell,
  FiMoreHorizontal,
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

const severityStyle = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
};

const summaryCards = [
  { label: "Today's Visits", value: '128', delta: '+17.8%', detail: '14 waiting for check-in', Icon: FiCalendar, tone: 'green' },
  { label: 'Care Revenue', value: '$43,000', delta: '-3.9%', detail: 'This month billing progress', Icon: FiTrendingUp, tone: 'rose' },
  { label: 'Time Saved', value: '56 hrs', delta: '+12.4%', detail: 'Saved by automation this month', Icon: FiCheckCircle, tone: 'lime' },
];

const quickActions = [
  { label: 'Admit', Icon: FiUsers },
  { label: 'Schedule', Icon: FiCalendar },
  { label: 'Vitals', Icon: FiHeart },
  { label: 'History', Icon: FiFileText },
];

const visitFlow = [
  { month: 'Jan', completed: 62, missed: 28 },
  { month: 'Feb', completed: 48, missed: 22 },
  { month: 'Mar', completed: 54, missed: 20 },
  { month: 'Apr', completed: 70, missed: 16 },
  { month: 'May', completed: 51, missed: 25 },
  { month: 'Jun', completed: 57, missed: 14 },
  { month: 'Jul', completed: 43, missed: 19 },
  { month: 'Aug', completed: 49, missed: 24 },
  { month: 'Sep', completed: 72, missed: 20 },
  { month: 'Oct', completed: 58, missed: 18 },
  { month: 'Nov', completed: 39, missed: 26 },
  { month: 'Dec', completed: 53, missed: 17 },
];

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

const statisticBreakdown = [
  { label: 'Routine Visits', value: '$2,100', percent: 60, tone: 'green' },
  { label: 'Critical Care', value: '$525', percent: 15, tone: 'lime' },
  { label: 'Education', value: '$420', percent: 12, tone: 'gray' },
  { label: 'Nutrition', value: '$280', percent: 8, tone: 'slate' },
  { label: 'Medication', value: '$175', percent: 5, tone: 'light' },
];

const donutStyle = {
  background: 'conic-gradient(#1f5e59 0 60%, #b7ff5a 60% 75%, #d6dde6 75% 87%, #eef2f6 87% 95%, #f7f9fb 95% 100%)',
};

export default function Dashboard() {
  const [flagTab, setFlagTab] = useState('all');
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [patientCount, setPatientCount] = useState(0);

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
      }
    };

    loadPatientCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = flagTab === 'all' ? flaggedIssues : flaggedIssues.filter((flag) => flag.type === flagTab);
  const criticalCount = flaggedIssues.filter((flag) => flag.severity === 'critical').length;

  return (
    <motion.div className="page-wrapper dashboard-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="dashboard-shell">
        <div className="dashboard-top-grid">
          <div className="dashboard-primary-column">
            <motion.div className="dashboard-agency-card" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28 }}>
              <div className="dashboard-agency-card__header">
                <div className="dashboard-agency-brand">
                  <span className="dashboard-agency-brand__icon"><FiActivity size={16} /></span>
                  <span>Agency Pulse</span>
                </div>
                <FiBell size={16} />
              </div>
              <div className="dashboard-agency-card__body">
                <div className="dashboard-agency-card__eyebrow">Kulobal Homecare</div>
                <h2>Ama Asante</h2>
                <p>Executive overview of patients, nurses, flagged cases, and operational health across the agency.</p>
              </div>
              <div className="dashboard-agency-card__stats">
                <div>
                  <span>Total Patients</span>
                  <strong>{patientCount}</strong>
                </div>
                <div>
                  <span>Critical Flags</span>
                  <strong>{criticalCount}</strong>
                </div>
                <div>
                  <span>Active Nurses</span>
                  <strong>36</strong>
                </div>
              </div>
              <div className="dashboard-quick-actions">
                {quickActions.map(({ label, Icon }) => (
                  <button key={label} type="button" className="dashboard-quick-actions__item">
                    <span><Icon size={15} /></span>
                    <small>{label}</small>
                  </button>
                ))}
              </div>
            </motion.div>

            <div className="dashboard-summary-cluster">
              <div className="dashboard-summary-grid">
                {summaryCards.map(({ label, value, delta, detail, Icon, tone }, index) => (
                  <motion.div key={label} className={`dashboard-summary-card tone-${tone}`} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, delay: 0.04 * index }}>
                    <div className="dashboard-summary-card__top">
                      <span className="dashboard-summary-card__icon"><Icon size={16} /></span>
                      <button type="button" className="dashboard-icon-ghost"><FiMoreHorizontal size={15} /></button>
                    </div>
                    <div className="dashboard-summary-card__delta">{delta}</div>
                    <div className="dashboard-summary-card__value">{value}</div>
                    <div className="dashboard-summary-card__label">{label}</div>
                    <div className="dashboard-summary-card__detail">{detail}</div>
                  </motion.div>
                ))}
              </div>

              <motion.div className="dashboard-limit-card" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, delay: 0.16 }}>
                <div className="dashboard-section-header compact">
                  <div>
                    <h4>Care Capacity</h4>
                    <p>Visits completed vs monthly target</p>
                  </div>
                  <button type="button" className="dashboard-icon-ghost"><FiMoreHorizontal size={15} /></button>
                </div>
                <div className="dashboard-limit-card__numbers">
                  <span>$2,500.00 spent of $20,000.00</span>
                  <strong>12.5%</strong>
                </div>
                <div className="dashboard-progress"><span style={{ width: '12.5%' }} /></div>
              </motion.div>
            </div>
          </div>

          <div className="dashboard-sidebar-column">
            <motion.div className="dashboard-stat-card" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, delay: 0.12 }}>
              <div className="dashboard-section-header compact">
                <div>
                  <h4>Statistic</h4>
                  <p>This Month</p>
                </div>
                <button type="button" className="dashboard-filter-chip">This Month</button>
              </div>
              <div className="dashboard-stat-card__legend">
                <span>Income ($4,800)</span>
                <span>Expense ($3,500)</span>
              </div>
              <div className="dashboard-donut" style={donutStyle}>
                <div className="dashboard-donut__inner">
                  <small>Total Expenses</small>
                  <strong>$3,500</strong>
                </div>
              </div>
              <div className="dashboard-breakdown-list">
                {statisticBreakdown.map((item) => (
                  <div key={item.label} className="dashboard-breakdown-item">
                    <div className="dashboard-breakdown-item__left">
                      <span className={`dashboard-breakdown-item__badge tone-${item.tone}`}>{item.percent}%</span>
                      <span>{item.label}</span>
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="dashboard-activity-card" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, delay: 0.22 }}>
              <div className="dashboard-section-header compact">
                <div>
                  <h4>Recent Activity</h4>
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
          </div>
        </div>

        <div className="dashboard-main-grid">
          <motion.div className="dashboard-flow-card" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, delay: 0.18 }}>
            <div className="dashboard-section-header">
              <div>
                <h4>Visit Flow</h4>
                <p>Total balance</p>
              </div>
              <button type="button" className="dashboard-filter-chip">This Year</button>
            </div>
            <div className="dashboard-flow-card__summary">
              <div>
                <span>Total Balance</span>
                <strong>$562,000</strong>
              </div>
              <div className="dashboard-flow-card__insight">
                <div>
                  <span>June 2026</span>
                  <strong>Income $6,000</strong>
                </div>
                <div>
                  <span>Expense</span>
                  <strong>$4,000</strong>
                </div>
              </div>
              <div className="dashboard-flow-card__keys">
                <span><i className="tone-green" />Income</span>
                <span><i className="tone-lime" />Expense</span>
              </div>
            </div>
            <div className="dashboard-bar-chart">
              {visitFlow.map((item) => (
                <div key={item.month} className="dashboard-bar-chart__item">
                  <div className="dashboard-bar-chart__bars">
                    <span className="bar-positive" style={{ height: `${item.completed}%` }} />
                    <span className="bar-negative" style={{ height: `${item.missed}%` }} />
                  </div>
                  <small>{item.month}</small>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="dashboard-programs-card dashboard-programs-card--tall" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, delay: 0.2 }}>
            <div className="dashboard-section-header compact">
              <div>
                <h4>Care Programs</h4>
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

          <motion.div className="dashboard-watchlist-card" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, delay: 0.26 }}>
            <div className="dashboard-section-header">
              <div>
                <h4>Critical Watchlist</h4>
                <p>Flagged patient exceptions and operational alerts</p>
              </div>
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
                    <button key={flag.id} type="button" className="dashboard-watchlist-row" onClick={() => setSelectedFlag(flag)}>
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
          </motion.div>
        </div>
      </div>

      {selectedFlag && (
        <div className="kh-modal-overlay" style={{ zIndex: 2000 }} onClick={() => setSelectedFlag(null)}>
          <div onClick={(event) => event.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 920, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiAlertTriangle size={18} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Flagged Alert — {selectedFlag.id}</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280' }}>{selectedFlag.type} · {selectedFlag.severity.toUpperCase()}</div>
                </div>
              </div>
              <button onClick={() => setSelectedFlag(null)} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '8px 10px', cursor: 'pointer', color: '#6b7280', display: 'flex' }}><FiX size={16} /></button>
            </div>

            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', background: '#fcfcfd' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1f5e59', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                  {selectedFlag.patient.split(' ').map((name) => name[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--kh-text)' }}>{selectedFlag.patient}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flagged</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <span><FiMapPin size={11} style={{ marginRight: 4 }} />{selectedFlag.region}</span>
                    <span><FiPhone size={11} style={{ marginRight: 4 }} />Assigned Nurse: {selectedFlag.nurse}</span>
                    <span>Patient ID: <strong>{selectedFlag.patientId}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 24px', background: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c2410c', marginBottom: 5 }}>Flag Reason</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#9a3412' }}>{selectedFlag.reason}</div>
            </div>

            <div style={{ padding: '22px 24px' }}>
              <div className="row g-4">
                <div className="col-lg-7">
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: 14 }}>Patient Activity Timeline</div>
                  {selectedFlag.activities.map((activity, index) => (
                    <div key={`${activity.time}-${activity.action}`} className="d-flex gap-3">
                      <div className="d-flex flex-column align-items-center" style={{ width: 20 }}>
                        <div style={{ width: 11, height: 11, borderRadius: '50%', background: activity.status === 'alert' ? '#ef4444' : activity.status === 'done' ? '#1f5e59' : '#ca8a04', border: `2px solid ${activity.status === 'alert' ? '#fecaca' : activity.status === 'done' ? '#bbf7d0' : '#fde68a'}` }} />
                        {index < selectedFlag.activities.length - 1 && <div style={{ width: 2, flex: 1, background: '#e5e7eb', minHeight: 32 }} />}
                      </div>
                      <div style={{ paddingBottom: 16, flex: 1 }}>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--kh-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{activity.time}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{activity.action}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', marginTop: 3 }}>{activity.note}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="col-lg-5">
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: 14 }}>Current Vitals</div>
                  <div className="row g-2 mb-4">
                    {Object.entries(selectedFlag.vitals).map(([key, value]) => {
                      const labels = { bp: 'Blood Pressure', sugar: 'Blood Sugar', pulse: 'Pulse', temp: 'Temperature', spo2: 'SPO2' };
                      const isFlag = (key === 'bp' && parseInt(value, 10) >= 140) || (key === 'sugar' && parseFloat(value) > 7) || (key === 'spo2' && parseInt(value, 10) < 95);
                      return (
                        <div key={key} className="col-6">
                          <div style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 16, background: isFlag ? '#fef2f2' : '#fafbfc' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--kh-text-muted)' }}>{labels[key] || key}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: isFlag ? '#dc2626' : 'var(--kh-text)', marginTop: 4 }}>{value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: 10 }}>Active Medications</div>
                  {selectedFlag.medications.map((medication) => (
                    <div key={medication} className="d-flex align-items-center gap-2" style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#84cc16', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)' }}>{medication}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--kh-text-muted)', marginBottom: 8 }}>Diagnosis</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{selectedFlag.diagnosis}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>Flagged by <strong>{selectedFlag.flaggedBy}</strong> on {selectedFlag.flaggedDate}</div>
              <div className="d-flex gap-2">
                <button onClick={() => setSelectedFlag(null)} className="btn btn-kh-outline" style={{ fontSize: 12.5 }}>Close</button>
                <button className="btn btn-kh-primary" style={{ fontSize: 12.5, background: '#ef4444', borderColor: '#ef4444' }}>Resolve Flag</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
