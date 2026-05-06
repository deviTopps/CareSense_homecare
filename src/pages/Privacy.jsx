import { Link } from 'react-router-dom';
import './Privacy.css';

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
        <h1>Privacy</h1>

        <h2 className="legal-lead-title">Privacy &amp; Cookies</h2>
        <p>
          We are committed to handling personal data and cookies transparently and in line with applicable data protection standards.
        </p>

        <h2>Cookies</h2>
        <p>
          Cookies are small text files that are placed on your computer by websites that you visit.
        </p>
        <p>
          They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
          The tables below explain the cookies we use and why.
        </p>

        <h2>Essential cookies</h2>
        <p>
          These cookies are required for our website to work properly. They do not require users&apos; consent for use.
        </p>

        <div className="legal-cookie-table-wrap">
          <table className="legal-cookie-table">
            <thead>
              <tr>
                <th scope="col">Cookie</th>
                <th scope="col">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">CRAFT_CSRF_TOKEN</th>
                <td>This is a security feature to protect against Cross-Site Request Forgery attacks</td>
              </tr>
              <tr>
                <th scope="row">CraftSessionId</th>
                <td>Helps to maintain sessions across web requests</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Data</h2>
        <p>
          We follow national and international Data Protection rules, such as GDPR.
        </p>
      </main>
    </div>
  );
}
