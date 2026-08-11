import { useRevenueCat } from "@/features/payments/model/useRevenueCat";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert } from "react-native";

export const FREE_WARDROBE_LIMIT = 50;
export const PRO_WARDROBE_LIMIT = 200;
export const CLOTH_LABEL_LIMIT = 20;
export const FIT_CHECK_LIMIT = 20;

export function usePremiumLimits() {
  const { isPro } = useRevenueCat();
  const router = useRouter();

  const wardrobeItems = useUserWardrobeStore((state) => state.items);
  const scans = useScanHistoryStore((state) => state.scans);

  const wardrobeCount = wardrobeItems.length;

  // Single pass over scans, memoized so limit checks don't rescan on every render.
  const { clothLabelCount, fitCheckCount } = useMemo(() => {
    let clothLabelCount = 0;
    let fitCheckCount = 0;
    for (const scan of scans) {
      if (scan.type === "label") clothLabelCount += 1;
      else if (scan.type === "fit-check") fitCheckCount += 1;
    }
    return { clothLabelCount, fitCheckCount };
  }, [scans]);

  const wardrobeLimit = isPro ? PRO_WARDROBE_LIMIT : FREE_WARDROBE_LIMIT;
  const canAddWardrobe = wardrobeCount < wardrobeLimit;
  const canAddClothLabel = isPro || clothLabelCount < CLOTH_LABEL_LIMIT;
  const canAddFitCheck = isPro || fitCheckCount < FIT_CHECK_LIMIT;

  const handleLimitReached = (limitType: "wardrobe" | "cloth_label" | "fit_check") => {
    let limit = 0;
    let feature = "";

    if (limitType === "wardrobe") {
      limit = wardrobeLimit;
      feature = "clothes/accessories";
    } else if (limitType === "cloth_label") {
      limit = CLOTH_LABEL_LIMIT;
      feature = "cloth labels";
    } else if (limitType === "fit_check") {
      limit = FIT_CHECK_LIMIT;
      feature = "fit checks";
    }

    Alert.alert(
      "Storage Limit Reached",
      `You have reached the free limit of ${limit} saved ${feature}. Please upgrade to Pro to save unlimited items.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade to Pro",
          onPress: () => router.push("/(root)/(subscription)/subscription" as never),
        },
      ]
    );
  };

  return {
    isPro,
    wardrobeCount,
    wardrobeLimit,
    clothLabelCount,
    fitCheckCount,
    canAddWardrobe,
    canAddClothLabel,
    canAddFitCheck,
    handleLimitReached,
  };
}
