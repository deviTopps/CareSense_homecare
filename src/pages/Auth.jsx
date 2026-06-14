import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheck,
  FiMail,
  FiLock,
  FiUsers,
  FiCalendar,
  FiFileText,
} from '../icons/hugeicons-feather';
import { API_BASE } from '../api';
import { BRAND_LOGO_SRC } from '../constants/brandAssets';
import './Auth.css';

const HERO_FEATURES = [
  { icon: FiUsers, text: 'Patient records and care plans in one place' },
  { icon: FiCalendar, text: 'Nurse scheduling and attendance tracking' },
  { icon: FiFileText, text: 'Reports, vitals, and clinical alerts' },
];

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginForm, setLoginForm] = useState(() => {
    const rememberedEmail = localStorage.getItem('auth.rememberEmail') || '';
    return {
      email: rememberedEmail,
      password: '',
      remember: Boolean(rememberedEmail),
    };
  });
  const [signupForm, setSignupForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', agencyName: '', location: '', country: 'Ghana' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

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
      if (loginForm.remember) {
        localStorage.setItem('auth.rememberEmail', loginForm.email.trim());
      } else {
        localStorage.removeItem('auth.rememberEmail');
      }
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
    setErrors({});
    setForgotSent(true);
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setApiError('');
    setForgotSent(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const signupCountries = ['Ghana', 'United States', 'United Kingdom', 'Canada'];

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

  const isFormMode = mode === 'login' || mode === 'signup';
  const showTopbar = isFormMode || mode === 'forgot';

  return (
    <div className="auth-split-page">
      {/* ── Left hero panel ── */}
      {isFormMode && (
        <div className="auth-split-hero">
          <div className="auth-split-hero__overlay" aria-hidden />
          <div className="auth-split-hero__content">
            <div className="auth-split-hero__brand">
              <img src={BRAND_LOGO_SRC} alt="CareSense" className="auth-split-hero__logo" />
            </div>
            <div className="auth-split-hero__text">
              <p className="auth-split-hero__kicker">CareSense Homecare</p>
              <h2 className="auth-split-hero__headline">
                Manage care with clarity and confidence.
              </h2>
              <ul className="auth-split-hero__features">
                {HERO_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="auth-split-hero__feature">
                    <span className="auth-split-hero__feature-icon" aria-hidden>
                      <Icon size={14} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <p className="auth-split-hero__footnote">Trusted by homecare agencies across Ghana.</p>
          </div>
        </div>
      )}

      {/* ── Right form panel ── */}
      <div className={`auth-split-form-panel${isFormMode ? '' : ' auth-split-form-panel--centered'}`}>
        <div className="auth-split-form-wrap">
          {showTopbar && (
            <div className="auth-split-topbar">
              {mode === 'forgot' ? (
                <button type="button" className="auth-split-home-link" onClick={() => switchMode('login')}>
                  ← Back to sign in
                </button>
              ) : (
                <Link to="/" className="auth-split-home-link">← Back to website</Link>
              )}
            </div>
          )}

          {isFormMode && (
            <div className="auth-split-mode-tabs" role="tablist" aria-label="Sign in or register">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={`auth-split-mode-tab${mode === 'login' ? ' is-active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={`auth-split-mode-tab${mode === 'signup' ? ' is-active' : ''}`}
                onClick={() => switchMode('signup')}
              >
                Create account
              </button>
            </div>
          )}

          {mode !== 'thankyou' && (
            <div className="auth-split-heading">
              <h1 className="auth-split-heading__title">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create your agency account'}
                {mode === 'forgot' && 'Reset password'}
              </h1>
              <p className="auth-split-heading__sub">
                {mode === 'login' && 'Sign in to access patients, schedules, reports, and your team workspace.'}
                {mode === 'signup' && 'Set up your agency workspace and start managing homecare in minutes.'}
                {mode === 'forgot' && (forgotSent ? 'Check your inbox for reset instructions.' : 'Enter your email and we will send you a reset link.')}
              </p>
            </div>
          )}

          {/* ═══ LOGIN ═══ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-split-form auth-split-form-card">
              {apiError && <div className="auth-split-alert" role="alert">{apiError}</div>}

              <div className="auth-split-field">
                <label className="auth-split-label" htmlFor="auth-login-email">Email address</label>
                <div className="auth-split-input-wrap">
                  <span className="auth-split-input-icon" aria-hidden><FiMail size={16} /></span>
                  <input
                    id="auth-login-email"
                    type="email"
                    className={`auth-split-input${errors.email ? ' has-error' : ''}`}
                    placeholder="you@agency.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <div className="auth-split-field-error">{errors.email}</div>}
              </div>

              <div className="auth-split-field">
                <label className="auth-split-label" htmlFor="auth-login-pw">Password</label>
                <div className="auth-split-input-wrap">
                  <span className="auth-split-input-icon" aria-hidden><FiLock size={16} /></span>
                  <input
                    id="auth-login-pw"
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-split-input auth-split-input--password${errors.password ? ' has-error' : ''}`}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-split-eye"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.password && <div className="auth-split-field-error">{errors.password}</div>}
              </div>

              <div className="auth-split-remember-row">
                <label className="auth-split-remember">
                  <input
                    type="checkbox"
                    checked={loginForm.remember}
                    onChange={(e) => setLoginForm((f) => ({ ...f, remember: e.target.checked }))}
                  />
                  Remember me
                </label>
                <button type="button" className="auth-split-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-split-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="auth-split-submit__spinner" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <FiArrowRight size={16} aria-hidden />
                  </>
                )}
              </button>

              <div className="auth-split-bottom-link">
                Don&apos;t have an account?{' '}
                <button type="button" className="auth-split-link" onClick={() => switchMode('signup')}>
                  Create account
                </button>
              </div>
            </form>
          )}

          {/* ═══ SIGNUP ═══ */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="auth-split-form">
              {apiError && <div className="auth-split-alert">{apiError}</div>}

              <div className="auth-split-row-2">
                <div className="auth-split-field">
                  <label className="auth-split-label" htmlFor="auth-fn">First name</label>
                  <input id="auth-fn" className={`auth-split-input${errors.firstName ? ' has-error' : ''}`} placeholder="Benjamin" value={signupForm.firstName} onChange={(e) => setSignupForm((f) => ({ ...f, firstName: e.target.value }))} autoComplete="given-name" />
                  {errors.firstName && <div className="auth-split-field-error">{errors.firstName}</div>}
                </div>
                <div className="auth-split-field">
                  <label className="auth-split-label" htmlFor="auth-ln">Last name</label>
                  <input id="auth-ln" className={`auth-split-input${errors.lastName ? ' has-error' : ''}`} placeholder="Andoh" value={signupForm.lastName} onChange={(e) => setSignupForm((f) => ({ ...f, lastName: e.target.value }))} autoComplete="family-name" />
                  {errors.lastName && <div className="auth-split-field-error">{errors.lastName}</div>}
                </div>
              </div>

              <div className="auth-split-field">
                <label className="auth-split-label" htmlFor="auth-email">Email</label>
                <div className="auth-split-input-wrap">
                  <span className="auth-split-input-icon" aria-hidden><FiMail size={16} /></span>
                  <input id="auth-email" type="email" className={`auth-split-input${errors.email ? ' has-error' : ''}`} placeholder="you@company.com" value={signupForm.email} onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))} autoComplete="email" />
                </div>
                {errors.email && <div className="auth-split-field-error">{errors.email}</div>}
              </div>

              <div className="auth-split-row-2">
                <div className="auth-split-field">
                  <label className="auth-split-label" htmlFor="auth-country">Country</label>
                  <select id="auth-country" className="auth-split-input auth-split-select" value={signupForm.country} onChange={(e) => setSignupForm((f) => ({ ...f, country: e.target.value }))}>
                    {signupCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="auth-split-field">
                  <label className="auth-split-label" htmlFor="auth-loc">Location</label>
                  <select id="auth-loc" className={`auth-split-input auth-split-select${errors.location ? ' has-error' : ''}`} value={signupForm.location} onChange={(e) => setSignupForm((f) => ({ ...f, location: e.target.value }))}>
                    {locationOptions}
                  </select>
                  {errors.location && <div className="auth-split-field-error">{errors.location}</div>}
                </div>
              </div>

              <div className="auth-split-field">
                <label className="auth-split-label" htmlFor="auth-agency">Agency name</label>
                <input id="auth-agency" className={`auth-split-input${errors.agencyName ? ' has-error' : ''}`} placeholder="Golden Years Care" value={signupForm.agencyName} onChange={(e) => setSignupForm((f) => ({ ...f, agencyName: e.target.value }))} />
                {errors.agencyName && <div className="auth-split-field-error">{errors.agencyName}</div>}
              </div>

              <div className="auth-split-field">
                <label className="auth-split-label" htmlFor="auth-phone">Phone number</label>
                <input id="auth-phone" type="tel" className={`auth-split-input${errors.phone ? ' has-error' : ''}`} placeholder="+233 XX XXX XXXX" value={signupForm.phone} onChange={(e) => setSignupForm((f) => ({ ...f, phone: e.target.value }))} autoComplete="tel" />
                {errors.phone && <div className="auth-split-field-error">{errors.phone}</div>}
              </div>

              <div className="auth-split-field">
                <label className="auth-split-label" htmlFor="auth-pw">Create password</label>
                <div className="auth-split-input-wrap">
                  <span className="auth-split-input-icon" aria-hidden><FiLock size={16} /></span>
                  <input id="auth-pw" type={showPassword ? 'text' : 'password'} className={`auth-split-input auth-split-input--password${errors.password ? ' has-error' : ''}`} placeholder="Min. 8 characters" value={signupForm.password} onChange={(e) => setSignupForm((f) => ({ ...f, password: e.target.value }))} autoComplete="new-password" />
                  <button type="button" className="auth-split-eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.password && <div className="auth-split-field-error">{errors.password}</div>}
              </div>

              <div className="auth-split-field">
                <label className="auth-split-label" htmlFor="auth-cpw">Confirm password</label>
                <div className="auth-split-input-wrap">
                  <span className="auth-split-input-icon" aria-hidden><FiLock size={16} /></span>
                  <input id="auth-cpw" type={showConfirmPassword ? 'text' : 'password'} className={`auth-split-input auth-split-input--password${errors.confirmPassword ? ' has-error' : ''}`} placeholder="Re-enter password" value={signupForm.confirmPassword} onChange={(e) => setSignupForm((f) => ({ ...f, confirmPassword: e.target.value }))} autoComplete="new-password" />
                  <button type="button" className="auth-split-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="auth-split-field-error">{errors.confirmPassword}</div>}
              </div>

              <button type="submit" className="auth-split-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="auth-split-submit__spinner" aria-hidden />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <FiArrowRight size={16} aria-hidden />
                  </>
                )}
              </button>

              <div className="auth-split-bottom-link">
                Already have an account?{' '}
                <button type="button" className="auth-split-link" onClick={() => switchMode('login')}>Sign in</button>
              </div>
            </form>
          )}

          {/* ═══ THANK YOU ═══ */}
          {mode === 'thankyou' && (
            <div className="auth-success-page">
              <div className="auth-success-page__particles" aria-hidden>
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className={`auth-success-particle auth-success-particle--${i + 1}`} />
                ))}
              </div>

              <div className="auth-success-page__badge">
                <span className="auth-success-page__badge-ring" />
                <FiCheck size={32} strokeWidth={3} />
              </div>

              <h2 className="auth-success-page__title">Welcome to CareSense!</h2>
              <p className="auth-success-page__subtitle">
                Your account has been created successfully. You're one step away from streamlining your homecare operations.
              </p>

              <div className="auth-success-page__steps">
                <div className="auth-success-step">
                  <span className="auth-success-step__num">1</span>
                  <div>
                    <strong>Sign in to your dashboard</strong>
                    <span>Access scheduling, patient records, and more.</span>
                  </div>
                </div>
                <div className="auth-success-step">
                  <span className="auth-success-step__num">2</span>
                  <div>
                    <strong>Set up your agency</strong>
                    <span>Add your team members and configure settings.</span>
                  </div>
                </div>
                <div className="auth-success-step">
                  <span className="auth-success-step__num">3</span>
                  <div>
                    <strong>Start managing care</strong>
                    <span>Create schedules, track visits, and generate reports.</span>
                  </div>
                </div>
              </div>

              <button type="button" className="auth-success-page__btn" onClick={() => switchMode('login')}>
                Continue to Sign in <FiArrowRight size={16} />
              </button>

              <p className="auth-success-page__footnote">
                Need help getting started? Contact <a href="mailto:service.caresense@gmail.com">service.caresense@gmail.com</a>
              </p>
            </div>
          )}

          {/* ═══ FORGOT PASSWORD ═══ */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="auth-split-form">
              {forgotSent ? (
                <div className="auth-split-success">
                  <div className="auth-split-success__icon auth-split-success__icon--blue">
                    <FiMail size={24} />
                  </div>
                  <div className="auth-split-success__title">Check your email</div>
                  <p className="auth-split-success__text">
                    We've sent a reset link to <strong>{forgotForm.email}</strong>
                  </p>
                </div>
              ) : (
                <>
                  <div className="auth-split-field">
                    <label className="auth-split-label" htmlFor="auth-forgot-email">Email address</label>
                    <div className="auth-split-input-wrap">
                      <span className="auth-split-input-icon" aria-hidden><FiMail size={16} /></span>
                      <input
                        id="auth-forgot-email"
                        type="email"
                        className={`auth-split-input${errors.email ? ' has-error' : ''}`}
                        placeholder="you@company.com"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ email: e.target.value })}
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && <div className="auth-split-field-error">{errors.email}</div>}
                  </div>
                  <button type="submit" className="auth-split-submit">
                    Send reset link
                  </button>
                </>
              )}
              <div className="auth-split-bottom-link">
                <button type="button" className="auth-split-link" onClick={() => switchMode('login')}>← Back to sign in</button>
              </div>
            </form>
          )}

          <p className="auth-split-copyright">© 2026 Data Leap Technologies Inc.</p>
        </div>
      </div>
    </div>
  );
}
