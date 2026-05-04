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
        card: "var(--card)",
        "card-2": "var(--card-2)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        line: "var(--line)",
        recovery: "var(--recovery)",
        strain: "var(--strain)",
        pr: "var(--pr)",
        track: "var(--track)",
        overlay: "var(--overlay)",
        "hover-subtle": "var(--hover-subtle)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: [
          "var(--font-space-grotesk)",
          "var(--font-inter)",
          "sans-serif",
        ],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        grad: "linear-gradient(95deg, #3aa3ff 0%, #19f08b 100%)",
        "grad-soft":
          "linear-gradient(95deg, rgba(58,163,255,0.18), rgba(25,240,139,0.18))",
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
