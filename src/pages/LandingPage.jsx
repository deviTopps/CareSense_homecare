import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FiMenu, FiX } from '../icons/hugeicons-feather';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar03Icon,
  NoteEditIcon,
  Invoice01Icon,
  SecurityLockIcon,
  Analytics02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import './LandingPage.css';

/* animation presets */
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };
const COOKIE_CONSENT_KEY = 'kulobalCookieConsent';

const LANDING_FAQ = [
  {
    question: 'How much does CareSense cost?',
    answer:
      'We keep it simple: GHS 50 per patient on your roster, plus a one-time GHS 5,000 initial setup fee. The setup covers onboarding and staff training so your team can use scheduling, records, and reporting confidently.',
  },
  {
    question: 'What is included in the GHS 5,000 setup fee?',
    answer:
      'The setup investment covers platform configuration, onboarding support, and dedicated training for your staff — administrators and care teams — so you are not left to figure everything out alone.',
  },
  {
    question: 'Do you charge per nurse or per agency seat?',
    answer:
      'Our published model is per patient (GHS 50 each) together with the one-time setup. If you need a custom arrangement for a large or multi-site organisation, we can discuss options after you get in touch.',
  },
  {
    question: 'Is there a mobile app for nurses?',
    answer:
      'Yes. Field staff can use the nurse app (e.g. via Google Play) for visit-related workflows alongside the web dashboard your office team uses.',
  },
  {
    question: 'How is client and health information protected?',
    answer:
      'The platform is designed with role-based access, secure sign-in, and practices suitable for sensitive care data. Your agency should still follow local privacy rules and internal policies.',
  },
  {
    question: 'How long does it take to get started?',
    answer:
      'You can sign in and begin configuration quickly. Full rollout depends on your team size and training schedule; setup and training are part of the GHS 5,000 onboarding package.',
  },
];

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showCookiePrefs, setShowCookiePrefs] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [cookiePrefs, setCookiePrefs] = useState({
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const nav = document.querySelector('.cf-nav');
    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!navOpen) return undefined;
    document.body.classList.add('lp-nav-open');
    return () => document.body.classList.remove('lp-nav-open');
  }, [navOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 901px)');
    const onWide = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onWide);
    return () => mq.removeEventListener('change', onWide);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!saved) {
        setShowCookieBanner(true);
        return;
      }

      const parsed = JSON.parse(saved);
      if (parsed?.preferences && typeof parsed.preferences === 'object') {
        setCookiePrefs(prev => ({
          ...prev,
          ...parsed.preferences,
        }));
      }
      setShowCookieBanner(false);
    } catch {
      setShowCookieBanner(true);
    }
  }, []);

  const persistCookieConsent = (consent, preferences) => {
    const payload = {
      consent,
      preferences: {
        analytics: Boolean(preferences?.analytics),
        marketing: Boolean(preferences?.marketing),
        necessary: true,
      },
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
    setCookiePrefs({
      analytics: Boolean(preferences?.analytics),
      marketing: Boolean(preferences?.marketing),
    });
    setShowCookiePrefs(false);
    setShowCookieBanner(false);
  };

  const handleAcceptAllCookies = () => {
    persistCookieConsent('accepted', { analytics: true, marketing: true });
  };

  const handleRejectOptionalCookies = () => {
    persistCookieConsent('rejected', { analytics: false, marketing: false });
  };

  const handleSaveCookiePreferences = () => {
    persistCookieConsent('customized', cookiePrefs);
  };

  const toggleCookiePreference = (key) => {
    setCookiePrefs(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const features = [
    { icon: Calendar03Icon, title: 'Smart Scheduling', desc: 'Coordinate visits, shift swaps, and patient assignments from one intuitive calendar view.' },
    { icon: NoteEditIcon, title: 'Clinical Documentation', desc: 'Capture compliant care notes, medication logs, and visit records with guided workflows.' },
    { icon: Invoice01Icon, title: 'Billing & Payroll', desc: 'Track invoicing, nurse payouts, and agency revenue with fast, accurate reporting.' },
    { icon: SecurityLockIcon, title: 'HIPAA-Ready Security', desc: 'Role-based controls, encrypted storage, and audit trails keep sensitive data safe.' },
    { icon: Analytics02Icon, title: 'Real-Time Analytics', desc: 'Turn visit data into actionable insights for care quality, staffing, and growth.' },
    { icon: UserGroupIcon, title: 'Workforce Management', desc: 'Onboard nurses, track credentials, and manage teams across multiple locations.' },
  ];

  const testimonials = [
    { name: 'Sandra Johnson', role: 'Director of Nursing', initials: 'SJ', color: 'rgba(69,182,254,0.15)', textColor: '#2596d1', quote: 'We reduced admin overhead and improved patient response time in under one month. The platform feels thoughtfully built for real teams.' },
    { name: 'Marcus Adeyemi', role: 'Operations Lead', initials: 'MA', color: 'rgba(34,201,122,0.12)', textColor: '#16a361', quote: 'Scheduling and documentation are now predictable and auditable. Our supervisors finally have clear visibility without extra calls.' },
    { name: 'Linda Papadopoulos', role: 'Agency Founder', initials: 'LP', color: 'rgba(251,146,60,0.12)', textColor: '#e87e22', quote: 'From onboarding to reporting, everything is simpler. It gave us confidence to scale our homecare service safely.' },
  ];

  return (
    <div className="lp">
      {/* ── NAV ── */}
      <nav className={`cf-nav${navOpen ? ' cf-nav--open' : ''}`}>
        <a
          href="/"
          className="nav-brand"
          onClick={() => setNavOpen(false)}
        >
          <img src="/Blue_Logo.png" alt="CareSense" className="nav-logo" />
        </a>
        <ul
          className="nav-links"
          onClick={(e) => {
            if (e.target && e.target.closest && e.target.closest('a')) setNavOpen(false);
          }}
        >
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">About</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="cf-nav__end">
          <div className="nav-actions">
            <a href="/login" className="nav-signin">Sign in</a>
            <motion.a href="/login" className="btn btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Get Started</motion.a>
          </div>
          <button
            type="button"
            className="cf-nav__toggle"
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setNavOpen((o) => !o)}
          >
            {navOpen ? <FiX size={22} strokeWidth={2} /> : <FiMenu size={22} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-glow" />
        <motion.div className="hero-badge" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="dot" /> Trusted by 10+ homecare agencies
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Smart Homecare<br />Management for <span className="highlight">Everyone</span>
        </motion.h1>
        <motion.p className="hero-desc" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          Take control of your agency operations scheduling, clinical docs, billing, and compliance in one powerful platform designed for modern care teams.
        </motion.p>
        <motion.div className="hero-btns" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <motion.a href="/login" className="btn btn-primary btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Get Started →</motion.a>
          <motion.a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg google-play-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <svg width="20" height="22" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.4c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
            Get Nurse App
          </motion.a>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div className="dashboard-wrap" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
          <img src="/mockups/o1.jpeg" alt="Kulobal Homecare Dashboard" className="hero-mockup" />
        </motion.div>
      </section>

      {/* ── TRUSTED BY ── */}
      <motion.div className="trusted" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
        <motion.p variants={fadeUp}>Trusted by teams at</motion.p>
        <motion.div className="logos" variants={fadeUp}>
          <img src="/Clients/logo.png" alt="Client logo" className="client-logo" />
        </motion.div>
      </motion.div>

      {/* ── FEATURES ── */}
      <section id="features">
        <div className="container">
          <motion.div className="sec-center" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.span className="section-label" variants={fadeUp}>Features</motion.span>
            <motion.h2 className="section-title" variants={fadeUp}>Standout homecare features designed<br />to put you in control</motion.h2>
            <motion.p className="section-sub" variants={fadeUp}>From smart scheduling to seamless billing everything your agency needs in one powerful platform.</motion.p>
          </motion.div>
          <motion.div className="features-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {features.map((f, i) => (
              <motion.div className="feat-card" key={f.title} variants={fadeUp} transition={{ duration: 0.5 }}>
                <div className="feat-top">
                  <div className="feat-icon"><HugeiconsIcon icon={f.icon} size={24} color={i === 1 || i === 4 ? '#fff' : '#45B6FE'} strokeWidth={1.5} /></div>
                  <span className="feat-num">0{i + 1}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SHOWCASE: Patient Management ── */}
      <section id="how-it-works" className="section-split">
        <div className="container">
          <motion.div className="split" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <span className="section-label">Patient Management</span>
              <h2 className="section-title">Stay on top of every patient effortlessly</h2>
              <p className="section-sub">Track patient records, care plans, visit history, and outcomes across your entire agency — all from one dashboard.</p>
              <ul className="split-checks">
                <li><span className="check-mark">✓</span><span>Real-time sync across all care teams</span></li>
                <li><span className="check-mark">✓</span><span>Smart care plan templates powered by best practices</span></li>
                <li><span className="check-mark">✓</span><span>Automated visit reports and compliance tracking</span></li>
              </ul>
              <motion.a href="/login" className="btn btn-primary" style={{ marginTop: 32 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Learn more →</motion.a>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="visual-card">
                <div className="balance-display">
                  <div className="balance-label">Total Active Patients</div>
                  <div className="balance-amount">1,248</div>
                  <div className="balance-change">↑ +86 this month</div>
                </div>
                <div className="mini-bars">
                  {[35, 55, 45, 70, 60, 85, 75].map((h, i) => (
                    <div className="mini-bar" key={i} style={{ height: `${h}%`, background: i === 5 ? 'var(--accent)' : `rgba(69,182,254,${0.3 + i * 0.05})` }} />
                  ))}
                </div>
                <div className="spending-list">
                  <div className="spending-item">
                    <div className="spending-dot" style={{ background: '#45B6FE' }} />
                    <span className="spending-name">Home Health</span>
                    <div className="spending-bar-wrap"><div className="spending-bar" style={{ width: '72%', background: '#45B6FE' }} /></div>
                    <span className="spending-amount">892</span>
                  </div>
                  <div className="spending-item">
                    <div className="spending-dot" style={{ background: 'var(--green)' }} />
                    <span className="spending-name">Private Duty</span>
                    <div className="spending-bar-wrap"><div className="spending-bar" style={{ width: '45%', background: 'var(--green)' }} /></div>
                    <span className="spending-amount">246</span>
                  </div>
                  <div className="spending-item">
                    <div className="spending-dot" style={{ background: '#f59e0b' }} />
                    <span className="spending-name">Hospice</span>
                    <div className="spending-bar-wrap"><div className="spending-bar" style={{ width: '28%', background: '#f59e0b' }} /></div>
                    <span className="spending-amount">110</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SHOWCASE: Workforce & Scheduling ── */}
      <section>
        <div className="container">
          <motion.div className="split reverse" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <span className="section-label">Workforce</span>
              <h2 className="section-title">Taking control of your workforce has never been simpler</h2>
              <p className="section-sub">Manage nurse credentials, scheduling, certifications, and performance — all from a single powerful view.</p>
              <motion.a href="/login" className="btn btn-primary" style={{ marginTop: 32 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Explore workforce →</motion.a>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="visual-card">
                <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20 }}>Workforce Performance</div>
                <div className="portfolio-grid">
                  <div className="portfolio-item">
                    <div className="portfolio-label">On-Time Visits</div>
                    <div className="portfolio-value">96.4%</div>
                    <div className="portfolio-change">↑ Excellent</div>
                  </div>
                  <div className="portfolio-item">
                    <div className="portfolio-label">Staff Retention</div>
                    <div className="portfolio-value">91.2%</div>
                    <div className="portfolio-change">↑ Above avg</div>
                  </div>
                  <div className="portfolio-item">
                    <div className="portfolio-label">Credential Compliance</div>
                    <div className="portfolio-value">98.7%</div>
                    <div className="portfolio-change">↑ High</div>
                  </div>
                  <div className="portfolio-item">
                    <div className="portfolio-label">Avg Satisfaction</div>
                    <div className="portfolio-value">4.8★</div>
                    <div className="portfolio-change stable">→ Stable</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="section-stats">
        <div className="container">
          <motion.div className="stats-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            {[
              { n: '500+', l: 'Active Agencies', c: 'var(--accent)' },
              { n: '1.2M', l: 'Visits Tracked', c: 'var(--green)' },
              { n: '60+', l: 'Integrations', c: '#f59e0b' },
              { n: '4.9★', l: 'Average Rating', c: '#ec4899' },
            ].map((s) => (
              <motion.div className="stat-item" key={s.l} variants={fadeUp}>
                <div className="stat-number" style={{ color: s.c }}>{s.n}</div>
                <div className="stat-label">{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials">
        <div className="container">
          <motion.div className="sec-center" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.span className="section-label" variants={fadeUp}>Testimonials</motion.span>
            <motion.h2 className="section-title" variants={fadeUp}>Loved by care operators</motion.h2>
            <motion.p className="section-sub" variants={fadeUp}>Real stories from agencies who&rsquo;ve transformed their operations with Kulobal Homecare.</motion.p>
          </motion.div>
          <motion.div className="testimonials-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            {testimonials.map((t) => (
              <motion.div className="test-card" key={t.name} variants={fadeUp} transition={{ duration: 0.5 }} whileHover={{ y: -4, borderColor: 'rgba(69,182,254,0.35)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
                <div className="test-stars">★★★★★</div>
                <p>&ldquo;{t.quote}&rdquo;</p>
                <div className="test-author">
                  <div className="test-avatar" style={{ background: t.color, color: t.textColor }}>{t.initials}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING (Ghana Cedis) ── */}
      <section id="pricing" className="section-pricing">
        <div className="container">
          <motion.div className="sec-center" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.span className="section-label" variants={fadeUp}>Pricing</motion.span>
            <motion.h2 className="section-title" variants={fadeUp}>Straightforward pricing for your agency</motion.h2>
            <motion.p className="section-sub" variants={fadeUp}>
              All figures in <strong>Ghana Cedis (GHS)</strong>. One simple per-patient fee plus a single setup investment that gets your team trained and ready.
            </motion.p>
          </motion.div>
          <motion.div
            className="pricing-gh-layout"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
          >
            <motion.article className="pricing-gh-card" variants={fadeUp} transition={{ duration: 0.5 }}>
              <p className="pricing-gh-eyebrow">Ongoing</p>
              <h3 className="pricing-gh-title">Per patient</h3>
              <div className="pricing-gh-figure" aria-label="50 Ghana Cedis per patient">
                <span className="pricing-gh-currency">GHS</span>
                <span className="pricing-gh-amount">50</span>
              </div>
              <p className="pricing-gh-copy">
                We charge <strong>GHS&nbsp;50</strong> for each patient you manage on Kulobal. Scale admissions up or down &mdash; you only pay for the patients on your roster.
              </p>
              <ul className="pricing-gh-bullets">
                <li><span className="pricing-gh-tick">✓</span> Predictable cost per enrolment</li>
                <li><span className="pricing-gh-tick">✓</span> Aligns with how your census grows</li>
              </ul>
            </motion.article>

            <motion.article className="pricing-gh-card pricing-gh-card--setup" variants={fadeUp} transition={{ duration: 0.5, delay: 0.06 }}>
              <div className="pricing-gh-ribbon">One-time</div>
              <p className="pricing-gh-eyebrow">Getting started</p>
              <h3 className="pricing-gh-title">Initial setup</h3>
              <div className="pricing-gh-figure" aria-label="5000 Ghana Cedis setup">
                <span className="pricing-gh-currency">GHS</span>
                <span className="pricing-gh-amount">5,000</span>
              </div>
              <p className="pricing-gh-copy">
                <strong>GHS&nbsp;5,000</strong> covers your <strong>initial setup</strong>, including <strong>training for your staff</strong> so administrators and care teams know how to use scheduling, documentation, and reporting with confidence.
              </p>
              <ul className="pricing-gh-bullets">
                <li><span className="pricing-gh-tick">✓</span> Onboarding &amp; platform configuration support</li>
                <li><span className="pricing-gh-tick">✓</span> Staff training sessions bundled in setup</li>
                <li><span className="pricing-gh-tick">✓</span> Pay once &mdash; not a recurring subscription tier</li>
              </ul>
            </motion.article>
          </motion.div>
          <motion.p className="pricing-gh-note" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.4 }}>
            Pricing may be reviewed for bespoke enterprise arrangements. Questions? Reach out after you sign in or contact our team through your preferred channel.
          </motion.p>
          <motion.div className="pricing-gh-cta" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <motion.a href="/login" className="btn btn-primary btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              Get started →
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section-faq">
        <div className="container">
          <motion.div className="sec-center" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.span className="section-label" variants={fadeUp}>FAQ</motion.span>
            <motion.h2 className="section-title" variants={fadeUp}>Questions, answered</motion.h2>
            <motion.p className="section-sub" variants={fadeUp}>
              Quick answers about pricing, onboarding, and how CareSense fits your agency. Still unsure? Jump in and explore, or speak to our team after you sign in.
            </motion.p>
          </motion.div>
          <motion.div
            className="faq-list"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.08 }}
            variants={stagger}
          >
            {LANDING_FAQ.map((item, index) => {
              const isOpen = openFaqIndex === index;
              const panelId = `faq-panel-${index}`;
              return (
                <motion.div variants={fadeUp} key={item.question} className={`faq-item${isOpen ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    id={`faq-trigger-${index}`}
                    className="faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  >
                    <span className="faq-question">{item.question}</span>
                    <span className="faq-chevron" aria-hidden>+</span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={`faq-trigger-${index}`}
                    className="faq-panel"
                    aria-hidden={!isOpen}
                  >
                    <div className="faq-panel-inner">
                      <p className="faq-answer">{item.answer}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="section-cta">
        <motion.span className="section-label" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>Get started</motion.span>
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>Ready to take control<br />of your agency?</motion.h2>
        <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>Join over 500 agencies who&rsquo;ve transformed their homecare operations with Kulobal.</motion.p>
        <motion.div className="cta-btns" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <motion.a href="/login" className="btn btn-primary btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Create free account →</motion.a>
          <motion.a href="#features" className="btn btn-outline btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Learn more</motion.a>
        </motion.div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/"><img src="/Blue_Logo.png" alt="Kulobal Homecare" className="nav-logo" /></a>
            <p>Smart homecare management for agencies, care teams, and healthcare operators.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#">Security</a>
            <a href="#">Changelog</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="/privacy">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
            <a href="#">Security</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-bottom-copy">© {new Date().getFullYear()} Data Leap Technologies Inc. All rights reserved.</p>
          <a href="/privacy" className="footer-bottom-privacy">Privacy</a>
        </div>
      </footer>

      <AnimatePresence>
        {showCookieBanner && (
          <motion.aside
            className="cookie-banner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            role="dialog"
            aria-label="Cookie preferences"
            aria-live="polite"
          >
            <div className="cookie-banner__header">
              <div className="cookie-banner__chip">Cookie Preferences</div>
              <button
                className="cookie-banner__manage"
                type="button"
                onClick={() => setShowCookiePrefs(prev => !prev)}
              >
                {showCookiePrefs ? 'Hide settings' : 'Manage settings'}
              </button>
            </div>

            <h4>We use cookies to improve your experience.</h4>
            <p>
              We use essential cookies to keep the site secure and optional cookies for analytics and marketing.
              You can accept all, reject optional, or customize your preferences.
            </p>

            <AnimatePresence>
              {showCookiePrefs && (
                <motion.div
                  className="cookie-banner__prefs"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <div className="cookie-pref-item">
                    <div>
                      <strong>Necessary</strong>
                      <span>Required for core site functionality.</span>
                    </div>
                    <span className="cookie-pref-badge">Always on</span>
                  </div>

                  <div className="cookie-pref-item">
                    <div>
                      <strong>Analytics</strong>
                      <span>Help us understand usage and improve performance.</span>
                    </div>
                    <button
                      type="button"
                      className={`cookie-toggle ${cookiePrefs.analytics ? 'on' : ''}`}
                      onClick={() => toggleCookiePreference('analytics')}
                      aria-pressed={cookiePrefs.analytics}
                    >
                      <span />
                    </button>
                  </div>

                  <div className="cookie-pref-item">
                    <div>
                      <strong>Marketing</strong>
                      <span>Enable personalized offers and campaign insights.</span>
                    </div>
                    <button
                      type="button"
                      className={`cookie-toggle ${cookiePrefs.marketing ? 'on' : ''}`}
                      onClick={() => toggleCookiePreference('marketing')}
                      aria-pressed={cookiePrefs.marketing}
                    >
                      <span />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="cookie-banner__actions">
              <button type="button" className="cookie-btn ghost" onClick={handleRejectOptionalCookies}>Reject optional</button>
              <button type="button" className="cookie-btn outline" onClick={handleSaveCookiePreferences}>Save preferences</button>
              <button type="button" className="cookie-btn primary" onClick={handleAcceptAllCookies}>Accept all</button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
