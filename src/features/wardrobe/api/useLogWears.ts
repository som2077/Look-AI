import { useCallback } from "react";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { invalidateSupabaseCache } from "@/shared/supabase/use-supabase-query";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { useUser } from "@clerk/clerk-expo";

export function useLogWears() {
  const { supabase } = useSupabase();
  const { user } = useUser();

  const logWears = useCallback(
    async (itemIds: string[], date?: string | Date) => {
      if (!supabase || !user) return;
      if (itemIds.length === 0) return;

      const wornAt = date ? new Date(date).toISOString() : new Date().toISOString();
      const wardrobe = useUserWardrobeStore.getState();

      // Optimistic: bump wearCount + lastWornDate locally so the ring stats
      // and any visible "Worn X times" labels update on the very next render
      // — instead of waiting for the insert round-trip + ring stats refetch.
      const snapshot = new Map<string, { wearCount: number; lastWornDate?: string }>();
      for (const id of itemIds) {
        const item = wardrobe.items.find((i) => i.id === id);
        if (!item) continue;
        snapshot.set(id, {
          wearCount: item.wearCount ?? 0,
          lastWornDate: item.lastWornDate,
        });
        wardrobe.updateItem(id, {
          wearCount: (item.wearCount ?? 0) + 1,
          lastWornDate: wornAt,
        });
      }

      try {
        const rows = itemIds.map((itemId) => ({
          user_id: user.id,
          item_id: itemId,
          worn_at: wornAt,
        }));

        const { error } = await supabase.from("wear_logs").insert(rows);
        if (error) throw error;

        // Cache for ALL period suffixes (daily/weekly/monthly/90_days) is now
        // stale — bust by prefix so the next ring-stats read is fresh.
        invalidateSupabaseCache("wear_logs", user.id);
      } catch (err) {
        // Roll back the optimistic bumps.
        const wardrobeNow = useUserWardrobeStore.getState();
        for (const [id, prev] of snapshot) {
          wardrobeNow.updateItem(id, prev);
        }
        console.error("Error logging wears:", err);
      }
    },
    [supabase, user]
  );

  return { logWears };
}
