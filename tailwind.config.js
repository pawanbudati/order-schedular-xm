/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bingx: {
          blue: '#1E5BF0',
          cyan: '#00F2FE',
          dark: '#0B0E14',
          card: '#121824',
          border: '#1E293B',
          accent: '#2563EB',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
