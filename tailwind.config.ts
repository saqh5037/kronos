import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  /**
   * The `colors` block used to alias the globals.css compat layer
   * (`bg: var(--bg)`, `card: var(--card)`, `line: var(--line)`, `text`,
   * `fire`, `moss`, `red`, `blue`, …). That is how whole admin screens stayed
   * on the pre-V3 palette without ever writing `var(--text)` — audit
   * 2026-09-15, ADM-09. Every one of those utilities is now unused in `src/**`
   * and the aliases are gone; write `bg-[var(--k-bg)]`,
   * `text-[var(--k-t2)]`, `border-[var(--k-line)]` instead. The
   * `legacy-tokens` guard (scripts/guards/rules.ts) fails the build if either
   * spelling comes back.
   *
   * `backgroundImage` went with them: `bg-grad`, `bg-grad-soft` and
   * `bg-grad-glow` had no call sites and their literals were the pre-V3
   * red/blue/cyan brand gradient, which V3 replaced with a single lime accent.
   *
   * Removing `colors.red`/`blue`/`cyan`/… also gives Tailwind's own palette
   * back: those keys had SHADOWED the default scales, so `text-red-500` did
   * not exist. Nothing used it, and now it works if a debug screen needs it.
   */
  theme: {
    extend: {
      fontFamily: {
        // Kronos v3 — Cuarto Oscuro: Plex Mono para display/datos, Inter para body
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        script: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "18px",
        md: "16px",
        sm: "12px",
        xs: "8px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        card: "var(--card-glow)",
        "card-hover": "var(--card-glow-hover)",
        featured: "var(--shadow-featured)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
        elastic: "cubic-bezier(0.68, -0.3, 0.265, 1.3)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
