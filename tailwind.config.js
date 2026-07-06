/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green:  { DEFAULT: '#3ecf8e', dark: '#1a9e65' },
        purple: { DEFAULT: '#8b5cf6' },
        blue:   { DEFAULT: '#4a9eff' },
        amber:  { DEFAULT: '#f59e0b' },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
