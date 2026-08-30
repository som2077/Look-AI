/**
 * AiUsageDetailScreen — full history of one AI feature for the signed-in
 * user. Reached by tapping a row in the "AI Usage" section on the
 * Profile screen.
 *
 * Reads the `feature` param (a feature key from AI_FEATURE_KEYS) and
 * paginates via get_ai_usage_history().
 */
import { useAiUsageHistory } from "@/features/profile/api/useAiUsageHistory";
import { Text } from "@/features/profile/ui/SectionPrimitives";
import { AI_FEATURE_LABELS, type AiFeatureKey } from "@/shared/telemetry/ai-usage";
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Relative timestamp formatter ───────────────────────────────────────────
function formatTimestamp(iso: string): string {
  const then = new Date(iso);
  const now = Date.now();
  const diff = now - then.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) {
    const d = Math.floor(diff / day);
    return `${d} days ago`;
  }
  return then.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: then.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isValidFeatureKey(value: unknown): value is AiFeatureKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(AI_FEATURE_LABELS, value)
  );
}

// ─── Header ────────────────────────────────────────────────────────────────
function Header({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
        <IconArrowLeft size={22} color="#1D1A27" />
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{label}</Text>
        <Text style={styles.headerSubtitle}>Usage history</Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  );
}

// ─── History row ───────────────────────────────────────────────────────────
function HistoryRow({ item }: { item: any }) {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const metaKeys = Object.keys(meta).filter((k) => meta[k] !== null && meta[k] !== undefined);
  return (
    <View
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomColor: "#E5E7EB60",
        borderBottomWidth: 1,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          color: "#1D1D1D",
          fontWeight: "600",
        }}
      >
        {formatTimestamp(item.created_at)}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: "#6B7280",
          marginTop: 2,
        }}
      >
        {new Date(item.created_at).toLocaleString()}
      </Text>
      {metaKeys.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {metaKeys.slice(0, 3).map((key) => (
            <View
              key={key}
              style={{
                backgroundColor: "#F3F4F6",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
                marginRight: 6,
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 10, color: "#4B5563", fontWeight: "600" }}>
                {key}: {String(meta[key])}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingTop: 80,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <IconSparkles size={24} color="#1D1A27" />
      </View>
      <Text style={{ fontSize: 15, color: "#1D1D1D", fontWeight: "700" }}>
        No history yet
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#6B7280",
          marginTop: 6,
          textAlign: "center",
        }}
      >
        Use this AI feature from inside the app to see it show up here.
      </Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────
export default function AiUsageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ feature?: string }>();
  const featureKey = isValidFeatureKey(params.feature) ? params.feature : null;
  const label = featureKey
    ? AI_FEATURE_LABELS[featureKey]
    : "AI Usage";

  const { data, loading, error, hasMore, loadMore, refetch } =
    useAiUsageHistory(featureKey);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureKey]);

  if (!featureKey) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Header label="AI Usage" onBack={() => router.back()} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#B91C1C",
              textAlign: "center",
            }}
          >
            Unknown AI feature.{"\n"}Please go back and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <Header label={label} onBack={() => router.back()} />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryRow item={item} />}
        ListEmptyComponent={loading ? null : <EmptyState />}
        contentContainerStyle={
          data.length === 0 ? { flexGrow: 1 } : { paddingBottom: 24 }
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore && !loading) void loadMore();
        }}
        refreshing={loading && data.length === 0}
        onRefresh={() => void refetch()}
        ListFooterComponent={
          loading && data.length > 0 ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#1D1A27" />
            </View>
          ) : null
        }
      />
      {error ? (
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            right: 24,
            padding: 12,
            backgroundColor: "#FEE2E2",
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#B91C1C", fontSize: 12, fontWeight: "600" }}>
            Failed to load history. Pull down to refresh.
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D1A27",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
});
