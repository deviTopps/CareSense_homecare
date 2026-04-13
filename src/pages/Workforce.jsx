import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiChevronRight, FiChevronLeft, FiChevronsLeft, FiChevronsRight, FiArrowUp, FiArrowDown, FiCamera, FiUpload, FiX, FiCheck, FiSave, FiArrowRight, FiAlertCircle, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';
import { apiFetch } from '../api';
import compressImage from '../utils/compressImage';

const ROLE_LABELS = { head_nurse: 'Head Nurse', supervising_nurse: 'Supervising Nurse', Office_nurse: 'Office Nurse', field_nurse: 'Field Nurse' };

// Track fully-completed nurse registrations locally so we don't depend on API field presence
const getCompletedNurseIds = () => { try { return new Set(JSON.parse(localStorage.getItem('completedNurseIds') || '[]')); } catch { return new Set(); } };
const markNurseComplete = (id) => { const s = getCompletedNurseIds(); s.add(id); localStorage.setItem('completedNurseIds', JSON.stringify([...s])); };

const ROWS_OPTIONS = [5, 10, 15];

const STEPS = [
  { key: 'personal', label: 'Personal Info', endpoint: '/nurses/create/personal-info' },
  { key: 'diversity', label: 'Diversity Info', endpoint: '/nurses/create/diversity-info' },
  { key: 'education', label: 'Education & Employment', endpoint: '/nurses/create/education-info' },
  { key: 'supporting', label: 'Supporting Info', endpoint: '/nurses/create/supporting-info' },
];

const emptyQualification = { name: '', institution: '', result: '', year: '' };
const emptyEmployment = { employerName: '', address: '', businessType: '', jobTitle: '', startDate: '', grade: '', reportingOfficer: '', reasonForLeaving: '', descriptionOfDuties: '', contactPerson: '' };
const emptyReferee = { name: '', address: '', telephone: '' };

const initialFormState = {
  // Step 1 — Personal Info
  jobReference: '', jobTitle: '', title: '', lastName: '', firstName: '', gender: '', email: '', address: '', mmcPinNo: '', phone: '', homeTelephone: '', citizenship: 'Ghana', role: 'field_nurse', password: '',
  // Step 2 — Diversity Info
  race: '', religion: '', disability: 'No', disability_detail: '', criminal_records: 'No', criminal_record_detail: '',
  // Step 3 — Education & Employment
  qualifications: [{ ...emptyQualification }],
  trainingCourses: [''],
  employmentHistory: [{ ...emptyEmployment }],
  // Step 4 — Supporting Info
  staffRelation: 'No', staffRelationDetail: '', vacancyAdvertised: '', vacancyDetail: {},
  referees: [{ ...emptyReferee }, { ...emptyReferee }],
};

export default function Workforce() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch nurses from API ──
  const fetchNurses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/nurses');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.nurses || data.data || [];
      const completedIds = getCompletedNurseIds();
      const mapped = list.map((n) => {
        const id = n._id || n.id;
        // Trust API-provided flag first, then localStorage, then assume incomplete
        const isComplete = n.registrationComplete === true || n.isComplete === true || completedIds.has(id);
        const completedStep = isComplete ? 4 : (n.registrationStep ?? 1);
        return {
          id,
          name: [n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—',
          license: n.mmcPinNo || '—',
          role: ROLE_LABELS[n.role] || n.role || n.jobTitle || '—',
          phone: n.phone || '—',
          email: n.email || '—',
          gender: n.gender || '—',
          joined: n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : '—',
          address: n.address || '—',
          completedStep,
          isComplete,
        };
      });
      setNurses(mapped);
    } catch (err) {
      console.error('Failed to fetch nurses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNurses(); }, [fetchNurses]);

  // ── Multi-step form state ──
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...initialFormState, qualifications: [{ ...emptyQualification }], trainingCourses: [''], employmentHistory: [{ ...emptyEmployment }], referees: [{ ...emptyReferee }, { ...emptyReferee }] });
  const [nurseId, setNurseId] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // nurse to delete
  const [deleting, setDeleting] = useState(false);

  // ── Table logic ──
  const incompleteNurses = nurses.filter(n => !n.isComplete);
  const filtered = nurses.filter(n => {
    const sm = !search || n.name.toLowerCase().includes(search.toLowerCase()) || n.license.toLowerCase().includes(search.toLowerCase()) || n.email.toLowerCase().includes(search.toLowerCase());
    const fm = filter === 'All' || (filter === 'Incomplete' ? !n.isComplete : true);
    return sm && fm;
  });
  const handleSort = col => { if (sortField === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortField(col); setSortDir('asc'); } };
  const SortIcon = ({ col }) => { if (sortField !== col) return null; return sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />; };
  const sorted = [...filtered].sort((a, b) => { if (!sortField) return 0; const av = a[sortField], bv = b[sortField]; const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv; return sortDir === 'asc' ? cmp : -cmp; });
  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const startRow = (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, sorted.length);
  const paged = sorted.slice(startRow - 1, endRow);
  const pgBtn = (onClick, disabled, children) => (<button onClick={onClick} disabled={disabled} style={{ padding: '6px 10px', border: '1px solid var(--kh-border-light)', borderRadius: 2, background: disabled ? 'var(--kh-off-white)' : '#fff', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--kh-text-muted)' : 'var(--kh-text)', fontSize: 13, display: 'flex', alignItems: 'center' }}>{children}</button>);

  // ── Form helpers ──
  const u = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const updateArrayItem = (field, idx, key, value) => {
    setForm(p => {
      const arr = [...p[field]];
      if (typeof arr[idx] === 'object') arr[idx] = { ...arr[idx], [key]: value };
      else arr[idx] = value;
      return { ...p, [field]: arr };
    });
  };
  const addArrayItem = (field, template) => setForm(p => ({ ...p, [field]: [...p[field], typeof template === 'object' ? { ...template } : template] }));
  const removeArrayItem = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB'); return; }
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.75 });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(compressed);
    }
  };

  const resetAll = () => {
    setStep(0); setForm({ ...initialFormState, qualifications: [{ ...emptyQualification }], trainingCourses: [''], employmentHistory: [{ ...emptyEmployment }], referees: [{ ...emptyReferee }, { ...emptyReferee }] });
    setNurseId(null); setCompletedSteps([]); setSaving(false); setApiError(''); setPhotoPreview(null);
  };

  const handleDeleteNurse = async (nurse, e) => {
    e.stopPropagation();
    setDeleteTarget(nurse);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/nurses/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Delete failed (HTTP ${res.status})`);
      }
      setNurses(prev => prev.filter(n => n.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete nurse. Please try again.');
    } finally {
      setDeleting(false);
    }
  };
  const closeModal = () => { setShowModal(false); resetAll(); fetchNurses(); };

  const continueRegistration = (nurse, e) => {
    e.stopPropagation();
    const completedCount = Math.min(Math.max(nurse.completedStep || 1, 1), STEPS.length);
    const doneSteps = Array.from({ length: completedCount }, (_, index) => index);
    const nextStep = Math.min(completedCount, STEPS.length - 1);
    setNurseId(nurse.id);
    setCompletedSteps(doneSteps);
    setStep(nextStep);
    setShowModal(true);
  };

  // ── Save current step to API ──
  const saveStep = async () => {
    // Skip API call if this step was already completed (e.g. continuing an incomplete registration)
    if (completedSteps.includes(step)) {
      if (step < STEPS.length - 1) setStep(step + 1);
      return;
    }
    setSaving(true); setApiError('');
    try {
      let body;
      if (step === 0) {
        body = {
          jobReference: form.jobReference, jobTitle: form.jobTitle, title: form.title,
          lastName: form.lastName, firstName: form.firstName, gender: form.gender,
          email: form.email, address: form.address, mmcPinNo: form.mmcPinNo,
          phone: form.phone, homeTelephone: form.homeTelephone,
          citizenship: form.citizenship, role: form.role, password: form.password,
        };
      } else if (step === 1) {
        body = {
          nurseId, race: form.race, religion: form.religion,
          disability: form.disability,
          disability_detail: form.disability === 'Yes' ? form.disability_detail || 'N/A' : 'N/A',
          criminal_records: form.criminal_records,
          criminal_record_detail: form.criminal_records === 'Yes' ? form.criminal_record_detail || 'N/A' : 'N/A',
        };
      } else if (step === 2) {
        body = {
          nurseId,
          qualifications: form.qualifications.filter(q => q.name || q.institution),
          trainingCourses: form.trainingCourses.filter(t => t.trim()),
          employmentHistory: form.employmentHistory.filter(e => e.employerName),
        };
      } else if (step === 3) {
        body = {
          nurseId,
          staffRelation: form.staffRelation, staffRelationDetail: form.staffRelation === 'Yes' ? form.staffRelationDetail || 'N/A' : 'N/A',
          vacancyAdvertised: form.vacancyAdvertised,
          referees: form.referees.filter(r => r.name),
        };
      }
      const res = await apiFetch(STEPS[step].endpoint, { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();

      // Resolve the nurse id — prefer body.nurseId (always fresh) over stale state
      const resolvedId = body?.nurseId || nurseId;

      if (!res.ok) {
        const msg = (data.error || data.message || '').toLowerCase();
        // If data already exists for this step, treat as completed and advance
        if (msg.includes('already exists')) {
          setCompletedSteps(prev => [...new Set([...prev, step])]);
          if (step < STEPS.length - 1) {
            setStep(step + 1);
          } else {
            // Last step already existed — still mark complete
            if (resolvedId) markNurseComplete(resolvedId);
          }
          return;
        }
        throw new Error(data.error || data.message || 'Failed to save');
      }
      // Step 0 returns nurseId — extract and store it
      let currentNurseId = resolvedId;
      if (step === 0) {
        const id = data.nurse?._id || data.nurse?.id || data.nurseId || data._id || data.id || data.nurse?.uuid || data.uuid;
        if (id) { setNurseId(id); currentNurseId = id; }
      }
      setCompletedSteps(prev => [...new Set([...prev, step])]);
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        // All 4 steps done — persist completion so the table shows Active on reload
        if (currentNurseId) markNurseComplete(currentNurseId);
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──
  const sectionTitleStyle = { fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2E7DB8', marginBottom: 14 };
  const fieldLabelStyle = { fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)', marginBottom: 6 };
  const sectionCardStyle = { padding: 18, border: '1px solid var(--kh-border-light)', borderRadius: 12, background: '#fff' };
  const inp = 'form-control form-control-kh';
  const sel = 'form-select form-control-kh';

  // ── Step content renderers ──
  const renderStep0 = () => (
    <div className="d-grid" style={{ gap: 18 }}>
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Passport Photo</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {photoPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={photoPreview} alt="Preview" loading="lazy" style={{ width: 130, height: 130, objectFit: 'cover', borderRadius: '50%', border: '3px solid #D6ECFC', boxShadow: '0 4px 12px rgba(45,127,184,0.12)' }} />
                <button onClick={() => setPhotoPreview(null)} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}><FiX size={13} /></button>
              </div>
            ) : (
              <label htmlFor="nurse-photo-upload" style={{ width: 130, height: 130, borderRadius: '50%', cursor: 'pointer', border: '2px dashed #B8D9F0', background: '#F0F7FE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#D6ECFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCamera size={20} color="#2E7DB8" /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8' }}>Upload</span>
              </label>
            )}
            <input id="nurse-photo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </div>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)', marginBottom: 6 }}>Upload a passport-style photo</div>
            <ul style={{ fontSize: 12, color: 'var(--kh-text-muted)', margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Clear, front-facing headshot</li><li>JPG, PNG, or WebP — Max 5 MB</li>
            </ul>
            {!photoPreview && <label htmlFor="nurse-photo-upload" className="btn" style={{ marginTop: 12, fontSize: 12, fontWeight: 700, padding: '7px 18px', background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #D6ECFC', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiUpload size={13} /> Choose File</label>}
            {photoPreview && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27ae60' }} /><span style={{ fontSize: 12, color: '#27ae60', fontWeight: 600 }}>Photo uploaded</span></div>}
          </div>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Job Details</div>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Job Reference</label><input className={inp} value={form.jobReference} onChange={e => u('jobReference', e.target.value)} placeholder="e.g. New Job" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Job Title</label><input className={inp} value={form.jobTitle} onChange={e => u('jobTitle', e.target.value)} placeholder="e.g. Care Nurse" /></div>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Personal Details</div>
        <div className="row g-3">
          <div className="col-md-3"><label className="form-label" style={fieldLabelStyle}>Title</label><input className={inp} value={form.title} onChange={e => u('title', e.target.value)} placeholder="e.g. Care Nurse" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>First Name *</label><input className={inp} value={form.firstName} onChange={e => u('firstName', e.target.value)} placeholder="First name" /></div>
          <div className="col-md-5"><label className="form-label" style={fieldLabelStyle}>Last Name *</label><input className={inp} value={form.lastName} onChange={e => u('lastName', e.target.value)} placeholder="Last name" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Gender *</label>
            <select className={sel} value={form.gender} onChange={e => u('gender', e.target.value)}>
              <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
            </select>
          </div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Email *</label><input type="email" className={inp} value={form.email} onChange={e => u('email', e.target.value)} placeholder="nurse@email.com" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>MMC Pin No.</label><input className={inp} value={form.mmcPinNo} onChange={e => u('mmcPinNo', e.target.value)} placeholder="License pin number" /></div>
          <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Address *</label><input className={inp} value={form.address} onChange={e => u('address', e.target.value)} placeholder="Residential address" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Phone *</label><input className={inp} value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="024 XXX XXXX" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Home Telephone</label><input className={inp} value={form.homeTelephone} onChange={e => u('homeTelephone', e.target.value)} placeholder="Optional" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Citizenship</label><input className={inp} value={form.citizenship} onChange={e => u('citizenship', e.target.value)} placeholder="Ghana" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Role *</label>
            <select className={sel} value={form.role} onChange={e => u('role', e.target.value)}>
              <option value="head_nurse">Head Nurse</option><option value="supervising_nurse">Supervising Nurse</option>
              <option value="Office_nurse">Office Nurse</option><option value="field_nurse">Field Nurse</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Password *</label><input type="password" className={inp} value={form.password} onChange={e => u('password', e.target.value)} placeholder="Min 8 characters" /></div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div style={sectionCardStyle}>
      <div style={sectionTitleStyle}>Equality & Diversity</div>
      <div className="row g-3">
        <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Race / Ethnic Origin</label>
          <select className={sel} value={form.race} onChange={e => u('race', e.target.value)}>
            <option value="">Select</option><option value="Black Ghanaian">Black Ghanaian</option><option value="Any other African">Any other African</option><option value="White">White</option><option value="Asian">Asian</option><option value="Mixed">Mixed</option><option value="Prefer not to disclose">Prefer not to disclose</option>
          </select>
        </div>
        <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Religion</label>
          <select className={sel} value={form.religion} onChange={e => u('religion', e.target.value)}>
            <option value="">Select</option><option value="Christian">Christian</option><option value="Muslim">Muslim</option><option value="Traditional">Traditional</option><option value="Other">Other</option><option value="None">None</option>
          </select>
        </div>
        <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Disability</label>
          <select className={sel} value={form.disability} onChange={e => u('disability', e.target.value)}>
            <option value="No">No</option><option value="Yes">Yes</option>
          </select>
        </div>
        {form.disability === 'Yes' && <div className="col-md-8"><label className="form-label" style={fieldLabelStyle}>Disability Detail</label><textarea className={inp} rows={2} value={form.disability_detail} onChange={e => u('disability_detail', e.target.value)} placeholder="Provide details" /></div>}
        <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Criminal Records</label>
          <select className={sel} value={form.criminal_records} onChange={e => u('criminal_records', e.target.value)}>
            <option value="No">No</option><option value="Yes">Yes</option>
          </select>
        </div>
        {form.criminal_records === 'Yes' && <div className="col-md-8"><label className="form-label" style={fieldLabelStyle}>Criminal Record Detail</label><textarea className={inp} rows={2} value={form.criminal_record_detail} onChange={e => u('criminal_record_detail', e.target.value)} placeholder="Provide details" /></div>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="d-grid" style={{ gap: 18 }}>
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={sectionTitleStyle}>Qualifications</div>
          <button className="btn btn-sm" onClick={() => addArrayItem('qualifications', emptyQualification)} style={{ fontSize: 12, fontWeight: 700, color: '#2E7DB8', background: '#F0F7FE', border: '1px solid #D6ECFC', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><FiPlus size={12} /> Add</button>
        </div>
        {form.qualifications.map((q, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 8, background: '#fafbfc', border: '1px solid var(--kh-border-light)', marginBottom: i < form.qualifications.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)' }}>Qualification {i + 1}</span>
              {form.qualifications.length > 1 && <button onClick={() => removeArrayItem('qualifications', i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>}
            </div>
            <div className="row g-2">
              <div className="col-md-3"><input className={inp} value={q.name} onChange={e => updateArrayItem('qualifications', i, 'name', e.target.value)} placeholder="Name" /></div>
              <div className="col-md-4"><input className={inp} value={q.institution} onChange={e => updateArrayItem('qualifications', i, 'institution', e.target.value)} placeholder="Institution" /></div>
              <div className="col-md-3"><input className={inp} value={q.result} onChange={e => updateArrayItem('qualifications', i, 'result', e.target.value)} placeholder="Result" /></div>
              <div className="col-md-2"><input className={inp} value={q.year} onChange={e => updateArrayItem('qualifications', i, 'year', e.target.value)} placeholder="Year" /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={sectionTitleStyle}>Training Courses</div>
          <button className="btn btn-sm" onClick={() => addArrayItem('trainingCourses', '')} style={{ fontSize: 12, fontWeight: 700, color: '#2E7DB8', background: '#F0F7FE', border: '1px solid #D6ECFC', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><FiPlus size={12} /> Add</button>
        </div>
        {form.trainingCourses.map((tc, i) => (
          <div key={i} className="d-flex gap-2 align-items-center" style={{ marginBottom: i < form.trainingCourses.length - 1 ? 8 : 0 }}>
            <input className={inp} value={tc} onChange={e => updateArrayItem('trainingCourses', i, null, e.target.value)} placeholder={`Course ${i + 1}`} />
            {form.trainingCourses.length > 1 && <button onClick={() => removeArrayItem('trainingCourses', i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', flexShrink: 0 }}><FiX size={14} /></button>}
          </div>
        ))}
      </div>

      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={sectionTitleStyle}>Employment History</div>
          <button className="btn btn-sm" onClick={() => addArrayItem('employmentHistory', emptyEmployment)} style={{ fontSize: 12, fontWeight: 700, color: '#2E7DB8', background: '#F0F7FE', border: '1px solid #D6ECFC', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}><FiPlus size={12} /> Add</button>
        </div>
        {form.employmentHistory.map((emp, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 8, background: '#fafbfc', border: '1px solid var(--kh-border-light)', marginBottom: i < form.employmentHistory.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)' }}>Employer {i + 1}</span>
              {form.employmentHistory.length > 1 && <button onClick={() => removeArrayItem('employmentHistory', i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remove</button>}
            </div>
            <div className="row g-2">
              <div className="col-md-6"><input className={inp} value={emp.employerName} onChange={e => updateArrayItem('employmentHistory', i, 'employerName', e.target.value)} placeholder="Employer name" /></div>
              <div className="col-md-6"><input className={inp} value={emp.address} onChange={e => updateArrayItem('employmentHistory', i, 'address', e.target.value)} placeholder="Address" /></div>
              <div className="col-md-4"><input className={inp} value={emp.businessType} onChange={e => updateArrayItem('employmentHistory', i, 'businessType', e.target.value)} placeholder="Business type" /></div>
              <div className="col-md-4"><input className={inp} value={emp.jobTitle} onChange={e => updateArrayItem('employmentHistory', i, 'jobTitle', e.target.value)} placeholder="Job title" /></div>
              <div className="col-md-4"><input className={inp} value={emp.startDate} onChange={e => updateArrayItem('employmentHistory', i, 'startDate', e.target.value)} placeholder="Start date (year)" /></div>
              <div className="col-md-3"><input className={inp} value={emp.grade} onChange={e => updateArrayItem('employmentHistory', i, 'grade', e.target.value)} placeholder="Grade" /></div>
              <div className="col-md-3"><input className={inp} value={emp.reportingOfficer} onChange={e => updateArrayItem('employmentHistory', i, 'reportingOfficer', e.target.value)} placeholder="Reporting officer" /></div>
              <div className="col-md-3"><input className={inp} value={emp.reasonForLeaving} onChange={e => updateArrayItem('employmentHistory', i, 'reasonForLeaving', e.target.value)} placeholder="Reason for leaving" /></div>
              <div className="col-md-3"><input className={inp} value={emp.contactPerson} onChange={e => updateArrayItem('employmentHistory', i, 'contactPerson', e.target.value)} placeholder="Contact person" /></div>
              <div className="col-12"><textarea className={inp} rows={2} value={emp.descriptionOfDuties} onChange={e => updateArrayItem('employmentHistory', i, 'descriptionOfDuties', e.target.value)} placeholder="Description of duties" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const updateVacancyDetail = (key, value) => setForm(p => ({ ...p, vacancyDetail: { ...p.vacancyDetail, [key]: value } }));

  const handleVacancyChange = (value) => {
    setForm(p => ({ ...p, vacancyAdvertised: value, vacancyDetail: {} }));
  };

  const renderVacancyFollowUp = () => {
    const v = form.vacancyAdvertised;
    const d = form.vacancyDetail;
    if (!v) return null;

    const card = (children) => (
      <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: '#F0F7FE', border: '1px solid #D6ECFC' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#2E8FD4', marginBottom: 12 }}>
          {v} Details
        </div>
        <div className="row g-3">{children}</div>
      </div>
    );

    switch (v) {
      case 'Social Media':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Platform</label>
            <select className={sel} value={d.platform || ''} onChange={e => updateVacancyDetail('platform', e.target.value)}>
              <option value="">Select platform</option><option value="Facebook">Facebook</option><option value="Instagram">Instagram</option><option value="Twitter / X">Twitter / X</option><option value="LinkedIn">LinkedIn</option><option value="TikTok">TikTok</option><option value="WhatsApp">WhatsApp</option><option value="YouTube">YouTube</option><option value="Other">Other</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Account / Page Name</label><input className={inp} value={d.accountName || ''} onChange={e => updateVacancyDetail('accountName', e.target.value)} placeholder="e.g. @kulobalhomecare" /></div>
          {d.platform === 'Other' && <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Specify Platform</label><input className={inp} value={d.otherPlatform || ''} onChange={e => updateVacancyDetail('otherPlatform', e.target.value)} placeholder="Platform name" /></div>}
        </>);
      case 'Search Engine':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Search Engine</label>
            <select className={sel} value={d.engine || ''} onChange={e => updateVacancyDetail('engine', e.target.value)}>
              <option value="">Select</option><option value="Google">Google</option><option value="Bing">Bing</option><option value="Yahoo">Yahoo</option><option value="Other">Other</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Search Term Used</label><input className={inp} value={d.searchTerm || ''} onChange={e => updateVacancyDetail('searchTerm', e.target.value)} placeholder="e.g. home care jobs Ghana" /></div>
        </>);
      case 'Radio':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Radio Station</label><input className={inp} value={d.station || ''} onChange={e => updateVacancyDetail('station', e.target.value)} placeholder="e.g. Joy FM" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Program / Show Name</label><input className={inp} value={d.program || ''} onChange={e => updateVacancyDetail('program', e.target.value)} placeholder="e.g. Morning Show" /></div>
        </>);
      case 'Newspaper':
        return card(<>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Newspaper Name</label><input className={inp} value={d.newspaperName || ''} onChange={e => updateVacancyDetail('newspaperName', e.target.value)} placeholder="e.g. Daily Graphic" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Date of Publication</label><input type="date" className={inp} value={d.publicationDate || ''} onChange={e => updateVacancyDetail('publicationDate', e.target.value)} /></div>
        </>);
      case 'Referral':
        return card(<>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Referrer's Name</label><input className={inp} value={d.referrerName || ''} onChange={e => updateVacancyDetail('referrerName', e.target.value)} placeholder="Full name" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Referrer's Phone</label><input className={inp} value={d.referrerPhone || ''} onChange={e => updateVacancyDetail('referrerPhone', e.target.value)} placeholder="024 XXX XXXX" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Relationship</label>
            <select className={sel} value={d.referrerRelation || ''} onChange={e => updateVacancyDetail('referrerRelation', e.target.value)}>
              <option value="">Select</option><option value="Friend">Friend</option><option value="Family">Family</option><option value="Colleague">Colleague</option><option value="Former Employer">Former Employer</option><option value="Other">Other</option>
            </select>
          </div>
        </>);
      case 'Other':
        return card(<>
          <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Please Specify</label><input className={inp} value={d.otherSource || ''} onChange={e => updateVacancyDetail('otherSource', e.target.value)} placeholder="How did you find out about this vacancy?" /></div>
        </>);
      default: return null;
    }
  };

  const renderStep3 = () => (
    <div className="d-grid" style={{ gap: 18 }}>
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Relationships & Vacancy Source</div>
        <div className="row g-3">
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Related to any staff?</label>
            <select className={sel} value={form.staffRelation} onChange={e => u('staffRelation', e.target.value)}><option value="No">No</option><option value="Yes">Yes</option></select>
          </div>
          {form.staffRelation === 'Yes' && <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Relationship Detail</label><input className={inp} value={form.staffRelationDetail} onChange={e => u('staffRelationDetail', e.target.value)} placeholder="e.g. A friend" /></div>}
          <div className={form.staffRelation === 'Yes' ? 'col-md-4' : 'col-md-8'}><label className="form-label" style={fieldLabelStyle}>Where did you hear about us?</label>
            <select className={sel} value={form.vacancyAdvertised} onChange={e => handleVacancyChange(e.target.value)}>
              <option value="">Select</option><option value="Social Media">Social Media</option><option value="Search Engine">Search Engine</option><option value="Radio">Radio</option><option value="Newspaper">Newspaper</option><option value="Referral">Referral</option><option value="Other">Other</option>
            </select>
          </div>
        </div>
        {renderVacancyFollowUp()}
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Referees</div>
        <div className="row g-4">
          {form.referees.map((ref, i) => (
            <div className="col-md-6" key={i}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 10 }}>Referee {i + 1}</div>
              <div className="row g-3">
                <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Name</label><input className={inp} value={ref.name} onChange={e => updateArrayItem('referees', i, 'name', e.target.value)} placeholder="Full name" /></div>
                <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Address</label><input className={inp} value={ref.address} onChange={e => updateArrayItem('referees', i, 'address', e.target.value)} placeholder="Address" /></div>
                <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Telephone</label><input className={inp} value={ref.telephone} onChange={e => updateArrayItem('referees', i, 'telephone', e.target.value)} placeholder="Phone number" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];
  const isLastStep = step === STEPS.length - 1;
  const allCompleted = completedSteps.length === STEPS.length;

  return (
    <div className="page-wrapper">
      <div className="kh-card">
        <div style={{ background: '#45B6FE', padding: '14px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div className="d-flex gap-2 align-items-center">
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
              <input className="form-control form-control-kh" placeholder="Search nurses..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 34, width: 240, fontSize: 13, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }} />
            </div>
            <div className="d-flex gap-1">
              {['All', 'Incomplete'].map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{ padding: '6px 16px', borderRadius: 2, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: filter === f ? '#fff' : 'rgba(255,255,255,0.15)', color: filter === f ? '#45B6FE' : '#fff', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {f}
                  {f === 'Incomplete' && incompleteNurses.length > 0 && (
                    <span style={{ background: filter === 'Incomplete' ? '#f59e0b' : 'rgba(255,255,255,0.3)', color: filter === 'Incomplete' ? '#fff' : '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center', lineHeight: '16px' }}>{incompleteNurses.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{filtered.length} nurses</span>
            <button className="btn d-flex align-items-center gap-2" onClick={() => setShowModal(true)} style={{ background: '#fff', color: '#45B6FE', fontSize: 13, fontWeight: 700, borderRadius: 2, padding: '7px 16px', border: 'none' }}>
              <FiPlus size={15} /> Register Nurse
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table kh-table" style={{ marginBottom: 0 }}>
            <thead><tr>
              <th className="col-num">#</th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>Nurse <SortIcon col="name" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('role')}>Role <SortIcon col="role" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('license')}>License <SortIcon col="license" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('gender')}>Gender <SortIcon col="gender" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('phone')}>Phone <SortIcon col="phone" /></th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('joined')}>Joined <SortIcon col="joined" /></th>
              <th style={{ width: 110, textAlign: 'center' }}>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-5">
                  <div className="d-flex align-items-center justify-content-center gap-2" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>
                    <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#45B6FE' }} />
                    <span>Loading nurses…</span>
                  </div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>
                  {nurses.length === 0 ? 'No nurses registered yet. Click "Register Nurse" to add one.' : 'No nurses match your search.'}
                </td></tr>
              ) : paged.map((n, i) => (
                <tr key={n.id} onClick={() => navigate(`/workforce/${n.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="col-num">{startRow + i}</td>
                  <td><div className="d-flex align-items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #45B6FE, #2E8FD4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {n.name !== '—' ? n.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
                    </div>
                    <div><div style={{ fontWeight: 600, color: 'var(--kh-text)', fontSize: 13 }}>{n.name}</div><div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{n.email}</div></div>
                  </div></td>
                  <td style={{ fontSize: 13 }}>{n.role}</td>
                  <td style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#2E7DB8' }}>{n.license}</td>
                  <td style={{ fontSize: 13 }}>{n.gender}</td>
                  <td style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{n.phone}</td>
                  <td style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{n.joined}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/workforce/${n.id}`); }}
                        title="Edit nurse"
                        style={{ background: '#f0f7fe', color: '#2E7DB8', border: '1px solid #d6ecfc', borderRadius: 6, padding: '5px 8px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                      >
                        <FiEdit size={11} /> Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteNurse(n, e)}
                        title="Delete nurse"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 8px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                      >
                        <FiTrash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '2px solid #D6ECFC', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="d-flex align-items-center gap-2" style={{ fontSize: 12.5, color: 'var(--kh-text-muted)' }}>
            <span>Rows per page:</span>
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} style={{ border: '1px solid #d1d5db', borderRadius: 2, padding: '5px 10px', fontSize: 12.5, background: '#fff', color: 'var(--kh-text)', fontWeight: 600 }}>
              {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#2E7DB8' }}>Showing {startRow}–{endRow} of {sorted.length}</span>
          </div>
          <div className="d-flex gap-1">
            {pgBtn(() => setPage(1), page === 1, <FiChevronsLeft size={14} />)}
            {pgBtn(() => setPage(p => p - 1), page === 1, <FiChevronLeft size={14} />)}
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => {
              const prev = arr[idx - 1]; const showEllipsis = prev && p - prev > 1;
              return (<span key={p}>{showEllipsis && <span style={{ padding: '6px 4px', fontSize: 12, color: 'var(--kh-text-muted)' }}>…</span>}<button onClick={() => setPage(p)} style={{ padding: '6px 12px', border: '1px solid var(--kh-border-light)', borderRadius: 2, background: page === p ? '#45B6FE' : '#fff', color: page === p ? '#fff' : 'var(--kh-text)', cursor: 'pointer', fontSize: 12.5, fontWeight: page === p ? 700 : 400 }}>{p}</button></span>);
            })}
            {pgBtn(() => setPage(p => p + 1), page === totalPages, <FiChevronRight size={14} />)}
            {pgBtn(() => setPage(totalPages), page === totalPages, <FiChevronsRight size={14} />)}
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 2, width: '100%', maxWidth: 420,
              overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Icon */}
            <div style={{ padding: '32px 24px 0', textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#fef2f2', border: '2px solid #fecaca',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <FiTrash2 size={24} style={{ color: '#dc2626' }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Delete Nurse</div>
              <div style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: '#111827' }}>{deleteTarget.name}</strong>?
                This action cannot be undone and all associated data will be permanently removed.
              </div>
            </div>

            {/* Nurse info summary */}
            <div style={{ margin: '16px 24px', padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #45B6FE, #2E8FD4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {deleteTarget.name !== '—' ? deleteTarget.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{deleteTarget.name}</div>
                  <div style={{ fontSize: 11.5, color: '#6b7280' }}>{deleteTarget.role} · {deleteTarget.email}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: '#fff', color: '#374151', border: '1px solid #d1d5db',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: deleting ? '#f87171' : '#dc2626', color: '#fff', border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: deleting ? 0.8 : 1,
                }}
              >
                <FiTrash2 size={13} /> {deleting ? 'Deleting…' : 'Delete Nurse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-step Registration Modal ── */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }} onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 1060 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: 3, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

              {/* Header */}
              <div className="modal-header" style={{ borderBottom: '1px solid var(--kh-border-light)', padding: '20px 24px', background: '#F0F7FE' }}>
                <div style={{ flex: 1 }}>
                  <h6 className="modal-title" style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Register Nurse</h6>
                  <div style={{ fontSize: 12.5, color: '#2E7DB8', fontWeight: 600 }}>View and update the remaining nurse registration details.</div>
                </div>
                <button className="btn-close" onClick={closeModal} />
              </div>

              {/* Body */}
              <div className="modal-body" style={{ padding: 24, background: '#fafbfc' }}>
                {apiError && (
                  <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiAlertCircle size={15} /> {apiError}
                  </div>
                )}
                {allCompleted ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #45B6FE, #2E8FD4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 20px rgba(69,182,254,0.35)' }}>
                      <FiCheck size={28} style={{ color: '#fff', strokeWidth: 3 }} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Nurse Registered Successfully!</div>
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>All steps have been completed. The nurse has been added to the system.</div>
                    <button className="btn btn-kh-primary" onClick={closeModal} style={{ padding: '10px 32px' }}>Close</button>
                  </div>
                ) : (
                  stepRenderers[step]()
                )}
              </div>

              {/* Footer */}
              {!allCompleted && (
                <div className="modal-footer" style={{ borderTop: '1px solid var(--kh-border-light)', padding: '16px 24px', background: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    {step > 0 && (
                      <button className="btn btn-kh-outline" onClick={() => setStep(step - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiChevronLeft size={14} /> Back
                      </button>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-kh-outline" onClick={closeModal}>
                      <FiSave size={13} style={{ marginRight: 6 }} /> Save & Exit
                    </button>
                    <button className="btn btn-kh-primary" disabled={saving} onClick={saveStep} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Saving…' : isLastStep ? <><FiCheck size={14} /> Complete Registration</> : <>Save & Continue <FiArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
