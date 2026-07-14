import {
  IconCheck,
  IconHanger2,
  IconMesh,
  IconPlus,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { usePostHog } from "posthog-react-native";
import React, { useCallback, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SuccessParams = {
  photoUri?: string;
  name?: string;
  category?: string;
};

export default function AddClothesSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as SuccessParams;
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("cloth_added", { category: params.category || "Item" });
  }, []);

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
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-5 pt-10 items-center bg-white">
          {/* Success ring */}
          <View className="h-[88px] w-[88px] rounded-full bg-[#10B981] items-center justify-center mb-6 shadow-lg shadow-[#10B981]/20">
            <IconCheck size={44} color="#ffffff" strokeWidth={3} />
          </View>

          <Text className="text-[#1D1A27] text-2xl font-extrabold mb-1.5">
            Added to wardrobe!
          </Text>
          <Text className="text-[#6B7280] text-xs text-center mb-7 font-regular">
            Your new item has been saved successfully.
          </Text>

          {/* Item card preview */}
          <View className="w-full bg-[#FAFAFA] border border-gray-100 rounded-2xl p-4 mb-5 flex-row items-center gap-3 shadow-sm">
            <View
              className="rounded-xl overflow-hidden items-center justify-center bg-gray-100 border border-gray-200"
              style={{ width: 64, height: 64 }}
            >
              {photoUri ? (
                <ExpoImage
                  source={{ uri: photoUri }}
                  style={{ width: 64, height: 64 }}
                  contentFit="cover"
                  cachePolicy="memory"
                />
              ) : (
                <IconHanger2 size={28} color="#9CA3AF" />
              )}
            </View>
            <View className="flex-1">
              <Text
                className="text-[#1D1A27] text-sm font-bold"
                numberOfLines={1}
              >
                {itemName}
              </Text>
              <Text className="text-[#6B7280] text-[11px] mt-0.5 capitalize font-medium">
                {category}
              </Text>
              <View className="self-start mt-1.5 flex-row items-center gap-1 bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
                <IconMesh size={10} color="#10B981" />
                <Text className="text-[#10B981] text-[9px] font-bold">
                  In wardrobe
                </Text>
              </View>
            </View>
          </View>

          {/* Stats / hint */}
          <View className="w-full bg-[#ECEDF9] border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-[#1D1A27] text-xs font-bold mb-0.5">
              Wardrobe growing
            </Text>
            <Text className="text-[#4F46E5] text-[11px] font-medium">
              Add a few more items so AI can suggest better outfits.
            </Text>
          </View>

          {/* Buttons */}
          <View className="w-full gap-3 mt-auto mb-2">
            <Pressable
              onPress={addAnother}
              className="bg-[#1D1A27] rounded-2xl py-5 items-center flex-row justify-center gap-1.5 shadow-sm"
            >
              <IconPlus size={16} color="#FFFFFF" strokeWidth={3} />
              <Text className="text-white font-semibold text-sm">
                Add another item
              </Text>
            </Pressable>
            <Pressable
              onPress={goWardrobe}
              className="bg-[#FAFAFA] border border-gray-200 rounded-2xl py-4 items-center"
            >
              <Text className="text-[#1D1A27] font-semibold text-sm">
                View wardrobe
              </Text>
            </Pressable>
            <Pressable onPress={goHome} className="py-2 items-center">
              <Text className="text-[#6B7280] text-xs font-semibold">
                Back to home
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
