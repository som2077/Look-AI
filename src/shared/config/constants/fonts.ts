// Font configuration for Bricolage Grotesque & TikTokSans

import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";

export const FONTS = {
  // Bricolage Grotesque (Primary Brand Font)
  normal: "BricolageGrotesque_400Regular",
  regular: "BricolageGrotesque_400Regular",
  medium: "BricolageGrotesque_500Medium",
  semiBold: "BricolageGrotesque_600SemiBold",
  bold: "BricolageGrotesque_700Bold",
  extraBold: "BricolageGrotesque_800ExtraBold",
  black: "BricolageGrotesque_800ExtraBold",

  // Italic & Secondary
  italic: "TikTokSans16pt-RegularItalic",
  regularItalic: "TikTokSans16pt-RegularItalic",
  light: "TikTokSans16pt-Light",
  lightItalic: "TikTokSans16pt-LightItalic",
} as const;

// Font file mapping for useFonts hook
export const FONT_ASSETS = {
  "BricolageGrotesque_400Regular": BricolageGrotesque_400Regular,
  "BricolageGrotesque_500Medium": BricolageGrotesque_500Medium,
  "BricolageGrotesque_600SemiBold": BricolageGrotesque_600SemiBold,
  "BricolageGrotesque_700Bold": BricolageGrotesque_700Bold,
  "BricolageGrotesque_800ExtraBold": BricolageGrotesque_800ExtraBold,
  "TikTokSans16pt-Regular": require("@/assets/fonts/TikTokSans16pt-Regular.otf"),
  "TikTokSans16pt-RegularItalic": require("@/assets/fonts/TikTokSans16pt-RegularItalic.otf"),
  "TikTokSans16pt-Light": require("@/assets/fonts/TikTokSans16pt-Light.otf"),
  "TikTokSans16pt-Medium": require("@/assets/fonts/TikTokSans16pt-Medium.otf"),
  "TikTokSans16pt-SemiBold": require("@/assets/fonts/TikTokSans16pt-SemiBold.otf"),
  "TikTokSans16pt-Bold": require("@/assets/fonts/TikTokSans16pt-Bold.otf"),
  "TikTokSans16pt-ExtraBold": require("@/assets/fonts/TikTokSans16pt-ExtraBold.otf"),
  "SansitaOne-Regular": require("@/assets/fonts/SansitaOne-Regular.ttf"),
};

export type FontFamily = (typeof FONTS)[keyof typeof FONTS];
