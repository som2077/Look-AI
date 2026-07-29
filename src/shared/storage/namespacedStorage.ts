import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

let currentUserId: string | null = null;

const rehydrateCallbacks: (() => void)[] = [];
const resetCallbacks: (() => void)[] = [];

export const registerStoreRehydration = (rehydrate: () => void) => {
  rehydrateCallbacks.push(rehydrate);
};

export const registerStoreReset = (reset: () => void) => {
  resetCallbacks.push(reset);
};

export const setStorageUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const resetAllUserStores = () => {
  resetCallbacks.forEach((reset) => reset());
};

export const rehydrateAllUserStores = async () => {
  await Promise.all(rehydrateCallbacks.map((rehydrate) => rehydrate()));
};

export const syncStoresWithUser = async (userId: string | null) => {
  setStorageUserId(userId);
  if (!userId) {
    resetAllUserStores();
  }
  await rehydrateAllUserStores();
};

export const namespacedAsyncStorage = {
  getItem: async (name: string) => {
    const prefix = currentUserId ? `${currentUserId}_` : "anonymous_";
    const namespacedKey = `${prefix}${name}`;

    let value = await AsyncStorage.getItem(namespacedKey);

    if (!value && currentUserId) {
      // Migration logic: check if data exists on the old unprefixed key
      value = await AsyncStorage.getItem(name);
      if (value) {
        await AsyncStorage.setItem(namespacedKey, value);
        await AsyncStorage.removeItem(name);
      }
    }

    return value;
  },
  setItem: async (name: string, value: string) => {
    const prefix = currentUserId ? `${currentUserId}_` : "anonymous_";
    return AsyncStorage.setItem(`${prefix}${name}`, value);
  },
  removeItem: async (name: string) => {
    const prefix = currentUserId ? `${currentUserId}_` : "anonymous_";
    return AsyncStorage.removeItem(`${prefix}${name}`);
  },
};

export const namespacedSecureStorage = {
  getItem: async (name: string) => {
    const prefix = currentUserId ? `${currentUserId}_` : "anonymous_";
    const namespacedKey = `${prefix}${name}`;

    let value = await SecureStore.getItemAsync(namespacedKey);

    if (!value && currentUserId) {
      // Migration logic
      value = await SecureStore.getItemAsync(name);
      if (value) {
        await SecureStore.setItemAsync(namespacedKey, value);
        await SecureStore.deleteItemAsync(name);
      }
    }

    return value;
  },
  setItem: async (name: string, value: string) => {
    const prefix = currentUserId ? `${currentUserId}_` : "anonymous_";
    return SecureStore.setItemAsync(`${prefix}${name}`, value);
  },
  removeItem: async (name: string) => {
    const prefix = currentUserId ? `${currentUserId}_` : "anonymous_";
    return SecureStore.deleteItemAsync(`${prefix}${name}`);
  },
};
