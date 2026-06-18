// Inline SVG icon set (Lucide-style: 24x24, stroke 1.75, currentColor).
// Hand-authored to avoid adding a dependency. Each component accepts
// size and any extra props (className, style, etc.).

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const make = (paths) => function Icon({ size = 24, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      {paths}
    </svg>
  );
};

export const LayoutDashboard = make(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </>
);

export const Receipt = make(
  <>
    <path d="M4 2v20l2.5-1.5L9 22l2.5-1.5L14 22l2.5-1.5L19 22l1-1.5V2H4z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </>
);

export const BookOpen = make(
  <>
    <path d="M2 3h6.5a3.5 3.5 0 0 1 3.5 3.5V21" />
    <path d="M22 3h-6.5a3.5 3.5 0 0 0-3.5 3.5V21" />
    <path d="M2 3v18h6.5a3.5 3.5 0 0 1 3.5 0" />
    <path d="M22 3v18h-6.5a3.5 3.5 0 0 0-3.5 0" />
  </>
);

export const Wallet = make(
  <>
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9" />
    <path d="M21 12h-4a2 2 0 0 0 0 4h4" />
    <circle cx="17" cy="14" r="0.8" fill="currentColor" />
  </>
);

export const Package = make(
  <>
    <path d="M16.5 9.4 7.5 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </>
);

export const Users = make(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);

export const HandCoins = make(
  <>
    <path d="M11 15h2a2 2 0 1 0 0-4h-3" />
    <path d="M19 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    <path d="M8 9h2" />
    <path d="M8 13h2" />
    <circle cx="17" cy="11" r="2" />
  </>
);

export const CalendarHeart = make(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
    <path d="M12 17.5c-1.5-1-3-2.2-3-3.7a1.5 1.5 0 0 1 3-.6 1.5 1.5 0 0 1 3 .6c0 1.5-1.5 2.7-3 3.7z" />
  </>
);

export const Settings = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>
);

export const Sun = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </>
);

export const Moon = make(
  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
);

export const Store = make(
  <>
    <path d="M3 9l1.5-5h15L20 9" />
    <path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
    <path d="M9 21V12h6v9" />
  </>
);

export const ShieldAlert = make(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </>
);

export const ArrowRight = make(
  <>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </>
);

export const TrendingUp = make(
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>
);

export const TrendingDown = make(
  <>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </>
);

export const Banknote = make(
  <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01" />
    <path d="M18 12h.01" />
  </>
);

export const ArrowUpRight = make(
  <>
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </>
);

export const ArrowDownRight = make(
  <>
    <path d="M7 7 17 17" />
    <path d="M17 7v10H7" />
  </>
);

export const FileText = make(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="14" y2="17" />
  </>
);

export const LogOut = make(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>
);

export const Download = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
);

export const X = make(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
);

export const CheckCircle2 = make(
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </>
);
