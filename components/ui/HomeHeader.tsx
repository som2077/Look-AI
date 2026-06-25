import { CURRENT_STREAK_DAYS } from "@/constants/streak";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export const HomeHeader = React.memo(function HomeHeader() {
  const router = useRouter();
  const streak = CURRENT_STREAK_DAYS;

  return (
    <View className="flex-row items-center justify-between ">
      <ExpoImage
        source={require("../../assets/images/getStartedLogo.png")}
        style={{ height: 70, width: 224, marginLeft: -40 }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => router.push("/(root)/streak" as never)}
          activeOpacity={0.7}
          className="flex-row items-center rounded-full border border-[#E2E2EA] bg-[#F8F7FC] px-4 py-[8.5px]"
        >
          <LottieView
            source={{
              uri: "https://lottie.host/90aa36ae-cfef-49e5-bd8e-8c4c54fc2004/df47Z2J4nI.json",
            }}
            autoPlay
            loop
            style={{ width: 21, height: 21 }}
          />
          <Text className="text-[#1D1A27] font-bold text-[15px] ml-1.5">
            {streak}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(root)/calendar" as never)}
          activeOpacity={0.7}
          className="flex-row items-center rounded-full border border-[#E2E2EA] bg-[#F8F7FC] p-[9.9px]"
        >
          <ExpoImage
            source={{
              uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
            }}
            style={{ width: 21, height: 21 }}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});
