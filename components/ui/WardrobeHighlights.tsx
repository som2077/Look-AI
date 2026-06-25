import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronRight, Flame, Sparkles, Star, TrendingUp } from "lucide-react-native";
import React, { useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

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
    list: HighlightItem[];
  }
> = {
  "3 Days": {
    growth: "+5% Active Wears",
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

export const WardrobeHighlights = React.memo(function WardrobeHighlights() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<RangeType>("30 Days");
  const activeData = RANGE_DATA[selectedRange];

  return (
    <View className="mt-8 mb-40 px-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <Text style={{ fontSize: 22, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
          Wardrobe Highlights
        </Text>
        <TouchableOpacity
          onPress={() => router.navigate("/(root)/wardrobe-highlights" as never)}
          className="h-8 w-8 bg-[#F4F5F9] rounded-full items-center justify-center"
        >
          <ChevronRight size={18} color="#1D1A27" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Main Premium Card */}
      <View
        className="bg-white rounded-[32px] border border-[#F0F0F5] p-5"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 4,
        }}
      >
        {/* Custom Segmented Control */}
        <View className="flex-row items-center bg-[#F7F8FA] p-1.5 rounded-[20px] mb-6">
          {RANGES.map((range) => {
            const isActive = selectedRange === range;
            return (
              <TouchableOpacity
                key={range}
                onPress={() => setSelectedRange(range)}
                className="flex-1 py-2.5 items-center justify-center rounded-[16px]"
                style={
                  isActive
                    ? {
                        backgroundColor: "#FFFFFF",
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 2,
                      }
                    : {}
                }
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: isActive ? "TikTokSans16pt-Bold" : "TikTokSans16pt-Medium",
                    color: isActive ? "#1D1A27" : "#8E8D98",
                  }}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Growth Metric */}
        <View className="flex-row items-center justify-between mb-6 px-1">
          <View>
            <Text style={{ fontSize: 13, fontFamily: "TikTokSans16pt-Medium", color: "#8E8D98", marginBottom: 4 }}>
              Wardrobe Utilization
            </Text>
            <View className="flex-row items-center gap-2">
              <TrendingUp size={20} color="#1D9E75" strokeWidth={2.5} />
              <Text style={{ fontSize: 24, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
                {activeData.growth}
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic Leaderboard List */}
        <Animated.View layout={Layout.springify().damping(14)} className="bg-[#FBFBFC] rounded-[24px] p-2 border border-[#F0F0F5]">
          {activeData.list.map((item, index) => (
            <Animated.View
              key={item.id + selectedRange}
              entering={FadeIn.delay(index * 100).duration(400)}
              exiting={FadeOut.duration(200)}
              className={`flex-row items-center justify-between p-3 ${
                index !== activeData.list.length - 1 ? "border-b border-[#F0F0F5]" : ""
              }`}
            >
              {/* Left: Image & Info */}
              <View className="flex-row items-center gap-4 flex-1">
                <View className="w-14 h-14 rounded-[16px] overflow-hidden bg-white border border-[#F0F0F5]">
                  <ExpoImage source={item.image} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontSize: 15, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27", marginBottom: 2 }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: "TikTokSans16pt-Medium", color: "#8E8D98" }}>
                    Last worn {item.lastWorn}
                  </Text>
                </View>
              </View>

              {/* Right: Stats & Badges */}
              <View className="items-end gap-1.5 ml-2">
                <View className="flex-row items-center gap-1.5">
                  <Text style={{ fontSize: 15, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27" }}>
                    {item.wears}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: "TikTokSans16pt-Medium", color: "#8E8D98" }}>
                    wears
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  style={{ backgroundColor: `${item.statusBg}15`, borderColor: `${item.statusBg}30` }}
                  className="flex-row items-center gap-1 px-2 py-1 rounded-full border"
                >
                  {item.status === "HOT" && <Flame size={10} color={item.statusBg} fill={item.statusBg} />}
                  {item.status === "FAV" && <Star size={10} color={item.statusBg} fill={item.statusBg} />}
                  {item.status === "NEW" && <Sparkles size={10} color={item.statusBg} />}
                  <Text style={{ fontSize: 9, fontFamily: "TikTokSans16pt-Bold", color: item.statusBg, letterSpacing: 0.5 }}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      </View>

      {/* Motivational Message */}
      <Animated.View layout={Layout.springify()} className="mt-6 mb-2 items-center justify-center">
        <Text style={{ fontSize: 13, fontFamily: "TikTokSans16pt-SemiBold", color: "#7E7C8C", textAlign: "center" }}>
          {selectedRange === "3 Days"
            ? "Great start! You've been active lately 🌟"
            : selectedRange === "7 Days"
            ? "One week strong! Keep the momentum going 🔥"
            : selectedRange === "15 Days"
            ? "Halfway there! Your style habits are building 💪"
            : "30-day champ! Your wardrobe is truly thriving 🏆"}
        </Text>
      </Animated.View>

      {/* Empty State / CTA */}
      <View className="mt-8 bg-[#F4F5F9] rounded-[24px] p-5 items-center justify-center relative border border-[#EBECEF]">
        <Text style={{ fontSize: 16, fontFamily: "TikTokSans16pt-Bold", color: "#1D1A27", textAlign: "center", marginBottom: 6 }}>
          Ready to style your wardrobe?
        </Text>
        <Text style={{ fontSize: 13, color: "#8E8D98", fontFamily: "TikTokSans16pt-Medium", textAlign: "center", lineHeight: 18 }}>
          Upload your clothes and discover {"\n"} new outfit combinations.
        </Text>

        <ExpoImage
          source={require("../../assets/ScribbleArrow.svg")}
          style={{ position: "absolute", bottom: -20, right: 30, width: 80, height: 40 }}
          contentFit="contain"
        />
      </View>
    </View>
  );
});
