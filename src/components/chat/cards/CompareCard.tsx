// CompareCard — side-by-side outfit comparison for the compare_outfits tool.
//
// Data shape:
//   {
//     left: { title, occasion?, image_url?, score?, why? },
//     right: { title, occasion?, image_url?, score?, why? },
//     verdict?: string  // AI's one-line pick + reasoning
//   }
//
// The card splits the screen in half and shows the AI's reasoning
// underneath. The verdict is the headline — "right wins because X".

import { cloudinaryUrl } from "@/shared/cloudinary/transform";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface CompareSide {
  title: string;
  occasion?: string;
  image_url?: string;
  score?: number;
  why?: string;
}

export interface CompareCardData {
  left: CompareSide;
  right: CompareSide;
  verdict?: string;
  winner?: "left" | "right";
}

function Side({ data, side, highlight }: { data: CompareSide; side: "left" | "right"; highlight: boolean }) {
  return (
    <View style={[styles.side, highlight ? styles.sideHighlight : null]}>
      {data.image_url ? (
        <Image
          source={{ uri: cloudinaryUrl(data.image_url, "card") }}
          style={styles.image}
          cachePolicy="memory-disk"
          recyclingKey={`compare-${side}`}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.imageFallbackText}>👗</Text>
        </View>
      )}
      <Text numberOfLines={2} style={styles.title}>
        {data.title || `Option ${side === "left" ? "A" : "B"}`}
      </Text>
      {data.occasion && (
        <Text style={styles.occasion}>{data.occasion}</Text>
      )}
      {data.score != null && (
        <Text style={styles.score}>Score {data.score}/10</Text>
      )}
      {data.why && <Text style={styles.why}>{data.why}</Text>}
    </View>
  );
}

export function CompareCard({ data }: { data: CompareCardData }) {
  const winner = data.winner;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Side data={data.left} side="left" highlight={winner === "left"} />
        <View style={styles.vs}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <Side data={data.right} side="right" highlight={winner === "right"} />
      </View>
      {data.verdict && (
        <View style={styles.verdictBox}>
          <Text style={styles.verdictLabel}>Verdict</Text>
          <Text style={styles.verdictText}>{data.verdict}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "stretch" },
  side: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sideHighlight: {
    borderColor: "#1D1A27",
    backgroundColor: "#FAFAFB",
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  imageFallbackText: { fontSize: 32 },
  title: { fontSize: 13, fontWeight: "700", color: "#111827" },
  occasion: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  score: { fontSize: 11, color: "#1D1A27", marginTop: 4, fontWeight: "600" },
  why: { fontSize: 11, color: "#374151", marginTop: 6, lineHeight: 15 },
  vs: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  verdictBox: {
    marginTop: 10,
    backgroundColor: "#1D1A27",
    borderRadius: 12,
    padding: 12,
  },
  verdictLabel: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  verdictText: { color: "#FFFFFF", fontSize: 13, lineHeight: 18 },
});
