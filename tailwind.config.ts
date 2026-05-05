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
        display: ["var(--font-oswald)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        grad: "linear-gradient(95deg, #dc4b17 0%, #e8893a 100%)",
        "grad-soft":
          "linear-gradient(95deg, rgba(220,75,23,0.14), rgba(232,137,58,0.14))",
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
