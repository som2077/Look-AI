import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { useRouter } from "expo-router";
import { useRevenueCat } from "./useRevenueCat";

export default function PaywallScreen() {
  const router = useRouter();
  const { isReady } = useRevenueCat();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={({ customerInfo }) => {
          if (customerInfo.entitlements.active.pro) {
            router.back();
          }
        }}
        onRestoreCompleted={({ customerInfo }) => {
          if (customerInfo.entitlements.active.pro) {
            router.back();
          }
        }}
        onDismiss={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
