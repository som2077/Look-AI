module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/test/jest-env-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-worklets|react-native-gesture-handler|lottie-react-native|@shopify/flash-list|react-native-pager-view)',
  ],
  moduleNameMapper: {
    // NOTE: order matters — specific `@/shared/...` mappers must precede the
    // catch-all `^@/(.*)$` mapper below.
    '^@/shared/notifications/firebase-service$': '<rootDir>/test/mocks/firebase-service.ts',
    '^@/features/payments/model/useRevenueCat$': '<rootDir>/test/mocks/revenuecat.ts',
    '^@/features/payments/model/usePremiumLimits$': '<rootDir>/test/mocks/premium-limits.ts',
    '^@/shared/supabase/use-supabase$': '<rootDir>/test/mocks/use-supabase.ts',
    '^@/shared/storage/namespacedStorage$': '<rootDir>/test/mocks/namespacedStorage.ts',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',

    '^test-renderer$': 'react-test-renderer',
    '\\.(css|pcss)$': '<rootDir>/test/mocks/style.ts',
    '^@clerk/clerk-expo$': '<rootDir>/test/mocks/clerk.tsx',
    '^@clerk/clerk-expo/token-cache$': '<rootDir>/test/mocks/clerk.tsx',
    '^@react-native-firebase/analytics$': '<rootDir>/test/mocks/firebase-analytics.ts',
    '^@react-native-firebase/app$': '<rootDir>/test/mocks/firebase-app.ts',
    '^@react-native-firebase/messaging$': '<rootDir>/test/mocks/firebase-messaging.ts',
    '^expo-av$': '<rootDir>/test/mocks/expo-av.tsx',
    '^expo-secure-store$': '<rootDir>/test/mocks/expo-modules.ts',
    '^expo-font$': '<rootDir>/test/mocks/expo-modules.ts',
    '^expo-navigation-bar$': '<rootDir>/test/mocks/expo-modules.ts',
    '^expo-status-bar$': '<rootDir>/test/mocks/expo-status-bar.tsx',
    '^react-native-gesture-handler$': '<rootDir>/test/mocks/gesture-handler.tsx',
    '^react-native-purchases$': '<rootDir>/test/mocks/purchases.ts',
    '^lottie-react-native$': '<rootDir>/test/mocks/lottie.tsx',
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
