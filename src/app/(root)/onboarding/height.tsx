import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { HeightPicker } from "@/features/onboarding/ui/onboarding/HeightPicker";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import analytics from "@react-native-firebase/analytics";
import { Text, View } from "react-native";

export default function HeightScreen() {

  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { height, setHeight, completeOnboarding } = useOnboardingState();
  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={3} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
          What is your height?
        </Text>
        <Text className="mt-3 text-[15px] font-sans leading-relaxed text-[#4B4852]">
          This helps us personalize your wardrobe, outfit recommendations, and
          fit suggestions.
        </Text>
      </View>
      <View className="flex-1 justify-center mb-12">
        <HeightPicker height={height} onChange={setHeight} />
      </View>
      <ContinueButton
        onPress={async () => {
          analytics().logEvent("onboarding_step_completed", { step: "height" });
          if (fromProfile === "true") {
            if (user) await completeOnboarding(user.id, supabase);
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
