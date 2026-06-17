import { usePostHog } from 'posthog-react-native';
import { useRouter } from "expo-router";
import { Image, Text, View } from "react-native";
import { ContinueButton } from "@/components/onboarding/ContinueButton";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/backend/store/onboarding-store";
import { Lock } from "lucide-react-native";

export default function TrustScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const { error } = useOnboardingState();

  const handleContinue = () => {
    posthog?.capture('onboarding_step_completed', { step: 'trust' });
    router.push("/(root)/onboarding/setup-account" as never);
  };

  return (
    <View className="flex-1 px-5 pb-6 pt-2">
      <OnboardingHeader step={10} />

      <View className="mt-4 items-center">
        <Image
          source={require("@/assets/images/trust1.png")}
          className="h-80 w-80"
          resizeMode="contain"
        />
      </View>

      <Text className="mt-2 text-center text-[45px] leading-[45px] font-semibold text-[#1D1A27]">
        Thank you for{"\n"}trusting us
      </Text>
      <Text className="mt-4 text-center font-regular text-lg text-[#6B7280]">
        Now let&apos;s personalize Look AI for you...
      </Text>

      {/* Privacy and Security Card */}
      <View className="mt-14 items-center px-2">
        <View className="w-full rounded-[24px] bg-[#F5F4F8] border border-[#E5E7EB] shadow px-6 pb-8 pt-10 relative items-center">
          {/* Lock Icon Badge Overlapping Top */}
          <View className="absolute -top-6 h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm border border-[#E5E7EB]">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#FFF5E5]">
              <Lock size={20} color="#F59E0B" />
            </View>
          </View>

          <Text className="text-center font-semibold text-[20px] leading-7 text-[#1D1A27]">
            Your privacy and security{"\n"}matter to us.
          </Text>
          <Text className="mt-3 text-center font-regular text-[13px] leading-5 text-[#6B7280]">
            We prioritize keeping your personal{"\n"}information private and
            secure.
          </Text>
        </View>
      </View>

      {!!error && (
        <Text className="mt-4 text-center text-sm text-red-500">{error}</Text>
      )}

      <View className="mt-auto w-full">
        <ContinueButton onPress={handleContinue} />
      </View>
    </View>
  );
}
