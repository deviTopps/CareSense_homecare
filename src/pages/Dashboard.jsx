import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiCalendar,
  FiDownload,
  FiActivity,
  FiUsers,
  FiUser,
  FiPhone,
  FiCheck,
  FiX,
  FiArrowRight,
  FiAlertTriangle,
  FiEye,
} from '../icons/hugeicons-feather';
import { fetchAllPatients } from '../utils/patients';
import { fetchEnquiries, extractEnquiriesList } from '../utils/enquiries';
import {
  getUser,
  fetchDashboardSummary,
  normalizeDashboardSummary,
  fetchUpcomingCareVisits,
  fetchPendingAlerts,
} from '../api';
import {
  extractAlertsFromPayload,
  mapAlertToCase,
  patientInitials,
  formatCaseStatusLabel,
} from '../utils/alertMapping';
import { listAdmissionDrafts } from '../utils/admissionDrafts';
import DashboardAlertModal from '../components/DashboardAlertModal';
import './Dashboard.css';

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

function pickFirst(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'object') continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

function extractListPayload(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.results,
    payload?.items,
    payload?.docs,
    payload?.rows,
    payload?.visits,
    payload?.careVisits,
    payload?.data?.results,
    payload?.data?.items,
    payload?.data?.visits,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter(Boolean);
  }
  return [];
}

function formatVisitDay(raw) {
  const value = pickFirst(
    raw?.nextVisit,
    raw?.next_visit,
    raw?.scheduledDate,
    raw?.scheduled_date,
    raw?.appointmentDate,
    raw?.appointment_date,
    raw?.visitDate,
    raw?.visit_date,
    raw?.date,
  );
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function visitPatientName(raw) {
  return pickFirst(
    raw?.patientName,
    raw?.patient_name,
    typeof raw?.patient === 'string' ? raw.patient : '',
    raw?.patient?.name,
    [raw?.patient?.firstName, raw?.patient?.lastName].filter(Boolean).join(' '),
    raw?.clientName,
    raw?.name,
  ) || 'Patient';
}

function enquiryName(raw) {
  return pickFirst(
    raw?.nameOfClient,
    raw?.clientName,
    raw?.name,
    raw?.fullName,
    [raw?.firstName, raw?.lastName].filter(Boolean).join(' '),
  ) || 'New enquiry';
}

function enquiryWhen(raw) {
  const value = pickFirst(
    raw?.dateOfContact,
    raw?.preferredDate,
    raw?.appointmentDate,
    raw?.createdAt,
    raw?.created_at,
  );
  if (!value) return 'Schedule pending';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('cancel') || s.includes('resolved') || s.includes('closed')) return 'canceled';
  if (s.includes('progress') || s.includes('open') || s.includes('pending')) return 'open';
  return 'confirmed';
}

function severityTone(severity) {
  const s = String(severity || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  return 'medium';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const accountUser = getUser();

  const [patientCount, setPatientCount] = useState(0);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [nurseCount, setNurseCount] = useState(0);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [cardsLoading, setCardsLoading] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  const [emergenciesError, setEmergenciesError] = useState('');
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [requests, setRequests] = useState([]);
  const [incompleteAdmissions, setIncompleteAdmissions] = useState([]);

  const on401 = useCallback(() => navigate('/login', { replace: true }), [navigate]);

  const refreshIncompleteAdmissions = useCallback(() => {
    setIncompleteAdmissions(listAdmissionDrafts());
  }, []);

  useEffect(() => {
    refreshIncompleteAdmissions();
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
          }
          if (enquiriesRes.status === 'fulfilled') {
            const list = extractEnquiriesList(enquiriesRes.value);
            setEnquiryCount(Array.isArray(list) ? list.length : 0);
          }
        } catch {
          setPatientCount(0);
          setEnquiryCount(0);
        }
        setNurseCount(0);
        setEmergencyCount(0);
      } finally {
        if (!cancelled) setCardsLoading(false);
      }
    };
    loadCards();
    return () => { cancelled = true; };
  }, [on401]);

  const loadEmergencies = useCallback(async () => {
    setEmergenciesLoading(true);
    setEmergenciesError('');
    try {
      const res = await fetchPendingAlerts({ page: 1, limit: 100 }, on401);
      const json = await parseJsonResponse(res);
      if (!res.ok) throw new Error(json?.message || json?.error || `Could not load emergencies (${res.status})`);
      const rawList = extractAlertsFromPayload(json);
      setEmergencies(rawList.map((row, i) => mapAlertToCase(row, i)));
      if (Number.isFinite(rawList.length)) {
        setEmergencyCount((prev) => (prev > 0 ? prev : rawList.length));
      }
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setEmergenciesError(e.message || 'Could not load incoming emergency cases.');
      }
      setEmergencies([]);
    } finally {
      setEmergenciesLoading(false);
    }
  }, [on401]);

  useEffect(() => {
    let cancelled = false;
    const loadPanels = async () => {
      try {
        const [visitsRes, enquiriesRes] = await Promise.allSettled([
          fetchUpcomingCareVisits({ page: 1, limit: 100 }, on401),
          fetchEnquiries({ page: 1, limit: 20 }, on401),
        ]);

        if (cancelled) return;

        if (visitsRes.status === 'fulfilled' && visitsRes.value.ok) {
          const json = await parseJsonResponse(visitsRes.value);
          const list = extractListPayload(json);
          setAppointments(list.map((row, index) => {
            const date = formatVisitDay(row);
            return {
              id: pickFirst(row?.id, row?._id, row?.uuid, `visit-${index}`),
              patient: visitPatientName(row),
              date,
            };
          }));
        } else {
          setAppointments([]);
        }

        if (enquiriesRes.status === 'fulfilled') {
          const list = extractEnquiriesList(enquiriesRes.value);
          setRequests((Array.isArray(list) ? list : []).slice(0, 6).map((row, index) => ({
            id: pickFirst(row?.id, row?._id, row?.uuid, `enq-${index}`),
            name: enquiryName(row),
            when: enquiryWhen(row),
            raw: row,
          })));
        }
      } finally {
        // no-op
      }
    };
    loadPanels();
    loadEmergencies();
    return () => { cancelled = true; };
  }, [on401, loadEmergencies]);

  const displayName =
    [accountUser?.firstName, accountUser?.lastName].filter(Boolean).join(' ')
    || accountUser?.email?.split('@')[0]
    || 'there';

  const careActivityTotal = patientCount + nurseCount + enquiryCount + emergencyCount;
  const bubbles = useMemo(() => {
    const items = [
      { label: 'Patients', value: patientCount, color: '#4A6CF7', textColor: '#FFFFFF' },
      { label: 'Nurses', value: nurseCount, color: '#AEC0F0', textColor: '#FFFFFF' },
      { label: 'Enquiries', value: enquiryCount, color: '#D6DEEF', textColor: '#374151' },
      { label: 'Emergency', value: emergencyCount, color: '#E9EEF9', textColor: '#374151' },
    ].sort((a, b) => b.value - a.value);
    const max = Math.max(...items.map((i) => i.value), 1);
    return items.map((item, index) => {
      const size = 54 + Math.round((item.value / max) * 70);
      const left = 6 + index * 22;
      const top = 18 + (index % 2) * 28;
      return { ...item, size, left, top, delay: 0.05 * index };
    });
  }, [patientCount, nurseCount, enquiryCount, emergencyCount]);

  const patientBreakdown = useMemo(() => {
    const active = Math.max(patientCount - incompleteAdmissions.length, 0);
    const drafts = incompleteAdmissions.length;
    const rest = Math.max(patientCount - active - drafts, 0);
    const max = Math.max(active, drafts, rest, 1);
    return [
      { label: 'Active', value: active, color: '#4A6CF7', width: Math.round((active / max) * 100) },
      { label: 'In progress', value: drafts, color: '#C3D0F4', width: Math.round((drafts / max) * 100) || 18 },
      { label: 'Other', value: rest, color: '#E9EEF9', width: Math.round((rest / max) * 100) || 12 },
    ];
  }, [patientCount, incompleteAdmissions.length]);

  const appointmentBars = useMemo(() => {
    const labels = ['03-07', '10-14', '17-21', '24-28'];
    const counts = [0, 0, 0, 0];
    appointments.forEach((row) => {
      if (!row.date) return;
      const day = row.date.getDate();
      const bucket = Math.min(3, Math.floor((day - 1) / 8));
      counts[bucket] += 1;
    });
    const max = Math.max(...counts, 1);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const hotIndex = counts.indexOf(Math.max(...counts));
    return {
      labels,
      bars: counts.map((value, i) => ({
        value,
        height: Math.max(18, Math.round((value / max) * 100)),
        hot: i === hotIndex && value > 0,
        label: labels[i],
      })),
      avgPct: Math.round((avg / max) * 100),
    };
  }, [appointments]);

  const emergencyStats = useMemo(() => {
    const critical = emergencies.filter((c) => String(c.severity).toLowerCase() === 'critical').length;
    const high = emergencies.filter((c) => String(c.severity).toLowerCase() === 'high').length;
    const open = emergencies.filter((c) => {
      const s = String(c.caseStatus || '').toLowerCase();
      return !s.includes('resolved') && !s.includes('closed');
    }).length;
    return { critical, high, open };
  }, [emergencies]);

  const exportData = () => {
    const lines = [
      ['Patient', 'Alert', 'Severity', 'Status', 'Nurse', 'Date'].join(','),
      ...emergencies.map((row) => (
        [row.patient, row.type, row.severity, formatCaseStatusLabel(row.caseStatus), row.nurse, row.flaggedDate]
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caresense-emergencies-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="page-wrapper dd-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <header className="dd-topbar">
        <div>
          <h1 className="dd-topbar__greeting">
            Welcome back, {displayName}!
            <span aria-hidden>☀️</span>
          </h1>
          <p className="dd-topbar__sub">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="dd-topbar__actions">
          <button type="button" className="dd-pill-btn" onClick={exportData}>
            Export data
            <span className="dd-pill-btn__circle" aria-hidden>
              <FiDownload size={14} />
            </span>
          </button>
        </div>
      </header>

      <section className="dd-kpi-row" aria-label="Dashboard metrics">
        <article className="dd-kpi">
          <div className="dd-kpi__head">
            <div className="dd-kpi__title-wrap">
              <span className="dd-icon-circle"><FiActivity size={18} /></span>
              <h2 className="dd-kpi__title">Top treatment</h2>
            </div>
            <button type="button" className="dd-link-more" onClick={() => navigate('/clinical')}>
              View more
            </button>
          </div>
          <div className="dd-kpi__value-row">
            {cardsLoading ? <span className="dd-skeleton" /> : (
              <span className="dd-kpi__value">{careActivityTotal}</span>
            )}
            <span className="dd-delta dd-delta--up">+{Math.max(enquiryCount, 4)}</span>
          </div>
          <div className="dd-legend">
            {bubbles.map((item) => (
              <span key={item.label} className="dd-legend__item">
                <span className="dd-legend__dot" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          <div className="dd-kpi__viz">
            <div className="dd-bubbles">
              {bubbles.map((item) => (
                <div
                  key={item.label}
                  className="dd-bubble"
                  style={{
                    width: item.size,
                    height: item.size,
                    left: `${item.left}%`,
                    top: `${item.top}%`,
                    background: item.color,
                    color: item.textColor,
                    animationDelay: `${item.delay}s`,
                  }}
                  title={`${item.label}: ${item.value}`}
                >
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="dd-kpi">
          <div className="dd-kpi__head">
            <div className="dd-kpi__title-wrap">
              <span className="dd-icon-circle"><FiUser size={18} /></span>
              <h2 className="dd-kpi__title">Total Nurses</h2>
            </div>
            <button type="button" className="dd-link-more" onClick={() => navigate('/workforce')}>
              View more
            </button>
          </div>
          <div className="dd-kpi__value-row">
            {cardsLoading ? <span className="dd-skeleton" /> : (
              <span className="dd-kpi__value">{nurseCount}</span>
            )}
            <span className="dd-delta dd-delta--up">+{Math.max(Math.round(nurseCount * 0.05), 1)}</span>
          </div>
          <div className="dd-legend">
            <span className="dd-legend__item">
              <span className="dd-legend__dot" style={{ background: '#4A6CF7' }} />
              Active workforce
            </span>
            <span className="dd-legend__item">
              <span className="dd-legend__dot" style={{ background: '#AEC0F0' }} />
              On roster
            </span>
          </div>
          <div className="dd-kpi__viz">
            <div className="dd-patient-bars">
              <div className="dd-patient-bars__col">
                <span className="dd-patient-bars__value">{nurseCount}</span>
                <span className="dd-patient-bars__guide" aria-hidden />
                <span className="dd-patient-bars__bar" style={{ background: '#4A6CF7', width: '100%' }} />
              </div>
              <div className="dd-patient-bars__col">
                <span className="dd-patient-bars__value">{nurseCount}</span>
                <span className="dd-patient-bars__guide" aria-hidden />
                <span className="dd-patient-bars__bar" style={{ background: '#AEC0F0', width: '70%' }} />
              </div>
              <div className="dd-patient-bars__col">
                <span className="dd-patient-bars__value">{Math.max(nurseCount, 0)}</span>
                <span className="dd-patient-bars__guide" aria-hidden />
                <span className="dd-patient-bars__bar" style={{ background: '#E9EEF9', width: '45%' }} />
              </div>
            </div>
          </div>
        </article>

        <article className="dd-kpi">
          <div className="dd-kpi__head">
            <div className="dd-kpi__title-wrap">
              <span className="dd-icon-circle"><FiUsers size={18} /></span>
              <h2 className="dd-kpi__title">Total patients</h2>
            </div>
            <button type="button" className="dd-link-more" onClick={() => navigate('/patients')}>
              View more
            </button>
          </div>
          <div className="dd-kpi__value-row">
            {cardsLoading ? <span className="dd-skeleton" /> : (
              <span className="dd-kpi__value">{patientCount}</span>
            )}
            <span className="dd-delta dd-delta--up">+{Math.max(incompleteAdmissions.length, 2)}</span>
          </div>
          <div className="dd-legend">
            {patientBreakdown.map((item) => (
              <span key={item.label} className="dd-legend__item">
                <span className="dd-legend__dot" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          <div className="dd-kpi__viz">
            <div className="dd-patient-bars">
              {patientBreakdown.map((item) => (
                <div key={item.label} className="dd-patient-bars__col">
                  <span className="dd-patient-bars__value">{item.value}</span>
                  <span className="dd-patient-bars__guide" aria-hidden />
                  <span
                    className="dd-patient-bars__bar"
                    style={{ background: item.color, width: `${Math.max(item.width, 24)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="dd-kpi">
          <div className="dd-kpi__head">
            <div className="dd-kpi__title-wrap">
              <span className="dd-icon-circle"><FiCalendar size={18} /></span>
              <h2 className="dd-kpi__title">Total appointment</h2>
            </div>
            <button type="button" className="dd-link-more" onClick={() => navigate('/scheduling')}>
              View more
            </button>
          </div>
          <div className="dd-kpi__value-row">
            {cardsLoading ? <span className="dd-skeleton" /> : (
              <span className="dd-kpi__value">{appointments.length}</span>
            )}
            <span className="dd-delta dd-delta--up">+{Math.max(Math.round(appointments.length * 0.1), 1)}</span>
          </div>
          <div className="dd-kpi__viz">
            <div className="dd-appt-chart">
              <div className="dd-appt-chart__avg" style={{ top: `${Math.max(8, 100 - appointmentBars.avgPct)}%` }}>
                <span className="dd-appt-chart__avg-tag">Avg</span>
                <span className="dd-appt-chart__avg-line" />
              </div>
              <div className="dd-appt-chart__bars">
                {appointmentBars.bars.map((bar) => (
                  <div key={bar.label} className="dd-appt-chart__col">
                    <div className="dd-appt-chart__bar-wrap">
                      {bar.hot ? <span className="dd-appt-chart__tip">{bar.value}</span> : null}
                      <div
                        className={`dd-appt-chart__bar${bar.hot ? ' is-hot' : ''}`}
                        style={{ height: `${bar.height}%` }}
                      />
                    </div>
                    <span className="dd-appt-chart__label">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="dd-lower">
        <div className="dd-panel">
          <div className="dd-panel__head">
            <div className="dd-panel__title-wrap">
              <span className="dd-icon-circle"><FiAlertTriangle size={18} /></span>
              <h2 className="dd-panel__title">Incoming emergency cases</h2>
            </div>
            <div className="dd-panel__head-right">
              <div className="dd-legend">
                <span className="dd-legend__item">
                  <span className="dd-legend__dot" style={{ background: '#DC2626' }} />
                  Critical ({emergencyStats.critical})
                </span>
                <span className="dd-legend__item">
                  <span className="dd-legend__dot" style={{ background: '#F97316' }} />
                  High ({emergencyStats.high})
                </span>
                <span className="dd-legend__item">
                  <span className="dd-legend__dot" style={{ background: '#4A6CF7' }} />
                  Open ({emergencyStats.open})
                </span>
              </div>
              <button type="button" className="dd-link-more" onClick={() => navigate('/clinical')}>
                View more
              </button>
            </div>
          </div>

          <div className="dd-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Alert</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Nurse</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {emergenciesLoading ? (
                  <tr>
                    <td colSpan={7} className="dd-empty">Loading incoming emergency cases…</td>
                  </tr>
                ) : emergenciesError ? (
                  <tr>
                    <td colSpan={7} className="dd-empty">{emergenciesError}</td>
                  </tr>
                ) : emergencies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dd-empty">
                      No incoming emergency cases right now.
                    </td>
                  </tr>
                ) : (
                  emergencies.slice(0, 8).map((row) => (
                    <tr
                      key={row.id}
                      className="dd-table__click-row"
                      onClick={() => setSelectedEmergency(row)}
                    >
                      <td>
                        <div className="dd-patient-cell">
                          <span className="dd-avatar" aria-hidden>{patientInitials(row.patient)}</span>
                          <div>
                            <strong>{row.patient}</strong>
                            {row.region && row.region !== '—' ? (
                              <span className="dd-patient-meta">{row.region}</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="dd-alert-cell">
                          <strong>{row.type}</strong>
                          {row.reason ? <span className="dd-patient-meta">{row.reason}</span> : null}
                        </div>
                      </td>
                      <td>
                        <span className={`dd-severity dd-severity--${severityTone(row.severity)}`}>
                          <span className="dd-status__dot" />
                          {row.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`dd-status dd-status--${statusTone(row.caseStatus)}`}>
                          <span className="dd-status__dot" />
                          {formatCaseStatusLabel(row.caseStatus)}
                        </span>
                      </td>
                      <td>{row.nurse || 'Unassigned'}</td>
                      <td>{row.flaggedDate || '—'}</td>
                      <td>
                        <div className="dd-row-actions">
                          <button
                            type="button"
                            className="dd-icon-btn dd-icon-btn--call"
                            aria-label={`Call ${row.patient}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row.phone && row.phone !== '—') {
                                window.location.href = `tel:${String(row.phone).replace(/\s+/g, '')}`;
                              } else {
                                setSelectedEmergency(row);
                              }
                            }}
                          >
                            <FiPhone size={16} />
                          </button>
                          <button
                            type="button"
                            className="dd-icon-btn dd-icon-btn--more"
                            aria-label={`View ${row.patient}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmergency(row);
                            }}
                          >
                            <FiEye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="dd-panel">
          <div className="dd-panel__head">
            <div className="dd-panel__title-wrap">
              <span className="dd-icon-circle"><FiCalendar size={18} /></span>
              <h2 className="dd-panel__title">Appoint request</h2>
            </div>
            <button type="button" className="dd-link-more" onClick={() => navigate('/enquiries')}>
              View more
            </button>
          </div>

          <div className="dd-requests">
            {requests.length === 0 ? (
              <div className="dd-empty">No appointment requests right now.</div>
            ) : (
              requests.map((req, index) => (
                <div key={req.id} className="dd-request" style={{ animationDelay: `${0.05 * index}s` }}>
                  <div className="dd-request__photo" aria-hidden>
                    {patientInitials(req.name)}
                  </div>
                  <div>
                    <h3 className="dd-request__name">{req.name}</h3>
                    <p className="dd-request__sub">Individual consultations</p>
                    {req.when ? (
                      <span className="dd-request__chip">
                        <FiCalendar size={13} aria-hidden />
                        {req.when}
                      </span>
                    ) : null}
                  </div>
                  <div className="dd-request__actions">
                    <button
                      type="button"
                      className="dd-icon-btn dd-icon-btn--reject"
                      aria-label={`Dismiss ${req.name}`}
                      onClick={() => setRequests((prev) => prev.filter((r) => r.id !== req.id))}
                    >
                      <FiX size={18} />
                    </button>
                    <button
                      type="button"
                      className="dd-icon-btn dd-icon-btn--accept"
                      aria-label={`Open ${req.name}`}
                      onClick={() => navigate('/enquiries')}
                    >
                      <FiCheck size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      {incompleteAdmissions.length > 0 ? (
        <section className="dd-drafts" aria-label="Incomplete admissions">
          <div className="dd-drafts__head">
            <h3>Incomplete admissions</h3>
            <span className="dd-delta dd-delta--up">{incompleteAdmissions.length}</span>
          </div>
          <div className="dd-drafts__list">
            {incompleteAdmissions.slice(0, 4).map((draft) => {
              const completed = Array.isArray(draft.completedTabs) ? draft.completedTabs.length : 0;
              const progressPct = Math.round((completed / 11) * 100);
              return (
                <div key={draft.patientId} className="dd-drafts__item">
                  <div>
                    <strong>{draft.patientName || 'Incomplete admission'}</strong>
                    <span>{progressPct}% complete · {completed} of 11 sections</span>
                  </div>
                  <button
                    type="button"
                    className="dd-drafts__cta"
                    onClick={() => navigate(`/patients?resume=${encodeURIComponent(draft.patientId)}`)}
                  >
                    Continue
                    <FiArrowRight size={13} style={{ marginLeft: 6 }} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedEmergency ? (
        <DashboardAlertModal
          alert={selectedEmergency}
          onClose={() => setSelectedEmergency(null)}
          onResolved={loadEmergencies}
          onUnauthorized={on401}
        />
      ) : null}
    </motion.div>
  );
}
