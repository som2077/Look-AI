import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image as ExpoImage } from "expo-image";
import LottieView from "lottie-react-native";
import {
  CURRENT_STREAK_DAYS,
} from "@/constants/streak";
import {
  IconArrowLeft,
  IconShare,
  IconCheck,
} from "@tabler/icons-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_WEEKLY = [
  { day: "SUN", done: true, isFuture: false },
  { day: "MON", done: true, isFuture: false },
  { day: "TUE", done: true, isFuture: false },
  { day: "WED", done: true, isFuture: false },
  { day: "THU", done: true, isFuture: false },
  { day: "FRI", done: false, isFuture: true },
  { day: "SAT", done: false, isFuture: true },
];

const MILESTONES = [
  { days: 1,   label: "1 day" },
  { days: 5,   label: "5 days" },
  { days: 10,  label: "10 days" },
  { days: 25,  label: "25 days" },
  { days: 50,  label: "50 days" },
  { days: 100, label: "100 days" },
  { days: 150, label: "150 days" },
  { days: 200, label: "200 days" },
  { days: 250, label: "250 days" },
  { days: 365, label: "365 days" },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StreakScreen() {
  const router = useRouter();
  const currentStreak = CURRENT_STREAK_DAYS;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm on a ${currentStreak} day streak of styling my outfits! 🔥 Join me on the app.`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FA" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ padding: 8, marginLeft: -8 }}
        >
          <IconArrowLeft size={24} color="#1D1A27" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.7}
          style={{ padding: 8, marginRight: -8 }}
        >
          <IconShare size={24} color="#1D1A27" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Hero Streak Section ── */}
        <View style={{ alignItems: "center", marginTop: 24, paddingHorizontal: 20 }}>
          {/* Large Fire Illustration with Number Overlay */}
          <View style={{ width: 180, height: 200, alignItems: "center", justifyContent: "flex-end" }}>
            <LottieView
              source={{
                uri: "https://lottie.host/90aa36ae-cfef-49e5-bd8e-8c4c54fc2004/df47Z2J4nI.json",
              }}
              autoPlay
              loop
              style={{ width: 180, height: 180, position: "absolute", top: 0 }}
            />
            
            {/* Number Overlay */}
            <Text
              style={{
                fontSize: 64,
                fontWeight: "900",
                color: "#FFFFFF",
                textShadowColor: "rgba(255, 75, 38, 0.5)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
                marginBottom: 16,
              }}
            >
              {currentStreak}
            </Text>
          </View>

          <Text style={{ fontSize: 26, fontWeight: "800", color: "#1D1A27", marginTop: 16 }}>
            {currentStreak} day streak!
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#5A5A6A",
              textAlign: "center",
              marginTop: 10,
              lineHeight: 22,
              paddingHorizontal: 20,
              fontWeight: "500",
            }}
          >
            Amazing work! Come back tomorrow to keep your streak alive.
          </Text>
        </View>

        {/* ── Weekly Timeline ── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 40,
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#F0EEF8",
            paddingVertical: 24,
            paddingHorizontal: 12,
            shadowColor: "#000",
            shadowOpacity: 0.02,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            {/* Horizontal Line behind nodes */}
            <View
              style={{
                position: "absolute",
                top: 36, // approx middle of the 32px circle + text
                left: 15,
                right: 15,
                height: 3,
                backgroundColor: "#E2E2EA",
                zIndex: 0,
              }}
            />
            {/* Active Orange Line segment (Approximation for 5 completed days) */}
            <View
              style={{
                position: "absolute",
                top: 36,
                left: 15,
                width: "60%", 
                height: 3,
                backgroundColor: "#F26D3D",
                zIndex: 1,
              }}
            />

            {MOCK_WEEKLY.map((item, index) => (
              <View key={item.day} style={{ alignItems: "center", zIndex: 2, width: 44 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: item.isFuture ? "#D1D1DB" : "#F26D3D",
                    marginBottom: 12,
                  }}
                >
                  {item.day}
                </Text>
                {item.done ? (
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: "#F26D3D",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconCheck size={18} color="#FFFFFF" strokeWidth={3} />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 3,
                      borderColor: "#E2E2EA",
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Milestones Grid ── */}
        <View style={{ marginHorizontal: 20, marginTop: 48 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
             <Text style={{ fontSize: 13, fontWeight: "800", color: "#8E8E9F", letterSpacing: 1.5, textTransform: "uppercase" }}>
               MILESTONES
             </Text>
             <Text style={{ fontSize: 13, fontWeight: "700", color: "#F26D3D" }}>
               1/10
             </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: (SCREEN_WIDTH - 40 - (86 * 3)) / 2 }}>
            {MILESTONES.map((m, index) => {
              const reached = currentStreak >= m.days;
              return (
                <View
                  key={m.days}
                  style={{
                    width: 86,
                    alignItems: "center",
                    marginBottom: 32,
                  }}
                >
                  <View
                    style={{
                      width: 86,
                      height: 86,
                      borderRadius: 43,
                      backgroundColor: "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: reached ? "rgba(242, 109, 61, 0.3)" : "rgba(0,0,0,0.05)",
                      shadowOpacity: 1,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 2,
                    }}
                  >
                    {/* Ring Progress approximation */}
                    <View
                      style={{
                        position: "absolute",
                        top: 5, left: 5, right: 5, bottom: 5,
                        borderRadius: 40,
                        borderWidth: 4,
                        borderColor: reached ? "#F26D3D" : "#F4F4F6",
                        borderTopColor: reached ? "#FF4B26" : "#EAEAEA",
                        transform: [{ rotate: "45deg" }]
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: "900",
                        color: reached ? "#F26D3D" : "#D1D1DB",
                      }}
                    >
                      {m.days}
                    </Text>
                  </View>
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      fontWeight: "600",
                      color: reached ? "#1D1A27" : "#A1A1AA",
                    }}
                  >
                    {m.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
