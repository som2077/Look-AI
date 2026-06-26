import { CURRENT_STREAK_DAYS } from "@/constants/streak";
import { IconArrowLeft, IconShare } from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React from "react";
import {
  Dimensions,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CUSTOM_MILESTONES = [
  {
    id: "m3",
    days: 3,
    label: "Rookie Stylist",
    desc: "3 day streak",
    source: require("@/assets/badge/3.svg"),
  },
  {
    id: "m5",
    days: 5,
    label: "Getting Started",
    desc: "5 day streak",
    source: require("@/assets/badge/5.svg"),
  },
  {
    id: "m10",
    days: 10,
    label: "Closet Explorer",
    desc: "10 day streak",
    source: require("@/assets/badge/10.svg"),
  },
  {
    id: "m15",
    days: 15,
    label: "Weather Wizard",
    desc: "15 day streak",
    source: require("@/assets/badge/15.svg"),
  },
  {
    id: "m20",
    days: 20,
    label: "Color Coordinated",
    desc: "20 day streak",
    source: require("@/assets/badge/20.svg"),
  },
  {
    id: "m50",
    days: 50,
    label: "Trendsetter",
    desc: "50 day streak",
    source: require("@/assets/badge/50.svg"),
  },
  {
    id: "m60",
    days: 60,
    label: "Shoe Fanatic",
    desc: "60 day streak",
    source: require("@/assets/badge/60.svg"),
  },
  {
    id: "m70",
    days: 70,
    label: "Layering Master",
    desc: "70 day streak",
    source: require("@/assets/badge/70.svg"),
  },
  {
    id: "m100",
    days: 100,
    label: "The Fashionista",
    desc: "100 day streak",
    source: require("@/assets/badge/100.svg"),
  },
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
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <AppGradientBackground>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <StatusBar style="dark" />

          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              // paddingTop: 12,
              // paddingBottom: 12,
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
            {/* ── New Split Hero Section ── */}
            <View
              style={{ paddingHorizontal: 20, marginTop: 35, marginBottom: 12 }}
            >
              {/* Row 1: Icons and Labels */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 15,
                }}
              >
                {/* Day Streak Column */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                      height: 70,
                      width: 70,
                    }}
                  >
                    <LottieView
                      source={require("@/assets/badge/Fire.json")}
                      autoPlay
                      loop
                      style={{ width: 130, height: 130 }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Medium",
                      fontSize: 20,
                      color: "#1D1A27",
                      marginTop: 20,
                    }}
                  >
                    Day streak
                  </Text>
                </View>

                {/* Badges Earned Column */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                      height: 85,
                      width: 70,
                    }}
                  >
                    {/* Trophy Lottie */}
                    <LottieView
                      source={require("@/assets/badge/Trophy.json")}
                      autoPlay
                      loop
                      style={{ width: 200, height: 200 }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Medium",
                      fontSize: 20,
                      color: "#1D1A27",
                      marginTop: 5,
                    }}
                  >
                    Badges earned
                  </Text>
                </View>
              </View>

              {/* Row 2: Cards */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* Longest Streak Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E2E2EA",
                    padding: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.02,
                    shadowRadius: 8,
                    elevation: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                      justifyContent: "center",
                    }}
                  >
                    <LottieView
                      source={require("@/assets/badge/Fire.json")}
                      autoPlay
                      loop
                      style={{ width: 21, height: 21, marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontFamily: "TikTokSans16pt-Bold",
                        fontSize: 15,
                        color: "#1D1A27",
                      }}
                    >
                      {currentStreak} days
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Medium",
                      fontSize: 13,
                      color: "#A1A1AA",
                      textAlign: "center",
                    }}
                  >
                    longest streak
                  </Text>
                </View>

                {/* Badges Progress Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E2E2EA",
                    padding: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.02,
                    shadowRadius: 8,
                    elevation: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Svg
                      width={19}
                      height={19}
                      viewBox="0 0 100 100"
                      style={{ marginRight: 6 }}
                    >
                      <Path
                        d="M50 5 L95 28 L95 72 L50 95 L5 72 L5 28 Z"
                        fill="#2D2A3D"
                        stroke="#D4AF37"
                        strokeWidth={4}
                      />
                    </Svg>
                    <Text
                      style={{
                        fontFamily: "TikTokSans16pt-Bold",
                        fontSize: 14,
                        color: "#1D1A27",
                      }}
                    >
                      {
                        CUSTOM_MILESTONES.filter((m) => currentStreak >= m.days)
                          .length
                      }
                      /{CUSTOM_MILESTONES.length} Badges
                    </Text>
                  </View>
                  {/* Progress Bar */}
                  <View
                    style={{
                      height: 8,
                      backgroundColor: "#F4F4F6",
                      borderRadius: 25,
                      borderColor: "#000000",
                      borderWidth: 0.1,
                      overflow: "hidden",
                      // marginLeft: 24,
                    }}
                  >
                    <View
                      style={{
                        width: `${(CUSTOM_MILESTONES.filter((m) => currentStreak >= m.days).length / CUSTOM_MILESTONES.length) * 100}%`,
                        height: "100%",
                        backgroundColor: "#2D2A3D",
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* ── Vector Milestones Grid ── */}
            <View style={{ marginHorizontal: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: "TikTokSans16pt-Bold",
                    color: "#1D1A27",
                    letterSpacing: 0.5,
                  }}
                >
                  Milestones
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {CUSTOM_MILESTONES.map((m, index) => {
                  const reached = currentStreak >= m.days;

                  return (
                    <View
                      key={m.id}
                      style={{
                        width: (SCREEN_WIDTH - 48) / 3 - 10,
                        alignItems: "center",
                        marginBottom: 32,
                      }}
                    >
                      <ExpoImage
                        source={m.source}
                        style={{
                          width: 140,
                          height: 140,
                          opacity: reached ? 1 : 0.4,
                        }}
                        contentFit="contain"
                      />

                      <Text
                        style={{
                          marginTop: 12,
                          fontSize: 13,
                          fontFamily: "TikTokSans16pt-Bold",
                          color: reached ? "#1D1A27" : "#A1A1AA",
                          textAlign: "center",
                        }}
                      >
                        {m.label}
                      </Text>
                      <Text
                        style={{
                          marginTop: 2,
                          fontSize: 10,
                          fontFamily: "TikTokSans16pt-Medium",
                          color: "#A1A1AA",
                          textAlign: "center",
                        }}
                      >
                        {m.desc}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </View>
  );
}
