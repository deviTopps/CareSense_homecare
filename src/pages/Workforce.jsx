import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiPlus,
  FiSearch,
  FiChevronRight,
  FiChevronLeft,
  FiChevronsLeft,
  FiChevronsRight,
  FiUpload,
  FiX,
  FiCheck,
  FiArrowRight,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiUser,
  FiDownload,
  FiSave,
  FiUserPlus,
  FiMoreHorizontal,
  FiLock,
} from '../icons/hugeicons-feather';
import { apiFetch, isTokenValid, createPlatformUser, fetchAuthUsers, updatePlatformUser, deletePlatformUser, changePlatformUserPassword } from '../api';
import { resolveStoredMediaUrl } from '../utils/resolveStoredMediaUrl';

const ROLE_LABELS = { head_nurse: 'Head Nurse', supervising_nurse: 'Supervising Nurse', office_nurse: 'Office Nurse', field_nurse: 'Field Nurse' };

// Track fully-completed nurse registrations locally so we don't depend on API field presence
const getCompletedNurseIds = () => { try { return new Set(JSON.parse(localStorage.getItem('completedNurseIds') || '[]')); } catch { return new Set(); } };
const markNurseComplete = (id) => { const s = getCompletedNurseIds(); s.add(id); localStorage.setItem('completedNurseIds', JSON.stringify([...s])); };

const ROWS_OPTIONS = [5, 10, 15];

const NURSE_ENDPOINTS = {
  list: '/nurses',
  deleteById: '/nurses',
  createPersonal: '/nurses/create/personal-info',
  createDiversity: '/nurses/create/diversity-info',
  createEducation: '/nurses/create/education-info',
  createSupporting: '/nurses/create/supporting-info',
  addDocuments: '/nurses/add/documents',
};

const STEPS = [
  { key: 'personal',   label: 'Personal Info',          endpoint: NURSE_ENDPOINTS.createPersonal },
  { key: 'diversity',  label: 'Diversity Info',           endpoint: NURSE_ENDPOINTS.createDiversity },
  { key: 'education',  label: 'Education & Employment',   endpoint: NURSE_ENDPOINTS.createEducation },
  { key: 'supporting', label: 'Supporting Info',          endpoint: NURSE_ENDPOINTS.createSupporting },
  { key: 'documents',  label: 'Documents',                endpoint: NURSE_ENDPOINTS.addDocuments },
];

const DOCUMENT_TYPES = [
  { key: 'cv',          label: 'CV / Resume',                  required: false },
  { key: 'nationalId',  label: 'National ID / Passport',       required: false },
  { key: 'certificate', label: 'Professional Certificate',     required: false },
  { key: 'training',    label: 'Training Certificate',         required: false },
  { key: 'reference',   label: 'Reference Letter',             required: false },
  { key: 'dbs',         label: 'DBS / Criminal Record Check',  required: false },
];

const DOCUMENT_TYPE_MAP = {
  cv: 'Other',
  nationalId: 'ID',
  certificate: 'Certificate',
  training: 'Certificate',
  reference: 'Other',
  dbs: 'Certificate',
};

const PLATFORM_USER_ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'hr', label: 'HR' },
];

const WORKFORCE_FILTER_TABS = ['All', 'Complete', 'Staff'];

function StaffRowActions({ row, onEditInfo, onResetPassword }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const wrapRef = useRef(null);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    const btn = toggleRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = menuRef.current?.offsetHeight || 88;
    const gap = 6;
    const padding = 8;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - gap;
    }
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - menuHeight - padding));

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 1075,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return undefined;
    }
    updateMenuPosition();
    const raf = requestAnimationFrame(() => updateMenuPosition());
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      const target = e.target;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menuPortal = open && menuStyle
    ? createPortal(
        <div
          ref={menuRef}
          className="workforce-staff-actions__menu workforce-staff-actions__menu--portal"
          role="menu"
          style={menuStyle}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="workforce-staff-actions__item"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEditInfo(row, e);
            }}
          >
            <FiEdit size={14} aria-hidden />
            Edit info
          </button>
          <button
            type="button"
            role="menuitem"
            className="workforce-staff-actions__item"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onResetPassword(row, e);
            }}
          >
            <FiLock size={14} aria-hidden />
            Reset password
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="workforce-staff-actions" ref={wrapRef}>
      <button
        ref={toggleRef}
        type="button"
        className={`workforce-row-btn workforce-row-btn--menu${open ? ' is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${row.name}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <FiMoreHorizontal size={14} aria-hidden />
        <span>Actions</span>
      </button>
      {menuPortal}
    </div>
  );
}

const isStaffRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'staff' || normalized === 'stuff';
};

const extractUserArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const mapPlatformUserToRow = (user) => {
  const id = user?._id || user?.id || user?.userId;
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || user?.name || user?.email || '—';
  const roleRaw = String(user?.role || '').trim().toLowerCase();

  return {
    id,
    name: fullName,
    firstName,
    lastName,
    initials: fullName !== '—'
      ? fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
      : '?',
    profilePhotoUrl: null,
    license: '—',
    role: PLATFORM_USER_ROLE_OPTIONS.find((option) => option.value === roleRaw)?.label || 'Staff',
    roleRaw: roleRaw || 'staff',
    isStaff: true,
    isPlatformUser: true,
    authUserId: id,
    phone: user?.phone || '—',
    email: user?.email || '—',
    gender: '—',
    joined: user?.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '—',
    address: '—',
    completedStep: 4,
    isComplete: true,
  };
};

const emptyQualification = { name: '', institution: '', result: '', year: '' };
const emptyEmployment = { employerName: '', address: '', businessType: '', jobTitle: '', startDate: '', grade: '', reportingOfficer: '', reasonForLeaving: '', descriptionOfDuties: '', contactPerson: '' };
const emptyReferee = { name: '', address: '', telephone: '' };

const extractNurseProfileImage = (nurse) => {
  const profileImage = nurse?.profileImage || nurse?.profilePicture || nurse?.image || nurse?.photo || {};
  const documents = Array.isArray(nurse?.documents) ? nurse.documents : [];

  const profileDoc = documents.find((doc) => {
    const documentType = String(doc?.documentType || '').toLowerCase();
    return documentType.includes('profile') || documentType.includes('photo') || documentType.includes('avatar');
  }) || null;

  return {
    url:
      profileImage?.link?.url
      || profileImage?.url
      || nurse?.profileImageUrl
      || nurse?.profilePictureUrl
      || nurse?.imageUrl
      || nurse?.photoUrl
      || nurse?.avatarUrl
      || profileDoc?.link?.url
      || profileDoc?.url
      || null,
    objectKey:
      profileImage?.objectKey
      || nurse?.profileImageObjectKey
      || nurse?.profilePictureObjectKey
      || profileDoc?.objectKey
      || null,
    mediaId:
      profileImage?.mediaId
      || profileImage?.media?.id
      || nurse?.profileImageMediaId
      || nurse?.profilePictureMediaId
      || profileDoc?.mediaId
      || profileDoc?.media?.id
      || null,
  };
};

const initialFormState = {
  // Step 1 — Personal Info
  title: '', lastName: '', firstName: '', gender: '', email: '', address: '', mmcPinNo: '', phone: '', homeTelephone: '', dateOfBirh: '', jobReference: '', jobTitle: '', citizenship: 'Ghana', role: 'field_nurse', password: '',
  // Step 2 — Diversity Info
  race: '', religion: '', disability: 'No', disability_detail: '', criminal_records: 'No', criminal_record_detail: '',
  // Step 3 — Education & Employment
  qualifications: [{ ...emptyQualification }],
  trainingCourses: [''],
  employmentHistory: [{ ...emptyEmployment }],
  // Step 4 — Supporting Info
  staffRelation: 'No', staffRelationDetail: '', vacancyAdvertised: '', vacancyDetail: {},
  referees: [{ ...emptyReferee }, { ...emptyReferee }],
  // Step 5 — Documents
  documents: {},  // { [docKey]: File }
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
  const [avatarLoadErrors, setAvatarLoadErrors] = useState({});

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...initialFormState, qualifications: [{ ...emptyQualification }], trainingCourses: [''], employmentHistory: [{ ...emptyEmployment }], referees: [{ ...emptyReferee }, { ...emptyReferee }] });
  const [nurseId, setNurseId] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'staff', password: '', confirmPassword: '' });
  const [editingPlatformUserId, setEditingPlatformUserId] = useState(null);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);

  const resolveNurseProfilePhotoUrl = useCallback(async (nurseSummary) => {
    const directProfileImage = extractNurseProfileImage(nurseSummary);
    const directUrl =
      directProfileImage.url
      || await resolveStoredMediaUrl({
        mediaId: directProfileImage.mediaId,
        objectKey: directProfileImage.objectKey,
      });

    return directUrl || null;
  }, []);

  // ── Fetch nurses and staff from API ──
  const fetchNurses = useCallback(async () => {
    if (!NURSE_ENDPOINTS.list) {
      setNurses([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [nursesRes, usersRes] = await Promise.all([
        apiFetch(NURSE_ENDPOINTS.list),
        fetchAuthUsers({ limit: 500 }).catch(() => null),
      ]);
      const data = await nursesRes.json();
      const list = Array.isArray(data) ? data : data.nurses || data.data || [];
      const completedIds = getCompletedNurseIds();
      const mappedNurses = await Promise.all(list.map(async (n) => {
        const id = n._id || n.id;
        const profilePhotoUrl = await resolveNurseProfilePhotoUrl(n);
        const roleRaw = String(n.role || '').trim().toLowerCase();
        const staffMember = isStaffRole(roleRaw);
        // Trust API-provided flag first, then localStorage, then assume incomplete
        const isComplete = staffMember || n.registrationComplete === true || n.isComplete === true || completedIds.has(id);
        const completedStep = isComplete ? 4 : (n.registrationStep ?? 1);
        return {
          id,
          name: [n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—',
          initials: ([n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—') !== '—'
            ? ([n.firstName, n.lastName].filter(Boolean).join(' ') || n.name || '—').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            : '?',
          profilePhotoUrl,
          license: n.mmcPinNo || '—',
          role: staffMember ? 'Staff' : (ROLE_LABELS[n.role] || n.role || n.jobTitle || '—'),
          roleRaw,
          isStaff: staffMember,
          isPlatformUser: false,
          phone: n.phone || '—',
          email: n.email || '—',
          gender: n.gender || '—',
          joined: n.createdAt ? new Date(n.createdAt).toISOString().split('T')[0] : '—',
          address: n.address || '—',
          completedStep,
          isComplete,
        };
      }));

      let platformStaff = [];
      if (usersRes?.ok) {
        const usersPayload = await usersRes.json().catch(() => ({}));
        const userList = extractUserArray(usersPayload);
        const emailToAuthUserId = new Map();
        userList.forEach((user) => {
          const email = String(user?.email || '').trim().toLowerCase();
          const authId = String(user?._id || user?.id || user?.userId || '').trim();
          if (email && authId) emailToAuthUserId.set(email, authId);
        });
        const nursesWithAuthIds = mappedNurses.map((entry) => {
          if (!entry.isStaff) return entry;
          const email = String(entry.email || '').trim().toLowerCase();
          const authUserId = email ? emailToAuthUserId.get(email) : null;
          if (!authUserId) return entry;
          return {
            ...entry,
            authUserId,
            isPlatformUser: true,
            id: authUserId,
          };
        });
        const knownEmails = new Set(
          nursesWithAuthIds.map((entry) => String(entry.email || '').trim().toLowerCase()).filter(Boolean),
        );
        const knownIds = new Set(
          nursesWithAuthIds.map((entry) => String(entry.id || '').trim()).filter(Boolean),
        );
        platformStaff = userList
          .filter((user) => isStaffRole(user?.role))
          .filter((user) => {
            const email = String(user?.email || '').trim().toLowerCase();
            const id = String(user?._id || user?.id || user?.userId || '').trim();
            if (email && knownEmails.has(email)) return false;
            if (id && knownIds.has(id)) return false;
            return true;
          })
          .map(mapPlatformUserToRow)
          .filter((entry) => entry.id);
        setNurses([...nursesWithAuthIds, ...platformStaff]);
      } else {
        setNurses(mappedNurses);
      }
      setAvatarLoadErrors({});
    } catch (err) {
      console.error('Failed to fetch nurses:', err);
    } finally {
      setLoading(false);
    }
  }, [resolveNurseProfilePhotoUrl]);

  useEffect(() => { fetchNurses(); }, [fetchNurses]);

  const filterCounts = useMemo(() => ({
    All: nurses.filter((n) => !n.isStaff).length,
    Complete: nurses.filter((n) => !n.isStaff && n.isComplete).length,
    Staff: nurses.filter((n) => n.isStaff).length,
  }), [nurses]);

  // ── Table logic ──
  const filtered = nurses.filter((n) => {
    if (filter === 'Staff') return n.isStaff;
    if (n.isStaff) return false;
    if (filter === 'Complete' && !n.isComplete) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      n.name.toLowerCase().includes(q)
      || n.license.toLowerCase().includes(q)
      || n.email.toLowerCase().includes(q)
    );
  });

  const handleSort = (col) => {
    if (sortField === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortField !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const av = a[sortField];
    const bv = b[sortField];
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / rowsPerPage);

  const startRow = (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, sorted.length);
  const paged = sorted.slice(startRow - 1, endRow);
  const isStaffTable = filter === 'Staff';

  const handleExportNurses = () => {
    const headers = ['Name', 'Email', 'Role', 'License', 'Joined', 'Phone', 'Registration'];
    const rows = sorted.map((n) => [
      n.name,
      n.email,
      n.role,
      n.license,
      n.joined,
      n.phone,
      n.isComplete ? 'Complete' : 'In progress',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nurses-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const pgBtn = (onClick, disabled, children) => (
    <button type="button" onClick={onClick} disabled={disabled} className="patients-page-btn">{children}</button>
  );

  const removeEmptyValues = (value) => {
    if (Array.isArray(value)) {
      return value
        .map(item => removeEmptyValues(item))
        .filter(item => item !== undefined);
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([key, item]) => [key, removeEmptyValues(item)])
        .filter(([, item]) => item !== undefined);
      return Object.fromEntries(entries);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }

    if (value === null || value === undefined) return undefined;
    return value;
  };

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

  const uploadAndRegisterDocument = useCallback(async ({ file, resolvedNurseId, documentType }) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await apiFetch('/media/b2/upload/direct', {
      method: 'POST',
      body: uploadFormData,
    });

    const uploadResult = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error || uploadResult.message || `Upload failed (HTTP ${uploadResponse.status})`);
    }

    const objectKey = uploadResult.upload?.objectKey;
    const mediaId = uploadResult.media?.id;

    if (!objectKey || !mediaId) {
      throw new Error('Upload response missing objectKey or mediaId.');
    }

    const registerResponse = await apiFetch(NURSE_ENDPOINTS.addDocuments, {
      method: 'POST',
      body: JSON.stringify({
        nurseId: resolvedNurseId,
        documentType,
        objectKey,
        mediaId,
      }),
    });

    const registerResult = await registerResponse.json().catch(() => ({}));
    if (!registerResponse.ok) {
      throw new Error(registerResult.error || registerResult.message || `Registration failed (HTTP ${registerResponse.status})`);
    }

    return registerResult;
  }, []);

  const resetAll = () => {
    setStep(0); setForm({ ...initialFormState, qualifications: [{ ...emptyQualification }], trainingCourses: [''], employmentHistory: [{ ...emptyEmployment }], referees: [{ ...emptyReferee }, { ...emptyReferee }] });
    setNurseId(null); setCompletedSteps([]); setSaving(false); setApiError(''); setDebugInfo(null);
  };

  const handleDeleteNurse = (nurse, e) => {
    e.stopPropagation();
    setDeleteError('');
    setDeleteTarget(nurse);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const openPlatformUserEdit = (row) => {
    const nameParts = String(row.name || '—').trim().split(/\s+/).filter(Boolean);
    const firstName = row.firstName || nameParts[0] || '';
    const lastName = row.lastName || nameParts.slice(1).join(' ') || '';
    setEditingPlatformUserId(row.id);
    setAddUserForm({
      firstName,
      lastName,
      email: row.email !== '—' ? row.email : '',
      phone: row.phone !== '—' ? row.phone : '',
      role: row.roleRaw || 'staff',
      password: '',
      confirmPassword: '',
    });
    setAddUserError('');
    setAddUserSuccess(null);
    setShowAddUserModal(true);
  };

  const openStaffResetPassword = (row, e) => {
    e.stopPropagation();
    setResetPasswordTarget({ id: row.id, name: row.name });
    setResetPasswordForm({ password: '', confirmPassword: '' });
    setResetPasswordError('');
    setResetPasswordSuccess(false);
    setShowResetPasswordModal(true);
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setResetPasswordTarget(null);
    setResetPasswordForm({ password: '', confirmPassword: '' });
    setResetPasswordError('');
    setResetPasswordSuccess(false);
    setResetPasswordLoading(false);
  };

  const handleResetStaffPassword = async () => {
    if (!resetPasswordTarget?.id || resetPasswordLoading) return;
    setResetPasswordError('');
    const { password, confirmPassword } = resetPasswordForm;
    if (!password.trim()) {
      setResetPasswordError('Please enter a new password.');
      return;
    }
    if (password.length < 8) {
      setResetPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setResetPasswordError('Passwords do not match.');
      return;
    }
    setResetPasswordLoading(true);
    try {
      const res = await changePlatformUserPassword(resetPasswordTarget.id, { password });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Could not reset password.');
      }
      setResetPasswordSuccess(true);
    } catch (err) {
      setResetPasswordError(err.message || 'Could not reset password.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    const removeId = deleteTarget.authUserId || deleteTarget.id;
    try {
      if (deleteTarget.isPlatformUser || deleteTarget.isStaff) {
        const res = await deletePlatformUser(removeId);
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) {
          throw new Error(data.error || data.message || `Delete failed (HTTP ${res.status})`);
        }
      } else {
        if (!NURSE_ENDPOINTS.deleteById) {
          setDeleteError('Nurse delete endpoint is not configured. Reconnect endpoints before deleting records.');
          return;
        }
        const res = await apiFetch(`${NURSE_ENDPOINTS.deleteById}/${deleteTarget.id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || data.message || `Delete failed (HTTP ${res.status})`);
        }
      }
      setNurses((prev) => prev.filter((n) => {
        const rowAuthId = n.authUserId || n.id;
        return rowAuthId !== removeId && n.id !== deleteTarget.id;
      }));
      closeDeleteModal();
    } catch (err) {
      setDeleteError(err?.message || (deleteTarget.isStaff ? 'Failed to delete user.' : 'Failed to delete nurse.'));
    } finally {
      setDeleting(false);
    }
  };
  const setAddUserField = (key, v) => setAddUserForm((prev) => ({ ...prev, [key]: v }));

  const handleAddUser = async () => {
    setAddUserError('');
    const { firstName, lastName, email, phone, role, password, confirmPassword } = addUserForm;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const ph = phone.trim();
    const isEditing = Boolean(editingPlatformUserId);
    if (!fn || !ln) { setAddUserError('Please enter first and last name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setAddUserError('Please enter a valid email address.'); return; }
    if (!ph) { setAddUserError('Please enter a phone number.'); return; }
    if (!isEditing && !password.trim()) { setAddUserError('Please set an initial password.'); return; }
    if (password && password.length < 8) { setAddUserError('Password must be at least 8 characters.'); return; }
    if (password && password !== confirmPassword) { setAddUserError('Passwords do not match.'); return; }
    setAddUserLoading(true);
    try {
      if (isEditing) {
        const payload = { firstName: fn, lastName: ln, email: em, phone: ph, role };
        const res = await updatePlatformUser(editingPlatformUserId, payload);
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || data.message || 'Could not update user.');
        setAddUserSuccess({ name: `${fn} ${ln}`.trim(), updated: true });
      } else {
        const res = await createPlatformUser({ firstName: fn, lastName: ln, email: em, phone: ph, role, password });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || data.message || 'Could not add user.');
        setAddUserSuccess({ name: `${fn} ${ln}`.trim() });
        if (isStaffRole(role)) {
          setFilter('Staff');
          setPage(1);
        }
      }
      setAddUserForm({ firstName: '', lastName: '', email: '', phone: '', role: 'staff', password: '', confirmPassword: '' });
      setEditingPlatformUserId(null);
      fetchNurses();
    } catch (err) {
      setAddUserError(err.message || (isEditing ? 'Could not update user.' : 'Could not add user.'));
    } finally {
      setAddUserLoading(false);
    }
  };

  const closeAddUserModal = () => {
    setShowAddUserModal(false);
    setAddUserError('');
    setAddUserSuccess(null);
    setEditingPlatformUserId(null);
    setAddUserForm({ firstName: '', lastName: '', email: '', phone: '', role: 'staff', password: '', confirmPassword: '' });
  };

  const closeModal = () => { setShowModal(false); resetAll(); fetchNurses(); };

  // ── Save current step to API ──
  const saveStep = async () => {
    // Skip API call if this step was already completed (e.g. continuing an incomplete registration)
    if (completedSteps.includes(step)) {
      if (step < STEPS.length - 1) setStep(step + 1);
      return;
    }
    // Check token validity before attempting
    if (!isTokenValid()) {
      setApiError('Your session has expired. Please log out and log back in, then try again.');
      return;
    }
    setSaving(true); setApiError('');
    try {
      let body;
      let requestBodies = [];
      if (step === 0) {
        const requiredStep0 = {
          title: form.title,
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          email: form.email,
          address: form.address,
          mmcPinNo: form.mmcPinNo,
          phone: form.phone,
          homeTelephone: form.homeTelephone,
          citizenship: form.citizenship,
          role: form.role,
          password: form.password,
          jobReference: form.jobReference,
          jobTitle: form.jobTitle,
        };
        const missingRequired = Object.entries(requiredStep0)
          .filter(([, value]) => !String(value || '').trim())
          .map(([key]) => key);

        if (missingRequired.length > 0) {
          setApiError(`Please fill required fields before continuing: ${missingRequired.join(', ')}`);
          return;
        }

        const normalizedEmail = form.email.trim().toLowerCase();
        const normalizedMmcPin = form.mmcPinNo.trim().toLowerCase();
        const duplicateByEmail = nurses.find((n) => String(n.email || '').trim().toLowerCase() === normalizedEmail);
        if (duplicateByEmail) {
          setApiError('A nurse with this email already exists. Please use a different email address.');
          return;
        }

        const duplicateByMmcPin = nurses.find((n) => String(n.license || '').trim().toLowerCase() === normalizedMmcPin);
        if (normalizedMmcPin && duplicateByMmcPin) {
          setApiError('A nurse with this MMC Pin No. already exists. Please use a different pin.');
          return;
        }

        const step0Body = {
          title: form.title.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          gender: form.gender,
          email: form.email.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          homeTelephone: form.homeTelephone.trim(),
          dateOfBirh: form.dateOfBirh,
          dateOfBirth: form.dateOfBirh,
          mmcPinNo: form.mmcPinNo.trim(),
          citizenship: form.citizenship.trim(),
          role: form.role,
          password: form.password,
          jobReference: form.jobReference.trim(),
          jobTitle: form.jobTitle.trim(),
        };
        body = step0Body;
        const { dateOfBirth, ...step0TypoOnlyBody } = step0Body;
        const { dateOfBirh, ...step0StandardBirthBody } = step0Body;
        requestBodies = [step0Body, step0TypoOnlyBody, step0StandardBirthBody]
          .filter(candidate => Object.keys(candidate).length > 0)
          .filter((candidate, index, arr) => index === arr.findIndex(item => JSON.stringify(item) === JSON.stringify(candidate)));
      } else if (step === 1) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        body = removeEmptyValues({
          nurseId, race: form.race, religion: form.religion,
          disability: form.disability,
          disability_detail: form.disability === 'Yes' ? form.disability_detail || 'N/A' : 'N/A',
          criminal_records: form.criminal_records,
          criminal_record_detail: form.criminal_records === 'Yes' ? form.criminal_record_detail || 'N/A' : 'N/A',
        });
      } else if (step === 2) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        body = removeEmptyValues({
          nurseId,
          qualifications: form.qualifications.filter(q => q.name || q.institution),
          trainingCourses: form.trainingCourses.filter(t => t.trim()),
          employmentHistory: form.employmentHistory.filter(e => e.employerName),
        });
      } else if (step === 3) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        body = removeEmptyValues({
          nurseId,
          staffRelation: form.staffRelation, staffRelationDetail: form.staffRelation === 'Yes' ? form.staffRelationDetail || 'N/A' : 'N/A',
          vacancyAdvertised: form.vacancyAdvertised,
          referees: form.referees.filter(r => r.name),
        });
      } else if (step === 4) {
        if (!nurseId) {
          setApiError('Nurse profile ID is missing. Please complete Personal Info first.');
          return;
        }
        const docEntries = Object.entries(form.documents).filter(([, file]) => file instanceof File);
        if (docEntries.length === 0) {
          // No files — skip upload and just advance
          setCompletedSteps(prev => [...new Set([...prev, step])]);
          markNurseComplete(nurseId);
          setSaving(false);
          return;
        }

        setDebugInfo({
          step,
          endpoint: '/media/b2/upload/direct → /nurses/add/documents',
          method: 'POST',
          attempt: `0/${docEntries.length}`,
          requestBody: JSON.stringify(docEntries.map(([key, file]) => ({
            slot: key,
            documentType: DOCUMENT_TYPE_MAP[key] || 'Other',
            fileName: file.name,
            size: file.size,
            mimeType: file.type || 'unknown',
          })), null, 2),
          responseStatus: null,
          responseBody: 'Uploading selected nurse documents…',
        });

        for (let index = 0; index < docEntries.length; index += 1) {
          const [key, file] = docEntries[index];
          const documentType = DOCUMENT_TYPE_MAP[key] || 'Other';

          setDebugInfo({
            step,
            endpoint: '/media/b2/upload/direct → /nurses/add/documents',
            method: 'POST',
            attempt: `${index + 1}/${docEntries.length}`,
            requestBody: JSON.stringify({
              nurseId,
              slot: key,
              documentType,
              fileName: file.name,
              size: file.size,
              mimeType: file.type || 'unknown',
            }, null, 2),
            responseStatus: null,
            responseBody: `Uploading ${file.name}…`,
          });

          await uploadAndRegisterDocument({
            file,
            resolvedNurseId: nurseId,
            documentType,
          });
        }

        setDebugInfo({
          step,
          endpoint: '/media/b2/upload/direct → /nurses/add/documents',
          method: 'POST',
          attempt: `${docEntries.length}/${docEntries.length}`,
          requestBody: JSON.stringify(docEntries.map(([key, file]) => ({
            slot: key,
            documentType: DOCUMENT_TYPE_MAP[key] || 'Other',
            fileName: file.name,
          })), null, 2),
          responseStatus: 200,
          responseBody: `Uploaded and registered ${docEntries.length} document${docEntries.length === 1 ? '' : 's'} successfully.`,
        });

        setCompletedSteps(prev => [...new Set([...prev, step])]);
        markNurseComplete(nurseId);
        return;
      }
      if (requestBodies.length === 0) requestBodies = [body];
      if (!STEPS[step].endpoint) {
        setApiError('Nurse registration endpoint not configured for this step.');
        return;
      }
      let res;
      let rawText = '';
      let activeBody = body;
      let activeAttempt = 1;
      for (let index = 0; index < requestBodies.length; index += 1) {
        activeBody = requestBodies[index];
        activeAttempt = index + 1;
        const fetchBody = activeBody instanceof FormData ? activeBody : JSON.stringify(activeBody);
        setDebugInfo({
          step,
          endpoint: STEPS[step].endpoint,
          method: 'POST',
          attempt: `${activeAttempt}/${requestBodies.length}`,
          requestBody: activeBody instanceof FormData
            ? '[FormData payload – see selected files in the form]'
            : JSON.stringify(activeBody, null, 2),
          responseStatus: null,
          responseBody: '',
        });
        console.log(`[saveStep] STEP ${step} → POST ${STEPS[step].endpoint} (attempt ${activeAttempt}/${requestBodies.length})`);
        if (!(activeBody instanceof FormData)) console.log('[saveStep] payload:', JSON.stringify(activeBody, null, 2));
        res = await apiFetch(STEPS[step].endpoint, { method: 'POST', body: fetchBody });
        rawText = await res.text();
        setDebugInfo({
          step,
          endpoint: STEPS[step].endpoint,
          method: 'POST',
          attempt: `${activeAttempt}/${requestBodies.length}`,
          requestBody: activeBody instanceof FormData
            ? '[FormData payload – see selected files in the form]'
            : JSON.stringify(activeBody, null, 2),
          responseStatus: res.status,
          responseBody: rawText,
        });
        if (!(step === 0 && res.status >= 500 && index < requestBodies.length - 1)) break;
      }
      console.log('[saveStep] response status:', res.status, 'body:', rawText);
      let data;
      try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }

      // Resolve the nurse id — prefer body.nurseId (always fresh) over stale state
      const resolvedId = activeBody?.nurseId || nurseId;

      if (!res.ok) {
        const msg = (data.error || data.message || '').toLowerCase();
        // If data already exists for this step, treat as completed and advance
        if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('already registered')) {
          setCompletedSteps(prev => [...new Set([...prev, step])]);
          if (step < STEPS.length - 1) {
            setStep(step + 1);
          } else {
            if (resolvedId) markNurseComplete(resolvedId);
          }
          return;
        }
        throw new Error(data.error || data.message || data.details || (Array.isArray(data.errors) ? data.errors.map(e => e.message || e.msg || JSON.stringify(e)).join('; ') : null) || JSON.stringify(data) || 'Failed to save');
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
      const message = String(err?.message || 'Failed to save');
      setDebugInfo(prev => prev ? { ...prev, responseStatus: prev.responseStatus ?? 'NETWORK_ERROR', responseBody: message } : {
        step,
        endpoint: STEPS[step]?.endpoint || 'Unknown endpoint',
        method: 'POST',
        attempt: '1/1',
        requestBody: '',
        responseStatus: 'NETWORK_ERROR',
        responseBody: message,
      });
      if (message.toLowerCase().includes('cannot reach') || message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('network')) {
        setApiError('Cannot reach the server. It may be starting up (this can take ~15 seconds on the free tier) — please wait a moment and try again.');
      } else {
        setApiError(`Error: ${message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──
  const sectionTitleStyle = { fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1e5d53', marginBottom: 16 };
  const fieldLabelStyle = { fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 };
  const sectionCardStyle = { padding: 22, border: '1px solid #edf1f5', borderRadius: 24, background: '#fff', boxShadow: '0 12px 30px rgba(148, 163, 184, 0.08)' };
  const inp = 'form-control form-control-kh workforce-form-input';
  const sel = 'form-select form-control-kh workforce-form-input';

  // ── Step content renderers ──
  const renderStep0 = () => (
    <div className="d-grid" style={{ gap: 18 }}>
      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Personal Details</div>
        <div className="row g-3">
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Title *</label><input className={inp} value={form.title} onChange={e => u('title', e.target.value)} placeholder="e.g. Care Nurse" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>First Name *</label><input className={inp} value={form.firstName} onChange={e => u('firstName', e.target.value)} placeholder="First name" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Last Name *</label><input className={inp} value={form.lastName} onChange={e => u('lastName', e.target.value)} placeholder="Last name" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Gender *</label>
            <select className={sel} value={form.gender} onChange={e => u('gender', e.target.value)}>
              <option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option>
            </select>
          </div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Email *</label><input type="email" className={inp} value={form.email} onChange={e => u('email', e.target.value)} placeholder="nurse@email.com" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>MMC Pin No. *</label><input className={inp} value={form.mmcPinNo} onChange={e => u('mmcPinNo', e.target.value)} placeholder="License pin number" /></div>
          <div className="col-12"><label className="form-label" style={fieldLabelStyle}>Address *</label><input className={inp} value={form.address} onChange={e => u('address', e.target.value)} placeholder="Residential address" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Phone *</label><input className={inp} value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="024 XXX XXXX" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Home Telephone</label><input className={inp} value={form.homeTelephone} onChange={e => u('homeTelephone', e.target.value)} placeholder="Optional" /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Date of Birth</label><input type="date" className={inp} value={form.dateOfBirh} onChange={e => u('dateOfBirh', e.target.value)} /></div>
          <div className="col-md-4"><label className="form-label" style={fieldLabelStyle}>Citizenship</label><input className={inp} value={form.citizenship} onChange={e => u('citizenship', e.target.value)} placeholder="Ghana" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Role *</label>
            <select className={sel} value={form.role} onChange={e => u('role', e.target.value)}>
              <option value="">Select role</option>
              <option value="head_nurse">Head Nurse</option><option value="supervising_nurse">Supervising Nurse</option>
              <option value="office_nurse">Office Nurse</option><option value="field_nurse">Field Nurse</option>
            </select>
          </div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Password *</label><input type="password" className={inp} value={form.password} onChange={e => u('password', e.target.value)} placeholder="Min 8 characters" /></div>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionTitleStyle}>Job Details</div>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Job Reference *</label><input className={inp} value={form.jobReference} onChange={e => u('jobReference', e.target.value)} placeholder="e.g. REF-001" /></div>
          <div className="col-md-6"><label className="form-label" style={fieldLabelStyle}>Job Title *</label><input className={inp} value={form.jobTitle} onChange={e => u('jobTitle', e.target.value)} placeholder="e.g. Care Nurse" /></div>
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

  const renderStep4 = () => (
    <div style={sectionCardStyle}>
      <div style={sectionTitleStyle}>Upload Documents</div>
      <div style={{ fontSize: 13, color: 'var(--kh-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
        Upload any relevant supporting documents for this nurse. All fields are optional — you can skip and complete later.
      </div>
      <div className="row g-3">
        {DOCUMENT_TYPES.map(({ key, label }) => {
          const file = form.documents[key];
          return (
            <div className="col-md-6" key={key}>
              <label style={fieldLabelStyle}>{label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${file ? '#86efac' : 'var(--kh-border-light)'}`, background: file ? '#f0fdf4' : '#fafbfc', transition: 'all 0.15s' }}>
                {file ? (
                  <>
                    <div style={{ flex: 1, fontSize: 12.5, color: '#15803d', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <FiCheck size={12} style={{ marginRight: 6, color: '#16a34a' }} />{file.name}
                    </div>
                    <button onClick={() => u('documents', { ...form.documents, [key]: undefined })} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <FiX size={14} />
                    </button>
                  </>
                ) : (
                  <label htmlFor={`doc-${key}`} style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--kh-text-muted)', margin: 0 }}>
                    <FiUpload size={13} style={{ color: '#2E7DB8', flexShrink: 0 }} />
                    <span>Click to upload</span>
                    <input
                      id={`doc-${key}`}
                      type="file"
                      accept="*/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) u('documents', { ...form.documents, [key]: f });
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginTop: 4 }}>Any file type supported — max 10 MB</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];
  const isLastStep = step === STEPS.length - 1;
  const allCompleted = completedSteps.length === STEPS.length;

  return (
    <motion.div className="page-wrapper workforce-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
      <div className="patients-board-shell">
        <div className="patients-hero">
          <div>
            <div className="patients-kicker">Nurse workspace</div>
            <h2 className="patients-title">All Workforce</h2>
            <p className="patients-subtitle">Search staff, export the roster, register new hires, and open nurse records from one place.</p>
          </div>
          <div className="patients-hero-actions">
            <button type="button" className="patients-toolbar-btn" onClick={handleExportNurses}>
              <FiDownload size={15} />
              <span>Export</span>
            </button>
            <button type="button" className="patients-toolbar-btn" onClick={() => setShowAddUserModal(true)}>
              <FiUserPlus size={15} />
              <span>Add New User</span>
            </button>
            <button type="button" className="patients-cta-btn" onClick={() => setShowModal(true)}>
              <span className="patients-cta-btn__icon"><FiPlus size={16} /></span>
              <span>Register Nurse</span>
            </button>
          </div>
        </div>

        <motion.div className="kh-card patients-board-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
          <div className="patients-topbar">
            <div className="patients-segmented-control">
              {WORKFORCE_FILTER_TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setFilter(item); setPage(1); }}
                  className={`patients-segmented-control__item${filter === item ? ' is-active' : ''}`}
                >
                  <span>
                    {item === 'All' ? 'All Nurses' : item}
                  </span>
                  <span className="patients-segmented-control__count">{filterCounts[item]}</span>
                </button>
              ))}
            </div>
            <div className="patients-topbar-actions">
              <div className="patients-meta-pill">
                <span className="patients-meta-pill__label">Visible</span>
                <strong>{filtered.length}</strong>
              </div>
              <div className="patients-meta-pill">
                <span className="patients-meta-pill__label">Complete</span>
                <strong>{filterCounts.Complete}</strong>
              </div>
            </div>
          </div>

          <div className="patients-subtoolbar">
            <div className="patients-searchbox">
              <FiSearch className="patients-searchbox__icon" size={16} />
              <input
                id="workforce-nurse-search"
                type="search"
                className="form-control form-control-kh patients-searchbox__input"
                placeholder={isStaffTable ? 'Search staff by name or email' : 'Search nurses, email, or license'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                autoComplete="off"
                aria-label="Search nurses"
              />
            </div>
            <div className="patients-subtoolbar-actions">
              <label className="patients-meta-pill patients-meta-pill--select">
                <span className="patients-meta-pill__label">Rows</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                  className="patients-rows-select"
                  aria-label="Rows per page"
                >
                  {ROWS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              <button type="button" className="patients-toolbar-btn" onClick={handleExportNurses}>
                <FiDownload size={15} />
                <span>Export</span>
              </button>

              <button type="button" className="patients-cta-btn patients-cta-btn--compact" onClick={() => setShowModal(true)}>
                <span className="patients-cta-btn__icon"><FiPlus size={15} /></span>
                <span>Register Nurse</span>
              </button>
            </div>
          </div>

          <div className="table-responsive patients-table-wrap">
            <table className="table kh-table patients-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>Nurse <SortIcon col="name" /></th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('role')}>Role <SortIcon col="role" /></th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort(isStaffTable ? 'email' : 'license')}>
                    {isStaffTable ? 'Email' : 'License'} <SortIcon col={isStaffTable ? 'email' : 'license'} />
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('joined')}>Joined <SortIcon col="joined" /></th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('phone')}>Phone <SortIcon col="phone" /></th>
                  <th style={{ width: 168, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>Loading nurses...</td>
                  </tr>
                )}
                {!loading && paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>
                      {filter === 'Staff'
                        ? (filterCounts.Staff === 0
                          ? 'No staff users yet. Use Add New User with the Staff role.'
                          : 'No staff users match your search.')
                        : (nurses.length === 0
                          ? 'No nurses registered yet. Use Register Nurse to add one.'
                          : 'No nurses match your filters or search.')}
                    </td>
                  </tr>
                )}
                {!loading && paged.map((n, i) => (
                  <tr
                    key={n.id}
                    className="patients-row-card"
                    onClick={n.isStaff ? undefined : () => navigate(`/workforce/${n.id}`)}
                    style={{ cursor: n.isStaff ? 'default' : 'pointer' }}
                  >
                    <td className="col-num" data-label="#">{startRow + i}</td>
                    <td data-label="Nurse">
                      <div className="d-flex align-items-center gap-2 patients-name-cell">
                        <div
                          className="avatar sm patients-avatar"
                          style={{
                            background: n.profilePhotoUrl && !avatarLoadErrors[n.id] ? '#fff' : ((startRow + i - 1) % 2 === 0 ? '#45B6FE' : '#2E7DB8'),
                            overflow: 'hidden',
                            borderRadius: '50%',
                          }}
                        >
                          {n.profilePhotoUrl && !avatarLoadErrors[n.id] ? (
                            <img
                              src={n.profilePhotoUrl}
                              alt={n.name}
                              loading="lazy"
                              onError={() => setAvatarLoadErrors((prev) => ({ ...prev, [n.id]: true }))}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            />
                          ) : (
                            <FiUser size={16} aria-hidden />
                          )}
                        </div>
                        <div>
                          <div className="patients-name-primary">{n.name}</div>
                          {!n.isStaff && n.email !== '—' ? (
                            <div className="patients-name-secondary">{n.email}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td data-label="Role"><span className="patient-nurse-chip">{n.role}</span></td>
                    <td data-label={isStaffTable ? 'Email' : 'License'} className="patients-table-value">
                      {isStaffTable ? (
                        <span className="text-break">{n.email}</span>
                      ) : (
                        <span className="patients-license-code">{n.license}</span>
                      )}
                    </td>
                    <td data-label="Joined" className="patients-table-date">{n.joined}</td>
                    <td data-label="Phone" className="patients-table-value" style={{ fontVariantNumeric: 'tabular-nums' }}>{n.phone}</td>
                    <td data-label="Actions" className="workforce-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <div className={`workforce-row-actions${n.isStaff ? '' : ' workforce-row-actions--single'}`}>
                        {n.isStaff ? (
                          <StaffRowActions
                            row={n}
                            onEditInfo={(row, e) => {
                              e.stopPropagation();
                              openPlatformUserEdit(row);
                            }}
                            onResetPassword={openStaffResetPassword}
                          />
                        ) : null}
                        <button
                          type="button"
                          className="workforce-row-btn workforce-row-btn--delete"
                          title={n.isStaff ? 'Delete staff' : 'Delete nurse'}
                          aria-label={`Delete ${n.name}`}
                          onClick={(e) => handleDeleteNurse(n, e)}
                        >
                          <FiTrash2 size={14} aria-hidden />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="patients-pagination-footer">
            <div className="patients-pagination-summary">
              <span>Showing</span>
              <strong>{startRow}–{endRow}</strong>
              <span>of</span>
              <strong>{sorted.length}</strong>
            </div>
            <div className="d-flex gap-1 patients-pagination-actions">
              {pgBtn(() => setPage(1), page === 1, <FiChevronsLeft size={14} />)}
              {pgBtn(() => setPage((p) => p - 1), page === 1, <FiChevronLeft size={14} />)}
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((pNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pNum - prev > 1;
                return (
                  <span key={pNum}>
                    {showEllipsis && <span className="patients-pagination-ellipsis">…</span>}
                    <button type="button" onClick={() => setPage(pNum)} className={`patients-page-number${page === pNum ? ' active' : ''}`}>{pNum}</button>
                  </span>
                );
              })}
              {pgBtn(() => setPage((p) => p + 1), page === totalPages, <FiChevronRight size={14} />)}
              {pgBtn(() => setPage(totalPages), page === totalPages, <FiChevronsRight size={14} />)}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workforce-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="workforce-delete-title" className="destructive-confirm-dialog__title">
                {deleteTarget?.isStaff ? 'Delete user' : 'Delete nurse'}
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                disabled={deleting}
                onClick={closeDeleteModal}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="destructive-confirm-dialog__body">
              <p className="destructive-confirm-dialog__lead">
                Are you sure you want to delete this team member? This will remove their profile from the workforce
                directory.
              </p>
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>Warning: This action cannot be undone.</strong> All associated onboarding data and references
                  for this {deleteTarget?.isStaff ? 'user' : 'nurse'} may be <strong>permanently lost</strong>.
                </div>
              </div>
              {deleteError ? (
                <div className="destructive-confirm-dialog__banner-error" role="alert">{deleteError}</div>
              ) : null}
              <div className="destructive-confirm-dialog__card">
                <div className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand" aria-hidden>
                  {deleteTarget.name !== '—'
                    ? deleteTarget.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                    : '?'}
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{deleteTarget.name}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {deleteTarget.role} · {deleteTarget.email}
                  </div>
                </div>
              </div>
            </div>
            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                disabled={deleting}
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger workforce-delete-user-btn"
                disabled={deleting}
                onClick={confirmDelete}
              >
                <FiTrash2 size={14} aria-hidden />
                {deleting ? 'Deleting…' : (deleteTarget?.isStaff ? 'Delete user' : 'Delete nurse')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset staff password modal ── */}
      {showResetPasswordModal && resetPasswordTarget && (
        <div className="app-modal-overlay" role="presentation" onClick={closeResetPasswordModal}>
          <div
            className="app-modal-dialog app-modal-dialog--md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-staff-password-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <div className="app-modal-dialog__header">
              <h2 id="reset-staff-password-title" className="app-modal-dialog__title">
                {resetPasswordSuccess ? 'Password reset' : 'Reset password'}
              </h2>
              <button type="button" className="app-modal-dialog__close" aria-label="Close" onClick={closeResetPasswordModal}>
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="app-modal-dialog__body">
              {resetPasswordSuccess ? (
                <div className="workforce-modal-success" style={{ padding: '16px 0' }}>
                  <div className="workforce-modal-success__icon">
                    <FiCheck size={28} style={{ color: '#fff', strokeWidth: 3 }} />
                  </div>
                  <div className="workforce-modal-success__title">Password updated</div>
                  <div className="workforce-modal-success__text">
                    <strong>{resetPasswordTarget.name}</strong> can now sign in with the new password.
                  </div>
                  <button type="button" className="btn btn-primary workforce-modal-primary-btn" onClick={closeResetPasswordModal}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                    Set a new password for <strong>{resetPasswordTarget.name}</strong>.
                  </p>
                  {resetPasswordError ? (
                    <div className="workforce-modal-alert" style={{ marginBottom: 16 }}>
                      <FiAlertCircle size={15} /> {resetPasswordError}
                    </div>
                  ) : null}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>New password *</label>
                      <input
                        type="password"
                        className="form-control form-control-kh workforce-form-input"
                        value={resetPasswordForm.password}
                        onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>Confirm password *</label>
                      <input
                        type="password"
                        className="form-control form-control-kh workforce-form-input"
                        value={resetPasswordForm.confirmPassword}
                        onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            {!resetPasswordSuccess && (
              <div className="app-modal-dialog__footer">
                <button type="button" className="app-modal-dialog__btn-cancel" onClick={closeResetPasswordModal}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary workforce-modal-primary-btn"
                  disabled={resetPasswordLoading}
                  onClick={handleResetStaffPassword}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <FiLock size={14} />
                  {resetPasswordLoading ? 'Saving…' : 'Reset password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add New User Modal ── */}
      {showAddUserModal && (
        <div className="app-modal-overlay" role="presentation" onClick={closeAddUserModal}>
          <div className="app-modal-dialog app-modal-dialog--md" role="dialog" aria-modal="true" aria-labelledby="add-user-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="app-modal-dialog__header">
              <h2 id="add-user-title" className="app-modal-dialog__title">
                {addUserSuccess
                  ? (addUserSuccess.updated ? 'User updated' : 'User created')
                  : (editingPlatformUserId ? 'Edit staff info' : 'Add new platform user')}
              </h2>
              <button type="button" className="app-modal-dialog__close" aria-label="Close" onClick={closeAddUserModal}>
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="app-modal-dialog__body">
              {addUserSuccess ? (
                <div className="workforce-modal-success" style={{ padding: '24px 0' }}>
                  <div className="workforce-modal-success__icon">
                    <FiCheck size={28} style={{ color: '#fff', strokeWidth: 3 }} />
                  </div>
                  <div className="workforce-modal-success__title">
                    {addUserSuccess.updated ? 'User updated successfully' : 'User created successfully'}
                  </div>
                  <div className="workforce-modal-success__text">
                    {addUserSuccess.updated ? (
                      <><strong>{addUserSuccess.name}</strong> has been updated.</>
                    ) : (
                      <><strong>{addUserSuccess.name}</strong> can now sign in with the email and initial password you set.</>
                    )}
                  </div>
                  <button type="button" className="btn btn-primary workforce-modal-primary-btn" onClick={closeAddUserModal}>Done</button>
                </div>
              ) : (
                <>
                  {addUserError && (
                    <div className="workforce-modal-alert" style={{ marginBottom: 16 }}>
                      <FiAlertCircle size={15} /> {addUserError}
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>First name *</label>
                      <input className="form-control form-control-kh workforce-form-input" value={addUserForm.firstName} onChange={(e) => setAddUserField('firstName', e.target.value)} placeholder="First name" autoComplete="given-name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>Last name *</label>
                      <input className="form-control form-control-kh workforce-form-input" value={addUserForm.lastName} onChange={(e) => setAddUserField('lastName', e.target.value)} placeholder="Last name" autoComplete="family-name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>Email *</label>
                      <input type="email" className="form-control form-control-kh workforce-form-input" value={addUserForm.email} onChange={(e) => setAddUserField('email', e.target.value)} placeholder="user@agency.com" autoComplete="email" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>Phone *</label>
                      <input type="tel" className="form-control form-control-kh workforce-form-input" value={addUserForm.phone} onChange={(e) => setAddUserField('phone', e.target.value)} placeholder="0240000000" autoComplete="tel" />
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>Role *</label>
                      <select className="form-select form-control-kh workforce-form-input" value={addUserForm.role} onChange={(e) => setAddUserField('role', e.target.value)}>
                        {PLATFORM_USER_ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {!editingPlatformUserId ? (
                      <>
                        <div className="col-md-6">
                          <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>Initial password *</label>
                          <input type="password" className="form-control form-control-kh workforce-form-input" value={addUserForm.password} onChange={(e) => setAddUserField('password', e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#415463', marginBottom: 7 }}>Confirm password *</label>
                          <input type="password" className="form-control form-control-kh workforce-form-input" value={addUserForm.confirmPassword} onChange={(e) => setAddUserField('confirmPassword', e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
                        </div>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
            {!addUserSuccess && (
              <div className="app-modal-dialog__footer">
                <button type="button" className="app-modal-dialog__btn-cancel" onClick={closeAddUserModal}>Cancel</button>
                <button type="button" className="btn btn-primary workforce-modal-primary-btn" disabled={addUserLoading} onClick={handleAddUser} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiUserPlus size={14} />
                  {addUserLoading ? (editingPlatformUserId ? 'Saving…' : 'Adding…') : (editingPlatformUserId ? 'Save changes' : 'Add user')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Multi-step Registration Modal ── */}
      {showModal && (
        <div className="modal modal-open workforce-modal" onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable workforce-modal-dialog" style={{ maxWidth: 1060 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content kh-modal-panel workforce-modal-panel" style={{ border: 'none' }}>

              {/* Header */}
              <div className="modal-header workforce-modal-header">
                <div style={{ flex: 1 }}>
                  <div className="workforce-modal-header__top">
                    <div>
                      <div className="workforce-modal-kicker">Nurse onboarding</div>
                      <h6 className="modal-title workforce-modal-title">Register Nurse</h6>
                    </div>
                    <button type="button" className="workforce-modal-close" onClick={closeModal} aria-label="Close register nurse modal"><FiX size={16} /></button>
                  </div>
                  <div className="workforce-step-tabs">
                    {STEPS.map((s, i) => {
                      const isDone = completedSteps.includes(i);
                      const isActive = step === i;
                      return (
                        <div key={s.key} className={`workforce-step-tab${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                          <span className="workforce-step-tab__index">{isDone ? <FiCheck size={12} strokeWidth={3} /> : i + 1}</span>
                          <span className="workforce-step-tab__label">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="modal-body workforce-modal-body">
                {apiError && (
                  <div className="workforce-modal-alert">
                    <FiAlertCircle size={15} /> {apiError}
                  </div>
                )}
                {allCompleted ? (
                  <div className="workforce-modal-success">
                    <div className="workforce-modal-success__icon">
                      <FiCheck size={28} style={{ color: '#fff', strokeWidth: 3 }} />
                    </div>
                    <div className="workforce-modal-success__title">Nurse Registered Successfully!</div>
                    <div className="workforce-modal-success__text">All steps have been completed. The nurse has been added to the system.</div>
                    <button className="btn btn-primary workforce-modal-primary-btn" onClick={closeModal}>Close</button>
                  </div>
                ) : (
                  <div className="workforce-form-stage">{stepRenderers[step]()}</div>
                )}
              </div>

              {/* Footer */}
              {!allCompleted && (
                <div className="modal-footer workforce-modal-footer">
                  <div>
                    {step > 0 && (
                      <button className="btn btn-outline workforce-modal-secondary-btn" onClick={() => setStep(step - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiChevronLeft size={14} /> Back
                      </button>
                    )}
                  </div>
                  <div className="d-flex gap-2 workforce-modal-footer__actions">
                    <button className="btn btn-outline workforce-modal-secondary-btn" onClick={closeModal}>
                      <FiSave size={13} style={{ marginRight: 6 }} /> Save & Exit
                    </button>
                    <button className="btn btn-primary workforce-modal-primary-btn" disabled={saving} onClick={saveStep} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Saving…' : isLastStep ? <><FiCheck size={14} /> Complete Registration</> : <>Save & Continue <FiArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
