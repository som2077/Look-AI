import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { FitCheckAnalysis } from "@/features/scanning/api/ai-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import {
  IconArrowLeft,
  IconCircleX,
  IconDotsVertical,
  IconInfoCircle,
  IconSparkles,
  IconX,
  IconShirt,
} from "@tabler/icons-react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, G, Line, LinearGradient, Rect, Stop } from "react-native-svg";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

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
  strokeWidthRatio = 0.1,
}: {
  size: number;
  progress: number;
  innerTop: string;
  innerBottom?: string;
  bottomText?: string;
  color: string;
  strokeWidthRatio?: number;
}) => {
  const strokeWidth = size * strokeWidthRatio;
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

const GradientScoreBar = ({ score, max = 10 }: { score: number, max?: number }) => {
  const percent = (score / max) * 100;
  return (
    <View className="w-full mt-6 mb-2">
      <View className="w-full h-3">
        <Svg width="100%" height="100%" style={{ overflow: "visible" }}>
          <Defs>
            <LinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#0EA5E9" />
              <Stop offset="30%" stopColor="#10B981" />
              <Stop offset="65%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#EF4444" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="6" y="3" rx="3" fill="url(#scoreGrad)" />
          <Line x1={`${percent}%`} y1="-4" x2={`${percent}%`} y2="16" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      </View>

      <View className="flex-row justify-between items-center mt-6 px-1">
        <View className="flex-row items-center"><View className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mr-2" /><Text className="text-[11px] text-gray-500 font-medium">Needs Work</Text></View>
        <View className="flex-row items-center"><View className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] mr-2" /><Text className="text-[11px] text-gray-500 font-medium">Decent</Text></View>
        <View className="flex-row items-center"><View className="w-2.5 h-2.5 rounded-full bg-[#EF4444] mr-2" /><Text className="text-[11px] text-gray-500 font-medium">Fire</Text></View>
        <View className="flex-row items-center"><View className="w-2.5 h-2.5 rounded-full bg-[#10B981] mr-2" /><Text className="text-[11px] text-gray-500 font-medium">Perfect</Text></View>
      </View>
    </View>
  );
};

const ScoreBar = ({ label, score, max, color }: { label: string; score: number; max: number; color: string }) => {
  const percentage = (score / max) * 100;
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[11px] font-bold text-[#111827] w-[72px]">{label}</Text>
      <View className="flex-1 h-2 bg-gray-100 rounded-full mx-2 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
      <Text className="text-[10px] text-gray-500 font-semibold w-7 text-right">{score}/{max}</Text>
    </View>
  );
};

const SmallScoreCard = ({ score, label }: { score: number; label: string }) => {
  const radius = 22;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 10) * circumference;

  return (
    <View className="flex-1 bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm" style={{ elevation: 2 }}>
      <Text className="text-3xl font-extrabold tracking-tight text-[#111827]">{score.toFixed(1)}</Text>
      <Text className="text-[12px] font-bold text-[#111827] mt-1 mb-4 h-8 leading-tight">{label}</Text>
      <View className="items-center justify-center self-center mt-auto">
        <Svg width={54} height={54} viewBox="0 0 54 54">
          <Circle cx={27} cy={27} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={27} cy={27} r={radius}
            stroke="#111827"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform="rotate(-90 27 27)"
          />
        </Svg>
        <View className="absolute">
          <IconShirt size={18} color="#111827" strokeWidth={2} />
        </View>
      </View>
    </View>
  );
};

export default function FitCheckResultScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
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
          overScrollMode="never"
          bounces={false}
        >
          {/* Spacer to show the full image */}
          <View className="h-[400px]" />

          {/* Bottom Sheet Container */}
          <ExpoLinearGradient
            colors={['#FFF0F5', '#F4F0FF', '#FFFFFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.4 }}
            style={{
              minHeight: SCREEN_HEIGHT * 0.9,
              elevation: 15,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            }}
            className="flex-1 px-5 pt-5 pb-32 mt-auto border-t border-gray-200 shadow-sm"
          >
            {/* Grab handle indicator */}
            <View className="w-16 h-1.5 bg-gray-300 rounded-full self-center mb-6" />

            {/* Card 1: Your Style */}
            <OutlineCard className="p-6">
              <Text className="text-[15px] font-bold text-[#111827] mb-4">Your Style</Text>

              <View className="flex-row items-end justify-between mt-1 mb-2">
                <Text className="text-[44px] font-light tracking-tighter text-[#111827] leading-none">
                  {((result.fitScore || 93) / 10).toFixed(2)}
                </Text>

                <View className="flex-row items-center pb-2">
                  <Text className="text-[12px] text-gray-800 mr-3">Your look is</Text>
                  <View className="bg-[#0EA5E9] px-3.5 py-1.5 rounded-full">
                    <Text className="text-white text-[11px] font-bold">Perfect</Text>
                  </View>
                  <Pressable className="ml-4 p-1" onPress={() => router.push("/(root)/add-clothes/your-style-info")}>
                    <IconInfoCircle size={18} color="#4B5563" strokeWidth={1.5} />
                  </Pressable>
                </View>
              </View>

              <GradientScoreBar score={((result.fitScore || 93) / 10)} />
            </OutlineCard>

            {/* Horizontal Scrollable Score Section */}
            <View className="-mx-5 mt-4">
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH}
                decelerationRate="fast"
                onScroll={(e) => {
                  const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  if (activeSlide !== slide) setActiveSlide(slide);
                }}
                scrollEventThrottle={16}
              >
                {/* Page 1: Card 2 - Overall Visual Score */}
                <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}>
                  <OutlineCard className="p-6 pt-5">
                    <View className="flex-row justify-between items-center mb-6">
                      <Text className="text-[13px] font-bold text-[#111827]">Overall Visual Score</Text>
                      <Pressable className="p-1 -mr-1" onPress={() => router.push("/(root)/add-clothes/overall-score-info")}>
                        <IconInfoCircle size={18} color="#4B5563" strokeWidth={1.5} />
                      </Pressable>
                    </View>

                    <View className="flex-row items-center">
                      {/* Circular Score */}
                      <View className="relative items-center justify-center mr-6">
                        <Svg width={110} height={110} viewBox="0 0 120 120">
                          <Defs>
                            <LinearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                              <Stop offset="0" stopColor="#0EA5E9" />
                              <Stop offset="1" stopColor="#8B5CF6" />
                            </LinearGradient>
                          </Defs>
                          <Circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="#F3F4F6"
                            strokeWidth="10"
                            fill="none"
                          />
                          <Circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke="url(#scoreGrad)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 50}
                            strokeDashoffset={2 * Math.PI * 50 * (1 - 8.5 / 10)}
                            fill="none"
                            transform="rotate(-90 60 60)"
                          />
                        </Svg>
                        <View className="absolute items-center justify-center">
                          <Text className="text-3xl font-black text-[#111827]">8.5</Text>
                        </View>
                      </View>

                      {/* Score Breakdown Bars */}
                      <View className="flex-1 gap-y-3">
                        <ScoreBar label="Presentation" score={8.2} max={10} color="#0EA5E9" />
                        <ScoreBar label="Proportional" score={9.0} max={10} color="#8B5CF6" />
                        <ScoreBar label="Coordination" score={8.5} max={10} color="#10B981" />
                        <ScoreBar label="Posture" score={7.8} max={10} color="#F59E0B" />
                        <ScoreBar label="Outfit Fit" score={8.9} max={10} color="#EF4444" />
                      </View>
                    </View>
                  </OutlineCard>
                </View>

                {/* Page 2: 3 Small Cards + Outfit Score Banner */}
                <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}>
                  <View className="flex-row justify-between gap-x-2">
                    <SmallScoreCard score={9.2} label="Casual Street" />
                    <SmallScoreCard score={9.2} label="Office / Smart" />
                    <SmallScoreCard score={9.2} label="Formal / Event" />
                  </View>

                  {/* Outfit Score Banner */}
                  <View className="bg-white rounded-[24px] p-4 mt-4 border border-gray-100 shadow-sm" style={{ elevation: 2 }}>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-[#111827] text-[13px]">Outfit Score</Text>
                      <Text className="font-bold text-[#111827] text-[13px]">8/10</Text>
                    </View>
                    <View className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                      <ExpoLinearGradient
                        colors={['#6B7280', '#111827']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: '80%' }}
                        className="h-full rounded-full"
                      />
                    </View>
                    <Text className="text-[11px] text-gray-500 leading-relaxed">
                      Weather-friendly style starts here. Find outfits curated for today's forecast. Tap to see outfit suggestions.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
            {/* Pagination dots */}
            <View className="flex-row justify-center items-center mt-3 mb-4">
              <View className={`h-1.5 rounded-full mx-1 transition-all duration-300 ${activeSlide === 0 ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} />
              <View className={`h-1.5 rounded-full mx-1 transition-all duration-300 ${activeSlide === 1 ? 'bg-black w-4' : 'bg-gray-300 w-1.5'}`} />
            </View>
          </ExpoLinearGradient>
        </ScrollView>

        {/* Fixed Bottom Footer */}
        <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-8 border-t border-gray-100 flex-row gap-4 z-20">
          <Pressable
            className="flex-1 h-14 rounded-full border border-gray-300 items-center justify-center flex-row active:bg-gray-50"
            onPress={() => {
              router.back();
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
