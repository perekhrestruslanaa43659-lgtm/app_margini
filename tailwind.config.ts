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
        navy: "#1A1A1A",
        accent: "#F5C518",
        dm: {
          yellow: "#F5C518",
          "yellow-dark": "#D9A800",
          maroon: "#8B2E2E",
          "maroon-dark": "#6E2323",
          ink: "#1A1A1A",
          cream: "#FBF6EC",
          wood: "#A9784B",
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
