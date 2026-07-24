import { BarcodeAnalysis, analyzeBarcodeImage } from "@/features/scanning/api/gemini-scan"
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store"
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store"
import { useStreakStore } from "@/shared/store/useStreakStore"
import { usePremiumLimits } from "@/shared/hooks/usePremiumLimits"
import {
  IconArrowLeft,
  IconBarcode,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
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

type BarcodeResultParams = {
  photoUri?: string
  resultJson?: string
  barcodeValue?: string
}

const DEFAULT_RESULT: BarcodeAnalysis = {
  brand: "Unknown",
  itemName: "Clothing Item",
  size: "Unknown",
  color: "Unknown",
  price: "Not visible",
  material: "Unknown",
  rawText: "",
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#2A2840",
      }}
    >
      <Text style={{ color: "#888", fontSize: 13, fontWeight: "600", flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: "700",
          flex: 2,
          textAlign: "right",
        }}
        numberOfLines={2}
      >
        {value || "—"}
      </Text>
    </View>
  )
}

export default function BarcodeResultScreen() {
  const router = useRouter()
  const { canAddWardrobe, handleLimitReached } = usePremiumLimits()
  const params = useLocalSearchParams() as BarcodeResultParams
  const addItem = useUserWardrobeStore((s) => s.addItem)
  const addScan = useScanHistoryStore((s) => s.addScan)
  const incrementStreakAction = useStreakStore((s) => s.incrementStreakAction)

  const [saved, setSaved] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const historyAdded = useRef(false)

  
  const [loading, setLoading] = useState(!params.resultJson)
  const [result, setResult] = useState<BarcodeAnalysis>(() => {
    try {
      if (!params.resultJson) return DEFAULT_RESULT
      return JSON.parse(params.resultJson) as BarcodeAnalysis
    } catch {
      return DEFAULT_RESULT
    }
  })

  useEffect(() => {
    if (!params.resultJson && params.photoUri) {
      analyzeBarcodeImage(params.photoUri).then((data) => {
        setResult(data)
        setLoading(false)
        
        // Add to history after getting result
        addScan({
          type: "barcode",
          thumbnail: params.photoUri ?? "",
          date: new Date().toISOString(),
          result: data as unknown as Record<string, unknown>,
          isFavorite: false,
        })
      })
    } else if (params.resultJson) {
      // Add to history immediately if already have result
      addScan({
        type: "barcode",
        thumbnail: params.photoUri ?? "",
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      })
    }
  }, [])
const handleSave = () => {
    if (saved) return
    if (!canAddWardrobe) {
      handleLimitReached("wardrobe")
      return
    }
    addItem({
      customName: result.itemName || "Clothing Item",
      category: "top",
      primaryColor: result.color,
      imageUrl: params.photoUri,
      fabricGuess: result.material,
      brand: result.brand,
    })
    setSaved(true)
    incrementStreakAction()
  }

  const infoRows: Array<{ label: string; value: string }> = [
    { label: "Brand", value: result.brand },
    { label: "Item Name", value: result.itemName },
    { label: "Size", value: result.size },
    { label: "Color", value: result.color },
    { label: "Price", value: result.price },
    { label: "Material", value: result.material },
  ]

  if (params.barcodeValue) {
    infoRows.push({ label: "Barcode", value: params.barcodeValue })
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
            Barcode Scan Result
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
            <IconBarcode size={12} color="#7C6AFF" />
            <Text style={{ color: "#7C6AFF", fontSize: 11, fontWeight: "700" }}>
              SCAN
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
              <IconBarcode size={48} color="#444" />
              <Text style={{ color: "#555", fontSize: 14, marginTop: 8 }}>No image</Text>
            </View>
          )}

          {/* Item name + brand badge */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#161422",
              borderRadius: 24,
              padding: 20,
            }}
          >
            {!!result.brand && result.brand !== "Unknown" && (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#7C6AFF22",
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: "#7C6AFF66",
                }}
              >
                <Text style={{ color: "#7C6AFF", fontSize: 11, fontWeight: "700" }}>
                  {result.brand}
                </Text>
              </View>
            )}
            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>
              {result.itemName}
            </Text>
          </View>

          {/* Info rows */}
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
                marginBottom: 4,
              }}
            >
              Product Details
            </Text>
            {infoRows.map((row, i) => (
              <InfoRow key={i} label={row.label} value={row.value} />
            ))}
          </View>

          {/* Raw text collapsible */}
          {result.rawText ? (
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
                  Raw Extracted Text
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
          ) : null}

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
                {saved ? "Saved to Wardrobe!" : "Save to Wardrobe"}
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
