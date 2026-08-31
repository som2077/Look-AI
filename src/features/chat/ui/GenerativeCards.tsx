import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export const OutfitCard = ({ items }: { items: any[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>Your Wardrobe Match</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemScroll}>
        {items.map((item: any, idx: number) => (
          <View key={idx} style={styles.itemBox}>
            {(item.imageUrl || item.originalImageUrl) ? (
              <Image source={{ uri: item.imageUrl || item.originalImageUrl }} style={styles.itemImg} cachePolicy="memory-disk" contentFit="cover" />
            ) : (
              <View style={[styles.itemImg, { backgroundColor: item.primaryColor || item.colorHex || '#E5E7EB' }]} />
            )}
            <Text style={styles.itemText} numberOfLines={1}>{item.category}</Text>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>Save Outfit</Text>
      </TouchableOpacity>
    </View>
  );
};

export const CalendarCard = ({ data }: { data: any }) => {
  if (!data) return null;
  const router = require("expo-router").useRouter();
  
  return (
    <View style={[styles.cardContainer, { padding: 16, backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#065F46', marginBottom: 4 }}>✅ Added to Calendar</Text>
      <Text style={{ fontSize: 14, color: '#047857' }}>{data.occasion} • {data.date} at {data.time}</Text>
      <TouchableOpacity 
        style={[styles.saveBtn, { backgroundColor: '#10B981', marginTop: 12 }]}
        onPress={() => router.push("/(root)/(tabs)/" as any)}
      >
        <Text style={styles.saveBtnText}>View Calendar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 280,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#111827' },
  itemScroll: { flexDirection: 'row' },
  itemBox: { marginRight: 12, alignItems: 'center', width: 64 },
  itemImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 6 },
  itemText: { fontSize: 11, color: '#4B5563', fontWeight: '500' },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center'
  },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 }
});
