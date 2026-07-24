import { useState, useEffect } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";
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

const CLOSET_GOAL = 50;
const AVG_WEARS_GOAL = 10;

// Helper to get number of days in current period
const getDaysInPeriod = (period: "daily" | "weekly" | "monthly" | "all"): number => {
  if (period === "daily") return 1;
  if (period === "weekly") return 7;
  if (period === "monthly") return 30;
  return 365; // fallback for 'all' to show some progression
};

// Helper to check streak in Supabase logs
const getCurrentStreak = async (supabase: any, userId: string): Promise<number> => {
  const { data: logs } = await supabase
    .from("wear_logs")
    .select("worn_at")
    .eq("user_id", userId)
    .order("worn_at", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  // Extract unique dates (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(logs.map((log: any) => new Date(log.worn_at).toISOString().split("T")[0]))
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let checkDate = new Date(today);

  for (let i = 0; i < uniqueDates.length; i++) {
    const logDateStr = uniqueDates[i];
    const checkDateStr = checkDate.toISOString().split("T")[0];

    if (logDateStr === checkDateStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // If the first log isn't today, check if it was yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (logDateStr === yesterday.toISOString().split("T")[0]) {
        streak++;
        checkDate = yesterday;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    } else {
      break; // Streak broken
    }
  }

  return streak;
};

export function useRingStats(period: "daily" | "weekly" | "monthly" | "all" = "weekly") {
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

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      if (!supabase || !user) return;
      setIsLoading(true);

      try {
        // 1. Get total items in wardrobe (Lifetime)
        const { count: totalItems } = await supabase
          .from("wardrobe_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const total = totalItems || 0;

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
          startTime.setTime(0); // Beginning of time
        }

        // 3. Get wear logs for the period
        const { data: periodLogs } = await supabase
          .from("wear_logs")
          .select("item_id")
          .eq("user_id", user.id)
          .gte("worn_at", startTime.toISOString())
          .lte("worn_at", now.toISOString());

        const logs = periodLogs || [];

        // 4. Calculate Usage %
        const uniqueItemsWorn = new Set(logs.map((log) => log.item_id)).size;
        const usagePercentNum = total > 0 ? Math.round((uniqueItemsWorn / total) * 100) : 0;

        // 5. Calculate Avg Wears
        const avgWears = uniqueItemsWorn > 0 ? +(logs.length / uniqueItemsWorn).toFixed(1) : 0;

        // 6. Calculate Streak
        const streakCount = await getCurrentStreak(supabase, user.id);
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
            totalItemsPercent: Math.min(total / CLOSET_GOAL, 1),
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
  }, [supabase, user, period]);

  return { stats, isLoading };
}
