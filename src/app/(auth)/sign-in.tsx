import { useSSO } from "@clerk/clerk-expo";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const startImage = require("@/assets/startImage1.png");

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

  const xOffset = useSharedValue(-300);

  useEffect(() => {
    xOffset.value = withRepeat(
      withTiming(300, { duration: 3500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      width: "300%",
      marginLeft: "-100%",
      transform: [{ translateX: xOffset.value }],
    };
  });

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
      const redirect = Linking.createURL("/", { scheme: "look-ai" });
      const { createdSessionId, setActive, authSessionResult } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: redirect,
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
        <View className="flex-1 items-center justify-center -mt-[60px]">
          <MaskedView
            style={{ minHeight: 80, width: "100%", overflow: "hidden" }}
            maskElement={
              <View
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text className="text-center px-30  text-[42px] font-bold leading-[38px] text-black tracking-tight">
                  Scan Your Clothes,{"\n"}Get Styled Instantly
                </Text>
              </View>
            }
          >
            <Animated.View style={animatedStyle}>
              <LinearGradient
                colors={[
                  "#F35E44",
                  "#D84F75",
                  "#B8589B",
                  "#6B79B5",
                  "#F35E44",
                  "#D84F75",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </MaskedView>
          <Text className="mt-10 text-center text-[23px] font-semibold text-[#1D1A27] leading-[23px] px-4">
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
                  source={require("@/assets/images/google-icon-logo-svgrepo-com.png")}
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
