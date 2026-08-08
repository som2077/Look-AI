import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  namespacedAsyncStorage,
  registerStoreRehydration,
  registerStoreReset,
} from '@/shared/storage/namespacedStorage';

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  hasIncrementedToday: boolean;
  checkStreakValidity: () => void;
  incrementStreakAction: () => void;
  resetStreak: () => void; // for testing purposes
  dismissIncrement: () => void; // dismiss popup flag
}

const getTodayString = () => new Date().toISOString().split("T")[0];

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      hasIncrementedToday: false,

      checkStreakValidity: () => {
        const today = getTodayString();
        const { lastActiveDate, currentStreak } = get();

        if (!lastActiveDate) {
          if (currentStreak !== 0) {
            set({ currentStreak: 0 });
          }
          return;
        }

        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          // Missed a day or more, reset streak in background
          set({
            currentStreak: 0,
            hasIncrementedToday: false,
            // we don't update lastActiveDate so it stays as the last actual active day
            // That's fine, incrementStreakAction handles diffDays > 1.
          });
        }
      },

      incrementStreakAction: () => {
        const today = getTodayString();
        const { lastActiveDate, currentStreak, longestStreak } = get();

        if (lastActiveDate === today) {
          // Already active today
          return;
        }

        if (!lastActiveDate) {
          // First time doing an action
          set({
            lastActiveDate: today,
            currentStreak: 1,
            longestStreak: Math.max(1, longestStreak),
            hasIncrementedToday: true,
          });
          return;
        }

        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Action performed yesterday, increment streak
          const newStreak = currentStreak + 1;
          set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, longestStreak),
            lastActiveDate: today,
            hasIncrementedToday: true,
          });
        } else {
          // Missed a day (or more), restart streak at 1
          set({
            currentStreak: 1,
            longestStreak: Math.max(1, longestStreak),
            lastActiveDate: today,
            hasIncrementedToday: true,
          });
        }
      },

      dismissIncrement: () => set({ hasIncrementedToday: false }),

      resetStreak: () => {
        set({
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          hasIncrementedToday: false,
        });
      },
    }),
    {
      name: "look-ai-streak-storage",
      storage: createJSONStorage(() => namespacedAsyncStorage),
    },
  ),
);

registerStoreRehydration(() => useStreakStore.persist.rehydrate());
registerStoreReset(() => useStreakStore.getState().resetStreak());
