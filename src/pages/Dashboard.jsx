import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiAlertTriangle,
  FiX,
  FiMapPin,
  FiPhone,
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

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

function extractPendingAlertsList(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  const KEYS = ['data', 'alerts', 'items', 'results', 'pending', 'records', 'rows', 'content'];
  const tryNest = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      for (const nk of KEYS) {
        const inner = v[nk];
        if (Array.isArray(inner)) return inner;
      }
    }
    return null;
  };
  for (const k of KEYS) {
    const arr = tryNest(payload[k]);
    if (arr) return arr;
  }
  if (payload?.edges && Array.isArray(payload.edges)) {
    const fromEdges = payload.edges.map((e) => e?.node ?? e?.alert).filter(Boolean);
    if (fromEdges.length) return fromEdges;
  }
  return [];
}

function normalizeWatchlistSeverity(raw) {
  const s = String(raw ?? 'medium').trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  if (s.includes('critical') || s.includes('urgent')) return 'critical';
  if (s.includes('high') || s.includes('severe')) return 'high';
  if (s.includes('medium') || s.includes('moderate')) return 'medium';
  if (['critical', 'high', 'medium'].includes(s)) return s;
  return 'medium';
}

function trimAlertStr(v) {
  if (v == null) return '';
  return String(v).trim();
}

function patientNameFromRelatedObject(o) {
  if (!o || typeof o !== 'object') return '';
  const direct = trimAlertStr(
    o.name ?? o.fullName ?? o.displayName ?? o.patientName ?? o.legalName ?? o.preferredName,
  );
  if (direct) return direct;
  const fn = trimAlertStr(o.firstName ?? o.givenName);
  const ln = trimAlertStr(o.lastName ?? o.familyName ?? o.surname);
  const combined = [fn, ln].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return '';
}

function pickPatientNameFromAlert(raw, depth = 0) {
  if (!raw || typeof raw !== 'object' || depth > 4) return '';
  const direct = trimAlertStr(
    raw.patientName ?? raw.patient_name ?? raw.clientName ?? raw.client_name ??
    raw.serviceUserName ?? raw.service_user_name ?? raw.residentName ??
    raw.consumerName ?? raw.fullName ?? raw.full_name ?? raw.subjectName,
  );
  if (direct) return direct;
  if (typeof raw.subject === 'string' && raw.subject.trim()) return raw.subject.trim();
  if (raw.subject && typeof raw.subject === 'object') {
    const subName = patientNameFromRelatedObject(raw.subject) || pickPatientNameFromAlert(raw.subject, depth + 1);
    if (subName) return subName;
  }
  if (typeof raw.patient === 'string' && raw.patient.trim()) return raw.patient.trim();
  const fromPatient = patientNameFromRelatedObject(raw.patient);
  if (fromPatient) return fromPatient;
  for (const key of ['client', 'serviceUser', 'service_user', 'beneficiary', 'person', 'individual', 'subject']) {
    const n = patientNameFromRelatedObject(raw[key]);
    if (n) return n;
  }
  const ctx = raw.context ?? raw.alertContext ?? raw.payload;
  if (ctx && typeof ctx === 'object') {
    const fromCtx = pickPatientNameFromAlert(ctx, depth + 1);
    if (fromCtx) return fromCtx;
  }
  const meta = raw.metadata ?? raw.meta ?? raw.details;
  if (meta && typeof meta === 'object') {
    const fromMeta = pickPatientNameFromAlert(meta, depth + 1);
    if (fromMeta) return fromMeta;
  }
  return '';
}

function pickPatientIdFromAlert(raw) {
  if (!raw || typeof raw !== 'object') return '—';
  const top = trimAlertStr(
    raw.patientId ?? raw.patient_id ?? raw.serviceUserId ?? raw.service_user_id ?? raw.clientId ?? raw.client_id,
  );
  if (top) return top;
  const p = raw.patient;
  if (p && typeof p === 'object') {
    const id = trimAlertStr(p.id ?? p._id ?? p.uuid ?? p.patientId ?? p.patientUuid);
    if (id) return id;
  }
  for (const key of ['client', 'serviceUser', 'service_user']) {
    const o = raw[key];
    if (o && typeof o === 'object') {
      const id = trimAlertStr(o.id ?? o._id ?? o.uuid);
      if (id) return id;
    }
  }
  return '—';
}

function mapPendingAlertToFlag(raw, index) {
  const id = String(raw?.id ?? raw?._id ?? raw?.uuid ?? raw?.alertId ?? `alert-${index}`);
  const patientName = pickPatientNameFromAlert(raw);
  const patientId = pickPatientIdFromAlert(raw);
  let patient = patientName;
  if (!patient && patientId && patientId !== '—') patient = 'Patient';
  const type = String(raw?.type ?? raw?.category ?? raw?.alertType ?? raw?.reasonCode ?? 'Alert').trim() || 'Alert';
  const severity = normalizeWatchlistSeverity(raw?.severity ?? raw?.priority ?? raw?.level);
  const reason = String(raw?.reason ?? raw?.message ?? raw?.description ?? raw?.notes ?? raw?.title ?? '—').trim() || '—';
  const isoDate = raw?.flaggedDate ?? raw?.createdAt ?? raw?.date ?? raw?.updatedAt ?? raw?.raisedAt;
  let flaggedDate = '—';
  if (isoDate != null && isoDate !== '') {
    const d = new Date(String(isoDate));
    flaggedDate = Number.isNaN(d.getTime()) ? String(isoDate).slice(0, 10) : d.toISOString().slice(0, 10);
  }

  return {
    id,
    patientId,
    patient: patient || 'Patient',
    type,
    severity,
    reason,
    flaggedBy: String(raw?.flaggedBy ?? raw?.raisedBy ?? raw?.createdBy ?? raw?.reportedBy ?? '—').trim() || '—',
    flaggedDate,
    nurse: String(raw?.nurse ?? raw?.assignedNurse ?? raw?.nurseName ?? raw?.assignedTo ?? '—').trim() || '—',
    region: String(raw?.region ?? raw?.location ?? raw?.area ?? raw?.address ?? '—').trim() || '—',
  };
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

function FlagDetailModal({ flag, onClose }) {
  if (!flag) return null;
  const sev = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
  return (
    <div className="kh-modal-overlay" style={{ zIndex: 2000 }} onClick={onClose} role="presentation">
      <div className="db2-flag-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="db2-flag-modal__header">
          <div className="db2-flag-modal__header-left">
            <div className="db2-flag-modal__icon" style={{ background: sev.bg, color: sev.color }}>
              <FiAlertTriangle size={18} />
            </div>
            <div>
              <h3 className="db2-flag-modal__title">Alert — {flag.type}</h3>
              <span className="db2-flag-modal__id">ID: {flag.id}</span>
            </div>
          </div>
          <button type="button" className="db2-flag-modal__close" onClick={onClose} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>

        <div className="db2-flag-modal__body">
          <div className="db2-flag-modal__patient-row">
            <div className="db2-flag-modal__patient-avatar">
              {(flag.patient || '?').split(/\s+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2) || '?'}
            </div>
            <div className="db2-flag-modal__patient-info">
              <strong>{flag.patient}</strong>
              <div className="db2-flag-modal__patient-meta">
                <span><FiMapPin size={12} /> {flag.region}</span>
                <span><FiPhone size={12} /> {flag.nurse}</span>
              </div>
            </div>
            <SeverityBadge severity={flag.severity} />
          </div>

          <div className="db2-flag-modal__section">
            <label>Reason</label>
            <p>{flag.reason}</p>
          </div>

          <div className="db2-flag-modal__details-grid">
            <div className="db2-flag-modal__detail">
              <label>Flagged by</label>
              <span>{flag.flaggedBy}</span>
            </div>
            <div className="db2-flag-modal__detail">
              <label>Date</label>
              <span>{flag.flaggedDate}</span>
            </div>
            <div className="db2-flag-modal__detail">
              <label>Assigned nurse</label>
              <span>{flag.nurse}</span>
            </div>
            <div className="db2-flag-modal__detail">
              <label>Region</label>
              <span>{flag.region}</span>
            </div>
          </div>
        </div>

        <div className="db2-flag-modal__footer">
          <button type="button" className="db2-btn db2-btn--outline" onClick={onClose}>Close</button>
          <button type="button" className="db2-btn db2-btn--danger">Resolve Alert</button>
        </div>
      </div>
    </div>
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

  useEffect(() => {
    let cancelled = false;
    const loadAlerts = async () => {
      setWatchlistLoading(true);
      setWatchlistError('');
      try {
        const res = await fetchPendingAlerts({ page: 1, limit: 100 }, on401);
        const json = await parseJsonResponse(res);
        if (cancelled) return;
        if (!res.ok) throw new Error(json?.message || json?.error || `Could not load alerts (${res.status})`);
        const rawList = extractPendingAlertsList(json);
        setWatchlistFlags(rawList.map((row, i) => mapPendingAlertToFlag(row, i)));
      } catch (e) {
        if (cancelled) return;
        if (e.message !== 'Session expired. Please log in again.') {
          setWatchlistError(e.message || 'Could not load pending alerts.');
        }
        setWatchlistFlags([]);
      } finally {
        if (!cancelled) setWatchlistLoading(false);
      }
    };
    loadAlerts();
    return () => { cancelled = true; };
  }, [on401]);

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
            <span>Region</span>
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
                  <span className="db2-watchlist__cell">{flag.region}</span>
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
        <FlagDetailModal flag={selectedFlag} onClose={() => setSelectedFlag(null)} />
      )}
    </motion.div>
  );
}
