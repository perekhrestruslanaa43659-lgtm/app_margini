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
        navy: "#14140F",
        accent: "#F5C518",
        dm: {
          yellow: "#F5C518",
          "yellow-dark": "#D9A800",
          // Accento cliccabile (link/hover/focus in tutta l'app): non piu' un rosso
          // mattone, ma un ink scuro coerente col registro premium nero/bianco del
          // sito ufficiale — vedi SKILLS-UI.md.
          maroon: "#14140F",
          "maroon-dark": "#2A2A22",
          ink: "#14140F",
          cream: "#FAFAF7",
          wood: "#7A7A6E",
          line: "#E4E2DA",
        },
      },
      fontFamily: {
        display: ["Oswald", "Arial Narrow", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
