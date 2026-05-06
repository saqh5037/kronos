"use client";

interface AuroraBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export default function AuroraBackground({
  className = "",
  intensity = "medium",
}: AuroraBackgroundProps) {
  const opacityMap = {
    low: 0.2,
    medium: 0.35,
    high: 0.5,
  };
  const opacity = opacityMap[intensity];

  return (
    <div className={`aurora ${className}`} aria-hidden="true">
      <div
        className="aurora-blob"
        style={{
          background: `rgba(230, 0, 38, ${opacity * 0.25})`,
          width: 600,
          height: 600,
          top: "-10%",
          left: "-5%",
          animationDelay: "0s",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          background: `rgba(0, 68, 255, ${opacity * 0.22})`,
          width: 500,
          height: 500,
          top: "30%",
          right: "-10%",
          animationDelay: "-7s",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          background: `rgba(0, 191, 255, ${opacity * 0.18})`,
          width: 400,
          height: 400,
          bottom: "-5%",
          left: "30%",
          animationDelay: "-14s",
        }}
      />
    </div>
  );
}
