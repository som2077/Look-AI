import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image as ExpoImage } from "expo-image";
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Line } from "react-native-svg";
import {
  IconArrowLeft,
  IconTrendingUp,
  IconFlame,
  IconSparkles,
  IconInfoCircle,
  IconShirt,
  IconAward,
} from "@tabler/icons-react-native";

interface HighlightItem {
  id: number;
  title: string;
  wears: number;
  status: string;
  statusBg: string;
  lastWorn: string;
  image: any;
  category: string;
  costPerWear: string;
  stylingPartner: string;
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
      p1: { title: "Floral dress", image: require("../../../assets/images/mirror_selfie_girl.png") },
      p2: { title: "Casual Jeans", image: require("../../../assets/images/mirror_selfie_guy.png") },
      p3: { title: "White Sneakers", image: require("../../../assets/images/mirror_selfie_girl.png") },
    },
    list: [
      {
        id: 1,
        title: "White Sneakers",
        wears: 2,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../../assets/images/mirror_selfie_girl.png"),
        category: "Footwear",
        costPerWear: "$15.00",
        stylingPartner: "Casual Jeans",
      },
      {
        id: 2,
        title: "Casual Jeans",
        wears: 1,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "yesterday",
        image: require("../../../assets/images/mirror_selfie_guy.png"),
        category: "Bottoms",
        costPerWear: "$45.00",
        stylingPartner: "White Sneakers",
      },
      {
        id: 3,
        title: "Floral dress",
        wears: 0,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "3 days ago",
        image: require("../../../assets/images/mirror_selfie_girl.png"),
        category: "Dresses",
        costPerWear: "$60.00",
        stylingPartner: "Denim Jacket",
      },
    ],
  },
  "7 Days": {
    growth: "+12% Active Wears",
    points: { y0: 110, y1: 100, y2: 80, y3: 52 },
    clothes: {
      p1: { title: "White Sneakers", image: require("../../../assets/images/mirror_selfie_girl.png") },
      p2: { title: "Black Blazer", image: require("../../../assets/images/mirror_selfie_guy.png") },
      p3: { title: "Casual Jeans", image: require("../../../assets/images/mirror_selfie_guy.png") },
    },
    list: [
      {
        id: 1,
        title: "Casual Jeans",
        wears: 3,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../../assets/images/mirror_selfie_guy.png"),
        category: "Bottoms",
        costPerWear: "$15.00",
        stylingPartner: "Black Blazer",
      },
      {
        id: 2,
        title: "Black Blazer",
        wears: 2,
        status: "FAV",
        statusBg: "#CD7C46",
        lastWorn: "yesterday",
        image: require("../../../assets/images/mirror_selfie_guy.png"),
        category: "Outerwear",
        costPerWear: "$32.50",
        stylingPartner: "Casual Jeans",
      },
      {
        id: 3,
        title: "White Sneakers",
        wears: 1,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "3 days ago",
        image: require("../../../assets/images/mirror_selfie_girl.png"),
        category: "Footwear",
        costPerWear: "$30.00",
        stylingPartner: "Floral dress",
      },
    ],
  },
  "15 Days": {
    growth: "+18% Active Wears",
    points: { y0: 105, y1: 95, y2: 70, y3: 40 },
    clothes: {
      p1: { title: "Casual Jeans", image: require("../../../assets/images/mirror_selfie_guy.png") },
      p2: { title: "White Sneakers", image: require("../../../assets/images/mirror_selfie_girl.png") },
      p3: { title: "Floral dress", image: require("../../../assets/images/mirror_selfie_girl.png") },
    },
    list: [
      {
        id: 1,
        title: "Floral dress",
        wears: 7,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../../assets/images/mirror_selfie_girl.png"),
        category: "Dresses",
        costPerWear: "$8.57",
        stylingPartner: "White Sneakers",
      },
      {
        id: 2,
        title: "Casual Jeans",
        wears: 3,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "2 days ago",
        image: require("../../../assets/images/mirror_selfie_guy.png"),
        category: "Bottoms",
        costPerWear: "$15.00",
        stylingPartner: "Black Blazer",
      },
      {
        id: 3,
        title: "White Sneakers",
        wears: 2,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "5 days ago",
        image: require("../../../assets/images/mirror_selfie_girl.png"),
        category: "Footwear",
        costPerWear: "$15.00",
        stylingPartner: "Casual Jeans",
      },
    ],
  },
  "30 Days": {
    growth: "+32% Active Wears",
    points: { y0: 100, y1: 90, y2: 55, y3: 25 },
    clothes: {
      p1: { title: "Casual Jeans", image: require("../../../assets/images/mirror_selfie_guy.png") },
      p2: { title: "Floral dress", image: require("../../../assets/images/mirror_selfie_girl.png") },
      p3: { title: "Black Blazer", image: require("../../../assets/images/mirror_selfie_guy.png") },
    },
    list: [
      {
        id: 1,
        title: "Black Blazer",
        wears: 12,
        status: "FAV",
        statusBg: "#CD7C46",
        lastWorn: "yesterday",
        image: require("../../../assets/images/mirror_selfie_guy.png"),
        category: "Outerwear",
        costPerWear: "$5.41",
        stylingPartner: "Casual Jeans",
      },
      {
        id: 2,
        title: "Floral dress",
        wears: 9,
        status: "HOT",
        statusBg: "#1D9E75",
        lastWorn: "today",
        image: require("../../../assets/images/mirror_selfie_girl.png"),
        category: "Dresses",
        costPerWear: "$6.67",
        stylingPartner: "White Sneakers",
      },
      {
        id: 3,
        title: "Casual Jeans",
        wears: 4,
        status: "NEW",
        statusBg: "#000000",
        lastWorn: "2 days ago",
        image: require("../../../assets/images/mirror_selfie_guy.png"),
        category: "Bottoms",
        costPerWear: "$11.25",
        stylingPartner: "Black Blazer",
      },
    ],
  },
};

const CATEGORIES_PROGRESS = [
  { name: "Outerwear", percentage: 45, count: 6, color: "#CD7C46" },
  { name: "Bottoms", percentage: 32, count: 8, color: "#1D1A27" },
  { name: "Dresses", percentage: 18, count: 4, color: "#1D9E75" },
  { name: "Footwear", percentage: 5, count: 2, color: "#9B9BAF" },
];

export default function WardrobeHighlightsScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const [selectedRange, setSelectedRange] = useState<RangeType>("30 Days");

  // Get active dataset based on selection
  const activeData = RANGE_DATA[selectedRange];

  // Dimensions
  const containerWidth = screenWidth - 40; // horizontal padding is 20 on each side
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#F4F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconArrowLeft size={20} color="#1D1A27" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
            Wardrobe Highlights
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "TikTokSans16pt-Medium", color: "#9B9BAF", marginTop: 1 }}>
            Interactive clothes highlights log
          </Text>
        </View>
      </View>

      {/* Main details screen body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
      >
        {/* Dynamic Bezier Curve Highlights Card */}
        <View
          className="bg-white rounded-[24px] border border-[#E9EBF8] px-5 pt-5 pb-4 mx-5 mb-6"
          style={{
            shadowColor: "#000000",
            shadowOpacity: 0.02,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}
        >
          {/* Metadata Block */}
          <View className="mb-2">
            <Text style={{ fontSize: 12, fontFamily: "TikTokSans16pt-Medium", color: "#7E7C8C" }}>
              Wardrobe Utilization Rate
            </Text>
            <Text style={{ fontSize: 22, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
              {activeData.growth}
            </Text>
          </View>

          {/* SVG Chart area */}
          <View style={{ position: "relative", width: containerWidth, height: svgHeight, marginLeft: -20 }}>
            <Svg width={containerWidth} height={svgHeight}>
              <Defs>
                <LinearGradient id="areaGradHighlights" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#CD7C46" stopOpacity={0.22} />
                  <Stop offset="100%" stopColor="#CD7C46" stopOpacity={0.0} />
                </LinearGradient>
              </Defs>

              {/* Dotted helper grid lines */}
              <Line x1={x0} y1={95} x2={x3} y2={95} stroke="#F0F0F2" strokeWidth={1} strokeDasharray="4,4" />
              <Line x1={x0} y1={65} x2={x3} y2={65} stroke="#F0F0F2" strokeWidth={1} strokeDasharray="4,4" />
              <Line x1={x0} y1={30} x2={x3} y2={30} stroke="#F0F0F2" strokeWidth={1} strokeDasharray="4,4" />

              {/* Baseline axis */}
              <Line x1={x0} y1={yBaseline} x2={x3} y2={yBaseline} stroke="#EBEBEB" strokeWidth={1} />

              {/* Closed area gradient */}
              <Path d={dClosed} fill="url(#areaGradHighlights)" />

              {/* Curve path */}
              <Path d={dPath} fill="none" stroke="#CD7C46" strokeWidth={3} strokeLinecap="round" />

              {/* Start point */}
              <Circle cx={x0} cy={y0} r={4} fill="#FFFFFF" stroke="#CD7C46" strokeWidth={1.5} />
            </Svg>

            {/* Thumbnail Point 1 */}
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

            {/* Thumbnail Point 2 */}
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

            {/* Thumbnail Point 3 (Peak) */}
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
              {/* Mini gold trophy overlay */}
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
                <IconAward size={8} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </View>

          {/* Time range tab selector (3 Days, 7 Days, 15 Days, 30 Days) */}
          <View className="flex-row items-center justify-between bg-[#F4F5F9] rounded-full p-1 mt-3">
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
                          borderRadius: 9999,
                          shadowColor: "#000000",
                          shadowOpacity: 0.05,
                          shadowRadius: 3,
                          shadowOffset: { width: 0, height: 1.5 },
                          elevation: 2,
                          borderWidth: 0.5,
                          borderColor: "#EBEBEB",
                        }
                      : {}
                  }
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: isActive ? "TikTokSans16pt-Bold" : "TikTokSans16pt-Medium",
                      color: isActive ? "#1D1A27" : "#7E7C8C",
                    }}
                  >
                    {range}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 📊 Category Utilization Breakdown */}
        <View className="mx-5 mb-6">
          <Text style={{ fontSize: 16, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27", marginBottom: 12 }}>
            Utilization by Category
          </Text>

          <View className="bg-white rounded-[20px] border border-[#E9EBF8] p-5">
            {CATEGORIES_PROGRESS.map((cat, i) => (
              <View key={cat.name} className="mb-4 last:mb-0" style={{ marginBottom: i === CATEGORIES_PROGRESS.length - 1 ? 0 : 16 }}>
                <View className="flex-row justify-between mb-1.5">
                  <View className="flex-row items-center gap-2">
                    <IconShirt size={14} color="#7E7C8C" />
                    <Text style={{ fontSize: 13, fontFamily: "TikTokSans16pt-SemiBold", color: "#1D1A27" }}>
                      {cat.name}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: "TikTokSans16pt-Bold", color: cat.color }}>
                    {cat.percentage}% ({cat.count} wears)
                  </Text>
                </View>
                {/* Custom styled progress track */}
                <View style={{ height: 6, backgroundColor: "#F0F0F4", borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 👚 Highly Utilized Clothes Detail Cards */}
        <View className="mx-5 mb-6">
          <Text style={{ fontSize: 16, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27", marginBottom: 12 }}>
            Highly Utilized Pieces
          </Text>

          {activeData.list.map((item) => (
            <View
              key={item.id}
              className="bg-white rounded-[20px] border border-[#E9EBF8] p-4 mb-3 flex-row gap-4"
              style={{
                shadowColor: "#000000",
                shadowOpacity: 0.02,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              }}
            >
              {/* Photo preview container */}
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#E9EBF8",
                  overflow: "hidden",
                  backgroundColor: "#F8F8FC",
                }}
              >
                <ExpoImage
                  source={item.image}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </View>

              {/* Specifications block */}
              <View style={{ flex: 1 }}>
                <View className="flex-row items-center justify-between">
                  <Text style={{ fontSize: 15, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
                    {item.title}
                  </Text>
                  <View
                    style={{
                      backgroundColor: item.statusBg,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 8, fontFamily: "TikTokSans16pt-Bold", color: "#FFFFFF" }}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, fontFamily: "TikTokSans16pt-Medium", color: "#9B9BAF", marginTop: 2 }}>
                  Category: <Text style={{ color: "#1D1A27" }}>{item.category}</Text> · Last worn: <Text style={{ color: "#1D1A27" }}>{item.lastWorn}</Text>
                </Text>

                <View className="flex-row items-center gap-4 mt-3 border-t border-[#F0F2FA] pt-2">
                  <View>
                    <Text style={{ fontSize: 9, fontFamily: "TikTokSans16pt-Medium", color: "#9B9BAF" }}>
                      Wears
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: "TikTokSans16pt-Bold", color: "#CD7C46" }}>
                      {item.wears} times
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 9, fontFamily: "TikTokSans16pt-Medium", color: "#9B9BAF" }}>
                      Cost/Wear
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
                      {item.costPerWear}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontFamily: "TikTokSans16pt-Medium", color: "#9B9BAF" }}>
                      Styling partner
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }} numberOfLines={1}>
                      {item.stylingPartner}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 💡 AI Styling Advice cards */}
        <View className="mx-5 mb-4">
          <Text style={{ fontSize: 16, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27", marginBottom: 12 }}>
            AI Smart Suggestions
          </Text>

          {/* Advice Item 1 */}
          <View className="bg-[#FFF8F0] border border-[#FFE7C8] rounded-[20px] p-4 flex-row gap-3 mb-3">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#FFF0DC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSparkles size={16} color="#CD7C46" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
                Improve Blazer Utilization
              </Text>
              <Text style={{ fontSize: 11, fontFamily: "TikTokSans16pt-Medium", color: "#7E7C8C", marginTop: 2, lineHeight: 15 }}>
                Your Black Blazer is highly utilized! Try pairing it with a simple white tee to double its styling frequency for casual settings.
              </Text>
            </View>
          </View>

          {/* Advice Item 2 */}
          <View className="bg-[#EEFDF7] border border-[#D1F7E8] rounded-[20px] p-4 flex-row gap-3">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#DDFCF0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconInfoCircle size={16} color="#1D9E75" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
                Keep Wardrobe Fresh
              </Text>
              <Text style={{ fontSize: 11, fontFamily: "TikTokSans16pt-Medium", color: "#7E7C8C", marginTop: 2, lineHeight: 15 }}>
                Only 12% of your wardrobe has been idle in the last 30 days. You are utilizing your clothing items efficiently!
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
