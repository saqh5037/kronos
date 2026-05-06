"use client";

import type { CSSProperties, ReactNode } from "react";

type SkeletonVariant = "line" | "block" | "circle" | "chart" | "card";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  rounded?: number | string;
  /** Stagger delay in ms for sequenced shimmer */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const baseStyles: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "block",
  background: "var(--kronos-skeleton-bg)",
  border: "1px solid var(--kronos-skeleton-border)",
};

export function KronosSkeleton({
  variant = "line",
  width,
  height,
  rounded,
  delay = 0,
  className,
  style,
  children,
}: SkeletonProps) {
  const presets: Record<SkeletonVariant, CSSProperties> = {
    line: {
      width: width ?? "100%",
      height: height ?? 12,
      borderRadius: rounded ?? 6,
    },
    block: {
      width: width ?? "100%",
      height: height ?? 80,
      borderRadius: rounded ?? 12,
    },
    circle: { width: width ?? 36, height: height ?? 36, borderRadius: 999 },
    chart: {
      width: width ?? "100%",
      height: height ?? 220,
      borderRadius: rounded ?? 12,
    },
    card: {
      width: width ?? "100%",
      height: height ?? 120,
      borderRadius: rounded ?? 14,
    },
  };

  return (
    <span
      className={`k-skeleton ${className ?? ""}`}
      style={{
        ...baseStyles,
        ...presets[variant],
        animationDelay: delay > 0 ? `${delay}ms` : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/** Convenience: simulate a row of stacked text lines */
export function KronosSkeletonLines({
  count = 3,
  gap = 8,
  baseDelay = 0,
}: {
  count?: number;
  gap?: number;
  baseDelay?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <KronosSkeleton
          key={i}
          variant="line"
          width={i === count - 1 ? "70%" : "100%"}
          delay={baseDelay + i * 80}
        />
      ))}
    </div>
  );
}
