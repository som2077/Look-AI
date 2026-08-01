import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";

export default function RootLayout() {
  const checkStreakValidity = useStreakStore((state) => state.checkStreakValidity);

  useEffect(() => {
    // Initial check on mount
    checkStreakValidity();

    // Check when returning to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkStreakValidity();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkStreakValidity]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="(social)"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="terms" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="privacy" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen
        name="log-outfit"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="add-clothes"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="calendar"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(analytics)/streak"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(analytics)/score"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(subscription)/subscription"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(subscription)/manage-subscription"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(ai-features)/outfit"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(wardrobe)/saved"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="cloth-details"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(social)/trend-feed"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(ai-features)/look-ai"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(wardrobe)/wardrobe-highlights"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(ai-features)/outfit-log-detail"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="scan-history"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="notifications"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
