import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type SuggestedItem = {
  id: string;
  category?: string;
  primaryColor?: string;
  color?: string;
  imageUrl?: string;
  brand?: string;
};

interface PlannerOutfitCardProps {
  items: SuggestedItem[];
  reasoning: string;
  onSave: () => void;
  onRegenerate: () => void;
  saving?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  tops: "#4F46E5",
  shirts: "#7C3AED",
  tshirts: "#0D9488",
  pants: "#1E40AF",
  jeans: "#1D4ED8",
  shorts: "#0891B2",
  dresses: "#9D174D",
  skirts: "#BE185D",
  jackets: "#374151",
  coats: "#1F2937",
  shoes: "#92400E",
  accessories: "#B45309",
  default: "#374151",
};

function getColor(item: SuggestedItem) {
  const cat = (item.category ?? "").toLowerCase().replace(/\s+/g, "");
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.default;
}

function ItemThumbnail({ item }: { item: SuggestedItem }) {
  if (item.imageUrl) {
    return (
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.thumb}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.thumb, { backgroundColor: getColor(item) }]}>
      <Text style={styles.thumbLabel}>{(item.category ?? "?").slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

export default function PlannerOutfitCard({ items, reasoning, onSave, onRegenerate, saving }: PlannerOutfitCardProps) {
  const displayItems = items.slice(0, 4);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>✨ Outfit Suggestion</Text>
        <Pressable onPress={onRegenerate} hitSlop={8}>
          <Text style={styles.regenerateText}>Regenerate</Text>
        </Pressable>
      </View>

      {/* Item thumbnails */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
        {displayItems.length > 0 ? displayItems.map((item) => (
          <View key={item.id} style={styles.thumbWrap}>
            <ItemThumbnail item={item} />
            <Text style={styles.thumbCaption} numberOfLines={1}>
              {item.category ?? "Item"}
            </Text>
          </View>
        )) : (
          // Fallback placeholders
          [1, 2, 3].map((i) => (
            <View key={i} style={styles.thumbWrap}>
              <View style={[styles.thumb, { backgroundColor: "#2D2E38" }]}>
                <Text style={styles.thumbLabel}>👕</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* AI Reasoning */}
      <Text style={styles.reasoning}>{reasoning}</Text>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnLoading]}
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Plan 🗓️"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#17181C",
    borderRadius: 20,
    padding: 16,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  regenerateText: { color: "#0D9488", fontSize: 12, fontWeight: "600" },

  thumbRow: { flexDirection: "row", marginBottom: 14 },
  thumbWrap: { alignItems: "center", marginRight: 10 },
  thumb: {
    width: 70,
    height: 80,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbLabel: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  thumbCaption: { color: "#9CA3AF", fontSize: 10, marginTop: 4, maxWidth: 70 },

  reasoning: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },

  saveBtn: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnLoading: { backgroundColor: "#0F766E" },
  saveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
