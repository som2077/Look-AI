import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { usePremiumLimits } from "@/features/payments/model/usePremiumLimits";
import { LabelAnalysis } from "@/features/scanning/api/ai-scan";
import { saveLabelToDatabase } from "@/features/scanning/api/save-label";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { useSavedStore } from "@/features/wardrobe/model/saved-store";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useAuth } from "@clerk/clerk-expo";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBleachOff,
  IconBookmark,
  IconDotsVertical,
  IconIroning1,
  IconShirt,
  IconSparklesFilled,
  IconWashMachine,
  IconWind,
  IconX,
} from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LabelResultParams = {
  photoUri?: string;
  resultJson?: string;
  scanId?: string;
  outfitIndex?: string;
};

const DEFAULT_RESULT: LabelAnalysis = {
  care_symbols: [],
  fabric_composition: [],
  brand: null,
  size: null,
  origin_text: null,
  detected_language: null,
  original_text: null,
  translated_text: null,
  label_standard_guess: "unclear",
  needs_user_review: true,
  review_notes: "Could not read label data",
};

export default function LabelResultScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { supabase } = useSupabase();
  const { userId } = useAuth();
  const { canAddClothLabel, handleLimitReached } = usePremiumLimits();
  const params = useLocalSearchParams() as LabelResultParams;
  const addScan = useScanHistoryStore((s) => s.addScan);
  const removeScan = useScanHistoryStore((s) => s.removeScan);
  const scans = useScanHistoryStore((s) => s.scans);
  const removeOutfit = useOutfitAnalysisStore((s) => s.removeOutfit);
  const startAnalysis = useOutfitAnalysisStore((s) => s.startAnalysis);
  const addSavedItem = useSavedStore((s) => s.addSavedItem);
  const insets = useSafeAreaInsets();

  const scanData = params.scanId
    ? scans.find((s) => s.id === params.scanId)
    : null;
  const photoUri = scanData?.thumbnail || params.photoUri;

  const formattedTime = (
    scanData?.date ? new Date(scanData.date) : new Date()
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const [result] = useState<LabelAnalysis>(() => {
    try {
      if (scanData && scanData.result) {
        return {
          ...DEFAULT_RESULT,
          ...(scanData.result as unknown as LabelAnalysis),
        };
      }
      if (!params.resultJson) return DEFAULT_RESULT;
      const parsed = JSON.parse(params.resultJson);
      return { ...DEFAULT_RESULT, ...(parsed || {}) };
    } catch {
      return DEFAULT_RESULT;
    }
  });

  useEffect(() => {
    if (params.resultJson && params.photoUri && !params.scanId) {
      if (!canAddClothLabel) {
        handleLimitReached("cloth_label");
        return;
      }
      addScan({
        type: "label",
        thumbnail: params.photoUri,
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      });
    }
  }, [canAddClothLabel, handleLimitReached]);

  const handleSave = async () => {
    if (photoUri && userId) {
      setIsSaving(true);
      const success = await saveLabelToDatabase({
        supabase,
        userId,
        photoUri,
        analysis: result,
      });
      setIsSaving(false);
      if (success) {
        addSavedItem({
          id: `label-${Date.now()}`,
          name: result.brand ? `${result.brand} Label` : "Care Label",
          occasion: "cloth label",
          wears: 0,
          image: photoUri,
          match: 100,
          tags: ["cloth label"],
          saveType: "label",
        });
      } else {
        Alert.alert("Error", "Failed to save label to database.");
        return;
      }
    } else if (!userId) {
      Alert.alert("Error", "You must be logged in to save.");
      return;
    }
    if (params.outfitIndex) removeOutfit(parseInt(params.outfitIndex));
    router.replace("/(root)/(tabs)" as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {isSaving && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.8)",
            zIndex: 100,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
      <StatusBar style="dark" />

      {/* Absolute Floating Header */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 0.1,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 45,
            height: 45,
            borderRadius: 25,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconArrowLeft size={22} color="#1D1A27" />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "500", color: "#FFFFFF" }}>
          Care Label Result
        </Text>
        <Pressable
          onPress={() => setShowMenu(true)}
          style={{
            width: 45,
            height: 45,
            borderRadius: 25,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconDotsVertical size={22} color="#1D1A27" />
        </Pressable>
      </View>

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
                top: insets.top + 50,
                right: 40,
                backgroundColor: "#ffffff",
                borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
                minWidth: 140,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <Pressable
                style={{ paddingVertical: 12, paddingHorizontal: 16 }}
                onPress={() => {
                  setShowMenu(false);
                  if (params.scanId) removeScan(params.scanId);
                  if (params.outfitIndex)
                    removeOutfit(parseInt(params.outfitIndex));
                  router.replace("/(root)/(tabs)" as never);
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#EF4444",
                    fontWeight: "500",
                  }}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Top Background/Image */}
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        {photoUri ? (
          <>
            <Pressable
              onPress={() => setIsFullscreen(true)}
              style={{ flex: 1 }}
            >
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "55%" }}
                resizeMode="cover"
              />
            </Pressable>

            <Modal
              visible={isFullscreen}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setIsFullscreen(false)}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.9)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Pressable
                  style={{
                    position: "absolute",
                    top: 50,
                    right: 20,
                    zIndex: 10,
                    padding: 8,
                  }}
                  onPress={() => setIsFullscreen(false)}
                >
                  <IconX size={32} color="#FFFFFF" />
                </Pressable>
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: "100%", height: "80%" }}
                  resizeMode="contain"
                />
              </View>
            </Modal>
          </>
        ) : (
          <View style={{ height: "55%" }} />
        )}
      </View>

      {/* Bottom Sheet Container */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60%",
          backgroundColor: "#FEFEFE",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingTop: 24,
          paddingHorizontal: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {/* Time Pill and Bookmark */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#00000010",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#4B5563" }}>
              {formattedTime}
            </Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={{
              width: 33,
              height: 33,
              // borderRadius: 18,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              // shadowColor: "#000",
              // shadowOffset: { width: 0, height: 2 },
              // shadowOpacity: 0.1,
              // shadowRadius: 4,
              // elevation: 2,
            }}
          >
            <IconBookmark size={20} color="#1D1A27" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Warnings */}
          {result.needs_user_review && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#FEF2F2",                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
                padding: 16,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "flex-start",
                borderWidth: 1,
                borderColor: "#FCA5A5",
              }}
            >
              <IconAlertTriangle
                size={20}
                color="#EF4444"
                style={{ marginTop: 2, marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#991B1B",
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  Review Needed
                </Text>
                <Text
                  style={{ color: "#B91C1C", fontSize: 13, lineHeight: 18 }}
                >
                  {result.review_notes ||
                    "The AI could not confidently read all symbols or standards."}
                </Text>
              </View>
            </View>
          )}

          {/* Core Info */}
          {(result.brand || result.size) && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#FFF",
                padding: 16,
                borderRadius: 16,
              }}
            >
              {result.brand && (
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {result.brand}
                </Text>
              )}
              {result.size && (
                <Text style={{ fontSize: 14, color: "#4B5563" }}>
                  Size: {result.size}
                </Text>
              )}
            </View>
          )}

          {/* Care Symbols List */}
          {result.care_symbols && result.care_symbols.length > 0 && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#FFF",
                padding: 16,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#4B5563",
                  marginBottom: 16,
                }}
              >
                Care Instructions
              </Text>
              {result.care_symbols.map((symbol, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      alignItems: "center",
                      marginRight: 12,
                      marginTop: 2,
                    }}
                  >
                    {symbol.category === "washing" && (
                      <IconWashMachine size={22} color="#9CA3AF" />
                    )}
                    {symbol.category === "ironing" && (
                      <IconIroning1 size={22} color="#9CA3AF" />
                    )}
                    {symbol.category === "bleaching" && (
                      <IconBleachOff size={22} color="#9CA3AF" />
                    )}
                    {symbol.category === "drying" && (
                      <IconWind size={22} color="#9CA3AF" />
                    )}
                    {symbol.category === "professional_care" && (
                      <IconShirt size={22} color="#9CA3AF" />
                    )}
                    {symbol.category === "wringing" && (
                      <IconShirt size={22} color="#9CA3AF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#374151",
                        lineHeight: 20,
                      }}
                    >
                      {symbol.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#9CA3AF",
                        marginTop: 4,
                        textTransform: "capitalize",
                      }}
                    >
                      {symbol.category.replace("_", " ")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Composition */}
          {result.fabric_composition &&
            result.fabric_composition.length > 0 && (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: 16,
                    fontWeight: "700",
                    marginBottom: 12,
                  }}
                >
                  Fabric Composition
                </Text>
                {result.fabric_composition.map((comp, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      {comp.material}
                    </Text>
                    <Text
                      style={{
                        color: "#374151",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      {comp.percentage ? `${comp.percentage}%` : "Unknown"}
                    </Text>
                  </View>
                ))}
              </View>
            )}

          {/* Translations */}
          {result.translated_text && (
            <View
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: "#4B5563",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Translated Text ({result.detected_language})
              </Text>
              <Text style={{ color: "#4B5563", fontSize: 13, lineHeight: 20 }}>
                {result.translated_text}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Fixed Footer */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24,
            backgroundColor: "#FEFEFE",
            borderTopWidth: 1,
            borderColor: "#E5E7EB30",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            style={{
              flex: 1,
              marginRight: 8,
              borderWidth: 1,
              borderColor: "#111827",
              borderRadius: 28,
              paddingVertical: 16,
              alignItems: "center",
            }}
            onPress={() => {
              if (photoUri) {
                startAnalysis(photoUri, "label");
                router.replace("/(root)/(tabs)" as never);
              }
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSparklesFilled size={20} color="#111827" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  marginLeft: 6,
                }}
              >
                Fix Scan
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              marginLeft: 8,
              backgroundColor: "#111827",
              borderRadius: 28,
              paddingVertical: 16,
              alignItems: "center",
            }}
            onPress={() => {
              router.replace("/(root)/(tabs)" as never);
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
