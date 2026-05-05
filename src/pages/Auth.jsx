import { useState } from 'react';
import { FiEye, FiEyeOff, FiArrowRight, FiCheck, FiMail } from '../icons/hugeicons-feather';
import { API_BASE } from '../api';

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

function LoginHeroArt() {
  return (
    <svg className="auth-login-hero__svg" viewBox="0 0 560 640" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="authHeroG1" x1="80" y1="40" x2="480" y2="520" gradientUnits="userSpaceOnUse">
          <stop stopColor="#45B6FE" stopOpacity="0.95" />
          <stop offset="1" stopColor="#1663ff" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="authHeroG2" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="48" y="72" width="464" height="200" rx="20" fill="url(#authHeroG1)" opacity="0.35" />
      <rect x="72" y="96" width="200" height="14" rx="7" fill="#fff" opacity="0.9" />
      <rect x="72" y="124" width="120" height="10" rx="5" fill="#fff" opacity="0.5" />
      <g opacity="0.95">
        <rect x="72" y="164" width="56" height="84" rx="8" fill="#45B6FE" />
        <rect x="140" y="148" width="56" height="100" rx="8" fill="#1663ff" />
        <rect x="208" y="176" width="56" height="72" rx="8" fill="#93c5fd" />
        <rect x="276" y="132" width="56" height="116" rx="8" fill="#2dd4bf" />
        <rect x="344" y="156" width="56" height="92" rx="8" fill="#45B6FE" />
      </g>
      <rect x="48" y="300" width="464" height="248" rx="22" fill="#fff" opacity="0.12" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
      <path d="M88 352h384M88 404h300M88 456h260" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <circle cx="120" cy="352" r="10" fill="#34d399" />
      <circle cx="120" cy="404" r="10" fill="#fbbf24" />
      <circle cx="120" cy="456" r="10" fill="#f472b6" />
      <rect x="152" y="342" width="200" height="20" rx="6" fill="#fff" opacity="0.22" />
      <rect x="152" y="394" width="160" height="20" rx="6" fill="#fff" opacity="0.18" />
      <rect x="152" y="446" width="120" height="20" rx="6" fill="#fff" opacity="0.14" />
      <ellipse cx="420" cy="120" rx="120" ry="90" fill="url(#authHeroG2)" />
    </svg>
  );
}

function AuthBrandMark() {
  return (
    <div className="auth-brand-mark">
      <img src="/Blue_Logo.png" alt="CareSense" className="auth-brand-mark__logo" />
    </div>
  );
}

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false });
  const [signupForm, setSignupForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', agencyName: '', location: '', country: 'Ghana' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  /* ── Validation ── */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateLogin = () => {
    const e = {};
    if (!loginForm.email.trim()) e.email = 'Email is required';
    else if (!emailRegex.test(loginForm.email.trim())) e.email = 'Enter a valid email address';
    if (!loginForm.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateSignup = () => {
    const e = {};
    if (!signupForm.firstName.trim()) e.firstName = 'First name is required';
    if (!signupForm.lastName.trim()) e.lastName = 'Last name is required';
    if (!signupForm.email.trim()) e.email = 'Email is required';
    else if (!emailRegex.test(signupForm.email.trim())) e.email = 'Enter a valid email address';
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
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || data.message || 'Invalid email or password');
      if (!data.token) throw new Error('Sign-in succeeded but no token was returned. Please contact support.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user ?? {}));
      onLogin();
    } catch (err) {
      setApiError(err.message || 'Sign in failed');
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
          country: signupForm.country || 'Ghana',
          password: signupForm.password,
        }),
      });
      const data = await parseJsonResponse(res);
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

  /* ── Finorix-inspired styles (Poppins font, pill buttons) ── */
  const fontFamily = "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif";
  const inputBase = {
    width: '100%', height: 48, padding: '0 16px', fontSize: 14, fontWeight: 500,
    border: '1.5px solid #e5e7eb', borderRadius: 3, background: '#f9fafb', color: '#111827',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    fontFamily,
  };
  const inputErr = { ...inputBase, borderColor: '#ef4444', background: '#fef2f2' };
  const focusRing = (e) => { e.target.style.borderColor = '#45B6FE'; e.target.style.boxShadow = '0 0 0 4px rgba(69,182,254,0.15)'; e.target.style.background = '#fff'; };
  const blurRing = (e, err) => {
    e.target.style.borderColor = err ? '#ef4444' : '#e5e7eb';
    e.target.style.boxShadow = 'none';
    e.target.style.background = err ? '#fef2f2' : '#f9fafb';
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#1b3a1c', marginBottom: 8, letterSpacing: '-0.01em', fontFamily };
  const errStyle = { fontSize: 12, color: '#ef4444', marginTop: 5, fontWeight: 600, fontFamily };
  const eyeBtn = {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0,
  };
  const linkStyle = { background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#45B6FE', cursor: 'pointer', padding: 0, fontFamily, transition: 'color 0.2s' };
  const submitBtnStyle = {
    width: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontSize: 15, fontWeight: 700, borderRadius: 3, letterSpacing: '-0.01em', fontFamily,
    border: 'none', background: '#45B6FE', color: '#fff', cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };
  const handleBtnHover = (e) => { e.currentTarget.style.background = '#2E8FD4'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(69,182,254,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; };
  const handleBtnLeave = (e) => { e.currentTarget.style.background = '#45B6FE'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; };

  /* ── Shared location options ── */
  const locationOptions = (
    <>
      <option value="">Select location</option>
      <optgroup label="Greater Accra">
        {['Accra','Tema','Madina','Teshie','Nungua','Osu','Cantonments','East Legon','Dansoman','Lapaz','Achimota','Spintex','Airport Residential','Kasoa','Ashaiman','Sakumono','Adenta','Dome','Dzorwulu','Weija'].map(v => <option key={v} value={v}>{v}</option>)}
      </optgroup>
      <optgroup label="Kumasi & Ashanti">
        {['Kumasi','Adum','Bantama','Asokwa','Suame','Tafo','Nhyiaeso','Atonsu','Kwadaso','Obuasi','Ejisu','Bekwai','Mampong','Konongo'].map(v => <option key={v} value={v}>{v}</option>)}
      </optgroup>
      <optgroup label="Takoradi & Western">
        {['Takoradi','Sekondi','Effia','Anaji','Kojokrom','Essikado','Kwesimintsim','Fijai','Axim','Tarkwa','Prestea'].map(v => <option key={v} value={v}>{v}</option>)}
      </optgroup>
      <optgroup label="Other Major Cities">
        {['Tamale','Cape Coast','Sunyani','Ho','Koforidua','Bolgatanga','Wa','Techiman','Winneba','Goaso','Damongo','Nalerigu','Sefwi Wiawso','Dambai'].map(v => <option key={v} value={v}>{v}</option>)}
      </optgroup>
    </>
  );

  const isSignupMode = mode === 'signup';
  const signupCountries = ['Ghana', 'United States', 'United Kingdom', 'Canada'];

  return (
    <div
      className={mode === 'login' || isSignupMode ? 'auth-login-page' : undefined}
      style={{
        minHeight: mode === 'login' || isSignupMode ? '100dvh' : '100vh',
        display: 'flex',
        alignItems: mode === 'login' || isSignupMode ? 'stretch' : 'center',
        justifyContent: mode === 'login' || isSignupMode ? 'stretch' : 'center',
        background: mode === 'login' || isSignupMode ? '#ffffff' : '#f8f8f8',
        fontFamily,
        padding: mode === 'login' || isSignupMode ? 0 : '40px 20px',
        overflowX: 'hidden',
        overflowY: mode === 'login' || isSignupMode ? 'auto' : 'visible',
      }}>
      <div
        className={mode === 'login' || isSignupMode ? 'auth-login-frame' : undefined}
        style={{
        width: '100%',
        minHeight: mode === 'login' || isSignupMode ? 'min(100dvh, 100%)' : 'auto',
        maxWidth: mode === 'login' || isSignupMode ? '100%' : 540,
        display: mode === 'login' || isSignupMode ? 'flex' : 'block',
        flexWrap: 'wrap',
        alignItems: mode === 'login' || isSignupMode ? 'stretch' : undefined,
        background: mode === 'login' || isSignupMode ? '#ffffff' : 'transparent',
        overflow: 'visible',
      }}>
        {(mode === 'login' || mode === 'signup') && (
          <div className="auth-login-hero" aria-hidden>
            <div className="auth-login-hero__gradient" />
            <LoginHeroArt />
          </div>
        )}

        <div
          className={mode === 'login' || isSignupMode ? 'auth-login-column' : undefined}
          style={{
          flex: mode === 'login' || isSignupMode ? '1 1 50%' : '1 1 auto',
          width: '100%',
          maxWidth: mode === 'login' || isSignupMode ? 'none' : 440,
          margin: 0,
          padding: mode === 'login' || isSignupMode ? '56px clamp(24px, 4vw, 56px) 40px' : 0,
          minHeight: mode === 'login' || isSignupMode ? 'min(100dvh, 100%)' : 'auto',
          display: mode === 'login' || isSignupMode ? 'flex' : 'block',
          alignItems: mode === 'login' || isSignupMode ? 'center' : undefined,
          justifyContent: mode === 'login' || isSignupMode ? 'center' : undefined,
          overflowY: 'visible',
        }}>
        <div style={{ width: '100%', maxWidth: mode === 'login' || isSignupMode ? 460 : '100%' }}>

        <div
          style={{
            textAlign: 'center',
            marginBottom: 36,
          }}
        >
          <AuthBrandMark />
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#1b3a1c',
              margin: '0 0 8px',
              fontFamily,
              letterSpacing: '-0.03em',
            }}
          >
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create your agency account'}
            {mode === 'forgot' && 'Reset password'}
            {mode === 'thankyou' && 'You\'re all set!'}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: '#7b8597',
              margin: 0,
              fontWeight: 500,
              fontFamily,
            }}
          >
            {mode === 'login' && 'Sign in to continue to your dashboard'}
            {mode === 'signup' && 'Complete your details to access your CareSense workspace.'}
            {mode === 'forgot' && (forgotSent ? 'Check your inbox for reset instructions' : 'Enter your email to receive a reset link')}
            {mode === 'thankyou' && 'Your account has been created successfully'}
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 3,
            padding: '36px 36px 32px',
            boxShadow:
              mode === 'login' || mode === 'signup'
                ? 'none'
                : '0 2px 12px rgba(0,0,0,0.04)',
            border: mode === 'login' || mode === 'signup' ? 'none' : '1px solid #e4e5df',
          }}
        >

          {/* ═══ LOGIN ═══ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              {apiError && (
                <div style={{ padding: '12px 16px', marginBottom: 18, borderRadius: 12, background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, fontFamily }}>
                  {apiError}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" placeholder="you@company.com"
                  value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  style={errors.email ? inputErr : inputBase}
                  onFocus={focusRing} onBlur={e => blurRing(e, errors.email)} />
                {errors.email && <div style={errStyle}>{errors.email}</div>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <button type="button" onClick={() => switchMode('forgot')} style={{ ...linkStyle, fontSize: 12 }}>Forgot?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    style={{ ...(errors.password ? inputErr : inputBase), paddingRight: 42 }}
                    onFocus={focusRing} onBlur={e => blurRing(e, errors.password)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.password && <div style={errStyle}>{errors.password}</div>}
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                <div onClick={() => setLoginForm(f => ({ ...f, remember: !f.remember }))} style={{
                  width: 18, height: 18, borderRadius: 5, cursor: 'pointer', flexShrink: 0,
                  border: loginForm.remember ? 'none' : '1.5px solid #d1d5db',
                  background: loginForm.remember ? '#45B6FE' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}>
                  {loginForm.remember && <FiCheck size={12} style={{ color: '#fff', strokeWidth: 3 }} />}
                </div>
                <span style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer', userSelect: 'none', fontWeight: 500, fontFamily }}
                  onClick={() => setLoginForm(f => ({ ...f, remember: !f.remember }))}>Remember me</span>
              </div>

              <button type="submit" disabled={loading}
                onMouseEnter={!loading ? handleBtnHover : undefined} onMouseLeave={!loading ? handleBtnLeave : undefined}
                style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Signing in…' : <>Sign in <FiArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* ═══ SIGNUP ═══ */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="register-form-grid auth-signup-form">
              {apiError && (
                <div style={{ padding: '12px 16px', marginBottom: 18, borderRadius: 12, background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, fontFamily }}>
                  {apiError}
                </div>
              )}

              <div className="register-form-grid__row register-form-grid__row--split">
                <div>
                  <label style={labelStyle}>First name</label>
                  <input type="text" placeholder="Benjamin" value={signupForm.firstName}
                    onChange={e => setSignupForm(f => ({ ...f, firstName: e.target.value }))}
                    style={errors.firstName ? inputErr : inputBase}
                    onFocus={focusRing} onBlur={e => blurRing(e, errors.firstName)} />
                  {errors.firstName && <div style={errStyle}>{errors.firstName}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Last name</label>
                  <input type="text" placeholder="Andoh" value={signupForm.lastName}
                    onChange={e => setSignupForm(f => ({ ...f, lastName: e.target.value }))}
                    style={errors.lastName ? inputErr : inputBase}
                    onFocus={focusRing} onBlur={e => blurRing(e, errors.lastName)} />
                  {errors.lastName && <div style={errStyle}>{errors.lastName}</div>}
                </div>
              </div>

              <div className="register-form-grid__row">
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" placeholder="you@company.com" value={signupForm.email}
                    onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                    style={errors.email ? inputErr : inputBase}
                    onFocus={focusRing} onBlur={e => blurRing(e, errors.email)} />
                  {errors.email && <div style={errStyle}>{errors.email}</div>}
                </div>
              </div>

              <div className="register-form-grid__row register-form-grid__row--split">
                <div>
                  <label style={labelStyle}>Country of residence</label>
                  <select
                    value={signupForm.country}
                    onChange={e => setSignupForm(f => ({ ...f, country: e.target.value }))}
                    style={{ ...inputBase, cursor: 'pointer', color: '#111827' }}
                    onFocus={focusRing}
                    onBlur={e => blurRing(e, false)}>
                    {signupCountries.map(country => <option key={country} value={country}>{country}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <select value={signupForm.location}
                    onChange={e => setSignupForm(f => ({ ...f, location: e.target.value }))}
                    style={{ ...(errors.location ? inputErr : inputBase), cursor: 'pointer', color: signupForm.location ? '#111827' : '#9ca3af' }}
                    onFocus={focusRing} onBlur={e => blurRing(e, errors.location)}>
                    {locationOptions}
                  </select>
                  {errors.location && <div style={errStyle}>{errors.location}</div>}
                </div>
              </div>

              <div className="register-form-grid__row">
                <div>
                  <label style={labelStyle}>Agency name</label>
                  <input type="text" placeholder="Golden Years Care" value={signupForm.agencyName}
                    onChange={e => setSignupForm(f => ({ ...f, agencyName: e.target.value }))}
                    style={errors.agencyName ? inputErr : inputBase}
                    onFocus={focusRing} onBlur={e => blurRing(e, errors.agencyName)} />
                  {errors.agencyName && <div style={errStyle}>{errors.agencyName}</div>}
                </div>
              </div>

              <div className="register-form-grid__row">
                <div>
                  <label style={labelStyle}>Phone number</label>
                  <div className="register-phone-field">
                    <span className="register-phone-field__prefix">🇬🇭</span>
                    <input type="tel" placeholder="+233 XX XXX XXXX" value={signupForm.phone}
                      onChange={e => setSignupForm(f => ({ ...f, phone: e.target.value }))}
                      style={{ ...(errors.phone ? inputErr : inputBase), border: 'none', boxShadow: 'none', paddingLeft: 0, background: 'transparent' }}
                      onFocus={focusRing} onBlur={e => blurRing(e, errors.phone)} />
                  </div>
                  {errors.phone && <div style={errStyle}>{errors.phone}</div>}
                </div>
              </div>

              <div className="register-form-grid__row">
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                      value={signupForm.password} onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                      style={{ ...(errors.password ? inputErr : inputBase), paddingRight: 42 }}
                      onFocus={focusRing} onBlur={e => blurRing(e, errors.password)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {errors.password && <div style={errStyle}>{errors.password}</div>}
                </div>
              </div>

              <div className="register-form-grid__row">
                <div>
                  <label style={labelStyle}>Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password"
                      value={signupForm.confirmPassword} onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      style={{ ...(errors.confirmPassword ? inputErr : inputBase), paddingRight: 42 }}
                      onFocus={focusRing} onBlur={e => blurRing(e, errors.confirmPassword)} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeBtn}>
                      {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <div style={errStyle}>{errors.confirmPassword}</div>}
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 20px', lineHeight: 1.7, fontWeight: 500, fontFamily }}>
                By creating an account, you agree to our{' '}
                <button type="button" style={{ ...linkStyle, fontSize: 12, fontWeight: 700 }}>Terms</button>
                {' '}and{' '}
                <button type="button" style={{ ...linkStyle, fontSize: 12, fontWeight: 700 }}>Privacy Policy</button>.
              </p>

              <button type="submit" disabled={loading}
                onMouseEnter={!loading ? handleBtnHover : undefined} onMouseLeave={!loading ? handleBtnLeave : undefined}
                style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Creating account…' : <>Create account <FiArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* ═══ THANK YOU ═══ */}
          {mode === 'thankyou' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: '#ecfdf5',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
              }}>
                <FiCheck size={28} style={{ color: '#10b981', strokeWidth: 3 }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1b3a1c', marginBottom: 10, fontFamily, letterSpacing: '-0.02em' }}>Account created!</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 28, maxWidth: 320, margin: '0 auto 28px', fontWeight: 500, fontFamily }}>
                You can now sign in to access your dashboard and start managing your homecare operations.
              </div>
              <button onClick={() => switchMode('login')}
                onMouseEnter={handleBtnHover} onMouseLeave={handleBtnLeave}
                style={submitBtnStyle}>
                Go to Sign in <FiArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ═══ FORGOT PASSWORD ═══ */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot}>
              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#F0F7FE',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                  }}>
                    <FiMail size={24} style={{ color: '#45B6FE' }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1b3a1c', marginBottom: 8, fontFamily, letterSpacing: '-0.02em' }}>Check your email</div>
                  <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, fontWeight: 500, fontFamily }}>
                    We've sent a reset link to <strong style={{ color: '#1b3a1c' }}>{forgotForm.email}</strong>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 22 }}>
                    <label style={labelStyle}>Email address</label>
                    <input type="email" placeholder="you@company.com"
                      value={forgotForm.email} onChange={e => setForgotForm({ email: e.target.value })}
                      style={errors.email ? inputErr : inputBase}
                      onFocus={focusRing} onBlur={e => blurRing(e, errors.email)} />
                    {errors.email && <div style={errStyle}>{errors.email}</div>}
                  </div>
                  <button type="submit" onMouseEnter={handleBtnHover} onMouseLeave={handleBtnLeave} style={submitBtnStyle}>
                    Send reset link <FiArrowRight size={16} />
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Bottom link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {(mode === 'login' || mode === 'forgot') && mode !== 'thankyou' && (
            mode === 'forgot' ? (
              <button type="button" onClick={() => switchMode('login')} style={linkStyle}>← Back to sign in</button>
            ) : (
              <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, fontFamily }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} style={linkStyle}>Sign up</button>
              </span>
            )
          )}
          {mode === 'signup' && (
            <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, fontFamily }}>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')} style={linkStyle}>Sign in</button>
            </span>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#d1d5db', marginTop: 36, fontWeight: 500, fontFamily }}>
          © 2026 Data Leap Technologies Inc.
        </p>
      </div>
      </div>
      </div>
    </div>
  );
}
