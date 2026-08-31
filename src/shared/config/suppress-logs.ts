import { LogBox } from "react-native";

// Ignore specific library deprecation warnings in LogBox
LogBox.ignoreLogs([
  "[expo-av]",
  "Expo AV has been deprecated",
  "This method is deprecated",
  "setBackgroundMessageHandler",
  "getApp",
  "Firebase",
]);

// Suppress all LogBox notifications
LogBox.ignoreAllLogs(true);

// Hide console logs, debug, and warnings from terminal and debugger
console.log = () => {};
console.debug = () => {};
console.warn = () => {};
console.info = () => {};
