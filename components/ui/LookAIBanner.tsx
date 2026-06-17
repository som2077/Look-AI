import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

export const LookAIBanner = React.memo(function LookAIBanner() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/(root)/look-ai" as never)}
      style={{
        marginTop: 7,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7F0",
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
      }}
    >
      {/* Row 1: Outfit Score */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            color: "#1A1A1A",
            fontFamily: "TikTokSans16pt-Bold",
          }}
        >
          Outfit Score
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#1A1A1A",
            fontFamily: "TikTokSans16pt-Bold",
          }}
        >
          0/10
        </Text>
      </View>

      {/* Row 2: Progress Bar — solid gray pill (score 0/10 = empty track) */}
      <View
        style={{
          width: "100%",
          height: 10,
          // backgroundColor: "#E2E2E2",
          borderRadius: 100,
          borderWidth: 1,
          borderColor: "#E5E7F0",
          marginBottom: 10,
        }}
      />

      {/* Row 3: Helper Text */}
      <Text
        style={{
          fontSize: 13,
          color: "#1A1A1A",
          fontFamily: "TikTokSans16pt-Regular",
          // textAlign: "center",
        }}
      >
        Weather-friendly style starts here. Find outfits curated for
        today&apos;s forecast. Tap to see outfit suggestions.
      </Text>
    </Pressable>
  );
});
