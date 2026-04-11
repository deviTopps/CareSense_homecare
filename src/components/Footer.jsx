export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span style={{ fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
          © {new Date().getFullYear()} Data Leap Technologies Inc. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
