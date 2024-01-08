/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-averia)'],
      },
      fontSize: {
        xs: '0.22rem',
      },
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '&nbsp;&nbsp;',
            },
            'code::after': {
              content: '&nbsp;&nbsp;',
            },
            code: {
              background: '#ffeff0',
              wordWrap: 'break-word',
              boxDecorationBreak: 'clone',
              padding: '.1rem .3rem .2rem',
              borderRadius: '.2rem',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
