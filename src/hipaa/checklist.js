/**
 * HIPAA compliance checklist mapped to CareSense implementation status.
 * Based on: https://www.accountablehq.com/post/hipaa-compliance-checklist-for-launching-a-health-app
 */

export const HIPAA_CHECKLIST = [
  {
    id: 'data-flow',
    title: 'Data Flow Mapping',
    summary: 'Document every place PHI is created, received, maintained, or transmitted.',
    items: [
      { id: 'df-1', label: 'PHI data elements and sources documented', status: 'implemented', detail: 'Compliance dashboard lists API routes and browser storage keys.' },
      { id: 'df-2', label: 'End-to-end lifecycle mapped (collection → disposal)', status: 'partial', detail: 'Frontend flows documented; confirm backend/database mapping with your team.' },
      { id: 'df-3', label: 'Minimum necessary standard applied to data paths', status: 'implemented', detail: 'Role-based route access limits who can reach PHI modules.' },
      { id: 'df-4', label: 'Third-party/vendor PHI flows inventoried', status: 'partial', detail: 'Render hosting, B2 media, email share — require signed BAAs.' },
    ],
  },
  {
    id: 'risk',
    title: 'Risk Assessment',
    summary: 'Formal risk analysis across administrative, physical, and technical safeguards.',
    items: [
      { id: 'ra-1', label: 'Asset inventory for systems processing PHI', status: 'partial', detail: 'SPA + API documented; extend to mobile and CI/CD.' },
      { id: 'ra-2', label: 'Vulnerability / penetration testing before launch', status: 'organizational', detail: 'Schedule annual pentest and after major releases.' },
      { id: 'ra-3', label: 'Prioritized risk register with owners', status: 'organizational', detail: 'Track in your compliance program (not auto-generated).' },
      { id: 'ra-4', label: 'Backup restore testing (RTO/RPO)', status: 'backend', detail: 'Verify with backend/infrastructure team.' },
    ],
  },
  {
    id: 'baa',
    title: 'Business Associate Agreements',
    summary: 'BAAs with vendors that may access PHI.',
    items: [
      { id: 'baa-1', label: 'Cloud host BAA (Render/AWS/etc.)', status: 'organizational', detail: 'Obtain signed BAA before production PHI.' },
      { id: 'baa-2', label: 'Email / messaging provider BAA', status: 'organizational', detail: 'Required for medical report email share.' },
      { id: 'baa-3', label: 'Storage vendor BAA (B2/media)', status: 'organizational', detail: 'Confirm presigned upload provider signs BAA.' },
      { id: 'baa-4', label: 'BAA inventory with renewal dates', status: 'partial', detail: 'Track in Compliance dashboard vendor section.' },
    ],
  },
  {
    id: 'access',
    title: 'Access Controls',
    summary: 'Least privilege, RBAC, MFA, and session management.',
    items: [
      { id: 'ac-1', label: 'Unique user IDs and authentication', status: 'implemented', detail: 'JWT auth per workspace user.' },
      { id: 'ac-2', label: 'Role-based access control (RBAC)', status: 'implemented', detail: 'Route guards by role (administrator, manager, nurse, accountant, etc.).' },
      { id: 'ac-3', label: 'Multi-factor authentication (MFA)', status: 'partial', detail: 'UI placeholder exists — connect to backend MFA before production.' },
      { id: 'ac-4', label: 'Automatic session timeout on idle', status: 'implemented', detail: '3-minute idle logout with warning modal.' },
      { id: 'ac-5', label: 'PHI cleared from browser on logout', status: 'implemented', detail: 'Clinical caches purged when session ends.' },
      { id: 'ac-6', label: 'Periodic access reviews', status: 'organizational', detail: 'Review workforce roles quarterly.' },
    ],
  },
  {
    id: 'encryption',
    title: 'Data Encryption',
    summary: 'Encrypt PHI at rest and in transit.',
    items: [
      { id: 'enc-1', label: 'TLS 1.2+ for all API traffic', status: 'implemented', detail: 'HTTPS to care-sense-backend.onrender.com.' },
      { id: 'enc-2', label: 'Database encryption at rest (AES-256)', status: 'backend', detail: 'Enable on production database — verify with backend team.' },
      { id: 'enc-3', label: 'No PHI in client logs', status: 'implemented', detail: 'API debug logging redacts tokens and bodies in production.' },
      { id: 'enc-4', label: 'Secrets not embedded in client code', status: 'implemented', detail: 'Tokens server-issued; no API secrets in frontend.' },
      { id: 'enc-5', label: 'Security headers (CSP, HSTS, nosniff)', status: 'implemented', detail: 'Configured in vercel.json deployment.' },
    ],
  },
  {
    id: 'audit',
    title: 'Audit Trails',
    summary: 'Who accessed PHI, what action, when, and outcome.',
    items: [
      { id: 'au-1', label: 'PHI API access logged', status: 'implemented', detail: 'Client audit events for patient/clinical endpoints.' },
      { id: 'au-2', label: 'Login / logout session events logged', status: 'implemented', detail: 'Session events recorded in audit queue.' },
      { id: 'au-3', label: 'Central immutable audit store', status: 'backend', detail: 'POST /compliance/audit-events — implement server-side retention (6+ years recommended).' },
      { id: 'au-4', label: 'Admin audit log viewer', status: 'implemented', detail: 'Compliance dashboard shows recent events.' },
    ],
  },
  {
    id: 'consent',
    title: 'Consent Management',
    summary: 'HIPAA authorization vs TPO; user preferences honored.',
    items: [
      { id: 'cm-1', label: 'Notice of Privacy Practices published', status: 'implemented', detail: '/privacy policy page.' },
      { id: 'cm-2', label: 'Patient consent capture with timestamp', status: 'partial', detail: 'Helper + audit log; wire patient profile UI to backend consents API.' },
      { id: 'cm-3', label: 'Consent revocation honored', status: 'partial', detail: 'Requires backend enforcement across workflows.' },
      { id: 'cm-4', label: 'No PHI in push/email without authorization', status: 'partial', detail: 'Review medical report share and notification templates.' },
    ],
  },
];

export const PHI_DATA_FLOWS = [
  { system: 'Patient registry', path: 'POST/GET /patients', storage: 'Backend DB', phi: 'Demographics, clinical history' },
  { system: 'Vitals', path: 'POST/GET /vitals', storage: 'Backend DB', phi: 'Vital signs' },
  { system: 'Medical reports', path: 'POST /ai/medical-report/share', storage: 'Email + PDF', phi: 'Full report' },
  { system: 'Admission drafts', path: 'Browser localStorage', storage: 'Device (cleared on logout)', phi: 'Draft admission PHI' },
  { system: 'Finance', path: 'GET /patient-invoices, /patient-payments', storage: 'Backend DB', phi: 'Billing linked to patient' },
  { system: 'Attendance / EVV', path: 'POST /attendance', storage: 'Backend DB', phi: 'GPS + visit verification' },
];

export const VENDOR_BAA_REMINDERS = [
  { vendor: 'Render (API hosting)', scope: 'Application server & API', action: 'Obtain BAA' },
  { vendor: 'Backblaze B2 (media)', scope: 'Patient photos/documents', action: 'Obtain BAA' },
  { vendor: 'Email provider (report share)', scope: 'PHI in email attachments', action: 'Obtain BAA or use HIPAA-compliant service' },
  { vendor: 'Vercel (frontend hosting)', scope: 'Static app delivery (no PHI at rest)', action: 'Confirm BAA if required by policy' },
];

export function checklistStats() {
  let implemented = 0;
  let total = 0;
  HIPAA_CHECKLIST.forEach((section) => {
    section.items.forEach((item) => {
      total += 1;
      if (item.status === 'implemented') implemented += 1;
    });
  });
  return { implemented, total, percent: total ? Math.round((implemented / total) * 100) : 0 };
}
