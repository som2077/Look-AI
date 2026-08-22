/**
 * Wardrobe Select Screen — Source 3 for Scan & Add
 * Lets user pick 1–5 existing wardrobe items to re-scan with AI.
 * Navigates to batch-scan with wardrobe image URLs.
 */

import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconArrowLeft,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_SIZE = (SCREEN_WIDTH - 48 - 16) / 3;
const MAX_SELECT = 5;

export default function WardrobeSelectScreen() {
  const router = useRouter();
  const wardrobeItems = useUserWardrobeStore((s) => s.items);
  const [selectedUris, setSelectedUris] = useState<string[]>([]);

  const itemsWithImages = wardrobeItems.filter(
    (i) => i.imageUrl || i.originalImageUrl
  );

  const toggleItem = (uri: string) => {
    setSelectedUris((prev) => {
      if (prev.includes(uri)) return prev.filter((u) => u !== uri);
      if (prev.length >= MAX_SELECT) return prev; // cap at 5
      return [...prev, uri];
    });
  };

  const handleScan = () => {
    if (selectedUris.length === 0) return;
    if (selectedUris.length === 1) {
      router.push({
        pathname: "/(root)/add-clothes/scan-result",
        params: { photoUri: selectedUris[0], mode: "cloth", source: "wardrobe" },
      } as never);
    } else {
      router.push({
        pathname: "/(root)/add-clothes/batch-scan",
        params: {
          uris: JSON.stringify(selectedUris),
          mode: "cloth",
          source: "wardrobe",
        },
      } as never);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: "#F3F4F6",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#F9FAFB",
              borderWidth: 0.5,
              borderColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
            }}
            hitSlop={8}
          >
            <IconArrowLeft size={18} color="#111827" strokeWidth={2.2} />
          </Pressable>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: "#111827", fontSize: 16, fontWeight: "700" }}>
              Scan from Wardrobe
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 1 }}>
              Select up to {MAX_SELECT} items to re-scan
            </Text>
          </View>

          {/* Count pill */}
          <View
            style={{
              backgroundColor: selectedUris.length > 0 ? "#7C6AFF" : "#F3F4F6",
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                color: selectedUris.length > 0 ? "#FFFFFF" : "#9CA3AF",
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {selectedUris.length}/{MAX_SELECT}
            </Text>
          </View>
        </View>

        {/* Wardrobe Grid */}
        {itemsWithImages.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 40,
            }}
          >
            <Text
              style={{
                color: "#111827",
                fontSize: 17,
                fontWeight: "700",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No items in wardrobe
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 13,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Add clothes first using Camera or Library, then use this option to re-scan.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 120,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
            showsVerticalScrollIndicator={false}
          >
            {itemsWithImages.map((item) => {
              const uri = (item.imageUrl || item.originalImageUrl)!;
              const isSelected = selectedUris.includes(uri);
              const selectionIndex = selectedUris.indexOf(uri);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(uri)}
                  style={{
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    borderRadius: 14,
                    overflow: "hidden",
                    position: "relative",
                    borderWidth: isSelected ? 2.5 : 0,
                    borderColor: "#7C6AFF",
                  }}
                >
                  <ExpoImage
                    source={{ uri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />

                  {/* Dim overlay when selected */}
                  {isSelected && (
                    <View
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(124,106,255,0.2)",
                      }}
                    />
                  )}

                  {/* Selection number badge */}
                  <View
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: isSelected ? "#7C6AFF" : "rgba(0,0,0,0.35)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected ? (
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>
                        {selectionIndex + 1}
                      </Text>
                    ) : (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          borderWidth: 1.5,
                          borderColor: "rgba(255,255,255,0.7)",
                        }}
                      />
                    )}
                  </View>

                  {/* Item name bottom label */}
                  {item.customName && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 9,
                          fontWeight: "600",
                        }}
                        numberOfLines={1}
                      >
                        {item.customName}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Bottom CTA */}
        {selectedUris.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#FFFFFF",
              borderTopWidth: 0.5,
              borderTopColor: "#F3F4F6",
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: 32,
            }}
          >
            <Pressable
              onPress={handleScan}
              style={{
                backgroundColor: "#7C6AFF",
                borderRadius: 18,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <IconSparkles size={18} color="#FFFFFF" strokeWidth={1.8} />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                Scan {selectedUris.length} Item{selectedUris.length > 1 ? "s" : ""} with AI
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
