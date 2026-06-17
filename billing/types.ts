// ─── Google Play Billing – Core Types ────────────────────────────────────────

export type SubscriptionPlanId =
  | "lookai_pro_monthly"
  | "lookai_pro_yearly"
  | "lookai_premium_monthly"
  | "lookai_premium_yearly";

export type PlanTier = "free" | "pro" | "premium";

export type BillingCycle = "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "expired"
  | "cancelled"
  | "pending"
  | "grace_period"
  | "on_hold"
  | "paused";

export type PurchaseState =
  | "purchased"
  | "pending"
  | "unspecified";

// ─── Plan Definition ──────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  tier: PlanTier;
  name: string;
  description: string;
  billingCycle: BillingCycle;
  priceDisplay: string;
  yearlyMonthlyEquivalent?: string;
  savingsPercent?: number;
  features: string[];
  isPopular?: boolean;
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

export interface GPBPurchase {
  productId: string;
  purchaseToken: string;
  purchaseState: PurchaseState;
  acknowledged: boolean;
  autoRenewing: boolean;
  orderId: string;
  purchaseTime: number;
  expiryTimeMillis?: number;
}

// ─── Entitlement (DB-synced) ──────────────────────────────────────────────────

export interface Entitlement {
  id: string;
  userId: string;
  tier: PlanTier;
  planId: SubscriptionPlanId | null;
  status: SubscriptionStatus;
  purchaseToken: string | null;
  orderId: string | null;
  expiresAt: string | null;
  gracePeriodEndsAt: string | null;
  isAutoRenewing: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Verification ─────────────────────────────────────────────────────────────

export interface VerifyPurchaseRequest {
  userId: string;
  productId: string;
  purchaseToken: string;
  orderId: string;
}

export interface VerifyPurchaseResponse {
  success: boolean;
  entitlement?: Entitlement;
  error?: string;
}

// ─── Billing Store State ──────────────────────────────────────────────────────

export interface BillingState {
  entitlement: Entitlement | null;
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
  billingReady: boolean;
}
