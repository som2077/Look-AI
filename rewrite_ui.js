const fs = require('fs');

const code = `import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { FitCheckAnalysis } from "@/features/scanning/api/ai-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import {
  IconArrowLeft,
  IconCircleX,
  IconDots,
  IconCircleCheckFilled,
  IconPointFilled,
  IconInfoCircle,
  IconBookmark
} from "@tabler/icons-react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
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
import Svg, { Defs, LinearGradient, Stop, Rect, Line } from "react-native-svg";

type FitCheckParams = {
  scanId?: string;
  outfitIndex?: string;
};

// Gradient Score Bar for Top Section
const GradientScoreBar = ({ score, max = 10 }: { score: number, max?: number }) => {
  const percent = (score / max) * 100;
  return (
    <View className="w-full mt-6 mb-2">
      <View className="w-full h-2">
        <Svg width="100%" height="100%" style={{ overflow: "visible" }}>
          <Defs>
            <LinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#0EA5E9" />
              <Stop offset="30%" stopColor="#10B981" />
              <Stop offset="65%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#EF4444" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="6" y="1" rx="3" fill="url(#scoreGrad)" />
          <Line x1={\`\${percent}%\`} y1="-6" x2={\`\${percent}%\`} y2="14" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
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

const MetricBar = ({ label, score }: { label: string; score: number }) => {
  let colors = ["#0EA5E9", "#8B5CF6"]; 
  if (score >= 8.5) colors = ["#10B981", "#34D399"]; 
  else if (score >= 7.0) colors = ["#F59E0B", "#FCD34D"]; 
  else colors = ["#EF4444", "#F87171"]; 

  const percentage = (score / 10) * 100;

  return (
    <View className="flex-row items-center w-full mb-4 h-[52px] bg-gray-100 rounded-full relative overflow-hidden shadow-sm">
      <View
        className="absolute top-0 left-0 bottom-0 rounded-full flex-row items-center justify-between"
        style={{ width: \`\${percentage}%\` }}
      >
        <ExpoLinearGradient
          colors={colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ ...StyleSheet.absoluteFillObject, borderRadius: 999 }}
        />
      </View>

      <View className="flex-row justify-between items-center px-5 w-full h-full">
        <View className="flex-row items-center">
          <View className="w-5 h-5 rounded-full bg-white/20 items-center justify-center mr-3">
             <IconPointFilled size={12} color={percentage > 45 ? "white" : "gray"} />
          </View>
          <Text
            className={\`font-bold text-[16px] \${percentage > 45 ? "text-white" : "text-gray-900"}\`}
          >
            {label}
          </Text>
        </View>
        <Text
          className={\`font-black text-[16px] \${percentage > 85 ? "text-white" : "text-gray-900"}\`}
        >
          {score.toFixed(1)}
        </Text>
      </View>
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

  if (!result || result.error) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-5">
        <StatusBar style="light" />
        <IconCircleX size={64} color="#EF4444" className="mb-4" />
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Analysis Failed
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          {result?.improvements?.[0] ||
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

  const overallScore =
    (result.colorHarmony +
      result.silhouette +
      result.cohesion +
      result.occasion +
      result.fit) /
    5;

  let overallLabel = "Needs Work";
  let badgeColor = "bg-[#F59E0B]";
  if (overallScore >= 8.5) { overallLabel = "Perfect"; badgeColor = "bg-[#10B981]"; }
  else if (overallScore >= 7.5) { overallLabel = "Fire"; badgeColor = "bg-[#EF4444]"; }
  else if (overallScore >= 6.0) { overallLabel = "Decent"; badgeColor = "bg-[#0EA5E9]"; }

  const photoUri = scan?.thumbnail;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Background Image */}
      {photoUri && (
        <Image 
          source={{ uri: photoUri }} 
          style={StyleSheet.absoluteFillObject} 
          resizeMode="cover" 
        />
      )}
      
      {/* Top Gradient for Header Visibility */}
      <ExpoLinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 5 }}
      />

      {/* Top Floating Header */}
      <SafeAreaView edges={["top"]} className="z-10 absolute w-full">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
          >
            <IconArrowLeft size={20} color="#111827" />
          </Pressable>
          <Text className="text-white font-bold text-[17px]">Fit Check</Text>
          <Pressable
            onPress={() => setShowMenu(true)}
            className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
          >
            <IconDots size={20} color="#111827" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Dropdown Menu Modal */}
      {showMenu && (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => setShowMenu(false)}>
            <SafeAreaView className="flex-1" edges={["top"]}>
              <View
                style={{
                  position: "absolute",
                  top: 60,
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
            </SafeAreaView>
          </Pressable>
        </Modal>
      )}

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 z-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Transparent spacer to push content down so the image is visible */}
        <View style={{ height: 350 }} />

        {/* Bottom Sheet Container */}
        <View className="bg-[#F8F9FA] rounded-t-[32px] pt-6 pb-[100px] min-h-screen">
          <View className="px-5">
            {/* Header Title & Icons */}
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-[28px] font-bold text-[#111827]">Perfect look</Text>
                <Text className="text-[14px] font-medium text-gray-700 mt-1">Breakdown your style</Text>
              </View>
              <Pressable onPress={() => setShowMenu(true)} className="mt-1 p-1">
                <IconBookmark size={24} color="#111827" />
              </Pressable>
            </View>

            {/* Card 1: Overall Score */}
            <View className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-4" style={{ elevation: 2 }}>
               <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[44px] font-light tracking-tighter text-[#111827] leading-none">
                    {overallScore.toFixed(2)}
                  </Text>
                  
                  <View className="flex-row items-center flex-1 justify-end pb-1">
                    <Text className="text-[12px] text-gray-700 mr-3">Your look is</Text>
                    <View className={\`\${badgeColor} px-3.5 py-1 rounded-full\`}>
                      <Text className="text-white text-[12px] font-bold">{overallLabel}</Text>
                    </View>
                    <Pressable className="ml-3 p-1">
                      <IconInfoCircle size={18} color="#4B5563" strokeWidth={1.5} />
                    </Pressable>
                  </View>
               </View>
               
               <GradientScoreBar score={overallScore} />
            </View>

            {/* Card 2: Metrics and Feedback */}
            <View className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-6" style={{ elevation: 2 }}>
              <View className="mb-2">
                <MetricBar label="Color Harmony" score={result.colorHarmony} />
                <MetricBar label="Silhouette" score={result.silhouette} />
                <MetricBar label="Cohesion" score={result.cohesion} />
                <MetricBar label="Occasion" score={result.occasion} />
                <MetricBar label="Fit" score={result.fit} />
              </View>

              {/* Separator */}
              <View className="h-px bg-gray-100 my-4" />

              {/* Feedback Section */}
              <Text className="text-[18px] font-bold text-[#111827] mb-5">
                How to make it even better
              </Text>

              <View className="pr-2">
                {/* Strengths */}
                {result.strengths?.map((strength, idx) => (
                  <View key={\`str-\${idx}\`} className="flex-row items-start mb-3.5">
                    <View className="mt-0.5 mr-3 bg-green-50 rounded-full p-0.5">
                      <IconCircleCheckFilled size={18} color="#10B981" />
                    </View>
                    <Text className="text-[15px] text-gray-800 flex-1 leading-relaxed">
                      {strength}
                    </Text>
                  </View>
                ))}

                {/* Improvements */}
                {result.improvements?.map((improvement, idx) => (
                  <View key={\`imp-\${idx}\`} className="flex-row items-start mt-3.5">
                    <View className="mt-1.5 mr-4 ml-1">
                      <View className="w-2.5 h-2.5 bg-[#EF4444] rounded-full" />
                    </View>
                    <Text className="text-[15px] text-gray-800 flex-1 leading-relaxed">
                      {improvement}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
`;

fs.writeFileSync('src/app/(root)/add-clothes/fitcheck-result.tsx', code);
