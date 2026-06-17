import React, { useState, useMemo, useCallback } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle } from "react-native-svg";
import {
  IconSettings,
  IconBell,
  IconSparkles,
  IconPalette,
  IconHanger,
  IconLayoutGrid,
  IconHeart,
  IconSun,
  IconTrendingUp,
  IconAward,
  IconBulb,
} from "@tabler/icons-react-native";


// ─── Constants & Types ────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Period = "daily" | "weekly" | "monthly";

interface BreakdownCategory {
  name: string;
  score: number;
  color: string;
  bgColor: string;
  icon: React.ComponentType<any>;
}

interface ScoreData {
  score: number;
  grade: string;
  headline: string;
  description: string;
  trend: string;
  categories: BreakdownCategory[];
  tips: string[];
}

const SCORE_PERIODS: Record<Period, ScoreData> = {
  daily: {
    score: 82,
    grade: "Style A",
    headline: "Looking Excellent!",
    description: "Your outfit coordination matches today's weather and occasion details perfectly.",
    trend: "+3 points since yesterday",
    categories: [
      { name: "Color Coordination", score: 95, color: "#4C36F5", bgColor: "#EAE8FF", icon: IconPalette },
      { name: "Wardrobe Usage", score: 68, color: "#0F824A", bgColor: "#E8F8F0", icon: IconHanger },
      { name: "Outfit Variety", score: 85, color: "#B25E02", bgColor: "#FEF6EC", icon: IconLayoutGrid },
      { name: "Style Consistency", score: 74, color: "#C11574", bgColor: "#FFF0F6", icon: IconHeart },
      { name: "Weather Matching", score: 98, color: "#1665D8", bgColor: "#EAF5FF", icon: IconSun },
      { name: "Trend Alignment", score: 70, color: "#6538C9", bgColor: "#F7F4FD", icon: IconTrendingUp },
    ],
    tips: [
      "Wear accessories like a watch or sunglasses to increase your Trend Alignment score.",
      "Pair contrasting colors like light blue shirt and beige chinos to maintain Color Coordination.",
      "Try styling some of your unworn items to boost Wardrobe Usage score by next update."
    ]
  },
  weekly: {
    score: 78,
    grade: "Style A-",
    headline: "Great Dresser!",
    description: "You dress well for your body type & occasions. Small tweaks can push you to A+",
    trend: "+6 points this week",
    categories: [
      { name: "Color Coordination", score: 92, color: "#4C36F5", bgColor: "#EAE8FF", icon: IconPalette },
      { name: "Wardrobe Usage", score: 75, color: "#0F824A", bgColor: "#E8F8F0", icon: IconHanger },
      { name: "Outfit Variety", score: 80, color: "#B25E02", bgColor: "#FEF6EC", icon: IconLayoutGrid },
      { name: "Style Consistency", score: 68, color: "#C11574", bgColor: "#FFF0F6", icon: IconHeart },
      { name: "Weather Matching", score: 88, color: "#1665D8", bgColor: "#EAF5FF", icon: IconSun },
      { name: "Trend Alignment", score: 62, color: "#6538C9", bgColor: "#F7F4FD", icon: IconTrendingUp },
    ],
    tips: [
      "Wear your 12 unworn clothes — it will boost your Wardrobe Usage score by +10 pts",
      "Try 3 new style combinations this week to improve Style Consistency",
      "Add accessories to your outfits to increase Trend Alignment score"
    ]
  },
  monthly: {
    score: 85,
    grade: "Style A+",
    headline: "Fashion Icon!",
    description: "Consistent high-quality styling across all coordinates. Your trend alignment is top-tier.",
    trend: "+12 points this month",
    categories: [
      { name: "Color Coordination", score: 94, color: "#4C36F5", bgColor: "#EAE8FF", icon: IconPalette },
      { name: "Wardrobe Usage", score: 82, color: "#0F824A", bgColor: "#E8F8F0", icon: IconHanger },
      { name: "Outfit Variety", score: 88, color: "#B25E02", bgColor: "#FEF6EC", icon: IconLayoutGrid },
      { name: "Style Consistency", score: 79, color: "#C11574", bgColor: "#FFF0F6", icon: IconHeart },
      { name: "Weather Matching", score: 90, color: "#1665D8", bgColor: "#EAF5FF", icon: IconSun },
      { name: "Trend Alignment", score: 78, color: "#6538C9", bgColor: "#F7F4FD", icon: IconTrendingUp },
    ],
    tips: [
      "Explore monochromatic overlays to enhance your Outfit Variety metric.",
      "Wear breathable linen layers during the upcoming hot season to stay on top of Weather Matching.",
      "Incorporate modern utility wear cargo pants in your casual looks to raise Trend Alignment."
    ]
  }
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

const ProgressCircle = React.memo(function ProgressCircle({
  score,
  size = 94,
  strokeWidth = 9,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Background circle outline */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAE8FF"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active progress outline */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4C36F5"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      
      {/* Absolute text in center of circle */}
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#1D1A27" }}>
          {score}
        </Text>
        <Text style={{ fontSize: 9, color: "#9B9BAF", fontWeight: "600", marginTop: 1 }}>
          / 100
        </Text>
      </View>
    </View>
  );
});

const CategoryRow = React.memo(function CategoryRow({
  category,
}: {
  category: BreakdownCategory;
}) {
  const Icon = category.icon;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
      {/* Rounded icon placeholder box */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: category.bgColor,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={category.color} strokeWidth={2} />
      </View>

      {/* Main bar area */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#1D1A27", marginBottom: 5 }}>
          {category.name}
        </Text>
        
        {/* Gray outline slot with inner progress bar */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#F1F1F5",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${category.score}%`,
              backgroundColor: category.color,
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      {/* Numerical score value */}
      <Text style={{ fontSize: 13, fontWeight: "800", color: category.color, width: 22, textAlign: "right" }}>
        {category.score}
      </Text>
    </View>
  );
});

interface AchievementBadgeProps {
  title: string;
  earned: boolean;
  bgColor: string;
  iconColor: string;
  icon: React.ComponentType<any>;
}

const AchievementBadge = React.memo(function AchievementBadge({
  title,
  earned,
  bgColor,
  iconColor,
  icon: Icon,
}: AchievementBadgeProps) {
  return (
    <View style={{ alignItems: "center", width: 72, opacity: earned ? 1 : 0.45 }}>
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: earned ? bgColor : "#F1F1F5",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
          borderWidth: earned ? 0 : 1,
          borderColor: "#E2E2EA",
        }}
      >
        <Icon size={20} color={earned ? iconColor : "#9B9BAF"} strokeWidth={1.8} />
      </View>
      <Text
        numberOfLines={2}
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: "#1D1A27",
          textAlign: "center",
          lineHeight: 12,
        }}
      >
        {title}
      </Text>
    </View>
  );
});

// ─── Main Score Screen ───────────────────────────────────────────────────────

export default function ScoreScreen() {
  const [period, setPeriod] = useState<Period>("weekly");

  const currentData = useMemo(() => SCORE_PERIODS[period], [period]);

  const handlePeriodChange = useCallback((selectedPeriod: Period) => {
    setPeriod(selectedPeriod);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FC" }}>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
          >
            {/* Header Title Section */}
            <View style={{ paddingHorizontal: 24, paddingTop: 16, marginBottom: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#9B9BAF" }}>
                    Your fashion analysis
                  </Text>
                  <Text style={{ fontSize: 26, fontWeight: "800", color: "#1D1A27", marginTop: 2 }}>
                    Style Score
                  </Text>
                </View>

                {/* Top Action Settings and Bells */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#E2E2EA",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconSettings size={18} color="#9B9BAF" />
                  </Pressable>
                  <Pressable
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#E2E2EA",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconBell size={18} color="#9B9BAF" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Daily | Weekly | Monthly Segment Switch */}
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: "#F1F1F5",
                  borderRadius: 14,
                  padding: 4,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {(["daily", "weekly", "monthly"] as Period[]).map((p) => {
                  const isSelected = p === period;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => handlePeriodChange(p)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 11,
                        backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOpacity: isSelected ? 0.05 : 0,
                        shadowRadius: 3,
                        shadowOffset: { width: 0, height: 1 },
                        elevation: isSelected ? 1 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: isSelected ? "#1D1A27" : "#9B9BAF",
                          textTransform: "capitalize",
                        }}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Main Circle Progress and Analysis Summary */}
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.015,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                }}
              >
                {/* SVG Progress Circle */}
                <ProgressCircle score={currentData.score} />

                {/* Core description next to ring */}
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <View style={{ flexDirection: "row", marginBottom: 6 }}>
                    <View
                      style={{
                        backgroundColor: "#E8F8F0",
                        borderWidth: 1,
                        borderColor: "#C6EFD9",
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "800", color: "#0F824A" }}>
                        {currentData.grade}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#1D1A27" }}>
                    {currentData.headline}
                  </Text>
                  
                  <Text style={{ fontSize: 11, color: "#8E8E9F", marginTop: 4, lineHeight: 15, fontWeight: "500" }}>
                    {currentData.description}
                  </Text>

                  {/* Up trend count */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                    <IconTrendingUp size={11} color="#0F824A" strokeWidth={3} />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#0F824A" }}>
                      {currentData.trend.split(" ")[0]}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#9B9BAF", fontWeight: "600" }}>
                      {currentData.trend.substring(currentData.trend.indexOf(" ") + 1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Score Breakdown Section */}
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  padding: 20,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#1D1A27" }}>
                    Score Breakdown
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#9B9BAF" }}>
                    {currentData.categories.length} categories
                  </Text>
                </View>

                {/* Map categories */}
                {currentData.categories.map((cat, idx) => (
                  <CategoryRow key={idx} category={cat} />
                ))}
              </View>
            </View>

            {/* Tips to Improve Score Card */}
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  padding: 20,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <IconBulb size={18} color="#B25E02" />
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#1D1A27" }}>
                    Tips to improve score
                  </Text>
                </View>

                {/* Recommendations */}
                {currentData.tips.map((tip, idx) => (
                  <View key={idx} style={{ flexDirection: "row", marginBottom: 14, alignItems: "flex-start" }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#FEF6EC",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        marginTop: 1,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "800", color: "#B25E02" }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 12, color: "#5A5A6A", lineHeight: 18, fontWeight: "500" }}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Achievements row */}
            <View style={{ paddingHorizontal: 24 }}>
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  padding: 20,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#1D1A27" }}>
                    Achievements
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#9B9BAF" }}>
                    4/7 earned
                  </Text>
                </View>

                {/* Badge list */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14 }}
                  style={{ maxHeight: 85 }}
                >
                  <AchievementBadge
                    title="First Look"
                    earned={true}
                    bgColor="#FEF6EC"
                    iconColor="#B25E02"
                    icon={IconAward}
                  />
                  <AchievementBadge
                    title="Color Pro"
                    earned={true}
                    bgColor="#EAE8FF"
                    iconColor="#4C36F5"
                    icon={IconPalette}
                  />
                  <AchievementBadge
                    title="7 Day Streak"
                    earned={true}
                    bgColor="#E8F8F0"
                    iconColor="#0F824A"
                    icon={IconSparkles}
                  />
                  <AchievementBadge
                    title="Style Lover"
                    earned={true}
                    bgColor="#FFF0F6"
                    iconColor="#C11574"
                    icon={IconHeart}
                  />
                  <AchievementBadge
                    title="Style King"
                    earned={false}
                    bgColor="#F1F1F5"
                    iconColor="#9B9BAF"
                    icon={IconHanger}
                  />
                </ScrollView>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
  );
}
