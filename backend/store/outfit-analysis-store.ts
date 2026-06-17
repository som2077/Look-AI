import { create } from "zustand";

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
}

interface OutfitAnalysisState {
  isAnalyzing: boolean;
  isDone: boolean;
  imageUri: string | null;
  progress: number;
  lastOutfits: LastOutfit[];
  startAnalysis: (imageUri: string) => void;
  clearAnalysis: () => void;
  removeOutfit: (index: number) => void;
  clearAllOutfits: () => void;
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
const WEATHERS = [
  "☀️ Sunny · 32°C",
  "🌤 Partly Cloudy · 28°C",
  "🌧 Rainy · 24°C",
  "❄️ Cool · 18°C",
];
const SCORES = [92, 88, 95, 78, 85, 90];
const ITEMS = [3, 4, 3, 5, 4, 3];

export const useOutfitAnalysisStore = create<OutfitAnalysisState>(
  (set, get) => ({
    isAnalyzing: false,
    isDone: false,
    imageUri: null,
    progress: 0,
    lastOutfits: [],

    startAnalysis: (imageUri: string) => {
      if (_interval) {
        clearInterval(_interval);
        _interval = null;
      }
      if (_doneTimeout) {
        clearTimeout(_doneTimeout);
        _doneTimeout = null;
      }

      set({ isAnalyzing: true, isDone: false, imageUri, progress: 0 });

      _interval = setInterval(() => {
        const current = get().progress;
        const next = Math.min(current + INCREMENT, 100);

        if (next >= 100) {
          clearInterval(_interval!);
          _interval = null;
          const uri = get().imageUri!;
          const idx = get().lastOutfits.length % OUTFIT_NAMES.length;
          set({
            progress: 100,
            isDone: true,
            isAnalyzing: false,
            lastOutfits: [
              ...get().lastOutfits,
              {
                imageUri: uri,
                time: formatTime(),
                name: OUTFIT_NAMES[idx],
                subtitle: SUBTITLES[idx],
                tags: TAG_SETS[idx],
                score: SCORES[idx],
                date: formatDate(),
                occasion: OCCASIONS[idx],
                weather: WEATHERS[idx % WEATHERS.length],
                itemCount: ITEMS[idx],
              },
            ],
          });

          _doneTimeout = setTimeout(() => {
            set({ isDone: false, imageUri: null, progress: 0 });
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

    removeOutfit: (index: number) =>
      set({ lastOutfits: get().lastOutfits.filter((_, i) => i !== index) }),

    clearAllOutfits: () => set({ lastOutfits: [] }),
  }),
);
