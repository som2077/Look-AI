/**
 * PromptInput — light cream pill bar with a dark `+` (attach) button on
 * the left, a growing multiline text input in the middle, and a single
 * circular send button on the right.
 *
 * Visual states for the send button:
 *  - idle + empty      → muted (dim gray circle, dim arrow)
 *  - idle + has text   → active (dark circle, white arrow)
 *  - streaming         → stop (red circle, filled stop icon)
 *
 * The bar background is a warm off-white so it sits visually above the
 * screen surface without feeling like a heavy dark slab. The dark `+`
 * button anchors the left edge and reads as a primary action.
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
  IconPlus,
} from "@tabler/icons-react-native";
import { colors, FONT_FAMILY, space } from "./theme";

const MAX_LINES = 5;
const LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = 24;
const VERTICAL_PADDING = 12;
const SUBMIT_SIZE = 36;
const ATTACH_SIZE = 36;

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
  /** Fires when the user taps the `+` (attach) button. */
  onAttachPress?: () => void;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isStreaming = false,
  tools,
  placeholder = "Type a message…",
  style,
  maxLength = 2000,
  onAttachPress,
}: PromptInputProps) {
  // We use a separate state for the content height so the input can
  // grow with content but the send button never gets pushed out of
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

  const handleSubmitPress = useCallback(() => {
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
        <Pressable
          onPress={onAttachPress}
          hitSlop={6}
          style={({ pressed }) => [
            styles.attach,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Attach"
        >
          <IconPlus size={18} color={colors.textInverse} strokeWidth={2.4} />
        </Pressable>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(29,26,39,0.45)"
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
          onPress={handleSubmitPress}
          disabled={!canSubmit && !isStreaming}
          hitSlop={6}
          style={({ pressed }) => [
            styles.submit,
            isStreaming
              ? styles.submitStop
              : canSubmit
              ? styles.submitActive
              : styles.submitIdle,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isStreaming ? "Stop generating" : "Send message"}
        >
          {isStreaming ? (
            <IconPlayerStopFilled size={14} color={colors.textInverse} />
          ) : (
            <IconArrowNarrowUp
              size={18}
              color={canSubmit ? colors.textInverse : "rgba(29,26,39,0.35)"}
              strokeWidth={2.4}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer: the chat-bar wrapper. No top divider — the bar is a
  // self-contained floating surface. 10pt side padding so the
  // bar breathes from the screen edge. Extra paddingBottom is
  // added by the screen (insets.bottom + 8) to clear the home
  // indicator.
  outer: {
    paddingHorizontal: 10,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    backgroundColor: colors.bg,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.xs,
    marginBottom: space.xs,
  },
  // Bar: the floating input. Warm off-white surface, full pill radius,
  // hairline border. Inner padding is tight on both sides (4pt) so the
  // `+` and send buttons sit flush against the bar edge.
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3F0",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(29,26,39,0.08)",
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Attach (`+`) button: solid dark circle on the left, white plus
  // icon. The dark fill is the primary visual anchor of the bar —
  // it must read as a clearly separated circle against the cream
  // background, not blend in. A subtle drop shadow lifts it off
  // the surface.
  attach: {
    width: ATTACH_SIZE,
    height: ATTACH_SIZE,
    borderRadius: ATTACH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.focus,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  // Input: flex:1 so it takes remaining width. Height grows with
  // content (capped at MAX_LINES). Dark text + soft-muted placeholder
  // to read against the cream bar.
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    fontFamily: FONT_FAMILY["400"],
    paddingTop: Platform.OS === "ios" ? 10 : 12,
    paddingBottom: Platform.OS === "ios" ? 10 : 12,
    paddingHorizontal: space.sm,
    minHeight: 24,
    maxHeight: MAX_LINES * LINE_HEIGHT + 20,
  },
  // Submit: 36x36 fixed circle, always visible, never grows.
  // Idle = warm gray circle that is clearly distinct from the cream
  // bar (the previous shade #E8E4DD was too close to the bar tint
  // and read as flat). Active = solid dark when text is present.
  // Stop = red when streaming. Matches the Image #23 reference:
  // a quiet light circle that becomes a solid dark pop once the
  // user has typed something.
  submit: {
    width: SUBMIT_SIZE,
    height: SUBMIT_SIZE,
    borderRadius: SUBMIT_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  submitActive: {
    backgroundColor: colors.focus,
  },
  submitIdle: {
    backgroundColor: "#D4D0C8",
  },
  submitStop: {
    backgroundColor: colors.error,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.94 }] },
});
