import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: ["text-blue-400", "text-purple-400", "text-agent"],
  theme: {
    extend: {
      colors: {
        background: "#030712", // Deep space black
        panel: "#111827", // Slightly lighter for floating cards
        agent: "#06b6d4", // Cyan accent for OpenClaw
      },
    },
  },
  plugins: [],
};
export default config;