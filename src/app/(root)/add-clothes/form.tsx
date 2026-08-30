import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { ScanningOverlay } from "@/features/scanning/ui/ScanningOverlay";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { usePremiumLimits } from "@/features/payments/model/usePremiumLimits";
import { useStreakSync } from "@/features/streaks/api/useStreakSync";
import { useAuth } from "@clerk/clerk-expo";
import {
  IconArrowLeft,
  IconChevronDown,
  IconDotsVertical,
  IconInfoCircle,
  IconPhoto,
  IconShare,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Text = (props: any) => {
  const { style, ...rest } = props;
  const flatStyle = StyleSheet.flatten(style || {});
  let fontFamily = flatStyle.fontFamily || "BricolageGrotesque_400Regular";

  if (flatStyle.fontWeight === "500") fontFamily = "BricolageGrotesque_500Medium";
  else if (flatStyle.fontWeight === "600")
    fontFamily = "BricolageGrotesque_600SemiBold";
  else if (flatStyle.fontWeight === "700" || flatStyle.fontWeight === "bold")
    fontFamily = "BricolageGrotesque_700Bold";
  else if (flatStyle.fontWeight === "800")
    fontFamily = "BricolageGrotesque_800ExtraBold";

  const { fontWeight, ...cleanStyle } = flatStyle;
  return <RNText style={[cleanStyle, { fontFamily }]} {...rest} />;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryId =
  | "T-Shirt"
  | "Polo Shirt"
  | "Shirt"
  | "Blouse"
  | "Crop Top"
  | "Tank Top"
  | "Hoodie"
  | "Sweatshirt"
  | "Sweater"
  | "Cardigan"
  | "Jacket"
  | "Blazer"
  | "Coat"
  | "Jeans"
  | "Trousers"
  | "Chinos"
  | "Cargo Pants"
  | "Joggers"
  | "Shorts"
  | "Leggings"
  | "Skirt"
  | "Dress"
  | "Jumpsuit"
  | "Romper"
  | "Suit"
  | "Tracksuit"
  | "Co-ord Set"
  | "Activewear"
  | "Swimwear"
  | "Loungewear"
  | "Sneakers"
  | "Loafers"
  | "Formal Shoes"
  | "Boots"
  | "Heels"
  | "Sandals"
  | "Flats"
  | "Slides"
  | "Bags"
  | "Backpack"
  | "Watch"
  | "Sunglasses"
  | "Belt"
  | "Jewelry"
  | "Scarf"
  | "Wallet"
  | "Cap"
  | "Hat"
  | "Beanie"
  | "Kurta"
  | "Saree"
  | "Lehenga"
  | "Sherwani"
  | "Nehru Jacket"
  | string;

type Occasion =
  | "Casual"
  | "Smart Casual"
  | "Business Casual"
  | "Formal"
  | "Office"
  | "College"
  | "Party"
  | "Wedding"
  | "Festive"
  | "Traditional"
  | "Date Night"
  | "Travel"
  | "Beach"
  | "Gym"
  | "Sports"
  | "Outdoor"
  | "Lounge"
  | "Sleepwear"
  | "Interview"
  | "All Occasion"
  | string;
type Season =
  "Spring" | "Summer" | "Autumn" | "Winter" | "Monsoon" | "All Season" | string;

const CATEGORIES = [
  { id: "Top", label: "Top" },
  { id: "Bottom", label: "Bottom" },
  { id: "One-Piece", label: "One-Piece" },
  { id: "Outerwear", label: "Outerwear" },
  { id: "Footwear", label: "Footwear" },
  { id: "Accessories", label: "Accessories" },
  { id: "Other", label: "Other" },
];

const SUBCATEGORY_MAP: Record<string, string[]> = {
  "Top": ["T-Shirt", "Shirt", "Polo Shirt", "Blouse", "Tank Top", "Crop Top", "Sweater", "Hoodie", "Sweatshirt", "Cardigan", "Tunic", "Kurta"],
  "Bottom": ["Jeans", "Trousers", "Pants", "Chinos", "Shorts", "Skirt", "Leggings", "Joggers", "Sweatpants", "Cargo Pants"],
  "One-Piece": ["Dress", "Jumpsuit", "Romper", "Playsuit"],
  "Outerwear": ["Jacket", "Blazer", "Coat", "Trench Coat", "Puffer", "Vest", "Overcoat", "Leather Jacket", "Denim Jacket"],
  "Footwear": ["Sneakers", "Running Shoes", "Boots", "Sandals", "Heels", "Flats", "Loafers", "Formal Shoes", "Slippers", "Slides", "Mules"],
  "Accessories": ["Bag", "Backpack", "Belt", "Wallet", "Watch", "Sunglasses", "Hat", "Cap", "Scarf", "Gloves", "Tie", "Jewelry"],
  "Other": ["Other"]
};


const OCCASIONS: Occasion[] = [
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
const SEASONS: Season[] = [
  "Spring",
  "Summer",
  "Autumn",
  "Winter",
  "Monsoon",
  "All Season",
];

const COLOR_OPTIONS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Light-Gray", hex: "#D3D3D3" },
  { name: "Dark-Gray", hex: "#A9A9A9" },
  { name: "Black", hex: "#000000" },
  { name: "Light-Yellow", hex: "#FFFFE0" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Turmeric", hex: "#FFC300" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Red", hex: "#FF0000" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Hot-Pink", hex: "#FF69B4" },
  { name: "Light-Green", hex: "#90EE90" },
  { name: "Green", hex: "#008000" },
  { name: "Olive", hex: "#808000" },
  { name: "Dark-Olive", hex: "#556B2F" },
  { name: "Teal", hex: "#008080" },
  { name: "Khaki", hex: "#F0E68C" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Sky-Blue", hex: "#87CEEB" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Navy", hex: "#000080" },
  { name: "Lavender", hex: "#E6E6FA" },
  { name: "Purple", hex: "#800080" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Dark-Brown", hex: "#654321" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Colorful", hex: "colorful" },
];

type FormParams = {
  mode?: string;
  photoUri?: string;
  name?: string;
  category?: string;
  color?: string;
  colorHex?: string;
  occasion?: string;
  season?: string;
  matchingColors?: string;
  isScanning?: string;
  outfitIndex?: string;
  notes?: string;
  brand?: string;
  careInstructions?: string;
  subCategory?: string;
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AddClothesFormScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const params = useLocalSearchParams() as FormParams;
  const removeOutfit = useOutfitAnalysisStore((s) => s.removeOutfit);

  const isScanned = params.mode === "scanned";

  // Form state — pre-filled by AI when scanned
  const [name, setName] = useState(params.name ?? "");
  const [category, setCategory] = useState<string>(params.category ?? "top");
  const [subCategory, setSubCategory] = useState<string>(() => {
    if (params.subCategory) return params.subCategory;
    const catId = CATEGORIES.find(c => c.id.toLowerCase() === (params.category ?? "top").toLowerCase())?.id || "Other";
    const allowed = SUBCATEGORY_MAP[catId] || SUBCATEGORY_MAP["Other"];
    return allowed[0] || "";
  });
  const [color, setColor] = useState(params.color ?? "");
  // Auto-resolve colorHex from COLOR_OPTIONS if not explicitly set
  const [colorHex, setColorHex] = useState(() => {
    if (params.colorHex) return params.colorHex;
    const match = COLOR_OPTIONS.find(
      (c) => c.name.toLowerCase() === (params.color ?? "").toLowerCase(),
    );
    return match?.hex ?? "";
  });
  const [occasions, setOccasions] = useState<Occasion[]>(
    params.occasion ? [params.occasion as Occasion] : ["Casual"],
  );
  const [seasons, setSeasons] = useState<Season[]>(
    params.season ? [params.season as Season] : ["All Season"],
  );
  const [localPhotoUri, setLocalPhotoUri] = useState(params.photoUri ?? "");
  const [notes, setNotes] = useState(params.notes ?? "");
  const [brand, setBrand] = useState(params.brand ?? "");
  const [careInstructions, setCareInstructions] = useState(
    params.careInstructions ?? "",
  );

  const [showScanOverlay, setShowScanOverlay] = useState(
    params.isScanning === "true",
  );

  // Bottom sheet state
  const [activeSheet, setActiveSheet] = useState<
    | "name"
    | "category"
    | "subCategory"
    | "occasion"
    | "season"
    | "rating"
    | "color"
    | "notes"
    | "brand"
    | "care"
    | "menu"
    | null
  >(null);

  const [rating, setRating] = useState<number>(0);

  const panY = useRef(new Animated.Value(400)).current;

  const openSheet = (sheet: typeof activeSheet) => {
    setActiveSheet(sheet);
    panY.setValue(400);
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeSheet = useCallback(() => {
    Animated.timing(panY, {
      toValue: 500,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setActiveSheet(null));
  }, [panY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) panY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) closeSheet();
        else
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  }, []);

  const { userId } = useAuth();
  const addItem = useUserWardrobeStore((s) => s.addItem);
  const { canAddWardrobe, handleLimitReached } = usePremiumLimits();
  const { syncStreak } = useStreakSync();

  const handleConfirm = useCallback(() => {
    if (!canAddWardrobe) {
      handleLimitReached("wardrobe");
      return;
    }
    addItem({
      userId: userId || undefined,
      customName: name || "Untitled item",
      category,
      brand,
      careInstructions,
      notes,
      primaryColor: color || undefined,
      colorHex: colorHex || undefined,
      imageUrl: localPhotoUri || undefined,
      season: seasons.length > 0 ? seasons : undefined,
      occasion: occasions.length > 0 ? occasions : undefined,
    });
    if (params.outfitIndex !== undefined) {
      removeOutfit(parseInt(params.outfitIndex, 10));
    }
    syncStreak("scan_mode");
    router.replace("/(root)/(tabs)/wardrobe" as never);
  }, [
    router,
    userId,
    name,
    category,
    brand,
    careInstructions,
    notes,
    color,
    colorHex,
    seasons,
    occasions,
    localPhotoUri,
    addItem,
    canAddWardrobe,
    handleLimitReached,
    params.outfitIndex,
    removeOutfit,
    syncStreak,
  ]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
          }}
        >
          <Pressable onPress={() => router.canGoBack() && router.back()}>
            <IconArrowLeft size={24} color="#1D1A27" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "600", color: "#1D1A27" }}>
            Item Details
          </Text>
          {params.outfitIndex ? (
            <Pressable onPress={() => setShowMenu(true)}>
              <IconDotsVertical size={24} color="#1D1A27" />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        {/* Dropdown Menu Modal */}
        {showMenu && (
          <Modal
            transparent
            visible
            animationType="fade"
            onRequestClose={() => setShowMenu(false)}
          >
            <Pressable style={{ flex: 1 }} onPress={() => setShowMenu(false)}>
              <View
                style={{
                  position: "absolute",
                  top: 105,
                  right: 30,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 2,
                  minWidth: 130,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                }}
              >
                <Pressable
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                  onPress={() => {
                    setShowMenu(false);
                    removeOutfit(parseInt(params.outfitIndex as string));
                    router.replace("/(root)/(tabs)" as never);
                  }}
                >
                  <IconTrash size={18} color="#EF4444" />
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#EF4444",
                      fontWeight: "500",
                    }}
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 25 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photo Section ── */}
          <View
            style={{
              marginHorizontal: 40,
              // marginTop: 10,
              // marginBottom: 8,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 280,
                height: 280,
                borderRadius: 24,
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
              }}
            >
              {localPhotoUri ? (
                <ExpoImage
                  source={{ uri: localPhotoUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                  cachePolicy="memory"
                />
              ) : (
                <Pressable
                  onPress={handlePickPhoto}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <IconPhoto size={32} color="#C4C4CC" />
                  <Text style={{ color: "#C4C4CC", fontSize: 13 }}>
                    Tap to add photo
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Fields ── */}
          <View style={{ paddingHorizontal: 20, paddingTop: 30, gap: 24 }}>
            {/* Item Name */}
            <Pressable
              onPress={() => openSheet("name")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Item Name
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: name ? "#374151" : "#D1D5DB",
                    fontWeight: "500",
                    maxWidth: 200,
                  }}
                  numberOfLines={1}
                >
                  {name || "Add item name"}
                </Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* My Rating */}
            <Pressable
              onPress={() => openSheet("rating")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                My Rating
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                {rating > 0 ? (
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[...Array(rating)].map((_, i) => (
                      <IconStarFilled key={i} size={16} color="#EAB308" />
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 15, color: "#D1D5DB" }}>
                    Give a rating
                  </Text>
                )}
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* Season */}
            <Pressable
              onPress={() => openSheet("season")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Season
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#374151",
                    fontWeight: "500",
                    maxWidth: 200,
                  }}
                  numberOfLines={1}
                >
                  {seasons.length > 0 ? seasons.join(", ") : "Select"}
                </Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* Occasion */}
            <Pressable
              onPress={() => openSheet("occasion")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Occasion
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#374151",
                    fontWeight: "500",
                    maxWidth: 200,
                  }}
                  numberOfLines={1}
                >
                  {occasions.length > 0 ? occasions.join(", ") : "Select"}
                </Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* Category */}
            <Pressable
              onPress={() => openSheet("category")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Category
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{ fontSize: 15, color: "#374151", fontWeight: "500" }}
                >
                  {CATEGORIES.find((c) => c.id === category)?.label ?? category}
                </Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* SubCategory */}
            <Pressable
              onPress={() => openSheet("subCategory")}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, color: "#000000", fontWeight: "500" }}>Sub-Category</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 15, color: subCategory ? "#00000090" : "#D1D5DB", fontWeight: "500" }}>{subCategory || "Select"}</Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>
            {/* Color */}
            <Pressable
              onPress={() => openSheet("color")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Color
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                {colorHex ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {colorHex === "colorful" ? (
                      <LinearGradient
                        colors={[
                          "#FF0000",
                          "#FFFF00",
                          "#00FF00",
                          "#00FFFF",
                          "#0000FF",
                          "#FF00FF",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 16, height: 16, borderRadius: 8 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: colorHex,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 15,
                        color: "#374151",
                        fontWeight: "500",
                      }}
                    >
                      {color}
                    </Text>
                  </View>
                ) : color ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor:
                          COLOR_OPTIONS.find(
                            (c) => c.name.toLowerCase() === color.toLowerCase(),
                          )?.hex ?? "#D1D5DB",
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: "#374151",
                        fontWeight: "500",
                      }}
                    >
                      {color}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 15, color: "#D1D5DB" }}>
                    Select color
                  </Text>
                )}
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* Brand / Designer */}
            <Pressable
              onPress={() => openSheet("brand")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Brand / Designer
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: brand ? "#000" : "#D1D5DB",
                    maxWidth: 150,
                  }}
                  numberOfLines={1}
                >
                  {brand ? brand : "Add brand"}
                </Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* Care Instructions */}
            <Pressable
              onPress={() => openSheet("care")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Care Instructions
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: careInstructions ? "#000" : "#D1D5DB",
                    maxWidth: 150,
                  }}
                  numberOfLines={1}
                >
                  {careInstructions ? careInstructions : "Add care info"}
                </Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>

            {/* Notes */}
            <Pressable
              onPress={() => openSheet("notes")}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "500" }}
              >
                Notes
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#374151",
                    fontWeight: "500",
                    maxWidth: 150,
                  }}
                  numberOfLines={1}
                >
                  {notes || "Add notes"}
                </Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* ── Bottom CTA ── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 12,
            paddingTop: 12,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
          }}
        >
          {isScanned && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                backgroundColor: "#F3F4F6",
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
                gap: 10,
              }}
            >
              <IconInfoCircle
                size={20}
                color="#6B7280"
                style={{ marginTop: 2 }}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#4B5563",
                  lineHeight: 18,
                }}
              >
                You can edit this information. Unsaved scans are automatically
                removed after 5 hours. Tap{" "}
                <Text style={{ fontWeight: "600" }}>Save to Wardrobe</Text> to
                keep it.
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleConfirm}
            style={{
              backgroundColor: "#1D1A27",
              borderRadius: 18,
              paddingVertical: 17,
              alignItems: "center",
              shadowColor: "#1D1A27",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {isScanned ? "✓  Save to Wardrobe" : "Add to Wardrobe"}
            </Text>
          </Pressable>
        </View>

        {/* ── Category Bottom Sheet ── */}
        <Modal
          visible={activeSheet !== null}
          transparent
          animationType="none"
          onRequestClose={closeSheet}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            behavior={"height"}
            style={{ flex: 1 }}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.4)",
                justifyContent: "flex-end",
              }}
              onPress={closeSheet}
            >
              <Animated.View
                {...panResponder.panHandlers}
                style={{ transform: [{ translateY: panY }] }}
              >
                <Pressable onPress={() => { }}>
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderTopLeftRadius: 28,
                      borderTopRightRadius: 28,
                      paddingTop: 12,
                      paddingBottom: 40,
                      paddingHorizontal: 20,
                    }}
                  >
                    {/* Handle */}
                    <View
                      style={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#E5E7EB",
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
                          fontSize: 17,
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        {activeSheet === "name"
                          ? "Item Name"
                          : activeSheet === "category"
                          ? "Select Category"
                          : activeSheet === "occasion"
                            ? "Select Occasion"
                            : activeSheet === "season"
                              ? "Select Season"
                              : activeSheet === "rating"
                                ? "My Rating"
                                : activeSheet === "color"
                                  ? "Select Color"
                                  : activeSheet === "menu"
                                    ? "Options"
                                    : activeSheet === "brand"
                                      ? "Brand / Designer"
                                      : activeSheet === "care"
                                        ? "Care Instructions"
                                        : "Notes"}
                      </Text>
                      <Pressable onPress={closeSheet}>
                        <IconX size={22} color="#9CA3AF" />
                      </Pressable>
                    </View>

                    {/* Options */}
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      {activeSheet === "menu" && (
                        <View style={{ width: "100%", gap: 8 }}>
                          <Pressable
                            onPress={closeSheet}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 12,
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              backgroundColor: "#F9FAFB",
                              borderRadius: 16,
                            }}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "#fff",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 1,
                              }}
                            >
                              <IconShare size={20} color="#1D1A27" />
                            </View>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#1D1A27",
                              }}
                            >
                              Share
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={closeSheet}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 12,
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              backgroundColor: "#FEF2F2",
                              borderRadius: 16,
                            }}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "#fff",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#EF4444",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 1,
                              }}
                            >
                              <IconTrash size={20} color="#EF4444" />
                            </View>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#EF4444",
                              }}
                            >
                              Delete Item
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {activeSheet === "rating" && (
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 12,
                            justifyContent: "center",
                            width: "100%",
                            paddingVertical: 10,
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Pressable
                              key={star}
                              onPress={() => {
                                setRating(star);
                                closeSheet();
                              }}
                            >
                              {rating >= star ? (
                                <IconStarFilled size={36} color="#C4C4CC" />
                              ) : (
                                <IconStar size={36} color="#E5E7EB" />
                              )}
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {activeSheet === "category" &&
                        CATEGORIES.map((c) => (
                          <Pressable
                            key={c.id}
                            onPress={() => {
                              setCategory(c.id);
                              closeSheet();
                            }}
                            style={{
                              paddingHorizontal: 18,
                              paddingVertical: 10,
                              borderRadius: 999,
                              backgroundColor:
                                category === c.id ? "#fff" : "#fff",
                              borderWidth: 1,
                              borderColor:
                                category === c.id ? "#000" : "#E5E7EB",
                            }}
                          >
                            <Text
                              style={{
                                color: category === c.id ? "#000" : "#6B7280",
                                fontSize: 14,
                                fontWeight: "500",
                              }}
                            >
                              {c.label}
                            </Text>
                          </Pressable>
                        ))}

                      
                      {activeSheet === "subCategory" &&
                        (SUBCATEGORY_MAP[CATEGORIES.find(c => c.id.toLowerCase() === category.toLowerCase())?.id || "Other"] || SUBCATEGORY_MAP["Other"]).map((subCat) => (
                          <Pressable
                            key={subCat}
                            onPress={() => {
                              setSubCategory(subCat);
                              closeSheet();
                            }}
                            style={{
                              flexDirection: "row", alignItems: "center", justifyContent: "center",
                              paddingVertical: 14, borderRadius: 16, marginBottom: 8,
                              backgroundColor: subCategory === subCat ? "#1D1A27" : "#fff",
                              borderWidth: 1, borderColor: subCategory === subCat ? "#1D1A27" : "#E5E7EB",
                            }}
                          >
                            <Text style={{ color: subCategory === subCat ? "#fff" : "#6B7280", fontSize: 14, fontWeight: "500" }}>
                              {subCat}
                            </Text>
                          </Pressable>
                        ))}
                      {activeSheet === "season" &&
                        SEASONS.map((s) => {
                          const isSelected = seasons.includes(s);
                          return (
                            <Pressable
                              key={s}
                              onPress={() => {
                                if (isSelected) {
                                  setSeasons(seasons.filter((x) => x !== s));
                                } else {
                                  if (seasons.length < 2)
                                    setSeasons([...seasons, s]);
                                }
                              }}
                              style={{
                                paddingHorizontal: 18,
                                paddingVertical: 10,
                                borderRadius: 999,
                                backgroundColor: isSelected
                                  ? "#1D1A27"
                                  : "#fff",
                                borderWidth: 1,
                                borderColor: isSelected ? "#1D1A27" : "#E5E7EB",
                              }}
                            >
                              <Text
                                style={{
                                  color: isSelected ? "#fff" : "#6B7280",
                                  fontSize: 14,
                                  fontWeight: "500",
                                }}
                              >
                                {s}
                              </Text>
                            </Pressable>
                          );
                        })}

                      {activeSheet === "occasion" &&
                        OCCASIONS.map((o) => {
                          const isSelected = occasions.includes(o);
                          return (
                            <Pressable
                              key={o}
                              onPress={() => {
                                if (isSelected) {
                                  setOccasions(
                                    occasions.filter((x) => x !== o),
                                  );
                                } else {
                                  if (occasions.length < 3)
                                    setOccasions([...occasions, o]);
                                }
                              }}
                              style={{
                                paddingHorizontal: 18,
                                paddingVertical: 10,
                                borderRadius: 999,
                                backgroundColor: isSelected
                                  ? "#1D1A27"
                                  : "#fff",
                                borderWidth: 1,
                                borderColor: isSelected ? "#1D1A27" : "#E5E7EB",
                              }}
                            >
                              <Text
                                style={{
                                  color: isSelected ? "#fff" : "#6B7280",
                                  fontSize: 14,
                                  fontWeight: "500",
                                }}
                              >
                                {o}
                              </Text>
                            </Pressable>
                          );
                        })}

                      {activeSheet === "color" &&
                        COLOR_OPTIONS.map((c) => (
                          <Pressable
                            key={c.name}
                            onPress={() => {
                              setColor(c.name);
                              setColorHex(c.hex);
                              closeSheet();
                            }}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 999,
                              backgroundColor:
                                color === c.name ? "#fff" : "#fff",
                              borderWidth: 1,
                              borderColor:
                                color === c.name ? "#000" : "#E5E7EB",
                            }}
                          >
                            {c.hex === "colorful" ? (
                              <LinearGradient
                                colors={[
                                  "#FF0000",
                                  "#FFFF00",
                                  "#00FF00",
                                  "#00FFFF",
                                  "#0000FF",
                                  "#FF00FF",
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 8,
                                }}
                              />
                            ) : (
                              <View
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 8,
                                  backgroundColor: c.hex,
                                  borderWidth: 1,
                                  borderColor: "#E5E7EB",
                                }}
                              />
                            )}
                            <Text
                              style={{
                                color: color === c.name ? "#000" : "#6B7280",
                                fontSize: 14,
                                fontWeight: "500",
                              }}
                            >
                              {c.name}
                            </Text>
                          </Pressable>
                        ))}

                      {activeSheet === "name" && (
                        <View style={{ width: "100%", height: 100 }}>
                          <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Graphic Hoodie, Chelsea Boots"
                            placeholderTextColor="#9CA3AF"
                            autoFocus
                            style={{
                              width: "100%",
                              height: 50,
                              borderWidth: 1,
                              borderColor: "#E5E7EB",
                              borderRadius: 12,
                              paddingHorizontal: 16,
                              fontSize: 15,
                              color: "#1F2937",
                            }}
                          />
                        </View>
                      )}

                      {activeSheet === "brand" && (
                        <View style={{ width: "100%", height: 100 }}>
                          <TextInput
                            value={brand}
                            onChangeText={setBrand}
                            placeholder="Enter brand or designer"
                            placeholderTextColor="#9CA3AF"
                            style={{
                              width: "100%",
                              height: 50,
                              borderWidth: 1,
                              borderColor: "#E5E7EB",
                              borderRadius: 12,
                              paddingHorizontal: 16,
                              fontSize: 15,
                              color: "#1F2937",
                            }}
                          />
                        </View>
                      )}
                      {activeSheet === "care" && (
                        <View style={{ width: "100%", height: 100 }}>
                          <TextInput
                            value={careInstructions}
                            onChangeText={setCareInstructions}
                            placeholder="Enter care instructions"
                            placeholderTextColor="#9CA3AF"
                            style={{
                              width: "100%",
                              height: 50,
                              borderWidth: 1,
                              borderColor: "#E5E7EB",
                              borderRadius: 12,
                              paddingHorizontal: 16,
                              fontSize: 15,
                              color: "#1F2937",
                            }}
                          />
                        </View>
                      )}
                      {activeSheet === "notes" && (
                        <View style={{ width: "100%", height: 150 }}>
                          <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add notes..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            style={{
                              width: "100%",
                              height: "100%",
                              borderWidth: 1,
                              borderColor: "#E5E7EB",
                              borderRadius: 12,
                              padding: 16,
                              fontSize: 15,
                              color: "#1F2937",
                              textAlignVertical: "top",
                            }}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        <ScanningOverlay
          visible={showScanOverlay}
          onComplete={() => setShowScanOverlay(false)}
        />
      </SafeAreaView>
    </View>
  );
}
