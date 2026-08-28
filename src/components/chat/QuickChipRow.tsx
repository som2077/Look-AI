import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const QUICK_CHIPS = [
  { label: '🌤 Aaj ka weather', message: 'Aaj ka weather dikhao aur outfit suggest karo' },
  { label: '👗 Outfit do',       message: 'Mujhe aaj ke liye outfit suggest karo' },
  { label: '📅 Event plan karo', message: 'Ek event plan karna hai' },
  { label: '👔 Kal ke liye',     message: 'Kal ke liye best outfit kaunsa hoga' },
];

export function QuickChipRow({ onSelect }: { onSelect: (message: string) => void }) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {QUICK_CHIPS.map((chip, index) => (
          <TouchableOpacity key={index} style={styles.chip} onPress={() => onSelect(chip.message)}>
            <Text style={styles.chipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});
