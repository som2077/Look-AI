/**
 * Message — container. AI Elements visual:
 *  - from="user"     → right-aligned, dark ink bubble, cream text, max 80% width
 *  - from="assistant"→ transparent, full-width, left-aligned
 *  - from="system"   → muted, centered
 *
 * The user bubble is dark (`colors.userBubble`) so the eye instantly
 * tells whose turn it is. Assistant messages breathe (no bubble); the
 * streaming caret at the end of the line is the only "who's typing"
 * signal the user needs.
 */
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, FONT_FAMILY, radii, space } from "./theme";
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
        <View style={styles.bubbleUser}>
          {/* Recolor any text inside to cream so user content stays
              legible against the dark bubble without forcing every
              call site to set its own color. */}
          <UserBubbleInner>{children}</UserBubbleInner>
        </View>
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

// Walks the children once and tints any Text nodes to the cream
// inverse. Non-text nodes pass through untouched.
function UserBubbleInner({ children }: { children: React.ReactNode }) {
  const wrap = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      return (
        <Text
          style={{ color: colors.textInverse, fontFamily: FONT_FAMILY["500"] }}
        >
          {node}
        </Text>
      );
    }
    if (React.isValidElement(node)) {
      const el = node as React.ReactElement<{
        children?: React.ReactNode;
        style?: any;
      }>;
      if (el.type === Text) {
        const existing = (el.props.style ?? []) as any;
        const merged = [
          existing,
          { color: colors.textInverse, fontFamily: FONT_FAMILY["500"] },
        ];
        return React.cloneElement(el, { style: merged });
      }
      if (el.props.children !== undefined) {
        return React.cloneElement(el, {
          children: React.Children.map(el.props.children, wrap),
        } as any);
      }
    }
    return node;
  };
  return <>{React.Children.map(children, wrap)}</>;
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
  // User bubble — dark ink surface, cream text. 18pt corners read
  // as a quiet "pill" rather than a sharp box. Asymmetric corners
  // (smaller at the tail end) would be even more conversational,
  // but that's a per-platform affordance we don't have here.
  bubbleUser: {
    maxWidth: "80%",
    backgroundColor: colors.userBubble,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(250,247,242,0.06)",
  },
  bubbleSystem: {
    maxWidth: "85%",
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radii.md,
  },
});
