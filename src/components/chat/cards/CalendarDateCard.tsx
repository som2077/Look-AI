import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CalendarDateCard({ data }: { data: any }) {
  const { title, date, time, day_label, month_label, day_number } = data;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.dateBox}>
          <Text style={styles.monthLabel}>{month_label}</Text>
          <Text style={styles.dayNumber}>{day_number}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.time}>{day_label}, {time || date}</Text>
          <Text style={styles.savedBadge}>✓ Saved to calendar</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 12 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  monthLabel: { fontSize: 12, color: '#FF3B30', fontWeight: 'bold', textTransform: 'uppercase' },
  dayNumber: { fontSize: 24, color: '#000', fontWeight: 'bold' },
  infoBox: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  time: { fontSize: 14, color: '#666', marginBottom: 8 },
  savedBadge: { fontSize: 12, color: '#34C759', fontWeight: '600' },
});
