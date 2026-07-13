import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconAdjustmentsHorizontal,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconArrowsDiagonal,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconEye,
  IconEyeOff,
  IconFlipHorizontal,
  IconFlipVertical,
  IconLayoutBoardSplit,
  IconLetterT,
  IconMoodSmile,
  IconPhoto,
  IconTrash,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [flipValue, setFlipValue] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [ratio, setRatio] = useState<"3:4" | "1:1">("3:4");

  // Text Feature State
  const [bottomSheetMode, setBottomSheetMode] = useState<"wardrobe" | "text">(
    "wardrobe",
  );
  const [textValue, setTextValue] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [textFontWeight, setTextFontWeight] = useState<"400" | "700">("700");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    "center",
  );
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [isTextActive, setIsTextActive] = useState(false);
  const [textFlipValue, setTextFlipValue] = useState(1);
  const textInputRef = useRef<TextInput>(null);

  // Text Canvas Interactions
  const textPan = useRef(new Animated.ValueXY()).current;
  const textScaleAnim = useRef(new Animated.Value(1)).current;
  const textRotateAnim = useRef(new Animated.Value(0)).current;

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

  const BOUND_X = 100;
  const BOUND_Y = 150;

  const panResponderItem = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentX = (pan.x as any)._offset + gestureState.dx;
        const currentY = (pan.y as any)._offset + gestureState.dy;

        const boundedX = Math.max(-BOUND_X, Math.min(currentX, BOUND_X));
        const boundedY = Math.max(-BOUND_Y, Math.min(currentY, BOUND_Y));

        pan.setValue({
          x: boundedX - (pan.x as any)._offset,
          y: boundedY - (pan.y as any)._offset,
        });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;

  const panResponderResize = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scaleAnim.extractOffset();
        rotateAnim.extractOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        const initialX = 100; // Half width of item
        const initialY = 125; // Half height of item

        const currentX = initialX + gestureState.dx;
        const currentY = initialY + gestureState.dy;

        // Scale
        const initialDist = Math.sqrt(
          initialX * initialX + initialY * initialY,
        );
        const currentDist = Math.sqrt(
          currentX * currentX + currentY * currentY,
        );
        const scaleFactor = currentDist / initialDist;

        const baseScale = (scaleAnim as any)._offset || 1;
        const targetScale = baseScale * scaleFactor;
        const clampedScale = Math.max(0.3, Math.min(targetScale, 5));

        scaleAnim.setValue(clampedScale - baseScale);

        // Rotation
        const initialAngle = Math.atan2(initialY, initialX);
        const currentAngle = Math.atan2(currentY, currentX);
        const angleDiff = (currentAngle - initialAngle) * (180 / Math.PI);
        rotateAnim.setValue(angleDiff);
      },
      onPanResponderRelease: () => {
        scaleAnim.flattenOffset();
        rotateAnim.flattenOffset();
      },
    }),
  ).current;

  const handleFlip = () => {
    setFlipValue((prev) => (prev === 1 ? -1 : 1));
  };

  // Interpolations
  const interpolatedRotate = rotateAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  const textPanResponderItem = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        textPan.extractOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentX = (textPan.x as any)._offset + gestureState.dx;
        const currentY = (textPan.y as any)._offset + gestureState.dy;

        textPan.setValue({
          x: currentX - (textPan.x as any)._offset,
          y: currentY - (textPan.y as any)._offset,
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        textPan.flattenOffset();
      },
    }),
  ).current;

  const textPanResponderResize = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        textScaleAnim.extractOffset();
        textRotateAnim.extractOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        const initialX = 50;
        const initialY = 20;

        const currentX = initialX + gestureState.dx;
        const currentY = initialY + gestureState.dy;

        const initialDist = Math.sqrt(
          initialX * initialX + initialY * initialY,
        );
        const currentDist = Math.sqrt(
          currentX * currentX + currentY * currentY,
        );
        const scaleFactor = currentDist / initialDist;

        const baseScale = (textScaleAnim as any)._offset || 1;
        const targetScale = baseScale * scaleFactor;
        const clampedScale = Math.max(0.3, Math.min(targetScale, 5));

        textScaleAnim.setValue(clampedScale - baseScale);

        const initialAngle = Math.atan2(initialY, initialX);
        const currentAngle = Math.atan2(currentY, currentX);
        const angleDiff = (currentAngle - initialAngle) * (180 / Math.PI);
        textRotateAnim.setValue(angleDiff);
      },
      onPanResponderRelease: () => {
        textScaleAnim.flattenOffset();
        textRotateAnim.flattenOffset();
      },
    }),
  ).current;

  const textInterpolatedRotate = textRotateAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

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
            <Pressable style={styles.nextButton}>
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
            {/* Canvas — overflow:hidden clips the image at edges */}
            <Pressable
              style={[styles.canvas, { aspectRatio: undefined, flex: 1 }]}
              onPress={() => {
                Keyboard.dismiss();
                setIsFocused(false);
                setIsTextFocused(false);
                setBottomSheetMode("wardrobe");
                if (textValue.trim() === "") {
                  setIsTextActive(false);
                }
              }}
            >
              {isVisible && (
                <Animated.View
                  style={[
                    styles.canvasItemWrapper,
                    {
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: scaleAnim },
                        { rotate: interpolatedRotate },
                      ],
                    },
                  ]}
                >
                  <View style={styles.boundingWrapper}>
                    <View
                      {...panResponderItem.panHandlers}
                      style={{ flex: 1 }}
                      onTouchEnd={() => {
                        setIsFocused(true);
                        setIsTextFocused(false);
                      }}
                    >
                      <ExpoImage
                        source={{
                          uri:
                            initialItem?.imageUrl ??
                            "https://picsum.photos/seed/shirt/400/500",
                        }}
                        style={[
                          styles.canvasItemImage,
                          { transform: [{ scaleX: flipValue }] },
                        ]}
                        contentFit="contain"
                      />
                      {isFocused && (
                        <View style={styles.boundingBox} pointerEvents="none" />
                      )}
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Text Object on Canvas */}
              {isTextActive && (
                <Animated.View
                  style={[
                    styles.canvasTextWrapper,
                    {
                      transform: [
                        { translateX: textPan.x },
                        { translateY: textPan.y },
                        { scale: textScaleAnim },
                        { rotate: textInterpolatedRotate },
                      ],
                    },
                  ]}
                >
                  <View
                    {...textPanResponderItem.panHandlers}
                    style={{ position: "relative" }}
                  >
                    <TextInput
                      ref={textInputRef}
                      value={textValue}
                      onChangeText={setTextValue}
                      pointerEvents="auto"
                      onFocus={() => {
                        setIsTextFocused(true);
                        setIsFocused(false);
                        setBottomSheetMode("text");
                      }}
                      multiline
                      placeholder=""
                      style={{
                        fontSize: 24,
                        color: textColor,
                        fontWeight: textFontWeight,
                        textAlign: textAlign,
                        padding: 8,
                        minWidth: 10,
                        transform: [{ scaleX: textFlipValue }],
                      }}
                    />
                  </View>
                </Animated.View>
              )}

              {/* Floating Toolbar inside canvas */}
              {!isPreview && (
                <View style={styles.floatingToolbar}>
                  <Pressable
                    style={[
                      styles.toolbarIcon,
                      bottomSheetMode === "text" && {
                        backgroundColor: "#f3f4f6",
                        borderRadius: 8,
                        padding: 4,
                      },
                    ]}
                    onPress={() => {
                      if (bottomSheetMode === "text") {
                        setBottomSheetMode("wardrobe");
                      } else {
                        setBottomSheetMode("text");
                        setIsTextActive(true);
                        setIsTextFocused(true);
                        setIsFocused(false);
                        setTimeout(() => textInputRef.current?.focus(), 250);
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
                    <IconFlipVertical size={22} color="#4B5563" />
                  </Pressable>
                </View>
              )}
            </Pressable>

            {/* Controls overlay — same transform but OUTSIDE canvas so not clipped */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {/* Image Controls Overlay */}
              {isVisible && isFocused && !isPreview && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { alignItems: "center", justifyContent: "center" },
                  ]}
                  pointerEvents="box-none"
                >
                  <Animated.View
                    pointerEvents="box-none"
                    style={[
                      styles.canvasItemWrapper,
                      {
                        transform: [
                          { translateX: pan.x },
                          { translateY: pan.y },
                          { scale: scaleAnim },
                          { rotate: interpolatedRotate },
                        ],
                      },
                    ]}
                  >
                    <View
                      style={[styles.boundingWrapper]}
                      pointerEvents="box-none"
                    >
                      <Pressable
                        onPress={() => setIsVisible(false)}
                        style={[
                          styles.controlBadge,
                          { top: -14, right: -14, zIndex: 10 },
                        ]}
                      >
                        <IconTrash size={14} color="#1D1A27" />
                      </Pressable>
                      <View
                        {...panResponderResize.panHandlers}
                        style={[
                          styles.controlBadge,
                          { bottom: -14, right: -14, zIndex: 10 },
                        ]}
                      >
                        <IconArrowsDiagonal size={14} color="#1D1A27" />
                      </View>
                    </View>
                  </Animated.View>
                </View>
              )}

              {/* Text Controls Overlay */}
              {isTextActive &&
                textValue !== "" &&
                isTextFocused &&
                !isPreview && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { alignItems: "center", justifyContent: "center" },
                    ]}
                    pointerEvents="box-none"
                  >
                    <Animated.View
                      pointerEvents="box-none"
                      style={[
                        styles.canvasTextWrapper,
                        {
                          transform: [
                            { translateX: textPan.x },
                            { translateY: textPan.y },
                            { scale: textScaleAnim },
                            { rotate: textInterpolatedRotate },
                          ],
                        },
                      ]}
                    >
                      <View
                        style={{ position: "relative" }}
                        pointerEvents="box-none"
                      >
                        <TextInput
                          value={textValue}
                          multiline
                          style={{
                            fontSize: 24,
                            color: "transparent",
                            opacity: 0,
                            fontWeight: textFontWeight,
                            textAlign: textAlign,
                            padding: 8,
                            minWidth: 10,
                            transform: [{ scaleX: textFlipValue }],
                          }}
                          editable={false}
                          pointerEvents="none"
                        />

                        {/* Bounding Box on Overlay for perfect alignment */}
                        <View style={styles.boundingBox} pointerEvents="none" />

                        {/* Top Right: Trash */}
                        <Pressable
                          onPress={() => {
                            setTextValue("");
                            setIsTextActive(false);
                          }}
                          style={[
                            styles.controlBadge,
                            { top: -14, right: -14, zIndex: 10 },
                          ]}
                        >
                          <IconTrash size={14} color="#1D1A27" />
                        </Pressable>

                        {/* Bottom Right: Resize */}
                        <View
                          {...textPanResponderResize.panHandlers}
                          style={[
                            styles.controlBadge,
                            { bottom: -14, right: -14, zIndex: 10 },
                          ]}
                        >
                          <IconArrowsDiagonal size={14} color="#1D1A27" />
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                )}
            </View>
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

                <View style={styles.divider} />

                {/* Clothes Grid */}
                <ScrollView
                  contentContainerStyle={styles.gridContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.grid}>
                    {filteredItems.map((item: any) => (
                      <View key={item.id} style={styles.gridItem}>
                        <View style={styles.gridImageContainer}>
                          <ExpoImage
                            source={{ uri: item.image }}
                            style={styles.gridImage}
                            contentFit="contain"
                          />
                        </View>
                        <Text style={styles.gridBrandText}>{item.brand}</Text>
                        <Text style={styles.gridDateText}>{item.date}</Text>
                      </View>
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
                        onPress={() => setTextColor(c)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: c,
                          borderWidth: textColor === c ? 2 : 1,
                          borderColor:
                            textColor === c
                              ? c === "#000000"
                                ? "#4B5563"
                                : "#1D1A27"
                              : "#E2E2EA",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {textColor === c && c === "#FFFFFF" && (
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
                        <Pressable onPress={() => setTextFontWeight("400")}>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "400",
                              opacity: textFontWeight === "400" ? 1 : 0.4,
                              color: "#1D1A27",
                            }}
                          >
                            Aa
                          </Text>
                        </Pressable>
                        <Pressable onPress={() => setTextFontWeight("700")}>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              opacity: textFontWeight === "700" ? 1 : 0.4,
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
                          onPress={() => setTextAlign("left")}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              textAlign === "left" ? "#1D1A27" : "#F3F4F6",
                          }}
                        >
                          <IconAlignLeft
                            size={20}
                            color={textAlign === "left" ? "#FFFFFF" : "#4B5563"}
                            strokeWidth={2}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => setTextAlign("center")}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              textAlign === "center" ? "#1D1A27" : "#F3F4F6",
                          }}
                        >
                          <IconAlignCenter
                            size={20}
                            color={
                              textAlign === "center" ? "#FFFFFF" : "#4B5563"
                            }
                            strokeWidth={2}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => setTextAlign("right")}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              textAlign === "right" ? "#1D1A27" : "#F3F4F6",
                          }}
                        >
                          <IconAlignRight
                            size={20}
                            color={
                              textAlign === "right" ? "#FFFFFF" : "#4B5563"
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
          // Preview Mode Pill Toolbar
          <View style={styles.pillToolbarWrapper}>
            <View style={styles.pillToolbar}>
              <Pressable style={styles.pillIconBtn}>
                <IconLayoutBoardSplit
                  size={22}
                  color="#1D1A27"
                  strokeWidth={1.5}
                />
              </Pressable>
              <Pressable style={styles.pillIconBtn}>
                <IconPhoto size={22} color="#1D1A27" strokeWidth={1.5} />
              </Pressable>
              <Pressable style={styles.pillIconBtn}>
                <IconLetterT size={22} color="#1D1A27" strokeWidth={1.5} />
              </Pressable>
              <Pressable style={styles.pillIconBtn}>
                <IconMoodSmile size={22} color="#1D1A27" strokeWidth={1.5} />
              </Pressable>
              <View style={styles.pillDivider} />
              <Pressable style={styles.pillIconBtn}>
                <IconChevronRight size={22} color="#1D1A27" strokeWidth={1.5} />
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
