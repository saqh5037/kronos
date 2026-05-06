"use client";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  color?: "blue" | "red" | "text";
  withBar?: boolean;
}

export default function Eyebrow({
  children,
  className = "",
  color = "blue",
  withBar = true,
}: EyebrowProps) {
  const colorMap = {
    blue: "var(--blue)",
    red: "var(--red)",
    text: "var(--text-3)",
  };

  return (
    <div
      className={`inline-flex items-center gap-2.5 font-mono text-[10px] font-semibold tracking-[0.22em] uppercase ${className}`}
      style={{ color: colorMap[color] }}
    >
      {withBar && (
        <span
          className="inline-block w-6 h-[1.5px]"
          style={{ background: "var(--grad)" }}
        />
      )}
      <span>{children}</span>
    </div>
  );
}
