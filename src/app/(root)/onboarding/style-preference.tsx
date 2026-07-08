import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { usePostHog } from "posthog-react-native";
import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

interface StyleChipProps {
  label: string;
  selected: boolean;
  onToggle: (style: string) => void;
}

const StyleChip = React.memo(function StyleChip({
  label,
  selected,
  onToggle,
}: StyleChipProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(label);
  }, [onToggle, label]);
  return (
    <Pressable
      onPress={handlePress}
      className={`rounded-full border px-5 py-3 ${
        selected ? "border-black bg-black" : "border-transparent bg-[#ECEDF9]"
      }`}
    >
      <Text
        className={`text-base ${selected ? "font-semibold text-white" : "font-regular text-[#1D1A27]"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = [
  "Casual",
  "Streetwear",
  "Y2k",
  "Preppy",
  "Scandinavian",
  "Oversized",
  "Glam",
  "Minimal",
  "Smart casual",
  "Business Casual",
  "Quiet Luxury",
  "Old Money",
  "Luxury",
  "Vintage",
  "Bohemian",
  "Soft",
  "Athleisure",
  "Formal",
  "Edgy",
  "Dark",
  "Party",
  "Light",
  "Techwear",
  "Sporty",
  "Grunge",
  "Vacation",
  "Not sure",
];

export default function StylePreferenceScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { stylePreferences, toggleStyle, completeOnboarding } = useOnboardingState();

  const handleContinue = useCallback(async () => {
    posthog?.capture("onboarding_step_completed", { step: "style-preference" });
    if (stylePreferences.length !== 5) return;

    if (fromProfile === "true") {
      if (user) await completeOnboarding(user.id, supabase);
      router.back();
    } else {
      router.push("/(root)/onboarding/full-length-pics");
    }
  }, [router, stylePreferences, fromProfile, user, supabase, completeOnboarding]);

  return (
    // <SafeAreaView className="flex-1">
    <View className="flex-1 px-5 pb-6 pt-2">
      <OnboardingHeader step={5} />
      <Text className="text-4xl font-semibold tracking-tight text-center text-[#1D1A27]">
        Style preferences
      </Text>
      <Text className="mt-2 text-xl font-regular text-center text-[#000000]">
        Select fashion styles you like most.
      </Text>
      <View className="flex-row flex-wrap gap-[7px] mt-8 items-center justify-center">
        {styles.map((style) => (
          <StyleChip
            key={style}
            label={style}
            selected={stylePreferences.includes(style)}
            onToggle={toggleStyle}
          />
        ))}
      </View>
      <Text className="mt-8  text-sm font-medium text-center text-[#000000]">
        Choose up to 5 styles that feel most like you.
      </Text>
      <ContinueButton
        onPress={handleContinue}
        disabled={stylePreferences.length !== 5}
      />
    </View>
    // </SafeAreaView>
  );
}
