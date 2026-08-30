// RecentOutfitsCard — horizontal scroller of today's logged outfits.
//
// Data shape:
//   {
//     title?: string,
//     outfits: Array<{
//       id: string,
//       title?: string,
//       occasion?: string,
//       image_url?: string,
//       score?: number,
//       logged_at?: string,
//     }>,
//     note?: string,
//   }
//
// The card is meant to feel like a "lookbook" — the user can scroll through
// their last few looks, tap one to view it on the outfits tab (TODO: wire
// router push). For now, tap is a no-op with a soft feedback.

import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface RecentOutfitItem {
  id: string;
  title?: string;
  occasion?: string;
  image_url?: string;
  score?: number;
  logged_at?: string;
}

export interface RecentOutfitsCardData {
  title?: string;
  outfits: RecentOutfitItem[];
  note?: string;
}

export function RecentOutfitsCard({ data }: { data: RecentOutfitsCardData }) {
  const list = Array.isArray(data.outfits) ? data.outfits : [];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {data.title || "Your recent looks"}
        </Text>
        <Text style={styles.count}>
          {list.length} {list.length === 1 ? "outfit" : "outfits"}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {list.map((o) => (
          <TouchableOpacity key={o.id} style={styles.card} activeOpacity={0.8}>
            {o.image_url ? (
              <Image source={{ uri: o.image_url }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imageFallback]}>
                <Text style={styles.imageFallbackText}>👗</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text numberOfLines={1} style={styles.cardTitle}>
                {o.title || "Untitled"}
              </Text>
              <Text numberOfLines={1} style={styles.cardMeta}>
                {o.occasion || "casual"}
                {o.score != null ? `  •  ${o.score}/10` : ""}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {data.note && <Text style={styles.note}>{data.note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  count: { fontSize: 12, color: "#6B7280" },
  scroll: { paddingHorizontal: 16, gap: 10 },
  card: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  image: { width: "100%", height: 160, backgroundColor: "#F3F4F6" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  imageFallbackText: { fontSize: 40 },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#111827" },
  cardMeta: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  note: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    paddingHorizontal: 16,
    marginTop: 6,
  },
});
