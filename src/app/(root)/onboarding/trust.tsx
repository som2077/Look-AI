import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import analytics from "@/shared/telemetry/analytics";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { IconLock } from "@tabler/icons-react-native";
import { Text, View } from "react-native";

export default function TrustScreen() {

  const router = useRouter();
  const { error } = useOnboardingState();

  const handleContinue = () => {
    analytics().logEvent("onboarding_step_completed", { step: "trust" });
    router.push("/(root)/onboarding/setup-account" as never);
  };

  return (
    <View className="flex-1 bg-white px-6 pb-8 pt-2">
      <OnboardingHeader step={10} />

      <View className="items-center mt-10">
        <View
          className="h-[230px] w-[230px] rounded-full overflow-hidden items-center justify-center shadow-lg"
          style={{
            shadowColor: "#DFC7D3",
            shadowOpacity: 0.5,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
          }}
        >
          <LinearGradient
            colors={["#FAE8EF", "#DFE6F5"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            className="absolute inset-0"
          />
          <View className="h-[180px] w-[180px] items-center justify-center rounded-full overflow-hidden bg-white z-10 border-[3px] border-white/80">
            <Video
              source={require("@/assets/trustVideo.webm")}
              style={{ height: "170%", width: "170%" }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isMuted
            />
          </View>
        </View>
      </View>

      <Text className="mt-10 text-center text-[33px] leading-[38px] font-sans font-semibold tracking-tight text-[#1D1A27]">
        Thank you for{"\n"}trusting us
      </Text>
      <Text className="mt-3 text-center font-sans text-[16px] leading-relaxed text-[#4B4852]">
        Now let&apos;s personalize Look AI for you...
      </Text>

      {/* Privacy and Security Card */}
      <View className="mt-28 items-center w-full">
        <View
          className="w-[90%] rounded-[20px] bg-white px-5 pb-5 pt-7 relative items-center shadow-md"
          style={{
            shadowColor: "#1D1A27",
            shadowOpacity: 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            borderWidth: 1,
            borderColor: "#F1EEF3",
          }}
        >
          {/* IconLock Icon Badge Overlapping Top — tinted to echo the hero gradient */}
          <View
            className="absolute -top-6 h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-sm"
            style={{ backgroundColor: "#F6EEF2" }}
          >
            <IconLock size={16} color="#6B5A73" strokeWidth={2.2} />
          </View>

          <Text className="text-center font-sans font-semibold text-[16px] text-[#1D1A27] p-1">
            Your privacy and security matter to us.
          </Text>
          <Text className="mt-1.5 text-center font-sans text-[13px] leading-5 text-[#6B7280] py-1">
            We promise to always keep your{"\n"}personal information private and
            secure.
          </Text>
        </View>
      </View>

      {!!error && (
        <Text className="mt-4 text-center text-sm font-medium text-red-500">
          {error}
        </Text>
      )}

      <View className="absolute inset-x-6 bottom-8">
        <ContinueButton onPress={handleContinue} />
      </View>
    </View>
  );
}
