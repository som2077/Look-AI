import React, {
  useCallback,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const ONLY_3_EMOJIS = ["👍", "❤️", "😂"];

const MOCK_POSTS = [
  {
    id: "1",
    username: "sarah_k",
    avatar: "https://i.pravatar.cc/80?img=1",
    timeAgo: "3d",
    content:
      "Find looks for every occasion. Browse community style ideas. Save outfits you love. Create your next perfect fit.",
    replyCount: 0,
    reactions: {} as Record<string, number>,
    myReaction: null as string | null,
  },
  {
    id: "2",
    username: "james_m",
    avatar: "https://i.pravatar.cc/80?img=2",
    timeAgo: "1d",
    content:
      "Find looks for every occasion. Browse community style ideas. Save outfits you love. Create your next perfect fit.",
    replyCount: 2,
    reactions: { "😂": 2 } as Record<string, number>,
    myReaction: null as string | null,
  },
  {
    id: "3",
    username: "priya_v",
    avatar: "https://i.pravatar.cc/80?img=3",
    timeAgo: "2h",
    content:
      "Find looks for every occasion. Browse community style ideas. Save outfits you love. Create your next perfect fit.",
    replyCount: 5,
    reactions: { "👍": 3, "❤️": 1 } as Record<string, number>,
    myReaction: null as string | null,
  },
  {
    id: "4",
    username: "alex_t",
    avatar: "https://i.pravatar.cc/80?img=4",
    timeAgo: "30m",
    content:
      "Loving this community! The style ideas here are truly amazing and inspiring every day.",
    replyCount: 0,
    reactions: {} as Record<string, number>,
    myReaction: null as string | null,
  },
];

type Post = (typeof MOCK_POSTS)[0];

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
                    {emoji === "👍"
                      ? "Like"
                      : emoji === "❤️"
                      ? "Love"
                      : "Haha"}
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
  const totalReactions = Object.values(post.reactions).reduce(
    (s, v) => s + v,
    0
  );
  const reactionEmojis = Object.keys(post.reactions);

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F4",
      }}
    >
      {/* Avatar */}
      <Image
        source={{ uri: post.avatar }}
        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
      />

      <View style={{ flex: 1 }}>
        {/* Username + time */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1D1A27" }}>
            {post.username}
          </Text>
          <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{post.timeAgo}</Text>
        </View>

        {/* Content */}
        <Text style={{ fontSize: 14, color: "#374151", lineHeight: 20 }}>
          {post.content}
        </Text>

        {/* Reactions display */}
        {totalReactions > 0 && (
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 }}
          >
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#F5F5F7",
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 4,
                alignItems: "center",
                gap: 2,
              }}
            >
              {reactionEmojis.map((e) => (
                <Text key={e} style={{ fontSize: 14 }}>
                  {e}
                </Text>
              ))}
              <Text style={{ fontSize: 12, color: "#6B7280", marginLeft: 4, fontWeight: "600" }}>
                {totalReactions}
              </Text>
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 18 }}>
          <TouchableOpacity onPress={() => onReply(post.username)}>
            <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "600" }}>
              Reply
            </Text>
          </TouchableOpacity>

          {post.replyCount > 0 && (
            <TouchableOpacity>
              <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "600" }}>
                View {post.replyCount} repl{post.replyCount === 1 ? "y" : "ies"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => onReact(post.id)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: post.myReaction ? "#1D1A27" : "#6B7280",
              }}
            >
              {post.myReaction ? post.myReaction + " React" : "React"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Leaderboard Tab ───────────────────────────────────────────────────────────

const LEADERBOARD = [
  { rank: 1, username: "priya_v", avatar: "https://i.pravatar.cc/80?img=3", score: 2480, badge: "🏆" },
  { rank: 2, username: "james_m", avatar: "https://i.pravatar.cc/80?img=2", score: 1920, badge: "🥈" },
  { rank: 3, username: "sarah_k", avatar: "https://i.pravatar.cc/80?img=1", score: 1540, badge: "🥉" },
  { rank: 4, username: "alex_t", avatar: "https://i.pravatar.cc/80?img=4", score: 980, badge: "" },
  { rank: 5, username: "maya_r", avatar: "https://i.pravatar.cc/80?img=5", score: 750, badge: "" },
];

function LeaderboardTab() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 }}
    >
      {LEADERBOARD.map((item) => (
        <View
          key={item.rank}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: item.rank <= 3 ? "#FAFAFA" : "#fff",
            borderRadius: 16,
            padding: 14,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: item.rank === 1 ? "#FFD700" : item.rank === 2 ? "#C0C0C0" : item.rank === 3 ? "#CD7F32" : "#F0F0F4",
          }}
        >
          <Text style={{ fontSize: 18, width: 30, textAlign: "center" }}>
            {item.badge || `#${item.rank}`}
          </Text>
          <Image
            source={{ uri: item.avatar }}
            style={{ width: 44, height: 44, borderRadius: 22, marginHorizontal: 12 }}
          />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: "#1D1A27" }}>
            @{item.username}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#1D1A27" }}>
            {item.score.toLocaleString()} pts
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Group Detail Screen ───────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { name, image } = useLocalSearchParams<{ name: string; image: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"chat" | "leaderboard">("chat");
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  // Emoji sheet state
  const [emojiSheetPostId, setEmojiSheetPostId] = useState<string | null>(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<TextInput>(null);

  const currentPost = emojiSheetPostId
    ? posts.find((p) => p.id === emojiSheetPostId) ?? null
    : null;

  const handleReact = useCallback((postId: string) => {
    setEmojiSheetPostId(postId);
  }, []);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (!emojiSheetPostId) return;
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== emojiSheetPostId) return p;

          const newReactions = { ...p.reactions };
          if (p.myReaction === emoji) {
            // Toggle off
            newReactions[emoji] = (newReactions[emoji] ?? 1) - 1;
            if (newReactions[emoji] <= 0) delete newReactions[emoji];
            return { ...p, myReaction: null, reactions: newReactions };
          } else {
            // Remove previous reaction
            if (p.myReaction) {
              newReactions[p.myReaction] = (newReactions[p.myReaction] ?? 1) - 1;
              if (newReactions[p.myReaction] <= 0) delete newReactions[p.myReaction];
            }
            // Add new
            newReactions[emoji] = (newReactions[emoji] ?? 0) + 1;
            return { ...p, myReaction: emoji, reactions: newReactions };
          }
        })
      );
      setEmojiSheetPostId(null);
    },
    [emojiSheetPostId]
  );

  const handleReply = useCallback((username: string) => {
    setReplyingTo(username);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    setMessage("");
    setReplyingTo(null);
  }, [message]);

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
          keyboardVerticalOffset={0}
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
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontSize: 22, color: "#1D1A27", fontWeight: "600" }}>
                ‹
              </Text>
            </TouchableOpacity>

            <Image
              source={{ uri: image as string }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
            />

            <Text style={{ fontSize: 17, fontWeight: "700", color: "#1D1A27", flex: 1 }}>
              {name}
            </Text>
          </View>

          {/* ── Sub-tabs ── */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: "#F0F0F4",
            }}
          >
            {(["chat", "leaderboard"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  alignItems: "center",
                  borderBottomWidth: 2,
                  borderBottomColor:
                    activeTab === tab ? "#1D1A27" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: activeTab === tab ? "700" : "500",
                    color: activeTab === tab ? "#1D1A27" : "#9CA3AF",
                    textTransform: "capitalize",
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Content ── */}
          <View style={{ flex: 1 }}>
            {activeTab === "chat" ? (
              <FlatList
                data={posts}
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
            ) : (
              <LeaderboardTab />
            )}
          </View>

          {/* ── Message Input (only on chat tab) ── */}
          {activeTab === "chat" && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#F0F0F4",
                backgroundColor: "#fff",
              }}
            >
              {/* Replying to banner */}
              {replyingTo && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: "#F5F5F7",
                    borderBottomWidth: 1,
                    borderBottomColor: "#EAEAEE",
                  }}
                >
                  <Text
                    style={{ flex: 1, fontSize: 13, color: "#6B7280", fontWeight: "500" }}
                  >
                    Replying to{" "}
                    <Text style={{ color: "#1D1A27", fontWeight: "700" }}>
                      @{replyingTo}
                    </Text>
                  </Text>
                  <TouchableOpacity onPress={handleCancelReply}>
                    <Text style={{ fontSize: 18, color: "#9CA3AF", lineHeight: 20 }}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Input row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  gap: 10,
                }}
              >
                <TextInput
                  ref={inputRef}
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  value={message}
                  onChangeText={setMessage}
                  style={{
                    flex: 1,
                    backgroundColor: "#F5F5F7",
                    borderRadius: 22,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: "#1D1A27",
                    maxHeight: 100,
                  }}
                  multiline
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />

                <TouchableOpacity
                  onPress={handleSend}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: message.trim() ? "#1D1A27" : "#E5E7EB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>➤</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Emoji Reaction Sheet ── */}
      <EmojiSheet
        visible={emojiSheetPostId !== null}
        currentReaction={currentPost?.myReaction ?? null}
        onSelect={handleEmojiSelect}
        onClose={() => setEmojiSheetPostId(null)}
      />
    </View>
  );
}
