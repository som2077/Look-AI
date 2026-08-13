import {
  OnboardingProvider,
  useOnboardingState,
} from "@/features/onboarding/model/onboarding-store";
import { useRevenueCat } from "@/features/payments/model/useRevenueCat";
import { FONT_ASSETS } from "@/shared/config/constants/fonts";
import { syncStoresWithUser } from "@/shared/storage/namespacedStorage";
import { useSupabase } from "@/shared/supabase/use-supabase";
import {
  AppErrorBoundary,
  ErrorStateView,
  useErrorStore,
} from "@/shared/ui/ErrorStateView";
import { ToastProvider } from "@/shared/ui/Toast";
import { initSentry, Sentry } from "@/shared/telemetry/sentry";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import {
  Stack,
  useRouter,
  useSegments,
  usePathname,
  useRootNavigationState,
  useNavigationContainerRef,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import analytics from "@react-native-firebase/analytics";
import { memo, useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  requestUserPermission,
  getFCMToken,
  setupNotificationListeners,
} from "@/shared/notifications/firebase-service";
import "../../global.css";

// Initialize Sentry before any component renders
initSentry();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

// Guard avatar + FCM bootstrap sync so the client-identity swap in useSupabase()
// (which recreates the client after init) can't double-fire them per session.
const bootstrapSyncDone = new Map<string, boolean>();

const RootNavigator = memo(function RootNavigator() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  // undefined until the root layout's navigator has mounted — prevents the
  // redirect effect below from navigating before the router is ready (which
  // throws "Couldn't find a navigation context" / "navigate before mounting").
  const rootNavigationState = useRootNavigationState();
  // Same ref expo-router uses internally — `current` flips from null to the
  // container when the root navigator mounts, and `isReady()` is only true
  // after React Navigation finishes its initial mount. Both must hold before
  // we're allowed to call router.replace().
  const navigationRef = useNavigationContainerRef();

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

  // Initialize RevenueCat
  useRevenueCat();

  // Firebase screen tracking
  useEffect(() => {
    if (pathname) {
      analytics().logScreenView({
        screen_name: pathname,
        screen_class: pathname,
      });
    }
  }, [pathname]);

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

  // Firebase User Identification + Sentry User Context
  useEffect(() => {
    if (userId) {
      analytics().setUserId(userId);
      Sentry.setUser({ id: userId });
    } else {
      analytics().setUserId(null);
      Sentry.setUser(null);
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      syncStoresWithUser(null);
      resetOnboardingState();
      return;
    }

    let cancelled = false;
    (async () => {
      // Rehydrate persisted stores FIRST so ensureUserSession never clobbers
      // previously-saved onboarding data with the empty initial form.
      await syncStoresWithUser(userId);
      if (!cancelled) ensureOnboardingSession(userId);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    ensureOnboardingSession,
    resetOnboardingState,
    isLoaded,
    isSignedIn,
    userId,
  ]);

  // Self-heal: if the local onboarding store is empty (e.g. fresh install,
  // SecureStore cleared, or a rehydration race), pull the profile from
  // user_profiles (source of truth) so profile, personal-details, and
  // community posts still show real onboarding data.
  useEffect(() => {
    if (!isSignedIn || !userId || isSupabaseInitializing) return;
    if (onboardingComplete !== true) return;

    const s = useOnboardingState.getState();
    const hasLocalData = Boolean(
      s.nickname || s.username || s.bodyType || s.stylePreferences.length,
    );
    if (hasLocalData) return; // store already has data — don't clobber

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select(
            "age,height,gender,body_type,nickname,username,style_preferences",
          )
          .eq("user_id", userId)
          .maybeSingle();
        if (!cancelled && !error && data) {
          useOnboardingState.getState().hydrateFromProfile(data);
        }
      } catch (err) {
        console.warn("Failed to hydrate onboarding store from profile", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, userId, isSupabaseInitializing, onboardingComplete, supabase]);

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
    if (!user?.imageUrl || !supabase || !userId) return;
    if (isSupabaseInitializing) return;
    if (bootstrapSyncDone.get(`avatar:${userId}`)) return;
    bootstrapSyncDone.set(`avatar:${userId}`, true);

    supabase
      .from("user_profiles")
      .update({ avatar_url: user.imageUrl })
      .eq("user_id", userId)
      .is("avatar_url", null)
      .then(() => {}); // Silent sync — one-time per session
  }, [user?.imageUrl, supabase, userId, isSupabaseInitializing]);

  // Sync FCM Token on app start if enabled
  useEffect(() => {
    if (!isSignedIn || !userId || !supabase) return;
    if (isSupabaseInitializing) return;
    if (bootstrapSyncDone.get(`fcm:${userId}`)) return;
    bootstrapSyncDone.set(`fcm:${userId}`, true);

    async function syncFCM() {
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("notifications_enabled")
          .eq("user_id", userId)
          .single();
          
        if (data && data.notifications_enabled) {
          const hasPermission = await requestUserPermission();
          if (hasPermission) {
            const token = await getFCMToken();
            if (token) {
              await supabase
                .from("user_profiles")
                .update({ fcm_token: token })
                .eq("user_id", userId);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to sync FCM token", err);
      }
    }
    syncFCM();
  }, [isSignedIn, userId, supabase, isSupabaseInitializing]);


  useEffect(() => {
    if (!isLoaded) return;
    // Wait for the root navigator to mount AND be ready before redirecting.
    // Navigating before the container is ready throws "Couldn't find a
    // navigation context" / "navigate before mounting the Root Layout".
    // Note: `navigationRef.current` becoming non-null (container mounted) is
    // not enough — `isReady()` flips true only after React Navigation commits
    // the initial state. Both `navigationRef?.current` and `rootNavigationState`
    // are deps so this effect re-runs at each stage of container readiness.
    if (!navigationRef.current?.isReady()) return;

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

    if (inAuth || !inRoot) {
      router.replace("/(root)/(tabs)");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isSignedIn,
    isLoaded,
    onboardingComplete,
    segmentKey,
    rootNavigationState,
    navigationRef?.current,
  ]);

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

  // Initialize Firebase Push Notifications
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupFirebaseNotifications() {
      // Just set up listeners for background/foreground messages
      // Permissions and token fetching are handled when user logs in or toggles settings
      unsubscribe = setupNotificationListeners();
    }
    setupFirebaseNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const targetUrl =
        process.env.EXPO_PUBLIC_SUPABASE_URL || "https://google.com";
      const response = await fetch(targetUrl, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.type !== "opaque" && response.status >= 500) {
        setServerError(true);
        setOffline(false);
      } else {
        setOffline(false);
        setServerError(false);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("Connectivity check: timeout reached");
      } else {
        console.warn("Connectivity check failed:", err);
      }
      setOffline(true);
    }
  }, [setOffline, setServerError]);

  useEffect(() => {
    // Initial check on mount
    checkConnectivity();

    // Check on foreground return only, with a 60s minimum interval (replaces the
    // old 60s setInterval, which produced ~167 req/s to Supabase at 10k users).
    let lastCheckAt = Date.now();
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      const now = Date.now();
      if (now - lastCheckAt < 60_000) return;
      lastCheckAt = now;
      checkConnectivity();
    });

    return () => {
      subscription.remove();
    };
  }, [checkConnectivity]);

  // Show nothing while fonts are loading
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <OnboardingProvider>
            <AppErrorBoundary>
              <RootNavigator />
              <ErrorStateView onRetry={checkConnectivity} />
              <ToastProvider />
            </AppErrorBoundary>
          </OnboardingProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
