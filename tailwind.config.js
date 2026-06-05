/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c0d4ff',
          300: '#93b4fd',
          400: '#6090fa',
          500: '#3b6ef5',
          600: '#2550ea',
          700: '#1d3fd8',
          800: '#1e36af',
          900: '#1e328a',
          950: '#161f55',
        },
      },
    },
  },
  plugins: [],
}
