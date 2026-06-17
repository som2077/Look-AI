/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["TikTokSans16pt-Regular", "sans-serif"],
        regular: ["TikTokSans16pt-Regular", "sans-serif"],
        "regular-italic": ["TikTokSans16pt-RegularItalic", "sans-serif"],
        light: ["TikTokSans16pt-Light", "sans-serif"],
        "light-italic": ["TikTokSans16pt-LightItalic", "sans-serif"],
        medium: ["TikTokSans16pt-Medium", "sans-serif"],
        "medium-italic": ["TikTokSans16pt-MediumItalic", "sans-serif"],
        semibold: ["TikTokSans16pt-SemiBold", "sans-serif"],
        "semibold-italic": ["TikTokSans16pt-SemiBoldItalic", "sans-serif"],
        bold: ["TikTokSans16pt-Bold", "sans-serif"],
        "bold-italic": ["TikTokSans16pt-BoldItalic", "sans-serif"],
        extrabold: ["TikTokSans16pt-ExtraBold", "sans-serif"],
        "extrabold-italic": ["TikTokSans16pt-ExtraBoldItalic", "sans-serif"],
        black: ["TikTokSans16pt-Black", "sans-serif"],
        "black-italic": ["TikTokSans16pt-BlackItalic", "sans-serif"],
      },
    },
  },
  plugins: [],
};
