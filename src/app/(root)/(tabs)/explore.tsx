import { useCommunityPosts } from "@/features/social/api/useCommunityPosts";
import { useNotifications } from "@/features/social/api/useNotifications";
// import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";

import {
  IconBell,
  IconMoodPlus,
  IconPhoto,
  IconPlus,
  IconSend,
  IconX,
} from "@tabler/icons-react-native";
import { ResizeMode, Video } from "expo-av";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image as RNImage,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
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
    if (typeof post.image_url === "string") {
      RNImage.getSize(
        post.image_url,
        (width: number, height: number) => {
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
        backgroundColor: "#F8F7FC70",
        borderRadius: 24,
        borderColor: "#000000",
        borderWidth: 0.02,
        padding: 10,
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
            borderRadius: 20,
            marginRight: 10,
          }}
        />
        <View style={{ flex: 1, justifyContent: "center" }}>
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
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            {timeAgo}
          </Text>
        </View>
      </View>

      {/* Content */}
      {post.caption ? (
        <Text
          style={{
            fontSize: 14,
            color: "#1D1A27",
            lineHeight: 20,
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
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.04)",
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
              paddingHorizontal: 12,
              paddingVertical: 6,
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

  const params = useGlobalSearchParams();

  useEffect(() => {
    if (params.attachedImage) {
      setImageUri(params.attachedImage as string);
      setIsComposing(true);
      setTimeout(() => inputRef.current?.focus(), 200);
      // Clear the param so it doesn't re-trigger
      router.setParams({ attachedImage: "" });
    }
  }, [params.attachedImage]);

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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
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

  const renderMasonryItem = React.useCallback(({ item }: { item: any }) => (
    <View style={{ padding: 3.5 }}>
      <PostCard post={item} toggleReaction={toggleReaction} />
    </View>
  ), [toggleReaction]);

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
          paddingHorizontal: 18,
          // paddingTop: 1,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: "#1D1A27",
            letterSpacing: -0.5,
          }}
        >
          Explore
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: "#E2E2EA",
              backgroundColor: "#F8F7FC",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => {
              setIsComposing(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          >
            <IconPlus size={20} color="#1D1A27" strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: "#E2E2EA",
              backgroundColor: "#F8F7FC",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => router.push("/(root)/notifications")}
          >
            <IconBell size={20} color="#1D1A27" strokeWidth={1.8} />
            {/* Notification Badge */}
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#EF4444",
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
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
          <FlashList
            data={posts}
            numColumns={2}
            renderItem={renderMasonryItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>

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
                backgroundColor: "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconPhoto size={20} color="#4B5563" />
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
                backgroundColor: "#F9FAFB",
                borderRadius: 20,
                paddingHorizontal: 16,
                fontSize: 15,
                color: "#1D1A27",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={uploading || (!inputText.trim() && !imageUri)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor:
                  inputText.trim() || imageUri ? "#1D1A27" : "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {uploading ? (
                <ActivityIndicator
                  size="small"
                  color={inputText.trim() || imageUri ? "#FFFFFF" : "#9CA3AF"}
                />
              ) : (
                <IconSend
                  size={18}
                  color={inputText.trim() || imageUri ? "#FFFFFF" : "#9CA3AF"}
                />
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
