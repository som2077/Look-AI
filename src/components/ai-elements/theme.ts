/**
 * Design tokens for AI Elements-style components.
 * Light theme for v1. Structure allows additive dark mode later
 * (wrap in `getTheme(mode)` returning the same shape).
 */

export const colors = {
  // Surfaces
  bg: "#FFFFFF",
  surface: "#F2F2F7", // assistant panel / light user bubble
  surfaceMuted: "#F9FAFB", // hover / skeleton
  border: "#E5E7EB",
  borderSubtle: "#F1F1F4",

  // Text
  text: "#1D1A27",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",
  textInverse: "#FFFFFF",

  // Accents
  userBubble: "#F2F2F7", // light-gray user message bubble (was #1D1A27)
  focus: "#1D1A27",
  warn: "#92400E",
  warnBg: "#FEF3C7",
  warnBorder: "#FCD34D",
  success: "#10B981",
  error: "#EF4444",

  // Brand
  brand: "#FF7A45", // peach accent (top-bar "+" button)
  brandBg: "#FFE7DA", // soft peach wash (used sparingly for confirmation backdrop)

  // Status badges
  statusPending: "#9CA3AF",
  statusRunning: "#1D1A27",
  statusDone: "#10B981",
  statusError: "#EF4444",
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
  small: 12,
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
