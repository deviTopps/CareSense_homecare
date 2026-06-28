import { useState, useEffect, useRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiSearch, FiMenu, FiLogOut, FiShield, FiHelpCircle, FiSettings, FiMessageCircle } from '../icons/hugeicons-feather';
import TopbarNotifications from './TopbarNotifications';
import { useTargetedGuide } from '../context/TargetedGuideContext';
import { isTargetedGuideDismissed } from '../context/TargetedGuideContext';

function displayNameFromUser(user) {
  if (!user) return 'Account';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (user.email && typeof user.email === 'string') return user.email.split('@')[0];
  return 'Account';
}

function avatarSrcFromUser(user) {
  if (!user) return null;
  const keys = ['avatarUrl', 'profileImageUrl', 'photoUrl', 'photo', 'avatar', 'image'];
  for (const k of keys) {
    const v = user[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

const pageMeta = {
  '/':           { title: 'Dashboard',              sub: 'Real-time homecare overview' },
  '/dashboard':  { title: 'Dashboard',              sub: 'Real-time homecare overview' },
  '/scheduling': { title: 'Care Visits',              sub: 'Schedule patient visits — weekly, biweekly & more' },
  '/nurse-scheduling': { title: 'Scheduling', sub: 'Nurse rotation scheduling & shift assignments' },
  '/clinical':   { title: 'Emergency Cases', sub: '' },
  '/workforce':  { title: 'Workforce',              sub: 'Manage nurse profiles & credentials' },
  '/attendance': { title: 'Attendance',              sub: 'GPS-verified visit records' },
  '/patients':   { title: 'Patients',                sub: 'Enrolment & records' },
  '/enquiries': { title: 'Enquiries', sub: '' },
  '/reports':   { title: 'Reports',                 sub: 'Generated medical reports' },
  '/finance':   { title: 'Finance',                 sub: 'Patient billing rates and invoice creation' },
  '/invoices-payments': { title: 'Invoices & payments', sub: 'Manage invoices, record payments, and track collections' },
  '/billing':   { title: 'Billing',                 sub: 'Manage billing information and view receipts' },
  '/account':   { title: 'Settings',                sub: 'Account and preferences' },
};

export default function Topbar({ onToggleSidebar, onLogout, user }) {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] || pageMeta['/'];
  const { startGuide } = useTargetedGuide();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const displayName = displayNameFromUser(user);
  const avatarSrc = avatarSrcFromUser(user);
  const initials = user
    ? `${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}`.toUpperCase() || (user.email?.[0] || '?').toUpperCase()
    : '?';

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onDoc = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [userMenuOpen]);

  useEffect(() => {
    if (pathname !== '/dashboard' || isTargetedGuideDismissed()) return undefined;
    const timer = window.setTimeout(() => startGuide(), 800);
    return () => window.clearTimeout(timer);
  }, [pathname, startGuide]);

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
          {meta.sub ? <p>{meta.sub}</p> : null}
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search..." className="input input-bordered input-sm" />
        </div>

        <TopbarNotifications />

        <NavLink
          to="/enquiries"
          className={({ isActive }) =>
            `badge badge-neutral badge-outline topbar-enquiry-cta${isActive ? ' topbar-enquiry-cta--active' : ''}`
          }
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: '0 12px',
            height: 28,
            gap: 6,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          
          <FiMessageCircle size={13} aria-hidden />
          <span className="topbar-enquiry-cta__text topbar-enquiry-cta__text--long">Create an Enquiry</span>
          <span className="topbar-enquiry-cta__text topbar-enquiry-cta__text--short" aria-hidden="true">
            Enquiry
          </span>
        </NavLink>
        <div className="topbar-divider" aria-hidden="true" />

        <button
          type="button"
          className="topbar-text-btn topbar-aux-btn"
          aria-label="Open platform guide"
          data-guide="topbar-guide"
          onClick={startGuide}
        >
          <FiHelpCircle size={14} aria-hidden />
          <span className="topbar-aux-label">Guide</span>
        </button>
        <button type="button" className="topbar-text-btn topbar-aux-btn" aria-label="Policy">
          <FiShield size={14} aria-hidden />
          <span className="topbar-aux-label">Policy</span>
        </button>
        <div className="topbar-user-menu" ref={userMenuRef}>
          <button
            type="button"
            className="topbar-user-pill"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <span className="topbar-user-pill__avatar" aria-hidden>
              {avatarSrc ? (
                <img src={avatarSrc} alt="" />
              ) : (
                <span className="topbar-user-pill__initials">{initials}</span>
              )}
            </span>
            <span className="topbar-user-pill__name" title={displayName}>
              {displayName}
            </span>
          </button>
          {userMenuOpen && (
            <div className="topbar-user-menu__dropdown" role="menu">
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `topbar-user-menu__item${isActive ? ' topbar-user-menu__item--active' : ''}`
                }
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                <FiSettings size={14} />
                Account
              </NavLink>
              <button
                type="button"
                className="topbar-user-menu__item topbar-user-menu__item--danger"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
              >
                <FiLogOut size={14} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
