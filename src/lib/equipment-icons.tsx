import type { ReactElement, SVGProps } from "react";

type IconProps = { size?: number } & Omit<SVGProps<SVGSVGElement>, "size">;

const baseProps = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

const icons: Record<string, (size: number) => ReactElement> = {
  barbell: (s) => (
    <svg {...baseProps(s)}>
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <rect x="5" y="8" width="2.5" height="8" rx="0.5" />
      <rect x="16.5" y="8" width="2.5" height="8" rx="0.5" />
      <rect x="7.5" y="10" width="9" height="4" rx="0.5" />
    </svg>
  ),
  plates: (s) => (
    <svg {...baseProps(s)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  dumbbell: (s) => (
    <svg {...baseProps(s)}>
      <rect x="2" y="9" width="3" height="6" rx="0.5" />
      <rect x="19" y="9" width="3" height="6" rx="0.5" />
      <rect x="5" y="10.5" width="2" height="3" />
      <rect x="17" y="10.5" width="2" height="3" />
      <rect x="7" y="11" width="10" height="2" />
    </svg>
  ),
  kettlebell: (s) => (
    <svg {...baseProps(s)}>
      <path d="M9 5h6a1 1 0 0 1 1 1v1a4 4 0 0 1-1 2.7" />
      <path d="M9 5a1 1 0 0 0-1 1v1a4 4 0 0 0 1 2.7" />
      <circle cx="12" cy="15" r="6" />
    </svg>
  ),
  rack: (s) => (
    <svg {...baseProps(s)}>
      <path d="M5 4v16" />
      <path d="M19 4v16" />
      <path d="M5 9h14" />
      <path d="M5 13h14" />
    </svg>
  ),
  bench: (s) => (
    <svg {...baseProps(s)}>
      <rect x="3" y="9" width="18" height="3" rx="0.5" />
      <path d="M5 12v8" />
      <path d="M19 12v8" />
    </svg>
  ),
  "pull-up bar": (s) => (
    <svg {...baseProps(s)}>
      <path d="M3 5h18" />
      <path d="M5 5v14" />
      <path d="M19 5v14" />
      <path d="M9 8v4" />
      <path d="M15 8v4" />
    </svg>
  ),
  "pull up bar": (s) => (
    <svg {...baseProps(s)}>
      <path d="M3 5h18" />
      <path d="M5 5v14" />
      <path d="M19 5v14" />
      <path d="M9 8v4" />
      <path d="M15 8v4" />
    </svg>
  ),
  rope: (s) => (
    <svg {...baseProps(s)}>
      <path d="M8 3c2 2 2 4 0 6s-2 4 0 6 2 4 0 6" />
      <path d="M16 3c-2 2-2 4 0 6s2 4 0 6-2 4 0 6" />
    </svg>
  ),
  box: (s) => (
    <svg {...baseProps(s)}>
      <rect x="3" y="6" width="18" height="14" rx="1" />
      <path d="M3 10h18" />
    </svg>
  ),
  wallball: (s) => (
    <svg {...baseProps(s)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2.5 3 2.5 13 0 16" />
      <path d="M12 4c-2.5 3-2.5 13 0 16" />
    </svg>
  ),
  "rowing machine": (s) => (
    <svg {...baseProps(s)}>
      <path d="M3 14h18" />
      <circle cx="6" cy="14" r="2" />
      <circle cx="18" cy="14" r="2" />
      <path d="M9 14l4-7" />
      <circle cx="13" cy="6" r="1.5" />
    </svg>
  ),
  rower: (s) => (
    <svg {...baseProps(s)}>
      <path d="M3 14h18" />
      <circle cx="6" cy="14" r="2" />
      <circle cx="18" cy="14" r="2" />
      <path d="M9 14l4-7" />
      <circle cx="13" cy="6" r="1.5" />
    </svg>
  ),
  bike: (s) => (
    <svg {...baseProps(s)}>
      <circle cx="6" cy="16" r="4" />
      <circle cx="18" cy="16" r="4" />
      <path d="M6 16l4-7h6" />
      <path d="M14 9h4l-2-3" />
    </svg>
  ),
  running: (s) => (
    <svg {...baseProps(s)}>
      <circle cx="14" cy="5" r="1.6" />
      <path d="M9 11l3-3 3 2 3-1" />
      <path d="M12 8l-2 5 4 2v5" />
      <path d="M9 14l-3 3" />
    </svg>
  ),
  "jump rope": (s) => (
    <svg {...baseProps(s)}>
      <path d="M5 6c4 6 10 6 14 0" />
      <path d="M5 18c4-6 10-6 14 0" />
      <circle cx="5" cy="6" r="1.2" />
      <circle cx="19" cy="6" r="1.2" />
    </svg>
  ),
  "medicine ball": (s) => (
    <svg {...baseProps(s)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M5 9c4-2 10-2 14 0" />
      <path d="M5 15c4 2 10 2 14 0" />
    </svg>
  ),
  abmat: (s) => (
    <svg {...baseProps(s)}>
      <path d="M3 16c3-6 15-6 18 0" />
      <path d="M3 16h18" />
    </svg>
  ),
  bands: (s) => (
    <svg {...baseProps(s)}>
      <path d="M5 8c4 0 4 8 0 8" />
      <path d="M19 8c-4 0-4 8 0 8" />
      <path d="M9 8h6" />
      <path d="M9 16h6" />
    </svg>
  ),
  mat: (s) => (
    <svg {...baseProps(s)}>
      <rect x="3" y="9" width="18" height="6" rx="1" />
      <path d="M7 9v6" />
      <path d="M17 9v6" />
    </svg>
  ),
  rings: (s) => (
    <svg {...baseProps(s)}>
      <circle cx="8" cy="14" r="4" />
      <circle cx="16" cy="14" r="4" />
      <path d="M8 4v6" />
      <path d="M16 4v6" />
    </svg>
  ),
  parallettes: (s) => (
    <svg {...baseProps(s)}>
      <path d="M4 14h6" />
      <path d="M14 14h6" />
      <path d="M4 14v4" />
      <path d="M10 14v4" />
      <path d="M14 14v4" />
      <path d="M20 14v4" />
    </svg>
  ),
  "peg board": (s) => (
    <svg {...baseProps(s)}>
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <circle cx="10" cy="8" r="0.8" />
      <circle cx="14" cy="8" r="0.8" />
      <circle cx="10" cy="12" r="0.8" />
      <circle cx="14" cy="12" r="0.8" />
      <circle cx="10" cy="16" r="0.8" />
      <circle cx="14" cy="16" r="0.8" />
    </svg>
  ),
  sled: (s) => (
    <svg {...baseProps(s)}>
      <path d="M3 17h14l3-3" />
      <path d="M5 17v-3" />
      <path d="M14 17v-3" />
      <path d="M5 14h9" />
      <path d="M9 14v-4" />
    </svg>
  ),
  tire: (s) => (
    <svg {...baseProps(s)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 4v4" />
      <path d="M12 16v4" />
      <path d="M4 12h4" />
      <path d="M16 12h4" />
    </svg>
  ),
  yoke: (s) => (
    <svg {...baseProps(s)}>
      <path d="M4 8h16" />
      <path d="M6 8v12" />
      <path d="M18 8v12" />
      <path d="M9 8v4" />
      <path d="M15 8v4" />
    </svg>
  ),
  sandbag: (s) => (
    <svg {...baseProps(s)}>
      <path d="M7 8c0-2 2-3 5-3s5 1 5 3" />
      <path d="M5 20c0-6 2-12 7-12s7 6 7 12" />
    </svg>
  ),
  "slam ball": (s) => (
    <svg {...baseProps(s)}>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 6V3" />
      <path d="M9 4l-2-2" />
      <path d="M15 4l2-2" />
    </svg>
  ),
};

const fallback = (size: number): ReactElement => (
  <svg {...baseProps(size)}>
    <circle cx="12" cy="12" r="2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export function EquipmentIcon({
  name,
  size = 16,
  ...rest
}: { name: string } & IconProps) {
  const key = name.toLowerCase().trim();
  const render = icons[key] ?? fallback;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        color: "currentColor",
      }}
      {...(rest as object)}
    >
      {render(size)}
    </span>
  );
}
