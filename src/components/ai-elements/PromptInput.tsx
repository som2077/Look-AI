/**
 * PromptInput — Modern AI prompt card matching ChatGPT/Quantum 3 interface:
 * Multi-line text input on top, plus attach (+), model selector (Quantum 3 ⌵),
 * microphone, and voice waveform / send / stop button on the bottom.
 */
import {
  ArrowUp,
  ChevronDown,
  Mic,
  Plus,
  Square,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
  /** Fires when the user taps the `+` (attach) button. */
  onAttachPress?: () => void;
  /** Fires when the user taps the microphone button. */
  onMicPress?: () => void;
  /** Fires when the user taps the voice mode / waveform button. */
  onVoicePress?: () => void;
  /** Fires when the user taps the model selector. */
  onModelPress?: () => void;
  /** Model name displayed in the center pill. Defaults to "Quantum 3". */
  modelName?: string;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isStreaming = false,
  tools,
  placeholder = "How can I help you today?",
  style,
  maxLength = 2000,
  onAttachPress,
  onMicPress,
  onVoicePress,
  onModelPress,
  modelName = "Quantum 3",
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
    } else if (onVoicePress) {
      onVoicePress();
    }
  }, [isStreaming, canSubmit, onSubmit, onVoicePress]);

  return (
    <View style={[styles.outer, style]}>
      {tools ? <View style={styles.tools}>{tools}</View> : null}
      <View style={styles.card}>
        {/* Top Text Input */}
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
            { height: contentHeight },
          ]}
        />

        {/* Bottom Action Row */}
        <View style={styles.actionRow}>
          {/* Left: Attach (+) Button */}
          <Pressable
            onPress={onAttachPress}
            hitSlop={6}
            style={({ pressed }) => [
              styles.attachBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Attach"
          >
            <Plus size={18} color="#221E19" strokeWidth={2.4} />
          </Pressable>

          {/* Center: Model Selector Pill */}
          <Pressable
            onPress={onModelPress}
            hitSlop={6}
            style={({ pressed }) => [
              styles.modelSelector,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Model: ${modelName}`}
          >
            <Text style={styles.modelText}>{modelName}</Text>
            <ChevronDown size={15} color="#3E382E" strokeWidth={2.2} />
          </Pressable>

          {/* Right: Mic + Voice/Send Button */}
          <View style={styles.rightActions}>
            <Pressable
              onPress={onMicPress}
              hitSlop={6}
              style={({ pressed }) => [
                styles.micBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Voice input"
            >
              <Mic size={22} color="#221E19" strokeWidth={2} />
            </Pressable>

            <Pressable
              onPress={handleSubmitPress}
              hitSlop={6}
              style={({ pressed }) => [
                styles.voiceSendBtn,
                isStreaming && styles.voiceSendBtnStop,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isStreaming
                  ? "Stop generating"
                  : canSubmit
                    ? "Send message"
                    : "Voice mode"
              }
            >
              {isStreaming ? (
                <Square size={14} color="#FAF7F2" fill="#FAF7F2" />
              ) : canSubmit ? (
                <ArrowUp size={20} color="#FAF7F2" strokeWidth={2.6} />
              ) : (
                <View style={styles.waveform}>
                  <View style={[styles.waveBar, { height: 7 }]} />
                  <View style={[styles.waveBar, { height: 13 }]} />
                  <View style={[styles.waveBar, { height: 19 }]} />
                  <View style={[styles.waveBar, { height: 13 }]} />
                  <View style={[styles.waveBar, { height: 7 }]} />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: colors.bg,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.xs,
    marginBottom: space.xs,
  },
  card: {
    backgroundColor: "#FBF9F5",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6E0D6",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
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
    paddingHorizontal: 4,
    paddingTop: 0,
    paddingBottom: 6,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_LINES * LINE_HEIGHT + 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 2,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECE7DE",
    alignItems: "center",
    justifyContent: "center",
  },
  modelSelector: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  modelText: {
    fontSize: 14,
    color: "#3E382E",
    fontFamily: FONT_FAMILY["500"],
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
  micBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1F1B16",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceSendBtnStop: {
    backgroundColor: colors.error,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 2.5,
  },
  waveBar: {
    width: 2.2,
    borderRadius: 1.5,
    backgroundColor: "#FAF7F2",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
