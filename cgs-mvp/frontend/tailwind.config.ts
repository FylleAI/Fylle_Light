import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Accent arancione per CTA nel Design Lab
        accent: {
          DEFAULT: "#f97316", // orange-500
          hover: "#ea580c", // orange-600
          light: "#fff7ed", // orange-50
        },
        // Background Design Lab (dark mode)
        surface: {
          DEFAULT: "#0a0a0a", // neutral-950
          card: "#171717", // neutral-900
          elevated: "#262626", // neutral-800
        },
      },
      borderRadius: {
        "3xl": "1.5rem", // Per le card onboarding
        "2xl": "1rem", // Per le card lista
        xl: "0.75rem", // Per input e button
      },
    },
  },
  plugins: [],
};

export default config;
