import { IconArrowLeft } from "@tabler/icons-react-native";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          // paddingVertical: 1,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: "absolute", left: 20, zIndex: 10 }}
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
          paddingHorizontal: 50,
          marginTop: -200,
        }}
      >
        {/* Video Animation */}
        <Video
          source={require("../../../assets/notification.webm")}
          style={{ width: 250, height: 250 }}
          shouldPlay
          isLooping
          isMuted
          resizeMode={ResizeMode.CONTAIN}
        />

        {/* Title */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#000000",
            marginBottom: 7,
            textAlign: "center",
            marginTop: -30,
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
