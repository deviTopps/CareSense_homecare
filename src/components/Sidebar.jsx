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
  FiMessageSquare,
  FiMessageCircle,
  FiRepeat,
  FiCreditCard,
  FiSmartphone,
  FiHelpCircle,
} from '../icons/hugeicons-feather';

const sidebarGroups = [
  {
    title: 'Menu',
    items: [
      { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
      { to: '/patients', icon: FiActivity, label: 'Patients' },
      { to: '/workforce', icon: FiUsers, label: 'Nurses' },
      { to: '/scheduling', icon: FiCalendar, label: 'Care Visits' },
      { to: '/nurse-scheduling', icon: FiRepeat, label: 'Scheduling' },
      { to: '/clinical', icon: FiAlertCircle, label: 'Emergency Cases' },
      { to: '/attendance', icon: FiClock, label: 'Attendance' },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/account', icon: FiSettings, label: 'Settings' },
      { to: '/billing', icon: FiCreditCard, label: 'Billing' },
      { to: '/feedback', icon: FiHelpCircle, label: 'Help & Support' },
      { to: '/complaints', icon: FiMessageSquare, label: 'Complaints' },
      { to: '/feedback', icon: FiMessageCircle, label: 'Feedback' },
    ],
  },
];

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse, onLogout, user }) {
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Kulobal Care';
  const agencyName = user?.agency?.name || user?.agencyName || user?.organizationName || user?.organisationName || 'Agency Name';
  const initials = user ? `${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}`.toUpperCase() : 'KC';

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
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <div className="sidebar-panel">
          <div className="sidebar-brand">
            {!isCollapsed && (
              <div className="sidebar-brand__identity">
                <span className="sidebar-brand__mark">
                  <span />
                  <span />
                </span>
                <div className="sidebar-brand__copy">
                  <small>CareSense</small>
                  <strong>{displayName}</strong>
                </div>
              </div>
            )}

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
              <button type="button" className="sidebar-link sidebar-link--button" onClick={onLogout} title="Log out">
                <span className="icon"><FiLogOut size={18} /></span>
                <span className="sidebar-link-label">Log out</span>
              </button>
            </div>
          </nav>

          <div className="sidebar-upgrade-card">
            <div className="sidebar-upgrade-card__icon">
              <div>
                <FiSmartphone size={16} />
              </div>
            </div>
            <div className="sidebar-upgrade-card__content">
              <span className="sidebar-upgrade-card__eyebrow">Current plan :</span>
              <strong>Free trial</strong>
              <p>Collaborate on your finances. Upgrade to Shared Budget.</p>
            </div>
            <NavLink to="/billing" className="sidebar-upgrade-card__action" title="Upgrade plan">
              <span className="sidebar-link-label">{agencyName}</span>
            </NavLink>
            {isCollapsed && <span className="sidebar-upgrade-card__initials">{initials}</span>}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
