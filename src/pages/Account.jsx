import { useState, useCallback } from 'react';
import {
  FiUser,
  FiLock,
  FiSave,
  FiTrash2,
  FiAlertTriangle,
  FiX,
  FiUserPlus,
} from '../icons/hugeicons-feather';
import { getUser, changePassword, createPlatformUser } from '../api';

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

const PLATFORM_ROLES = ['Administrator', 'Manager', 'Accountant', 'HR'];

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
    role: 'Manager',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);

  const onAuthUnauthorized = useCallback(() => {
    window.location.replace('/login');
  }, []);

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
    setInviteSuccess('');
    const { firstName, lastName, email, role } = inviteForm;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    if (!fn || !ln) {
      setInviteError('Please enter first and last name.');
      return;
    }
    if (!emailOk) {
      setInviteError('Please enter a valid email address.');
      return;
    }
    setInviteLoading(true);
    try {
      const res = await createPlatformUser(
        { firstName: fn, lastName: ln, email: em, role },
        onAuthUnauthorized,
      );
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Could not add this user.');
      }
      const newId = data.user?._id || data.user?.id || data.id || `local-${Date.now()}`;
      setInvitedUsers((prev) => [
        { id: String(newId), name: `${fn} ${ln}`.trim(), email: em, role },
        ...prev,
      ]);
      setInviteForm((prev) => ({ firstName: '', lastName: '', email: '', role: prev.role }));
      setInviteSuccess(
        `${fn} ${ln} was added. They can sign in with role: ${role}.`,
      );
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
              Manage your profile, password, and who can access the platform.
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

      <div className="account-settings-stack">
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
            Invite colleagues and assign a role: <strong>Administrator</strong>, <strong>Manager</strong>,{' '}
            <strong>Accountant</strong>, or <strong>HR</strong>. They will use the same workspace sign-in flow once
            their account is created.
          </p>
          <div className="row g-3">
            {inviteError ? (
              <div className="col-12">
                <div className="account-settings-alert account-settings-alert--error" role="alert">
                  {inviteError}
                </div>
              </div>
            ) : null}
            {inviteSuccess ? (
              <div className="col-12">
                <div className="account-settings-alert account-settings-alert--success" role="status">
                  {inviteSuccess}
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
              <SelectField
                label="Role"
                id="invite-role"
                value={inviteForm.role}
                onChange={(e) => setInviteField('role', e.target.value)}
              >
                {PLATFORM_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          {invitedUsers.length > 0 ? (
            <div className="account-team-added">
              <p className="account-team-added__title">Added in this session</p>
              <ul className="account-team-added__list">
                {invitedUsers.map((row) => (
                  <li key={row.id} className="account-team-added__row">
                    <span className="account-team-added__name">{row.name}</span>
                    <span className="account-team-added__email">{row.email}</span>
                    <span className="account-team-added__role">{row.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </AccountCard>
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
