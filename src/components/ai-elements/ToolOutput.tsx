/**
 * ToolOutput — container for the tool's rendered output. Accepts
 * ReactNode so the existing chat cards can be nested directly.
 */
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { space } from "./theme";

export interface ToolOutputProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ToolOutput({ children, style }: ToolOutputProps) {
  return <View style={[styles.wrap, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
});
