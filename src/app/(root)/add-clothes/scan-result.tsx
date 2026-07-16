import { uploadToCloudinaryWithBgRemoval } from "@/features/scanning/api/cloudinary-upload";
import { FullClothingAnalysis, analyzeClothingFull } from "@/features/scanning/api/gemini-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { IconArrowLeft, IconCheck, IconSparkles } from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePremiumLimits } from "@/shared/hooks/usePremiumLimits";
import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  category: "Top",
  subCategory: "Unknown",
  primaryColor: "Unknown",
  secondaryColors: [],
  pattern: "Solid",
  fabricGuess: "Unknown",
  fit: "Regular",
  sleeveType: "N/A",
  neckType: "N/A",
  season: ["All Season"],
  occasion: ["Casual"],
  formalityScore: 5,
  versatilityTags: [],
  confidence: 0.75,
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600" }}>
          AI Confidence
        </Text>
        <Text style={{ color: "#7C6AFF", fontSize: 12, fontWeight: "700" }}>
          {pct}%
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: "#2A2840",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${pct}%`,
            backgroundColor: "#7C6AFF",
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

export default function ScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as ScanResultParams;
  const { canAddWardrobe, handleLimitReached } = usePremiumLimits();
  const addItem = useUserWardrobeStore((s) => s.addItem);
  const hasItem = useUserWardrobeStore((s) => s.hasItem);
  const removeOutfit = useOutfitAnalysisStore((s) => s.removeOutfit);
  const addScan = useScanHistoryStore((s) => s.addScan);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(!params.resultJson);
  const [photoUri, setPhotoUri] = useState(params.photoUri);
  const [remainingUris, setRemainingUris] = useState<string[]>(() => {
    try {
      return params.remainingUris ? JSON.parse(params.remainingUris) : [];
    } catch {
      return [];
    }
  });

  const totalItems = 1 + (params.remainingUris ? (() => { try { return JSON.parse(params.remainingUris).length; } catch { return 0; } })() : 0);
  const currentIndex = totalItems - remainingUris.length;
  const [result, setResult] = useState<FullClothingAnalysis>(() => {
    try {
      if (!params.resultJson) return DEFAULT_RESULT;
      return JSON.parse(params.resultJson) as FullClothingAnalysis;
    } catch {
      return DEFAULT_RESULT;
    }
  });

  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // Editable fields
  const [customName, setCustomName] = useState("");
  const [brand, setBrand] = useState("");

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
          // 1. Remove background and upload to Cloudinary FIRST
          const uploadRes = await uploadToCloudinaryWithBgRemoval(photoUri);
          
          finalImageUri = uploadRes.imageUrl;
          aiImageUri = uploadRes.imageUrl;
          
          setCloudinaryUrl(uploadRes.imageUrl);
          setOriginalUrl(uploadRes.originalImageUrl);
        } catch (bgError) {
          console.warn("Background removal failed, falling back to original image:", bgError);
          // If bg removal fails, we proceed with the original image
          aiImageUri = photoUri;
          setOriginalUrl(photoUri);
        }
        setLoadingText("AI is extracting styling details...");
        // 2. Analyze with Gemini on the background-removed image (or fallback)
        const aiData = await analyzeClothingFull(aiImageUri);
        
        // Handle Error Rejection
        if (aiData?.category === "Full Body") {
          Alert.alert(
            "Invalid Image",
            "Please upload a picture of a single clothing item. Full body pictures are meant for Fit Check mode.",
            [{ text: "OK", onPress: () => router.back() }]
          );
          return;
        } else if (aiData?.category === "Not Clothing") {
          Alert.alert(
            "Invalid Image",
            "We couldn't detect any clothing in this picture. Please try another image.",
            [{ text: "OK", onPress: () => router.back() }]
          );
          return;
        }

        if (aiData) {
          setResult(aiData);
          setCustomName(`${aiData.primaryColor} ${aiData.subCategory}`);
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
      setCustomName("");
      setBrand("");
      setPhotoUri(nextUri); // triggers useEffect
    } else {
      router.back();
    }
  };

  const alreadyInWardrobe = hasItem(result.category, result.primaryColor);

  const handleSave = async () => {
    if (saved || alreadyInWardrobe) return;
    if (!canAddWardrobe) {
      handleLimitReached("wardrobe");
      return;
    }
    setSaving(true);
    addItem({
      customName,
      brand,
      category: result.category,
      subCategory: result.subCategory,
      primaryColor: result.primaryColor,
      secondaryColors: result.secondaryColors,
      pattern: result.pattern,
      fabricGuess: result.fabricGuess,
      fit: result.fit,
      sleeveType: result.sleeveType,
      neckType: result.neckType,
      season: result.season,
      occasion: result.occasion,
      formalityScore: result.formalityScore,
      versatilityTags: result.versatilityTags,
      careInstructions: result.careInstructions,
      notes: result.notes,
      colorHex: result.colorHex,
      imageUrl: cloudinaryUrl || photoUri,
      originalImageUrl: originalUrl || photoUri,
      confidence: result.confidence,
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
    }
  };

  const chips = [
    { label: "Category", value: result.category },
    { label: "Type", value: result.subCategory },
    { label: "Color", value: result.primaryColor },
    { label: "Material", value: result.fabricGuess },
    { label: "Pattern", value: result.pattern },
    { label: "Fit", value: result.fit },
    { label: "Season", value: result.season?.join(", ") },
    { label: "Occasion", value: result.occasion?.join(", ") },
    { label: "Formality", value: `${result.formalityScore}/10` },
    { label: "Care", value: result.careInstructions },
    { label: "Notes", value: result.notes },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E15", alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#7C6AFF" />
        <Text style={{ color: "#AAA", marginTop: 16, fontSize: 16, fontWeight: "600" }}>{loadingText}</Text>
      </View>
    );
  }

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
              Wardrobe Item
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Photo */}
          {(cloudinaryUrl || params.photoUri) ? (
            <Image
              source={{ uri: cloudinaryUrl || params.photoUri }}
              style={{
                height: 300,
                marginHorizontal: 20,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#1A1827", 
              }}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{
                height: 240,
                marginHorizontal: 20,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#1A1827",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#555", fontSize: 14 }}>No image</Text>
            </View>
          )}

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
                Already in Wardrobe
              </Text>
            </View>
          )}

          <ConfidenceBar confidence={result.confidence} />

          {/* Editable Fields */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#161422",
              borderRadius: 24,
              padding: 20,
              gap: 16
            }}
          >
            <View>
              <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                Item Name (Editable)
              </Text>
              <TextInput
                value={customName}
                onChangeText={setCustomName}
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: "800",
                  backgroundColor: "#2A2840",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                placeholder="E.g. Favorite Blue Shirt"
                placeholderTextColor="#666"
              />
            </View>
            <View>
              <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                Brand (Optional)
              </Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "500",
                  backgroundColor: "#2A2840",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                placeholder="E.g. Zara, H&M"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* Core Visuals */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#161422",
              borderRadius: 24,
              padding: 20,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 14,
              }}
            >
              Styling Intelligence
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {chips.map((chip, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: "#7C6AFF22",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: "#7C6AFF44",
                  }}
                >
                  <Text style={{ color: "#888", fontSize: 10, fontWeight: "600" }}>
                    {chip.label}
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                    {chip.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Versatility Tags */}
          {result.versatilityTags && result.versatilityTags.length > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                backgroundColor: "#161422",
                borderRadius: 24,
                padding: 20,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: "700",
                  marginBottom: 14,
                }}
              >
                Versatility
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.versatilityTags.map((tag, i) => (
                  <View key={i} style={{ backgroundColor: "#2A2840", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ color: "#DDD", fontSize: 12 }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={{ marginHorizontal: 16, gap: 10 }}>
            <Pressable
              onPress={handleSave}
              disabled={saved || alreadyInWardrobe || saving}
              style={{
                backgroundColor:
                  saved || alreadyInWardrobe ? "#1A1827" : "#7C6AFF",
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
                  {(saved || alreadyInWardrobe) && (
                    <IconCheck size={16} color="#FFFFFF" />
                  )}
                  <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                    {alreadyInWardrobe
                      ? "Already Saved"
                      : saved
                        ? "Saved to Wardrobe!"
                        : "Save to Wardrobe"}
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
    </View>
  );
}
