/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Crucial: This scans all your React components!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}