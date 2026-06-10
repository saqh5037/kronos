"use client";

import { m, AnimatePresence } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

interface TooltipBubbleProps {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  children: ReactNode;
}

export function TooltipBubble({
  visible,
  x,
  y,
  width,
  children,
}: TooltipBubbleProps) {
  const bubbleWidth = 116;
  const isLeftHalf = x < width / 2;
  const left = isLeftHalf
    ? Math.min(width - bubbleWidth - 8, Math.max(8, x + 14))
    : Math.max(8, x - bubbleWidth - 14);

  const style: CSSProperties = {
    position: "absolute",
    top: Math.max(6, y - 60),
    left,
    pointerEvents: "none",
    zIndex: 2,
  };

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key="bubble"
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={style}
        >
          <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{
              background: "var(--card-elevated, var(--card))",
              border: "1px solid var(--line-strong, rgba(127,127,127,0.25))",
              boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
              minWidth: 92,
              maxWidth: bubbleWidth,
              whiteSpace: "nowrap",
            }}
          >
            {children}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface TooltipCrosshairProps {
  visible: boolean;
  x: number;
  y: number;
  topY: number;
  bottomY: number;
  color: string;
}

export function TooltipCrosshair({
  visible,
  x,
  y,
  topY,
  bottomY,
  color,
}: TooltipCrosshairProps) {
  return (
    <AnimatePresence>
      {visible && (
        <m.g
          key="crosshair"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: "none" }}
        >
          <line
            x1={x}
            x2={x}
            y1={topY}
            y2={bottomY}
            stroke={color}
            strokeOpacity={0.5}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle cx={x} cy={y} r={7} fill={color} fillOpacity={0.18} />
          <circle
            cx={x}
            cy={y}
            r={3.5}
            fill={color}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          <circle cx={x} cy={y} r={1.4} fill="#ffffff" />
        </m.g>
      )}
    </AnimatePresence>
  );
}
