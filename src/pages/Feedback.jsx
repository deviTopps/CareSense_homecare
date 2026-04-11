import { useState, useMemo } from 'react';
import {
  FiStar, FiThumbsUp, FiThumbsDown, FiMessageCircle, FiSearch, FiX,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiUser, FiMapPin, FiCalendar, FiSmile, FiMeh, FiFrown, FiHeart,
  FiCheckCircle, FiTrendingUp, FiAward
} from 'react-icons/fi';

/* ── Feedback Data ── */
const initialFeedback = [
  {
    id: 'FB-001', date: '2026-03-24', patient: 'Kwame Boateng', patientId: 'P-1001',
    region: 'Accra', nurse: 'Efua Mensah', rating: 5, sentiment: 'positive',
    category: 'Nurse Care', subject: 'Excellent morning care routine',
    comment: 'Nurse Efua is always professional and caring. She explains every medication and checks on me thoroughly. Very impressed with the quality of care.',
  },
  {
    id: 'FB-002', date: '2026-03-23', patient: 'Abena Osei', patientId: 'P-1002',
    region: 'Kumasi', nurse: 'Yaa Asantewaa', rating: 4, sentiment: 'positive',
    category: 'Wound Care', subject: 'Good wound dressing technique',
    comment: 'The wound dressing was done very carefully. Only feedback is that the nurse could communicate more about the healing progress. Otherwise very good.',
  },
  {
    id: 'FB-003', date: '2026-03-22', patient: 'Kofi Ankrah', patientId: 'P-1003',
    region: 'Tamale', nurse: 'Ama Darko', rating: 3, sentiment: 'neutral',
    category: 'Communication', subject: 'Need clearer dietary guidance',
    comment: 'The nurse is kind but I wish she could explain my diet plan in simpler terms. Sometimes the medical language is hard to understand. Would appreciate printed materials.',
  },
  {
    id: 'FB-004', date: '2026-03-23', patient: 'Esi Quartey', patientId: 'P-1005',
    region: 'Accra', nurse: 'Efua Mensah', rating: 2, sentiment: 'negative',
    category: 'Punctuality', subject: 'Visit started late',
    comment: 'The nurse arrived late and seemed rushed. I didn\'t feel like I got the full attention I needed during the session. Please ensure timely arrivals.',
  },
  {
    id: 'FB-005', date: '2026-03-21', patient: 'Akosua Mensah', patientId: 'P-1004',
    region: 'Accra', nurse: 'Efua Mensah', rating: 5, sentiment: 'positive',
    category: 'Overall Service', subject: 'Outstanding homecare experience',
    comment: 'Kulobal Homecare has been a blessing for our family. The nurses are well trained and compassionate. I have recommended the service to three other families already.',
  },
  {
    id: 'FB-006', date: '2026-03-20', patient: 'Grace Ampofo', patientId: 'P-1009',
    region: 'Accra', nurse: 'Akua Owusu', rating: 4, sentiment: 'positive',
    category: 'Equipment', subject: 'Proper use of monitoring equipment',
    comment: 'Nurse Akua always brings the right equipment and knows how to use it well. My oxygen levels are monitored accurately. Feel very safe in her care.',
  },
  {
    id: 'FB-007', date: '2026-03-19', patient: 'Yaw Frimpong', patientId: 'P-1006',
    region: 'Takoradi', nurse: 'Adwoa Badu', rating: 5, sentiment: 'positive',
    category: 'Nurse Care', subject: 'Best nurse I have ever had',
    comment: 'Nurse Adwoa is patient, thorough, and always has a smile. She even took time to teach my wife how to help with my daily exercises. Truly exceptional service.',
  },
  {
    id: 'FB-008', date: '2026-03-18', patient: 'Nana Agyemang', patientId: 'P-1008',
    region: 'Cape Coast', nurse: 'Unassigned', rating: 1, sentiment: 'negative',
    category: 'Service Reliability', subject: 'No nurse showed up for visit',
    comment: 'I waited the whole morning but nobody came. This is the second time this has happened. Very disappointed. My medications were delayed and I felt neglected.',
  },
  {
    id: 'FB-009', date: '2026-03-22', patient: 'Kwame Boateng', patientId: 'P-1001',
    region: 'Accra', nurse: 'Efua Mensah', rating: 4, sentiment: 'positive',
    category: 'Communication', subject: 'Great family updates',
    comment: 'Nurse Efua always takes time to brief my daughter about my condition after each visit. This family-inclusive approach is very much appreciated.',
  },
  {
    id: 'FB-010', date: '2026-03-17', patient: 'Abena Osei', patientId: 'P-1002',
    region: 'Kumasi', nurse: 'Yaa Asantewaa', rating: 3, sentiment: 'neutral',
    category: 'Scheduling', subject: 'Prefer earlier visit times',
    comment: 'The nurse comes in the afternoon but I would prefer morning visits when I feel more energetic. Is it possible to reschedule? Otherwise the care itself is fine.',
  },
];

const CATEGORIES = ['All', 'Nurse Care', 'Wound Care', 'Communication', 'Punctuality', 'Overall Service', 'Equipment', 'Service Reliability', 'Scheduling'];
const SENTIMENT_OPTIONS = ['All', 'Positive', 'Neutral', 'Negative'];
const RATING_OPTIONS = ['All', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];

const sentimentStyle = {
  positive: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', icon: <FiSmile size={13} />, label: 'Positive' },
  neutral: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a', icon: <FiMeh size={13} />, label: 'Neutral' },
  negative: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: <FiFrown size={13} />, label: 'Negative' },
};

const renderStars = (rating) => {
  return Array.from({ length: 5 }, (_, i) => (
    <FiStar key={i} size={13} style={{ color: i < rating ? '#f59e0b' : '#d1d5db', fill: i < rating ? '#f59e0b' : 'none' }} />
  ));
};

export default function Feedback() {
  const [feedback] = useState(initialFeedback);
  const [selected, setSelected] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = useMemo(() => {
    return feedback.filter(f => {
      if (categoryFilter !== 'All' && f.category !== categoryFilter) return false;
      if (sentimentFilter !== 'All' && f.sentiment !== sentimentFilter.toLowerCase()) return false;
      if (ratingFilter !== 'All') {
        const r = parseInt(ratingFilter);
        if (f.rating !== r) return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return f.patient.toLowerCase().includes(q) || f.id.toLowerCase().includes(q) || f.nurse.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q);
      }
      return true;
    });
  }, [feedback, categoryFilter, sentimentFilter, ratingFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => {
    const total = feedback.length;
    const avgRating = total > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1) : '0.0';
    return {
      total,
      avgRating,
      positive: feedback.filter(f => f.sentiment === 'positive').length,
      neutral: feedback.filter(f => f.sentiment === 'neutral').length,
      negative: feedback.filter(f => f.sentiment === 'negative').length,
    };
  }, [feedback]);

  const resetFilters = () => { setCategoryFilter('All'); setSentimentFilter('All'); setRatingFilter('All'); setSearchTerm(''); setPage(1); };
  const hasFilters = categoryFilter !== 'All' || sentimentFilter !== 'All' || ratingFilter !== 'All' || searchTerm;

  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Feedback', value: stats.total, color: '#2E7DB8', bg: '#F0F7FE', icon: <FiMessageCircle size={20} /> },
          { label: 'Avg Rating', value: stats.avgRating, color: '#f59e0b', bg: '#fffbeb', icon: <FiStar size={20} /> },
          { label: 'Positive', value: stats.positive, color: '#1565A0', bg: '#F0F7FE', icon: <FiThumbsUp size={20} /> },
          { label: 'Neutral', value: stats.neutral, color: '#ca8a04', bg: '#fefce8', icon: <FiMeh size={20} /> },
          { label: 'Negative', value: stats.negative, color: '#dc2626', bg: '#fef2f2', icon: <FiThumbsDown size={20} /> },
        ].map((s, i) => (
          <div key={i} className="col">
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '20px 18px',
              borderLeft: `4px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--kh-text)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--kh-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="kh-card" style={{ marginBottom: 16, padding: 0 }}>
        <div style={{ background: '#45B6FE', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="d-flex align-items-center gap-2">
            <FiMessageCircle size={16} style={{ color: '#fff' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Patient Feedback</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{filtered.length} entries</span>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div className="d-flex flex-wrap align-items-end gap-3">
            {/* Search */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Search</label>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Patient, feedback ID, nurse, subject..."
                  style={{ width: '100%', padding: '7px 12px 7px 32px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Category</label>
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} style={{
                padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
              }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Rating</label>
              <select value={ratingFilter} onChange={e => { setRatingFilter(e.target.value); setPage(1); }} style={{
                padding: '7px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer',
              }}>
                {RATING_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Sentiment */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Sentiment</label>
              <div className="d-flex gap-1">
                {SENTIMENT_OPTIONS.map(s => (
                  <button key={s} onClick={() => { setSentimentFilter(s); setPage(1); }} style={{
                    padding: '6px 14px', fontSize: 11.5, fontWeight: 600, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                    background: sentimentFilter === s ? '#45B6FE' : '#fff',
                    color: sentimentFilter === s ? '#fff' : 'var(--kh-text-muted)',
                    border: `1px solid ${sentimentFilter === s ? '#45B6FE' : '#d1d5db'}`,
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button onClick={resetFilters} style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <FiX size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table + Detail Panel */}
      <div className="d-flex gap-3" style={{ minHeight: 500 }}>

        {/* Table */}
        <div className="kh-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--kh-text-muted)' }}>
              <FiSearch size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No feedback found</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Adjust filters to view feedback entries.</div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                  <thead>
                    <tr style={{ background: '#F0F7FE' }}>
                      {['#', 'ID', 'Patient', 'Nurse', 'Category', 'Rating', 'Sentiment', 'Date', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: '#2E7DB8', borderBottom: '2px solid #45B6FE',
                          border: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((f, idx) => {
                      const sent = sentimentStyle[f.sentiment] || sentimentStyle.neutral;
                      return (
                        <tr key={f.id}
                          onClick={() => setSelected(f)}
                          style={{
                            cursor: 'pointer', transition: 'background 0.15s',
                            background: selected?.id === f.id ? '#F0F7FE' : idx % 2 === 1 ? '#fafbfc' : 'transparent',
                          }}
                          onMouseEnter={e => { if (selected?.id !== f.id) e.currentTarget.style.background = '#F0F7FE'; }}
                          onMouseLeave={e => { if (selected?.id !== f.id) e.currentTarget.style.background = idx % 2 === 1 ? '#fafbfc' : 'transparent'; }}
                        >
                          <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 700, border: '1px solid #e5e7eb' }}>
                            {(page - 1) * perPage + idx + 1}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#2E7DB8', border: '1px solid #e5e7eb' }}>{f.id}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{f.patient}</div>
                            <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{f.patientId} · {f.region}</div>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)', border: '1px solid #e5e7eb' }}>{f.nurse}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #d1e7dd' }}>{f.category}</span>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <div className="d-flex align-items-center gap-0">
                              {renderStars(f.rating)}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2,
                              background: sent.bg, color: sent.color, border: `1px solid ${sent.border}`,
                              display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize',
                            }}>{sent.icon} {f.sentiment}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)', whiteSpace: 'nowrap', border: '1px solid #e5e7eb' }}>{f.date}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', whiteSpace: 'nowrap' }}>View →</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '2px solid #d1e7dd', background: '#f8fdfb' }}>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                  Showing <span style={{ fontWeight: 700, color: '#2E7DB8' }}>{(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}</span> of {filtered.length}
                </span>
                <div className="d-flex gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronsLeft size={14} /></button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => {
                    const els = [];
                    if (idx > 0 && p - arr[idx - 1] > 1) els.push(<span key={`e-${p}`} style={{ padding: '5px 4px', fontSize: 12, color: '#9ca3af' }}>…</span>);
                    els.push(<button key={p} onClick={() => setPage(p)} style={{ background: page === p ? '#45B6FE' : '#fff', color: page === p ? '#fff' : 'var(--kh-text-muted)', border: `1px solid ${page === p ? '#45B6FE' : '#e5e7eb'}`, borderRadius: 2, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minWidth: 32 }}>{p}</button>);
                    return els;
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 8px', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: 'var(--kh-text-muted)', display: 'flex' }}><FiChevronsRight size={14} /></button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="kh-card" style={{ width: 420, flexShrink: 0, padding: 0, overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#F0F7FE', position: 'sticky', top: 0, zIndex: 2 }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#2E7DB8' }}>{selected.id}</span>
                    {(() => { const sent = sentimentStyle[selected.sentiment]; return (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: sent.bg, color: sent.color, border: `1px solid ${sent.border}`, display: 'inline-flex', alignItems: 'center', gap: 3, textTransform: 'uppercase' }}>{sent.icon} {selected.sentiment}</span>
                    ); })()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>{selected.patient}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>{selected.patientId} · {selected.region}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '5px 7px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiX size={14} /></button>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Quick info */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {[
                  { icon: <FiMapPin size={11} />, text: selected.region },
                  { icon: <FiUser size={11} />, text: selected.nurse },
                  { icon: <FiCalendar size={11} />, text: selected.date },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>

              {/* Rating display */}
              <div style={{ padding: '16px', borderRadius: 2, background: '#fffbeb', border: '1px solid #fef08a', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b', lineHeight: 1, marginBottom: 6 }}>{selected.rating}.0</div>
                <div className="d-flex justify-content-center gap-1 mb-2">
                  {renderStars(selected.rating)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e' }}>Patient Rating</div>
              </div>

              {/* Subject */}
              <div style={{ padding: '12px 14px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #d1e7dd', marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7DB8', marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2d3c', lineHeight: 1.5 }}>{selected.subject}</div>
              </div>

              {/* Category badge */}
              <div className="d-flex gap-2 mb-4">
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 2, background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #d1e7dd' }}>{selected.category}</span>
                {(() => { const sent = sentimentStyle[selected.sentiment]; return (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 2, background: sent.bg, color: sent.color, border: `1px solid ${sent.border}`, textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{sent.icon} {sent.label}</span>
                ); })()}
              </div>

              {/* Comment */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 6 }}>
                  <FiMessageCircle size={11} style={{ marginRight: 4 }} />Patient Comment
                </div>
                <div style={{ fontSize: 13, color: 'var(--kh-text)', lineHeight: 1.7, padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 2, fontStyle: 'italic' }}>
                  "{selected.comment}"
                </div>
              </div>

              {/* Nurse info */}
              <div style={{ padding: '12px 14px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 8 }}>Assigned Nurse</div>
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#45B6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {selected.nurse.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{selected.nurse}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>{selected.region} Region</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
