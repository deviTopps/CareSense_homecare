import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { isTokenValid, clearAuth, getUser } from './api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Scheduling from './pages/Scheduling';
import ClinicalDocs from './pages/ClinicalDocs';
import Workforce from './pages/Workforce';
import Attendance from './pages/Attendance';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import NurseProfile from './pages/NurseProfile';
import Complaint from './pages/Complaint';
import Feedback from './pages/Feedback';
import NurseScheduling from './pages/NurseScheduling';
import Account from './pages/Account';
import Billing from './pages/Billing';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';

/* ── Protected Route wrapper ── */
function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());
  const navigate = useNavigate();
  const location = useLocation();

  // Periodically check token validity (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isTokenValid()) {
        clearAuth();
        setIsAuthenticated(false);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    clearAuth();
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const user = getUser();

  // Layout wrapper for authenticated pages
  const AuthLayout = ({ children }) => (
    <div className="app-layout kh-bs-theme">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} user={user} />
      <div className="main-content bg-base-200 text-base-content">
        <Topbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} onLogout={handleLogout} />
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
    </div>
  );

  return (
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
      <Route path="/complaints" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Complaint /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/feedback" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Feedback /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Account /></AuthLayout>
        </ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <AuthLayout><Billing /></AuthLayout>
        </ProtectedRoute>
      } />

      {/* 404 catch-all — redirect to dashboard if logged in, else login */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export default App;
