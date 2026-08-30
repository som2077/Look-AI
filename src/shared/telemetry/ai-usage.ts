/**
 * AI Usage — single fire-and-forget entry point for instrumenting every
 * successful AI feature invocation across the app. Powers the
 * "AI Usage" section in the user profile.
 *
 * Usage:
 *   import { trackAiUsage } from "@/shared/telemetry/ai-usage";
 *   await trackAiUsage("style_chat", { messageCount: 1 });
 *
 * Behaviour:
 *   - Never throws. A failed insert must not break the user-facing flow.
 *   - Runs in the background — `void trackAiUsage(...)` is the typical call.
 *   - Resolves the current user via Clerk; the resulting row's user_id
 *     matches the (auth.jwt() ->> 'sub') predicate used by RLS.
 *   - Also fires an `ai_usage_tracked` PostHog event for cross-referencing
 *     in the analytics dashboard.
 */
import { getSupabaseGlobalUserId, supabase } from "@/shared/supabase/client";
import { posthogAnalytics } from "@/shared/telemetry/posthog";

export type AiFeatureKey =
  | "style_chat"
  | "cloth_scan"
  | "cloth_label"
  | "fit_check"
  | "multi_item_recommendation"
  | "virtual_try_on"
  | "planner_chat";

export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  style_chat: "Style Chat",
  cloth_scan: "AI Cloth Scan",
  cloth_label: "Label Scanner",
  fit_check: "AI Fit Check",
  multi_item_recommendation: "Outfit Builder",
  virtual_try_on: "Virtual Try-On",
  planner_chat: "Outfit Planner",
};

/**
 * Append-only insert into ai_usage_events. Best-effort: errors are
 * swallowed so a tracking failure cannot break the user-facing flow.
 */
export async function trackAiUsage(
  featureKey: AiFeatureKey,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const userId = getSupabaseGlobalUserId();
    if (!userId) return; // not signed in

    const { error } = await supabase.from("ai_usage_events").insert({
      user_id: userId,
      feature_key: featureKey,
      feature_label: AI_FEATURE_LABELS[featureKey],
      metadata,
    });
    if (error) {
      console.warn(`[ai-usage] insert failed for ${featureKey}:`, error.message);
      return;
    }

    posthogAnalytics.captureEvent("ai_usage_tracked", {
      feature_key: featureKey,
    });
  } catch (err) {
    // swallow — usage tracking is best-effort
    console.warn(`[ai-usage] trackAiUsage threw for ${featureKey}:`, err);
  }
}
