import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconArrowLeft,
  IconCheck,
  IconPhoto,
} from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WardrobeSelectionScreen() {
  const router = useRouter();
  const wardrobeItems = useUserWardrobeStore((state) => state.items);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const toggleSelection = (uri: string) => {
    setSelectedImages((prev) => {
      if (prev.includes(uri)) {
        return prev.filter((item) => item !== uri);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, uri];
    });
  };

  const openGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - selectedImages.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newUris].slice(0, 5));
    }
  };

  const handleDone = () => {
    router.replace({
      pathname: "/calendar",
      params: { selectedImages: JSON.stringify(selectedImages) },
    });
  };

  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 48 - 16) / 3;

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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
      >
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
            marginBottom: 24,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <IconPhoto size={24} color="#4B5563" style={{ marginRight: 12 }} />
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#4B5563" }}>
            Choose from Gallery
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Your Wardrobe
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {wardrobeItems.map((item, index) => {
            const uri = item.imageUrl || item.originalImageUrl;
            if (!uri) return null;

            const isSelected = selectedImages.includes(uri);
            return (
              <TouchableOpacity
                key={item.id || index}
                onPress={() => toggleSelection(uri)}
                style={{ position: "relative" }}
              >
                <Image
                  source={{ uri }}
                  style={{
                    width: itemWidth,
                    height: itemWidth,
                    borderRadius: 12,
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: "#111827",
                  }}
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
          })}
        </View>
      </ScrollView>

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
