import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
  Modal,
  Image,
} from "react-native";
import { MOCK_WARDROBE_ITEMS } from "@/constants/mock-wardrobe-items";
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
  IconPencil,
  IconPlus,
  IconUser,
} from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";


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
        backgroundColor: "#F8F8FA",
        borderRadius: 24,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: isLarge ? 200 : 94,
      }}
    >
      {/* Color Indicator dot at top-left */}
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colorDot,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.1)",
        }}
      />

      {/* Icon */}
      <View
        style={{
          width: isLarge ? 64 : 40,
          height: isLarge ? 64 : 40,
          borderRadius: isLarge ? 32 : 20,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: isLarge ? 16 : 8,
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <Icon size={isLarge ? 28 : 20} color="#1D1A27" strokeWidth={1.5} />
      </View>

      <Text
        numberOfLines={2}
        style={{
          fontSize: isLarge ? 13 : 10,
          fontWeight: "700",
          color: "#1D1A27",
          textAlign: "center",
          paddingHorizontal: 4,
          letterSpacing: 0.5,
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
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingRight: 10,
        paddingVertical: 2,
        marginBottom: 8,
      }}
    >
      <IconCheck size={14} color="#1D1A27" strokeWidth={2.5} />
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#1D1A27", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {text}
      </Text>
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
    return SUGGESTIONS_DATA.find((o) => o.id === selectedId) || SUGGESTIONS_DATA[0];
  }, [selectedId]);

  // Outfit States
  const [activeTab, setActiveTab] = useState<"curated" | "tryon">("curated");
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);

  const pickImage = async (setImage: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  // Build & Rate States Removed

  // Loading Phrase cycle

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
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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
              contentContainerStyle={{ paddingBottom: 140 }}
            >
              {/* Header section */}
              <View style={{ paddingHorizontal: 24, paddingTop: 16, marginBottom: 24 }}>
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

                {/* Mode Switcher */}
                <View style={{ flexDirection: "row", marginTop: 24, backgroundColor: "#F8F8FA", padding: 4, borderRadius: 12 }}>
                  <Pressable onPress={() => setActiveTab("curated")} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: activeTab === "curated" ? "#FFFFFF" : "transparent", alignItems: "center", shadowColor: activeTab === "curated" ? "#000" : "transparent", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: activeTab === "curated" ? 2 : 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: activeTab === "curated" ? "700" : "500", color: activeTab === "curated" ? "#1D1A27" : "#9B9BAF" }}>Curated for You</Text>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab("tryon")} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: activeTab === "tryon" ? "#FFFFFF" : "transparent", alignItems: "center", shadowColor: activeTab === "tryon" ? "#000" : "transparent", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: activeTab === "tryon" ? 2 : 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: activeTab === "tryon" ? "700" : "500", color: activeTab === "tryon" ? "#1D1A27" : "#9B9BAF" }}>Virtual Try-On</Text>
                  </Pressable>
                </View>
              </View>

              {activeTab === "curated" ? (
                <>
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
              <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 32,
                    borderWidth: 1,
                    borderColor: "#F0F0F5",
                    padding: 24,
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
                      marginTop: 24,
                      paddingTop: 20,
                      borderTopWidth: 1,
                      borderTopColor: "#F0F0F5",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#1D1A27", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      Curator&apos;s Note
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#4A4A5A",
                        lineHeight: 22,
                        fontWeight: "400",
                      }}
                    >
                      {currentOutfit.why}
                    </Text>
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
              </>
              ) : activeTab === "tryon" ? (
                /* Virtual Try-On View */
                <View style={{ paddingHorizontal: 24, alignItems: "center" }}>
                  {/* Card 1: Your Image */}
                  <Pressable 
                    onPress={() => pickImage(setPersonImage)}
                    style={{
                      width: '100%',
                      height: 380,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: "#E2E2EA",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {personImage ? (
                      <>
                        <Image source={{ uri: personImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <View style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1F4D9', alignItems: 'center', justifyContent: 'center' }}>
                          <IconPencil size={20} color="#000000" />
                        </View>
                      </>
                    ) : (
                      <>
                         <IconUser size={48} color="#008000" />
                         <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: '#008000' }}>Select Your Photo</Text>
                         <Text style={{ marginTop: 4, fontSize: 13, color: '#9B9BAF' }}>Tap to choose from camera or gallery</Text>
                      </>
                    )}
                  </Pressable>
                  <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '700', color: '#008000' }}>Your Image</Text>

                  {/* Separator Plus */}
                  <View style={{ marginVertical: 24, width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#E2E2EA', alignItems: 'center', justifyContent: 'center' }}>
                    <IconPlus size={24} color="#9B9BAF" strokeWidth={2.5} />
                  </View>

                  <Text style={{ marginBottom: 16, fontSize: 16, fontWeight: '700', color: '#1D1A27' }}>Outfit Image</Text>
                  {/* Card 2: Outfit Image */}
                  <Pressable 
                    onPress={() => pickImage(setOutfitImage)}
                    style={{
                      width: '100%',
                      height: 380,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: "#E2E2EA",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {outfitImage ? (
                      <>
                        <Image source={{ uri: outfitImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <View style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1F4D9', alignItems: 'center', justifyContent: 'center' }}>
                          <IconPencil size={20} color="#000000" />
                        </View>
                      </>
                    ) : (
                      <>
                         <IconHanger size={48} color="#008000" />
                         <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: '#008000' }}>Select Outfit</Text>
                         <Text style={{ marginTop: 4, fontSize: 13, color: '#9B9BAF' }}>Tap to choose from camera or gallery</Text>
                      </>
                    )}
                  </Pressable>
                  
                  {/* Action Button */}
                  <Pressable 
                     disabled={!personImage || !outfitImage}
                     style={{
                       width: '100%',
                       marginTop: 32,
                       backgroundColor: (!personImage || !outfitImage) ? "#E2E2EA" : "#1D1A27",
                       borderRadius: 16,
                       paddingVertical: 18,
                       alignItems: "center",
                     }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: (!personImage || !outfitImage) ? "#9B9BAF" : "#FFFFFF" }}>Generate Try-On</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          )}

          {/* Floating Action Bar */}
          {!loading && activeTab === "curated" && (
            <View
              style={{
                position: "absolute",
                bottom: 30,
                left: 20,
                right: 20,
                backgroundColor: "#161618",
                borderRadius: 999,
                flexDirection: "row",
                padding: 8,
                paddingHorizontal: 10,
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 15,
                shadowOffset: { width: 0, height: 8 },
                elevation: 10,
              }}
            >
              <Pressable
                onPress={handleRefresh}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#2C2C2E",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <IconRefresh size={20} color="#FFFFFF" />
              </Pressable>

              <Pressable
                onPress={handleSaveToggle}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isSaved ? "#EF4444" : "#2C2C2E",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <IconHeart
                  size={20}
                  color="#FFFFFF"
                  fill={isSaved ? "#FFFFFF" : "none"}
                />
              </Pressable>

              <Pressable
                onPress={handleWearToggle}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isWorn ? "#5ECFC2" : "#FFFFFF",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isWorn ? (
                  <>
                    <IconCheck size={18} color="#161618" strokeWidth={2.5} />
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#161618" }}>
                      Worn Today
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#161618" }}>
                    Wear This
                  </Text>
                )}
              </Pressable>
            </View>
          )}
      </SafeAreaView>


    </View>
  );
}
