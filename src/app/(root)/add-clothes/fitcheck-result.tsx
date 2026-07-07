import { FitCheckAnalysis } from "@/features/scanning/api/gemini-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { BlurView } from "expo-blur";
import {
  IconArrowLeft,
  IconCheck,
  IconCircleCheck,
  IconCircleX,
  IconAlertCircle,
} from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

type FitCheckParams = {
  scanId?: string;
};

const DEFAULT_RESULT: FitCheckAnalysis = {
  fitScore: 75,
  ratingTitle: "Good Look ✨",
  ratingSubtitle: "A solid outfit with room for minor tweaks.",
  silhouette: {
    bodyShape: "Unknown",
    waistBalance: "Standard Balance",
    topRatio: 50,
    bottomRatio: 50,
    explanation: "Balanced proportions.",
  },
  fitPrecision: {
    shoulderFit: { status: "Perfect", text: "Shoulders fit well" },
    sleeveLength: { status: "Perfect", text: "Sleeves are correct length" },
    trouserBreak: { status: "Perfect", text: "Good break length" },
  },
  colorTheory: {
    hexColors: ["#1D1A27", "#F9FAFB", "#E9EBF8"],
    harmony: "Neutral",
    contrastExplanation: "Medium contrast tonal look.",
  },
  styleCategory: {
    archetype: "Casual",
    trendScore: 70,
  },
  actionableFixes: [
    {
      problem: "Outfit lacks personal touch",
      solution: "Try adding a statement accessory",
    },
  ],
};

function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981"; // Vibrant Green
  if (score >= 60) return "#F59E0B"; // Amber
  return "#EF4444"; // Red
}

function getStatusColor(status: string): string {
  if (status === "Perfect") return "#10B981";
  if (status === "Tight" || status === "Short") return "#EF4444";
  return "#F59E0B"; // Loose or Long
}

// Custom Glass Card Component
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <View className={`rounded-3xl overflow-hidden mb-6 border border-white/60 bg-white/40 ${className}`}>
    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
    <View className="p-5">{children}</View>
  </View>
);

export default function FitCheckResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as FitCheckParams;
  const scans = useScanHistoryStore((s) => s.scans);
  
  const scan = scans.find((s) => s.id === params.scanId);
  const result = (scan?.result as unknown as FitCheckAnalysis) || DEFAULT_RESULT;
  const photoUri = scan?.thumbnail;

  const scoreColor = getScoreColor(result.fitScore || 75);

  const CIRCUMFERENCE = 2 * Math.PI * 40;
  const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * (result.fitScore || 75)) / 100;

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <StatusBar style="dark" />
      {/* Soft gradient backgrounds behind the glass */}
      <View className="absolute top-[-100] left-[-100] w-96 h-96 bg-blue-200/50 rounded-full blur-3xl opacity-50" />
      <View className="absolute bottom-[-100] right-[-100] w-96 h-96 bg-pink-200/50 rounded-full blur-3xl opacity-50" />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/70 items-center justify-center border border-white/50"
            style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 }}
          >
            <IconArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text className="text-[#111827] font-bold tracking-widest text-[13px]">
            FIT CHECK RESULT
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Main Photo Card */}
          <GlassCard className="mt-2 p-0">
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: 380, borderRadius: 24 }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-[380px] bg-gray-200/50 items-center justify-center rounded-3xl">
                <Text className="text-gray-400 font-bold">FULL-LENGTH PHOTO</Text>
              </View>
            )}
          </GlassCard>

          {/* Score & Rating Section */}
          <View className="flex-row items-center mb-10 px-2">
            <View className="relative w-[90px] h-[90px] items-center justify-center mr-5">
              <Svg width={90} height={90}>
                <Circle cx={45} cy={45} r={40} stroke="#E5E7EB" strokeWidth={8} fill="none" />
                <G rotation="-90" origin="45, 45">
                  <Circle
                    cx={45}
                    cy={45}
                    r={40}
                    stroke={scoreColor}
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>
              <View className="absolute items-center justify-center">
                <Text className="font-extrabold text-[#111827] text-2xl">
                  {result.fitScore}
                </Text>
                <Text className="text-[10px] text-gray-500 font-bold mt-[-2px]">
                  /100
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-[#111827] mb-1">
                {result.ratingTitle}
              </Text>
              <Text className="text-sm text-gray-600 leading-5">
                {result.ratingSubtitle}
              </Text>
            </View>
          </View>

          {/* Section 1: Silhouette */}
          <Text className="text-xs font-bold text-gray-400 tracking-widest mb-4 ml-2">
            1. SILHOUETTE & PROPORTION
          </Text>
          <GlassCard>
            <View className="flex-row gap-3 mb-5">
              <View className="bg-white/60 px-4 py-2 rounded-full border border-gray-100">
                <Text className="text-[#10B981] font-bold text-sm">
                  {result.silhouette?.bodyShape || "Body Shape"}
                </Text>
              </View>
              <View className="bg-white/60 px-4 py-2 rounded-full border border-gray-100">
                <Text className="text-gray-700 font-bold text-sm">
                  {result.silhouette?.waistBalance || "Waist Balance"}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-xs font-bold text-gray-400 tracking-wider">
                TOP : BOTTOM RATIO
              </Text>
            </View>
            
            <View className="h-8 rounded-full overflow-hidden flex-row mb-3 bg-gray-200">
              <View 
                style={{ width: `${result.silhouette?.topRatio || 50}%`, backgroundColor: "#10B981" }} 
                className="h-full items-center justify-center"
              >
                <Text className="text-white font-bold text-xs">{result.silhouette?.topRatio || 50}</Text>
              </View>
              <View 
                style={{ width: `${result.silhouette?.bottomRatio || 50}%`, backgroundColor: "#374151" }} 
                className="h-full items-center justify-center"
              >
                <Text className="text-white font-bold text-xs">{result.silhouette?.bottomRatio || 50}</Text>
              </View>
            </View>

            <Text className="text-sm text-gray-600 leading-5">
              {result.silhouette?.explanation}
            </Text>
          </GlassCard>

          {/* Section 2: Fit Precision */}
          <Text className="text-xs font-bold text-gray-400 tracking-widest mb-4 ml-2">
            2. FIT PRECISION
          </Text>
          <GlassCard>
            {[
              { label: "Shoulder Fit", data: result.fitPrecision?.shoulderFit },
              { label: "Sleeve Length", data: result.fitPrecision?.sleeveLength },
              { label: "Trouser Break", data: result.fitPrecision?.trouserBreak },
            ].map((item, idx) => (
              <View key={idx} className="flex-row items-center justify-between py-3 border-b border-gray-100/50">
                <Text className="text-[#374151] font-medium text-[15px]">{item.label}</Text>
                <View className="flex-row items-center">
                  <View 
                    className="w-2.5 h-2.5 rounded-full mr-2" 
                    style={{ backgroundColor: getStatusColor(item.data?.status || "Perfect") }}
                  />
                  <Text className="text-[#111827] font-bold text-[15px]">
                    {item.data?.status || "Perfect"}
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>

          {/* Section 3: Color Theory */}
          <Text className="text-xs font-bold text-gray-400 tracking-widest mb-4 ml-2">
            3. COLOR THEORY
          </Text>
          <GlassCard>
            <View className="flex-row gap-3 mb-5">
              {result.colorTheory?.hexColors?.map((color, idx) => (
                <View 
                  key={idx}
                  className="w-14 h-14 rounded-2xl border border-gray-200"
                  style={{ backgroundColor: color, shadowColor: color, shadowOpacity: 0.2, shadowRadius: 8 }}
                />
              ))}
            </View>
            <View className="bg-white/60 self-start px-4 py-2 rounded-full border border-gray-100 mb-5">
              <Text className="text-[#10B981] font-bold text-sm">
                {result.colorTheory?.harmony || "Harmony"}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 leading-5">
              {result.colorTheory?.contrastExplanation}
            </Text>
          </GlassCard>

          {/* Section 4: Style Category */}
          <Text className="text-xs font-bold text-gray-400 tracking-widest mb-4 ml-2">
            4. STYLE ARCHETYPE
          </Text>
          <GlassCard className="bg-emerald-50/50 border-emerald-100">
            <Text className="text-2xl font-extrabold text-[#111827] mb-2">
              {result.styleCategory?.archetype || "Minimalist"}
            </Text>
            <View className="mb-2">
              <Text className="text-xs font-bold text-gray-400 tracking-wider mb-2">
                TREND RELEVANCE
              </Text>
              <View className="h-2 rounded-full bg-gray-200 w-full overflow-hidden">
                <View 
                  className="h-full bg-[#10B981] rounded-full" 
                  style={{ width: `${result.styleCategory?.trendScore || 50}%` }}
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-[10px] text-gray-400">Dated</Text>
                <Text className="text-[10px] text-gray-400">Trending Now</Text>
              </View>
            </View>
          </GlassCard>

          {/* Section 5: Actionable Fixes */}
          <Text className="text-xs font-bold text-gray-400 tracking-widest mb-4 ml-2">
            5. ACTIONABLE FIXES
          </Text>
          <View className="mb-10">
            {result.actionableFixes?.map((fix, idx) => (
              <GlassCard key={idx} className="mb-3 p-4">
                <View className="flex-row items-start mb-2 opacity-60">
                  <IconCircleX size={16} color="#EF4444" className="mr-2 mt-0.5" />
                  <Text className="text-gray-500 line-through text-sm flex-1">
                    {fix.problem}
                  </Text>
                </View>
                <View className="flex-row items-start pl-6">
                  <Text className="text-[#10B981] font-bold text-lg mr-2 mt-[-3px]">↳</Text>
                  <Text className="text-[#111827] font-bold text-[15px] flex-1 leading-5">
                    {fix.solution}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
