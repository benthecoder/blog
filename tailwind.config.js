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
          phthalo: {
            50: '#f0f9f7',
            100: '#123524', // Darker phthalo green
            200: '#123524/5', // 5% opacity phthalo green
          },
        },
        // Dark mode
        dark: {
          bg: '#1a1b26',
          text: '#c7cce1',
          accent: '#7aa2f7',
          border: '#7aa2f7',
          tag: '#1e2030',
          phthalo: {
            50: '#123524/10', // 10% opacity
            100: '#1c4f36', // Lighter phthalo green for dark mode
            200: '#123524/15', // 15% opacity
          },
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
