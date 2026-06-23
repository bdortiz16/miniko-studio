import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores como variables CSS (permite el tema oscuro del admin sin
        // tocar cada página). El sitio público usa los valores claros de :root.
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        coal: "#0a0a0a",
        brand: "rgb(var(--c-brand) / <alpha-value>)",
        mist: "rgb(var(--c-mist) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
