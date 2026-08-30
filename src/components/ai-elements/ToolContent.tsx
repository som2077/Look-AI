/**
 * ToolContent — composes ToolInput + ToolOutput inside the collapsible
 * body. Renders inside an inner Card so the input/output sit on a
 * soft surface visually distinct from the header.
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii, space } from "./theme";
import { ToolInput } from "./ToolInput";
import { ToolOutput } from "./ToolOutput";

export interface ToolContentProps {
  /** Optional input payload to render above the output. */
  input?: unknown;
  /** Default true — controls whether ToolInput starts expanded. */
  inputDefaultExpanded?: boolean;
  children: React.ReactNode;
}

export function ToolContent({
  input,
  inputDefaultExpanded = false,
  children,
}: ToolContentProps) {
  return (
    <View style={styles.body}>
      {input !== undefined ? (
        <ToolInput data={input} defaultExpanded={inputDefaultExpanded} />
      ) : null}
      <ToolOutput>{children}</ToolOutput>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: colors.surfaceMuted,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    paddingBottom: space.xs,
  },
});
