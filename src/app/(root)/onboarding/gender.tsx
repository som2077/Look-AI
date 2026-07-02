import { usePostHog } from 'posthog-react-native';
import { useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import type { Gender } from "@/features/onboarding/model/onboarding-store";

const GENDER_OPTIONS = [
  {
    label: "Male",
    icon: "♂",
    bg: "#1E1A27",
    iconColor: "#FFFFFF",
    ringColor: "#1E1A27",
  },
  {
    label: "Female",
    icon: "♀",
    bg: "#DCE754",
    iconColor: "#1E1A27",
    ringColor: "#DCE754",
  },
] as const;

export default function GenderScreen() {
  const posthog = usePostHog();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { gender, setGender } = useOnboardingState();
  const handleContinue = useCallback(() => {
    posthog?.capture('onboarding_step_completed', { step: 'gender' });
    if (!gender) return;

    if (fromProfile === "true") {
      router.back();
    } else {
      router.push("/(root)/onboarding/age");
    }
  }, [gender, fromProfile]);

  return (
    <View className="flex-1 mx-7 pb-6 pt-2">
      <OnboardingHeader step={1} showBack={false} />
      <Text className="text-4xl font-semibold tracking-tight px-3 text-[#1D1A27]">
        Choose your Gender
      </Text>
      <Text className="mt-2 text-xl px-3 font-regular text-[#000000]">
        This will be used to calibrate your custom plan
      </Text>

      <View className="mt-[80px] items-center gap-8">
        {GENDER_OPTIONS.map((o) => {
          const isSelected = gender === o.label;
          return (
            <Pressable
              key={o.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setGender(o.label as Gender);
              }}
              android_ripple={null}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              className="items-center"
            >
              {/* Outer glow ring when selected */}
              <View
                style={{
                  borderRadius: 999,
                  padding: 4,
                  borderWidth: 3,
                  borderColor: isSelected ? o.ringColor : "transparent",
                  shadowColor: isSelected ? o.ringColor : "transparent",
                  shadowOpacity: isSelected ? 0.5 : 0,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: isSelected ? 8 : 0,
                }}
              >
                <View
                  className="h-40 w-40 items-center justify-center rounded-full"
                  style={{ backgroundColor: o.bg }}
                >
                  <Text
                    className="text-8xl font-semibold"
                    style={{ color: o.iconColor }}
                  >
                    {o.icon}
                  </Text>
                </View>
              </View>

              {/* Label */}
              <Text
                className="mt-2 text-base font-semibold"
                style={{ color: isSelected ? o.ringColor : "#1D1A27" }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ContinueButton onPress={handleContinue} disabled={!gender} />
    </View>
  );
}
