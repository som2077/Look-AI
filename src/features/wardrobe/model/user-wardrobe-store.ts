import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  namespacedAsyncStorage,
  registerStoreRehydration,
  registerStoreReset,
} from "@/shared/storage/namespacedStorage";
import { supabase, getSupabaseGlobalUserId, setSupabaseGlobalUserId } from "@/shared/supabase/client";
import {
  fetchSupabaseRows,
  invalidateSupabaseCache,
} from "@/shared/supabase/use-supabase-query";
import { subscribeToTable } from "@/shared/realtime/manager";

let globalUserId: string | null = null;

// Session flag: user_profiles row only needs to be ensured ONCE per user.
// Previously every wardrobe write (addItem/updateItem) did a redundant upsert.
let profileEnsuredFor: string | null = null;

export const setWardrobeStoreUserId = (uid: string | null) => {
  globalUserId = uid;
  if (uid) {
    setSupabaseGlobalUserId(uid);
  }
};

export type UserClothingItem = {
  id: string;
  userId?: string;
  customName?: string;
  brand?: string;

  // Core Visual Attributes
  category: string;
  subCategory?: string;
  primaryColor?: string;
  secondaryColors?: string[];
  pattern?: string;
  fabricGuess?: string;
  fit?: string;
  sleeveType?: string;
  neckType?: string;
  careInstructions?: string;
  notes?: string;
  colorHex?: string;

  // Styling Intelligence
  style?: string[];
  season?: string[];
  occasion?: string[];
  formalityScore?: number;
  versatilityTags?: string[];

  // Metadata
  imageUrl?: string;
  originalImageUrl?: string;
  confidence?: number;
  source?: "camera" | "gallery" | "wardrobe" | "barcode" | "label_scan" | "manual";
  
  // Editable/Tracking
  isFavorite?: boolean;
  wearCount?: number;
  lastWornDate?: string;
  rating?: number;
  annotations?: Record<string, any>;

  createdAt: string;
};

export type UserOutfitLog = {
  id: string;
  occasion: string;
  rating: number;
  note: string;
  addToWardrobe: boolean;
  createdAt: string;
};

export type UserOutfit = {
  id: string;
  name: string;
  occasion?: string;
  itemIds: string[];
  createdAt: string;
};

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function mapDbRowToUserItem(row: any): UserClothingItem {
  return {
    id: row.id,
    userId: row.user_id,
    customName: row.custom_name,
    brand: row.brand,
    category: row.category,
    subCategory: row.sub_category,
    primaryColor: row.primary_color,
    secondaryColors: row.secondary_colors || [],
    pattern: row.pattern,
    fabricGuess: row.fabric_guess,
    fit: row.fit,
    sleeveType: row.sleeve_type,
    neckType: row.neck_type,
    careInstructions: row.care_instructions,
    notes: row.notes,
    colorHex: row.color_hex,
    style: row.style || [],
    season: row.season || [],
    occasion: row.occasion || [],
    formalityScore: row.formality_score,
    versatilityTags: row.versatility_tags || [],
    imageUrl: row.image_url,
    originalImageUrl: row.original_image_url,
    confidence: row.confidence ? Number(row.confidence) : undefined,
    source: row.source,
    isFavorite: row.is_favorite,
    wearCount: row.wear_count,
    lastWornDate: row.last_worn_date,
    rating: row.rating,
    annotations: row.annotations,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapUserItemToDbRow(item: UserClothingItem, userId: string) {
  return {
    id: isValidUUID(item.id) ? item.id : undefined,
    user_id: userId,
    custom_name: item.customName || null,
    brand: item.brand || null,
    category: item.category || "Top",
    sub_category: item.subCategory || null,
    primary_color: item.primaryColor || null,
    color_hex: item.colorHex || null,
    secondary_colors: item.secondaryColors || [],
    pattern: item.pattern || null,
    fabric_guess: item.fabricGuess || null,
    fit: item.fit || null,
    sleeve_type: item.sleeveType || null,
    neck_type: item.neckType || null,
    style: item.style || [],
    season: item.season || [],
    occasion: item.occasion || [],
    formality_score: item.formalityScore || null,
    versatility_tags: item.versatilityTags || [],
    rating: item.rating || 5,
    care_instructions: item.careInstructions || null,
    notes: item.notes || null,
    image_url: item.imageUrl || item.originalImageUrl || "",
    original_image_url: item.originalImageUrl || null,
    annotations: item.annotations || {},
    confidence: item.confidence || null,
    source: item.source || "camera",
    is_favorite: item.isFavorite || false,
    wear_count: item.wearCount || 0,
    last_worn_date: item.lastWornDate || null,
  };
}

type UserWardrobeState = {
  items: UserClothingItem[];
  outfitLogs: UserOutfitLog[];
  outfits: UserOutfit[];
  /** True while an initial DB sync is in flight — screens show a skeleton. */
  isSyncing: boolean;
  setItems: (items: UserClothingItem[]) => void;
  setIsSyncing: (syncing: boolean) => void;
  addItem: (item: Omit<UserClothingItem, "id" | "createdAt"> & { id?: string }) => string;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<UserClothingItem>) => Promise<void>;
  addOutfitLog: (log: Omit<UserOutfitLog, "id" | "createdAt">) => void;
  addOutfit: (outfit: Omit<UserOutfit, "id" | "createdAt">) => void;
  hasItem: (category: string, color: string) => boolean;
  syncWithDatabase: (userId?: string) => Promise<void>;
};

export const subscribeToWardrobeRealtime = (userId: string) => {
  if (!userId) return () => {};

  // Singleton: one wardrobe channel per user app-wide (see realtime/manager.ts)
  return subscribeToTable(supabase, {
    table: "wardrobe_items",
    userId,
    filter: `user_id=eq.${userId}`,
    handler: (payload) => {
      const store = useUserWardrobeStore.getState();
      if (payload.eventType === "INSERT") {
        const newItem = mapDbRowToUserItem(payload.new);
        store.setItems([
          newItem,
          ...store.items.filter((i) => i.id !== newItem.id),
        ]);
      } else if (payload.eventType === "UPDATE") {
        const updated = mapDbRowToUserItem(payload.new);
        store.setItems(
          store.items.map((i) => (i.id === updated.id ? updated : i)),
        );
      } else if (payload.eventType === "DELETE") {
        const oldId = (payload.old as any)?.id;
        if (oldId) {
          store.setItems(store.items.filter((i) => i.id !== oldId));
        }
      }
    },
  });
};

export const useUserWardrobeStore = create<UserWardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      outfitLogs: [],
      outfits: [],
      isSyncing: false,

      setItems: (items) => set({ items }),
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),

      addItem: (item) => {
        const id = item.id && isValidUUID(item.id) ? item.id : generateUUID();
        const newItem: UserClothingItem = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
        };
        
        set({
          items: [
            ...get().items.filter((i) => i.id !== id),
            newItem,
          ],
        });

        // Sync to Supabase in real-time
        (async () => {
          try {
            const uid = item.userId || globalUserId || getSupabaseGlobalUserId();
            if (uid) {
              // Ensure user_profiles has a row ONCE per session to satisfy the FK
              if (profileEnsuredFor !== uid) {
                await supabase
                  .from("user_profiles")
                  .upsert({ user_id: uid }, { onConflict: "user_id" });
                profileEnsuredFor = uid;
              }

              const row = mapUserItemToDbRow(newItem, uid);
              const { error } = await supabase
                .from("wardrobe_items")
                .upsert(row, { onConflict: "id" });
              if (error) {
                console.error("[WardrobeStore] Supabase insert error:", error);
              } else {
                console.log("[WardrobeStore] Successfully saved wardrobe item to Supabase:", id);
                invalidateSupabaseCache("wardrobe_items", uid);
              }
            } else {
              console.warn("[WardrobeStore] No authenticated user ID available to persist wardrobe item.");
            }
          } catch (err) {
            console.error("[WardrobeStore] Failed to save wardrobe item to Supabase:", err);
          }
        })();

        return id;
      },

      removeItem: async (id) => {
        const itemToDelete = get().items.find((i) => i.id === id);
        set({ items: get().items.filter((i) => i.id !== id) });

        // Sync deletion to Supabase
        try {
          if (isValidUUID(id)) {
            const { error } = await supabase.from("wardrobe_items").delete().eq("id", id);
            if (error) {
              console.error("[WardrobeStore] Supabase delete error:", error);
            } else {
              console.log("[WardrobeStore] Successfully deleted item from Supabase:", id);
              invalidateSupabaseCache("wardrobe_items", getSupabaseGlobalUserId() ?? undefined);
            }
          } else {
            const uid = itemToDelete?.userId || globalUserId || getSupabaseGlobalUserId();
            if (uid && itemToDelete?.customName) {
              await supabase
                .from("wardrobe_items")
                .delete()
                .eq("user_id", uid)
                .eq("name", itemToDelete.customName);
              invalidateSupabaseCache("wardrobe_items", uid);
            }
          }
        } catch (err) {
          console.warn("[WardrobeStore] Failed to delete item from Supabase:", err);
        }
      },

      updateItem: async (id, updates) => {
        // 1. Optimistic update
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, ...updates } : i,
          ),
        });

        // 2. Real-time sync to Supabase
        try {
          const updatedItem = get().items.find((i) => i.id === id);
          if (!updatedItem) return;

          const uid = updatedItem.userId || globalUserId || getSupabaseGlobalUserId();
          if (uid) {
            // Ensure user_profiles has a row ONCE per session to satisfy the FK
            if (profileEnsuredFor !== uid) {
              await supabase
                .from("user_profiles")
                .upsert({ user_id: uid }, { onConflict: "user_id" });
              profileEnsuredFor = uid;
            }

            const finalId = isValidUUID(id) ? id : generateUUID();
            if (finalId !== id) {
              set({
                items: get().items.map((i) =>
                  i.id === id ? { ...i, id: finalId } : i,
                ),
              });
            }

            const row = mapUserItemToDbRow({ ...updatedItem, id: finalId }, uid);
            const { error } = await supabase
              .from("wardrobe_items")
              .upsert({ ...row, id: finalId }, { onConflict: "id" });

            if (error) {
              console.error("[WardrobeStore] Supabase update item error:", error);
            } else {
              console.log("[WardrobeStore] Real-time Supabase update successful for item:", finalId);
              invalidateSupabaseCache("wardrobe_items", uid);
            }
          } else {
            console.warn("[WardrobeStore] No user ID available for real-time Supabase update.");
          }
        } catch (err) {
          console.error("[WardrobeStore] Failed to update item in Supabase:", err);
        }
      },

      syncWithDatabase: async (explicitUserId?: string) => {
        try {
          const uid = explicitUserId || globalUserId || getSupabaseGlobalUserId();
          if (!uid) return;

          set({ isSyncing: true });

          // Routes the bounded read through the shared 30s cache + in-flight
          // dedup so re-syncs (tab focus, app return) don't re-hit the network.
          const data = await fetchSupabaseRows<Record<string, unknown>>({
            supabase,
            table: "wardrobe_items",
            select: "*",
            userId: uid,
            apply: (q) =>
              q
                .eq("user_id", uid)
                .order("created_at", { ascending: false })
                .range(0, 499), // bound the read — a 10k-user wardrobe should paginate
          });

          if (data.length > 0) {
            const dbItems = data.map(mapDbRowToUserItem);
            const localItems = get().items;
            const dbIds = new Set(dbItems.map((i) => i.id));
            const nonSyncedLocal = localItems.filter((i) => !dbIds.has(i.id));
            set({ items: [...dbItems, ...nonSyncedLocal] });
          }
        } catch (err) {
          console.warn("[WardrobeStore] Error in syncWithDatabase:", err);
        } finally {
          set({ isSyncing: false });
        }
      },

      hasItem: (category: string, color: string) => {
        return get().items.some(
          (i) =>
            i.category.toLowerCase() === category.toLowerCase() &&
            i.primaryColor?.toLowerCase() === color.toLowerCase(),
        );
      },

      addOutfitLog: (log) =>
        set({
          outfitLogs: [
            ...get().outfitLogs,
            { ...log, id: `log-${Date.now()}`, createdAt: new Date().toISOString() },
          ],
        }),

      addOutfit: (outfit) =>
        set({
          outfits: [
            ...get().outfits,
            { ...outfit, id: `outfit-${Date.now()}`, createdAt: new Date().toISOString() },
          ],
        }),
    }),
    {
      name: "user-wardrobe-v2",
      storage: createJSONStorage(() => namespacedAsyncStorage),
      // Only persist data — never transient flags like isSyncing.
      partialize: (state) => ({
        items: state.items,
        outfitLogs: state.outfitLogs,
        outfits: state.outfits,
      }),
    },
  ),
);

registerStoreRehydration(() => useUserWardrobeStore.persist.rehydrate());
registerStoreReset(() =>
  useUserWardrobeStore.setState({ items: [], outfits: [], outfitLogs: [] })
);

