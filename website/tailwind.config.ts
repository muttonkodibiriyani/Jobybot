import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0B0B",
          soft: "#1A1A1A",
          muted: "#6B6B6B",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F7F7F7",
          border: "#E8E8E8",
        },
        accent: {
          DEFAULT: "#FF6B00",
          hover: "#E85D00",
          soft: "#FFF4EB",
        },
        success: "#067647",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        lift: "0 8px 30px rgba(0,0,0,0.12)",
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
