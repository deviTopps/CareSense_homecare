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
  brand: 'Trusted By Homecare Agencies In Ghana',
  title: 'Run your homecare agency with calm clarity',
  titleAccent: 'calm clarity',
  subtitle:
    'An operations platform that brings patients, nurses, visits, scheduling, and clinical safety monitoring into one workspace for agencies and the care teams behind them',
  primaryCta: { label: 'Start free', href: '/login' },
  secondaryCta: { label: 'Book a demo', href: '/book-demo' },
  highlights: ['Smart scheduling', 'GPS visit verification', 'Billing ready reports'],
};

export const STATS_CONTENT = [
  { value: '81+', label: 'Patients managed' },
  { value: '150+', label: 'Nurses onboarded' },
  { value: '40%', label: 'Less admin time' },
  { value: '24/7', label: 'Support available' },
];

export const TRUSTED_BY = {
  eyebrow: 'Built for the whole team',
  label: 'Built for modern homecare agencies',
  lead: 'From the office to the field, every role stays connected on one platform.',
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
      src: '/mockups/optimized/solution-dashboard.webp',
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
      title: 'Run day to day care',
      body: 'Schedule visits, track attendance, document outcomes, and export billing reports.',
    },
  ],
};

export const FEATURES_CONTENT = {
  eyebrow: 'Features',
  titleLine1: 'Covering the Full Spectrum',
  titleAccent: 'Homecare',
  titleLine2Prefix: 'of',
  titleLine2Rest: 'Operations',
  cta: { label: 'Learn more', href: '#how-it-works' },
  items: [
    {
      title: 'Patient\nManagement',
      body: 'Profiles, care plans, and clinical history so every visit starts with full context.',
      href: '#how-it-works',
      imageSrc: '/images/optimized/female-nurse.webp',
      imageAlt: 'Nurse supporting an older patient during a home visit',
    },
    {
      title: 'Workforce &\nCredentials',
      body: 'Track nurses, qualifications, and availability without juggling multiple tools.',
      href: '#how-it-works',
      imageSrc: '/images/optimized/audience-agency.webp',
      imageAlt: 'Agency team coordinating care operations together',
    },
    {
      title: 'Smart\nScheduling',
      body: 'Match caregivers to patients quickly. See availability and manage shifts in one view.',
      href: '#how-it-works',
      imageSrc: '/images/optimized/elderly-care.webp',
      imageAlt: 'Caregiver assisting a senior with daily care at home',
    },
    {
      title: 'Compliance\n& EVV',
      body: 'GPS clock in, timestamps, and visit notes that keep you audit ready.',
      href: '#security',
      imageSrc: '/images/optimized/health-worker.webp',
      imageAlt: 'Health worker providing care to an elderly patient',
    },
    {
      title: 'Caregiver\nPortal',
      body: 'Field staff view schedules, log notes, and sync updates from the mobile app.',
      href: '#mobile-app',
      imageSrc: '/images/optimized/nurse-mockup.jpg',
      imageAlt: 'CareSense caregiver mobile app on a phone',
    },
    {
      title: 'Billing &\nPayroll',
      body: 'Match visits to billing and payroll hours automatically, with less manual tracking.',
      href: '#pricing',
      imageSrc: '/images/optimized/problem-po.webp',
      imageAlt: 'Homecare operations and billing workflow overview',
    },
    {
      title: 'Clinical Red\nFlags Alerts',
      body: 'Get notified when vitals or visit notes signal risk, so your team can act before issues escalate.',
      href: '#security',
      imageSrc: '/images/optimized/elderly-care-2.webp',
      imageAlt: 'Senior receiving attentive care during a home visit',
    },
    {
      title: 'Automated\nMedical Records',
      body: 'Turn visit activity into clear medical records without rebuilding charts by hand after every shift.',
      href: '#how-it-works',
      imageSrc: '/mockups/optimized/HomePage.webp',
      imageAlt: 'CareSense dashboard showing care records and visits',
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
      body: 'See operations at a glance, including census, staffing, and billing readiness without chasing updates.',
      accent: 'featured',
      imageSrc: '/images/optimized/audience-agency.webp',
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
      body: 'Pull visit backed reports and payroll hours without rebuilding spreadsheets each month.',
      accent: 'default',
    },
  ],
};

export const SECURITY_CONTENT = {
  eyebrow: 'Security',
  title: 'Healthcare ready by design',
  subtitle: 'Protect patient data and stay ready for audits without slowing your team down.',
  items: [
    {
      title: 'Role based access',
      body: 'Give each role only the access they need, including owners, coordinators, nurses, and billing.',
    },
    {
      title: 'Audit friendly records',
      body: 'Visit logs, timestamps, and documentation stay organised for reviews and compliance checks.',
    },
    {
      title: 'Electronic Visit Verification',
      body: 'GPS clock in and clock out create a clear trail for every visit in the field.',
    },
    {
      title: 'Secure authentication',
      body: 'Protected sign in and session controls help keep agency and patient data safe.',
    },
  ],
};

export const TESTIMONIALS_CONTENT = {
  badge: 'Testimonials',
  title: "Our Client's Feedback",
  subtitle: 'See how CareSense is helping agencies grow',
  ctaLabel: 'More Case Studies',
  ctaHref: '/book-demo',
  items: [
    {
      name: 'Mark Thompson',
      role: 'Clinic Administrator',
      quote: 'CareSense ranked our ops with clearer visit control.',
      rankTag: 'Faster monthly reporting',
      caseStudyHref: '/book-demo',
    },
    {
      name: 'Dr. Emily Davis',
      role: 'Medical Director',
      quote: 'CareSense made training simple for our whole team!',
      rankTag: 'Smooth staff onboarding',
      caseStudyHref: '/book-demo',
    },
    {
      name: 'Sandra Johnson',
      role: 'Director of Nursing',
      quote: 'CareSense made nurse scheduling finally predictable.',
      rankTag: 'Reliable field coverage',
      caseStudyHref: '/book-demo',
    },
    {
      name: 'Marcus Adeyemi',
      role: 'Operations Lead',
      quote: 'CareSense feels built for real homecare teams.',
      rankTag: 'One shared workspace',
      caseStudyHref: '/book-demo',
    },
    {
      name: 'Ama Mensah',
      role: 'Agency Owner',
      quote: 'CareSense cut our admin chase across every visit.',
      rankTag: 'Less paperwork chaos',
      caseStudyHref: '/book-demo',
    },
    {
      name: 'Kwesi Boateng',
      role: 'Care Coordinator',
      quote: 'CareSense keeps every nurse visit visible in one place.',
      rankTag: 'Live visit visibility',
      caseStudyHref: '/book-demo',
    },
  ],
};

export const PRICING_CONTENT = {
  title: 'Select a Plan',
  ctaLabel: 'Get started',
  ctaHref: '/login',
  billing: {
    monthly: 'Monthly',
    yearly: 'Yearly',
    discountBadge: '20% OFF',
    yearlyDiscount: 0.2,
  },
  stepper: {
    label: 'Patients',
    subLabel: 'Starting at 10 patients',
    min: 10,
    step: 1,
    defaultValue: 10,
  },
  plans: [
    {
      id: 'setup',
      name: 'Initial Setup Cost',
      subtitle: 'One time cost',
      monthlyPrice: 5000,
      currency: 'GH₵',
      unitLabel: 'One time',
      billingType: 'oneTime',
      features: [
        'Full platform configuration',
        'Patient and staff data migration',
        'On site or virtual team training',
      ],
    },
    {
      id: 'standard',
      name: 'Standard',
      subtitle: 'For growing agencies',
      monthlyPrice: 50,
      currency: 'GH₵',
      unitLabel: 'Patient | Month',
      defaultSelected: true,
      features: [
        'Unlimited nurse and staff accounts',
        'GPS clock in and Electronic Visit Verification',
        'Billing and payroll reports',
        'Clinical Red Flags Alerts',
        'Automated Medical Records Generation',
      ],
    },
    {
      id: 'advanced',
      name: 'Advanced',
      subtitle: 'For large agencies',
      monthlyPrice: 65,
      currency: 'GH₵',
      unitLabel: 'Patient | Month',
      features: [
        'Everything in Standard',
        'Clinical Red Flags Alerts',
        'Automated Medical Records Generation',
        'Priority support',
        'Dedicated onboarding manager',
      ],
    },
  ],
  setupNote: 'Setup is a one time cost. Plans are billed per patient.',
};

export const COMPARISON_CONTENT = {
  eyebrow: 'The difference',
  title: 'Why Choose CareSense?',
  columns: ['Feature', 'The Old Way', 'With CareSense'],
  rows: [
    {
      feature: 'Scheduling',
      oldWay: 'Hours of phone tags and spreadsheets',
      newWay: 'Drag and drop matching in seconds',
    },
    {
      feature: 'Field Documentation',
      oldWay: 'Lost paper charts and delayed notes',
      newWay: 'Instant, secure updates via the Mobile App',
    },
    {
      feature: 'Compliance & EVV',
      oldWay: 'Missing paperwork and audit anxiety',
      newWay: 'Secure, real time digital logging',
    },
  ],
};

export const MOBILE_APP_CONTENT = {
  badge: 'Available on iOS & Android',
  title: 'Record every field activity as it happens',
  description:
    'Nurses clock in, log care tasks, capture notes and photos, and sync each visit back to the agency, all in one simple app.',
  playStore: {
    href: 'https://play.google.com/store/apps/details?id=caresense.health',
    label: 'Get it on Google Play',
  },
  appStore: {
    href: 'https://apps.apple.com',
    label: 'Download on the App Store',
  },
  mockupSrc: '/mockups/optimized/Momo.webp',
};

export const FINAL_CTA_CONTENT = {
  badge: 'Ready when you are',
  title: 'Start running your agency in one place',
  subtitle: 'Set up CareSense, invite your team, and replace the admin chaos.',
  highlights: ['Live in days', 'Per patient pricing', 'Setup support included'],
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
    href: 'https://play.google.com/store/apps/details?id=caresense.health',
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
        'CareSense is a homecare operations platform that brings patients, nurses, visits, scheduling, and billing ready reports into one workspace for agencies and care teams.',
    },
    {
      id: 'faq-who-is-it-for',
      question: 'Who is CareSense for?',
      answer:
        'CareSense is built for homecare agencies, coordinators, nurses in the field, and back office teams who need one place to manage visits, documentation, and reporting.',
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
        'Choose Standard or Advanced based on your agency size, plus a one time Initial Setup Cost of GH₵5,000. Billing is per patient, with Monthly or Yearly options. See the Pricing section for details.',
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
        'CareSense uses role based access, audit friendly records, and secure authentication to help agencies meet compliance needs. Contact us if you need details for your security review.',
    },
    {
      id: 'faq-support',
      question: 'What support do you offer?',
      answer:
        'Starter plans include email support. Standard and Premium plans include priority or dedicated support options. Reach us at +233 535614493 or through your account dashboard.',
    },
  ],
};

export const FOOTER_CONTENT = {
  banner: {
    title: 'Let CareSense take the busywork off your team’s plate',
    subtitle:
      'From scheduling and documents to visit notes and reports, automate the tasks your team should not be doing manually.',
    cta: { label: 'Start free', href: '/login' },
  },
  brand: {
    description:
      'CareSense helps homecare agencies run patients, nurses, visits, and reporting in one clear workspace.',
    social: [
      { id: 'facebook', label: 'Facebook', href: 'https://facebook.com' },
      { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com' },
      { id: 'instagram', label: 'Instagram', href: 'https://instagram.com' },
      { id: 'telegram', label: 'Telegram', href: 'https://t.me' },
    ],
  },
  columns: [
    {
      title: 'Company',
      links: [
        { label: 'Home', href: '#home' },
        { label: 'About us', href: '#audience' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Book a demo', href: '/book-demo' },
      ],
    },
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Security', href: '#security' },
        { label: 'Mobile app', href: '#mobile-app' },
        { label: 'Contact', href: LANDING_PHONE_HREF },
      ],
    },
  ],
  newsletter: {
    title: 'Newsletter',
    description: 'Get tips, product updates, and insights on running a smarter homecare agency.',
    placeholder: 'Email address',
    buttonLabel: 'Subscribe',
  },
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/privacy' },
    { label: 'Security', href: '#security' },
    { label: 'Cookie', href: '#cookie' },
  ],
  copyright: 'Data Leap Technologies Inc. All rights reserved.',
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
