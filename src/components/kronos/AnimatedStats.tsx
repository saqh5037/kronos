"use client";

import { motion } from "framer-motion";
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
      className="grid grid-cols-3 gap-3 mt-6 px-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="k-card p-3 flex items-center justify-center"
        variants={item}
      >
        <HaloRing
          size={88}
          value={weekRatio}
          color="#19f08b"
          displayValue={String(weekAttendance)}
          label="ESTA SEM"
        />
      </motion.div>
      <motion.div
        className="k-card p-3 flex items-center justify-center"
        variants={item}
      >
        <HaloRing
          size={88}
          value={Math.min(1, streak / 14)}
          color="#3aa3ff"
          displayValue={String(streak)}
          label="RACHA"
        />
      </motion.div>
      <motion.div
        className="k-card p-3 flex items-center justify-center"
        variants={item}
      >
        <HaloRing
          size={88}
          value={Math.min(1, prCount / 10)}
          color="#ff5e5e"
          displayValue={String(prCount)}
          label="PRs"
        />
      </motion.div>
    </motion.div>
  );
}
