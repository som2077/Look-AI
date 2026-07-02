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
    // backgroundColor: "#FFFFFF", // Soft light grey/blue
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginTop: 6,

  },
  text: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#1C1C1E",
    lineHeight: 20,
  },
});
