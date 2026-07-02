import { ScanningOverlay } from "@/features/scanning/ui/ScanningOverlay";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconArrowLeft,
  IconCamera,
  IconChevronDown,
  IconPhoto,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

type Occasion = "Casual" | "Office" | "Party" | "Wedding" | "Date" | "Gym";
type Season = "All" | "Summer" | "Winter" | "Monsoon" | "Spring";

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

const OCCASIONS: Occasion[] = ["Casual", "Office", "Party", "Wedding", "Date", "Gym"];
const SEASONS: Season[] = ["All", "Summer", "Winter", "Monsoon", "Spring"];

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
export default function AddClothesFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as FormParams;

  const isScanned = params.mode === "scanned";
  const isManual = params.mode === "manual";

  // Parse matching colors from JSON string
  const initialMatchingColors: MatchingColor[] = (() => {
    try {
      return params.matchingColors ? JSON.parse(params.matchingColors) : [];
    } catch {
      return [];
    }
  })();

  // Form state — pre-filled by AI when scanned
  const [name, setName] = useState(params.name ?? "");
  const [category, setCategory] = useState<string>(params.category ?? "top");
  const [color, setColor] = useState(params.color ?? "");
  const [colorHex, setColorHex] = useState(params.colorHex ?? "");
  const [occasion, setOccasion] = useState<Occasion>(
    (params.occasion as Occasion) ?? "Casual"
  );
  const [season, setSeason] = useState<Season>(
    (params.season as Season) ?? "All"
  );
  const [matchingColors] = useState<MatchingColor[]>(initialMatchingColors);
  const [localPhotoUri, setLocalPhotoUri] = useState(params.photoUri ?? "");
  const [notes, setNotes] = useState("");
  const [showScanOverlay, setShowScanOverlay] = useState(
    params.isScanning === "true"
  );

  // Bottom sheet state
  const [activeSheet, setActiveSheet] = useState<
    "category" | "occasion" | "season" | null
  >(null);

  const panY = useRef(new Animated.Value(400)).current;

  const openSheet = (sheet: typeof activeSheet) => {
    setActiveSheet(sheet);
    panY.setValue(400);
    Animated.spring(panY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
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
    })
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

  const addItem = useUserWardrobeStore((s) => s.addItem);

  const handleConfirm = useCallback(() => {
    addItem({
      name: name || "Untitled item",
      category,
      color: color || undefined,
      photoUri: localPhotoUri || undefined,
      occasion: occasion || undefined,
    });
    router.replace({
      pathname: "/(root)/add-clothes/success",
      params: { photoUri: localPhotoUri, name: name || "Untitled item", category },
    } as never);
  }, [router, name, category, color, occasion, localPhotoUri, addItem]);

  const handleRetake = useCallback(() => {
    router.replace("/(root)/log-outfit/camera" as never);
  }, [router]);

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
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
          }}
        >
          <Pressable
            onPress={() => router.canGoBack() && router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconArrowLeft size={18} color="#1D1A27" strokeWidth={2.5} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>
            {isScanned ? "Confirm details" : "Add manually"}
          </Text>
          <Pressable onPress={handleConfirm}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#7C6AFF" }}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photo Section ── */}
          <View style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 8 }}>
            <View
              style={{
                borderRadius: 24,
                overflow: "hidden",
                height: 260,
                backgroundColor: "#F8F7FC",
                borderWidth: 1,
                borderColor: "#E9E9F0",
              }}
            >
              {localPhotoUri ? (
                <ExpoImage
                  source={{ uri: localPhotoUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory"
                />
              ) : (
                <Pressable
                  onPress={handlePickPhoto}
                  style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <IconPhoto size={32} color="#C4C4CC" />
                  <Text style={{ color: "#C4C4CC", fontSize: 13 }}>
                    Tap to add photo
                  </Text>
                </Pressable>
              )}

              {/* AI badge */}
              {isScanned && (
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: "rgba(124,106,255,0.92)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <IconSparkles size={11} color="#fff" strokeWidth={2.5} />
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                    AI Prefilled
                  </Text>
                </View>
              )}

              {/* Change photo button */}
              {localPhotoUri && (
                <Pressable
                  onPress={handlePickPhoto}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(255,255,255,0.92)",
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <IconPhoto size={11} color="#374151" />
                  <Text style={{ fontSize: 11, color: "#374151", fontWeight: "600" }}>
                    Change
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Action buttons below photo */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              {isScanned && (
                <Pressable
                  onPress={handleRetake}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: "#E5E7EB",
                    backgroundColor: "#FAFAFA",
                  }}
                >
                  <IconCamera size={16} color="#6B7280" strokeWidth={2} />
                  <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "600" }}>
                    Retake / Rescan
                  </Text>
                </Pressable>
              )}
            </View>

            {isScanned && (
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 12,
                  marginTop: 10,
                  lineHeight: 18,
                }}
              >
                ✨ We&apos;ve prefilled what AI detected. Tap any field to edit before saving.
              </Text>
            )}
          </View>

          {/* ── Fields ── */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 24 }}>
            {/* Item name */}
            <View>
              <SectionLabel text="Item Name" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Navy Blue Denim Jacket"
                placeholderTextColor="#D1D5DB"
                style={{
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: "#111827",
                  fontWeight: "500",
                }}
              />
            </View>

            {/* Category picker */}
            <View>
              <SectionLabel text="Category" />
              <Pressable
                onPress={() => openSheet("category")}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 15, color: "#111827", fontWeight: "500" }}>
                  {CATEGORIES.find((c) => c.id === category)?.label ?? category}
                </Text>
                <IconChevronDown size={18} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Color */}
            <View>
              <SectionLabel text="Color" />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {colorHex ? (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colorHex,
                      borderWidth: 2,
                      borderColor: "#E5E7EB",
                    }}
                  />
                ) : null}
                <TextInput
                  value={color}
                  onChangeText={setColor}
                  placeholder="e.g. Navy Blue"
                  placeholderTextColor="#D1D5DB"
                  style={{
                    flex: 1,
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: "#111827",
                    fontWeight: "500",
                  }}
                />
              </View>
            </View>

            {/* Occasion */}
            <View>
              <SectionLabel text="Occasion" />
              <ChipSelector options={OCCASIONS} value={occasion} onChange={setOccasion} />
            </View>

            {/* Season */}
            <View>
              <SectionLabel text="Season" />
              <ChipSelector options={SEASONS} value={season} onChange={setSeason} />
            </View>

            {/* Matching Colors (AI suggestion) */}
            {matchingColors.length > 0 && (
              <View>
                <SectionLabel text="AI Suggested Matching Colors" />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {matchingColors.map((mc) => (
                    <View key={mc.hex} style={{ alignItems: "center", gap: 6 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: mc.hex,
                          borderWidth: 2,
                          borderColor: "#E5E7EB",
                          shadowColor: mc.hex,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                          elevation: 3,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#6B7280",
                          fontWeight: "600",
                          maxWidth: 54,
                          textAlign: "center",
                        }}
                      >
                        {mc.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Notes */}
            <View>
              <SectionLabel text="Notes (optional)" />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Gifted by mom, hand wash only"
                placeholderTextColor="#D1D5DB"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 14,
                  color: "#111827",
                  textAlignVertical: "top",
                  minHeight: 80,
                }}
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom CTA ── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 28,
            paddingTop: 16,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
          }}
        >
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
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
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

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>
                      {activeSheet === "category"
                        ? "Select Category"
                        : activeSheet === "occasion"
                        ? "Select Occasion"
                        : "Select Season"}
                    </Text>
                    <Pressable onPress={closeSheet}>
                      <IconX size={22} color="#9CA3AF" />
                    </Pressable>
                  </View>

                  {/* Options */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {activeSheet === "category" &&
                      CATEGORIES.map((c) => (
                        <Pressable
                          key={c.id}
                          onPress={() => { setCategory(c.id); closeSheet(); }}
                          style={{
                            paddingHorizontal: 18,
                            paddingVertical: 10,
                            borderRadius: 999,
                            backgroundColor: category === c.id ? "#1D1A27" : "#F3F4F6",
                            borderWidth: 1,
                            borderColor: category === c.id ? "#1D1A27" : "#E5E7EB",
                          }}
                        >
                          <Text
                            style={{
                              color: category === c.id ? "#fff" : "#374151",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {c.label}
                          </Text>
                        </Pressable>
                      ))}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        <ScanningOverlay
          visible={showScanOverlay}
          onComplete={() => setShowScanOverlay(false)}
        />
      </SafeAreaView>
    </View>
  );
}
