import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { ContinueButton } from "@/features/onboarding/ui/onboarding/ContinueButton";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import analytics from "@react-native-firebase/analytics";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

const MAX_LENGTH = 15;

export default function NicknameScreen() {

  const router = useRouter();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { nickname, setNickname, username, setUsername, completeOnboarding } =
    useOnboardingState();
  const [usernameError, setUsernameError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleContinue = async () => {
    analytics().logEvent("onboarding_step_completed", { step: "nickname" });
    if (!nickname.trim() || !username.trim()) return;

    setUsernameError("");
    setIsChecking(true);

    try {
      // 1. Check globally if the username is available using RPC (bypasses RLS)
      const { data: isAvailable, error } = await supabase.rpc(
        "check_username_available",
        { check_username: username.trim() },
      );

      if (error) {
        console.error("Username check error:", error);
        setUsernameError("Failed to verify username.");
        setIsChecking(false);
        return;
      }

      let taken = !isAvailable;

      // 2. If it's taken globally, check if it belongs to the current user.
      // RLS only allows selecting our OWN profile, so if it returns a row here, it's ours.
      if (taken) {
        const { data: ownProfile } = await supabase
          .from("user_profiles")
          .select("user_id")
          .eq("username", username.trim())
          .maybeSingle();

        if (ownProfile) {
          taken = false; // It's their own, they can keep it
        }
      }

      if (taken) {
        setUsernameError("Username is already taken.");
        setIsChecking(false);
        return;
      }

      if (fromProfile === "true") {
        if (user) await completeOnboarding(user.id, supabase);
        router.back();
      } else {
        router.push("/(root)/onboarding/comparison" as any);
      }
    } catch (e) {
      console.error(e);
      setUsernameError("An unexpected error occurred.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={7} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
          Create nickname
        </Text>
        <Text className="mt-3 text-[15px] font-sans leading-relaxed text-[#4B4852]">
          This can be anything you like and can be changed later.
        </Text>
      </View>

      {/* Nickname Input Section */}
      <View className="mt-8">
        <Text className="text-base font-sans font-semibold text-[#1D1A27] mb-2">
          Nickname
        </Text>
        <TextInput
          value={nickname}
          onChangeText={(text) => {
            if (text.length <= MAX_LENGTH) setNickname(text);
          }}
          placeholder="Add your nickname"
          placeholderTextColor="#5A5566"
          maxLength={MAX_LENGTH}
          className="rounded-xl border bg-[#F3F4F6] border-gray-200 px-5 py-5 text-base font-sans font-medium text-[#1D1A27]"
        />
        <Text className="mt-2 text-sm font-sans text-[#5A5566]">
          {nickname.length}/{MAX_LENGTH}
        </Text>
      </View>

      {/* Username Input Section */}
      <View className="mt-6">
        <Text className="text-base font-sans font-semibold text-[#1D1A27] mb-2">
          Username
        </Text>
        <TextInput
          value={username}
          onChangeText={(text) => {
            setUsernameError(""); // Clear error when typing
            const filtered = text.replace(/[^a-zA-Z0-9_]/g, "");
            if (filtered.length <= MAX_LENGTH) setUsername(filtered);
          }}
          placeholder="Add your handle"
          placeholderTextColor="#5A5566"
          maxLength={MAX_LENGTH}
          autoCapitalize="none"
          className={`rounded-xl border bg-[#F3F4F6] px-5 py-5 text-base font-sans font-medium text-[#1D1A27] ${
            usernameError ? "border-red-500" : "border-gray-200"
          }`}
        />
        <View className="flex-row justify-between items-start mt-2">
          <View className="flex-1">
            <Text className="text-xs font-sans text-[#5A5566]">
              Only letters, numbers, and underscores
            </Text>
            {!!usernameError && (
              <Text className="text-sm font-sans font-medium text-red-500 mt-1">
                {usernameError}
              </Text>
            )}
          </View>
          <Text className="text-sm font-sans text-[#5A5566]">
            {username.length}/{MAX_LENGTH}
          </Text>
        </View>
      </View>

      <View className="mt-auto">
        <ContinueButton
          onPress={handleContinue}
          disabled={!nickname.trim() || !username.trim() || isChecking}
        />
      </View>
    </View>
  );
}
