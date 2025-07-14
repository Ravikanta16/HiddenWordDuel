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
        primary: '#007bff',
        'primary-hover': '#0056b3',
        dark: {
          bg: '#282c34',
          text: '#abb2bf',
          time: '#61afef',
          event: '#98c379',
          error: '#e06c75',
          warn: '#e5c07b',
          'game-over': '#c678dd'
        }
      }
    },
  },
  plugins: [],
};
export default config;
