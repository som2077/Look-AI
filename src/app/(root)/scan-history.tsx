import {
  ScanHistoryItem,
  ScanType,
  useScanHistoryStore,
} from "@/features/scanning/model/scan-history-store";
import { FlashList } from "@shopify/flash-list";
import {
  IconBarcode,
  IconHeart,
  IconHeartFilled,
  IconPhoto,
  IconRefresh,
  IconShirt,
  IconTag,
  IconTrash,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "all" | ScanType;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cloth", label: "Cloth" },
  { id: "barcode", label: "Barcode" },
  { id: "label", label: "Label" },
  { id: "fit-check", label: "Fit Check" },
];

const TYPE_META: Record<
  ScanType,
  { label: string; color: string; Icon: React.ComponentType<any> }
> = {
  cloth: { label: "Cloth Scan", color: "#7C6AFF", Icon: IconShirt },
  barcode: { label: "Barcode", color: "#FEC466", Icon: IconBarcode },
  label: { label: "Care Label", color: "#01B3F7", Icon: IconTag },
  "fit-check": { label: "Fit Check", color: "#AB86F1", Icon: IconPhoto },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getResultSummary(item: ScanHistoryItem): string {
  const r = item.result as Record<string, unknown>;
  switch (item.type) {
    case "cloth":
      return `${r.name ?? ""} • ${r.color ?? ""} ${r.material ?? ""}`.trim();
    case "barcode":
      return `${r.brand ?? "Unknown"} — ${r.itemName ?? "Clothing Item"}`;
    case "label":
      return `Wash: ${r.washTemp ?? "—"} • ${r.fabricComposition ?? "—"}`;
    case "fit-check":
      return `Score: ${r.fitScore ?? "—"}/100 • ${r.rating ?? "—"}`;
    default:
      return "No summary";
  }
}

// ─── History Card ─────────────────────────────────────────────────────────────

const HistoryCard = React.memo(function HistoryCard({
  item,
  onDelete,
  onToggleFavorite,
}: {
  item: ScanHistoryItem;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.Icon;

  return (
    <View
      style={{
        backgroundColor: "#161422",
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#2A2840",
      }}
    >
      {/* Thumbnail */}
      <View style={{ width: 90, height: 90, backgroundColor: "#0F0E15" }}>
        {item.thumbnail ? (
          <ExpoImage
            source={{ uri: item.thumbnail }}
            style={{ width: 90, height: 90 }}
            contentFit="cover"
            cachePolicy="memory"
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Icon size={28} color={meta.color} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, padding: 12 }}>
        {/* Type badge */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: meta.color + "22",
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginBottom: 6,
            borderWidth: 1,
            borderColor: meta.color + "66",
          }}
        >
          <Text style={{ color: meta.color, fontSize: 10, fontWeight: "700" }}>
            {meta.label.toUpperCase()}
          </Text>
        </View>

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: "600",
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {getResultSummary(item)}
        </Text>
        <Text style={{ color: "#555", fontSize: 11 }}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {/* Actions */}
      <View
        style={{
          paddingRight: 12,
          paddingTop: 12,
          gap: 8,
          alignItems: "center",
        }}
      >
        <Pressable onPress={() => onToggleFavorite(item.id)} hitSlop={8}>
          {item.isFavorite ? (
            <IconHeartFilled size={20} color="#FF6B6B" />
          ) : (
            <IconHeart size={20} color="#555" />
          )}
        </Pressable>
        <Pressable onPress={() => onDelete(item.id)} hitSlop={8}>
          <IconTrash size={18} color="#555" />
        </Pressable>
      </View>
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScanHistoryScreen() {
  const router = useRouter();
  const scans = useScanHistoryStore((state) => state.scans);
  const removeScan = useScanHistoryStore((state) => state.removeScan);
  const toggleFavorite = useScanHistoryStore((state) => state.toggleFavorite);
  const clearAll = useScanHistoryStore((state) => state.clearAll);

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    return activeFilter === "all"
      ? scans
      : scans.filter((s) => s.type === activeFilter);
  }, [scans, activeFilter]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete Scan", "Remove this scan from history?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeScan(id) },
      ]);
    },
    [removeScan],
  );

  const handleClearAll = useCallback(() => {
    Alert.alert("Clear All", "Remove all scan history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearAll },
    ]);
  }, [clearAll]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E15" }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#2A2840",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#2A2840",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconX size={18} color="#FFFFFF" />
          </Pressable>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 20,
              fontWeight: "800",
              flex: 1,
              marginLeft: 12,
            }}
          >
            Scan History
          </Text>
          {scans.length > 0 && (
            <Pressable onPress={handleClearAll} style={{ padding: 4 }}>
              <IconTrash size={18} color="#555" />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: active ? "#7C6AFF" : "#2A2840",
                }}
              >
                <Text
                  style={{
                    color: active ? "#FFFFFF" : "#888",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List */}
        {filtered.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: 80,
            }}
          >
            <IconRefresh size={48} color="#2A2840" />
            <Text
              style={{
                color: "#555",
                fontSize: 16,
                fontWeight: "600",
                marginTop: 16,
              }}
            >
              No scans yet
            </Text>
            <Text
              style={{
                color: "#444",
                fontSize: 13,
                marginTop: 6,
                textAlign: "center",
                paddingHorizontal: 40,
              }}
            >
              Use the camera to scan clothing items, barcodes, or labels
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlashList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <HistoryCard
                  item={item}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
