import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { useSavedStore } from "@/features/wardrobe/model/saved-store";
import {
  subscribeToWardrobeRealtime,
  useUserWardrobeStore,
} from "@/features/wardrobe/model/user-wardrobe-store";
import { posthogAnalytics } from "@/shared/telemetry/posthog";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { SkeletonList } from "@/shared/ui/Skeleton";
import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";
import { useAuth } from "@clerk/clerk-expo";
import { FlashList } from "@shopify/flash-list";
import {
  IconAdjustmentsHorizontal,
  IconBeach,
  IconBriefcase,
  IconBuilding,
  IconChevronDown,
  IconClock,
  IconDiamond,
  IconHanger,
  IconLeaf,
  IconMoon,
  IconPlus,
  IconRun,
  IconShirt,
  IconShoe,
  IconSnowflake,
  IconStarFilled,
  IconSun,
  IconTrendingDown,
  IconTrendingUp,
  IconUmbrella,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  Modal,
  PanResponder,
  Pressable,
  Text as RNText,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Text = (props: any) => {
  const { style, ...rest } = props;
  const flatStyle = StyleSheet.flatten(style || {});
  let fontFamily = flatStyle.fontFamily || "BricolageGrotesque_400Regular";

  if (flatStyle.fontWeight === "500") fontFamily = "BricolageGrotesque_500Medium";
  else if (flatStyle.fontWeight === "600") fontFamily = "BricolageGrotesque_600SemiBold";
  else if (flatStyle.fontWeight === "700" || flatStyle.fontWeight === "bold") fontFamily = "BricolageGrotesque_700Bold";
  else if (flatStyle.fontWeight === "800") fontFamily = "BricolageGrotesque_800ExtraBold";

  const { fontWeight, ...cleanStyle } = flatStyle;
  return <RNText {...rest} style={[cleanStyle, { fontFamily }]} />;
};

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

// Types
type CategoryId =
  | "all"
  | "saved_fit_check"
  | "saved_virtual_try_on"
  | "saved_cloth_label"
  | "saved_ai_outfit"
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
  createdAt: string;
}

// Filter chips for bottom sheet
const FILTER_CHIPS: { label: string; value: CategoryId | "all" }[] = [
  { label: "All clothes", value: "all" },
  { label: "Fit check", value: "saved_fit_check" },
  { label: "Virtual try on", value: "saved_virtual_try_on" },
  { label: "Cloth label", value: "saved_cloth_label" },
  { label: "AI outfit", value: "saved_ai_outfit" },
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

// Tabs for the top horizontal scroll strip (only Saved items + All clothes)
const HORIZONTAL_TABS: { label: string; value: CategoryId | "all" }[] = [
  { label: "All clothes", value: "all" },
  { label: "Fit check", value: "saved_fit_check" },
  { label: "Virtual try on", value: "saved_virtual_try_on" },
  { label: "Cloth label", value: "saved_cloth_label" },
  { label: "AI outfit", value: "saved_ai_outfit" },
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
];

const SEASONS: string[] = ["Spring", "Summer", "Autumn", "Winter", "Monsoon"];

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
  onPress,
}: {
  item: ClothingItem;
  width: number;
  height: number;
  onPress?: () => void;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() =>
        onPress
          ? onPress()
          : router.push(`/(root)/cloth-details/${item.id}` as never)
      }
      style={{
        width,
        height,
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: "#00000010",
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
            recyclingKey={item.id}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: "#F3F4F6" }} />
        )}
      </View>
    </Pressable>
  );
});

// Grid item wrapper — keeps the press handler stable so React.memo on
// BentoCard can actually short-circuit re-renders when the row's data
// hasn't changed.
const WardrobeGridItem = React.memo(function WardrobeGridItem({
  item,
  onSavedPress,
}: {
  item: ClothingItem;
  onSavedPress: (image: string | null) => void;
}) {
  const handlePress = useCallback(() => {
    if (item.category.startsWith("saved_")) {
      onSavedPress(item.image ?? null);
    }
  }, [item.category, item.image, onSavedPress]);

  return (
    <View style={{ padding: GRID_GAP / 2 }}>
      <BentoCard
        item={item}
        width={ITEM_WIDTH}
        height={ITEM_HEIGHT}
        onPress={item.category.startsWith("saved_") ? handlePress : undefined}
      />
    </View>
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
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dy > 0 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

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
        <View {...panResponder.panHandlers} style={{ paddingBottom: 16 }}>
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
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const getCategoryIcon = (label: string, color: string) => {
  const size = 16;
  switch (label.toLowerCase()) {
    case "all clothes":
      return <IconHanger size={size} color={color} />;
    case "tops":
    case "jackets":
    case "hoodies":
    case "outerwear":
      return <IconShirt size={size} color={color} />;
    case "bottoms":
      return <IconHanger size={size} color={color} />;
    case "shoes":
      return <IconShoe size={size} color={color} />;
    case "bags":
    case "accessories":
      return <IconBriefcase size={size} color={color} />;
    case "dresses":
    case "ethnic":
      return <IconDiamond size={size} color={color} />;
    case "activewear":
    case "sportswear":
      return <IconRun size={size} color={color} />;
    case "formal":
      return <IconBuilding size={size} color={color} />;
    default:
      return null;
  }
};

const getOccasionIcon = (label: string, color: string) => {
  const size = 16;
  switch (label.toLowerCase()) {
    case "all occasions":
      return <IconHanger size={size} color={color} />;
    case "gym":
    case "sports":
    case "outdoor":
      return <IconRun size={size} color={color} />;
    case "beach":
    case "travel":
      return <IconBeach size={size} color={color} />;
    case "sleepwear":
    case "lounge":
      return <IconMoon size={size} color={color} />;
    case "office":
    case "interview":
    case "business casual":
      return <IconBuilding size={size} color={color} />;
    case "party":
    case "wedding":
    case "date night":
    case "festive":
      return <IconDiamond size={size} color={color} />;
    default:
      return null;
  }
};

const getSeasonIcon = (label: string, color: string) => {
  const size = 16;
  switch (label.toLowerCase()) {
    case "all seasons":
      return <IconLeaf size={size} color={color} />;
    case "summer":
      return <IconSun size={size} color={color} />;
    case "winter":
      return <IconSnowflake size={size} color={color} />;
    case "spring":
    case "autumn":
      return <IconLeaf size={size} color={color} />;
    case "monsoon":
      return <IconUmbrella size={size} color={color} />;
    default:
      return null;
  }
};

const getRatingIcon = (label: string, color: string) => {
  const size = 16;
  if (label.includes("Stars") || label === "Any Rating") {
    return <IconStarFilled size={size} color={color} />;
  }
  return null;
};

const getSortIcon = (value: string, color: string) => {
  const size = 18;
  switch (value) {
    case "recently_added":
      return <IconClock size={size} color={color} />;
    case "most_worn":
      return <IconTrendingUp size={size} color={color} />;
    case "least_worn":
      return <IconTrendingDown size={size} color={color} />;
    default:
      return null;
  }
};

// Main Screen
export default function WardrobeScreen() {
  React.useEffect(() => { posthogAnalytics.captureEvent("wardrobe_viewed"); }, []);
  const { onScroll: hideTabBarOnScroll } = useScrollToHideTabBar();
  const router = useRouter();
  const { userId } = useAuth();
  const userItems = useUserWardrobeStore((state) => state.items);
  const syncWithDatabase = useUserWardrobeStore(
    (state) => state.syncWithDatabase,
  );
  const isSyncing = useUserWardrobeStore((state) => state.isSyncing);
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 50;

  useEffect(() => {
    if (userId) {
      syncWithDatabase(userId);
      const unsubscribe = subscribeToWardrobeRealtime(userId);
      return () => {
        unsubscribe();
      };
    }
  }, [userId, syncWithDatabase]);

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
  const outfits = useSavedStore((state) => state.outfits);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [tempSort, setTempSort] = useState<SortId>("recently_added");
  const [selectedSavedImage, setSelectedSavedImage] = useState<string | null>(
    null,
  );

  const displayItems = useMemo(
    () =>
      userItems.map(
        (item): ClothingItem => ({
          id: item.id,
          name: item.customName || item.subCategory || item.category,
          category: item.category as CategoryId,
          color: item.primaryColor ?? "—",
          bgColor: "#F8F7FC",
          occasion: item.occasion?.[0] ?? "Casual",
          wears: item.wearCount ?? 0,
          isNew: true,
          image:
            item.imageUrl ?? `https://picsum.photos/seed/${item.id}/300/400`,
          seasons: item.season ?? [],
          occasions: item.occasion ?? [],
          rating: item.rating ?? 0,
          createdAt: item.createdAt || new Date(0).toISOString(),
        }),
      ),
    [userItems],
  );

  const handleSelectSavedImage = useCallback(
    (image: string | null) => setSelectedSavedImage(image),
    [],
  );

  const renderGridItem = useCallback(
    ({ item }: { item: ClothingItem }) => (
      <WardrobeGridItem item={item} onSavedPress={handleSelectSavedImage} />
    ),
    [handleSelectSavedImage],
  );

  // Combine and sort
  const combinedData = useMemo(() => {
    if (activeFilters.category.startsWith("saved_")) {
      const categoryLabel = activeFilters.category
        .replace("saved_", "")
        .replace(/_/g, " ");

      return outfits
        .filter((outfit) => {
          const tags = outfit.tags?.map((t) => t.toLowerCase()) ?? [];
          return (
            tags.includes(categoryLabel) ||
            outfit.occasion?.toLowerCase() === categoryLabel ||
            outfit.name.toLowerCase().includes(categoryLabel)
          );
        })
        .map((outfit) => ({
          id: outfit.id,
          name: outfit.name || categoryLabel,
          category: activeFilters.category as CategoryId,
          color: "—",
          bgColor: "#F8F7FC",
          occasion: outfit.occasion,
          wears: outfit.wears ?? 0,
          isNew: false,
          image: outfit.image,
          seasons: [],
          occasions: [],
          rating: 0,
          createdAt: new Date(0).toISOString(),
        }));
    }

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

    if (activeSort === "recently_added")
      items = [...items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (activeSort === "name_az")
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
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["#DDDCEA", "#FFFFFF"]}
          locations={[0, 0.2]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "transparent" }}
          edges={["top", "bottom"]}
        >
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
              marginBottom: 7,
              marginTop: 7,
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
              <Pressable
                onPress={handleAddClothesGallery}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#F8F7FC95",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconPlus size={20} color="#1D1A27" strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          {/* Filter Toolbar Row */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 10,
              paddingTop: 2,
              backgroundColor: "transparent",
              // marginBottom:5
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
                  borderWidth: 0.7,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#F8F7FC95",
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
                  borderWidth: 0.7,
                  borderColor: "#E2E2EA",
                  backgroundColor: "#F8F7FC95",
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
                    gap: 5,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 50,
                    borderWidth: 0,
                    backgroundColor: "#1D1A27",
                    height: 44,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#FFFFFF",
                      // marginRight:10
                    }}
                  >
                    {categoryLabel}
                  </Text>
                  <IconX size={13} color="#FFFFFF" strokeWidth={2.5} />
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
              {HORIZONTAL_TABS.map((tab) => {
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
                        fontSize: 14,
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
          <View style={{ flex: 1, zIndex: 1 }}>
            {combinedData.length === 0 ? (
              isSyncing ? (
                // First DB sync in flight — show placeholders instead of the
                // empty state, which would flash before the rows arrive.
                <SkeletonList count={6} cardHeight={140} />
              ) : (
                <Animated.ScrollView
                  showsVerticalScrollIndicator={false}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true, listener: hideTabBarOnScroll },
                  )}
                  scrollEventThrottle={16}
                >
                  <EmptyState onAdd={handleAddClothesGallery} />
                </Animated.ScrollView>
              )
            ) : (
              <AnimatedFlashList
                data={combinedData}
                key="grid-view"
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true, listener: hideTabBarOnScroll },
                )}
                scrollEventThrottle={16}
                contentContainerStyle={{
                  paddingBottom: 140,
                  paddingTop: 10,
                  paddingHorizontal: GRID_PADDING,
                }}
                numColumns={NUM_COLUMNS}
                renderItem={renderGridItem as any}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
      {/* Filter Bottom Sheet */}
      <BottomSheet
        visible={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        title="Filters"
      >
        <ScrollView
          style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
          // contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Section */}
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              marginTop: 10,
              // textAlign: "center",
              marginBottom: 13,
            }}
          >
            Category
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 16,
              // paddingVertical:12,
              justifyContent: "flex-start",
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
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 30,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  {getCategoryIcon(
                    chip.label,
                    isActive ? "#FFFFFF" : "#6B7280",
                  )}
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
              fontSize: 17,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              // textAlign: "center",
              marginTop: 10,
              marginBottom: 13,
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
              justifyContent: "flex-start",
              paddingBottom: 16,
            }}
          >
            <Pressable
              onPress={() =>
                setTempFilters({ ...tempFilters, occasion: "all" })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 30,
                backgroundColor:
                  tempFilters.occasion === "all" ? "#1D1A27" : "#F4F4F6",
                borderWidth: tempFilters.occasion === "all" ? 0 : 1,
                borderColor: "#E2E2EA",
              }}
            >
              {getOccasionIcon(
                "all occasions",
                tempFilters.occasion === "all" ? "#FFFFFF" : "#6B7280",
              )}
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
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 50,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  {getOccasionIcon(occ, isActive ? "#FFFFFF" : "#6B7280")}
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
              fontSize: 17,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              marginTop: 10,
              marginBottom: 13,
              textAlign: "center",
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
              justifyContent: "center",
              paddingBottom: 16,
            }}
          >
            <Pressable
              onPress={() => setTempFilters({ ...tempFilters, season: "all" })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 50,
                backgroundColor:
                  tempFilters.season === "all" ? "#1D1A27" : "#F4F4F6",
                borderWidth: tempFilters.season === "all" ? 0 : 1,
                borderColor: "#E2E2EA",
              }}
            >
              {getSeasonIcon(
                "all seasons",
                tempFilters.season === "all" ? "#FFFFFF" : "#6B7280",
              )}
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
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 50,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  {getSeasonIcon(sea, isActive ? "#FFFFFF" : "#6B7280")}
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
              fontSize: 17,
              fontWeight: "600",
              color: "#1D1A27",
              paddingHorizontal: 16,
              marginTop: 10,
              marginBottom: 13,
              textAlign: "center",
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
              justifyContent: "center",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((rating) => {
              const isActive = tempFilters.rating === rating;
              return (
                <Pressable
                  key={`rating-${rating}`}
                  onPress={() => setTempFilters({ ...tempFilters, rating })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 50,
                    backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                    borderWidth: isActive ? 0 : 1,
                    borderColor: "#E2E2EA",
                  }}
                >
                  {getRatingIcon(
                    rating === 0 ? "Any Rating" : `${rating}+ Stars`,
                    isActive ? "#FFFFFF" : "#6B7280",
                  )}
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
            paddingTop: 15,
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
              borderRadius: 30,
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
            paddingHorizontal: 20,
            gap: 8,
            // paddingTop: 4,
            paddingBottom: 20,
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
                  paddingVertical: 16,
                  borderRadius: 14,
                  backgroundColor: isActive ? "#1D1A27" : "#F4F4F6",
                  borderWidth: isActive ? 0 : 1,
                  borderColor: "#E2E2EA",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {getSortIcon(opt.value, isActive ? "#FFFFFF" : "#6B7280")}
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
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

      {/* Image Viewer Modal */}
      <Modal
        visible={!!selectedSavedImage}
        transparent={true}
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => setSelectedSavedImage(null)}
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              padding: 8,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 20,
            }}
          >
            <IconX size={24} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
          {selectedSavedImage && (
            <ExpoImage
              source={{ uri: selectedSavedImage }}
              style={{ width: "100%", height: "80%" }}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </SwipeTabWrapper>
  );
}
