/**
 * IconButton — 32×32 round pressable used by MessageAction and
 * PromptInputTools. Tap target slightly larger via padding.
 */
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, motion } from "./theme";
import type { IconButtonProps } from "./types";

export function IconButton({
  onPress,
  label,
  children,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        { opacity: disabled ? 0.35 : pressed ? 0.5 : 1 },
      ]}
    >
      <View pointerEvents="none">{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.border,
  },
});
