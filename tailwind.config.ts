import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        brand: {
          50:  "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },
        border:      "var(--border)",
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        surface:     "var(--surface)",
        "surface-2": "var(--surface-2)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)"   },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)"    },
        },
        "modal-in": {
          from: { opacity: "0", transform: "scale(0.97) translateY(8px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)"      },
        },
      },
      animation: {
        "fade-in":  "fade-in 0.3s ease both",
        "slide-in": "slide-in 0.25s ease both",
        "modal-in": "modal-in 0.2s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
