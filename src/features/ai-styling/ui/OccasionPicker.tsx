import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const OCCASIONS = [
  { label: "👔 Work", value: "Work" },
  { label: "👗 Formal", value: "Formal" },
  { label: "😎 Casual", value: "Casual" },
  { label: "🎉 Party", value: "Party" },
  { label: "💑 Date", value: "Date" },
  { label: "🏋️ Workout", value: "Workout" },
  { label: "✈️ Travel", value: "Travel" },
  { label: "🏖️ Beach", value: "Beach" },
];

interface OccasionPickerProps {
  onSelect: (occasion: string) => void;
  disabled?: boolean;
}

export default function OccasionPicker({
  onSelect,
  disabled,
}: OccasionPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>What&apos;s the occasion?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
      >
        {OCCASIONS.map((o) => (
          <Pressable
            key={o.value}
            style={({ pressed }) => [
              styles.chip,
              pressed && !disabled && styles.chipPressed,
              disabled && styles.chipDisabled,
            ]}
            onPress={() => !disabled && onSelect(o.value)}
          >
            <Text
              style={[styles.chipText, disabled && styles.chipTextDisabled]}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1A27",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
  },
  chip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
  },
  chipPressed: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  chipDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  chipTextDisabled: {
    color: "#9CA3AF",
  },
});
