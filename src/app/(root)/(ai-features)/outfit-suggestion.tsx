import { useWeatherStore } from "@/features/weather/model/weather-store";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = "#F5F4F0";
const CARD_BORDER = "#E0DED8";
const LABEL_GRAY = "#9CA3AF";
const BODY_GRAY = "#6B6B70";
const INK = "#1A1A1A";
const GREEN = "#1D9E75";

const OCCASIONS = ["Work", "Casual", "Date Night", "Gym", "Formal", "Party"];

type ScoreBlock = { label: string; value: number; color: string };
type OutfitItem = { role: string; name: string; swatch: string };
type OutfitPreset = {
  name: string;
  why: string;
  stylistNote: string;
  scores: ScoreBlock[];
  items: OutfitItem[];
};

const PRESETS: OutfitPreset[] = [
  {
    name: "Clean Office Edit",
    why: "Crisp and breathable for the heat, this light palette keeps you polished through meetings and lunch alike.",
    stylistNote:
      "Light layers in heat are your best friend — the linen shirt lets air move while keeping it work-ready.",
    scores: [
      { label: "Weather", value: 9, color: GREEN },
      { label: "Occasion", value: 8, color: "#378ADD" },
      { label: "Style", value: 7, color: "#BA7517" },
    ],
    items: [
      { role: "Top", name: "White Linen Shirt", swatch: "#E8E3D8" },
      { role: "Bottom", name: "Navy Chino Trousers", swatch: "#3B5BA5" },
      { role: "Footwear", name: "White Leather Sneakers", swatch: "#FFFFFF" },
      { role: "Accessory", name: "Minimal Silver Watch", swatch: "#C7CDD4" },
    ],
  },
  {
    name: "Weekend Errands",
    why: "Relaxed cotton keeps you cool while running around — easy to move in and easy to style.",
    stylistNote:
      "Tuck in just the front of your tee for an effortless, put-together look.",
    scores: [
      { label: "Weather", value: 8, color: GREEN },
      { label: "Occasion", value: 9, color: "#378ADD" },
      { label: "Style", value: 7, color: "#BA7517" },
    ],
    items: [
      { role: "Top", name: "Oversized Cotton Tee", swatch: "#D9D9D9" },
      { role: "Bottom", name: "Light-Wash Denim", swatch: "#7C93B8" },
      { role: "Footwear", name: "Slip-On Sneakers", swatch: "#EFEFEF" },
      { role: "Accessory", name: "Canvas Tote", swatch: "#C6A97B" },
    ],
  },
  {
    name: "Evening Social",
    why: "Slightly sharper layers that still breathe — the right call for dinner out after a warm day.",
    stylistNote:
      "Swap the sneakers for loafers and this outfit moves from day to night seamlessly.",
    scores: [
      { label: "Weather", value: 7, color: GREEN },
      { label: "Occasion", value: 9, color: "#378ADD" },
      { label: "Style", value: 8, color: "#BA7517" },
    ],
    items: [
      { role: "Top", name: "Linen Button-Up", swatch: "#F2EEE4" },
      { role: "Bottom", name: "Tailored Trousers", swatch: "#4A4A52" },
      { role: "Footwear", name: "Tan Loafers", swatch: "#A97B50" },
      { role: "Accessory", name: "Leather Watch", swatch: "#2C2C30" },
    ],
  },
];

export default function OutfitSuggestionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const weatherData = useWeatherStore((state) => state.data);

  const [presetIndex, setPresetIndex] = useState(0);
  const [activeOccasion, setActiveOccasion] = useState("Work");
  const [saved, setSaved] = useState(false);

  const preset = PRESETS[presetIndex];

  // Greeting + date
  const firstName = user?.firstName || "Som";
  const today = new Date();
  const dateStr =
    today.toLocaleDateString("en-US", { weekday: "long" }) +
    ", " +
    today.getDate() +
    " " +
    today.toLocaleDateString("en-US", { month: "short" });

  // Weather (falls back to the design's sample values)
  const temp = weatherData?.temperatureCelsius ?? 32;
  const feelsLike = weatherData?.feelsLike ?? 34;
  const humidity = weatherData?.humidityPercent ?? 40;
  const condition = weatherData?.condition ?? "Sunny";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top"]}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
      >
        {/* ── 1. Header: greeting + date ── */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: CARD_BORDER,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={20} color={INK} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                color: LABEL_GRAY,
                fontFamily: "TikTokSans16pt-Regular",
              }}
            >
              Good morning, {firstName} 👋
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: INK,
                fontFamily: "TikTokSans16pt-Bold",
                marginTop: 2,
              }}
            >
              {dateStr}
            </Text>
          </View>
        </View>

        {/* ── 2. Weather strip ── */}
        <View
          style={{
            marginTop: 24,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 30,
                color: INK,
                fontFamily: "TikTokSans16pt-Bold",
                lineHeight: 36,
              }}
            >
              {temp}°C
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: BODY_GRAY,
                fontFamily: "TikTokSans16pt-Regular",
                marginTop: 2,
              }}
            >
              Feels like {feelsLike}° · Humidity {humidity}% · {condition}
            </Text>
          </View>
          <Ionicons name="sunny-outline" size={44} color="#F59E0B" />
        </View>

        {/* ── 3. Occasion chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
          style={{ marginTop: 20, flexGrow: 0 }}
        >
          {OCCASIONS.map((occasion) => {
            const isActive = occasion === activeOccasion;
            return (
              <Pressable
                key={occasion}
                onPress={() => setActiveOccasion(occasion)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 100,
                  backgroundColor: isActive ? GREEN : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isActive ? GREEN : CARD_BORDER,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "TikTokSans16pt-Medium",
                    color: isActive ? "#FFFFFF" : "#6B7280",
                  }}
                >
                  {occasion}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── 4. Outfit card ── */}
        <View
          style={{
            marginTop: 20,
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            padding: 18,
          }}
        >
          {/* a. Outfit name */}
          <Text
            style={{
              fontSize: 15,
              color: INK,
              fontFamily: "TikTokSans16pt-SemiBold",
              marginBottom: 14,
            }}
          >
            {preset.name}
          </Text>

          {/* b. Score blocks row */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {preset.scores.map((block) => (
              <View
                key={block.label}
                style={{
                  flex: 1,
                  backgroundColor: "#F7F6F2",
                  borderRadius: 12,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    color: block.color,
                    fontFamily: "TikTokSans16pt-SemiBold",
                  }}
                >
                  {block.value}
                </Text>
                <View
                  style={{
                    width: "100%",
                    height: 3,
                    backgroundColor: "#E8E6E0",
                    borderRadius: 100,
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${block.value * 10}%`,
                      height: 3,
                      backgroundColor: block.color,
                      borderRadius: 100,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: LABEL_GRAY,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    fontFamily: "TikTokSans16pt-Regular",
                    marginTop: 6,
                  }}
                >
                  {block.label}
                </Text>
              </View>
            ))}
          </View>

          {/* c. Why text */}
          <Text
            numberOfLines={2}
            style={{
              marginTop: 14,
              fontSize: 12,
              color: BODY_GRAY,
              lineHeight: 17,
              fontFamily: "TikTokSans16pt-Regular",
            }}
          >
            {preset.why}
          </Text>

          {/* d. Items list */}
          <View style={{ marginTop: 8, marginBottom: 2 }}>
            {preset.items.map((item, index) => (
              <View
                key={item.role}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: index < preset.items.length - 1 ? 1 : 0,
                  borderBottomColor: "#F0EFEA",
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: item.swatch,
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor:
                      item.swatch === "#FFFFFF" ? CARD_BORDER : "transparent",
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      color: LABEL_GRAY,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      fontFamily: "TikTokSans16pt-Regular",
                    }}
                  >
                    {item.role}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: INK,
                      fontFamily: "TikTokSans16pt-SemiBold",
                      marginTop: 1,
                    }}
                  >
                    {item.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C4C2BB" />
              </View>
            ))}
          </View>
        </View>

        {/* ── 5. Stylist note ── */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: "#F0FAF5",
            borderRadius: 16,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ionicons name="sparkles" size={18} color={GREEN} />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontStyle: "italic",
              color: GREEN,
              fontFamily: "TikTokSans16pt-Regular",
            }}
          >
            {preset.stylistNote}
          </Text>
        </View>

        {/* ── 6. Action buttons ── */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <Pressable
            onPress={() => setPresetIndex((i) => (i + 1) % PRESETS.length)}
            style={{
              flex: 1,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              backgroundColor: "#FFFFFF",
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: INK,
                fontFamily: "TikTokSans16pt-SemiBold",
              }}
            >
              Try another
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSaved((s) => !s)}
            style={{
              flex: 1.4,
              borderRadius: 100,
              backgroundColor: GREEN,
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontFamily: "TikTokSans16pt-SemiBold",
              }}
            >
              {saved ? "Saved ✓" : "Save outfit"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
