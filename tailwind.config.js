/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1e3a5f",
          dark: "#152942",
          light: "#2a4a73",
        },
        sky: {
          DEFAULT: "#7dd3fc",
          light: "#bae6fd",
          dark: "#0ea5e9",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
