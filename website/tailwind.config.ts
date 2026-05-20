import type { Config } from "tailwindcss";

/**
 * Apple/Uber-inspired light palette with a single warm-orange accent.
 *
 * Sourced from a FlutterFlow design spec generated for jobybots.com on
 * 2026-05-20. The spec used #2962FF blue; we keep our brand orange.
 * - background:  #FFFFFF      (clean white)
 * - secondary:   #F5F5F7      (Apple soft gray, section separators)
 * - surface:     #FBFBFD      (raised cards on white)
 * - ink:         #1D1D1F      (Apple near-black — never pure #000)
 * - ink-muted:   #6E6E73      (soft body gray)
 * - hint:        #A1A1A6      (placeholder / disabled)
 * - outline:     #D2D2D7      (input borders)
 * - divider:     #E5E5E7      (horizontal rules)
 * - accent:      #FF6B00      (JobyBots brand orange)
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1D1D1F",
          soft: "#2C2C2E",
          muted: "#6E6E73",
          hint: "#A1A1A6",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F5F5F7",
          raised: "#FBFBFD",
          border: "#D2D2D7",
          divider: "#E5E5E7",
        },
        accent: {
          DEFAULT: "#FF6B00",
          hover: "#E85D00",
          soft: "#FFF4EB",
          ring: "#FFB07A",
        },
        success: "#00D166",
        warning: "#FF9F0A",
        error: "#FF3B30",
      },
      fontFamily: {
        // Plus Jakarta Sans for headings/UI, Inter for body
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.04)",
        sm: "0 4px 8px rgba(0,0,0,0.05)",
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        lift: "0 12px 32px rgba(0,0,0,0.10)",
        glow: "0 0 40px rgba(255,107,0,0.25), 0 0 80px rgba(255,107,0,0.10)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      maxWidth: {
        page: "1200px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "gear-spin": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "gear-spin-reverse": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "orbit": {
          "0%":   { transform: "rotate(0deg) translateX(220px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(220px) rotate(-360deg)" },
        },
        "halo-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.06)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        "scale-in": "scale-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "gear-spin-slow": "gear-spin 18s linear infinite",
        "gear-spin-med":  "gear-spin 9s linear infinite",
        "gear-spin-fast": "gear-spin 4s linear infinite",
        "gear-spin-reverse": "gear-spin-reverse 12s linear infinite",
        "orbit-30": "orbit 30s linear infinite",
        "halo": "halo-pulse 4s ease-in-out infinite",
        "shimmer": "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
