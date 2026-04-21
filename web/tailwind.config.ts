import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        em: {
          950: "#022C22",
          900: "#064E3B",
          800: "#065F46",
          700: "#047857",
          600: "#059669",
          500: "#10B981",
          400: "#34D399",
          300: "#6EE7B7",
          200: "#A7F3D0",
          100: "#D1FAE5",
        },
        surface: {
          950: "#020C0B",
          900: "#031510",
          800: "#041E17",
          700: "#062820",
          600: "#083328",
          500: "#0A3D30",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 3s linear infinite",
        "blink": "blink 1s step-end infinite",
        "data-flow": "data-flow 1.5s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "ticker": "ticker 20s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "data-flow": {
          "0%": { opacity: "0.2", transform: "scaleX(0)", transformOrigin: "left" },
          "50%": { opacity: "1", transform: "scaleX(1)", transformOrigin: "left" },
          "100%": { opacity: "0.2", transform: "scaleX(1)", transformOrigin: "right" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "1" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(16,185,129,0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(16,185,129,0.8), 0 0 40px rgba(16,185,129,0.3)" },
        },
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      boxShadow: {
        "em-sm": "0 0 10px rgba(16,185,129,0.2)",
        "em-md": "0 0 20px rgba(16,185,129,0.3)",
        "em-lg": "0 0 40px rgba(16,185,129,0.4)",
        "em-xl": "0 0 60px rgba(16,185,129,0.5)",
        "panel": "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
