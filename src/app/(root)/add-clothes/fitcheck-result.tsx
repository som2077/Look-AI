import { FitCheckAnalysis, analyzeFitCheck } from "@/features/scanning/api/gemini-scan"
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store"
import {
  IconArrowLeft,
  IconCheck,
  IconSparkles,
  IconUser,
  IconRuler,
  IconPalette,
  IconLayersLinked,
  IconWand,
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
  scanId?: string
}

const DEFAULT_RESULT: FitCheckAnalysis = {
  fitScore: 75,
  rating: "Good Look",
  silhouette: {
    bodyShape: "Unknown",
    waistDefinition: "Looks balanced",
    verticalRatio: "50:50",
    ruleOfThirds: "Good proportion",
  },
  fitPrecision: {
    shoulderFit: "Good",
    sleeveLength: "Good",
    trouserBreak: "Slight break",
    tightness: "Comfortable fit",
  },
  colorTheory: {
    harmonyType: "Neutral",
    skinToneCompat: "Good match",
    contrastLevel: "Medium",
  },
  styling: {
    layering: "Simple look",
    accessoryGaps: "Could add a watch",
    footwearPairing: "Matches well",
  },
  styleCategory: {
    archetype: "Casual",
    trendRelevance: "Timeless",
  },
  actionableFixes: [
    "Try adding a statement accessory",
    "Consider tucking in your shirt for a more polished look",
  ],
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
  const scans = useScanHistoryStore((s) => s.scans)
  const addScan = useScanHistoryStore((s) => s.addScan)
  
  const [saved, setSaved] = useState(false)
  
  const scan = scans.find(s => s.id === params.scanId)
  const result = (scan?.result as unknown as FitCheckAnalysis) || DEFAULT_RESULT
  const photoUri = scan?.thumbnail

  const scoreColor = getScoreColor(result?.fitScore || 75)
  const ratingEmoji = getRatingEmoji(result?.rating || "Good Look")

  const handleSave = () => {
    if (saved) return
    setSaved(true)
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
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
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

          {/* Stylist's Fixes Section */}
          {result?.actionableFixes && result.actionableFixes.length > 0 && (
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
                  marginBottom: 16,
                }}
              >
                <IconWand size={20} color="#7C6AFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
                  Stylist's Fixes
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {result.actionableFixes.map((fix, i) => (
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
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <Text style={{ color: "#7C6AFF", fontSize: 12, fontWeight: "800" }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={{ color: "#CCC", fontSize: 14, lineHeight: 22, flex: 1 }}>
                      {fix}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Silhouette & Proportion */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: "#161422", borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <IconUser size={18} color="#10B981" />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Silhouette & Proportion</Text>
            </View>
            <View style={{ gap: 10 }}>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Body Shape / Fit</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.silhouette?.bodyShape}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Waist Definition</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.silhouette?.waistDefinition}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Vertical Ratio</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.silhouette?.verticalRatio}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Rule of Thirds</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.silhouette?.ruleOfThirds}</Text></View>
            </View>
          </View>

          {/* Fit Precision */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: "#161422", borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <IconRuler size={18} color="#F59E0B" />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Fit Precision</Text>
            </View>
            <View style={{ gap: 10 }}>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Shoulder Fit</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.fitPrecision?.shoulderFit}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Sleeve Length</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.fitPrecision?.sleeveLength}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Trouser Break</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.fitPrecision?.trouserBreak}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Tightness</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.fitPrecision?.tightness}</Text></View>
            </View>
          </View>

          {/* Color Theory */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: "#161422", borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <IconPalette size={18} color="#EC4899" />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Color Theory</Text>
            </View>
            <View style={{ gap: 10 }}>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Harmony Type</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.colorTheory?.harmonyType}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Skin Tone Match</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.colorTheory?.skinToneCompat}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Contrast Level</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.colorTheory?.contrastLevel}</Text></View>
            </View>
          </View>

          {/* Styling & Trend */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: "#161422", borderRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <IconLayersLinked size={18} color="#3B82F6" />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>Styling Elements & Trend</Text>
            </View>
            <View style={{ gap: 10 }}>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Layering</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.styling?.layering}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Accessory Gaps</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.styling?.accessoryGaps}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Footwear</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.styling?.footwearPairing}</Text></View>
              <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderColor: "#2A2840" }}><Text style={{ color: "#7C6AFF", fontSize: 12, fontWeight: "600" }}>STYLE ARCHETYPE</Text><Text style={{ color: "#EEE", fontSize: 15, fontWeight: "700", marginTop: 2 }}>{result?.styleCategory?.archetype}</Text></View>
              <View><Text style={{ color: "#888", fontSize: 12 }}>Trend Relevance</Text><Text style={{ color: "#EEE", fontSize: 14, marginTop: 2 }}>{result?.styleCategory?.trendRelevance}</Text></View>
            </View>
          </View>

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
                Back to Scanner
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
