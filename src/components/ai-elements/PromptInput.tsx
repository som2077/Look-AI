/**
 * PromptInput — auto-resizing text input with a tools slot and a
 * submit button. Follows the Vercel AI Elements PromptInput design:
 * a card-style container with proper side margins, a tools slot on
 * the left, a textarea in the middle, and a submit button on the
 * right that always remains visible.
 *
 * Visual states for the submit button:
 *  - idle + empty      → muted (light gray bg, muted arrow icon)
 *  - idle + has text   → active (dark bg, white arrow, soft shadow)
 *  - streaming         → stop (red bg, filled stop icon)
 *
 * The whole input area is wrapped in an outer View with proper
 * horizontal padding so it never bleeds edge-to-edge.
 */
import React, { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import {
  IconArrowNarrowUp,
  IconPlayerStopFilled,
} from "@tabler/icons-react-native";
import { colors, font, FONT_FAMILY, radii, space } from "./theme";

const MAX_LINES = 5;
const LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = 24;
const VERTICAL_PADDING = 12;
const SUBMIT_SIZE = 40;

export interface PromptInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  isStreaming?: boolean;
  /** Rendered in the left tools slot (above the input). */
  tools?: React.ReactNode;
  placeholder?: string;
  style?: ViewStyle;
  /** Max characters; default 2000. */
  maxLength?: number;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isStreaming = false,
  tools,
  placeholder = "Ask StyleAI…",
  style,
  maxLength = 2000,
}: PromptInputProps) {
  // We use a separate state for the content height so the input can
  // grow with content but the submit button never gets pushed out of
  // view (the bar has a fixed-ish minHeight; the input grows inside
  // it, capped at MAX_LINES).
  const [contentHeight, setContentHeight] = useState(MIN_INPUT_HEIGHT);
  const inputRef = useRef<TextInput>(null);

  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number; width: number } } }) => {
      const next = Math.min(
        e.nativeEvent.contentSize.height,
        MAX_LINES * LINE_HEIGHT,
      );
      setContentHeight(Math.max(MIN_INPUT_HEIGHT, next));
    },
    [],
  );

  const canSubmit = value.trim().length > 0 && !isStreaming;

  const handlePress = useCallback(() => {
    if (isStreaming) {
      // TODO(v2): wire to useChat abort hook.
      return;
    }
    if (canSubmit) {
      Keyboard.dismiss();
      onSubmit();
    }
  }, [isStreaming, canSubmit, onSubmit]);

  return (
    <View style={[styles.outer, style]}>
      {tools ? <View style={styles.tools}>{tools}</View> : null}
      <View style={styles.bar}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          multiline
          maxLength={maxLength}
          onContentSizeChange={handleContentSizeChange}
          onSubmitEditing={() => {
            if (canSubmit) {
              Keyboard.dismiss();
              onSubmit();
            }
          }}
          blurOnSubmit={false}
          // Use scrollEnabled so a very tall input is scrollable inside
          // its own bounds rather than pushing the submit off-screen.
          scrollEnabled
          // Don't auto-capitalize: users frequently type Hinglish/short
          // messages in lowercase ("ya", "hi", "thanks"), and the
          // Android keyboard's default `sentences` mode forces the first
          // letter of every sentence into CAPS which they then have to
          // manually un-cap. `none` lets them type exactly what they want.
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="center"
          style={[
            styles.input,
            {
              height: contentHeight + VERTICAL_PADDING,
            },
          ]}
        />
        <Pressable
          onPress={handlePress}
          disabled={!canSubmit && !isStreaming}
          hitSlop={8}
          style={({ pressed }) => [
            styles.submit,
            {
              backgroundColor: isStreaming
                ? colors.error
                : canSubmit
                ? colors.text
                : colors.surface,
              borderColor: isStreaming
                ? colors.error
                : canSubmit
                ? colors.text
                : colors.border,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isStreaming ? "Stop generating" : "Send message"}
        >
          {isStreaming ? (
            <IconPlayerStopFilled size={16} color={colors.textInverse} />
          ) : (
            <IconArrowNarrowUp
              size={20}
              color={canSubmit ? colors.textInverse : colors.textSubtle}
              strokeWidth={2.8}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer: the chat-bar wrapper. Horizontal padding gives the inner
  // card a floating look with side margins. The bar is clearly
  // inset from the screen edges (16px on each side) so it never
  // bleeds edge-to-edge.
  outer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderSubtle,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.xs,
    marginBottom: space.xs,
  },
  // Bar: the floating input card. Distinct gray surface so it reads
  // as a card against the white page. Side margins come from the
  // outer container's paddingHorizontal; this is just the rounded
  // card with input + button.
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.xl + 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: space.md + 2,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  // Input: flex:1 so it takes remaining width. Height grows with
  // content (capped at MAX_LINES). scrollEnabled so the user can
  // scroll within the input rather than push the submit button.
  input: {
    flex: 1,
    fontSize: font.body + 1,
    lineHeight: LINE_HEIGHT,
    color: colors.text,
    fontFamily: FONT_FAMILY["400"],
    paddingTop: Platform.OS === "ios" ? 8 : VERTICAL_PADDING,
    paddingBottom: Platform.OS === "ios" ? 8 : VERTICAL_PADDING,
    paddingHorizontal: 2,
    minHeight: MIN_INPUT_HEIGHT + VERTICAL_PADDING,
    maxHeight: MAX_LINES * LINE_HEIGHT + VERTICAL_PADDING,
  },
  // Submit: 40x40 fixed circle, always visible, never grows.
  submit: {
    width: SUBMIT_SIZE,
    height: SUBMIT_SIZE,
    borderRadius: SUBMIT_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: space.sm,
    borderWidth: 1.5,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
});
