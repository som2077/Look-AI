import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { getMockWardrobeItemById } from "@/shared/testing/mock-wardrobe-items";
import {
  IconArrowLeft,
  IconChevronDown,
  IconDotsVertical,
  IconInfoCircle,
  IconPentagonPlus,
  IconPhoto,
  IconRefresh,
  IconShare,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryId =
  | "top"
  | "dress"
  | "bottoms"
  | "ethnic"
  | "outerwear"
  | "footwear"
  | "accessory";

type Occasion =
  | "Daily"
  | "Work"
  | "Date"
  | "Formal"
  | "Travel"
  | "Home"
  | "Party"
  | "Sport"
  | "Special"
  | "School"
  | "Beach"
  | "Etc";
type Season = "Spring" | "Summer" | "Fall" | "Winter";

interface MatchingColor {
  name: string;
  hex: string;
}

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "bottoms", label: "Bottoms" },
  { id: "dress", label: "Dress" },
  { id: "ethnic", label: "Ethnic" },
  { id: "outerwear", label: "Outerwear" },
  { id: "footwear", label: "Footwear" },
  { id: "accessory", label: "Accessory" },
];

const OCCASIONS: Occasion[] = [
  "Daily",
  "Work",
  "Date",
  "Formal",
  "Travel",
  "Home",
  "Party",
  "Sport",
  "Special",
  "School",
  "Beach",
  "Etc",
];
const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

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
export default function ClothDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const updateItem = useUserWardrobeStore((state) => state.updateItem);
  const items = useUserWardrobeStore((state) => state.items);
  const removeItem = useUserWardrobeStore((state) => state.removeItem);
  const userItem = useUserWardrobeStore((state) =>
    state.items.find((item) => item.id === id),
  );
  const mockItem = getMockWardrobeItemById(id);

  const initialName = userItem?.customName ?? mockItem?.name ?? "Unknown item";
  const initialCategory = userItem?.category ?? mockItem?.category ?? "top";
  const initialColor = userItem?.primaryColor ?? mockItem?.color ?? "";
  const initialOccasion =
    userItem?.occasion?.[0] ?? mockItem?.occasion ?? "Daily";
  const initialImageUrl = userItem?.imageUrl ?? "";

  // Form state — pre-filled by AI when scanned
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<string>(initialCategory);
  const [color, setColor] = useState(initialColor);
  const [colorHex, setColorHex] = useState(mockItem?.bgColor ?? "");
  const [occasion, setOccasion] = useState<Occasion>(
    (initialOccasion as Occasion) ?? "Daily",
  );
  const [season, setSeason] = useState<Season>("Spring");
  const [matchingColors] = useState<MatchingColor[]>([]);
  const [localPhotoUri, setLocalPhotoUri] = useState(initialImageUrl);
  const [notes, setNotes] = useState("");

  // Bottom sheet state
  const [activeSheet, setActiveSheet] = useState<
    | "category"
    | "occasion"
    | "season"
    | "rating"
    | "color"
    | "notes"
    | "menu"
    | null
  >(null);

  const [rating, setRating] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"Info" | "Outfit">("Info");
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

  const handleConfirm = useCallback(() => {
    if (userItem?.id) {
      updateItem(userItem.id, {
        customName: name,
        category,
        primaryColor: color,
        imageUrl: localPhotoUri,
        occasion: occasion ? [occasion] : undefined,
      });
    }
    router.back();
  }, [
    router,
    name,
    category,
    color,
    occasion,
    localPhotoUri,
    updateItem,
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
              handleConfirm();
            }}
          >
            <IconArrowLeft size={24} color="#1D1A27" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "600", color: "#1D1A27" }}>
            Item Details
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable
              onPress={() =>
                router.push(`/(root)/create-outfit?itemId=${id}` as never)
              }
            >
              <IconPentagonPlus size={24} color="#1D1A27" strokeWidth={1.5} />
            </Pressable>
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
                top: 50,
                right: 20,
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
                onPress={() => {
                  setIsMenuOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  gap: 12,
                }}
              >
                <IconShare size={20} color="#1D1A27" />
                <Text
                  style={{ fontSize: 15, fontWeight: "500", color: "#1D1A27" }}
                >
                  Share
                </Text>
              </Pressable>

              <View
                style={{
                  height: 1,
                  backgroundColor: "#F3F4F6",
                  marginVertical: 4,
                }}
              />

              <Pressable
                onPress={() => {
                  setIsMenuOpen(false);
                  removeItem(id);
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

          {/* ── Segmented Control ── */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 30,
              backgroundColor: "#F3F4F6",
              borderRadius: 12,
              flexDirection: "row",
              padding: 4,
            }}
          >
            <Pressable
              onPress={() => setActiveTab("Info")}
              style={{
                flex: 1,
                backgroundColor: activeTab === "Info" ? "#fff" : "transparent",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                ...(activeTab === "Info"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: activeTab === "Info" ? "600" : "500",
                  color: activeTab === "Info" ? "#1D1A27" : "#9CA3AF",
                }}
              >
                Info
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("Outfit")}
              style={{
                flex: 1,
                backgroundColor:
                  activeTab === "Outfit" ? "#fff" : "transparent",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                ...(activeTab === "Outfit"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: activeTab === "Outfit" ? "600" : "500",
                  color: activeTab === "Outfit" ? "#1D1A27" : "#9CA3AF",
                }}
              >
                Outfit
              </Text>
            </Pressable>
          </View>

          {/* ── Fields ── */}
          {activeTab === "Info" ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 30, gap: 24 }}>
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
                    }}
                  >
                    {season}
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
                    }}
                  >
                    {occasion}
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
                    style={{
                      fontSize: 15,
                      color: "#374151",
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
                  ) : (
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
                          backgroundColor: "#EAB308",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#374151",
                          fontWeight: "500",
                        }}
                      >
                        Yellow
                      </Text>
                    </View>
                  )}
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
          ) : (
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 30,
                paddingBottom: 100,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#374151" }}
                >
                  Try this outfit
                </Text>
                <Pressable>
                  <IconRefresh size={20} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Horizontal Scroll for outfits */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {/* Empty State Card */}
                <View
                  style={{
                    width: 300,
                    height: 320,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                    marginRight: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
                    No outfit suggestions yet
                  </Text>
                </View>
              </ScrollView>

              {/* Info Text */}
              <View style={{ flexDirection: "row", marginTop: 24 }}>
                <IconInfoCircle
                  size={18}
                  color="#9CA3AF"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  Season, category, color, pattern, and material information are
                  used for outfit suggestions. Please ensure you&apos;ve entered
                  the correct information to get the best recommendations.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Category Bottom Sheet ── */}
        <Modal
          visible={activeSheet !== null}
          transparent
          animationType="none"
          onRequestClose={closeSheet}
          statusBarTranslucent
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
              <Pressable onPress={() => {}}>
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
                                : "Notes"}
                    </Text>
                    <Pressable onPress={closeSheet}>
                      <IconX size={22} color="#9CA3AF" />
                    </Pressable>
                  </View>

                  {/* Options */}
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
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
                            borderColor: category === c.id ? "#000" : "#E5E7EB",
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

                    {activeSheet === "season" &&
                      SEASONS.map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => {
                            setSeason(s);
                            closeSheet();
                          }}
                          style={{
                            paddingHorizontal: 18,
                            paddingVertical: 10,
                            borderRadius: 999,
                            backgroundColor: season === s ? "#fff" : "#fff",
                            borderWidth: 1,
                            borderColor: season === s ? "#000" : "#E5E7EB",
                          }}
                        >
                          <Text
                            style={{
                              color: season === s ? "#000" : "#6B7280",
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            {s}
                          </Text>
                        </Pressable>
                      ))}

                    {activeSheet === "occasion" &&
                      OCCASIONS.map((o) => (
                        <Pressable
                          key={o}
                          onPress={() => {
                            setOccasion(o);
                            closeSheet();
                          }}
                          style={{
                            paddingHorizontal: 18,
                            paddingVertical: 10,
                            borderRadius: 999,
                            backgroundColor: occasion === o ? "#fff" : "#fff",
                            borderWidth: 1,
                            borderColor: occasion === o ? "#000" : "#E5E7EB",
                          }}
                        >
                          <Text
                            style={{
                              color: occasion === o ? "#000" : "#6B7280",
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            {o}
                          </Text>
                        </Pressable>
                      ))}

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
                            backgroundColor: color === c.name ? "#fff" : "#fff",
                            borderWidth: 1,
                            borderColor: color === c.name ? "#000" : "#E5E7EB",
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
                              style={{ width: 16, height: 16, borderRadius: 8 }}
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
        </Modal>
      </SafeAreaView>
    </View>
  );
}
