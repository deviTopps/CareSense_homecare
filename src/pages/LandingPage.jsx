import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FiMenu, FiX } from '../icons/hugeicons-feather';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
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

  const testimonials = [
    { name: 'Sandra Johnson', role: 'Director of Nursing', initials: 'SJ', color: 'rgba(69,182,254,0.15)', textColor: '#2596d1', quote: 'We reduced admin overhead and improved patient response time in under one month. The platform feels thoughtfully built for real teams.' },
    { name: 'Marcus Adeyemi', role: 'Operations Lead', initials: 'MA', color: 'rgba(34,201,122,0.12)', textColor: '#16a361', quote: 'Scheduling and documentation are now predictable and auditable. Our supervisors finally have clear visibility without extra calls.' },
    { name: 'Linda Papadopoulos', role: 'Agency Founder', initials: 'LP', color: 'rgba(251,146,60,0.12)', textColor: '#e87e22', quote: 'From onboarding to reporting, everything is simpler. It gave us confidence to scale our homecare service safely.' },
  ];

  return (
    <div className="lp">
      {/* ── NAV ── */}
      <nav className={`cf-nav${navOpen ? ' cf-nav--open' : ''}${scrolled ? ' scrolled' : ''}`}>
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
          <li><a href="#home">Home</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#medical-reports">Reports</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="cf-nav__end">
          <div className="nav-actions">
            <a href="/login" className="nav-store-btn">Login</a>
            <motion.a href="/login" className="nav-signin" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Sign Up</motion.a>
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
      <section className="hero" id="home">
        <motion.div className="hero-bg-pattern hero-bg-pattern--grid" aria-hidden />
        <motion.div className="hero-bg-pattern hero-bg-pattern--dots" aria-hidden />
        <motion.div className="hero-bg-pattern hero-bg-pattern--diagonal" aria-hidden />
        <motion.div className="hero-bg-glow" aria-hidden />
        <motion.div
          className="hero-cinematic hero-cinematic--exact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-cinematic__overlay" aria-hidden />
          <div className="hero-cinematic__content hero-cinematic__content--center">
            <motion.span 
              className="hero-cinematic__tag"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Trusted By 10+ Homecare Agencies
            </motion.span>
            <motion.h1 
              className="hero-exact-title"
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Stop Managing Chaos.<br />
              Start <span className="hero-exact-title__accent">Delivering Results.</span>
            </motion.h1>
            <motion.p
              className="hero-exact-lead"
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
            >
              One platform for patients, workforce, scheduling, and monthly medical reports — built for homecare agencies.
            </motion.p>
            <motion.div
              className="hero-exact-image-wrap"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
            >
              <img
                src="/mockups/02.png?v=2"
                alt="Hero preview"
                className="hero-exact-image"
              />
            </motion.div>
            <motion.div 
              className="hero-exact-actions"
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <motion.a 
                href="/login" 
                className="lp-btn lp-btn-primary hero-cinematic__cta"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Create an Account
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </section>
      <section className="trusted">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.p variants={fadeUp}>Trusted by teams at</motion.p>
          <motion.div className="logos" variants={fadeUp}>
            <img src="/Clients/logo.png" alt="Client logo" className="client-logo" />
          </motion.div>
        </motion.div>
      </section>


      {/* ── SHOWCASE: Patient Management ── */}
      <section id="features" className="section-split">
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
              <motion.a href="/login" className="lp-btn lp-btn-primary split-cta-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Learn more →</motion.a>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="showcase-collage">
                <div className="showcase-mini-card showcase-mini-card--team">
                  <div className="showcase-mini-card__kicker">Trusted Care Team</div>
                  <div className="showcase-mini-list">
                    {['Ama Mensah', 'Kojo Aidoo', 'Yaa Asantewaa'].map((name, idx) => (
                      <div key={name} className="showcase-mini-list__item">
                        <span className="showcase-mini-list__avatar">{name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                        <span className="showcase-mini-list__name">{name}</span>
                        <span className="showcase-mini-list__tag">{idx === 0 ? 'Lead' : 'Field'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="showcase-mini-card showcase-mini-card--summary">
                  <div className="showcase-mini-card__kicker">Account Summary</div>
                  <div className="showcase-mini-card__amount">$23,300</div>
                  <div className="showcase-mini-progress">
                    <span />
                  </div>
                  <button type="button" className="showcase-mini-chip">View Details</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SHOWCASE: Workforce & Scheduling ── */}
      <section className="section-split section-split--alt">
        <div className="container">
          <motion.div className="split reverse" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <span className="section-label">Workforce</span>
              <h2 className="section-title">Taking control of your workforce has never been simpler</h2>
              <p className="section-sub">Manage nurse credentials, scheduling, certifications, and performance — all from a single powerful view.</p>
              <ul className="split-checks">
                <li><span className="check-mark">✓</span><span>Credential and compliance tracking at a glance</span></li>
                <li><span className="check-mark">✓</span><span>Scheduling aligned with patient census and coverage</span></li>
                <li><span className="check-mark">✓</span><span>Performance metrics for on-time visits and retention</span></li>
              </ul>
              <motion.a href="/login" className="lp-btn lp-btn-primary split-cta-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Explore workforce →</motion.a>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="showcase-collage showcase-collage--alt">
                <div className="showcase-mini-card showcase-mini-card--chart">
                  <div className="showcase-mini-card__kicker">Workforce Performance</div>
                  <div className="showcase-mini-card__amount">96.4%</div>
                  <div className="showcase-mini-card__sub">On-Time Visits</div>
                  <div className="showcase-chart" aria-hidden>
                    <span />
                  </div>
                </div>
                <div className="showcase-mini-card showcase-mini-card--stats">
                  <div className="showcase-mini-card__kicker">Credential Compliance</div>
                  <div className="showcase-stats-grid">
                    <div>
                      <strong>91.2%</strong>
                      <small>Staff Retention</small>
                    </div>
                    <div>
                      <strong>98.7%</strong>
                      <small>Compliance</small>
                    </div>
                    <div>
                      <strong>4.8★</strong>
                      <small>Satisfaction</small>
                    </div>
                    <div>
                      <strong>1,540</strong>
                      <small>Visits / month</small>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SHOWCASE: Automated Monthly Medical Report ── */}
      <section id="medical-reports" className="section-split">
        <div className="container">
          <motion.div className="split" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
              <span className="section-label">Medical Reports</span>
              <h2 className="section-title">Automated Monthly Medical Report</h2>
              <p className="section-sub">
                Generate professional, structured monthly reports for every patient — with visit details, assessments, and an overall summary ready to share.
              </p>
              <ul className="split-checks">
                <li><span className="check-mark">✓</span><span>AI-assisted summaries from visit and care data</span></li>
                <li><span className="check-mark">✓</span><span>Clear sections: patient info, assessment, diagnosis &amp; prescription</span></li>
                <li><span className="check-mark">✓</span><span>Download PDF or email reports to doctors and families</span></li>
              </ul>
              <motion.a href="/login" className="lp-btn lp-btn-primary split-cta-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>View reports →</motion.a>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
              <div className="showcase-collage showcase-collage--reports">
                <div className="showcase-report-card showcase-report-card--main">
                  <div className="showcase-report-card__header">
                    <span className="showcase-report-card__badge">Monthly</span>
                    <span className="showcase-report-card__title">Medical Report</span>
                  </div>
                  <div className="showcase-report-card__patient">
                    <strong>Kwame Boateng</strong>
                    <span>March 2026 · Vitals Assessment</span>
                  </div>
                  <div className="showcase-report-sections">
                    <motion.div className="showcase-report-section" variants={fadeUp}>
                      <span className="showcase-report-section__label">Overall Summary</span>
                      <p>Stable vitals and consistent ADL support. Care plan on track for the month.</p>
                    </motion.div>
                    <div className="showcase-report-section showcase-report-section--muted">
                      <span className="showcase-report-section__label">Assessment</span>
                      <p>Vital signs, medications, weekly activity, and caregiver notes included.</p>
                    </div>
                  </div>
                </div>
                <div className="showcase-report-card showcase-report-card--actions">
                  <div className="showcase-report-card__kicker">Export &amp; share</div>
                  <div className="showcase-report-actions">
                    <span className="showcase-report-action">Download PDF</span>
                    <span className="showcase-report-action showcase-report-action--primary">Email report</span>
                  </div>
                  <p className="showcase-report-card__note">Formatted for clinicians and external recipients</p>
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
              { n: '500+', l: 'Active Agencies', tone: 'accent' },
              { n: '1.2M', l: 'Visits Tracked', tone: 'green' },
              { n: '60+', l: 'Integrations', tone: 'gold' },
              { n: '4.9★', l: 'Average Rating', tone: 'pink' },
            ].map((s) => (
              <motion.div className="stat-item" key={s.l} variants={fadeUp}>
                <div className={`stat-number stat-number--${s.tone}`}>{s.n}</div>
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
            <motion.p className="section-sub" variants={fadeUp}>Real stories from agencies who&rsquo;ve transformed their operations with CareSense.</motion.p>
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
                We charge <strong>GHS&nbsp;50</strong> for each patient you manage on CareSense. Scale admissions up or down &mdash; you only pay for the patients on your roster.
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
            <motion.a href="/login" className="lp-btn lp-btn-primary lp-btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
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
        <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>Join over 500 agencies who&rsquo;ve transformed their homecare operations with CareSense.</motion.p>
        <motion.div className="cta-btns" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <motion.a href="/login" className="lp-btn lp-btn-primary lp-btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Create free account →</motion.a>
          <motion.a href="#features" className="lp-btn lp-btn-outline lp-btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Explore features</motion.a>
        </motion.div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/"><img src="/Blue_Logo.png" alt="CareSense" className="nav-logo" /></a>
            <p>Smart homecare management for agencies, care teams, and healthcare operators.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#medical-reports">Reports</a>
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
