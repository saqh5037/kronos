"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface StatPillProps {
  icon?: ReactNode;
  value: string | number;
  label: string;
  color?: string;
  className?: string;
}

export default function StatPill({
  icon,
  value,
  label,
  color = "var(--text-2)",
  className = "",
}: StatPillProps) {
  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${className}`}
      style={{
        background: "var(--card)",
        borderColor: "var(--line)",
        boxShadow: "var(--card-glow)",
      }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {icon && (
        <span style={{ color, fontSize: 12, lineHeight: 1 }}>{icon}</span>
      )}
      <span
        className="font-display font-bold text-sm"
        style={{ color, letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
      <span
        className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase"
        style={{ color: "var(--text-3)" }}
      >
        {label}
      </span>
    </motion.div>
  );
}
