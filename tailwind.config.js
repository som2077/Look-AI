/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["TikTokSans16pt-Regular", "sans-serif"],
        regular: ["TikTokSans16pt-Regular", "sans-serif"],
        medium: ["TikTokSans16pt-Medium", "sans-serif"],
        semibold: ["TikTokSans16pt-SemiBold", "sans-serif"],
        bold: ["TikTokSans16pt-Bold", "sans-serif"],
        extrabold: ["TikTokSans16pt-ExtraBold", "sans-serif"],
        black: ["TikTokSans16pt-Black", "sans-serif"],
        light: ["TikTokSans16pt-Light", "sans-serif"],
      },
    },
  },
  plugins: [],
};
