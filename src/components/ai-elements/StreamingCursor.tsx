/**
 * StreamingCursor — blinking caret shown at the end of a streaming
 * assistant message. Uses Reanimated; mounting/unmounting toggles the
 * animation. No props — the parent decides whether to mount it.
 */
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors } from "./theme";

export function StreamingCursor() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 530, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.caret, style]}>▍</Animated.Text>
  );
}

const styles = StyleSheet.create({
  caret: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "300",
    marginLeft: 2,
  },
});
