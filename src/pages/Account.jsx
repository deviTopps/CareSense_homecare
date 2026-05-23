import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FiLock,
  FiSave,
  FiTrash2,
  FiAlertTriangle,
  FiX,
  FiRefreshCw,
  FiUsers,
  FiCheckCircle,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiSearch,
  FiCreditCard,
  FiEye,
  FiBell,
  FiGrid,
  FiShield,
  FiUpload,
} from '../icons/hugeicons-feather';
import { getUser, changePassword, fetchAuthUsers, apiFetch } from '../api';

const fontStack = "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif'";

const WORKSPACE_USERS_PER_PAGE = 10;
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

const SETTINGS_NAV = [
  { key: 'account', tabKey: 'forms', label: 'Account settings', Icon: FiSettings },
  { key: 'billing', tabKey: 'billing', label: 'Billing & Subscription', Icon: FiCreditCard },
  { key: 'appearance', tabKey: 'appearance', label: 'Appearance', Icon: FiEye },
  { key: 'notifications', tabKey: 'notifications', label: 'Notifications', Icon: FiBell },
  { key: 'integrations', tabKey: 'integrations', label: 'Integrations', Icon: FiGrid },
  { key: 'privacy', tabKey: 'privacy', label: 'Privacy & Data', Icon: FiShield },
  { key: 'workspace', tabKey: 'users', label: 'Workspace users', Icon: FiUsers },
];

function SettingsSection({ id, title, subtitle, children, className = '' }) {
  return (
    <section id={id} className={['settings-section-v2', className].filter(Boolean).join(' ')}>
      <div className="settings-section-v2__head">
        <h2 className="settings-section-v2__title">{title}</h2>
        {subtitle ? <p className="settings-section-v2__subtitle">{subtitle}</p> : null}
      </div>
      <div className="settings-section-v2__body">{children}</div>
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

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [userCreatedModal, setUserCreatedModal] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [workspaceUsersLoading, setWorkspaceUsersLoading] = useState(false);
  const [workspaceUsersError, setWorkspaceUsersError] = useState('');
  const [workspaceUsersPage, setWorkspaceUsersPage] = useState(1);
  const [workspaceUsersSearch, setWorkspaceUsersSearch] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlertEnabled, setLoginAlertEnabled] = useState(true);
  const [settingsTab, setSettingsTab] = useState('forms');
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
      setWorkspaceUsersPage(1);
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

  const filteredWorkspaceUsers = useMemo(() => {
    const q = workspaceUsersSearch.trim().toLowerCase();
    if (!q) return workspaceUsers;
    return workspaceUsers.filter((row) => (
      row.name.toLowerCase().includes(q)
      || row.email.toLowerCase().includes(q)
      || row.phone.toLowerCase().includes(q)
      || String(row.role).toLowerCase().includes(q)
      || String(row.id).toLowerCase().includes(q)
    ));
  }, [workspaceUsers, workspaceUsersSearch]);

  useEffect(() => {
    setWorkspaceUsersPage(1);
  }, [workspaceUsersSearch]);

  const workspaceUsersTotalPages = Math.max(1, Math.ceil(filteredWorkspaceUsers.length / WORKSPACE_USERS_PER_PAGE));
  const workspaceUsersStartRow =
    filteredWorkspaceUsers.length === 0 ? 0 : (workspaceUsersPage - 1) * WORKSPACE_USERS_PER_PAGE + 1;
  const workspaceUsersEndRow = Math.min(
    workspaceUsersPage * WORKSPACE_USERS_PER_PAGE,
    filteredWorkspaceUsers.length,
  );
  const pagedWorkspaceUsers = useMemo(
    () =>
      filteredWorkspaceUsers.slice(
        (workspaceUsersPage - 1) * WORKSPACE_USERS_PER_PAGE,
        workspaceUsersPage * WORKSPACE_USERS_PER_PAGE,
      ),
    [filteredWorkspaceUsers, workspaceUsersPage],
  );

  const workspaceUsersPgBtn = (onClick, disabled, children) => (
    <button type="button" onClick={onClick} disabled={disabled} className="patients-page-btn">
      {children}
    </button>
  );

  useEffect(() => {
    if (workspaceUsersPage > workspaceUsersTotalPages) {
      setWorkspaceUsersPage(workspaceUsersTotalPages);
    }
  }, [workspaceUsersPage, workspaceUsersTotalPages]);

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

  const scrollToProfileSection = useCallback(() => {
    document.getElementById('settings-section-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="page-wrapper account-settings-page account-settings-page--v2" style={{ fontFamily: fontStack }}>
      <div className="settings-shell-v2">
        <header className="settings-shell-v2__header">
          <div>
            <h1 className="settings-shell-v2__title">Settings</h1>
            <p className="settings-shell-v2__subtitle">
              {user?.email || 'Signed in'}
              {user?.role ? ` · ${user.role}` : ''}
            </p>
          </div>
          <button type="button" className="settings-shell-v2__save-btn" onClick={scrollToProfileSection}>
            <FiSave size={16} strokeWidth={2} aria-hidden />
            Save changes
          </button>
        </header>

        <div className="settings-nav-v2" role="tablist" aria-label="Settings sections">
          {SETTINGS_NAV.map((item) => {
            const isActive = settingsTab === item.tabKey;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`settings-tab-${item.key}`}
                className={`settings-nav-v2__tab${isActive ? ' is-active' : ''}`}
                aria-selected={isActive}
                aria-controls={`account-panel-${item.tabKey}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setSettingsTab(item.tabKey)}
              >
                <item.Icon size={18} strokeWidth={1.75} aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div
          id="account-panel-forms"
          role="tabpanel"
          aria-labelledby="settings-tab-account"
          hidden={settingsTab !== 'forms'}
          className="settings-shell-v2__panel"
        >
          <div className="settings-shell-v2__content">
            <SettingsSection
              id="settings-section-profile"
              title="Agency Information"
              subtitle="Manage your agency details, contact information, and branding."
            >
              <div className="settings-profile-avatar-row">
                <div
                  className={`settings-profile-avatar-v2 settings-profile-avatar-v2--logo${agencyLogoPreview ? ' settings-profile-avatar-v2--has-logo' : ''}${agencyLogoUploading ? ' is-uploading' : ''}`}
                >
                  {agencyLogoPreview ? (
                    <img src={agencyLogoPreview} alt="Agency logo preview" className="settings-profile-logo-img" />
                  ) : (
                    <span aria-hidden>{initials}</span>
                  )}
                </div>
                <div className="settings-profile-avatar-actions">
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
                    {agencyLogoUploading ? 'Uploading...' : 'Upload logo'}
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
              {agencyLogoAsset?.objectKey ? (
                <p className="settings-inline-meta">Stored media key: {agencyLogoAsset.objectKey}</p>
              ) : null}

              <SettingsFormRow label="Name" htmlFor="settings-profile-fullname">
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
              <SettingsFormRow label="Phone number" htmlFor="settings-profile-phone">
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
                />
              </SettingsFormRow>
            </SettingsSection>

            <SettingsSection
              title="Security"
              subtitle="Extra safeguards for your workspace sign-in (preferences are stored on this device until the API is connected)."
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
              title="Password management"
              subtitle="Update the password you use to sign in to CareSense."
            >
              <div
                className="settings-password-note"
                id="account-password-instructions"
                role="note"
              >
                <p className="settings-password-note__title">Password requirements</p>
                <ul className="settings-password-note__list">
                  <li>At least 8 characters</li>
                  <li>Use a mix of letters, numbers, or symbols where possible</li>
                  <li>New password and confirmation must match</li>
                </ul>
              </div>
              {passwordError ? (
                <div className="account-settings-alert account-settings-alert--error mb-3" role="alert">
                  {passwordError}
                </div>
              ) : null}
              {passwordSuccess ? (
                <div className="account-settings-alert account-settings-alert--success mb-3" role="status">
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
              <SettingsFormRow label="Confirm new password" htmlFor="account-confirm-password">
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
              <div className="settings-section-v2__actions">
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

          </div>
        </div>

        {/* ── Billing tab ── */}
        <div
          id="account-panel-billing"
          role="tabpanel"
          aria-labelledby="settings-tab-billing"
          hidden={settingsTab !== 'billing'}
          className="settings-shell-v2__panel"
        >
          <div className="settings-shell-v2__content">
            <SettingsSection title="Plan & subscription" subtitle="View your current plan and manage your subscription.">
              <SettingsFormRow label="Current plan">
                <div className="settings-plan-badge">Free</div>
              </SettingsFormRow>
              <SettingsFormRow label="Billing cycle">
                <span className="settings-meta-text">Monthly</span>
              </SettingsFormRow>
              <SettingsFormRow label="Next invoice">
                <span className="settings-meta-text">—</span>
              </SettingsFormRow>
            </SettingsSection>
            <SettingsSection title="Payment method" subtitle="Add or update your payment details.">
              <div className="settings-empty-state">
                <FiCreditCard size={32} strokeWidth={1.5} />
                <p>No payment method on file.</p>
                <button type="button" className="settings-shell-v2__action-primary">Add payment method</button>
              </div>
            </SettingsSection>
          </div>
        </div>

        {/* ── Appearance tab ── */}
        <div
          id="account-panel-appearance"
          role="tabpanel"
          aria-labelledby="settings-tab-appearance"
          hidden={settingsTab !== 'appearance'}
          className="settings-shell-v2__panel"
        >
          <div className="settings-shell-v2__content">
            <SettingsSection title="Theme" subtitle="Choose how CareSense looks for you.">
              <SettingsFormRow label="Color theme" htmlFor="settings-theme">
                <select id="settings-theme" className="settings-select-v2" defaultValue="system">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System default</option>
                </select>
              </SettingsFormRow>
            </SettingsSection>
            <SettingsSection title="Display" subtitle="Adjust layout and density preferences.">
              <SettingsToggleRow
                htmlId="settings-compact"
                label="Compact mode"
                description="Reduce spacing and padding across the interface."
                checked={false}
                onChange={() => {}}
              />
              <SettingsToggleRow
                htmlId="settings-animations"
                label="Reduce animations"
                description="Minimise motion effects throughout the app."
                checked={false}
                onChange={() => {}}
              />
            </SettingsSection>
          </div>
        </div>

        {/* ── Notifications tab ── */}
        <div
          id="account-panel-notifications"
          role="tabpanel"
          aria-labelledby="settings-tab-notifications"
          hidden={settingsTab !== 'notifications'}
          className="settings-shell-v2__panel"
        >
          <div className="settings-shell-v2__content">
            <SettingsSection title="Email notifications" subtitle="Control which emails CareSense sends you.">
              <SettingsToggleRow htmlId="notif-scheduling" label="Scheduling updates" description="When visits are created, modified, or cancelled." checked={true} onChange={() => {}} />
              <SettingsToggleRow htmlId="notif-patient" label="Patient alerts" description="Critical patient status changes and vital alerts." checked={true} onChange={() => {}} />
              <SettingsToggleRow htmlId="notif-billing" label="Billing reminders" description="Invoice and payment-related notifications." checked={false} onChange={() => {}} />
              <SettingsToggleRow htmlId="notif-weekly" label="Weekly summary" description="A digest of key metrics delivered every Monday." checked={true} onChange={() => {}} />
            </SettingsSection>
            <SettingsSection title="Push notifications" subtitle="Browser and mobile push alerts.">
              <SettingsToggleRow htmlId="notif-push-enabled" label="Enable push notifications" description="Receive real-time alerts in your browser." checked={false} onChange={() => {}} />
            </SettingsSection>
          </div>
        </div>

        {/* ── Integrations tab ── */}
        <div
          id="account-panel-integrations"
          role="tabpanel"
          aria-labelledby="settings-tab-integrations"
          hidden={settingsTab !== 'integrations'}
          className="settings-shell-v2__panel"
        >
          <div className="settings-shell-v2__content">
            <SettingsSection title="Connected services" subtitle="Manage third-party integrations with your workspace.">
              <div className="settings-empty-state">
                <FiGrid size={32} strokeWidth={1.5} />
                <p>No integrations connected yet.</p>
                <button type="button" className="settings-shell-v2__action-primary">Browse integrations</button>
              </div>
            </SettingsSection>
          </div>
        </div>

        {/* ── Privacy & Data tab ── */}
        <div
          id="account-panel-privacy"
          role="tabpanel"
          aria-labelledby="settings-tab-privacy"
          hidden={settingsTab !== 'privacy'}
          className="settings-shell-v2__panel"
        >
          <div className="settings-shell-v2__content">
            <SettingsSection title="Data management" subtitle="Control how your data is stored and shared.">
              <SettingsToggleRow htmlId="privacy-analytics" label="Usage analytics" description="Help us improve CareSense by sending anonymous usage data." checked={true} onChange={() => {}} />
              <SettingsToggleRow htmlId="privacy-crash" label="Crash reports" description="Automatically send error reports to help us fix bugs." checked={true} onChange={() => {}} />
            </SettingsSection>
            <SettingsSection title="Data export" subtitle="Download a copy of your workspace data.">
              <div className="settings-empty-state">
                <FiShield size={32} strokeWidth={1.5} />
                <p>Request a full export of your organisation data in CSV format.</p>
                <button type="button" className="settings-shell-v2__action-primary">Request data export</button>
              </div>
            </SettingsSection>
          </div>
        </div>

        {/* ── Workspace users tab ── */}
        <div
          id="account-panel-users"
          role="tabpanel"
          aria-labelledby="settings-tab-workspace"
          hidden={settingsTab !== 'users'}
          className="settings-shell-v2__panel"
        >
          <div className="settings-shell-v2__content">
            <SettingsSection
              title="Workspace users"
              subtitle="View and manage all users in your workspace."
            >
          <div className="account-users-toolbar mb-3 d-flex flex-wrap align-items-center justify-content-end gap-2">
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
              No users found. Tap Refresh or add someone under Account settings.
            </p>
          ) : null}
          {workspaceUsers.length > 0 ? (
            <div className="patients-searchbox account-users-search mb-3">
              <FiSearch className="patients-searchbox__icon" size={16} aria-hidden />
              <input
                type="search"
                className="form-control form-control-kh patients-searchbox__input"
                placeholder="Search by name, email, phone, or role"
                value={workspaceUsersSearch}
                onChange={(e) => setWorkspaceUsersSearch(e.target.value)}
                aria-label="Search workspace users"
                autoComplete="off"
              />
            </div>
          ) : null}
          {!workspaceUsersLoading &&
          workspaceUsers.length > 0 &&
          filteredWorkspaceUsers.length === 0 &&
          workspaceUsersSearch.trim() ? (
            <p className="text-muted small mb-0">No users match your search. Try different keywords.</p>
          ) : null}
          {workspaceUsers.length > 0 && filteredWorkspaceUsers.length > 0 ? (
            <>
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
                  {pagedWorkspaceUsers.map((row) => (
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
            <div className="patients-pagination-footer account-users-pagination-footer">
              <div className="patients-pagination-summary">
                <span>Showing</span>
                <strong>{workspaceUsersStartRow}–{workspaceUsersEndRow}</strong>
                <span>of</span>
                <strong>{filteredWorkspaceUsers.length}</strong>
              </div>
              <div className="d-flex gap-1 patients-pagination-actions flex-wrap">
                {workspaceUsersPgBtn(
                  () => setWorkspaceUsersPage(1),
                  workspaceUsersPage === 1,
                  <FiChevronsLeft size={14} />,
                )}
                {workspaceUsersPgBtn(
                  () => setWorkspaceUsersPage((p) => p - 1),
                  workspaceUsersPage === 1,
                  <FiChevronLeft size={14} />,
                )}
                {Array.from({ length: workspaceUsersTotalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === workspaceUsersTotalPages || Math.abs(p - workspaceUsersPage) <= 1)
                  .map((pNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && pNum - prev > 1;
                    return (
                      <span key={pNum}>
                        {showEllipsis && <span className="patients-pagination-ellipsis">…</span>}
                        <button
                          type="button"
                          onClick={() => setWorkspaceUsersPage(pNum)}
                          className={`patients-page-number${workspaceUsersPage === pNum ? ' active' : ''}`}
                        >
                          {pNum}
                        </button>
                      </span>
                    );
                  })}
                {workspaceUsersPgBtn(
                  () => setWorkspaceUsersPage((p) => p + 1),
                  workspaceUsersPage === workspaceUsersTotalPages,
                  <FiChevronRight size={14} />,
                )}
                {workspaceUsersPgBtn(
                  () => setWorkspaceUsersPage(workspaceUsersTotalPages),
                  workspaceUsersPage === workspaceUsersTotalPages,
                  <FiChevronsRight size={14} />,
                )}
              </div>
            </div>
            </>
          ) : null}
            </SettingsSection>
          </div>
        </div>
      </div>

      <section className="dz-section">
        <h3 className="dz-section__title">Danger zone</h3>
        <div className="dz-section__row">
          <div className="dz-section__info">
            <strong>Delete this account</strong>
            <span>Once deleted, all data will be permanently removed and cannot be recovered.</span>
          </div>
          <button
            type="button"
            className="dz-section__btn"
            onClick={() => setShowDeleteModal(true)}
          >
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
          className="dz-modal-overlay"
          role="presentation"
          onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
        >
          <div
            className="dz-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dz-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dz-modal__icon-wrap">
              <FiAlertTriangle size={24} strokeWidth={2} />
            </div>

            <h2 id="dz-delete-title" className="dz-modal__title">Delete your account?</h2>
            <p className="dz-modal__desc">
              This action is <strong>permanent</strong>. All nurses, patient records, schedules, and documents will be removed and cannot be recovered.
            </p>

            <label className="dz-modal__label" htmlFor="dz-confirm-input">
              Type <strong>{confirmWord}</strong> to confirm
            </label>
            <input
              id="dz-confirm-input"
              className="dz-modal__input"
              type="text"
              autoComplete="off"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={confirmWord}
            />

            <div className="dz-modal__actions">
              <button
                type="button"
                className="dz-modal__btn dz-modal__btn--cancel"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dz-modal__btn dz-modal__btn--delete"
                disabled={deleteConfirmText !== confirmWord}
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
