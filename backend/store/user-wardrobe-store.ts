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

type UserWardrobeState = {
  items: UserClothingItem[];
  outfitLogs: UserOutfitLog[];
  addItem: (item: Omit<UserClothingItem, "id" | "createdAt">) => void;
  addOutfitLog: (log: Omit<UserOutfitLog, "id" | "createdAt">) => void;
};

export const useUserWardrobeStore = create<UserWardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      outfitLogs: [],
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
    }),
    {
      name: "user-wardrobe",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
