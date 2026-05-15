/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1b1e2e',
          light: '#252840',
          mid: '#2a2f45',
          dark: '#151827',
        },
        cream: '#faf6f0',
        rose: {
          50: '#fdf5f2',
          100: '#fde8e3',
          200: '#f0ddd8',
          300: '#d4a898',
          400: '#e8a898',
          500: '#c97b6e',
          600: '#b5615a',
          700: '#8b4a42',
          800: '#7a3f38',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'rose-grad': 'linear-gradient(135deg, #c97b6e, #b5615a)',
      },
    },
  },
  plugins: [],
}
