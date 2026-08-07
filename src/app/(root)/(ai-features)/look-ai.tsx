import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ChevronLeft,
  Droplets,
  Footprints,
  Shirt,
  Sparkles,
  Sun,
  Watch,
  Wind,
} from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

function TrousersIcon({
  size = 24,
  color = "#2563EB",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M30,10 H70 L75,40 L90,90 H70 L60,50 H40 L30,90 H10 L25,40 Z"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const OUTFIT_DATA = [
  {
    id: "top",
    label: "Top",
    name: "White Linen Shirt",
    icon: Shirt,
    color: "#4C4B5E",
    bgColor: "#F4F4F6",
  },
  {
    id: "bottom",
    label: "Bottom",
    name: "Navy Cotton Trousers",
    icon: TrousersIcon,
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  {
    id: "shoes",
    label: "Shoes",
    name: "Tan Loafers",
    icon: Footprints,
    color: "#D97706",
    bgColor: "#FFFBEB",
  },
  {
    id: "accessory",
    label: "Accessory",
    name: "Silver Watch",
    icon: Watch,
    color: "#1D1A27",
    bgColor: "#F4F4F6",
  },
];

export default function LookAIScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC]" edges={["top"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-[#FAFAFC] z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-11 h-11 rounded-full bg-white items-center justify-center border border-[#E9EBF8]"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}
        >
          <ChevronLeft size={22} color="#1D1A27" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-1.5 absolute left-0 right-0 -z-10">
          <Sparkles size={20} color="#9333EA" fill="#9333EA" />
          <Text
            style={{
              fontFamily: "TikTokSans16pt-Bold",
              fontSize: 20,
              color: "#1D1A27",
            }}
          >
            LookAI
          </Text>
        </View>

        <View className="w-11 h-11" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        className="flex-1 px-6"
      >
        {/* Weather Card */}
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          className="rounded-[32px] overflow-hidden border border-[#E9EBF8]"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 2,
          }}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F4F6FB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text
                  style={{
                    fontFamily: "TikTokSans16pt-Medium",
                    fontSize: 13,
                    color: "#8E8D98",
                    letterSpacing: 0.5,
                  }}
                >
                  INDORE, IN
                </Text>
                <Text
                  style={{
                    fontFamily: "TikTokSans16pt-Bold",
                    fontSize: 56,
                    color: "#1D1A27",
                    marginTop: 4,
                  }}
                >
                  32°
                </Text>
                <Text
                  style={{
                    fontFamily: "TikTokSans16pt-Bold",
                    fontSize: 16,
                    color: "#1D1A27",
                    marginTop: 2,
                  }}
                >
                  Sunny & Clear
                </Text>
              </View>
              <Sun
                size={64}
                color="#F59E0B"
                fill="#FDE68A"
                className="mt-2 mr-2"
              />
            </View>

            <View className="flex-row gap-3 mt-8">
              <View className="bg-white/80 rounded-full px-4 py-2.5 flex-row items-center gap-2 border border-[#E9EBF8]">
                <Droplets size={16} color="#3B82F6" />
                <Text
                  style={{
                    fontFamily: "TikTokSans16pt-Bold",
                    fontSize: 12,
                    color: "#1D1A27",
                  }}
                >
                  Humidity 40%
                </Text>
              </View>

              <View className="bg-white/80 rounded-full px-4 py-2.5 flex-row items-center gap-2 border border-[#E9EBF8]">
                <Wind size={16} color="#6B7280" />
                <Text
                  style={{
                    fontFamily: "TikTokSans16pt-Bold",
                    fontSize: 12,
                    color: "#1D1A27",
                  }}
                >
                  Wind 12km/h
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* AI Insight Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          className="mt-6 rounded-[24px] overflow-hidden"
          style={{
            shadowColor: "#9333EA",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <LinearGradient
            colors={["#FAF5FF", "#F3E8FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5 border border-[#E9D5FF] rounded-[24px]"
          >
            <View className="flex-row items-start gap-3">
              <View className="w-8 h-8 rounded-full bg-[#9333EA] items-center justify-center mt-1">
                <Sparkles size={14} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text
                style={{
                  fontFamily: "TikTokSans16pt-Medium",
                  fontSize: 14,
                  color: "#4C4B5E",
                  lineHeight: 22,
                  flex: 1,
                }}
              >
                It&apos;s quite warm today. I recommend wearing breathable
                fabrics like cotton or linen. Stick to lighter colors to reflect
                the heat.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Suggested Outfit Title */}
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          style={{
            fontFamily: "TikTokSans16pt-Bold",
            fontSize: 20,
            color: "#1D1A27",
            marginTop: 32,
          }}
          className="mb-4"
        >
          Suggested Outfit
        </Animated.Text>

        {/* Outfit list items */}
        <View className="gap-3">
          {OUTFIT_DATA.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(300 + index * 100)
                .duration(500)
                .springify()}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                className="bg-white border border-[#E9EBF8] rounded-[24px] p-4 flex-row items-center"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.02,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 1,
                }}
              >
                <View
                  className="w-14 h-14 rounded-[18px] items-center justify-center mr-4"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <item.icon size={26} color={item.color} strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Bold",
                      fontSize: 12,
                      color: "#8E8D98",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Bold",
                      fontSize: 16,
                      color: "#1D1A27",
                    }}
                  >
                    {item.name}
                  </Text>
                </View>

                {/* Simulated checkbox circle */}
                <View className="w-6 h-6 rounded-full border-2 border-[#E9EBF8] mr-2" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
