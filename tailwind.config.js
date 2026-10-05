/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan the hand-written sources only.
  //
  // client/frontend.js is generated from client/frontend.jsx, which is itself
  // assembled from client/src, so scanning src plus the HTML covers every class
  // we author. Including the generated bundle would double the scan, and
  // including client/vendor would mine React and Leaflet for strings that look
  // like class names.
  content: [
    "./client/*.html",
    "./client/src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Self-hosted from client/fonts; see the @font-face in styles.css.
        editorial: ['"Cormorant Garamond"', "Georgia", "Times New Roman", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        verde: {
          dark: "#082736",
          emerald: "#10b981",
          accent: "#0ea5e9",
        },
      },
    },
  },
  plugins: [],
};
