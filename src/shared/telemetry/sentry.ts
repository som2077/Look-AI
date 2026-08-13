import * as Sentry from "@sentry/react-native";
import type { Integration } from "@sentry/types";

// Store navigation integration reference for registering with navigation container
let navigationIntegration: Integration | null = null;

/**
 * Initialize Sentry for error tracking and performance monitoring.
 * Should be called at the top of the root layout before any component renders.
 */
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn("[Sentry] Missing EXPO_PUBLIC_SENTRY_DSN - telemetry disabled");
    return;
  }

  // Create React Navigation integration for route tracking
  navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
  });

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || "development",

    // Performance monitoring - 100% in dev, 20% in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Enable native crash handling for iOS/Android
    enableNativeCrashHandling: true,

    // Release tracking
    release: `look-ai@${process.env.EXPO_PUBLIC_APP_VERSION || "unknown"}`,

    // Filter out known non-critical errors
    beforeSend(event) {
      // Filter network errors that are handled by app's offline detection
      if (event.exception?.values?.[0]?.type === "NetworkError") {
        return null;
      }
      return event;
    },

    integrations: [navigationIntegration],
  });
}

/**
 * Get the navigation integration for registering with the navigation container.
 * Call this after the navigation container is mounted.
 */
export function getNavigationIntegration() {
  return navigationIntegration;
}

// Re-export Sentry for direct usage
export { Sentry };
