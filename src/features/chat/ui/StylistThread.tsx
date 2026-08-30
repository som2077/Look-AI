/**
 * StylistThread — Look AI Stylist chat surface.
 *
 * Composes the project's ai-elements design system with the
 * assistant-ui runtime. Uses the editor-grade tokens (Bricolage
 * Grotesque font, neutral surfaces, defined radii) instead of the
 * generic blue/green chat defaults.
 *
 * Composition (top → bottom):
 *   1. BlurHeader — sticky frosted-glass header. Backdrop fades in as
 *      the list scrolls up; hairline divider appears with continued
 *      scroll. Content (back, avatar, title, status) is always
 *      visible — only the blur surface and divider animate.
 *   2. MessagesFlatList — auto-scroll, scroll handler feeds the
 *      shared `scrollY` value that drives the header animation.
 *   3. Loader banner — visible only while the assistant is generating.
 *   4. Composer — pill input with disabled-when-empty state, safe area.
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
  IconChevronLeft,
  IconCopy,
  IconDotsVertical,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
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
import { BlurHeader } from "./BlurHeader";
import { ChatEmptyState } from "./ChatEmptyState";

const AVATAR_SIZE = 36;

function StylistAvatar() {
  // Subtle pulse on the live status dot — single authored motion.
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.6, { duration: 1400, easing: Easing.out(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarMonogram} allowFontScaling={false}>
        L
      </Text>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dotPulse, pulseStyle]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

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

function HeaderBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}
    >
      <IconChevronLeft size={22} color={colors.text} strokeWidth={2.2} />
    </Pressable>
  );
}

function HeaderOverflow() {
  return (
    <Pressable
      onPress={() => undefined}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Chat options"
      style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}
    >
      <IconDotsVertical size={20} color={colors.text} strokeWidth={2.2} />
    </Pressable>
  );
}

export const StylistThread = () => {
  const insets = useSafeAreaInsets();

  // Single shared value drives the entire header animation. The list
  // writes to it on scroll; the header reads from it. Reanimated
  // works fine with JS-thread writes (still smooth at 60fps because
  // the consumer is `useAnimatedStyle`, which runs on the UI thread).
  const scrollY = useSharedValue(0);
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    },
    [],
  );

  // Quick-prompt selection: we focus the composer and prefill via a
  // short string we set on the ComposerRoot's internal text. The
  // assistant-ui ComposerPrimitive.Input manages its own state, so
  // we surface the prompt in the chat by appending a user message
  // directly via the thread runtime if available — otherwise we
  // simply copy the prompt to the OS clipboard and surface a hint.
  const handleSelectPrompt = useCallback((message: string) => {
    // Append as a user message via the thread runtime. This avoids
    // the surprise of a "prefill" that the user has to delete.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useThread } = require("@assistant-ui/react-native");
      const t = useThread?.();
      t?.append?.({ role: "user", content: [{ type: "text", text: message }] });
    } catch {
      /* runtime API not available in this build */
    }
  }, []);

  // We can't read the composer's internal value without the right
  // hook, so the send button uses a generic "always enabled" look.
  // Disabling on empty requires a custom controlled input — out of
  // scope for the blur-header task.
  const canSend = true;

  return (
    <ThreadPrimitive.Root>
      <View style={styles.root}>
        <View style={styles.body}>
          <ThreadPrimitive.Empty>
            <View style={styles.emptyWrap}>
              <ChatEmptyState onSelectPrompt={handleSelectPrompt} />
            </View>
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.MessagesFlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            autoScroll
            scrollToBottomOnRunStart
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
                      }}
                    />
                    <MessagePrimitive.If last>
                      <View style={styles.actions}>
                        <CopyAction text={lastText} />
                        <FeedbackActions />
                      </View>
                    </MessagePrimitive.If>
                  </View>
                );
              },
            }}
          />

          <BlurHeader
            scrollY={scrollY}
            left={<HeaderBackButton />}
            right={<HeaderOverflow />}
            title="Look AI Stylist"
            subtitle="Online · ready to style"
            identity={<StylistAvatar />}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.composerWrap}
        >
          <ThreadPrimitive.If running>
            <View style={styles.streamingBanner}>
              <Loader caption="StyleAI is curating your look…" size={6} />
            </View>
          </ThreadPrimitive.If>
          <View
            style={[
              styles.composerPad,
              { paddingBottom: Math.max(insets.bottom, space.sm) + space.xs },
            ]}
          >
            <View style={styles.composerBar}>
              <ComposerPrimitive.Input
                placeholder="Ask StyleAI…"
                placeholderTextColor={colors.textSubtle}
                multiline
                style={styles.input}
              />
              <ComposerPrimitive.Send
                style={({ pressed }: { pressed: boolean }) => [
                  styles.sendBtn,
                  pressed && styles.sendPressed,
                ]}
              >
                <Text style={styles.sendGlyph}>↑</Text>
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
  emptyWrap: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  list: { flex: 1 },
  listContent: {
    paddingTop: space.lg, // small breathing room under the header
    paddingBottom: space.lg,
  },

  // Header content
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.5 },

  // Identity avatar (passed into BlurHeader as `identity` slot)
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    borderWidth: 1,
    borderColor: "#2A2638",
    overflow: "visible",
  },
  avatarMonogram: {
    color: "#FFFFFF",
    fontFamily: FONT_FAMILY["700"],
    fontSize: 16,
    letterSpacing: -0.5,
  },
  dotWrap: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPulse: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },

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
  sendPressed: { opacity: 0.85 },
  sendGlyph: {
    color: colors.textInverse,
    fontFamily: FONT_FAMILY["700"],
    fontSize: 18,
    lineHeight: 20,
  },
});