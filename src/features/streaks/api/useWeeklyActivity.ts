import { useSupabase } from "@/shared/supabase/use-supabase";
import { fetchSupabaseRows } from "@/shared/supabase/use-supabase-query";
import { getStartOfWeek, toLocalDateString } from "@/shared/utils/date";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
/**
 * Fetches the current week (Mon-Sun) active days from Supabase streak_logs.
 *
 * Green ring  = any row exists for that date (app was opened)
 * Red ring    = no row for that past date (app was not opened)
 * Empty       = future date
 *
 * Returns:
 *   activeDates - Set of "YYYY-MM-DD" strings for days app was opened
 *   isLoading   - true while fetching
 */

export function useWeeklyActivity() {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user?.id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetchWeekActivity = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const monday = getStartOfWeek(today);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const mondayStr = toLocalDateString(monday);
        const sundayStr = toLocalDateString(sunday);

        const data = await fetchSupabaseRows<{ activity_date: string }>({
          supabase,
          table: "streak_logs",
          select: "activity_date",
          userId: user.id,
          cacheKeySuffix: mondayStr, // one cache entry per week
          apply: (q) =>
            q
              .eq("user_id", user.id)
              .gte("activity_date", mondayStr)
              .lte("activity_date", sundayStr),
        });

        if (cancelled) return;
        const dateSet = new Set<string>(data.map((row) => row.activity_date));
        setActiveDates(dateSet);
      } catch (err) {
        if (cancelled) return;
        console.warn("[useWeeklyActivity] fetch failed:", err);
        // Leave activeDates as empty — WeeklyCalendarStrip will fallback to local state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchWeekActivity();
    return () => { cancelled = true; };
  }, [supabase, user?.id]);

  return { activeDates, isLoading };
}
