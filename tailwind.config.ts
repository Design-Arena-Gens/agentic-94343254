import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0ea5e9",
          dark: "#0284c7",
        },
      },
      boxShadow: {
        glow: "0 0 25px rgba(14, 165, 233, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
