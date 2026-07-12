import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
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
import { TargetedGuideProvider } from './context/TargetedGuideContext';
import TargetedGuide from './components/TargetedGuide';
import { TablePageLoaderPanel } from './components/TablePageLoader';
import { useLoadProgress } from './hooks/useLoadProgress';

function PageFallback() {
  const { progress } = useLoadProgress(true);
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
      role="status"
      aria-live="polite"
    >
      <TablePageLoaderPanel
        progress={progress}
        ariaLabel="Loading page"
      />
    </div>
  );
}

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Auth = lazy(() => import('./pages/Auth'));
const Privacy = lazy(() => import('./pages/Privacy'));
const BookDemo = lazy(() => import('./pages/BookDemo'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Scheduling = lazy(() => import('./pages/Scheduling'));
const ClinicalDocs = lazy(() => import('./pages/ClinicalDocs'));
const Workforce = lazy(() => import('./pages/Workforce'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Patients = lazy(() => import('./pages/Patients'));
const PatientProfile = lazy(() => import('./pages/PatientProfile'));
const NurseProfile = lazy(() => import('./pages/NurseProfile'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const NurseScheduling = lazy(() => import('./pages/NurseScheduling'));
const Account = lazy(() => import('./pages/Account'));
const Billing = lazy(() => import('./pages/Billing'));
const Finance = lazy(() => import('./pages/Finance'));
const InvoicesPayments = lazy(() => import('./pages/InvoicesPayments'));
const Reports = lazy(() => import('./pages/Reports'));
const WalletSuccess = lazy(() => import('./pages/WalletSuccess'));

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
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onLogout={handleLogout}
          user={user}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <div className={`main-content bg-base-200 text-base-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <Topbar
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
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
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                  <Auth onLogin={handleLogin} />
                </motion.div>
              )
            }
          />

          <Route
            path="/"
            element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <LandingPage />
              </motion.div>
            }
          />

          <Route
            path="/privacy"
            element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <Privacy />
              </motion.div>
            }
          />

          <Route
            path="/book-demo"
            element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <BookDemo />
              </motion.div>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Dashboard />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduling"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Scheduling />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nurse-scheduling"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <NurseScheduling />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinical"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <ClinicalDocs />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Workforce />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workforce/:nurseId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <NurseProfile />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Attendance />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Patients />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:patientId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <PatientProfile />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiries"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Enquiries />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Account />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Reports />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/success"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <WalletSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Billing />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <Finance />
                </AuthLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices-payments"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AuthLayout>
                  <InvoicesPayments />
                </AuthLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
