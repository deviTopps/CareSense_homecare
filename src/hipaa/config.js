/** HIPAA Security Rule aligned defaults (frontend). */

export const HIPAA_SESSION = {
  /** Auto-logout after idle period (workstation policy). */
  INACTIVITY_LOGOUT_MS: 3 * 60 * 1000,
  /** Warn user before forced logout. */
  INACTIVITY_WARNING_MS: 2.5 * 60 * 1000,
  /** Re-check JWT expiry interval. */
  TOKEN_CHECK_INTERVAL_MS: 60_000,
};

/** API path prefixes that touch PHI — audited on access. */
export const PHI_API_PREFIXES = [
  '/patients',
  '/vitals',
  '/patient-',
  '/care-visits',
  '/alerts',
  '/ai/medical-report',
  '/nurse-notes',
  '/incidents',
  '/medications',
  '/patient-billing',
  '/patient-invoices',
  '/patient-payments',
  '/drugs',
];

/** Browser storage keys/prefixes that may hold PHI. */
export const PHI_STORAGE_PREFIXES = [
  'caresense.admissionDrafts',
  'patientProfilePhotoCache',
  'patientProfileMedicationCache',
  'caresense.patientAdmissionMedications',
  'caresense.finance',
  'patientBilling',
];

export const PHI_SESSION_STORAGE_KEYS = [
  'caresense.medicalReports.list.v1',
];

export const AUDIT_QUEUE_KEY = 'caresense.hipaa.auditQueue.v1';
export const AUDIT_MAX_QUEUE = 200;
