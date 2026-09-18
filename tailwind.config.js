/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/**/*.{html,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        editorial: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        verde: {
          dark: '#082736',
          emerald: '#10b981',
          accent: '#0ea5e9',
        }
      }
    },
  },
  plugins: [],
}
