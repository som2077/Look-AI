import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { IconFlameFilled } from "@tabler/icons-react-native";

const TRACK_COLOR = "#F8F7FC" as const;

export interface RingProgressSegment {
  readonly id: string;
  readonly progress: number;
  readonly color: string;
  readonly radius: number;
  readonly strokeWidth: number;
}

export interface WardrobeRingSummaryCardProps {
  readonly wornPercentage: number;
  readonly totalWorn: number;
  readonly wearCount: number;
  readonly neverCount: number;
  readonly ringSegments: readonly RingProgressSegment[];
  readonly streak?: number;
}

const clampProgress = (value: number) => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export function WardrobeRingSummaryCard({
  wornPercentage,
  totalWorn,
  wearCount,
  neverCount,
  ringSegments,
  streak = 1,
}: WardrobeRingSummaryCardProps) {
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
        <View className="flex-1 items-end gap-5 py-1">
          <View className="items-end">
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#E5904F",
              }}
            >
              {formattedPercentage}%
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "TikTokSans16pt-Medium",
                color: "#E5904F",
                marginTop: 2,
              }}
            >
              Worn clothes
            </Text>
          </View>
          <View className="items-end">
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#1D1A27",
              }}
            >
              {totalWorn}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "TikTokSans16pt-Medium",
                color: "#868693",
                marginTop: 2,
              }}
            >
              Total Items
            </Text>
          </View>
        </View>

        {/* Center Ring */}
        <View
          className="items-center justify-center"
          style={{ position: "relative" }}
        >
          <Svg width={svgSize} height={svgSize}>
            {sanitizedSegments.map((segment) => {
              const circumference = 2 * Math.PI * segment.radius;
              const dashArray = `${circumference} ${circumference}`;
              const dashOffset = circumference * (1 - segment.progress);

              return (
                <React.Fragment key={segment.id}>
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
                  <Circle
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
            })}
          </Svg>
          {/* Absolutely centered fire icon */}
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
        </View>

        {/* Right Stats */}
        <View className="flex-1 items-start gap-5 py-1">
          <View>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#6B7AE8",
              }}
            >
              {wearCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "TikTokSans16pt-Medium",
                color: "#6B7AE8",
                marginTop: 2,
              }}
            >
              Total wears
            </Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "TikTokSans16pt-Bold",
                color: "#E26B6B",
              }}
            >
              {neverCount}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "TikTokSans16pt-Medium",
                color: "#E26B6B",
                marginTop: 2,
              }}
            >
              Never worn
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
