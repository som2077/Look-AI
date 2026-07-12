import { useRevenueCat } from "@/features/payments/useRevenueCat";
import { IconArrowLeft } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const { isPro } = useRevenueCat();

  const handleManage = () => {
    if (Platform.OS === "android") {
      Linking.openURL("https://play.google.com/store/account/subscriptions");
    } else {
      Linking.openURL("https://apps.apple.com/account/subscriptions");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 16 }}>
          Manage Subscription
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        {isPro ? (
          <Text style={{ fontSize: 16, color: "#4B5563", marginBottom: 20 }}>
            You are currently on the Look AI Pro plan! You can manage your
            subscription directly in the App Store/Play Store settings.
          </Text>
        ) : (
          <Text style={{ fontSize: 16, color: "#4B5563", marginBottom: 20 }}>
            You do not have an active subscription.
          </Text>
        )}

        <TouchableOpacity
          onPress={handleManage}
          style={{
            backgroundColor: "#6366f1",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            Open Store Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
