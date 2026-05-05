"use client";

import { motion } from "framer-motion";

interface ConfidenceBadgeProps {
  confidence: number;
  showCheck?: boolean;
  delay?: number;
}

export default function ConfidenceBadge({
  confidence,
  showCheck = false,
  delay = 0,
}: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let color: string;
  let glowColor: string;
  let bgClass: string;
  let pulse = false;

  if (confidence >= 0.85) {
    color = "var(--moss)";
    glowColor = "rgba(74, 124, 89, 0.55)";
    bgClass =
      "bg-[var(--moss-soft)] text-[var(--moss)] border-[var(--moss-line)]";
  } else if (confidence >= 0.5) {
    color = "var(--amber)";
    glowColor = "rgba(217, 119, 6, 0.45)";
    bgClass =
      "bg-[var(--amber-soft)] text-[var(--amber)] border-[var(--amber-line)]";
  } else {
    color = "var(--ember)";
    glowColor = "rgba(196, 69, 54, 0.55)";
    bgClass =
      "bg-[var(--ember-soft)] text-[var(--ember)] border-[var(--ember-line)]";
    pulse = true;
  }

  return (
    <motion.div
      className="flex items-center gap-1.5"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
    >
      <span
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-mono font-bold border ${bgClass} ${pulse ? "k-pulse-glow" : ""}`}
        style={
          !pulse
            ? {
                boxShadow: `0 0 12px ${glowColor}`,
              }
            : undefined
        }
      >
        {showCheck && (
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: delay + 0.15, duration: 0.3 }}
          >
            <motion.path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: delay + 0.15, duration: 0.3 }}
            />
          </motion.svg>
        )}
        {pct}%
      </span>
    </motion.div>
  );
}
