/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["BricolageGrotesque_400Regular", "sans-serif"],
        regular: ["BricolageGrotesque_400Regular", "sans-serif"],
        medium: ["BricolageGrotesque_500Medium", "sans-serif"],
        semibold: ["BricolageGrotesque_600SemiBold", "sans-serif"],
        bold: ["BricolageGrotesque_700Bold", "sans-serif"],
        extrabold: ["BricolageGrotesque_800ExtraBold", "sans-serif"],
        black: ["BricolageGrotesque_800ExtraBold", "sans-serif"],
        bricolage: ["BricolageGrotesque_700Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
