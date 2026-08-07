import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { FitCheckAnalysis } from "@/features/scanning/api/gemini-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import {
  IconArrowLeft,
  IconBolt,
  IconBookmark,
  IconCircleX,
  IconDotsVertical,
  IconSparkles,
} from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

type FitCheckParams = {
  scanId?: string;
  outfitIndex?: string;
};

// Outline Card Component for the new flat, clean aesthetic
const OutlineCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <View
    className={`rounded-[32px] border border-gray-200 bg-white p-5 mb-5 shadow-sm ${className}`}
  >
    {children}
  </View>
);

// Flexible Progress Ring Component
const ProgressRing = ({
  size,
  progress,
  innerTop,
  innerBottom,
  bottomText,
  color,
}: {
  size: number;
  progress: number;
  innerTop: string;
  innerBottom?: string;
  bottomText?: string;
  color: string;
}) => {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <View className="items-center">
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center relative"
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View className="absolute items-center justify-center">
          <Text
            className="font-extrabold text-[#111827]"
            style={{ fontSize: size * 0.22 }}
          >
            {innerTop}
          </Text>
          {innerBottom && (
            <Text
              className="text-gray-500 font-medium mt-0.5"
              style={{ fontSize: size * 0.14 }}
            >
              {innerBottom}
            </Text>
          )}
        </View>
      </View>
      {bottomText && (
        <Text className="text-[11px] font-bold text-gray-700 mt-2">
          {bottomText}
        </Text>
      )}
    </View>
  );
};

export default function FitCheckResultScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const params = useLocalSearchParams() as FitCheckParams;
  const scans = useScanHistoryStore((s) => s.scans);
  const removeScan = useScanHistoryStore((s) => s.removeScan);
  const removeOutfit = useOutfitAnalysisStore((s) => s.removeOutfit);

  const scan = scans.find((s) => s.id === params.scanId);
  const result = scan?.result as unknown as FitCheckAnalysis;

  if (!result || result.ratingTitle === "Not an Outfit") {
    return (
      <View className="flex-1 bg-white items-center justify-center p-5">
        <StatusBar style="dark" />
        <IconCircleX size={64} color="#EF4444" className="mb-4" />
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Analysis Failed
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          {result?.actionableFixes?.[0]?.solution ||
            "Please upload a clear, full-length photo of a person wearing an outfit."}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-gray-900 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }
  const photoUri = scan?.thumbnail;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Absolute Full-Screen Background Image */}
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View
          style={StyleSheet.absoluteFillObject}
          className="bg-gray-800 items-center justify-center"
        >
          <Text className="text-gray-500 font-bold">NO PHOTO</Text>
        </View>
      )}

      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Floating Header */}
        <View className="flex-row items-center justify-between px-5 z-10">
          <Pressable
            onPress={() => router.back()}
            className="w-12 h-12 rounded-full bg-white items-center justify-center"
          >
            <IconArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text className="text-white font-extrabold  text-[20px] shadow-sm">
            Fit Check
          </Text>
          <Pressable
            onPress={() => setShowMenu(true)}
            className="w-12 h-12 rounded-full bg-white items-center justify-center "
          >
            <IconDotsVertical size={22} color="#111827" />
          </Pressable>
        </View>

        {/* Dropdown Menu Modal */}
        {showMenu && (
          <Modal
            transparent
            visible
            animationType="fade"
            onRequestClose={() => setShowMenu(false)}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setShowMenu(false)}>
              <View
                style={{
                  position: "absolute",
                  top: 100,
                  right: 20,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                  minWidth: 140,
                  paddingVertical: 4,
                }}
              >
                <Pressable
                  style={{ paddingVertical: 12, paddingHorizontal: 16 }}
                  onPress={() => {
                    setShowMenu(false);
                    if (params.outfitIndex)
                      removeOutfit(parseInt(params.outfitIndex));
                    router.replace("/(root)/(tabs)" as never);
                  }}
                >
                  <Text className="text-[15px] font-medium text-[#1D1A27]">
                    Save
                  </Text>
                </Pressable>
                <View className="h-px bg-gray-100" />
                <Pressable
                  style={{ paddingVertical: 12, paddingHorizontal: 16 }}
                  onPress={() => {
                    setShowMenu(false);
                    if (params.scanId) removeScan(params.scanId);
                    if (params.outfitIndex)
                      removeOutfit(parseInt(params.outfitIndex));
                    router.replace("/(root)/(tabs)" as never);
                  }}
                >
                  <Text className="text-[15px] font-medium text-red-500">
                    Delete
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        )}

        {/* Scrollable Content with Bottom Sheet */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Spacer to show the full image */}
          <View className="h-[400px]" />

          {/* Bottom Sheet Container */}
          <View className="flex-1 bg-white rounded-t-[30px] px-5 pt-6 pb-32 shadow-2xl">
            {/* Grab handle indicator */}
            <View className="w-12 h-1.5 bg-black rounded-full self-center absolute top-3" />

            {/* Top Row: Time & Category Pills */}
            <View className="flex-row justify-between items-end mb-5 mt-3 px-1">
              <View className="flex-col items-start gap-y-2.5">
                <View className="bg-gray-100 px-3.5 py-1.5 rounded-full ml-3">
                  <Text className="text-[11px] font-bold text-gray-700">
                    {new Date().toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View className="bg-black px-5 py-2.5 rounded-full">
                  <Text className="text-[13px] font-bold text-white">
                    {result.styleCategory?.archetype || "Business casual"}
                  </Text>
                </View>
              </View>
              <Pressable className="pb-2 pr-2">
                <IconBookmark size={24} color="#111827" strokeWidth={1.5} />
              </Pressable>
            </View>

            {/* Card 2: Body Proportions */}
            <OutlineCard className="flex-row items-center p-4">
              <View className="w-[100px] items-center justify-center mr-2">
                <Image
                  // Currently defaulting to female proportions. In the future, tie this to user gender state.
                  source={require("../../../../assets/fitImage/female-proportions-clean.jpg")}
                  style={{ width: 90, height: 160 }}
                  resizeMode="contain"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-gray-500 mb-0.5">
                  Body Proportions
                </Text>
                <Text className="text-lg font-extrabold text-[#111827] mb-1">
                  {result.silhouette?.bodyShape || "Well-Balanced"}
                </Text>
                <Text className="text-[11px] text-gray-500 leading-tight mb-4">
                  {result.silhouette?.explanation ||
                    "A solid outfit with room for minor tweaks."}
                </Text>

                <View className="flex-row items-center justify-between">
                  <ProgressRing
                    size={64}
                    progress={result.fitScore || 85}
                    innerTop={`${result.fitScore || 85}/100`}
                    innerBottom="Overall"
                    bottomText="Sharp tier"
                    color="#EF4444" // Red stroke as in mockup
                  />
                  <ProgressRing
                    size={64}
                    progress={result.silhouette?.topRatio || 50}
                    innerTop={`${result.silhouette?.topRatio || 50}%`}
                    innerBottom="Torso"
                    bottomText="Physical fit"
                    color="#111827"
                  />
                  <ProgressRing
                    size={64}
                    progress={result.silhouette?.bottomRatio || 50}
                    innerTop={`${result.silhouette?.bottomRatio || 50}%`}
                    innerBottom="Legs"
                    bottomText="Look & Color"
                    color="#111827"
                  />
                </View>
              </View>
            </OutlineCard>

            {/* Card 4: Analysis & Quick Fixes (Light Themed) */}
            <OutlineCard className="p-5">
              <View className="mb-6 gap-y-3">
                {[
                  result.fitPrecision?.shoulderFit?.text,
                  result.fitPrecision?.sleeveLength?.text,
                  result.fitPrecision?.trouserBreak?.text,
                ]
                  .filter(Boolean)
                  .map((text, idx) => (
                    <View key={idx} className="flex-row items-start">
                      <View className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-2 mr-3" />
                      <Text className="text-gray-700 text-[14px] leading-5 flex-1 font-medium">
                        {text}
                      </Text>
                    </View>
                  ))}
              </View>

              {result.actionableFixes?.[0] && (
                <View className="bg-orange-50 border border-orange-200/60 rounded-2xl p-4">
                  <View className="flex-row items-center mb-1">
                    <IconBolt size={18} color="#F59E0B" className="mr-2" />
                    <Text className="text-[#F59E0B] font-bold text-sm">
                      Quick fix
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm leading-5 pl-6">
                    {result.actionableFixes[0].solution}
                  </Text>
                </View>
              )}
            </OutlineCard>
          </View>
        </ScrollView>

        {/* Fixed Bottom Footer */}
        <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-8 border-t border-gray-100 flex-row gap-4 z-20">
          <Pressable
            className="flex-1 h-14 rounded-full border border-gray-300 items-center justify-center flex-row active:bg-gray-50"
            onPress={() => {
              // TODO: Implement fix scan logic
            }}
          >
            <IconSparkles size={20} color="#111827" className="mr-2" />
            <Text className="text-[#111827] font-bold text-[15px]">
              Fix Scan
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 h-14 rounded-full bg-[#0F172A] items-center justify-center active:bg-black"
            onPress={() => router.replace("/(root)/(tabs)" as never)}
          >
            <Text className="text-white font-bold text-[15px]">Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
