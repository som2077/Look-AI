import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";
import { useCallback } from "react";

const getTodayString = () => new Date().toISOString().split("T")[0];

/**
 * Hook that increments local Zustand streak state AND syncs to Supabase.
 *
 * Tables synced:
 *   - streak_logs       : one row per user per day (UNIQUE user_id, activity_date)
 *   - user_gamification : upserts current_streak, longest_streak, last_logged_date
 *
 * Usage:
 *   const { syncStreak } = useStreakSync();
 *   syncStreak("scan_mode");        // after scan
 *   syncStreak("virtual_try_on");   // after virtual try-on
 *   syncStreak("outfit_logged");    // after outfit log
 */
export function useStreakSync() {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const { incrementStreakAction } = useStreakStore();

  const syncStreak = useCallback(
    async (
      activityType: "scan_mode" | "virtual_try_on" | "outfit_logged" = "outfit_logged"
    ) => {
      // 1. Update local Zustand state first (instant UI feedback)
      incrementStreakAction();

      // 2. Sync to Supabase in background - fire and forget
      if (!supabase || !user?.id) return;

      const userId = user.id;
      const today = getTodayString();

      // Read updated values after the increment
      const { currentStreak, longestStreak } = useStreakStore.getState();

      try {
        // Log today's activity — UNIQUE(user_id, activity_date) prevents duplicates.
        // On conflict, we update activity_type to the latest action type.
        await supabase.from("streak_logs").upsert(
          {
            user_id: userId,
            activity_date: today,
            activity_type: activityType,
          },
          { onConflict: "user_id,activity_date" }
        );

        // Update gamification summary row (upsert by primary key user_id)
        await supabase.from("user_gamification").upsert(
          {
            user_id: userId,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_logged_date: today,
          },
          { onConflict: "user_id" }
        );
      } catch (err) {
        // Silent fail - local AsyncStorage state is source of truth, DB is backup
        console.warn("[StreakSync] DB sync failed:", err);
      }
    },
    [supabase, user, incrementStreakAction]
  );

  return { syncStreak };
}
