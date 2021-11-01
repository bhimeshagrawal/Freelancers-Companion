module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily:{
        Poppins:["Poppins","sans-serif"],
      },
    },
  },
  variants: {
    scrollSnapType: ['responsive'],
    extend: {},
  },
  plugins: [require('tailwindcss-scroll-snap')],
}
