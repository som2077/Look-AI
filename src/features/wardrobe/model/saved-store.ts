import { create } from "zustand";

export type SavedItemType = "outfit" | "clothes" | "inspo";

export interface SavedOutfit {
  id: string;
  name: string;
  occasion: string;
  wears: number;
  image: string;
  match: number;
  tags: string[];
  saveType: SavedItemType;
  bgColor?: string;
  items?: {
    id: string;
    name: string;
    category: "top" | "bottoms" | "footwear" | "outerwear" | "accessory";
  }[];
}

export interface SavedCollection {
  id: string;
  name: string;
  count: number;
  image: string;
}

const INITIAL_COLLECTIONS: SavedCollection[] = [];

const INITIAL_OUTFITS: SavedOutfit[] = [];

interface SavedState {
  outfits: SavedOutfit[];
  collections: SavedCollection[];
  addSavedItem: (item: SavedOutfit) => void;
  removeSavedItem: (id: string) => void;
}

export const useSavedStore = create<SavedState>((set) => ({
  outfits: INITIAL_OUTFITS,
  collections: INITIAL_COLLECTIONS,
  addSavedItem: (item) =>
    set((state) => ({ outfits: [item, ...state.outfits] })),
  removeSavedItem: (id) =>
    set((state) => ({ outfits: state.outfits.filter((o) => o.id !== id) })),
}));
