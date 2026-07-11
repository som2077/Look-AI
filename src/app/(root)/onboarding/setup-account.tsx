import { usePostHog } from 'posthog-react-native';
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, TouchableOpacity } from "react-native";
import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { useSupabase } from "@/shared/supabase/use-supabase";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { RotateCcw } from "lucide-react-native";

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
  const [hasAttempted, setHasAttempted] = useState(false);

  const router = useRouter();

  const handleComplete = async () => {
    if (isInitializing || !user?.id) return;
    setHasAttempted(true);
    
    const success = await completeOnboarding(user.id, supabase, user.imageUrl);
    if (success) {
      router.replace("/(root)/(tabs)" as never);
    }
  };

  useEffect(() => {
    if (hasAttempted) return;
    handleComplete();
  }, [isInitializing, user?.id, hasAttempted]);

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
          {(isSaving || isInitializing) && !error ? (
            <ActivityIndicator size="large" color="#1D1A27" />
          ) : (
            <ActivityIndicator size="large" color="#1D1A27" />
          )}
        </View>

        {/* Title */}
        <Text className="text-4xl leading-10 font-semibold tracking-tight text-[#1D1A27] mb-3 text-center">
          Setting up your account
        </Text>

        {/* Animated Subtitle Messages */}
        <View className="h-8 items-center justify-center overflow-hidden mb-4">
          {!error ? (
            <Animated.Text
              key={messageIndex}
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(400)}
              className="text-[16px] font-medium text-[#6B7280] text-center"
            >
              {LOADING_MESSAGES[messageIndex]}
            </Animated.Text>
          ) : (
            <Text className="text-[16px] font-medium text-red-500 text-center">
              Failed to setup account
            </Text>
          )}
        </View>

        {/* Error State & Retry */}
        {!!error && (
          <Animated.View entering={FadeIn.duration(400)} className="items-center w-full">
            <View className="mb-6 bg-red-50 px-4 py-3 rounded-xl border border-red-100 w-full">
              <Text className="text-center text-sm font-medium text-red-500">
                {error}
              </Text>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => {
                  if (error?.includes("Username")) {
                    router.push("/(root)/onboarding/nickname" as never);
                  } else {
                    router.back();
                  }
                }}
                className="flex-1 items-center justify-center rounded-2xl border border-[#D1D1D8] bg-white py-4"
              >
                <Text className="text-base font-semibold text-[#1D1A27]">
                  {error?.includes("Username") ? "Change Username" : "Go Back"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleComplete}
                disabled={isSaving}
                className="flex-1 flex-row items-center justify-center rounded-2xl bg-[#1D1A27] py-4"
              >
                <RotateCcw size={18} color="#ffffff" className="mr-2" />
                <Text className="text-base font-semibold text-white">
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
