"use client";

import { motion } from "framer-motion";

interface HaloRingProps {
  size?: number;
  strokeWidth?: number;
  value?: number;
  color?: string;
  label?: string;
  displayValue?: string;
  animate?: boolean;
}

export default function HaloRing({
  size = 88,
  strokeWidth = 8,
  value = 0.8,
  color = "#4a7c59",
  label,
  displayValue,
  animate = true,
}: HaloRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference * (1 - Math.min(1, Math.max(0, value)));

  // Derive glow colours from the ring colour
  const glowColor =
    color === "#4a7c59"
      ? "rgba(74,124,89,0.55)"
      : color === "#64748b"
        ? "rgba(100,116,139,0.55)"
        : color === "#c44536"
          ? "rgba(196,69,54,0.55)"
          : "rgba(220,75,23,0.55)";

  const glowBg = glowColor.replace("0.55", "0.18");
  const glowShadow = glowColor.replace("0.55", "0.65");

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow backdrop */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: -8,
          background: `radial-gradient(circle, ${glowBg} 0%, transparent 65%)`,
          filter: "blur(8px)",
        }}
        animate={animate ? { opacity: [0.5, 0.85, 0.5] } : undefined}
        transition={
          animate
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />

      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", position: "relative", zIndex: 1 }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glowShadow})` }}
          initial={animate ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: targetOffset }}
          transition={
            animate
              ? {
                  strokeDashoffset: {
                    duration: 1.2,
                    ease: "easeOut",
                    delay: 0.2,
                  },
                }
              : undefined
          }
        />
      </svg>

      {/* Center content */}
      {(displayValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[2]">
          {displayValue && (
            <motion.span
              className="font-display font-bold"
              style={{
                fontSize: size > 110 ? 24 : 18,
                letterSpacing: "-0.03em",
              }}
              initial={animate ? { opacity: 0, scale: 0.8 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={animate ? { delay: 0.4, duration: 0.4 } : undefined}
            >
              {displayValue}
            </motion.span>
          )}
          {label && (
            <motion.span
              className="font-mono"
              style={{
                fontSize: 8,
                letterSpacing: "0.14em",
                color: "var(--text-3)",
                fontWeight: 700,
              }}
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={animate ? { delay: 0.6, duration: 0.3 } : undefined}
            >
              {label}
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
}
