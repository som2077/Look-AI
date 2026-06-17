import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  IconChartLine,
  IconCrown,
  IconMapPin,
  IconTrendingUp,
  IconLock,
  IconStar,
  IconFlame,
  IconArrowRight,
} from "@tabler/icons-react-native";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Text as SvgText,
  G,
} from "react-native-svg";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrendItem {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  trendPercent: number;
  rank: number;
  tag: string;
  tagColor: string;
  tagBg: string;
  colorTop: string;
  colorBottom: string;
  isPremium: boolean;
  emoji: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const LOCAL_TRENDS: TrendItem[] = [
  {
    id: 101,
    title: "Palazzo Pants",
    subtitle: "Trending near you",
    location: "Indore",
    trendPercent: 84,
    rank: 1,
    tag: "Casual",
    tagColor: "#10B981",
    tagBg: "#ECFDF5",
    colorTop: "#667EEA",
    colorBottom: "#764BA2",
    isPremium: false,
    emoji: "👖",
  },
  {
    id: 102,
    title: "Kurti Sets",
    subtitle: "Local favourite",
    location: "Indore",
    trendPercent: 78,
    rank: 2,
    tag: "Ethnic",
    tagColor: "#EF4444",
    tagBg: "#FEF2F2",
    colorTop: "#F093FB",
    colorBottom: "#F5576C",
    isPremium: false,
    emoji: "🎽",
  },
  {
    id: 103,
    title: "Cotton Coords",
    subtitle: "Weekend vibes",
    location: "Indore",
    trendPercent: 65,
    rank: 3,
    tag: "Comfort",
    tagColor: "#6366F1",
    tagBg: "#EEF2FF",
    colorTop: "#43E97B",
    colorBottom: "#38F9D7",
    isPremium: false,
    emoji: "👗",
  },
  {
    id: 104,
    title: "Linen Shirts",
    subtitle: "Summer essential",
    location: "Indore",
    trendPercent: 60,
    rank: 4,
    tag: "Summer",
    tagColor: "#F59E0B",
    tagBg: "#FFFBEB",
    colorTop: "#FDB99B",
    colorBottom: "#FF5F6D",
    isPremium: false,
    emoji: "👕",
  },
];

export const CELEBRITY_TRENDS: TrendItem[] = [
  {
    id: 201,
    title: "Deepika's Look",
    subtitle: "Cannes 2024 inspired",
    location: "Bollywood",
    trendPercent: 96,
    rank: 1,
    tag: "Celeb",
    tagColor: "#EC4899",
    tagBg: "#FDF2F8",
    colorTop: "#FA709A",
    colorBottom: "#FEE140",
    isPremium: true,
    emoji: "💃",
  },
  {
    id: 202,
    title: "Alia's Ethnic",
    subtitle: "Wedding season pick",
    location: "Bollywood",
    trendPercent: 88,
    rank: 2,
    tag: "Ethnic",
    tagColor: "#EF4444",
    tagBg: "#FEF2F2",
    colorTop: "#F093FB",
    colorBottom: "#F5576C",
    isPremium: true,
    emoji: "🌸",
  },
  {
    id: 203,
    title: "Ranveer Bold",
    subtitle: "Street style king",
    location: "Bollywood",
    trendPercent: 81,
    rank: 3,
    tag: "Bold",
    tagColor: "#8B5CF6",
    tagBg: "#F5F3FF",
    colorTop: "#4FACFE",
    colorBottom: "#00F2FE",
    isPremium: true,
    emoji: "🕺",
  },
  {
    id: 204,
    title: "Kiara's Glam",
    subtitle: "Red carpet queen",
    location: "Bollywood",
    trendPercent: 75,
    rank: 4,
    tag: "Glam",
    tagColor: "#F59E0B",
    tagBg: "#FFFBEB",
    colorTop: "#FDDB92",
    colorBottom: "#D1FDFF",
    isPremium: true,
    emoji: "✨",
  },
];

export const GLOBAL_TRENDS: TrendItem[] = [
  {
    id: 301,
    title: "Y2K Revival",
    subtitle: "Going viral worldwide",
    location: "Global",
    trendPercent: 92,
    rank: 1,
    tag: "Retro",
    tagColor: "#EC4899",
    tagBg: "#FDF2F8",
    colorTop: "#FA709A",
    colorBottom: "#FEE140",
    isPremium: false,
    emoji: "💫",
  },
  {
    id: 302,
    title: "Quiet Luxury",
    subtitle: "Minimalist movement",
    location: "Global",
    trendPercent: 89,
    rank: 2,
    tag: "Minimal",
    tagColor: "#6B7280",
    tagBg: "#F9FAFB",
    colorTop: "#E0EAF4",
    colorBottom: "#667EEA",
    isPremium: false,
    emoji: "🤍",
  },
  {
    id: 303,
    title: "Gorpcore",
    subtitle: "Outdoor street style",
    location: "Global",
    trendPercent: 74,
    rank: 3,
    tag: "Outdoor",
    tagColor: "#10B981",
    tagBg: "#ECFDF5",
    colorTop: "#43E97B",
    colorBottom: "#38F9D7",
    isPremium: false,
    emoji: "🏔️",
  },
  {
    id: 304,
    title: "Barbiecore",
    subtitle: "Pink is the new black",
    location: "Global",
    trendPercent: 70,
    rank: 4,
    tag: "Fun",
    tagColor: "#EC4899",
    tagBg: "#FDF2F8",
    colorTop: "#FF9A9E",
    colorBottom: "#FECFEF",
    isPremium: false,
    emoji: "💕",
  },
];

// ─── Reusable Trend Card ──────────────────────────────────────────────────────

const RANK_COLORS = ["#D97706", "#9B9BAF", "#CD7C46"];

export const TrendCard = React.memo(function TrendCard({
  trend,
  compact = false,
}: {
  trend: TrendItem;
  compact?: boolean;
}) {
  const rankColor = RANK_COLORS[trend.rank - 1] ?? "#9B9BAF";
  const cardWidth = compact ? 130 : 148;
  const imageHeight = compact ? 120 : 140;

  return (
    <Pressable
      style={{
        width: cardWidth,
        marginRight: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#E9EBF8",
        overflow: "hidden",
        shadowColor: "#000000",
        shadowOpacity: 0.03,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1.5,
      }}
    >
      {/* Visual Area with Diagonal Gradient Background */}
      <LinearGradient
        colors={[trend.colorTop, trend.colorBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: imageHeight,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Rank Number Circle Badge */}
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: rankColor,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: "#FFFFFF",
            shadowColor: "#000000",
            shadowOpacity: 0.1,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontFamily: "TikTokSans16pt-Bold",
              color: "#FFFFFF",
            }}
          >
            #{trend.rank}
          </Text>
        </View>

        {/* Premium Lock Badge */}
        {trend.isPremium && (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "rgba(29, 26, 39, 0.45)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <IconLock size={11} color="#FFFFFF" />
          </View>
        )}

        {/* Floating Glassmorphic Emoji Center */}
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "rgba(255, 255, 255, 0.22)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.35)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 25 }}>{trend.emoji}</Text>
        </View>

        {/* Glassmorphic Trending % Pill Badge */}
        <View
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 2.5,
            backgroundColor: "rgba(29, 26, 39, 0.62)",
            borderRadius: 8,
            paddingHorizontal: 6.5,
            paddingVertical: 3,
            borderWidth: 0.5,
            borderColor: "rgba(255, 255, 255, 0.15)",
          }}
        >
          <IconTrendingUp size={9} color="#1D9E75" />
          <Text
            style={{
              fontSize: 9,
              fontFamily: "TikTokSans16pt-Bold",
              color: "#FFFFFF",
            }}
          >
            {trend.trendPercent}%
          </Text>
        </View>
      </LinearGradient>

      {/* Item Metadata */}
      <View style={{ padding: 12 }}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: trend.tagBg,
            borderRadius: 6,
            borderWidth: 0.5,
            borderColor: trend.tagColor + "28",
            paddingHorizontal: 6.5,
            paddingVertical: 2,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: "TikTokSans16pt-Bold",
              color: trend.tagColor,
              letterSpacing: 0.5,
            }}
          >
            {trend.tag.toUpperCase()}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontFamily: "TikTokSans16pt-Bold",
            color: "#1D1A27",
            marginBottom: 4,
          }}
        >
          {trend.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 3.5 }}>
          <IconMapPin size={9.5} color="#9B9BAF" />
          <Text
            style={{
              fontSize: 9.5,
              color: "#9B9BAF",
              fontFamily: "TikTokSans16pt-Medium",
            }}
          >
            {trend.location}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = React.memo(function SectionHeader({
  icon,
  label,
  subtitle,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View>
        <Text
          style={{
            fontSize: 16,
            fontFamily: "TikTokSans16pt-Bold",
            color: "#1D1A27",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: "#9B9BAF",
            fontFamily: "TikTokSans16pt-Medium",
            marginTop: 1,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
});

// ─── Trend Chart Card (Crossing Bezier Curves Comparison) ──────────────────────

type CategoryType = "Near you" | "Celebrity" | "Global";

const CATEGORY_CHART_DATA: Record<
  CategoryType,
  {
    title: string;
    subtitle: string;
    points: {
      yStart: number;
      yRedDip: number;
      yRedPeak: number;
      yBlackPeak: number;
      yBlackEnd: number;
    };
    labels: { red: string; black: string };
    caption: string;
  }
> = {
  "Near you": {
    title: "Indore Trend Velocity",
    subtitle: "Palazzo Pants vs Kurti Sets local growth",
    points: {
      yStart: 50,
      yRedDip: 90,
      yRedPeak: 25,
      yBlackPeak: 50,
      yBlackEnd: 110,
    },
    labels: { red: "Palazzo Pants", black: "Kurti Sets" },
    caption: "85% of Indore users styling Palazzo Pants this month.",
  },
  Celebrity: {
    title: "Bollywood Look Adoption",
    subtitle: "Deepika's Cannes Look vs Alia's Wedding season pick",
    points: {
      yStart: 35,
      yRedDip: 75,
      yRedPeak: 15,
      yBlackPeak: 35,
      yBlackEnd: 110,
    },
    labels: { red: "Deepika Cannes", black: "Alia Wedding" },
    caption: "96% velocity spike on Deepika Cannes style replicas.",
  },
  Global: {
    title: "Global Movement Speed",
    subtitle: "Y2K Revival vs Quiet Luxury global velocity",
    points: {
      yStart: 60,
      yRedDip: 85,
      yRedPeak: 30,
      yBlackPeak: 60,
      yBlackEnd: 110,
    },
    labels: { red: "Y2K Revival", black: "Quiet Luxury" },
    caption: "Y2K styles continue viral adoption cycles across global regions.",
  },
};

const CATEGORIES = ["Near you", "Celebrity", "Global"] as const;

interface TrendChartCardProps {
  activeCategory: CategoryType;
  setActiveCategory: (cat: CategoryType) => void;
}

const SCREEN_WIDTH_TREND = Dimensions.get("window").width;

export const TrendChartCard = React.memo(function TrendChartCard({
  activeCategory,
  setActiveCategory,
}: TrendChartCardProps) {
  const containerWidth = SCREEN_WIDTH_TREND - 40; // mx-5 is 20 padding on each side
  const svgHeight = 155;
  const paddingLeft = 24;
  const paddingRight = 24;
  const chartWidth = containerWidth - paddingLeft - paddingRight;

  const xStart = paddingLeft;
  const xEnd = containerWidth - paddingRight;
  const yBaseline = 110;

  const activeChart = CATEGORY_CHART_DATA[activeCategory];
  const { yStart, yRedDip, yRedPeak, yBlackPeak, yBlackEnd } =
    activeChart.points;

  // Red curve coordinates (Starts at yStart, dips to yRedDip, rises to yRedPeak)
  const dRed = `M ${xStart} ${yStart} C ${xStart + chartWidth / 3} ${yStart - 10}, ${xStart + chartWidth / 3} ${yRedDip + 15}, ${xStart + chartWidth / 2} ${yRedDip - 5} C ${xStart + (2 * chartWidth) / 3} ${yRedDip - 25}, ${xStart + (3 * chartWidth) / 4} ${yRedPeak}, ${xEnd} ${yRedPeak}`;
  const dRedClosed = `${dRed} L ${xEnd} ${yBaseline} L ${xStart} ${yBaseline} Z`;

  // Black curve coordinates (Starts at yStart, stays around yBlackPeak, declines to yBlackEnd)
  const dBlack = `M ${xStart} ${yStart} C ${xStart + chartWidth / 2} ${yBlackPeak - 10}, ${xStart + chartWidth / 2} ${yBlackEnd}, ${xEnd} ${yBlackEnd}`;
  const dBlackClosed = `${dBlack} L ${xEnd} ${yBaseline} L ${xStart} ${yBaseline} Z`;

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#E9EBF8",
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: "#000000",
        shadowOpacity: 0.02,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 0.5,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "TikTokSans16pt-Bold",
          color: "#1D1A27",
          marginBottom: 2,
        }}
      >
        {activeChart.title}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "TikTokSans16pt-Medium",
          color: "#9B9BAF",
          marginBottom: 10,
        }}
        numberOfLines={1}
      >
        {activeChart.subtitle}
      </Text>

      <View
        style={{
          width: containerWidth - 32,
          height: svgHeight,
          marginLeft: -8,
          // marginRight: 2,
        }}
      >
        <Svg width={containerWidth - 32} height={svgHeight}>
          <Defs>
            <SvgLinearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
              <Stop offset="100%" stopColor="#EF4444" stopOpacity={0.0} />
            </SvgLinearGradient>
            <SvgLinearGradient id="blackGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1D1A27" stopOpacity={0.1} />
              <Stop offset="100%" stopColor="#1D1A27" stopOpacity={0.0} />
            </SvgLinearGradient>
          </Defs>

          {/* Dotted horizontal helper lines */}
          <Line
            x1={xStart}
            y1={40}
            x2={xEnd}
            y2={40}
            stroke="#F0F0F2"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          <Line
            x1={xStart}
            y1={75}
            x2={xEnd}
            y2={75}
            stroke="#F0F0F2"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Baseline axis */}
          <Line
            x1={xStart}
            y1={yBaseline}
            x2={xEnd}
            y2={yBaseline}
            stroke="#EBEBEB"
            strokeWidth={1}
          />

          {/* Fills */}
          <Path d={dBlackClosed} fill="url(#blackGrad)" />
          <Path d={dRedClosed} fill="url(#redGrad)" />

          {/* Lines */}
          <Path
            d={dBlack}
            fill="none"
            stroke="#1D1A27"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Path
            d={dRed}
            fill="none"
            stroke="#EF4444"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Start and end points */}
          <Circle
            cx={xStart}
            cy={yStart}
            r={4.5}
            fill="#FFFFFF"
            stroke="#1D1A27"
            strokeWidth={2}
          />
          <Circle
            cx={xEnd}
            cy={yBlackEnd}
            r={4.5}
            fill="#FFFFFF"
            stroke="#1D1A27"
            strokeWidth={2}
          />

          {/* X Axis labels */}
          <SvgText
            x={xStart}
            y={yBaseline + 18}
            textAnchor="start"
            fill="#9B9BAF"
            fontSize={10}
            fontFamily="TikTokSans16pt-Bold"
          >
            Month 1
          </SvgText>
          <SvgText
            x={xEnd}
            y={yBaseline + 18}
            textAnchor="end"
            fill="#9B9BAF"
            fontSize={10}
            fontFamily="TikTokSans16pt-Bold"
          >
            Month 6
          </SvgText>

          {/* In-chart Curve Labels */}
          <SvgText
            x={xEnd - 10}
            y={yRedPeak + 14}
            textAnchor="end"
            fill="#EF4444"
            fontSize={9.5}
            fontFamily="TikTokSans16pt-Bold"
          >
            {activeChart.labels.red}
          </SvgText>
          <SvgText
            x={xEnd - 10}
            y={yBlackEnd - 12}
            textAnchor="end"
            fill="#1D1A27"
            fontSize={9.5}
            fontFamily="TikTokSans16pt-Bold"
          >
            {activeChart.labels.black}
          </SvgText>
        </Svg>
      </View>

      {/* Horizontal Selector Bar inside Trend Chart Card */}
      <View className="flex-row items-center justify-between bg-[#F4F5F9] rounded-[10px] p-1 mt-1 mb-3">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <TouchableOpacity
              key={category}
              onPress={() => setActiveCategory(category)}
              className="flex-1 items-center justify-center py-2"
              style={
                isActive
                  ? {
                      backgroundColor: "#FFFFFF",
                      borderRadius: 10,
                      shadowColor: "#000000",
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                      shadowOffset: { width: 0, height: 1.5 },
                      elevation: 2.5,
                    }
                  : {}
              }
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: isActive
                    ? "TikTokSans16pt-Bold"
                    : "TikTokSans16pt-Medium",
                  color: isActive ? "#1D1A27" : "#7E7C8C",
                }}
              >
                {category === "Near you" ? "Near you" : category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Descriptive caption */}
      <Text
        style={{
          fontSize: 11,
          fontFamily: "TikTokSans16pt-SemiBold",
          color: "#000000",
          textAlign: "center",
          lineHeight: 17,
          marginTop: 4,
          paddingHorizontal: 8,
        }}
      >
        {activeChart.caption}
      </Text>
    </View>
  );
});

// ─── Main TrendFeed Component (used on Home screen) ──────────────────────────

const CATEGORY_TRENDS_MAP: Record<CategoryType, TrendItem[]> = {
  "Near you": LOCAL_TRENDS,
  Celebrity: CELEBRITY_TRENDS,
  Global: GLOBAL_TRENDS,
};

const CATEGORY_LABEL_MAP: Record<CategoryType, string> = {
  "Near you": "Near You · Indore",
  Celebrity: "Celebrity Looks · Bollywood",
  Global: "Global Trends · Worldwide",
};

const getCategoryIcon = (category: CategoryType) => {
  switch (category) {
    case "Near you":
      return <IconMapPin size={14} color="#6366F1" />;
    case "Celebrity":
      return <IconStar size={14} color="#EC4899" />;
    case "Global":
      return <IconFlame size={14} color="#EF4444" />;
  }
};

const getCategoryIconBg = (category: CategoryType) => {
  switch (category) {
    case "Near you":
      return "#EEF2FF";
    case "Celebrity":
      return "#FDF2F8";
    case "Global":
      return "#FEF2F2";
  }
};

export const TrendFeed = React.memo(function TrendFeed() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] =
    useState<CategoryType>("Near you");

  const handleSeeAll = useCallback(() => {
    router.push("/(root)/trend-feed" as never);
  }, [router]);

  return (
    <View style={{ marginTop: 24, marginBottom: 85 }}>
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          marginBottom: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 20,
              fontFamily: "TikTokSans16pt-Bold",
              color: "#1D1A27",
            }}
          >
            Trend Feed
          </Text>
          {/* <Text
            style={{
              fontSize: 11,
              color: "#9B9BAF",
              fontFamily: "TikTokSans16pt-Medium",
              marginTop: 2,
            }}
          >
            Trending near you · Indore
          </Text> */}
        </View>

        <TouchableOpacity onPress={handleSeeAll}>
          <ChevronRight size={20} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Trend comparison graph card (Cal AI style with horizontal selector) */}
      <TrendChartCard
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* ── Empty State Outfit Tracking Card ── */}
      <View
        style={{
          marginHorizontal: 18,
          // backgroundColor: "#FFFFFF",
          // borderWidth: 1,
          // borderColor: "#E5E7EB",
          borderRadius: 24,
          paddingHorizontal: 10,
          paddingVertical: 10,
          // marginTop: 12,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Text
          style={{
            fontSize: 16.5,
            fontFamily: "TikTokSans16pt-Bold",
            color: "#1D1A27",
            textAlign: "center",
            marginBottom: 7,
          }}
        >
          Ready to style your wardrobe.
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#4C4B5E",
            fontFamily: "TikTokSans16pt-Medium",
            // textAlign: "center",
            lineHeight: 17,
          }}
        >
          Upload your clothes and discover {"\n"} new outfit combinations.
        </Text>

        {/* Curved hand-drawn style arrow pointing downwards (half inside, half outside) */}
        <ExpoImage
          source={require("../../assets/ScribbleArrow.svg")}
          style={{
            position: "absolute",
            bottom: -19, // Half of height 40 is outside the card border
            right: 40,
            width: 80,
            height: 40,
            // transform: [{ scaleX: -1 }],
          }}
          contentFit="contain"
        />
      </View>
    </View>
  );
});
