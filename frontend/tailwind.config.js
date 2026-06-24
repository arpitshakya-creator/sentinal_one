/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0e14",
          soft: "#0f1622",
          card: "#121a28",
          elevated: "#18202f",
        },
        line: "#1e2a3d",
        risk: {
          low: "#22c55e",
          medium: "#f59e0b",
          critical: "#ef4444",
        },
        accent: {
          DEFAULT: "#38bdf8",
          dim: "#0ea5e9",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        pulseRisk: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pulseRisk: "pulseRisk 1.6s ease-in-out infinite",
        slideUp: "slideUp 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
