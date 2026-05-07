"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit";
}

export default function GradientButton({
  children,
  onClick,
  className = "",
  size = "md",
  disabled = false,
  type = "button",
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white cursor-pointer border-none ${sizeClasses[size]} ${className}`}
      style={{
        background: "var(--k-accent)",
        boxShadow: "0 4px 18px rgba(230, 0, 38, 0.20)",
      }}
    >
      {/* Shine effect */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
          transform: "skewX(-20deg) translateX(-150%)",
          animation: "shine 4s ease-in-out infinite",
        }}
        aria-hidden
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
