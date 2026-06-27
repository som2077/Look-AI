import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ChevronRight,
  Download,
  Grid,
  ImagePlus,
  Pin,
  Plus,
  Share2,
  ShoppingBag,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
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
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";
import { useAffiliateProducts } from "../../../hooks/useAffiliateProducts";
import { useCommunityPosts } from "../../../hooks/useCommunityPosts";
import { Group, useGroups } from "../../../hooks/useGroups";
import { useScrollToHideTabBar } from "../../../hooks/useScrollToHideTabBar";

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
    } catch (error) {
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

const CommunityPostCard = ({
  post,
  onMenuPress,
  onCardPress,
}: {
  post: any;
  onMenuPress: () => void;
  onCardPress: () => void;
}) => (
  <View style={{ marginBottom: 5 }}>
    <Pressable
      onPress={onCardPress}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#F5F5F7",
        borderColor: "#EBEBEB",
        shadowColor: "#000000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
      }}
    >
      <Image
        source={{ uri: post.image_url || post.image }}
        style={{ width: "100%", aspectRatio: post.aspectRatio || 3 / 4 }}
        resizeMode="cover"
      />
    </Pressable>
    <Pressable
      onPress={onMenuPress}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#1D1A27" }}>
        ⋯
      </Text>
    </Pressable>
  </View>
);

// ─── For You Tab ───────────────────────────────────────────────────────────────

function ForYouTab() {
  const router = useRouter();
  const { onScroll } = useScrollToHideTabBar();
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const [selectedPostOptions, setSelectedPostOptions] = useState<any>(null);

  const { products, loading: productsLoading } = useAffiliateProducts();
  const { posts: communityPosts } = useCommunityPosts();
  const displayPosts = communityPosts;

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: "50%" }}
    >
      {/* ── Shop the Look (Affiliates) ── */}
      <View style={{ marginTop: 32 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingHorizontal: 16,
            marginBottom: 14,
          }}
        >
          <View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27" }}>
              Trending For You
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
              Shop the latest styles
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#4C36F5" }}>
              See all
            </Text>
            <ChevronRight size={16} color="#4C36F5" />
          </View>
        </View>

        {productsLoading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#9CA3AF" }}>
              Finding the best pieces for you...
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => Linking.openURL(item.url)}
                style={{
                  width: 160,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  marginRight: 16,
                  paddingBottom: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: "#F0F0F0",
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: "100%",
                    height: 200,
                    backgroundColor: "#F5F5F7",
                  }}
                />
                <View style={{ padding: 12 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "#4C36F5",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {item.brand}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#1D1A27",
                      marginBottom: 4,
                    }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: "#1D1A27",
                      }}
                    >
                      {item.price}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#1D1A27",
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShoppingBag size={14} color="#FFF" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
          />
        )}
      </View>

      {/* Community Looks */}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: "#1D1A27",
            marginBottom: 14,
          }}
        >
          Community Looks
        </Text>
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
          <View style={{ flexDirection: "row", gap: 5 }}>
            <View style={{ flex: 1 }}>
              {displayPosts
                .filter((_, i) => i % 2 === 0)
                .map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    onMenuPress={() => setSelectedPostOptions(post)}
                    onCardPress={() =>
                      router.push({
                        pathname: "/(root)/post/[id]",
                        params: {
                          id: post.id,
                          image: post.image_url || (post as any).image,
                          user: post.user_profiles?.username
                            ? `@${post.user_profiles.username}`
                            : post.user_profiles?.nickname ||
                              (post as any).user ||
                              "Style Explorer",
                          likes: String(
                            post.likes_count || (post as any).likes || 0,
                          ),
                          caption: post.caption || "",
                        } as any,
                      })
                    }
                  />
                ))}
            </View>
            <View style={{ flex: 1 }}>
              {displayPosts
                .filter((_, i) => i % 2 !== 0)
                .map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    onMenuPress={() => setSelectedPostOptions(post)}
                    onCardPress={() =>
                      router.push({
                        pathname: "/(root)/post/[id]",
                        params: {
                          id: post.id,
                          image: post.image_url || (post as any).image,
                          user: post.user_profiles?.username
                            ? `@${post.user_profiles.username}`
                            : post.user_profiles?.nickname ||
                              (post as any).user ||
                              "Style Explorer",
                          likes: String(
                            post.likes_count || (post as any).likes || 0,
                          ),
                          caption: post.caption || "",
                        } as any,
                      })
                    }
                  />
                ))}
            </View>
          </View>
        )}
      </View>

      <Modal
        visible={!!selectedPostOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedPostOptions(null)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onPress={() => setSelectedPostOptions(null)}
          />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 24,
              minHeight: 300,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 15 }}>
              <View
                style={{
                  width: 40,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "#E0E0E0",
                }}
              />
            </View>

            <View style={{ alignItems: "center", marginBottom: 20 }}>
              {selectedPostOptions && (
                <Image
                  source={{ uri: selectedPostOptions.image }}
                  style={{ width: 60, height: 80, borderRadius: 8 }}
                />
              )}
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 15,
                  color: "#1D1A27",
                  fontWeight: "600",
                }}
              >
                This look is inspired by your recent activity
              </Text>
            </View>

            <View style={{ gap: 24, marginTop: 10 }}>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <Pin size={24} color="#1D1A27" />
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}
                >
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <Share2 size={24} color="#1D1A27" />
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}
                >
                  Share
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <Download size={24} color="#1D1A27" />
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}
                >
                  Download image
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <Grid size={24} color="#1D1A27" />
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}
                >
                  Add to collage
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#2E7D32" }}>
              ✓ Joined
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
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: "#fff", fontWeight: "700" }}>
              + Join
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

// ─── Groups Tab ────────────────────────────────────────────────────────────────

function GroupsTab({ onGroupPress }: { onGroupPress: (group: Group) => void }) {
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
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#1D1A27",
              marginBottom: 14,
            }}
          >
            Your Groups
          </Text>
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
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: "#1D1A27",
          marginBottom: 14,
        }}
      >
        Discover Groups
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
    </ScrollView>
  );
}

// ─── Explore Screen ────────────────────────────────────────────────────────────

type ActiveTab = "foryou" | "groups";

export default function ExploreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("foryou");
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
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              // paddingTop: 1,
              paddingBottom: 6,
            }}
          >
            {/* Tabs */}
            <View style={{ flexDirection: "row", gap: 18, flex: 1 }}>
              <TouchableOpacity onPress={() => setActiveTab("foryou")}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: activeTab === "foryou" ? "800" : "500",
                    color: activeTab === "foryou" ? "#1D1A27" : "#9CA3AF",
                  }}
                >
                  For you
                </Text>
                {/* {activeTab === "foryou" && (
                  <View
                    style={{
                      // height: 2.5,
                      fontSize: 16,
                      backgroundColor: "#1D1A27",
                      borderRadius: 2,
                      marginTop: 3,
                    }}
                  />
                )} */}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab("groups")}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: activeTab === "groups" ? "800" : "500",
                    color: activeTab === "groups" ? "#1D1A27" : "#9CA3AF",
                  }}
                >
                  Groups
                </Text>
                {/* {activeTab === "groups" && (
                  <View
                    style={{
                      height: 2.5,
                      backgroundColor: "#1D1A27",
                      borderRadius: 2,
                      marginTop: 3,
                    }}
                  />
                )} */}
              </TouchableOpacity>
            </View>

            {/* Right buttons */}
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <TouchableOpacity
                onPress={() => setShowAddPost(true)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 30,
                  backgroundColor: "#1D1A27",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F0F0F4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Settings size={20} color="#1D1A27" strokeWidth={2} />
              </TouchableOpacity> */}
            </View>
          </View>

          {/* Thin divider */}
          <View
          // style={{
          //   height: 1,
          //   backgroundColor: "rgba(0,0,0,0.06)",
          //   marginHorizontal: 0,
          // }}
          />

          {/* ── Tab Content ── */}
          {activeTab === "foryou" ? (
            <ForYouTab />
          ) : (
            <GroupsTab onGroupPress={handleGroupPress} />
          )}
        </SafeAreaView>

        <AddPostModal
          visible={showAddPost}
          onClose={() => setShowAddPost(false)}
        />
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
