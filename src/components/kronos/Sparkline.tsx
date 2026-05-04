"use client";

interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
  showFill?: boolean;
}

export default function Sparkline({
  values,
  color = "var(--strain)",
  height = 36,
  width = 120,
  strokeWidth = 1.5,
  showFill = true,
}: SparklineProps) {
  if (values.length < 2) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const padX = 2;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * innerW;
    const y = padY + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });

  const polylinePoints = points.map((p) => p.join(",")).join(" ");
  const areaPoints = `${points[0][0]},${height} ${polylinePoints} ${points[points.length - 1][0]},${height}`;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: "block", overflow: "visible" }}
    >
      {showFill && <polygon points={areaPoints} fill={color} opacity={0.08} />}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
