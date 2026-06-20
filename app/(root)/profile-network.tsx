import { IconArrowLeft } from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 3;
const IMAGE_SIZE = width / COLUMN_COUNT;

// Mock Data
const MOCK_POSTS = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
];

const MOCK_USERS = [
  {
    id: "1",
    name: "Sarah Jenkins",
    username: "@sarahj",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    isFollowing: true,
  },
  {
    id: "2",
    name: "Mike Ross",
    username: "@miker",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    isFollowing: false,
  },
  {
    id: "3",
    name: "Jessica Pearson",
    username: "@jessicap",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    isFollowing: true,
  },
  {
    id: "4",
    name: "Harvey Specter",
    username: "@harveys",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
    isFollowing: false,
  },
  {
    id: "5",
    name: "Donna Paulsen",
    username: "@donnap",
    avatar:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100",
    isFollowing: true,
  },
];

type Tab = "followers" | "following" | "posts";

export default function ProfileNetworkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialTab = (params.tab as Tab) || "followers";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Quick helper to render the list of users
  const renderUserList = (type: "followers" | "following") => {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {MOCK_USERS.map((user) => (
          <View
            key={user.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Image
              source={{ uri: user.avatar }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                marginRight: 12,
                backgroundColor: "#E5E7EB",
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#1D1A27" }}
              >
                {user.name}
              </Text>
              <Text style={{ fontSize: 13, color: "#6B7280" }}>
                {user.username}
              </Text>
            </View>
            <Pressable
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: user.isFollowing ? "#F3F4F6" : "#1D1A27",
                borderWidth: user.isFollowing ? 1 : 0,
                borderColor: "#D1D5DB",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: user.isFollowing ? "#1D1A27" : "#FFFFFF",
                }}
              >
                {user.isFollowing ? "Following" : "Follow"}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderPostsGrid = () => {
    return (
      <ScrollView>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {MOCK_POSTS.map((url, index) => (
            <Pressable
              key={index}
              onPress={() =>
                router.push(`/(root)/post-detail?postId=${index}` as never)
              }
            >
              <Image
                source={{ uri: url }}
                style={{
                  width: IMAGE_SIZE,
                  height: IMAGE_SIZE,
                  borderWidth: 0.5,
                  borderColor: "#FFFFFF",
                }}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 8, marginLeft: -8 }}
        >
          <IconArrowLeft size={24} color="#1D1A27" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", marginRight: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}>
            userName23
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        {(["followers", "following", "posts"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab ? "#1D1A27" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: activeTab === tab ? "600" : "400",
                color: activeTab === tab ? "#1D1A27" : "#6B7280",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "posts" && renderPostsGrid()}
        {(activeTab === "followers" || activeTab === "following") &&
          renderUserList(activeTab)}
      </View>
    </SafeAreaView>
  );
}
