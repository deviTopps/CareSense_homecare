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
import { extractAlertsFromPayload, mapAlertToCase, formatCaseStatusLabel, patientInitials } from '../utils/alertMapping';
import { listAdmissionDrafts } from '../utils/admissionDrafts';
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

function CaseStatusBadge({ status }) {
  const normalized = String(status || 'open').toLowerCase();
  const tone = normalized === 'resolved' ? 'resolved' : normalized === 'in-progress' ? 'progress' : 'open';
  return (
    <span className={`db2-case-badge db2-case-badge--${tone}`}>
      {formatCaseStatusLabel(status)}
    </span>
  );
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
  const [incompleteAdmissions, setIncompleteAdmissions] = useState([]);

  const on401 = useCallback(() => navigate('/login', { replace: true }), [navigate]);

  const refreshIncompleteAdmissions = useCallback(() => {
    setIncompleteAdmissions(listAdmissionDrafts());
  }, []);

  useEffect(() => {
    refreshIncompleteAdmissions();
  }, [refreshIncompleteAdmissions]);

  useEffect(() => {
    const refresh = () => refreshIncompleteAdmissions();
    window.addEventListener('focus', refresh);
    window.addEventListener('admission-drafts-changed', refresh);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('admission-drafts-changed', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshIncompleteAdmissions]);

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

      {/* Incomplete admissions */}
      {incompleteAdmissions.length > 0 && (
        <motion.div
          className="db2-incomplete-admissions"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.08 }}
        >
          <div className="db2-incomplete-admissions__header">
            <div>
              <h3 className="db2-section-title">Incomplete Admissions</h3>
              <p className="db2-incomplete-admissions__subtitle">
                Continue client admission forms that were saved but not finished.
              </p>
            </div>
            <span className="db2-incomplete-admissions__count">{incompleteAdmissions.length}</span>
          </div>
          <div className="db2-incomplete-admissions__list">
            {incompleteAdmissions.map((draft) => {
              const completed = Array.isArray(draft.completedTabs) ? draft.completedTabs.length : 0;
              const progressPct = Math.round((completed / 11) * 100);
              const updatedLabel = draft.updatedAt
                ? new Date(draft.updatedAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : 'Recently';
              return (
                <div key={draft.patientId} className="db2-incomplete-admissions__item">
                  <div className="db2-incomplete-admissions__item-main">
                    <strong>{draft.patientName || 'Incomplete admission'}</strong>
                    <span>
                      {draft.registrationNumber ? `Reg. ${draft.registrationNumber}` : 'No registration number'}
                      {' · '}
                      {progressPct}% complete ({completed} of 11 sections)
                    </span>
                    <small>Last saved {updatedLabel}</small>
                  </div>
                  <button
                    type="button"
                    className="db2-incomplete-admissions__cta"
                    onClick={() => navigate(`/patients?resume=${encodeURIComponent(draft.patientId)}`)}
                  >
                    Continue form
                    <FiArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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
          <div className="db2-watchlist__table-meta">
            <span>
              {watchlistLoading
                ? 'Loading alerts…'
                : `${filtered.length} pending alert${filtered.length === 1 ? '' : 's'}${flagTab !== 'all' ? ` · ${flagTab}` : ''}`}
            </span>
          </div>

          <div className="db2-watchlist__scroll">
            <table className="db2-watchlist-table">
              <thead>
                <tr>
                  <th className="db2-watchlist-table__col-patient">Patient</th>
                  <th className="db2-watchlist-table__col-type">Alert</th>
                  <th className="db2-watchlist-table__col-details">Details</th>
                  <th className="db2-watchlist-table__col-severity">Severity</th>
                  <th className="db2-watchlist-table__col-status">Status</th>
                  <th className="db2-watchlist-table__col-nurse">Nurse</th>
                  <th className="db2-watchlist-table__col-date">Date</th>
                  <th className="db2-watchlist-table__col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlistLoading ? (
                  <tr>
                    <td colSpan={8} className="db2-watchlist-table__empty">Loading pending alerts…</td>
                  </tr>
                ) : watchlistError ? (
                  <tr>
                    <td colSpan={8} className="db2-watchlist-table__empty">Watchlist unavailable. Check connection and refresh.</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="db2-watchlist-table__empty">No pending alerts.</td>
                  </tr>
                ) : (
                  filtered.map((flag) => (
                    <tr
                      key={flag.id}
                      className={`db2-watchlist-table__row${selectedFlag?.id === flag.id ? ' db2-watchlist-table__row--active' : ''}`}
                      onClick={() => setSelectedFlag(flag)}
                    >
                      <td className="db2-watchlist-table__cell db2-watchlist-table__cell--patient">
                        <div className="db2-watchlist-patient">
                          <span className="db2-watchlist-patient__avatar" aria-hidden>
                            <FiUser size={16} />
                          </span>
                          <div className="db2-watchlist-patient__body">
                            <strong title={flag.patient}>{flag.patient}</strong>
                            {(flag.region && flag.region !== '—') || flag.diagnosis ? (
                              <span className="db2-watchlist-patient__meta">
                                {[flag.region !== '—' ? flag.region : null, flag.diagnosis || null].filter(Boolean).join(' · ')}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="db2-watchlist-table__cell">
                        <span className="db2-watchlist-type" title={flag.type}>{flag.type}</span>
                        {flag.code ? <span className="db2-watchlist-code">{flag.code}</span> : null}
                      </td>
                      <td className="db2-watchlist-table__cell db2-watchlist-table__cell--details">
                        <p className="db2-watchlist-reason" title={flag.reason}>{flag.reason}</p>
                        {flag.flaggedBy && flag.flaggedBy !== '—' ? (
                          <span className="db2-watchlist-reason__by">Reported by {flag.flaggedBy}</span>
                        ) : null}
                      </td>
                      <td className="db2-watchlist-table__cell">
                        <SeverityBadge severity={flag.severity} />
                      </td>
                      <td className="db2-watchlist-table__cell">
                        <CaseStatusBadge status={flag.caseStatus} />
                      </td>
                      <td className="db2-watchlist-table__cell db2-watchlist-table__cell--nurse">
                        <div className="db2-watchlist-nurse">
                          <span className="db2-watchlist-nurse__avatar" aria-hidden>
                            {patientInitials(flag.nurse)}
                          </span>
                          <span className="db2-watchlist-nurse__name" title={flag.nurse}>
                            {flag.nurse}
                          </span>
                        </div>
                      </td>
                      <td className="db2-watchlist-table__cell db2-watchlist-table__cell--date">
                        {flag.flaggedDate}
                      </td>
                      <td className="db2-watchlist-table__cell db2-watchlist-table__cell--action">
                        <button
                          type="button"
                          className="db2-watchlist-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFlag(flag);
                          }}
                        >
                          View
                          <FiChevronRight size={14} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
