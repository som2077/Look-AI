import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from "react-native-purchases";

// Replace with your RevenueCat public SDK keys
const API_KEYS = {
  apple: "appl_YOUR_APPLE_API_KEY", // Note: Need iOS key if testing on iPhone
  google:
    process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ||
    "goog_KJiQaosYUzixpRCyrMaNVDyRsKI",
};

export function useRevenueCat() {
  const { userId } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        const isAndroid = Platform.OS === "android";
        const isIOS = Platform.OS === "ios";
        const key = isAndroid ? API_KEYS.google : API_KEYS.apple;
        
        // Skip configure if it's the dummy key to prevent annoying crash logs
        const isDummyKey = key.includes("goog_KJiQaos") || key.includes("appl_YOUR_APPLE");

        if (!isDummyKey) {
          if (isAndroid) {
            Purchases.configure({
              apiKey: API_KEYS.google,
              appUserID: userId || undefined,
            });
          } else if (isIOS) {
            Purchases.configure({
              apiKey: API_KEYS.apple,
              appUserID: userId || undefined,
            });
          }

          // Fetch offerings (Monthly/Yearly)
          try {
            const offerings = await Purchases.getOfferings();
            if (
              offerings.current !== null &&
              offerings.current.availablePackages.length !== 0
            ) {
              setPackages(offerings.current.availablePackages);
            }
          } catch (offeringsError) {
            console.warn("RevenueCat: No offerings configured yet in the dashboard. Skipping offerings fetch.");
          }
        } else {
          console.warn("RevenueCat: Dummy API key detected. Skipping init to prevent errors.");
        }

        // Fetch customer info
        if (!isDummyKey) {
          try {
            const customerInfo = await Purchases.getCustomerInfo();
            checkProStatus(customerInfo);
          } catch (e) {
            console.warn("RevenueCat: Could not fetch customer info.");
          }
        }

        setIsReady(true);
      } catch (e) {
        console.error("RevenueCat Init Error:", e);
      }
    };

    init();
  }, [userId]);

  // Listen for purchase updates
  useEffect(() => {
    const customerInfoUpdated = async (purchaserInfo: CustomerInfo) => {
      checkProStatus(purchaserInfo);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdated);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdated);
    };
  }, []);

  const checkProStatus = (customerInfo: CustomerInfo) => {
    // "pro" is the default entitlement ID in RevenueCat. Change if needed.
    if (typeof customerInfo.entitlements.active.pro !== "undefined") {
      setIsPro(true);
    } else {
      setIsPro(false);
    }
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      checkProStatus(customerInfo);
      return true;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
      }
      return false;
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      checkProStatus(customerInfo);
      return true;
    } catch (e: any) {
      console.error("Restore error:", e);
      return false;
    }
  };

  return { isPro, packages, purchasePackage, restorePurchases, isReady };
}
