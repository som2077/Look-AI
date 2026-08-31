/**
 * ChatHeader — the top bar of the StyleAI chat. Back button on the
 * left, "Style Chat" wordmark with a pulsing clay dot when streaming,
 * and a quiet new-chat button on the right.
 *
 * The dot is the signature ornament: it identifies the AI visually
 * (no need for "AI:" labels) and tells the user who is "speaking"
 * without an extra "StyleAI is thinking" caption that would compete
 * with the streaming caret already on the last assistant message.
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  IconChevronLeft,
  IconRefresh,
} from "@tabler/icons-react-native";
import { colors, FONT_FAMILY, space } from "./theme";
import { StreamingDot } from "./StreamingDot";

export interface ChatHeaderProps {
  title: string;
  /** When true, the dot pulses — the assistant is streaming. */
  streaming?: boolean;
  onBack: () => void;
  /** Optional handler for the right-side action (e.g. "new chat"). */
  onRefresh?: () => void;
}

export function ChatHeader({
  title,
  streaming = false,
  onBack,
  onRefresh,
}: ChatHeaderProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onBack}
        style={styles.iconBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <IconChevronLeft size={24} color={colors.text} strokeWidth={2.1} />
      </Pressable>

      <View style={styles.titleSlot}>
        <View style={styles.titleRow}>
          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </Text>
          <StreamingDot active={streaming} size={7} style={styles.dot} />
        </View>
      </View>

      {onRefresh ? (
        <Pressable
          onPress={onRefresh}
          style={styles.iconBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
        >
          <IconRefresh size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.sm,
    backgroundColor: colors.bg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: -0.3,
    fontFamily: FONT_FAMILY["600"],
  },
  dot: {
    marginLeft: 1,
  },
});