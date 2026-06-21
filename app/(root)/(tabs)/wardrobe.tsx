import { useWardrobeSummary } from "@/backend/hooks/useWardrobeSummary";
import { useUserWardrobeStore } from "@/backend/store/user-wardrobe-store";
import { MOCK_WARDROBE_ITEMS } from "@/constants/mock-wardrobe-items";
import { useUser } from "@clerk/clerk-expo";
import {
  IconCamera,
  IconChevronRight,
  IconHanger,
  IconHeart,
  IconLayoutGrid,
  IconPhoto,
  IconPlus,
  IconScissors,
  IconShirt,
  IconShoe,
  IconSparkles,
} from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";
import type { RingProgressSegment } from "../../../components/ui/WardrobeRingSummaryCard";
import { WardrobeRingSummaryCard } from "../../../components/ui/WardrobeRingSummaryCard";
import { useScrollToHideTabBar } from "../../../hooks/useScrollToHideTabBar";

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryId =
  | "all"
  | "top"
  | "bottoms"
  | "footwear"
  | "outerwear"
  | "dress"
  | "ethnic"
  | "accessory"
  | "activewear"
  | "sportswear"
  | "formal"
  | "casual"
  | "partywear"
  | "sleepwear"
  | "swimwear"
  | "winterwear"
  | "summerwear"
  | "loungewear"
  | "bags"
  | "jewelry"
  | "watches"
  | "sunglasses"
  | "belts"
  | "hats"
  | "co_ords"
  | "jumpsuits"
  | "blazers"
  | "hoodies"
  | "jackets"
  | "sweaters"
  | "jeans"
  | "trousers"
  | "shorts"
  | "skirts"
  | "traditional"
  | "festive"
  | "wedding"
  | "new_arrivals"
  | "trending"
  | "favorites"
  | "recommended";

interface CategoryChip {
  id: CategoryId;
  label: string;
}

interface ClothingItem {
  id: string;
  name: string;
  category: CategoryId;
  color: string;
  bgColor: string;
  occasion: string;
  wears: number;
  isNew: boolean;
  image?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 8;
const GRID_PADDING = 14;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

const MASONRY_HEIGHTS = [
  120, 160, 140, 150, 130, 170, 110, 180, 145, 125, 155, 135,
];

const CATEGORIES: CategoryChip[] = [
  { id: "all", label: "All" },
  { id: "top", label: "Tops" },
  { id: "bottoms", label: "Bottoms" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dress", label: "Dresses" },
  { id: "footwear", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
  { id: "activewear", label: "Activewear" },
  { id: "traditional", label: "Traditional" },
  { id: "bags", label: "Bags" },
];

const CATEGORY_ICONS: Partial<Record<CategoryId, React.ComponentType<any>>> = {
  all: IconLayoutGrid,
  top: IconShirt,
  bottoms: IconScissors,
  footwear: IconShoe,
  outerwear: IconShirt,
  dress: IconShirt,
  ethnic: IconShirt,
  accessory: IconHanger,
  activewear: IconShirt,
  sportswear: IconShirt,
  formal: IconShirt,
  casual: IconShirt,
  partywear: IconShirt,
  sleepwear: IconShirt,
  swimwear: IconShirt,
  winterwear: IconShirt,
  summerwear: IconShirt,
  loungewear: IconShirt,
  bags: IconHanger,
  jewelry: IconHanger,
  watches: IconHanger,
  sunglasses: IconHanger,
  belts: IconHanger,
  hats: IconHanger,
  co_ords: IconShirt,
  jumpsuits: IconShirt,
  blazers: IconShirt,
  hoodies: IconShirt,
  jackets: IconShirt,
  sweaters: IconShirt,
  jeans: IconScissors,
  trousers: IconScissors,
  shorts: IconScissors,
  skirts: IconShirt,
  traditional: IconShirt,
  festive: IconShirt,
  wedding: IconShirt,
  new_arrivals: IconLayoutGrid,
  trending: IconLayoutGrid,
  favorites: IconHeart,
  recommended: IconSparkles,
};

const CATEGORY_COLORS: Partial<Record<CategoryId, string>> = {
  all: "#6366F1",
  top: "#10B981",
  bottoms: "#3B82F6",
  footwear: "#F59E0B",
  outerwear: "#8B5CF6",
  dress: "#EC4899",
  ethnic: "#EF4444",
  accessory: "#6B7280",
  activewear: "#10B981",
  sportswear: "#3B82F6",
  formal: "#1D1A27",
  casual: "#6366F1",
  partywear: "#EC4899",
  sleepwear: "#8B5CF6",
  swimwear: "#06B6D4",
  winterwear: "#3B82F6",
  summerwear: "#F59E0B",
  loungewear: "#8B5CF6",
  bags: "#6B7280",
  jewelry: "#F59E0B",
  watches: "#6B7280",
  sunglasses: "#1D1A27",
  belts: "#92400E",
  hats: "#6B7280",
  co_ords: "#EC4899",
  jumpsuits: "#8B5CF6",
  blazers: "#1D1A27",
  hoodies: "#6366F1",
  jackets: "#8B5CF6",
  sweaters: "#F59E0B",
  jeans: "#3B82F6",
  trousers: "#6B7280",
  shorts: "#10B981",
  skirts: "#EC4899",
  traditional: "#EF4444",
  festive: "#F59E0B",
  wedding: "#EC4899",
  new_arrivals: "#10B981",
  trending: "#EF4444",
  favorites: "#E11D48",
  recommended: "#6366F1",
};

const CATEGORY_BG: Partial<Record<CategoryId, string>> = {
  all: "#EEF2FF",
  top: "#ECFDF5",
  bottoms: "#EFF6FF",
  footwear: "#FFFBEB",
  outerwear: "#F5F3FF",
  dress: "#FDF2F8",
  ethnic: "#FFF1F2",
  accessory: "#F9FAFB",
  activewear: "#ECFDF5",
  sportswear: "#EFF6FF",
  formal: "#F1F1F5",
  casual: "#EEF2FF",
  partywear: "#FDF2F8",
  sleepwear: "#F5F3FF",
  swimwear: "#ECFEFF",
  winterwear: "#EFF6FF",
  summerwear: "#FFFBEB",
  loungewear: "#F5F3FF",
  bags: "#F9FAFB",
  jewelry: "#FFFBEB",
  watches: "#F9FAFB",
  sunglasses: "#F1F1F5",
  belts: "#FEF3C7",
  hats: "#F9FAFB",
  co_ords: "#FDF2F8",
  jumpsuits: "#F5F3FF",
  blazers: "#F1F1F5",
  hoodies: "#EEF2FF",
  jackets: "#F5F3FF",
  sweaters: "#FFFBEB",
  jeans: "#EFF6FF",
  trousers: "#F9FAFB",
  shorts: "#ECFDF5",
  skirts: "#FDF2F8",
  traditional: "#FFF1F2",
  festive: "#FFFBEB",
  wedding: "#FDF2F8",
  new_arrivals: "#ECFDF5",
  trending: "#FFF1F2",
  favorites: "#FFF1F2",
  recommended: "#EEF2FF",
};

const MOCK_ITEMS = MOCK_WARDROBE_ITEMS as ClothingItem[];

// ─── Sub-Components ──────────────────────────────────────────────────────────

const CategoryFilter = React.memo(function CategoryFilter({
  active,
  onSelect,
}: {
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
      }}
      style={{ marginBottom: 16 }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === active;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={{
              backgroundColor: isActive ? "#1D1A27" : "#FFFFFF",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              minWidth: 60,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#FFFFFF" : "#000000",
              }}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}

      {/* Edit Categories Chip */}
      <Pressable
        style={{
          backgroundColor: "#E2E2E2",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            lineHeight: 18,
            fontWeight: "500",
            color: "#000000",
            marginTop: -1,
          }}
        >
          +
        </Text>
      </Pressable>
    </ScrollView>
  );
});

// ─── Ring segment constants (same as homescreen) ──────────────────────────────

const RING_SEGMENT_BASE: readonly Omit<RingProgressSegment, "progress">[] = [
  { id: "outer", color: "#E5904F", radius: 88, strokeWidth: 13 },
  { id: "middle", color: "#E26B6B", radius: 74.7, strokeWidth: 13 },
  { id: "inner", color: "#6B7AE8", radius: 61.4, strokeWidth: 13 },
  { id: "innermost", color: "#000000", radius: 47.9, strokeWidth: 13 },
] as const;

const clampRatio = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

// ─── Pinterest masonry card ───────────────────────────────────────────────────

const MasonryCard = React.memo(function MasonryCard({
  item,
  height,
}: {
  item: ClothingItem;
  height: number;
}) {
  const router = useRouter();
  const bg = CATEGORY_BG[item.category] || "#F0EEF8";
  return (
    <Pressable
      onPress={() => router.push(`/(root)/cloth-details/${item.id}` as never)}
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: GRID_GAP,
        backgroundColor: bg,
      }}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: bg }} />
      )}
    </Pressable>
  );
});

// ─── AI suggestion banner ─────────────────────────────────────────────────────

const AISuggestionBanner = React.memo(function AISuggestionBanner({
  unworn,
}: {
  unworn: number;
}) {
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 24,
        padding: 16,
        backgroundColor: "#1D1A27",
        borderRadius: 24,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "rgba(99,102,241,0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconSparkles size={22} color="#818CF8" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
          {unworn} clothes never worn
        </Text>
        <Text
          style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}
        >
          Get AI outfit ideas for them →
        </Text>
      </View>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.08)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconChevronRight size={16} color="rgba(255,255,255,0.5)" />
      </View>
    </Pressable>
  );
});

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = React.memo(function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: "#EEF2FF",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <IconHanger size={40} color="#6366F1" strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: "#1D1A27",
          marginBottom: 8,
        }}
      >
        Your wardrobe is empty
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#9B9BAF",
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 24,
        }}
      >
        Start adding your clothes to track what you wear and get personalized AI
        outfit ideas.
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          backgroundColor: "#1D1A27",
          borderRadius: 20,
          paddingHorizontal: 28,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <IconPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
          Add your first item
        </Text>
      </Pressable>
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WardrobeScreen() {
  const { onScroll } = useScrollToHideTabBar();
  const router = useRouter();
  const { user } = useUser();
  const { summary } = useWardrobeSummary(user?.id);
  const userItems = useUserWardrobeStore((state) => state.items);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Today");

  const TIME_FILTERS = ["Today", "3day", "5day", "This week"] as const;

  const allItems = useMemo(() => {
    const saved = userItems.map(
      (item): ClothingItem => ({
        id: item.id,
        name: item.name,
        category: item.category as CategoryId,
        color: item.color ?? "—",
        bgColor: "#F8F7FC",
        occasion: item.occasion ?? "Casual",
        wears: 0,
        isNew: true,
        image:
          (item as any).image ??
          `https://picsum.photos/seed/${item.id}/300/400`,
      }),
    );
    const mocked = MOCK_ITEMS.map((item) => ({
      ...item,
      image: `https://picsum.photos/seed/${item.id}/300/400`,
    }));
    return [...saved, ...mocked];
  }, [userItems]);
  const ADD_MENU_OPTIONS = [
    {
      id: "add_clothing",
      label: "Add Clothing",
      subtitle: "Upload a photo of your clothes",
      icon: IconShirt,
      color: "#6366F1",
      bg: "#EEF2FF",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/add-clothes" as never);
      },
    },
    {
      id: "scan",
      label: "Scan & Add",
      subtitle: "Use camera to scan your clothing",
      icon: IconCamera,
      color: "#10B981",
      bg: "#ECFDF5",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/add-clothes" as never);
      },
    },
    {
      id: "gallery",
      label: "Add from Gallery",
      subtitle: "Pick multiple items from photos",
      icon: IconPhoto,
      color: "#F59E0B",
      bg: "#FFFBEB",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/add-clothes" as never);
      },
    },
    {
      id: "outfit",
      label: "Create Outfit",
      subtitle: "Combine pieces into an outfit",
      icon: IconHanger,
      color: "#EC4899",
      bg: "#FDF2F8",
      onPress: () => {
        setShowAddMenu(false);
      },
    },
  ];

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return allItems;
    return allItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, allItems]);

  const displayItems = useMemo(() => filteredItems, [filteredItems]);

  const groupableCategories = useMemo(() => {
    if (activeCategory !== "all") {
      return CATEGORIES.filter((cat) => cat.id === activeCategory);
    }
    return CATEGORIES.filter(
      (cat) =>
        cat.id !== "all" && allItems.some((item) => item.category === cat.id),
    );
  }, [activeCategory, allItems]);

  // ── Wardrobe-specific stats (based on actual items, filtered by time) ──
  const totalItems = allItems.length;
  const baseWorn =
    summary.totalWorn || allItems.filter((i) => i.wears > 0).length;

  const multiplier =
    activeFilter === "Today"
      ? 1
      : activeFilter === "3day"
        ? 1.5
        : activeFilter === "5day"
          ? 2
          : 2.5;

  const displayWorn = Math.min(Math.round(baseWorn * multiplier), totalItems);
  const displayUnworn = Math.max(totalItems - displayWorn, 0);
  const displayUsage = totalItems > 0 ? displayWorn / totalItems : 0;

  const ringSegments = useMemo<readonly RingProgressSegment[]>(() => {
    const wornRatio = totalItems > 0 ? displayWorn / totalItems : 0;
    const unwornRatio = totalItems > 0 ? displayUnworn / totalItems : 0;
    const fourthRatio =
      totalItems > 0 ? (displayWorn * 0.5) / totalItems : 0.45;
    return [
      { ...RING_SEGMENT_BASE[0], progress: clampRatio(wornRatio) },
      { ...RING_SEGMENT_BASE[1], progress: clampRatio(unwornRatio) },
      { ...RING_SEGMENT_BASE[2], progress: clampRatio(wornRatio) },
      { ...RING_SEGMENT_BASE[3], progress: clampRatio(fourthRatio) },
    ];
  }, [displayWorn, displayUnworn, totalItems]);

  const handleAddClothes = useCallback(() => {
    router.push("/(root)/add-clothes" as never);
  }, [router]);

  const handleSaved = useCallback(() => {
    router.push("/(root)/saved" as never);
  }, [router]);

  const handleCategorySelect = useCallback((id: CategoryId) => {
    setActiveCategory(id);
  }, []);

  const CURRENT_STREAK_DAYS = 1;

  const daysFilterBar = (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#F2F2F7",
        borderRadius: 14,
        padding: 4,
      }}
    >
      {TIME_FILTERS.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => setActiveFilter(filter)}
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 10,
            backgroundColor:
              activeFilter === filter ? "#1D1A27" : "transparent",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: activeFilter === filter ? "700" : "500",
              color: activeFilter === filter ? "#FFFFFF" : "#8E8E93",
            }}
          >
            {filter}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const listHeader = (
    <View style={{ marginTop: 4, paddingHorizontal: 20 }}>
      <WardrobeRingSummaryCard
        wornPercentage={clampRatio(displayUsage)}
        totalWorn={displayWorn}
        wearCount={totalItems}
        neverCount={displayUnworn}
        ringSegments={ringSegments}
        streak={CURRENT_STREAK_DAYS}
        showStreakIcon={false}
        labels={{
          topLeft: "Usage",
          bottomLeft: "Worn",
          topRight: "Total clothes",
          bottomRight: "Unworn",
        }}
        statColors={{
          bottomLeft: "#6B7AE8",
          topRight: "#1D1A27",
        }}
        bottomContent={daysFilterBar}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 4,
          marginBottom: 12,
          marginTop: 14,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}>
          All Categories
        </Text>
      </View>
      <CategoryFilter active={activeCategory} onSelect={handleCategorySelect} />
    </View>
  );

  return (
    <SwipeTabWrapper tabIndex={1}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 15,
              // marginTop:5
            }}
          >
            <View>
              <Text
                style={{ fontSize: 26, fontWeight: "500", color: "#000000" }}
              >
                Wardrobe
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Pressable
                onPress={() => setShowAddMenu(true)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#1D1A27",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconPlus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
              <Pressable
                onPress={handleSaved}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconHeart size={20} color="#000000" strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* ── Add Menu Modal ── */}
          <Modal
            visible={showAddMenu}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAddMenu(false)}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.4)",
                justifyContent: "flex-end",
              }}
              onPress={() => setShowAddMenu(false)}
            >
              <Pressable onPress={() => {}}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    paddingTop: 12,
                    paddingBottom: 40,
                    paddingHorizontal: 20,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#E0E0E8",
                      alignSelf: "center",
                      marginBottom: 20,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#1D1A27",
                      }}
                    >
                      Add to Wardrobe
                    </Text>
                    {/* <Pressable onPress={() => setShowAddMenu(false)}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "#EEF0F5",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconX size={16} color="#1D1A27" strokeWidth={2.5} />
                      </View>
                    </Pressable> */}
                  </View>
                  {ADD_MENU_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={opt.onPress}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 16,
                          paddingVertical: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: "#F4F4F8",
                        }}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            backgroundColor: opt.bg,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={22} color={opt.color} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: "#1D1A27",
                            }}
                          >
                            {opt.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#9B9BAF",
                              marginTop: 2,
                            }}
                          >
                            {opt.subtitle}
                          </Text>
                        </View>
                        <IconChevronRight
                          size={18}
                          color="#C0C0CC"
                          strokeWidth={2}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {/* ── Content ── */}
          <ScrollView
            key="grid-view"
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {listHeader}
            {displayItems.length === 0 ? (
              <EmptyState onAdd={handleAddClothes} />
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: GRID_PADDING,
                  gap: GRID_GAP,
                }}
              >
                <View style={{ flex: 1 }}>
                  {displayItems
                    .filter((_, i) => i % 3 === 0)
                    .map((item, i) => (
                      <MasonryCard
                        key={item.id}
                        item={item}
                        height={
                          MASONRY_HEIGHTS[(i * 3) % MASONRY_HEIGHTS.length]
                        }
                      />
                    ))}
                </View>
                <View style={{ flex: 1 }}>
                  {displayItems
                    .filter((_, i) => i % 3 === 1)
                    .map((item, i) => (
                      <MasonryCard
                        key={item.id}
                        item={item}
                        height={
                          MASONRY_HEIGHTS[(i * 3 + 1) % MASONRY_HEIGHTS.length]
                        }
                      />
                    ))}
                </View>
                <View style={{ flex: 1 }}>
                  {displayItems
                    .filter((_, i) => i % 3 === 2)
                    .map((item, i) => (
                      <MasonryCard
                        key={item.id}
                        item={item}
                        height={
                          MASONRY_HEIGHTS[(i * 3 + 2) % MASONRY_HEIGHTS.length]
                        }
                      />
                    ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
