import type { ReactNode } from "react";

export type EmptyStateTone = "neutral" | "info" | "warning" | "danger";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: EmptyStateTone;
  className?: string;
};

const TONE_COLOR: Record<EmptyStateTone, string> = {
  neutral: "var(--k-t3)",
  info: "var(--k-warning)",
  warning: "var(--k-t2)",
  danger: "var(--k-danger)",
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: EmptyStateProps) {
  const accent = TONE_COLOR[tone];
  return (
    <div
      className={`k-card flex flex-col items-center justify-center text-center px-6 py-10 gap-3 ${className ?? ""}`}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: `${accent}15`,
          border: `1px solid ${accent}30`,
          color: accent,
        }}
      >
        {icon ?? <DefaultIcon />}
      </div>
      <h3
        className="font-display font-bold text-base leading-tight"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm max-w-sm leading-relaxed"
          style={{ color: "var(--k-t2)" }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
