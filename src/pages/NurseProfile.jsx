import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar,
  FiUser, FiFileText, FiEdit2, FiDownload, FiEye,
  FiCheckCircle, FiClock, FiPrinter, FiMoreHorizontal,
  FiShield, FiAward, FiClipboard, FiUpload, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiRefreshCw, FiCheck, FiCamera,
} from 'react-icons/fi';
import { apiFetch } from '../api';

const ROLE_LABELS = {
  head_nurse: 'Head Nurse',
  supervising_nurse: 'Supervising Nurse',
  Office_nurse: 'Office Nurse',
  field_nurse: 'Field Nurse',
};

/* ── Tiny shared components ── */
const DataRow = ({ label, children, missing }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5 }}>
    <span style={{ flexShrink: 0, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ color: missing ? '#d97706' : 'var(--kh-text)', fontWeight: 500, textAlign: 'right', fontStyle: missing ? 'italic' : 'normal' }}>
      {children || (missing ? 'Not provided' : '—')}
    </span>
  </div>
);

const Panel = ({ title, icon, accent, children, action, style }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 12, ...style }}>
    <div style={{
      padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderLeft: accent ? `3px solid ${accent}` : 'none',
    }}>
      <div className="d-flex align-items-center gap-2">
        {icon && <span style={{ color: accent || '#45B6FE', display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text)' }}>{title}</span>
      </div>
      {action && action}
    </div>
    <div style={{ padding: '12px 16px' }}>{children}</div>
  </div>
);

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
    <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#45B6FE' }} />
    <span style={{ fontSize: 14, color: 'var(--kh-text-muted)' }}>Loading nurse profile…</span>
  </div>
);

const TABS = [
  { key: 'overview',   label: 'Overview',           icon: <FiUser size={14} /> },
  { key: 'diversity',  label: 'Diversity & Health',  icon: <FiShield size={14} /> },
  { key: 'education',  label: 'Education',           icon: <FiAward size={14} /> },
  { key: 'supporting', label: 'Supporting Info',     icon: <FiClipboard size={14} /> },
  { key: 'documents',  label: 'Documents',           icon: <FiFileText size={14} /> },
];

const DOCUMENT_TYPE_MAP = {
  profilePhoto: 'Profile Photo',
  idCard: 'National ID Card',
  passport: 'Passport',
  nursingLicense: 'Nursing License',
  dbsCertificate: 'Certificate',
};

/* ── Main Component ── */
export default function NurseProfile() {
  const { nurseId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  // ── Data state ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nurse, setNurse] = useState(null);
  const [diversity, setDiversity] = useState(null);
  const [education, setEducation] = useState(null);
  const [supporting, setSupporting] = useState(null);

  // ── Avatar upload ──
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingKey, setUploadingKey] = useState('');
  const avatarInputRef = useRef(null);
  const uploadNurseDocument = useCallback(async (file, key) => {
    const resolvedNurseId = nurse?._id || nurse?.id || nurseId;

    if (!resolvedNurseId) {
      throw new Error('Nurse ID is missing for upload.');
    }

    const fileName = file.name || 'document';
    const fileType = (fileName.includes('.') ? fileName.split('.').pop() : file.type.split('/').pop() || 'bin').toLowerCase();

    let presignResponse;
    try {
      presignResponse = await apiFetch('/media/b2/upload/presign', {
        method: 'POST',
        body: JSON.stringify({
          subfolder: 'nurses',
          fileName,
          fileType,
          contentType: file.type || fileType,
        }),
      });
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        throw new Error('Could not reach presign endpoint. Check backend URL, CORS, and network connectivity.');
      }
      throw requestError;
    }

    const presignResult = await presignResponse.json().catch(() => ({}));
    if (!presignResponse.ok) {
      throw new Error(presignResult.error || presignResult.message || `Presign failed (HTTP ${presignResponse.status})`);
    }

    const uploadConfig = presignResult.upload || presignResult.data?.upload || presignResult.result?.upload || presignResult;
    const mediaConfig = presignResult.media || presignResult.data?.media || presignResult.result?.media || {};

    const uploadUrl = uploadConfig.url || uploadConfig.uploadUrl || uploadConfig.presignedUrl;
    const uploadMethod = (uploadConfig.method || (uploadConfig.fields ? 'POST' : 'PUT')).toUpperCase();
    const uploadFields = uploadConfig.fields || null;
    const uploadHeaders = uploadConfig.headers || {};
    const objectKey = uploadConfig.objectKey || uploadConfig.key;
    const mediaId = mediaConfig.id || uploadConfig.mediaId || uploadConfig.id;

    if (!uploadUrl) {
      throw new Error('Presign response missing upload URL.');
    }
    if (!objectKey || !mediaId) {
      throw new Error('Presign response missing objectKey or mediaId.');
    }

    if (uploadMethod === 'POST' && uploadFields) {
      const uploadForm = new FormData();
      Object.entries(uploadFields).forEach(([field, value]) => uploadForm.append(field, value));
      uploadForm.append('file', file);

      let s3Response;
      try {
        s3Response = await fetch(uploadUrl, {
          method: 'POST',
          body: uploadForm,
        });
      } catch (uploadError) {
        if (uploadError instanceof TypeError) {
          throw new Error('Upload request to Backblaze failed. Verify bucket CORS allows your app origin for PUT/POST/OPTIONS.');
        }
        throw uploadError;
      }

      if (!s3Response.ok) {
        throw new Error(`File upload failed (HTTP ${s3Response.status})`);
      }
    } else {
      const normalizedHeaders = Object.entries(uploadHeaders).reduce((acc, [headerKey, headerValue]) => {
        acc[headerKey] = headerValue;
        return acc;
      }, {});

      if (!normalizedHeaders['Content-Type'] && !normalizedHeaders['content-type']) {
        normalizedHeaders['Content-Type'] = file.type || 'application/octet-stream';
      }

      let s3Response;
      try {
        s3Response = await fetch(uploadUrl, {
          method: uploadMethod,
          headers: normalizedHeaders,
          body: file,
        });
      } catch (uploadError) {
        if (uploadError instanceof TypeError) {
          throw new Error('Upload request to Backblaze failed. Verify bucket CORS allows your app origin for PUT/POST/OPTIONS.');
        }
        throw uploadError;
      }

      if (!s3Response.ok) {
        throw new Error(`File upload failed (HTTP ${s3Response.status})`);
      }
    }

    let registerResponse;
    try {
      registerResponse = await apiFetch('/nurses/add/documents', {
        method: 'POST',
        body: JSON.stringify({
          nurseId: resolvedNurseId,
          documentType: DOCUMENT_TYPE_MAP[key] || 'Certificate',
          objectKey,
          mediaId,
        }),
      });
    } catch (registerError) {
      if (registerError instanceof TypeError) {
        throw new Error('File uploaded but document registration failed due to network/CORS issue reaching backend.');
      }
      throw registerError;
    }

    const result = await registerResponse.json().catch(() => ({}));
    if (!registerResponse.ok) {
      throw new Error(result.error || result.message || `Upload failed (HTTP ${registerResponse.status})`);
    }

    return result;
  }, [nurse, nurseId]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKey('profilePhoto');
    try {
      await uploadNurseDocument(file, 'profilePhoto');
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      setKycDocs(prev => ({
        ...prev,
        profilePhoto: {
          url,
          fileName: file.name,
          fileType: file.type,
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
      }));
    } catch (uploadError) {
      alert(uploadError.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingKey('');
      e.target.value = '';
    }
  };

  // ── KYC document uploads ──
  const [kycDocs, setKycDocs] = useState({
    profilePhoto: null,   // { url, fileName, uploadedAt }
    idCard:       null,
    passport:     null,
    nursingLicense: null,
    dbsCertificate: null,
  });
  const kycInputRefs = {
    profilePhoto:   useRef(null),
    idCard:         useRef(null),
    passport:       useRef(null),
    nursingLicense: useRef(null),
    dbsCertificate: useRef(null),
  };
  const handleKycUpload = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKey(key);
    try {
      await uploadNurseDocument(file, key);
      const isImage = file.type.startsWith('image/');
      const url = isImage ? URL.createObjectURL(file) : null;
      setKycDocs(prev => ({
        ...prev,
        [key]: {
          url,
          fileName: file.name,
          fileType: file.type,
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
      }));

      if (key === 'profilePhoto' && url) {
        setAvatarUrl(url);
      }
    } catch (uploadError) {
      alert(uploadError.message || 'Failed to upload document.');
    } finally {
      setUploadingKey('');
      e.target.value = '';
    }
  };

  // ── Fetch all profile sections ──
  // GET /nurses/:id returns a single combined object:
  // { personal, diversity, education, supportingInfo }
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/nurses/${nurseId}`);
      if (!res.ok) {
        if (res.status === 404) { setError('not_found'); setLoading(false); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      // API returns { personal, diversity, education, supportingInfo }
      setNurse(data.personal || data.nurse || data);
      setDiversity(data.diversity || null);
      setEducation(data.education || null);
      setSupporting(data.supportingInfo || null);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [nurseId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Error / not-found screens ──
  if (loading) return <div className="page-wrapper"><Spinner /></div>;

  if (error === 'not_found') return (
    <div className="page-wrapper text-center py-5">
      <FiUser size={48} style={{ color: 'var(--kh-border)', marginBottom: 16 }} />
      <h6 style={{ color: 'var(--kh-text-muted)' }}>Nurse record not found</h6>
      <button className="btn btn-kh-primary mt-3" onClick={() => navigate('/workforce')}>
        Return to Nurse List
      </button>
    </div>
  );

  if (error) return (
    <div className="page-wrapper text-center py-5">
      <FiAlertCircle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
      <h6 style={{ color: 'var(--kh-text-muted)', marginBottom: 16 }}>{error}</h6>
      <div className="d-flex gap-2 justify-content-center">
        <button className="btn btn-kh-outline" onClick={() => navigate('/workforce')}>← Back</button>
        <button className="btn btn-kh-primary" onClick={fetchProfile}>
          <FiRefreshCw size={13} style={{ marginRight: 6 }} /> Retry
        </button>
      </div>
    </div>
  );

  if (!nurse) return null;

  // ── Derived values ──
  const n = nurse;
  const fullName = [n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—';
  const roleLabel = ROLE_LABELS[n.role] || n.role || '—';
  const status = n.status || 'active';
  const initials = fullName !== '—' ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const joinedDate = n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : '—';

  const hasDiversity = !!diversity;
  const hasEducation = !!education;
  const hasSupporting = !!supporting;
  const stepsComplete = [true, hasDiversity, hasEducation, hasSupporting].filter(Boolean).length;
  const isFullyComplete = stepsComplete === 4;

  /* ── RENDER ── */
  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>

      {/* Incomplete banner */}
      {!isFullyComplete && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2,
          padding: '10px 18px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <FiClock size={15} style={{ color: '#d97706', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            Registration incomplete — {stepsComplete}/4 steps completed.
          </span>
          <button
            onClick={() => navigate('/workforce')}
            style={{ marginLeft: 'auto', background: '#f59e0b', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Complete Registration
          </button>
        </div>
      )}

      {/* Header bar */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '16px 20px', marginBottom: 16 }}>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/workforce')} style={{
            background: 'none', border: '1px solid #e5e7eb', borderRadius: 2,
            padding: '7px 9px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex',
          }}><FiArrowLeft size={15} /></button>

          {/* Clickable avatar — click to upload a photo */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <div
            onClick={() => avatarInputRef.current?.click()}
            title="Click to upload photo"
            style={{
              position: 'relative', width: 52, height: 52, borderRadius: '50%',
              flexShrink: 0, cursor: 'pointer', overflow: 'hidden',
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #45B6FE, #2E8FD4)',
              boxShadow: '0 3px 10px rgba(69,182,254,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{initials}</span>
            }
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              opacity: 0, transition: 'opacity 0.18s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <FiCamera size={14} color="#fff" />
              <span style={{ fontSize: 8, color: '#fff', fontWeight: 700, letterSpacing: '0.3px' }}>PHOTO</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--kh-text)' }}>{fullName}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                background: status === 'active' ? '#F0F7FE' : '#fef3c7',
                color: status === 'active' ? '#1565A0' : '#92400e',
                border: `1px solid ${status === 'active' ? '#BAE0FD' : '#fde68a'}`,
              }}>
                {status === 'active' ? 'Active' : status === 'on-leave' ? 'On Leave' : status}
              </span>
              {!isFullyComplete && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                  <FiClock size={10} style={{ marginRight: 3 }} />Step {stepsComplete}/4
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 3 }}>
              <span style={{ fontWeight: 600, color: 'var(--kh-text)' }}>{n._id || n.id}</span>
              <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
              {roleLabel}
              {n.mmcPinNo && <><span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>License: <span style={{ fontWeight: 600 }}>{n.mmcPinNo}</span></>}
            </div>
          </div>

          <div className="d-flex gap-4 flex-wrap" style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>
            {n.phone && <div className="d-flex align-items-center gap-1"><FiPhone size={12} /><span>{n.phone}</span></div>}
            {n.email && <div className="d-flex align-items-center gap-1"><FiMail size={12} /><span>{n.email}</span></div>}
            <div>
              <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px' }}>Joined </span>
              <span style={{ fontWeight: 600, color: 'var(--kh-text)', fontSize: 12 }}>{joinedDate}</span>
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: '#e5e7eb' }} />
          <div className="d-flex gap-1">
            <button title="Print" style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '7px 9px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiPrinter size={14} /></button>
            <button title="Edit" style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '7px 9px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiEdit2 size={14} /></button>
            <button title="Refresh" onClick={fetchProfile} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '7px 9px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiRefreshCw size={14} /></button>
          </div>
        </div>
      </div>

      {/* Tab card */}
      <div className="kh-card">
        {/* Blue tab strip */}
        <div style={{ background: '#45B6FE', padding: '0 20px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(t => {
            const tabHasData = t.key === 'overview' ? true
              : t.key === 'diversity'  ? hasDiversity
              : t.key === 'education'  ? hasEducation
              : t.key === 'supporting' ? hasSupporting
              : true;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 18px', fontSize: 12.5, whiteSpace: 'nowrap',
                fontWeight: tab === t.key ? 700 : 500, border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.75)',
                borderBottom: tab === t.key ? '3px solid #fff' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                {t.icon} {t.label}
                {t.key !== 'overview' && t.key !== 'documents' && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', marginLeft: 2,
                    background: tabHasData ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                    display: 'inline-block',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: 20 }}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <div className="row g-3 align-items-stretch">
              <div className="col-lg-4 d-flex flex-column">
                <Panel title="Personal Information" icon={<FiUser size={14} />} style={{ flex: 1, marginBottom: 0 }}>
                  <DataRow label="Full Name">{fullName}</DataRow>
                  <DataRow label="Email" missing={!n.email}>{n.email}</DataRow>
                  <DataRow label="Phone" missing={!n.phone}>{n.phone}</DataRow>
                  <DataRow label="Home Telephone">{n.homeTelephone}</DataRow>
                  <DataRow label="Gender" missing={!n.gender}>{n.gender}</DataRow>
                  <DataRow label="Address" missing={!n.address}>{n.address}</DataRow>
                  <DataRow label="Citizenship">{n.citizenship}</DataRow>
                  <DataRow label="Title">{n.title}</DataRow>
                </Panel>
              </div>

              <div className="col-lg-4 d-flex flex-column">
                <Panel title="Professional Details" icon={<FiAward size={14} />} accent="#3b82f6" style={{ flex: 1, marginBottom: 0 }}>
                  <DataRow label="Nurse ID">{n._id || n.id}</DataRow>
                  <DataRow label="Job Reference">{n.jobReference}</DataRow>
                  <DataRow label="Job Title" missing={!n.jobTitle}>{n.jobTitle}</DataRow>
                  <DataRow label="Role">{roleLabel}</DataRow>
                  <DataRow label="MMC Pin No." missing={!n.mmcPinNo}>{n.mmcPinNo}</DataRow>
                  <DataRow label="Date Joined">{joinedDate}</DataRow>
                  <DataRow label="Status">
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 2,
                      background: status === 'active' ? '#F0F7FE' : '#fef3c7',
                      color: status === 'active' ? '#1565A0' : '#92400e',
                    }}>
                      {status === 'active' ? 'Active' : status === 'on-leave' ? 'On Leave' : status}
                    </span>
                  </DataRow>
                </Panel>
              </div>

              <div className="col-lg-4 d-flex flex-column">
                <Panel title="Registration Progress" icon={<FiClipboard size={14} />} style={{ flex: 1, marginBottom: 0 }}>
                  {[
                    { label: 'Personal Info',           done: true },
                    { label: 'Diversity & Health',      done: hasDiversity },
                    { label: 'Education & Employment',  done: hasEducation },
                    { label: 'Supporting Info',         done: hasSupporting },
                  ].map((s, i) => (
                    <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: s.done ? '#45B6FE' : '#f3f4f6',
                        color: s.done ? '#fff' : '#9ca3af',
                      }}>
                        {s.done ? <FiCheck size={11} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: s.done ? 'var(--kh-text)' : '#9ca3af' }}>{s.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: s.done ? '#45B6FE' : '#d97706' }}>
                        {s.done ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {!isFullyComplete && (
                    <button
                      onClick={() => navigate('/workforce')}
                      style={{ marginTop: 14, width: '100%', background: '#f59e0b', border: 'none', borderRadius: 6, padding: '8px', fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                    >
                      Complete Registration →
                    </button>
                  )}
                </Panel>
              </div>
            </div>
          )}

          {/* ═══ DIVERSITY & HEALTH ═══ */}
          {tab === 'diversity' && (
            <div className="row g-3">
              {!hasDiversity ? (
                <div className="col-12">
                  <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <FiAlertCircle size={36} style={{ color: '#d97706', marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Diversity & Health information not yet submitted</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Step 2 of the nurse registration has not been completed.</div>
                    <button onClick={() => navigate('/workforce')} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, padding: '9px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                      Complete Registration
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="col-md-6">
                    <Panel title="Diversity Information" icon={<FiUser size={14} />} accent="#8b5cf6">
                      <DataRow label="Race / Ethnicity" missing={!diversity.race}>{diversity.race}</DataRow>
                      <DataRow label="Religion" missing={!diversity.religion}>{diversity.religion}</DataRow>
                    </Panel>
                  </div>
                  <div className="col-md-6">
                    <Panel title="Health Disclosures" icon={<FiShield size={14} />} accent="#ef4444">
                      <DataRow label="Disability">{diversity.disability || 'No'}</DataRow>
                      {diversity.disability === 'Yes' && (
                        <DataRow label="Disability Detail">{diversity.disability_detail}</DataRow>
                      )}
                      <DataRow label="Criminal Records">{diversity.criminal_records || 'No'}</DataRow>
                      {diversity.criminal_records === 'Yes' && (
                        <DataRow label="Criminal Record Detail">{diversity.criminal_record_detail}</DataRow>
                      )}
                    </Panel>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ EDUCATION ═══ */}
          {tab === 'education' && (
            <div>
              {!hasEducation ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                  <FiAlertCircle size={36} style={{ color: '#d97706', marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Education & Employment not yet submitted</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Step 3 of the nurse registration has not been completed.</div>
                  <button onClick={() => navigate('/workforce')} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, padding: '9px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                    Complete Registration
                  </button>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12">
                    <Panel title="Qualifications" icon={<FiAward size={14} />} accent="#3b82f6"
                      action={<span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{(education.qualifications || []).length} records</span>}
                    >
                      {(education.qualifications || []).length === 0 ? (
                        <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '12px 0', textAlign: 'center' }}>No qualifications recorded</div>
                      ) : (
                        <div className="table-responsive">
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#fafbfc' }}>
                                {['Qualification', 'Institution', 'Result / Grade', 'Year'].map((h, i) => (
                                  <th key={i} style={{ padding: '8px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', borderBottom: '1px solid #f3f4f6', textAlign: 'left' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {education.qualifications.map((q, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{q.name || '—'}</td>
                                  <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text)' }}>{q.institution || '—'}</td>
                                  <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text)' }}>{q.result || '—'}</td>
                                  <td style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--kh-text-muted)' }}>{q.year || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Panel>
                  </div>

                  {(education.trainingCourses || []).filter(t => t).length > 0 && (
                    <div className="col-md-5">
                      <Panel title="Training Courses" icon={<FiCheckCircle size={14} />} accent="#10b981">
                        {education.trainingCourses.filter(t => t).map((course, i) => (
                          <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <FiCheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                            <span style={{ fontSize: 12.5, color: 'var(--kh-text)' }}>{course}</span>
                          </div>
                        ))}
                      </Panel>
                    </div>
                  )}

                  <div className="col-12">
                    <Panel title="Employment History" icon={<FiClipboard size={14} />} accent="#f59e0b"
                      action={<span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '2px 10px' }}>{(education.employmentHistory || []).length} {(education.employmentHistory || []).length === 1 ? 'record' : 'records'}</span>}
                    >
                      {(education.employmentHistory || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--kh-text-muted)', fontSize: 13 }}>No employment history recorded</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {education.employmentHistory.map((emp, i) => (
                            <div key={i} style={{
                              display: 'flex', gap: 0,
                              borderBottom: i < education.employmentHistory.length - 1 ? '1px solid #f3f4f6' : 'none',
                              paddingBottom: 20, marginBottom: 20,
                            }}>
                              {/* Timeline spine */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16, flexShrink: 0 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontSize: 13, fontWeight: 800,
                                  boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                                }}>{i + 1}</div>
                                {i < education.employmentHistory.length - 1 && (
                                  <div style={{ width: 2, flex: 1, background: '#f3f4f6', marginTop: 6, minHeight: 24 }} />
                                )}
                              </div>

                              {/* Card body */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Header row */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--kh-text)', lineHeight: 1.3 }}>{emp.jobTitle || '—'}</div>
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#45B6FE', marginTop: 2 }}>{emp.employerName || '—'}</div>
                                  </div>
                                  {emp.startDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#92400e', whiteSpace: 'nowrap' }}>
                                      <FiCalendar size={11} />
                                      {new Date(emp.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </div>
                                  )}
                                </div>

                                {/* Info grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px 20px', marginBottom: 10 }}>
                                  {[
                                    { label: 'Business Type',     value: emp.businessType },
                                    { label: 'Grade',             value: emp.grade },
                                    { label: 'Reporting Officer', value: emp.reportingOfficer },
                                    { label: 'Contact Person',    value: emp.contactPerson },
                                  ].filter(f => f.value).map(({ label, value }) => (
                                    <div key={label}>
                                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 1 }}>{label}</div>
                                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)' }}>{value}</div>
                                    </div>
                                  ))}
                                </div>

                                {/* Address */}
                                {emp.address && (
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 6 }}>
                                    <FiMapPin size={12} style={{ marginTop: 2, flexShrink: 0, color: '#9ca3af' }} />
                                    <span>{emp.address}</span>
                                  </div>
                                )}

                                {/* Full-width fields */}
                                {emp.descriptionOfDuties && (
                                  <div style={{ background: '#f8f9fa', border: '1px solid #f3f4f6', borderRadius: 6, padding: '8px 12px', marginBottom: 6 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 3 }}>Description of Duties</div>
                                    <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.5 }}>{emp.descriptionOfDuties}</div>
                                  </div>
                                )}

                                {emp.reasonForLeaving && (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}>
                                    <span style={{ fontWeight: 700, color: '#991b1b' }}>Reason for leaving:</span>
                                    <span style={{ color: '#7f1d1d' }}>{emp.reasonForLeaving}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Panel>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SUPPORTING INFO ═══ */}
          {tab === 'supporting' && (
            <div className="row g-3">
              {!hasSupporting ? (
                <div className="col-12">
                  <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <FiAlertCircle size={36} style={{ color: '#d97706', marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Supporting Information not yet submitted</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Step 4 of the nurse registration has not been completed.</div>
                    <button onClick={() => navigate('/workforce')} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, padding: '9px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                      Complete Registration
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="col-md-6">
                    <Panel title="Staff Relationship" icon={<FiUser size={14} />} accent="#8b5cf6">
                      <DataRow label="Has Staff Relation">{supporting.staffRelation || 'No'}</DataRow>
                      {supporting.staffRelation === 'Yes' && (
                        <DataRow label="Relation Detail">{supporting.staffRelationDetail}</DataRow>
                      )}
                    </Panel>
                    <Panel title="Vacancy Source" icon={<FiFileText size={14} />} accent="#3b82f6">
                      <DataRow label="How Applied">{supporting.vacancyAdvertised || '—'}</DataRow>
                      {supporting.vacancyDetail && Object.entries(supporting.vacancyDetail).map(([k, v]) => (
                        <DataRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')}>{v}</DataRow>
                      ))}
                    </Panel>
                  </div>
                  <div className="col-md-6">
                    <Panel title="Referees" icon={<FiUser size={14} />} accent="#10b981"
                      action={<span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{(supporting.referees || []).filter(r => r.name).length} provided</span>}
                    >
                      {(supporting.referees || []).filter(r => r.name).length === 0 ? (
                        <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '12px 0', textAlign: 'center' }}>No referees provided</div>
                      ) : (
                        (supporting.referees || []).filter(r => r.name).map((ref, i) => (
                          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 4 }}>Referee {i + 1}: {ref.name}</div>
                            {ref.address && <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 2 }}><FiMapPin size={11} style={{ marginRight: 4 }} />{ref.address}</div>}
                            {ref.telephone && <div style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}><FiPhone size={11} style={{ marginRight: 4 }} />{ref.telephone}</div>}
                          </div>
                        ))
                      )}
                    </Panel>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ DOCUMENTS / KYC ═══ */}
          {tab === 'documents' && (() => {
            const KYC_SLOTS = [
              { key: 'profilePhoto',   label: 'Profile Photo',    hint: 'Clear face photo (JPG/PNG)', isPhoto: true,  accent: '#45B6FE', accentBg: '#E8F4FE' },
              { key: 'idCard',         label: 'National ID Card', hint: 'Front & back scan (PDF/IMG)', isPhoto: false, accent: '#8b5cf6', accentBg: '#f3f0ff' },
              { key: 'passport',       label: 'Passport',         hint: 'Bio-data page (PDF/IMG)',    isPhoto: false, accent: '#3b82f6', accentBg: '#eff6ff' },
              { key: 'nursingLicense', label: 'Nursing License',  hint: 'Valid license document',    isPhoto: false, accent: '#10b981', accentBg: '#ecfdf5' },
              { key: 'dbsCertificate', label: 'DBS Certificate',  hint: 'Enhanced DBS check',        isPhoto: false, accent: '#f59e0b', accentBg: '#fffbeb' },
            ];
            const uploadedCount = Object.values(kycDocs).filter(Boolean).length;
            const allVerified = uploadedCount === KYC_SLOTS.length;

            return (
              <div>
                {uploadingKey && (
                  <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>
                    Uploading {DOCUMENT_TYPE_MAP[uploadingKey] || uploadingKey}...
                  </div>
                )}
                {/* ── KYC Status Banner ── */}
                <div style={{
                  background: allVerified ? '#ecfdf5' : uploadedCount > 0 ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${allVerified ? '#a7f3d0' : uploadedCount > 0 ? '#fde68a' : '#fecaca'}`,
                  borderRadius: 7, padding: '12px 18px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: allVerified ? '#10b981' : uploadedCount > 0 ? '#f59e0b' : '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {allVerified
                      ? <FiCheckCircle size={18} color="#fff" />
                      : <FiShield size={18} color="#fff" />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: allVerified ? '#065f46' : uploadedCount > 0 ? '#92400e' : '#991b1b' }}>
                      {allVerified ? 'KYC Verification Complete' : uploadedCount > 0 ? 'KYC Verification In Progress' : 'KYC Documents Required'}
                    </div>
                    <div style={{ fontSize: 12, color: allVerified ? '#047857' : uploadedCount > 0 ? '#b45309' : '#b91c1c', marginTop: 2 }}>
                      {uploadedCount}/{KYC_SLOTS.length} documents uploaded
                      {!allVerified && ' — please upload all required documents to complete KYC verification.'}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: 120, flexShrink: 0 }}>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, transition: 'width 0.4s',
                        width: `${(uploadedCount / KYC_SLOTS.length) * 100}%`,
                        background: allVerified ? '#10b981' : uploadedCount > 0 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--kh-text-muted)', marginTop: 3, textAlign: 'right' }}>
                      {Math.round((uploadedCount / KYC_SLOTS.length) * 100)}%
                    </div>
                  </div>
                </div>

                {/* ── KYC Photo (prominent, top) ── */}
                {(() => {
                  const slot = KYC_SLOTS[0]; // profilePhoto
                  const doc = kycDocs.profilePhoto;
                  const photoSrc = doc?.url || avatarUrl;
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7,
                      overflow: 'hidden', marginBottom: 16,
                    }}>
                      {/* Panel header */}
                      <div style={{
                        padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderLeft: `3px solid ${slot.accent}`,
                      }}>
                        <div className="d-flex align-items-center gap-2">
                          <FiCamera size={14} style={{ color: slot.accent }} />
                          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>KYC Profile Photo</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                            background: photoSrc ? '#ecfdf5' : '#fef2f2',
                            color: photoSrc ? '#065f46' : '#991b1b',
                            border: `1px solid ${photoSrc ? '#a7f3d0' : '#fecaca'}`,
                          }}>
                            {photoSrc ? '✓ Uploaded' : 'Required'}
                          </span>
                        </div>
                        <input ref={kycInputRefs.profilePhoto} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleKycUpload('profilePhoto')} />
                        <button
                          onClick={() => kycInputRefs.profilePhoto.current?.click()}
                          disabled={uploadingKey === 'profilePhoto'}
                          style={{ background: 'var(--kh-primary)', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <FiCamera size={13} /> {uploadingKey === 'profilePhoto' ? 'Uploading...' : (photoSrc ? 'Replace Photo' : 'Upload Photo')}
                        </button>
                      </div>

                      <div style={{ padding: '20px 24px', display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Photo display */}
                        <div
                          onClick={() => kycInputRefs.profilePhoto.current?.click()}
                          style={{
                            width: 200, height: 240, borderRadius: 7, flexShrink: 0, cursor: 'pointer',
                            border: photoSrc ? '2px solid var(--kh-primary)' : '2px dashed #d1d5db',
                            background: photoSrc ? 'transparent' : '#f8f9fa',
                            overflow: 'hidden', position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: photoSrc ? '0 4px 16px rgba(69,182,254,0.2)' : 'none',
                          }}
                        >
                          {photoSrc ? (
                            <>
                              <img src={photoSrc} alt="KYC Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              {/* Hover overlay */}
                              <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                                opacity: 0, transition: 'opacity 0.18s',
                              }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0}
                              >
                                <FiCamera size={22} color="#fff" />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Replace</span>
                              </div>
                            </>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '0 12px' }}>
                              <FiCamera size={28} style={{ color: '#9ca3af', marginBottom: 8 }} />
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Click to upload<br />KYC photo</div>
                            </div>
                          )}
                        </div>

                        {/* Info beside photo */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 6 }}>
                            {photoSrc ? 'Photo on file' : 'No photo uploaded'}
                          </div>
                          {doc?.fileName && (
                            <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600 }}>File:</span> {doc.fileName}
                            </div>
                          )}
                          {doc?.uploadedAt && (
                            <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginBottom: 10 }}>
                              <span style={{ fontWeight: 600 }}>Uploaded:</span> {doc.uploadedAt}
                            </div>
                          )}
                          {!doc && avatarUrl && (
                            <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>
                              ⚠ Using profile avatar — upload a dedicated KYC photo for verification purposes.
                            </div>
                          )}
                          <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', lineHeight: 1.7 }}>
                            <div>• Minimum resolution: <strong>300×400 px</strong></div>
                            <div>• Clear face, front-facing, no filters</div>
                            <div>• Formats accepted: <strong>JPG, PNG</strong></div>
                            <div>• Max file size: <strong>5 MB</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Other KYC document slots ── */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderLeft: '3px solid #8b5cf6',
                  }}>
                    <div className="d-flex align-items-center gap-2">
                      <FiFileText size={14} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identity & Compliance Documents</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>
                      {Object.entries(kycDocs).filter(([k, v]) => k !== 'profilePhoto' && v).length}/{KYC_SLOTS.length - 1} uploaded
                    </span>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                      {KYC_SLOTS.slice(1).map(slot => {
                        const doc = kycDocs[slot.key];
                        return (
                          <div key={slot.key} style={{
                            border: doc ? `1.5px solid ${slot.accent}` : '1.5px dashed #d1d5db',
                            borderRadius: 7, overflow: 'hidden',
                            background: doc ? slot.accentBg : '#fafafa',
                            transition: 'all 0.15s',
                          }}>
                            {/* Header strip */}
                            <div style={{
                              padding: '8px 12px', borderBottom: doc ? `1px solid ${slot.accent}33` : '1px solid #f3f4f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: doc ? `${slot.accentBg}` : '#f3f4f6',
                            }}>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: doc ? slot.accent : '#6b7280' }}>{slot.label}</span>
                              <span style={{
                                fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                                background: doc ? '#ecfdf5' : '#fef2f2',
                                color: doc ? '#065f46' : '#991b1b',
                              }}>
                                {doc ? '✓ Uploaded' : 'Missing'}
                              </span>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '14px 12px' }}>
                              {doc ? (
                                <>
                                  {doc.url ? (
                                    <img src={doc.url} alt={slot.label} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 5, marginBottom: 8, display: 'block' }} />
                                  ) : (
                                    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', borderRadius: 5, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                                      <FiFileText size={22} style={{ color: slot.accent }} />
                                      <div>
                                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--kh-text)' }}>{doc.fileName}</div>
                                        <div style={{ fontSize: 10, color: 'var(--kh-text-muted)' }}>PDF document</div>
                                      </div>
                                    </div>
                                  )}
                                  <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginBottom: 8 }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</div>
                                    <div style={{ color: '#6b7280' }}>Uploaded: {doc.uploadedAt}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button title="View" style={{ flex: 1, background: '#fff', border: `1px solid ${slot.accent}`, borderRadius: 6, padding: '5px 0', fontSize: 11.5, fontWeight: 700, color: slot.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                      <FiEye size={12} /> View
                                    </button>
                                    <input ref={kycInputRefs[slot.key]} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleKycUpload(slot.key)} />
                                    <button onClick={() => kycInputRefs[slot.key].current?.click()} disabled={uploadingKey === slot.key} style={{ flex: 1, background: slot.accent, border: 'none', borderRadius: 6, padding: '5px 0', fontSize: 11.5, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: uploadingKey === slot.key ? 0.75 : 1 }}>
                                      <FiUpload size={12} /> {uploadingKey === slot.key ? 'Uploading...' : 'Replace'}
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
                                    <FiUpload size={22} style={{ color: '#9ca3af', marginBottom: 6 }} />
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 3 }}>No file uploaded</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>{slot.hint}</div>
                                    <input ref={kycInputRefs[slot.key]} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleKycUpload(slot.key)} />
                                    <button
                                      onClick={() => kycInputRefs[slot.key].current?.click()}
                                      disabled={uploadingKey === slot.key}
                                      style={{ background: slot.accent, border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: uploadingKey === slot.key ? 0.75 : 1 }}
                                    >
                                      <FiUpload size={12} /> {uploadingKey === slot.key ? 'Uploading...' : `Upload ${slot.label}`}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
