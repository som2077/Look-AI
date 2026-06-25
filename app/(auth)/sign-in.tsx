import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const startImage = require("../../assets/startImage1.png");

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as any).errors) &&
    (error as any).errors[0]?.message
  ) {
    const firstError = (error as any).errors[0];
    const field = firstError.meta?.paramName;
    return field ? `${field} ${firstError.message}` : firstError.message;
  }
  return "Google sign-in failed. Please try again.";
};

export default function SignIn() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (Platform.OS !== "android") return;
    WebBrowser.warmUpAsync().catch(() => {});
    return () => {
      WebBrowser.coolDownAsync().catch(() => {});
    };
  }, []);

  const onGooglePress = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { createdSessionId, setActive, authSessionResult } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: Linking.createURL("/", { scheme: "look-ai" }),
        });

      if (authSessionResult?.type === "cancel") return;

      if (!createdSessionId) {
        setError("Google sign-in could not be completed.");
        return;
      }

      await setActive?.({ session: createdSessionId });
      // Navigation is handled by _layout.tsx's auth useEffect:
      // - New user  → onboardingComplete = false → /(root)/onboarding
      // - Returning → onboardingComplete = true  → /(root)/(tabs)
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-5 pb-10">
        {/* ── Image ── */}
        <View className="items-center justify-center mt-40">
          <Image
            source={startImage}
            className="w-[109%] h-[320px]"
            resizeMode="contain"
          />
        </View>

        {/* ── Text ── */}
        <View className="flex-1 items-center justify-center -mt-[50px]">
          <Text className="text-center px-30 text-[40px] font-bold leading-[38px] text-[#1D1A27] tracking-tight">
            Scan Your Clothes,{"\n"}Get Styled Instantly
          </Text>
          <Text className="mt-10 text-center text-[19px] font-medium text-[#1D1A27]/70 leading-[22px] px-4">
            Build your digital wardrobe and unlock personalized outfit
            recommendations.
          </Text>
        </View>

        {/* ── Buttons & Terms ── */}
        <View>
          {error ? (
            <Text className="mb-3 text-center text-sm font-regular text-red-500">
              {error}
            </Text>
          ) : null}

          {/* Google button */}
          <TouchableOpacity
            onPress={onGooglePress}
            disabled={isLoading}
            className="flex-row items-center justify-center rounded-2xl border border-[#D8D6DD] bg-white py-5"
          >
            {isLoading ? (
              <ActivityIndicator color="#2563EB" />
            ) : (
              <>
                <Image
                  source={require("../../assets/images/google-icon-logo-svgrepo-com.png")}
                  className="mr-2 h-5 w-5"
                  resizeMode="contain"
                />
                <Text className="text-base font-semibold text-[#1D1A27]">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email button */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/email" as Href)}
            disabled={isLoading}
            className="mt-3 items-center rounded-2xl bg-[#1A1827] py-5"
          >
            <Text className="text-base font-semibold text-white">
              Continue with Email
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text className="mt-2 px-5 text-center text-[11px] leading-5 font-medium text-[#1b1b1b]">
            By continuing, you accept our{" "}
            <Text className="font-bold text-[#1D1A27] underline">
              Terms of conditions
            </Text>{" "}
            and acknowledge our{" "}
            <Text className="font-bold text-[#1D1A27] underline">
              Privacy Policy
            </Text>
            . You can tap them to view details.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
