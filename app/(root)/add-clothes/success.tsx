import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  IconCheck,
  IconMesh,
  IconHanger2,
  IconPlus,
} from "@tabler/icons-react-native";

type SuccessParams = {
  photoUri?: string;
  name?: string;
  category?: string;
};

export default function AddClothesSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as SuccessParams;

  const goHome = useCallback(() => {
    router.replace("/(root)/(tabs)" as never);
  }, [router]);

  const goWardrobe = useCallback(() => {
    router.replace("/(root)/(tabs)/wardrobe" as never);
  }, [router]);

  const addAnother = useCallback(() => {
    router.replace("/(root)/add-clothes" as never);
  }, [router]);

  const photoUri = params.photoUri;
  const itemName = params.name || "Item";
  const category = params.category || "Item";

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
            Added to wardrobe!
          </Text>
          <Text className="text-[#888] text-xs text-center mb-7">
            Your new item has been saved successfully.
          </Text>

          {/* Item card preview */}
          <View className="w-full bg-[#141414] border border-[#1e1e1e] rounded-2xl p-3 mb-5 flex-row items-center gap-3">
            <View
              className="rounded-xl overflow-hidden items-center justify-center"
              style={{ width: 64, height: 64, backgroundColor: "#1f1f1f" }}
            >
              {photoUri ? (
                <ExpoImage
                  source={{ uri: photoUri }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                  cachePolicy="memory"
                />
              ) : (
                <IconHanger2 size={28} color="#555" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-bold" numberOfLines={1}>
                {itemName}
              </Text>
              <Text className="text-[#888] text-[11px] mt-0.5 capitalize">
                {category}
              </Text>
              <View className="self-start mt-1.5 flex-row items-center gap-1 bg-[#1D9E75]/15 border border-[#1D9E75]/40 px-2 py-0.5 rounded-full">
                <IconMesh size={10} color="#1D9E75" />
                <Text className="text-[#1D9E75] text-[9px] font-bold">
                  In wardrobe
                </Text>
              </View>
            </View>
          </View>

          {/* Stats / hint */}
          <View className="w-full bg-[#c9a84c]/10 border border-[#c9a84c]/40 rounded-2xl p-3 mb-6">
            <Text className="text-white text-xs font-bold mb-0.5">
              Wardrobe growing
            </Text>
            <Text className="text-[#c9a84c] text-[11px]">
              Add a few more items so AI can suggest better outfits.
            </Text>
          </View>

          {/* Buttons */}
          <View className="w-full gap-2 mt-auto mb-2">
            <Pressable
              onPress={addAnother}
              className="bg-[#c9a84c] rounded-xl py-3.5 items-center flex-row justify-center gap-1.5"
            >
              <IconPlus size={16} color="#1a1400" strokeWidth={3} />
              <Text className="text-[#1a1400] font-bold text-sm">
                Add another item
              </Text>
            </Pressable>
            <Pressable
              onPress={goWardrobe}
              className="bg-[#1d1d1d] border border-[#2a2a2a] rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold text-xs">
                View wardrobe
              </Text>
            </Pressable>
            <Pressable onPress={goHome} className="py-2 items-center">
              <Text className="text-[#888] text-xs">Back to home</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
