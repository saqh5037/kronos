"use client";

import { type ReactNode } from "react";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  baseDelay?: number;
}

export default function StaggerContainer({
  children,
  className = "",
  staggerDelay = 80,
  baseDelay = 0,
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              style={{
                animation: `fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + i * staggerDelay}ms backwards`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
