import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconAdjustmentsHorizontal,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEyeOff,
  IconFlipHorizontal,
  IconLetterT,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { captureRef } from "react-native-view-shot";
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
import { CanvasImageItem } from "../../components/canvas/CanvasImageItem";
import { CanvasTextItem } from "../../components/canvas/CanvasTextItem";
import { CanvasItemData } from "../../components/canvas/types";

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

const SORT_OPTIONS: { label: string; value: SortId }[] = [
  { label: "Recently added", value: "recently_added" },
  { label: "Name A–Z", value: "name_az" },
  { label: "Most worn", value: "most_worn" },
  { label: "Least worn", value: "least_worn" },
];

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
          zIndex: 999,
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

// Canvas items extracted to components/canvas

export default function CreateOutfitScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();

  const items = useUserWardrobeStore((state) => state.items);
  const initialItem = items.find((item) => item.id === itemId);

  // States for filtering and sorting
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">(
    "all",
  );
  const [activeSort, setActiveSort] = useState<SortId>("recently_added");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState<CategoryId | "all">("all");
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
        
        const itemIds = canvasItems.map(i => i.id).join(',');
        router.push({
          pathname: "/plan-outfit",
          params: { imageUri: uri, itemIds, ratio }
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
      })),
    [items],
  );

  const filteredItems = useMemo(() => {
    let _items =
      activeCategory === "all"
        ? displayItems
        : displayItems.filter((i: any) => i.category === activeCategory);
    if (activeSort === "name_az")
      _items = [..._items].sort((a, b) => a.name.localeCompare(b.name));
    else if (activeSort === "most_worn")
      _items = [..._items].sort((a, b) => b.wears - a.wears);
    else if (activeSort === "least_worn")
      _items = [..._items].sort((a, b) => a.wears - b.wears);
    return _items;
  }, [displayItems, activeCategory, activeSort]);

  const categoryLabel =
    FILTER_CHIPS.find((c) => c.value === activeCategory)?.label ?? "All";
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === activeSort)?.label ?? "Recently added";
  const hasActiveFilter = activeCategory !== "all";

  const openCategory = () => {
    setTempCategory(activeCategory);
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
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <IconX size={24} color="#1D1A27" />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => setIsPreview((p) => !p)}
              style={styles.previewButton}
            >
              {isPreview ? (
                <IconEyeOff size={18} color="#1D1A27" />
              ) : (
                <IconEye size={18} color="#1D1A27" />
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
            <View
              ref={viewRef}
              style={{ flex: 1 }}
              collapsable={false}
            >
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
                  <IconLetterT size={22} color="#4B5563" />
                </Pressable>
                <Pressable style={styles.toolbarIcon} onPress={handleFlip}>
                  <IconFlipHorizontal size={22} color="#4B5563" />
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

                <View style={styles.divider} />

                {/* Clothes Grid */}
                <ScrollView
                  contentContainerStyle={styles.gridContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.grid}>
                    {filteredItems.map((item: any) => (
                      <Pressable
                        key={item.id}
                        style={styles.gridItem}
                        onPress={() => {
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
                      >
                        <View style={styles.gridImageContainer}>
                          <ExpoImage
                            source={{ uri: item.image }}
                            style={styles.gridImage}
                            contentFit="contain"
                          />
                        </View>
                        <Text style={styles.gridBrandText}>{item.brand}</Text>
                        <Text style={styles.gridDateText}>{item.date}</Text>
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
                            updateActiveItem({ fontWeight: "400" })
                          }
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "400",
                              opacity:
                                (activeItem?.fontWeight ?? "700") === "400"
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
                            updateActiveItem({ fontWeight: "700" })
                          }
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              opacity:
                                (activeItem?.fontWeight ?? "700") === "700"
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
                <IconLetterT size={22} color="#4B5563" />
              </Pressable>
              <Pressable style={styles.toolbarIcon} onPress={handleFlip}>
                <IconFlipHorizontal size={22} color="#4B5563" />
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nextButton: {
    backgroundColor: "#1D1A27",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
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
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
