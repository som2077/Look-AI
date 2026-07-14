import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Text, View } from "react-native";

export function AddClothesCTA() {
  return (
    <View className="mt-2 p-5 items-center  justify-center relative  mx-6 mb-8">
      <Text
        style={{
          fontSize: 17,
          fontFamily: "TikTokSans16pt-Bold",
          color: "#1D1A27",
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        Ready to style your wardrobe?
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#8E8D98",
          fontFamily: "TikTokSans16pt-Medium",
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        Upload your clothes and discover {"\n"} new outfit combinations.
      </Text>

      <ExpoImage
        source={require("@/assets/ScribbleArrow.svg")}
        style={{
          position: "absolute",
          bottom: -10,
          right: 30,
          width: 80,
          height: 40,
        }}
        contentFit="contain"
      />
    </View>
  );
}
