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
        // "Tinte" – tiefes Dokumenten-Navy statt Standard-Tailwind-Blau.
        // Wirkt seriöser und passt zur Navy-Linie der Geschäftsdokumente.
        brand: {
          50:  '#f2f6fb',
          100: '#e4edf7',
          200: '#c6daee',
          300: '#97bbde',
          400: '#6296c9',
          500: '#3d77b3',
          600: '#2b5d99',
          700: '#244c7e',
          800: '#203f68',
          900: '#1e3557',
          950: '#14233a',
        },
        // Dezenter Gold-Akzent – nur für Umsatz-Highlights und kleine Marker.
        gold: {
          300: '#e6cd8e',
          400: '#d9b25c',
          500: '#c89b3f',
          600: '#aa7e2c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'top': '0 -1px 3px 0 rgb(0 0 0 / 0.1), 0 -1px 2px -1px rgb(0 0 0 / 0.1)',
        'card': '0 1px 2px rgb(20 35 58 / 0.04), 0 2px 8px rgb(20 35 58 / 0.04)',
        'card-hover': '0 2px 4px rgb(20 35 58 / 0.06), 0 8px 24px rgb(20 35 58 / 0.08)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [],
}
