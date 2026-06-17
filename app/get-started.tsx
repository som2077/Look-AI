import { Href, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from 'posthog-react-native';

const getStartedLogo = require("../assets/images/getStartedLogo.png");

export default function GetStartedScreen() {
  const router = useRouter();
  const posthog = usePostHog();

  return (
    <LinearGradient
      colors={["#CACAD7", "#F5EBE7", "#FFFFFF"]}
      locations={[0, 0.26, 0.53]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.32, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-8 pb-6 pt-0">
          {/* Logo + Title */}
          <View className="flex-1 items-center justify-center">
            <View className="flex-row items-center mb-[60px]">
              <Image
                source={getStartedLogo}
                className="h-36"
                resizeMode="contain"
              />
            </View>

            {/* Taglines */}
            <View className="mt-16 w-full">
              <Text className="text-center text-[38px] font-semibold leading-[48px] tracking-tight text-[#9E9AAA]">
                Not trends.Your style.
              </Text>
              <Text className="mt-2 text-center text-[27px] font-bold tracking-tight text-[#1D1A27]">
                Your perfect look, every time.
              </Text>
            </View>
          </View>

          {/* Bottom CTA */}
          <View className="w-full">
            <TouchableOpacity
              onPress={() => {
                posthog?.capture('onboarding_started');
                router.push("/(auth)/sign-in" as Href);
              }}
              activeOpacity={0.9}
              className="w-full items-center rounded-2xl bg-[#1E1A24] py-5"
            >
              <Text className="text-base font-semibold text-white">
                Get Started
              </Text>
            </TouchableOpacity>

            <Text className="mt-4 px-1 text-center font-semibold text-sm leading-5 text-[#191919]">
              By continuing, you accept our{" "}
              <Text className="underline font-black ">Terms of Service</Text>{" "}
              and acknowledge our{" "}
              <Text className="underline font-black ">Privacy Policy</Text>. You
              can tap them to view details.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
