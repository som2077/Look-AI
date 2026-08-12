import AsyncStorageMock from "@react-native-async-storage/async-storage/jest/async-storage-mock";

export const registerStoreRehydration = jest.fn((_rehydrate: () => void) => {});
export const registerStoreReset = jest.fn((_reset: () => void) => {});
export const setStorageUserId = jest.fn((_userId: string | null) => {});
export const resetAllUserStores = jest.fn(async () => {});
export const rehydrateAllUserStores = jest.fn(async () => {});
export const syncStoresWithUser = jest.fn(async (_userId: string | null) => {});

export const namespacedAsyncStorage = AsyncStorageMock;

export const namespacedSecureStorage = {
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
};
