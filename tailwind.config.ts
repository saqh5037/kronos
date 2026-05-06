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
        // Brand palette (manual de marca)
        red: "var(--brand-red)",
        blue: "var(--brand-blue)",
        "blue-deep": "var(--brand-blue-deep)",
        cyan: "var(--brand-cyan)",
        pink: "var(--brand-pink)",
        violet: "var(--brand-violet)",
        // Legacy aliases (transitional, mapped to brand)
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
          "linear-gradient(135deg, rgba(230,0,38,0.08) 0%, rgba(0,68,255,0.08) 50%, rgba(0,191,255,0.08) 100%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
