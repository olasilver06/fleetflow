import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FleetFlow design system — see docs/product-doc.md Section 9
        background: "#111827",
        surface: "#1C212B",
        "surface-hover": "#242A36",
        border: "#2A2D35",
        primary: "#2F6FED",
        accent: "#FF7A32",
        success: "#2ECC71",
        warning: "#F59E0B",
        danger: "#EB5757",
        info: "#38BDF8",
        neutral: "#6B7280",
        "text-primary": "#F4F5F7",
        "text-secondary": "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
