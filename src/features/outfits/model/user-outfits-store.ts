import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  namespacedAsyncStorage,
  registerStoreRehydration,
  registerStoreReset,
} from "@/shared/store/namespacedStorage";

export type Outfit = {
  id: string;
  imageUri: string;
  name: string;
  items: string[];
  createdAt: number;
  scheduledDate?: string; // YYYY-MM-DD format
  scheduledTime?: string; // e.g. "09:00 AM"
  notes?: string;
};

interface UserOutfitsState {
  outfits: Outfit[];
  addOutfit: (outfit: Outfit) => void;
  removeOutfit: (id: string) => void;
  updateOutfit: (id: string, updates: Partial<Outfit>) => void;
}

export const useUserOutfitsStore = create<UserOutfitsState>()(
  persist(
    (set) => ({
      outfits: [],
      addOutfit: (outfit) =>
        set((state) => ({ outfits: [outfit, ...state.outfits] })),
      removeOutfit: (id) =>
        set((state) => ({
          outfits: state.outfits.filter((o) => o.id !== id),
        })),
      updateOutfit: (id, updates) =>
        set((state) => ({
          outfits: state.outfits.map((o) =>
            o.id === id ? { ...o, ...updates } : o,
          ),
        })),
    }),
    {
      name: "look-ai-user-outfits",
      storage: createJSONStorage(() => namespacedAsyncStorage),
    },
  ),
);

registerStoreRehydration(() => useUserOutfitsStore.persist.rehydrate());
registerStoreReset(() => useUserOutfitsStore.setState({ outfits: [] }));
