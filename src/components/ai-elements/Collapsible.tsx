/**
 * Collapsible — primitive for animated open/close.
 * Uses Reanimated to animate height + opacity. Controlled or
 * uncontrolled. Body content is rendered always but measured via
 * onLayout; we toggle `height` from 0 → measured.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion } from "./theme";
import type { CollapsibleProps } from "./types";

export function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: CollapsibleProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? !!controlledOpen : internalOpen;

  const [bodyHeight, setBodyHeight] = useState(0);
  const measured = useRef(false);
  const progress = useSharedValue(defaultOpen ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: motion.base,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [isOpen, progress]);

  const onBodyLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && (!measured.current || Math.abs(h - bodyHeight) > 1)) {
      measured.current = true;
      setBodyHeight(h);
    }
  }, [bodyHeight]);

  const containerStyle = useAnimatedStyle(() => ({
    height: bodyHeight > 0 ? progress.value * bodyHeight : undefined,
    opacity: progress.value,
    overflow: "hidden",
  }));

  return (
    <Animated.View style={containerStyle}>
      <View
        style={styles.measure}
        onLayout={onBodyLayout}
        // Render always to measure; visually clipped by the parent's height.
        // Once bodyHeight is known, the measure view still renders but
        // doesn't repaint its own bg.
        pointerEvents={isOpen ? "auto" : "none"}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  measure: { position: "absolute", left: 0, right: 0, top: 0 },
});
