// Font configuration for TikTokSans
// Maps font weights and styles to their respective font files

export const FONTS = {
  // Regular
  normal: "TikTokSans16pt-Regular",
  regular: "TikTokSans16pt-Regular",

  // Italic
  italic: "TikTokSans16pt-RegularItalic",
  regularItalic: "TikTokSans16pt-RegularItalic",

  // Light (300)
  light: "TikTokSans16pt-Light",
  lightItalic: "TikTokSans16pt-LightItalic",

  // Medium (500)
  medium: "TikTokSans16pt-Medium",
  mediumItalic: "TikTokSans16pt-MediumItalic",

  // SemiBold (600)
  semiBold: "TikTokSans16pt-SemiBold",
  semiBoldItalic: "TikTokSans16pt-SemiBoldItalic",

  // Bold (700)
  bold: "TikTokSans16pt-Bold",
  boldItalic: "TikTokSans16pt-BoldItalic",

  // ExtraBold (800)
  extraBold: "TikTokSans16pt-ExtraBold",
  extraBoldItalic: "TikTokSans16pt-ExtraBoldItalic",

  // Black (900)
  black: "TikTokSans16pt-Black",
  blackItalic: "TikTokSans16pt-BlackItalic",
} as const;

// Font file mapping for useFonts hook
export const FONT_ASSETS = {
  "TikTokSans16pt-Regular": require("@/assets/fonts/TikTokSans16pt-Regular.otf"),
  "TikTokSans16pt-RegularItalic": require("@/assets/fonts/TikTokSans16pt-RegularItalic.otf"),
  "TikTokSans16pt-Light": require("@/assets/fonts/TikTokSans16pt-Light.otf"),
  "TikTokSans16pt-LightItalic": require("@/assets/fonts/TikTokSans16pt-LightItalic.otf"),
  "TikTokSans16pt-Medium": require("@/assets/fonts/TikTokSans16pt-Medium.otf"),
  "TikTokSans16pt-MediumItalic": require("@/assets/fonts/TikTokSans16pt-MediumItalic.otf"),
  "TikTokSans16pt-SemiBold": require("@/assets/fonts/TikTokSans16pt-SemiBold.otf"),
  "TikTokSans16pt-SemiBoldItalic": require("@/assets/fonts/TikTokSans16pt-SemiBoldItalic.otf"),
  "TikTokSans16pt-Bold": require("@/assets/fonts/TikTokSans16pt-Bold.otf"),
  "TikTokSans16pt-BoldItalic": require("@/assets/fonts/TikTokSans16pt-BoldItalic.otf"),
  "TikTokSans16pt-ExtraBold": require("@/assets/fonts/TikTokSans16pt-ExtraBold.otf"),
  "TikTokSans16pt-ExtraBoldItalic": require("@/assets/fonts/TikTokSans16pt-ExtraBoldItalic.otf"),
  "TikTokSans16pt-Black": require("@/assets/fonts/TikTokSans16pt-Black.otf"),
  "TikTokSans16pt-BlackItalic": require("@/assets/fonts/TikTokSans16pt-BlackItalic.otf"),
};

export type FontFamily = (typeof FONTS)[keyof typeof FONTS];
