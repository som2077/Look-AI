import type { ExpoConfig } from "expo/config";

// Use any for android config to avoid TypeScript errors with Expo's incomplete types
const config: ExpoConfig = {
  name: "Look AI",
  slug: "look-ai",
  version: "4.2.9",
  owner: "imperial-tech",
  description:
    "AI-powered outfit recommendations based on your wardrobe, body type, weather, and occasion.",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "look-ai",
  userInterfaceStyle: "automatic",
  primaryColor: "#6366f1",
  newArchEnabled: true,
  jsEngine: "hermes",

  android: {
    package: "com.lookai.android",
    versionCode: 1,
    allowBackup: false,
    permissions: [
      "READ_MEDIA_IMAGES",
      "READ_MEDIA_VISUAL_USER_SELECTED",
      "READ_CALENDAR",
      "WRITE_CALENDAR",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.READ_CALENDAR",
      "android.permission.WRITE_CALENDAR",
    ],
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/android/playstore-icon-padded.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    googleServicesFile: "./google-services.json",
    softwareKeyboardLayoutMode: "resize",
  } as any,

  web: {
    output: "static",
    favicon: "./assets/android/ic_launcher-web.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow Look AI to access your location to show local weather.",
        locationWhenInUsePermission:
          "Allow Look AI to access your location to show local weather.",
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Allow Look AI to access your camera to log outfits.",
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission:
          "Allow Look AI to access your photos to select multiple images for batch scanning.",
        savePhotosPermission: "Allow Look AI to save outfits.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/android/playstore-icon.png",
        imageWidth: 100,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "expo-web-browser",
    "expo-font",
    "expo-secure-store",
    "expo-audio",
    "expo-localization",
    [
      "expo-calendar",
      {
        calendarPermission:
          "Allow Look AI to access your calendar to suggest contextual outfits.",
      },
    ],
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    [
      "@sentry/react-native/expo",
      {
        organization: process.env.SENTRY_ORG || "",
        project: process.env.SENTRY_PROJECT || "",
        authToken: process.env.SENTRY_AUTH_TOKEN || "",
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: "005a59eb-88ff-44f1-a83f-4641dd97875b",
    },
    router: {},
  },

  updates: {
    url: "https://u.expo.dev/005a59eb-88ff-44f1-a83f-4641dd97875b",
  },

  runtimeVersion: {
    policy: "appVersion",
  },
};

export default config;

