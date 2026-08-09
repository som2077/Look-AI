import * as SecureStore from "expo-secure-store";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL environment variable.");
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable.",
  );
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

let currentGetToken: (() => Promise<string | null>) | undefined;
let currentUserId: string | null = null;

export const setSupabaseTokenGetter = (
  getter: (() => Promise<string | null>) | undefined,
) => {
  currentGetToken = getter;
};

export const setSupabaseGlobalUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const getSupabaseGlobalUserId = (): string | null => {
  return currentUserId;
};

export const createSupabaseClient = (
  getToken?: () => Promise<string | null>,
): SupabaseClient => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: ExpoSecureStoreAdapter,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        apikey: supabaseAnonKey,
      },
    },
    accessToken: async () => {
      const fn = getToken || currentGetToken;
      const clerkToken = fn ? await fn() : null;
      return clerkToken ?? null;
    },
  });
};

export const supabase = createSupabaseClient();

