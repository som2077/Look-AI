import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

export default function ComparisonScreen() {
  const posthog = usePostHog();
  const router = useRouter();

  // Shared values for bar heights
  const leftHeight = useSharedValue(0);
  const rightHeight = useSharedValue(0);

  // States for text and continue button
  const [rightText, setRightText] = useState("1X");
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    // 1. Animate Left bar (20%) - up to 80px height
    leftHeight.value = withDelay(
      400,
      withTiming(80, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    // 2. Animate Right bar (1X -> 2X) - up to 180px height
    rightHeight.value = withDelay(
      1200, // Starts after left animation finishes
      withTiming(
        180,
        { duration: 1000, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(setShowContinue)(true); // Show Continue button after finish
          }
        },
      ),
    );

    // 3. Change 1X to 2X mid-way during right animation
    const timeout = setTimeout(() => {
      setRightText("2X");
    }, 1800);

    return () => clearTimeout(timeout);
  }, [leftHeight, rightHeight]);

  const leftBarStyle = useAnimatedStyle(() => ({
    height: leftHeight.value,
  }));

  const rightBarStyle = useAnimatedStyle(() => ({
    height: rightHeight.value,
  }));

  const handleContinue = () => {
    posthog?.capture("onboarding_step_completed", { step: "comparison" });
    router.push("/(root)/onboarding/where-did-you-hear" as any);
  };

  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={8} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight  text-[#1D1A27]">
          Get ready twice as fast with Look AI vs on your own
        </Text>
      </View>

      <View className="flex-1 justify-center mt-8">
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="w-full bg-[#F5F4F8] rounded-[32px] py-10 px-4 items-center"
        >
          <View className="flex-row w-full justify-between items-end h-[280px] px-2 gap-4">
            {/* Left Card - Without Look AI */}
            <View className="flex-1 bg-white rounded-[24px] p-2 h-full">
              <View className="h-[80px] justify-center">
                <Text className="text-center font-sans font-medium text-[13px] leading-[18px] text-[#1D1A27]">
                  Without{"\n"}Look AI
                </Text>
              </View>
              <View className="flex-1 justify-end">
                <Animated.View
                  style={leftBarStyle}
                  className="w-full bg-[#F5F4F8] rounded-[20px] items-center justify-center overflow-hidden"
                >
                  <Text className="font-sans font-bold text-[15px] text-[#1D1A27]">
                    20%
                  </Text>
                </Animated.View>
              </View>
            </View>

            {/* Right Card - With Look AI */}
            <View className="flex-1 bg-white rounded-[24px] p-2 h-full">
              <View className="h-[80px] justify-center">
                <Text className="text-center font-sans font-medium text-[13px] leading-[18px] text-[#1D1A27]">
                  With{"\n"}Look AI
                </Text>
              </View>
              <View className="flex-1 justify-end">
                <Animated.View
                  style={rightBarStyle}
                  className="w-full bg-[#1D1A27] rounded-[20px] items-center justify-center overflow-hidden"
                >
                  <Text className="font-sans font-bold text-[16px] text-white">
                    {rightText}
                  </Text>
                </Animated.View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text className="text-center font-sans font-medium text-base text-[#4B4852] mt-8">
            Look AI makes your morning easy.
          </Text>
        </Animated.View>
      </View>

      <View className="mt-auto">
        <Animated.View>
          <ContinueButton onPress={handleContinue} disabled={!showContinue} />
        </Animated.View>
      </View>
    </View>
  );
}
