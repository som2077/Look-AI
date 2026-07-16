import { useRevenueCat } from "@/features/payments/model/useRevenueCat";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export const WARDROBE_LIMIT = 50;
export const CLOTH_LABEL_LIMIT = 20;
export const FIT_CHECK_LIMIT = 20;

export function usePremiumLimits() {
  const { isPro } = useRevenueCat();
  const router = useRouter();

  const wardrobeItems = useUserWardrobeStore((state) => state.items);
  const scans = useScanHistoryStore((state) => state.scans);

  const wardrobeCount = wardrobeItems.length;
  
  const clothLabelCount = scans.filter((scan) => scan.type === "label").length;
  
  const fitCheckCount = scans.filter((scan) => scan.type === "fit-check").length;

  const canAddWardrobe = isPro || wardrobeCount < WARDROBE_LIMIT;
  const canAddClothLabel = isPro || clothLabelCount < CLOTH_LABEL_LIMIT;
  const canAddFitCheck = isPro || fitCheckCount < FIT_CHECK_LIMIT;

  const handleLimitReached = (limitType: "wardrobe" | "cloth_label" | "fit_check") => {
    let limit = 0;
    let feature = "";

    if (limitType === "wardrobe") {
      limit = WARDROBE_LIMIT;
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
    clothLabelCount,
    fitCheckCount,
    canAddWardrobe,
    canAddClothLabel,
    canAddFitCheck,
    handleLimitReached,
  };
}
