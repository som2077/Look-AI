import PostHog from 'posthog-react-native';

// --- TYPE DEFINITIONS ---
// Strongly typed event map matching the exact specification requirements.
export type AnalyticsEventMap = {
  // Onboarding
  onboarding_started: { source?: string };
  onboarding_step_viewed: { step: string; step_number: number; total_steps: number };
  onboarding_step_completed: { step: string; step_number: number };
  style_preference_selected: { selected_style: string };
  body_profile_completed: { source?: string };
  photo_uploaded: { photo_count: number };
  onboarding_skipped: undefined;
  profile_created: undefined;
  onboarding_completed: { photo_count: number; total_steps: number };

  // Home
  home_viewed: undefined;
  outfit_suggestion_viewed: undefined;
  outfit_suggestion_opened: undefined;
  outfit_suggestion_used: undefined;
  recent_style_opened: undefined;
  streak_opened: undefined;
  calendar_opened: undefined;

  // Streak
  streak_viewed: { streak_days: number };
  streak_extended: { streak_days: number };
  streak_milestone_reached: { milestone: number };
  badge_unlocked: { badge_name?: string };

  // Scan & Add
  scan_started: { source?: string };
  scan_type_selected: { scan_type: 'camera' | 'gallery' };
  clothing_photo_captured: { source?: string };
  clothing_analysis_started: { scan_type: string };
  clothing_analysis_completed: { category?: string; duration_ms: number };
  clothing_analysis_failed: { error_category: string; duration_ms: number; retry_count?: number };
  wardrobe_item_added: { source: 'scan' | 'manual' | 'ai'; category?: string };

  // Cloth Label
  cloth_label_started: { source?: string };
  cloth_label_completed: { success: boolean; duration_ms: number };
  cloth_label_failed: { error_category: string; duration_ms: number };

  // Fit Check
  fit_check_started: { source?: string };
  fit_check_completed: { success: boolean; duration_ms: number };
  fit_check_failed: { error_category: string; duration_ms: number };

  // Virtual Try-On
  try_on_started: { source?: string };
  person_photo_selected: { source?: string };
  outfit_selected: { source?: string };
  try_on_generation_started: { generation_type: string };
  try_on_generation_completed: { duration_ms: number; success: boolean };
  try_on_generation_failed: { error_category: string; duration_ms: number };
  try_on_shared: { source?: string };
  try_on_downloaded: { source?: string };

  // Wardrobe
  wardrobe_viewed: undefined;
  wardrobe_item_opened: { category?: string };
  wardrobe_item_updated: { category?: string };
  wardrobe_item_removed: { category?: string };
  wardrobe_filter_used: { filter: string };
  wardrobe_sort_used: { sort: string };
  wardrobe_item_favorited: { category?: string };

  // Explore / Social
  explore_viewed: undefined;
  post_viewed: { content_type: string };
  post_created: { content_type: string };
  post_liked: { content_type: string };
  comment_added: { content_type: string };
  share_clicked: { content_type: string };
  notification_opened: { source?: string };

  // Calendar / Planner
  calendar_viewed: undefined;
  date_selected: undefined;
  outfit_plan_started: { source?: string };
  outfit_plan_created: { occasion?: string };
  occasion_selected: { occasion: string };
  reminder_enabled: undefined;
  reminder_disabled: undefined;
  planned_outfit_opened: { occasion?: string };

  // Profile / Settings
  profile_viewed: undefined;
  personal_details_opened: undefined;
  personal_details_updated: undefined;
  notification_setting_changed: { enabled: boolean };
  support_opened: undefined;
  feature_request_submitted: undefined;
  upgrade_clicked: { source?: string };
  logout: undefined;
  account_deletion_started: undefined;
  account_deleted: undefined;

  // Subscription / Monetization
  paywall_viewed: { source?: string };
  upgrade_viewed: { source?: string };
  checkout_started: { plan: string; currency?: string };
  subscription_started: { plan: string };
  subscription_completed: { plan: string };
  subscription_failed: { plan: string; error_category: string };

  // Screen
  screen_viewed: { screen_name: string };
};

// Internal client instance
let _client: PostHog | null = null;

// --- INITIALIZATION ---
export function initPostHog() {
  const key = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  if (!key) {
    console.warn('[Analytics] PostHog API key missing, telemetry disabled.');
    return;
  }

  _client = new PostHog(key, {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    flushAt: 20,
    flushInterval: 30000,
    enableSessionReplay: false, // Disabled by default for privacy, enable via feature flag if needed.
    sessionReplayConfig: {
      maskAllTextInputs: true,
      maskAllImages: true,
    }
  });
}

// --- CENTRALIZED API ---
export const posthogAnalytics = {
  /**
   * Capture a strictly typed product event.
   */
  captureEvent: <K extends keyof AnalyticsEventMap>(
    eventName: K,
    ...args: AnalyticsEventMap[K] extends undefined ? [] : [AnalyticsEventMap[K]]
  ) => {
    const properties = args[0] || {};
    try {
      _client?.capture(eventName, properties);
    } catch (e) {
      // Analytics must never crash the app
      console.warn(`[Analytics] Failed to capture event ${eventName}`);
    }
  },

  /**
   * Track screen views natively
   */
  screen: (screenName: string) => {
    try {
      _client?.screen(screenName);
    } catch (e) {
      console.warn('[Analytics] Failed to capture screen view');
    }
  },

  /**
   * Set the distinct ID of the user. Only use stable User IDs, never PII.
   */
  identifyUser: (userId: string, userProperties?: Record<string, string | number | boolean>) => {
    try {
      _client?.identify(userId, userProperties);
    } catch (e) {
      console.warn('[Analytics] Failed to identify user');
    }
  },

  /**
   * Set user properties without changing identity. (e.g. subscription_status)
   */
  setUserProperties: (properties: Record<string, string | number | boolean>) => {
    try {
      // Usually done via identify in PostHog, or using capture('$set')
      _client?.capture('$set', { $set: properties });
    } catch (e) {
      console.warn('[Analytics] Failed to set user properties');
    }
  },

  /**
   * Reset user identity (call on logout / deletion)
   */
  resetUser: () => {
    try {
      _client?.reset();
    } catch (e) {
      console.warn('[Analytics] Failed to reset user');
    }
  }
};

