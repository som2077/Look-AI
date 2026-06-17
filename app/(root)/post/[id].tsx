import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  //  ChevronDown,
  X,
  Pin,
  Download,
  Grid,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract params passed from explore.tsx
  const { image, user, avatar, likes } = params;

  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Compute actual like count
  const initialLikes = parseInt((likes as string) || "388", 10);
  const displayedLikes = isLiked ? initialLikes + 1 : initialLikes;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing look by ${user || "FinSavvy Panda"}: ${image}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleComment = () => {
    Alert.alert("Comments", "Comment section is opening...");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Top Image Section */}
        <View style={{ margin: 6, height: 450, position: "relative" }}>
          <Image
            source={{
              uri:
                (image as string) ||
                "https://images.unsplash.com/photo-1434389678232-068a8ebce4ea?w=400&q=80",
            }}
            style={{
              width: "100%",
              height: "100%",
              // borderTopLeftRadius: 32,
              // borderTopRightRadius: 32,
              borderRadius: 23,
            }}
            contentFit="cover"
          />

          {/* Back Button Overlay */}
          <View style={{ position: "absolute", top: 10, left: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 15,
                backgroundColor: "rgba(255,255,255,0.7)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft color="#000000" size={28} />
            </Pressable>
          </View>
        </View>

        {/* Action Bar (Like, Comment, Share, More, Save) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 5,
            // borderBottomWidth: 1,
            // borderBottomColor: "#F0F0",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              onPress={() => setIsLiked(!isLiked)}
            >
              <Heart
                color={isLiked ? "#E60023" : "#1D1A27"}
                fill={isLiked ? "#E60023" : "transparent"}
                size={24}
                strokeWidth={2.5}
              />
              <Text style={{ fontWeight: "700", fontSize: 14 }}>
                {displayedLikes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              onPress={handleComment}
            >
              <MessageCircle color="#1D1A27" size={24} strokeWidth={2.5} />
              <Text style={{ fontWeight: "700", fontSize: 14 }}>133</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShare}>
              <Share2 color="#1D1A27" size={24} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsOptionsVisible(true)}>
              <MoreHorizontal color="#1D1A27" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <Pressable
            style={{
              backgroundColor: "#000000", // Pinterest Red
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 24,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
              Save
            </Text>
          </Pressable>
        </View>

        {/* Creator Info */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 7,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            source={{
              uri: (avatar as string) || "https://i.pravatar.cc/80?img=1",
            }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            contentFit="cover"
          />
          <Text
            style={{
              fontWeight: "600",
              fontSize: 13,
              color: "#1D1A27",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {user || "FinSavvy Panda"} | Frugal Living, Saving Money, Side
            Hustles
          </Text>
        </View>

        {/* Post Title & Caption */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: "800",
              color: "#1D1A27",
              lineHeight: 28,
            }}
          >
            9 Google Jobs You Can Do From Ho...
          </Text>
          {/* <View
            style={{
              backgroundColor: "#E9E9E9",
              borderRadius: 12,
              padding: 4,
              marginLeft: 8,
              marginTop: 4,
            }}
          >
            <ChevronDown color="#1D1A27" size={16} strokeWidth={3} />
          </View> */}
        </View>
        {/* <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 20 }}>
            💸 Earn Passive Income ($20–$40 a day Here is the link 🖇️
            https://manneshesh...{" "}
            <Text style={{ fontWeight: "700", color: "#1D1A27" }}>
              View all comments
            </Text>
          </Text>
        </View> */}

        {/* Visit Site Button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Pressable
            style={{
              backgroundColor: "#E2E2E2",
              width: "100%",
              paddingVertical: 14,
              borderRadius: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16, color: "#1D1A27" }}>
              Visit Profile
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Options Modal */}
      <Modal
        visible={isOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOptionsVisible(false)}
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
            onPress={() => setIsOptionsVisible(false)}
          />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: "#fff",
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
              <Image
                source={{
                  uri:
                    (image as string) ||
                    "https://images.unsplash.com/photo-1434389678232-068a8ebce4ea?w=400&q=80",
                }}
                style={{ width: 60, height: 80, borderRadius: 8 }}
              />
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
    </SafeAreaView>
  );
}
