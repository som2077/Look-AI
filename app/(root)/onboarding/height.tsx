import { usePostHog } from 'posthog-react-native';
import { router } from "expo-router";
import { Text, View } from "react-native";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { HeightPicker } from "@/components/onboarding/HeightPicker";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/backend/store/onboarding-store";

export default function HeightScreen() {
  const posthog = usePostHog();
  const { height, setHeight } = useOnboardingState();
  return (
    // <SafeAreaView className="flex-1">
    <View className="flex-1 px-5 pb-6 pt-2">
      <OnboardingHeader step={3} />
      <Text className="text-4xl font-semibold px-2 tracking-tight text-[#1D1A27]">
        What is your height?
      </Text>
      <Text className="mt-2 text-left text-xl px-2 text-[#000000]">
        This will be used to calibrate your custom plan
      </Text>
      <HeightPicker height={height} onChange={setHeight} />
      <ContinueButton
        onPress={() => router.push("/(root)/onboarding/body-type")}
      />
    </View>
    // </SafeAreaView>
  );
}
