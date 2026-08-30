import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

const getTodayString = () => new Date().toISOString().split("T")[0];

/** Logs an app_open event to streak_logs for today (once per day, fire-and-forget). */
function useLogAppOpen() {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const loggedDateRef = useRef<string | null>(null);

  const logOpen = async () => {
    if (!supabase || !user?.id) return;
    const today = getTodayString();
    if (loggedDateRef.current === today) return; // already logged today in this session
    loggedDateRef.current = today;

    try {
      await supabase.from("streak_logs").upsert(
        {
          user_id: user.id,
          activity_date: today,
          activity_type: "app_open",
        },
        { onConflict: "user_id,activity_date" }
      );
    } catch (err) {
      console.warn("[AppOpen] streak_logs insert failed:", err);
    }
  };

  return logOpen;
}

export default function RootLayout() {
  const checkStreakValidity = useStreakStore((state) => state.checkStreakValidity);
  const logAppOpen = useLogAppOpen();

  useEffect(() => {
    // Initial check on mount
    checkStreakValidity();
    logAppOpen();

    // Check when returning to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkStreakValidity();
        logAppOpen();
      }
    });

    return () => {
      subscription.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        name="(ai-features)/outfit-suggestion"
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
      <Stack.Screen
        name="ai-usage/[feature]"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
