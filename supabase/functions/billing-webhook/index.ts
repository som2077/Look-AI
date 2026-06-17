/**
 * billing-webhook – Supabase Edge Function
 *
 * Receives Real-time Developer Notifications (RTDN) from Google Play
 * via a Cloud Pub/Sub push subscription. Updates entitlements in the DB
 * when subscriptions renew, expire, or are cancelled.
 *
 * Setup:
 * 1. Enable RTDN in Play Console → Monetise → Subscriptions → RTDN
 * 2. Create a Cloud Pub/Sub topic and push subscription pointing to this URL
 * 3. Set the RTDN_BEARER_TOKEN secret and validate it in every request
 *
 * Required secrets:
 *   RTDN_BEARER_TOKEN           A secret token you set in Pub/Sub push config
 *   GOOGLE_PLAY_PACKAGE_NAME
 *   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_URL
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RTDN_BEARER = Deno.env.get("RTDN_BEARER_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Subscription notification types from Google Play
// https://developer.android.com/google/play/billing/rtdn-reference
const NOTIFICATION_TYPE: Record<number, string> = {
  1: "SUBSCRIPTION_RECOVERED",
  2: "SUBSCRIPTION_RENEWED",
  3: "SUBSCRIPTION_CANCELED",
  4: "SUBSCRIPTION_PURCHASED",
  5: "SUBSCRIPTION_ON_HOLD",
  6: "SUBSCRIPTION_IN_GRACE_PERIOD",
  7: "SUBSCRIPTION_RESTARTED",
  8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED",
  9: "SUBSCRIPTION_DEFERRED",
  10: "SUBSCRIPTION_PAUSED",
  11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED",
  12: "SUBSCRIPTION_REVOKED",
  13: "SUBSCRIPTION_EXPIRED",
};

// Map notification type → entitlement status
function resolveStatus(notificationType: number): string | null {
  switch (notificationType) {
    case 1: // RECOVERED
    case 2: // RENEWED
    case 4: // PURCHASED
    case 7: // RESTARTED
      return "active";
    case 3: // CANCELED
    case 12: // REVOKED
      return "cancelled";
    case 5: // ON_HOLD
      return "on_hold";
    case 6: // IN_GRACE_PERIOD
      return "grace_period";
    case 10: // PAUSED
      return "paused";
    case 13: // EXPIRED
      return "expired";
    default:
      return null; // No DB update needed
  }
}

Deno.serve(async (req: Request) => {
  // Validate bearer token to ensure this is a genuine Pub/Sub push
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (bearer !== RTDN_BEARER) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();

    // Pub/Sub wraps the actual RTDN message in a base64 `data` field
    const messageData = body?.message?.data;
    if (!messageData) {
      return new Response("Bad Request: no message data", { status: 400 });
    }

    const decoded = atob(messageData);
    const rtdn = JSON.parse(decoded);

    const subscriptionNotification = rtdn.subscriptionNotification;
    if (!subscriptionNotification) {
      // Ignore test notifications and one-time purchase notifications
      return new Response("OK", { status: 200 });
    }

    const { notificationType, purchaseToken, subscriptionId } =
      subscriptionNotification as {
        notificationType: number;
        purchaseToken: string;
        subscriptionId: string;
      };

    const notificationName = NOTIFICATION_TYPE[notificationType] ?? "UNKNOWN";
    const newStatus = resolveStatus(notificationType);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Log the event for auditing
    await supabase.from("billing_events").insert({
      notification_type: notificationName,
      purchase_token: purchaseToken,
      product_id: subscriptionId,
      payload: rtdn,
    });

    if (!newStatus) {
      // Event type that doesn't require a status update (e.g., price change)
      return new Response("OK", { status: 200 });
    }

    // Find the entitlement by purchase_token
    const { data: tokenRow } = await supabase
      .from("purchase_tokens")
      .select("user_id")
      .eq("purchase_token", purchaseToken)
      .maybeSingle();

    if (!tokenRow?.user_id) {
      // Unknown token – may be from a test; log and ignore
      console.warn("[billing-webhook] Unknown purchase token:", purchaseToken);
      return new Response("OK", { status: 200 });
    }

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // When cancelled or expired, clear tier to free
    if (newStatus === "cancelled" || newStatus === "expired") {
      updatePayload.tier = "free";
      updatePayload.plan_id = null;
    }

    await supabase
      .from("entitlements")
      .update(updatePayload)
      .eq("user_id", tokenRow.user_id);

    return new Response("OK", { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[billing-webhook]", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
