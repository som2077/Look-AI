import { useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { fetchSupabaseRows } from "@/shared/supabase/use-supabase-query";
import { useUser } from "@clerk/clerk-expo";
import { useUserOutfitsStore } from "@/features/outfits/model/user-outfits-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";

export interface RingStats {
  usagePercent: number;
  avgWearsPercent: number; // Normalized to 0-1 (e.g., avg / 10)
  streakPercent: number; // 0-1
  totalItemsPercent: number; // 0-1 (e.g., total / 50)
  raw: {
    usagePercentNum: number; // e.g. 85 for 85%
    avgWears: number;
    streakCount: number;
    totalItems: number;
  };
}

const AVG_WEARS_GOAL = 10;

// Helper to get number of days in current period
const getDaysInPeriod = (period: "daily" | "weekly" | "monthly" | "90_days"): number => {
  if (period === "daily") return 1;
  if (period === "weekly") return 7;
  if (period === "monthly") return 30;
  return 90; // for '90_days'
};

const getPeriodStartTime = (period: "daily" | "weekly" | "monthly" | "90_days"): Date => {
  const now = new Date();
  const startTime = new Date();
  if (period === "daily") {
    startTime.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    startTime.setDate(now.getDate() - 7);
  } else if (period === "monthly") {
    startTime.setDate(now.getDate() - 30);
  } else {
    startTime.setDate(now.getDate() - 90);
  }
  return startTime;
};

export function useRingStats(
  period: "daily" | "weekly" | "monthly" | "90_days" = "weekly",
  totalItems: number = 0,
  currentStreak: number = 0,
  wardrobeLimit: number = 50
) {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const userOutfits = useUserOutfitsStore((state) => state.outfits);
  const wardrobeItems = useUserWardrobeStore((state) => state.items);
  const wardrobeOutfits = useUserWardrobeStore((state) => state.outfits);

  const [wearLogs, setWearLogs] = useState<{ item_id: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      if (!supabase || !user) return;
      setIsLoading(true);

      try {
        const now = new Date();
        const startTime = getPeriodStartTime(period);

        // Get wear logs for the period (shared 30s cache, keyed by period).
        const periodLogs = await fetchSupabaseRows<{ item_id: string }>({
          supabase,
          table: "wear_logs",
          select: "item_id",
          userId: user.id,
          cacheKeySuffix: period,
          apply: (q) =>
            q
              .eq("user_id", user.id)
              .gte("worn_at", startTime.toISOString())
              .lte("worn_at", now.toISOString())
              .limit(500), // bound the read — enough for usage/avg stats at scale
        });

        if (isMounted) {
          setWearLogs(periodLogs || []);
        }
      } catch (err) {
        console.error("Error fetching ring stats:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [supabase, user, period]);

  const stats = useMemo<RingStats>(() => {
    const total = totalItems || wardrobeItems.length || 0;
    const now = new Date();
    const startTime = getPeriodStartTime(period);
    const startMs = startTime.getTime();
    const nowMs = now.getTime();

    const wornItemIds = new Set<string>();
    let totalWearInstances = 0;

    // 1. From Supabase wear_logs
    wearLogs.forEach((log) => {
      if (log.item_id) {
        wornItemIds.add(log.item_id);
        totalWearInstances++;
      }
    });

    // 2. From useUserOutfitsStore outfits
    userOutfits.forEach((outfit) => {
      let isWithinPeriod = false;
      if (outfit.scheduledDate) {
        const parts = outfit.scheduledDate.split("-");
        const outfitDate = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10),
        );
        outfitDate.setHours(23, 59, 59, 999);
        if (outfitDate.getTime() <= nowMs && outfitDate.getTime() >= startMs) {
          isWithinPeriod = true;
        }
      } else if (outfit.createdAt >= startMs && outfit.createdAt <= nowMs) {
        isWithinPeriod = true;
      }

      if (isWithinPeriod && Array.isArray(outfit.items)) {
        outfit.items.forEach((itemId) => {
          wornItemIds.add(itemId);
          totalWearInstances++;
        });
      }
    });

    // 3. From useUserWardrobeStore wardrobeOutfits
    wardrobeOutfits.forEach((outfit) => {
      const createdAtMs = new Date(outfit.createdAt).getTime();
      if (createdAtMs >= startMs && createdAtMs <= nowMs && Array.isArray(outfit.itemIds)) {
        outfit.itemIds.forEach((itemId) => {
          wornItemIds.add(itemId);
          totalWearInstances++;
        });
      }
    });

    // 4. From wardrobeItems with lastWornDate
    wardrobeItems.forEach((item) => {
      if (item.lastWornDate) {
        const lastWornMs = new Date(item.lastWornDate).getTime();
        if (lastWornMs >= startMs && lastWornMs <= nowMs) {
          wornItemIds.add(item.id);
          totalWearInstances += Math.max(1, item.wearCount || 1);
        }
      }
    });

    const uniqueItemsWorn = wornItemIds.size;
    const rawUsageFraction = total > 0 ? uniqueItemsWorn / total : 0;
    const usagePercentNum = total > 0 ? Math.min(100, Math.round(rawUsageFraction * 100)) : 0;
    const avgWears = uniqueItemsWorn > 0 ? +(totalWearInstances / uniqueItemsWorn).toFixed(1) : 0;

    const daysInPeriod = getDaysInPeriod(period);
    let streakPercent = 0;
    if (period === "daily") {
      streakPercent = currentStreak > 0 ? 1 : 0;
    } else {
      streakPercent = Math.min(currentStreak / daysInPeriod, 1);
    }

    return {
      usagePercent: Math.min(1, rawUsageFraction), // 0-1 for ring
      avgWearsPercent: Math.min(avgWears / AVG_WEARS_GOAL, 1),
      streakPercent,
      totalItemsPercent: wardrobeLimit > 0 ? Math.min(total / wardrobeLimit, 1) : 0,
      raw: {
        usagePercentNum,
        avgWears,
        streakCount: currentStreak,
        totalItems: total,
      },
    };
  }, [wearLogs, totalItems, wardrobeItems, userOutfits, wardrobeOutfits, currentStreak, wardrobeLimit, period]);

  return { stats, isLoading };
}
