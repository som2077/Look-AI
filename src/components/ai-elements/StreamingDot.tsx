/**
 * StreamingDot — small filled circle that pulses (scale + opacity) when
 * the AI is streaming. Stays static when idle.
 *
 * This is the signature ornament of the Style Chat screen: it tells the
 * user who's "speaking" without writing "StyleAI is thinking" twice,
 * and it distinguishes the screen from any other list-based chat UI.
 *
 * Uses clay accent so the dot carries the brand's earthy personality.
 */
import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors } from "./theme";

export interface StreamingDotProps {
  /** When true, the dot pulses on a slow 1.6s ease. */
  active?: boolean;
  size?: number;
  style?: ViewStyle;
}

export function StreamingDot({ active = false, size = 8, style }: StreamingDotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
        -1,
        true,
      );
    } else {
      progress.value = 0;
    }
  }, [active, progress]);

  const dotStyle = useAnimatedStyle(() =>
    active
      ? {
        opacity: 0.45 + progress.value * 0.55,
        transform: [{ scale: 0.85 + progress.value * 0.35 }],
      }
      : { opacity: 1, transform: [{ scale: 1 }] },
  );

  const haloStyle = useAnimatedStyle(() =>
    active
      ? {
        opacity: 0.35 - progress.value * 0.35,
        transform: [{ scale: 0.85 + progress.value * 0.95 }],
      }
      : { opacity: 0, transform: [{ scale: 0.85 }] },
  );

  return (
    <View
      style={[
        styles.wrap,
        { width: size * 2.4, height: size * 2.4 },
        style,
      ]}
    >
      {active ? (
        <Animated.View
          style={[
            styles.halo,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.brand,
            },
            haloStyle,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.brand,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
  },
  dot: {
    // no extra styling — size and color come from props
  },
});