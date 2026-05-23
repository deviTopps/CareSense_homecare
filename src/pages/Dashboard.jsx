import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiAlertTriangle,
  FiUser,
  FiUsers,
  FiMessageCircle,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiActivity,
  FiTrendingUp,
  FiArrowRight,
} from '../icons/hugeicons-feather';
import { fetchAllPatients } from '../utils/patients';
import { fetchEnquiries, extractEnquiriesList } from '../utils/enquiries';
import {
  getUser,
  fetchDashboardSummary,
  normalizeDashboardSummary,
  fetchPendingAlerts,
} from '../api';
import { extractAlertsFromPayload, mapAlertToCase } from '../utils/alertMapping';
import DashboardAlertModal from '../components/DashboardAlertModal';

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

const FALLBACK_URGENT_COUNT = 0;

const SEVERITY_CONFIG = {
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444' },
  high: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', dot: '#f97316' },
  medium: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a', dot: '#eab308' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTodayDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  return (
    <span
      className="db2-severity-badge"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <span className="db2-severity-dot" style={{ background: cfg.dot }} />
      {severity}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const accountUser = getUser();

  const [patientCount, setPatientCount] = useState(0);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [nurseCount, setNurseCount] = useState(0);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [cardsLoading, setCardsLoading] = useState(true);

  const [watchlistFlags, setWatchlistFlags] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState('');
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [flagTab, setFlagTab] = useState('all');

  const on401 = useCallback(() => navigate('/login', { replace: true }), [navigate]);

  useEffect(() => {
    let cancelled = false;
    const loadCards = async () => {
      setCardsLoading(true);
      try {
        const res = await fetchDashboardSummary(on401);
        const json = await parseJsonResponse(res);
        if (cancelled) return;
        if (!res.ok) throw new Error(json?.message || json?.error || 'Dashboard summary unavailable');
        const s = normalizeDashboardSummary(json);
        setPatientCount(s.patients);
        setEnquiryCount(s.enquiries);
        setNurseCount(s.nurses);
        setEmergencyCount(s.emergency);
      } catch {
        if (cancelled) return;
        try {
          const [patientsRes, enquiriesRes] = await Promise.allSettled([
            fetchAllPatients(),
            fetchEnquiries({ page: 1, limit: 100 }, on401),
          ]);
          if (patientsRes.status === 'fulfilled') {
            setPatientCount(Array.isArray(patientsRes.value) ? patientsRes.value.length : 0);
          } else {
            setPatientCount(0);
          }
          if (enquiriesRes.status === 'fulfilled') {
            const list = extractEnquiriesList(enquiriesRes.value);
            setEnquiryCount(Array.isArray(list) ? list.length : list && typeof list === 'object' ? 1 : 0);
          } else {
            setEnquiryCount(0);
          }
        } catch {
          setPatientCount(0);
          setEnquiryCount(0);
        }
        setNurseCount(36);
        setEmergencyCount(FALLBACK_URGENT_COUNT);
      } finally {
        if (!cancelled) setCardsLoading(false);
      }
    };
    loadCards();
    return () => { cancelled = true; };
  }, [on401]);

  const loadAlerts = useCallback(async () => {
    setWatchlistLoading(true);
    setWatchlistError('');
    try {
      const res = await fetchPendingAlerts({ page: 1, limit: 100 }, on401);
      const json = await parseJsonResponse(res);
      if (!res.ok) throw new Error(json?.message || json?.error || `Could not load alerts (${res.status})`);
      const rawList = extractAlertsFromPayload(json);
      setWatchlistFlags(rawList.map((row, i) => mapAlertToCase(row, i)));
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setWatchlistError(e.message || 'Could not load pending alerts.');
      }
      setWatchlistFlags([]);
    } finally {
      setWatchlistLoading(false);
    }
  }, [on401]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const watchlistTypeTabs = useMemo(() => {
    const types = [...new Set(watchlistFlags.map((f) => f.type).filter(Boolean))].sort();
    return [{ key: 'all', label: 'All' }, ...types.map((t) => ({ key: t, label: t }))];
  }, [watchlistFlags]);

  const filtered = useMemo(() => {
    if (flagTab === 'all') return watchlistFlags;
    return watchlistFlags.filter((f) => f.type === flagTab);
  }, [watchlistFlags, flagTab]);

  const displayName =
    [accountUser?.firstName, accountUser?.lastName].filter(Boolean).join(' ') ||
    accountUser?.email?.split('@')[0] ||
    'there';

  const statCards = [
    { key: 'patients', label: 'Total Patients', value: patientCount, icon: FiUsers, color: '#2e8fd4', bg: '#eff6ff', to: '/patients' },
    { key: 'enquiries', label: 'Enquiries', value: enquiryCount, icon: FiMessageCircle, color: '#7c3aed', bg: '#f5f3ff', to: '/enquiries' },
    { key: 'nurses', label: 'Active Nurses', value: nurseCount, icon: FiUser, color: '#059669', bg: '#ecfdf5', to: '/workforce' },
    { key: 'emergency', label: 'Emergency Cases', value: emergencyCount, icon: FiAlertTriangle, color: '#dc2626', bg: '#fef2f2', to: '/clinical' },
  ];

  const quickLinks = [
    { label: 'Patients', to: '/patients', icon: FiActivity },
    { label: 'Care Visits', to: '/scheduling', icon: FiCalendar },
    { label: 'Attendance', to: '/attendance', icon: FiClock },
    { label: 'Reports', to: '/reports', icon: FiTrendingUp },
  ];

  return (
    <motion.div
      className="page-wrapper db2-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="db2-header">
        <div className="db2-header__text">
          <h1 className="db2-header__greeting">{getGreeting()}, {displayName}</h1>
          <p className="db2-header__date">{formatTodayDate()}</p>
        </div>
        <button
          type="button"
          className="db2-header__cta"
          onClick={() => navigate('/patients?admit=1')}
        >
          + Admit New Patient
        </button>
      </div>

      {/* Stat cards */}
      <div className="db2-stats-row">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.key}
              type="button"
              className="db2-stat-card"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.22, delay: 0.04 * i }}
              onClick={() => navigate(card.to)}
            >
              <div className="db2-stat-card__icon" style={{ background: card.bg, color: card.color }}>
                <Icon size={20} />
              </div>
              <div className="db2-stat-card__body">
                <span className="db2-stat-card__label">{card.label}</span>
                {cardsLoading ? (
                  <span className="db2-skeleton db2-skeleton--number" />
                ) : (
                  <span className="db2-stat-card__value">{card.value}</span>
                )}
              </div>
              <FiChevronRight size={16} className="db2-stat-card__arrow" />
            </motion.button>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="db2-quick-links">
        <h3 className="db2-section-title">Quick Actions</h3>
        <div className="db2-quick-links__grid">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.to}
                type="button"
                className="db2-quick-link"
                onClick={() => navigate(link.to)}
              >
                <span className="db2-quick-link__icon"><Icon size={18} /></span>
                <span className="db2-quick-link__label">{link.label}</span>
                <FiArrowRight size={14} className="db2-quick-link__arrow" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Watchlist */}
      <motion.div
        className="db2-watchlist"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, delay: 0.12 }}
      >
        <div className="db2-watchlist__header">
          <div>
            <h3 className="db2-section-title">Critical Watchlist</h3>
            <p className="db2-watchlist__subtitle">Pending alerts requiring attention</p>
          </div>
          <div className="db2-watchlist__tabs">
            {watchlistTypeTabs.map((tab) => {
              const count = tab.key === 'all'
                ? watchlistFlags.length
                : watchlistFlags.filter((f) => f.type === tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`db2-tab-pill${flagTab === tab.key ? ' db2-tab-pill--active' : ''}`}
                  onClick={() => setFlagTab(tab.key)}
                >
                  {tab.label}
                  <span className="db2-tab-pill__count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {watchlistError && !watchlistLoading && (
          <div className="db2-watchlist__alert">{watchlistError}</div>
        )}

        <div className="db2-watchlist__table">
          <div className="db2-watchlist__thead">
            <span>Patient</span>
            <span>Concern</span>
            <span>Severity</span>
            <span>Date</span>
            <span>Action</span>
          </div>

          <div className="db2-watchlist__tbody">
            {watchlistLoading ? (
              <div className="db2-watchlist__empty">Loading pending alerts…</div>
            ) : watchlistError ? (
              <div className="db2-watchlist__empty">Watchlist unavailable. Check connection and refresh.</div>
            ) : filtered.length === 0 ? (
              <div className="db2-watchlist__empty">No pending alerts.</div>
            ) : (
              filtered.map((flag) => (
                <button
                  key={flag.id}
                  type="button"
                  className={`db2-watchlist__row${selectedFlag?.id === flag.id ? ' db2-watchlist__row--active' : ''}`}
                  onClick={() => setSelectedFlag(flag)}
                >
                  <span className="db2-watchlist__cell">
                    <strong>{flag.patient}</strong>
                  </span>
                  <span className="db2-watchlist__cell db2-watchlist__cell--concern">
                    <strong>{flag.type}</strong>
                    <small>{flag.reason}</small>
                  </span>
                  <span className="db2-watchlist__cell">
                    <SeverityBadge severity={flag.severity} />
                  </span>
                  <span className="db2-watchlist__cell">{flag.flaggedDate}</span>
                  <span className="db2-watchlist__cell db2-watchlist__cell--action">View</span>
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Flag detail modal */}
      {selectedFlag && (
        <DashboardAlertModal
          alert={selectedFlag}
          onClose={() => setSelectedFlag(null)}
          onResolved={loadAlerts}
          onUnauthorized={on401}
        />
      )}
    </motion.div>
  );
}
