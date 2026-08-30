/**
 * StylistThread — Look AI Stylist chat surface.
 *
 * Composes the project's ai-elements design system with the
 * assistant-ui runtime. Uses the editor-grade tokens (Bricolage
 * Grotesque font, neutral surfaces, defined radii) instead of the
 * generic blue/green chat defaults.
 *
 * Composition (top → bottom):
 *   1. ChatHeader — designed avatar + live status + back
 *   2. MessagesFlatList — auto-scroll, scroll-to-bottom on run start
 *   3. Loader banner — visible only while the assistant is generating
 *   4. Composer — pill input with disabled-when-empty state, safe area
 *
 * States:
 *   - Empty    → <ChatEmptyState /> rendered above the list
 *   - Idle     → standard bubbles, finished actions
 *   - Streaming→ Loader banner above the composer; streaming caret in
 *                the last assistant bubble
 */
import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react-native";
import {
  IconCopy,
  IconRefresh,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react-native";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconButton,
  Loader,
  MessageResponse,
  colors,
  font,
  FONT_FAMILY,
  radii,
  space,
} from "@/components/ai-elements";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatHeader } from "./ChatHeader";

function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  }, [text]);
  return (
    <IconButton onPress={handleCopy} label={copied ? "Copied" : "Copy"}>
      <IconCopy size={15} color={colors.textMuted} strokeWidth={2} />
    </IconButton>
  );
}

function RetryAction() {
  return (
    <Pressable
      onPress={() => MessagePrimitive.Root.regenerate?.()}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Regenerate"
      style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
    >
      <IconRefresh size={15} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
}

function FeedbackActions() {
  return (
    <>
      <Pressable
        onPress={() => undefined}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Helpful"
        style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
      >
        <IconThumbUp size={15} color={colors.textMuted} strokeWidth={2} />
      </Pressable>
      <Pressable
        onPress={() => undefined}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Not helpful"
        style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
      >
        <IconThumbDown size={15} color={colors.textMuted} strokeWidth={2} />
      </Pressable>
    </>
  );
}

export const StylistThread = () => {
  const insets = useSafeAreaInsets();
  const [composerValue, setComposerValue] = useState("");

  const handleSelectPrompt = useCallback((message: string) => {
    // Drop the prompt into the composer — the user can edit before
    // sending. This avoids the surprise of an immediate network round
    // trip from a single tap.
    setComposerValue(message);
  }, []);

  const canSend = composerValue.trim().length > 0;

  return (
    <ThreadPrimitive.Root>
      <View style={styles.root}>
        <ChatHeader canClear={false} onClearChat={() => undefined} />

        <View style={styles.body}>
          <ThreadPrimitive.Empty>
            <ChatEmptyState onSelectPrompt={handleSelectPrompt} />
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.MessagesFlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            autoScroll
            scrollToBottomOnRunStart
            components={{
              UserMessage: () => (
                <View style={styles.userRow}>
                  <View style={styles.userBubble}>
                    <MessagePrimitive.Parts
                      components={{
                        Text: ({ text }: { text: string }) => (
                          <Text style={styles.userText}>{text}</Text>
                        ),
                      }}
                    />
                  </View>
                </View>
              ),
              AssistantMessage: () => {
                let lastText = "";
                return (
                  <View style={styles.aiRow}>
                    <MessagePrimitive.Parts
                      components={{
                        Text: ({ text }: { text: string }) => {
                          lastText = text;
                          return <MessageResponse content={text} isStreaming />;
                        },
                        Reasoning: () => null,
                        tools: ({ tools }: { tools: Record<string, any> }) => (
                          <View style={styles.tools}>
                            {Object.entries(tools).map(([name, ToolUI]) => (
                              <View key={name} style={styles.toolCard}>
                                <ToolUI />
                              </View>
                            ))}
                          </View>
                        ),
                      }}
                    />
                    <MessagePrimitive.If last>
                      <View style={styles.actions}>
                        <CopyAction text={lastText} />
                        <RetryAction />
                        <FeedbackActions />
                      </View>
                    </MessagePrimitive.If>
                  </View>
                );
              },
            }}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.composerWrap}
        >
          <ThreadPrimitive.Running>
            <View style={styles.streamingBanner}>
              <Loader caption="StyleAI is curating your look…" size={6} />
            </View>
          </ThreadPrimitive.Running>
          <View
            style={[
              styles.composerPad,
              { paddingBottom: Math.max(insets.bottom, space.sm) + space.xs },
            ]}
          >
            <View style={styles.composerBar}>
              <ComposerPrimitive.Input
                value={composerValue}
                onChange={setComposerValue as any}
                placeholder="Ask StyleAI…"
                placeholderTextColor={colors.textSubtle}
                multiline
                style={styles.input}
              />
              <ComposerPrimitive.Send
                disabled={!canSend}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.sendBtn,
                  !canSend && styles.sendBtnDisabled,
                  pressed && canSend && styles.sendPressed,
                ]}
              >
                <Text style={[styles.sendGlyph, !canSend && styles.sendGlyphDisabled]}>↑</Text>
              </ComposerPrimitive.Send>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ThreadPrimitive.Root>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  body: { flex: 1, position: "relative" },
  list: { position: "absolute", inset: 0 as any },
  listContent: { paddingTop: space.md, paddingBottom: space.lg },

  // User bubble — right-aligned pill on the neutral surface.
  userRow: {
    paddingHorizontal: space.lg,
    marginBottom: space.md,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  userBubble: {
    maxWidth: "80%",
    backgroundColor: colors.userBubble,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.sm + 2,
    borderRadius: radii.xl,
    borderBottomRightRadius: 6,
  },
  userText: {
    color: colors.textInverse,
    fontFamily: FONT_FAMILY["400"],
    fontSize: font.body + 1,
    lineHeight: 22,
  },

  // Assistant message — full width, no bubble background.
  aiRow: { paddingHorizontal: space.lg, marginBottom: space.lg },
  tools: { marginTop: space.sm },
  toolCard: { marginBottom: space.sm },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    marginTop: space.xs + 2,
    marginLeft: -4,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.5 },

  // Composer
  composerWrap: {
    backgroundColor: colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderSubtle,
  },
  streamingBanner: {
    paddingHorizontal: space.lg,
    paddingTop: space.xs + 2,
    paddingBottom: 0,
  },
  composerPad: { paddingHorizontal: space.lg, paddingTop: space.sm },
  composerBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderRadius: radii.xl + 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingVertical: space.xs,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY["400"],
    fontSize: font.body + 1,
    color: colors.text,
    paddingTop: Platform.OS === "ios" ? 8 : 10,
    paddingBottom: Platform.OS === "ios" ? 8 : 10,
    paddingHorizontal: 2,
    minHeight: 36,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: space.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sendPressed: { opacity: 0.85 },
  sendGlyph: {
    color: colors.textInverse,
    fontFamily: FONT_FAMILY["700"],
    fontSize: 18,
    lineHeight: 20,
  },
  sendGlyphDisabled: { color: colors.textSubtle },
});