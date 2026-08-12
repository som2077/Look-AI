export const useRevenueCat = jest.fn(() => ({
  isPro: false,
  packages: [],
  isReady: true,
  purchasePackage: jest.fn(async () => false),
  restorePurchases: jest.fn(async () => false),
}));
