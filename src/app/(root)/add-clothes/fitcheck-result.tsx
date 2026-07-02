import { FitCheckAnalysis, analyzeFitCheck } from "@/features/scanning/api/gemini-scan"
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store"
import {
  IconArrowLeft,
  IconCheck,
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

type FitCheckParams = {
  photoUri?: string
  resultJson?: string
}

const DEFAULT_RESULT: FitCheckAnalysis = {
  fitScore: 75,
  colorHarmony: "Good",
  occasionMatch: "Casual",
  layering: "Clean and minimal look",
  suggestions: [
    "Try adding a statement accessory",
    "Consider tucking in your shirt for a more polished look",
    "Your color combination works well together",
  ],
  rating: "Good Look",
  outfitItems: ["Top", "Bottoms", "Footwear"],
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981"
  if (score >= 60) return "#F59E0B"
  return "#EF4444"
}

function getRatingEmoji(rating: string): string {
  switch (rating) {
    case "Stylish":
      return "🔥"
    case "Good Look":
      return "👍"
    case "Needs Work":
      return "💡"
    case "Try These Tips":
      return "✏️"
    default:
      return "✨"
  }
}

export default function FitCheckResultScreen() {
  const router = useRouter()
  const params = useLocalSearchParams() as FitCheckParams
  const addScan = useScanHistoryStore((s) => s.addScan)

  const [saved, setSaved] = useState(false)
  const historyAdded = useRef(false)

  
  const [loading, setLoading] = useState(!params.resultJson)
  const [result, setResult] = useState<FitCheckAnalysis>(() => {
    try {
      if (!params.resultJson) return DEFAULT_RESULT
      return JSON.parse(params.resultJson) as FitCheckAnalysis
    } catch {
      return DEFAULT_RESULT
    }
  })

  useEffect(() => {
    if (!params.resultJson && params.photoUri) {
      analyzeFitCheck(params.photoUri).then((data) => {
        setResult(data)
        setLoading(false)
        
        // Add to history after getting result
        addScan({
          type: "fit-check",
          thumbnail: params.photoUri ?? "",
          date: new Date().toISOString(),
          result: data as unknown as Record<string, unknown>,
          isFavorite: false,
        })
      })
    } else if (params.resultJson) {
      // Add to history immediately if already have result
      addScan({
        type: "fit-check",
        thumbnail: params.photoUri ?? "",
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      })
    }
  }, [])
const scoreColor = getScoreColor(result.fitScore)
  const ratingEmoji = getRatingEmoji(result.rating)

  const handleSave = () => {
    if (saved) return
    setSaved(true)
  }

  
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
            Fit Check
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
              STYLE AI
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Photo */}
          {params.photoUri ? (
            <Image
              source={{ uri: params.photoUri }}
              style={{
                height: 300,
                marginHorizontal: 20,
                borderRadius: 20,
                marginBottom: 16,
              }}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{
                height: 300,
                marginHorizontal: 20,
                borderRadius: 20,
                marginBottom: 16,
                backgroundColor: "#1A1827",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 48 }}>👤</Text>
              <Text style={{ color: "#555", fontSize: 14, marginTop: 8 }}>No image</Text>
            </View>
          )}

          {/* Score display */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#161422",
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
            }}
          >
            {/* Big score number */}
            <Text
              style={{
                fontSize: 80,
                fontWeight: "900",
                color: scoreColor,
                lineHeight: 88,
                letterSpacing: -2,
              }}
            >
              {result.fitScore}
            </Text>
            <Text style={{ color: "#888", fontSize: 14, fontWeight: "600", marginBottom: 12 }}>
              / 100
            </Text>

            {/* Score bar */}
            <View
              style={{
                width: "100%",
                height: 8,
                backgroundColor: "#2A2840",
                borderRadius: 999,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${result.fitScore}%`,
                  backgroundColor: scoreColor,
                  borderRadius: 999,
                }}
              />
            </View>

            {/* Rating badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: scoreColor + "22",
                borderRadius: 999,
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: scoreColor + "66",
              }}
            >
              <Text style={{ fontSize: 18 }}>{ratingEmoji}</Text>
              <Text
                style={{
                  color: scoreColor,
                  fontSize: 15,
                  fontWeight: "800",
                }}
              >
                {result.rating}
              </Text>
            </View>
          </View>

          {/* Color harmony + occasion chips */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#161422",
                borderRadius: 18,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#7C6AFF44",
              }}
            >
              <Text style={{ color: "#888", fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                Color Harmony
              </Text>
              <Text style={{ color: "#7C6AFF", fontSize: 14, fontWeight: "800" }}>
                {result.colorHarmony}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#161422",
                borderRadius: 18,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#7C6AFF44",
              }}
            >
              <Text style={{ color: "#888", fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                Occasion
              </Text>
              <Text style={{ color: "#7C6AFF", fontSize: 14, fontWeight: "800" }}>
                {result.occasionMatch}
              </Text>
            </View>
          </View>

          {/* Layering feedback */}
          {result.layering && (
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
                Layering Feedback
              </Text>
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600", lineHeight: 22 }}>
                {result.layering}
              </Text>
            </View>
          )}

          {/* Detected outfit items */}
          {result.outfitItems && result.outfitItems.length > 0 && (
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
                  marginBottom: 12,
                }}
              >
                Detected Outfit
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.outfitItems.map((item, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: "#7C6AFF22",
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderWidth: 1,
                      borderColor: "#7C6AFF44",
                    }}
                  >
                    <Text style={{ color: "#7C6AFF", fontSize: 13, fontWeight: "700" }}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                backgroundColor: "#161422",
                borderRadius: 24,
                padding: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <IconSparkles size={16} color="#7C6AFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                  Style Suggestions
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {result.suggestions.map((suggestion, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "#7C6AFF22",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "#7C6AFF44",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Text style={{ color: "#7C6AFF", fontSize: 11, fontWeight: "800" }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: "#CCC",
                        fontSize: 14,
                        lineHeight: 22,
                        flex: 1,
                      }}
                    >
                      {suggestion}
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
              disabled={saved}
              style={{
                backgroundColor: saved ? "#1A1827" : "#7C6AFF",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                opacity: saved ? 0.6 : 1,
              }}
            >
              {saved && <IconCheck size={16} color="#FFFFFF" />}
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                {saved ? "Saved to History!" : "Save to History"}
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
                Check Again
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
