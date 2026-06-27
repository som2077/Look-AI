import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserClothingItem = {
  id: string;
  name: string;
  category: string;
  color?: string;
  photoUri?: string;
  occasion?: string;
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
  addItem: (item: Omit<UserClothingItem, "id" | "createdAt">) => void;
  addOutfitLog: (log: Omit<UserOutfitLog, "id" | "createdAt">) => void;
  addOutfit: (outfit: Omit<UserOutfit, "id" | "createdAt">) => void;
};

export const useUserWardrobeStore = create<UserWardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      outfitLogs: [],
      outfits: [],
      addItem: (item) =>
        set({
          items: [
            ...get().items,
            {
              ...item,
              id: `user-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      addOutfitLog: (log) =>
        set({
          outfitLogs: [
            ...get().outfitLogs,
            {
              ...log,
              id: `log-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      addOutfit: (outfit) =>
        set({
          outfits: [
            ...get().outfits,
            {
              ...outfit,
              id: `outfit-${Date.now()}`,
              createdAt: new Date().toISOString(),
            }
          ]
        }),
    }),
    {
      name: "user-wardrobe-v2",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
