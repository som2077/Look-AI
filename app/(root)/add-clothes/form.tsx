import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  IconArrowLeft,
  IconMesh,
  IconPhoto,
  IconSparkles,
} from "@tabler/icons-react-native";
import { useUserWardrobeStore } from "@/backend/store/user-wardrobe-store";

type CategoryId =
  | "top"
  | "dress"
  | "bottoms"
  | "ethnic"
  | "outerwear"
  | "footwear"
  | "accessory";

interface CategoryOpt {
  id: CategoryId;
  label: string;
}

const CATEGORIES: CategoryOpt[] = [
  { id: "top", label: "Top" },
  { id: "dress", label: "Dress" },
  { id: "bottoms", label: "Bottoms" },
  { id: "ethnic", label: "Ethnic" },
  { id: "outerwear", label: "Outerwear" },
  { id: "footwear", label: "Footwear" },
  { id: "accessory", label: "Accessory" },
];

type Occasion = "Casual" | "Office" | "Party" | "Wedding" | "Date";
const OCCASIONS: Occasion[] = ["Casual", "Office", "Party", "Wedding", "Date"];

type Season = "All" | "Summer" | "Winter" | "Monsoon";
const SEASONS: Season[] = ["All", "Summer", "Winter", "Monsoon"];

type FormParams = {
  mode?: string;
  photoUri?: string;
  name?: string;
  category?: string;
  color?: string;
};

export default function AddClothesFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as FormParams;

  const isScanned = params.mode === "scanned";
  const isManual = params.mode === "manual";

  const [name, setName] = useState<string>(params.name ?? "");
  const [category, setCategory] = useState<CategoryId>(
    (params.category as CategoryId) ?? "top",
  );
  const [color, setColor] = useState<string>(params.color ?? "");
  const [localPhotoUri, setLocalPhotoUri] = useState<string>(
    params.photoUri ?? "",
  );
  const [occasion, setOccasion] = useState<Occasion>("Casual");
  const [season, setSeason] = useState<Season>("All");
  const [notes, setNotes] = useState<string>("");

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const addItem = useUserWardrobeStore((state) => state.addItem);

  const handleConfirm = useCallback(() => {
    addItem({
      name: name || "Untitled item",
      category,
      color: color || undefined,
      photoUri: localPhotoUri,
      occasion: occasion || undefined,
    });

    router.replace({
      pathname: "/(root)/add-clothes/success",
      params: {
        photoUri: localPhotoUri,
        name: name || "Untitled item",
        category,
      },
    } as never);
  }, [router, name, category, color, occasion, localPhotoUri, addItem]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <Pressable
            onPress={handleBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#ECEDF9]"
          >
            <IconArrowLeft size={18} color="#1D1A27" strokeWidth={2.5} />
          </Pressable>
          <Text className="text-[#1D1A27] text-base font-semibold">
            {isScanned ? "Confirm details" : "Add manually"}
          </Text>
          <Pressable onPress={handleConfirm}>
            <Text className="text-[#1D1A27] font-semibold text-sm">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo / placeholder */}
          <Pressable
            onPress={isManual ? handlePickPhoto : undefined}
            disabled={!isManual}
            className="rounded-3xl border border-dashed border-gray-200 overflow-hidden items-center justify-center mb-6 relative bg-[#FAFAFA]"
            style={{ height: 220 }}
          >
            {localPhotoUri ? (
              <ExpoImage
                source={{ uri: localPhotoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory"
              />
            ) : (
              <View className="items-center">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-[#ECEDF9] mb-3">
                  <IconPhoto size={24} color="#1D1A27" strokeWidth={2} />
                </View>
                {isManual ? (
                  <Text className="text-[#6B7280] text-xs font-medium">
                    Tap to add photo (optional)
                  </Text>
                ) : (
                  <Text className="text-[#6B7280] text-xs font-medium">No photo</Text>
                )}
              </View>
            )}

            {isScanned && (
              <View className="absolute top-3 right-3 flex-row items-center gap-1 bg-[#DCE754] px-3 py-1.5 rounded-full shadow-sm">
                <IconSparkles size={11} color="#1E1A27" strokeWidth={2.5} />
                <Text className="text-[#1E1A27] text-[10px] font-semibold">
                  AI Prefilled
                </Text>
              </View>
            )}

            {isManual && !localPhotoUri && (
              <View className="absolute bottom-3 flex-row items-center gap-1 bg-[#1D1A27]/90 rounded-full px-4 py-2 shadow-sm">
                <IconPhoto size={12} color="#FFFFFF" />
                <Text className="text-white text-[11px] font-medium">
                  Tap to pick from gallery
                </Text>
              </View>
            )}

            {isManual && localPhotoUri && (
              <Pressable
                onPress={handlePickPhoto}
                className="absolute top-3 right-3 bg-white/95 border border-gray-100 rounded-full px-3 py-1.5 flex-row items-center gap-1 shadow-sm"
              >
                <IconPhoto size={11} color="#1D1A27" />
                <Text className="text-[#1D1A27] text-[10px] font-semibold">
                  Change
                </Text>
              </Pressable>
            )}
          </Pressable>

          {isScanned && (
            <Text className="text-[#6B7280] text-xs font-regular mb-6 leading-5">
              We&apos;ve prefilled what AI detected. Edit anything before saving to your wardrobe.
            </Text>
          )}

          {/* Item name */}
          <Text className="text-[#6B7280] text-[11px] uppercase tracking-wider font-semibold mb-2">
            Item name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Blue kurta"
            placeholderTextColor="#9CA3AF"
            className="bg-[#FAFAFA] border border-gray-100 rounded-2xl px-4 py-4 text-[#1D1A27] text-sm font-medium mb-5"
          />

          {/* Category */}
          <Text className="text-[#6B7280] text-[11px] uppercase tracking-wider font-semibold mb-2">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {CATEGORIES.map((c) => {
              const sel = c.id === category;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  className={`px-4 py-2.5 rounded-full border ${
                    sel
                      ? "bg-[#1D1A27] border-transparent"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      sel ? "text-white" : "text-[#4B5563]"
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Color */}
          <Text className="text-[#6B7280] text-[11px] uppercase tracking-wider font-semibold mb-2">
            Color
          </Text>
          <TextInput
            value={color}
            onChangeText={setColor}
            placeholder="e.g. Beige, Navy blue"
            placeholderTextColor="#9CA3AF"
            className="bg-[#FAFAFA] border border-gray-100 rounded-2xl px-4 py-4 text-[#1D1A27] text-sm font-medium mb-5"
          />

          {/* Occasion */}
          <Text className="text-[#6B7280] text-[11px] uppercase tracking-wider font-semibold mb-2">
            Best for
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5"
          >
            <View className="flex-row gap-2 pr-4">
              {OCCASIONS.map((o) => {
                const sel = o === occasion;
                return (
                  <Pressable
                    key={o}
                    onPress={() => setOccasion(o)}
                    className={`px-4 py-2.5 rounded-full border ${
                      sel
                        ? "bg-[#1D1A27] border-transparent"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        sel ? "text-white" : "text-[#4B5563]"
                      }`}
                    >
                      {o}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Season */}
          <Text className="text-[#6B7280] text-[11px] uppercase tracking-wider font-semibold mb-2">
            Season
          </Text>
          <View className="flex-row gap-2 mb-5">
            {SEASONS.map((s) => {
              const sel = s === season;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSeason(s)}
                  className={`px-4 py-2.5 rounded-full border ${
                    sel
                      ? "bg-[#1D1A27] border-transparent"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      sel ? "text-white" : "text-[#4B5563]"
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Notes */}
          <Text className="text-[#6B7280] text-[11px] uppercase tracking-wider font-semibold mb-2">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Gifted by mom, hand wash only"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            className="bg-[#FAFAFA] border border-gray-100 rounded-2xl px-4 py-4 text-[#1D1A27] text-sm font-medium mb-2"
            style={{ textAlignVertical: "top", minHeight: 80 }}
          />
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-5 pb-8 pt-4 bg-white border-t border-gray-100">
          <Pressable
            onPress={handleConfirm}
            className="bg-[#1D1A27] rounded-2xl py-5 items-center justify-center shadow-sm"
          >
            <Text className="text-white font-semibold text-base">
              {isScanned ? "Confirm & add to wardrobe" : "Add to wardrobe"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
