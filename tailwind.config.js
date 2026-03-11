/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',   // orange-500 — Hauptakzent (wie Web-App)
        secondary: '#16a34a', // green-600 — Sekundär
      },
    },
  },
  plugins: [],
};
