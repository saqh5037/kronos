"use client";

import { motion } from "framer-motion";

interface BarItem {
  value: number; // 0-1
  label?: string;
  sublabel?: string;
  isBest?: boolean;
  color?: string;
}

interface MiniBarChartProps {
  bars: BarItem[];
  height?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
}

export default function MiniBarChart({
  bars,
  height = 60,
  barWidth,
  gap = 8,
  className = "",
}: MiniBarChartProps) {
  const computedBarWidth =
    barWidth ?? `calc((100% - ${(bars.length - 1) * gap}px) / ${bars.length})`;

  return (
    <div className={className}>
      <div className="flex items-end" style={{ height, gap }}>
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1.5"
            style={{ width: computedBarWidth }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
          >
            <div
              className="w-full relative flex items-end"
              style={{ height: height - 20 }}
            >
              <motion.div
                className="w-full rounded-[3px]"
                style={{
                  background: bar.isBest
                    ? "var(--grad)"
                    : (bar.color ?? "var(--chart-inactive)"),
                  boxShadow: bar.isBest
                    ? "0 0 12px rgba(25,240,139,0.45)"
                    : "none",
                }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(8, bar.value * 100)}%` }}
                transition={{
                  delay: 0.2 + i * 0.08,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              />
            </div>
            {bar.label && (
              <span
                className="font-mono text-[9px] font-bold tracking-[0.04em] text-center truncate w-full"
                style={{
                  color: bar.isBest ? "var(--recovery)" : "var(--text-2)",
                }}
              >
                {bar.label}
              </span>
            )}
            {bar.sublabel && (
              <span
                className="font-mono text-[8px] tracking-[0.02em] text-center truncate w-full"
                style={{ color: "var(--text-3)" }}
              >
                {bar.sublabel}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
