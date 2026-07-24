import { uploadToCloudinaryWithBgRemoval } from "@/features/scanning/api/cloudinary-upload";
import { analyzeClothingFull } from "@/features/scanning/api/gemini-scan";
import { useWeatherStore } from "@/features/weather/model/weather-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  namespacedAsyncStorage,
  registerStoreRehydration,
  registerStoreReset,
} from "@/shared/store/namespacedStorage";

export interface LastOutfit {
  imageUri: string;
  time: string;
  name: string;
  subtitle: string;
  tags: string[];
  score: number;
  date: string; // e.g. "Thu, 5 Jun 2026"
  occasion: string;
  weather: string;
  itemCount: number;
  mode: string;
  isSaved?: boolean;
  colorPalette?: string[];
  clothingData?: any; // Stores Gemini AI data for scan-cloth mode
}

interface OutfitAnalysisState {
  isAnalyzing: boolean;
  isDone: boolean;
  imageUri: string | null;
  progress: number;
  currentMode: string | null;
  error: string | null;
  lastOutfits: LastOutfit[];
  startAnalysis: (imageUri: string, mode?: string) => void;
  clearAnalysis: () => void;
  removeOutfit: (index: number) => void;
  updateOutfit: (index: number, updates: Partial<LastOutfit>) => void;
  clearAllOutfits: () => void;
  toggleSaved: (index: number) => void;
  cleanupDaily: () => void;
  lastClearedTimestamp?: number;
}

let _interval: ReturnType<typeof setInterval> | null = null;
let _doneTimeout: ReturnType<typeof setTimeout> | null = null;

const TICK_MS = 150;
const DURATION_MS = 9000;
const INCREMENT = 100 / (DURATION_MS / TICK_MS);

function formatTime(): string {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = now.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m}${ampm}`;
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Mock AI analysis results (rotate based on outfit count) ──────────────────
const OUTFIT_NAMES = [
  "Breezy Office Look",
  "Smart Casual Vibes",
  "Weekend Ready",
  "Evening Chic",
  "Power Formal",
  "Effortless Everyday",
];
const SUBTITLES = [
  "Kurta · Palazzo · Flats",
  "Shirt · Chinos · Loafers",
  "Co-ord Set · Sneakers",
  "Dress · Heels · Clutch",
  "Blazer · Trousers · Oxford",
  "Tee · Jeans · Sneakers",
];
const TAG_SETS = [
  ["Office", "Casual", "Summer"],
  ["Smart", "Casual", "Work"],
  ["Weekend", "Comfort", "Trendy"],
  ["Evening", "Chic", "Glam"],
  ["Formal", "Power", "Pro"],
  ["Daily", "Minimal", "Easy"],
];
const OCCASIONS = [
  "Work",
  "Casual Day Out",
  "Weekend",
  "Evening Out",
  "Formal",
  "Everyday",
];
const SCORES = [92, 88, 95, 78, 85, 90];
const ITEMS = [3, 4, 3, 5, 4, 3];

function getLiveWeatherString(): string {
  const w = useWeatherStore.getState().data;
  if (!w) return "Weather unavailable";
  return `${w.condition} · ${w.temperatureCelsius}°C`;
}
const COLOR_PALETTES = [
  ["#D2C4B7", "#4A5568", "#1A202C"], // Breezy Office Look
  ["#FFFFFF", "#2B6CB0", "#E2E8F0"], // Smart Casual Vibes
  ["#F56565", "#1A202C", "#EDF2F7"], // Weekend Ready
  ["#000000", "#D69E2E", "#E2E8F0"], // Evening Chic
  ["#2D3748", "#1A202C", "#CBD5E0"], // Power Formal
  ["#4299E1", "#FFFFFF", "#F7FAFC"], // Effortless Everyday
];

export const useOutfitAnalysisStore = create<OutfitAnalysisState>()(
  persist(
    (set, get) => ({
      isAnalyzing: false,
      isDone: false,
      imageUri: null,
      progress: 0,
      currentMode: null,
      error: null,
      lastOutfits: [],

      startAnalysis: (imageUri: string, mode?: string) => {
        if (_interval) {
          clearInterval(_interval);
          _interval = null;
        }
        if (_doneTimeout) {
          clearTimeout(_doneTimeout);
          _doneTimeout = null;
        }

        set({
          isAnalyzing: true,
          isDone: false,
          imageUri,
          progress: 0,
          currentMode: mode || "scan-cloth",
          error: null,
        });

        const currentMode = mode || "scan-cloth";
        let aiData: any = null;
        let finalImageUri = imageUri;
        let currentTargetProgress = currentMode === "scan-cloth" ? 25 : 100;

        // Run AI analysis FIRST, and Background Removal ONLY if valid
        if (currentMode === "scan-cloth") {
          analyzeClothingFull(imageUri)
            .then((data) => {
              aiData = data || {
                subCategory: "Unknown Item",
                category: "Top",
                primaryColor: "Unknown",
                occasion: ["Casual"],
                season: ["All"],
                versatilityTags: [],
                confidence: 0,
              };

              // Check if AI rejected the image for SAFETY or content BEFORE uploading
              if (aiData?.error === "SAFETY_VIOLATION") {
                set({
                  error:
                    "Image rejected: Contains inappropriate or unsafe content.",
                  isAnalyzing: false,
                });
                if (_interval) clearInterval(_interval);
                return;
              } else if (aiData?.category === "Full Body") {
                set({
                  error:
                    "Please upload a picture of a single clothing item.\nFull body pictures are meant for Fit Check mode.",
                  isAnalyzing: false,
                });
                if (_interval) clearInterval(_interval);
                return; // Stop here, do not upload
              } else if (aiData?.category === "Not Clothing") {
                set({
                  error:
                    "We couldn't detect any clothing in this picture. Please try another image.",
                  isAnalyzing: false,
                });
                if (_interval) clearInterval(_interval);
                return; // Stop here, do not upload
              }

              currentTargetProgress = 75; // AI finished successfully

              // Image is valid, NOW remove bg and upload to Cloudinary
              return uploadToCloudinaryWithBgRemoval(imageUri).then(
                (uploadRes) => {
                  finalImageUri = uploadRes.imageUrl;
                  set({ imageUri: finalImageUri });
                  currentTargetProgress = 100; // Cloudinary finished
                },
              );
            })
            .catch((err) => {
              console.error("AI/Upload error in store:", err);
              aiData = {
                subCategory: "Error Occurred",
                category: "Top",
                primaryColor: "Unknown",
                occasion: ["Casual"],
                season: ["All"],
                versatilityTags: [],
                confidence: 0,
              };
              currentTargetProgress = 100; // allow finish on error
            });
        } else if (currentMode === "label") {
          currentTargetProgress = 25; // wait for Gemini
          // For label mode, we just run Gemini and finish. No background removal.
          import("@/features/scanning/api/gemini-scan").then(
            ({ analyzeClothLabel }) => {
              analyzeClothLabel(imageUri)
                .then((data) => {
                  aiData = data;
                  if (aiData?.error) {
                    set({
                      error:
                        aiData.error === "SAFETY_VIOLATION"
                          ? "Image rejected: Contains inappropriate or unsafe content."
                          : aiData.error,
                      isAnalyzing: false,
                    });
                    if (_interval) clearInterval(_interval);
                    return;
                  }
                  currentTargetProgress = 100;
                })
                .catch((err) => {
                  console.error("Label AI error in store:", err);
                  aiData = { error: "Failed to analyze label" };
                  currentTargetProgress = 100;
                });
            },
          );
        } else if (currentMode === "fit-check") {
          currentTargetProgress = 25; // wait for Gemini
          // For fit check, we evaluate the full picture with person included. No background removal.
          import("@/features/scanning/api/gemini-scan").then(
            ({ analyzeFitCheck }) => {
              analyzeFitCheck(imageUri)
                .then((data) => {
                  aiData = data;
                  if (aiData?.error === "SAFETY_VIOLATION") {
                    set({
                      error:
                        "Image rejected: Contains inappropriate or unsafe content.",
                      isAnalyzing: false,
                    });
                    if (_interval) clearInterval(_interval);
                    return;
                  } else if (aiData?.rating === "Not an Outfit") {
                    set({
                      error:
                        aiData.actionableFixes?.[0] ||
                        "Please upload a valid outfit photo.",
                      isAnalyzing: false,
                    });
                    if (_interval) clearInterval(_interval);
                    return;
                  }
                  currentTargetProgress = 100;
                })
                .catch((err) => {
                  console.error("Fit Check AI error in store:", err);
                  aiData = { error: "Failed to analyze fit check" };
                  currentTargetProgress = 100;
                });
            },
          );
        }

        _interval = setInterval(() => {
          const state = get();
          if (state.error) {
            clearInterval(_interval!);
            _interval = null;
            return;
          }

          const current = state.progress;
          // Move towards currentTargetProgress instead of always 100
          const next = Math.min(current + INCREMENT, currentTargetProgress);

          // Only finalize if we reach 100 AND the target is 100
          if (next >= 100 && currentTargetProgress >= 100) {
            // If we reached 100%, wait for AI data if it's scan-cloth or label
            if (
              (currentMode === "scan-cloth" ||
                currentMode === "label" ||
                currentMode === "fit-check") &&
              !aiData
            ) {
              // Keep spinning at 99% until data arrives
              set({ progress: 99 });
              return;
            }

            clearInterval(_interval!);
            _interval = null;
            const uri = state.imageUri!;
            const idx = state.lastOutfits.length % OUTFIT_NAMES.length;

            let outfitName = OUTFIT_NAMES[idx];
            let outfitSubtitle = SUBTITLES[idx];
            let outfitTags = TAG_SETS[idx];
            let outfitScore = SCORES[idx];

            if (aiData) {
              if (currentMode === "scan-cloth") {
                outfitName = aiData.subCategory || aiData.category;
                outfitSubtitle = `${aiData.primaryColor} · ${aiData.category}`;
                outfitTags = [
                  ...(aiData.occasion || []),
                  ...(aiData.season || []),
                  "AI Stylist",
                ].slice(0, 3);
                outfitScore = Math.round((aiData.confidence || 0) * 100);
              } else if (currentMode === "label") {
                outfitName = "Clothing Label";
                outfitSubtitle = "Care Instructions";
                outfitTags = ["Care Label", "Scan"];
                outfitScore = 100;
              } else if (currentMode === "fit-check") {
                outfitName = "Fit Check";
                outfitSubtitle = aiData.rating || "Good Look";
                outfitTags = [aiData.occasionMatch || "Casual", "Fit Check"];
                outfitScore = aiData.fitScore || 75;
              }
            }

            set({
              progress: 100,
              isDone: true,
              isAnalyzing: false,
              lastOutfits: [
                ...state.lastOutfits,
                {
                  imageUri: uri,
                  time: formatTime(),
                  name: outfitName,
                  subtitle: outfitSubtitle,
                  tags: outfitTags,
                  score: outfitScore,
                  date: formatDate(),
                  occasion: aiData
                    ? aiData.occasion?.[0] || "Casual"
                    : OCCASIONS[idx],
                  weather: getLiveWeatherString(),
                  itemCount: ITEMS[idx],
                  mode: currentMode,
                  colorPalette:
                    aiData && aiData.secondaryColors
                      ? aiData.secondaryColors
                      : COLOR_PALETTES[idx],
                  clothingData: aiData,
                },
              ],
            });

            _doneTimeout = setTimeout(() => {
              set({
                isDone: false,
                imageUri: null,
                progress: 0,
                currentMode: null,
              });
              _doneTimeout = null;
            }, 4000);
          } else {
            set({ progress: next });
          }
        }, TICK_MS);
      },

      clearAnalysis: () => {
        if (_interval) {
          clearInterval(_interval);
          _interval = null;
        }
        if (_doneTimeout) {
          clearTimeout(_doneTimeout);
          _doneTimeout = null;
        }
        set({ isAnalyzing: false, isDone: false, imageUri: null, progress: 0 });
      },

      removeOutfit: (index) => {
        set({
          lastOutfits: get().lastOutfits.filter((_, i) => i !== index),
        });
      },

      updateOutfit: (index, updates) => {
        set((state) => {
          const newOutfits = [...state.lastOutfits];
          if (newOutfits[index]) {
            newOutfits[index] = { ...newOutfits[index], ...updates };
          }
          return { lastOutfits: newOutfits };
        });
      },

      clearAllOutfits: () => {
        set({ lastOutfits: [] });
      },

      cleanupDaily: () => {
        const state = get();
        const now = new Date();
        const current3AM = new Date(now);
        current3AM.setHours(3, 0, 0, 0);

        // If now is before 3 AM today, the active 3 AM boundary was yesterday.
        // Otherwise, the active 3 AM boundary is today at 3 AM.
        const active3AM =
          now.getTime() < current3AM.getTime()
            ? current3AM.getTime() - 24 * 60 * 60 * 1000
            : current3AM.getTime();

        // If we haven't cleared since the most recent 3 AM boundary, clear now
        if (
          !state.lastClearedTimestamp ||
          state.lastClearedTimestamp < active3AM
        ) {
          set({ lastOutfits: [], lastClearedTimestamp: Date.now() });
        }
      },

      toggleSaved: (index: number) =>
        set((state) => {
          const outfits = [...state.lastOutfits];
          if (outfits[index]) {
            outfits[index] = {
              ...outfits[index],
              isSaved: !outfits[index].isSaved,
            };
          }
          return { lastOutfits: outfits };
        }),
    }),
    {
      name: "outfit-analysis-store",
      storage: createJSONStorage(() => namespacedAsyncStorage),
      partialize: (state) => ({
        lastOutfits: state.lastOutfits,
        lastClearedTimestamp: state.lastClearedTimestamp,
      }),
    },
  ),
);

registerStoreRehydration(() => useOutfitAnalysisStore.persist.rehydrate());
registerStoreReset(() =>
  useOutfitAnalysisStore.setState({ lastOutfits: [], lastClearedTimestamp: 0 })
);
