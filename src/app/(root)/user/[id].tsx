import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { IconArrowDownLeft, IconArrowDownRight, IconArrowUpLeft, IconArrowUpRight, IconChevronLeft, IconLayoutGrid, IconLink } from "@tabler/icons-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useCommunityPosts } from "@/features/social/api/useCommunityPosts";

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts } = useCommunityPosts();
  const { user } = useUser();

  const userPosts = useMemo(() => {
    return posts.filter((p) => p.user_id === id);
  }, [posts, id]);

  const userInfo = useMemo(() => {
    if (userPosts.length > 0 && userPosts[0].user_profiles) {
      return userPosts[0].user_profiles;
    }
    return {
      nickname: "Style Explorer",
      username: "user_" + (id || "").slice(0, 5),
      avatar_url: null,
    };
  }, [userPosts, id]);

  const totalLikes = useMemo(() => {
    return userPosts.reduce((acc, curr) => acc + (curr.likes_count || 0), 0);
  }, [userPosts]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <IconChevronLeft size={28} color="#1D1A27" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* User IconInfoCircle Section */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            {/* Banner */}
            <View
              style={{
                height: 140,
                backgroundColor: "#0622FF",
                borderRadius: 24,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                gap: 16,
              }}
            >
              <IconArrowUpRight size={28} color="#FFFFFF" strokeWidth={3.5} />
              <IconArrowDownRight size={28} color="#FFFFFF" strokeWidth={3.5} />
              <IconArrowUpLeft size={28} color="#FFFFFF" strokeWidth={3.5} />
              <IconArrowDownLeft size={28} color="#FFFFFF" strokeWidth={3.5} />
            </View>

            {/* Profile Avatar & Link */}
            <View
              style={{
                marginTop: -44,
                marginLeft: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <Image
                source={{
                  uri:
                    ((userInfo as any).user_id === user?.id && user?.imageUrl)
                      ? user.imageUrl
                      : (userInfo as any).avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userInfo.nickname || "User",
                        )}&background=random&size=128`,
                }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  borderWidth: 4,
                  borderColor: "#F3F4F6",
                }}
              />
              <TouchableOpacity style={{ marginBottom: 12, marginRight: 8 }}>
                <IconLink size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Name, Handle, Bio */}
            <View style={{ marginTop: 12, marginLeft: 16 }}>
              <Text
                style={{ fontSize: 22, fontWeight: "800", color: "#1D1A27" }}
              >
                {userInfo.nickname || "Style Explorer"}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#6D28D9",
                  marginTop: 4,
                }}
              >
                @{userInfo.username}
              </Text>
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>
                Independent Designer | Studio Else
              </Text>
            </View>

            {/* Stats */}
            <View
              style={{
                flexDirection: "row",
                marginTop: 24,
                marginLeft: 16,
                gap: 32,
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}
                >
                  Followers
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#1D1A27",
                    marginTop: 4,
                  }}
                >
                  678
                </Text>
              </View>
              <View>
                <Text
                  style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}
                >
                  Following
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#1D1A27",
                    marginTop: 4,
                  }}
                >
                  312
                </Text>
              </View>
              <View>
                <Text
                  style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}
                >
                  Posts
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#1D1A27",
                    marginTop: 4,
                  }}
                >
                  {userPosts.length}
                </Text>
              </View>
              <View>
                <Text
                  style={{ fontSize: 12, color: "#9CA3AF", fontWeight: "600" }}
                >
                  Likes
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#1D1A27",
                    marginTop: 4,
                  }}
                >
                  {totalLikes}
                </Text>
              </View>
            </View>
          </View>

          {/* Posts IconLayoutGrid */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
                gap: 8,
              }}
            >
              <IconLayoutGrid size={20} color="#1D1A27" />
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}
              >
                Outfits
              </Text>
            </View>

            {userPosts.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 15, color: "#9CA3AF" }}>
                  No posts yet.
                </Text>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginHorizontal: -4,
                }}
              >
                {userPosts.map((post) => (
                  <View key={post.id} style={{ width: "50%", padding: 4 }}>
                    <Image
                      source={{ uri: post.image_url || (post as any).image }}
                      style={{ width: "100%", height: 200, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
