import type { Gender } from "@/features/onboarding/model/onboarding-store";
import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useSupabase } from "@/shared/supabase/use-supabase";
import analytics from "@/shared/telemetry/analytics";
import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { Mars, Venus } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

const GENDER_OPTIONS = [
  {
    label: "Male",
    icon: Mars,
    bg: "#1E1A27",
    iconColor: "#FFFFFF",
    ringColor: "#1E1A27",
  },
  {
    label: "Female",
    icon: Venus,
    bg: "#DCE754",
    iconColor: "#1E1A27",
    ringColor: "#DCE754",
  },
] as const;

export default function GenderScreen() {

  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { gender, setGender, completeOnboarding } = useOnboardingState();
  const handleContinue = useCallback(async () => {
    analytics().logEvent("onboarding_step_completed", { step: "gender" });
    if (!gender) return;

    if (fromProfile === "true") {
      if (user) await completeOnboarding(user.id, supabase);
      router.back();
    } else {
      router.push("/(root)/onboarding/age");
    }
  }, [gender, fromProfile, user, supabase, completeOnboarding]);

  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={1} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
          Choose your Gender
        </Text>
        <Text className="mt-3 text-[15px] font-sans leading-relaxed text-[#4B4852]">
          This helps us personalize your wardrobe, outfit recommendations, and
          fit suggestions.
        </Text>
      </View>

      <View className="flex-1 justify-center items-center gap-10">
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
                className="rounded-full p-1 border-[3px]"
                style={{
                  borderColor: isSelected ? o.ringColor : "transparent",
                  shadowColor: isSelected ? o.ringColor : "transparent",
                  shadowOpacity: isSelected ? 0.4 : 0,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: isSelected ? 8 : 0,
                }}
              >
                <View
                  className="h-36 w-36 items-center justify-center rounded-full"
                  style={{ backgroundColor: o.bg }}
                >
                  <o.icon size={64} color={o.iconColor} strokeWidth={1.5} />
                </View>
              </View>

              {/* Label */}
              <Text
                className="mt-4 text-lg font-sans font-semibold tracking-wide"
                style={{ color: isSelected ? o.ringColor : "#4B4852" }}
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
