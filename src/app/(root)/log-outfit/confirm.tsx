import React, { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  IconCircleCheck,
  IconHanger2,
  IconPlus,
  IconShirt,
  IconShoe,
  IconUser,
} from "@tabler/icons-react-native";

interface DetectedItem {
  id: string;
  name: string;
  category: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  status: "in-wardrobe" | "new";
}

const ITEMS: DetectedItem[] = [
  {
    id: "blue-kurta",
    name: "Blue kurta",
    category: "Tops · Ethnic",
    Icon: IconShirt,
    status: "in-wardrobe",
  },
  {
    id: "beige-palazzo",
    name: "Beige palazzo",
    category: "Bottoms · Casual",
    Icon: IconHanger2,
    status: "in-wardrobe",
  },
  {
    id: "tan-sandals",
    name: "Tan sandals",
    category: "Footwear — not in wardrobe",
    Icon: IconShoe,
    status: "new",
  },
];

export default function ConfirmScreen() {
  const router = useRouter();

  const handleNext = useCallback(() => {
    router.push("/(root)/log-outfit/details" as never);
  }, [router]);

  return (
    <View className="flex-1 bg-[#0c0c0c]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Top bar */}
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-[#1e1e1e]">
          <IconCircleCheck size={20} color="#1D9E75" />
          <Text className="text-white text-sm font-bold">
            Confirm your outfit
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
        >
          {/* Thumb */}
          <View className="h-12 w-12 rounded-xl bg-[#141414] border border-[#1e1e1e] items-center justify-center mb-3">
            <IconUser size={22} color="#444" />
          </View>

          <Text className="text-[#888] text-[10px] font-semibold uppercase tracking-wider mb-2.5">
            AI detected 3 items
          </Text>

          {ITEMS.map((item) => {
            const Icon = item.Icon;
            const isNew = item.status === "new";
            return (
              <View
                key={item.id}
                className={`flex-row items-center gap-2.5 p-2.5 rounded-2xl border mb-2 ${
                  isNew
                    ? "bg-[#2a2010] border-[#d4a233]"
                    : "bg-[#141414] border-[#1e1e1e]"
                }`}
              >
                <View
                  className={`h-9 w-9 rounded-xl items-center justify-center ${
                    isNew ? "bg-[#d4a233]/20" : "bg-[#1f1f1f]"
                  }`}
                >
                  <Icon size={18} color={isNew ? "#d4a233" : "#aaa"} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs font-bold ${
                      isNew ? "text-[#d4a233]" : "text-white"
                    }`}
                  >
                    {item.name}
                  </Text>
                  <Text
                    className={`text-[10px] mt-0.5 ${
                      isNew ? "text-[#d4a233]/80" : "text-[#777]"
                    }`}
                  >
                    {item.category}
                  </Text>
                </View>
                <View
                  className={`px-2 py-1 rounded-full border ${
                    isNew
                      ? "bg-[#d4a233]/20 border-[#d4a233]/40"
                      : "bg-[#1D9E75]/20 border-[#1D9E75]/40"
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold ${
                      isNew ? "text-[#d4a233]" : "text-[#1D9E75]"
                    }`}
                  >
                    {isNew ? "Add?" : "In wardrobe"}
                  </Text>
                </View>
              </View>
            );
          })}

          <Pressable className="border border-dashed border-[#333] rounded-2xl p-3 items-center mt-2">
            <View className="flex-row items-center gap-1.5">
              <IconPlus size={14} color="#888" />
              <Text className="text-[#888] text-xs font-semibold">
                Add more items manually
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-4 pb-6 pt-2 bg-[#0c0c0c] border-t border-[#1e1e1e]">
          <Pressable
            onPress={handleNext}
            className="bg-[#c9a84c] rounded-xl py-3.5 items-center"
          >
            <Text className="text-[#1a1400] font-bold text-sm">Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
