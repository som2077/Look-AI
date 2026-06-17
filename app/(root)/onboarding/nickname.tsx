import { usePostHog } from 'posthog-react-native';
import { useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/backend/store/onboarding-store";

const MAX_LENGTH = 15;

export default function NicknameScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const { nickname, setNickname } = useOnboardingState();

  const handleContinue = () => {
    posthog?.capture('onboarding_step_completed', { step: 'nickname' });
    if (!nickname.trim()) return;
    router.push("/(root)/onboarding/comparison" as any);
  };

  return (
    // <SafeAreaView className="flex-1 bg-white">
    <View className="flex-1 px-6 pb-6 pt-2">
      <OnboardingHeader step={7} />

      <Text className="text-4xl font-semibold tracking-tight px-3 text-[#1D1A27]">
        Create nickname
      </Text>
      <Text className="mt-2 px-3 text-xl leading-6 text-[#000000]">
        This can be anything you like and can be changed later.
      </Text>

      <TextInput
        value={nickname}
        onChangeText={(text) => {
          if (text.length <= MAX_LENGTH) setNickname(text);
        }}
        placeholder="Add your nickname"
        placeholderTextColor="#5A5566"
        maxLength={MAX_LENGTH}
        className="mt-8 rounded-xl border  bg-[#F3F4F6] border-gray-200 px-5 py-5 text-base text-[#1D1A27]"
      />

      <Text className="mt-2 text-base px-2 text-[#000000]">
        {nickname.length}/{MAX_LENGTH}
      </Text>

      <View className="mt-auto">
        <ContinueButton onPress={handleContinue} disabled={!nickname.trim()} />
      </View>
    </View>
    // </SafeAreaView>
  );
}
