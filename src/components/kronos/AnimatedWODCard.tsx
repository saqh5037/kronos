"use client";

import { motion } from "framer-motion";

export function AnimatedWODCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="k-card p-4 cursor-pointer"
    >
      {children}
    </motion.div>
  );
}
