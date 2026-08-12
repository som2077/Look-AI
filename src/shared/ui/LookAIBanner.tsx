import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

interface LookAIBannerProps {
  score?: number; // 0 to 10
}

export const LookAIBanner = React.memo(function LookAIBanner({
  score = 8,
}: LookAIBannerProps) {
  const clampedScore = Math.max(0, Math.min(10, score));
  const progressPercent = (clampedScore / 10) * 100;

  return (
    <View
      style={{
        marginTop: 5,
        backgroundColor: "#FFFFFF",
        borderColor: "#EDEDF2",
        borderWidth: 0.7,
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 25,
        shadowColor: "#00000040",
        shadowOpacity: 0.02,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
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
          {clampedScore}/10
        </Text>
      </View>

      {/* Row 2: Progress Bar */}
      <View
        style={{
          width: "100%",
          height: 10,
          backgroundColor: "#F4F5F9",
          borderRadius: 100,
          borderWidth: 1,
          borderColor: "#E5E7F0",
          marginBottom: 10,
          overflow: "hidden",
        }}
      >
        {/* Inner Fill */}
        <LinearGradient
          colors={["#00000070", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            borderRadius: 100,
          }}
        />
      </View>

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
    </View>
  );
});
