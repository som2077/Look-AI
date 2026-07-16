import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { LabelAnalysis } from "@/features/scanning/api/gemini-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { useSavedStore } from "@/features/wardrobe/model/saved-store";
import { usePremiumLimits } from "@/shared/hooks/usePremiumLimits";
import {
  IconArrowLeft,
  IconBleachOff,
  IconDotsVertical,
  IconIroning1,
  IconWashMachine,
  IconWind,
} from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LabelResultParams = {
  photoUri?: string;
  resultJson?: string;
  scanId?: string;
  outfitIndex?: string;
};

const DEFAULT_RESULT: LabelAnalysis = {
  rawText: "Could not read label",
  washTemp: "Not detected",
  ironInstructions: "Not detected",
  bleach: "Not detected",
  drying: "Not detected",
  fabricComposition: "Not detected",
  aiExplanation:
    "Could not extract care instructions from this label. Please try capturing a clearer image of the label.",
};

export default function LabelResultScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const { canAddClothLabel, handleLimitReached } = usePremiumLimits();
  const params = useLocalSearchParams() as LabelResultParams;
  const addScan = useScanHistoryStore((s) => s.addScan);
  const removeScan = useScanHistoryStore((s) => s.removeScan);
  const scans = useScanHistoryStore((s) => s.scans);
  const removeOutfit = useOutfitAnalysisStore((s) => s.removeOutfit);
  const addSavedItem = useSavedStore((s) => s.addSavedItem);

  const scanData = params.scanId
    ? scans.find((s) => s.id === params.scanId)
    : null;
  const photoUri = scanData?.thumbnail || params.photoUri;

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
        // We still show the result, but don't save to history
        return;
      }
      // Add to history immediately since we already have the result from the background
      addScan({
        type: "label",
        thumbnail: params.photoUri,
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      });
    }
  }, [canAddClothLabel, handleLimitReached]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8FA" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", width: 60 }}
          >
            <IconArrowLeft size={24} color="#1D1A27" />
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}>
            Care Label Result
          </Text>

          <Pressable
            onPress={() => setShowMenu(true)}
            style={{ width: 60, alignItems: "flex-end", paddingVertical: 4 }}
          >
            <IconDotsVertical size={24} color="#1D1A27" />
          </Pressable>
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
                  top: 80,
                  right: 30,
                  backgroundColor: "#fff",
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
                    if (photoUri) {
                      addSavedItem({
                        id: `label-${Date.now()}`,
                        name: "Care Label",
                        occasion: "cloth label",
                        wears: 0,
                        image: photoUri,
                        match: 100,
                        tags: ["cloth label"],
                        saveType: "label",
                      });
                      Alert.alert("Success", "Label saved to your wardrobe!");
                    }
                    if (params.outfitIndex)
                      removeOutfit(parseInt(params.outfitIndex));
                    router.replace("/(root)/(tabs)" as never);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#1D1A27",
                      fontWeight: "500",
                    }}
                  >
                    Save
                  </Text>
                </Pressable>
                <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        >
          {/* Photo */}
          {photoUri && (
            <View
              style={{
                marginHorizontal: 20,
                borderRadius: 24,
                marginBottom: 24,
                backgroundColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 4,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#E9EBF8",
              }}
            >
              <Image
                source={{ uri: photoUri }}
                style={{
                  height: 220,
                  width: "100%",
                }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 16,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}
                >
                  Scan ID: #{Math.floor(Math.random() * 90000) + 10000}
                </Text>
              </View>
            </View>
          )}

          {/* Care Cards List */}
          <View style={{ marginBottom: 12 }}>
            {/* Washing */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 28,
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{ width: 40, alignItems: "center", marginRight: 16 }}
              >
                <IconWashMachine size={32} color="#1D1A27" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1D1A27",
                    marginBottom: 4,
                  }}
                >
                  Washing:
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color:
                      result?.washTemp === "Not specified" ||
                      result?.washTemp === "Not detected"
                        ? "#9CA3AF"
                        : "#4B5563",
                  }}
                >
                  {result?.washTemp && result.washTemp !== "Not detected"
                    ? result.washTemp
                    : "Not specified on label"}
                </Text>
              </View>
            </View>

            {/* Ironing */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 28,
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{ width: 40, alignItems: "center", marginRight: 16 }}
              >
                <IconIroning1 size={32} color="#1D1A27" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1D1A27",
                    marginBottom: 4,
                  }}
                >
                  Ironing:
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color:
                      result?.ironInstructions === "Not specified" ||
                      result?.ironInstructions === "Not detected"
                        ? "#9CA3AF"
                        : "#4B5563",
                  }}
                >
                  {result?.ironInstructions &&
                  result.ironInstructions !== "Not detected"
                    ? result.ironInstructions
                    : "Not specified on label"}
                </Text>
              </View>
            </View>

            {/* Bleaching */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 28,
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{ width: 40, alignItems: "center", marginRight: 16 }}
              >
                <IconBleachOff size={32} color="#1D1A27" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1D1A27",
                    marginBottom: 4,
                  }}
                >
                  Bleaching:
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color:
                      result?.bleach === "Not specified" ||
                      result?.bleach === "Not detected"
                        ? "#9CA3AF"
                        : "#4B5563",
                  }}
                >
                  {result?.bleach && result.bleach !== "Not detected"
                    ? result.bleach
                    : "Not specified on label"}
                </Text>
              </View>
            </View>

            {/* Drying */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 28,
                paddingHorizontal: 24,
              }}
            >
              <View
                style={{ width: 40, alignItems: "center", marginRight: 16 }}
              >
                <IconWind size={32} color="#1D1A27" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1D1A27",
                    marginBottom: 4,
                  }}
                >
                  Drying:
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color:
                      result?.drying === "Not specified" ||
                      result?.drying === "Not detected"
                        ? "#9CA3AF"
                        : "#4B5563",
                  }}
                >
                  {result?.drying && result.drying !== "Not detected"
                    ? result.drying
                    : "Not specified on label"}
                </Text>
              </View>
            </View>
          </View>

          {/* Composition */}
          {!!result.fabricComposition &&
            result.fabricComposition !== "Not detected" &&
            result.fabricComposition !== "Not specified" && (
              <View
                style={{
                  marginHorizontal: 20,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 18,
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: "#E9EBF8",
                }}
              >
                <Text
                  style={{
                    color: "#1D1A27",
                    fontSize: 14,
                    fontWeight: "700",
                    marginBottom: 6,
                  }}
                >
                  Composition
                </Text>
                <Text style={{ color: "#4B5563", fontSize: 13 }}>
                  Details:{" "}
                  <Text style={{ fontWeight: "700", color: "#1D1A27" }}>
                    {result.fabricComposition}
                  </Text>
                </Text>
              </View>
            )}

          {/* AI Care Summary */}
          <View
            style={{
              marginHorizontal: 20,
              // backgroundColor: "#F3F4F6",
              // borderRadius: 12,
              padding: 18,
              // borderWidth: 1,
              // borderColor: "#E5E7EB",
            }}
          >
            {/* <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 20 }}>🧠</Text>
              <Text
                style={{ color: "#1D1A27", fontSize: 15, fontWeight: "700" }}
              >
                AI Care Summary:
              </Text>
            </View> */}
            <Text style={{ color: "#374151", fontSize: 14, lineHeight: 22 }}>
              {result.aiExplanation}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
