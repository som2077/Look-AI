import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function WeatherCard({ data }: { data: any }) {
  // data matches the z.object from the tool
  const { city, temperature, condition, ai_tip } = data;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.cityText}>{city}</Text>
            <Text style={styles.regionText}>Current Location</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.dateText}>Today</Text>
          </View>
        </View>

        <View style={styles.centerRow}>
          <Text style={styles.tempText}>{temperature}°c</Text>
          {/* Simple emoji placeholder for weather icon */}
          <Text style={styles.iconText}>
            {condition === 'sunny' ? '☀️' : condition === 'rainy' ? '🌧️' : '☁️'}
          </Text>
        </View>

        <Text style={styles.conditionText}>{condition}</Text>
        <Text style={styles.aiTipText}>💡 {ai_tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: '#1E6ADD', // Blue from widget
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cityText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  regionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  dateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  centerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tempText: {
    color: '#FFF',
    fontSize: 64,
    fontWeight: '300',
  },
  iconText: {
    fontSize: 48,
  },
  conditionText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 12,
  },
  aiTipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
});
