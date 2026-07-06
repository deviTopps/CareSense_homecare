import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { isTokenValid, clearAuth, getUser } from './api';
import HipaaRouteGuard from './components/HipaaRouteGuard';
import HipaaSessionWarning from './components/HipaaSessionWarning';
import { HIPAA_SESSION } from './hipaa/config';
import { logSessionEvent } from './hipaa/auditLog';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import useTheme from './hooks/useTheme';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Scheduling from './pages/Scheduling';
import ClinicalDocs from './pages/ClinicalDocs';
import Workforce from './pages/Workforce';
import Attendance from './pages/Attendance';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import NurseProfile from './pages/NurseProfile';
import Enquiries from './pages/Enquiries';
import NurseScheduling from './pages/NurseScheduling';
import Account from './pages/Account';
import Billing from './pages/Billing';
import Finance from './pages/Finance';
import InvoicesPayments from './pages/InvoicesPayments';
import Reports from './pages/Reports';
import WalletSuccess from './pages/WalletSuccess';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import Privacy from './pages/Privacy';
import BookDemo from './pages/BookDemo';
import { TargetedGuideProvider } from './context/TargetedGuideContext';
import TargetedGuide from './components/TargetedGuide';

/* ── Protected Route wrapper ── */
function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();
  const user = getUser();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <HipaaRouteGuard user={user} pathname={location.pathname}>
      {children}
    </HipaaRouteGuard>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('kh-sidebar-collapsed') === 'true';
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') return 248;
    const raw = window.localStorage.getItem('kh-sidebar-width-px');
    const n = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(n)) return 248;
    return Math.min(320, Math.max(200, n));
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionWarningKey, setSessionWarningKey] = useState(0);

  // Periodically check token validity
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isTokenValid()) {
        clearAuth();
        setIsAuthenticated(false);
      }
    }, HIPAA_SESSION.TOKEN_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('kh-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('kh-sidebar-width-px', String(sidebarWidth));
  }, [sidebarWidth]);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    clearAuth();
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleStaySignedIn = useCallback(() => {
    setSessionWarningKey((k) => k + 1);
    logSessionEvent('session_extended', { reason: 'user_activity' });
  }, []);

  const user = getUser();
  const { theme, toggleTheme, isDark } = useTheme();

  const AuthLayout = ({ children }) => (
    <TargetedGuideProvider>
    <div
      className={`app-layout kh-bs-theme${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}
      style={sidebarCollapsed ? undefined : { '--kh-sidebar-width': `${sidebarWidth}px` }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        sidebarWidth={sidebarWidth}
        onSidebarResize={setSidebarWidth}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        onLogout={handleLogout}
        user={user}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      <div className={`main-content bg-base-200 text-base-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Topbar
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onLogout={handleLogout}
          user={user}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <Footer />
      </div>
      <TargetedGuide />
    </div>
    </TargetedGuideProvider>
  );

  return (
    <>
      <HipaaSessionWarning
        key={sessionWarningKey}
        active={isAuthenticated}
        onStaySignedIn={handleStaySignedIn}
        onLogout={handleLogout}
      />
    <Routes>
      {/* Public route */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <Auth onLogin={handleLogin} />
          </motion.div>
        )
      } />

      <Route path="/" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}><LandingPage /></motion.div>} />

      <Route path="/privacy" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}><Privacy /></motion.div>} />

      <Route path="/book-demo" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}><BookDemo /></motion.div>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Dashboard /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/scheduling" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Scheduling /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/nurse-scheduling" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><NurseScheduling /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/clinical" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><ClinicalDocs /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/workforce" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Workforce /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/workforce/:nurseId" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><NurseProfile /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/attendance" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Attendance /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/patients" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Patients /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/patients/:patientId" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><PatientProfile /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/enquiries" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Enquiries /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Account /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Reports /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/wallet/success" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <WalletSuccess />
        </ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Billing /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/finance" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Finance /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/invoices-payments" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><InvoicesPayments /></AuthLayout>
        </ProtectedRoute>
      } />

      {/* 404 catch-all — redirect to dashboard if logged in, else login */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
    </>
  );
}

export default App;
