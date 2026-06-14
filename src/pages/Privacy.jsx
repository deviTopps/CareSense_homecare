import { Link } from 'react-router-dom';
import { LANDING_PHONE, LANDING_PHONE_HREF } from '../data/landingContent';
import './Privacy.css';

const EFFECTIVE_DATE = '29 May 2026';
const SUPPORT_EMAIL = 'service.caresense@gmail.com';
const APP_NAME = 'CareSense Homecare';

export default function Privacy() {
  return (
    <div className="legal-page">
      <header className="legal-page-header">
        <div className="legal-page-header-inner">
          <Link className="legal-back" to="/">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="legal-page-main">
        <p className="legal-meta">Last updated: {EFFECTIVE_DATE}</p>
        <h1>Privacy Policy</h1>
        <p className="legal-intro">
          This Privacy Policy describes how {APP_NAME} (&quot;CareSense&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
          collects, uses, stores, and protects personal information when you use our website, web application,
          and mobile applications (together, the &quot;Services&quot;).
        </p>
        <p>
          By using the Services, you agree to the collection and use of information in accordance with this policy.
          If you do not agree, please do not use the Services.
        </p>

        <section className="legal-section" aria-labelledby="privacy-controller">
          <h2 id="privacy-controller">1. Who we are</h2>
          <p>
            {APP_NAME} provides homecare management software for care agencies, nurses, and care coordinators.
            We are the data controller responsible for personal information processed through the Services,
            except where we process data on behalf of a care organisation using our platform (in which case
            that organisation is the controller for patient and client records).
          </p>
          <p>
            <strong>Contact:</strong>{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            {' · '}
            <a href={LANDING_PHONE_HREF}>{LANDING_PHONE}</a>
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-scope">
          <h2 id="privacy-scope">2. Scope</h2>
          <p>This policy applies to:</p>
          <ul>
            <li>Visitors to our website and marketing pages</li>
            <li>Registered users of the CareSense web dashboard (agency staff, administrators, nurses)</li>
            <li>Users of the CareSense mobile app available on Google Play and other app stores</li>
          </ul>
          <p>
            Care organisations that use CareSense to manage patients may have their own privacy notices for
            patient and client data. This policy explains how CareSense handles information within the platform.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-collect">
          <h2 id="privacy-collect">3. Information we collect</h2>
          <p>Depending on how you use the Services, we may collect the following categories of information:</p>

          <h3>Account and profile information</h3>
          <ul>
            <li>Name, email address, phone number, job title, and organisation details</li>
            <li>Login credentials and authentication tokens</li>
            <li>Profile photo and professional documents (e.g. nursing licence, ID) where uploaded</li>
          </ul>

          <h3>Patient and care-related information</h3>
          <ul>
            <li>Patient demographics, contact details, and emergency contacts</li>
            <li>Clinical assessments, care plans, medications, vitals, and visit records</li>
            <li>Nurse notes, incidents, and scheduling information</li>
            <li>Documents and images uploaded in connection with care delivery</li>
          </ul>
          <p>
            This information may include special category data (such as health data). It is processed only
            to provide care management functionality and as instructed by the relevant care organisation.
          </p>

          <h3>Usage and device information</h3>
          <ul>
            <li>IP address, browser type, device identifiers, and operating system</li>
            <li>App version, crash logs, and performance diagnostics</li>
            <li>Pages viewed, features used, and actions taken within the Services</li>
            <li>Date, time, and duration of access</li>
          </ul>

          <h3>Location information</h3>
          <p>
            If you enable location permissions in the mobile app, we may collect approximate or precise
            location data to support visit verification, routing, or safety features. You can control
            location access through your device settings.
          </p>

          <h3>Payment and billing information</h3>
          <p>
            Subscription and billing details may be processed by our payment partners. We do not store full
            payment card numbers on our servers.
          </p>

          <h3>Communications</h3>
          <p>
            Messages you send to support, feedback you provide, and records of correspondence with us.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-use">
          <h2 id="privacy-use">4. How we use your information</h2>
          <p>We use personal information to:</p>
          <ul>
            <li>Provide, operate, maintain, and improve the Services</li>
            <li>Create and manage user accounts and authenticate access</li>
            <li>Enable care scheduling, documentation, reporting, and team coordination</li>
            <li>Process subscriptions and send service-related communications</li>
            <li>Respond to support requests and troubleshoot issues</li>
            <li>Monitor security, prevent fraud, and enforce our terms</li>
            <li>Comply with legal obligations and respond to lawful requests</li>
            <li>Analyse aggregated usage to improve product design (where permitted)</li>
          </ul>
          <p>
            We do not sell your personal information. We do not use patient health data for advertising.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-legal-basis">
          <h2 id="privacy-legal-basis">5. Legal basis for processing</h2>
          <p>We process personal information on the following bases, as applicable:</p>
          <ul>
            <li><strong>Contract:</strong> to deliver the Services you or your organisation have signed up for</li>
            <li><strong>Legitimate interests:</strong> to secure, improve, and administer the platform</li>
            <li><strong>Legal obligation:</strong> where required by applicable law</li>
            <li><strong>Consent:</strong> for optional features such as marketing emails or non-essential cookies</li>
            <li><strong>Vital interests / healthcare provision:</strong> where processing health data is necessary for care delivery, as authorised by the care organisation and applicable law</li>
          </ul>
          <p>
            Where we act as a processor on behalf of a care organisation, that organisation determines the
            legal basis for processing patient data.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-share">
          <h2 id="privacy-share">6. How we share information</h2>
          <p>We may share personal information with:</p>
          <ul>
            <li><strong>Your care organisation:</strong> administrators and authorised staff within your agency</li>
            <li><strong>Service providers:</strong> cloud hosting, storage, email delivery, analytics, and payment processors under contractual safeguards</li>
            <li><strong>Professional advisers:</strong> lawyers, auditors, or insurers where necessary</li>
            <li><strong>Authorities:</strong> when required by law, court order, or to protect rights and safety</li>
            <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets, subject to continued protection</li>
          </ul>
          <p>All third parties are required to handle data securely and only for specified purposes.</p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">7. Data retention</h2>
          <p>
            We retain personal information for as long as your account is active, as needed to provide the
            Services, and as required to meet legal, regulatory, or contractual obligations. Patient and
            care records may be retained according to the policies of the care organisation and applicable
            healthcare record-keeping requirements.
          </p>
          <p>
            When data is no longer needed, we delete or anonymise it using reasonable technical and
            organisational measures.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-security">
          <h2 id="privacy-security">8. Security</h2>
          <p>
            We implement appropriate technical and organisational measures to protect personal information,
            including encryption in transit, access controls, authentication, and staff training. No method
            of transmission or storage is completely secure; we cannot guarantee absolute security.
          </p>
          <p>
            If you believe your account has been compromised, contact us immediately at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-rights">
          <h2 id="privacy-rights">9. Your rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate or incomplete data</li>
            <li>Request deletion of your data, subject to legal exceptions</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent where processing is consent-based</li>
            <li>Request a portable copy of your data</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>
          <p>
            Users in Ghana may also have rights under the Data Protection Act, 2012 (Act 843). Patient data
            requests may need to be directed to the care organisation that controls that record.
          </p>
          <p>
            To exercise your rights, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            We may need to verify your identity before responding.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-children">
          <h2 id="privacy-children">10. Children&apos;s privacy</h2>
          <p>
            The Services are intended for use by care professionals and authorised organisation staff, not
            for direct use by children under 13 (or the minimum age required in your jurisdiction). We do
            not knowingly collect personal information from children. If you believe a child has provided
            us personal information, please contact us so we can take appropriate action.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-cookies">
          <h2 id="privacy-cookies">11. Cookies and local storage</h2>
          <p>
            We use cookies and similar technologies (including browser local storage) to operate the Services,
            remember preferences, and keep you signed in.
          </p>

          <h3>Essential storage</h3>
          <p>These are required for the Services to function and do not require consent:</p>
          <div className="legal-cookie-table-wrap">
            <table className="legal-cookie-table">
              <thead>
                <tr>
                  <th scope="col">Name / key</th>
                  <th scope="col">Purpose</th>
                  <th scope="col">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">token</th>
                  <td>Authentication session for signed-in users</td>
                  <td>Until logout or expiry</td>
                </tr>
                <tr>
                  <th scope="row">user</th>
                  <td>Stores basic profile data for the signed-in session</td>
                  <td>Until logout</td>
                </tr>
                <tr>
                  <th scope="row">auth.rememberEmail</th>
                  <td>Remembers your email if you choose &quot;Remember me&quot; on login</td>
                  <td>Persistent until cleared</td>
                </tr>
                <tr>
                  <th scope="row">kh-sidebar-*</th>
                  <td>Remembers dashboard sidebar layout preferences</td>
                  <td>Persistent until cleared</td>
                </tr>
                <tr>
                  <th scope="row">kulobalCookieConsent</th>
                  <td>Stores your cookie preference choices on the marketing website</td>
                  <td>Persistent until cleared</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Functional / performance storage</h3>
          <p>
            We may store limited data locally to improve performance (for example, cached profile images
            or draft forms). This data stays on your device and supports faster loading.
          </p>

          <h3>Analytics and marketing cookies</h3>
          <p>
            Where used, non-essential analytics or marketing cookies are only placed with your consent.
            You can update preferences via the cookie banner on our website or your browser settings.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-mobile">
          <h2 id="privacy-mobile">12. Mobile app (Google Play &amp; App Store)</h2>
          <p>
            The CareSense mobile app may request device permissions (such as camera, storage, notifications,
            or location) to support features you choose to use—for example, uploading documents, receiving
            visit reminders, or confirming attendance. You can manage permissions in your device settings.
          </p>
          <p>
            App store providers (including Google) may collect limited technical data about downloads and
            updates according to their own privacy policies. We encourage you to review those policies separately.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-international">
          <h2 id="privacy-international">13. International transfers</h2>
          <p>
            Your information may be processed in countries other than where you live. Where we transfer
            data internationally, we use appropriate safeguards such as standard contractual clauses or
            equivalent protections required by applicable law.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-changes">
          <h2 id="privacy-changes">14. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top
            indicates when changes take effect. Material changes will be communicated through the Services
            or by email where appropriate. Continued use after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="legal-section" aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">15. Contact us</h2>
          <p>
            For privacy questions, data subject requests, or concerns about this policy, contact:
          </p>
          <div className="legal-contact-card">
            <p><strong>{APP_NAME}</strong></p>
            <p>
              Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
            <p>
              Phone: <a href={LANDING_PHONE_HREF}>{LANDING_PHONE}</a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
