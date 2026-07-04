
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { useUser } from "@clerk/clerk-expo";
import {
  IconBookmark,
  IconCamera,
  IconChevronRight,
  IconHanger,
  IconPlus,
  IconShirt,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";

import { WardrobeActivityData } from "@/features/wardrobe/ui/WardrobeActivityTracker";
import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";

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
const GRID_GAP = 10;
const GRID_PADDING = 19;

const CONTENT_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
// Subtract a tiny bit to prevent wrapping issues due to pixel rounding
const ITEM_WIDTH = (CONTENT_WIDTH - GRID_GAP * 1) / 2 - 0.1;
const ITEM_HEIGHT = ITEM_WIDTH * 1.35; // taller aspect ratio for better look

const CATEGORIES: CategoryChip[] = [
  { id: "all", label: "All" },
  { id: "top", label: "Tops" },
  { id: "bottoms", label: "Bottoms" },
  { id: "accessory", label: "Accessories" },
];

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

// ─── Sub-Components ──────────────────────────────────────────────────────────

const CategoryFilter = React.memo(function CategoryFilter({
  active,
  onSelect,
  onAddPress,
}: {
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
  onAddPress?: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 2,
      }}
      style={{ marginBottom: 16 }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === active;
        const chip = (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={{
              backgroundColor: isActive ? "#1D1A27" : "#FFFFFF",
              borderRadius: 25,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderWidth: 0.5,
              borderColor: "#F0EEF8",
              minWidth: 10,
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

        return chip;
      })}
    </ScrollView>
  );
});

// ─── Bento grid card ───────────────────────────────────────────────────

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
  const bg = CATEGORY_BG[item.category] || "#F0EEF8";
  return (
    <Pressable
      onPress={() => router.push(`/(root)/cloth-details/${item.id}` as never)}
      style={{
        width,
        height,
        borderRadius: 20,
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

// ─── Empty state ───

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
      {/* <View
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
      </View> */}
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

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WardrobeScreen() {
  const { onScroll: hideTabBarOnScroll } = useScrollToHideTabBar();
  const router = useRouter();
  const { user } = useUser();
  const userItems = useUserWardrobeStore((state) => state.items);

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 90;

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
  const [showAddMenu, setShowAddMenu] = useState(false);
  const panY = useRef(new Animated.Value(400)).current;

  // Trigger slide up when showAddMenu becomes true
  useEffect(() => {
    if (showAddMenu) {
      panY.setValue(400); // Start off-screen
      Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showAddMenu]);

  const handleClose = useCallback(() => {
    Animated.timing(panY, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowAddMenu(false);
      panY.setValue(400);
    });
  }, [panY]);

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: 400,
    duration: 200,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderGrant: () => {
        panY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.4) {
          closeAnim.start(() => {
            setShowAddMenu(false);
            panY.setValue(400);
          });
        } else {
          resetPositionAnim.start();
        }
      },
    }),
  ).current;

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");

  const allItems = useMemo(() => {
    return userItems.map(
      (item): ClothingItem => ({
        id: item.id,
        name: item.customName || item.subCategory || item.category,
        category: item.category as CategoryId,
        color: item.primaryColor ?? "—",
        bgColor: "#F8F7FC",
        occasion: item.occasion?.[0] ?? "Casual",
        wears: item.wearCount ?? 0,
        isNew: true,
        image: item.imageUrl ?? `https://picsum.photos/seed/${item.id}/300/400`,
      }),
    );
  }, [userItems]);
  const ADD_MENU_OPTIONS = [
    {
      id: "scan",
      label: "Scan and Add Cloth",
      subtitle: "Scan items or pick from gallery",
      icon: IconCamera,
      color: "#00000090",
      bg: "#F5F3FF",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/log-outfit/camera" as never);
      },
    },
    {
      id: "add_clothing",
      label: "Add Cloth",
      subtitle: "Add clothing items manually",
      icon: IconShirt,
      color: "#00000090",
      bg: "#F5F3FF",
      onPress: () => {
        setShowAddMenu(false);
        router.push({
          pathname: "/(root)/add-clothes/form",
          params: { mode: "manual" },
        } as never);
      },
    },
    {
      id: "outfit",
      label: "Create Outfit",
      subtitle: "Combine pieces into an outfit",
      icon: IconHanger,
      color: "#00000090",
      bg: "#F5F3FF",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/outfits/create" as never);
      },
    },
  ];

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return allItems;
    return allItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, allItems]);

  const displayItems = useMemo(() => filteredItems, [filteredItems]);

  // ── Wardrobe-specific stats for Activity Tracker ──
  const totalItems = allItems.length;
  const wornItems = allItems.filter((i) => i.wears > 0).length;
  const unwornItems = Math.max(totalItems - wornItems, 0);

  const trackerData: WardrobeActivityData = useMemo(
    () => ({
      weekly: [
        { day: "Thu", isToday: false, progress: 0.8, color: "#000000" },
        { day: "Fri", isToday: false, progress: 0.6, color: "#000000" },
        { day: "Sat", isToday: false, progress: 0.9, color: "#000000" },
        { day: "Sun", isToday: true, progress: 0.75, color: "#000000" },
        { day: "Mon", isToday: false, progress: 0.4, color: "#000000" },
        { day: "Tue", isToday: false, progress: 0.5, color: "#000000" },
        { day: "Wed", isToday: false, progress: 0.85, color: "#000000" },
      ],
      today: {
        totalWorn: wornItems,
        totalGoal: Math.max(totalItems, 1),
        wornCount: wornItems,
        wornGoal: Math.max(totalItems, 1),
        totalClothesCount: totalItems,
        totalClothesGoal: Math.max(totalItems, 1),
        unwornCount: unwornItems,
        unwornGoal: Math.max(totalItems, 1),
      },
    }),
    [totalItems, wornItems, unwornItems],
  );

  const handleAddClothes = useCallback(() => {
    setShowAddMenu(true);
  }, []);

  const handleSaved = useCallback(() => {
    router.push("/(root)/saved" as never);
  }, [router]);

  const handleCategorySelect = useCallback((id: CategoryId) => {
    setActiveCategory(id);
  }, []);

  const listHeader = null;
  return (
    <SwipeTabWrapper tabIndex={1}>
      <AppGradientBackground>
        <StatusBar style={showAddMenu ? "light" : "dark"} />
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
            {/* ── Header ── */}
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
                  style={{ height: 70, width: 224, marginLeft: -40 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/(root)/calendar" as never)}
                  activeOpacity={0.7}
                  className="flex-row items-center rounded-full border border-[#E2E2EA] bg-[#F8F7FC] p-[9.9px]"
                >
                  <ExpoImage
                    source={{
                      uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
                    }}
                    style={{ width: 21, height: 21 }}
                    contentFit="contain"
                  />
                </TouchableOpacity>

                <Pressable
                  onPress={handleSaved}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#F8F7FC",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  <IconBookmark size={20} color="#000000" strokeWidth={1.5} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Scrollable content — scrolls over the header */}
            <View style={{ zIndex: 1, position: "relative" }}>
              {/* ── Add Menu Modal ── */}
              <Modal
                visible={showAddMenu}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
                statusBarTranslucent
              >
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    justifyContent: "flex-end",
                  }}
                  onPress={handleClose}
                >
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={{
                      transform: [{ translateY: panY }],
                    }}
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
                                <Icon
                                  size={22}
                                  color={opt.color}
                                  strokeWidth={2}
                                />
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
                  </Animated.View>
                </Pressable>
              </Modal>

              {/* ── Content ── */}
              {listHeader}

              {displayItems.length === 0 ? (
                <EmptyState
                  onAdd={() =>
                    router.push("/(root)/log-outfit/camera" as never)
                  }
                />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: GRID_PADDING,
                    justifyContent: "space-between",
                  }}
                >
                  {/* Left Column */}
                  <View style={{ width: ITEM_WIDTH }}>
                    {displayItems
                      .filter((_, i) => i % 2 === 0)
                      .map((item, i) => {
                        const heightMultiplier = i % 2 === 0 ? 1.4 : 1.1;
                        return (
                          <BentoCard
                            key={item.id}
                            item={item}
                            width={ITEM_WIDTH}
                            height={ITEM_WIDTH * heightMultiplier}
                          />
                        );
                      })}
                  </View>
                  {/* Right Column */}
                  <View style={{ width: ITEM_WIDTH }}>
                    {displayItems
                      .filter((_, i) => i % 2 === 1)
                      .map((item, i) => {
                        const heightMultiplier = i % 2 === 0 ? 1.1 : 1.5;
                        return (
                          <BentoCard
                            key={item.id}
                            item={item}
                            width={ITEM_WIDTH}
                            height={ITEM_WIDTH * heightMultiplier}
                          />
                        );
                      })}
                  </View>
                </View>
              )}
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
