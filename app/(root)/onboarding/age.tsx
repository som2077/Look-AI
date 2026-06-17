import { usePostHog } from 'posthog-react-native';
import { router } from "expo-router";
import { Text, View } from "react-native";

import { AgePicker } from "@/components/onboarding/AgePicker";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/backend/store/onboarding-store";

export default function AgeScreen() {
  const posthog = usePostHog();
  const { age, setAge } = useOnboardingState();

  return (
    <View className="flex-1 pb-6 mx-auto pt-2">
      {/* Header */}
      <View className="px-6">
        <OnboardingHeader step={2} />
      </View>

      {/* Title */}
      <Text className="px-9 text-left text-4xl  font-semibold tracking-tight text-[#1D1A27]">
        How old are you?
      </Text>
      <Text className="px-9 mt-2 text-left text-xl text-[#000000]">
        This will be used to calibrate your custom plan
      </Text>

      {/* AgePicker vertically centered in remaining space */}
      <View className="flex-1 justify-center mb-12">
        <AgePicker age={age} onChange={setAge} />
      </View>

      {/* Continue button pinned to bottom */}
      <View className="px-5">
        <ContinueButton
          onPress={() => router.push("/(root)/onboarding/height")}
        />
      </View>
    </View>
  );
}
