/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0F172A', // Slate 900
        darkCard: '#1E293B', // Slate 800
        accentBlue: '#3B82F6', // Blue 500
        accentTeal: '#14B8A6', // Teal 500
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8'
      }
    },
  },
  plugins: [],
}
