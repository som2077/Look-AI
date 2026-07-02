import { FullClothingAnalysis, analyzeClothingFull } from "@/features/scanning/api/gemini-scan"
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store"
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store"
import { IconArrowLeft, IconCheck, IconSparkles } from "@tabler/icons-react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

type ScanResultParams = {
  photoUri?: string
  resultJson?: string
  mode?: string
}

const DEFAULT_RESULT: FullClothingAnalysis = {
  name: "Clothing Item",
  category: "top",
  color: "Unknown",
  colorHex: "#888888",
  material: "Unknown",
  pattern: "Solid",
  sleeveType: "N/A",
  neckType: "N/A",
  occasion: "Casual",
  season: "All",
  matchingColors: [
    { name: "Navy Blue", hex: "#1B3A6B" },
    { name: "Beige", hex: "#F5F0E8" },
    { name: "Olive", hex: "#6B7A3A" },
  ],
  confidence: 0.75,
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
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
  )
}

export default function ScanResultScreen() {
  const router = useRouter()
  const params = useLocalSearchParams() as ScanResultParams
  const addItem = useUserWardrobeStore((s) => s.addItem)
  const hasItem = useUserWardrobeStore((s) => s.hasItem)
  const addScan = useScanHistoryStore((s) => s.addScan)

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const historyAdded = useRef(false)

  
  const [loading, setLoading] = useState(!params.resultJson)
  const [result, setResult] = useState<FullClothingAnalysis>(() => {
    try {
      if (!params.resultJson) return DEFAULT_RESULT
      return JSON.parse(params.resultJson) as FullClothingAnalysis
    } catch {
      return DEFAULT_RESULT
    }
  })

  useEffect(() => {
    if (!params.resultJson && params.photoUri) {
      analyzeClothingFull(params.photoUri).then((data) => {
        setResult(data)
        setLoading(false)
        
        // Add to history after getting result
        addScan({
          type: "cloth",
          thumbnail: params.photoUri ?? "",
          date: new Date().toISOString(),
          result: data as unknown as Record<string, unknown>,
          isFavorite: false,
        })
      })
    } else if (params.resultJson) {
      // Add to history immediately if already have result
      addScan({
        type: "cloth",
        thumbnail: params.photoUri ?? "",
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      })
    }
  }, [])
const alreadyInWardrobe = hasItem(result.category, result.color)

  const handleSave = async () => {
    if (saved || alreadyInWardrobe) return
    setSaving(true)
    addItem({
      name: result.name,
      category: result.category,
      color: result.color,
      colorHex: result.colorHex,
      photoUri: params.photoUri,
      occasion: result.occasion,
      season: result.season,
      material: result.material,
      pattern: result.pattern,
      sleeveType: result.sleeveType,
      neckType: result.neckType,
    })
    setSaving(false)
    setSaved(true)
  }

  const chips = [
    { label: "Category", value: result.category },
    { label: "Color", value: result.color },
    { label: "Material", value: result.material },
    { label: "Pattern", value: result.pattern },
    { label: "Sleeve", value: result.sleeveType },
    { label: "Neck", value: result.neckType },
    { label: "Season", value: result.season },
    { label: "Occasion", value: result.occasion },
  ]

  
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E15", alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#7C6AFF" />
        <Text style={{ color: "#AAA", marginTop: 16, fontSize: 16, fontWeight: "600" }}>AI is analyzing...</Text>
      </View>
    )
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
            onPress={() => router.back()}
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
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800", flex: 1 }}>
            Scan Result
          </Text>
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
              AI
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Photo */}
          {params.photoUri ? (
            <Image
              source={{ uri: params.photoUri }}
              style={{
                height: 240,
                marginHorizontal: 20,
                borderRadius: 20,
                marginBottom: 16,
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

          {/* Confidence bar */}
          <ConfidenceBar confidence={result.confidence} />

          {/* Item name card */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#161422",
              borderRadius: 24,
              padding: 20,
            }}
          >
            <Text style={{ color: "#AAA", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
              Detected Item
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>
              {result.name}
            </Text>
          </View>

          {/* Chips grid */}
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
              Clothing Details
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

          {/* Matching Colors */}
          {result.matchingColors && result.matchingColors.length > 0 && (
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
                Matching Colors
              </Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                {result.matchingColors.slice(0, 3).map((mc, i) => (
                  <View key={i} style={{ alignItems: "center", gap: 6 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: mc.hex,
                        borderWidth: 2,
                        borderColor: "#2A2840",
                      }}
                    />
                    <Text style={{ color: "#AAA", fontSize: 10, fontWeight: "600", textAlign: "center" }}>
                      {mc.hex}
                    </Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700", textAlign: "center" }}>
                      {mc.name}
                    </Text>
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
                Scan Again
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
