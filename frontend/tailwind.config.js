/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        brand: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(99,102,241,0.3)",
        "glow": "0 0 20px rgba(99,102,241,0.5)",
        "card-hover": "0 10px 25px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};