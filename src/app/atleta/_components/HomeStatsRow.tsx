"use client";

/**
 * HomeStatsRow — the three home rings (semana / racha / PRs).
 *
 * Replaces `@/components/kronos/AnimatedStats` on the athlete home so the PR
 * ring stops being orange. `AnimatedStats` hardcodes `CHART_COLORS.ember`
 * (#FFB020, the warning token) for PRs and `CHART_COLORS.steel` for the streak
 * — decorative warning colour on a number that is not a warning (audit
 * 2026-09-15, P1 colour, S2).
 *
 * House rule: one brand colour. Intensity is expressed with opacity, never by
 * switching hue (see CLAUDE.md, "Opacidad variable para data viz
 * monocromática").
 */

import { m } from "framer-motion";
import HaloRing from "@/components/kronos/HaloRing";

const LIME = "#C8FF2D";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

/** Fuller rings read brighter; empty ones stay present but quiet. */
function ringOpacity(value: number): number {
  if (value >= 0.7) return 1;
  if (value >= 0.35) return 0.75;
  return 0.5;
}

function Ring({
  value,
  display,
  label,
}: {
  value: number;
  display: string;
  label: string;
}) {
  return (
    <m.div
      className="relative k-card p-2 sm:p-3 flex items-center justify-center min-w-0"
      variants={item}
    >
      <div style={{ opacity: ringOpacity(value) }}>
        <HaloRing
          size={72}
          value={value}
          color={LIME}
          displayValue={display}
          label={label}
        />
      </div>
    </m.div>
  );
}

export function HomeStatsRow({
  weekAttendance,
  weekGoal,
  streak,
  prCount,
}: {
  weekAttendance: number;
  weekGoal: number;
  streak: number;
  prCount: number;
}) {
  const weekRatio = Math.min(1, weekAttendance / Math.max(1, weekGoal));

  return (
    <m.div
      className="relative grid grid-cols-3 gap-2 sm:gap-3 mt-5 px-3 sm:px-4"
      variants={container}
      initial={false}
      animate="show"
    >
      <Ring
        value={weekRatio}
        display={String(weekAttendance)}
        label="ESTA SEMANA"
      />
      <Ring
        value={Math.min(1, streak / 14)}
        display={String(streak)}
        label="RACHA"
      />
      <Ring
        value={Math.min(1, prCount / 10)}
        display={String(prCount)}
        label="PRS"
      />
    </m.div>
  );
}

export default HomeStatsRow;
