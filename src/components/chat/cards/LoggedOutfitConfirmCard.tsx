// LoggedOutfitConfirmCard — confirmation card for the quick_log_outfit tool.
//
// Data shape:
//   {
//     id?: string,            // returned from the insert
//     title: string,
//     occasion?: string,
//     items?: Array<{ name, category, image_url? }>,
//     note?: string,
//     saved_at?: string,      // ISO date
//   }
//
// The card shows the AI's response on top, then a small "What we saved"
// recap. If `saved_at` is in the future (the AI hallucinates) we hide it
// rather than show nonsense.

import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export interface LoggedOutfitItem {
  name: string;
  category?: string;
  image_url?: string;
}

export interface LoggedOutfitConfirmData {
  id?: string;
  title: string;
  occasion?: string;
  items?: LoggedOutfitItem[];
  note?: string;
  saved_at?: string;
}

function isPlausibleDate(iso: string): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  // Reject dates wildly in the future (more than 1 day ahead).
  return t < Date.now() + 24 * 60 * 60 * 1000;
}

export function LoggedOutfitConfirmCard({
  data,
}: {
  data: LoggedOutfitConfirmData;
}) {
  const items = Array.isArray(data.items) ? data.items : [];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>✅</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>{data.title}</Text>
          {data.occasion && (
            <Text style={styles.occasion}>{data.occasion}</Text>
          )}
        </View>
      </View>

      {items.length > 0 && (
        <View style={styles.itemsBlock}>
          <Text style={styles.itemsLabel}>Saved with</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemsScroll}
          >
            {items.map((it, i) => (
              <View key={i} style={styles.itemChip}>
                {it.image_url ? (
                  <Image source={{ uri: it.image_url }} style={styles.itemImg} />
                ) : (
                  <View style={[styles.itemImg, styles.itemImgFallback]}>
                    <Text style={styles.itemImgText}>👕</Text>
                  </View>
                )}
                <Text numberOfLines={1} style={styles.itemName}>
                  {it.name}
                </Text>
                {it.category && (
                  <Text numberOfLines={1} style={styles.itemCat}>
                    {it.category}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.footer}>
        {data.note && <Text style={styles.note}>{data.note}</Text>}
        {data.saved_at && isPlausibleDate(data.saved_at) && (
          <Text style={styles.savedAt}>
            Logged {new Date(data.saved_at).toLocaleString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  header: { flexDirection: "row", alignItems: "center" },
  icon: { fontSize: 24, marginRight: 10 },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#064E3B" },
  occasion: { fontSize: 12, color: "#047857", marginTop: 2 },
  itemsBlock: { marginTop: 10 },
  itemsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  itemsScroll: { gap: 8 },
  itemChip: {
    width: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
  },
  itemImg: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  itemImgFallback: { alignItems: "center", justifyContent: "center" },
  itemImgText: { fontSize: 22 },
  itemName: { fontSize: 11, color: "#111827", marginTop: 4 },
  itemCat: { fontSize: 9, color: "#6B7280" },
  footer: { marginTop: 8 },
  note: { fontSize: 12, color: "#065F46", fontStyle: "italic" },
  savedAt: { fontSize: 10, color: "#047857", marginTop: 4 },
});
