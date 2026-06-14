import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "fb-pink": "#B98745",
        "fb-pink-light": "#D7A864",
        "fb-pink-bg": "#FFF4DF",
        "fb-orange": "#C98C42",
        page: "#FBF8F3",
        card: "#FFFFFF",
        "text-primary": "#101827",
        "text-secondary": "#343B4A",
        "text-muted": "#667085",
        "border-default": "#E6DED2",
        "border-light": "#F0E7DC",
        success: "#03A685",
      },
      fontFamily: {
        sans: ["var(--font-assistant)", "sans-serif"],
      },
      maxWidth: {
        site: "1296px",
      },
    },
  },
  plugins: [],
};

export default config;
