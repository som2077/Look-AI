import { uploadToCloudinaryWithBgRemoval } from "@/features/scanning/api/cloudinary-upload";
import {
  FullClothingAnalysis,
  analyzeClothingFull,
} from "@/features/scanning/api/ai-scan";
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

        // Process batch items with concurrency limit (e.g. 2 at a time) to prevent OOM / Rate limits
        const queue = [...newItems];
        let active = 0;
        const maxConcurrent = 3;
        
        const processNext = async () => {
          if (queue.length === 0) return;
          if (active >= maxConcurrent) return;
          
          active++;
          const item = queue.shift();
          if (item) {
            try {
              await get().processBatchItem(item);
            } finally {
              active--;
              processNext();
            }
          }
        };

        for (let i = 0; i < maxConcurrent; i++) {
          processNext();
        }
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

          // 2. AI Analysis
          const aiData = await analyzeClothingFull(finalUri);
          if (!aiData) {
            throw new Error("Analysis returned no data");
          }
          
          if (aiData.category === "Full Body" || aiData.category === "Not Clothing") {
            // Graceful fallback instead of crashing the batch item
            aiData.category = "Top";
            aiData.subCategory = "Other";
            aiData.name = "Unknown Item";
          }

          const customName =
            aiData.name ||
            `${aiData.color || aiData.primaryColor || ""} ${aiData.subCategory || "Item"}`.trim();

          set((state) => ({
            items: state.items.map((p) => {
              if (p.id === item.id) {
                return {
                  ...p,
                  status: "success",
                  data: aiData,
                  cloudinaryUrl: cloudUrl || p.originalUri,
                  customName: customName || "Wardrobe Item",
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
