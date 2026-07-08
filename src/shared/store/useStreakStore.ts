import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  hasIncrementedToday: boolean;
  updateStreak: () => void;
  resetStreak: () => void; // for testing purposes
  dismissIncrement: () => void; // dismiss popup flag
}

const getTodayString = () => new Date().toISOString().split("T")[0];

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: null,
      hasIncrementedToday: false,

      updateStreak: () => {
        const today = getTodayString();
        const { lastActiveDate, currentStreak, longestStreak } = get();

        if (!lastActiveDate) {
          // First time opening the app with this store
          set({
            lastActiveDate: today,
            currentStreak: 1,
            longestStreak: Math.max(1, longestStreak),
            hasIncrementedToday: true, // We trigger the celebration!
          });
          return;
        }

        if (lastActiveDate === today) {
          // Already active today, streak doesn't change
          // Keep hasIncrementedToday as is, it might be dismissed later
          return;
        }

        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date(today);

        // Calculate difference in days (ignoring timezones for a basic streak)
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Opened yesterday, increment streak
          const newStreak = currentStreak + 1;
          set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, longestStreak),
            lastActiveDate: today,
            hasIncrementedToday: true,
          });
        } else {
          // Missed a day (or more), reset streak
          set({
            currentStreak: 1,
            lastActiveDate: today,
            hasIncrementedToday: true, // Show popup for streak reset/start
          });
        }
      },

      dismissIncrement: () => set({ hasIncrementedToday: false }),

      resetStreak: () => {
        set({
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: null,
          hasIncrementedToday: false,
        });
      },
    }),
    {
      name: "look-ai-streak-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
