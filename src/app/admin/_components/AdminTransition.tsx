"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

export default function AdminTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: "opacity, transform" }}
      onAnimationComplete={() => {
        if (ref.current) ref.current.style.willChange = "auto";
      }}
    >
      {children}
    </motion.div>
  );
}
