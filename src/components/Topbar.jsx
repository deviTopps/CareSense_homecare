import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiSearch, FiBell, FiMenu, FiLogOut, FiShield, FiHelpCircle } from '../icons/hugeicons-feather';

const pageMeta = {
  '/':           { title: 'Dashboard',              sub: 'Real-time homecare overview' },
  '/scheduling': { title: 'Care Visits',              sub: 'Schedule patient visits — weekly, biweekly & more' },
  '/nurse-scheduling': { title: 'Scheduling', sub: 'Nurse rotation scheduling & shift assignments' },
  '/clinical':   { title: 'Emergency Cases', sub: 'Critical alerts & emergency documentation' },
  '/workforce':  { title: 'Workforce',              sub: 'Manage nurse profiles & credentials' },
  '/attendance': { title: 'Attendance',              sub: 'GPS-verified visit records' },
  '/patients':   { title: 'Patients',                sub: 'Enrolment & records' },
  '/complaints': { title: 'Complaints',             sub: 'Track & resolve patient complaints' },
  '/feedback':   { title: 'Feedback',                sub: 'Patient satisfaction & reviews' },
};

export default function Topbar({ onToggleSidebar, onLogout }) {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] || pageMeta['/'];
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  const smallBtnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', fontSize: 11.5, fontWeight: 600,
    borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
    background: '#fff', border: '1px solid #d1d5db', color: 'var(--kh-text-muted)',
    whiteSpace: 'nowrap',
  };

  return (
    <motion.header
      className="topbar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <FiMenu />
        </button>
        <div>
          <h4>{meta.title}</h4>
          <p>{meta.sub}</p>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>

        <motion.button className="topbar-icon-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
          <FiBell />
          <span className="badge-dot"></span>
        </motion.button>

        <div style={{
          fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500,
          padding: '5px 12px', background: 'var(--kh-light)', borderRadius: 2,
          whiteSpace: 'nowrap',
        }}>
          {today}
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

        <button style={smallBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0F7FE'; e.currentTarget.style.borderColor = '#45B6FE'; e.currentTarget.style.color = '#45B6FE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = 'var(--kh-text-muted)'; }}
        >
          <FiHelpCircle size={13} /> Help
        </button>
        <button style={smallBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0F7FE'; e.currentTarget.style.borderColor = '#45B6FE'; e.currentTarget.style.color = '#45B6FE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = 'var(--kh-text-muted)'; }}
        >
          <FiShield size={13} /> Policy
        </button>
        <button style={{ ...smallBtnStyle, background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
          onClick={onLogout}
          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
        >
          <FiLogOut size={13} /> Logout
        </button>
      </div>
    </motion.header>
  );
}
