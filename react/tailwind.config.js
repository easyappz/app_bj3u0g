/* Tailwind config for CRA */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        slateglass: {
          700: "#0f172a",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
