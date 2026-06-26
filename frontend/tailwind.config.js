/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#f5f7fa",
          soft: "#eef1f6",
          card: "#ffffff",
          elevated: "#f1f4f9",
        },
        line: "#e2e8f0",
        risk: {
          low: "#16a34a",
          medium: "#d97706",
          critical: "#dc2626",
        },
        accent: {
          DEFAULT: "#4f46e5",
          dim: "#4338ca",
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
