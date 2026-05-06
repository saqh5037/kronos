import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-soft": "var(--bg-soft)",
        "bg-warm": "var(--bg-warm)",
        "bg-cool": "var(--bg-cool)",
        card: "var(--card)",
        "card-2": "var(--card-2)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        line: "var(--line)",
        // Brand palette (Manual de Marca v2)
        red: "var(--red)",
        blue: "var(--blue)",
        "blue-deep": "var(--blue-deep)",
        cyan: "var(--cyan)",
        pink: "var(--pink)",
        violet: "var(--brand-violet)",
        // Legacy aliases
        fire: "var(--fire)",
        steel: "var(--steel)",
        moss: "var(--moss)",
        ember: "var(--ember)",
        amber: "var(--amber)",
        track: "var(--track)",
        overlay: "var(--overlay)",
        "hover-subtle": "var(--hover-subtle)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        script: ["var(--font-dancing)", "cursive"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        grad: "linear-gradient(135deg, #e60026 0%, #0044ff 50%, #00bfff 100%)",
        "grad-soft":
          "linear-gradient(135deg, rgba(230,0,38,0.05) 0%, rgba(0,68,255,0.05) 50%, rgba(0,191,255,0.05) 100%)",
        "grad-glow":
          "radial-gradient(circle at 50% 50%, rgba(230,0,38,0.10), rgba(0,68,255,0.07) 40%, transparent 70%)",
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
