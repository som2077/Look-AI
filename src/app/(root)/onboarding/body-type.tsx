import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import {
  BodyTypeCard,
  type BodyTypeOption,
} from "@/features/onboarding/ui/onboarding/BodyTypeCard";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const maleBodyTypes: BodyTypeOption[] = [
  {
    id: "slim",
    title: "Rectangle",
    description: "Shoulders, waist and hips are roughly the same width.",
    image: require("@/assets/bodytypes/male/slim.png"),
  },
  {
    id: "athletic",
    title: "Inverted Triangle",
    description: "Broad shoulders taper down to a narrow waist and hips.",
    image: require("@/assets/bodytypes/male/Athletic.png"),
  },
  {
    id: "average",
    title: "Trapezoid",
    description: "Shoulders slightly wider than hips with a defined waist.",
    image: require("@/assets/bodytypes/male/Average.png"),
  },
  {
    id: "plus",
    title: "Oval",
    description: "Broader midsection with a rounder, fuller torso shape.",
    image: require("@/assets/bodytypes/male/plus.png"),
  },
];

const femaleBodyTypes: BodyTypeOption[] = [
  {
    id: "slim",
    title: "Rectangle",
    description: "Shoulders, waist and hips are roughly the same width.",
    image: require("@/assets/bodytypes/female/slim.png"),
  },
  {
    id: "curvy",
    title: "Hourglass",
    description: "Fuller bust and hips with a clearly defined narrow waist.",
    image: require("@/assets/bodytypes/female/Curvy.png"),
  },
  {
    id: "average",
    title: "Trapezoid",
    description: "Slightly wider hips than shoulders with gentle curves.",
    image: require("@/assets/bodytypes/female/Average.png"),
  },
  {
    id: "plus",
    title: "Oval",
    description: "Broader midsection with a rounder, fuller torso shape.",
    image: require("@/assets/bodytypes/female/Plus.png"),
  },
];

export default function BodyTypesScreen() {
  const posthog = usePostHog();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { gender, bodyType, setBodyType, completeOnboarding } =
    useOnboardingState();
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(
    bodyType || null,
  );
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();

  const bodyTypes = useMemo(() => {
    if (!gender) return maleBodyTypes;
    return gender.toLowerCase() === "female" ? femaleBodyTypes : maleBodyTypes;
  }, [gender]);

  const handleContinue = async () => {
    posthog?.capture("onboarding_step_completed", { step: "body-type" });
    if (!selectedBodyType) return;
    setBodyType(selectedBodyType);
    if (fromProfile === "true") {
      if (user) await completeOnboarding(user.id, supabase);
      router.back();
    } else {
      router.push("/(root)/onboarding/style-preference");
    }
  };

  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={4} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
          Body types
        </Text>
        <Text className="mt-3 text-[15px] font-sans leading-relaxed text-[#4B4852]">
          This helps us personalize your wardrobe, outfit recommendations, and
          fit suggestions.
        </Text>
      </View>

      <FlatList
        data={bodyTypes}
        keyExtractor={(item) => item.id}
        className="mt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: 14 }}
        renderItem={({ item, index }) => (
          <BodyTypeCard
            item={item}
            index={index}
            selected={selectedBodyType === item.id}
            expanded={selectedBodyType === item.id}
            onPress={() => setSelectedBodyType(item.id)}
          />
        )}
      />

      <View className="absolute inset-x-6 bottom-8">
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!selectedBodyType}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleContinue();
          }}
          className={`items-center rounded-2xl py-5 ${
            selectedBodyType ? "bg-[#1D1A27]" : "bg-[#E5E7EB]"
          }`}
        >
          <Text
            className={`text-base font-sans font-semibold ${selectedBodyType ? "text-white" : "text-[#9CA3AF]"}`}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
