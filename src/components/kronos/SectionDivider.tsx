"use client";

interface SectionDividerProps {
  className?: string;
  maxWidth?: number;
}

export default function SectionDivider({
  className = "",
  maxWidth = 600,
}: SectionDividerProps) {
  return (
    <div
      className={`relative h-px mx-auto my-0 ${className}`}
      style={{
        maxWidth,
        background:
          "linear-gradient(90deg, transparent, var(--k-line-2) 20%, var(--blue-line) 50%, var(--k-line-2) 80%, transparent)",
      }}
    >
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full"
        style={{
          background: "var(--k-accent)",
          boxShadow:
            "0 0 12px rgba(230, 0, 38, 0.2), 0 0 24px rgba(0, 68, 255, 0.1)",
        }}
      />
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full"
        style={{ background: "var(--bg)" }}
      />
    </div>
  );
}
