import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiClock,
  FiSettings,
  FiLogOut,
  FiChevronRight,
  FiChevronLeft,
  FiActivity,
  FiAlertCircle,
  FiMessageCircle,
  FiBarChart2,
  FiFolder,
  FiAward,
  FiMoon,
  FiSun,
  FiCreditCard,
} from '../icons/hugeicons-feather';

const sidebarGroups = [
  {
    title: 'Menu',
    items: [
      { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
      { to: '/patients', icon: FiActivity, label: 'Patients' },
      { to: '/workforce', icon: FiUsers, label: 'Nurses' },
      { to: '/scheduling', icon: FiCalendar, label: 'Care Visits' },
      { to: '/enquiries', icon: FiMessageCircle, label: 'Enquiries' },
      { to: '/clinical', icon: FiAlertCircle, label: 'Emergency Cases' },
      { to: '/attendance', icon: FiClock, label: 'Attendance' },
      { to: '/reports', icon: FiFolder, label: 'Reports' },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/account', icon: FiSettings, label: 'Settings' },
      { to: '/billing', icon: FiCreditCard, label: 'Billing' },
    ],
  },
];

export default function Sidebar({
  isOpen,
  isCollapsed,
  sidebarWidth = 248,
  onSidebarResize,
  onClose,
  onToggleCollapse,
  onLogout,
  user,
  isDark = false,
  onToggleTheme,
}) {
  const resizeActive = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(sidebarWidth);

  useEffect(() => {
    const onMove = (e) => {
      if (!resizeActive.current || typeof onSidebarResize !== 'function') return;
      const dx = e.clientX - startXRef.current;
      const next = Math.min(320, Math.max(200, startWidthRef.current + dx));
      onSidebarResize(next);
    };
    const onUp = () => {
      if (!resizeActive.current) return;
      resizeActive.current = false;
      document.body.classList.remove('sidebar-resizing');
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onSidebarResize]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 991px)');
    const syncBodyScroll = () => {
      if (isOpen && mq.matches) {
        document.body.classList.add('kh-sidebar-drawer-open');
      } else {
        document.body.classList.remove('kh-sidebar-drawer-open');
      }
    };
    syncBodyScroll();
    mq.addEventListener('change', syncBodyScroll);
    return () => {
      mq.removeEventListener('change', syncBodyScroll);
      document.body.classList.remove('kh-sidebar-drawer-open');
    };
  }, [isOpen]);

  const handleResizePointerDown = (e) => {
    if (isCollapsed || typeof onSidebarResize !== 'function') return;
    e.preventDefault();
    resizeActive.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.classList.add('sidebar-resizing');
  };

  const agencyName = user?.agency?.name || user?.agencyName || user?.organizationName || user?.organisationName || 'Your agency';
  const planName = (() => {
    const raw = user?.plan ?? user?.subscriptionPlan ?? user?.planName ?? user?.tier ?? user?.agency?.plan;
    if (raw && typeof raw === 'object') {
      return String(raw.name || raw.label || raw.title || 'Standard').trim() || 'Standard';
    }
    const s = String(raw || '').trim();
    return s || 'Standard';
  })();
  const planLabel = planName.toLowerCase() === 'free' ? 'Free' : planName;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay d-lg-none"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar${isOpen ? ' open' : ''}${isCollapsed ? ' collapsed' : ''}`}
        style={isCollapsed ? undefined : { width: sidebarWidth }}
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <div className="sidebar-panel">
          <div className="sidebar-brand">
            <div className="sidebar-brand__identity">
              <img
                src={isCollapsed ? '/Blue_Logo Only.png' : '/Blue_Logo.png'}
                alt="CareSense"
                className="sidebar-brand__logo"
              />
            </div>

            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            {sidebarGroups.map((group) => (
              <div key={group.title} className="sidebar-group">
                {!isCollapsed && <div className="sidebar-group__title">{group.title}</div>}
                <div className="sidebar-group__items">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={`${group.title}-${item.to}-${item.label}`}
                        to={item.to}
                        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                        onClick={onClose}
                        title={item.label}
                      >
                        <span className="icon"><Icon size={18} /></span>
                        <span className="sidebar-link-label">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="sidebar-group sidebar-group--logout">
              {!isCollapsed && <div className="sidebar-group__title">Session</div>}
              {typeof onToggleTheme === 'function' && (
                <button
                  type="button"
                  className="sidebar-link sidebar-link--button sidebar-theme-toggle"
                  onClick={onToggleTheme}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <span className="icon">{isDark ? <FiSun size={18} /> : <FiMoon size={18} />}</span>
                  <span className="sidebar-link-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              )}
              <button type="button" className="sidebar-link sidebar-link--button" onClick={onLogout} title="Log out">
                <span className="icon"><FiLogOut size={18} /></span>
                <span className="sidebar-link-label">Log out</span>
              </button>
            </div>
          </nav>

          <div
            className="sidebar-plan-card"
            title={isCollapsed ? `${planLabel} · ${agencyName}` : undefined}
          >
            <div className="sidebar-plan-card__icon" aria-hidden>
              <FiAward size={18} />
            </div>
            {!isCollapsed && (
              <>
                <div className="sidebar-plan-card__body">
                  <span className="sidebar-plan-card__eyebrow">Current plan</span>
                  <p className="sidebar-plan-card__name">{planLabel}</p>
                  <p className="sidebar-plan-card__agency">{agencyName}</p>
                </div>
                <NavLink
                  to="/billing"
                  className="sidebar-plan-card__link"
                  onClick={onClose}
                  title="Plan and billing"
                >
                  <span>Manage plan</span>
                  <FiChevronRight size={14} aria-hidden />
                </NavLink>
              </>
            )}
          </div>

          {!isCollapsed && typeof onSidebarResize === 'function' && (
            <div
              className="sidebar-resize-handle"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              title="Drag to resize"
              onMouseDown={handleResizePointerDown}
            />
          )}
        </div>
      </motion.aside>
    </>
  );
}
