/**
 * billing/hooks.ts – Convenience hooks derived from the billing store.
 * All computations are memoised so components only re-render when relevant
 * state actually changes.
 */

import { useMemo } from "react";
import { useBillingStore } from "./store";
import { PLAN_MAP, GRACE_PERIOD_DAYS } from "./constants";
import type { Entitlement, PlanTier, SubscriptionStatus } from "./types";

// ─── Days until a date ────────────────────────────────────────────────────────

function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Main billing-status hook ─────────────────────────────────────────────────

export interface BillingStatus {
  tier: PlanTier;
  planName: string;
  status: SubscriptionStatus | "free";
  isActive: boolean;
  isGracePeriod: boolean;
  isPending: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  daysUntilGraceEnd: number | null;
  isAutoRenewing: boolean;
  showExpiryWarning: boolean;
  showGraceBanner: boolean;
  entitlement: Entitlement | null;
}

export function useBillingStatus(): BillingStatus {
  const entitlement = useBillingStore((s) => s.entitlement);

  return useMemo<BillingStatus>(() => {
    if (!entitlement || entitlement.tier === "free") {
      return {
        tier: "free",
        planName: "Free",
        status: "free",
        isActive: false,
        isGracePeriod: false,
        isPending: false,
        isCancelled: false,
        isExpired: false,
        daysUntilExpiry: null,
        daysUntilGraceEnd: null,
        isAutoRenewing: false,
        showExpiryWarning: false,
        showGraceBanner: false,
        entitlement: null,
      };
    }

    const status = entitlement.status;
    const isActive = status === "active";
    const isGracePeriod = status === "grace_period";
    const isPending = status === "pending";
    const isCancelled = status === "cancelled";
    const isExpired = status === "expired";

    const daysUntilExpiry = daysUntil(entitlement.expiresAt);
    const daysUntilGraceEnd = daysUntil(entitlement.gracePeriodEndsAt);

    // Warn if expiring within 3 days and NOT auto-renewing
    const showExpiryWarning =
      isActive &&
      !entitlement.isAutoRenewing &&
      daysUntilExpiry !== null &&
      daysUntilExpiry <= GRACE_PERIOD_DAYS;

    const showGraceBanner = isGracePeriod;

    const planName = entitlement.planId
      ? (PLAN_MAP[entitlement.planId]?.name ?? "Pro")
      : "Pro";

    return {
      tier: entitlement.tier,
      planName,
      status,
      isActive,
      isGracePeriod,
      isPending,
      isCancelled,
      isExpired,
      daysUntilExpiry,
      daysUntilGraceEnd,
      isAutoRenewing: entitlement.isAutoRenewing,
      showExpiryWarning,
      showGraceBanner,
      entitlement,
    };
  }, [entitlement]);
}
