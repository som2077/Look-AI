import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { IconCheck, IconTrendingUp } from "@tabler/icons-react-native";

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "9", label: "Blue kurta wears" },
  { value: "5", label: "This week" },
  { value: "12", label: "Day streak" },
];

export default function SuccessScreen() {
  const router = useRouter();

  const goHome = useCallback(() => {
    router.replace("/(root)/(tabs)" as never);
  }, [router]);

  const viewDiary = useCallback(() => {
    router.replace("/(root)/calendar" as never);
  }, [router]);

  return (
    <View className="flex-1 bg-[#0c0c0c]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-5 pt-10 items-center">
          {/* Success ring */}
          <View
            className="h-[88px] w-[88px] rounded-full bg-[#1D9E75] items-center justify-center mb-5"
            style={{
              shadowColor: "#1D9E75",
              shadowOpacity: 0.4,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <IconCheck size={44} color="#ffffff" strokeWidth={3} />
          </View>

          <Text className="text-white text-2xl font-extrabold mb-1.5">
            Outfit logged!
          </Text>
          <Text className="text-[#888] text-xs text-center mb-6">
            Today&apos;s look has been saved to your diary
          </Text>

          {/* Stats grid */}
          <View className="flex-row gap-2 w-full mb-4">
            {STATS.map((s) => (
              <View
                key={s.label}
                className="flex-1 bg-[#141414] border border-[#1e1e1e] rounded-2xl py-3 items-center"
              >
                <Text className="text-[#c9a84c] text-2xl font-extrabold">
                  {s.value}
                </Text>
                <Text className="text-[#888] text-[9px] mt-1 text-center px-1">
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Gold highlight */}
          <View className="w-full flex-row items-center gap-2.5 bg-[#c9a84c]/10 border border-[#c9a84c]/40 rounded-2xl p-3 mb-6">
            <View className="h-9 w-9 rounded-xl bg-[#c9a84c]/20 items-center justify-center">
              <IconTrendingUp size={18} color="#c9a84c" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xs font-bold">
                Blue kurta is your top item!
              </Text>
              <Text className="text-[#c9a84c] text-[10px] mt-0.5">
                Worn 9 times — most in your wardrobe
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="w-full gap-2 mt-auto mb-2">
            <Pressable
              onPress={goHome}
              className="bg-[#c9a84c] rounded-xl py-3.5 items-center"
            >
              <Text className="text-[#1a1400] font-bold text-sm">
                Go to home
              </Text>
            </Pressable>
            <Pressable
              onPress={viewDiary}
              className="border border-[#333] rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold text-xs">
                View outfit diary
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
