import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { usePendingBatchStore } from "@/features/wardrobe/model/usePendingBatchStore";
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
  const opacity = React.useRef(new Animated.Value(1)).current;

  const pendingBatchItems = usePendingBatchStore((s) => s.items);

  // Show banner only when no analysis and no completed outfits and no pending batch items
  if (isAnalyzing || lastOutfits.length > 0 || isDismissed || pendingBatchItems.length > 0) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className="mx-6 mt-2 flex-row border-[0.4px] border-[#E9EBF8] items-center justify-between bg-[#FFFFFF] rounded-[16px] px-4 py-4"
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
        style={{ padding: 4, backgroundColor: "#F3F4F670", borderRadius: 12 }}
      >
        <IconX size={16} color="#4B5563" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
});

export const ErrorBanner = React.memo(function ErrorBanner() {
  const { error } = useOutfitAnalysisStore();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const opacity = React.useRef(new Animated.Value(1)).current;

  // Reset state when error changes
  React.useEffect(() => {
    if (error) {
      setIsDismissed(false);
      opacity.setValue(1);
    }
  }, [error, opacity]);

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
        <IconX size={16} color="#991B1B" strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
});

export const EmptyStyleBanner = React.memo(function EmptyStyleBanner() {
  const { isAnalyzing, lastOutfits } = useOutfitAnalysisStore();
  const pendingBatchItems = usePendingBatchStore((s) => s.items);

  // Show banner only when no analysis and no completed outfits and no pending batch items
  if (isAnalyzing || lastOutfits.length > 0 || pendingBatchItems.length > 0) return null;

  return (
    <View className="mx-6 mt-3  items-center justify-center bg-[#F8F7FC80] border-[0.5px] border-[#E9EBF8] rounded-[24px] px-4 py-6">
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
            borderRadius: 60,
            borderWidth: 5,
            borderColor: "#FFFFFF",
            overflow: "hidden",
            backgroundColor: "#F8F7FC80",
          }}
        >
          <ExpoImage
            source={require("@/assets/images/mirror_selfie_guy.jpg")}
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
            borderRadius: 60,
            borderWidth: 5,
            borderColor: "#FFFFFF",
            overflow: "hidden",
            backgroundColor: "#F8F7FC80",
            marginLeft: -30,
          }}
        >
          <ExpoImage
            source={require("@/assets/images/mirror_selfie_girl.jpg")}
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
            borderRadius: 60,
            borderWidth: 5,
            borderColor: "#FFFFFF",
            overflow: "hidden",
            backgroundColor: "#F8F7FC80",
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
        className="text-[#00000090] mt-1 text-center font-TikTokSans16pt-Medium"
        style={{ fontSize: 12, lineHeight: 20 }}
      >
        Tap + add you first style look of the day
      </Text>
    </View>
  );
});
