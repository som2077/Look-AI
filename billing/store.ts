/**
 * billing/store.ts – Zustand store that manages the full Google Play Billing
 * lifecycle: connection, purchases, verification, entitlement sync, and restore.
 */

import { create } from "zustand";
import { Platform, Alert } from "react-native";
import type { Purchase, PurchaseError } from "react-native-iap";
import { BillingService, mapIAPPurchase } from "./BillingService";
import {
  verifyPurchase,
  fetchEntitlement,
  isEntitlementActive,
} from "@/backend/api/entitlement";
import type { BillingState, Entitlement, SubscriptionPlanId } from "./types";
import { PLAN_MAP } from "./constants";

// ─── Store actions interface ─────────────────────────────────────────────────

type GetClerkToken = () => Promise<string | null>;

interface BillingActions {
  initBilling: (userId: string, getToken: GetClerkToken) => Promise<void>;
  purchasePlan: (
    productId: SubscriptionPlanId,
    userId: string,
    clerkToken: string,
  ) => Promise<void>;
  restorePurchases: (userId: string, clerkToken: string) => Promise<void>;
  refreshEntitlement: (userId: string, clerkToken: string) => Promise<void>;
  clearError: () => void;
  teardown: () => Promise<void>;
}

type BillingStore = BillingState & BillingActions;

// ─── Guard: prevent duplicate initBilling calls for the same user ─────────────
let _initializedForUser: string | null = null;
let _getClerkToken: GetClerkToken = async () => null;

const ANDROID_ONLY_MSG =
  "Google Play subscriptions are currently available on Android only.";

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBillingStore = create<BillingStore>((set, get) => ({
  entitlement: null,
  isLoading: false,
  isPurchasing: false,
  isRestoring: false,
  error: null,
  billingReady: false,

  // ── Init: connect to GPB + register listeners + load entitlement ──────────
  initBilling: async (userId, getToken) => {
    _getClerkToken = getToken;

    if (Platform.OS !== "android") {
      set({ billingReady: false, isLoading: false });
      return;
    }

    if (_initializedForUser === userId && get().billingReady) return;
    _initializedForUser = userId;

    set({ isLoading: true, error: null });

    try {
      const connected = await BillingService.connect();
      if (!connected) {
        set({ billingReady: false, isLoading: false });
        return;
      }

      // Register purchase listeners once
      BillingService.addPurchaseListeners(
        async (purchase: Purchase) => {
          const mapped = mapIAPPurchase(purchase);

          // Only process fully purchased (not pending) transactions
          if (mapped.purchaseState !== "purchased") return;

          set({ isPurchasing: true });

          try {
            const clerkToken = await _getClerkToken();
            if (!clerkToken) {
              set({
                error: "Authentication expired. Please sign in again.",
                isPurchasing: false,
              });
              return;
            }

            const result = await verifyPurchase(
              {
                userId,
                productId: mapped.productId,
                purchaseToken: mapped.purchaseToken,
                orderId: mapped.orderId,
              },
              clerkToken,
            );

            if (result.success) {
              // Acknowledge the purchase with Google Play (mandatory)
              await BillingService.acknowledgePurchase(purchase);
              if (result.entitlement) {
                set({ entitlement: result.entitlement });
              }
            } else {
              set({ error: result.error ?? "Purchase verification failed" });
            }
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : "Purchase processing failed";
            set({ error: msg });
          } finally {
            set({ isPurchasing: false });
          }
        },
        (error: PurchaseError) => {
          // E_USER_CANCELLED is normal user behaviour, not an error
          if (error.code !== "E_USER_CANCELLED") {
            set({
              error: error.message ?? "Purchase failed",
              isPurchasing: false,
            });
          } else {
            set({ isPurchasing: false });
          }
        },
      );

      set({ billingReady: true });

      const clerkToken = await _getClerkToken();
      if (clerkToken) {
        await get().refreshEntitlement(userId, clerkToken);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Billing init failed";
      set({ error: msg, billingReady: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Purchase a subscription plan ─────────────────────────────────────────
  purchasePlan: async (productId, _userId, _clerkToken) => {
    if (Platform.OS !== "android") {
      Alert.alert("Not Available", ANDROID_ONLY_MSG);
      return;
    }

    if (!get().billingReady) {
      Alert.alert("Store not ready", "Please wait a moment and try again.");
      return;
    }

    set({ isPurchasing: true, error: null });

    try {
      // Fetch the product to get the offer token (required for Android 12+)
      const products = await BillingService.getProducts();
      const product = products.find((p) => p.productId === productId);
      const offerToken = product
        ? BillingService.getOfferToken(product)
        : undefined;

      await BillingService.purchaseSubscription(productId, offerToken);
      // Result is handled asynchronously by the purchaseUpdatedListener above
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start purchase";
      set({ error: msg, isPurchasing: false });
    }
  },

  // ── Restore purchases ────────────────────────────────────────────────────
  restorePurchases: async (userId, clerkToken) => {
    if (Platform.OS !== "android") {
      Alert.alert("Not Available", ANDROID_ONLY_MSG);
      return;
    }

    if (!get().billingReady) return;

    set({ isRestoring: true, error: null });

    try {
      const purchases = await BillingService.restorePurchases();

      if (purchases.length === 0) {
        Alert.alert(
          "No purchases found",
          "No active subscriptions were found on this account.",
        );
        return;
      }

      // Verify the most recent purchase with the server
      const latest = purchases[purchases.length - 1];
      const result = await verifyPurchase(
        {
          userId,
          productId: latest.productId,
          purchaseToken: latest.purchaseToken,
          orderId: latest.orderId,
        },
        clerkToken,
      );

      if (result.success && result.entitlement) {
        set({ entitlement: result.entitlement });
        Alert.alert(
          "Restored!",
          "Your subscription has been restored successfully.",
        );
      } else {
        Alert.alert(
          "Restore failed",
          result.error ?? "Could not verify your purchase.",
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Restore failed";
      set({ error: msg });
    } finally {
      set({ isRestoring: false });
    }
  },

  // ── Refresh entitlement from Supabase ───────────────────────────────────
  refreshEntitlement: async (userId, clerkToken) => {
    try {
      const entitlement = await fetchEntitlement(userId, clerkToken);
      set({ entitlement });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to load subscription";
      set({ error: msg });
    }
  },

  clearError: () => set({ error: null }),

  // ── Teardown: disconnect billing on app unmount ──────────────────────────
  teardown: async () => {
    await BillingService.disconnect();
    _initializedForUser = null;
    set({ billingReady: false });
  },
}));

// ─── Convenience selectors ────────────────────────────────────────────────────

export function selectIsPremium(entitlement: Entitlement | null): boolean {
  return isEntitlementActive(entitlement);
}

export function selectPlanName(entitlement: Entitlement | null): string {
  if (!isEntitlementActive(entitlement) || !entitlement?.planId) return "Free";
  return PLAN_MAP[entitlement.planId]?.name ?? "Pro";
}
