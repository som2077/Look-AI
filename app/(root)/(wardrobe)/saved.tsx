import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  IconSearch,
  IconHeart,
  IconPlus,
  IconSparkles,
  IconChevronLeft,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";

// ─── Types ───────────────────────────────────────────────────────────────────

type SavedItemType = "outfit" | "clothes" | "inspo";

interface SavedOutfit {
  id: string;
  name: string;
  occasion: string;
  wears: number;
  image: string;
  match: number;
  tags: string[];
  saveType: SavedItemType;
  bgColor?: string;
  items?: {
    id: string;
    name: string;
    category: "top" | "bottoms" | "footwear" | "outerwear" | "accessory";
  }[];
}

interface SavedCollection {
  id: string;
  name: string;
  count: number;
  image: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 16;
const GRID_PADDING = 24;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const FILTER_CHIPS = ["All", "Outfits", "Clothes", "Inspo"];

const INITIAL_COLLECTIONS: SavedCollection[] = [
  {
    id: "col-1",
    name: "Work Fits",
    count: 12,
    image:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: "col-2",
    name: "Casual",
    count: 8,
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: "col-3",
    name: "Party",
    count: 5,
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&auto=format&fit=crop&q=60",
  },
];

const INITIAL_OUTFITS: SavedOutfit[] = [
  {
    id: "outfit-1",
    name: "Office Sharp",
    occasion: "Office",
    wears: 8,
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop&q=60",
    match: 96,
    tags: ["Work", "Formal"],
    saveType: "outfit",
  },
  {
    id: "outfit-2",
    name: "Weekend Vibe",
    occasion: "Casual",
    wears: 4,
    image:
      "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?w=500&auto=format&fit=crop&q=60",
    match: 91,
    tags: ["Casual", "Denim"],
    saveType: "outfit",
  },
  {
    id: "outfit-3",
    name: "Night Out",
    occasion: "Festive",
    wears: 2,
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=60",
    match: 88,
    tags: ["Party", "Bold"],
    saveType: "inspo",
  },
  {
    id: "outfit-4",
    name: "Summer Light",
    occasion: "Casual",
    wears: 12,
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=60",
    match: 93,
    tags: ["Casual", "Light"],
    saveType: "outfit",
  },
  {
    id: "cloth-1",
    name: "White Linen Shirt",
    occasion: "Casual",
    wears: 6,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60",
    match: 89,
    tags: ["Essential", "Summer"],
    saveType: "clothes",
  },
  {
    id: "inspo-1",
    name: "Street Style Mood",
    occasion: "Casual",
    wears: 0,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60",
    match: 94,
    tags: ["Inspo", "Trendy"],
    saveType: "inspo",
  },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

const OutfitCard = React.memo(function OutfitCard({
  outfit,
  onUnsave,
}: {
  outfit: SavedOutfit;
  onUnsave: (id: string) => void;
}) {
  return (
    <Pressable
      style={{
        width: CARD_WIDTH,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#E9EBF8",
        padding: 6,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {/* Visual aspect-ratio vertical block (nested inner card) */}
      <View
        style={{
          width: "100%",
          height: 190,
          borderRadius: 18,
          // margin: 2,
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#F4F4F6",
        }}
      >
        <ExpoImage
          source={{ uri: outfit.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />

        {/* Overlapping top-left match rating badge */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(29, 26, 39, 0.6)",
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            gap: 4,
          }}
        >
          <IconSparkles size={11} color="#10B981" fill="#10B981" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {outfit.match}%
          </Text>
        </View>

        {/* Overlapping top-right heart badge */}
        <Pressable
          onPress={() => onUnsave(outfit.id)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(29, 26, 39, 0.4)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconHeart
            size={16}
            color="#FFFFFF"
            fill="#FFFFFF"
            strokeWidth={1.5}
          />
        </Pressable>
      </View>

      {/* Outfit Title & Tags */}
      <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#1D1A27",
          }}
        >
          {outfit.name}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
          }}
        >
          {outfit.tags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: "#F4F4F6",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: "#5A5A6A",
                  fontWeight: "600",
                }}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
});

const EmptyState = React.memo(function EmptyState({
  onExplore,
}: {
  onExplore: () => void;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "#FFEBEB",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <IconHeart size={36} color="#EF4444" strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: "#1D1A27",
          marginBottom: 6,
        }}
      >
        No saved outfits yet
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#9B9BAF",
          textAlign: "center",
          lineHeight: 18,
          marginBottom: 24,
        }}
      >
        Generate outfit combinations using the AI Planner or save your favorite
        matches to see them here.
      </Text>
      <Pressable
        onPress={onExplore}
        style={{
          backgroundColor: "#1D1A27",
          borderRadius: 14,
          paddingHorizontal: 24,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
          Explore AI Planner
        </Text>
      </Pressable>
    </View>
  );
});

// ─── Main Saved Screen ───────────────────────────────────────────────────────

export default function SavedScreen() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState("All");
  const [outfits, setOutfits] = useState<SavedOutfit[]>(INITIAL_OUTFITS);

  const filteredOutfits = useMemo(() => {
    if (activeChip === "All") return outfits;
    if (activeChip === "Outfits")
      return outfits.filter((o) => o.saveType === "outfit");
    if (activeChip === "Clothes")
      return outfits.filter((o) => o.saveType === "clothes");
    if (activeChip === "Inspo")
      return outfits.filter((o) => o.saveType === "inspo");
    return outfits;
  }, [activeChip, outfits]);

  const handleUnsave = useCallback((id: string) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleExplore = useCallback(() => {
    router.push("/(root)/outfit" as never);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: SavedOutfit }) => (
      <OutfitCard outfit={item} onUnsave={handleUnsave} />
    ),
    [handleUnsave],
  );

  const keyExtractor = useCallback((item: SavedOutfit) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#F4F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconChevronLeft size={24} color="#1D1A27" strokeWidth={2.5} />
            </Pressable>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: "#1D1A27",
              }}
            >
              Saved
            </Text>
          </View>

          <Pressable
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#F4F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSearch size={20} color="#1D1A27" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Grid Layout list */}
        <FlatList
          data={filteredOutfits}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 24,
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginTop: 4 }}>
              {/* Occasion/Type Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
                style={{ marginBottom: 24, maxHeight: 42 }}
              >
                {FILTER_CHIPS.map((chip) => {
                  const isActive = chip === activeChip;
                  return (
                    <Pressable
                      key={chip}
                      onPress={() => setActiveChip(chip)}
                      style={{
                        backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                        borderWidth: isActive ? 0 : 1,
                        borderColor: "#EAEAEF",
                        borderRadius: 20,
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: isActive ? "#FFFFFF" : "#7E7C8C",
                        }}
                      >
                        {chip}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Collections Section */}
              <View style={{ marginBottom: 28 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 24,
                    marginBottom: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#1D1A27",
                    }}
                  >
                    Collections
                  </Text>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <IconPlus size={14} color="#7E7C8C" strokeWidth={2.5} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#7E7C8C",
                      }}
                    >
                      New
                    </Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                >
                  {INITIAL_COLLECTIONS.map((col) => (
                    <Pressable
                      key={col.id}
                      style={{
                        width: 140,
                        height: 90,
                        borderRadius: 16,
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#E2E2EA",
                      }}
                    >
                      <ExpoImage
                        source={{ uri: col.image }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      {/* Semi-transparent dark overlay */}
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(0, 0, 0, 0.4)",
                        }}
                      />
                      <View
                        style={{
                          position: "absolute",
                          bottom: 12,
                          left: 12,
                          right: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {col.name}
                        </Text>
                        <Text
                          style={{
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: 10,
                            fontWeight: "500",
                            marginTop: 2,
                          }}
                        >
                          {col.count} outfits
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Saved Outfits Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#1D1A27",
                  }}
                >
                  Saved Outfits
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#9B9BAF",
                    fontWeight: "500",
                  }}
                >
                  {filteredOutfits.length}{" "}
                  {filteredOutfits.length === 1 ? "look" : "looks"}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={<EmptyState onExplore={handleExplore} />}
        />
      </SafeAreaView>
    </View>
  );
}
