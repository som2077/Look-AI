import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
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
  TouchableOpacity,
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

const SORT_OPTIONS: { label: string; value: SortId }[] = [
  { label: "Recently added", value: "recently_added" },
  { label: "Name A–Z", value: "name_az" },
  { label: "Most worn", value: "most_worn" },
  { label: "Least worn", value: "least_worn" },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 8;
const GRID_PADDING = 16;
const CONTENT_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
const ITEM_WIDTH =
  (CONTENT_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS - 0.01;
const ITEM_HEIGHT = ITEM_WIDTH;

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
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
      }}
    >
      {item.image ? (
        <ExpoImage
          source={{ uri: item.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: "#F3F4F6" }} />
      )}
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
        paddingVertical: 60,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: "#F8F7FC",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#E9EBF8",
        }}
      >
        <IconHanger size={36} color="#9CA3AF" strokeWidth={1.5} />
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
          color: "#9B9BAF",
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

  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">(
    "all",
  );
  const [activeSort, setActiveSort] = useState<SortId>("recently_added");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState<CategoryId | "all">("all");
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
      })),
    [userItems],
  );

  const filteredItems = useMemo(() => {
    let items =
      activeCategory === "all"
        ? displayItems
        : displayItems.filter((i) => i.category === activeCategory);
    if (activeSort === "name_az")
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    else if (activeSort === "most_worn")
      items = [...items].sort((a, b) => b.wears - a.wears);
    else if (activeSort === "least_worn")
      items = [...items].sort((a, b) => a.wears - b.wears);
    return items;
  }, [displayItems, activeCategory, activeSort]);

  const categoryLabel =
    FILTER_CHIPS.find((c) => c.value === activeCategory)?.label ?? "All";
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === activeSort)?.label ?? "Recently added";
  const hasActiveFilter = activeCategory !== "all";

  const handleSaved = useCallback(
    () => router.push("/(root)/saved" as never),
    [router],
  );
  const openCategory = () => {
    setTempCategory(activeCategory);
    setIsCategoryOpen(true);
  };
  const openSort = () => {
    setTempSort(activeSort);
    setIsSortOpen(true);
  };

  return (
    <SwipeTabWrapper tabIndex={1}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <Animated.ScrollView
            key="grid-view"
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: hideTabBarOnScroll },
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {/* Header */}
            <Animated.View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 25,
                height: HEADER_HEIGHT,
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity,
                zIndex: 0,
              }}
            >
              <View>
                <ExpoImage
                  source={require("@/assets/images/getStartedLogo.png")}
                  style={{ height: 56, width: 180, marginLeft: -32 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
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
                </TouchableOpacity>
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
            </Animated.View>

            {/* Filter Toolbar Row */}
            <View
              style={{ paddingHorizontal: 16, paddingBottom: 6, paddingTop: 2 }}
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
                  <IconChevronDown
                    size={14}
                    color="#6B7280"
                    strokeWidth={2.5}
                  />
                </Pressable>

                {/* Active filter removable chip */}
                {hasActiveFilter && (
                  <Pressable
                    onPress={() => setActiveCategory("all")}
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
            <View style={{ paddingBottom: 12 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  gap: 20,
                  alignItems: "center",
                }}
              >
                {CATEGORY_TABS.map((tab) => {
                  const isActive = activeCategory === tab.value;
                  return (
                    <Pressable
                      key={tab.value}
                      onPress={() =>
                        setActiveCategory(isActive ? "all" : tab.value)
                      }
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? "700" : "400",
                          color: isActive ? "#1D1A27" : "#9B9BAF",
                        }}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Grid */}
            <View style={{ zIndex: 1, position: "relative" }}>
              {filteredItems.length === 0 ? (
                <EmptyState
                  onAdd={() =>
                    router.push("/(root)/log-outfit/camera" as never)
                  }
                />
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
      </AppGradientBackground>

      {/* Category Bottom Sheet */}
      <BottomSheet
        visible={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        title="Filter by Category"
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: 16,
            gap: 10,
            paddingTop: 4,
            paddingBottom: 24,
          }}
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = tempCategory === chip.value;
            return (
              <Pressable
                key={chip.value}
                onPress={() => setTempCategory(chip.value)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
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
        <Pressable
          onPress={() => {
            setActiveCategory(tempCategory);
            setIsCategoryOpen(false);
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
            Apply Filter
          </Text>
        </Pressable>
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
