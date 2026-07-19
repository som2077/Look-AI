import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { PremiumGradientBackground } from "@/shared/ui/PremiumGradientBackground";
import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";
import {
  IconAdjustmentsHorizontal,
  IconBookmark,
  IconChevronDown,
  IconHanger,
  IconPlus,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Types
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

type SortId = "recently_added" | "name_az" | "most_worn" | "least_worn";

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
  seasons: string[];
  occasions: string[];
  rating: number;
  brand?: string;
}

// Category tabs (plain text strip below toolbar)
const CATEGORY_TABS: { label: string; value: CategoryId | "all" }[] = [
  { label: "Tops", value: "top" },
  { label: "Dresses", value: "dress" },
  { label: "Pants", value: "trousers" },
  { label: "Outerwear", value: "outerwear" },
  { label: "Shoes", value: "footwear" },
  { label: "Bags", value: "bags" },
  { label: "Ethnic", value: "ethnic" },
  { label: "Accessories", value: "accessory" },
  { label: "Activewear", value: "activewear" },
  { label: "Hoodies", value: "hoodies" },
  { label: "Jackets", value: "jackets" },
  { label: "Formal", value: "formal" },
];

// Filter chips for bottom sheet
const FILTER_CHIPS: { label: string; value: CategoryId | "all" }[] = [
  { label: "All clothes", value: "all" },
  { label: "Tops", value: "top" },
  { label: "Bottoms", value: "bottoms" },
  { label: "Dresses", value: "dress" },
  { label: "Outerwear", value: "outerwear" },
  { label: "Shoes", value: "footwear" },
  { label: "Bags", value: "bags" },
  { label: "Accessories", value: "accessory" },
  { label: "Ethnic", value: "ethnic" },
  { label: "Activewear", value: "activewear" },
  { label: "Jackets", value: "jackets" },
  { label: "Hoodies", value: "hoodies" },
  { label: "Formal", value: "formal" },
  { label: "Casual", value: "casual" },
  { label: "Sportswear", value: "sportswear" },
];

const OCCASIONS: string[] = [
  "Casual",
  "Smart Casual",
  "Business Casual",
  "Formal",
  "Office",
  "College",
  "Party",
  "Wedding",
  "Festive",
  "Traditional",
  "Date Night",
  "Travel",
  "Beach",
  "Gym",
  "Sports",
  "Outdoor",
  "Lounge",
  "Sleepwear",
  "Interview",
  "All Occasion",
];

const SEASONS: string[] = [
  "Spring",
  "Summer",
  "Autumn",
  "Winter",
  "Monsoon",
  "All Season",
];

const CATEGORY_MAPPING: Record<string, string[]> = {
  top: ["T-Shirt", "Polo Shirt", "Shirt", "Blouse", "Crop Top", "Tank Top"],
  bottoms: [
    "Jeans",
    "Trousers",
    "Chinos",
    "Cargo Pants",
    "Joggers",
    "Shorts",
    "Leggings",
    "Skirt",
  ],
  dress: ["Dress", "Jumpsuit", "Romper"],
  outerwear: [
    "Jacket",
    "Blazer",
    "Coat",
    "Cardigan",
    "Hoodie",
    "Sweatshirt",
    "Sweater",
  ],
  footwear: [],
  bags: [],
  accessory: [],
  ethnic: ["Traditional", "Festive"],
  activewear: ["Activewear", "Tracksuit"],
  jackets: ["Jacket", "Blazer", "Coat"],
  hoodies: ["Hoodie", "Sweatshirt", "Sweater"],
  formal: ["Suit", "Shirt", "Trousers", "Blazer", "Coat"],
  casual: ["T-Shirt", "Jeans", "Shorts", "Co-ord Set"],
  sportswear: ["Activewear", "Tracksuit"],
};

const SORT_OPTIONS: { label: string; value: SortId }[] = [
  { label: "Recently added", value: "recently_added" },
  { label: "Name A–Z", value: "name_az" },
  { label: "Most worn", value: "most_worn" },
  { label: "Least worn", value: "least_worn" },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 0;
const GRID_PADDING = 0;
const CONTENT_WIDTH = SCREEN_WIDTH;
const ITEM_WIDTH = CONTENT_WIDTH / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.25;

// Bento Card
const BentoCard = React.memo(function BentoCard({
  item,
  width,
  height,
}: {
  item: ClothingItem;
  width: number;
  height: number;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/(root)/cloth-details/${item.id}` as never)}
      style={{
        width,
        height,
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: "#F0F0F0",
        backgroundColor: "transparent",
        padding: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        {item.image ? (
          <ExpoImage
            source={{ uri: item.image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: "#F3F4F6" }} />
        )}
      </View>
    </Pressable>
  );
});

// Empty State
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
        paddingVertical: 190,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          borderWidth: 0.5,
          borderColor: "#E9EBF8",
        }}
      >
        <IconHanger size={36} color="#000000" strokeWidth={1.2} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1D1A27",
          marginBottom: 8,
        }}
      >
        Your wardrobe is empty
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#00000090",
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 15,
        }}
      >
        Start adding your clothes to track what you wear and get personalized AI
        outfit ideas.
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          backgroundColor: "#1D1A27",
          borderRadius: 26,
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

// Reusable Bottom Sheet
function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        onPress={onClose}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 40,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          style={{ alignItems: "center", paddingTop: 14, paddingBottom: 6 }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#E2E2EA",
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#F4F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconX size={16} color="#6B7280" strokeWidth={2} />
          </Pressable>
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

// Main Screen
export default function WardrobeScreen() {
  const { onScroll: hideTabBarOnScroll } = useScrollToHideTabBar();
  const router = useRouter();
  const userItems = useUserWardrobeStore((state) => state.items);
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 50;

  const [activeFilters, setActiveFilters] = useState({
    category: "all",
    occasion: "all",
    season: "all",
    rating: 0,
  });
  const [tempFilters, setTempFilters] = useState({
    category: "all",
    occasion: "all",
    season: "all",
    rating: 0,
  });
  const [activeSort, setActiveSort] = useState<SortId>("recently_added");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [tempSort, setTempSort] = useState<SortId>("recently_added");

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, HEADER_HEIGHT],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.6, HEADER_HEIGHT],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  const displayItems = useMemo(
    () =>
      userItems.map((item): ClothingItem => ({
        id: item.id,
        name: item.customName || item.subCategory || item.category,
        category: item.category as CategoryId,
        color: item.primaryColor ?? "—",
        bgColor: "#F8F7FC",
        occasion: item.occasion?.[0] ?? "Casual",
        wears: item.wearCount ?? 0,
        isNew: true,
        image: item.imageUrl ?? `https://picsum.photos/seed/${item.id}/300/400`,
        seasons: item.season ?? [],
        occasions: item.occasion ?? [],
        rating: item.rating ?? 0,
      })),
    [userItems],
  );

  const filteredItems = useMemo(() => {
    let items = displayItems.filter((i) => {
      // Filter by category
      if (activeFilters.category !== "all") {
        const catStr = i.category.toLowerCase();
        const activeStr = activeFilters.category.toLowerCase();
        if (catStr !== activeStr) {
          const mapping = CATEGORY_MAPPING[activeStr] || [];
          if (!mapping.includes(i.category)) return false;
        }
      }

      // Filter by occasion
      if (
        activeFilters.occasion !== "all" &&
        !i.occasions.includes(activeFilters.occasion)
      ) {
        return false;
      }

      // Filter by season
      if (
        activeFilters.season !== "all" &&
        !i.seasons.includes(activeFilters.season)
      ) {
        return false;
      }

      // Filter by rating
      if (i.rating < activeFilters.rating) {
        return false;
      }

      return true;
    });

    if (activeSort === "name_az")
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    else if (activeSort === "most_worn")
      items = [...items].sort((a, b) => b.wears - a.wears);
    else if (activeSort === "least_worn")
      items = [...items].sort((a, b) => a.wears - b.wears);
    return items;
  }, [displayItems, activeFilters, activeSort]);

  const activeFiltersCount =
    (activeFilters.category !== "all" ? 1 : 0) +
    (activeFilters.occasion !== "all" ? 1 : 0) +
    (activeFilters.season !== "all" ? 1 : 0) +
    (activeFilters.rating > 0 ? 1 : 0);

  const categoryLabel =
    activeFiltersCount > 0 ? `${activeFiltersCount} Filters` : "All";
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === activeSort)?.label ?? "Recently added";
  const hasActiveFilter = activeFiltersCount > 0;

  const handleSaved = useCallback(
    () => router.push("/(root)/saved" as never),
    [router],
  );
  const openCategory = () => {
    setTempFilters(activeFilters);
    setIsCategoryOpen(true);
  };
  const openSort = () => {
    setTempSort(activeSort);
    setIsSortOpen(true);
  };

  const handleAddClothesGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      orderedSelection: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (result.assets.length === 1) {
        useOutfitAnalysisStore
          .getState()
          .startAnalysis(result.assets[0].uri, "scan-cloth");
        router.push("/(root)/(tabs)" as never);
      } else {
        router.push({
          pathname: "/(root)/add-clothes/batch-scan",
          params: {
            uris: JSON.stringify(result.assets.map((a) => a.uri)),
            mode: "cloth",
          },
        } as never);
      }
    }
  }, [router]);

  return (
    <SwipeTabWrapper tabIndex={1}>
      <PremiumGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              height: HEADER_HEIGHT,
              zIndex: 10,
              backgroundColor: "transparent",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 24,
                  color: "#1D1A27",
                  fontWeight: "800",
                }}
              >
                Wardrobe
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {/* <TouchableOpacity
                onPress={() => router.push("/(root)/calendar" as never)}
                activeOpacity={0.7}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#F8F7FC",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ExpoImage
                  source={{
                    uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
                  }}
                  style={{ width: 19, height: 19 }}
                  contentFit="contain"
                />
              </TouchableOpacity> */}

              <Pressable
                onPress={handleAddClothesGallery}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#F8F7FC",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconPlus size={20} color="#1D1A27" strokeWidth={1.8} />
              </Pressable>

              <Pressable
                onPress={handleSaved}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#F8F7FC",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconBookmark size={19} color="#1D1A27" strokeWidth={1.5} />
              </Pressable>
            </View>
          </View>

          {/* Filter Toolbar Row */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 6,
              paddingTop: 2,
              backgroundColor: "transparent",
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, alignItems: "center" }}
            >
              {/* Filter icon - blue dot when active */}
              <Pressable
                onPress={openCategory}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconAdjustmentsHorizontal
                  size={20}
                  color="#1D1A27"
                  strokeWidth={1.8}
                />
                {hasActiveFilter && (
                  <View
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#3B82F6",
                      borderWidth: 1.5,
                      borderColor: "#FFFFFF",
                    }}
                  />
                )}
              </Pressable>

              {/* Sort dropdown pill */}
              <Pressable
                onPress={openSort}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 50,
                  borderWidth: 1.5,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#FFFFFF",
                  height: 44,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#1D1A27",
                  }}
                >
                  {sortLabel}
                </Text>
                <IconChevronDown size={14} color="#6B7280" strokeWidth={2.5} />
              </Pressable>

              {/* Active filter removable chip */}
              {hasActiveFilter && (
                <Pressable
                  onPress={() =>
                    setActiveFilters({
                      category: "all",
                      occasion: "all",
                      season: "all",
                      rating: 0,
                    })
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 50,
                    borderWidth: 1.5,
                    borderColor: "#E2E2EA",
                    backgroundColor: "#F4F4F6",
                    height: 44,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#1D1A27",
                    }}
                  >
                    {categoryLabel}
                  </Text>
                  <IconX size={13} color="#6B7280" strokeWidth={2.5} />
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* Category Tabs Strip (plain text) */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#F0F0F0",
              marginBottom: 0,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 20,
                alignItems: "center",
              }}
            >
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeFilters.category === tab.value;
                return (
                  <Pressable
                    key={tab.value}
                    onPress={() =>
                      setActiveFilters({
                        ...activeFilters,
                        category: isActive ? "all" : (tab.value as any),
                      })
                    }
                    style={{ paddingBottom: 12, position: "relative" }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isActive ? "600" : "400",
                        color: isActive ? "#000000" : "#9B9BAF",
                      }}
                    >
                      {tab.label}
                    </Text>
                    {isActive && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -1,
                          left: 0,
                          right: 0,
                          height: 2,
                          backgroundColor: "#000000",
                        }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Grid */}
          <Animated.ScrollView
            key="grid-view"
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: hideTabBarOnScroll },
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 140, paddingTop: 12 }}
          >
            <View style={{ zIndex: 1, position: "relative" }}>
              {filteredItems.length === 0 ? (
                <EmptyState onAdd={handleAddClothesGallery} />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    paddingHorizontal: GRID_PADDING,
                    gap: GRID_GAP,
                  }}
                >
                  {filteredItems.map((item) => (
                    <BentoCard
                      key={item.id}
                      item={item}
                      width={ITEM_WIDTH}
                      height={ITEM_HEIGHT}
                    />
                  ))}
                </View>
              )}
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </PremiumGradientBackground>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        visible={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        title="Filters"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}
        >
          {/* Category Section */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              marginTop: 10,
              marginBottom: 8,
            }}
          >
            Category
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 16,
              gap: 10,
              paddingBottom: 16,
            }}
          >
            {FILTER_CHIPS.map((chip) => {
              const isActive = tempFilters.category === chip.value;
              return (
                <Pressable
                  key={chip.value}
                  onPress={() =>
                    setTempFilters({
                      ...tempFilters,
                      category: chip.value as any,
                    })
                  }
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 50,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Occasion Section */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              marginTop: 10,
              marginBottom: 8,
            }}
          >
            Occasion
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 16,
              gap: 10,
              paddingBottom: 16,
            }}
          >
            <Pressable
              onPress={() =>
                setTempFilters({ ...tempFilters, occasion: "all" })
              }
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 50,
                backgroundColor:
                  tempFilters.occasion === "all" ? "#1D1A27" : "#F4F4F6",
                borderWidth: tempFilters.occasion === "all" ? 0 : 1,
                borderColor: "#E2E2EA",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: tempFilters.occasion === "all" ? "#FFFFFF" : "#6B7280",
                }}
              >
                All Occasions
              </Text>
            </Pressable>
            {OCCASIONS.map((occ) => {
              const isActive = tempFilters.occasion === occ;
              return (
                <Pressable
                  key={occ}
                  onPress={() =>
                    setTempFilters({ ...tempFilters, occasion: occ })
                  }
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 50,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {occ}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Season Section */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              marginTop: 10,
              marginBottom: 8,
            }}
          >
            Season
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 16,
              gap: 10,
              paddingBottom: 16,
            }}
          >
            <Pressable
              onPress={() => setTempFilters({ ...tempFilters, season: "all" })}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 50,
                backgroundColor:
                  tempFilters.season === "all" ? "#1D1A27" : "#F4F4F6",
                borderWidth: tempFilters.season === "all" ? 0 : 1,
                borderColor: "#E2E2EA",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: tempFilters.season === "all" ? "#FFFFFF" : "#6B7280",
                }}
              >
                All Seasons
              </Text>
            </Pressable>
            {SEASONS.map((sea) => {
              const isActive = tempFilters.season === sea;
              return (
                <Pressable
                  key={sea}
                  onPress={() =>
                    setTempFilters({ ...tempFilters, season: sea })
                  }
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 50,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {sea}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Rating Section */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              marginTop: 10,
              marginBottom: 8,
            }}
          >
            Minimum Rating
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 16,
              gap: 10,
              paddingBottom: 16,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((rating) => {
              const isActive = tempFilters.rating === rating;
              return (
                <Pressable
                  key={`rating-${rating}`}
                  onPress={() => setTempFilters({ ...tempFilters, rating })}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 50,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {rating === 0 ? "Any Rating" : `${rating}+ Stars`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 20,
            paddingTop: 10,
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => {
              const defaultFilters = {
                category: "all",
                occasion: "all",
                season: "all",
                rating: 0,
              };
              setTempFilters(defaultFilters as any);
              setActiveFilters(defaultFilters as any);
              setIsCategoryOpen(false);
            }}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 18,
              backgroundColor: "#F4F4F6",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#1D1A27", fontSize: 15, fontWeight: "700" }}>
              Clear
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveFilters(tempFilters);
              setIsCategoryOpen(false);
            }}
            style={{
              flex: 2,
              paddingVertical: 16,
              borderRadius: 18,
              backgroundColor: "#1D1A27",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
              Apply Filters
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Sort Bottom Sheet */}
      <BottomSheet
        visible={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        title="Sort by"
      >
        <View
          style={{
            paddingHorizontal: 16,
            gap: 8,
            paddingTop: 4,
            paddingBottom: 24,
          }}
        >
          {SORT_OPTIONS.map((opt) => {
            const isActive = tempSort === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setTempSort(opt.value)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                  borderWidth: isActive ? 0 : 1,
                  borderColor: "#E2E2EA",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isActive ? "#FFFFFF" : "#6B7280",
                  }}
                >
                  {opt.label}
                </Text>
                {isActive && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => {
            setActiveSort(tempSort);
            setIsSortOpen(false);
          }}
          style={{
            marginHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 18,
            backgroundColor: "#1D1A27",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
            Apply Sort
          </Text>
        </Pressable>
      </BottomSheet>
    </SwipeTabWrapper>
  );
}
