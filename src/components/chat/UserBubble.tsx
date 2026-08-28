import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function UserBubble({ text }: { text: string }) {
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
    justifyContent: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bubble: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
