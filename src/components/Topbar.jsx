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
          <input type="text" placeholder="Search..." className="input input-bordered input-sm" />
        </div>

        <motion.button
          className="topbar-icon-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          style={{ position: 'relative' }}
        >
          <FiBell size={18} />
          <span className="badge-dot"></span>
        </motion.button>

        <div className="badge badge-neutral badge-outline" style={{ fontSize: 11.5, fontWeight: 600, padding: '0 10px', height: 28 }}>
          {today}
        </div>

        <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 4px' }} />

        <button className="topbar-text-btn">
          <FiHelpCircle size={14} />
          <span>Help</span>
        </button>
        <button className="topbar-text-btn">
          <FiShield size={14} />
          <span>Policy</span>
        </button>
        <button className="topbar-text-btn topbar-text-btn--danger" onClick={onLogout}>
          <FiLogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </motion.header>
  );
}
