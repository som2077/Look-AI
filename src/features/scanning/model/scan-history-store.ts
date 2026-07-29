import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  namespacedAsyncStorage,
  registerStoreRehydration,
  registerStoreReset,
} from "@/shared/storage/namespacedStorage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScanType = "cloth" | "barcode" | "label" | "fit-check";

export interface ScanHistoryItem {
  id: string;
  type: ScanType;
  thumbnail: string; // local image URI
  date: string;
  result: Record<string, unknown>; // type-specific AI result
  isFavorite: boolean;
  createdAt: string;
}

interface ScanHistoryState {
  scans: ScanHistoryItem[];
  addScan: (scan: Omit<ScanHistoryItem, "id" | "createdAt">) => string;
  removeScan: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearAll: () => void;
  getScansByType: (type: ScanType) => ScanHistoryItem[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useScanHistoryStore = create<ScanHistoryState>()(
  persist(
    (set, get) => ({
      scans: [],

      addScan: (scan) => {
        const id = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const item: ScanHistoryItem = {
          ...scan,
          id,
          createdAt: new Date().toISOString(),
        };
        set({ scans: [item, ...get().scans] }); // newest first
        return id;
      },

      removeScan: (id) => {
        set({ scans: get().scans.filter((s) => s.id !== id) });
      },

      toggleFavorite: (id) => {
        set({
          scans: get().scans.map((s) =>
            s.id === id ? { ...s, isFavorite: !s.isFavorite } : s,
          ),
        });
      },

      clearAll: () => set({ scans: [] }),

      getScansByType: (type) => get().scans.filter((s) => s.type === type),
    }),
    {
      name: "scan-history-v1",
      storage: createJSONStorage(() => namespacedAsyncStorage),
    },
  ),
);

registerStoreRehydration(() => useScanHistoryStore.persist.rehydrate());
registerStoreReset(() => useScanHistoryStore.getState().clearAll());
