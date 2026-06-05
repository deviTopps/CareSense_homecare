const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true };

export function FeatureIcon({ name }) {
  switch (name) {
    case 'patients':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'nurses':
      return (
        <svg {...iconProps}>
          <path
            d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5.2L12 14.8 7.5 17l.9-5.2L4.8 8.2l5-.7L12 3z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'schedule':
      return (
        <svg {...iconProps}>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'visits':
      return (
        <svg {...iconProps}>
          <path
            d="M4 12h16M12 4v16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            opacity="0"
          />
          <path
            d="M7 14l3 3 7-7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...iconProps}>
          <path
            d="M8 4h8l4 4v12H4V4h4z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M16 4v4h4M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'security':
      return (
        <svg {...iconProps}>
          <path
            d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
