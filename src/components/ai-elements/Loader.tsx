/**
 * Loader — bigger spinner with an optional caption. Used as the
 * ListFooter while the assistant is streaming (replaces the old
 * TypingIndicator).
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, FONT_FAMILY, space } from "./theme";
import { Spinner } from "./Spinner";

export interface LoaderProps {
  /** Optional caption (e.g. "StyleAI is thinking…"). */
  caption?: string;
  /** Size of the dots. */
  size?: number;
  /** Color of the dots. */
  color?: string;
}

export function Loader({
  caption = "StyleAI is thinking…",
  size = 7,
  color = colors.textMuted,
}: LoaderProps) {
  return (
    <View style={styles.row}>
      <Spinner size={size} color={color} gap={4} />
      {caption ? (
        <Text style={[styles.caption, { fontFamily: FONT_FAMILY["500"] }]}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  caption: {
    fontSize: font.small,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
