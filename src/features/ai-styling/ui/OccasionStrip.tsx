import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export const OCCASIONS = [
  { label: "🎂 Birthday", value: "Birthday" },
  { label: "👔 Work",     value: "Work" },
  { label: "💒 Wedding",  value: "Wedding" },
  { label: "😎 Casual",   value: "Casual" },
  { label: "💑 Date",     value: "Date" },
  { label: "🎉 Party",    value: "Party" },
  { label: "🏋️ Workout", value: "Workout" },
  { label: "✈️ Travel",  value: "Travel" },
];

interface OccasionStripProps {
  onSelect: (occasion: string) => void;
  visible: boolean;
}

export default function OccasionStrip({ onSelect, visible }: OccasionStripProps) {
  if (!visible) return null;
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {OCCASIONS.map((o) => (
          <Pressable
            key={o.value}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => onSelect(o.value)}
          >
            <Text style={styles.chipText}>{o.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FAFAFC",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  row: { paddingHorizontal: 12, gap: 8 },
  chip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
  },
  chipPressed: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#4F46E5" },
});
