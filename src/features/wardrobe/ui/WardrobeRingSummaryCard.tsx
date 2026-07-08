import { IconFlameFilled } from "@tabler/icons-react-native";
import type { ReactNode } from "react";
import React, { useMemo, useEffect, useRef } from "react";
import { Text, View, Animated } from "react-native";
import { Circle, Svg } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TRACK_COLOR = "#F8F7FC" as const;

export interface RingProgressSegment {
  readonly id: string;
  readonly progress: number;
  readonly color: string;
  readonly radius: number;
  readonly strokeWidth: number;
}

export interface RingStatLabels {
  readonly topLeft: string;
  readonly bottomLeft: string;
  readonly topRight: string;
  readonly bottomRight: string;
}

const DEFAULT_LABELS: RingStatLabels = {
  topLeft: "Worn",
  topRight: "Avg Wears",
  bottomLeft: "Streak",
  bottomRight: "Total Items",
};

export interface RingStatColors {
  readonly topLeft: string;
  readonly topRight: string;
  readonly bottomLeft: string;
  readonly bottomRight: string;
}

const DEFAULT_COLORS: RingStatColors = {
  topLeft: "#01B3F7",
  topRight: "#AB86F1",
  bottomLeft: "#FEC466",
  bottomRight: "#000000",
};

export interface WardrobeRingSummaryCardProps {
  readonly wornPercentage: number;
  readonly totalWorn: number;
  readonly wearCount: number;
  readonly neverCount: number;
  readonly ringSegments: readonly RingProgressSegment[];
  readonly streak?: number;
  readonly labels?: Partial<RingStatLabels>;
  readonly statColors?: Partial<RingStatColors>;
  readonly showStreakIcon?: boolean;
  readonly bottomContent?: ReactNode;
}

const clampProgress = (value: number) => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

import { useFocusEffect } from "expo-router";

const AnimatedRingSegment = ({ segment, center }: { segment: RingProgressSegment & { progress: number }, center: number }) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      // Reset to 0 when focused to replay the animation
      animatedProgress.setValue(0);
      Animated.timing(animatedProgress, {
        toValue: segment.progress,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      return () => {
        animatedProgress.stopAnimation();
      };
    }, [segment.progress, animatedProgress])
  );

  const circumference = 2 * Math.PI * segment.radius;
  const dashArray = `${circumference} ${circumference}`;

  const dashOffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const dotRadius = segment.strokeWidth / 2 - 2.5;

  return (
    <React.Fragment>
      {/* Track circle */}
      <Circle
        cx={center}
        cy={center}
        r={segment.radius}
        stroke={TRACK_COLOR}
        strokeWidth={segment.strokeWidth}
        fill="transparent"
      />
      {/* Progress arc */}
      <AnimatedCircle
        cx={center}
        cy={center}
        r={segment.radius}
        stroke={segment.color}
        strokeWidth={segment.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        fill="transparent"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </React.Fragment>
  );
};

// Component for the animated dot overlay
const AnimatedDot = ({ segment, center }: { segment: RingProgressSegment & { progress: number }, center: number }) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      animatedProgress.setValue(0);
      Animated.timing(animatedProgress, {
        toValue: segment.progress,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      return () => {
        animatedProgress.stopAnimation();
      };
    }, [segment.progress, animatedProgress])
  );

  const dotRadius = segment.strokeWidth / 2 - 2;

  if (segment.progress === 0) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: center * 2,
        height: center * 2,
        transform: [
          {
            rotate: animatedProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ["-90deg", "270deg"],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          position: "absolute",
          left: center + segment.radius - dotRadius,
          top: center - dotRadius,
          width: dotRadius * 2,
          height: dotRadius * 2,
          borderRadius: dotRadius,
          backgroundColor: "#FFFFFF",
        }}
      />
    </Animated.View>
  );
};


export function WardrobeRingSummaryCard({
  wornPercentage,
  totalWorn,
  wearCount,
  neverCount,
  ringSegments,
  streak = 1,
  labels,
  statColors,
  showStreakIcon = true,
  bottomContent,
}: WardrobeRingSummaryCardProps) {
  const resolvedLabels: RingStatLabels = {
    ...DEFAULT_LABELS,
    ...labels,
  };
  const resolvedColors: RingStatColors = {
    ...DEFAULT_COLORS,
    ...statColors,
  };
  const sanitizedSegments = useMemo(
    () =>
      ringSegments
        .slice()
        .sort((a, b) => b.radius - a.radius)
        .map((seg) => ({
          ...seg,
          progress: clampProgress(seg.progress),
        })),
    [ringSegments],
  );

  const svgSize = useMemo(() => {
    if (sanitizedSegments.length === 0) return 0;
    const maxExtent = sanitizedSegments.reduce((max, seg) => {
      const extent = seg.radius + seg.strokeWidth / 2;
      return extent > max ? extent : max;
    }, 0);
    return maxExtent * 2;
  }, [sanitizedSegments]);

  if (svgSize === 0) return null;

  const center = svgSize / 2;
  const formattedPercentage = Math.round(clampProgress(wornPercentage) * 100);

  return (
    <View
      className="mt-2 bg-[#ffffff] border border-[#E9EBF8] rounded-[24px] py-4 px-3"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        {/* Left Stats */}
        <View className="flex-1 items-end gap-10 py-1">
          <View className="items-end">
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: resolvedColors.topLeft,
              }}
            >
              {formattedPercentage}%
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#1D1A27",
                marginTop: 2,
              }}
            >
              {resolvedLabels.topLeft}
            </Text>
          </View>
          <View className="items-end">
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: resolvedColors.bottomLeft,
              }}
            >
              {totalWorn}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#1D1A27",
                marginTop: 2,
              }}
            >
              {resolvedLabels.bottomLeft}
            </Text>
          </View>
        </View>

        {/* Center Ring */}
        <View
          className="items-center justify-center"
          style={{ position: "relative" }}
        >
          <Svg width={svgSize} height={svgSize}>
            {sanitizedSegments.map((segment) => (
              <AnimatedRingSegment key={segment.id} segment={segment} center={center} />
            ))}
          </Svg>
          
          {/* Animated dot overlays for the rings */}
          <View style={{ position: "absolute", width: svgSize, height: svgSize }}>
            {sanitizedSegments.map((segment) => (
              <AnimatedDot key={segment.id} segment={segment} center={center} />
            ))}
          </View>

          {/* Absolutely centered fire icon */}
          {showStreakIcon && (
            <View
              style={{
                position: "absolute",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
              }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full  bg-[#F8F7FC]">
                <IconFlameFilled size={20} color="#1D1A27" />
              </View>
            </View>
          )}
        </View>

        {/* Right Stats */}
        <View className="flex-1 items-start gap-10 py-1">
          <View>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: resolvedColors.topRight,
              }}
            >
              {wearCount}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#1D1A27",
                marginTop: 2,
              }}
            >
              {resolvedLabels.topRight}
            </Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: resolvedColors.bottomRight,
              }}
            >
              {neverCount}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#1D1A27",
                marginTop: 2,
              }}
            >
              {resolvedLabels.bottomRight}
            </Text>
          </View>
        </View>
      </View>
      {bottomContent && <View style={{ marginTop: 12 }}>{bottomContent}</View>}
    </View>
  );
}
