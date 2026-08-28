import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function AIBubble({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bubble: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    maxWidth: '85%',
  },
  text: {
    color: '#000',
    fontSize: 16,
  },
});
