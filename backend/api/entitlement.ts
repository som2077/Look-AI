/**
 * entitlement.ts – Supabase-backed entitlement API.
 *
 * All mutations that grant or verify premium access go through the
 * Supabase Edge Function "verify-purchase" (server-side Google Play
 * receipt verification) so the client can never self-grant premium.
 */

import { createSupabaseClient } from "./supabase";
import type {
  Entitlement,
  VerifyPurchaseRequest,
  VerifyPurchaseResponse,
} from "@/billing/types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ─── Verify purchase with server ─────────────────────────────────────────────
// Calls the Supabase Edge Function which verifies the purchase token against
// the Google Play Developer API and updates the entitlements table.

export async function verifyPurchase(
  payload: VerifyPurchaseRequest,
  clerkToken: string,
): Promise<VerifyPurchaseResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clerkToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    return { success: false, error: `Verification failed (${response.status}): ${body}` };
  }

  return response.json() as Promise<VerifyPurchaseResponse>;
}

// ─── Fetch current entitlement for a user ────────────────────────────────────

export async function fetchEntitlement(
  userId: string,
  clerkToken: string,
): Promise<Entitlement | null> {
  const supabase = createSupabaseClient(() => Promise.resolve(clerkToken));

  const { data, error } = await supabase
    .from("entitlements")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier,
    planId: data.plan_id,
    status: data.status,
    purchaseToken: data.purchase_token,
    orderId: data.order_id,
    expiresAt: data.expires_at,
    gracePeriodEndsAt: data.grace_period_ends_at,
    isAutoRenewing: data.is_auto_renewing ?? false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } satisfies Entitlement;
}

// ─── Entitlement helpers ─────────────────────────────────────────────────────

export function isEntitlementActive(entitlement: Entitlement | null): boolean {
  if (!entitlement) return false;
  if (entitlement.status === "active") {
    if (!entitlement.expiresAt) return true;
    return new Date(entitlement.expiresAt) > new Date();
  }
  if (entitlement.status === "grace_period") {
    if (!entitlement.gracePeriodEndsAt) return true;
    return new Date(entitlement.gracePeriodEndsAt) > new Date();
  }
  return false;
}

export function getEntitlementTier(entitlement: Entitlement | null) {
  if (!isEntitlementActive(entitlement)) return "free" as const;
  return entitlement!.tier;
}
