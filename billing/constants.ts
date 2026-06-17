import type { SubscriptionPlan } from "./types";

// ─── Google Play Product IDs ─────────────────────────────────────────────────
// These must exactly match the Product IDs created in Play Console →
// Monetize → Subscriptions

export const PRODUCT_IDS = {
  PRO_MONTHLY: "lookai_pro_monthly",
  PRO_YEARLY: "lookai_pro_yearly",
  PREMIUM_MONTHLY: "lookai_premium_monthly",
  PREMIUM_YEARLY: "lookai_premium_yearly",
} as const;

export const ALL_PRODUCT_IDS = Object.values(PRODUCT_IDS);

// ─── Subscription Plans ───────────────────────────────────────────────────────

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "lookai_pro_monthly",
    tier: "pro",
    name: "Pro Monthly",
    description: "Perfect for fashion enthusiasts",
    billingCycle: "monthly",
    priceDisplay: "₹299 / month",
    features: [
      "Unlimited wardrobe items",
      "AI-powered outfit suggestions",
      "50 AI outfit generations / month",
      "Advanced style filters",
      "Save & organise outfits",
      "Priority support",
    ],
    isPopular: true,
  },
  {
    id: "lookai_pro_yearly",
    tier: "pro",
    name: "Pro Yearly",
    description: "Best value for fashion enthusiasts",
    billingCycle: "yearly",
    priceDisplay: "₹2,499 / year",
    yearlyMonthlyEquivalent: "₹208 / month",
    savingsPercent: 30,
    features: [
      "Everything in Pro Monthly",
      "30% savings vs monthly",
      "Unlimited wardrobe items",
      "AI-powered outfit suggestions",
      "50 AI outfit generations / month",
      "Advanced style filters",
      "Save & organise outfits",
      "Priority support",
    ],
  },
  {
    id: "lookai_premium_monthly",
    tier: "premium",
    name: "Premium Monthly",
    description: "For the ultimate style experience",
    billingCycle: "monthly",
    priceDisplay: "₹699 / month",
    features: [
      "Everything in Pro",
      "Unlimited AI outfit generations",
      "Personal style profile",
      "Exclusive seasonal lookbooks",
      "Early access to new features",
      "Dedicated support",
    ],
  },
  {
    id: "lookai_premium_yearly",
    tier: "premium",
    name: "Premium Yearly",
    description: "Best value for the ultimate experience",
    billingCycle: "yearly",
    priceDisplay: "₹5,999 / year",
    yearlyMonthlyEquivalent: "₹499 / month",
    savingsPercent: 29,
    features: [
      "Everything in Premium Monthly",
      "29% savings vs monthly",
      "Unlimited AI outfit generations",
      "Personal style profile",
      "Exclusive seasonal lookbooks",
      "Early access to new features",
      "Dedicated support",
    ],
  },
];

export const PLAN_MAP: Record<string, SubscriptionPlan> = Object.fromEntries(
  SUBSCRIPTION_PLANS.map((p) => [p.id, p]),
);

// ─── Free tier feature list ───────────────────────────────────────────────────

export const FREE_FEATURES = [
  "Up to 10 wardrobe items",
  "Basic outfit suggestions",
  "3 AI outfit generations / month",
  "Standard filters",
];

// ─── Grace period / retry config ─────────────────────────────────────────────

export const GRACE_PERIOD_DAYS = 3;
