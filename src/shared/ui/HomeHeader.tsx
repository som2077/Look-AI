import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export const HomeHeader = React.memo(function HomeHeader() {
  const router = useRouter();
  const currentStreak = useStreakStore((state) => state.currentStreak);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <ExpoImage
        source={require("@/assets/images/getStartedLogo.png")}
        style={{ height: 56, width: 180, marginLeft: -32 }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {/* Streak pill */}
        <TouchableOpacity
          onPress={() => router.push("/(root)/streak" as never)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 40,
            borderRadius: 100,
            borderWidth: 1,
            borderColor: "#E2E2EA",
            backgroundColor: "#F8F7FC",
            paddingHorizontal: 12,
            gap: 5,
          }}
        >
          <LottieView
            source={{
              uri: "https://lottie.host/90aa36ae-cfef-49e5-bd8e-8c4c54fc2004/df47Z2J4nI.json",
            }}
            autoPlay
            loop
            style={{ width: 20, height: 20 }}
          />
          <Text
            style={{
              color: "#1D1A27",
              fontWeight: "700",
              fontSize: 14,
              letterSpacing: -0.2,
            }}
          >
            {currentStreak}
          </Text>
        </TouchableOpacity>

        {/* Calendar icon */}
        <TouchableOpacity
          onPress={() => router.push("/(root)/calendar" as never)}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 100,
            borderWidth: 1,
            borderColor: "#E2E2EA",
            backgroundColor: "#F8F7FC",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ExpoImage
            source={{
              uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
            }}
            style={{ width: 19, height: 19 }}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});
