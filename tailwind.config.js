module.exports = {
  purge: {
    enabled: true,
    content: ['../../**/*.ejs'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        Poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  variants: {
    scrollSnapType: ['responsive'],
    extend: {},
  },
  plugins: [],
}
