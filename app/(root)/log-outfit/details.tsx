import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  IconArrowLeft,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react-native";
import { useUserWardrobeStore } from "@/backend/store/user-wardrobe-store";

type Occasion = "Casual" | "Office" | "Party" | "Wedding" | "Date";

const OCCASIONS: Occasion[] = ["Casual", "Office", "Party", "Wedding", "Date"];

export default function DetailsScreen() {
  const router = useRouter();
  const [occasion, setOccasion] = useState<Occasion>("Casual");
  const [rating, setRating] = useState<number>(4);
  const [note, setNote] = useState<string>("");
  const [addToWardrobe, setAddToWardrobe] = useState<boolean>(true);

  const addOutfitLog = useUserWardrobeStore((state) => state.addOutfitLog);

  const handleSave = useCallback(() => {
    addOutfitLog({ occasion, rating, note, addToWardrobe });
    router.replace("/(root)/log-outfit/success" as never);
  }, [router, occasion, rating, note, addToWardrobe, addOutfitLog]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  return (
    <View className="flex-1 bg-[#0c0c0c]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
          <Pressable
            onPress={handleBack}
            className="h-9 w-9 items-center justify-center rounded-xl bg-[#141414] border border-[#1e1e1e]"
          >
            <IconArrowLeft size={16} color="#ffffff" />
          </Pressable>
          <Text className="text-white text-sm font-bold">Outfit details</Text>
          <Pressable onPress={handleSave}>
            <Text className="text-[#c9a84c] font-bold text-xs">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        >
          {/* Occasion */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Occasion
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-1.5 pr-4">
              {OCCASIONS.map((o) => {
                const sel = o === occasion;
                return (
                  <Pressable
                    key={o}
                    onPress={() => setOccasion(o)}
                    className={`px-3.5 py-1.5 rounded-full border ${
                      sel
                        ? "bg-[#1d1d1d] border-[#444]"
                        : "bg-transparent border-[#1e1e1e]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        sel ? "text-white" : "text-[#aaa]"
                      }`}
                    >
                      {o}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Feeling */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            How do you feel in this outfit?
          </Text>
          <View className="flex-row gap-1.5 mb-5">
            {[1, 2, 3, 4, 5].map((n) =>
              n <= rating ? (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <IconStarFilled size={26} color="#c9a84c" />
                </Pressable>
              ) : (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <IconStar size={26} color="#333" />
                </Pressable>
              ),
            )}
          </View>

          {/* Note */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Add a note (optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Office lunch meeting..."
            placeholderTextColor="#555"
            className="bg-[#141414] border border-[#1e1e1e] rounded-xl px-3 py-2.5 text-white text-xs mb-5"
          />

          {/* Add to wardrobe toggle */}
          <View className="bg-[#141414] border border-[#1e1e1e] rounded-2xl p-3 flex-row items-center gap-2.5 mb-2">
            <View className="flex-1">
              <Text className="text-white text-xs font-bold">
                Add tan sandals to wardrobe
              </Text>
              <Text className="text-[#777] text-[10px] mt-0.5">
                New item detected — save it
              </Text>
            </View>
            <Pressable
              onPress={() => setAddToWardrobe((v) => !v)}
              className={`w-10 h-6 rounded-full justify-center px-0.5 ${
                addToWardrobe ? "bg-[#c9a84c]" : "bg-[#333]"
              }`}
            >
              <View
                className={`h-5 w-5 rounded-full bg-white ${
                  addToWardrobe ? "self-end" : "self-start"
                }`}
              />
            </Pressable>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-4 pb-6 pt-2 bg-[#0c0c0c] border-t border-[#1e1e1e]">
          <Pressable
            onPress={handleSave}
            className="bg-[#1d1d1d] border border-[#2a2a2a] rounded-xl py-3.5 items-center"
          >
            <Text className="text-white font-bold text-sm">Log this outfit</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
