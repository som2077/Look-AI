import { Href, useRouter } from "expo-router";
import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
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

const authPhone = require("../../assets/images/auth-phone.png");

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
        {/* ── Image + Text overlay ── */}
        <View className="flex-1 items-center justify-center">
          {/* Phone mockup image */}
          <Image
            source={authPhone}
            className="h-[100%] w-[130%] -mb-60"
            resizeMode="contain"
          />

          {/* Text overlay: image ke upar */}
          <View className="flex absolute bottom-[70px] left-0 right-0 items-center px-15">
            <Text className="text-center text-[35px] font-semibold leading-[35px] text-[#1D1A27]">
              Scan Your Clothes,{"\n"}Get Styled Instantly
            </Text>
          </View>
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
            className="flex-row mt-[-50] items-center justify-center rounded-2xl border border-[#D8D6DD] bg-white py-4"
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
                <Text className="text-base font-medium text-[#1D1A27]">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email button */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/email" as Href)}
            disabled={isLoading}
            className="mt-3 items-center rounded-2xl bg-[#1A1827] py-4"
          >
            <Text className="text-base font-medium text-white">
              Continue with Email
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text className="mt-2 px-5 text-center text-[11px] leading-5 font-regular text-[#1b1b1b]">
            By continuing, you accept our{" "}
            <Text className="font-semibold text-[#1D1A27] underline">
              Terms of conditions
            </Text>{" "}
            and acknowledge our{" "}
            <Text className="font-semibold text-[#1D1A27] underline">
              Privacy Policy
            </Text>
            . You can tap them to view details.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
