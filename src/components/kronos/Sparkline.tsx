"use client";

import { useId } from "react";

interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
  /** Animate stroke drawing on mount. Default true. */
  animate?: boolean;
}

export default function Sparkline({
  values,
  color = "var(--steel)",
  height = 28,
  width = 140,
  animate = true,
}: SparklineProps) {
  const gid = useId().replace(/:/g, "");
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const points = coords.map(([x, y]) => `${x},${y}`);
  const areaPoints =
    `${coords[0][0]},${height} ` +
    points.join(" ") +
    ` ${coords[coords.length - 1][0]},${height}`;

  // Approximate path length for stroke draw animation
  let pathLen = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    pathLen += Math.sqrt(dx * dx + dy * dy);
  }
  pathLen = Math.ceil(pathLen) + 4;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`spark-fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-fill-${gid})`}
        style={
          animate
            ? {
                animation:
                  "spark-fill-in 600ms cubic-bezier(0.16, 1, 0.3, 1) 700ms backwards",
              }
            : undefined
        }
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animate
            ? ({
                strokeDasharray: pathLen,
                strokeDashoffset: pathLen,
                animation:
                  "spark-draw 1100ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards",
                ["--spark-len" as string]: String(pathLen),
              } as React.CSSProperties)
            : undefined
        }
      />
    </svg>
  );
}
