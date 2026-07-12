import { IconArrowLeft } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ position: "absolute", left: 24, zIndex: 10, paddingVertical: 16 }}
          >
            <IconArrowLeft size={24} color="#1D1A27" />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1D1A27" }}>
              History
            </Text>
          </View>
        </View>

        {/* Content Placeholder */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16, color: "#9B9BAF" }}>
            No history available yet.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
