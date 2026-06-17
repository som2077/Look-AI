import { usePostHog } from 'posthog-react-native';
import {
  BodyTypeCard,
  type BodyTypeOption,
} from "@/components/onboarding/BodyTypeCard";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOnboardingState } from "@/backend/store/onboarding-store";

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
  const { gender, bodyType, setBodyType } = useOnboardingState();
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(
    bodyType || null,
  );

  const bodyTypes = useMemo(() => {
    if (!gender) return maleBodyTypes;
    return gender.toLowerCase() === "female" ? femaleBodyTypes : maleBodyTypes;
  }, [gender]);

  const handleContinue = () => {
    posthog?.capture('onboarding_step_completed', { step: 'body-type' });
    if (!selectedBodyType) return;
    setBodyType(selectedBodyType);
    router.push("/(root)/onboarding/style-preference");
  };

  return (
    <View className="flex-1 px-6 pb-6 pt-2">
      <OnboardingHeader step={4} />

      <Text className="text-4xl font-semibold px-1 tracking-tight text-[#1D1A27]">
        Body types
      </Text>
      <Text className="mt-2 text-base px-1 font-regular text-[#6B7280]">
        This will be used to calibrate your custom plan
      </Text>

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

      <View className="absolute inset-x-5 bottom-6">
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!selectedBodyType}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleContinue();
          }}
          className={`items-center rounded-2xl py-5 ${
            selectedBodyType ? "bg-[#1D1A27]" : "bg-[#ffffff]"
          }`}
        >
          <Text className="text-base font-semibold text-white">Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
