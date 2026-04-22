/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        underworld: {
          900: '#1A0F2E',
          800: '#2D1B4E',
          700: '#3A2345',
        },
        megara: {
          primary: '#C850C0',
          dark: '#9B59B6',
          light: '#E8D5F5',
        },
        magic: {
          teal: '#00CED1',
          cyan: '#4ECDC4',
          gold: '#FFD700',
        },
        market: {
          // PL markets
          chicago: '#FF6B6B',
          cincinnati: '#F4D03F',
          denver: '#2ECC71',
          minneapolis: '#00CED1',
          // WK markets — match the colors used elsewhere in the Doom app
          birmingham: '#D4A040',
          huntsville: '#F97316',
          knoxville: '#6366F1',
          chattanooga: '#06B6D4',
          montgomery: '#EC4899',
          dothan: '#84CC16',
          gadsden: '#A855F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Cinzel', 'serif'],
        display: ['Cinzel Decorative', 'Cinzel', 'serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 15px 2px rgba(0, 206, 209, 0.4)',
        'glow-gold': '0 0 15px 2px rgba(255, 215, 0, 0.4)',
        'glow-purple': '0 0 15px 2px rgba(200, 80, 192, 0.4)',
      }
    },
  },
  plugins: [],
}