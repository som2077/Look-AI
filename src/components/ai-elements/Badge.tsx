/**
 * Badge — small-caps status pill. Colors mapped from theme by status.
 */
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, font, radii, space, FONT_FAMILY } from "./theme";

export type BadgeVariant =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "neutral";

const COLOR_MAP: Record<BadgeVariant, { bg: string; fg: string }> = {
  pending: { bg: "#F3F4F6", fg: colors.statusPending },
  running: { bg: "#EEF2FF", fg: colors.statusRunning },
  completed: { bg: "#ECFDF5", fg: colors.statusDone },
  error: { bg: "#FEF2F2", fg: colors.statusError },
  neutral: { bg: colors.surface, fg: colors.textMuted },
};

export interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  style?: ViewStyle;
}

export function Badge({ variant = "neutral", label, style }: BadgeProps) {
  const c = COLOR_MAP[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.fg + "20" },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: c.fg, fontFamily: FONT_FAMILY["600"] },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 0.5,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: font.caption,
    lineHeight: 14,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
