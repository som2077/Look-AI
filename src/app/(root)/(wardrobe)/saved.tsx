import {
  SavedOutfit,
  useSavedStore,
} from "@/features/wardrobe/model/saved-store";
import { IconArrowLeft, IconMinus, IconX } from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function SavedScreen() {
  const router = useRouter();
  const { outfits, removeSavedItem } = useSavedStore();
  const [isManaging, setIsManaging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Fit check");

  const filteredOutfits = useMemo(() => {
    return outfits.filter((outfit) => {
      const tags = outfit.tags?.map((tag) => tag.toLowerCase()) ?? [];
      const categoryLabel = activeCategory.toLowerCase();
      return (
        tags.includes(categoryLabel) ||
        outfit.occasion?.toLowerCase() === categoryLabel ||
        outfit.name.toLowerCase().includes(categoryLabel)
      );
    });
  }, [activeCategory, outfits]);

  const renderGridItem = useCallback(
    ({ item }: { item: SavedOutfit }) => (
      <Pressable
        onPress={() => {
          if (!isManaging) setSelectedImage(item.image);
        }}
        style={{ width: ITEM_SIZE, height: ITEM_SIZE, marginBottom: GRID_GAP }}
      >
        <ExpoImage
          source={{ uri: item.image }}
          style={{ flex: 1 }}
          contentFit="cover"
        />
        {isManaging && (
          <Pressable
            onPress={() => removeSavedItem(item.id)}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#EF4444",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconMinus size={16} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        )}
      </Pressable>
    ),
    [isManaging, removeSavedItem],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            position: "relative",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            height: 52,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              left: 16,
              zIndex: 10,
              padding: 4,
            }}
          >
            <IconArrowLeft size={24} color="#000000" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#000000" }}>
            Saved
          </Text>
          <Pressable
            onPress={() => setIsManaging(!isManaging)}
            style={{
              position: "absolute",
              right: 16,
              zIndex: 10,
              padding: 4,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: isManaging ? "#EF4444" : "#1D1A27",
              }}
            >
              {isManaging ? "Done" : "Manage"}
            </Text>
          </Pressable>
        </View>

        {/* Categories */}
        <View
          style={{
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
            marginBottom: 12,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 24 }}
          >
            {["Fit check", "Virtual try on", "Cloth label", "AI outfit"].map(
              (cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 2,
                    borderBottomColor:
                      activeCategory === cat ? "#1D1A27" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: activeCategory === cat ? "700" : "500",
                      color: activeCategory === cat ? "#1D1A27" : "#9CA3AF",
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ),
            )}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }}>
          <FlashList
            data={filteredOutfits}
            extraData={isManaging}
            keyExtractor={(item) => item.id}
            renderItem={renderGridItem}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => setSelectedImage(null)}
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              padding: 8,
            }}
          >
            <IconX size={32} color="#FFFFFF" />
          </Pressable>
          {!!selectedImage && (
            <ExpoImage
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "80%" }}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
