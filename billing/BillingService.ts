/**
 * BillingService – Thin wrapper around react-native-iap for Google Play Billing.
 *
 * Responsibilities:
 *  1. Initialize the Google Play Billing connection.
 *  2. Fetch subscription SKU details from the store.
 *  3. Initiate a subscription purchase flow.
 *  4. Acknowledge purchases (mandatory for Google Play policy compliance).
 *  5. Restore existing purchases on the device.
 *  6. Clean up the billing connection.
 *
 * NOTE: All server-side receipt verification is handled by the Supabase Edge
 * Function "verify-purchase". This service only handles the client-side
 * Google Play Billing API surface.
 */

import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  type Subscription,
  type Purchase,
  type PurchaseError,
  type SubscriptionAndroid,
} from "react-native-iap";
import { Platform } from "react-native";
import { ALL_PRODUCT_IDS } from "./constants";
import type { GPBPurchase, PurchaseState } from "./types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function mapPurchaseState(state: number | undefined): PurchaseState {
  if (state === 1) return "purchased";
  if (state === 2) return "pending";
  return "unspecified";
}

function toPurchaseState(raw: number | undefined): PurchaseState {
  return mapPurchaseState(raw);
}

export function mapIAPPurchase(p: Purchase): GPBPurchase {
  return {
    productId: p.productId,
    purchaseToken:
      (p as Purchase & { purchaseToken?: string }).purchaseToken ?? "",
    purchaseState: toPurchaseState(
      (p as Purchase & { purchaseStateAndroid?: number }).purchaseStateAndroid,
    ),
    acknowledged: !!(p as Purchase & { isAcknowledgedAndroid?: boolean })
      .isAcknowledgedAndroid,
    autoRenewing: !!(p as Purchase & { autoRenewingAndroid?: boolean })
      .autoRenewingAndroid,
    orderId: p.transactionId ?? "",
    purchaseTime: Number(p.transactionDate ?? 0),
  };
}

// ─── Billing Service ──────────────────────────────────────────────────────────

class BillingServiceClass {
  private _connected = false;
  private _purchaseUpdateSub: ReturnType<
    typeof purchaseUpdatedListener
  > | null = null;
  private _purchaseErrorSub: ReturnType<typeof purchaseErrorListener> | null =
    null;

  get isConnected() {
    return this._connected;
  }

  // ── 1. Connect to Google Play Billing ──────────────────────────────────────

  async connect(): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
      await initConnection();
      this._connected = true;
      return true;
    } catch (e) {
      console.error("[BillingService] connect failed:", e);
      return false;
    }
  }

  // ── 2. Fetch SKU details ───────────────────────────────────────────────────

  async getProducts(): Promise<Subscription[]> {
    if (!this._connected) return [];
    try {
      const products = await getSubscriptions({ skus: ALL_PRODUCT_IDS });
      return products;
    } catch (e) {
      console.error("[BillingService] getProducts failed:", e);
      return [];
    }
  }

  // ── 3. Initiate purchase flow ──────────────────────────────────────────────

  async purchaseSubscription(
    productId: string,
    offerToken?: string,
  ): Promise<void> {
    if (!this._connected) throw new Error("Billing not connected");

    if (offerToken) {
      // Android 12+ requires offer tokens for base plans
      await requestSubscription({
        sku: productId,
        subscriptionOffers: [{ sku: productId, offerToken }],
      });
    } else {
      await requestSubscription({ sku: productId });
    }
    // The actual purchase result comes via purchaseUpdatedListener
  }

  // ── 4. Acknowledge / consume a purchase ───────────────────────────────────

  async acknowledgePurchase(purchase: Purchase): Promise<void> {
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (e) {
      console.error("[BillingService] acknowledgePurchase failed:", e);
    }
  }

  // ── 5. Restore purchases ──────────────────────────────────────────────────

  async restorePurchases(): Promise<GPBPurchase[]> {
    if (!this._connected) return [];
    try {
      const available = await getAvailablePurchases();
      return available.map(mapIAPPurchase);
    } catch (e) {
      console.error("[BillingService] restorePurchases failed:", e);
      return [];
    }
  }

  // ── 6. Register purchase listeners ────────────────────────────────────────

  addPurchaseListeners(
    onPurchase: (purchase: Purchase) => Promise<void>,
    onError: (error: PurchaseError) => void,
  ) {
    this._purchaseUpdateSub = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        await onPurchase(purchase);
      },
    );

    this._purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
      onError(error);
    });
  }

  // ── 7. Remove purchase listeners ──────────────────────────────────────────

  removePurchaseListeners() {
    this._purchaseUpdateSub?.remove();
    this._purchaseErrorSub?.remove();
    this._purchaseUpdateSub = null;
    this._purchaseErrorSub = null;
  }

  // ── 8. Disconnect ─────────────────────────────────────────────────────────

  async disconnect(): Promise<void> {
    this.removePurchaseListeners();
    if (this._connected) {
      try {
        await endConnection();
      } catch {}
      // intentional empty catch — disconnect should never throw to the caller
      this._connected = false;
    }
  }

  // ── Helper: extract offer token from a product ────────────────────────────

  getOfferToken(product: Subscription): string | undefined {
    const android = product as SubscriptionAndroid;
    return android.subscriptionOfferDetails?.[0]?.offerToken;
  }
}

export const BillingService = new BillingServiceClass();
