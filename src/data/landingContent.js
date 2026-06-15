import { APP_STORE_BADGE_SRC, GOOGLE_PLAY_BADGE_SRC, NURSE1_MOCKUP_SRC, PO_IMAGE_SRC } from '../constants/brandAssets';

/** Landing page copy, navigation, and section metadata */

export const LANDING_PHONE = '+233 535614493';
export const LANDING_PHONE_HREF = 'tel:+233535614493';

export const LANDING_NAV = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'features', label: 'Features', href: '#features' },
  { id: 'pricing', label: 'Pricing', href: '#pricing' },
];

export const LANDING_NAV_CTA = { label: 'Sign In', href: '/login' };

export const HERO_CONTENT = {
  badge: 'Homecare operations platform',
  title: 'Run your agency with clarity, not chaos',
  titleAccent: 'clarity',
  subtitle:
    'CareSense unifies patients, nurses, visits, and billing-ready reports into one calm workspace so your team spends less time on admin and more time on care.',
  primaryCta: { label: 'Get started free', href: '/login' },
  secondaryCta: { label: 'Book a demo', href: '/book-demo' },
  trustLine: 'No credit card required. Free plan available.',
};

export const STATS_CONTENT = [
  { value: '81', label: 'Patients managed' },
  { value: '150', label: 'Nurses onboarded' },
  { value: '40%', label: 'Less admin time' },
  { value: '24/7', label: 'Always-on support' },
];

export const TRUSTED_BY = {
  label: 'Trusted by leading care organisations',
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
  title: 'Up and running in three simple steps',
  steps: [
    {
      number: '01',
      title: 'Set up your agency',
      body: 'Create your account, add your agency details, and configure your care regions in minutes.',
    },
    {
      number: '02',
      title: 'Onboard your team',
      body: 'Invite nurses, assign roles, and upload credentials. Your workforce is organised from day one.',
    },
    {
      number: '03',
      title: 'Manage & deliver care',
      body: 'Schedule visits, track attendance, document outcomes, and generate billing-ready reports — all in one place.',
    },
  ],
};

export const FEATURES_CONTENT = {
  eyebrow: 'Platform',
  title: 'Everything your homecare team needs',
  subtitle:
    'Replace scattered spreadsheets and phone calls with workflows designed for nurses, coordinators, and billing.',
  items: [
    {
      icon: 'patients',
      title: 'Patient management',
      body: 'Central profiles, care plans, and clinical history so every visit starts with full context.',
    },
    {
      icon: 'nurses',
      title: 'Workforce & credentials',
      body: 'Track nurses, qualifications, and availability without juggling multiple tools.',
    },
    {
      icon: 'schedule',
      title: 'Smart & fast scheduling',
      body: 'Match the right caregiver with the right patient instantly. View real-time availability, manage shift swaps, and reduce travel time with geographic routing.',
    },
    {
      icon: 'security',
      title: 'Bulletproof compliance & EVV',
      body: 'Stay audit-ready 24/7. Our built-in Electronic Visit Verification (EVV) tracks locations, timestamps, and care notes securely and effortlessly.',
    },
    {
      icon: 'visits',
      title: 'Caregiver & client portals',
      body: 'Keep everyone in the loop. Caregivers can access schedules and log notes on the go, while families get peace of mind through real-time updates.',
    },
    {
      icon: 'reports',
      title: 'Automated billing & payroll',
      body: 'Say goodbye to manual tracking. CareSense automatically matches clock-ins to billing codes and payroll hours, cutting your admin time in half.',
    },
  ],
};

export const REASONS_CONTENT = FEATURES_CONTENT;

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
  eyebrow: 'For Nurses & Caregivers',
  title: 'The CareSense Nurse & Caregiver App',
  subtitle: 'Point-of-Care Power, Right in Their Pocket.',
  description:
    'Give your field staff the ultimate tool to succeed. Our lightweight, HIPAA-compliant mobile app is custom-built for nurses and caregivers, ensuring they have everything they need to provide top-tier care without the paperwork burden.',
  features: [
    {
      title: 'Offline Care Logging',
      text: 'Nurses can document care plans, fill out clinical assessments, and capture signatures even in areas with zero cell service. The app syncs automatically once connection is restored.',
    },
    {
      title: 'Instant Schedule & Route Updates',
      text: 'No more text threads or missed shifts. Caregivers view their daily schedule, receive real-time updates, and get turn-by-turn GPS routing to their next patient.',
    },
    {
      title: 'One-Tap EVV Compliance',
      text: 'Clocking in and out automatically logs geographic verification and timestamps, completely automating your Electronic Visit Verification mandate.',
    },
    {
      title: 'Secure Shift Notes & Chat',
      text: 'Nurses can safely log patient vitals, upload secure photo documentation, and chat instantly with the agency office or the care coordination team.',
    },
  ],
  playStore: {
    href: 'https://play.google.com/store',
    badgeSrc: GOOGLE_PLAY_BADGE_SRC,
    label: 'Get it on Google Play',
  },
  mockupSrc: NURSE1_MOCKUP_SRC,
};

export const FINAL_CTA_CONTENT = {
  title: 'Ready to transform your homecare operations?',
  subtitle: 'Join agencies already using CareSense to deliver better care with less admin.',
  primaryCta: { label: 'Get started free', href: '/login' },
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
        'We offer Starter, Standard, and Premium plans with monthly or yearly billing. You can start on the free Starter plan and upgrade as your agency grows. See the Pricing section for details.',
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
  { label: 'Pricing', href: '#pricing' },
  { label: 'Mobile app', href: '#mobile-app' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '#' },
  { label: 'Sign In', href: '/login' },
];
