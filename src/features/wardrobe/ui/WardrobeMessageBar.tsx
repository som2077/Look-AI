import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function WardrobeMessageBar() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Track your wardrobe, rediscover unworn pieces, and make every outfit
        count.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 1.5,
    paddingHorizontal: 12,
    marginTop: 2,
    shadowColor: "#00000040",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  text: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#1C1C1E",
    lineHeight: 20,
  },
});
