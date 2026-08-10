import { useSSO } from "@clerk/clerk-expo";
import MaskedView from "@react-native-masked-view/masked-view";
import { IconMailFilled } from "@tabler/icons-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Carousel, CarouselRef } from "react-native-reanimated-carousel";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

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

const SLIDES = [
  {
    id: "1",
    layout: "A",
    images: [
      require("@/assets/images/mirror_selfie_guy.jpg"),
      require("@/assets/images/auth_center.jpg"),
      require("@/assets/images/auth_left.jpg"),
      require("@/assets/images/auth_right.jpg"),
      require("@/assets/images/mirror_selfie_girl.jpg"),
    ],
    title: "Guidance you can trust",
    desc: "Achieve your goals with daily missions designed with doctors and health coaches.",
  },
  {
    id: "2",
    layout: "B",
    images: [
      require("@/assets/images/mirror_selfie_girl.jpg"),
      require("@/assets/images/auth_bubbles_hero.jpg"),
      require("@/assets/images/auth_center.jpg"),
    ],
    title: "You're in control",
    desc: "Share a Health Report with your doctor or health coach. Control what data you share with other apps.",
  },
  {
    id: "3",
    layout: "A",
    images: [
      require("@/assets/images/auth_center.jpg"),
      require("@/assets/images/mirror_selfie_guy.jpg"),
      require("@/assets/images/mirror_selfie_girl.jpg"),
      require("@/assets/images/auth_right.jpg"),
      require("@/assets/images/auth_left.jpg"),
    ],
    title: "Community Inspiration",
    desc: "Discover new styles and share your fit checks with others every single day.",
  },
];

const { width: PAGE_WIDTH } = Dimensions.get("window");

export default function SignIn() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const carouselRef = useRef<CarouselRef>(null);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

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
    WebBrowser.warmUpAsync().catch(() => { });
    return () => {
      WebBrowser.coolDownAsync().catch(() => { });
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
    <SafeAreaView className="flex-1 bg-[#ffff]" edges={["top", "bottom"]}>
      <View className="flex-1 px-5 pb-10">
        {/* ── Header ── */}
        <View className="items-center mt-5 mb-5">
          <Image
            source={require("@/assets/images/getStartedLogo.png")}
            style={{ width: 150, height: 60 }}
            resizeMode="contain"
          />
          <Text className="text-[#374151] font-medium text-[16px] mt-2 text-center">
            Welcome to your AI stylist
          </Text>
        </View>

        {/* ── Carousel Section ── */}
        <View className="flex-1">
          <Carousel
            ref={carouselRef}
            loop={false}
            style={{ width: PAGE_WIDTH - 40, height: 530 }} // phone mockup + text height
            data={SLIDES}
            onSnapToItem={(index: number) => setActiveIndex(index)}
            onProgressChange={(progress) => {
              const newIndex = Math.round(Math.abs(progress));
              if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
              }
            }}
            renderItem={({ item, index }: { item: any; index: number }) => (
              <View className="flex-1 items-center justify-start">
                {/* Image Grid Layout */}
                <View style={{ width: "100%", height: 320, paddingHorizontal: 10, marginBottom: 20 }}>
                  {item.layout === "A" ? (
                    <View style={{ flex: 1, gap: 10 }}>
                      {/* Top Row - 2 columns */}
                      <View style={{ flex: 2, flexDirection: "row", gap: 10 }}>
                        <Image source={item.images[0]} style={{ flex: 1, height: "100%", borderRadius: 20 }} resizeMode="cover" />
                        <Image source={item.images[1]} style={{ flex: 1, height: "100%", borderRadius: 20 }} resizeMode="cover" />
                      </View>
                      {/* Bottom Row - 3 columns */}
                      <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                        <Image source={item.images[2]} style={{ flex: 1, height: "100%", borderRadius: 16 }} resizeMode="cover" />
                        <Image source={item.images[3]} style={{ flex: 1, height: "100%", borderRadius: 16 }} resizeMode="cover" />
                        <Image source={item.images[4]} style={{ flex: 1, height: "100%", borderRadius: 16 }} resizeMode="cover" />
                      </View>
                    </View>
                  ) : (
                    <View style={{ flex: 1, gap: 10 }}>
                      {/* Top Row - 1 wide */}
                      <View style={{ flex: 1.5 }}>
                        <Image source={item.images[0]} style={{ flex: 1, width: "100%", height: "100%", borderRadius: 24 }} resizeMode="cover" />
                      </View>
                      {/* Bottom Row - 2 columns */}
                      <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                        <Image source={item.images[1]} style={{ flex: 1, height: "100%", borderRadius: 16 }} resizeMode="cover" />
                        <Image source={item.images[2]} style={{ flex: 1, height: "100%", borderRadius: 16 }} resizeMode="cover" />
                      </View>
                    </View>
                  )}
                </View>

                {/* Text Section */}
                <View className="items-center w-full">
                  <MaskedView
                    style={{ minHeight: 80, width: "100%", overflow: "hidden" }}
                    maskElement={
                      <View style={{ flex: 1, backgroundColor: "transparent", justifyContent: "center", alignItems: "center" }}>
                        <Text
                          className="text-center px-2 w-full text-[30px] font-bold leading-[34px] text-black tracking-tight"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {item.title}
                        </Text>
                      </View>
                    }
                  >
                    <Animated.View style={animatedStyle}>
                      <LinearGradient
                        colors={["#000000ff", "#864646ff", "#e71caaff", "#161618ff"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    </Animated.View>
                  </MaskedView>
                  <Text className="mt-2 text-center text-[15px] font-semibold text-[#1D1A27] leading-[20px] px-6">
                    {item.desc}
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Pagination Dots */}
          <View className="flex-row justify-center mt-2 space-x-2">
            {SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => carouselRef.current?.scrollTo({ index: i, animated: true })}
                className={`h-2 rounded-full ${activeIndex === i ? "w-6 bg-[#000000]" : "w-2 bg-[#D8D6DD]"
                  }`}
                style={{
                  marginHorizontal: 4, // for space-x-2 fallback
                }}
              />
            ))}
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
                <Text className="text-base font-semibold text-[#1D1A27] ">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email button */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/email" as Href)}
            disabled={isLoading}
            className="mt-3 flex-row items-center justify-center rounded-2xl bg-[#1A1827] py-5"
          >
            <IconMailFilled size={20} color="white" style={{ marginRight: 8 }} />
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
