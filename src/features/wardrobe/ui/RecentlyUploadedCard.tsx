import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { IconAlertTriangle, IconBell, IconX } from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Animated, Pressable, Text, View } from "react-native";
// import Svg, { Polygon, Defs, LinearGradient, Stop } from "react-native-svg";

export const RecentlyUploadedHeading = React.memo(
  function RecentlyUploadedHeading() {
    return (
      <Text
        style={{
          fontFamily: "TikTokSans16pt-Bold",
        }}
        className="text-[#1D1A27] text-[20px]  mx-10 mt-4"
      >
        Recently Styled
      </Text>
    );
  },
);

export const NotifyBanner = React.memo(function NotifyBanner() {
  const { isAnalyzing, lastOutfits } = useOutfitAnalysisStore();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(60);
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isAnalyzing || lastOutfits.length > 0 || isDismissed) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsDismissed(true);
      });
    }
  }, [timeLeft, isAnalyzing, lastOutfits.length, isDismissed]);

  // Show banner only when no analysis and no completed outfits
  if (isAnalyzing || lastOutfits.length > 0 || isDismissed) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className="mx-6 mt-2 flex-row border border-[#E9EBF8] items-center justify-between bg-[#FFFFFF] rounded-[16px] px-4 py-4"
    >
      <View className="flex-row items-center flex-1 pr-3">
        <IconBell size={24} color="#1D1A27" strokeWidth={1.5} />
        <Text
          className="ml-3 text-[#1D1A27] font-sans"
          style={{ fontSize: 12, lineHeight: 18, flex: 1 }}
        >
          You can switch apps or turn off your phone. {"\n"}
          We&apos;ll notify you when the analysis is done.
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setIsDismissed(true));
        }}
        hitSlop={10}
        style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#F3F4F6", borderRadius: 12 }}
      >
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#4B5563" }}>
          {timeLeft > 0 ? `${timeLeft}s` : "0s"}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

export const ErrorBanner = React.memo(function ErrorBanner() {
  const { error } = useOutfitAnalysisStore();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(3);
  const opacity = React.useRef(new Animated.Value(1)).current;

  // Reset state when error changes
  React.useEffect(() => {
    if (error) {
      setIsDismissed(false);
      setTimeLeft(5);
      opacity.setValue(1);
    }
  }, [error]);

  React.useEffect(() => {
    if (!error || isDismissed) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsDismissed(true);
      });
    }
  }, [timeLeft, error, isDismissed]);

  if (!error || isDismissed) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className="mx-6 mt-2 flex-row border border-[#FECACA] items-center justify-between bg-[#FEF2F2] rounded-[16px] px-4 py-4"
    >
      <View className="flex-row items-center flex-1 pr-3">
        <IconAlertTriangle size={24} color="#EF4444" strokeWidth={1.5} />
        <Text
          className="ml-3 text-[#991B1B] font-sans"
          style={{ fontSize: 12, lineHeight: 18, flex: 1, fontWeight: "500" }}
        >
          {error}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setIsDismissed(true));
        }}
        hitSlop={10}
        style={{ padding: 4, backgroundColor: "#FEE2E2", borderRadius: 20 }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#991B1B" }}>
          {timeLeft > 0 ? `${timeLeft}s` : "0s"}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

export const EmptyStyleBanner = React.memo(function EmptyStyleBanner() {
  const { isAnalyzing, lastOutfits } = useOutfitAnalysisStore();

  // Show banner only when no analysis and no completed outfits
  if (isAnalyzing || lastOutfits.length > 0) return null;

  return (
    <View className="mx-6 mt-3  items-center justify-center bg-[#F8F7FC] border border-[#E9EBF8] rounded-[24px] px-4 py-6">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          height: 80,
          width: 140,
          marginTop: -10,
        }}
      >
        {/* Left Circle: Guy Selfie */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 38,
            borderWidth: 1,
            borderColor: "#FFFFFF",
            overflow: "hidden",
            backgroundColor: "#F3F4F6",
          }}
        >
          <ExpoImage
            source={require("@/assets/images/mirror_selfie_guy.png")}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>

        {/* mid Circle: Girl Selfie (overlapping) */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 38,
            borderWidth: 1,
            borderColor: "#FFFFFF",
            overflow: "hidden",
            backgroundColor: "#F3F4F6",
            marginLeft: -30,
          }}
        >
          <ExpoImage
            source={require("@/assets/images/mirror_selfie_girl.png")}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
        {/* Right Circle: Girl Selfie (overlapping) */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 38,
            borderWidth: 1,
            borderColor: "#FFFFFF",
            overflow: "hidden",
            backgroundColor: "#F3F4F6",
            marginLeft: -30,
          }}
        >
          <ExpoImage
            source={require("@/assets/images/selfi3rd.jpg")}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
      </View>
      <Text
        className="text-[#313131] mt-1 text-center font-TikTokSans16pt-Medium"
        style={{ fontSize: 12, lineHeight: 20 }}
      >
        Tap + add you first style look of the day
      </Text>
    </View>
  );
});
