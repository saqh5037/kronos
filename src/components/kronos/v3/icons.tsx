import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export const Icon = {
  Dashboard: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  Users: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 21c1-3.5 3.5-5 6-5s5 1.5 6 5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M16 14c2.5 0 4.5 1.5 5 4" />
    </svg>
  ),
  Calendar: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  ),
  Pin: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M12 21v-7M7 14h10l-1-7H8z" />
      <circle cx="12" cy="4" r="1.5" />
    </svg>
  ),
  Check: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M5 12l4 4 10-10" />
    </svg>
  ),
  Card: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <path d="M3 11h18M7 15h3" />
    </svg>
  ),
  Mail: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  ),
  Chart: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M3 21h18M5 17v-6M10 17V7M15 17v-9M20 17V11" />
    </svg>
  ),
  Settings: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1.1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  ),
  History: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  ),
  Search: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  Bell: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 7 2 7H4s2-2 2-7zM10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  Down: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Up: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M5 15l7-7 7 7" />
    </svg>
  ),
  Right: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  Download: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
    </svg>
  ),
  Alert: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  ),
  Theme: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M20 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9z" />
    </svg>
  ),
  Back: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M14 6l-6 6 6 6M8 12h12" />
    </svg>
  ),
  Share: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M12 4v12M7 9l5-5 5 5M5 14v5h14v-5" />
    </svg>
  ),
  Filter: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  ),
  Arrow: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Chevron: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  CalX: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 9h18M8 3v4M16 3v4M9 14l6 4M15 14l-6 4" />
    </svg>
  ),
  MovRun: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <circle cx="15" cy="4.5" r="1.8" />
      <path d="M13 8l-3 3 3 3v5M10 11l-4 1M13 14l4 2-1 4" />
    </svg>
  ),
  MovKB: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M10 4h4M9 4v3M15 4v3M6 11a6 6 0 0112 0v6a2 2 0 01-2 2H8a2 2 0 01-2-2z" />
    </svg>
  ),
  MovPull: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M3 5h18M7 5v3M17 5v3M9 8h6v3a3 3 0 01-6 0zM12 11v5M10 21h4" />
    </svg>
  ),
  Home: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    </svg>
  ),
  Bolt: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M13 3 4 14h7l-1 7 9-11h-7z" />
    </svg>
  ),
  User: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  Instagram: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM17.5 6.5h.01" />
    </svg>
  ),
  Facebook: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M18 2h-3a6 6 0 0 0-6 6v3H6v4h3v8h4v-8h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  TikTok: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4M15.502 1.94s.503 1.977 1.97 2.29" />
    </svg>
  ),
  Google: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M6 12h12" />
    </svg>
  ),
  Left: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  Dumbbell: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      {...p}
    >
      <rect x="2" y="9" width="3" height="6" />
      <rect x="5" y="7" width="3" height="10" />
      <rect x="16" y="7" width="3" height="10" />
      <rect x="19" y="9" width="3" height="6" />
      <path d="M8 12h8" />
    </svg>
  ),
  Trophy: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M8 4h8v6a4 4 0 0 1-8 0z" />
      <path d="M16 6h3v2a3 3 0 0 1-3 3M8 6H5v2a3 3 0 0 0 3 3M10 14h4v3h-4zM7 20h10" />
    </svg>
  ),
  Bars: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M4 20V10M10 20V4M16 20v-8M22 20v-4" />
    </svg>
  ),
  Phone: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
  Globe: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
    </svg>
  ),
  Logout: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M14 8V5H4v14h10v-3M9 12h12m0 0l-3-3m3 3l-3 3" />
    </svg>
  ),
  Target: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Muscle: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...p}
    >
      <path d="M6 13.5V6a2 2 0 0 1 2-2h1v9.5M16 13.5V6a2 2 0 0 0-2-2h-1v9.5M11 6v11.5M13 6v11.5M8 17.5h8" />
    </svg>
  ),
  AppleHealth: (p: Props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      {...p}
    >
      <path d="M12 2c3 0 7 1 7 4s-2 6-7 8c-5-2-7-5-7-8s4-4 7-4zM12 10c2 1 4 2 4 4s-1 3-4 4c-3-1-4-2-4-4s2-3 4-4zM12 18v3M9 21h6" />
    </svg>
  ),
};
