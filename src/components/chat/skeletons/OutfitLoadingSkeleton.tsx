import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function OutfitLoadingSkeleton() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scanning wardrobe and putting together the best outfits...</Text>
      <View style={styles.card}>
        <View style={styles.skeletonBlock} />
        <View style={styles.skeletonBlock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 12 },
  text: { fontSize: 14, color: '#888', marginBottom: 8, fontStyle: 'italic' },
  card: { backgroundColor: '#F2F2F7', borderRadius: 16, padding: 16, height: 160, opacity: 0.7 },
  skeletonBlock: { backgroundColor: '#E5E5EA', borderRadius: 8, height: 50, marginBottom: 8 }
});
