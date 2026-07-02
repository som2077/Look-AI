import { LabelAnalysis, analyzeClothLabel } from "@/features/scanning/api/gemini-scan"
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store"
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconSparkles,
} from "@tabler/icons-react-native"
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

type LabelResultParams = {
  photoUri?: string
  resultJson?: string
}

const DEFAULT_RESULT: LabelAnalysis = {
  rawText: "Could not read label",
  washTemp: "Not detected",
  ironInstructions: "Not detected",
  bleach: "Not detected",
  drying: "Not detected",
  fabricComposition: "Not detected",
  aiExplanation:
    "Could not extract care instructions from this label. Please try capturing a clearer image of the label.",
}

type CareCardProps = {
  icon: string
  title: string
  value: string
}

function CareCard({ icon, title, value }: CareCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1A1827",
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
        gap: 8,
        minWidth: "45%",
        borderWidth: 1,
        borderColor: "#2A2840",
      }}
    >
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={{ color: "#888", fontSize: 11, fontWeight: "600" }}>{title}</Text>
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: "700",
          textAlign: "center",
        }}
        numberOfLines={3}
      >
        {value || "Not detected"}
      </Text>
    </View>
  )
}

export default function LabelResultScreen() {
  const router = useRouter()
  const params = useLocalSearchParams() as LabelResultParams
  const addScan = useScanHistoryStore((s) => s.addScan)

  const [saved, setSaved] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const historyAdded = useRef(false)

  
  const [loading, setLoading] = useState(!params.resultJson)
  const [result, setResult] = useState<LabelAnalysis>(() => {
    try {
      if (!params.resultJson) return DEFAULT_RESULT
      return JSON.parse(params.resultJson) as LabelAnalysis
    } catch {
      return DEFAULT_RESULT
    }
  })

  useEffect(() => {
    if (!params.resultJson && params.photoUri) {
      analyzeClothLabel(params.photoUri).then((data) => {
        setResult(data)
        setLoading(false)
        
        // Add to history after getting result
        addScan({
          type: "label",
          thumbnail: params.photoUri ?? "",
          date: new Date().toISOString(),
          result: data as unknown as Record<string, unknown>,
          isFavorite: false,
        })
      })
    } else if (params.resultJson) {
      // Add to history immediately if already have result
      addScan({
        type: "label",
        thumbnail: params.photoUri ?? "",
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      })
    }
  }, [])
const handleSave = () => {
    if (saved) return
    setSaved(true)
  }

  const careCards: CareCardProps[] = [
    { icon: "🌡️", title: "Wash", value: result.washTemp },
    { icon: "🔥", title: "Iron", value: result.ironInstructions },
    { icon: "🫧", title: "Bleach", value: result.bleach },
    { icon: "💨", title: "Dry", value: result.drying },
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
            Care Label
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
              OCR
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
                height: 200,
                marginHorizontal: 20,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#1A1827",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 40 }}>🏷️</Text>
              <Text style={{ color: "#555", fontSize: 14, marginTop: 8 }}>No image</Text>
            </View>
          )}

          {/* Care icons 2x2 grid */}
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
              Care Instructions
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {careCards.map((card, i) => (
                <CareCard key={i} icon={card.icon} title={card.title} value={card.value} />
              ))}
            </View>
          </View>

          {/* Fabric composition */}
          {result.fabricComposition && result.fabricComposition !== "Not detected" && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                backgroundColor: "#161422",
                borderRadius: 24,
                padding: 20,
              }}
            >
              <Text style={{ color: "#888", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                Fabric Composition
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                {result.fabricComposition}
              </Text>
            </View>
          )}

          {/* AI Explanation */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#161422",
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "#7C6AFF44",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <IconSparkles size={18} color="#7C6AFF" />
              <Text style={{ color: "#7C6AFF", fontSize: 14, fontWeight: "700" }}>
                AI Care Summary
              </Text>
            </View>
            <Text style={{ color: "#CCC", fontSize: 14, lineHeight: 22 }}>
              {result.aiExplanation}
            </Text>
          </View>

          {/* Raw text collapsible */}
          {result.rawText && result.rawText !== "Could not read label" && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                backgroundColor: "#161422",
                borderRadius: 24,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => setShowRaw((v) => !v)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                  Raw Label Text
                </Text>
                {showRaw ? (
                  <IconChevronUp size={18} color="#888" />
                ) : (
                  <IconChevronDown size={18} color="#888" />
                )}
              </Pressable>
              {showRaw && (
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    borderTopWidth: 1,
                    borderTopColor: "#2A2840",
                  }}
                >
                  <Text
                    style={{
                      color: "#AAA",
                      fontSize: 12,
                      lineHeight: 18,
                      fontFamily: "monospace",
                      marginTop: 12,
                    }}
                  >
                    {result.rawText}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={{ marginHorizontal: 16, gap: 10 }}>
            <Pressable
              onPress={handleSave}
              disabled={saved}
              style={{
                backgroundColor: saved ? "#1A1827" : "#7C6AFF",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                opacity: saved ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                {saved ? "Label Saved!" : "Save Label"}
              </Text>
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
