import { APP_STORE_BADGE_SRC, GOOGLE_PLAY_BADGE_SRC, NURSE1_MOCKUP_SRC, PO_IMAGE_SRC } from '../constants/brandAssets';

/** Landing page copy, navigation, and section metadata */

export const LANDING_PHONE = '+233 535614493';
export const LANDING_PHONE_HREF = 'tel:+233535614493';

export const LANDING_NAV = [
  { id: 'features', label: 'Features', href: '#features' },
  { id: 'how-it-works', label: 'How it works', href: '#how-it-works' },
  { id: 'security', label: 'Security', href: '#security' },
  { id: 'pricing', label: 'Pricing', href: '#pricing' },
];

export const LANDING_NAV_CTA = { label: 'Sign in', href: '/login' };
export const LANDING_NAV_PRIMARY = { label: 'Start free', href: '/login' };

export const HERO_CONTENT = {
  brand: 'CareSense',
  title: 'Run your homecare agency with calm clarity',
  titleAccent: 'calm clarity',
  subtitle:
    'An operations platform that brings patients, nurses, visits, scheduling, and clinical safety monitoring into one workspace for agencies and the care teams behind them',
  primaryCta: { label: 'Start free', href: '/login' },
  secondaryCta: { label: 'Book a demo', href: '/book-demo' },
  highlights: ['Smart scheduling', 'GPS visit verification', 'Billing-ready reports'],
};

export const STATS_CONTENT = [
  { value: '81+', label: 'Patients managed' },
  { value: '150+', label: 'Nurses onboarded' },
  { value: '40%', label: 'Less admin time' },
  { value: '24/7', label: 'Support available' },
];

export const TRUSTED_BY = {
  label: 'Built for modern homecare agencies',
  items: ['Agency owners', 'Care coordinators', 'Field nurses', 'Billing teams'],
};

export const PROBLEM_SOLUTION_CONTENT = {
  eyebrow: 'Why CareSense',
  title: 'The Problem & Our Solution',
  lead: 'Running an agency is complex. Managing it shouldn\'t be.',
  problem: {
    label: 'The problem',
    body:
      'As a care agency leader, you juggle compliance, staff turnover, and chaotic scheduling every day. When administrative hurdles take up your time, patient care takes a backseat.',
    cta: { label: 'See how we help', href: '#features' },
    image: {
      src: PO_IMAGE_SRC,
      alt: 'Healthcare professionals reviewing patient records together',
    },
  },
  solution: {
    label: 'Our solution',
    body:
      'CareSense brings your entire operation into a single, intuitive dashboard. We handle the backend complexity so you can focus on what matters most: delivering exceptional care.',
    cta: { label: 'Get started free', href: '/login' },
    image: {
      src: '/mockups/02.png',
      alt: 'CareSense dashboard unifying patients, nurses, and visits',
    },
  },
};

export const HOW_IT_WORKS_CONTENT = {
  eyebrow: 'How it works',
  title: 'Live in three steps',
  steps: [
    {
      number: '01',
      title: 'Set up your agency',
      body: 'Create your account, add agency details, and configure your care regions.',
    },
    {
      number: '02',
      title: 'Onboard your team',
      body: 'Invite nurses, assign roles, and upload credentials in one place.',
    },
    {
      number: '03',
      title: 'Run day-to-day care',
      body: 'Schedule visits, track attendance, document outcomes, and export billing reports.',
    },
  ],
};

export const FEATURES_CONTENT = {
  eyebrow: 'Features',
  title: 'Everything in one place',
  subtitle: 'Replace spreadsheets, WhatsApp threads, and paper charts with one clear workflow.',
  items: [
    {
      icon: 'patients',
      title: 'Patient management',
      body: 'Profiles, care plans, and clinical history so every visit starts with full context.',
    },
    {
      icon: 'nurses',
      title: 'Workforce & credentials',
      body: 'Track nurses, qualifications, and availability without juggling multiple tools.',
    },
    {
      icon: 'schedule',
      title: 'Smart scheduling',
      body: 'Match caregivers to patients quickly. See availability and manage shifts in one view.',
    },
    {
      icon: 'security',
      title: 'Compliance & EVV',
      body: 'GPS clock-in, timestamps, and visit notes that keep you audit-ready.',
    },
    {
      icon: 'visits',
      title: 'Caregiver portal',
      body: 'Field staff view schedules, log notes, and sync updates from the mobile app.',
    },
    {
      icon: 'reports',
      title: 'Billing & payroll',
      body: 'Match visits to billing and payroll hours automatically—less manual tracking.',
    },
  ],
};

export const REASONS_CONTENT = FEATURES_CONTENT;

export const AUDIENCE_CONTENT = {
  eyebrow: 'Who it’s for',
  title: 'Built for every role on your care team',
  subtitle:
    'One platform that keeps owners, coordinators, nurses, and admin working from the same live picture of care.',
  items: [
    {
      id: 'owners',
      title: 'Agency owners',
      body: 'See operations at a glance—census, staffing, and billing readiness without chasing updates.',
      accent: 'featured',
    },
    {
      id: 'coordinators',
      title: 'Care coordinators',
      body: 'Schedule visits, assign nurses, and keep documentation moving without phone tag.',
      accent: 'default',
    },
    {
      id: 'nurses',
      title: 'Nurses & caregivers',
      body: 'Get today’s schedule, clock in with GPS, and log care notes from the field.',
      accent: 'default',
    },
    {
      id: 'billing',
      title: 'Billing & admin',
      body: 'Pull visit-backed reports and payroll hours without rebuilding spreadsheets each month.',
      accent: 'default',
    },
  ],
};

export const SECURITY_CONTENT = {
  eyebrow: 'Security',
  title: 'Healthcare-ready by design',
  subtitle: 'Protect patient data and stay ready for audits without slowing your team down.',
  items: [
    {
      title: 'Role-based access',
      body: 'Give each role only the access they need—owners, coordinators, nurses, and billing.',
    },
    {
      title: 'Audit-friendly records',
      body: 'Visit logs, timestamps, and documentation stay organised for reviews and compliance checks.',
    },
    {
      title: 'Electronic Visit Verification',
      body: 'GPS clock-in and clock-out create a clear trail for every visit in the field.',
    },
    {
      title: 'Secure authentication',
      body: 'Protected sign-in and session controls help keep agency and patient data safe.',
    },
  ],
};

export const TESTIMONIALS_CONTENT = {
  eyebrow: 'What customers say',
  title: 'Trusted by homecare leaders',
  items: [
    {
      name: 'Mark Thompson',
      role: 'Clinic Administrator',
      quote:
        'CareSense gave us one place for patients, nurses, and visits. Our monthly reports are ready in a fraction of the time.',
    },
    {
      name: 'Dr. Emily Davis',
      role: 'Medical Director',
      quote:
        'The platform is straightforward for non-technical staff. Training was smooth and our team adopted it quickly.',
    },
    {
      name: 'Sandra Johnson',
      role: 'Director of Nursing',
      quote:
        'Scheduling and nurse assignments are finally predictable. We have visibility without endless phone calls.',
    },
    {
      name: 'Marcus Adeyemi',
      role: 'Operations Lead',
      quote:
        'From onboarding to reporting, everything feels built for real homecare teams — not generic hospital software.',
    },
  ],
};

export const PRICING_CONTENT = {
  heading: 'Simple, transparent pricing',
  description: 'One plan. No tiers. No hidden fees. Just pay per patient.',
  perPatient: {
    price: 'GH₵50',
    unit: 'per patient / month',
    description: 'Full platform access for every patient on your roster. Scale up or down as your census changes.',
    buttonText: 'Get started',
    buttonUrl: '/login',
    features: [
      'Unlimited nurse & staff accounts',
      'Smart scheduling & geographic routing',
      'GPS clock-in & Electronic Visit Verification',
      'Caregiver & family portals',
      'Visit documentation & care plans',
      'Automated billing & payroll reports',
      'Compliance-ready audit trails',
      'Priority support',
    ],
  },
  setup: {
    price: 'GH₵5,000',
    label: 'One-time setup & training',
    description: 'We configure your agency, import your data, and train your team — so you launch with confidence.',
    includes: [
      'Full platform configuration',
      'Patient & staff data migration',
      'On-site or virtual team training',
      'Dedicated onboarding manager',
    ],
  },
  example: {
    label: 'Example',
    text: '20 patients = GH₵1,000/month + GH₵5,000 one-time setup',
  },
};

export const COMPARISON_CONTENT = {
  eyebrow: 'The difference',
  title: 'Why Choose CareSense?',
  columns: ['Feature', 'The Old Way', 'With CareSense'],
  rows: [
    {
      feature: 'Scheduling',
      oldWay: 'Hours of phone tags and spreadsheets',
      newWay: 'Drag-and-drop matching in seconds',
    },
    {
      feature: 'Field Documentation',
      oldWay: 'Lost paper charts and delayed notes',
      newWay: 'Instant, secure updates via the Mobile App',
    },
    {
      feature: 'Compliance & EVV',
      oldWay: 'Missing paperwork and audit anxiety',
      newWay: 'Secure, real-time digital logging',
    },
  ],
};

export const MOBILE_APP_CONTENT = {
  badge: 'Available on iOS & Android',
  title: 'Record every field activity as it happens',
  description:
    'Nurses clock in, log care tasks, capture notes and photos, and sync each visit back to the agency — all in one simple app.',
  playStore: {
    href: 'https://play.google.com/store',
    label: 'Get it on Google Play',
  },
  appStore: {
    href: 'https://apps.apple.com',
    label: 'Download on the App Store',
  },
  mockupSrc: '/mockups/Momo.png',
};

export const FINAL_CTA_CONTENT = {
  title: 'Start running your agency in one place',
  subtitle: 'Set up CareSense, invite your team, and replace the admin chaos.',
  primaryCta: { label: 'Start free', href: '/login' },
  secondaryCta: { label: 'Talk to sales', href: LANDING_PHONE_HREF },
};

export const CTA_CONTENT = {
  eyebrow: 'Get Started',
  title: 'Download our app and transform your homecare workflow today',
  centerScreen: NURSE1_MOCKUP_SRC,
  appStore: {
    href: 'https://apps.apple.com',
    badgeSrc: APP_STORE_BADGE_SRC,
    label: 'Download on the App Store',
  },
  playStore: {
    href: 'https://play.google.com/store',
    badgeSrc: GOOGLE_PLAY_BADGE_SRC,
    label: 'Get it on Google Play',
  },
};

export const FAQ_CONTENT = {
  heading: 'Frequently asked questions',
  items: [
    {
      id: 'faq-what-is-caresense',
      question: 'What is CareSense?',
      answer:
        'CareSense is a homecare operations platform that brings patients, nurses, visits, scheduling, and billing-ready reports into one workspace for agencies and care teams.',
    },
    {
      id: 'faq-who-is-it-for',
      question: 'Who is CareSense for?',
      answer:
        'CareSense is built for homecare agencies, coordinators, nurses in the field, and back-office teams who need one place to manage visits, documentation, and reporting.',
    },
    {
      id: 'faq-mobile-app',
      question: 'Is there a mobile app for nurses?',
      answer:
        'Yes. Nurses can use the CareSense mobile app to view visits, clock in and out with GPS verification, and sync notes and reports to the agency dashboard in real time.',
    },
    {
      id: 'faq-pricing',
      question: 'How does pricing work?',
      answer:
        'Pricing is simple: GH₵50 per patient per month, plus a one-time setup and training fee. See the Pricing section for a full breakdown.',
    },
    {
      id: 'faq-get-started',
      question: 'How do I get started?',
      answer:
        'Create a free account from the Sign In page, set up your agency profile, and invite your team. Our onboarding guides help you add patients, schedule visits, and configure billing.',
    },
    {
      id: 'faq-data-security',
      question: 'Is my data secure?',
      answer:
        'CareSense uses role-based access, audit-friendly records, and secure authentication to help agencies meet compliance needs. Contact us if you need details for your security review.',
    },
    {
      id: 'faq-support',
      question: 'What support do you offer?',
      answer:
        'Starter plans include email support. Standard and Premium plans include priority or dedicated support options. Reach us at +233 535614493 or through your account dashboard.',
    },
  ],
};

export const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Mobile app', href: '#mobile-app' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Sign In', href: '/login' },
];
