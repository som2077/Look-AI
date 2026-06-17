import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  IconSparkles,
  IconBriefcase,
  IconHeart,
  IconCheck,
  IconHanger,
  IconShirt,
  IconShoe,
  IconScissors,
  IconCalendar,
  IconSun,
  IconSettings,
  IconBell,
  IconRefresh,
} from "@tabler/icons-react-native";


// ─── Constants & Types ────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OutfitItem {
  name: string;
  category: "top" | "bottoms" | "footwear" | "outerwear" | "accessory";
  colorDot: string;
}

interface OutfitSuggestion {
  id: string;
  name: string;
  score: string;
  subtitle: string;
  tags: string[];
  checklist: { text: string; type: "green" | "blue" | "yellow" | "pink" | "purple" }[];
  why: string;
  bgColor: string;
  items: {
    left: OutfitItem;
    rightTop: OutfitItem;
    rightBottom: OutfitItem;
  };
}

const CATEGORY_ICONS = {
  top: IconShirt,
  bottoms: IconScissors,
  footwear: IconShoe,
  outerwear: IconShirt,
  accessory: IconHanger,
};

const SUGGESTIONS_DATA: OutfitSuggestion[] = [
  {
    id: "outfit-1",
    name: "Best match for you today",
    subtitle: "Work · Minimal",
    score: "98%",
    bgColor: "#FFF4E6", // Light Orange
    tags: ["32°C Sunny", "Work", "Slim fit", "5'9\""],
    checklist: [
      { text: "Slim body", type: "green" },
      { text: "Hot weather", type: "blue" },
      { text: "Work", type: "yellow" },
      { text: "Skin tone", type: "pink" },
      { text: "Height", type: "purple" },
    ],
    why: "Light linen fabric is perfect for 32°C weather. Navy + white combination complements your medium skin tone, and vertical silhouette adds height for 5'9\" frame.",
    items: {
      left: { name: "White Linen Shirt", category: "top", colorDot: "#F0F0F0" },
      rightTop: { name: "Navy Trousers", category: "bottoms", colorDot: "#1E2A4A" },
      rightBottom: { name: "Tan Derby", category: "footwear", colorDot: "#C29B70" },
    },
  },
  {
    id: "outfit-2",
    name: "Smart Cas.",
    subtitle: "Work · Minimal",
    score: "94%",
    bgColor: "#EBF3FE", // Light Blue
    tags: ["30°C Breezy", "Smart Casual", "Slim fit", "5'9\""],
    checklist: [
      { text: "Slim body", type: "green" },
      { text: "Mild weather", type: "blue" },
      { text: "Casual", type: "yellow" },
      { text: "Skin tone", type: "pink" },
      { text: "Height", type: "purple" },
    ],
    why: "The textured beige knit polo brings lightweight comfort. Paired with neutral charcoal chinos and clean white sneakers, it forms a sophisticated smart-casual appearance.",
    items: {
      left: { name: "Beige Knit Polo", category: "top", colorDot: "#E5D3B3" },
      rightTop: { name: "Charcoal Chinos", category: "bottoms", colorDot: "#4F4F4F" },
      rightBottom: { name: "White Sneakers", category: "footwear", colorDot: "#FFFFFF" },
    },
  },
  {
    id: "outfit-3",
    name: "Formal Look",
    subtitle: "Work · Classic",
    score: "91%",
    bgColor: "#FFF0F5", // Light Pink
    tags: ["24°C Sunny", "Office", "Regular fit", "5'9\""],
    checklist: [
      { text: "Regular fit", type: "green" },
      { text: "Sunny day", type: "blue" },
      { text: "Office", type: "yellow" },
      { text: "Skin tone", type: "pink" },
      { text: "Height", type: "purple" },
    ],
    why: "A classic tailored charcoal blazer paired with beige dress trousers creates a professional and sharp impression. Polished black oxfords anchor the outfit.",
    items: {
      left: { name: "Charcoal Blazer", category: "outerwear", colorDot: "#2B2B2B" },
      rightTop: { name: "Beige Dress Pants", category: "bottoms", colorDot: "#F4EADB" },
      rightBottom: { name: "Black Oxfords", category: "footwear", colorDot: "#111111" },
    },
  },
  {
    id: "outfit-4",
    name: "Street Vibe",
    subtitle: "Casual · Street",
    score: "87%",
    bgColor: "#EBFBEE", // Light Green
    tags: ["22°C Breezy", "Street", "Oversized", "5'9\""],
    checklist: [
      { text: "Oversized body", type: "green" },
      { text: "Cool weather", type: "blue" },
      { text: "Street", type: "yellow" },
      { text: "Skin tone", type: "pink" },
      { text: "Height", type: "purple" },
    ],
    why: "Oversized styling balances the structured utility of olive cargo pants. High-top sneakers add support and street-credibility to a relaxed weekend vibe.",
    items: {
      left: { name: "Graphic Tee", category: "top", colorDot: "#1A1A1A" },
      rightTop: { name: "Olive Cargos", category: "bottoms", colorDot: "#556B2F" },
      rightBottom: { name: "High-Top Sneakers", category: "footwear", colorDot: "#C29B70" },
    },
  },
];

const LOADING_PHRASES = [
  "Analyzing styling parameters...",
  "Synthesizing weather data...",
  "Structuring color coordinates...",
  "Calibrating outfit matching ratio...",
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

const ItemCard = React.memo(function ItemCard({
  name,
  category,
  colorDot,
  isLarge = false,
}: {
  name: string;
  category: "top" | "bottoms" | "footwear" | "outerwear" | "accessory";
  colorDot: string;
  isLarge?: boolean;
}) {
  const Icon = CATEGORY_ICONS[category] || IconHanger;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E2EA",
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: isLarge ? 190 : 89,
        shadowColor: "#000",
        shadowOpacity: 0.01,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      {/* Color Indicator dot at top-left */}
      <View
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colorDot,
          borderWidth: 0.5,
          borderColor: "#C5C5CF",
        }}
      />

      {/* Icon inside grey circle/box */}
      <View
        style={{
          width: isLarge ? 56 : 38,
          height: isLarge ? 56 : 38,
          borderRadius: 12,
          backgroundColor: "#F8F7FC",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#E2E2EA",
          marginBottom: isLarge ? 14 : 6,
        }}
      >
        <Icon size={isLarge ? 26 : 18} color="#9B9BAF" strokeWidth={1.5} />
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontSize: isLarge ? 12 : 10,
          fontWeight: "600",
          color: "#1D1A27",
          textAlign: "center",
          paddingHorizontal: 2,
        }}
      >
        {name}
      </Text>
    </View>
  );
});

const ChecklistBadge = React.memo(function ChecklistBadge({
  text,
  type,
}: {
  text: string;
  type: "green" | "blue" | "yellow" | "pink" | "purple";
}) {
  const styles = useMemo(() => {
    switch (type) {
      case "green":
        return { bg: "#E8F8F0", border: "#C6EFD9", text: "#0F824A" };
      case "blue":
        return { bg: "#EAF5FF", border: "#CBE4FF", text: "#1665D8" };
      case "yellow":
        return { bg: "#FEF6EC", border: "#FFE6C7", text: "#B25E02" };
      case "pink":
        return { bg: "#FFF0F6", border: "#FFD6E8", text: "#C11574" };
      case "purple":
        return { bg: "#F7F4FD", border: "#E5DAFB", text: "#6538C9" };
    }
  }, [type]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: styles.bg,
        borderWidth: 1,
        borderColor: styles.border,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "600", color: styles.text }}>
        {text}
      </Text>
      <IconCheck size={10} color={styles.text} strokeWidth={3} />
    </View>
  );
});

const MiniOutfitPreview = React.memo(function MiniOutfitPreview({
  items,
  bgColor,
}: {
  items: {
    left: OutfitItem;
    rightTop: OutfitItem;
    rightBottom: OutfitItem;
  };
  bgColor: string;
}) {
  const itemArray = [items.left, items.rightTop, items.rightBottom];

  return (
    <View
      style={{
        height: 70,
        backgroundColor: bgColor,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        position: "relative",
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      {itemArray.map((item, index) => {
        const Icon = CATEGORY_ICONS[item.category] || IconHanger;

        const rotate = index === 0 ? "-8deg" : index === 2 ? "8deg" : "0deg";
        const translateX = index === 0 ? -6 : index === 2 ? 6 : 0;
        const zIndex = index === 1 ? 2 : 1;
        const scale = index === 1 ? 1.05 : 0.95;

        return (
          <View
            key={index}
            style={{
              width: 28,
              height: 36,
              backgroundColor: "#FFFFFF",
              borderRadius: 6,
              borderWidth: 0.8,
              borderColor: "#E2E2EA",
              alignItems: "center",
              justifyContent: "center",
              zIndex,
              shadowColor: "#000",
              shadowOpacity: 0.02,
              shadowRadius: 1,
              shadowOffset: { width: 0, height: 1 },
              transform: [{ rotate }, { translateX }, { scale }],
              elevation: zIndex,
            }}
          >
            <Icon size={12} color="#9B9BAF" strokeWidth={1.5} />
          </View>
        );
      })}
    </View>
  );
});

// ─── Main Outfit Screen ───────────────────────────────────────────────────────

export default function OutfitScreen() {
  const [selectedId, setSelectedId] = useState("outfit-1");
  const [loading, setLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  // Mapped save/wear statuses per outfit ID
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [wornIds, setWornIds] = useState<Record<string, boolean>>({});

  const currentOutfit = useMemo(() => {
    return (
      SUGGESTIONS_DATA.find((o) => o.id === selectedId) || SUGGESTIONS_DATA[0]
    );
  }, [selectedId]);

  // Loading Phrase cycle
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingPhraseIndex(0);
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 300);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      // Find a random layout index
      const remaining = SUGGESTIONS_DATA.filter((o) => o.id !== selectedId);
      const randomItem = remaining[Math.floor(Math.random() * remaining.length)];
      if (randomItem) {
        setSelectedId(randomItem.id);
      }
      setLoading(false);
    }, 1200);
  }, [selectedId]);

  const handleSaveToggle = useCallback(() => {
    setSavedIds((prev) => ({
      ...prev,
      [selectedId]: !prev[selectedId],
    }));
  }, [selectedId]);

  const handleWearToggle = useCallback(() => {
    setWornIds((prev) => ({
      ...prev,
      [selectedId]: !prev[selectedId],
    }));
  }, [selectedId]);

  const isSaved = !!savedIds[selectedId];
  const isWorn = !!wornIds[selectedId];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FC" }}>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          
          {loading ? (
            /* Loading State screen */
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <ActivityIndicator size="large" color="#4C36F5" />
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27", marginTop: 24 }}>
                AI Stylist is planning...
              </Text>
              <Text style={{ fontSize: 13, color: "#9B9BAF", marginTop: 8, textAlign: "center" }}>
                {LOADING_PHRASES[loadingPhraseIndex]}
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 110 }}
            >
              {/* Header section */}
              <View style={{ paddingHorizontal: 24, paddingTop: 16, marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#4C36F5" }}>
                        Powered by AI
                      </Text>
                      <IconSparkles size={11} color="#4C36F5" fill="#4C36F5" />
                    </View>
                    <Text style={{ fontSize: 26, fontWeight: "800", color: "#1D1A27", marginTop: 2 }}>
                      Outfit Suggester
                    </Text>
                  </View>

                  {/* Top Right Actions */}
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E2E2EA",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSettings size={18} color="#9B9BAF" />
                    </Pressable>
                    <Pressable
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E2E2EA",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconBell size={18} color="#9B9BAF" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Tag filters list (Horizontal Scroll) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
                style={{ maxHeight: 42, marginBottom: 20 }}
              >
                {currentOutfit.tags.map((tag, idx) => {
                  // Determine icon
                  let TagIcon = null;
                  if (tag.includes("Sunny") || tag.includes("Clear")) {
                    TagIcon = IconSun;
                  } else if (tag === "Work" || tag === "Office") {
                    TagIcon = IconBriefcase;
                  }

                  return (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#EAE8FF",
                        borderRadius: 20,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                      }}
                    >
                      {TagIcon && <TagIcon size={14} color="#4C36F5" />}
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#4C36F5" }}>
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Main Card */}
              <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: "#E2E2EA",
                    padding: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.03,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                  }}
                >
                  {/* Card Title & Score Badge */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 18,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "#EAE8FF",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconSparkles size={13} color="#4C36F5" fill="#4C36F5" />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#4C36F5" }}>
                        {currentOutfit.id === "outfit-1" ? "Best match for you today" : currentOutfit.name}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: "#EAE8FF",
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#4C36F5" }}>
                        {currentOutfit.score}
                      </Text>
                      <IconSparkles size={10} color="#4C36F5" fill="#4C36F5" />
                    </View>
                  </View>

                  {/* Collage layout for 3 items */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <ItemCard
                      name={currentOutfit.items.left.name}
                      category={currentOutfit.items.left.category}
                      colorDot={currentOutfit.items.left.colorDot}
                      isLarge={true}
                    />

                    <View style={{ flex: 1, gap: 12 }}>
                      <ItemCard
                        name={currentOutfit.items.rightTop.name}
                        category={currentOutfit.items.rightTop.category}
                        colorDot={currentOutfit.items.rightTop.colorDot}
                      />
                      <ItemCard
                        name={currentOutfit.items.rightBottom.name}
                        category={currentOutfit.items.rightBottom.category}
                        colorDot={currentOutfit.items.rightBottom.colorDot}
                      />
                    </View>
                  </View>

                  {/* Checklist indicators row */}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 18,
                    }}
                  >
                    {currentOutfit.checklist.map((item, idx) => (
                      <ChecklistBadge key={idx} text={item.text} type={item.type} />
                    ))}
                  </View>

                  {/* AI Why Section */}
                  <View
                    style={{
                      backgroundColor: "#F4F3FF",
                      borderRadius: 18,
                      borderLeftWidth: 4,
                      borderLeftColor: "#4C36F5",
                      padding: 16,
                      marginTop: 18,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#4C36F5" }}>
                        Why this outfit?
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#5A5A6A",
                        lineHeight: 18,
                        fontWeight: "500",
                      }}
                    >
                      {currentOutfit.why}
                    </Text>
                  </View>

                  {/* Actions row */}
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                    {/* Refresh Button */}
                    <Pressable
                      onPress={handleRefresh}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        backgroundColor: "#F1F1F5",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconRefresh size={20} color="#1D1A27" />
                    </Pressable>

                    {/* Save Button */}
                    <Pressable
                      onPress={handleSaveToggle}
                      style={{
                        flex: 1,
                        height: 50,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: isSaved ? "#EF4444" : "#FEE2E2",
                        backgroundColor: isSaved ? "#FFF5F5" : "#FFFFFF",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <IconHeart
                        size={18}
                        color="#EF4444"
                        fill={isSaved ? "#EF4444" : "none"}
                        strokeWidth={1.5}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: isSaved ? "#EF4444" : "#EF4444",
                        }}
                      >
                        {isSaved ? "Saved" : "Save"}
                      </Text>
                    </Pressable>

                    {/* Wear This Button */}
                    <Pressable
                      onPress={handleWearToggle}
                      style={{
                        flex: 1.5,
                        height: 50,
                        borderRadius: 14,
                        backgroundColor: isWorn ? "#1D1A27" : "#4C36F5",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      {isWorn ? (
                        <>
                          <IconCheck size={18} color="#FFFFFF" strokeWidth={2.5} />
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                            Wearing Today
                          </Text>
                        </>
                      ) : (
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                          Wear This
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Suggestions header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#1D1A27" }}>
                  More suggestions
                </Text>
                <Pressable>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#9B9BAF" }}>
                    See all
                  </Text>
                </Pressable>
              </View>

              {/* Suggestions horizontal row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                style={{ maxHeight: 160 }}
              >
                {SUGGESTIONS_DATA.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedId(item.id)}
                      style={{
                        width: 140,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1.5,
                        borderColor: isSelected ? "#4C36F5" : "#E2E2EA",
                        borderRadius: 22,
                        padding: 10,
                        shadowColor: "#000",
                        shadowOpacity: 0.01,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                        elevation: 1,
                      }}
                    >
                      {/* Thumbnail cards preview */}
                      <MiniOutfitPreview items={item.items} bgColor={item.bgColor} />

                      {/* Percentage match floating on preview top right */}
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "#EAE8FF",
                          borderRadius: 8,
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: "800", color: "#4C36F5" }}>
                          {item.score}
                        </Text>
                      </View>

                      {/* Suggestion text titles */}
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: "#1D1A27",
                        }}
                      >
                        {item.id === "outfit-1" ? "Smart Cas." : item.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 9,
                          fontWeight: "600",
                          color: "#9B9BAF",
                          marginTop: 2,
                        }}
                      >
                        {item.subtitle}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
  );
}
