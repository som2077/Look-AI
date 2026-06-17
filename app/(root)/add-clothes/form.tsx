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
  const [occasion, setOccasion] = useState<Occasion>("Casual");
  const [season, setSeason] = useState<Season>("All");
  const [notes, setNotes] = useState<string>("");

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
    <View className="flex-1 bg-[#0c0c0c]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
          <Pressable
            onPress={handleBack}
            className="h-9 w-9 items-center justify-center rounded-xl bg-[#141414] border border-[#1e1e1e]"
          >
            <IconArrowLeft size={16} color="#ffffff" />
          </Pressable>
          <Text className="text-white text-sm font-bold">
            {isScanned ? "Confirm details" : "Add manually"}
          </Text>
          <Pressable onPress={handleConfirm}>
            <Text className="text-[#c9a84c] font-bold text-xs">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo / placeholder */}
          <Pressable
            onPress={isManual ? handlePickPhoto : undefined}
            disabled={!isManual}
            className="rounded-2xl border border-[#1e1e1e] overflow-hidden items-center justify-center mb-4"
            style={{ height: 200, backgroundColor: "#141414" }}
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
                <IconMesh size={48} color="#333" strokeWidth={1.5} />
                {isManual ? (
                  <Text className="text-[#555] text-[11px] mt-2">
                    Tap to add photo (optional)
                  </Text>
                ) : (
                  <Text className="text-[#555] text-[11px] mt-2">No photo</Text>
                )}
              </View>
            )}
            {isScanned ? (
              <View className="absolute top-2 right-2 flex-row items-center gap-1 bg-[#c9a84c] px-2 py-1 rounded-full">
                <IconSparkles size={10} color="#1a1400" />
                <Text className="text-[#1a1400] text-[9px] font-bold">
                  AI prefilled
                </Text>
              </View>
            ) : null}
            {isManual && !localPhotoUri ? (
              <View className="absolute bottom-3 flex-row items-center gap-1 bg-[#1e1e1e]/90 rounded-full px-3 py-1.5">
                <IconPhoto size={12} color="#888" />
                <Text className="text-[#888] text-[10px]">
                  Tap to pick from gallery
                </Text>
              </View>
            ) : null}
            {isManual && localPhotoUri ? (
              <Pressable
                onPress={handlePickPhoto}
                className="absolute top-2 right-2 bg-[#141414]/90 border border-[#1e1e1e] rounded-full px-2.5 py-1 flex-row items-center gap-1"
              >
                <IconPhoto size={10} color="#c9a84c" />
                <Text className="text-[#c9a84c] text-[9px] font-bold">
                  Change
                </Text>
              </Pressable>
            ) : null}
          </Pressable>

          {isScanned ? (
            <Text className="text-[#888] text-[11px] mb-4 leading-4">
              We&apos;ve prefilled what AI detected. Edit anything before saving
              to your wardrobe.
            </Text>
          ) : null}

          {/* Item name */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Item name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Blue kurta"
            placeholderTextColor="#555"
            className="bg-[#141414] border border-[#1e1e1e] rounded-xl px-3 py-3 text-white text-sm mb-4"
          />

          {/* Category */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-4">
            {CATEGORIES.map((c) => {
              const sel = c.id === category;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    sel
                      ? "bg-[#c9a84c]/15 border-[#c9a84c]"
                      : "bg-[#141414] border-[#1e1e1e]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      sel ? "text-[#c9a84c]" : "text-[#aaa]"
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Color */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Color
          </Text>
          <TextInput
            value={color}
            onChangeText={setColor}
            placeholder="e.g. Beige, Navy blue"
            placeholderTextColor="#555"
            className="bg-[#141414] border border-[#1e1e1e] rounded-xl px-3 py-3 text-white text-sm mb-4"
          />

          {/* Occasion */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Best for
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

          {/* Season */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Season
          </Text>
          <View className="flex-row gap-1.5 mb-4">
            {SEASONS.map((s) => {
              const sel = s === season;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSeason(s)}
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
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Notes */}
          <Text className="text-[#888] text-[10px] uppercase tracking-wider font-semibold mb-2">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Gifted by mom, hand wash only"
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
            className="bg-[#141414] border border-[#1e1e1e] rounded-xl px-3 py-3 text-white text-sm mb-2"
            style={{ textAlignVertical: "top", minHeight: 70 }}
          />
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-4 pb-6 pt-2 bg-[#0c0c0c] border-t border-[#1e1e1e]">
          <Pressable
            onPress={handleConfirm}
            className="bg-[#c9a84c] rounded-xl py-3.5 items-center"
          >
            <Text className="text-[#1a1400] font-bold text-sm">
              {isScanned ? "Confirm & add to wardrobe" : "Add to wardrobe"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
