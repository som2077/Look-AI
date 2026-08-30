/**
 * BlurHeader — sticky frosted-glass header with iOS-style scroll
 * behavior: hides when the user scrolls up, shows when they scroll
 * down. Frosted backdrop fades in whenever content is underneath
 * the header position.
 *
 * Single authored motion: one shared value (`scrollY`) drives
 * everything via `useAnimatedReaction`:
 *   - backdrop opacity   0 → 1 as scrollY grows (always visible
 *                         when the header is shown and content is
 *                         under it)
 *   - hairline opacity   0 → 1 between 24 and 64px of scroll
 *   - translateY         0 → -totalHeight when scrolling up, back
 *                         to 0 when scrolling down. Thresholds keep
 *                         the animation from flickering on tiny
 *                         scroll deltas.
 *
 * - iOS: native BlurView via expo-blur
 * - Android: a slightly tinted semi-transparent surface stands in
 *   for the blur (expo-blur falls back gracefully)
 * - Respects top safe-area inset via useSafeAreaInsets
 */
import { BlurView } from "expo-blur";
import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, FONT_FAMILY, motion, space } from "@/components/ai-elements/theme";

export interface BlurHeaderProps {
  /** Animated scroll offset (px) from the underlying list. */
  scrollY: SharedValue<number>;
  /** Back button (rendered on the left). */
  left?: React.ReactNode;
  /** Title rendered in the center column. */
  title: string;
  /** Subtitle rendered below the title. */
  subtitle?: string;
  /** Optional slot on the right (e.g. overflow menu). */
  right?: React.ReactNode;
  /** Optional identity slot rendered above the title (e.g. avatar). */
  identity?: React.ReactNode;
  /** Min height of the bar (excluding safe-area). Default 56. */
  barHeight?: number;
  /** Tint for the BlurView. Default "light". */
  tint?: "light" | "dark" | "default";
  /** Override for the title text style (e.g. larger "Explore" header). */
  titleStyle?: TextStyle;
  style?: ViewStyle;
}

const BACKDROP_FADE_END = 24;
const HAIRLINE_FADE_END = 64;
const SCROLL_DELTA_THRESHOLD = 4; // px — ignore tiny scroll jitter
const TOP_BUFFER = 8; // px — stay visible until scrolled past this much

export function BlurHeader({
  scrollY,
  left,
  title,
  subtitle,
  right,
  identity,
  barHeight = 56,
  tint = "light",
  titleStyle,
  style,
}: BlurHeaderProps) {
  const insets = useSafeAreaInsets();

  // Total height of the header including safe-area top + bottom padding.
  // We need this for the slide-up translation and to give the BlurView
  // an explicit size (absoluteFill on a parent with no defined height
  // renders nothing).
  const totalHeight = useMemo(
    () => insets.top + space.xs + barHeight + space.sm,
    [insets.top, barHeight],
  );

  // Direction tracking. The FlatList onScroll is JS-thread, so we
  // maintain `lastY` here and feed a shared value (`hidden`) that the
  // UI thread reads to drive the translation. Direction is decided on
  // the UI thread via useAnimatedReaction to keep the response snappy.
  const lastY = useSharedValue(0);
  const hidden = useSharedValue(0); // 0 = visible, 1 = hidden

  useAnimatedReaction(
    () => scrollY.value,
    (current, previous) => {
      if (previous == null) {
        lastY.value = current;
        return;
      }
      // Always show when at the top of the list.
      if (current <= TOP_BUFFER) {
        hidden.value = withTiming(0, { duration: motion.base });
        lastY.value = current;
        return;
      }
      const delta = current - lastY.value;
      if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) {
        // jitter — ignore
        return;
      }
      if (delta > 0) {
        // scrolling up (content moves away from top) → hide
        hidden.value = withTiming(1, { duration: motion.base });
      } else {
        // scrolling down (content moves toward top) → show
        hidden.value = withTiming(0, { duration: motion.base });
      }
      lastY.value = current;
    },
    [],
  );

  const wrapStyle = useAnimatedStyle(() => {
    const ty = interpolate(
      hidden.value,
      [0, 1],
      [0, -totalHeight],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY: ty }] };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, BACKDROP_FADE_END],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const hairlineStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [24, HAIRLINE_FADE_END],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Android: tinting BlurView produces a near-opaque surface that
  // doesn't read as "frosted." We render a translucent neutral
  // surface instead.
  const isAndroid = Platform.OS !== "ios";

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { height: totalHeight }, wrapStyle, style]}
    >
      <View pointerEvents="none" style={styles.backdropLayer}>
        {isAndroid ? (
          <Animated.View
            style={[styles.androidBackdrop, backdropStyle, StyleSheet.absoluteFill]}
          />
        ) : (
          <Animated.View style={[styles.blurWrap, backdropStyle, StyleSheet.absoluteFill]}>
            <BlurView
              tint={tint}
              intensity={Platform.OS === "ios" ? 32 : 100}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </View>

      <View style={[styles.row, { paddingTop: insets.top + space.xs, minHeight: totalHeight }]}>
        {left ? <View style={styles.side}>{left}</View> : null}
        <View style={styles.center}>
          {identity ? <View style={styles.identity}>{identity}</View> : null}
          <View style={styles.titleStack}>
            <Text style={[styles.title, titleStyle]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {right ? <View style={styles.side}>{right}</View> : null}
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.hairline, hairlineStyle, { top: totalHeight - 0.5 }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    // height is set inline
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blurWrap: {
    overflow: "hidden",
  },
  androidBackdrop: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    columnGap: space.sm,
  },
  side: { width: 40, alignItems: "center", justifyContent: "center" },
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.sm + 2,
  },
  identity: { alignItems: "center", justifyContent: "center" },
  titleStack: { flex: 1, justifyContent: "center" },
  title: {
    color: colors.text,
    fontFamily: FONT_FAMILY["700"],
    fontSize: 16,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: FONT_FAMILY["500"],
    fontSize: 12,
    letterSpacing: 0.1,
    marginTop: 1,
  },
  hairline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: colors.borderSubtle,
  },
});