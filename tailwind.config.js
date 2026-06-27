/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: { DEFAULT: '#6C5CE7', light: '#A29BFE', bg: '#F0EEFF', dark: '#4834D4' },
        orange: { DEFAULT: '#FF6B35', bg: '#FFF3EE' },
        green:  { DEFAULT: '#00B894', bg: '#E8FBF6' },
        red:    { DEFAULT: '#E17055', bg: '#FEF0EC' },
        page:   '#F5F5F7',
        card:   '#FFFFFF',
      },
      borderRadius: { card: '16px', btn: '12px' },
      boxShadow: { card: '0 1px 3px rgba(0,0,0,0.06)' },
    },
  },
  plugins: [],
}
