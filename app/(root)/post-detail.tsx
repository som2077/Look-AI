import {
  IconArrowLeft,
  IconBookmark,
  IconBookmarkFilled,
  IconDots,
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconSend,
  IconTrash,
} from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const MOCK_POSTS = [
  {
    id: "0",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    likes: 124,
    comments: 12,
    time: "3 minutes ago",
  },
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop",
    likes: 89,
    comments: 7,
    time: "1 hour ago",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    likes: 213,
    comments: 24,
    time: "5 hours ago",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    likes: 67,
    comments: 4,
    time: "1 day ago",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    likes: 301,
    comments: 45,
    time: "2 days ago",
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    likes: 55,
    comments: 2,
    time: "3 days ago",
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
    likes: 178,
    comments: 19,
    time: "4 days ago",
  },
  {
    id: "7",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
    likes: 92,
    comments: 8,
    time: "5 days ago",
  },
  {
    id: "8",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop",
    likes: 145,
    comments: 17,
    time: "1 week ago",
  },
];

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = (params.postId as string) || "0";

  const post = MOCK_POSTS.find((p) => p.id === postId) || MOCK_POSTS[0];

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikeCount((c) => c - 1);
    } else {
      setLikeCount((c) => c + 1);
    }
    setLiked(!liked);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: "#000000",
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <IconArrowLeft size={24} color="#FFFFFF" />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
            color: "#FFFFFF",
            marginRight: 28,
          }}
        >
          Posts
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "#000000" }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "#000000",
          }}
        >
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#333",
              marginRight: 10,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
              sindustries2030
            </Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
              {post.time}
            </Text>
          </View>

          {/* 3 Dots Menu Button */}
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={{ padding: 8 }}
          >
            <IconDots size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Post Image */}
        <Image
          source={{ uri: post.url }}
          style={{
            width: width,
            height: width,
            backgroundColor: "#1a1a1a",
          }}
          resizeMode="cover"
        />

        {/* Action Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "#000000",
          }}
        >
          {/* Like */}
          <Pressable
            onPress={handleLike}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginRight: 20,
            }}
          >
            {liked ? (
              <IconHeartFilled size={26} color="#F43F5E" />
            ) : (
              <IconHeart size={26} color="#FFFFFF" />
            )}
            <Text
              style={{
                color: liked ? "#F43F5E" : "#FFFFFF",
                fontSize: 14,
                fontWeight: "600",
                marginLeft: 6,
              }}
            >
              {likeCount}
            </Text>
          </Pressable>

          {/* Comment */}
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginRight: 20,
            }}
          >
            <IconMessage size={26} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "600",
                marginLeft: 6,
              }}
            >
              {post.comments}
            </Text>
          </Pressable>

          {/* Share */}
          <Pressable style={{ marginRight: 20 }}>
            <IconSend size={24} color="#FFFFFF" />
          </Pressable>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Save */}
          <Pressable onPress={() => setSaved(!saved)}>
            {saved ? (
              <IconBookmarkFilled size={26} color="#FFFFFF" />
            ) : (
              <IconBookmark size={26} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* 3-Dot Menu Modal (bottom sheet style) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              backgroundColor: "#1C1C1E",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 40,
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#3A3A3C",
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 16,
              }}
            />

            {/* Delete option */}
            <Pressable
              onPress={handleDelete}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "rgba(244, 63, 94, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <IconTrash size={20} color="#F43F5E" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#F43F5E",
                }}
              >
                Delete Post
              </Text>
            </Pressable>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "#2C2C2E",
                marginHorizontal: 20,
              }}
            />

            {/* Cancel */}
            <Pressable
              onPress={() => setMenuVisible(false)}
              style={{
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "500", color: "#9CA3AF" }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
