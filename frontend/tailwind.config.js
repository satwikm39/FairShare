/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#00f396', // More 'electric' green from yaat.me
          600: '#059669',
          900: '#064e3b',
        },
        zinc: {
          950: '#09090b',
        }
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '9999px',
        'sharp': '2px', // Explicit alias for clarity
      }
    },
  },
  plugins: [],
}
