import { IconArrowLeft } from "@tabler/icons-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OverallScoreInfoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center active:bg-gray-100"
        >
          <IconArrowLeft size={20} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-center text-[16px] font-bold text-[#111827] mr-10">
          Overall Visual Score
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-2">
          <Text className="text-[14px] text-[#111827] mr-2">Your visual score is</Text>
          <View className="bg-[#8B5CF6] px-2.5 py-0.5 rounded-full">
            <Text className="text-white text-[10px] font-bold">Excellent</Text>
          </View>
        </View>

        <Text className="text-[32px] font-bold text-[#111827] mb-6">8.5</Text>

        {/* Custom Progress Bar */}
        <View className="mb-6 relative">
          <LinearGradient
            colors={['#EF4444', '#F59E0B', '#10B981', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-2.5 rounded-full w-full"
          />
          {/* Marker at 85% */}
          <View
            className="absolute top-[-6px] bottom-[-6px] w-[2px] bg-[#111827]"
            style={{ left: '85%' }}
          />
        </View>

        {/* Legend */}
        <View className="flex-row justify-between mb-8 px-2">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#EF4444] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Fair</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#F59E0B] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Average</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#10B981] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Good</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#8B5CF6] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Excellent</Text>
          </View>
        </View>

        <Text className="text-[16px] font-bold text-[#111827] mb-3">Understanding the Visual Score</Text>
        <Text className="text-[13px] text-[#4B5563] leading-relaxed mb-6">
          The Overall Visual Score is an aggregate metric that evaluates the harmony of your outfit. It takes into account presentation, proportions, color coordination, and overall fit. While it aims to be objective, personal expression remains key.
        </Text>

        <Text className="text-[16px] font-bold text-[#111827] mb-3">What are the components?</Text>
        <Text className="text-[13px] text-[#4B5563] leading-relaxed mb-4">
          A high visual score relies on balancing several elements to create a unified look. The primary components analyzed are:
        </Text>
        <View className="pl-1 mb-8 gap-y-1.5">
          <Text className="text-[13px] text-[#4B5563]">• Presentation: Neatness and styling</Text>
          <Text className="text-[13px] text-[#4B5563]">• Proportional Balance: How the garments fit together</Text>
          <Text className="text-[13px] text-[#4B5563]">• Color Coordination: Harmony between colors</Text>
          <Text className="text-[13px] text-[#4B5563]">• Posture: How the clothing drapes naturally</Text>
          <Text className="text-[13px] text-[#4B5563]">• Outfit Fit: Appropriate sizing for your body type</Text>
        </View>

        <Pressable>
          <Text className="text-[13px] text-gray-500 underline mb-12">Learn more about visual scoring</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
