import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheck,
  FiMail,
  FiLock,
} from '../icons/hugeicons-feather';
import { API_BASE } from '../api';
import { logSessionEvent } from '../hipaa/auditLog';
import { BRAND_LOGO_SRC } from '../constants/brandAssets';
import './Auth.css';

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unable to read server response. Please try again.');
  }
}

const LOCATION_GROUPS = [
  {
    label: 'Greater Accra',
    options: [
      'Accra', 'Tema', 'Madina', 'Teshie', 'Nungua', 'Osu', 'Cantonments', 'East Legon',
      'Dansoman', 'Lapaz', 'Achimota', 'Spintex', 'Airport Residential', 'Kasoa',
      'Ashaiman', 'Sakumono', 'Adenta', 'Dome', 'Dzorwulu', 'Weija',
    ],
  },
  {
    label: 'Kumasi & Ashanti',
    options: [
      'Kumasi', 'Adum', 'Bantama', 'Asokwa', 'Suame', 'Tafo', 'Nhyiaeso', 'Atonsu',
      'Kwadaso', 'Obuasi', 'Ejisu', 'Bekwai', 'Mampong', 'Konongo',
    ],
  },
  {
    label: 'Takoradi & Western',
    options: [
      'Takoradi', 'Sekondi', 'Effia', 'Anaji', 'Kojokrom', 'Essikado', 'Kwesimintsim',
      'Fijai', 'Axim', 'Tarkwa', 'Prestea',
    ],
  },
  {
    label: 'Other Major Cities',
    options: [
      'Tamale', 'Cape Coast', 'Sunyani', 'Ho', 'Koforidua', 'Bolgatanga', 'Wa',
      'Techiman', 'Winneba', 'Goaso', 'Damongo', 'Nalerigu', 'Sefwi Wiawso', 'Dambai',
    ],
  },
];

const SIGNUP_COUNTRIES = ['Ghana', 'United States', 'United Kingdom', 'Canada'];

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
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    location: '',
    country: 'Ghana',
  });
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
    else if (signupForm.password.length < 8) e.password = 'At least 8 characters';
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
      logSessionEvent('login', { email: loginForm.email.trim() });
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
    if (!forgotForm.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!emailRegex.test(forgotForm.email.trim())) {
      setErrors({ email: 'Enter a valid email address' });
      return;
    }
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

  const isFormMode = mode === 'login' || mode === 'signup';
  const showBrandPanel = isFormMode;

  if (mode === 'forgot') {
    return (
      <div className="auth-page auth-page--reset">
        <div className="auth-reset" aria-labelledby="auth-reset-title">
          <div className="auth-reset__atmosphere" aria-hidden />

          <div className="auth-reset__shell">
            <button type="button" className="auth-reset__back" onClick={() => switchMode('login')}>
              Back to sign in
            </button>

            <Link to="/" className="auth-reset__brand">
              <img src={BRAND_LOGO_SRC} alt="" className="auth-reset__logo" />
              <span className="auth-reset__brand-name">CareSense</span>
            </Link>

            {!forgotSent ? (
              <>
                <header className="auth-reset__header">
                  <h1 id="auth-reset-title" className="auth-reset__title">
                    Reset your password
                  </h1>
                  <p className="auth-reset__lead">
                    Enter the email for your agency account. We will send a secure link to choose a
                    new password.
                  </p>
                </header>

                <form onSubmit={handleForgot} className="auth-reset__form" noValidate>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="auth-forgot-email">
                      Email
                    </label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon" aria-hidden>
                        <FiMail size={16} />
                      </span>
                      <input
                        id="auth-forgot-email"
                        type="email"
                        className={`auth-input${errors.email ? ' is-error' : ''}`}
                        placeholder="you@agency.com"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ email: e.target.value })}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {errors.email ? <p className="auth-field-error">{errors.email}</p> : null}
                  </div>

                  <button type="submit" className="auth-submit">
                    Send reset link
                    <FiArrowRight size={16} aria-hidden />
                  </button>
                </form>
              </>
            ) : (
              <div className="auth-reset__sent">
                <div className="auth-reset__sent-mark" aria-hidden>
                  <FiMail size={28} strokeWidth={2} />
                </div>
                <h1 id="auth-reset-title" className="auth-reset__title">
                  Check your inbox
                </h1>
                <p className="auth-reset__lead">
                  If an account exists for <strong>{forgotForm.email}</strong>, a reset link is on
                  its way. It may take a minute to arrive.
                </p>
                <div className="auth-reset__actions">
                  <button type="button" className="auth-submit" onClick={() => switchMode('login')}>
                    Back to sign in
                    <FiArrowRight size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="auth-reset__secondary"
                    onClick={() => {
                      setForgotSent(false);
                      setErrors({});
                    }}
                  >
                    Use a different email
                  </button>
                </div>
                <p className="auth-reset__help">
                  Still stuck?{' '}
                  <a href="mailto:service.caresense@gmail.com">service.caresense@gmail.com</a>
                </p>
              </div>
            )}

            <p className="auth-copyright">© 2026 Data Leap Technologies Inc.</p>
          </div>
        </div>
      </div>
    );
  }

  const titles = {
    login: 'Welcome back',
    signup: 'Create your account',
  };

  const subtitles = {
    login: 'Sign in to your CareSense workspace.',
    signup: 'Set up your agency and start managing care.',
  };

  return (
    <div className={`auth-page${showBrandPanel ? '' : ' auth-page--solo'}`}>
      {showBrandPanel ? (
        <aside className="auth-brand" aria-label="CareSense">
          <div className="auth-brand__atmosphere" aria-hidden />
          <div className="auth-brand__inner">
            <Link to="/" className="auth-brand__logo-link">
              <img src={BRAND_LOGO_SRC} alt="CareSense" className="auth-brand__logo" />
            </Link>

            <div className="auth-brand__copy">
              <p className="auth-brand__name">CareSense</p>
              <h2 className="auth-brand__headline">Homecare operations, made clear.</h2>
              <p className="auth-brand__lead">
                One workspace for patients, schedules, clinical records, and your care team.
              </p>
            </div>

            <p className="auth-brand__foot">Trusted by homecare agencies across Ghana</p>
          </div>
        </aside>
      ) : null}

      <main className="auth-main">
        <div className="auth-main__inner">
          <div className="auth-main__top">
            <Link to="/" className="auth-back">
              Back to website
            </Link>
          </div>

          {mode !== 'thankyou' ? (
            <header className="auth-heading">
              <h1 className="auth-heading__title">{titles[mode]}</h1>
              <p className="auth-heading__sub">{subtitles[mode]}</p>
            </header>
          ) : null}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form" noValidate>
              {apiError ? (
                <div className="auth-alert" role="alert">
                  {apiError}
                </div>
              ) : null}

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-login-email">
                  Email
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden>
                    <FiMail size={16} />
                  </span>
                  <input
                    id="auth-login-email"
                    type="email"
                    className={`auth-input${errors.email ? ' is-error' : ''}`}
                    placeholder="you@agency.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                {errors.email ? <p className="auth-field-error">{errors.email}</p> : null}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-login-pw">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden>
                    <FiLock size={16} />
                  </span>
                  <input
                    id="auth-login-pw"
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input auth-input--password${errors.password ? ' is-error' : ''}`}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.password ? <p className="auth-field-error">{errors.password}</p> : null}
              </div>

              <div className="auth-row-between">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={loginForm.remember}
                    onChange={(e) => setLoginForm((f) => ({ ...f, remember: e.target.checked }))}
                  />
                  Remember me
                </label>
                <button type="button" className="auth-text-btn" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="auth-submit__spinner" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <FiArrowRight size={16} aria-hidden />
                  </>
                )}
              </button>

              <p className="auth-switch">
                New to CareSense?{' '}
                <button type="button" className="auth-text-btn" onClick={() => switchMode('signup')}>
                  Create an account
                </button>
              </p>
            </form>
          ) : null}

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} className="auth-form" noValidate>
              {apiError ? (
                <div className="auth-alert" role="alert">
                  {apiError}
                </div>
              ) : null}

              <p className="auth-group-label">Your details</p>

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-fn">
                    First name
                  </label>
                  <input
                    id="auth-fn"
                    className={`auth-input${errors.firstName ? ' is-error' : ''}`}
                    placeholder="Benjamin"
                    value={signupForm.firstName}
                    onChange={(e) => setSignupForm((f) => ({ ...f, firstName: e.target.value }))}
                    autoComplete="given-name"
                  />
                  {errors.firstName ? <p className="auth-field-error">{errors.firstName}</p> : null}
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-ln">
                    Last name
                  </label>
                  <input
                    id="auth-ln"
                    className={`auth-input${errors.lastName ? ' is-error' : ''}`}
                    placeholder="Andoh"
                    value={signupForm.lastName}
                    onChange={(e) => setSignupForm((f) => ({ ...f, lastName: e.target.value }))}
                    autoComplete="family-name"
                  />
                  {errors.lastName ? <p className="auth-field-error">{errors.lastName}</p> : null}
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">
                  Email
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden>
                    <FiMail size={16} />
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    className={`auth-input${errors.email ? ' is-error' : ''}`}
                    placeholder="you@agency.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                {errors.email ? <p className="auth-field-error">{errors.email}</p> : null}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-phone">
                  Phone
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  className={`auth-input${errors.phone ? ' is-error' : ''}`}
                  placeholder="+233 XX XXX XXXX"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm((f) => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
                {errors.phone ? <p className="auth-field-error">{errors.phone}</p> : null}
              </div>

              <p className="auth-group-label">Your agency</p>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-agency">
                  Agency name
                </label>
                <input
                  id="auth-agency"
                  className={`auth-input${errors.agencyName ? ' is-error' : ''}`}
                  placeholder="Golden Years Care"
                  value={signupForm.agencyName}
                  onChange={(e) => setSignupForm((f) => ({ ...f, agencyName: e.target.value }))}
                />
                {errors.agencyName ? <p className="auth-field-error">{errors.agencyName}</p> : null}
              </div>

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-country">
                    Country
                  </label>
                  <select
                    id="auth-country"
                    className="auth-input auth-select"
                    value={signupForm.country}
                    onChange={(e) => setSignupForm((f) => ({ ...f, country: e.target.value }))}
                  >
                    {SIGNUP_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-loc">
                    Location
                  </label>
                  <select
                    id="auth-loc"
                    className={`auth-input auth-select${errors.location ? ' is-error' : ''}`}
                    value={signupForm.location}
                    onChange={(e) => setSignupForm((f) => ({ ...f, location: e.target.value }))}
                  >
                    <option value="">Select location</option>
                    {LOCATION_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.location ? <p className="auth-field-error">{errors.location}</p> : null}
                </div>
              </div>

              <p className="auth-group-label">Password</p>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-pw">
                  Create password
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden>
                    <FiLock size={16} />
                  </span>
                  <input
                    id="auth-pw"
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input auth-input--password${errors.password ? ' is-error' : ''}`}
                    placeholder="At least 8 characters"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.password ? <p className="auth-field-error">{errors.password}</p> : null}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-cpw">
                  Confirm password
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden>
                    <FiLock size={16} />
                  </span>
                  <input
                    id="auth-cpw"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`auth-input auth-input--password${errors.confirmPassword ? ' is-error' : ''}`}
                    placeholder="Re-enter password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="auth-field-error">{errors.confirmPassword}</p>
                ) : null}
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="auth-submit__spinner" aria-hidden />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <FiArrowRight size={16} aria-hidden />
                  </>
                )}
              </button>

              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" className="auth-text-btn" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            </form>
          ) : null}

          {mode === 'thankyou' ? (
            <div className="auth-done">
              <div className="auth-done__mark" aria-hidden>
                <FiCheck size={28} strokeWidth={2.5} />
              </div>
              <h1 className="auth-done__title">Welcome to CareSense</h1>
              <p className="auth-done__lead">
                Your account is ready. Sign in to open your agency workspace.
              </p>
              <button type="button" className="auth-submit" onClick={() => switchMode('login')}>
                Continue to sign in
                <FiArrowRight size={16} aria-hidden />
              </button>
              <p className="auth-done__help">
                Need help?{' '}
                <a href="mailto:service.caresense@gmail.com">service.caresense@gmail.com</a>
              </p>
            </div>
          ) : null}

          <p className="auth-copyright">© 2026 Data Leap Technologies Inc.</p>
        </div>
      </main>
    </div>
  );
}

