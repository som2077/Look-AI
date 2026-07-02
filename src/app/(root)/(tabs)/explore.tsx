import { IconBell, IconBookmark } from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Download, ImagePlus, Share2, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { useCommunityPosts } from "@/features/social/api/useCommunityPosts";
import { Group, useGroups } from "@/features/social/api/useGroups";
import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Removed mock COMMUNITY_POSTS data to show real community posts only

// Removed ALL_GROUPS, using useSocialStore instead

// ─── Add Post Modal ────────────────────────────────────────────────────────────

function AddPostModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { createPost, uploading } = useCommunityPosts();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const panY = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
      ]).start();
    } else {
      panY.setValue(Dimensions.get("window").height);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 10 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  const handleShare = async () => {
    if (!imageUri) {
      alert("Please select an image first!");
      return;
    }
    try {
      await createPost(imageUri, caption);
      setCaption("");
      setImageUri(null);
      handleClose();
    } catch (_error) {
      alert("Failed to share post. Please try again.");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
            },
            { opacity: fadeAnim },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
            transform: [{ translateY: panY }],
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#E5E7EB",
              borderRadius: 2,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 8,
            }}
          />
          {/* Top Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 16,
            }}
          >
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <X size={24} color="#1D1A27" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27" }}>
              New Post
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              disabled={uploading}
              style={{
                backgroundColor: uploading ? "#E5E7EB" : "#4C36F5",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                shadowColor: "#4C36F5",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: uploading ? 0 : 0.3,
                shadowRadius: 8,
                elevation: uploading ? 0 : 4,
              }}
            >
              <Text
                style={{
                  color: uploading ? "#9CA3AF" : "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {uploading ? "Sharing" : "Post"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          >
            {/* Image Picker Area */}
            <TouchableOpacity
              onPress={pickImage}
              style={{
                width: "100%",
                height: 200,
                backgroundColor: "#F9FAFB",
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                borderWidth: imageUri ? 0 : 2,
                borderColor: "#E5E7EB",
                borderStyle: "dashed",
                overflow: "hidden",
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "#EEF2FF",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <ImagePlus size={32} color="#4C36F5" strokeWidth={1.5} />
                  </View>
                  <Text
                    style={{
                      fontSize: 17,
                      color: "#1D1A27",
                      fontWeight: "700",
                      marginBottom: 6,
                    }}
                  >
                    Upload a photo
                  </Text>
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>
                    Show off your latest outfit
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Caption Input Area */}
            <View
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 20,
                padding: 16,
              }}
            >
              <TextInput
                placeholder="Write a caption for your look..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={caption}
                onChangeText={setCaption}
                style={{
                  fontSize: 16,
                  color: "#1D1A27",
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Post Details Modal ──────────────────────────────────────────────────────

function PostDetailsModal({
  post,
  visible,
  onClose,
}: {
  post: any;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const panY = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && post) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
      ]).start();
    } else {
      panY.setValue(Dimensions.get("window").height);
      fadeAnim.setValue(0);
    }
  }, [visible, post]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const scrollY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Steal the gesture from ScrollView if pulling down from the top
        return (
          scrollY.current <= 0 && gestureState.dy > 10 && gestureState.vy > 0
        );
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          scrollY.current <= 0 && gestureState.dy > 10 && gestureState.vy > 0
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: fadeAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 45,
            borderTopRightRadius: 45,
            paddingTop: 12,
            maxHeight: "90%",
            transform: [{ translateY: panY }],
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 3,
                backgroundColor: "#E0E0E0",
              }}
            />
          </View>

          {post && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              scrollEventThrottle={16}
              onScroll={(e) => {
                scrollY.current = e.nativeEvent.contentOffset.y;
              }}
              bounces={false}
            >
              <View style={{ paddingHorizontal: 23 }}>
                <Image
                  source={{
                    uri: post.image_url || post.image,
                  }}
                  style={{
                    width: "100%",
                    height: 500,
                    borderRadius: 35,
                  }}
                  resizeMode="cover"
                />
              </View>
              <View style={{ padding: 24 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      router.push(`/(root)/user/${post.user_id}` as never);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Image
                      source={{
                        uri:
                          post.user_profiles?.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            post.user_profiles?.nickname || post.user || "User",
                          )}&background=random`,
                      }}
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                    />
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#1D1A27",
                        }}
                      >
                        {post.user_profiles?.nickname ||
                          post.user ||
                          "Style Explorer"}
                      </Text>
                      {post.user_profiles?.username ? (
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#6B7280",
                            marginTop: 2,
                          }}
                        >
                          @{post.user_profiles.username}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#E11D48",
                      }}
                    >
                      ♥
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#1D1A27",
                      }}
                    >
                      {post.likes_count || post.likes || 0}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#4B5563",
                    lineHeight: 24,
                    marginBottom: 24,
                  }}
                >
                  {post.caption}
                </Text>

                {/* Action Buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginTop: 10,
                  }}
                >
                  <TouchableOpacity style={{ alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconBookmark size={24} color="#1D1A27" />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#4B5563",
                      }}
                    >
                      Save
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Share2 size={24} color="#1D1A27" />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#4B5563",
                      }}
                    >
                      Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Download size={24} color="#1D1A27" />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#4B5563",
                      }}
                    >
                      Download
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const CommunityPostCard = ({
  post,
  index,
  onCardPress,
}: {
  post: any;
  index: number;
  onCardPress: () => void;
}) => {
  // Array of dynamic heights for a balanced staggered Pinterest look
  const heights = [280, 220, 240, 310, 300, 250];
  const dynamicHeight = heights[index % heights.length];

  return (
    <View style={{ marginBottom: 10 }}>
      <Pressable
        onPress={onCardPress}
        style={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#F0EEF8",
        }}
      >
        <Image
          source={{ uri: post.image_url || post.image }}
          style={{ width: "100%", height: dynamicHeight }}
          resizeMode="cover"
        />
      </Pressable>
    </View>
  );
};

// ─── For You Tab ───────────────────────────────────────────────────────────────

function ForYouTab() {
  const router = useRouter();
  const { onScroll } = useScrollToHideTabBar();
  const [selectedPostOptions, setSelectedPostOptions] = useState<any>(null);

  const { posts: communityPosts } = useCommunityPosts();
  const displayPosts = communityPosts;

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: "50%" }}
    >
      {/* Community Looks */}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        {displayPosts.length === 0 ? (
          <View
            style={{
              padding: 24,
              alignItems: "center",
              backgroundColor: "#F5F5F7",
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>✨</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: "#1D1A27",
                marginBottom: 4,
              }}
            >
              No looks shared yet
            </Text>
            <Text
              style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}
            >
              Be the first to share your style with the community!
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              {displayPosts
                .map((p: any, i: number) => ({ ...p, originalIndex: i }))
                .filter((_: any, i: number) => i % 2 === 0)
                .map((post: any) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    index={post.originalIndex}
                    onCardPress={() => setSelectedPostOptions(post)}
                  />
                ))}
            </View>
            <View style={{ flex: 1 }}>
              {displayPosts
                .map((p: any, i: number) => ({ ...p, originalIndex: i }))
                .filter((_: any, i: number) => i % 2 !== 0)
                .map((post: any) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    index={post.originalIndex}
                    onCardPress={() => setSelectedPostOptions(post)}
                  />
                ))}
            </View>
          </View>
        )}
      </View>

      <PostDetailsModal
        visible={!!selectedPostOptions}
        post={selectedPostOptions}
        onClose={() => setSelectedPostOptions(null)}
      />
    </ScrollView>
  );
}

// ─── Group Card ────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  joined,
  onJoin,
  onPress,
}: {
  group: Group;
  joined: boolean;
  onJoin: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      {/* Group Avatar */}
      <Image
        source={{ uri: group.image }}
        style={{ width: 52, height: 52, borderRadius: 26, marginRight: 12 }}
      />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1D1A27" }}>
          {group.name}
        </Text>
        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
          {(group.members_count || 0).toLocaleString()} members
        </Text>
        <Text
          style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}
          numberOfLines={2}
        >
          {group.description}
        </Text>
      </View>

      {/* Member Avatars + Join */}
      <View style={{ alignItems: "center", marginLeft: 8 }}>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {(group.avatars || []).map((av, idx) => (
            <Image
              key={idx}
              source={{ uri: av }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: "#fff",
                marginLeft: idx === 0 ? 0 : -7,
              }}
            />
          ))}
        </View>
        {joined ? (
          <View
            style={{
              backgroundColor: "#E8F5E9",
              borderRadius: 20,
              paddingHorizontal: 14,
              // paddingVertical: 6,
              //  paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#2E7D32" }}>
              Joined
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            style={{
              backgroundColor: "#1D1A27",
              borderRadius: 25,
              paddingHorizontal: 14,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: "#fff", fontWeight: "700" }}>
              Join
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

// ─── Groups Tab ────────────────────────────────────────────────────────────────

function GroupsTab({ onGroupPress }: { onGroupPress: (group: Group) => void }) {
  const router = useRouter();
  const { groups, joinedGroupIds, joinGroup, leaveGroup, loading } =
    useGroups();

  const handleJoin = useCallback(
    (id: string) => {
      if (joinedGroupIds.includes(id)) {
        leaveGroup(id);
      } else {
        joinGroup(id);
      }
    },
    [joinedGroupIds, joinGroup, leaveGroup],
  );

  if (loading) {
    return (
      <Text style={{ padding: 20, textAlign: "center", color: "#6B7280" }}>
        Loading groups...
      </Text>
    );
  }

  const joinedGroups = groups.filter((g) => joinedGroupIds.includes(g.id));
  const discoverGroups = groups.filter((g) => !joinedGroupIds.includes(g.id));

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 100,
      }}
    >
      {/* Your Groups */}
      {joinedGroups.length > 0 && (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#1D1A27",
              }}
            >
              Your Groups
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/notifications")}
              style={{ position: "relative", padding: 4 }}
            >
              <IconBell size={24} color="#1D1A27" />
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  right: 6,
                  width: 9,
                  height: 9,
                  borderRadius: 4.5,
                  backgroundColor: "#FF3B30",
                  borderWidth: 1.5,
                  borderColor: "#F5F5F7",
                }}
              />
            </TouchableOpacity>
          </View>
          {joinedGroups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              joined
              onJoin={() => handleJoin(g.id)}
              onPress={() => onGroupPress(g)}
            />
          ))}
          <View style={{ height: 8 }} />
        </>
      )}

      {/* Discover Groups */}
      {discoverGroups.length > 0 && (
        <>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#1D1A27",
              marginBottom: 14,
            }}
          >
            Explore More
          </Text>
          {discoverGroups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              joined={false}
              onJoin={() => handleJoin(g.id)}
              onPress={() => onGroupPress(g)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Explore Screen ────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const router = useRouter();
  const [showAddPost, setShowAddPost] = useState(false);

  const handleGroupPress = useCallback(
    (group: Group) => {
      router.push({
        pathname: "/(root)/(social)/group-detail" as any,
        params: { id: group.id, name: group.name, image: group.image },
      });
    },
    [router],
  );

  return (
    <SwipeTabWrapper tabIndex={2}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* ── Header removed ── */}

          {/* Thin divider */}
          <View
          // style={{
          //   height: 1,
          //   backgroundColor: "rgba(0,0,0,0.06)",
          //   marginHorizontal: 0,
          // }}
          />

          {/* ── Tab Content ── */}
          <GroupsTab onGroupPress={handleGroupPress} />
        </SafeAreaView>

        <AddPostModal
          visible={showAddPost}
          onClose={() => setShowAddPost(false)}
        />
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
