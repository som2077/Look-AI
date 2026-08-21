import { Platform } from 'react-native';

const dummyAnalytics = () => ({
  logEvent: async (name: string, params?: object) => {
    if (__DEV__) console.log('[Analytics Mock]', name, params);
  },
  setUserId: async (id: string | null) => {
    if (__DEV__) console.log('[Analytics Mock SetUserId]', id);
  },
  setUserProperty: async (name: string, value: string | null) => {
    if (__DEV__) console.log('[Analytics Mock SetUserProperty]', name, value);
  },
  logScreenView: async (params: { screen_name: string; screen_class?: string }) => {
    if (__DEV__) console.log('[Analytics Mock ScreenView]', params);
  },
});

let analyticsExport: any = dummyAnalytics;

if (Platform.OS !== 'web') {
  try {
    const analyticsModule = require('@react-native-firebase/analytics').default;
    analyticsExport = analyticsModule;
  } catch (e) {
    if (__DEV__) console.warn('[Analytics] Native analytics module unavailable, using mock fallback.');
  }
}

export default analyticsExport;
