/**
 * Design tokens for AI Elements-style components.
 * Light theme for v1. Structure allows additive dark mode later
 * (wrap in `getTheme(mode)` returning the same shape).
 *
 * Aesthetic: atelier mood-board. Warm paper background, deep clay
 * accent, hairline rules. Feels like a curator's table, not a chat
 * app. Every value below has a reason rooted in the product (your
 * actual clothes, not generic AI).
 */

export const colors = {
  // Surfaces — warm paper, not pure white
  bg: "#FFFFFFF",
  surface: "#F2EDE4", // assistant panel / muted bubble
  surfaceMuted: "#F4EFE6", // hover / skeleton
  border: "#E2D9C8",
  borderSubtle: "#5d4a25",

  // Text — soft black, warmer than #1D1A27
  text: "#1F1B16",
  textMuted: "#6F6657",
  textSubtle: "#A39885",
  textInverse: "#FAF7F2",

  // Accents
  userBubble: "#1F1B16", // dark bubble on right (Claude convention)
  focus: "#1F1B16",
  warn: "#92400E",
  warnBg: "#FEF3C7",
  warnBorder: "#FCD34D",
  success: "#7C8A4A", // olive-moss (not generic green) — earth, not tech
  error: "#B23A2A", // brick, not neon red

  // Brand — deep clay/burnt sienna. Earth dye, not terracotta.
  brand: "#B8541E",
  brandBg: "#F7E9DA",

  // Status badges
  statusPending: "#A39885",
  statusRunning: "#1F1B16",
  statusDone: "#7C8A4A",
  statusError: "#B23A2A",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const font = {
  body: 15,
  small: 13,
  caption: 11,
  h2: 17,
  code: 13,
} as const;

export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
} as const;

export const theme = { colors, space, radii, font, motion };
export type Theme = typeof theme;

// Font family map for Bricolage Grotesque (matches SectionPrimitives)
export const FONT_FAMILY: Record<string, string> = {
  "400": "BricolageGrotesque_400Regular",
  "500": "BricolageGrotesque_500Medium",
  "600": "BricolageGrotesque_600SemiBold",
  "700": "BricolageGrotesque_700Bold",
  "800": "BricolageGrotesque_800ExtraBold",
};
