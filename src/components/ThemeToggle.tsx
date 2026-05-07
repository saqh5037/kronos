"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

const BUTTON_CLASS =
  "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors";

export default function ThemeToggle({
  className = "",
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-hydration shell
  if (!mounted) {
    return (
      <button
        type="button"
        className={`${BUTTON_CLASS} ${className}`}
        style={{
          background: "var(--card)",
          border: "1px solid var(--line)",
          color: "var(--k-t2)",
        }}
        aria-label="Cambiar tema"
        title="Cambiar tema"
      >
        <span style={{ width: 14, height: 14, display: "inline-block" }} />
        {!iconOnly && <span className="hidden sm:inline">Tema</span>}
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`${BUTTON_CLASS} ${className}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        color: "var(--k-t2)",
      }}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
    >
      <motion.div
        key={isDark ? "sun" : "moon"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </motion.div>
      {!iconOnly && (
        <span className="hidden sm:inline">{isDark ? "Claro" : "Oscuro"}</span>
      )}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
