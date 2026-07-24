import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { IconCheck, IconChevronLeft } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useLogWears } from "@/features/wardrobe/api/useLogWears";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateOutfitScreen() {
  const router = useRouter();
  const { items, addOutfit } = useUserWardrobeStore();

  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { logWears } = useLogWears();

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSave = () => {
    if (selectedIds.size === 0) return;

    const idsArray = Array.from(selectedIds);
    addOutfit({
      name: name.trim() || "My Outfit",
      itemIds: idsArray,
    });
    
    // Log to Supabase wear_logs
    logWears(idsArray);
    
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FC" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 15,
            }}
          >
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <IconChevronLeft size={28} color="#000" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "600", color: "#000" }}>
              New Outfit
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={selectedIds.size === 0}
              style={{
                opacity: selectedIds.size === 0 ? 0.5 : 1,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: "#1D1A27",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>
                Save
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          >
            {/* Name Input */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1D1A27",
                  marginBottom: 8,
                }}
              >
                Outfit Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Summer Beach Day"
                placeholderTextColor="#A0A0A0"
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: "#000",
                  borderWidth: 1,
                  borderColor: "#F0EEF8",
                }}
              />
            </View>

            {/* Selection Grid */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}
              >
                Select Items
              </Text>
              <Text style={{ fontSize: 14, color: "#8E8E93" }}>
                {selectedIds.size} selected
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "space-between",
              }}
            >
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleSelection(item.id)}
                    style={{
                      width: "48%",
                      aspectRatio: 3 / 4,
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: isSelected ? 3 : 1,
                      borderColor: isSelected ? "#0BB5FF" : "#F0EEF8",
                      backgroundColor: "#FFF",
                    }}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "#0BB5FF",
                          borderRadius: 12,
                          padding: 4,
                        }}
                      >
                        <IconCheck size={16} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
