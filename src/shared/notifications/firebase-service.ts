import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let messaging: any = null;

if (Platform.OS !== "web") {
  try {
    messaging = require("@react-native-firebase/messaging").default;
  } catch (e) {
    if (__DEV__) console.log("Firebase messaging module missing or un-linked.");
  }
}

// Handle background messages
if (messaging) {
  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log("Message handled in the background!", remoteMessage);
    });
  } catch {
    console.log("Firebase not initialized yet or running in Expo Go.");
  }
}

// Configure how notifications appear when app is in foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  // Ignored if platform does not support Expo notifications
}

export async function requestUserPermission() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.log("Firebase not initialized yet or error requesting permission", error);
    return false;
  }
}

export async function getFCMToken() {
  if (!messaging) return null;
  try {
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Failed to get FCM token", error);
    return null;
  }
}

export function setupNotificationListeners() {
  if (!messaging) return () => { };
  try {
    // Listen to foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      console.log("A new FCM message arrived in the foreground!", remoteMessage);

      // Show system notification instead of an in-app Alert
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            data: remoteMessage.data,
          },
          trigger: null, // show immediately
        });
      }
    });

    // When user taps on notification in background state
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log(
        "Notification caused app to open from background state:",
        remoteMessage.notification,
      );
    });

    // When user taps on notification from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log(
            "Notification caused app to open from quit state:",
            remoteMessage.notification,
          );
        }
      });

    return unsubscribe;
  } catch (error) {
    console.log("Firebase not initialized yet. Listeners not attached.", error);
    return () => { };
  }
}
