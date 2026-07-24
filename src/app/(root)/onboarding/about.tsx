import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import analytics from "@react-native-firebase/analytics";
import { Text, TextInput, View } from "react-native";

const MAX_LENGTH = 150;

export default function AboutScreen() {

  const router = useRouter();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { about, setAbout } = useOnboardingState();

  const handleContinue = () => {
    analytics().logEvent("onboarding_step_completed", { step: "about" });

    if (fromProfile === "true") {
      router.back();
    } else {
      // Just in case it's reached normally
      router.push("/(root)/(tabs)/profile" as any);
    }
  };

  return (
    <View className="flex-1 px-6 pb-6 pt-2">
      <OnboardingHeader step={8} showBack={true} />

      <Text className="text-4xl font-semibold tracking-tight px-3 text-[#1D1A27]">
        About you
      </Text>
      <Text className="mt-2 px-3 text-xl leading-6 font-regular text-[#5A5566]">
        Tell others a little bit about yourself and your style.
      </Text>

      {/* About Input Section */}
      <View className="mt-8 px-3">
        <Text className="text-base font-semibold text-[#1D1A27] mb-2">
          About
        </Text>
        <TextInput
          value={about}
          onChangeText={(text) => {
            if (text.length <= MAX_LENGTH) setAbout(text);
          }}
          placeholder="I'm an independent designer based in Seoul..."
          placeholderTextColor="#5A5566"
          maxLength={MAX_LENGTH}
          multiline={true}
          textAlignVertical="top"
          className="rounded-xl border bg-[#F3F4F6] border-gray-200 px-5 py-5 text-base font-medium text-[#1D1A27] min-h-[150px]"
        />
        <Text className="mt-2 text-sm font-regular text-[#5A5566]">
          {about.length}/{MAX_LENGTH}
        </Text>
      </View>

      <View className="mt-auto">
        <ContinueButton onPress={handleContinue} disabled={false} />
      </View>
    </View>
  );
}
