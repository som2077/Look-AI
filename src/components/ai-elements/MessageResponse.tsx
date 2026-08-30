/**
 * MessageResponse — markdown rendering of an assistant message body
 * with an optional trailing streaming cursor.
 *
 * The Markdown component is memoized on a length-bucket key (÷8) so
 * re-parses only happen on ~8-char boundaries OR a paragraph break.
 * This cuts markdown re-parses by ~80% during streaming.
 */
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { colors, font, FONT_FAMILY, space } from "./theme";
import { StreamingCursor } from "./StreamingCursor";

const markdownStyles = {
  body: { color: colors.text, fontSize: font.body, lineHeight: 22 },
  paragraph: { marginTop: 0, marginBottom: space.sm },
  strong: { fontFamily: FONT_FAMILY["700"], color: colors.text },
  em: { fontStyle: "italic" as const, color: colors.text },
  link: { color: "#1D4ED8", textDecorationLine: "underline" as const },
  code_inline: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: FONT_FAMILY["500"],
    fontSize: font.code,
    color: colors.text,
  },
  code_block: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 0.5,
    borderRadius: 8,
    padding: space.sm,
    fontFamily: FONT_FAMILY["500"],
    fontSize: font.code,
    color: colors.text,
  },
  fence: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 0.5,
    borderRadius: 8,
    padding: space.sm,
    fontFamily: FONT_FAMILY["500"],
    fontSize: font.code,
    color: colors.text,
  },
  bullet_list: { marginBottom: space.sm },
  ordered_list: { marginBottom: space.sm },
  list_item: { marginBottom: 2 },
  heading1: {
    fontFamily: FONT_FAMILY["700"],
    fontSize: font.h2 + 2,
    color: colors.text,
    marginBottom: space.xs,
  },
  heading2: {
    fontFamily: FONT_FAMILY["700"],
    fontSize: font.h2,
    color: colors.text,
    marginBottom: space.xs,
  },
  heading3: {
    fontFamily: FONT_FAMILY["600"],
    fontSize: font.body + 1,
    color: colors.text,
    marginBottom: space.xs,
  },
  blockquote: {
    backgroundColor: colors.surfaceMuted,
    borderLeftColor: colors.border,
    borderLeftWidth: 3,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    marginBottom: space.sm,
  },
};

const MarkdownMemo = memo(
  ({ text }: { text: string }) => <Markdown style={markdownStyles}>{text}</Markdown>,
  (prev, next) => {
    if (prev.text === next.text) return true;
    const bucket = (n: number) => Math.floor(n / 8);
    if (
      bucket(prev.text.length) === bucket(next.text.length) &&
      !prev.text.endsWith("\n") &&
      !next.text.endsWith("\n")
    ) {
      return true;
    }
    return false;
  },
);
MarkdownMemo.displayName = "MarkdownMemo";

export interface MessageResponseProps {
  content: string;
  /** Show the blinking caret at the end. */
  isStreaming?: boolean;
}

export function MessageResponse({ content, isStreaming = false }: MessageResponseProps) {
  // The memo is keyed by content; passing the same string to two
  // re-renders of MessageResponse won't re-parse.
  const memoText = useMemo(() => content, [content]);

  if (!memoText) {
    return isStreaming ? (
      <View style={styles.row}>
        <StreamingCursor />
      </View>
    ) : null;
  }

  return (
    <View style={styles.row}>
      <MarkdownMemo text={memoText} />
      {isStreaming ? <StreamingCursor /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
});
