import { useState } from 'react';
import { FiPlus, FiMapPin, FiClock, FiChevronRight, FiCalendar, FiXCircle } from '../icons/hugeicons-feather';

const initialVisits = [
  { id: 'V-2001', patient: 'Kwame Boateng', date: '2026-03-22', time: '09:00', duration: '45 min', type: 'Routine Check', frequency: 'Weekly', prevVisit: '2026-03-15', nextVisit: '2026-03-29', region: 'Accra', status: 'completed', address: '14 Osu Badu St, Accra' },
  { id: 'V-2002', patient: 'Abena Osei', date: '2026-03-22', time: '10:30', duration: '60 min', type: 'Routine Check', frequency: 'Twice a week', prevVisit: '2026-03-19', nextVisit: '2026-03-26', region: 'Kumasi', status: 'in-progress', address: '7 Adum Road, Kumasi' },
  { id: 'V-2003', patient: 'Kofi Ankrah', date: '2026-03-22', time: '11:00', duration: '30 min', type: 'Routine Check', frequency: 'Once in 2 weeks', prevVisit: '2026-03-08', nextVisit: '2026-04-05', region: 'Tamale', status: 'scheduled', address: '22 Dagomba Line, Tamale' },
  { id: 'V-2004', patient: 'Akosua Mensah', date: '2026-03-22', time: '13:15', duration: '45 min', type: 'Routine Check', frequency: 'Weekly', prevVisit: '2026-03-15', nextVisit: '2026-03-29', region: 'Accra', status: 'scheduled', address: '3 Cantonments Rd, Accra' },
  { id: 'V-2005', patient: 'Yaw Frimpong', date: '2026-03-22', time: '14:30', duration: '60 min', type: 'Routine Check', frequency: 'Monthly', prevVisit: '2026-02-22', nextVisit: '2026-04-22', region: 'Takoradi', status: 'scheduled', address: '18 Market Circle, Takoradi' },
  { id: 'V-2006', patient: 'Esi Appiah', date: '2026-03-22', time: '15:00', duration: '30 min', type: 'Routine Check', frequency: 'Once in 2 weeks', prevVisit: '2026-03-08', nextVisit: '2026-04-05', region: 'Accra', status: 'scheduled', address: '9 Spintex Rd, Accra' },
];

const statusFilters = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];

export default function Scheduling() {
  const [visits, setVisits] = useState(initialVisits);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const filtered = visits.filter(v => {
    return filter === 'All' || v.status === filter.toLowerCase().replace(' ', '-');
  });

  const handleCancel = () => {
    if (!cancelTarget) return;
    setVisits(prev => prev.map(v => v.id === cancelTarget.id ? { ...v, status: 'cancelled' } : v));
    setCancelTarget(null);
  };

  return (
    <div className="page-wrapper">
      {/* Controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="filter-pills">
          {statusFilters.map(s => (
            <button key={s} className={`filter-pill${filter === s ? ' active' : ''}`}
              onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button className="btn btn-kh-primary d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
            <FiPlus size={15} /> Schedule Visit
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="kh-card mb-4">
        <div className="card-header-custom">
          <h6>Visit Schedule</h6>
          <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{filtered.length} visits</span>
        </div>
        <div className="table-responsive">
          <table className="table kh-table">
            <thead>
              <tr><th>Patient</th><th>Previous Visit</th><th>Next Visit</th><th>Time</th><th>Duration</th><th>Frequency</th><th>Region</th><th>Status</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar sm" style={{ background: i % 2 === 0 ? '#45B6FE' : '#2E7DB8' }}>
                        {v.patient.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--kh-text)', fontSize: 13 }}>{v.patient}</div>
                        <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}><FiMapPin size={9} /> {v.address}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    <FiCalendar size={10} style={{ marginRight: 4, color: 'var(--kh-text-muted)' }} />
                    {new Date(v.prevVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    <FiCalendar size={10} style={{ marginRight: 4, color: '#45B6FE' }} />
                    <span style={{ fontWeight: 600, color: '#45B6FE' }}>{new Date(v.nextVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </td>
                  <td style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}><FiClock size={11} style={{ marginRight: 4 }} />{v.time}</td>
                  <td style={{ fontSize: 13 }}>{v.duration}</td>
                  <td><span className="badge-kh" style={{ background: '#F0F7FE', color: '#2E7DB8' }}>{v.frequency}</span></td>
                  <td style={{ fontSize: 13 }}>{v.region}</td>
                  <td><span className={`badge-kh ${v.status}`}>{v.status === 'cancelled' ? 'cancelled' : v.status.replace('-', ' ')}</span></td>
                  <td>
                    {v.status === 'scheduled' && (
                      <button
                        onClick={e => { e.stopPropagation(); setCancelTarget(v); }}
                        style={{
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: 2, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                        }}
                      >
                        <FiXCircle size={12} /> Cancel
                      </button>
                    )}
                  </td>
                  <td><FiChevronRight size={14} style={{ color: 'var(--kh-text-muted)', cursor: 'pointer' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="modal d-block" style={{ zIndex: 1060 }} onClick={() => setCancelTarget(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-body" style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <FiXCircle size={28} style={{ color: '#dc2626' }} />
                </div>
                <h6 style={{ fontWeight: 700, fontSize: 16, color: 'var(--kh-text)', marginBottom: 8 }}>Cancel Visit</h6>
                <p style={{ fontSize: 13, color: 'var(--kh-text-muted)', lineHeight: 1.6, marginBottom: 4 }}>
                  Are you sure you want to cancel the visit for
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 4 }}>
                  {cancelTarget.patient}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', marginBottom: 24 }}>
                  <FiCalendar size={11} style={{ marginRight: 4 }} />
                  {new Date(cancelTarget.nextVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {cancelTarget.time}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button onClick={() => setCancelTarget(null)} style={{
                    padding: '10px 28px', fontSize: 13, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: '#fff', color: 'var(--kh-text)', border: '1px solid #d1d5db',
                  }}>Keep Visit</button>
                  <button onClick={handleCancel} style={{
                    padding: '10px 28px', fontSize: 13, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: '#dc2626', color: '#fff', border: '1px solid #dc2626',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FiXCircle size={14} /> Cancel Visit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header" style={{ borderBottom: '1px solid var(--kh-border-light)', padding: '20px 24px' }}>
                <h6 className="modal-title" style={{ fontWeight: 700, fontSize: 16 }}>Schedule Visit</h6>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body" style={{ padding: 24 }}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Patient</label>
                    <select className="form-select form-control-kh"><option>Select patient...</option><option>Kwame Boateng</option><option>Abena Osei</option></select>
                  </div>
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Date</label>
                    <input type="date" className="form-control form-control-kh" defaultValue="2026-03-22" />
                  </div>
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Time</label>
                    <input type="time" className="form-control form-control-kh" />
                  </div>
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Visit Type</label>
                    <select className="form-select form-control-kh">
                      <option>Routine Check</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Frequency</label>
                    <select className="form-select form-control-kh">
                      <option>Weekly</option><option>Twice a week</option><option>Once in 2 weeks</option><option>Monthly</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)' }}>Notes</label>
                    <textarea className="form-control form-control-kh" rows={2} placeholder="Optional..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--kh-border-light)', padding: '16px 24px' }}>
                <button className="btn btn-kh-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-kh-primary" onClick={() => setShowModal(false)}>Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
