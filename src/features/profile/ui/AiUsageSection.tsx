/**
 * AiUsageSection — renders the "AI Usage" block on the Profile screen.
 *
 * Visual layout: a single CardContainer with one ListItem per AI feature
 * the user has invoked. Each row shows the feature icon, label, total
 * count, "last used" relative time, and a month-over-month trend chip.
 *
 * Data source: useAiUsage() → get_ai_usage_summary() RPC.
 *
 * Empty state: a single "No AI features used yet" row with a CTA that
 * routes the user to the Style Chat screen so they can try the most
 * accessible AI feature.
 */
import { useAiUsage, type AiUsageSummary } from "@/features/profile/api/useAiUsage";
import { CardContainer, ListItem, Text } from "@/features/profile/ui/SectionPrimitives";
import {
  AI_FEATURE_LABELS,
  type AiFeatureKey,
} from "@/shared/telemetry/ai-usage";
import { posthogAnalytics } from "@/shared/telemetry/posthog";
import {
  IconArrowUp,
  IconArrowsHorizontal,
  IconCalendarEvent,
  IconCamera,
  IconHanger,
  IconLayersIntersect,
  IconMessage,
  IconScan,
  IconSparkles,
  IconTruckLoading,
  type Icon,
} from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

// ─── Per-feature icon map (Tabler icons already a dep) ──────────────────────
const FEATURE_ICONS: Record<AiFeatureKey, Icon> = {
  style_chat: IconMessage,
  cloth_scan: IconCamera,
  cloth_label: IconScan,
  fit_check: IconHanger,
  multi_item_recommendation: IconLayersIntersect,
  virtual_try_on: IconTruckLoading,
  planner_chat: IconCalendarEvent,
};

// Canonical display order (the most-used surfaces first). Rows not in
// this list are appended at the end in their RPC-returned order.
const FEATURE_ORDER: AiFeatureKey[] = [
  "style_chat",
  "cloth_scan",
  "virtual_try_on",
  "fit_check",
  "cloth_label",
  "multi_item_recommendation",
  "planner_chat",
];

// ─── Relative-time helpers (no Intl.RelativeTimeFormat dependency) ──────────
function formatLastUsed(iso: string | null): string {
  if (!iso) return "Not used yet";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) {
    const d = Math.floor(diffMs / day);
    return `${d} days ago`;
  }
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ─── Trend chip (this month vs last month) ──────────────────────────────────
type Trend = "up" | "down" | "flat";

function computeTrend(thisMonth: number, lastMonth: number): Trend {
  if (thisMonth > lastMonth) return "up";
  if (thisMonth < lastMonth) return "down";
  return "flat";
}

function TrendChip({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  const trend = computeTrend(thisMonth, lastMonth);
  const colorMap: Record<Trend, { bg: string; fg: string; icon: any; text: string }> = {
    up: { bg: "#DCFCE7", fg: "#15803D", icon: IconArrowUp, text: `${thisMonth} this mo` },
    down: { bg: "#FEE2E2", fg: "#B91C1C", icon: IconArrowUp, text: `${thisMonth} this mo` },
    flat: { bg: "#F3F4F6", fg: "#6B7280", icon: IconArrowsHorizontal, text: `${thisMonth} this mo` },
  };
  const { bg, fg, icon: IconCmp, text } = colorMap[trend];
  const rotated = trend === "down" ? { transform: [{ rotate: "180deg" as const }] } : undefined;
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        marginRight: 4,
      }}
    >
      <IconCmp size={10} color={fg} style={rotated} />
      <Text
        style={{
          color: fg,
          fontSize: 10,
          fontWeight: "700",
          marginLeft: 2,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────
function UsageRow({
  summary,
  onPress,
  isLast,
}: {
  summary: AiUsageSummary;
  onPress: () => void;
  isLast: boolean;
}) {
  const IconCmp = FEATURE_ICONS[summary.feature_key] ?? IconSparkles;
  return (
    <ListItem
      icon={<IconCmp size={18} color="#00000090" />}
      title={summary.feature_label}
      subtitle={
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#6B7280",
              fontWeight: "600",
            }}
          >
            {summary.total_count} {summary.total_count === 1 ? "time" : "times"}
            {"  •  "}
            {formatLastUsed(summary.last_used_at)}
          </Text>
        </View>
      }
      rightElement={
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TrendChip
            thisMonth={summary.this_month_count}
            lastMonth={summary.last_month_count}
          />
        </View>
      }
      onPress={onPress}
      hasBorder={!isLast}
    />
  );
}

// ─── Skeleton row ───────────────────────────────────────────────────────────
function SkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        opacity: 0.5,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          backgroundColor: "#E5E7EB",
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <View
          style={{
            width: 120,
            height: 12,
            borderRadius: 4,
            backgroundColor: "#E5E7EB",
            marginBottom: 6,
          }}
        />
        <View
          style={{
            width: 80,
            height: 10,
            borderRadius: 4,
            backgroundColor: "#E5E7EB",
          }}
        />
      </View>
      {!isLast && (
        <View
          style={{
            height: 1,
            backgroundColor: "#E5E7EB60",
            position: "absolute",
            bottom: 0,
            left: 16,
            right: 16,
          }}
        />
      )}
    </View>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────
export function AiUsageSection() {
  const router = useRouter();
  const { data, loading, error } = useAiUsage();

  // Order: by canonical display order, then any custom keys from the DB.
  const ordered = useMemo(() => {
    if (!data || data.length === 0) return [] as AiUsageSummary[];
    const byKey = new Map(data.map((d) => [d.feature_key, d]));
    const seen = new Set<AiFeatureKey>();
    const out: AiUsageSummary[] = [];
    for (const key of FEATURE_ORDER) {
      const row = byKey.get(key);
      if (row) {
        out.push(row);
        seen.add(key);
      }
    }
    // Append any unknown features at the end.
    for (const row of data) {
      if (!seen.has(row.feature_key)) out.push(row);
    }
    return out;
  }, [data]);

  const handleRowPress = (featureKey: AiFeatureKey) => {
    posthogAnalytics.captureEvent("ai_usage_section_viewed");
    router.push(`/(root)/ai-usage/${featureKey}` as never);
  };

  // ── Loading state
  if (loading && (!data || data.length === 0)) {
    return (
      <CardContainer>
        <SkeletonRow isLast={false} />
        <SkeletonRow isLast={false} />
        <SkeletonRow isLast />
      </CardContainer>
    );
  }

  // ── Error state
  if (error) {
    return (
      <CardContainer>
        <View
          style={{
            paddingVertical: 18,
            paddingHorizontal: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: "#B91C1C", fontSize: 13, fontWeight: "600" }}
          >
            Couldn't load AI usage
          </Text>
          <Text
            style={{
              color: "#6B7280",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Pull to refresh on the profile screen to retry.
          </Text>
        </View>
      </CardContainer>
    );
  }

  // ── Empty state
  if (!data || data.length === 0) {
    return (
      <CardContainer>
        <Pressable
          onPress={() => router.push("/(ai-features)/style-chat" as never)}
          style={{
            paddingVertical: 18,
            paddingHorizontal: 16,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <IconSparkles size={20} color="#1D1A27" />
          </View>
          <Text
            style={{
              fontSize: 14,
              color: "#1D1D1D",
              fontWeight: "700",
            }}
          >
            No AI features used yet
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#6B7280",
              marginTop: 4,
              textAlign: "center",
            }}
          >
            Try Style Chat to get started.
          </Text>
        </Pressable>
      </CardContainer>
    );
  }

  // ── Data state
  return (
    <CardContainer>
      {ordered.map((row, idx) => (
        <UsageRow
          key={row.feature_key}
          summary={row}
          onPress={() => handleRowPress(row.feature_key)}
          isLast={idx === ordered.length - 1}
        />
      ))}
    </CardContainer>
  );
}

// Re-export the feature key list so the detail screen can map keys to
// human labels without depending on @/shared/telemetry/ai-usage directly.
export { AI_FEATURE_LABELS };
export type { AiFeatureKey };
