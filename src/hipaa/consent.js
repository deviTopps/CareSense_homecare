/**
 * Patient consent / authorization helpers (HIPAA Privacy Rule).
 * Persists to backend when endpoint exists; falls back to audit log.
 */

import { logAuditEvent } from './auditLog';

const CONSENT_TYPES = {
  TREATMENT: 'treatment',
  DATA_SHARING: 'data_sharing',
  MARKETING: 'marketing',
  RESEARCH: 'research',
};

export { CONSENT_TYPES };

export async function recordPatientConsent({
  patientId,
  consentType,
  granted,
  documentVersion = '1.0',
  note = '',
}) {
  logAuditEvent({
    action: granted ? 'consent_granted' : 'consent_revoked',
    resourceType: 'patient_consent',
    resourceId: patientId,
    metadata: { consentType, documentVersion, note },
  });

  const token = localStorage.getItem('token');
  if (!token || !patientId) return { ok: false, localOnly: true };

  const response = await fetch(
    `https://care-sense-backend.onrender.com/api/patients/${encodeURIComponent(patientId)}/consents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        consentType,
        granted,
        documentVersion,
        recordedAt: new Date().toISOString(),
        note,
      }),
    },
  ).catch(() => null);

  return { ok: Boolean(response?.ok), localOnly: !response?.ok };
}

export function consentLabel(type) {
  const labels = {
    [CONSENT_TYPES.TREATMENT]: 'Treatment & care operations',
    [CONSENT_TYPES.DATA_SHARING]: 'Share records with authorized parties',
    [CONSENT_TYPES.MARKETING]: 'Marketing communications',
    [CONSENT_TYPES.RESEARCH]: 'Research participation',
  };
  return labels[type] || type;
}
