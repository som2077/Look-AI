import { useCommunityPosts } from "@/features/social/api/useCommunityPosts";
import { useNotifications } from "@/features/social/api/useNotifications";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { FlashList } from "@shopify/flash-list";
import {
  IconArrowNarrowRight,
  IconBell,
  IconDots,
  IconMoodPlus,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react-native";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  RefreshControl,
  Image as RNImage,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { useUser } from "@clerk/clerk-expo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPostDateTime(dateString: string): string {
  if (!dateString) return "Just now";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Just now";
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

const POPULAR_REACTIONS = ["🔥", "👍", "😂", "❤️"];

// ─── Replies Bottom Sheet ─────────────────────────────────────────────────────

function RepliesBottomSheet({
  visible,
  onClose,
  comments,
  post,
  isMyPost,
  isLoading,
  addComment,
  onAddReply,
}: {
  visible: boolean;
  onClose: () => void;
  comments: any[];
  post: any;
  isMyPost: boolean;
  isLoading?: boolean;
  addComment: (postId: string, content: string) => Promise<boolean>;
  onAddReply?: (content: string) => void;
}) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dy > 0 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Overlay Background */}
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={onClose}
              activeOpacity={1}
            />
          </View>

          <Animated.View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: 20,
              maxHeight: SCREEN_HEIGHT * 0.8,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View {...panResponder.panHandlers} style={{ paddingBottom: 16 }}>
              <View
                style={{
                  alignItems: "center",
                  paddingTop: 14,
                  paddingBottom: 6,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#E2E2EA",
                  }}
                />
              </View>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                Replies
              </Text>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <View
                  style={{
                    alignItems: "center",
                    marginTop: 24,
                    marginBottom: 24,
                    gap: 8,
                  }}
                >
                  <ActivityIndicator color="#4C36F5" size="small" />
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#9CA3AF",
                      fontSize: 13,
                    }}
                  >
                    Loading replies...
                  </Text>
                </View>
              ) : comments.length === 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#9CA3AF",
                    marginTop: 20,
                    marginBottom: 20,
                  }}
                >
                  No replies yet. Be the first!
                </Text>
              ) : (
                comments.map((comment: any) => (
                  <View
                    key={comment.id}
                    style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}
                  >
                    <Image
                      source={{
                        uri:
                          comment.user_profiles?.avatar_url ||
                          "https://i.pravatar.cc/80?img=1",
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: "#E5E7EB",
                      }}
                      contentFit="cover"
                    />
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#F3F4F6",
                        padding: 10,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 13,
                          color: "#1D1A27",
                          marginBottom: 2,
                        }}
                      >
                        {comment.user_profiles?.nickname ||
                          comment.user_profiles?.username ||
                          "Style Explorer"}
                      </Text>
                      <Text style={{ fontSize: 14, color: "#4B5563" }}>
                        {comment.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {!isMyPost && (
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#F3F4F6",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <TextInput
                  placeholder="Type your reply..."
                  placeholderTextColor="#9CA3AF"
                  value={replyText}
                  onChangeText={setReplyText}
                  style={{
                    flex: 1,
                    height: 40,
                    backgroundColor: "#F3F4F6",
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    fontSize: 14,
                    color: "#1D1A27",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                />
                <TouchableOpacity
                  disabled={isSubmittingReply || !replyText.trim()}
                  onPress={async () => {
                    setIsSubmittingReply(true);
                    const success = await addComment(post.id, replyText.trim());
                    setIsSubmittingReply(false);
                    if (success) {
                      onAddReply?.(replyText.trim());
                      setReplyText("");
                    }
                  }}
                  style={{
                    backgroundColor: replyText.trim() ? "#3B82F6" : "#D1D5DB",
                    paddingHorizontal: 16,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Timeline Post Card ───────────────────────────────────────────────────────

const TimelinePostCard = React.memo(function TimelinePostCard({
  post,
  toggleReaction,
  deletePost,
  addComment,
  fetchComments,
}: {
  post: any;
  toggleReaction: (postId: string, reactionType: string) => void;
  deletePost: (postId: string) => void;
  addComment: (postId: string, content: string) => Promise<boolean>;
  fetchComments: (postId: string) => Promise<any[]>;
}) {
  const { user } = useUser();
  const { nickname, username } = useOnboardingState();
  const [showReactions, setShowReactions] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);
  const [showRepliesBottomSheet, setShowRepliesBottomSheet] = useState(false);
  // Replies are fetched per-post on demand (not part of the feed select).
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const isMyPost = post.user_id === user?.id;

  useEffect(() => {
    if (typeof post.image_url === "string" && post.image_url) {
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
  const myReactions = reactions
    .filter((r: any) => r.user_id === user?.id)
    .map((r: any) => r.reaction_type);

  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r: any) => {
    if (r.reaction_type) {
      reactionCounts[r.reaction_type] =
        (reactionCounts[r.reaction_type] || 0) + 1;
    }
  });
  const uniqueReactions = Object.keys(reactionCounts);

  // Feed only carries a cheap count aggregate — actual comments load on demand.
  const countAggregate = (post as any).comments_count?.[0]?.count ?? (post as any).post_comments?.[0]?.count;
  const replyCount = commentsLoaded ? comments.length : (countAggregate ?? 0);
  
  // Use loaded comments if available, otherwise use recent_comments from feed
  const sourceComments = commentsLoaded ? comments : ((post as any).recent_comments || []);

  // Get one avatar per comment (up to 4), keeping duplicates so count matches.
  const replierAvatars = sourceComments
    .map(
      (c: any) =>
        c.user_profiles?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user_profiles?.username || "U")}&background=random`,
    )
    .slice(0, 4) as string[];

  const openReplies = React.useCallback(async () => {
    setShowRepliesBottomSheet(true);
    if (commentsLoaded) return;
    setIsLoadingComments(true);
    const rows = await fetchComments(post.id);
    setComments(rows);
    setCommentsLoaded(true);
    setIsLoadingComments(false);
  }, [post.id, fetchComments, commentsLoaded]);

  const handleReplySent = React.useCallback(
    (content: string) => {
      const newComment = {
        id:
          "opt_" +
          Date.now().toString() +
          Math.random().toString(36).slice(2, 7),
        content,
        created_at: new Date().toISOString(),
        user_profiles: {
          nickname: nickname || user?.firstName || "You",
          username: username || "you",
          avatar_url: user?.imageUrl,
        },
      };
      setComments((prev) => [...prev, newComment]);
    },
    [nickname, username, user],
  );

  const formattedTime = post.created_at
    ? formatPostDateTime(post.created_at)
    : `Just now`;

  const isCurrentUser =
    post.user_id === user?.id || post.user_profiles?.user_id === user?.id;

  const displayUsername = isCurrentUser
    ? username
      ? `@${username}`
      : user?.username
        ? `@${user.username}`
        : "User"
    : post.user_profiles?.username
      ? `@${post.user_profiles.username}`
      : "User";

  const avatarUrl =
    isCurrentUser && user?.imageUrl
      ? user.imageUrl
      : post.user_profiles?.avatar_url ||
        "https://api.dicebear.com/7.x/avataaars/png?seed=" + post.user_id;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 24,
      }}
    >
      {/* Left Column: Squircle Avatar */}
      <Image
        source={{ uri: avatarUrl }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: "#F3F4F6",
        }}
        contentFit="cover"
      />

      {/* Right Column: Post Body */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        {/* Author Name + Inline Time */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 1,
            marginTop: -4,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              {displayUsername}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                fontWeight: "400",
              }}
            >
              {formattedTime}
            </Text>
          </View>
          {isCurrentUser && (
            <View style={{ position: "relative", zIndex: 10 }}>
              <TouchableOpacity
                onPress={() => setShowOptions((prev) => !prev)}
                style={{ padding: 4 }}
              >
                <IconDots size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {showOptions && (
                <View
                  style={{
                    position: "absolute",
                    top: 30,
                    right: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    padding: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 1,
                    width: 115,
                    zIndex: 100,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      padding: 10,
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setShowOptions(false);
                      deletePost(post.id);
                    }}
                  >
                    <IconTrash size={18} color="#EF4444" />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color: "#EF4444",
                      }}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Caption */}
        {post.caption ? (
          <Text
            style={{
              fontSize: 15,
              color: "#1F2937",
              lineHeight: 22,
              marginBottom: post.image_url ? 12 : 6,
            }}
          >
            {post.caption}
          </Text>
        ) : null}

        {/* Media Image */}
        {post.image_url ? (
          <>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowFullImage(true)}
              style={{
                width: "100%",
                borderRadius: 22,
                overflow: "hidden",
                backgroundColor: "#F3F4F6",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
                marginBottom: 10,
              }}
            >
              <Image
                source={{ uri: post.image_url }}
                style={{
                  width: "100%",
                  aspectRatio: aspectRatio,
                }}
                contentFit="cover"
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
                renderIndicator={() => <View />}
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

        {/* Reactions Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {uniqueReactions.map((emoji) => {
            const isMine = myReactions.includes(emoji);
            return (
              <TouchableOpacity
                key={emoji}
                activeOpacity={0.7}
                onPress={() => toggleReaction(post.id, emoji)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isMine ? "#EFF6FF" : "#F3F4F6",
                  borderColor: isMine ? "#93C5FD" : "#E5E7EB",
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 18,
                }}
              >
                <Text style={{ fontSize: 14 }}>{emoji}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isMine ? "#2563EB" : "#374151",
                    marginLeft: 5,
                  }}
                >
                  {reactionCounts[emoji]}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Add Reaction Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowReactions((prev) => !prev)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#F3F4F6",
              borderColor: "#E5E7EB",
              borderWidth: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconMoodPlus size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Expandable Reaction Picker */}
        {showReactions && (
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 3,
              backgroundColor: "#FFFFFF",
              borderColor: "#E5E7EB",
              borderWidth: 1,
              borderRadius: 50,
              padding: 5,
              marginTop: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {POPULAR_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                activeOpacity={0.7}
                onPress={() => {
                  toggleReaction(post.id, emoji);
                  setShowReactions(false);
                }}
                style={{
                  padding: 7,
                  borderRadius: 8,
                  backgroundColor: myReactions.includes(emoji)
                    ? "#EFF6FF"
                    : "transparent",
                }}
              >
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Replies Section */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openReplies}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          {/* Overlapping Avatars */}
          {replierAvatars.length > 0 && (
            <View style={{ flexDirection: "row", marginRight: 10 }}>
              {replierAvatars.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                    marginLeft: index > 0 ? -12 : 0,
                    backgroundColor: "#F3F4F6",
                  }}
                  contentFit="cover"
                />
              ))}
            </View>
          )}

          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#3B82F6",
            }}
          >
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#6B7280",
              marginLeft: "auto",
            }}
          >
            {formattedTime}
          </Text>
        </TouchableOpacity>

        {/* Expanded Replies Section */}
        <RepliesBottomSheet
          visible={showRepliesBottomSheet}
          onClose={() => setShowRepliesBottomSheet(false)}
          comments={comments}
          post={post}
          isMyPost={isMyPost}
          isLoading={isLoadingComments}
          addComment={addComment}
          onAddReply={handleReplySent}
        />
      </View>
    </View>
  );
});

// ─── Feed Tab ────────────────────────────────────────────────────────────────

function FeedTab() {
  const router = useRouter();
  const {
    posts,
    loading,
    uploading,
    createPost,
    toggleReaction,
    addComment,
    fetchComments,
    refetch,
    deletePost,
    loadMore,
    loadingMore,
    hasMore,
  } = useCommunityPosts();
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
  const scrollViewRef = useRef<any>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const params = useGlobalSearchParams();

  useEffect(() => {
    if (params.attachedImage) {
      setImageUri(params.attachedImage as string);
      setIsComposing(true);
      setTimeout(() => inputRef.current?.focus(), 200);
      router.setParams({ attachedImage: "" });
    }
  }, [params.attachedImage]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
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
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sortedPosts = React.useMemo(() => {
    return [...posts].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });
  }, [posts]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingBottom: keyboardHeight > 0 ? keyboardHeight : 90,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          paddingHorizontal: 20,
          paddingTop: 4,
          marginTop: 7,
        }}
      >
        <Text
          allowFontScaling={false}
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

      {/* Main Content Area */}
      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 10 }}>
        {loading ? (
          <View
            style={{
              alignItems: "center",
              marginTop: 180,
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
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 15,
                color: "#9CA3AF",
                lineHeight: 22,
              }}
            >
              No posts yet. Be the first to share your style!
            </Text>
          </View>
        ) : (
          <FlashList
            ref={scrollViewRef}
            data={sortedPosts}
            keyExtractor={(item: any) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item: post }: { item: any }) => (
              <TimelinePostCard
                post={post}
                toggleReaction={toggleReaction}
                deletePost={deletePost}
                addComment={addComment}
                fetchComments={fetchComments}
              />
            )}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <ActivityIndicator color="#4C36F5" />
                </View>
              ) : hasMore ? null : (
                <Text
                  style={{
                    textAlign: "center",
                    color: "#9CA3AF",
                    fontSize: 12,
                    paddingVertical: 16,
                  }}
                >
                  You&apos;re all caught up
                </Text>
              )
            }
          />
        )}
      </View>

      {/* Composer Bar */}
      {isComposing && (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 4,
            // marginBottom: 10,
          }}
        >
          {imageUri && (
            <View
              style={{
                marginBottom: 10,
                position: "relative",
                alignSelf: "flex-start",
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: 80, height: 80, borderRadius: 12 }}
              />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: "#000000ff",
                  borderRadius: 12,
                  width: 34,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconX size={14} color="#FFFFFF" />
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
                backgroundColor: "#000000ff",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconPhoto size={20} color="#ffffffff" />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              style={{
                flex: 1,
                height: 42,
                backgroundColor: "#F9FAFB",
                borderRadius: 21,
                paddingHorizontal: 16,
                fontSize: 15,
                color: "#1D1A27",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                // textAlign:"center"
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
                <IconArrowNarrowRight
                  strokeWidth={2.5}
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
      <StatusBar style="dark" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        edges={["top", "bottom"]}
      >
        <FeedTab />
      </SafeAreaView>
    </SwipeTabWrapper>
  );
}
