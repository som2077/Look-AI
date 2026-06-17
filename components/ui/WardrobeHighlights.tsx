import React, { useState } from "react";
import { Text, View, TouchableOpacity, Dimensions } from "react-native";
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { ChevronRight, Trophy } from "lucide-react-native";
import { Image as ExpoImage } from "expo-image";

interface HighlightItem {
  id: number;
  title: string;
  wears: number;
  status: string;
  statusBg: string;
  lastWorn: string;
  image: any;
}

const RANGES = ["3 Days", "7 Days", "15 Days", "30 Days"] as const;
type RangeType = (typeof RANGES)[number];

const RANGE_DATA: Record<
  RangeType,
  {
    growth: string;
    points: { y0: number; y1: number; y2: number; y3: number };
    clothes: {
      p1: { title: string; image: any };
      p2: { title: string; image: any };
      p3: { title: string; image: any };
    };
    list: HighlightItem[];
  }
> = {
  "3 Days": {
    growth: "+5% Active Wears",
    points: { y0: 110, y1: 105, y2: 95, y3: 70 },
    clothes: {
      p1: {
        title: "Floral dress",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
      p2: {
        title: "Casual Jeans",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      p3: {
        title: "White Sneakers",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
    },
    list: [
      {
        id: 1,
        title: "White Sneakers",
        wears: 2,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
      {
        id: 2,
        title: "Casual Jeans",
        wears: 1,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "yesterday",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      {
        id: 3,
        title: "Floral dress",
        wears: 0,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "3 days ago",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
    ],
  },
  "7 Days": {
    growth: "+12% Active Wears",
    points: { y0: 110, y1: 100, y2: 80, y3: 52 },
    clothes: {
      p1: {
        title: "White Sneakers",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
      p2: {
        title: "Black Blazer",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      p3: {
        title: "Casual Jeans",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
    },
    list: [
      {
        id: 1,
        title: "Casual Jeans",
        wears: 3,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      {
        id: 2,
        title: "Black Blazer",
        wears: 2,
        status: "FAV",
        statusBg: "#CD7C46",
        lastWorn: "yesterday",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      {
        id: 3,
        title: "White Sneakers",
        wears: 1,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "3 days ago",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
    ],
  },
  "15 Days": {
    growth: "+18% Active Wears",
    points: { y0: 105, y1: 95, y2: 70, y3: 40 },
    clothes: {
      p1: {
        title: "Casual Jeans",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      p2: {
        title: "White Sneakers",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
      p3: {
        title: "Floral dress",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
    },
    list: [
      {
        id: 1,
        title: "Floral dress",
        wears: 7,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
      {
        id: 2,
        title: "Casual Jeans",
        wears: 3,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "2 days ago",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      {
        id: 3,
        title: "White Sneakers",
        wears: 2,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "5 days ago",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
    ],
  },
  "30 Days": {
    growth: "+32% Active Wears",
    points: { y0: 100, y1: 90, y2: 55, y3: 25 },
    clothes: {
      p1: {
        title: "Casual Jeans",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      p2: {
        title: "Floral dress",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
      p3: {
        title: "Black Blazer",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
    },
    list: [
      {
        id: 1,
        title: "Black Blazer",
        wears: 12,
        status: "FAV",
        statusBg: "#CD7C46",
        lastWorn: "yesterday",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
      {
        id: 2,
        title: "Floral dress",
        wears: 9,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../assets/images/mirror_selfie_girl.png"),
      },
      {
        id: 3,
        title: "Casual Jeans",
        wears: 4,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "2 days ago",
        image: require("../../assets/images/mirror_selfie_guy.png"),
      },
    ],
  },
};

const SCREEN_WIDTH = Dimensions.get("window").width;

export const WardrobeHighlights = React.memo(function WardrobeHighlights() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<RangeType>("30 Days");

  // Get active dataset based on selection
  const activeData = RANGE_DATA[selectedRange];

  // Dimensions
  const containerWidth = SCREEN_WIDTH - 48; // mx-6 is 24 padding on each side
  const svgHeight = 135;
  const paddingLeft = 32;
  const paddingRight = 36;
  const chartWidth = containerWidth - paddingLeft - paddingRight;
  const segmentWidth = chartWidth / 3;

  // Coordinates
  const x0 = paddingLeft;
  const x1 = paddingLeft + segmentWidth;
  const x2 = paddingLeft + 2 * segmentWidth;
  const x3 = paddingLeft + 3 * segmentWidth;

  const { y0, y1, y2, y3 } = activeData.points;
  const yBaseline = 120;

  // Cubic Bezier curve control points
  const cp1x = x0 + segmentWidth / 2;
  const cp1y = y0;
  const cp2x = x0 + segmentWidth / 2;
  const cp2y = y1;

  const cp3x = x1 + segmentWidth / 2;
  const cp3y = y1;
  const cp4x = x1 + segmentWidth / 2;
  const cp4y = y2;

  const cp5x = x2 + segmentWidth / 2;
  const cp5y = y2;
  const cp6x = x2 + segmentWidth / 2;
  const cp6y = y3;

  const dPath = `M ${x0} ${y0} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${x2} ${y2} C ${cp5x} ${cp5y}, ${cp6x} ${cp6y}, ${x3} ${y3}`;
  const dClosed = `${dPath} L ${x3} ${yBaseline} L ${x0} ${yBaseline} Z`;

  return (
    <View className="mt-8 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mx-8 mb-3">
        <Text
          style={{
            fontSize: 20,
            fontFamily: "TikTokSans16pt-Bold",
            color: "#1D1A27",
          }}
        >
          Wardrobe Highlights
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.navigate("/(root)/wardrobe-highlights" as never)
          }
        >
          <ChevronRight size={20} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Main card wrapper */}
      <View
        className="bg-white rounded-[24px] border border-[#E9EBF8] px-5 pt-5 pb-4 mx-6"
        style={{
          shadowColor: "#000000",
          shadowOpacity: 0.02,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 1 },
          elevation: 0.5,
        }}
      >
        {/* Graph meta values */}
        <View className="mb-2">
          <Text
            style={{
              fontSize: 12,
              fontFamily: "TikTokSans16pt-Medium",
              color: "#7E7C8C",
            }}
          >
            Wardrobe Utilization
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontFamily: "TikTokSans16pt-Bold",
              color: "#1D1A27",
            }}
          >
            {activeData.growth}
          </Text>
        </View>

        {/* Bezier Line Chart */}
        <View
          style={{
            position: "relative",
            width: containerWidth,
            height: svgHeight,
            marginLeft: -20,
          }}
        >
          <Svg width={containerWidth} height={svgHeight}>
            <Defs>
              <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#CD7C46" stopOpacity={0.22} />
                <Stop offset="100%" stopColor="#CD7C46" stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

            {/* Dotted horizontal grid lines */}
            <Line
              x1={x0}
              y1={95}
              x2={x3}
              y2={95}
              stroke="#F0F0F2"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <Line
              x1={x0}
              y1={65}
              x2={x3}
              y2={65}
              stroke="#F0F0F2"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <Line
              x1={x0}
              y1={30}
              x2={x3}
              y2={30}
              stroke="#F0F0F2"
              strokeWidth={1}
              strokeDasharray="4,4"
            />

            {/* Baseline grid line */}
            <Line
              x1={x0}
              y1={yBaseline}
              x2={x3}
              y2={yBaseline}
              stroke="#EBEBEB"
              strokeWidth={1}
            />

            {/* Gradient filled area under the curve */}
            <Path d={dClosed} fill="url(#areaGrad)" />

            {/* Smooth Bezier line path */}
            <Path
              d={dPath}
              fill="none"
              stroke="#CD7C46"
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Standard starting circular data point */}
            <Circle
              cx={x0}
              cy={y0}
              r={4}
              fill="#FFFFFF"
              stroke="#CD7C46"
              strokeWidth={1.5}
            />
          </Svg>

          {/* Point 1 Clothing Thumbnail Overlay */}
          <View
            style={{
              position: "absolute",
              left: x1 - 12,
              top: y1 - 12,
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: "#CD7C46",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
              shadowColor: "#000000",
              shadowOpacity: 0.1,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }}
          >
            <ExpoImage
              source={activeData.clothes.p1.image}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>

          {/* Point 2 Clothing Thumbnail Overlay */}
          <View
            style={{
              position: "absolute",
              left: x2 - 12,
              top: y2 - 12,
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: "#CD7C46",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
              shadowColor: "#000000",
              shadowOpacity: 0.1,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }}
          >
            <ExpoImage
              source={activeData.clothes.p2.image}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>

          {/* Point 3 Peak Clothing Thumbnail Overlay with Trophy badge */}
          <View style={{ position: "absolute", left: x3 - 14, top: y3 - 14 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: "#CD7C46",
                backgroundColor: "#FFFFFF",
                overflow: "hidden",
                shadowColor: "#000000",
                shadowOpacity: 0.15,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              <ExpoImage
                source={activeData.clothes.p3.image}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>
            {/* Tiny gold trophy badge overlay at top right */}
            <View
              style={{
                position: "absolute",
                right: -4,
                top: -4,
                backgroundColor: "#CD7C46",
                width: 13,
                height: 13,
                borderRadius: 6.5,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#FFFFFF",
              }}
            >
              <Trophy size={8} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>
        </View>

        {/* Horizontal Tab Selector Bar below the Graph */}
        <View className="flex-row items-center justify-between bg-[#F4F5F9] rounded-[10px] p-1 mt-3 mb-2">
          {RANGES.map((range) => {
            const isActive = selectedRange === range;
            return (
              <TouchableOpacity
                key={range}
                onPress={() => setSelectedRange(range)}
                className="flex-1 items-center justify-center py-2"
                style={
                  isActive
                    ? {
                        backgroundColor: "#FFFFFF",
                        borderRadius: 10,
                        shadowColor: "#000000",
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        shadowOffset: { width: 0, height: 1.5 },
                        elevation: 1,
                        borderWidth: 0.5,
                        borderColor: "#EBEBEB",
                      }
                    : {}
                }
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: isActive
                      ? "TikTokSans16pt-Bold"
                      : "TikTokSans16pt-Medium",
                    color: isActive ? "#1D1A27" : "#7E7C8C",
                  }}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Motivational message below the range tabs */}
        <View
          style={{
            // backgroundColor: "#E6F9F0",
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 5,
            marginTop: 4,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: "TikTokSans16pt-SemiBold",
              // color: "#1D9E75",/
              textAlign: "center",
            }}
          >
            {selectedRange === "3 Days"
              ? "Great start! You've been active in the last 3 days 🌟"
              : selectedRange === "7 Days"
                ? "One week strong! Keep the momentum going 🔥"
                : selectedRange === "15 Days"
                  ? "Halfway there! Your style habits are building 💪"
                  : "30-day champ! Your wardrobe is truly thriving 🏆"}
          </Text>
        </View>
      </View>
    </View>
  );
});
