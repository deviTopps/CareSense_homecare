/**
 * Role-based access control (minimum necessary standard).
 * Backend must enforce the same rules; this mirrors them in the UI.
 */

const ALL_NURSE_ROLES = [
  'head_nurse',
  'supervising_nurse',
  'office_nurse',
  'field_nurse',
  'nurse',
];

const CLINICAL_ROLES = [
  'administrator',
  'manager',
  ...ALL_NURSE_ROLES,
];

const ADMIN_ALIASES = ['administrator', 'manager', 'admin', 'owner', 'super_admin', 'agency_owner'];

/** Route path → roles allowed (exact or prefix match). Kept for reference / future backend sync. */
export const ROUTE_PERMISSIONS = {
  '/dashboard': null,
  '/account': null,
  '/patients': null,
  '/workforce': null,
  '/scheduling': null,
  '/nurse-scheduling': null,
  '/clinical': null,
  '/attendance': null,
  '/enquiries': null,
  '/reports': null,
  '/finance': null,
  '/invoices-payments': null,
  '/billing': null,
  '/wallet/success': null,
};

export const PERMISSIONS = {
  MANAGE_USERS: [...ADMIN_ALIASES, 'hr'],
  VIEW_AUDIT_LOG: ADMIN_ALIASES,
  EXPORT_PHI: [...CLINICAL_ROLES, 'staff', ...ADMIN_ALIASES],
  MANAGE_FINANCE: [...ADMIN_ALIASES, 'accountant'],
};

/** Routes that require explicit permission (all other app routes are open to signed-in users). */
const RESTRICTED_ROUTES = {};

export function normalizeRole(user) {
  return String(user?.role || 'staff').trim().toLowerCase();
}

export function isAdminLike(user) {
  return ADMIN_ALIASES.includes(normalizeRole(user));
}

export function hasPermission(user, permissionKey) {
  const allowed = PERMISSIONS[permissionKey];
  if (!allowed) return false;
  const role = normalizeRole(user);
  if (allowed.includes(role)) return true;
  if (isAdminLike(user) && permissionKey !== 'MANAGE_FINANCE') return true;
  return false;
}

export function canAccessRoute(user, pathname) {
  const role = normalizeRole(user);
  const path = String(pathname || '').split('?')[0];

  for (const [routePrefix, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (path === routePrefix || path.startsWith(`${routePrefix}/`)) {
      return allowedRoles.includes(role) || isAdminLike(user);
    }
  }
  return true;
}

export function getRoleLabel(role) {
  const map = {
    administrator: 'Administrator',
    manager: 'Manager',
    accountant: 'Accountant',
    hr: 'HR',
    staff: 'Staff',
    head_nurse: 'Head Nurse',
    supervising_nurse: 'Supervising Nurse',
    office_nurse: 'Office Nurse',
    field_nurse: 'Field Nurse',
    nurse: 'Nurse',
  };
  return map[normalizeRole({ role })] || role || 'Staff';
}
