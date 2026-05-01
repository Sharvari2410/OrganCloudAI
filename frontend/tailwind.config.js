/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f8ff",
          100: "#dceeff",
          500: "#1f90ff",
          600: "#1976d2",
          700: "#155ca8",
        },
        emeraldSoft: "#2ccf8a",
        graphite: "#0f172a",
      },
      boxShadow: {
        card: "0 20px 45px -28px rgba(15, 23, 42, 0.35)",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floatIn: "floatIn 0.55s ease-out forwards",
      },
    },
  },
  plugins: [],
};
