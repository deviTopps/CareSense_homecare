import { useState, useCallback, useEffect } from 'react';
import {
  FiUser,
  FiLock,
  FiSave,
  FiTrash2,
  FiAlertTriangle,
  FiX,
  FiUserPlus,
  FiRefreshCw,
  FiUsers,
  FiCheckCircle,
  FiSettings,
} from '../icons/hugeicons-feather';
import { getUser, changePassword, createPlatformUser, fetchAuthUsers } from '../api';

const fontStack = "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif'";

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

/** Normalize common list shapes: `{ data: [] }`, `{ users: [] }`, etc. */
function extractAuthUsersList(json) {
  if (json == null) return [];
  if (Array.isArray(json)) return json;
  if (typeof json !== 'object') return [];
  const keys = ['data', 'users', 'items', 'results', 'records'];
  for (const k of keys) {
    const v = json[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      for (const inner of keys) {
        const nested = v[inner];
        if (Array.isArray(nested)) return nested;
      }
    }
  }
  return [];
}

function normalizeWorkspaceUser(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const email = raw.email ?? raw.emailAddress ?? '';
  const id = raw.id ?? raw._id ?? raw.uuid;
  if (id == null && !email) return null;
  const firstName = raw.firstName ?? raw.first_name ?? '';
  const lastName = raw.lastName ?? raw.last_name ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
    || (typeof raw.name === 'string' ? raw.name.trim() : '')
    || (typeof raw.fullName === 'string' ? raw.fullName.trim() : '')
    || '—';
  const phone = raw.phone ?? raw.phoneNumber ?? raw.phone_number ?? '';
  const role = raw.role ?? raw.userRole ?? raw.user_role ?? '';
  const createdRaw = raw.createdAt ?? raw.created_at;
  return {
    id: String(id ?? email ?? name),
    name,
    email: email ? String(email) : '—',
    phone: phone ? String(phone) : '—',
    role: role ? String(role) : '—',
    createdAt: createdRaw,
  };
}

function formatUserTableDate(raw) {
  if (raw == null || raw === '') return '—';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getInitials(user) {
  if (!user) return '?';
  const pair = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.trim();
  if (pair) return pair.toUpperCase();
  if (user.email && typeof user.email === 'string') return user.email[0].toUpperCase();
  return '?';
}

function AccountCard({ title, icon, children, footer, className = '' }) {
  return (
    <section className={['account-card', className].filter(Boolean).join(' ')}>
      <header className="account-card__head">
        <span className="account-card__icon" aria-hidden>
          {icon}
        </span>
        <h2 className="account-card__title">{title}</h2>
      </header>
      <div className="account-card__body">{children}</div>
      {footer ? <div className="account-card__footer">{footer}</div> : null}
    </section>
  );
}

function Field({
  label,
  type = 'text',
  defaultValue,
  value,
  onChange,
  placeholder,
  disabled,
  id,
  name,
  autoComplete,
}) {
  const controlled = value !== undefined;
  const resolvedAuto =
    autoComplete ?? (type === 'password' ? 'current-password' : undefined);
  return (
    <div className="account-field">
      <label className="account-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className="account-input"
        {...(controlled ? { value, onChange } : { defaultValue })}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={resolvedAuto || undefined}
      />
    </div>
  );
}

const AUTH_USER_ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'hr', label: 'HR' },
];

function SelectField({ label, id, value, onChange, children }) {
  return (
    <div className="account-field">
      <label className="account-field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="account-input account-select"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );
}

export default function Account() {
  const user = getUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const confirmWord = 'DELETE';
  const initials = getInitials(user);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
    confirmPassword: '',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [userCreatedModal, setUserCreatedModal] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [workspaceUsersLoading, setWorkspaceUsersLoading] = useState(false);
  const [workspaceUsersError, setWorkspaceUsersError] = useState('');
  const [settingsTab, setSettingsTab] = useState('forms');

  const onAuthUnauthorized = useCallback(() => {
    window.location.replace('/login');
  }, []);

  const loadWorkspaceUsers = useCallback(async () => {
    setWorkspaceUsersError('');
    setWorkspaceUsersLoading(true);
    try {
      const res = await fetchAuthUsers({ page: 1, limit: 200 }, onAuthUnauthorized);
      const json = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(json?.error || json?.message || `Could not load users (${res.status})`);
      }
      const rows = extractAuthUsersList(json)
        .map(normalizeWorkspaceUser)
        .filter(Boolean);
      const seen = new Set();
      const deduped = [];
      for (const r of rows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        deduped.push(r);
      }
      setWorkspaceUsers(deduped);
    } catch (e) {
      if (e.message !== 'Session expired. Please log in again.') {
        setWorkspaceUsersError(e.message || 'Could not load users.');
      }
      setWorkspaceUsers([]);
    } finally {
      setWorkspaceUsersLoading(false);
    }
  }, [onAuthUnauthorized]);

  useEffect(() => {
    if (settingsTab !== 'users') return;
    loadWorkspaceUsers();
  }, [settingsTab, loadWorkspaceUsers]);

  const setPwd = (key, v) => {
    setPasswordForm((prev) => ({ ...prev, [key]: v }));
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    const { current, next, confirm } = passwordForm;
    if (!current.trim() || !next.trim() || !confirm.trim()) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (next !== confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (next.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await changePassword(
        { currentPassword: current, newPassword: next },
        onAuthUnauthorized,
      );
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Could not update password.');
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordSuccess('Password updated successfully.');
    } catch (err) {
      if (err.message !== 'Session expired. Please log in again.') {
        setPasswordError(err.message || 'Could not update password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const setInviteField = (key, v) => setInviteForm((prev) => ({ ...prev, [key]: v }));

  const handleInviteUser = async () => {
    setInviteError('');
    setUserCreatedModal(null);
    const {
      firstName, lastName, email, phone, role, password, confirmPassword,
    } = inviteForm;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const phoneTrim = phone.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    if (!fn || !ln) {
      setInviteError('Please enter first and last name.');
      return;
    }
    if (!emailOk) {
      setInviteError('Please enter a valid email address.');
      return;
    }
    if (!phoneTrim) {
      setInviteError('Please enter a phone number for the new user.');
      return;
    }
    if (!password.trim()) {
      setInviteError('Please set an initial password for the new user.');
      return;
    }
    if (password.length < 8) {
      setInviteError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setInviteError('Password and confirmation do not match.');
      return;
    }
    setInviteLoading(true);
    try {
      const res = await createPlatformUser(
        {
          firstName: fn,
          lastName: ln,
          email: em,
          phone: phoneTrim,
          role,
          password,
        },
        onAuthUnauthorized,
      );
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Could not add this user.');
      }
      await loadWorkspaceUsers();
      setInviteForm((prev) => ({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: prev.role,
        password: '',
        confirmPassword: '',
      }));
      setUserCreatedModal({ name: `${fn} ${ln}`.trim() });
    } catch (err) {
      if (err.message !== 'Session expired. Please log in again.') {
        setInviteError(err.message || 'Could not add user.');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="page-wrapper account-settings-page" style={{ fontFamily: fontStack }}>
      <header className="account-settings-hero">
        <div className="account-settings-hero__identity">
          <div className="account-settings-avatar" aria-hidden>
            <span>{initials}</span>
          </div>
          <div>
            <p className="account-settings-eyebrow">Your account</p>
            <h1 className="account-settings-title">Account settings</h1>
            <p className="account-settings-lead">
              Account &amp; team covers your profile, password, and creating users. Workspace users lists everyone
              from the server.
            </p>
          </div>
        </div>
        <div className="account-settings-hero__meta">
          <span className="account-settings-pill">{user?.email || 'Signed in'}</span>
          {user?.role ? (
            <span className="account-settings-pill account-settings-pill--muted">{user.role}</span>
          ) : null}
        </div>
      </header>

      <div className="account-settings-tabs-shell">
        <div className="account-settings-tablist" role="tablist" aria-label="Settings sections">
          <button
            type="button"
            className={`account-settings-tab${settingsTab === 'forms' ? ' account-settings-tab--active' : ''}`}
            role="tab"
            id="account-tab-forms"
            aria-selected={settingsTab === 'forms'}
            aria-controls="account-panel-forms"
            tabIndex={settingsTab === 'forms' ? 0 : -1}
            onClick={() => setSettingsTab('forms')}
          >
            <FiSettings size={16} strokeWidth={2} aria-hidden />
            Account &amp; team
          </button>
          <button
            type="button"
            className={`account-settings-tab${settingsTab === 'users' ? ' account-settings-tab--active' : ''}`}
            role="tab"
            id="account-tab-users"
            aria-selected={settingsTab === 'users'}
            aria-controls="account-panel-users"
            tabIndex={settingsTab === 'users' ? 0 : -1}
            onClick={() => setSettingsTab('users')}
          >
            <FiUsers size={16} strokeWidth={2} aria-hidden />
            Workspace users
          </button>
        </div>

        <div
          id="account-panel-forms"
          role="tabpanel"
          aria-labelledby="account-tab-forms"
          hidden={settingsTab !== 'forms'}
          className="account-settings-stack"
        >
        <AccountCard
          title="Profile"
          icon={<FiUser size={18} strokeWidth={2} />}
          footer={
            <button type="button" className="btn btn-sm btn-primary account-settings-btn-primary">
              <FiSave size={15} strokeWidth={2} />
              Save changes
            </button>
          }
        >
          <div className="row g-3">
            <div className="col-sm-6">
              <Field label="First name" defaultValue={user?.firstName} placeholder="First name" />
            </div>
            <div className="col-sm-6">
              <Field label="Last name" defaultValue={user?.lastName} placeholder="Last name" />
            </div>
            <div className="col-sm-6">
              <Field label="Email" type="email" defaultValue={user?.email} placeholder="you@agency.com" />
            </div>
            <div className="col-sm-6">
              <Field label="Phone" type="tel" defaultValue={user?.phone} placeholder="+233 00 000 0000" />
            </div>
            <div className="col-12">
              <Field label="Role" defaultValue={user?.role} placeholder="Role" disabled />
            </div>
          </div>
        </AccountCard>

        <AccountCard
          title="Password"
          icon={<FiLock size={18} strokeWidth={2} />}
          footer={
            <button
              type="button"
              className="btn btn-sm btn-primary account-settings-btn-primary"
              disabled={passwordLoading}
              onClick={handleChangePassword}
            >
              <FiLock size={15} strokeWidth={2} />
              {passwordLoading ? 'Updating…' : 'Update password'}
            </button>
          }
        >
          <div className="row g-3">
            <div className="col-12">
              <div
                className="account-password-instructions"
                id="account-password-instructions"
                role="note"
              >
                <p className="account-password-instructions__title">Password requirements</p>
                <ul className="account-password-instructions__list">
                  <li>At least 8 characters</li>
                  <li>Include a mix of letters, numbers, or symbols where possible</li>
                  <li>New password and confirmation must match</li>
                </ul>
              </div>
            </div>
            {passwordError ? (
              <div className="col-12">
                <div className="account-settings-alert account-settings-alert--error" role="alert">
                  {passwordError}
                </div>
              </div>
            ) : null}
            {passwordSuccess ? (
              <div className="col-12">
                <div className="account-settings-alert account-settings-alert--success" role="status">
                  {passwordSuccess}
                </div>
              </div>
            ) : null}
            <div className="col-12">
              <Field
                id="account-current-password"
                label="Current password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.current}
                onChange={(e) => setPwd('current', e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="col-sm-6">
              <Field
                id="account-new-password"
                label="New password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.next}
                onChange={(e) => setPwd('next', e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="col-sm-6">
              <Field
                id="account-confirm-password"
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirm}
                onChange={(e) => setPwd('confirm', e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
        </AccountCard>

        <AccountCard
          className="account-card--span-full"
          title="Platform users"
          icon={<FiUserPlus size={18} strokeWidth={2} />}
          footer={
            <button
              type="button"
              className="btn btn-sm btn-primary account-settings-btn-primary"
              disabled={inviteLoading}
              onClick={handleInviteUser}
            >
              <FiUserPlus size={15} strokeWidth={2} />
              {inviteLoading ? 'Adding…' : 'Add user'}
            </button>
          }
        >
          <p className="account-team-intro">
            Create staff and other users via the workspace API. New users receive the <strong>email</strong>,{' '}
            <strong>initial password</strong>, and <strong>role</strong> you define here (they can change their password
            after sign-in).
          </p>
          <div className="row g-3">
            {inviteError ? (
              <div className="col-12">
                <div className="account-settings-alert account-settings-alert--error" role="alert">
                  {inviteError}
                </div>
              </div>
            ) : null}
            <div className="col-sm-6">
              <Field
                id="invite-first-name"
                label="First name"
                value={inviteForm.firstName}
                onChange={(e) => setInviteField('firstName', e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>
            <div className="col-sm-6">
              <Field
                id="invite-last-name"
                label="Last name"
                value={inviteForm.lastName}
                onChange={(e) => setInviteField('lastName', e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>
            <div className="col-sm-6">
              <Field
                id="invite-email"
                label="Email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteField('email', e.target.value)}
                placeholder="colleague@agency.com"
                autoComplete="email"
              />
            </div>
            <div className="col-sm-6">
              <Field
                id="invite-phone"
                label="Phone"
                type="tel"
                value={inviteForm.phone}
                onChange={(e) => setInviteField('phone', e.target.value)}
                placeholder="0240000000"
                autoComplete="tel"
              />
            </div>
            <div className="col-sm-6">
              <SelectField
                label="Role"
                id="invite-role"
                value={inviteForm.role}
                onChange={(e) => setInviteField('role', e.target.value)}
              >
                {AUTH_USER_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="col-sm-6">
              <Field
                id="invite-password"
                label="Initial password"
                type="password"
                value={inviteForm.password}
                onChange={(e) => setInviteField('password', e.target.value)}
                placeholder="StrongPass123"
                autoComplete="new-password"
              />
            </div>
            <div className="col-sm-6">
              <Field
                id="invite-confirm-password"
                label="Confirm password"
                type="password"
                value={inviteForm.confirmPassword}
                onChange={(e) => setInviteField('confirmPassword', e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
          </div>
        </AccountCard>
        </div>

        <div
          id="account-panel-users"
          role="tabpanel"
          aria-labelledby="account-tab-users"
          hidden={settingsTab !== 'users'}
          className="account-settings-stack account-settings-stack--users-tab"
        >
        <AccountCard
          className="account-card--span-full"
          title="Workspace users"
          icon={<FiUsers size={18} strokeWidth={2} />}
        >
          <div className="account-users-toolbar mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <p className="account-team-intro mb-0">
              Everyone in your workspace from <strong>GET /auth/users</strong>. Use Refresh after adding users on the
              Account &amp; team tab.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              disabled={workspaceUsersLoading}
              onClick={() => loadWorkspaceUsers()}
            >
              <FiRefreshCw
                size={14}
                className={workspaceUsersLoading ? 'account-users-refresh-icon--spin' : ''}
                aria-hidden
              />
              {workspaceUsersLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {workspaceUsersError ? (
            <div className="account-settings-alert account-settings-alert--error mb-3" role="alert">
              {workspaceUsersError}
            </div>
          ) : null}
          {workspaceUsersLoading && workspaceUsers.length === 0 ? (
            <p className="text-muted small mb-0">Loading users…</p>
          ) : null}
          {!workspaceUsersLoading && workspaceUsers.length === 0 && !workspaceUsersError ? (
            <p className="text-muted small mb-0">
              No users returned yet. Tap Refresh or add someone under Account &amp; team.
            </p>
          ) : null}
          {workspaceUsers.length > 0 ? (
            <div className="table-responsive account-users-table-wrap">
              <table className="table table-bordered table-hover align-middle mb-0 account-users-table">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col" className="d-none d-md-table-cell">Phone</th>
                    <th scope="col">Role</th>
                    <th scope="col" className="d-none d-lg-table-cell">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaceUsers.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-semibold">{row.name}</td>
                      <td className="text-break">{row.email}</td>
                      <td className="d-none d-md-table-cell">{row.phone}</td>
                      <td>
                        <span className="account-users-table__role">{row.role}</span>
                      </td>
                      <td className="d-none d-lg-table-cell text-muted small">{formatUserTableDate(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </AccountCard>
        </div>
      </div>

      <section className="account-danger-card">
        <div className="account-danger-card__head">
          <span className="account-danger-card__icon" aria-hidden>
            <FiAlertTriangle size={18} strokeWidth={2} />
          </span>
          <div>
            <h2 className="account-danger-card__title">Danger zone</h2>
            <p className="account-danger-card__subtitle">Irreversible actions for this workspace account.</p>
          </div>
        </div>
        <div className="account-danger-card__body">
          <div>
            <h3 className="account-danger-card__action-title">Delete account</h3>
            <p className="account-danger-card__action-desc">
              Permanently remove your account and associated access. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm account-settings-btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <FiTrash2 size={15} strokeWidth={2} />
            Delete account
          </button>
        </div>
      </section>

      {userCreatedModal ? (
        <div
          className="app-modal-overlay"
          role="presentation"
          onClick={() => setUserCreatedModal(null)}
        >
          <div
            className="account-user-created-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="account-user-created-title"
            aria-describedby="account-user-created-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="account-user-created-dialog__icon-wrap" aria-hidden>
              <FiCheckCircle size={40} strokeWidth={1.85} />
            </div>
            <h2 id="account-user-created-title" className="account-user-created-dialog__title">
              User created successfully
            </h2>
            <p id="account-user-created-desc" className="account-user-created-dialog__lead">
              <strong>{userCreatedModal.name}</strong> can sign in with the email and initial password you set.
              Remind them to change their password after first login if your policy requires it.
            </p>
            <div className="account-user-created-dialog__footer">
              <button
                type="button"
                className="btn btn-sm btn-primary account-settings-btn-primary"
                onClick={() => setUserCreatedModal(null)}
              >
                OK
              </button>
            </div>
            <button
              type="button"
              className="account-user-created-dialog__close"
              aria-label="Dismiss"
              onClick={() => setUserCreatedModal(null)}
            >
              <FiX size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      ) : null}

      {showDeleteModal && (
        <div
          className="app-modal-overlay app-modal-overlay--danger-flow"
          role="presentation"
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
          }}
        >
          <div
            className="destructive-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="account-delete-title" className="destructive-confirm-dialog__title">
                Delete account
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="destructive-confirm-dialog__body">
              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  This will <strong>permanently delete</strong> your account, all nurses, patient records, schedules and
                  documents. <strong>This cannot be undone.</strong>
                </div>
              </div>

              <label className="destructive-confirm-dialog__input-label" htmlFor="account-delete-confirm">
                To delete, type <strong>{confirmWord}</strong> below
              </label>
              <div className="destructive-confirm-dialog__input-wrap">
                <span
                  className="destructive-confirm-dialog__input-icon destructive-confirm-dialog__input-icon--danger"
                  aria-hidden
                >
                  <FiTrash2 size={16} />
                </span>
                <input
                  id="account-delete-confirm"
                  className="destructive-confirm-dialog__input"
                  type="text"
                  autoComplete="off"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={confirmWord}
                />
              </div>
            </div>
            <div className="destructive-confirm-dialog__footer">
              <button
                type="button"
                className="destructive-confirm-dialog__btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button type="button" className="destructive-confirm-dialog__btn-danger" disabled={deleteConfirmText !== confirmWord}>
                <FiTrash2 size={13} /> Permanently delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
