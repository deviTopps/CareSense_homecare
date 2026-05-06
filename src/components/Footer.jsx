import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span className="footer-copy">
          © {new Date().getFullYear()} Data Leap Technologies Inc. All rights reserved.
        </span>
        <Link to="/privacy" className="footer-privacy-link">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
