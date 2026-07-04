import { LabelAnalysis } from "@/features/scanning/api/gemini-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import {
  IconArrowLeft,
  IconFlame,
  IconWashMachine,
  IconWind,
  IconX,
} from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Image,
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
  const params = useLocalSearchParams() as LabelResultParams;
  const addScan = useScanHistoryStore((s) => s.addScan);
  const scans = useScanHistoryStore((s) => s.scans);

  const scanData = params.scanId ? scans.find(s => s.id === params.scanId) : null;
  const photoUri = scanData?.thumbnail || params.photoUri;

  const [result] = useState<LabelAnalysis>(() => {
    try {
      if (scanData && scanData.result) {
        return { ...DEFAULT_RESULT, ...(scanData.result as unknown as LabelAnalysis) };
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
      // Add to history immediately since we already have the result from the background
      addScan({
        type: "label",
        thumbnail: params.photoUri,
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      });
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8FA" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 }}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", width: 60 }}>
            <IconArrowLeft size={24} color="#1D1A27" />
            <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#1D1A27" }}>Back</Text>
          </Pressable>
          
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}>
            Care Label Result
          </Text>
          
          <Pressable 
            onPress={() => router.replace("/(root)/(tabs)" as never)} 
            style={{ width: 60, alignItems: "flex-end" }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#7C6AFF" }}>Save</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}>
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
              <View style={{ position: "absolute", bottom: 12, left: 16, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                 <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Scan ID: #{Math.floor(Math.random() * 90000) + 10000}</Text>
              </View>
            </View>
          )}

          {/* Care Cards Grid */}
          <View style={{ marginHorizontal: 20, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
            {/* Washing */}
            <View style={{ width: "48%", backgroundColor: "#EBF5FF", borderRadius: 20, padding: 16 }}>
              <Text style={{ color: "#1E3A8A", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>Washing</Text>
              <View style={{ backgroundColor: "rgba(255,255,255,0.6)", alignSelf: "flex-start", padding: 8, borderRadius: 12, marginBottom: 12 }}>
                <IconWashMachine size={24} color="#3B82F6" strokeWidth={1.5} />
              </View>
              <Text style={{ color: "#1D1A27", fontSize: 14, fontWeight: "700", marginBottom: 4 }}>{(result?.washTemp || "Not detected").split(".")[0]}</Text>
              <Text style={{ color: "#4B5563", fontSize: 12, lineHeight: 16 }}>{result.washTemp}</Text>
            </View>

            {/* Ironing */}
            <View style={{ width: "48%", backgroundColor: "#FFF8E5", borderRadius: 20, padding: 16 }}>
              <Text style={{ color: "#92400E", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>Ironing</Text>
              <View style={{ backgroundColor: "rgba(255,255,255,0.6)", alignSelf: "flex-start", padding: 8, borderRadius: 12, marginBottom: 12 }}>
                <IconFlame size={24} color="#D97706" strokeWidth={1.5} />
              </View>
              <Text style={{ color: "#1D1A27", fontSize: 14, fontWeight: "700", marginBottom: 4 }}>{(result?.ironInstructions || "Not detected").split(".")[0]}</Text>
              <Text style={{ color: "#4B5563", fontSize: 12, lineHeight: 16 }}>{result.ironInstructions}</Text>
            </View>

            {/* Bleaching */}
            <View style={{ width: "48%", backgroundColor: "#FFEBEB", borderRadius: 20, padding: 16 }}>
              <Text style={{ color: "#991B1B", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>Bleaching</Text>
              <View style={{ backgroundColor: "rgba(255,255,255,0.6)", alignSelf: "flex-start", padding: 8, borderRadius: 12, marginBottom: 12 }}>
                <IconX size={24} color="#EF4444" strokeWidth={1.5} />
              </View>
              <Text style={{ color: "#1D1A27", fontSize: 14, fontWeight: "700", marginBottom: 4 }}>{(result?.bleach || "Not detected").split(".")[0]}</Text>
              <Text style={{ color: "#4B5563", fontSize: 12, lineHeight: 16 }}>{result.bleach}</Text>
            </View>

            {/* Drying */}
            <View style={{ width: "48%", backgroundColor: "#EFFFF2", borderRadius: 20, padding: 16 }}>
              <Text style={{ color: "#065F46", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>Drying</Text>
              <View style={{ backgroundColor: "rgba(255,255,255,0.6)", alignSelf: "flex-start", padding: 8, borderRadius: 12, marginBottom: 12 }}>
                <IconWind size={24} color="#10B981" strokeWidth={1.5} />
              </View>
              <Text style={{ color: "#1D1A27", fontSize: 14, fontWeight: "700", marginBottom: 4 }}>{(result?.drying || "Not detected").split(".")[0]}</Text>
              <Text style={{ color: "#4B5563", fontSize: 12, lineHeight: 16 }}>{result.drying}</Text>
            </View>
          </View>

          {/* Composition */}
          {result.fabricComposition && result.fabricComposition !== "Not detected" && (
            <View style={{ marginHorizontal: 20, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: "#E9EBF8" }}>
              <Text style={{ color: "#1D1A27", fontSize: 14, fontWeight: "700", marginBottom: 6 }}>Composition</Text>
              <Text style={{ color: "#4B5563", fontSize: 13 }}>Details: <Text style={{ fontWeight: "700", color: "#1D1A27" }}>{result.fabricComposition}</Text></Text>
            </View>
          )}

          {/* AI Care Summary */}
          <View style={{ marginHorizontal: 20, backgroundColor: "#F3F4F6", borderRadius: 20, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }}>
             <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
               <Text style={{ fontSize: 20 }}>🧠</Text>
               <Text style={{ color: "#1D1A27", fontSize: 15, fontWeight: "700" }}>AI Care Summary:</Text>
             </View>
             <Text style={{ color: "#374151", fontSize: 14, lineHeight: 22 }}>
               {result.aiExplanation}
             </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
