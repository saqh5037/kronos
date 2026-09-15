/**
 * The badge glyph system the audit found missing.
 *
 * Before: unlocked badges rendered two-letter text codes ("RW", "FP", "S7")
 * in the same treatment as locked ones, so a trophy and an empty shelf looked
 * identical. Now every badge resolves to a lucide icon, unlocked is a lime fill
 * and locked is an outline in `--k-t3`.
 */

import {
  Award,
  CalendarCheck,
  Dumbbell,
  Flame,
  Footprints,
  Lock,
  Medal,
  Repeat,
  ShieldCheck,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { BadgeIconName } from "@/lib/badges/progress";

const ICONS: Record<BadgeIconName, LucideIcon> = {
  Award,
  CalendarCheck,
  Flame,
  TrendingUp,
  ShieldCheck,
  Dumbbell,
  Medal,
  Footprints,
  Repeat,
  Target,
};

export function BadgeGlyph({
  icon,
  unlocked,
  size = 44,
}: {
  icon: BadgeIconName;
  unlocked: boolean;
  size?: number;
}) {
  const Icon = unlocked ? ICONS[icon] : Lock;
  const inner = Math.round(size * 0.44);

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        background: unlocked ? "var(--k-accent)" : "transparent",
        border: unlocked
          ? "1px solid var(--k-accent)"
          : "1px solid var(--k-line-2)",
        color: unlocked ? "var(--k-accent-on)" : "var(--k-t3)",
        boxShadow: unlocked ? "var(--k-accent-glow)" : undefined,
      }}
    >
      <Icon size={inner} strokeWidth={unlocked ? 2.2 : 1.8} />
    </div>
  );
}
