/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Define 'Inter' como a fonte sans-serif padrão
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
