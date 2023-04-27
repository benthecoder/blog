/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Averia Serif Libre', 'serif'],
      },
      fontSize: {
        xs: '0.22rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
