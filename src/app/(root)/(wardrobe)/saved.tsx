import { IconChevronLeft, IconMinus, IconX } from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SavedOutfit, useSavedStore } from "@/features/wardrobe/model/saved-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 1;
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
              backgroundColor: "rgba(255, 59, 48, 0.9)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
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
            <IconChevronLeft size={28} color="#000000" strokeWidth={2} />
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
                fontWeight: "600",
                color: isManaging ? "#FF3B30" : "#007AFF",
              }}
            >
              {isManaging ? "Done" : "Manage"}
            </Text>
          </Pressable>
        </View>

        {/* Categories */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {["Fit check", "Virtual try on", "Cloth label", "AI outfit"].map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor:
                    activeCategory === cat ? "#1D1A27" : "#F4F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: activeCategory === cat ? "#FFFFFF" : "#6B7280",
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredOutfits}
          extraData={isManaging}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
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
