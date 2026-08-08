import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  namespacedAsyncStorage,
  registerStoreRehydration,
  registerStoreReset,
} from "@/shared/storage/namespacedStorage";

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
  source?: "camera" | "gallery" | "barcode" | "label_scan" | "manual";
  
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
        const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
    },
  ),
);

registerStoreRehydration(() => useUserWardrobeStore.persist.rehydrate());
registerStoreReset(() =>
  useUserWardrobeStore.setState({ items: [], outfits: [], outfitLogs: [] })
);
