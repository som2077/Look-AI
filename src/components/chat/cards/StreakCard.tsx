// StreakCard — small, celebratory card for the show_streak tool.
//
// Data shape (the AI fills these in based on the 24h context):
//   {
//     current: number,    // current streak in days
//     longest: number,    // longest streak ever
//     this_week: number,  // active days in the current week
//     motivation?: string // one-line Hinglish nudge (optional)
//   }
//
// Design notes:
//   - A flame glyph + big number is the focal point — streaks are
//     emotional, not informational.
//   - "this week" row only shows when the number is interesting (>0).
//   - "longest" row only shows when longest > current (i.e. they broke it).

import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface StreakCardData {
  current: number;
  longest: number;
  this_week?: number;
  motivation?: string;
}

export function StreakCard({ data }: { data: StreakCardData }) {
  const current = Number(data.current ?? 0);
  const longest = Number(data.longest ?? 0);
  const week = Number(data.this_week ?? 0);
  const isRecord = current > 0 && current >= longest;
  const flame = current >= 7 ? "🔥" : current >= 1 ? "✨" : "💤";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.flame}>{flame}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {current} day{current === 1 ? "" : "s"} streak
          </Text>
          <Text style={styles.subtitle}>
            {isRecord
              ? "New personal best!"
              : current === 0
              ? "Start one today"
              : "Keep it going"}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{current}</Text>
          <Text style={styles.statLabel}>current</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{longest}</Text>
          <Text style={styles.statLabel}>longest</Text>
        </View>
        {week > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{week}</Text>
              <Text style={styles.statLabel}>this week</Text>
            </View>
          </>
        )}
      </View>

      {data.motivation && (
        <Text style={styles.motivation}>{data.motivation}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF7ED",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  flame: { fontSize: 36, marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700", color: "#7C2D12" },
  subtitle: { fontSize: 13, color: "#9A3412", marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  divider: { width: 1, backgroundColor: "#FED7AA", marginVertical: 4 },
  motivation: {
    fontSize: 13,
    color: "#7C2D12",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
});
