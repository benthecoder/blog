/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light mode
        light: {
          bg: '#fffcf7',
          text: '#2c353d',
          accent: '#927456',
          border: '#e6c9a8',
          tag: '#faf4eb',
        },
        // Dark mode
        dark: {
          bg: '#1a1b26',
          text: '#c7cce1',
          accent: '#7aa2f7',
          border: '#7aa2f7',
          tag: '#1e2030',
        },
      },
      fontFamily: {
        serif: ['var(--font-averia)'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};
