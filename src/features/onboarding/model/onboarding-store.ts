import type { SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  namespacedSecureStorage,
  registerStoreRehydration,
  registerStoreReset,
} from "@/shared/storage/namespacedStorage";

export type Gender = "Male" | "Female" | "";

type OnboardingFormData = {
  age: number;
  height: number;
  gender: Gender;
  bodyType: string;
  nickname: string;
  username: string;
  bio: string;
  about: string;
  stylePreferences: string[];
  whereDidYouHear: string[];
};

type OnboardingState = OnboardingFormData & {
  isSaving: boolean;
  error: string | null;
  _completionVersion: number;
  activeUserId: string | null;
  setAge: (value: number) => void;
  setHeight: (value: number) => void;
  setGender: (value: Gender) => void;
  setBodyType: (value: string) => void;
  setNickname: (value: string) => void;
  setUsername: (value: string) => void;
  setBio: (value: string) => void;
  setAbout: (value: string) => void;
  toggleStyle: (value: string) => void;
  setWhereDidYouHear: (value: string[]) => void;
  ensureUserSession: (userId: string) => void;
  resetState: () => void;
  completeOnboarding: (
    userId: string,
    supabase: SupabaseClient,
    avatarUrl?: string
  ) => Promise<boolean>;
};

const createInitialFormState = (): OnboardingFormData => ({
  age: 28,
  height: 165,
  gender: "" as Gender,
  bodyType: "",
  nickname: "",
  username: "",
  bio: "",
  about: "",
  stylePreferences: [],
  whereDidYouHear: [],
});

// We no longer need the local secureStorage wrapper since we use namespacedSecureStorage

export const useOnboardingState = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...createInitialFormState(),
      isSaving: false,
      error: null,
      _completionVersion: 0,
      activeUserId: null,
      setAge: (age) => set({ age }),
      setHeight: (height) => set({ height }),
      setGender: (gender) => set({ gender }),
      setBodyType: (bodyType) => set({ bodyType }),
      setNickname: (nickname) => set({ nickname }),
      setUsername: (username) => set({ username }),
      setBio: (bio) => set({ bio }),
      setAbout: (about) => set({ about }),
      toggleStyle: (style) =>
        set((state) => {
          if (state.stylePreferences.includes(style)) {
            return {
              stylePreferences: state.stylePreferences.filter(
                (s) => s !== style,
              ),
            };
          }
          if (state.stylePreferences.length >= 5) return state;
          return { stylePreferences: [...state.stylePreferences, style] };
        }),
      setWhereDidYouHear: (whereDidYouHear) => set({ whereDidYouHear }),
      ensureUserSession: (userId: string) =>
        set((state) => {
          if (state.activeUserId === userId) return {};

          return {
            ...createInitialFormState(),
            activeUserId: userId,
            isSaving: false,
            error: null,
            _completionVersion: 0,
          };
        }),
      resetState: () =>
        set({
          ...createInitialFormState(),
          activeUserId: null,
          isSaving: false,
          error: null,
          _completionVersion: 0,
        }),
      completeOnboarding: async (userId: string, supabase: SupabaseClient, avatarUrl?: string) => {
        set({ isSaving: true, error: null });
        try {
          const state = get();

          const { error } = await supabase.from("user_profiles").upsert(
            {
              user_id: userId,
              age: state.age,
              height: state.height,
              gender: state.gender,
              body_type: state.bodyType,
              nickname: state.nickname,
              username: state.username,
              bio: state.bio,
              about: state.about,
              style_preferences: state.stylePreferences,
              where_did_you_hear: state.whereDidYouHear,
              avatar_url: avatarUrl,
            },
            { onConflict: "user_id" },
          );

          if (error) throw error;

          await SecureStore.setItemAsync(
            `onboarding_complete_${userId}`,
            "true",
          );
          set({
            isSaving: false,
            _completionVersion: get()._completionVersion + 1,
          });
          return true;
        } catch (e: any) {
          console.error("Onboarding completion failed:", e);
          let errorMessage = "Failed to save onboarding data";
          if (e.code === '23505' || e.message?.includes('duplicate key')) {
            errorMessage = "Username is already taken. Please go back and choose another.";
          }
          set({ isSaving: false, error: errorMessage });
          return false;
        }
      },
    }),
    {
      name: "onboarding-state",
      storage: createJSONStorage(() => namespacedSecureStorage),
      partialize: ({ isSaving, error, _completionVersion, ...state }) => state,
    },
  ),
);

registerStoreRehydration(() => useOnboardingState.persist.rehydrate());
registerStoreReset(() => useOnboardingState.getState().resetState());

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => children;
