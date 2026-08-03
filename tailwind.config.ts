import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef3f8",
          100: "#d3e0ec",
          200: "#a7c1d9",
          300: "#7ba2c6",
          400: "#4f83b3",
          500: "#2f6491",
          600: "#254f74",
          700: "#1E3A5F",
          800: "#152a45",
          900: "#0d1a2c",
        },
        gold: {
          50: "#fffbea",
          100: "#fff3c4",
          200: "#ffe685",
          300: "#ffd94a",
          400: "#ffce22",
          500: "#F5C518",
          600: "#d9a90a",
          700: "#b3860a",
          800: "#8f6a0d",
          900: "#75570f",
        },
        coral: {
          50: "#fef1f3",
          100: "#fde3e7",
          200: "#fbcbd3",
          300: "#f7a3b1",
          400: "#f36f86",
          500: "#EF4258",
          600: "#dd2542",
          700: "#ba1a35",
          800: "#9b1932",
          900: "#84192f",
        },
        teal: {
          50: "#eefbfc",
          100: "#d3f3f6",
          200: "#ade7ed",
          300: "#77d5df",
          400: "#3fb9c8",
          500: "#2CB1C7",
          600: "#20829a",
          700: "#1f697e",
          800: "#215668",
          900: "#1f4859",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
