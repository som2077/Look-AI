import * as Sentry from "@sentry/react-native";
import type { Integration } from "@sentry/types";

// Store navigation integration reference
let navigationIntegration: Integration | null = null;

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
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || (__DEV__ ? "development" : "production"),
    // Performance monitoring - 100% in dev, 20% in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableNativeCrashHandling: true,
    release: `look-ai@${process.env.EXPO_PUBLIC_APP_VERSION || "unknown"}`,
    
    beforeSend(event) {
      // Filter network errors that are handled by app's offline detection
      if (event.exception?.values?.[0]?.type === "NetworkError") {
        return null;
      }

      // Privacy Sanitization: Scrub sensitive keys
      const sanitizeObject = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const sensitiveKeys = ['password', 'token', 'auth', 'secret', 'credit_card', 'cvv', 'image', 'photo', 'base64', 'measurements'];
        const sanitized = { ...obj };
        for (const key in sanitized) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeObject(sanitized[key]);
          }
        }
        return sanitized;
      };

      if (event.extra) event.extra = sanitizeObject(event.extra);
      if (event.contexts) event.contexts = sanitizeObject(event.contexts);
      
      return event;
    },
    integrations: [navigationIntegration as any],
  });
}

export function getNavigationIntegration() {
  return navigationIntegration;
}

// --- CENTRALIZED HELPERS ---

export type AppFeature = 'onboarding' | 'scan_and_add' | 'cloth_label' | 'fit_check' | 'virtual_try_on' | 'wardrobe' | 'explore' | 'calendar' | 'profile' | 'subscription' | 'api' | 'ai';
export type ErrorCategory = 'ai_timeout' | 'ai_invalid_response' | 'ai_generation_failed' | 'network_error' | 'validation_error' | 'unknown';

/**
 * Centrally capture feature-specific errors without duplicating Sentry logic.
 */
export const captureFeatureError = (
  error: unknown,
  feature: AppFeature,
  operation: string,
  errorCategory: ErrorCategory = 'unknown',
  additionalTags?: Record<string, string>
) => {
  if (__DEV__) {
    console.error(`[Sentry: ${feature}:${operation}]`, error);
  }
  
  Sentry.captureException(error, {
    tags: {
      feature,
      operation,
      error_category: errorCategory,
      ...additionalTags,
    }
  });
};

/**
 * Centrally track breadcrumbs before crucial operations.
 */
export const addAppBreadcrumb = (category: AppFeature | 'navigation' | 'ui', message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info'
  });
};

export { Sentry };
