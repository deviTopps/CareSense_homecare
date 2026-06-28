import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiBell, FiCalendar, FiClock } from '../icons/hugeicons-feather';
import { fetchTopbarNotifications } from '../utils/topbarNotifications';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'medication', label: 'Medication reminders' },
  { id: 'visit', label: 'Care visits' },
];

const REFRESH_MS = 5 * 60 * 1000;

export default function TopbarNotifications() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, medication: 0, visit: 0 });

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTopbarNotifications();
      setItems(result.items);
      setCounts({
        total: result.totalCount,
        medication: result.medicationCount,
        visit: result.visitCount,
      });
    } catch (e) {
      setError(e?.message || 'Could not load notifications.');
      setItems([]);
      setCounts({ total: 0, medication: 0, visit: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;
    loadNotifications();
    const onDoc = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, loadNotifications]);

  const visibleItems = items.filter((item) => filter === 'all' || item.kind === filter);

  const handleItemClick = (item) => {
    setOpen(false);
    if (item.href) navigate(item.href);
  };

  return (
    <div className="topbar-notifications" ref={panelRef}>
      <motion.button
        type="button"
        className="topbar-icon-btn"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${counts.total ? `, ${counts.total} items` : ''}`}
        onClick={() => setOpen((value) => !value)}
      >
        <FiBell size={18} />
        {counts.total > 0 && (
          <span className="topbar-notifications__badge" aria-hidden>
            {counts.total > 99 ? '99+' : counts.total}
          </span>
        )}
      </motion.button>

      {open && (
        <div className="topbar-notifications__panel" role="dialog" aria-label="Notifications">
          <header className="topbar-notifications__header">
            <div>
              <h3 className="topbar-notifications__title">Notifications</h3>
              <p className="topbar-notifications__subtitle">
                Medication reminders and upcoming care visits
              </p>
            </div>
            <button
              type="button"
              className="topbar-notifications__refresh"
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </header>

          <div className="topbar-notifications__filters" role="tablist" aria-label="Notification filters">
            {FILTERS.map((entry) => {
              const count = entry.id === 'all'
                ? counts.total
                : entry.id === 'medication'
                  ? counts.medication
                  : counts.visit;

              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === entry.id}
                  className={`topbar-notifications__filter${filter === entry.id ? ' is-active' : ''}`}
                  onClick={() => setFilter(entry.id)}
                >
                  {entry.label}
                  <span className="topbar-notifications__filter-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="topbar-notifications__body">
            {error && (
              <p className="topbar-notifications__message topbar-notifications__message--error">{error}</p>
            )}

            {!error && loading && visibleItems.length === 0 && (
              <p className="topbar-notifications__message">Loading notifications…</p>
            )}

            {!error && !loading && visibleItems.length === 0 && (
              <p className="topbar-notifications__message">
                {filter === 'medication' && 'No medication reminders scheduled.'}
                {filter === 'visit' && 'No upcoming care visits in the next two weeks.'}
                {filter === 'all' && 'You are all caught up. No reminders or visits right now.'}
              </p>
            )}

            <ul className="topbar-notifications__list">
              {visibleItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`topbar-notifications__item topbar-notifications__item--${item.kind}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="topbar-notifications__item-icon" aria-hidden>
                      {item.kind === 'medication' ? <FiClock size={14} /> : <FiCalendar size={14} />}
                    </span>
                    <span className="topbar-notifications__item-content">
                      <span className="topbar-notifications__item-title">{item.title}</span>
                      <span className="topbar-notifications__item-meta">{item.meta}</span>
                      <span className="topbar-notifications__item-detail">{item.detail}</span>
                    </span>
                    <span className="topbar-notifications__item-tag">
                      {item.kind === 'medication' ? 'Medication' : 'Visit'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <footer className="topbar-notifications__footer">
            <NavLink to="/scheduling" className="topbar-notifications__footer-link" onClick={() => setOpen(false)}>
              View care visits
            </NavLink>
            <NavLink to="/patients" className="topbar-notifications__footer-link" onClick={() => setOpen(false)}>
              View patients
            </NavLink>
          </footer>
        </div>
      )}
    </div>
  );
}
