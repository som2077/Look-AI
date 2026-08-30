/**
 * Spinner — 3-dot animated indicator using Reanimated.
 * Used inside ToolHeader (when status="running") and Loader.
 */
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors } from "./theme";

export interface SpinnerProps {
  size?: number;
  color?: string;
  gap?: number;
}

export function Spinner({
  size = 6,
  color = colors.textSubtle,
  gap = 3,
}: SpinnerProps) {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    const anim = (sv: typeof d1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        ),
      );
    };
    anim(d1, 0);
    anim(d2, 200);
    anim(d3, 400);
  }, [d1, d2, d3]);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));

  return (
    <View style={[styles.row, { columnGap: gap }]}>
      <Animated.View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          s1,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          s2,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          s3,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  dot: { marginHorizontal: 1 },
});
