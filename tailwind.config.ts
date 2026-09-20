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
        display: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(27,25,20,0.04), 0 12px 32px rgba(27,25,20,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
