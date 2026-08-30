/**
 * Reasoning — collapsible card showing the AI's "thinking" process.
 * Auto-opens while streaming, auto-closes when finished.
 *
 * NOTE: The `react-native-gen-ui` library doesn't expose a way to
 * mark an assistant message as a reasoning part. For now this
 * component is wired to a side-store (or a future SSE reasoning
 * channel) — the parent controls `content` and `isStreaming`.
 */
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  IconChevronDown,
  IconChevronRight,
  IconBrain,
} from "@tabler/icons-react-native";
import Markdown from "react-native-markdown-display";
import { colors, font, FONT_FAMILY, radii, space } from "./theme";
import { Spinner } from "./Spinner";
import { Collapsible } from "./Collapsible";

const reasoningStyles = {
  body: { color: colors.textMuted, fontSize: font.small, lineHeight: 18 },
  paragraph: { marginTop: 0, marginBottom: space.xs },
};

export interface ReasoningProps {
  /** The reasoning text. Empty string renders nothing. */
  content: string;
  /** When true, the section is auto-opened and the spinner shows. */
  isStreaming?: boolean;
  /** Optional duration label (e.g. "Thought for 2.3s"). */
  durationLabel?: string;
}

export function Reasoning({
  content,
  isStreaming = false,
  durationLabel,
}: ReasoningProps) {
  const [open, setOpen] = useState(isStreaming);

  useEffect(() => {
    // Auto-open while streaming, auto-close when done (AI Elements behavior).
    setOpen(isStreaming);
  }, [isStreaming]);

  if (!content && !isStreaming) return null;

  const label = isStreaming
    ? "Thinking…"
    : durationLabel ?? "Thought";

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
        accessibilityRole="button"
      >
        {isStreaming ? (
          <Spinner size={5} color={colors.textMuted} />
        ) : (
          <IconBrain size={14} color={colors.textMuted} strokeWidth={2} />
        )}
        <Text
          style={[styles.label, { fontFamily: FONT_FAMILY["600"] }]}
        >
          {label}
        </Text>
        {open ? (
          <IconChevronDown size={14} color={colors.textMuted} />
        ) : (
          <IconChevronRight size={14} color={colors.textMuted} />
        )}
      </Pressable>
      <Collapsible open={open}>
        {content ? (
          <View style={styles.body}>
            <Markdown style={reasoningStyles}>{content}</Markdown>
          </View>
        ) : null}
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: space.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  label: {
    flex: 1,
    fontSize: font.small,
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  body: {
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
});
