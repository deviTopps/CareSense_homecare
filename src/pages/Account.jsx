import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiBell, FiGlobe, FiTrash2, FiAlertTriangle, FiX } from '../icons/hugeicons-feather';
import { getUser } from '../api';

const Panel = ({ title, icon, accent = '#45B6FE', children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
    <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${accent}`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: accent, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text)' }}>{title}</span>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

const Field = ({ label, type = 'text', defaultValue, placeholder, disabled }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--kh-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 500,
        border: '1px solid #e5e7eb', borderRadius: 2, outline: 'none',
        background: disabled ? '#f9fafb' : '#fff', color: disabled ? '#9ca3af' : 'var(--kh-text)',
        cursor: disabled ? 'not-allowed' : 'auto',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = '#45B6FE'; }}
      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
    />
  </div>
);

const Toggle = ({ label, description, defaultChecked }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{label}</div>
      {description && <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginTop: 2 }}>{description}</div>}
    </div>
    <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, flexShrink: 0, marginLeft: 16 }}>
      <input type="checkbox" defaultChecked={defaultChecked} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 22,
        background: defaultChecked ? '#45B6FE' : '#e5e7eb', transition: '0.2s',
      }}>
        <span style={{
          position: 'absolute', height: 16, width: 16, left: defaultChecked ? 20 : 3, bottom: 3,
          background: '#fff', borderRadius: '50%', transition: '0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </span>
    </label>
  </div>
);

export default function Account() {
  const user = getUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const confirmWord = 'DELETE';

  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h5 style={{ fontWeight: 800, color: 'var(--kh-text)', marginBottom: 2 }}>Account Settings</h5>
        <p style={{ fontSize: 13, color: 'var(--kh-text-muted)', margin: 0 }}>Manage your profile, security and notification preferences.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          {/* Profile */}
          <Panel title="Profile Information" icon={<FiUser size={14} />}>
            <div className="row g-3">
              <div className="col-sm-6">
                <Field label="First Name" defaultValue={user?.firstName} placeholder="First name" />
              </div>
              <div className="col-sm-6">
                <Field label="Last Name" defaultValue={user?.lastName} placeholder="Last name" />
              </div>
              <div className="col-sm-6">
                <Field label="Email Address" type="email" defaultValue={user?.email} placeholder="email@example.com" />
              </div>
              <div className="col-sm-6">
                <Field label="Phone Number" type="tel" defaultValue={user?.phone} placeholder="+233 000 000 000" />
              </div>
              <div className="col-12">
                <Field label="Role" defaultValue={user?.role} disabled />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button style={{
                background: '#45B6FE', border: 'none', borderRadius: 2, padding: '9px 22px',
                fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <FiSave size={13} /> Save Changes
              </button>
            </div>
          </Panel>

          {/* Password */}
          <Panel title="Change Password" icon={<FiLock size={14} />} accent="#8b5cf6">
            <div className="row g-3">
              <div className="col-12">
                <Field label="Current Password" type="password" placeholder="••••••••" />
              </div>
              <div className="col-sm-6">
                <Field label="New Password" type="password" placeholder="••••••••" />
              </div>
              <div className="col-sm-6">
                <Field label="Confirm New Password" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button style={{
                background: '#8b5cf6', border: 'none', borderRadius: 2, padding: '9px 22px',
                fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <FiLock size={13} /> Update Password
              </button>
            </div>
          </Panel>
        </div>

        <div className="col-lg-4">
          {/* Notifications */}
          <Panel title="Notifications" icon={<FiBell size={14} />} accent="#f59e0b">
            <Toggle label="Email Alerts" description="Receive alerts via email" defaultChecked={true} />
            <Toggle label="Shift Reminders" description="Notify before scheduled shifts" defaultChecked={true} />
            <Toggle label="Patient Updates" description="New patient activity" defaultChecked={false} />
            <Toggle label="System Announcements" description="Platform news & updates" defaultChecked={true} />
          </Panel>

          {/* Preferences */}
          <Panel title="Preferences" icon={<FiGlobe size={14} />} accent="#10b981">
            <Field label="Language" defaultValue="English (UK)" />
            <Field label="Timezone" defaultValue="Africa/Accra (GMT+0)" />
            <Field label="Date Format" defaultValue="DD/MM/YYYY" />
          </Panel>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ marginTop: 8 }}>
        <div style={{ background: '#fff', borderRadius: 2, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8, background: '#fafafa' }}>
            <FiAlertTriangle size={13} style={{ color: '#111827' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#111827' }}>Danger Zone</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 3 }}>Delete this account</div>
              <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)' }}>Permanently remove your account and all associated data. This action cannot be undone.</div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: '#111827', border: 'none', borderRadius: 2,
                padding: '9px 18px', fontSize: 13, fontWeight: 700, color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.background = '#111827'}
            >
              <FiTrash2 size={13} /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="app-modal-overlay app-modal-overlay--danger-flow" role="presentation" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>
          <div className="destructive-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="account-delete-title" onClick={(e) => e.stopPropagation()}>
            <div className="destructive-confirm-dialog__header">
              <h2 id="account-delete-title" className="destructive-confirm-dialog__title">Delete account</h2>
              <button
                type="button"
                className="destructive-confirm-dialog__close"
                aria-label="Close"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
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
                <span className="destructive-confirm-dialog__input-icon destructive-confirm-dialog__input-icon--danger" aria-hidden>
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
              <button type="button" className="destructive-confirm-dialog__btn-cancel" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>
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
