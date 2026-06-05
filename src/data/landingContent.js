import { NURSE1_MOCKUP_SRC } from '../constants/brandAssets';

/** Landing page copy, navigation, and section metadata */

export const LANDING_PHONE = '(800) 954-3727';
export const LANDING_PHONE_HREF = 'tel:+18009543727';

export const LANDING_NAV = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'features', label: 'Features', href: '#features' },
  { id: 'testimonials', label: 'Stories', href: '#testimonials' },
];

export const LANDING_NAV_CTA = { label: 'Sign In', href: '/login' };

export const HERO_CONTENT = {
  badge: 'Homecare operations platform',
  title: 'Run your agency with clarity, not chaos',
  titleAccent: 'clarity',
  subtitle:
    'CareSense brings patients, nurses, visits, and billing-ready reports into one calm workspace built for homecare teams.',
  primaryCta: { label: 'Get started free', href: '/login' },
  secondaryCta: { label: 'Book a demo', href: LANDING_PHONE_HREF },
  bullets: [
    'Patient & nurse management in one place',
    'Scheduling and visit tracking that teams actually use',
    'Reports ready for billing and compliance',
  ],
  floatCard: { label: 'Visits this week', value: '1,240+', trend: '+12%' },
};

export const STATS_CONTENT = [
  { value: '100%', label: 'Workforce control' },
  { value: '98%', label: 'On-time visit completion' },
  { value: '40%', label: 'Less admin time on reports' },
  { value: '24/7', label: 'Support when you need it' },
];

export const FEATURES_CONTENT = {
  eyebrow: 'Platform',
  title: 'Everything your homecare team needs, connected',
  subtitle:
    'Replace scattered spreadsheets and phone calls with workflows designed for nurses, coordinators, and billing.',
  items: [
    {
      icon: 'patients',
      title: 'Patient management',
      body: 'Central profiles, care plans, and history so every visit starts with full context.',
    },
    {
      icon: 'nurses',
      title: 'Workforce & credentials',
      body: 'Track nurses, skills, and availability without juggling multiple tools.',
    },
    {
      icon: 'schedule',
      title: 'Smart scheduling',
      body: 'Assign visits with confidence—see conflicts and coverage at a glance.',
    },
    {
      icon: 'visits',
      title: 'Visit documentation',
      body: 'Capture notes and outcomes in the field so back-office work stays light.',
    },
    {
      icon: 'reports',
      title: 'Billing-ready reports',
      body: 'Export summaries your billing team can trust, without manual rework.',
    },
    {
      icon: 'security',
      title: 'Secure & compliant',
      body: 'Role-based access and audit-friendly records built for regulated care.',
    },
  ],
};

export const REASONS_CONTENT = FEATURES_CONTENT;

export const TESTIMONIALS_CONTENT = {
  eyebrow: 'Customer stories',
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
        'From onboarding to reporting, everything feels built for real homecare teams—not generic hospital software.',
    },
  ],
};

export const CTA_CONTENT = {
  eyebrow: 'Nurse mobile app',
  title: 'Your nurses\' daily companion in the field',
  text: 'Schedules, visit check-ins, and patient notes—synced to your agency dashboard in real time.',
  features: [
    'Today\'s visits & routes at a glance',
    'Clock in and out with GPS verification',
    'Notes and reports synced automatically',
  ],
  appScreen: NURSE1_MOCKUP_SRC,
  chips: [
    { label: 'Visits today', value: '12' },
    { label: 'On-time rate', value: '98%' },
  ],
  playStore: {
    href: 'https://play.google.com/store',
    badgeSrc: '/playstore.png',
    label: 'Get it on Google Play',
  },
  webCta: { label: 'Open web dashboard', href: '/login' },
};

export const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '#' },
  { label: 'Sign In', href: '/login' },
];
