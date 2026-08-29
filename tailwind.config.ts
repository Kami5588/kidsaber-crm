import type { Config } from "tailwindcss";

/**
 * Paleta derivada da logo da KidSaber.
 *
 * As quatro escalas correspondem às cores do mascote:
 *   navy  -> azul royal do cabelo e dos óculos (#2B4CA8)
 *   teal  -> azul claro da mecha e do livro    (#29ABE2)
 *   gold  -> amarelo do rosto e do livro       (#FCD116)
 *   coral -> vermelho da lombada e do "Kid"    (#E11D3C)
 *
 * Os nomes foram mantidos porque já estão espalhados pelo sistema; o que mudou
 * foram os valores, então a identidade da marca se aplica ao site e ao painel
 * de uma vez só. Os aliases em `brand` existem para quando o nome importa mais
 * que a escala.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EFF3FC",
          100: "#DBE4F8",
          200: "#BACCF0",
          300: "#8FAAE5",
          400: "#6285D6",
          500: "#3E63C3",
          600: "#2B4CA8",
          700: "#243E8A",
          800: "#1E336F",
          900: "#17264F",
        },
        teal: {
          50: "#EFFAFE",
          100: "#D8F2FC",
          200: "#B0E6F9",
          300: "#7BD4F2",
          400: "#4CC0EA",
          500: "#29ABE2",
          600: "#1B8ABC",
          700: "#1A6E97",
          800: "#1C5A7C",
          900: "#1B4B67",
        },
        gold: {
          50: "#FFFCEB",
          100: "#FFF6C6",
          200: "#FFEC88",
          300: "#FFE44A",
          400: "#FEDD3F",
          500: "#FCD116",
          600: "#E0B106",
          700: "#BA8709",
          800: "#96690E",
          900: "#7C570F",
        },
        coral: {
          50: "#FEF2F4",
          100: "#FDE2E7",
          200: "#FBC9D1",
          300: "#F79DAC",
          400: "#F06880",
          500: "#E11D3C",
          600: "#C8102E",
          700: "#A70F28",
          800: "#8B1025",
          900: "#761023",
        },
        brand: {
          blue: "#2B4CA8",
          sky: "#29ABE2",
          yellow: "#FCD116",
          red: "#E11D3C",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        // Gradientes da marca, usados no hero, nos cartões e nos destaques.
        "brand-hero":
          "linear-gradient(135deg, #17264F 0%, #243E8A 45%, #2B4CA8 75%, #1B8ABC 100%)",
        "brand-sky": "linear-gradient(135deg, #29ABE2 0%, #2B4CA8 100%)",
        "brand-sun": "linear-gradient(135deg, #FCD116 0%, #FEDD3F 100%)",
        "brand-warm": "linear-gradient(135deg, #E11D3C 0%, #FCD116 100%)",
        "brand-soft": "linear-gradient(160deg, #EFF3FC 0%, #EFFAFE 50%, #FFFCEB 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up .6s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
