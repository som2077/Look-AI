import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { Text, TextInput, View } from "react-native";

const MAX_LENGTH = 50;

export default function BioScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { bio, setBio } = useOnboardingState();

  const handleContinue = () => {
    posthog?.capture("onboarding_step_completed", { step: "bio" });

    if (fromProfile === "true") {
      router.back();
    } else {
      router.push("/(root)/(tabs)/profile" as any);
    }
  };

  return (
    <View className="flex-1 px-6 pb-6 pt-2">
      <OnboardingHeader step={8} showBack={true} />

      <Text className="text-4xl font-semibold tracking-tight px-3 text-[#1D1A27]">
        Your Headline
      </Text>
      <Text className="mt-2 px-3 text-xl leading-6 font-regular text-[#5A5566]">
        Add a short headline under your name.
      </Text>

      {/* Bio Input Section */}
      <View className="mt-8 px-3">
        <Text className="text-base font-semibold text-[#1D1A27] mb-2">
          Headline
        </Text>
        <TextInput
          value={bio}
          onChangeText={(text) => {
            if (text.length <= MAX_LENGTH) setBio(text);
          }}
          placeholder="Independent Designer | Studio Else"
          placeholderTextColor="#5A5566"
          maxLength={MAX_LENGTH}
          className="rounded-xl border bg-[#F3F4F6] border-gray-200 px-5 py-5 text-base font-medium text-[#1D1A27]"
        />
        <Text className="mt-2 text-sm font-regular text-[#5A5566]">
          {bio.length}/{MAX_LENGTH}
        </Text>
      </View>

      <View className="mt-auto">
        <ContinueButton onPress={handleContinue} disabled={false} />
      </View>
    </View>
  );
}
