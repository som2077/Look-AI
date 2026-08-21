import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

/**
 * Safely executes native platform-specific code (e.g. Firebase, Purchases, SecureStore)
 * and returns a fallback when running on Web or when native initialization fails.
 */
export function safeNativeCall<T>(nativeFn: () => T, fallback: T): T {
  if (isWeb) return fallback;
  try {
    return nativeFn();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Native Module Guard] Handled native call exception:', error);
    }
    return fallback;
  }
}
