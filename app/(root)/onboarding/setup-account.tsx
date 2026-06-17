import { usePostHog } from 'posthog-react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useOnboardingState } from "@/backend/store/onboarding-store";
import { useSupabase } from "@/backend/hooks/useSupabase";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const LOADING_MESSAGES = [
  "Analyzing your style preferences...",
  "Calibrating your body profile...",
  "Personalizing Look AI...",
  "Almost ready...",
];

export default function SetupAccountScreen() {
  const posthog = usePostHog();
  const { user } = useUser();
  const { supabase, isInitializing } = useSupabase();
  const { completeOnboarding, isSaving, error } = useOnboardingState();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (isInitializing || !user?.id) return;

    void completeOnboarding(user.id, supabase);
  }, [isInitializing, supabase, completeOnboarding, user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        
        {/* Loading Spinner */}
        <View className="h-24 w-24 rounded-full bg-[#F5F4F8] items-center justify-center mb-8">
          {(isSaving || isInitializing) ? (
            <ActivityIndicator size="large" color="#1D1A27" />
          ) : (
            <ActivityIndicator size="large" color="#1D1A27" />
          )}
        </View>

        {/* Title */}
        <Text className="text-[28px] font-bold text-[#1D1A27] mb-3 text-center">
          Setting up your account
        </Text>

        {/* Animated Subtitle Messages */}
        <View className="h-8 items-center justify-center overflow-hidden">
          <Animated.Text
            key={messageIndex}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(400)}
            className="text-[16px] font-medium text-[#6B7280] text-center"
          >
            {LOADING_MESSAGES[messageIndex]}
          </Animated.Text>
        </View>

        {/* Error State */}
        {!!error && (
          <View className="mt-8 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
            <Text className="text-center text-sm font-medium text-red-500">
              {error}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
