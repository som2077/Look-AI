import { useCommunityPosts } from "@/features/social/api/useCommunityPosts";
import { useNotifications } from "@/features/social/api/useNotifications";
// import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";

import {
  IconBell,
  IconMoodPlus,
  IconPlus,
  IconSend,
  IconX,
} from "@tabler/icons-react-native";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImageCropPicker from "react-native-image-crop-picker";
import ImageViewer from "react-native-image-zoom-viewer";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { useUser } from "@clerk/clerk-expo";

const USER_COLORS = ["#000000", "#BA0017", "#403193", "#34787D", "#2900BF"];

function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

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

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard = React.memo(function PostCard({
  post,
  toggleReaction,
}: {
  post: any;
  toggleReaction: (postId: string, reactionType: string | null) => void;
}) {
  const { user } = useUser();
  const { nickname, username } = useOnboardingState();
  const [showReactions, setShowReactions] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  useEffect(() => {
    if (post.image_url) {
      Image.getSize(
        post.image_url,
        (width, height) => {
          if (width && height) setAspectRatio(width / height);
        },
        () => {
          setAspectRatio(4 / 3);
        },
      );
    }
  }, [post.image_url]);

  const reactions = post.post_reactions || [];
  const myReactionObj = reactions.find((r: any) => r.user_id === user?.id);
  const myReaction = myReactionObj?.reaction_type || null;

  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r: any) => {
    reactionCounts[r.reaction_type] =
      (reactionCounts[r.reaction_type] || 0) + 1;
  });
  const uniqueReactions = Object.keys(reactionCounts);

  const timeAgo = post.created_at ? timeAgoHelper(post.created_at) : "Just now";
  const isCurrentUser =
    post.user_id === user?.id || post.user_profiles?.user_id === user?.id;

  const displayNickname = isCurrentUser
    ? nickname || username || user?.fullName || "User"
    : post.user_profiles?.nickname || post.user_profiles?.username || "User";

  const avatarUrl =
    isCurrentUser && user?.imageUrl
      ? user.imageUrl
      : post.user_profiles?.avatar_url ||
        "https://api.dicebear.com/7.x/avataaars/png?seed=" + post.user_id;

  return (
    <View
      style={{
        paddingVertical: 3,
      }}
    >
      {/* Header: Avatar + Info */}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 44,
            marginRight: 8,
            marginLeft: 8,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: getUserColor(post.user_id || "User"),
            }}
          >
            {displayNickname}
          </Text>
          <Text style={{ fontSize: 11, color: "#00000080", marginTop: 1 }}>
            {timeAgo}
          </Text>
        </View>
      </View>

      {/* Content */}
      {post.caption ? (
        <Text
          style={{
            fontSize: 13,
            color: "#1D1A27",
            lineHeight: 22,
            marginLeft: 10,
            // marginRight: 20,
            marginBottom: post.image_url ? 12 : 8,
          }}
        >
          {post.caption}
        </Text>
      ) : null}

      {/* Image */}
      {post.image_url ? (
        <>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowFullImage(true)}
          >
            <Image
              source={{ uri: post.image_url }}
              style={{
                width: "100%",
                aspectRatio: aspectRatio,
                borderRadius: 12,
                marginBottom: 8,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <Modal
            visible={showFullImage}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowFullImage(false)}
          >
            <ImageViewer
              imageUrls={[{ url: post.image_url }]}
              enableSwipeDown={true}
              onSwipeDown={() => setShowFullImage(false)}
              onCancel={() => setShowFullImage(false)}
              renderIndicator={() => <View />} // Hides the '1/1' text
              renderHeader={() => (
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 50,
                    right: 20,
                    zIndex: 9999,
                    padding: 8,
                  }}
                  onPress={() => setShowFullImage(false)}
                >
                  <IconX size={32} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            />
          </Modal>
        </>
      ) : null}

      {/* Reactions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          gap: 8,
          paddingVertical: 4,
          paddingHorizontal: 10,
        }}
        style={{ marginTop: -5 }}
      >
        {uniqueReactions.slice(0, 3).map((emoji) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => {
              if (myReaction === emoji) {
                toggleReaction(post.id, null);
              } else {
                toggleReaction(post.id, emoji);
              }
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: myReaction === emoji ? "#E0F2FE" : "#F3F4F6",
              borderColor: myReaction === emoji ? "#38BDF890" : "transparent",
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 16,
            }}
          >
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            <Text
              style={{
                fontSize: 13,
                color: myReaction === emoji ? "#0284C7" : "#4B5563",
                fontWeight: "600",
                marginLeft: 6,
              }}
            >
              {reactionCounts[emoji]}
            </Text>
          </TouchableOpacity>
        ))}

        {!myReaction && (
          <TouchableOpacity
            onPress={() => setShowReactions(!showReactions)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconMoodPlus size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Inline Reaction Picker */}
      {showReactions && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            // paddingBottom: 8,
          }}
        >
          {["👍", "👎", "😂", "😡", "🔥"].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                if (myReaction === emoji) {
                  toggleReaction(post.id, null);
                } else {
                  toggleReaction(post.id, emoji);
                }
                setShowReactions(false);
              }}
              style={{
                width: 32,
                height: 32,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 18 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View
        style={{ height: 1, backgroundColor: "#E5E7EB70", marginTop: 15 }}
      />
    </View>
  );
});

// ─── Feed Tab ────────────────────────────────────────────────────────────────

function FeedTab() {
  const router = useRouter();
  const { posts, loading, uploading, createPost, toggleReaction, refetch } =
    useCommunityPosts();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const [inputText, setInputText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    // Track exact keyboard height to push UI up on Edge-to-Edge Android devices
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (
      keyboardHeight === 0 &&
      !inputText.trim() &&
      !imageUri &&
      !isPickingImage
    ) {
      setIsComposing(false);
    }
  }, [keyboardHeight, inputText, imageUri, isPickingImage]);

  const pickImage = async () => {
    setIsPickingImage(true);
    try {
      const result = await ImageCropPicker.openPicker({
        mediaType: "photo",
        cropping: true,
        freeStyleCropEnabled: true,
      });
      if (result && result.path) {
        const validUri = result.path.startsWith("file://")
          ? result.path
          : `file://${result.path}`;
        setImageUri(validUri);
      }
    } catch (e) {
      console.log("Image picker error:", e);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !imageUri) return;
    const success = await createPost(imageUri || "", inputText.trim());
    if (success) {
      setInputText("");
      setImageUri(null);
      setIsComposing(false);
      Keyboard.dismiss();
    }
  };

  // ✂️ PONYTAIL: Pure JS Masonry. No native dependencies (@shopify/flash-list).
  // Approximates heights: images are tall (~250), text only is short (~100 + text length).
  // Perfectly balances columns with zero native crashing.
  const leftColumn: any[] = [];
  const rightColumn: any[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  posts.forEach((post) => {
    const estHeight = post.image_url ? 250 : 100 + (post.caption?.length || 0);
    if (leftHeight <= rightHeight) {
      leftColumn.push(post);
      leftHeight += estHeight;
    } else {
      rightColumn.push(post);
      rightHeight += estHeight;
    }
  });

  const previousPostsLength = useRef(posts.length);

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: keyboardHeight > 0 ? keyboardHeight : 90,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          paddingHorizontal: 16,
          // paddingTop: 20,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: "#1D1A27",
          }}
        >
          Explore here
        </Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity
            onPress={() => router.push("/(root)/notifications")}
          >
            <IconBell size={24} color="#1D1A27" />
            {/* Notification Badge */}
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#FF3B30",
                  borderWidth: 1,
                  borderColor: "#FFF",
                }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setIsComposing(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          >
            <IconPlus size={24} color="#1D1A27" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef as any}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onContentSizeChange={() => {
          if (posts.length !== previousPostsLength.current) {
            scrollRef.current?.scrollToEnd({ animated: true });
            previousPostsLength.current = posts.length;
          }
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        {loading ? (
          <View
            style={{
              alignItems: "center",
              marginTop: 200,
              justifyContent: "center",
            }}
          >
            <Video
              source={require("../../../../assets/loading.webm")}
              style={{ width: 250, height: 220 }}
              shouldPlay
              isLooping
              isMuted
              resizeMode={ResizeMode.CONTAIN}
            />
            <Text
              style={{
                marginTop: -30,
                fontSize: 16,
                fontWeight: "600",
                color: "#1D1A27",
              }}
            >
              Processing...
            </Text>
          </View>
        ) : posts.length === 0 ? (
          <Text
            style={{ textAlign: "center", marginTop: 40, color: "#9CA3AF" }}
          >
            No posts yet. Be the first to share something!
          </Text>
        ) : (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, gap: 12 }}>
              {leftColumn.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  toggleReaction={toggleReaction}
                />
              ))}
            </View>
            <View style={{ flex: 1, gap: 12 }}>
              {rightColumn.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  toggleReaction={toggleReaction}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      {isComposing && (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {imageUri && (
            <View
              style={{
                marginBottom: 12,
                position: "relative",
                alignSelf: "flex-start",
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: "#FF3B30",
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconX size={14} color="#FFFfff" />
              </TouchableOpacity>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 23,
            }}
          >
            <TouchableOpacity
              onPress={pickImage}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#000000",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconPlus size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              style={{
                flex: 1,
                height: 40,
                backgroundColor: "#F3F4F6",
                borderRadius: 20,
                paddingHorizontal: 16,
                fontSize: 14,
                color: "#1D1A27",
              }}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={uploading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor:
                  inputText.trim() || imageUri ? "#1D1A27" : "#000000",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSend size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Explore Screen ────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  return (
    <SwipeTabWrapper tabIndex={2}>
      {/* <AppGradientBackground> */}
      <StatusBar style="dark" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "white" }}
        edges={["top"]}
      >
        <FeedTab />
      </SafeAreaView>
      {/* </AppGradientBackground> */}
    </SwipeTabWrapper>
  );
}
