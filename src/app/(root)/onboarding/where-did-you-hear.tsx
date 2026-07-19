import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";

const hearOptions = [
  {
    id: "playstore",
    label: "Play Store",
    icon: "google-play",
    color: "#0088FF",
  },
  {
    id: "family",
    label: "Friend or family",
    icon: "user-friends",
    color: "#6366F1",
  },
  { id: "instagram", label: "Instagram", icon: "instagram", color: "#E1306C" },
  { id: "tiktok", label: "TikTok", icon: "tiktok", color: "#000000" },
  { id: "youtube", label: "Youtube", icon: "youtube", color: "#FF0000" },
  { id: "google", label: "Google", icon: "google", color: "#34A853" },
  { id: "facebook", label: "Facebook", icon: "facebook", color: "#1877F2" },
];

export default function WhereDidYouHearScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const setWhereDidYouHear = useOnboardingState((s) => s.setWhereDidYouHear);

  // Initialize with store value if available
  const initialValue = useOnboardingState((s) => s.whereDidYouHear);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    initialValue || [],
  );

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOptions((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id); // Toggle off
      }
      if (prev.length < 3) {
        return [...prev, id]; // Toggle on (up to 3)
      }
      return prev; // Ignore if already 3 selected
    });
  };

  const handleContinue = () => {
    posthog?.capture("onboarding_step_completed", {
      step: "where-did-you-hear",
    });
    if (selectedOptions.length === 0) return;
    setWhereDidYouHear(selectedOptions);
    router.push("/(root)/onboarding/trust" as any);
  };

  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={9} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
          Where did you hear{"\n"}about us?
        </Text>
        <Text className="mt-3 text-[15px] font-sans leading-relaxed text-[#4B4852]">
          Choose up to 3 options.
        </Text>
      </View>

      <FlatList
        data={hearOptions}
        keyExtractor={(item) => item.id}
        className="mt-8"
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isSelected = selectedOptions.includes(item.id);

          return (
            <Animated.View
              entering={FadeInDown.duration(300).delay(index * 50)}
            >
              <Pressable
                onPress={() => handleSelect(item.id)}
                className={`w-full flex-row items-center justify-between p-4 rounded-2xl mb-3 ${
                  isSelected ? "bg-[#1D1A27]" : "bg-[#F5F4F8]"
                }`}
              >
                <Text
                  className={`font-sans font-semibold text-base pl-2 ${
                    isSelected ? "text-white" : "text-[#1D1A27]"
                  }`}
                >
                  {item.label}
                </Text>
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center shadow-sm ${
                    isSelected ? "bg-[#332F42]" : "bg-white"
                  }`}
                >
                  <FontAwesome5
                    name={item.icon as any}
                    size={20}
                    color={isSelected ? "#FFFFFF" : item.color}
                  />
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View className="absolute inset-x-6 bottom-8">
        <ContinueButton
          onPress={handleContinue}
          disabled={selectedOptions.length === 0}
        />
      </View>
    </View>
  );
}
