/**
 * PromptInput — Clean modern AI card matching Screenshot:
 * White rounded card, multiline input with "Ask’s everything" placeholder,
 * and solid black circular Send button on the bottom-right.
 */
import { IconArrowUp, IconPlayerStopFilled } from "@tabler/icons-react-native";
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
import { colors, FONT_FAMILY, space } from "./theme";

const MAX_LINES = 5;
const LINE_HEIGHT = 22;
const MIN_INPUT_HEIGHT = 38;

export interface PromptInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  isStreaming?: boolean;
  /** Rendered in the left tools slot (above the card). */
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
  placeholder = "Ask’s everything",
  style,
  maxLength = 2000,
}: PromptInputProps) {
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
      onSubmit();
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
      <View style={styles.card}>
        {/* Multiline Text Input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#7E776C"
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
          scrollEnabled
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
          style={[
            styles.input,
            { height: Math.max(MIN_INPUT_HEIGHT, contentHeight) },
          ]}
        />

        {/* Bottom Action Row with Black Send Button on Right */}
        <View style={styles.bottomRow}>
          <Pressable
            onPress={handleSubmitPress}
            disabled={!canSubmit && !isStreaming}
            hitSlop={10}
            style={({ pressed }) => [
              styles.sendBtn,
              isStreaming && styles.sendBtnStop,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isStreaming ? "Stop generating" : "Send message"}
          >
            {isStreaming ? (
              <IconPlayerStopFilled size={14} />
            ) : (
              <IconArrowUp
                size={20}
                // color="#000000"
                strokeWidth={2.6}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: colors.bg,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.xs,
    marginBottom: space.xs,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EAE6DF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    minHeight: 104,
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1F1B16",
    fontFamily: FONT_FAMILY["400"],
    paddingHorizontal: 2,
    paddingTop: 0,
    paddingBottom: 6,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_LINES * LINE_HEIGHT + 10,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 6,
    // color: "#7E776C",
    // backgroundColor: "#000000",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#c42626",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnStop: {
    backgroundColor: colors.error,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
