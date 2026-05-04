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
        bg: "#1a1d20",
        "bg-soft": "#23272b",
        card: "#2a2f33",
        "card-2": "#34393e",
        recovery: "#19f08b",
        strain: "#3aa3ff",
        pr: "#ff5e5e",
        line: "rgba(255,255,255,0.08)",
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
