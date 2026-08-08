import { useSupabase } from "@/shared/supabase/use-supabase";
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

const toDateString = (d: Date): string => d.toISOString().split("T")[0];

/** Returns Monday of the week containing `date` */
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
};

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

    const fetchWeekActivity = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const monday = getMonday(today);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const mondayStr = toDateString(monday);
        const sundayStr = toDateString(sunday);

        const { data, error } = await supabase
          .from("streak_logs")
          .select("activity_date")
          .eq("user_id", user.id)
          .gte("activity_date", mondayStr)
          .lte("activity_date", sundayStr);

        if (error) throw error;

        const dateSet = new Set<string>(
          (data ?? []).map((row: { activity_date: string }) => row.activity_date)
        );
        setActiveDates(dateSet);
      } catch (err) {
        console.warn("[useWeeklyActivity] fetch failed:", err);
        // Leave activeDates as empty — WeeklyCalendarStrip will fallback to local state
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeekActivity();
  }, [supabase, user?.id]);

  return { activeDates, isLoading };
}
