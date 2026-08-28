import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

export function OutfitSuggestionCard({ data }: { data: any }) {
  const { occasion, outfits } = data;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Here's what you can wear for {occasion}:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {outfits.map((outfit: any, i: number) => (
          <View key={i} style={styles.card}>
            <Text style={styles.label}>{outfit.label}</Text>
            <View style={styles.imagesGrid}>
              {outfit.items.map((item: any, j: number) => (
                <View key={j} style={styles.itemContainer}>
                  <Image source={{ uri: item.image_url }} style={styles.image} />
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.note}>{outfit.style_note}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingLeft: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '500', marginBottom: 12, color: '#333' },
  scroll: { gap: 12, paddingRight: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  itemContainer: { width: '48%', position: 'relative' },
  image: { width: '100%', height: 100, borderRadius: 8, backgroundColor: '#F0F0F0' },
  categoryBadge: {
    position: 'absolute',
    bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFF',
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  note: { fontSize: 14, color: '#555', fontStyle: 'italic' },
});
