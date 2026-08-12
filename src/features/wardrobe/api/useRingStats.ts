import { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { fetchSupabaseRows } from "@/shared/supabase/use-supabase-query";
import { useUser } from "@clerk/clerk-expo";

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

export function useRingStats(
  period: "daily" | "weekly" | "monthly" | "90_days" = "weekly",
  totalItems: number = 0,
  currentStreak: number = 0,
  wardrobeLimit: number = 50
) {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [stats, setStats] = useState<RingStats>({
    usagePercent: 0,
    avgWearsPercent: 0,
    streakPercent: 0,
    totalItemsPercent: 0,
    raw: {
      usagePercentNum: 0,
      avgWears: 0,
      streakCount: 0,
      totalItems: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Keep store-derived props (which change on wardrobe/streak churn) out of the
  // effect deps so syncing the wardrobe doesn't re-fire this query every time.
  const totalItemsRef = useRef(totalItems);
  totalItemsRef.current = totalItems;
  const currentStreakRef = useRef(currentStreak);
  currentStreakRef.current = currentStreak;

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      if (!supabase || !user) return;
      setIsLoading(true);

      try {
        // 1. Total items are now passed as a prop, no need to query
        const total = totalItemsRef.current || 0;

        // 2. Set time filter based on period
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

        // 3. Get wear logs for the period (shared 30s cache, keyed by period).
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

        const logs = periodLogs;

        // 4. Calculate Usage %
        const uniqueItemsWorn = new Set(logs.map((log) => log.item_id)).size;
        const usagePercentNum = total > 0 ? Math.round((uniqueItemsWorn / total) * 100) : 0;

        // 5. Calculate Avg Wears
        const avgWears = uniqueItemsWorn > 0 ? +(logs.length / uniqueItemsWorn).toFixed(1) : 0;

        // 6. Calculate Streak based on passed currentStreak
        const streakCount = currentStreakRef.current;
        const daysInPeriod = getDaysInPeriod(period);
        // If daily and streak > 0, 100%. Otherwise normalize by period days.
        let streakPercent = 0;
        if (period === "daily") {
          streakPercent = streakCount > 0 ? 1 : 0;
        } else {
          streakPercent = Math.min(streakCount / daysInPeriod, 1);
        }

        if (isMounted) {
          setStats({
            usagePercent: usagePercentNum / 100, // 0-1 for ring
            avgWearsPercent: Math.min(avgWears / AVG_WEARS_GOAL, 1),
            streakPercent,
            totalItemsPercent: Math.min(total / wardrobeLimit, 1),
            raw: {
              usagePercentNum,
              avgWears,
              streakCount,
              totalItems: total,
            },
          });
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
    // totalItems/currentStreak intentionally excluded — read via refs above.
     
  }, [supabase, user, period, wardrobeLimit]);

  return { stats, isLoading };
}
