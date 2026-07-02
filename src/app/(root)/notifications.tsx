import { IconArrowLeft, IconBell } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FAFAFA" }}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        >
          <IconArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#000000" }}>
          Notifications
        </Text>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
        }}
      >
        {/* Bell Icon Circle */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#F8F7FC",
            borderWidth: 0.3,
            borderColor: "#E2E2EA",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 7,
          }}
        >
          <IconBell size={32} color="#000000" />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#000000",
            marginBottom: 7,
            textAlign: "center",
          }}
        >
          No notifications yet!
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 14,
            color: "#888888",
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          You&apos;ll get updates on new posts, when people interact with your
          comments, and more.
        </Text>
      </View>
    </SafeAreaView>
  );
}
