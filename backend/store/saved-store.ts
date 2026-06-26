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

const INITIAL_COLLECTIONS: SavedCollection[] = [
  {
    id: "col-1",
    name: "Work Fits",
    count: 12,
    image:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: "col-2",
    name: "Casual",
    count: 8,
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: "col-3",
    name: "Party",
    count: 5,
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&auto=format&fit=crop&q=60",
  },
];

const INITIAL_OUTFITS: SavedOutfit[] = [
  {
    id: "outfit-1",
    name: "Office Sharp",
    occasion: "Office",
    wears: 8,
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop&q=60",
    match: 96,
    tags: ["Work", "Formal"],
    saveType: "outfit",
  },
  {
    id: "outfit-2",
    name: "Weekend Vibe",
    occasion: "Casual",
    wears: 4,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60",
    match: 88,
    tags: ["Weekend", "Summer"],
    saveType: "outfit",
  },
  {
    id: "outfit-3",
    name: "Date Night",
    occasion: "Evening",
    wears: 2,
    image:
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500&auto=format&fit=crop&q=60",
    match: 92,
    tags: ["Date", "Elegant"],
    saveType: "outfit",
  },
];

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
