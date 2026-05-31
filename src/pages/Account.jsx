import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FiLock,
  FiTrash2,
  FiAlertTriangle,
  FiX,
  FiUpload,
  FiShield,
  FiCamera,
} from '../icons/hugeicons-feather';
import { getUser, changePassword, apiFetch } from '../api';
import './Account.css';

const AGENCY_LOGO_STORAGE_KEY = 'accountSettings.agencyLogo';

function readPersistedAgencyLogo() {
  try {
    const raw = localStorage.getItem(AGENCY_LOGO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistAgencyLogo(data) {
  try {
    localStorage.setItem(AGENCY_LOGO_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota/private mode errors; upload still succeeds.
  }
}

function clearPersistedAgencyLogo() {
  try {
    localStorage.removeItem(AGENCY_LOGO_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Could not preview selected file.'));
    reader.readAsDataURL(file);
  });
}

function optimizeAgencyLogoFile(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith('image/')) {
      resolve(file);
      return;
    }
    if (file.size <= 1024 * 1024) {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const widthRatio = maxWidth / img.width;
        const heightRatio = maxHeight / img.height;
        const ratio = Math.min(1, widthRatio, heightRatio);
        const targetW = Math.max(1, Math.round(img.width * ratio));
        const targetH = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            const optimized = new File([blob], file.name, {
              type: blob.type || file.type,
              lastModified: Date.now(),
            });
            resolve(optimized);
          },
          file.type,
          quality,
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

function getInitials(user) {
  if (!user) return '?';
  const pair = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.trim();
  if (pair) return pair.toUpperCase();
  if (user.email && typeof user.email === 'string') return user.email[0].toUpperCase();
  return '?';
}

const SETTINGS_SECTIONS = [
  { id: 'settings-section-profile', label: 'Agency profile', Icon: FiCamera },
  { id: 'settings-section-security', label: 'Security', Icon: FiShield },
  { id: 'settings-section-password', label: 'Password', Icon: FiLock },
  { id: 'settings-section-danger', label: 'Delete account', Icon: FiAlertTriangle },
];

function SettingsSection({
  id,
  title,
  subtitle,
  children,
  className = '',
  icon: Icon,
  iconTone = 'default',
}) {
  return (
    <section id={id} className={['settings-section-v3', className].filter(Boolean).join(' ')}>
      <div className="settings-section-v3__head">
        {Icon ? (
          <span className={`settings-section-v3__icon${iconTone !== 'default' ? ` settings-section-v3__icon--${iconTone}` : ''}`}>
            <Icon size={20} strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
        <div className="settings-section-v3__head-copy">
          <h2 className="settings-section-v3__title">{title}</h2>
          {subtitle ? <p className="settings-section-v3__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      <div className="settings-section-v3__body">{children}</div>
    </section>
  );
}

function SettingsFormRow({
  label, htmlFor, children, description,
}) {
  return (
    <div className="settings-form-row-v2">
      <div className="settings-form-row-v2__label-wrap">
        {htmlFor ? (
          <label className="settings-form-row-v2__label" htmlFor={htmlFor}>{label}</label>
        ) : (
          <span className="settings-form-row-v2__label">{label}</span>
        )}
        {description ? <p className="settings-form-row-v2__desc">{description}</p> : null}
      </div>
      <div className="settings-form-row-v2__control">{children}</div>
    </div>
  );
}

function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  htmlId,
}) {
  return (
    <div className="settings-form-row-v2 settings-form-row-v2--toggle">
      <div className="settings-form-row-v2__label-wrap">
        <span className="settings-form-row-v2__label" id={htmlId ? `${htmlId}-label` : undefined}>{label}</span>
        {description ? <p className="settings-form-row-v2__desc">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        className={`settings-switch-v2${checked ? ' is-on' : ''}`}
        aria-checked={checked}
        aria-labelledby={htmlId ? `${htmlId}-label` : undefined}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

export default function Account() {
  const user = getUser();
  const persistedLogo = readPersistedAgencyLogo();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const confirmWord = 'DELETE';
  const initials = getInitials(user);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  }, []);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlertEnabled, setLoginAlertEnabled] = useState(true);
  const [agencyLogoPreview, setAgencyLogoPreview] = useState(
    persistedLogo?.previewUrl || user?.agencyLogoUrl || user?.logoUrl || user?.agencyLogo || '',
  );
  const [agencyLogoUploading, setAgencyLogoUploading] = useState(false);
  const [agencyLogoError, setAgencyLogoError] = useState('');
  const [agencyLogoSuccess, setAgencyLogoSuccess] = useState('');
  const [agencyLogoAsset, setAgencyLogoAsset] = useState(
    persistedLogo?.objectKey && persistedLogo?.mediaId
      ? { objectKey: persistedLogo.objectKey, mediaId: persistedLogo.mediaId }
      : null,
  );
  const agencyLogoInputRef = useRef(null);

  const onAuthUnauthorized = useCallback(() => {
    window.location.replace('/login');
  }, []);

  const setPwd = (key, v) => {
    setPasswordForm((prev) => ({ ...prev, [key]: v }));
  };

  const clearAgencyLogoMessages = () => {
    setAgencyLogoError('');
    setAgencyLogoSuccess('');
  };

  const handleAgencyLogoFile = async (file) => {
    if (!file) return;
    clearAgencyLogoMessages();
    if (!file.type.startsWith('image/')) {
      setAgencyLogoError('Please choose an image file for your agency logo.');
      return;
    }

    setAgencyLogoUploading(true);
    try {
      const localPreview = await readFileAsDataUrl(file);
      setAgencyLogoPreview(localPreview);
      const optimizedFile = await optimizeAgencyLogoFile(file);

      const formData = new FormData();
      formData.append('file', optimizedFile);

      const res = await apiFetch(
        '/media/b2/upload/direct',
        {
          method: 'POST',
          body: formData,
        },
        onAuthUnauthorized,
      );
      const payload = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(payload?.error || payload?.message || `Logo upload failed (HTTP ${res.status})`);
      }

      const objectKey = payload?.upload?.objectKey;
      const mediaId = payload?.media?.id;
      const remoteUrl =
        payload?.media?.url || payload?.media?.publicUrl || payload?.upload?.url || payload?.upload?.publicUrl || '';

      if (!objectKey || !mediaId) {
        throw new Error('Upload succeeded but no media reference was returned.');
      }

      const fallbackPreview = remoteUrl || localPreview;
      setAgencyLogoAsset({ objectKey, mediaId });
      setAgencyLogoPreview(fallbackPreview);
      persistAgencyLogo({
        objectKey,
        mediaId,
        previewUrl: fallbackPreview,
        uploadedAt: new Date().toISOString(),
      });
      try {
        const existingUser = getUser() || {};
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...existingUser,
            agencyLogoUrl: fallbackPreview,
            agencyLogoObjectKey: objectKey,
            agencyLogoMediaId: mediaId,
          }),
        );
      } catch {
        // Ignore local user persistence errors.
      }
      const reducedBytes = file.size - optimizedFile.size;
      const reductionMb = reducedBytes > 0 ? (reducedBytes / (1024 * 1024)).toFixed(2) : '0';
      setAgencyLogoSuccess(
        reducedBytes > 0
          ? `Agency logo uploaded successfully. Optimized by ${reductionMb} MB for faster upload.`
          : 'Agency logo uploaded successfully.',
      );
    } catch (err) {
      if (err.message !== 'Session expired. Please log in again.') {
        setAgencyLogoError(err.message || 'Could not upload agency logo.');
      }
    } finally {
      setAgencyLogoUploading(false);
      if (agencyLogoInputRef.current) agencyLogoInputRef.current.value = '';
    }
  };

  const handleAgencyLogoInput = async (event) => {
    const file = event.target.files?.[0];
    await handleAgencyLogoFile(file);
  };

  const handleAgencyLogoRemove = () => {
    clearAgencyLogoMessages();
    setAgencyLogoAsset(null);
    setAgencyLogoPreview('');
    clearPersistedAgencyLogo();
    try {
      const existingUser = getUser() || {};
      const {
        agencyLogoUrl: _agencyLogoUrl,
        agencyLogoObjectKey: _agencyLogoObjectKey,
        agencyLogoMediaId: _agencyLogoMediaId,
        ...rest
      } = existingUser;
      localStorage.setItem('user', JSON.stringify(rest));
    } catch {
      // Ignore local user persistence errors.
    }
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

  const profileDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || '—';
  const [activeSection, setActiveSection] = useState('settings-section-profile');

  const scrollToSection = useCallback((sectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const sectionIds = SETTINGS_SECTIONS.map((s) => s.id);
    const onScroll = () => {
      const offset = 120;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="page-wrapper account-settings-page account-settings-page--v3">
      <div className="settings-page">
        <header className="settings-page__hero">
          <div className="settings-page__hero-main">
            <span className="settings-page__kicker">Workspace</span>
            <h1 className="settings-page__title">Settings</h1>
            <p className="settings-page__lead">
              Manage your agency profile, sign-in security, and account access in one place.
            </p>
          </div>
          <div className="settings-page__user-chip">
            <div className="settings-page__user-avatar" aria-hidden>{initials}</div>
            <div>
              <p className="settings-page__user-name">{profileDisplayName}</p>
              <p className="settings-page__user-email">{user?.email || '—'}</p>
              {user?.role ? <span className="settings-page__role-badge">{user.role}</span> : null}
            </div>
          </div>
        </header>

        <div className="settings-page__grid">
          <nav className="settings-page__nav" aria-label="Settings sections">
            <span className="settings-page__nav-label">On this page</span>
            {SETTINGS_SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`settings-page__nav-link${activeSection === item.id ? ' is-active' : ''}`}
                onClick={() => scrollToSection(item.id)}
              >
                <item.Icon size={16} strokeWidth={1.75} aria-hidden />
                {item.label}
              </button>
            ))}
          </nav>

          <main className="settings-page__main">
            <SettingsSection
              id="settings-section-profile"
              icon={FiCamera}
              title="Agency profile"
              subtitle="Your organisation details, contact information, and branding."
            >
              <div className="settings-brand-card">
                <div className="settings-brand-card__preview">
                  <div
                    className={`settings-profile-avatar-v2 settings-profile-avatar-v2--logo${agencyLogoPreview ? ' settings-profile-avatar-v2--has-logo' : ''}${agencyLogoUploading ? ' is-uploading' : ''}`}
                  >
                    {agencyLogoPreview ? (
                      <img src={agencyLogoPreview} alt="Agency logo" className="settings-profile-logo-img" />
                    ) : (
                      <span aria-hidden>{initials}</span>
                    )}
                  </div>
                </div>
                <div className="settings-brand-card__copy">
                  <strong>Agency logo</strong>
                  <p>PNG or JPG recommended. Large files are optimised automatically before upload.</p>
                  <div className="settings-brand-card__actions">
                    <input
                      ref={agencyLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAgencyLogoInput}
                      className="settings-hidden-file-input"
                      aria-label="Upload agency logo"
                    />
                    <button
                      type="button"
                      className="settings-link-btn-v2 settings-link-btn-v2--accent"
                      disabled={agencyLogoUploading}
                      onClick={() => agencyLogoInputRef.current?.click()}
                    >
                      <FiUpload size={14} strokeWidth={2} aria-hidden />
                      {agencyLogoUploading ? 'Uploading…' : 'Upload logo'}
                    </button>
                    <button
                      type="button"
                      className="settings-link-btn-v2 settings-link-btn-v2--muted"
                      disabled={!agencyLogoPreview || agencyLogoUploading}
                      onClick={handleAgencyLogoRemove}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              {agencyLogoError ? (
                <div className="account-settings-alert account-settings-alert--error" role="alert">
                  {agencyLogoError}
                </div>
              ) : null}
              {agencyLogoSuccess ? (
                <div className="account-settings-alert account-settings-alert--success" role="status">
                  {agencyLogoSuccess}
                </div>
              ) : null}

              <div className="settings-form-grid">
                <SettingsFormRow label="Full name" htmlFor="settings-profile-fullname">
                  <input
                    id="settings-profile-fullname"
                    className="settings-input-v2"
                    type="text"
                    defaultValue={profileDisplayName === '—' ? '' : profileDisplayName}
                    placeholder="Full name"
                    autoComplete="name"
                  />
                </SettingsFormRow>
                <SettingsFormRow label="Email" htmlFor="settings-profile-email">
                  <input
                    id="settings-profile-email"
                    className="settings-input-v2"
                    type="email"
                    defaultValue={user?.email || ''}
                    placeholder="you@agency.com"
                    autoComplete="email"
                  />
                </SettingsFormRow>
                <SettingsFormRow label="Phone" htmlFor="settings-profile-phone">
                  <input
                    id="settings-profile-phone"
                    className="settings-input-v2"
                    type="tel"
                    defaultValue={user?.phone || ''}
                    placeholder="+233 00 000 0000"
                    autoComplete="tel"
                  />
                </SettingsFormRow>
                <SettingsFormRow label="Role" htmlFor="settings-profile-role">
                  <input
                    id="settings-profile-role"
                    className="settings-input-v2"
                    type="text"
                    defaultValue={user?.role || ''}
                    placeholder="Role"
                    disabled
                    aria-describedby="settings-profile-role-hint"
                  />
                </SettingsFormRow>
              </div>
              <p id="settings-profile-role-hint" className="settings-inline-meta" style={{ marginTop: 12 }}>
                Role is assigned by your organisation administrator.
              </p>
            </SettingsSection>

            <SettingsSection
              id="settings-section-security"
              icon={FiShield}
              iconTone="security"
              title="Security"
              subtitle="Extra sign-in safeguards. Preferences are stored on this device until connected to the server."
            >
              <SettingsToggleRow
                htmlId="settings-2fa"
                label="Two-factor authentication"
                description="Require a second step when signing in from new devices."
                checked={twoFactorEnabled}
                onChange={setTwoFactorEnabled}
              />
              <SettingsToggleRow
                htmlId="settings-login-alert"
                label="Login alert notification"
                description="Get notified when a new sign-in is detected on your account."
                checked={loginAlertEnabled}
                onChange={setLoginAlertEnabled}
              />
            </SettingsSection>

            <SettingsSection
              id="settings-section-password"
              icon={FiLock}
              iconTone="password"
              title="Password"
              subtitle="Update the password you use to sign in to CareSense."
            >
              <div className="settings-password-panel" id="account-password-instructions" role="note">
                <p className="settings-password-panel__title">Password requirements</p>
                <ul className="settings-password-panel__list">
                  <li>At least 8 characters</li>
                  <li>Use a mix of letters, numbers, or symbols where possible</li>
                  <li>New password and confirmation must match</li>
                </ul>
              </div>
              {passwordError ? (
                <div className="account-settings-alert account-settings-alert--error" role="alert">
                  {passwordError}
                </div>
              ) : null}
              {passwordSuccess ? (
                <div className="account-settings-alert account-settings-alert--success" role="status">
                  {passwordSuccess}
                </div>
              ) : null}
              <SettingsFormRow label="Current password" htmlFor="account-current-password">
                <input
                  id="account-current-password"
                  className="settings-input-v2"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.current}
                  onChange={(e) => setPwd('current', e.target.value)}
                  autoComplete="current-password"
                />
              </SettingsFormRow>
              <SettingsFormRow label="New password" htmlFor="account-new-password">
                <input
                  id="account-new-password"
                  className="settings-input-v2"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.next}
                  onChange={(e) => setPwd('next', e.target.value)}
                  autoComplete="new-password"
                />
              </SettingsFormRow>
              <SettingsFormRow label="Confirm password" htmlFor="account-confirm-password">
                <input
                  id="account-confirm-password"
                  className="settings-input-v2"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.confirm}
                  onChange={(e) => setPwd('confirm', e.target.value)}
                  autoComplete="new-password"
                />
              </SettingsFormRow>
              <div className="settings-section-v3__actions">
                <button
                  type="button"
                  className="settings-shell-v2__action-primary"
                  disabled={passwordLoading}
                  onClick={handleChangePassword}
                >
                  <FiLock size={16} strokeWidth={2} aria-hidden />
                  {passwordLoading ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </SettingsSection>

            <section id="settings-section-danger" className="settings-danger-card" aria-labelledby="settings-danger-title">
              <div className="settings-danger-card__inner">
                <div className="settings-danger-card__icon-wrap">
                  <span className="settings-danger-card__icon" aria-hidden>
                    <FiAlertTriangle size={20} strokeWidth={1.75} />
                  </span>
                  <div>
                    <h2 id="settings-danger-title" className="settings-danger-card__title">Delete account</h2>
                    <p className="settings-danger-card__text">
                      Permanently remove your workspace, patients, nurses, and all associated data. This cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="settings-danger-card__btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete account
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>

      {showDeleteModal && (
        <div
          className="destructive-confirm-overlay"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            className="destructive-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="account-delete-modal-title"
            aria-describedby="account-delete-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="destructive-confirm-dialog__header">
              <h2 id="account-delete-modal-title" className="destructive-confirm-dialog__title">
                Delete account?
              </h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                onClick={closeDeleteModal}
              >
                <FiX size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="destructive-confirm-dialog__body">
              <p id="account-delete-modal-desc" className="destructive-confirm-dialog__lead">
                You are about to delete your CareSense account. This cannot be undone.
              </p>

              <div className="destructive-confirm-dialog__warning">
                <div className="destructive-confirm-dialog__warning-bar" aria-hidden />
                <div className="destructive-confirm-dialog__warning-text">
                  <strong>All data will be permanently removed</strong>, including patient records, nurse profiles,
                  schedules, reports, and documents.
                </div>
              </div>

              <div className="destructive-confirm-dialog__card">
                <div
                  className="destructive-confirm-dialog__card-icon destructive-confirm-dialog__card-icon--brand"
                  aria-hidden
                >
                  {initials}
                </div>
                <div className="destructive-confirm-dialog__card-body">
                  <div className="destructive-confirm-dialog__card-title">{profileDisplayName}</div>
                  <div className="destructive-confirm-dialog__card-meta">
                    {user?.email || '—'}
                    {user?.role ? ` · ${user.role}` : ''}
                  </div>
                </div>
              </div>

              <label className="destructive-confirm-dialog__input-label" htmlFor="account-delete-confirm-input">
                Type <strong>{confirmWord}</strong> below to confirm
              </label>
              <div className="destructive-confirm-dialog__input-wrap">
                <span
                  className="destructive-confirm-dialog__input-icon destructive-confirm-dialog__input-icon--danger"
                  aria-hidden
                >
                  <FiAlertTriangle size={16} />
                </span>
                <input
                  id="account-delete-confirm-input"
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
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="destructive-confirm-dialog__btn-danger"
                disabled={deleteConfirmText !== confirmWord}
              >
                <FiTrash2 size={14} aria-hidden />
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
