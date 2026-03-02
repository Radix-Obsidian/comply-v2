import type { Config } from "tailwindcss";
import path from "path";

const config: Config = {
  darkMode: "class",
  content: [
    path.join(__dirname, "app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "lib/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "SF Pro Display",
          "SF Pro Text",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "Fira Code",
          "Fira Mono",
          "Roboto Mono",
          "monospace",
        ],
      },
      colors: {
        surface: {
          primary: "rgb(var(--surface-primary) / <alpha-value>)",
          secondary: "rgb(var(--surface-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--surface-tertiary) / <alpha-value>)",
        },
        accent: {
          blue: "rgb(var(--accent-blue) / <alpha-value>)",
          green: "rgb(var(--accent-green) / <alpha-value>)",
          orange: "rgb(var(--accent-orange) / <alpha-value>)",
          red: "rgb(var(--accent-red) / <alpha-value>)",
          purple: "rgb(var(--accent-purple) / <alpha-value>)",
        },
        label: {
          primary: "rgb(var(--label-primary) / <alpha-value>)",
          secondary: "rgb(var(--label-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--label-tertiary) / <alpha-value>)",
          quaternary: "rgb(var(--label-quaternary) / <alpha-value>)",
        },
        separator: "rgb(var(--separator) / <alpha-value>)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      fontSize: {
        display: [
          "48px",
          {
            lineHeight: "52px",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],
        "title-1": [
          "28px",
          {
            lineHeight: "34px",
            letterSpacing: "-0.015em",
            fontWeight: "700",
          },
        ],
        "title-2": [
          "22px",
          {
            lineHeight: "28px",
            letterSpacing: "-0.01em",
            fontWeight: "700",
          },
        ],
        "title-3": [
          "20px",
          { lineHeight: "24px", fontWeight: "600" },
        ],
        headline: [
          "17px",
          { lineHeight: "22px", fontWeight: "600" },
        ],
        body: [
          "17px",
          { lineHeight: "22px", fontWeight: "400" },
        ],
        callout: [
          "16px",
          { lineHeight: "21px", fontWeight: "400" },
        ],
        subheadline: [
          "15px",
          { lineHeight: "20px", fontWeight: "400" },
        ],
        footnote: [
          "13px",
          { lineHeight: "18px", fontWeight: "400" },
        ],
        "caption-1": [
          "12px",
          { lineHeight: "16px", fontWeight: "400" },
        ],
        "caption-2": [
          "11px",
          { lineHeight: "13px", fontWeight: "500" },
        ],
      },
      boxShadow: {
        glass:
          "0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)",
        "glass-hover":
          "0 0 0 1px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.4)",
        elevated:
          "0 2px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
      backdropBlur: {
        glass: "20px",
        heavy: "40px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "score-fill": "scoreFill 1.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scoreFill: {
          from: { strokeDashoffset: "283" },
          to: {},
        },
      },
    },
  },
  plugins: [],
};

export default config;
