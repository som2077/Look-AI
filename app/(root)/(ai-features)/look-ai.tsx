import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  ChevronLeft,
  Sparkles,
  Sun,
  Droplets,
  Wind,
  Shirt,
  Footprints,
  Watch,
} from "lucide-react-native";

// Custom Trousers/Pants Icon Component
function TrousersIcon({ size = 24, color = "#2563EB" }: { size?: number; color?: string }) {
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

export default function LookAIScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <ChevronLeft size={20} color="#1D1A27" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-1.5 absolute left-0 right-0 justify-center -z-10">
          <Sparkles size={18} color="#9333EA" fill="#9333EA" />
          <Text className="text-xl font-bold text-[#1D1A27]">LookAI</Text>
        </View>

        <View className="w-10 h-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 px-6"
      >
        {/* Weather Card */}
        <View className="mt-6 rounded-3xl overflow-hidden border border-[#E9ECF8]">
          <LinearGradient
            colors={["#F8F9FF", "#E9ECF8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-[#8E8E9F] text-sm font-semibold tracking-wide">
                  Indore, IN
                </Text>
                <Text className="text-5xl font-extrabold text-[#1D1A27] mt-2">
                  32°C
                </Text>
                <Text className="text-[#1D1A27] text-base font-bold mt-1">
                  Sunny & Clear
                </Text>
              </View>
              <Sun size={56} color="#F59E0B" className="mt-1" />
            </View>

            <View className="flex-row gap-3 mt-6">
              <View className="bg-white rounded-full px-4 py-2 border border-gray-100 flex-row items-center gap-1.5">
                <Droplets size={14} color="#3B82F6" />
                <Text className="text-xs font-bold text-[#1D1A27]">
                  Humidity 40%
                </Text>
              </View>

              <View className="bg-white rounded-full px-4 py-2 border border-gray-100 flex-row items-center gap-1.5">
                <Wind size={14} color="#6B7280" />
                <Text className="text-xs font-bold text-[#1D1A27]">
                  Wind 12km/h
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* AI Insight Card */}
        <View className="bg-[#FAF5FF] border-l-4 border-[#7C3AED] rounded-r-2xl rounded-l-sm p-5 mt-5">
          <Text className="text-[#4C4B5E] text-sm font-medium leading-5">
            {"It's quite warm today. I recommend wearing breathable fabrics like cotton or linen. Stick to lighter colors to reflect the heat."}
          </Text>
        </View>

        {/* Suggested Outfit Title */}
        <Text className="text-lg font-bold text-[#1D1A27] mt-8 mb-4">
          Suggested Outfit
        </Text>

        {/* Outfit list items */}
        <View className="gap-3">
          {/* Top Card */}
          <View className="bg-white border border-[#EAEAEF] rounded-2xl p-4 flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-[#F4F4F6] items-center justify-center mr-4">
              <Shirt size={26} color="#4C4B5E" strokeWidth={1.5} />
            </View>
            <View>
              <Text className="text-xs font-semibold text-[#8E8E9F] tracking-wide mb-0.5">
                Top
              </Text>
              <Text className="text-base font-bold text-[#1D1A27]">
                White Linen Shirt
              </Text>
            </View>
          </View>

          {/* Bottom Card */}
          <View className="bg-white border border-[#EAEAEF] rounded-2xl p-4 flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-[#EFF6FF] items-center justify-center mr-4">
              <TrousersIcon size={26} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-xs font-semibold text-[#8E8E9F] tracking-wide mb-0.5">
                Bottom
              </Text>
              <Text className="text-base font-bold text-[#1D1A27]">
                Navy Cotton Trousers
              </Text>
            </View>
          </View>

          {/* Shoes Card */}
          <View className="bg-white border border-[#EAEAEF] rounded-2xl p-4 flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-[#FFFBEB] items-center justify-center mr-4">
              <Footprints size={26} color="#D97706" strokeWidth={1.5} />
            </View>
            <View>
              <Text className="text-xs font-semibold text-[#8E8E9F] tracking-wide mb-0.5">
                Shoes
              </Text>
              <Text className="text-base font-bold text-[#1D1A27]">
                Tan Loafers
              </Text>
            </View>
          </View>

          {/* Accessory Card */}
          <View className="bg-white border border-[#EAEAEF] rounded-2xl p-4 flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-[#F4F4F6] items-center justify-center mr-4">
              <Watch size={26} color="#1D1A27" strokeWidth={1.5} />
            </View>
            <View>
              <Text className="text-xs font-semibold text-[#8E8E9F] tracking-wide mb-0.5">
                Accessory
              </Text>
              <Text className="text-base font-bold text-[#1D1A27]">
                Silver Watch
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
