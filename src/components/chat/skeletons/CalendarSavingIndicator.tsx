import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CalendarSavingIndicator() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Saving event to your calendar...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 12, paddingVertical: 12, backgroundColor: '#F2F2F7', borderRadius: 12, marginHorizontal: 16 },
  text: { fontSize: 14, color: '#555', textAlign: 'center' },
});
