import type { LucideIcon } from "lucide-react";

/**
 * Shared "sin datos todavía" body for a wearable section. The calling card
 * owns the header/icon and stays visible even when empty — only the body
 * swaps, so the section never collapses to nothing (audit 2026-09-16 task:
 * "the calling page owns the empty state, not the chart").
 */
export function SectionHeader({ label }: { label: string }) {
  return <div className="k-eyebrow">{label}</div>;
}

export function SectionEmpty({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 text-center"
      style={{ padding: "22px 12px" }}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden color="var(--k-t3)" />
      <p className="text-xs" style={{ color: "var(--k-t3)", lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  );
}
