import { useCallback } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { useUser } from "@clerk/clerk-expo";

export function useLogWears() {
  const { supabase } = useSupabase();
  const { user } = useUser();

  const logWears = useCallback(
    async (itemIds: string[], date?: string | Date) => {
      if (!supabase || !user) return;

      const wornAt = date ? new Date(date).toISOString() : new Date().toISOString();

      try {
        const rows = itemIds.map((itemId) => ({
          user_id: user.id,
          item_id: itemId,
          worn_at: wornAt,
        }));

        if (rows.length === 0) return;

        const { error } = await supabase.from("wear_logs").insert(rows);
        
        if (error) {
          console.error("Failed to log wears to Supabase:", error);
        }
      } catch (err) {
        console.error("Error logging wears:", err);
      }
    },
    [supabase, user]
  );

  return { logWears };
}
