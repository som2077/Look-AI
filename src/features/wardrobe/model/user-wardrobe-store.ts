import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserClothingItem = {
  id: string;
  name: string;
  category: string;
  color?: string;
  colorHex?: string;
  photoUri?: string;
  occasion?: string;
  season?: string;
  material?: string;
  pattern?: string;
  sleeveType?: string;
  neckType?: string;
  tags?: string[];
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

type UserWardrobeState = {
  items: UserClothingItem[];
  outfitLogs: UserOutfitLog[];
  outfits: UserOutfit[];
  addItem: (item: Omit<UserClothingItem, "id" | "createdAt">) => string;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<UserClothingItem>) => void;
  addOutfitLog: (log: Omit<UserOutfitLog, "id" | "createdAt">) => void;
  addOutfit: (outfit: Omit<UserOutfit, "id" | "createdAt">) => void;
  hasItem: (category: string, color: string) => boolean;
};

export const useUserWardrobeStore = create<UserWardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      outfitLogs: [],
      outfits: [],

      addItem: (item) => {
        const id = `user-${Date.now()}`;
        set({
          items: [
            ...get().items,
            { ...item, id, createdAt: new Date().toISOString() },
          ],
        });
        return id;
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateItem: (id, updates) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, ...updates } : i,
          ),
        });
      },

      hasItem: (category: string, color: string) => {
        return get().items.some(
          (i) =>
            i.category.toLowerCase() === category.toLowerCase() &&
            i.color?.toLowerCase() === color.toLowerCase(),
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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
