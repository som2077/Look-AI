import { getMockWardrobeItemById } from "@/constants/mock-wardrobe-items";
import { useUserWardrobeStore } from "@/store/user-wardrobe-store";
import { IconArrowLeft, IconDots } from "@tabler/icons-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CATEGORY_LABELS: Record<string, string> = {
  top: "Top",
  bottoms: "Bottoms",
  footwear: "Footwear",
  outerwear: "Outerwear",
  dress: "Dress",
  ethnic: "Ethnic",
  accessory: "Accessory",
};

export default function ClothDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userItem = useUserWardrobeStore((state) =>
    state.items.find((item) => item.id === id),
  );
  const mockItem = getMockWardrobeItemById(id);

  const itemName = userItem?.name ?? mockItem?.name ?? "Unknown item";
  const wearCount = mockItem?.wears ?? 0;
  const isWorn = wearCount > 0;
  const categoryName =
    CATEGORY_LABELS[userItem?.category ?? mockItem?.category ?? ""] ??
    userItem?.category ??
    mockItem?.category ??
    "Item";
  const itemColor = userItem?.color ?? mockItem?.color ?? "—";
  const itemOccasion = userItem?.occasion ?? mockItem?.occasion ?? "Casual";
  const bg = mockItem?.bgColor ?? "#F4F4F6";

  const MIN_HEIGHT = SCREEN_HEIGHT * 0.45;
  const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
  const HIDDEN_OFFSET = MAX_HEIGHT - MIN_HEIGHT;
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const isExpandedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        let newY = isExpandedRef.current
          ? gestureState.dy
          : HIDDEN_OFFSET + gestureState.dy;
        if (newY < 0) newY = 0;
        if (newY > HIDDEN_OFFSET) newY = HIDDEN_OFFSET;
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          isExpandedRef.current = true;
        } else if (gestureState.dy > 50) {
          Animated.spring(translateY, {
            toValue: HIDDEN_OFFSET,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          isExpandedRef.current = false;
        } else {
          const snapTo = isExpandedRef.current ? 0 : HIDDEN_OFFSET;
          Animated.spring(translateY, {
            toValue: snapTo,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Full Screen Image/Placeholder */}
      <View style={[styles.imageContainer, { backgroundColor: bg }]}>
        {userItem?.photoUri ? (
          <Image
            source={{ uri: userItem?.photoUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage} />
        )}
      </View>

      {/* Top Navigation Bar */}
      <SafeAreaView style={styles.topNav} edges={["top"]}>
        <Pressable onPress={() => router.back()}>
          <IconArrowLeft size={24} color="#1D1A27" strokeWidth={2.5} />
        </Pressable>

        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}>
          Confirm details
        </Text>

        <Pressable
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#E5E5E5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconDots size={20} color="#1D1A27" strokeWidth={2.5} />
        </Pressable>
      </SafeAreaView>

      {/* Bottom Details Card */}
      <Animated.View
        style={[styles.detailsCard, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragHandle} />

        <Text
          style={{
            fontSize: 13,
            color: "#1D1A27",
            marginBottom: 20,
            lineHeight: 18,
            fontWeight: "500",
            paddingHorizontal: 4,
          }}
        >
          We&apos;ve prefilled what AI detected. Edit anything before saving to
          your wardrobe.
        </Text>

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#1D1A27",
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          Item name
        </Text>
        <View
          style={{
            backgroundColor: "#F4F4F6",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 15, color: "#1D1A27", fontWeight: "500" }}>
            {itemName}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: categoryName },
            { label: itemOccasion },
            { label: itemColor },
          ].map((chip) => (
            <View
              key={chip.label}
              style={{
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderRadius: 24,
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#1D1A27" }}
              >
                {chip.label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "absolute",
    top: 0,
  },
  placeholderImage: {
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topRightActions: {
    flexDirection: "row",
    gap: 12,
  },
  badgeContainer: {
    position: "absolute",
    top: 120, // Adjust based on SafeArea
    left: 20,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D1A27",
  },
  detailsCard: {
    position: "absolute",
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: "#C9C9C9",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E8",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1D1A27",
    flex: 1,
  },
  wearPill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  wearPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: "#F4F4F8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20, // Add some bottom margin so it doesn't hug the very bottom edge on devices without home indicator
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F0F0F5",
    borderRadius: 20,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: "#9B9BAF",
    fontWeight: "600",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D1A27",
  },
});
