import { useUserOutfitsStore } from "@/features/outfits/model/user-outfits-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { useMemo } from "react";

export interface WardrobeSummary {
  readonly periodLabel: string;
  readonly wornPercentage: number;
  readonly totalWorn: number; // Represents total wardrobe items
  readonly wearCount: number; // Total wear instances
  readonly neverCount: number; // Items never worn
}

export const DEFAULT_WARDROBE_SUMMARY: WardrobeSummary = {
  periodLabel: "Weekly",
  wornPercentage: 0,
  totalWorn: 0,
  wearCount: 0,
  neverCount: 0,
};

export const useWardrobeSummary = (
  userId?: string | null,
  period: string = "weekly",
) => {
  const wardrobeItems = useUserWardrobeStore((state) => state.items);
  const outfits = useUserOutfitsStore((state) => state.outfits);

  const summary = useMemo<WardrobeSummary>(() => {
    const totalItems = wardrobeItems.length;

    // Filter outfits based on period
    const now = new Date();
    const startTime = new Date();

    switch (period) {
      case "daily":
        startTime.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        startTime.setDate(now.getDate() - 7);
        break;
      case "monthly":
        startTime.setDate(now.getDate() - 30);
        break;
      case "all":
      default:
        startTime.setTime(0); // Beginning of time
        break;
    }

    // Only count outfits that occurred in the past/today and within the timeframe
    const validOutfits = outfits.filter((outfit) => {
      // If it's scheduled for the future, we don't count it towards past stats yet
      if (outfit.scheduledDate) {
        const parts = outfit.scheduledDate.split("-");
        const outfitDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
        outfitDate.setHours(23, 59, 59, 999);
        if (outfitDate.getTime() > now.getTime()) return false;
        return outfitDate.getTime() >= startTime.getTime();
      }
      // Fallback to createdAt for outfits without scheduledDate
      return (
        outfit.createdAt >= startTime.getTime() &&
        outfit.createdAt <= now.getTime()
      );
    });

    const wornItemIds = new Set<string>();
    let totalWearInstances = 0;

    validOutfits.forEach((outfit) => {
      if (outfit.items && Array.isArray(outfit.items)) {
        outfit.items.forEach((itemId) => {
          wornItemIds.add(itemId);
          totalWearInstances++;
        });
      }
    });

    const uniqueWornCount = wornItemIds.size;
    const neverCount = Math.max(0, totalItems - uniqueWornCount);
    const wornPercentage = totalItems > 0 ? uniqueWornCount / totalItems : 0;

    return {
      periodLabel: formatPeriodLabel(period),
      wornPercentage,
      totalWorn: totalItems, // Using totalWorn for totalItems to maintain compatibility
      wearCount: totalWearInstances,
      neverCount: neverCount,
    };
  }, [wardrobeItems, outfits, period]);

  return {
    summary,
    loading: false, // Local calculation is instant
    error: null,
  };
};

const formatPeriodLabel = (value?: string | null): string => {
  if (!value) return "This period";

  switch (value.toLowerCase()) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    case "all":
      return "All Time";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
};
