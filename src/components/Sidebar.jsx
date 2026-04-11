import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  FiGrid, FiCalendar, FiFileText, FiUsers, FiClock,
  FiSettings, FiLogOut, FiChevronDown, FiChevronRight, FiList, FiUserMinus, FiActivity, FiAlertCircle,
  FiMessageSquare, FiMessageCircle, FiRepeat, FiUser, FiCreditCard, FiSmartphone
} from 'react-icons/fi';

const navItems = [
  { label: 'OVERVIEW', type: 'section' },
  { to: '/',           icon: <FiGrid />,     label: 'Dashboard' },
  { to: '/patients',   icon: <FiActivity />, label: 'Patients' },
  { to: '/workforce',  icon: <FiUsers />,    label: 'Nurses' },
  { label: 'OPERATIONS', type: 'section' },
  { to: '/scheduling', icon: <FiCalendar />, label: 'Care Visits' },
  { to: '/nurse-scheduling', icon: <FiRepeat />, label: 'Scheduling' },
  { to: '/clinical',   icon: <FiAlertCircle />, label: 'Emergency Cases' },
  { to: '/attendance', icon: <FiClock />,    label: 'Attendance' },
  { label: 'SUPPORT', type: 'section' },
  { to: '/complaints', icon: <FiMessageSquare />, label: 'Complaints' },
  { to: '/feedback',   icon: <FiMessageCircle />, label: 'Feedback' },
  { label: 'SETTINGS', type: 'section' },
  { to: '/account',  icon: <FiUser />,       label: 'Account' },
  { to: '/billing',  icon: <FiCreditCard />, label: 'Billing' },
];

export default function Sidebar({ isOpen, onClose, onLogout, user }) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin';
  const initials = user ? `${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}`.toUpperCase() : 'U';

  return (
    <>
      {isOpen && <div className="sidebar-overlay d-lg-none" onClick={onClose} />}
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <img src="/Blue_Logo.png" alt="Kulobal Homecare" className="brand-logo" />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.type === 'section' ? (
              <div key={i} className="sidebar-section-label">{item.label}</div>
            ) : item.type === 'dropdown' ? (
              <div key={item.key}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
                  className={`sidebar-link${openDropdown === item.key ? ' active' : ''}`}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', textAlign: 'left',
                    padding: '10px 20px', fontSize: 15, fontWeight: 500,
                    color: openDropdown === item.key ? '#45B6FE' : 'var(--kh-text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span className="icon">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <FiChevronRight size={14} style={{
                    transition: 'transform 0.2s',
                    transform: openDropdown === item.key ? 'rotate(90deg)' : 'rotate(0deg)',
                  }} />
                </button>
                {openDropdown === item.key && (
                  <div style={{ paddingLeft: 20 }}>
                    {item.children.map(child => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `sidebar-link${isActive ? ' active' : ''}`
                        }
                        onClick={onClose}
                        style={{ fontSize: 14, padding: '8px 20px' }}
                      >
                        <span className="icon" style={{ fontSize: 15 }}>{child.icon}</span>
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
                onClick={onClose}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* Upgrade */}
        <div style={{
          margin: '0 14px 16px',
          border: '1.5px solid var(--kh-primary)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {/* Top accent strip */}
          <div style={{ background: 'var(--kh-primary)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiSmartphone size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', letterSpacing: '0.2px' }}>Nurse Mobile App</span>
          </div>
          {/* Body */}
          <div style={{ padding: '12px 14px', background: '#fff' }}>
            <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              Give nurses access to <strong style={{ color: 'var(--kh-text)' }}>schedules, visits &amp; reports</strong> on the go.
            </div>
            <NavLink
              to="/billing"
              style={{
                display: 'block', textAlign: 'center', padding: '7px 0',
                borderRadius: 7, background: 'var(--kh-primary)',
                color: '#fff', fontWeight: 700, fontSize: 12,
                textDecoration: 'none', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--kh-primary-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--kh-primary)'}
            >
              Download Nurse App →
            </NavLink>
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info" style={{ cursor: 'pointer' }}>
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1 }}>
              <div className="user-name">{displayName}</div>
              <div className="user-role">{displayRole}</div>
            </div>
            <button onClick={onLogout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
              <FiLogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
