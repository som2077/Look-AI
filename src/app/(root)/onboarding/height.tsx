import { usePostHog } from 'posthog-react-native';
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { HeightPicker } from "@/features/onboarding/ui/onboarding/HeightPicker";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";

export default function HeightScreen() {
  const posthog = usePostHog();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { height, setHeight } = useOnboardingState();
  return (
    // <SafeAreaView className="flex-1">
    <View className="flex-1 px-5 pb-6 pt-2">
      <OnboardingHeader step={3} />
      <Text className="text-4xl font-semibold px-2 tracking-tight text-[#1D1A27]">
        What is your height?
      </Text>
      <Text className="mt-2 text-left text-xl px-2 font-regular text-[#000000]">
        This will be used to calibrate your custom plan
      </Text>
      <HeightPicker height={height} onChange={setHeight} />
      <ContinueButton
        onPress={() => {
          if (fromProfile === "true") {
            router.back();
          } else {
            router.push("/(root)/onboarding/body-type");
          }
        }}
      />
    </View>
    // </SafeAreaView>
  );
}
