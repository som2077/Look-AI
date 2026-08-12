import { IconArrowLeft } from "@tabler/icons-react-native";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNotifications, NotificationItem } from "@/features/social/api/useNotifications";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { useIsFocused } from "@react-navigation/native";

function timeAgoHelper(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { notifications, loading, markAllAsRead } = useNotifications();

  useEffect(() => {
    if (isFocused) {
      markAllAsRead();
    }
  }, [isFocused]);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const actor = item.actor_profile;
    const post = item.community_post;
    const isReaction = item.type === "reaction";

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: item.is_read ? "#FFFFFF" : "#F0F9FF",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <Image
          source={{
            uri:
              actor?.avatar_url ||
              "https://api.dicebear.com/7.x/avataaars/png?seed=" + item.actor_id,
          }}
          style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
        />
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 14, color: "#1D1A27", lineHeight: 20 }}>
            <Text style={{ fontWeight: "700" }}>
              {actor?.nickname || actor?.username || "Someone"}
            </Text>{" "}
            {isReaction ? (
              <Text>
                reacted {item.reaction_type} to your post.
              </Text>
            ) : (
              <Text>interacted with your post.</Text>
            )}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            {timeAgoHelper(item.created_at)}
          </Text>
        </View>

        {post?.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={{ width: 44, height: 44, borderRadius: 8 }}
          />
        )}
      </View>
    );
  };

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
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
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
      {loading ? (
        <LoadingScreen label="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 50,
            marginTop: -100,
          }}
        >
          <Video
            source={require("../../../assets/notification.webm")}
            style={{ width: 250, height: 250 }}
            shouldPlay
            isLooping
            isMuted
            resizeMode={ResizeMode.CONTAIN}
          />
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
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
