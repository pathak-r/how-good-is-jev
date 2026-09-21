import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f3efe4",
        ink: "#1b1914",
        mute: "#6d675c",
        rule: "#d8d1c2",
        card: "#fffdf7",
        good: "#2f6b4f",
        bad: "#9a3b2f",
        warn: "#8a5a12",
      },
      fontFamily: {
        display: ["var(--font-display)", "Iowan Old Style", "Georgia", "serif"],
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.875rem", { lineHeight: "1.5rem" }],
        base: ["1rem", { lineHeight: "1.65rem" }],
        lg: ["1.5rem", { lineHeight: "1.9rem" }],
        xl: ["2rem", { lineHeight: "2.3rem" }],
        "2xl": ["2.5rem", { lineHeight: "2.8rem" }],
      },
      letterSpacing: {
        label: "0.1em",
      },
      maxWidth: {
        measure: "36rem",
        wide: "60rem",
        headline: "46rem",
      },
    },
  },
  plugins: [],
};

export default config;
