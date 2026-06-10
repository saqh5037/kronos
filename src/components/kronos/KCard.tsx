"use client";

import { m } from "framer-motion";
import { type ReactNode } from "react";

type CardVariant = "default" | "featured" | "ghost" | "flat";

interface KCardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

const variantClass: Record<CardVariant, string> = {
  default: "k-card",
  featured: "k-card-featured",
  ghost: "k-card-ghost",
  flat: "k-card-flat",
};

export default function KCard({
  children,
  variant = "default",
  className = "",
  animate = true,
  onClick,
}: KCardProps) {
  const baseClass = `${variantClass[variant]} ${className}`.trim();

  if (animate) {
    return (
      <m.div
        className={baseClass}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.995 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={onClick}
      >
        {children}
      </m.div>
    );
  }

  return (
    <div className={baseClass} onClick={onClick}>
      {children}
    </div>
  );
}
