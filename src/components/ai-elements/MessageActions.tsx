/**
 * MessageActions — horizontal row of icon buttons shown below a
 * finished assistant message. Actions: Copy, Retry, Like, Dislike.
 *
 * The parent supplies which actions render via the children prop
 * (use MessageAction as children). No state lives here — buttons
 * are controlled.
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton } from "./IconButton";
import { space } from "./theme";

export function MessageActions({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/**
 * MessageAction — single icon button inside a MessageActions row.
 * Sits inside an IconButton (32x32) with a press handler and
 * accessibility label.
 */
export interface MessageActionProps {
  onPress?: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function MessageAction({
  onPress,
  label,
  children,
  disabled = false,
}: MessageActionProps) {
  return (
    <IconButton onPress={onPress} label={label} disabled={disabled}>
      {children}
    </IconButton>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.xs,
    marginTop: space.xs,
    marginLeft: 2,
  },
});
