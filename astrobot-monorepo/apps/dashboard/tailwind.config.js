/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          50: "#f2f5ff",
          100: "#e6eaff",
          200: "#cdd6ff",
          300: "#a7b6ff",
          400: "#798cff",
          500: "#4c5cf9",
          600: "#3e41f0",
          700: "#3534d3",
          800: "#2f2eab",
          900: "#2d2c87",
          950: "#1a194e",
        },
        cosmic: {
          50: "#f5f2ff",
          100: "#ece8ff",
          200: "#d9d1ff",
          300: "#bcabff",
          400: "#9f7dff",
          500: "#8250ff",
          600: "#7033f5",
          700: "#6026db",
          800: "#5023b6",
          900: "#42239c",
          950: "#271362",
        },
        nebula: {
          50: "#f3f1ff",
          100: "#ece5ff",
          200: "#daccff",
          300: "#bea5ff",
          400: "#a173ff",
          500: "#854cff",
          600: "#7923ff",
          700: "#6d19eb",
          800: "#5c17c8",
          900: "#4c19a3",
          950: "#2e0e66",
        },
      },
    },
  },
  plugins: [],
}