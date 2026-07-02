import { usePostHog } from 'posthog-react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";

const MAX_LENGTH = 15;

export default function NicknameScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { nickname, setNickname, username, setUsername } = useOnboardingState();

  const handleContinue = () => {
    posthog?.capture('onboarding_step_completed', { step: 'nickname' });
    if (!nickname.trim() || !username.trim()) return;
    
    if (fromProfile === "true") {
      router.back();
    } else {
      router.push("/(root)/onboarding/comparison" as any);
    }
  };

  return (
    // <SafeAreaView className="flex-1 bg-white">
    <View className="flex-1 px-6 pb-6 pt-2">
      <OnboardingHeader step={7} />

      <Text className="text-4xl font-semibold tracking-tight px-3 text-[#1D1A27]">
        Create nickname
      </Text>
      <Text className="mt-2 px-3 text-xl leading-6 font-regular text-[#5A5566]">
        This can be anything you like and can be changed later.
      </Text>

      {/* Nickname Input Section */}
      <View className="mt-8 px-3">
        <Text className="text-base font-semibold text-[#1D1A27] mb-2">
          Nickname
        </Text>
        <TextInput
          value={nickname}
          onChangeText={(text) => {
            if (text.length <= MAX_LENGTH) setNickname(text);
          }}
          placeholder="Add your nickname"
          placeholderTextColor="#5A5566"
          maxLength={MAX_LENGTH}
          className="rounded-xl border bg-[#F3F4F6] border-gray-200 px-5 py-5 text-base font-medium text-[#1D1A27]"
        />
        <Text className="mt-2 text-sm font-regular text-[#5A5566]">
          {nickname.length}/{MAX_LENGTH}
        </Text>
      </View>

      {/* Username Input Section */}
      <View className="mt-6 px-3">
        <Text className="text-base font-semibold text-[#1D1A27] mb-2">
          Username
        </Text>
        <TextInput
          value={username}
          onChangeText={(text) => {
            // Only allow letters, numbers, and underscores
            const filtered = text.replace(/[^a-zA-Z0-9_]/g, "");
            if (filtered.length <= MAX_LENGTH) setUsername(filtered);
          }}
          placeholder="Add your handle"
          placeholderTextColor="#5A5566"
          maxLength={MAX_LENGTH}
          autoCapitalize="none"
          className="rounded-xl border bg-[#F3F4F6] border-gray-200 px-5 py-5 text-base font-medium text-[#1D1A27]"
        />
        <Text className="mt-2 text-sm font-regular text-[#5A5566]">
          {username.length}/{MAX_LENGTH}
        </Text>
        <Text className="mt-1 text-xs font-regular text-[#5A5566]">
          Only letters, numbers, and underscores
        </Text>
      </View>

      <View className="mt-auto">
        <ContinueButton onPress={handleContinue} disabled={!nickname.trim() || !username.trim()} />
      </View>
    </View>
    // </SafeAreaView>
  );
}
