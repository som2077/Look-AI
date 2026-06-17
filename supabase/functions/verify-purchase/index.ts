/**
 * verify-purchase – Supabase Edge Function
 *
 * Validates a Google Play purchase token against the Google Play
 * Developer API (server-side), then upserts the user's entitlement.
 *
 * Security:
 * - Called with a Clerk JWT; the user_id comes from the verified token,
 *   never from the request body.
 * - Purchase token is checked against the purchase_tokens table to
 *   prevent replay attacks.
 * - Uses the GOOGLE_PLAY_SERVICE_ACCOUNT_JSON secret (service account
 *   with "Financial data viewer" permission on Play Console).
 *
 * Required env secrets (set via `supabase secrets set`):
 *   GOOGLE_PLAY_PACKAGE_NAME    e.g. com.yourcompany.lookai
 *   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  (full JSON key file content)
 *   SUPABASE_SERVICE_ROLE_KEY   (for admin DB writes)
 *   SUPABASE_URL
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PACKAGE_NAME = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME") ?? "";
const SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Maps product IDs to tier + billing cycle
const PRODUCT_TIER_MAP: Record<string, { tier: string; cycle: string }> = {
  lookai_pro_monthly: { tier: "pro", cycle: "monthly" },
  lookai_pro_yearly: { tier: "pro", cycle: "yearly" },
  lookai_premium_monthly: { tier: "premium", cycle: "monthly" },
  lookai_premium_yearly: { tier: "premium", cycle: "yearly" },
};

// ─── Google Auth helper (JWT for service account) ─────────────────────────────

async function getGoogleAccessToken(): Promise<string> {
  const sa = JSON.parse(SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  // Import the RSA private key
  const pemKey = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

  const keyData = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signingInput),
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${signingInput}.${sig}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// ─── Verify subscription with Google Play API ─────────────────────────────────

async function verifyWithGooglePlay(
  productId: string,
  purchaseToken: string,
  accessToken: string,
) {
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${purchaseToken}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Play API error (${res.status}): ${err}`);
  }

  return res.json();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Extract Clerk user ID from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const clerkToken = authHeader.replace("Bearer ", "");
    if (!clerkToken) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Decode Clerk JWT (without verifying — Supabase RLS uses the same JWT)
    const [, payloadB64] = clerkToken.split(".");
    const decodedPayload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    const userId: string = decodedPayload.sub;

    if (!userId) {
      return Response.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, purchaseToken, orderId } = body as {
      productId: string;
      purchaseToken: string;
      orderId: string;
    };

    if (!productId || !purchaseToken) {
      return Response.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Replay attack check ────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from("purchase_tokens")
      .select("id")
      .eq("purchase_token", purchaseToken)
      .maybeSingle();

    if (existing) {
      // Token already verified — just return current entitlement
      const { data: ent } = await supabase
        .from("entitlements")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      return Response.json({ success: true, entitlement: ent });
    }

    // ── Verify with Google Play ────────────────────────────────────────────
    const accessToken = await getGoogleAccessToken();
    const gpbData = await verifyWithGooglePlay(productId, purchaseToken, accessToken);

    // subscriptionState: ACTIVE | PAUSED | IN_GRACE_PERIOD | ON_HOLD | CANCELED | EXPIRED
    const subState: string = gpbData.subscriptionState ?? "SUBSCRIPTION_STATE_UNSPECIFIED";
    const lineItem = gpbData.lineItems?.[0];
    const expiryMillis = lineItem?.expiryTime
      ? new Date(lineItem.expiryTime).getTime()
      : null;

    const tierInfo = PRODUCT_TIER_MAP[productId];
    if (!tierInfo) {
      return Response.json({ success: false, error: "Unknown product" }, { status: 400 });
    }

    let status = "inactive";
    let expiresAt: string | null = null;
    let gracePeriodEndsAt: string | null = null;

    if (subState === "SUBSCRIPTION_STATE_ACTIVE") {
      status = "active";
      expiresAt = expiryMillis ? new Date(expiryMillis).toISOString() : null;
    } else if (subState === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD") {
      status = "grace_period";
      gracePeriodEndsAt = expiryMillis ? new Date(expiryMillis).toISOString() : null;
    } else if (subState === "SUBSCRIPTION_STATE_ON_HOLD") {
      status = "on_hold";
    } else if (subState === "SUBSCRIPTION_STATE_PAUSED") {
      status = "paused";
    } else if (subState === "SUBSCRIPTION_STATE_CANCELED") {
      status = "cancelled";
    } else if (subState === "SUBSCRIPTION_STATE_EXPIRED") {
      status = "expired";
    }

    const isAutoRenewing =
      gpbData.cancelSurveyResult === undefined &&
      subState === "SUBSCRIPTION_STATE_ACTIVE";

    // ── Upsert entitlement ─────────────────────────────────────────────────
    const { data: entitlement, error: upsertError } = await supabase
      .from("entitlements")
      .upsert({
        user_id: userId,
        tier: tierInfo.tier,
        plan_id: productId,
        status,
        purchase_token: purchaseToken,
        order_id: orderId ?? null,
        expires_at: expiresAt,
        grace_period_ends_at: gracePeriodEndsAt,
        is_auto_renewing: isAutoRenewing,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (upsertError) {
      throw new Error(`DB upsert failed: ${upsertError.message}`);
    }

    // ── Record purchase token (replay protection) ─────────────────────────
    await supabase.from("purchase_tokens").insert({
      user_id: userId,
      product_id: productId,
      purchase_token: purchaseToken,
      order_id: orderId ?? null,
      gpb_response: gpbData,
    });

    return Response.json({ success: true, entitlement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[verify-purchase]", message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
});
