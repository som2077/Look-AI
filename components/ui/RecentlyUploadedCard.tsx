import React from "react";
import { Image as ExpoImage } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { IconBell, IconX } from "@tabler/icons-react-native";
import { useOutfitAnalysisStore } from "@/backend/store/outfit-analysis-store";
// import Svg, { Polygon, Defs, LinearGradient, Stop } from "react-native-svg";

export const RecentlyUploadedHeading = React.memo(
  function RecentlyUploadedHeading() {
    return (
      <Text
        style={{
          fontFamily: "TikTokSans16pt-Bold",
        }}
        className="text-[#1D1A27] text-[20px]  mx-8 mt-4"
      >
        Recently Styled
      </Text>
    );
  },
);

export const NotifyBanner = React.memo(function NotifyBanner() {
  const { isAnalyzing, lastOutfits } = useOutfitAnalysisStore();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Show banner only when no analysis and no completed outfits
  if (isAnalyzing || lastOutfits.length > 0 || isDismissed) return null;

  return (
    <View className="mx-6  mt-2 mb-2 flex-row  border border-[#E9EBF8]  items-center justify-between bg-[#FFFFFF] rounded-[16px] px-4 py-4">
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
      <Pressable onPress={() => setIsDismissed(true)} hitSlop={10}>
        <IconX size={20} color="#1D1A27" strokeWidth={1.8} />
      </Pressable>
    </View>
  );
});

export const EmptyStyleBanner = React.memo(function EmptyStyleBanner() {
  const { isAnalyzing, lastOutfits } = useOutfitAnalysisStore();

  // Show banner only when no analysis and no completed outfits
  if (isAnalyzing || lastOutfits.length > 0) return null;

  return (
    <View className="mx-6 mt-1 items-center justify-center bg-[#F8F7FC] border border-[#E9EBF8] rounded-[24px] px-4 py-6">
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
            source={require("../../assets/images/mirror_selfie_guy.png")}
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
            source={require("../../assets/images/mirror_selfie_girl.png")}
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
