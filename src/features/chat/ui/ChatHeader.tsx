/**
 * ChatHeader — top bar of the Stylist chat.
 *
 * Visual world: editorial fashion-magazine. Off-white surface, hairline
 * divider, generous breathing room. Identity is shown as a designed
 * avatar (gradient + monogram) — never an emoji. Online status is a
 * single live dot; never a colored emoji approximation.
 *
 * - Back button (left)
 * - Stylist avatar (designed gradient monogram)
 * - Title + live status row
 * - Overflow menu (clear chat) — disabled when thread is empty
 *
 * Safe-area top inset is respected via `useSafeAreaInsets` so the
 * header looks correct on notched devices without hardcoded padding.
 */
import { IconChevronLeft, IconDotsVertical } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, FONT_FAMILY, space } from "@/components/ai-elements/theme";

export interface ChatHeaderProps {
  /** When false, the overflow menu is dimmed and not interactive. */
  canClear?: boolean;
  onClearChat?: () => void;
}

export function ChatHeader({ canClear = false, onClearChat }: ChatHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Subtle pulse on the online dot so the AI presence reads as alive
  // without competing for attention. Single authored motion.
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
    <View style={[styles.wrap, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <IconChevronLeft size={22} color={colors.text} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarMonogram} allowFontScaling={false}>
              L
            </Text>
            <View style={styles.dotWrap}>
              <Animated.View style={[styles.dotPulse, pulseStyle]} />
              <View style={styles.dot} />
            </View>
          </View>
          <View style={styles.titleStack}>
            <Text style={styles.title} numberOfLines={1}>
              Look AI Stylist
            </Text>
            <View style={styles.statusRow}>
              <Text style={styles.status} numberOfLines={1}>
                Online · ready to style
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={canClear ? onClearChat : undefined}
          disabled={!canClear}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Chat options"
          style={({ pressed }) => [
            styles.iconBtn,
            !canClear && styles.iconBtnDisabled,
            pressed && canClear && styles.pressed,
          ]}
        >
          <IconDotsVertical size={20} color={colors.text} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 38;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: space.sm + 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    columnGap: space.sm,
    minHeight: 56,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.5 },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.sm + 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    // Subtle gradient surface reads as a designed avatar without an
    // emoji. Two-tone neutral so it doesn't fight message content.
    backgroundColor: "#1D1A27",
    borderWidth: 1,
    borderColor: "#2A2638",
    overflow: "visible",
  },
  avatarMonogram: {
    color: "#FFFFFF",
    fontFamily: FONT_FAMILY["700"],
    fontSize: 17,
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
  titleStack: { flex: 1, justifyContent: "center" },
  title: {
    color: colors.text,
    fontFamily: FONT_FAMILY["700"],
    fontSize: 16,
    letterSpacing: -0.2,
  },
  statusRow: { flexDirection: "row", alignItems: "center", columnGap: 4, marginTop: 1 },
  status: {
    color: colors.textMuted,
    fontFamily: FONT_FAMILY["500"],
    fontSize: 12,
    letterSpacing: 0.1,
  },
});