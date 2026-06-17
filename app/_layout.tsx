import "../global.css";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSupabase } from "@/backend/hooks/useSupabase";
import {
  OnboardingProvider,
  useOnboardingState,
} from "@/backend/store/onboarding-store";
import { BillingService } from "@/billing/BillingService";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { memo, useCallback, useEffect, useState } from "react";
import {
  useErrorStore,
  ErrorStateView,
  AppErrorBoundary,
} from "../components/ui/ErrorStateView";
import { useFonts } from "expo-font";
import { FONT_ASSETS } from "@/constants/fonts";
import * as NavigationBar from "expo-navigation-bar";
import { PostHogProvider } from "posthog-react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

const RootNavigator = memo(function RootNavigator() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const segmentKey = segments.join("/");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );
  const completionVersion = useOnboardingState((s) => s._completionVersion);
  const ensureOnboardingSession = useOnboardingState(
    (s) => s.ensureUserSession,
  );
  const resetOnboardingState = useOnboardingState((s) => s.resetState);
  const { supabase, isInitializing: isSupabaseInitializing } = useSupabase();

  const loadOnboardingStatus = useCallback(
    async (uid: string, client: SupabaseClient) => {
      const storedValue = await SecureStore.getItemAsync(
        `onboarding_complete_${uid}`,
      );

      if (storedValue === "true") {
        setOnboardingComplete(true);
        return;
      }

      try {
        const { data, error } = await client
          .from("user_profiles")
          .select("user_id")
          .eq("user_id", uid)
          .maybeSingle();

        if (error) {
          console.warn("Failed to load remote onboarding status", error);
          setOnboardingComplete(false);
          return;
        }

        const isComplete = Boolean(data);

        if (isComplete) {
          await SecureStore.setItemAsync(`onboarding_complete_${uid}`, "true");
        }

        setOnboardingComplete(isComplete);
      } catch (err) {
        console.warn("Unexpected onboarding status error", err);
        setOnboardingComplete(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      resetOnboardingState();
      return;
    }

    ensureOnboardingSession(userId);
  }, [
    ensureOnboardingSession,
    resetOnboardingState,
    isLoaded,
    isSignedIn,
    userId,
  ]);

  useEffect(() => {
    if (!isSignedIn) {
      setOnboardingComplete(null);
      return;
    }

    if (!userId) {
      setOnboardingComplete(null);
      return;
    }

    if (completionVersion > 0) {
      setOnboardingComplete(true);
      return;
    }

    if (isSupabaseInitializing) {
      return;
    }

    void loadOnboardingStatus(userId, supabase);
  }, [
    isSignedIn,
    userId,
    completionVersion,
    loadOnboardingStatus,
    supabase,
    isSupabaseInitializing,
  ]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuth = segments[0] === "(auth)";
    const inRoot = segments[0] === "(root)";
    const inOnboarding =
      inRoot && (segments as string[]).includes("onboarding");

    if (!isSignedIn) {
      if (!inAuth) {
        router.replace("/(auth)/sign-in");
      }
      return;
    }

    // Signed in — wait for onboarding status to load
    if (onboardingComplete === null) return;

    if (!onboardingComplete) {
      if (!inOnboarding) {
        router.replace("/(root)/onboarding");
      }
      return;
    }

    if (inOnboarding || inAuth || !inRoot) {
      router.replace("/(root)/(tabs)");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded, onboardingComplete, segmentKey]);

  return <Stack screenOptions={{ headerShown: false }} />;
});

export default function RootLayout() {
  const { setOffline, setServerError } = useErrorStore();

  // Load fonts globally
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  // Handle font loading error
  useEffect(() => {
    if (fontError) {
      console.warn("Failed to load fonts:", fontError);
    }
  }, [fontError]);

  // Force navigation bar always black regardless of light/dark mode
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#000000");
    NavigationBar.setButtonStyleAsync("light");
  }, []);

  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const targetUrl =
        process.env.EXPO_PUBLIC_SUPABASE_URL || "https://google.com";
      const response = await fetch(targetUrl, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status >= 500) {
        setServerError(true);
        setOffline(false);
      } else {
        setOffline(false);
        setServerError(false);
      }
    } catch (err) {
      console.warn("Connectivity check failed:", err);
      setOffline(true);
    }
  }, [setOffline, setServerError]);

  useEffect(() => {
    // Initial check on mount
    checkConnectivity();

    // Periodic check every 60 seconds (was 15s — too aggressive)
    const interval = setInterval(checkConnectivity, 60000);

    return () => {
      clearInterval(interval);
      void BillingService.disconnect();
    };
  }, [checkConnectivity]);

  // Show nothing while fonts are loading
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <PostHogProvider
        apiKey="phc_o2qT8hofFXzTgfyCLkDXw7CLoCeiq2g3zprd5jF3MWok"
        options={{ host: "https://us.i.posthog.com" }}
      >
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <OnboardingProvider>
              <AppErrorBoundary>
                <RootNavigator />
                <ErrorStateView onRetry={checkConnectivity} />
              </AppErrorBoundary>
            </OnboardingProvider>
          </SafeAreaProvider>
        </ClerkProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}
