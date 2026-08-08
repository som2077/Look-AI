import { useCommunityPosts } from "@/features/social/api/useCommunityPosts";
import { useNotifications } from "@/features/social/api/useNotifications";
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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  RefreshControl,
  Image as RNImage,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { useUser } from "@clerk/clerk-expo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDateSectionHeader(dateString: string): string {
  if (!dateString) return "Recent";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recent";

  const now = new Date();

  // Check if today
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);

  if (date.getFullYear() !== now.getFullYear()) {
    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
  }

  return `${month} ${day}${suffix}`;
}

function formatPostTime(dateString: string): string {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Just now";

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? "0" + minutes : minutes;

  return `${hours}:${strMinutes} ${ampm}`;
}

interface DateGroup {
  dateKey: string;
  displayHeader: string;
  posts: any[];
}

function groupPostsByDate(posts: any[]): DateGroup[] {
  const groupsMap = new Map<string, { displayHeader: string; posts: any[] }>();

  // Ensure sorted oldest first so newest posts always appear at the bottom
  const sorted = [...posts].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeA - timeB;
  });

  for (const post of sorted) {
    const postDate = new Date(post.created_at || Date.now());
    const dateKey = `${postDate.getFullYear()}-${postDate.getMonth() + 1}-${postDate.getDate()}`;

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, {
        displayHeader: formatDateSectionHeader(post.created_at || new Date().toISOString()),
        posts: [],
      });
    }
    groupsMap.get(dateKey)!.posts.push(post);
  }

  return Array.from(groupsMap.entries()).map(([dateKey, val]) => ({
    dateKey,
    displayHeader: val.displayHeader,
    posts: val.posts,
  }));
}

const POPULAR_REACTIONS = ["😽", "💭", "🥳", "❤️", "🔥", "✨", "😍", "👍", "😂"];

// ─── Timeline Post Card ───────────────────────────────────────────────────────

const TimelinePostCard = React.memo(function TimelinePostCard({
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
    if (typeof post.image_url === "string" && post.image_url) {
      RNImage.getSize(
        post.image_url,
        (width: number, height: number) => {
          if (width && height) setAspectRatio(width / height);
        },
        () => {
          setAspectRatio(4 / 3);
        }
      );
    }
  }, [post.image_url]);

  const reactions = post.post_reactions || [];
  const myReactionObj = reactions.find((r: any) => r.user_id === user?.id);
  const myReaction = myReactionObj?.reaction_type || null;

  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r: any) => {
    if (r.reaction_type) {
      reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
    }
  });
  const uniqueReactions = Object.keys(reactionCounts);

  const formattedTime = post.created_at
    ? formatPostTime(post.created_at)
    : "Just now";

  const isCurrentUser =
    post.user_id === user?.id || post.user_profiles?.user_id === user?.id;

  const displayNickname = isCurrentUser
    ? nickname || user?.fullName || "User"
    : post.user_profiles?.nickname || "User";

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
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#111827",
            }}
          >
            {displayNickname}
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
            const isMine = myReaction === emoji;
            return (
              <TouchableOpacity
                key={emoji}
                activeOpacity={0.7}
                onPress={() => toggleReaction(post.id, isMine ? null : emoji)}
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
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              backgroundColor: "#FFFFFF",
              borderColor: "#E5E7EB",
              borderWidth: 1,
              borderRadius: 16,
              padding: 8,
              marginTop: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            {POPULAR_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                activeOpacity={0.7}
                onPress={() => {
                  toggleReaction(post.id, myReaction === emoji ? null : emoji);
                  setShowReactions(false);
                }}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  backgroundColor:
                    myReaction === emoji ? "#EFF6FF" : "transparent",
                }}
              >
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
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
  const scrollViewRef = useRef<ScrollView>(null);
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
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
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

  const dateGroups = React.useMemo(() => groupPostsByDate(posts), [posts]);

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
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
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
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {dateGroups.map((group, groupIndex) => (
              <View key={group.dateKey}>
                {/* Date Section Header with subtle divider */}
                <View
                  style={{
                    marginTop: groupIndex === 0 ? 8 : 20,
                    marginBottom: 16,
                  }}
                >
                  {groupIndex > 0 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#F1F5F9",
                        marginBottom: 18,
                      }}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#1F2937",
                    }}
                  >
                    {group.displayHeader}
                  </Text>
                </View>

                {/* Posts in this date group */}
                {group.posts.map((post) => (
                  <TimelinePostCard
                    key={post.id}
                    post={post}
                    toggleReaction={toggleReaction}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
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
                style={{ width: 80, height: 80, borderRadius: 12 }}
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
                <IconX size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
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
                height: 42,
                backgroundColor: "#F9FAFB",
                borderRadius: 21,
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
      <StatusBar style="dark" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        edges={["top"]}
      >
        <FeedTab />
      </SafeAreaView>
    </SwipeTabWrapper>
  );
}
