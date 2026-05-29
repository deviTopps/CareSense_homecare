/**
 * Targeted in-app guide steps — each step highlights a UI element via [data-guide="…"].
 */
export const TARGETED_GUIDE_STORAGE_KEY = 'caresense.targetedGuide.dismissed';

export const TARGETED_GUIDE_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to CareSense',
    body: 'This quick tour points to the main areas of your workspace. Use Next to continue or Skip anytime.',
    target: null,
    route: '/dashboard',
    placement: 'center',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    body: 'Your home view — track admissions, alerts, and daily activity at a glance.',
    target: 'nav-dashboard',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'patients',
    title: 'Patients',
    body: 'Register patients, complete admissions, and open full care records.',
    target: 'nav-patients',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'nurses',
    title: 'Nurses',
    body: 'Onboard your care team, manage credentials, and open nurse profiles.',
    target: 'nav-workforce',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'visits',
    title: 'Care Visits',
    body: 'Schedule and manage patient visits for your nurses.',
    target: 'nav-scheduling',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'enquiries',
    title: 'Enquiries',
    body: 'Create and follow up on enquiries from families or referrers.',
    target: 'topbar-enquiry',
    route: '/dashboard',
    placement: 'bottom',
  },
  {
    id: 'reports',
    title: 'Reports',
    body: 'Generate and download medical reports for your patients.',
    target: 'nav-reports',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'billing',
    title: 'Billing',
    body: 'Manage your plan, load your wallet, and view payment history.',
    target: 'nav-billing',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'settings',
    title: 'Settings',
    body: 'Update agency details, logo, password, and appearance.',
    target: 'nav-account',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'guide-btn',
    title: 'You\'re all set',
    body: 'Reopen this tour anytime from the Guide button in the top bar.',
    target: 'topbar-guide',
    route: '/dashboard',
    placement: 'bottom',
  },
];
