import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  IconArrowLeft,
  IconMapPin,
  IconStar,
  IconFlame,
  IconCrown,
  IconSearch,
  IconTrendingUp,
} from "@tabler/icons-react-native";
import {
  TrendCard,
  LOCAL_TRENDS,
  CELEBRITY_TRENDS,
  GLOBAL_TRENDS,
  type TrendItem,
} from "../../../components/ui/TrendFeed";

// ─── Trend Row Item (vertical list card) ─────────────────────────────────────

const TrendRowItem = React.memo(function TrendRowItem({
  trend,
  accentColor,
  index,
}: {
  trend: TrendItem;
  accentColor: string;
  index: number;
}) {
  const rankBg =
    index === 0 ? "#FFF8E7" : index === 1 ? "#F5F5F5" : index === 2 ? "#FFF4F0" : "#F9F9FB";

  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#F0EEF8",
        padding: 12,
        gap: 12,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {/* Rank circle */}
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: rankBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#1D1A27" }}>
          #{trend.rank}
        </Text>
      </View>

      {/* Gradient emoji block */}
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          backgroundColor: trend.colorTop,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 24,
            backgroundColor: trend.colorBottom,
            opacity: 0.5,
          }}
        />
        <Text style={{ fontSize: 22 }}>{trend.emoji}</Text>
      </View>

      {/* Text block */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
          <Text
            style={{ fontSize: 13, fontWeight: "700", color: "#1D1A27" }}
            numberOfLines={1}
          >
            {trend.title}
          </Text>
          {trend.isPremium && <IconCrown size={11} color="#F59E0B" />}
        </View>
        <Text style={{ fontSize: 10, color: "#9B9BAF", fontWeight: "500", marginBottom: 5 }}>
          {trend.subtitle}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              backgroundColor: trend.tagBg,
              borderRadius: 7,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 8, fontWeight: "700", color: trend.tagColor }}>
              {trend.tag.toUpperCase()}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <IconMapPin size={9} color="#C5C5D0" />
            <Text style={{ fontSize: 9, color: "#C5C5D0", fontWeight: "500" }}>
              {trend.location}
            </Text>
          </View>
        </View>
      </View>

      {/* Trending % */}
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: `${accentColor}15`,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <IconTrendingUp size={10} color={accentColor} />
          <Text style={{ fontSize: 12, fontWeight: "800", color: accentColor }}>
            {trend.trendPercent}%
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: "#C5C5D0", fontWeight: "500", marginTop: 3 }}>
          trending
        </Text>
      </View>
    </Pressable>
  );
});

// ─── Section Block ────────────────────────────────────────────────────────────

const SectionBlock = React.memo(function SectionBlock({
  icon,
  label,
  subtitle,
  accentColor,
  iconBg,
  badge,
  trends,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  accentColor: string;
  iconBg: string;
  badge?: string;
  trends: TrendItem[];
}) {
  return (
    <View style={{ marginBottom: 32 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: iconBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1D1A27" }}>
              {label}
            </Text>
            <Text style={{ fontSize: 11, color: "#9B9BAF", fontWeight: "500", marginTop: 1 }}>
              {subtitle}
            </Text>
          </View>
        </View>

        {badge && (
          <View
            style={{
              backgroundColor: iconBg,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: accentColor }}>
              {badge}
            </Text>
          </View>
        )}
      </View>

      {/* Horizontal cards scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        style={{ marginBottom: 16 }}
      >
        {trends.slice(0, 3).map((trend) => (
          <TrendCard key={trend.id} trend={trend} />
        ))}
      </ScrollView>

      {/* Vertical list of all items */}
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {trends.map((trend, index) => (
          <TrendRowItem
            key={trend.id}
            trend={trend}
            accentColor={accentColor}
            index={index}
          />
        ))}
      </View>
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrendFeedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#F4F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconArrowLeft size={20} color="#1D1A27" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#1D1A27" }}>
            Trend Feed
          </Text>
          <Text style={{ fontSize: 11, color: "#9B9BAF", fontWeight: "500", marginTop: 1 }}>
            Indore · Updated today
          </Text>
        </View>

        <Pressable
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#F4F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSearch size={18} color="#1D1A27" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* ── All 3 sections scrollable ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 120 }}
      >

        {/* 📍 Near You / Local */}
        <SectionBlock
          icon={<IconMapPin size={18} color="#6366F1" />}
          label="Near You · Indore"
          subtitle="Trending in your city"
          accentColor="#6366F1"
          iconBg="#EEF2FF"
          badge="📍 Local"
          trends={LOCAL_TRENDS}
        />

        {/* Divider */}
        <View
          style={{
            marginHorizontal: 20,
            height: 1,
            backgroundColor: "#F0EEF8",
            marginBottom: 32,
          }}
        />

        {/* ⭐ Celebrity */}
        <SectionBlock
          icon={<IconStar size={18} color="#EC4899" />}
          label="Celebrity Looks"
          subtitle="Bollywood & beyond"
          accentColor="#EC4899"
          iconBg="#FDF2F8"
          badge="⭐ Celeb"
          trends={CELEBRITY_TRENDS}
        />

        {/* Divider */}
        <View
          style={{
            marginHorizontal: 20,
            height: 1,
            backgroundColor: "#F0EEF8",
            marginBottom: 32,
          }}
        />

        {/* 🌍 Global */}
        <SectionBlock
          icon={<IconFlame size={18} color="#EF4444" />}
          label="Global Trends"
          subtitle="Worldwide fashion pulse"
          accentColor="#EF4444"
          iconBg="#FEF2F2"
          badge="🌍 Global"
          trends={GLOBAL_TRENDS}
        />

        {/* ── Premium CTA ── */}
        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginHorizontal: 20,
            marginTop: 4,
            backgroundColor: "#1D1A27",
            borderRadius: 24,
            paddingHorizontal: 18,
            paddingVertical: 18,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "rgba(245,158,11,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCrown size={22} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
              Unlock All Premium Trends
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                marginTop: 3,
                lineHeight: 16,
              }}
            >
              AI style picks, hyperlocal trends &amp; celebrity drops
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#F59E0B",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
              Upgrade
            </Text>
          </View>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}
