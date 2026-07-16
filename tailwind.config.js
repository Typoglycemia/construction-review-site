/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#222222",
        paper: "#FFFFFF",
        steel: "#1A56DB",
        caution: "#E8A400",
        seal: "#D9480F",
        inspect: "#2F9E44",
      },
      fontFamily: {
        display: ["'Noto Sans JP'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        brush: ["'Yuji Syuku'", "serif"],
      },
    },
  },
  plugins: [],
};
