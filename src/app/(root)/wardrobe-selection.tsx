import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { cloudinaryUrl } from "@/shared/cloudinary/transform";
import {
  IconArrowLeft,
  IconCheck,
  IconPhoto,
} from "@tabler/icons-react-native";
import { FlashList } from "@shopify/flash-list";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const H_PADDING = 24;
const GUTTER = 8;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GUTTER * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface SelectionItem {
  id: string;
  uri: string;
  isSelected: boolean;
}

const SelectionTile = React.memo(function SelectionTile({
  uri,
  isSelected,
  itemWidth,
  onToggle,
}: {
  uri: string;
  isSelected: boolean;
  itemWidth: number;
  onToggle: (uri: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onToggle(uri)}
      style={{ position: "relative" }}
    >
      <ExpoImage
        source={{ uri: cloudinaryUrl(uri, "thumbnail") }}
        style={{
          width: itemWidth,
          height: itemWidth,
          borderRadius: 12,
          borderWidth: isSelected ? 3 : 0,
          borderColor: "#111827",
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={uri}
      />
      {isSelected && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "#111827",
            borderRadius: 12,
            padding: 4,
          }}
        >
          <IconCheck size={14} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function WardrobeSelectionScreen() {
  const router = useRouter();
  const wardrobeItems = useUserWardrobeStore((state) => state.items);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const toggleSelection = useCallback((uri: string) => {
    setSelectedImages((prev) => {
      if (prev.includes(uri)) {
        return prev.filter((item) => item !== uri);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, uri];
    });
  }, []);

  const openGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - selectedImages.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newUris].slice(0, 5));
    }
  }, [selectedImages.length]);

  const handleDone = useCallback(() => {
    router.replace({
      pathname: "/calendar",
      params: { selectedImages: JSON.stringify(selectedImages) },
    });
  }, [router, selectedImages]);

  const items = useMemo<SelectionItem[]>(() => {
    return wardrobeItems
      .map((item) => {
        const uri = item.imageUrl || item.originalImageUrl;
        if (!uri) return null;
        return {
          id: item.id || uri,
          uri,
          isSelected: selectedImages.includes(uri),
        };
      })
      .filter((x): x is SelectionItem => x !== null);
  }, [wardrobeItems, selectedImages]);

  const renderTile = useCallback(
    ({ item }: { item: SelectionItem }) => (
      <SelectionTile
        uri={item.uri}
        isSelected={item.isSelected}
        itemWidth={ITEM_WIDTH}
        onToggle={toggleSelection}
      />
    ),
    [toggleSelection],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <IconArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
          Select Items ({selectedImages.length}/5)
        </Text>
        <TouchableOpacity
          onPress={handleDone}
          disabled={selectedImages.length === 0}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: selectedImages.length > 0 ? "#111827" : "#9CA3AF",
            }}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={openGallery}
          style={{
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderStyle: "dashed",
            padding: 20,
            borderRadius: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <IconPhoto size={24} color="#4B5563" style={{ marginRight: 12 }} />
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#4B5563" }}>
            Choose from Gallery
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 16,
          paddingHorizontal: 24,
        }}
      >
        Your Wardrobe
      </Text>

      <View style={{ flex: 1, paddingHorizontal: H_PADDING }}>
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderTile}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingBottom: 140 }}
          ItemSeparatorComponent={undefined}
        />
      </View>

      {selectedImages.length > 0 && (
        <View style={{ position: "absolute", bottom: 40, left: 24, right: 24 }}>
          <TouchableOpacity
            onPress={handleDone}
            style={{
              backgroundColor: "#111827",
              padding: 16,
              borderRadius: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              Add {selectedImages.length} Item(s) to Plan
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
