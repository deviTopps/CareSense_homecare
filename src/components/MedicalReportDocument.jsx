import { useMemo, useState } from 'react';
import { getUser } from '../api';
import {
  REPORT_VIEWER_STYLES,
  buildMedicalReportModel,
  extractAgencyLogoUrl,
} from '../utils/medicalReportTemplate';
import AssessmentBlocksContent from './AssessmentBlocksContent';

function HeartLogo() {
  return (
    <svg className="mr-logo__heart" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M32 54s-18-11.2-18-24.5C14 19.8 19.5 14 26 14c4.2 0 8 2.2 10 5.7C38 16.2 41.8 14 46 14 52.5 14 58 19.8 58 29.5 58 42.8 32 54 32 54z"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d="M32 48s-13-8.5-13-18.8C19 24.5 23 20 28 20c3.2 0 6 1.7 7.6 4.4C37.2 21.7 40 20 43 20 48 20 52 24.5 52 29.2 52 39.5 32 48 32 48z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}

function InfoLine({ label, value }) {
  return (
    <p className="mr-info-line">
      <strong>{label}:</strong>
      {' '}
      {value || '—'}
    </p>
  );
}

function NarrativeSection({ title, children }) {
  if (!children) return null;
  return (
    <section className="mr-block">
      <h3 className="mr-section-title">{title}</h3>
      <div className="mr-body">{children}</div>
    </section>
  );
}

function OverallSummarySection({ text }) {
  const summary = String(text || '').trim();
  if (!summary) return null;
  return (
    <section className="mr-overall-summary" aria-label="Overall Summary">
      <span className="mr-overall-summary__badge">Important</span>
      <h3 className="mr-overall-summary__title">Overall Summary</h3>
      <p className="mr-overall-summary__text">{summary}</p>
    </section>
  );
}

function formatDoctorName(name) {
  const value = String(name || '').trim();
  if (!value || value === '—') return '—';
  return /^dr\.?\s/i.test(value) ? value : `Dr. ${value}`;
}

export default function MedicalReportDocument({
  report,
  className = '',
  innerRef = null,
  contentEditable = false,
}) {
  const user = getUser();
  const model = useMemo(() => buildMedicalReportModel(report, user), [report, user]);
  const logoUrl = extractAgencyLogoUrl(user);
  const [logoFailed, setLogoFailed] = useState(false);

  const footerLines = [
    'For inquiries and appointments, feel free to contact us.',
    [
      model.contactPhone !== '—' ? `phone: ${model.contactPhone}` : '',
      model.contactEmail !== '—' ? `email: ${model.contactEmail}` : '',
    ].filter(Boolean).join(', '),
    model.contactWebsite,
  ].filter(Boolean);

  return (
    <>
      <style>{REPORT_VIEWER_STYLES}</style>
      <article
        ref={innerRef}
        className={`reports-document reports-document--styled medical-report ${className}`.trim()}
        contentEditable={contentEditable}
        suppressContentEditableWarning={contentEditable}
      >
        <header className="mr-header">
          <div className="mr-header__inner">
            <div className="mr-logo">
              {logoUrl && !logoFailed ? (
                <img src={logoUrl} alt="" onError={() => setLogoFailed(true)} />
              ) : (
                <HeartLogo />
              )}
            </div>
            <h1 className="mr-agency-name">{model.agencyName}</h1>
            <p className="mr-agency-address">{model.agencyAddress}</p>
          </div>
          <h2 className="mr-doc-title">Medical Report</h2>
        </header>

        <section className="mr-block">
          <h3 className="mr-section-title">Visit Info</h3>
          <div className="mr-info-grid">
            <div className="mr-info-col">
              <InfoLine label="Doctor's Name" value={formatDoctorName(model.visit.doctorName)} />
              <InfoLine label="Specialization" value={model.visit.specialization} />
            </div>
            <div className="mr-info-col">
              <InfoLine label="Visit Date" value={model.visit.visitDate} />
            </div>
          </div>
        </section>

        <section className="mr-block">
          <h3 className="mr-section-title">Patient Info</h3>
          <div className="mr-info-grid">
            <div className="mr-info-col">
              <InfoLine label="Full Name" value={model.patient.fullName} />
              <InfoLine label="Birth Date" value={model.patient.birthDate} />
              <InfoLine label="Gender" value={model.patient.gender} />
            </div>
            <div className="mr-info-col">
              <InfoLine label="Phone" value={model.patient.phone} />
              <InfoLine label="Address" value={model.patient.address} />
            </div>
          </div>
        </section>

        <OverallSummarySection text={model.overallSummary || model.narratives?.overallSummary} />

        <section className="mr-block mr-assessment">
          <h3 className="mr-section-title">Assessment</h3>
          <div className="mr-body">
            <AssessmentBlocksContent
              blocks={model.narratives.assessmentBlocks}
              intro={model.narratives.assessment}
            />
          </div>
        </section>

        <NarrativeSection title="Diagnosis">
          <p>{model.narratives.diagnosis}</p>
        </NarrativeSection>

        <NarrativeSection title="Prescription">
          <p>{model.narratives.prescription}</p>
        </NarrativeSection>

        {(model.narratives.extras || []).map((extra) => (
          <NarrativeSection key={extra.title} title={extra.title}>
            {extra.bodyHtml ? (
              <div dangerouslySetInnerHTML={{ __html: extra.bodyHtml }} />
            ) : (
              <p style={{ whiteSpace: 'pre-wrap' }}>{extra.body}</p>
            )}
          </NarrativeSection>
        ))}

        <div className="mr-signature">
          <div className="mr-signature__cell">
            Attending Nurse:
            {' '}
            {model.signature.nurseName}
          </div>
          <div className="mr-signature__cell">
            Date:
            {' '}
            {model.signature.date}
          </div>
        </div>

        <footer className="mr-footer">
          {footerLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>
            Confidential medical document —
            {' '}
            {model.agencyName}
          </p>
        </footer>
      </article>
    </>
  );
}
