import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconArrowLeft } from "@tabler/icons-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

export default function YourStyleInfoScreen() {
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
          Your Style
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-2">
          <Text className="text-[14px] text-[#111827] mr-2">Your style is</Text>
          <View className="bg-[#10B981] px-2.5 py-0.5 rounded-full">
            <Text className="text-white text-[10px] font-bold">Perfect</Text>
          </View>
        </View>

        <Text className="text-[32px] font-bold text-[#111827] mb-6">9.3</Text>

        {/* Custom Progress Bar */}
        <View className="mb-6 relative">
          <LinearGradient
            colors={['#EF4444', '#F59E0B', '#10B981', '#0EA5E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-2.5 rounded-full w-full"
          />
          {/* Marker at 93% */}
          <View
            className="absolute top-[-6px] bottom-[-6px] w-[2px] bg-[#111827]"
            style={{ left: '93%' }}
          />
        </View>

        {/* Legend */}
        <View className="flex-row justify-between mb-8 px-2">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#EF4444] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Needs Work</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#F59E0B] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Good</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#10B981] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Great</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-[#0EA5E9] mr-1.5" />
            <Text className="text-[11px] text-[#4B5563]">Perfect</Text>
          </View>
        </View>

        <Text className="text-[16px] font-bold text-[#111827] mb-3">Disclaimer</Text>
        <Text className="text-[13px] text-[#4B5563] leading-relaxed mb-6">
          As with most measures of fashion, the style score is subjective and not a perfect test. For example, results can be thrown off by lighting conditions, unconventional avant-garde choices, or cultural differences in fashion norms.
        </Text>

        <Text className="text-[16px] font-bold text-[#111827] mb-3">So then, why does Your Style matter?</Text>
        <Text className="text-[13px] text-[#4B5563] leading-relaxed mb-4">
          In general, a higher style score indicates a more cohesive and visually pleasing outfit. Good styling is linked to several benefits, including:
        </Text>
        <View className="pl-1 mb-8 gap-y-1.5">
          <Text className="text-[13px] text-[#4B5563]">• increased personal confidence</Text>
          <Text className="text-[13px] text-[#4B5563]">• better first impressions</Text>
          <Text className="text-[13px] text-[#4B5563]">• enhanced professional appearance</Text>
          <Text className="text-[13px] text-[#4B5563]">• expressing individuality</Text>
          <Text className="text-[13px] text-[#4B5563]">• feeling comfortable in your own skin</Text>
        </View>

        <Pressable>
          <Text className="text-[13px] text-gray-500 underline mb-12">Learn more about our scoring</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
