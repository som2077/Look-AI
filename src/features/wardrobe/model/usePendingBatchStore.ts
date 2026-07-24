import { uploadToCloudinaryWithBgRemoval } from "@/features/scanning/api/cloudinary-upload";
import {
  FullClothingAnalysis,
  analyzeClothingFull,
} from "@/features/scanning/api/gemini-scan";
import { useScanHistoryStore } from "@/features/scanning/model/scan-history-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type BatchItemStatus = "loading" | "success" | "error";

export interface BatchItem {
  id: string;
  originalUri: string;
  status: BatchItemStatus;
  data: FullClothingAnalysis | null;
  cloudinaryUrl: string | null;
  error?: string;
  // local edits
  customName: string;
  brand: string;
}

interface PendingBatchState {
  items: BatchItem[];
  startBatch: (uris: string[], append?: boolean) => void;
  updateItem: (id: string, updates: Partial<BatchItem>) => void;
  removeItems: (ids: string[]) => void;
  clearBatch: () => void;
  processBatchItem: (item: BatchItem) => Promise<void>;
}

export const usePendingBatchStore = create<PendingBatchState>()(
  persist(
    (set, get) => ({
      items: [],
      startBatch: (uris: string[], append = false) => {
        const newItems: BatchItem[] = uris.map((uri, index) => ({
          id: `item-${Date.now()}-${index}`,
          originalUri: uri,
          status: "loading",
          data: null,
          cloudinaryUrl: null,
          customName: "",
          brand: "",
        }));

        set((state) => ({
          items: append ? [...state.items, ...newItems] : newItems,
        }));

        // Fire and forget analysis for new items
        newItems.forEach((item) => {
          get().processBatchItem(item);
        });
      },
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates } : i,
          ),
        }));
      },
      removeItems: (ids) => {
        set((state) => ({
          items: state.items.filter((i) => !ids.includes(i.id)),
        }));
      },
      clearBatch: () => {
        set({ items: [] });
      },
      processBatchItem: async (item: BatchItem) => {
        try {
          // 1. BG Removal
          let finalUri = item.originalUri;
          let cloudUrl = null;
          try {
            const uploadRes = await uploadToCloudinaryWithBgRemoval(
              item.originalUri,
            );
            finalUri = uploadRes.imageUrl;
            cloudUrl = uploadRes.imageUrl;
          } catch (bgError) {
            console.warn("BG removal failed for batch item:", bgError);
          }

          // 2. Gemini Analysis
          const aiData = await analyzeClothingFull(finalUri);
          if (
            !aiData ||
            aiData.category === "Full Body" ||
            aiData.category === "Not Clothing"
          ) {
            throw new Error("Invalid clothing image");
          }

          set((state) => ({
            items: state.items.map((p) => {
              if (p.id === item.id) {
                return {
                  ...p,
                  status: "success",
                  data: aiData,
                  cloudinaryUrl: cloudUrl || p.originalUri,
                  customName: `${aiData.primaryColor} ${aiData.subCategory}`,
                };
              }
              return p;
            }),
          }));

          useScanHistoryStore.getState().addScan({
            type: "cloth",
            thumbnail: cloudUrl || item.originalUri,
            date: new Date().toISOString(),
            result: aiData as unknown as Record<string, unknown>,
            isFavorite: false,
          });
        } catch (error) {
          console.error("Failed to process batch item", item.id, error);
          set((state) => ({
            items: state.items.map((p) => {
              if (p.id === item.id) {
                return { ...p, status: "error", error: "Failed to analyze" };
              }
              return p;
            }),
          }));
        }
      },
    }),
    {
      name: "look-ai-pending-batch-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
