import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { posthogAnalytics } from "@/shared/telemetry/posthog";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { IconArrowLeft, IconShare2 } from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React, { useMemo } from "react";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = 20;

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  ink: "#0F0E13",
  inkMuted: "#6B6A73",
  inkSubtle: "#A8A7B2",
  surface: "#FFFFFF",
  surfaceElevated: "#F8F7FC",
  border: "#EDEDF2",
  accent: "#1D1A27",
  accentFg: "#FFFFFF",
} as const;

// ─── Milestones ────────────────────────────────────────────────────────────────

const MILESTONES = [
  {
    id: "m3",
    days: 3,
    label: "Rookie Stylist",
    desc: "3 days",
    source: require("@/assets/badge/3.svg"),
    goldSource: require("@/assets/badge/3-gold.svg"),
  },
  {
    id: "m5",
    days: 5,
    label: "Getting Started",
    desc: "5 days",
    source: require("@/assets/badge/5.svg"),
    goldSource: require("@/assets/badge/5-gold.svg"),
  },
  {
    id: "m10",
    days: 10,
    label: "Closet Explorer",
    desc: "10 days",
    source: require("@/assets/badge/10.svg"),
    goldSource: require("@/assets/badge/10-gold.svg"),
  },
  {
    id: "m15",
    days: 15,
    label: "Weather Wizard",
    desc: "15 days",
    source: require("@/assets/badge/15.svg"),
    goldSource: require("@/assets/badge/15-gold.svg"),
  },
  {
    id: "m20",
    days: 20,
    label: "Color Coordinated",
    desc: "20 days",
    source: require("@/assets/badge/20.svg"),
    goldSource: require("@/assets/badge/20-gold.svg"),
  },
  {
    id: "m50",
    days: 50,
    label: "Trendsetter",
    desc: "50 days",
    source: require("@/assets/badge/50.svg"),
    goldSource: require("@/assets/badge/50-gold.svg"),
  },
  {
    id: "m60",
    days: 60,
    label: "Shoe Fanatic",
    desc: "60 days",
    source: require("@/assets/badge/60.svg"),
    goldSource: require("@/assets/badge/60-gold.svg"),
  },
  {
    id: "m70",
    days: 70,
    label: "Layering Master",
    desc: "70 days",
    source: require("@/assets/badge/70.svg"),
    goldSource: require("@/assets/badge/70-gold.svg"),
  },
  {
    id: "m100",
    days: 100,
    label: "The Fashionista",
    desc: "100 days",
    source: require("@/assets/badge/100.svg"),
    goldSource: require("@/assets/badge/100-gold.svg"),
  },
] as const;

// ─── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: T.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
      }}
    >
      {children}
    </View>
  );
}

// ─── MilestoneItem ─────────────────────────────────────────────────────────────

// Badge image fits inside 3-column grid without overflow
const BADGE_CELL_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - 24) / 3;
const BADGE_SIZE = BADGE_CELL_WIDTH * 0.82;

function MilestoneItem({
  milestone,
  reached,
}: {
  milestone: (typeof MILESTONES)[number];
  reached: boolean;
}) {
  return (
    <View
      style={{
        width: BADGE_CELL_WIDTH,
        alignItems: "center",
        marginBottom: 28,
      }}
    >
      {/* Reached glow ring */}
      <View
        style={{
          width: BADGE_SIZE + 8,
          height: BADGE_SIZE + 8,
          borderRadius: (BADGE_SIZE + 8) / 2,
          backgroundColor: reached ? "#FEF9E7" : "transparent",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: reached ? 1.5 : 0,
          borderColor: reached ? "#F5D060" : "transparent",
        }}
      >
        <ExpoImage
          source={reached ? milestone.goldSource : milestone.source}
          style={{
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            opacity: reached ? 1 : 0.35,
          }}
          contentFit="contain"
        />
      </View>

      <Text
        style={{
          marginTop: 8,
          fontSize: 12,
          fontFamily: "TikTokSans16pt-Bold",
          color: reached ? T.ink : T.inkSubtle,
          textAlign: "center",
          lineHeight: 16,
        }}
      >
        {milestone.label}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontSize: 10,
          fontFamily: "TikTokSans16pt-Medium",
          color: reached ? "#D4AF37" : T.inkSubtle,
          textAlign: "center",
        }}
      >
        {milestone.desc}
      </Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function StreakScreen() {
  React.useEffect(() => { posthogAnalytics.captureEvent("streak_viewed", { streak_days: useStreakStore.getState().currentStreak }); }, []);
  const router = useRouter();
  const { currentStreak, longestStreak } = useStreakStore();

  const earnedCount = useMemo(
    () => MILESTONES.filter((m) => longestStreak >= m.days).length,
    [longestStreak],
  );
  const earnedPct = earnedCount / MILESTONES.length;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm on a ${currentStreak}-day streak styling my outfits on Look AI! 🔥`,
      });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: H_PAD,
              height: 52,
            }}
          >
            {/* Back button — proper 44×44 touch target */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                backgroundColor: T.surface,
                borderWidth: 1,
                borderColor: T.border,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <IconArrowLeft size={18} color={T.ink} strokeWidth={2} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: T.ink,
                letterSpacing: -0.2,
              }}
            >
              Streak
            </Text>

            {/* Share button — proper 44×44 touch target */}
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
                backgroundColor: T.surface,
                borderWidth: 1,
                borderColor: T.border,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel="Share your streak"
              accessibilityRole="button"
            >
              <IconShare2 size={17} color={T.ink} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* ── Hero Stats ── */}
            <View
              style={{
                paddingHorizontal: H_PAD,
                marginTop: 24,
                marginBottom: 16,
              }}
            >
              {/* Lotties row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                {/* Fire / Longest streak */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      width: 70,
                      height: 70,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LottieView
                      source={require("@/assets/badge/Fire.json")}
                      autoPlay
                      loop
                      style={{ width: 120, height: 120 }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Medium",
                      fontSize: 13,
                      color: T.inkMuted,
                      marginTop: 23,
                    }}
                  >
                    Longest streak
                  </Text>
                </View>

                {/* Trophy / Badges */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      width: 70,
                      height: 85,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LottieView
                      source={require("@/assets/badge/Trophy.json")}
                      autoPlay
                      style={{ width: 180, height: 180 }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Medium",
                      fontSize: 13,
                      color: T.inkMuted,
                      marginTop: 6,
                    }}
                  >
                    Badges earned
                  </Text>
                </View>
              </View>

              {/* Stat cards row — no ghost-card, clean borders only */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                {/* Longest Streak Card */}
                <StatCard>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 4,
                      gap: 5,
                    }}
                  >
                    <LottieView
                      source={require("@/assets/badge/Fire.json")}
                      autoPlay
                      loop
                      style={{ width: 20, height: 20 }}
                    />
                    <Text
                      style={{
                        fontFamily: "TikTokSans16pt-Bold",
                        fontSize: 16,
                        color: T.ink,
                        letterSpacing: -0.3,
                      }}
                    >
                      {longestStreak} days
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "TikTokSans16pt-Medium",
                      fontSize: 12,
                      color: T.inkSubtle,
                      textAlign: "center",
                    }}
                  >
                    Longest streak ever
                  </Text>
                </StatCard>

                {/* Badges Progress Card */}
                <StatCard>
                  {/* Header row */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      gap: 5,
                    }}
                  >
                    <Svg width={16} height={16} viewBox="0 0 100 100">
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
                        fontSize: 13,
                        color: T.ink,
                        letterSpacing: -0.2,
                      }}
                    >
                      {earnedCount}/{MILESTONES.length} Badges
                    </Text>
                  </View>

                  {/* Progress bar — no ghost border */}
                  <View
                    style={{
                      height: 6,
                      backgroundColor: "#EDEDF2",
                      borderRadius: 100,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${earnedPct * 100}%`,
                        height: "100%",
                        backgroundColor: T.accent,
                        borderRadius: 100,
                      }}
                    />
                  </View>
                </StatCard>
              </View>
            </View>

            {/* ── Milestones Section ── */}
            <View style={{ paddingHorizontal: H_PAD }}>
              {/* Section heading */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "TikTokSans16pt-Bold",
                    color: T.ink,
                    letterSpacing: -0.3,
                  }}
                >
                  Milestones
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "TikTokSans16pt-Medium",
                    color: T.inkSubtle,
                  }}
                >
                  {earnedCount} of {MILESTONES.length} unlocked
                </Text>
              </View>

              {/* Badge grid — 3 columns, no overflow */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: 12,
                }}
              >
                {MILESTONES.map((m) => (
                  <MilestoneItem
                    key={m.id}
                    milestone={m}
                    reached={longestStreak >= m.days}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </View>
  );
}
