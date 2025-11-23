import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "walrus-dark": "#050816",
        "walrus-cyan": "#53f7ff",
        "walrus-purple": "#b48aff",
        "walrus-border": "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        mono: ["Space Mono", "IBM Plex Mono", "monospace"],
        pixel: ["VT323", "Space Mono", "monospace"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSlow: "pulse 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
