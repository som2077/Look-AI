import {
  useUserWardrobeStore,
  setWardrobeStoreUserId,
} from "@/features/wardrobe/model/user-wardrobe-store";
import { useAuth } from "@clerk/clerk-expo";
import {
  OCCASIONS,
  Occasion,
  getOccasionIcon,
} from "@/shared/constants/occasions";
import { getMockWardrobeItemById } from "@/shared/testing/mock-wardrobe-items";
import {
  IconArrowLeft,
  IconBeach,
  IconBriefcase,
  IconBuilding,
  IconChevronDown,
  IconDiamond,
  IconDotsVertical,
  IconHanger,
  IconLeaf,
  IconMoon,
  IconPentagonPlus,
  IconPhoto,
  IconRun,
  IconShirt,
  IconShoe,
  IconSnowflake,
  IconStarFilled,
  IconSun,
  IconTrash,
  IconUmbrella,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  | "Loungewear";

type Season =
  | "Spring"
  | "Summer"
  | "Autumn"
  | "Winter"
  | "Monsoon"
  | "All Season";

interface MatchingColor {
  name: string;
  hex: string;
}

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "T-Shirt", label: "T-Shirt" },
  { id: "Polo Shirt", label: "Polo Shirt" },
  { id: "Shirt", label: "Shirt" },
  { id: "Blouse", label: "Blouse" },
  { id: "Crop Top", label: "Crop Top" },
  { id: "Tank Top", label: "Tank Top" },
  { id: "Hoodie", label: "Hoodie" },
  { id: "Sweatshirt", label: "Sweatshirt" },
  { id: "Sweater", label: "Sweater" },
  { id: "Cardigan", label: "Cardigan" },
  { id: "Jacket", label: "Jacket" },
  { id: "Blazer", label: "Blazer" },
  { id: "Coat", label: "Coat" },
  { id: "Jeans", label: "Jeans" },
  { id: "Trousers", label: "Trousers" },
  { id: "Chinos", label: "Chinos" },
  { id: "Cargo Pants", label: "Cargo Pants" },
  { id: "Joggers", label: "Joggers" },
  { id: "Shorts", label: "Shorts" },
  { id: "Leggings", label: "Leggings" },
  { id: "Skirt", label: "Skirt" },
  { id: "Dress", label: "Dress" },
  { id: "Jumpsuit", label: "Jumpsuit" },
  { id: "Romper", label: "Romper" },
  { id: "Suit", label: "Suit" },
  { id: "Tracksuit", label: "Tracksuit" },
  { id: "Co-ord Set", label: "Co-ord Set" },
  { id: "Activewear", label: "Activewear" },
  { id: "Swimwear", label: "Swimwear" },
  { id: "Loungewear", label: "Loungewear" },
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
};

// ─── Small helper: Section label ─────────────────────────────────────────────
const SectionLabel = ({ text }: { text: string }) => (
  <Text
    style={{
      fontSize: 12,
      fontWeight: "700",
      color: "#9CA3AF",
      letterSpacing: 1,
      marginBottom: 10,
      textTransform: "uppercase",
    }}
  >
    {text}
  </Text>
);

// ─── Chip selector ───────────────────────────────────────────────────────────
function ChipSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => onChange(opt)}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: value === opt ? "#1D1A27" : "#F3F4F6",
            borderWidth: 1,
            borderColor: value === opt ? "#1D1A27" : "#E5E7EB",
          }}
        >
          <Text
            style={{
              color: value === opt ? "#FFFFFF" : "#374151",
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getCategoryIcon = (label: string, color: string) => {
  const size = 16;
  switch (label.toLowerCase()) {
    case "all clothes":
      return <IconHanger size={size} color={color} />;
    case "tops":
    case "jackets":
    case "hoodies":
    case "outerwear":
    case "t-shirt":
    case "polo shirt":
    case "shirt":
    case "blouse":
    case "crop top":
    case "tank top":
    case "hoodie":
    case "sweatshirt":
    case "sweater":
    case "cardigan":
    case "jacket":
    case "blazer":
    case "coat":
      return <IconShirt size={size} color={color} />;
    case "bottoms":
    case "jeans":
    case "trousers":
    case "chinos":
    case "cargo pants":
    case "joggers":
    case "shorts":
    case "leggings":
    case "skirt":
      return <IconHanger size={size} color={color} />;
    case "shoes":
      return <IconShoe size={size} color={color} />;
    case "bags":
    case "accessories":
      return <IconBriefcase size={size} color={color} />;
    case "dresses":
    case "ethnic":
    case "dress":
    case "jumpsuit":
    case "romper":
    case "suit":
    case "co-ord set":
      return <IconDiamond size={size} color={color} />;
    case "activewear":
    case "sportswear":
    case "tracksuit":
      return <IconRun size={size} color={color} />;
    case "formal":
      return <IconBuilding size={size} color={color} />;
    case "swimwear":
      return <IconBeach size={size} color={color} />;
    case "loungewear":
      return <IconMoon size={size} color={color} />;
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

export default function ItemDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();

  const updateItem = useUserWardrobeStore((state) => state.updateItem);
  const addItem = useUserWardrobeStore((state) => state.addItem);
  const items = useUserWardrobeStore((state) => state.items);
  const removeItem = useUserWardrobeStore((state) => state.removeItem);
  const userItem = useUserWardrobeStore((state) =>
    state.items.find((item) => item.id === id),
  );
  const mockItem = getMockWardrobeItemById(id);

  useEffect(() => {
    if (userId) {
      setWardrobeStoreUserId(userId);
    }
  }, [userId]);

  const initialName = userItem?.customName ?? mockItem?.name ?? "Unknown item";
  const initialCategory = userItem?.category ?? mockItem?.category ?? "top";
  const initialColor = userItem?.primaryColor ?? mockItem?.color ?? "";
  const initialOccasion =
    userItem?.occasion?.[0] ?? mockItem?.occasion ?? "Casual";
  const initialImageUrl = userItem?.imageUrl ?? "";

  // Form state — pre-filled by AI when scanned
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<string>(initialCategory);
  const [color, setColor] = useState(initialColor);
  // Auto-resolve colorHex from COLOR_OPTIONS if not explicitly set
  const resolvedHex = (() => {
    const explicit = userItem?.colorHex ?? mockItem?.bgColor ?? "";
    if (explicit) return explicit;
    // Lookup from COLOR_OPTIONS by primaryColor name
    const match = COLOR_OPTIONS.find(
      (c) => c.name.toLowerCase() === initialColor.toLowerCase(),
    );
    return match?.hex ?? "";
  })();
  const [colorHex, setColorHex] = useState(resolvedHex);
  const [occasions, setOccasions] = useState<Occasion[]>(
    userItem?.occasion
      ? (userItem.occasion as Occasion[])
      : [initialOccasion as Occasion],
  );
  const [seasons, setSeasons] = useState<Season[]>(
    userItem?.season
      ? (userItem.season as Season[])
      : [(userItem?.season?.[0] as Season) ?? "All Season"],
  );
  const [matchingColors] = useState<MatchingColor[]>([]);
  const [localPhotoUri, setLocalPhotoUri] = useState(initialImageUrl);
  const [notes, setNotes] = useState(userItem?.notes ?? "");
  const [brand, setBrand] = useState(userItem?.brand ?? "");
  const [styleTag, setStyleTag] = useState(userItem?.style?.join(", ") ?? "");
  const [careInstructions, setCareInstructions] = useState(
    userItem?.careInstructions ?? "",
  );

  // Bottom sheet state
  const [activeSheet, setActiveSheet] = useState<
    | "category"
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

  const [rating, setRating] = useState<number>(userItem?.rating ?? 5);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleConfirm = useCallback(async () => {
    const updates = {
      customName: name,
      category,
      brand,
      careInstructions,
      notes,
      rating: rating || 5,
      primaryColor: color,
      colorHex,
      imageUrl: localPhotoUri,
      season: seasons.length > 0 ? seasons : undefined,
      occasion: occasions.length > 0 ? occasions : undefined,
    };

    if (userItem?.id) {
      await updateItem(userItem.id, updates);
    } else {
      addItem({
        ...updates,
        id: id && id.length > 10 ? id : undefined,
        category: category || "top",
      });
    }
    router.back();
  }, [
    router,
    id,
    name,
    category,
    brand,
    careInstructions,
    notes,
    rating,
    color,
    colorHex,
    occasions,
    seasons,
    localPhotoUri,
    updateItem,
    addItem,
    userItem,
  ]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
          <Pressable
            onPress={() => {
              router.push(`/(root)/create-outfit?itemId=${id}` as never);
            }}
            style={{ zIndex: 10 }}
          >
            <IconPentagonPlus size={24} color="#1D1A27" strokeWidth={1.5} />
          </Pressable>
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: "#1D1A27",
                textAlign: "center",
              }}
            >
              Item Details
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <Pressable onPress={() => setIsMenuOpen(true)}>
              <IconDotsVertical size={24} color="#1D1A27" />
            </Pressable>
          </View>
        </View>

        {isMenuOpen && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setIsMenuOpen(false)}
            />
            <View
              style={{
                position: "absolute",
                top: 100,
                right: 30,
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                paddingVertical: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 5,
                minWidth: 160,
              }}
            >
              <Pressable
                onPress={async () => {
                  setIsMenuOpen(false);
                  await removeItem(id);
                  router.back();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  gap: 12,
                }}
              >
                <IconTrash size={20} color="#EF4444" />
                <Text
                  style={{ fontSize: 15, fontWeight: "500", color: "#EF4444" }}
                >
                  Delete Item
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photo Section ── */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 10,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 280,
                height: 280,
                backgroundColor: "#fff",
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
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F8F7FC",
                  }}
                >
                  <IconPhoto size={32} color="#C4C4CC" />
                </View>
              )}
            </View>
          </View>
          {/* ── Fields ── */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 100,
              gap: 24,
            }}
          >
            {/* Item name (invisible in target, but maybe we keep it as a row?) */}
            {/* The target UI just shows My Rating, Season, Occasion, Category, Color */}

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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                My Rating
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                Season
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#00000090",
                    fontWeight: "500",
                  }}
                >
                  {seasons.join(", ")}
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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                Occasion
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#00000090",
                    fontWeight: "500",
                  }}
                >
                  {occasions.join(", ")}
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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                Category
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#00000090",
                    fontWeight: "500",
                  }}
                >
                  {category === "top"
                    ? "Tops > Shirt"
                    : (CATEGORIES.find((c) => c.id === category)?.label ??
                      category)}
                </Text>
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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                Color
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
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
                        color: "#00000090",
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
                        color: "#00000090",
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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                Brand / Designer
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: brand ? "#00000090" : "#D1D5DB",
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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                Care Instructions
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: careInstructions ? "#00000090" : "#D1D5DB",
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
                style={{
                  fontSize: 15,
                  color: "#000000",
                  fontWeight: "500",
                }}
              >
                Notes
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#00000090",
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
            paddingHorizontal: 30,
            // borderTopLeftRadius: 20,
            // borderTopRightRadius: 20,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            backgroundColor: "rgba(255, 255, 255, 1)",
          }}
        >
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => ({
              backgroundColor: "#1D1A27",
              borderRadius: 999,
              height: 56,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
            })}
          >
            <Text
              style={{
                color: "#ffffffff",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.3,
                textAlign: "center",
                // borderWidth: 1,
                paddingVertical:14,
                borderRadius:50,
                backgroundColor:"#000000ff"
              }}
            >
              Done
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
                        justifyContent: "center",
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
                        {activeSheet === "category"
                          ? "Select Category"
                          : activeSheet === "occasion"
                            ? "Select Occasion"
                            : activeSheet === "season"
                              ? "Select Season"
                              : activeSheet === "rating"
                                ? "My Rating"
                                : activeSheet === "color"
                                  ? "Select Color"
                                  : activeSheet === "brand"
                                    ? "Brand / Designer"
                                    : activeSheet === "care"
                                      ? "Care Instructions"
                                      : "Notes"}
                      </Text>
                    </View>

                    {/* Options */}
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 10,
                      }}
                    >
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
                                <IconStarFilled size={36} color="#000000" />
                              ) : (
                                <IconStarFilled size={36} color="#E5E7EB" />
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
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                              paddingHorizontal: 18,
                              paddingVertical: 10,
                              borderRadius: 999,
                              backgroundColor:
                                category === c.id ? "#1D1A27" : "#fff",
                              borderWidth: 1,
                              borderColor:
                                category === c.id ? "#1D1A27" : "#E5E7EB",
                            }}
                          >
                            {getCategoryIcon(
                              c.label,
                              category === c.id ? "#fff" : "#6B7280",
                            )}
                            <Text
                              style={{
                                color: category === c.id ? "#fff" : "#6B7280",
                                fontSize: 14,
                                fontWeight: "500",
                              }}
                            >
                              {c.label}
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
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
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
                              {getSeasonIcon(
                                s,
                                isSelected ? "#fff" : "#6B7280",
                              )}
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
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
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
                              {getOccasionIcon(
                                o,
                                isSelected ? "#fff" : "#6B7280",
                              )}
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
      </SafeAreaView>
    </View>
  );
}
