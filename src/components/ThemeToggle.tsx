"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const BUTTON_CLASS =
  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors";
const BUTTON_STYLE: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--line)",
  color: "var(--text-2)",
};

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-hydration shell — identical between server and client to avoid mismatch.
  if (!mounted) {
    return (
      <button
        type="button"
        className={`${BUTTON_CLASS} ${className}`}
        style={BUTTON_STYLE}
        aria-label="Cambiar tema"
        title="Cambiar tema"
      >
        <span style={{ width: 14, height: 14, display: "inline-block" }} />
        <span className="hidden sm:inline">Tema</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`${BUTTON_CLASS} ${className}`}
      style={BUTTON_STYLE}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="hidden sm:inline">{isDark ? "Claro" : "Oscuro"}</span>
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
