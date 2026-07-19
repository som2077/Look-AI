import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { Text, View } from "react-native";

import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { AgePicker } from "@/features/onboarding/ui/onboarding/AgePicker";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";

export default function AgeScreen() {
  const posthog = usePostHog();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { age, setAge, completeOnboarding } = useOnboardingState();

  return (
    <View className="flex-1 mx-auto pb-8 ">
      {/* Header */}
      <View className="px-6">
        <OnboardingHeader step={2} />
      </View>

      {/* Title */}
      <Text className="px-6 mt-4 text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
        How old are you?
      </Text>
      <Text className="px-6 mt-2  text-[15px] font-sans leading-relaxed text-[#6B7280]">
        This will be used to calibrate your custom plan
      </Text>

      {/* AgePicker vertically centered in remaining space */}
      <View className="flex-1 justify-center mb-12">
        <AgePicker age={age} onChange={setAge} />
      </View>

      {/* Continue button pinned to bottom */}
      <View className="px-5">
        <ContinueButton
          onPress={async () => {
            posthog?.capture("onboarding_step_completed", { step: "age" });
            if (fromProfile === "true") {
              if (user) await completeOnboarding(user.id, supabase);
              router.back();
            } else {
              router.push("/(root)/onboarding/height");
            }
          }}
        />
      </View>
    </View>
  );
}
