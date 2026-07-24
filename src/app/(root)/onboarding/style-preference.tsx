import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Activity,
  BookOpen,
  Briefcase,
  Camera,
  Cloud,
  Coffee,
  Cpu,
  Disc,
  Feather,
  Flame,
  Gem,
  Glasses,
  GlassWater,
  Maximize,
  Minus,
  Moon,
  Scissors,
  Search,
  Shirt,
  Snowflake,
  Sparkles,
  Sun,
  Tent,
  Umbrella,
} from "lucide-react-native";
import analytics from "@react-native-firebase/analytics";
import React, { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const styleIcons: Record<string, any> = {
  Casual: Coffee,
  Streetwear: Flame,
  Y2k: Disc,
  Preppy: BookOpen,
  Scandinavian: Snowflake,
  Oversized: Maximize,
  Glam: Sparkles,
  Minimal: Minus,
  "Smart casual": Glasses,
  "Business Casual": Briefcase,
  "Quiet Luxury": Gem,
  "Old Money": Gem,
  Luxury: Gem,
  Vintage: Camera,
  Bohemian: Feather,
  Soft: Cloud,
  Athleisure: Activity,
  Formal: Shirt,
  Edgy: Scissors,
  Dark: Moon,
  Party: GlassWater,
  Light: Sun,
  Techwear: Cpu,
  Sporty: Activity,
  Grunge: Tent,
  Vacation: Umbrella,
  "Not sure": Search,
};

interface StyleChipProps {
  label: string;
  selected: boolean;
  onToggle: (style: string) => void;
  Icon: any;
}

const StyleChip = React.memo(function StyleChip({
  label,
  selected,
  onToggle,
  Icon,
}: StyleChipProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(label);
  }, [onToggle, label]);
  return (
    <Pressable
      onPress={handlePress}
      className={`rounded-full border px-5 py-3 flex-row items-center gap-2 ${
        selected ? "border-black bg-black" : "border-transparent bg-[#ECEDF9]"
      }`}
    >
      {Icon && (
        <Icon
          size={16}
          color={selected ? "white" : "#000000"}
          strokeWidth={2.5}
        />
      )}
      <Text
        className={`text-base font-sans ${selected ? "font-semibold text-white" : "font-medium text-[#000000]"}`}
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

  const router = useRouter();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { stylePreferences, toggleStyle, completeOnboarding } =
    useOnboardingState();

  const handleContinue = useCallback(async () => {
    analytics().logEvent("onboarding_step_completed", { step: "style-preference" });
    if (stylePreferences.length !== 5) return;

    if (fromProfile === "true") {
      if (user) await completeOnboarding(user.id, supabase);
      router.back();
    } else {
      router.push("/(root)/onboarding/full-length-pics");
    }
  }, [
    router,
    stylePreferences,
    fromProfile,
    user,
    supabase,
    completeOnboarding,
  ]);

  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={5} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
          Style preferences
        </Text>
        <Text className="mt-3 text-[15px] font-sans leading-relaxed text-[#4B4852]">
          Select up to 5 fashion styles that feel most like you.
        </Text>
      </View>

      <ScrollView
        className="mt-8 flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="flex-row flex-wrap gap-3 items-center justify-center">
          {styles.map((style) => (
            <StyleChip
              key={style}
              label={style}
              Icon={styleIcons[style] || Sparkles}
              selected={stylePreferences.includes(style)}
              onToggle={toggleStyle}
            />
          ))}
        </View>
      </ScrollView>

      <View className="absolute inset-x-6 bottom-8">
        <ContinueButton
          onPress={handleContinue}
          disabled={stylePreferences.length !== 5}
        />
      </View>
    </View>
  );
}
