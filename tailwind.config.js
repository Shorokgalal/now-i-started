/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8F6FF",
        text: "#2B1B47",
        border: "#4A2D7A",
        accent: "#7C6AE6",
        ring: "#ECE8FF",
        shadowtint: "#D8D1FF",
      },
      boxShadow: {
        lavender:
          "0 10px 30px rgba(124,106,230,0.08), 0 2px 10px rgba(216,209,255,0.45)",
      },
      fontFamily: {
        serif: [
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
      },
    },
  },
  plugins: [],
};
