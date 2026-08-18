/**
 * Un-overengineered, lightweight Service Provider Interfaces
 * for 3rd-party services (Analytics, Paywalls/RevenueCat, AI Styling).
 */

export interface IAnalyticsProvider {
  logEvent(event: string, params?: Record<string, any>): void;
  setUserProperty(key: string, value: string): void;
}

export interface IPaywallProvider {
  getOfferings(): Promise<any>;
  purchasePackage(pkg: any): Promise<boolean>;
  restorePurchases(): Promise<boolean>;
}

export interface IAIServiceProvider {
  generateOutfit(prompt: string, context?: Record<string, any>): Promise<any>;
}

// Fallback no-op providers for Web / Dev environments to prevent crashes
export const NoOpAnalyticsProvider: IAnalyticsProvider = {
  logEvent: (event, params) => console.log('[Analytics Dev/Web]', event, params),
  setUserProperty: (key, value) => console.log('[Analytics Dev/Web SetUser]', key, value),
};

export const NoOpPaywallProvider: IPaywallProvider = {
  getOfferings: async () => ({ current: null }),
  purchasePackage: async () => false,
  restorePurchases: async () => false,
};
