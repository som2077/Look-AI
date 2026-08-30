/**
 * Message — container. AI Elements visual:
 *  - from="user"     → right-aligned, secondary bg, max 80% width
 *  - from="assistant"→ transparent, full-width, left-aligned
 *  - from="system"   → muted, centered
 * No avatars, names, or role badges by default (matches Vercel design).
 */
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, radii, space } from "./theme";
import type { FromRole } from "./types";

export interface MessageProps {
  from: FromRole;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Message({ from, children, style }: MessageProps) {
  if (from === "user") {
    return (
      <View style={[styles.row, styles.rowUser, style]}>
        <View style={styles.bubbleUser}>{children}</View>
      </View>
    );
  }
  if (from === "system") {
    return (
      <View style={[styles.row, styles.rowSystem, style]}>
        <View style={styles.bubbleSystem}>{children}</View>
      </View>
    );
  }
  // assistant
  return (
    <View style={[styles.row, styles.rowAssistant, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  rowAssistant: {
    justifyContent: "flex-start",
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowSystem: {
    justifyContent: "center",
  },
  // User bubble — light gray surface, dark text, all sides equally
  // rounded. Matches the Claude reference: subtle, not a heavy
  // dark pill. Sits at 80% max width so long messages wrap.
  bubbleUser: {
    maxWidth: "80%",
    backgroundColor: colors.userBubble,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.sm + 2,
    borderRadius: radii.lg,
  },
  bubbleSystem: {
    maxWidth: "85%",
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radii.md,
  },
});
