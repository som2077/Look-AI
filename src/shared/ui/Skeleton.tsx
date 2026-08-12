import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";

// ─── Skeleton — single shimmer placeholder ────────────────────────────────────
// Shared loading primitive. Renders an animated pulsing block. Modeled on the
// inline pulse skeleton previously used in add-clothes/batch-scan.tsx so the
// visual language stays consistent.

type SkeletonVariant = "line" | "circle" | "rect";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  variant = "line",
  width,
  height,
  radius,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  // Circles get a default size when only one dimension is provided.
  let dims: ViewStyle = {};
  if (variant === "circle") {
    const size = height ?? width ?? 48;
    dims = { width: width ?? size, height: size };
  } else {
    if (width !== undefined) dims.width = width;
    if (height !== undefined) dims.height = height;
  }

  return (
    <Animated.View
      style={[
        styles.base,
        variant === "circle" && styles.circle,
        dims,
        { opacity },
        style,
      ]}
    />
  );
}

// ─── Composed skeletons ───────────────────────────────────────────────────────

interface SkeletonListProps {
  count?: number;
  cardHeight?: number;
  style?: ViewStyle;
}

/** Vertical list of image + text row cards (feed, wardrobe, saved). */
export function SkeletonList({
  count = 6,
  cardHeight = 120,
  style,
}: SkeletonListProps) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ flexDirection: "row", gap: 12, height: cardHeight }}
        >
          <Skeleton variant="rect" width={cardHeight} height={cardHeight} radius={14} />
          <View style={{ flex: 1, justifyContent: "center", gap: 10 }}>
            <Skeleton width="82%" height={14} />
            <Skeleton width="55%" height={12} />
            <Skeleton width="68%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

/** Card with a header line, image block and caption lines (home stats, AI). */
export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width="58%" height={16} />
      <Skeleton variant="rect" width="100%" height={120} radius={12} />
      <Skeleton width="80%" height={12} />
      <Skeleton width="45%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#E4E4EC",
    borderRadius: 8,
    overflow: "hidden",
  },
  circle: {
    borderRadius: 999,
  },
  list: {
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    gap: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F5",
  },
});
