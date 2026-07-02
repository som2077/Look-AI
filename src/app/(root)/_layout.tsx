import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0c0c0c" },
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
