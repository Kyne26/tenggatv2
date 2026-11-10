const c = (n) => `rgb(var(--${n}) / <alpha-value>)`;
module.exports = {
  content: ["./*.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        paper: c("bg"),
        surface: c("sf"),
        line: c("ln"),
        ink: c("ink"),
        mute: c("mute"),
        brand: c("brand"),
        soft: c("soft"),
        danger: c("red"),
        warn: c("amber"),
        ok: c("ok"),
      },
      fontFamily: {
        sans: [
          '"Google Sans"',
          "Roboto",
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
    },
  },
};
