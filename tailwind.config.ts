import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "fb-pink": "#FF3F6C",
        "fb-pink-light": "#FF6B8A",
        "fb-pink-bg": "#FFF0F3",
        "fb-orange": "#FF905A",
        page: "#F4F4F4",
        card: "#FFFFFF",
        "text-primary": "#282C3F",
        "text-secondary": "#535766",
        "text-muted": "#94969F",
        "border-default": "#D4D5D9",
        "border-light": "#EAEAEC",
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
