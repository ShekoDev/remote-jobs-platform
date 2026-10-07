import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        ink: { DEFAULT: "#101828", soft: "#475467", faint: "#98A2B3" },
        canvas: { DEFAULT: "#F5F7FA", raised: "#FFFFFF" },
        night: { DEFAULT: "#0B1220", raised: "#111A2E", edge: "#1E2A44" },
        teal: { 50: "#E6F7F5", 100: "#C2ECE7", 400: "#2CB8A8", 500: "#12A594", 600: "#0E8A7C", 700: "#0B6F65" },
        amber: { 400: "#F5B342", 500: "#EE9B1D" },
        rose: { 500: "#E5484D" },
        lime: { 500: "#3DAA5C" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.12)",
        glass: "0 8px 32px -8px rgba(16,24,40,.18)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-600px 0" }, "100%": { backgroundPosition: "600px 0" } },
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { shimmer: "shimmer 1.6s linear infinite", rise: "rise .25s ease-out" },
    },
  },
  plugins: [],
};
export default config;
