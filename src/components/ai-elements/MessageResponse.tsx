/**
 * MessageResponse — markdown rendering of an assistant message body
 * with an optional trailing streaming cursor.
 *
 * The Markdown component is memoized on a length-bucket key (÷8) so
 * re-parses only happen on ~8-char boundaries OR a paragraph break.
 * This cuts markdown re-parses by ~80% during streaming.
 *
 * `sanitizeAssistantText` runs on the content string before rendering.
 * It strips the most common "AI duplicated the card" patterns so that
 * a stray markdown image or `Style Note:` / `Why:` bullet doesn't
 * visually duplicate the OutfitSuggestionCard. Legitimate prose is
 * untouched.
 */
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { colors, font, FONT_FAMILY, space } from "./theme";
import { StreamingCursor } from "./StreamingCursor";

// A line that is ONLY a markdown image, with optional surrounding ws.
const IMG_ONLY_LINE = /^[ \t]*!\[[^\]]*\]\([^)]+\)[ \t]*$/gm;
// Inline `![alt](url)` anywhere in a line.
const IMG_MD = /!\[[^\]]*\]\([^)]+\)/g;
// Bullet lines that duplicate the card's "Style Note" / "Why" fields.
// Matches "- Style Note: ...", "* **Style Note:** ...", "• Why: ..." etc.
// The colon is the giveaway that this is a *label* re-stating the card
// field, not a legitimate sentence starting with "Why".
const STYLE_NOTE_BULLET = /^[ \t]*[-*•][ \t]*\*?\*?Style Note:[\s:].*$/i;
const WHY_BULLET = /^[ \t]*[-*•][ \t]*\*?\*?Why:[\s].*$/i;
// Three-or-more blank lines → collapse to a single blank.
const TRIPLE_BLANK = /\n{3,}/g;

/**
 * Strip the patterns the AI sometimes emits that visually duplicate
 * the `OutfitSuggestionCard`:
 *   1. A line that is ONLY `![alt](url)` — the most common "card
 *      duplicate" pattern (e.g. `![gray-hoodie](https://...)` on
 *      its own line).
 *   2. Any remaining inline image syntax on a longer line.
 *   3. Bullet lines that are clearly re-stating the card's
 *      `style_note` / `why` fields.
 * Legitimate prose (e.g. the wardrobe-nudge sentence) is left alone.
 */
function sanitizeAssistantText(s: string | null | undefined): string {
  if (!s) return "";
  let out = s;
  // 1) drop image-only lines
  out = out.replace(IMG_ONLY_LINE, "");
  // 2) drop inline image syntax that survived in a longer line
  out = out.replace(IMG_MD, "");
  // 3) drop bullet lines duplicating card fields
  out = out
    .split("\n")
    .filter((line) => !STYLE_NOTE_BULLET.test(line) && !WHY_BULLET.test(line))
    .join("\n");
  // 4) collapse triple+ blank lines back to a single blank
  out = out.replace(TRIPLE_BLANK, "\n\n").trim();
  return out;
}

const markdownStyles = {
  body: { color: colors.text, fontSize: font.body, lineHeight: 24 },
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
  // The memo is keyed by the sanitized content; passing the same
  // string to two re-renders of MessageResponse won't re-parse.
  // The sanitizer strips the patterns the AI sometimes emits that
  // duplicate the `OutfitSuggestionCard` (image markdown, style-note
  // / why bullets). See sanitizeAssistantText above.
  const memoText = useMemo(
    () => sanitizeAssistantText(content),
    [content],
  );

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
