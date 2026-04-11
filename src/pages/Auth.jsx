import { useState, useEffect } from 'react';
import { FiEye, FiEyeOff, FiArrowRight, FiCheck, FiMail, FiShield, FiActivity, FiUsers, FiClock } from 'react-icons/fi';
import { API_BASE } from '../api';

/* ── tiny keyframes injected once ── */
const styleId = 'auth-kf';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const s = document.createElement('style');
  s.id = styleId;
  s.textContent = `
    @keyframes authFadeUp  { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    @keyframes authFloat   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
    @keyframes authGlow    { 0%,100% { box-shadow:0 0 20px rgba(69,182,254,.12) } 50% { box-shadow:0 0 40px rgba(69,182,254,.22) } }
    @keyframes authGrad    { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
  `;
  document.head.appendChild(s);
}

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });
  const [signupForm, setSignupForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', agencyName: '', location: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => { setReady(true); }, []);

  /* ── Validation ── */
  const validateLogin = () => {
    const e = {};
    if (!loginForm.email.trim()) e.email = 'Email is required';
    if (!loginForm.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateSignup = () => {
    const e = {};
    if (!signupForm.firstName.trim()) e.firstName = 'First name is required';
    if (!signupForm.lastName.trim()) e.lastName = 'Last name is required';
    if (!signupForm.email.trim()) e.email = 'Email is required';
    if (!signupForm.phone.trim()) e.phone = 'Phone number is required';
    if (!signupForm.agencyName.trim()) e.agencyName = 'Agency name is required';
    if (!signupForm.location.trim()) e.location = 'Location is required';
    if (!signupForm.password) e.password = 'Password is required';
    else if (signupForm.password.length < 8) e.password = 'Min. 8 characters';
    if (signupForm.password !== signupForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Invalid email or password');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: signupForm.firstName.trim(),
          lastName: signupForm.lastName.trim(),
          email: signupForm.email.trim(),
          phone: signupForm.phone.trim(),
          agencyName: signupForm.agencyName.trim(),
          location: signupForm.location,
          country: 'Ghana',
          password: signupForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Registration failed');
      switchMode('thankyou');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleForgot = (e) => {
    e.preventDefault();
    if (!forgotForm.email.trim()) { setErrors({ email: 'Email is required' }); return; }
    setErrors({}); setForgotSent(true);
  };
  const switchMode = (m) => { setMode(m); setErrors({}); setApiError(''); setForgotSent(false); setShowPassword(false); setShowConfirmPassword(false); };

  /* ── Style helpers ── */
  const input = (err) => ({
    width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 500,
    border: 'none', borderBottom: `2px solid ${err ? '#ef4444' : '#e5e7eb'}`,
    borderRadius: 0, background: 'transparent', color: '#111827', outline: 'none',
    transition: 'border-color 0.2s', fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.01em',
  });
  const focus = (e) => { e.target.style.borderBottomColor = '#111827'; };
  const blur  = (e, err) => { e.target.style.borderBottomColor = err ? '#ef4444' : '#e5e7eb'; };
  const label   = { display: 'block', fontSize: 11.5, fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' };
  const errText = { fontSize: 12, color: '#ef4444', marginTop: 5, fontWeight: 500 };
  const btn = {
    width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 2,
    background: '#111827', color: '#fff', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.2s', letterSpacing: '-0.01em',
  };
  const btnHover = (e) => { e.currentTarget.style.background = '#45B6FE'; };
  const btnLeave = (e) => { e.currentTarget.style.background = '#111827'; };
  const link = { background: 'none', border: 'none', fontSize: 13.5, fontWeight: 700, color: '#111827', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: '3px' };
  const eyeBtn = {
    position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4,
  };

  const features = [
    { icon: <FiShield size={20} />,   title: 'HIPAA Compliant',     desc: 'Enterprise-grade security for patient data' },
    { icon: <FiActivity size={20} />, title: 'Real-time Monitoring', desc: 'Track nurse visits and patient vitals live' },
    { icon: <FiUsers size={20} />,    title: 'Team Management',     desc: 'Scheduling, attendance & workforce tools' },
    { icon: <FiClock size={20} />,    title: 'Smart Scheduling',    desc: 'AI-powered rotation & shift planning' },
  ];

  /* ── Transition helper ── */
  const enter = (delay = 0) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(18px)',
    transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#f8fafc', overflow: 'hidden',
    }}>

      {/* ═══════════════════ LEFT — Brand Panel ═══════════════════ */}
      <div className="d-none d-lg-flex" style={{
        width: '46%', minHeight: '100vh',
        background: '#111827',
        flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Headline */}
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px', ...enter(0) }}>
            Homecare<br />management,<br />
            <span style={{ color: '#45B6FE' }}>simplified.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 52px', maxWidth: 360, ...enter(0.1) }}>
            The all-in-one platform for managing nurses, patients, scheduling and clinical documentation.
          </p>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: '18px 16px', borderRadius: 2,
                background: 'rgba(255,255,255,0.04)',
                ...enter(0.2 + i * 0.08),
              }}>
                <div style={{ color: '#45B6FE', marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 52, fontSize: 12.5, color: 'rgba(255,255,255,0.35)', ...enter(0.6) }}>
            Trusted by <span style={{ color: '#fff', fontWeight: 700 }}>10+</span> homecare agencies across Ghana
          </div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT — Form Panel ═══════════════════ */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', background: '#fff',
      }}>
        <div style={{
          width: '100%', maxWidth: mode === 'signup' ? 520 : 440,
          position: 'relative', zIndex: 1, animation: 'authFadeUp 0.5s ease forwards',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 20 }}>
            <img src="/Blue_Logo.png" alt="CareSense" style={{ width: 180, height: 75, objectFit: 'contain', display: 'block' }} />
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset password'}
              {mode === 'thankyou' && 'Account created!'}
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: 0, fontWeight: 500 }}>
              {mode === 'login' && 'Sign in to your dashboard'}
              {mode === 'signup' && 'Get started with CareSense in minutes'}
              {mode === 'forgot' && (forgotSent ? 'Check your inbox for reset instructions' : "We'll send you a reset link")}
              {mode === 'thankyou' && 'Your account has been set up successfully'}
            </p>
          </div>

          {/* ═══ LOGIN FORM ═══ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              {apiError && (
                <div style={{ padding: '10px 14px', marginBottom: 20, borderRadius: 2, background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700 }}>
                  {apiError}
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <label style={label}>Email address</label>
                <input type="email" placeholder="you@company.com"
                  value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  style={input(errors.email)} onFocus={focus} onBlur={e => blur(e, errors.email)} />
                {errors.email && <div style={errText}>{errors.email}</div>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...label, marginBottom: 0 }}>Password</label>
                  <button type="button" onClick={() => switchMode('forgot')} style={{ ...link, fontSize: 12.5 }}>Forgot password?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    style={{ ...input(errors.password), paddingRight: 46 }}
                    onFocus={focus} onBlur={e => blur(e, errors.password)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.password && <div style={errText}>{errors.password}</div>}
              </div>

              {/* Remember */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <div onClick={() => setLoginForm(f => ({ ...f, remember: !f.remember }))} style={{
                  width: 18, height: 18, borderRadius: 2, cursor: 'pointer', flexShrink: 0,
                  border: loginForm.remember ? 'none' : '2px solid #d1d5db',
                  background: loginForm.remember ? '#111827' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {loginForm.remember && <FiCheck size={13} style={{ color: '#fff', strokeWidth: 3 }} />}
                </div>
                <span style={{ fontSize: 13.5, color: '#6b7280', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setLoginForm(f => ({ ...f, remember: !f.remember }))}>Remember me for 30 days</span>
              </div>

              <button type="submit" disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} onMouseEnter={!loading ? btnHover : undefined} onMouseLeave={!loading ? btnLeave : undefined}>
                {loading ? 'Signing in…' : <>Sign in <FiArrowRight size={16} /></>}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              </div>

              {/* Google */}
              <button type="button" style={{
                width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 2,
                background: '#f3f4f6', color: '#111827', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <span style={{ fontSize: 14, color: '#9ca3af' }}>Don't have an account? </span>
                <button type="button" onClick={() => switchMode('signup')} style={link}>Sign up free</button>
              </div>
            </form>
          )}

          {/* ═══ SIGNUP FORM ═══ */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup}>
              {apiError && (
                <div style={{ padding: '10px 14px', marginBottom: 20, borderRadius: 2, background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700 }}>
                  {apiError}
                </div>
              )}
              <div className="row g-3" style={{ marginBottom: 16 }}>
                <div className="col-sm-6">
                  <label style={label}>First Name</label>
                  <input type="text" placeholder="Benjamin"
                    value={signupForm.firstName} onChange={e => setSignupForm(f => ({ ...f, firstName: e.target.value }))}
                    style={input(errors.firstName)} onFocus={focus} onBlur={e => blur(e, errors.firstName)} />
                  {errors.firstName && <div style={errText}>{errors.firstName}</div>}
                </div>
                <div className="col-sm-6">
                  <label style={label}>Last Name</label>
                  <input type="text" placeholder="Andoh"
                    value={signupForm.lastName} onChange={e => setSignupForm(f => ({ ...f, lastName: e.target.value }))}
                    style={input(errors.lastName)} onFocus={focus} onBlur={e => blur(e, errors.lastName)} />
                  {errors.lastName && <div style={errText}>{errors.lastName}</div>}
                </div>
              </div>

              <div className="row g-3" style={{ marginBottom: 16 }}>
                <div className="col-sm-6">
                  <label style={label}>Email</label>
                  <input type="email" placeholder="you@company.com"
                    value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                    style={input(errors.email)} onFocus={focus} onBlur={e => blur(e, errors.email)} />
                  {errors.email && <div style={errText}>{errors.email}</div>}
                </div>
                <div className="col-sm-6">
                  <label style={label}>Phone</label>
                  <input type="tel" placeholder="+233 XX XXX XXXX"
                    value={signupForm.phone} onChange={e => setSignupForm(f => ({ ...f, phone: e.target.value }))}
                    style={input(errors.phone)} onFocus={focus} onBlur={e => blur(e, errors.phone)} />
                  {errors.phone && <div style={errText}>{errors.phone}</div>}
                </div>
              </div>

              <div className="row g-3" style={{ marginBottom: 16 }}>
                <div className="col-sm-7">
                  <label style={label}>Agency Name</label>
                  <input type="text" placeholder="Golden Years Care"
                    value={signupForm.agencyName} onChange={e => setSignupForm(f => ({ ...f, agencyName: e.target.value }))}
                    style={input(errors.agencyName)} onFocus={focus} onBlur={e => blur(e, errors.agencyName)} />
                  {errors.agencyName && <div style={errText}>{errors.agencyName}</div>}
                </div>
                <div className="col-sm-5">
                  <label style={label}>Location</label>
                  <select value={signupForm.location} onChange={e => setSignupForm(f => ({ ...f, location: e.target.value }))}
                    style={{ ...input(errors.location), cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                    onFocus={focus} onBlur={e => blur(e, errors.location)}>
                    <option value="">Select location</option>
                    <optgroup label="Greater Accra">
                      <option value="Accra">Accra</option>
                      <option value="Tema">Tema</option>
                      <option value="Madina">Madina</option>
                      <option value="Teshie">Teshie</option>
                      <option value="Nungua">Nungua</option>
                      <option value="Osu">Osu</option>
                      <option value="Cantonments">Cantonments</option>
                      <option value="East Legon">East Legon</option>
                      <option value="Dansoman">Dansoman</option>
                      <option value="Lapaz">Lapaz</option>
                      <option value="Achimota">Achimota</option>
                      <option value="Spintex">Spintex</option>
                      <option value="Airport Residential">Airport Residential</option>
                      <option value="Kasoa">Kasoa</option>
                      <option value="Ashaiman">Ashaiman</option>
                      <option value="Sakumono">Sakumono</option>
                      <option value="Adenta">Adenta</option>
                      <option value="Dome">Dome</option>
                      <option value="Dzorwulu">Dzorwulu</option>
                      <option value="Weija">Weija</option>
                    </optgroup>
                    <optgroup label="Kumasi & Ashanti">
                      <option value="Kumasi">Kumasi</option>
                      <option value="Adum">Adum</option>
                      <option value="Bantama">Bantama</option>
                      <option value="Asokwa">Asokwa</option>
                      <option value="Suame">Suame</option>
                      <option value="Tafo">Tafo</option>
                      <option value="Nhyiaeso">Nhyiaeso</option>
                      <option value="Atonsu">Atonsu</option>
                      <option value="Kwadaso">Kwadaso</option>
                      <option value="Obuasi">Obuasi</option>
                      <option value="Ejisu">Ejisu</option>
                      <option value="Bekwai">Bekwai</option>
                      <option value="Mampong">Mampong</option>
                      <option value="Konongo">Konongo</option>
                    </optgroup>
                    <optgroup label="Takoradi & Western">
                      <option value="Takoradi">Takoradi</option>
                      <option value="Sekondi">Sekondi</option>
                      <option value="Effia">Effia</option>
                      <option value="Anaji">Anaji</option>
                      <option value="Kojokrom">Kojokrom</option>
                      <option value="Essikado">Essikado</option>
                      <option value="Kwesimintsim">Kwesimintsim</option>
                      <option value="Fijai">Fijai</option>
                      <option value="Axim">Axim</option>
                      <option value="Tarkwa">Tarkwa</option>
                      <option value="Prestea">Prestea</option>
                    </optgroup>
                    <optgroup label="Other Major Cities">
                      <option value="Tamale">Tamale</option>
                      <option value="Cape Coast">Cape Coast</option>
                      <option value="Sunyani">Sunyani</option>
                      <option value="Ho">Ho</option>
                      <option value="Koforidua">Koforidua</option>
                      <option value="Bolgatanga">Bolgatanga</option>
                      <option value="Wa">Wa</option>
                      <option value="Techiman">Techiman</option>
                      <option value="Winneba">Winneba</option>
                      <option value="Goaso">Goaso</option>
                      <option value="Damongo">Damongo</option>
                      <option value="Nalerigu">Nalerigu</option>
                      <option value="Sefwi Wiawso">Sefwi Wiawso</option>
                      <option value="Dambai">Dambai</option>
                    </optgroup>
                  </select>
                  {errors.location && <div style={errText}>{errors.location}</div>}
                </div>
              </div>

              <div className="row g-3" style={{ marginBottom: 24 }}>
                <div className="col-sm-6">
                  <label style={label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                      value={signupForm.password} onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                      style={{ ...input(errors.password), paddingRight: 46 }}
                      onFocus={focus} onBlur={e => blur(e, errors.password)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                      {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {errors.password && <div style={errText}>{errors.password}</div>}
                </div>
                <div className="col-sm-6">
                  <label style={label}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password"
                      value={signupForm.confirmPassword} onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      style={{ ...input(errors.confirmPassword), paddingRight: 46 }}
                      onFocus={focus} onBlur={e => blur(e, errors.confirmPassword)} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeBtn}>
                      {showConfirmPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div style={errText}>{errors.confirmPassword}</div>}
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: '#9ca3af', margin: '0 0 20px', lineHeight: 1.6 }}>
                By creating an account, you agree to our{' '}
                <span style={{ color: '#45B6FE', cursor: 'pointer', fontWeight: 550 }}>Terms of Service</span>{' '}and{' '}
                <span style={{ color: '#45B6FE', cursor: 'pointer', fontWeight: 550 }}>Privacy Policy</span>.
              </p>

              <button type="submit" disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} onMouseEnter={!loading ? btnHover : undefined} onMouseLeave={!loading ? btnLeave : undefined}>
                {loading ? 'Creating account…' : <>Create account <FiArrowRight size={16} /></>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <span style={{ fontSize: 14, color: '#9ca3af' }}>Already have an account? </span>
                <button type="button" onClick={() => switchMode('login')} style={link}>Sign in</button>
              </div>
            </form>
          )}

          {/* ═══ THANK YOU ═══ */}
          {mode === 'thankyou' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                padding: '40px 24px', borderRadius: 2, background: '#f8f9fa',
                marginBottom: 28,
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: '#111827',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <FiCheck size={28} style={{ color: '#fff', strokeWidth: 3 }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Thank you for registering!</div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
                  Your CareSense account has been created successfully. You can now sign in to access your dashboard and start managing your homecare operations.
                </div>
              </div>
              <button onClick={() => switchMode('login')} style={btn} onMouseEnter={btnHover} onMouseLeave={btnLeave}>
                Go to Login <FiArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ═══ FORGOT PASSWORD ═══ */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot}>
              {forgotSent ? (
                <div style={{
                  padding: '36px 24px', borderRadius: 2, background: '#f8f9fa',
                  textAlign: 'center', marginBottom: 24,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: '#111827',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                  }}>
                    <FiMail size={22} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Check your email</div>
                  <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                    We've sent a password reset link to<br /><strong style={{ color: '#374151' }}>{forgotForm.email}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 24 }}>
                  <label style={label}>Email address</label>
                  <input type="email" placeholder="you@company.com"
                    value={forgotForm.email} onChange={e => setForgotForm({ email: e.target.value })}
                    style={input(errors.email)} onFocus={focus} onBlur={e => blur(e, errors.email)} />
                  {errors.email && <div style={errText}>{errors.email}</div>}
                </div>
              )}

              {!forgotSent && (
                <button type="submit" style={{ ...btn, marginBottom: 20 }} onMouseEnter={btnHover} onMouseLeave={btnLeave}>
                  Send reset link <FiArrowRight size={16} />
                </button>
              )}

              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => switchMode('login')} style={link}>← Back to sign in</button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#d1d5db', marginTop: 48 }}>
            © 2026 Data Leap Technologies Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
