import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  Settings,
  MoreHorizontal,
  X,
  Pin,
  Share2,
  Download,
  Grid,
  CloudRain,
  ShoppingBag,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useScrollToHideTabBar } from "../../../hooks/useScrollToHideTabBar";
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const STYLE_OF_THE_DAY = {
  title: "Style of the Day",
  weather: "Rainy, 22°C",
  description: "Since it's raining today, here is a cozy look from your wardrobe.",
  image: "https://images.unsplash.com/photo-1520975954732-57dd22299614?w=800&q=80",
  items: [
    { id: "1", type: "Jacket", name: "Black Denim Jacket" },
    { id: "2", type: "Jeans", name: "Classic Blue Jeans" }
  ]
};

const MISSING_PIECES = [
  {
    id: "m1",
    title: "White Graphic Tee",
    reason: "Matches 3 of your jeans",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
    price: "₹1,299",
    brand: "Urban Basics"
  },
  {
    id: "m2",
    title: "White Sneakers",
    reason: "Perfect for your casual fits",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
    price: "₹3,499",
    brand: "SneakerX"
  },
  {
    id: "m3",
    title: "Beige Chinos",
    reason: "Versatile for smart casuals",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80",
    price: "₹1,899",
    brand: "Zara"
  }
];

const COMMUNITY_POSTS = [
  {
    id: "1",
    user: "sarah_k",
    avatar: "https://i.pravatar.cc/80?img=1",
    image:
      "https://images.unsplash.com/photo-1434389678232-068a8ebce4ea?w=400&q=80",
    likes: 312,
    aspectRatio: 4 / 5,
  },
  {
    id: "2",
    user: "james_m",
    avatar: "https://i.pravatar.cc/80?img=2",
    image:
      "https://images.unsplash.com/photo-1550614000-4b95d466f289?w=400&q=80",
    likes: 198,
    aspectRatio: 1,
  },
  {
    id: "3",
    user: "priya_v",
    avatar: "https://i.pravatar.cc/80?img=3",
    image:
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&q=80",
    likes: 445,
    aspectRatio: 2 / 3,
  },
  {
    id: "4",
    user: "alex_t",
    avatar: "https://i.pravatar.cc/80?img=4",
    image:
      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&q=80",
    likes: 87,
    aspectRatio: 3 / 4,
  },
  {
    id: "5",
    user: "mia_w",
    avatar: "https://i.pravatar.cc/80?img=5",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
    likes: 532,
    aspectRatio: 3 / 4,
  },
  {
    id: "6",
    user: "david_l",
    avatar: "https://i.pravatar.cc/80?img=6",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80",
    likes: 211,
    aspectRatio: 1,
  },
];

const ALL_GROUPS = [
  {
    id: "1",
    name: "Minimalist Style",
    members: 3200,
    description: "Clean looks, timeless pieces & effortless fashion.",
    avatars: [
      "https://i.pravatar.cc/40?img=10",
      "https://i.pravatar.cc/40?img=11",
      "https://i.pravatar.cc/40?img=12",
    ],
    image: "https://i.pravatar.cc/80?img=10",
    color: "#E8E4F3",
  },
  {
    id: "2",
    name: "Trending Fashion",
    members: 5100,
    description: "Explore the latest styles loved by the community.",
    avatars: [
      "https://i.pravatar.cc/40?img=20",
      "https://i.pravatar.cc/40?img=21",
      "https://i.pravatar.cc/40?img=22",
    ],
    image: "https://i.pravatar.cc/80?img=20",
    color: "#F3E8E8",
  },
  {
    id: "3",
    name: "Streetwear & Urban",
    members: 8700,
    description: "Urban fits, sneakers & modern street fashion.",
    avatars: [
      "https://i.pravatar.cc/40?img=30",
      "https://i.pravatar.cc/40?img=31",
      "https://i.pravatar.cc/40?img=32",
    ],
    image: "https://i.pravatar.cc/80?img=30",
    color: "#E8F3E8",
  },
  {
    id: "4",
    name: "Y2K Revival",
    members: 4200,
    description: "Bringing back the early 2000s aesthetic.",
    avatars: [
      "https://i.pravatar.cc/40?img=40",
      "https://i.pravatar.cc/40?img=41",
      "https://i.pravatar.cc/40?img=42",
    ],
    image: "https://i.pravatar.cc/80?img=40",
    color: "#F3EBE8",
  },
];

// ─── Add Post Modal ────────────────────────────────────────────────────────────

function AddPostModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState("");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: "#ffff" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F0F0F0",
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 16, color: "#6B7280" }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#1D1A27" }}>
            New Post
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "#1D1A27",
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              Share
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20 }}>
          {/* Image placeholder */}
          <TouchableOpacity
            style={{
              width: "100%",
              height: 280,
              backgroundColor: "#F5F5F7",
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#E0E0E8",
              borderStyle: "dashed",
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📷</Text>
            <Text style={{ fontSize: 15, color: "#9CA3AF", fontWeight: "600" }}>
              Tap to add photo
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Write a caption..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={caption}
            onChangeText={setCaption}
            style={{
              fontSize: 15,
              color: "#1D1A27",
              backgroundColor: "#F5F5F7",
              borderRadius: 14,
              padding: 16,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>
      </View>
    </Modal>
    // </Modal>
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
  <View style={{ marginBottom:5 }}>
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
        source={{ uri: post.image }}
        style={{ width: "100%", aspectRatio: post.aspectRatio || 3 / 4 }}
        resizeMode="cover"
      />
    </Pressable>
  </View>
);

// ─── For You Tab ───────────────────────────────────────────────────────────────

function ForYouTab() {
  const router = useRouter();
  const { onScroll } = useScrollToHideTabBar();
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const [selectedPostOptions, setSelectedPostOptions] = useState<
    (typeof COMMUNITY_POSTS)[0] | null
  >(null);

  const renderMissingPiece = ({ item }: { item: (typeof MISSING_PIECES)[0] }) => (
    <View
      style={{
        width: 240,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        marginRight: 12,
        padding: 12,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F0F0F0"
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={{ width: 80, height: 100, borderRadius: 12, backgroundColor: "#F5F5F7" }}
      />
      <View style={{ flex: 1, marginLeft: 12, justifyContent: "center" }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: "#4C36F5", textTransform: "uppercase", marginBottom: 4 }}>
          {item.brand}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#1D1A27", marginBottom: 2 }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }} numberOfLines={2}>
          {item.reason}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1D1A27" }}>
            {item.price}
          </Text>
          <TouchableOpacity
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
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: "50%" }}
    >
      {/* ── Style of the Day ── */}
      <View style={{ paddingHorizontal: 16, marginTop: 15 }}>
        <View
          style={{
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
            borderWidth: 1,
            borderColor: "#F0F0F0"
          }}
        >
          <View style={{ height: 220, position: "relative" }}>
            <Image
              source={{ uri: STYLE_OF_THE_DAY.image }}
              style={{ width: "100%", height: "100%" }}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={{ position: "absolute", inset: 0 }}
            />
            <View style={{ position: "absolute", top: 16, left: 16, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" }}>
              <CloudRain size={14} color="#FFFFFF" />
              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{STYLE_OF_THE_DAY.weather}</Text>
            </View>
            <View style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
              <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "800", marginBottom: 4 }}>{STYLE_OF_THE_DAY.title}</Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "500", lineHeight: 18 }}>{STYLE_OF_THE_DAY.description}</Text>
            </View>
          </View>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {STYLE_OF_THE_DAY.items.map((item, index) => (
                <View key={item.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F7", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: index === 0 ? "#4C36F5" : "#1D1A27" }} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#1D1A27" }}>{item.name}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={{ backgroundColor: "#4C36F5", paddingVertical: 14, borderRadius: 16, alignItems: "center" }}>
              <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700" }}>Log This Outfit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Missing Piece / Shop the Look ── */}
      <View style={{ marginTop: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27" }}>Missing Pieces</Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Complete your wardrobe</Text>
          </View>
          <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#4C36F5" }}>See all</Text>
            <ChevronRight size={16} color="#4C36F5" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={MISSING_PIECES}
          keyExtractor={(item) => item.id}
          renderItem={renderMissingPiece}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        />
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
        <View style={{ flexDirection: "row", gap: 5 }}>
          <View style={{ flex: 1 }}>
            {COMMUNITY_POSTS.filter((_, i) => i % 2 === 0).map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                onMenuPress={() => setSelectedPostOptions(post)}
                onCardPress={() =>
                  router.push({
                    pathname: "/(root)/post/[id]",
                    params: post as any,
                  })
                }
              />
            ))}
          </View>
          <View style={{ flex: 1 }}>
            {COMMUNITY_POSTS.filter((_, i) => i % 2 !== 0).map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                onMenuPress={() => setSelectedPostOptions(post)}
                onCardPress={() =>
                  router.push({
                    pathname: "/(root)/post/[id]",
                    params: post as any,
                  })
                }
              />
            ))}
          </View>
        </View>
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
  group: (typeof ALL_GROUPS)[0];
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
          {group.members.toLocaleString()} members
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
          {group.avatars.map((av, idx) => (
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

function GroupsTab({
  onGroupPress,
}: {
  onGroupPress: (group: (typeof ALL_GROUPS)[0]) => void;
}) {
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  const handleJoin = useCallback((id: string) => {
    setJoinedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const joinedGroups = ALL_GROUPS.filter((g) => joinedIds.includes(g.id));
  const discoverGroups = ALL_GROUPS.filter((g) => !joinedIds.includes(g.id));

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
    (group: (typeof ALL_GROUPS)[0]) => {
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
              style={{ flexDirection: "row", gap: 10, alignItems: "center",  }}
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
