import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Plus, Send, Users, X, Heart } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GroupPost as Post, useGroupPosts } from "@/features/social/api/useGroupPosts";
import { useGroups } from "@/features/social/api/useGroups";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const ONLY_3_EMOJIS = ["👍", "❤️", "😂"];

// MOCK_POSTS and Post type moved to social-store

// ─── Emoji Sheet ───────────────────────────────────────────────────────────────

function EmojiSheet({
  visible,
  currentReaction,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentReaction: string | null;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(200)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
        onPress={onClose}
      >
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: 40,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#D1D5DB",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#1D1A27",
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            Add Reaction
          </Text>

          {/* Only 3 emoji options */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              paddingHorizontal: 40,
            }}
          >
            {ONLY_3_EMOJIS.map((emoji) => {
              const isSelected = currentReaction === emoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => onSelect(emoji)}
                  style={{
                    alignItems: "center",
                    backgroundColor: isSelected ? "#F0F0F8" : "transparent",
                    borderRadius: 20,
                    padding: 14,
                    borderWidth: isSelected ? 2 : 2,
                    borderColor: isSelected ? "#1D1A27" : "transparent",
                    minWidth: 72,
                  }}
                >
                  <Text style={{ fontSize: 42 }}>{emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      marginTop: 6,
                      fontWeight: "600",
                    }}
                  >
                    {emoji === "👍" ? "Like" : emoji === "❤️" ? "Love" : "Haha"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Post Item ─────────────────────────────────────────────────────────────────

function PostItem({
  post,
  onReact,
  onReply,
}: {
  post: Post;
  onReact: (postId: string) => void;
  onReply: (username: string) => void;
}) {
  const totalReactions = Object.values(post.reactions || {}).reduce(
    (s, v) => s + v,
    0,
  );
  const reactionEmojis = Object.keys(post.reactions || {});
  const [showReplies, setShowReplies] = useState(false);

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      {/* Avatar */}
      <Image
        source={{ uri: post.avatar }}
        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
      />

      <View style={{ flex: 1 }}>
        {/* Username + time */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1D1A27" }}>
            {post.username}
          </Text>
          <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
            {post.created_at
              ? new Date(post.created_at).toLocaleDateString()
              : "Recently"}
          </Text>
        </View>

        {/* Content */}
        <Text style={{ fontSize: 13, color: "#1D1A27", lineHeight: 18 }}>{post.content}</Text>

        {/* Reply button */}
        <View style={{ marginTop: 6, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => onReply(post.username || "User")}>
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>
              Reply
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Replies with dash */}
        {((post as any).replies?.length || 0) > 0 && (
          <TouchableOpacity
            onPress={() => setShowReplies(!showReplies)}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
          >
            <View style={{ width: 24, height: 1, backgroundColor: "#D1D5DB", marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600" }}>
              {showReplies ? "Hide replies" : `View ${(post as any).replies.length} more repl${(post as any).replies.length === 1 ? "y" : "ies"}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Nested Replies */}
        {showReplies && (post as any).replies?.length > 0 && (
          <View
            style={{
              marginTop: 16,
              borderLeftWidth: 2,
              borderLeftColor: "#F0F0F4",
              paddingLeft: 12,
            }}
          >
            {(post as any).replies.map((reply: any) => (
              <View key={reply.id} style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Image
                    source={{ uri: reply.avatar }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      marginRight: 8,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#1D1A27",
                    }}
                  >
                    {reply.username}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8 }}
                  >
                    {reply.created_at
                      ? new Date(reply.created_at).toLocaleDateString()
                      : "Recently"}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 13, color: "#374151", lineHeight: 18 }}
                >
                  {reply.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Like Column (Far Right) */}
      <View style={{ alignItems: "center", marginLeft: 12, marginTop: 4 }}>
        <TouchableOpacity onPress={() => onReact(post.id)}>
          <Heart
            size={16}
            color={post.myReaction ? "#FF4444" : "#9CA3AF"}
            fill={post.myReaction ? "#FF4444" : "transparent"}
          />
        </TouchableOpacity>
        {totalReactions > 0 && (
          <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
            {totalReactions}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Group Detail Screen ───────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const {
    id: groupId,
    name,
    image,
  } = useLocalSearchParams<{ id: string; name: string; image: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { posts, loading, addPost, toggleReaction } = useGroupPosts(groupId);
  const { joinedGroupIds, joinGroup } = useGroups();

  const isJoined = joinedGroupIds.includes(groupId);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<TextInput>(null);

  const threadedPosts = React.useMemo(() => {
    const parentPosts: any[] = [];
    const sortedPosts = [...posts]
      .reverse()
      .map((p) => ({ ...p, replies: [] }));

    sortedPosts.forEach((post) => {
      let foundParent = false;
      for (let i = parentPosts.length - 1; i >= 0; i--) {
        const possibleParent = parentPosts[i];
        const prefix = `@${possibleParent.username} `;
        if (post.content.startsWith(prefix)) {
          post.content = post.content.substring(prefix.length);
          possibleParent.replies.push(post);
          foundParent = true;
          break;
        }
      }

      if (!foundParent) {
        parentPosts.push(post);
      }
    });

    return parentPosts.reverse();
  }, [posts]);

  const handleReact = useCallback((postId: string) => {
    toggleReaction(postId, "❤️");
  }, [toggleReaction]);

  const handleReply = useCallback((username: string) => {
    setReplyingTo(username);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;

    const finalMessage = replyingTo ? `@${replyingTo} ${message}` : message;
    addPost(finalMessage);

    setMessage("");
    setReplyingTo(null);
  }, [message, addPost, replyingTo]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F0F0F4",
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 4 }}
            >
              <ArrowLeft size={24} color="#1D1A27" />
            </TouchableOpacity>

            <Image
              source={{ uri: image as string }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
            />

            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1D1A27",
                flex: 1,
              }}
            >
              {name}
            </Text>

            <TouchableOpacity
              style={{ padding: 4 }}
              onPress={() =>
                router.push({
                  pathname: "/(root)/(social)/group-info",
                  params: { id: groupId, name, image },
                })
              }
            >
              <Users size={20} color="#1D1A27" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <FlatList
              data={threadedPosts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PostItem
                  post={item}
                  onReact={handleReact}
                  onReply={handleReply}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>

          {/* ── Message Input or Join Prompt ── */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#F0F0F4",
              backgroundColor: "#fff",
              paddingBottom: Math.max(insets.bottom, 12),
            }}
          >
            {isJoined ? (
              <>
                {/* Replying to banner */}
                {replyingTo && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: "#F8F9FC",
                      borderBottomWidth: 1,
                      borderBottomColor: "#F0F0F4",
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#5A5A6A" }}>
                      Replying to{" "}
                      <Text style={{ fontWeight: "600" }}>@{replyingTo}</Text>
                    </Text>
                    <TouchableOpacity onPress={handleCancelReply}>
                      <X size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Input row */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    gap: 12,
                  }}
                >


                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#F7F7F9",
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                    }}
                  >
                    <TextInput
                      ref={inputRef}
                      value={message}
                      onChangeText={setMessage}
                      placeholder={
                        replyingTo ? "Write a reply..." : "Message the group..."
                      }
                      style={{ fontSize: 15, color: "#1D1A27", maxHeight: 100 }}
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSend}
                    disabled={!message.trim()}
                    style={{
                      opacity: message.trim() ? 1 : 0.5,
                    }}
                  >
                    <Send size={24} color="#1D1A27" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    marginBottom: 12,
                    textAlign: "center",
                  }}
                >
                  You must join this group to post messages.
                </Text>
                <TouchableOpacity
                  onPress={() => joinGroup(groupId)}
                  style={{
                    backgroundColor: "#1D1A27",
                    paddingHorizontal: 32,
                    paddingVertical: 12,
                    borderRadius: 24,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                  >
                    Join Group
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
