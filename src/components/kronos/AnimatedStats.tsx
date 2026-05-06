"use client";

import { motion } from "framer-motion";
import { CHART_COLORS } from "@/components/charts/tokens";
import HaloRing from "./HaloRing";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export function AnimatedStats({
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
  const weekRatio = Math.min(1, weekAttendance / weekGoal);

  return (
    <motion.div
      className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 px-3 sm:px-4"
      variants={container}
      initial={false}
      animate="show"
    >
      <motion.div
        className="k-card p-2 sm:p-3 flex items-center justify-center min-w-0"
        variants={item}
      >
        <HaloRing
          size={72}
          value={weekRatio}
          color={CHART_COLORS.moss}
          displayValue={String(weekAttendance)}
          label="ESTA SEM"
        />
      </motion.div>
      <motion.div
        className="k-card p-2 sm:p-3 flex items-center justify-center min-w-0"
        variants={item}
      >
        <HaloRing
          size={72}
          value={Math.min(1, streak / 14)}
          color={CHART_COLORS.steel}
          displayValue={String(streak)}
          label="RACHA"
        />
      </motion.div>
      <motion.div
        className="k-card p-2 sm:p-3 flex items-center justify-center min-w-0"
        variants={item}
      >
        <HaloRing
          size={72}
          value={Math.min(1, prCount / 10)}
          color={CHART_COLORS.ember}
          displayValue={String(prCount)}
          label="PRs"
        />
      </motion.div>
    </motion.div>
  );
}
