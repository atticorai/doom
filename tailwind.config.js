/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",
    "./config.js",
    "./data-*.js"
  ],
  theme: {
    extend: {
      colors: {
        plum:     { DEFAULT: "#9b7bb0", dark: "#2d1f42", edge: "#4a3565" },
        pegasus:  "#4AC8E8",
        gold:     "#D4A040",
        rose:     "#E85A7A",
        teal:     "#5BC4A0",
        orchid:   { DEFAULT: "#1e1233", mid: "#2a1a3e", shadow: "#2d1f42" },
        lilac:    { DEFAULT: "#C4A0C8", white: "#E8DFF0", bright: "#F0E8F8" },
        muted:    "#9B8EAD",
        parchment:{ DEFAULT: "#e8dcc4", dark: "#d4c4a0", light: "#f0e8d8" }
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', "serif"],
        body:    ['"DM Sans"', "sans-serif"],
        greek:   ['"Cinzel"', "serif"]
      }
    }
  },
  // Safelist brand-palette classes so they stay in the CSS even if the
  // only references are built from template strings at runtime.
  safelist: [
    { pattern: /^(bg|text|border|from|to|via)-(plum|pegasus|gold|rose|teal|orchid|lilac|muted|parchment)(-\w+)?$/ }
  ],
  plugins: []
};
