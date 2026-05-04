"use client";

interface HaloRingProps {
  size?: number;
  strokeWidth?: number;
  value?: number;
  color?: string;
  label?: string;
  displayValue?: string;
}

export default function HaloRing({
  size = 88,
  strokeWidth = 8,
  value = 0.8,
  color = "#19f08b",
  label,
  displayValue,
}: HaloRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset =
    circumference * (1 - Math.min(1, Math.max(0, value)));

  const glowColor =
    color === "#19f08b"
      ? "rgba(25,240,139,0.55)"
      : color === "#3aa3ff"
        ? "rgba(58,163,255,0.55)"
        : "rgba(255,94,94,0.55)";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow backdrop */}
      <div
        className="absolute rounded-full"
        style={{
          inset: -6,
          background: `radial-gradient(circle, ${glowColor.replace("0.55", "0.22")} 0%, transparent 65%)`,
          filter: "blur(6px)",
        }}
      />
      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", position: "relative" }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>
      {/* Center content */}
      {(displayValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {displayValue && (
            <span
              className="font-display font-bold"
              style={{ fontSize: size > 110 ? 22 : 16 }}
            >
              {displayValue}
            </span>
          )}
          {label && (
            <span
              className="font-mono"
              style={{
                fontSize: 8,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 700,
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
