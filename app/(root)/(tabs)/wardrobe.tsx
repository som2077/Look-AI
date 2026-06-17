import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import {
  IconPlus,
  IconHanger,
  IconShirt,
  IconShoe,
  IconScissors,
  IconLayoutGrid,
  IconChevronRight,
  IconSparkles,
  IconList,
  IconHeart,
  IconCamera,
  IconPhoto,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react-native";
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { useScrollToHideTabBar } from "../../../hooks/useScrollToHideTabBar";
import { useWardrobeSummary } from "@/backend/hooks/useWardrobeSummary";
import { MOCK_WARDROBE_ITEMS } from "@/constants/mock-wardrobe-items";
import { useUserWardrobeStore } from "@/backend/store/user-wardrobe-store";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryId =
  | "all"
  | "top"
  | "bottoms"
  | "footwear"
  | "outerwear"
  | "dress"
  | "ethnic"
  | "accessory"
  | "activewear"
  | "sportswear"
  | "formal"
  | "casual"
  | "partywear"
  | "sleepwear"
  | "swimwear"
  | "winterwear"
  | "summerwear"
  | "loungewear"
  | "bags"
  | "jewelry"
  | "watches"
  | "sunglasses"
  | "belts"
  | "hats"
  | "co_ords"
  | "jumpsuits"
  | "blazers"
  | "hoodies"
  | "jackets"
  | "sweaters"
  | "jeans"
  | "trousers"
  | "shorts"
  | "skirts"
  | "traditional"
  | "festive"
  | "wedding"
  | "new_arrivals"
  | "trending"
  | "favorites"
  | "recommended";

interface CategoryChip {
  id: CategoryId;
  label: string;
}

interface ClothingItem {
  id: string;
  name: string;
  category: CategoryId;
  color: string;
  bgColor: string;
  occasion: string;
  wears: number;
  isNew: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 8;
const GRID_PADDING = 14;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const MASONRY_HEIGHTS = [
  230, 175, 260, 195, 210, 180, 250, 165, 240, 185, 220, 200,
];

const CATEGORIES: CategoryChip[] = [
  { id: "all", label: "All" },
  { id: "top", label: "Tops" },
  { id: "bottoms", label: "Bottom" },
  { id: "footwear", label: "Shoes" },
  { id: "outerwear", label: "Outer" },
  { id: "dress", label: "Dress" },
  { id: "ethnic", label: "Ethnic" },
  { id: "accessory", label: "Accessory" },
  { id: "activewear", label: "activewear" },
  { id: "sportswear", label: "sportswear" },
  { id: "formal", label: "formal" },
  { id: "casual", label: "casual" },
  { id: "partywear", label: "partywear" },
  { id: "sleepwear", label: "sleepwear" },
  { id: "swimwear", label: "swimwear" },
  { id: "winterwear", label: "winterwear" },
  { id: "summerwear", label: "summerwear" },
  { id: "loungewear", label: "loungewear" },
  { id: "bags", label: "bags" },
  { id: "jewelry", label: "jewelry" },
  { id: "watches", label: "watches" },
  { id: "sunglasses", label: "sunglasses" },
  { id: "belts", label: "belts" },
  { id: "hats", label: "hats" },
  { id: "co_ords", label: "co_ords" },
  { id: "jumpsuits", label: "jumpsuits" },
  { id: "blazers", label: "blazers" },
  { id: "hoodies", label: "hoodies" },
  { id: "jackets", label: "jackets" },
  { id: "sweaters", label: "sweaters" },
  { id: "jeans", label: "jeans" },
  { id: "trousers", label: "trousers" },
  { id: "shorts", label: "shorts" },
  { id: "skirts", label: "skirts" },
  { id: "traditional", label: "traditional" },
  { id: "festive", label: "festive" },
  { id: "wedding", label: "wedding" },
  { id: "new_arrivals", label: "new_arrivals" },
  { id: "trending", label: "trending" },
  { id: "favorites", label: "favorites" },
  { id: "recommended", label: "recommended" },
];

const CATEGORY_ICONS: Partial<Record<CategoryId, React.ComponentType<any>>> = {
  all: IconLayoutGrid,
  top: IconShirt,
  bottoms: IconScissors,
  footwear: IconShoe,
  outerwear: IconShirt,
  dress: IconShirt,
  ethnic: IconShirt,
  accessory: IconHanger,
  activewear: IconShirt,
  sportswear: IconShirt,
  formal: IconShirt,
  casual: IconShirt,
  partywear: IconShirt,
  sleepwear: IconShirt,
  swimwear: IconShirt,
  winterwear: IconShirt,
  summerwear: IconShirt,
  loungewear: IconShirt,
  bags: IconHanger,
  jewelry: IconHanger,
  watches: IconHanger,
  sunglasses: IconHanger,
  belts: IconHanger,
  hats: IconHanger,
  co_ords: IconShirt,
  jumpsuits: IconShirt,
  blazers: IconShirt,
  hoodies: IconShirt,
  jackets: IconShirt,
  sweaters: IconShirt,
  jeans: IconScissors,
  trousers: IconScissors,
  shorts: IconScissors,
  skirts: IconShirt,
  traditional: IconShirt,
  festive: IconShirt,
  wedding: IconShirt,
  new_arrivals: IconLayoutGrid,
  trending: IconLayoutGrid,
  favorites: IconHeart,
  recommended: IconSparkles,
};

const CATEGORY_COLORS: Partial<Record<CategoryId, string>> = {
  all: "#6366F1",
  top: "#10B981",
  bottoms: "#3B82F6",
  footwear: "#F59E0B",
  outerwear: "#8B5CF6",
  dress: "#EC4899",
  ethnic: "#EF4444",
  accessory: "#6B7280",
  activewear: "#10B981",
  sportswear: "#3B82F6",
  formal: "#1D1A27",
  casual: "#6366F1",
  partywear: "#EC4899",
  sleepwear: "#8B5CF6",
  swimwear: "#06B6D4",
  winterwear: "#3B82F6",
  summerwear: "#F59E0B",
  loungewear: "#8B5CF6",
  bags: "#6B7280",
  jewelry: "#F59E0B",
  watches: "#6B7280",
  sunglasses: "#1D1A27",
  belts: "#92400E",
  hats: "#6B7280",
  co_ords: "#EC4899",
  jumpsuits: "#8B5CF6",
  blazers: "#1D1A27",
  hoodies: "#6366F1",
  jackets: "#8B5CF6",
  sweaters: "#F59E0B",
  jeans: "#3B82F6",
  trousers: "#6B7280",
  shorts: "#10B981",
  skirts: "#EC4899",
  traditional: "#EF4444",
  festive: "#F59E0B",
  wedding: "#EC4899",
  new_arrivals: "#10B981",
  trending: "#EF4444",
  favorites: "#E11D48",
  recommended: "#6366F1",
};

const CATEGORY_BG: Partial<Record<CategoryId, string>> = {
  all: "#EEF2FF",
  top: "#ECFDF5",
  bottoms: "#EFF6FF",
  footwear: "#FFFBEB",
  outerwear: "#F5F3FF",
  dress: "#FDF2F8",
  ethnic: "#FFF1F2",
  accessory: "#F9FAFB",
  activewear: "#ECFDF5",
  sportswear: "#EFF6FF",
  formal: "#F1F1F5",
  casual: "#EEF2FF",
  partywear: "#FDF2F8",
  sleepwear: "#F5F3FF",
  swimwear: "#ECFEFF",
  winterwear: "#EFF6FF",
  summerwear: "#FFFBEB",
  loungewear: "#F5F3FF",
  bags: "#F9FAFB",
  jewelry: "#FFFBEB",
  watches: "#F9FAFB",
  sunglasses: "#F1F1F5",
  belts: "#FEF3C7",
  hats: "#F9FAFB",
  co_ords: "#FDF2F8",
  jumpsuits: "#F5F3FF",
  blazers: "#F1F1F5",
  hoodies: "#EEF2FF",
  jackets: "#F5F3FF",
  sweaters: "#FFFBEB",
  jeans: "#EFF6FF",
  trousers: "#F9FAFB",
  shorts: "#ECFDF5",
  skirts: "#FDF2F8",
  traditional: "#FFF1F2",
  festive: "#FFFBEB",
  wedding: "#FDF2F8",
  new_arrivals: "#ECFDF5",
  trending: "#FFF1F2",
  favorites: "#FFF1F2",
  recommended: "#EEF2FF",
};

const MOCK_ITEMS = MOCK_WARDROBE_ITEMS as ClothingItem[];

// ─── Sub-Components ──────────────────────────────────────────────────────────

const CategoryFilter = React.memo(function CategoryFilter({
  active,
  onSelect,
}: {
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
}) {
  const rows: CategoryChip[][] = [[], [], []];
  CATEGORIES.forEach((cat, index) => {
    rows[index % 3].push(cat);
  });

  const renderChip = (cat: CategoryChip) => {
    const isActive = cat.id === active;
    return (
      <Pressable
        key={cat.id}
        onPress={() => onSelect(cat.id)}
        style={{
          backgroundColor: isActive ? "#1D1A27" : "#FFFFFF",
          borderColor: "#F8F7FC",
          borderWidth: 0.5,
          borderRadius: 25,
          paddingHorizontal: 20,
          paddingVertical: 10,
          marginTop: 5,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: isActive ? "600" : "500",
            color: isActive ? "#FFFFFF" : "#1D1A27",
          }}
        >
          {cat.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: "column",
        // gap: 6,
        paddingHorizontal: 10,
      }}
      style={{ marginBottom: 16 }}
    >
      <View style={{ flexDirection: "row", gap: 5 }}>
        {rows[0].map(renderChip)}
      </View>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {rows[1].map(renderChip)}
      </View>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {rows[2].map(renderChip)}
      </View>
    </ScrollView>
  );
});

// ─── Time filters ─────────────────────────────────────────────────────────────

const TIME_FILTERS = ["Today", "3day", "5day", "This week"];

// ─── StatsCard with gradient arc matching reference image ─────────────────────

const StatsCard = React.memo(function StatsCard({
  total,
  worn,
  unworn,
  usage,
}: {
  total: number;
  worn: number;
  unworn: number;
  usage: number;
}) {
  const [activeFilter, setActiveFilter] = useState("Today");

  const multiplier =
    activeFilter === "Today"
      ? 1
      : activeFilter === "3day"
        ? 1.5
        : activeFilter === "5day"
          ? 2
          : 2.5;

  const displayTotal = total;
  const displayWorn = Math.min(Math.round(worn * multiplier), total);
  const displayUnworn = Math.max(total - displayWorn, 0);
  const displayUsage = total > 0 ? Math.round((displayWorn / total) * 100) : 0;

  // ── Arc geometry (matching reference image: 3 gradient concentric rings) ──
  const arcW = 160;
  const thickness = 15;
  const arcGap = 2;
  const r1 = 70; // outer ring centerline radius
  const r2 = r1 - thickness - arcGap; // = 48  middle ring
  const r3 = r2 - thickness - arcGap; // = 26  inner ring
  const cx = arcW / 2; // = 80
  const cy = r1 + 10; // = 80
  const arcH = 160;

  // Opens at bottom — 70° gap, 290° span
  const START_DEG = 235; // lower-left
  const TOTAL_DEG = -290; // CW in Cartesian

  const f1 = Math.max(
    0.0001,
    Math.min(displayWorn / (displayTotal || 1), 0.9999),
  );
  const f2 = Math.max(0.0001, Math.min(displayUsage / 100, 0.9999));
  const f3 = Math.max(
    0.0001,
    Math.min(displayUnworn / (displayTotal || 1), 0.9999),
  );

  const makeArc = (r: number, f: number = 0.9999): string => {
    const clampedF = Math.max(0.0001, Math.min(f, 0.9999));
    const startRad = (START_DEG * Math.PI) / 180;
    const endRad = ((START_DEG + clampedF * TOTAL_DEG) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy - r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy - r * Math.sin(endRad);
    const largeArc = Math.abs(clampedF * TOTAL_DEG) > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  // Icon anchor point at a given angle and radius
  const getPoint = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const flamePos = getPoint(r1, START_DEG);
  const runnerPos = getPoint(r2, START_DEG);
  const personPos = getPoint(r3, START_DEG);

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 6 }}>
      {/* Time Filter Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#F8F7FC",
          // borderColor: "#E9EBF8",
          // borderWidth: 0.5,
          borderRadius: 13,

          padding: 1,
          // marginTop: ,
          marginBottom: 5,
          shadowColor: "#000000",
          shadowOpacity: 0.05,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1.5 },
          elevation: 1,
          borderWidth: 0.5,
          borderColor: "#EBEBEB",
        }}
      >
        {TIME_FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor:
                activeFilter === filter ? "#FFFFFF" : "transparent",
              borderColor: activeFilter === filter ? "#EBEBEB" : "transparent",
              alignItems: "center",
              borderWidth: 0.5,

              shadowColor: activeFilter === filter ? "#000" : "transparent",
              shadowOpacity: activeFilter === filter ? 0.05 : 0,
              shadowRadius: activeFilter === filter ? 10 : 0,
              shadowOffset: {
                width: 0,
                height: activeFilter === filter ? 2 : 0,
              },
              elevation: activeFilter === filter ? 1 : 0,
            }}
          >
            <Text
              style={{
                // fontSize: 14,
                fontSize: 14,
                fontFamily: "TikTokSans16pt-Medium",
                // color: "#1C1C1E",
                fontWeight: activeFilter === filter ? "700" : "400",
                color: "#1D1A27",
              }}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* ── Two Cards Row ── */}
      <View
        style={{
          flexDirection: "row",
          gap: 5,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#EBEBEB",
          // shadowColor: "#FFFFFF",
          borderRadius: 24,
          // shadowOpacity: 0.05,
          // shadowRadius: 10,
          // shadowOffset: { width: 0, height: 3 },
          // elevation: 2,
          shadowColor: "#000",
          shadowOpacity: 0.02,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 1,
        }}
      >
        {/* ── Right Card: Stats Column ── */}
        <View
          style={{
            flex: 24,
            // backgroundColor: "#FFFFFF90",
            // borderRadius: 24,
            // paddingVertical: 10,
            // width: "20%",
            // paddingHorizontal: -15,
            justifyContent: "space-between",
            // alignItems: "center",
            // justifyContent: "center",
            // marginLeft: 10,
            // borderWidth: 1,
          }}
        >
          {/* Worn */}
          <View style={{ marginLeft: 25, marginTop: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 2,
              }}
            >
              <View
                style={{
                  width: 15,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#FF1200",
                }}
              />
              <Text style={{ fontSize: 13, color: "#666", fontWeight: "600" }}>
                Worn items
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#000" }}>
                {displayWorn}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#666",
                  fontWeight: "500",
                  marginLeft: 2,
                }}
              >
                /{displayTotal} items
              </Text>
            </View>
          </View>

          {/* Usage */}
          <View style={{ marginLeft: 25, paddingVertical: 5 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 2,
              }}
            >
              <View
                style={{
                  width: 15,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#FFB020",
                }}
              />
              <Text style={{ fontSize: 13, color: "#666", fontWeight: "600" }}>
                Usage
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#000" }}>
                {displayUsage}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#666",
                  fontWeight: "500",
                  marginLeft: 2,
                }}
              >
                %
              </Text>
            </View>
          </View>

          {/* Unworn */}
          <View style={{ marginLeft: 25, marginBottom: 15 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 2,
              }}
            >
              <View
                style={{
                  width: 15,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#1E88E5",
                }}
              />
              <Text style={{ fontSize: 13, color: "#666", fontWeight: "600" }}>
                Unworn items
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#000" }}>
                {displayUnworn}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#666",
                  fontWeight: "500",
                  marginLeft: 2,
                }}
              >
                /{displayTotal} items
              </Text>
            </View>
          </View>
        </View>
        {/* ── Left Card: Rings ── */}
        <View
          style={{
            flex: 30,
            // backgroundColor: "#FFFFFF90",
            // borderRadius: 24,
            // paddingVertical: 0,
            alignItems: "center",
            // width: "-10%",
            justifyContent: "center",
            // borderWidth: 1,
            // marginRight: -10,
            // borderColor: "#EBEBEB",
            // shadowColor: "#FFFFFF",
            // shadowOpacity: 0.05,
            // shadowRadius: 10,
            // shadowOffset: { width: 0, height: 3 },
            // elevation: 2,
          }}
        >
          <Svg width={arcW} height={arcH}>
            <Defs>
              <LinearGradient
                id="wrdOuter"
                x1={0}
                y1={0}
                x2={arcW}
                y2={0}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#2C242F10" stopOpacity={1} />
                <Stop offset="50%" stopColor="#2C242F10" stopOpacity={1} />
                <Stop offset="100%" stopColor="#2C242F10" stopOpacity={1} />
              </LinearGradient>
              <LinearGradient
                id="wrdMiddle"
                x1={0}
                y1={0}
                x2={arcW}
                y2={0}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#2C242F" stopOpacity={1} />
                <Stop offset="50%" stopColor="#2C242F" stopOpacity={1} />
                <Stop offset="100%" stopColor="#2C242F" stopOpacity={1} />
              </LinearGradient>
              <LinearGradient
                id="wrdInner"
                x1={0}
                y1={cy - r3}
                x2={0}
                y2={cy + r3}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0%" stopColor="#2C242F" stopOpacity={1} />
                <Stop offset="100%" stopColor="#2C242F" stopOpacity={1} />
              </LinearGradient>
            </Defs>

            {/* Background Tracks */}
            <Path
              d={makeArc(r1)}
              fill="none"
              stroke="#F8F7FC"
              // color="#EBEB"
              // borderWidth={0.5}
              strokeWidth={thickness}
              strokeLinecap="round"
            />
            <Path
              d={makeArc(r2)}
              fill="none"
              stroke="#F8F7FC"
              strokeWidth={thickness}
              strokeLinecap="round"
            />
            <Path
              d={makeArc(r3)}
              fill="none"
              stroke="#F8F7FC"
              strokeWidth={thickness}
              strokeLinecap="round"
            />

            {/* Outer ring — Red to Orange */}
            <Path
              d={makeArc(r1, f1)}
              fill="none"
              stroke="url(#wrdOuter)"
              strokeWidth={thickness}
              strokeLinecap="round"
            />

            {/* Middle ring — Yellow to Orange */}
            <Path
              d={makeArc(r2, f2)}
              fill="none"
              stroke="url(#wrdMiddle)"
              strokeWidth={thickness}
              strokeLinecap="round"
            />

            {/* Inner ring — Blue */}
            <Path
              d={makeArc(r3, f3)}
              fill="none"
              stroke="url(#wrdInner)"
              strokeWidth={thickness}
              strokeLinecap="round"
            />

            {/* ── Flame icon ── */}
            <G
              transform={`translate(${flamePos.x.toFixed(1)}, ${flamePos.y.toFixed(1)})`}
            >
              <Circle cx={0} cy={0} r={thickness / 2} fill="#FF1200" />
              <G transform="scale(0.6)">
                <Path
                  d="M 0,-8 C 4,-5 5,0 3,5 C 2,7 -2,7 -3,5 C -5,0 -4,-5 0,-8 Z"
                  fill="white"
                  opacity={0.95}
                />
                <Path
                  d="M 0,-2 C 2,0 2,4 0,5.5 C -2,4 -2,0 0,-2 Z"
                  fill="#FF5200"
                  opacity={0.7}
                />
              </G>
            </G>

            {/* ── Runner icon ── */}
            <G
              transform={`translate(${runnerPos.x.toFixed(1)}, ${runnerPos.y.toFixed(1)})`}
            >
              <Circle cx={0} cy={0} r={thickness / 2} fill="#FF9500" />
              <G transform="scale(0.6)">
                <Circle cx={2} cy={-7} r={3} fill="white" />
                <Path
                  d="M 1,-4 L 2,2"
                  stroke="white"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 1.5,-3 L 6,-1"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 1.5,-3 L -3,0"
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 2,2 L 6,7"
                  stroke="white"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 2,2 L -1,5 L 0,8"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              </G>
            </G>

            {/* ── Person (stand) icon ── */}
            <G
              transform={`translate(${personPos.x.toFixed(1)}, ${personPos.y.toFixed(1)})`}
            >
              <Circle cx={0} cy={0} r={thickness / 2} fill="#1E88E5" />
              <G transform="scale(0.6)">
                <Circle cx={0} cy={-7} r={3} fill="white" />
                <Path
                  d="M 0,-4 L 0,2"
                  stroke="white"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M -5,-7 L 0,-3 L 5,-7"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d="M 0,2 L -3,8"
                  stroke="white"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 0,2 L 3,8"
                  stroke="white"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  fill="none"
                />
              </G>
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
});

// ─── View mode toggle ─────────────────────────────────────────────────────────

const ViewToggle = React.memo(function ViewToggle({
  viewMode,
  onToggle,
}: {
  viewMode: "grouped" | "grid";
  onToggle: (mode: "grouped" | "grid") => void;
}) { 
  const isGrouped = viewMode === "grouped";
  return (
    <Pressable
      onPress={() => onToggle(isGrouped ? "grid" : "grouped")}
      style={{
        width: 48,
        height: 48,
        backgroundColor: "#FFFFFF",
        borderRadius: 29,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isGrouped ? (
        <IconList size={24} color="#1D1A27" strokeWidth={2.5} />
      ) : (
        <IconLayoutGrid size={24} color="#1D1A27" strokeWidth={1.5} />
      )}
    </Pressable>
  );
});

// ─── Pinterest masonry card ───────────────────────────────────────────────────

const MasonryCard = React.memo(function MasonryCard({
  item,
  height,
}: {
  item: ClothingItem;
  height: number;
}) {
  const router = useRouter();
  const bg = CATEGORY_BG[item.category] || "#F0EEF8";
  return (
    <Pressable
      onPress={() => router.push(`/(root)/cloth-details/${item.id}` as never)}
      style={{
        width: "100%",
        height,
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: GRID_GAP,
        backgroundColor: bg,
        // marginTop:100,
        // alignItems: "center",
        // justifyContent:"center "
      }}
    >
      <View style={{ flex: 1, backgroundColor: bg }} />
    </Pressable>
  );
});

// ─── Carousel card for grouped view ──────────────────────────────────────────

const CarouselCard = React.memo(function CarouselCard({
  item,
}: {
  item: ClothingItem;
}) {
  const router = useRouter();
  const bg = CATEGORY_BG[item.category] || "#F4F4F6";
  return (
    <Pressable
      onPress={() => router.push(`/(root)/cloth-details/${item.id}` as never)}
      style={{
        width: 180,
        height: 220,
        marginRight: 12,
        backgroundColor: bg,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <View style={{ flex: 1, backgroundColor: bg }} />
    </Pressable>
  );
});

// ─── Group section header ─────────────────────────────────────────────────────

const GroupHeader = React.memo(function GroupHeader({
  category,
  count,
}: {
  category: CategoryChip;
  count: number;
}) {
  const color = CATEGORY_COLORS[category.id];
  const bg = CATEGORY_BG[category.id];
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 14,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700", color: "#1D1A27" }}>
        {category.label}
      </Text>
      <View
        style={{
          backgroundColor: bg,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color }}>
          {count} {count === 1 ? "item" : "items"}
        </Text>
      </View>
    </View>
  );
});

// ─── AI suggestion banner ─────────────────────────────────────────────────────

const AISuggestionBanner = React.memo(function AISuggestionBanner({
  unworn,
}: {
  unworn: number;
}) {
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 24,
        padding: 16,
        backgroundColor: "#1D1A27",
        borderRadius: 24,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "rgba(99,102,241,0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconSparkles size={22} color="#818CF8" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
          {unworn} clothes never worn
        </Text>
        <Text
          style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}
        >
          Get AI outfit ideas for them →
        </Text>
      </View>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.08)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconChevronRight size={16} color="rgba(255,255,255,0.5)" />
      </View>
    </Pressable>
  );
});

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = React.memo(function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: "#EEF2FF",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <IconHanger size={40} color="#6366F1" strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: "#1D1A27",
          marginBottom: 8,
        }}
      >
        Your wardrobe is empty
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#9B9BAF",
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 24,
        }}
      >
        Start adding your clothes to track what you wear and get personalized AI
        outfit ideas.
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          backgroundColor: "#1D1A27",
          borderRadius: 20,
          paddingHorizontal: 28,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <IconPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
          Add your first item
        </Text>
      </Pressable>
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WardrobeScreen() {
  const { onScroll } = useScrollToHideTabBar();
  const router = useRouter();
  const { user } = useUser();
  const { summary } = useWardrobeSummary(user?.id);
  const userItems = useUserWardrobeStore((state) => state.items);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const allItems = useMemo(() => {
    const saved = userItems.map(
      (item): ClothingItem => ({
        id: item.id,
        name: item.name,
        category: item.category as CategoryId,
        color: item.color ?? "—",
        bgColor: "#F8F7FC",
        occasion: item.occasion ?? "Casual",
        wears: 0,
        isNew: true,
      }),
    );
    return [...saved, ...MOCK_ITEMS];
  }, [userItems]);

  const ADD_MENU_OPTIONS = [
    {
      id: "add_clothing",
      label: "Add Clothing",
      subtitle: "Upload a photo of your clothes",
      icon: IconShirt,
      color: "#6366F1",
      bg: "#EEF2FF",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/add-clothes" as never);
      },
    },
    {
      id: "scan",
      label: "Scan & Add",
      subtitle: "Use camera to scan your clothing",
      icon: IconCamera,
      color: "#10B981",
      bg: "#ECFDF5",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/add-clothes" as never);
      },
    },
    {
      id: "gallery",
      label: "Add from Gallery",
      subtitle: "Pick multiple items from photos",
      icon: IconPhoto,
      color: "#F59E0B",
      bg: "#FFFBEB",
      onPress: () => {
        setShowAddMenu(false);
        router.push("/(root)/add-clothes" as never);
      },
    },
    {
      id: "outfit",
      label: "Create Outfit",
      subtitle: "Combine pieces into an outfit",
      icon: IconHanger,
      color: "#EC4899",
      bg: "#FDF2F8",
      onPress: () => {
        setShowAddMenu(false);
      },
    },
  ];

  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [viewMode, setViewMode] = useState<"grouped" | "grid">("grouped");

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return allItems;
    return allItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, allItems]);

  const displayItems = useMemo(() => filteredItems, [filteredItems]);

  const groupableCategories = useMemo(() => {
    if (activeCategory !== "all") {
      return CATEGORIES.filter((cat) => cat.id === activeCategory);
    }
    return CATEGORIES.filter(
      (cat) =>
        cat.id !== "all" && allItems.some((item) => item.category === cat.id),
    );
  }, [activeCategory, allItems]);

  const total = allItems.length;
  const worn = summary.totalWorn || allItems.filter((i) => i.wears > 0).length;
  const unworn =
    summary.neverCount || allItems.filter((i) => i.wears === 0).length;
  const usage = summary.wornPercentage
    ? Math.round(summary.wornPercentage * 100)
    : total > 0
      ? Math.round((worn / total) * 100)
      : 0;

  const handleAddClothes = useCallback(() => {
    router.push("/(root)/add-clothes" as never);
  }, [router]);

  const handleSaved = useCallback(() => {
    router.push("/(root)/saved" as never);
  }, [router]);

  const handleCategorySelect = useCallback((id: CategoryId) => {
    setActiveCategory(id);
  }, []);

  const renderGroupedRow = useCallback(
    ({ item: category }: { item: CategoryChip }) => {
      const categoryItems = allItems.filter(
        (item) => item.category === category.id,
      );
      return (
        <View style={{ marginBottom: 8 }}>
          {activeCategory === "all" && (
            <GroupHeader category={category} count={categoryItems.length} />
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {categoryItems.map((clothingItem) => (
              <CarouselCard key={clothingItem.id} item={clothingItem} />
            ))}
          </ScrollView>
        </View>
      );
    },
    [activeCategory, allItems],
  );

  const listHeader = (
    <View style={{ marginTop: 4 }}>
      <StatsCard total={total} worn={worn} unworn={unworn} usage={usage} />
      <CategoryFilter active={activeCategory} onSelect={handleCategorySelect} />
      {activeCategory === "all" && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}>
              All Categories
            </Text>
          </View>
          <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
        </View>
      )}
    </View>
  );

  return (
    <SwipeTabWrapper tabIndex={1}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 15,
            }}
          >
            <View>
              <Text
                style={{ fontSize: 26, fontWeight: "500", color: "#000000" }}
              >
                Wardrobe
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Pressable
                onPress={() => setShowAddMenu(true)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#1D1A27",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconPlus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
              <Pressable
                onPress={handleSaved}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconHeart size={20} color="#000000" strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* ── Add Menu Modal ── */}
          <Modal
            visible={showAddMenu}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAddMenu(false)}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.4)",
                justifyContent: "flex-end",
              }}
              onPress={() => setShowAddMenu(false)}
            >
              <Pressable onPress={() => {}}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    paddingTop: 12,
                    paddingBottom: 40,
                    paddingHorizontal: 20,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#E0E0E8",
                      alignSelf: "center",
                      marginBottom: 20,
                    }}
                  />
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
                        fontWeight: "700",
                        color: "#1D1A27",
                      }}
                    >
                      Add to Wardrobe
                    </Text>
                    {/* <Pressable onPress={() => setShowAddMenu(false)}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "#EEF0F5",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconX size={16} color="#1D1A27" strokeWidth={2.5} />
                      </View>
                    </Pressable> */}
                  </View>
                  {ADD_MENU_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={opt.onPress}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 16,
                          paddingVertical: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: "#F4F4F8",
                        }}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            backgroundColor: opt.bg,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={22} color={opt.color} strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: "#1D1A27",
                            }}
                          >
                            {opt.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#9B9BAF",
                              marginTop: 2,
                            }}
                          >
                            {opt.subtitle}
                          </Text>
                        </View>
                        <IconChevronRight
                          size={18}
                          color="#C0C0CC"
                          strokeWidth={2}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {/* ── Content ── */}
          {viewMode === "grid" || activeCategory !== "all" ? (
            <ScrollView
              key="grid-view"
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingBottom: 140 }}
            >
              {listHeader}
              {displayItems.length === 0 ? (
                <EmptyState onAdd={handleAddClothes} />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: GRID_PADDING,
                    gap: GRID_GAP,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    {displayItems
                      .filter((_, i) => i % 2 === 0)
                      .map((item, i) => (
                        <MasonryCard
                          key={item.id}
                          item={item}
                          height={
                            MASONRY_HEIGHTS[(i * 2) % MASONRY_HEIGHTS.length]
                          }
                        />
                      ))}
                  </View>
                  <View style={{ flex: 1, marginTop: 32 }}>
                    {displayItems
                      .filter((_, i) => i % 2 === 1)
                      .map((item, i) => (
                        <MasonryCard
                          key={item.id}
                          item={item}
                          height={
                            MASONRY_HEIGHTS[
                              (i * 2 + 1) % MASONRY_HEIGHTS.length
                            ]
                          }
                        />
                      ))}
                  </View>
                </View>
              )}
            </ScrollView>
          ) : (
            <FlatList
              key="grouped-view"
              data={groupableCategories}
              keyExtractor={(cat) => cat.id}
              renderItem={renderGroupedRow}
              contentContainerStyle={{ paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              ListHeaderComponent={listHeader}
              ListEmptyComponent={<EmptyState onAdd={handleAddClothes} />}
              removeClippedSubviews={true}
              maxToRenderPerBatch={4}
              windowSize={5}
              initialNumToRender={3}
            />
          )}
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
