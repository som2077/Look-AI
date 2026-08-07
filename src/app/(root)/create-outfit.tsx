import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconAdjustmentsHorizontal,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBeach,
  IconBriefcase,
  IconBuilding,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconDiamond,
  IconEye,
  IconEyeOff,
  IconHanger,
  IconLeaf,
  IconMoon,
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
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { FlipHorizontal2, Type } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { CanvasImageItem } from "../../features/outfits/ui/canvas/CanvasImageItem";
import { CanvasTextItem } from "../../features/outfits/ui/canvas/CanvasTextItem";
import { CanvasItemData } from "../../features/outfits/ui/canvas/types";

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

type SortId = "recently_added" | "name_az" | "most_worn" | "least_worn";

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

const SORT_OPTIONS: { label: string; value: SortId }[] = [
  { label: "Recently added", value: "recently_added" },
  { label: "Most worn", value: "most_worn" },
  { label: "Least worn", value: "least_worn" },
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 0;
const GRID_PADDING = 0;
const CONTENT_WIDTH = SCREEN_WIDTH;
const ITEM_WIDTH = CONTENT_WIDTH / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.25;

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
          zIndex: 999,
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

// Canvas items extracted to features/outfits/ui/canvas

export default function CreateOutfitScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();

  const items = useUserWardrobeStore((state) => state.items);
  const initialItem = items.find((item) => item.id === itemId);

  // States for filtering and sorting
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

  // Canvas Interactions
  const [canvasItems, setCanvasItems] = useState<CanvasItemData[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem && canvasItems.length === 0) {
      const initialId = `${initialItem.id}-initial`;
      setCanvasItems([
        {
          id: initialId,
          type: "image",
          image: initialItem.imageUrl ?? "",
          flipValue: 1,
          zIndex: 1,
        },
      ]);
      setActiveItemId(initialId);
    }
  }, [initialItem]);

  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [ratio, setRatio] = useState<"3:4" | "1:1">("3:4");
  const viewRef = useRef<any>(null);

  const captureAndNavigate = async () => {
    setIsFocused(false);
    // Wait for the blue active borders to hide before taking snapshot
    setTimeout(async () => {
      try {
        const uri = await captureRef(viewRef, {
          format: "png",
          quality: 1,
        });

        const itemIds = canvasItems.map((i) => i.id).join(",");
        router.push({
          pathname: "/plan-outfit",
          params: { imageUri: uri, itemIds, ratio },
        });
      } catch (e) {
        console.error("Capture failed", e);
      }
    }, 100);
  };

  // Text Canvas Interactions (Removed single text state)

  // Bottom Sheet Interactions
  const { width: screenW, height: screenH } = Dimensions.get("window");

  // Calculate dynamic down position based on ratio
  const canvasW = screenW - 40; // canvasContainer has paddingHorizontal: 20
  const canvasH = ratio === "3:4" ? canvasW * (4 / 3) : canvasW;
  const dynamicDownPosition = canvasH + 10; // 20px gap (canvas bottom is at ~60+canvasH, sheet top is 70, offset needed is canvasH+10)

  const downPositionRef = useRef(dynamicDownPosition);
  const sheetY = useRef(new Animated.Value(dynamicDownPosition)).current;
  const sheetOffset = useRef(dynamicDownPosition);

  useEffect(() => {
    downPositionRef.current = dynamicDownPosition;
    // If the sheet is currently in the "down" position (not 0), update it instantly
    if (sheetOffset.current !== 0) {
      sheetOffset.current = dynamicDownPosition;
      Animated.spring(sheetY, {
        toValue: dynamicDownPosition,
        useNativeDriver: false,
      }).start();
    }
  }, [dynamicDownPosition, sheetY]);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        sheetY.setOffset(sheetOffset.current);
        sheetY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dy: sheetY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gestureState) => {
        sheetY.flattenOffset();
        const currentY = (sheetY as any)._value;
        const currentDownPos = downPositionRef.current;

        // Snap down to dynamic position if dragged down, or if already past halfway and not dragged up much
        if (
          gestureState.dy > 40 ||
          (currentY > currentDownPos / 2 && gestureState.dy > -40)
        ) {
          sheetOffset.current = currentDownPos;
        } else {
          // Snap up right below the header
          sheetOffset.current = 0;
        }

        Animated.spring(sheetY, {
          toValue: sheetOffset.current,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  const [bottomSheetMode, setBottomSheetMode] = useState<"wardrobe" | "text">(
    "wardrobe",
  );

  const handleFlip = () => {
    if (activeItemId) {
      setCanvasItems((prev) =>
        prev.map((item) =>
          item.id === activeItemId
            ? { ...item, flipValue: item.flipValue === 1 ? -1 : 1 }
            : item,
        ),
      );
    }
  };

  // Handlers for canvas items
  const handleFocus = (id: string) => {
    setActiveItemId(id);
    setIsFocused(true);
    const activeItem = canvasItems.find((i) => i.id === id);
    if (activeItem?.type === "text") {
      setBottomSheetMode("text");
    } else {
      setBottomSheetMode("wardrobe");
    }
  };

  const handleDelete = (id: string) => {
    setCanvasItems((prev) => prev.filter((item) => item.id !== id));
    if (activeItemId === id) setActiveItemId(null);
  };

  const handleTextChange = (id: string, text: string) => {
    setCanvasItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  };

  const updateActiveItem = (updates: Partial<CanvasItemData>) => {
    if (activeItemId) {
      setCanvasItems((prev) =>
        prev.map((item) =>
          item.id === activeItemId ? { ...item, ...updates } : item,
        ),
      );
    }
  };

  const activeItem = canvasItems.find((i) => i.id === activeItemId);
  const isTextActive = activeItem?.type === "text";

  const displayItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.customName || item.subCategory || item.category,
        category: item.category as CategoryId,
        brand: item.brand || "No Brand",
        date: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : "7/4/2026",
        wears: item.wearCount ?? 0,
        image: item.imageUrl ?? `https://picsum.photos/seed/${item.id}/300/400`,
        seasons: item.season ?? [],
        occasions: item.occasion ?? [],
        rating: item.rating ?? 0,
        createdAt: item.createdAt || new Date(0).toISOString(),
      })),
    [items],
  );

  const filteredItems = useMemo(() => {
    let _items = displayItems.filter((i: any) => {
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
      _items = [..._items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    else if (activeSort === "name_az")
      _items = [..._items].sort((a, b) => a.name.localeCompare(b.name));
    else if (activeSort === "most_worn")
      _items = [..._items].sort((a, b) => b.wears - a.wears);
    else if (activeSort === "least_worn")
      _items = [..._items].sort((a, b) => a.wears - b.wears);
    return _items;
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.navigate("/(tabs)/wardrobe" as any)}
            style={styles.closeButton}
          >
            <IconX size={22} color="#1D1A27" />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={() => setIsPreview((p) => !p)}
              style={styles.previewButton}
            >
              {isPreview ? (
                <IconEyeOff size={20} color="#1D1A27" />
              ) : (
                <IconEye size={20} color="#1D1A27" />
              )}
            </Pressable>
            <Pressable style={styles.nextButton} onPress={captureAndNavigate}>
              <Text style={styles.nextButtonText}>Next</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Top Ratio Picker (Preview Mode) ── */}
        {isPreview && (
          <View style={styles.topRatioPicker}>
            <Pressable
              onPress={() => setRatio("3:4")}
              style={styles.topRatioBtn}
            >
              <View
                style={[
                  styles.ratioIconSimple,
                  { width: 14, height: 18 },
                  ratio === "3:4" && styles.ratioIconSimpleActive,
                ]}
              />
              <Text
                style={[
                  styles.ratioLabelSimple,
                  ratio === "3:4" && styles.ratioLabelSimpleActive,
                ]}
              >
                3:4
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRatio("1:1")}
              style={styles.topRatioBtn}
            >
              <View
                style={[
                  styles.ratioIconSimple,
                  { width: 18, height: 18 },
                  ratio === "1:1" && styles.ratioIconSimpleActive,
                ]}
              />
              <Text
                style={[
                  styles.ratioLabelSimple,
                  ratio === "1:1" && styles.ratioLabelSimpleActive,
                ]}
              >
                1:1
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Canvas Area ── */}
        <View style={styles.canvasContainer}>
          {/* Canvas Wrapper sets the dimensions so absolute overlay matches perfectly */}
          <View
            style={{
              width: "100%",
              aspectRatio: ratio === "3:4" ? 3 / 4 : 1,
              position: "relative",
            }}
          >
            <View ref={viewRef} style={{ flex: 1 }} collapsable={false}>
              <Pressable
                style={[styles.canvas, { aspectRatio: undefined, flex: 1 }]}
                onPress={() => {
                  Keyboard.dismiss();
                  setIsFocused(false);
                  setBottomSheetMode("wardrobe");

                  // If the active item is text and empty, delete it when tapping outside
                  if (activeItem?.type === "text" && !activeItem.text?.trim()) {
                    handleDelete(activeItem.id);
                  }
                }}
              >
                {canvasItems.map((item) => {
                  if (item.type === "text") {
                    return (
                      <CanvasTextItem
                        key={item.id}
                        item={item}
                        isActive={activeItemId === item.id && isFocused}
                        isPreview={isPreview}
                        onFocus={handleFocus}
                        onDelete={handleDelete}
                        onTextChange={handleTextChange}
                      />
                    );
                  } else {
                    return (
                      <CanvasImageItem
                        key={item.id}
                        item={item}
                        isActive={activeItemId === item.id && isFocused}
                        isPreview={isPreview}
                        onFocus={handleFocus}
                        onDelete={handleDelete}
                      />
                    );
                  }
                })}
              </Pressable>
            </View>

            {/* Floating Toolbar (now outside canvas, hidden in preview) */}
            {!isPreview && (
              <View
                style={[
                  styles.floatingToolbar,
                  { left: "50%", transform: [{ translateX: -48 }] },
                ]}
              >
                <Pressable
                  style={styles.toolbarIcon}
                  onPress={() => {
                    if (bottomSheetMode === "text" && isFocused) {
                      setBottomSheetMode("wardrobe");
                    } else {
                      const newId = `text-${Date.now()}`;
                      setCanvasItems((prev) => [
                        ...prev,
                        {
                          id: newId,
                          type: "text",
                          text: "",
                          color: "#000000",
                          fontWeight: "700",
                          align: "center",
                          flipValue: 1,
                          zIndex: prev.length + 1,
                        },
                      ]);
                      setActiveItemId(newId);
                      setIsFocused(true);
                      setBottomSheetMode("text");

                      if (sheetOffset.current === 0) {
                        sheetOffset.current = downPositionRef.current;
                        Animated.spring(sheetY, {
                          toValue: downPositionRef.current,
                          useNativeDriver: false,
                        }).start();
                      }
                    }
                  }}
                >
                  <Type size={22} color="#4B5563" />
                </Pressable>
                <Pressable style={styles.toolbarIcon} onPress={handleFlip}>
                  <FlipHorizontal2 size={22} color="#4B5563" />
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* ── Bottom Panel (Wardrobe & Text Options) ── */}
        {!isPreview ? (
          <Animated.View
            style={[
              styles.bottomPanel,
              { transform: [{ translateY: sheetY }] },
            ]}
          >
            {/* Drag Handle Area */}
            <View
              {...sheetPanResponder.panHandlers}
              style={{ width: "100%", paddingVertical: 4 }}
            >
              <View style={styles.dragHandle} />
            </View>

            {bottomSheetMode === "wardrobe" ? (
              <>
                {/* Filters Row */}
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingBottom: 6,
                    paddingTop: 2,
                  }}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, alignItems: "center" }}
                  >
                    {/* Filter icon button - shows blue dot when active */}
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
                    borderBottomColor: "#00000010",
                  }}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: 16,
                      gap: 24,
                      alignItems: "center",
                    }}
                  >
                    {CATEGORY_TABS.map((tab) => {
                      const isActive = activeFilters.category === tab.value;
                      return (
                        <Pressable
                          key={tab.value}
                          onPress={() =>
                            setActiveFilters((prev) => ({
                              ...prev,
                              category: isActive ? "all" : tab.value,
                            }))
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

                {/* Clothes Grid */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 140 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      paddingHorizontal: GRID_PADDING,
                      gap: GRID_GAP,
                    }}
                  >
                    {filteredItems.map((item: any) => (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          const newItemId = `${item.id}-${Date.now()}`;
                          setCanvasItems((prev) => [
                            ...prev,
                            {
                              id: newItemId,
                              type: "image",
                              image: item.image ?? "",
                              flipValue: 1,
                              zIndex: prev.length + 1,
                            },
                          ]);
                          setActiveItemId(newItemId);
                        }}
                        style={{
                          width: ITEM_WIDTH,
                          height: ITEM_HEIGHT,
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
                            />
                          ) : (
                            <View
                              style={{ flex: 1, backgroundColor: "#F3F4F6" }}
                            />
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Scroll to Top FAB */}
                <Pressable style={styles.fab}>
                  <IconChevronUp size={24} color="#1D1A27" />
                </Pressable>
              </>
            ) : (
              // Text Options
              <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                {/* Editing State */}
                <View>
                  {/* Text Color */}
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#1D1A27",
                      marginBottom: 12,
                    }}
                  >
                    Text Color
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
                  >
                    {[
                      "#000000",
                      "#FFFFFF",
                      "#3B82F6",
                      "#22C55E",
                      "#EAB308",
                      "#F97316",
                      "#EF4444",
                      "#EC4899",
                      "#A855F7",
                    ].map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => updateActiveItem({ color: c })}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: c,
                          borderWidth:
                            (activeItem?.color ?? "#000000") === c ? 2 : 1,
                          borderColor:
                            (activeItem?.color ?? "#000000") === c
                              ? c === "#000000"
                                ? "#4B5563"
                                : "#1D1A27"
                              : "#E2E2EA",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {(activeItem?.color ?? "#000000") === c &&
                          c === "#FFFFFF" && (
                            <View
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor: "#1D1A27",
                              }}
                            />
                          )}
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Font & Alignment Row */}
                  <View
                    style={{ flexDirection: "row", gap: 32, paddingBottom: 32 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#1D1A27",
                          marginBottom: 12,
                        }}
                      >
                        Font
                      </Text>
                      <View style={{ flexDirection: "row", gap: 16 }}>
                        <Pressable
                          onPress={() =>
                            updateActiveItem({
                              fontWeight: "400",
                              fontStyle: "normal",
                            })
                          }
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontFamily: "TikTokSans16pt-Regular",
                              opacity:
                                (activeItem?.fontWeight ?? "700") === "400" &&
                                (activeItem?.fontStyle ?? "normal") === "normal"
                                  ? 1
                                  : 0.4,
                              color: "#1D1A27",
                            }}
                          >
                            Aa
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            updateActiveItem({
                              fontWeight: "700",
                              fontStyle: "normal",
                            })
                          }
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontFamily: "TikTokSans16pt-Bold",
                              opacity:
                                (activeItem?.fontWeight ?? "700") === "700" &&
                                (activeItem?.fontStyle ?? "normal") === "normal"
                                  ? 1
                                  : 0.4,
                              color: "#1D1A27",
                            }}
                          >
                            Aa
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            updateActiveItem({
                              fontWeight: "400",
                              fontStyle: "italic",
                            })
                          }
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontFamily: "TikTokSans16pt-RegularItalic",
                              opacity:
                                (activeItem?.fontStyle ?? "normal") === "italic"
                                  ? 1
                                  : 0.4,
                              color: "#1D1A27",
                            }}
                          >
                            Aa
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#1D1A27",
                          marginBottom: 12,
                        }}
                      >
                        Alignment
                      </Text>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <Pressable
                          onPress={() => updateActiveItem({ align: "left" })}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              (activeItem?.align ?? "center") === "left"
                                ? "#1D1A27"
                                : "#F3F4F6",
                          }}
                        >
                          <IconAlignLeft
                            size={20}
                            color={
                              (activeItem?.align ?? "center") === "left"
                                ? "#FFFFFF"
                                : "#4B5563"
                            }
                            strokeWidth={2}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => updateActiveItem({ align: "center" })}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              (activeItem?.align ?? "center") === "center"
                                ? "#1D1A27"
                                : "#F3F4F6",
                          }}
                        >
                          <IconAlignCenter
                            size={20}
                            color={
                              (activeItem?.align ?? "center") === "center"
                                ? "#FFFFFF"
                                : "#4B5563"
                            }
                            strokeWidth={2}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => updateActiveItem({ align: "right" })}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              (activeItem?.align ?? "center") === "right"
                                ? "#1D1A27"
                                : "#F3F4F6",
                          }}
                        >
                          <IconAlignRight
                            size={20}
                            color={
                              (activeItem?.align ?? "center") === "right"
                                ? "#FFFFFF"
                                : "#4B5563"
                            }
                            strokeWidth={2}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        ) : (
          // Preview Mode Pill Toolbar (Clean T/Flip Toolbar)
          <View style={styles.pillToolbarWrapper}>
            <View style={styles.pillToolbar}>
              <Pressable
                style={styles.toolbarIcon}
                onPress={() => {
                  if (bottomSheetMode === "text" && isFocused) {
                    setBottomSheetMode("wardrobe");
                  } else {
                    const newId = `text-${Date.now()}`;
                    setCanvasItems((prev) => [
                      ...prev,
                      {
                        id: newId,
                        type: "text",
                        text: "",
                        color: "#000000",
                        fontWeight: "700",
                        align: "center",
                        flipValue: 1,
                        zIndex: prev.length + 1,
                      },
                    ]);
                    setActiveItemId(newId);
                    setIsFocused(true);
                    setBottomSheetMode("text");

                    if (sheetOffset.current === 0) {
                      sheetOffset.current = downPositionRef.current;
                      Animated.spring(sheetY, {
                        toValue: downPositionRef.current,
                        useNativeDriver: false,
                      }).start();
                    }
                  }
                }}
              >
                <Type size={22} color="#4B5563" />
              </Pressable>
              <Pressable style={styles.toolbarIcon} onPress={handleFlip}>
                <FlipHorizontal2 size={22} color="#4B5563" />
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        visible={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        title="Filters"
      >
        <ScrollView
          style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
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
              textAlign: "center",
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
              justifyContent: "center",
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
                    borderRadius: 50,
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
              textAlign: "center",
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
              justifyContent: "center",
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
                borderRadius: 50,
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
            paddingHorizontal: 20,
            gap: 8,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF1F5",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  nextButton: {
    backgroundColor: "#1D1A27",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    shadowColor: "#1D1A27",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  pillToolbarWrapper: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  pillToolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  pillIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pillDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  topRatioPicker: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingVertical: 12,
  },
  topRatioBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ratioIconSimple: {
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    backgroundColor: "transparent",
  },
  ratioIconSimpleActive: {
    borderColor: "#4B5563",
    backgroundColor: "#4B5563",
  },
  ratioLabelSimple: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  ratioLabelSimpleActive: {
    color: "#1D1A27",
    fontWeight: "600",
  },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  canvasContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  canvas: {
    width: "100%",
    aspectRatio: undefined, // set dynamically
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvasItemWrapper: {
    position: "absolute",
    width: 200,
    height: 250,
  },
  canvasItemOverlay: {
    position: "absolute",
    zIndex: 10,
  },
  canvasTextWrapper: {
    position: "absolute",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  boundingWrapper: {
    flex: 1,
    position: "relative",
  },
  canvasItemImage: {
    width: "100%",
    height: "100%",
  },
  boundingBox: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "#00000020",
    borderRadius: 8,
  },
  controlBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  floatingToolbar: {
    position: "absolute",
    bottom: 24,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  toolbarIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 120, // Start right below the header
    height: Dimensions.get("window").height, // ensures it never reveals bottom edge
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100, // Ensure it covers canvas controls
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    width: "100%",
  },
  gridContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
  },
  gridImageContainer: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gridImage: {
    width: "80%",
    height: "80%",
  },
  gridBrandText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 2,
  },
  gridDateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
});
