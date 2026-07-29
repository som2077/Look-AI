import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

// Handle background messages
try {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("Message handled in the background!", remoteMessage);
  });
} catch (error) {
  console.log("Firebase not initialized yet or running in Expo Go.");
}

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestUserPermission() {
  try {
    if (Platform.OS === "ios") {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("Authorization status:", authStatus);
        return true;
      }
      return false;
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    }
  } catch (error) {
    console.log("Firebase not initialized yet or error requesting permission", error);
    return false;
  }
}

export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    // TODO: Save this token to your backend (e.g., Supabase) for this user
    return token;
  } catch (error) {
    console.error("Failed to get FCM token", error);
    return null;
  }
}

export function setupNotificationListeners() {
  try {
    // Listen to foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
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
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        "Notification caused app to open from background state:",
        remoteMessage.notification,
      );
    });

    // When user taps on notification from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "Notification caused app to open from quit state:",
            remoteMessage.notification,
          );
          // Add routing logic here if needed
        }
      });

    return unsubscribe;
  } catch (error) {
    console.log("Firebase not initialized yet. Listeners not attached.", error);
    return () => {};
  }
}
