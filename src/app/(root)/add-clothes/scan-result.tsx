import { uploadToCloudinaryWithBgRemoval } from "@/features/scanning/api/cloudinary-upload";
import { FullClothingAnalysis, analyzeClothingFull } from "@/features/scanning/api/ai-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconArrowLeft,
  IconCheck,
  IconSparkles,
  IconPhoto,
  IconCut,
  IconPlus,
  IconX,
} from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { usePremiumLimits } from "@/features/payments/model/usePremiumLimits";
import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { useStreakSync } from "@/features/streaks/api/useStreakSync";
import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { StreakPopup } from "@/shared/ui/StreakPopup";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScanResultParams = {
  photoUri?: string;
  resultJson?: string;
  mode?: string;
  outfitIndex?: string;
  remainingUris?: string;
};

const DEFAULT_RESULT: FullClothingAnalysis = {
  name: "Fashion Item",
  category: "Top",
  subCategory: "Clothing Item",
  color: "Navy Blue",
  colorHex: "#1E3A8A",
  occasion: ["Casual"],
  season: ["All Season"],
  brand: "",
  careInstructions: "Machine wash cold",
  notes: "",
};

const MACRO_CATEGORIES = [
  { id: "Top", label: "👕 Top" },
  { id: "Bottoms", label: "👖 Bottoms" },
  { id: "Footwear", label: "👟 Footwear" },
  { id: "Accessory", label: "👜 Accessory" },
  { id: "Headwear", label: "🧢 Headwear" },
  { id: "Outerwear", label: "🧥 Outerwear" },
  { id: "Dress", label: "👗 Dress" },
  { id: "Ethnic", label: "🥻 Ethnic" },
  { id: "Activewear", label: "🏃 Activewear" },
];

const PRESET_OCCASIONS = [
  "Casual",
  "Office",
  "Party",
  "Date",
  "Wedding",
  "Gym",
  "Travel",
  "Lounge",
];

const PRESET_SEASONS = [
  "All Season",
  "Summer",
  "Winter",
  "Monsoon",
  "Spring",
  "Autumn",
];

export default function ScanResultScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams() as ScanResultParams;
  const { canAddWardrobe, handleLimitReached } = usePremiumLimits();
  const addItem = useUserWardrobeStore((s) => s.addItem);
  const hasItem = useUserWardrobeStore((s) => s.hasItem);
  const removeOutfit = useOutfitAnalysisStore((s) => s.removeOutfit);
  const addScan = useScanHistoryStore((s) => s.addScan);
  const { syncStreak } = useStreakSync();
  const { hasIncrementedToday, dismissIncrement, currentStreak } = useStreakStore();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing...");

  const [loading, setLoading] = useState(!params.resultJson);
  const [photoUri, setPhotoUri] = useState(params.photoUri);
  const [remainingUris, setRemainingUris] = useState<string[]>(() => {
    try {
      return params.remainingUris ? JSON.parse(params.remainingUris) : [];
    } catch {
      return [];
    }
  });

  const totalItems =
    1 +
    (params.remainingUris
      ? (() => {
          try {
            return JSON.parse(params.remainingUris).length;
          } catch {
            return 0;
          }
        })()
      : 0);
  const currentIndex = totalItems - remainingUris.length;

  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // In-Place Editable State Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Top");
  const [subCategory, setSubCategory] = useState("");
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("#1E3A8A");
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(["Casual"]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(["All Season"]);
  const [brand, setBrand] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [notes, setNotes] = useState("");

  // Custom Occasion Modal state
  const [customOccasionInput, setCustomOccasionInput] = useState("");
  const [showCustomOccasionModal, setShowCustomOccasionModal] = useState(false);

  const [result, setResult] = useState<FullClothingAnalysis>(() => {
    try {
      if (!params.resultJson) return DEFAULT_RESULT;
      return JSON.parse(params.resultJson) as FullClothingAnalysis;
    } catch {
      return DEFAULT_RESULT;
    }
  });

  const applyAiDataToState = (data: FullClothingAnalysis) => {
    setResult(data);
    const resolvedName =
      data.name ||
      `${data.color || data.primaryColor || ""} ${data.subCategory || data.category || "Item"}`.trim();
    setName(resolvedName || "Wardrobe Item");
    setCategory(data.category || "Top");
    setSubCategory(data.subCategory || "");
    setColor(data.color || data.primaryColor || "Unknown");
    setColorHex(data.colorHex || "#1E3A8A");
    if (data.occasion && data.occasion.length > 0) {
      setSelectedOccasions(data.occasion);
    }
    if (data.season && data.season.length > 0) {
      setSelectedSeasons(data.season);
    }
    setBrand(data.brand && data.brand !== "Unknown" ? data.brand : "");
    setCareInstructions(data.careInstructions || "");
    setNotes(data.notes || "");
  };

  useEffect(() => {
    if (params.resultJson) {
      applyAiDataToState(result);
    }
  }, [params.resultJson]);

  useEffect(() => {
    const processImage = async () => {
      if (!photoUri) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let aiImageUri = photoUri;
        let finalImageUri = photoUri;

        try {
          setLoadingText("Removing background...");
          const uploadRes = await uploadToCloudinaryWithBgRemoval(photoUri);

          finalImageUri = uploadRes.imageUrl;
          aiImageUri = uploadRes.imageUrl;

          setCloudinaryUrl(uploadRes.imageUrl);
          setOriginalUrl(uploadRes.originalImageUrl);
        } catch (bgError) {
          console.warn("Background removal failed, falling back to original image:", bgError);
          aiImageUri = photoUri;
          setOriginalUrl(photoUri);
        }

        setLoadingText("AI is extracting styling details...");
        const aiData = await analyzeClothingFull(aiImageUri);

        // Validation rejection — check validationStatus and category for invalid images
        const validationStatus = aiData?.validationStatus;
        if (validationStatus === "full_body" || aiData?.category === "Full Body") {
          Alert.alert(
            "Full Body Photo Detected",
            "Please scan a single clothing item, not a full body photo. Use Fit Check mode for full body shots.",
            [{ text: "Got it", onPress: () => router.back() }]
          );
          setLoading(false);
          return;
        }
        if (validationStatus === "not_clothing" || aiData?.category === "Not Clothing") {
          Alert.alert(
            "Not a Clothing Item",
            "This doesn't look like a clothing item, footwear, or accessory. Please try again with a clear photo of a fashion item.",
            [{ text: "Try Again", onPress: () => router.back() }]
          );
          setLoading(false);
          return;
        }
        if (validationStatus === "multiple_items") {
          Alert.alert(
            "Multiple Items Detected",
            "Please scan one item at a time. Frame a single clothing piece, shoe, or accessory and try again.",
            [{ text: "Got it", onPress: () => router.back() }]
          );
          setLoading(false);
          return;
        }
        if (validationStatus === "unclear") {
          Alert.alert(
            "Image Unclear",
            "The image is too blurry or dark to analyze. Please retake with better lighting.",
            [{ text: "Retake", onPress: () => router.back() }]
          );
          setLoading(false);
          return;
        }

        if (aiData) {
          applyAiDataToState(aiData);
        }

        addScan({
          type: "cloth",
          thumbnail: finalImageUri,
          date: new Date().toISOString(),
          result: (aiData || DEFAULT_RESULT) as unknown as Record<string, unknown>,
          isFavorite: false,
        });
      } catch (err) {
        console.error("Failed to process scan:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!params.resultJson && photoUri) {
      processImage();
    }
  }, [photoUri]);

  const advanceToNext = () => {
    if (remainingUris.length > 0) {
      const nextUri = remainingUris[0];
      setRemainingUris(remainingUris.slice(1));
      setSaved(false);
      setResult(DEFAULT_RESULT);
      setCloudinaryUrl(null);
      setOriginalUrl(null);
      setName("");
      setBrand("");
      setPhotoUri(nextUri);
    } else {
      router.back();
    }
  };

  const toggleOccasion = (occ: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const toggleSeason = (s: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSeasons((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const handleAddCustomOccasion = () => {
    const trimmed = customOccasionInput.trim();
    if (trimmed && !selectedOccasions.includes(trimmed)) {
      setSelectedOccasions((prev) => [...prev, trimmed]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCustomOccasionInput("");
    setShowCustomOccasionModal(false);
  };

  const alreadyInWardrobe = hasItem(category, color);

  const handleSave = async () => {
    if (saved || alreadyInWardrobe) return;
    if (!canAddWardrobe) {
      handleLimitReached("wardrobe");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const savedImage = showOriginal && originalUrl ? originalUrl : (cloudinaryUrl || photoUri);

    addItem({
      userId: userId || undefined,
      customName: name.trim() || `${color} ${subCategory || category}`.trim(),
      brand: brand.trim(),
      category: category || "Top",
      subCategory: subCategory.trim() || category,
      primaryColor: color.trim() || "Unknown",
      secondaryColors: [],
      pattern: "Solid",
      fabricGuess: "Standard",
      fit: "Regular",
      sleeveType: undefined,
      neckType: undefined,
      season: selectedSeasons.length > 0 ? selectedSeasons : ["All Season"],
      occasion: selectedOccasions.length > 0 ? selectedOccasions : ["Casual"],
      formalityScore: 5,
      versatilityTags: [],
      careInstructions: careInstructions.trim(),
      notes: notes.trim(),
      colorHex: colorHex || "#000000",
      imageUrl: savedImage,
      originalImageUrl: originalUrl || photoUri,
      confidence: 0.95,
      source: "camera",
      isFavorite: false,
      wearCount: 0,
    });

    if (params.outfitIndex !== undefined) {
      removeOutfit(parseInt(params.outfitIndex, 10));
    }

    setSaving(false);

    if (remainingUris.length > 0) {
      advanceToNext();
    } else {
      setSaved(true);
      syncStreak("scan_mode");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E15", alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#7C6AFF" />
        <Text style={{ color: "#AAA", marginTop: 16, fontSize: 16, fontWeight: "600" }}>{loadingText}</Text>
      </View>
    );
  }

  const activeDisplayImage = showOriginal && originalUrl ? originalUrl : (cloudinaryUrl || params.photoUri);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E15" }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => advanceToNext()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#1A1827",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800" }}>
              Universal Scan
            </Text>
            {totalItems > 1 && (
              <Text style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
                Item {currentIndex} of {totalItems}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#7C6AFF22",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: "#7C6AFF44",
            }}
          >
            <IconSparkles size={12} color="#7C6AFF" />
            <Text style={{ color: "#7C6AFF", fontSize: 11, fontWeight: "700" }}>
              AI Styled
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Photo with Cutout vs Original Toggle */}
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            {activeDisplayImage ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: activeDisplayImage }}
                  style={{
                    height: 280,
                    width: "100%",
                    borderRadius: 20,
                    backgroundColor: "#1A1827",
                  }}
                  resizeMode="contain"
                />

                {/* Toggle Button */}
                {originalUrl && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowOriginal(!showOriginal);
                    }}
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      backgroundColor: "#000000B0",
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: "#FFFFFF30",
                    }}
                  >
                    {showOriginal ? (
                      <>
                        <IconCut size={14} color="#FFFFFF" />
                        <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>Show Cutout</Text>
                      </>
                    ) : (
                      <>
                        <IconPhoto size={14} color="#FFFFFF" />
                        <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>Original</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            ) : (
              <View
                style={{
                  height: 240,
                  borderRadius: 20,
                  backgroundColor: "#1A1827",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#555", fontSize: 14 }}>No image</Text>
              </View>
            )}
          </View>

          {/* Already in wardrobe badge */}
          {alreadyInWardrobe && (
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#FFB30022",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 7,
                alignSelf: "flex-start",
                borderWidth: 1,
                borderColor: "#FFB300",
              }}
            >
              <IconCheck size={14} color="#FFB300" />
              <Text style={{ color: "#FFB300", fontSize: 12, fontWeight: "700" }}>
                Similar item already in closet ({color} {category})
              </Text>
            </View>
          )}

          {/* 1. Item Name Input (Prominent, Direct In-Place Edit) */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 14,
              backgroundColor: "#161422",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
              Item Name (1-Tap Edit)
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={{
                color: "#FFFFFF",
                fontSize: 17,
                fontWeight: "800",
                backgroundColor: "#2A2840",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
              placeholder="e.g. Graphic Hoodie, Chelsea Boots"
              placeholderTextColor="#666"
            />
          </View>

          {/* 2. Macro Category Selector */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 14,
              backgroundColor: "#161422",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {MACRO_CATEGORIES.map((cat) => {
                const isSelected = category.toLowerCase() === cat.id.toLowerCase();
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory(cat.id);
                    }}
                    style={{
                      backgroundColor: isSelected ? "#7C6AFF" : "#2A2840",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? "#9A8CFF" : "#2A2840",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#FFFFFF" : "#CCC",
                        fontSize: 13,
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* SubCategory input if user wants to specify */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#888", fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                Sub-Type / Style
              </Text>
              <TextInput
                value={subCategory}
                onChangeText={setSubCategory}
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "600",
                  backgroundColor: "#2A2840",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
                placeholder="e.g. Graphic Tee, Sneakers, Loafers, Backpack"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* 3. Color with Visual Color Dot + HEX preview */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 14,
              backgroundColor: "#161422",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
              Color & Tone
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Visual Color Dot */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colorHex || "#1E3A8A",
                  borderWidth: 2,
                  borderColor: "#FFFFFF40",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              />
              <TextInput
                value={color}
                onChangeText={setColor}
                style={{
                  flex: 1,
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: "700",
                  backgroundColor: "#2A2840",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
                placeholder="Color Name (e.g. Navy Blue)"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* 4. Occasion Multi-Select Chips + Add Custom */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 14,
              backgroundColor: "#161422",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600" }}>
                Occasion (Multi-Select)
              </Text>
              <Pressable
                onPress={() => setShowCustomOccasionModal(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <IconPlus size={14} color="#7C6AFF" />
                <Text style={{ color: "#7C6AFF", fontSize: 12, fontWeight: "700" }}>Custom</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {Array.from(new Set([...PRESET_OCCASIONS, ...selectedOccasions])).map((occ) => {
                const isSelected = selectedOccasions.includes(occ);
                return (
                  <Pressable
                    key={occ}
                    onPress={() => toggleOccasion(occ)}
                    style={{
                      backgroundColor: isSelected ? "#7C6AFF" : "#2A2840",
                      borderRadius: 12,
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderWidth: 1,
                      borderColor: isSelected ? "#9A8CFF" : "#2A2840",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#FFFFFF" : "#CCC",
                        fontSize: 12,
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {occ}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Season Multi-Select Chips */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 14,
              backgroundColor: "#161422",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 10 }}>
              Season (Multi-Select)
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PRESET_SEASONS.map((s) => {
                const isSelected = selectedSeasons.includes(s);
                return (
                  <Pressable
                    key={s}
                    onPress={() => toggleSeason(s)}
                    style={{
                      backgroundColor: isSelected ? "#7C6AFF" : "#2A2840",
                      borderRadius: 12,
                      paddingHorizontal: 13,
                      paddingVertical: 7,
                      borderWidth: 1,
                      borderColor: isSelected ? "#9A8CFF" : "#2A2840",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#FFFFFF" : "#CCC",
                        fontSize: 12,
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6. Care Instructions */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 14,
              backgroundColor: "#161422",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
              Care Instructions
            </Text>
            <TextInput
              value={careInstructions}
              onChangeText={setCareInstructions}
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "500",
                backgroundColor: "#2A2840",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              placeholder="e.g. Machine wash cold, dry flat"
              placeholderTextColor="#666"
            />
          </View>

          {/* 7. Notes */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 20,
              backgroundColor: "#161422",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "500",
                backgroundColor: "#2A2840",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              placeholder="e.g. Comfortable everyday staple"
              placeholderTextColor="#666"
            />
          </View>


          {/* Action Buttons */}
          <View style={{ marginHorizontal: 16, gap: 10 }}>
            <Pressable
              onPress={handleSave}
              disabled={saved || alreadyInWardrobe || saving}
              style={{
                backgroundColor: saved || alreadyInWardrobe ? "#1A1827" : "#7C6AFF",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                opacity: saved || alreadyInWardrobe ? 0.6 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  {(saved || alreadyInWardrobe) && <IconCheck size={16} color="#FFFFFF" />}
                  <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                    {alreadyInWardrobe
                      ? "Already Saved"
                      : saved
                      ? "Saved to Closet!"
                      : "Add to Closet"}
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={{
                backgroundColor: "#2A2840",
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                Scan Another Item
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Custom Occasion Modal */}
      <Modal
        visible={showCustomOccasionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomOccasionModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}
          onPress={() => setShowCustomOccasionModal(false)}
        >
          <Pressable
            style={{ width: "100%", maxWidth: 340, backgroundColor: "#1A1827", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#2A2840" }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700" }}>Add Custom Occasion</Text>
              <Pressable onPress={() => setShowCustomOccasionModal(false)}>
                <IconX size={20} color="#AAA" />
              </Pressable>
            </View>
            <TextInput
              value={customOccasionInput}
              onChangeText={setCustomOccasionInput}
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                backgroundColor: "#2A2840",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 16,
              }}
              placeholder="e.g. Goa Trip, College Fest, Brunch"
              placeholderTextColor="#666"
              autoFocus
            />
            <Pressable
              onPress={handleAddCustomOccasion}
              style={{
                backgroundColor: "#7C6AFF",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Add Occasion</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <StreakPopup
        visible={hasIncrementedToday}
        onClose={dismissIncrement}
        streakCount={currentStreak}
      />
    </View>
  );
}
