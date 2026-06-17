import React from "react";
import { View, Text, Pressable, Dimensions, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  IconChevronLeft,
  IconHeart,
  IconShare,
} from "@tabler/icons-react-native";
import { StatusBar } from "expo-status-bar";
import { getMockWardrobeItemById } from "@/constants/mock-wardrobe-items";
import { useUserWardrobeStore } from "@/backend/store/user-wardrobe-store";

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Full Screen Image/Placeholder */}
      <View style={[styles.imageContainer, { backgroundColor: bg }]}>
        {/* Replace this View with an Image component when you have real images */}
        <View style={styles.placeholderImage} />
      </View>

      {/* Top Navigation Bar */}
      <SafeAreaView style={styles.topNav} edges={["top"]}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <IconChevronLeft size={24} color="#1D1A27" />
        </Pressable>
        <View style={styles.topRightActions}>
          <Pressable style={styles.iconButton}>
            <IconShare size={22} color="#1D1A27" />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <IconHeart size={22} color="#1D1A27" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Worn/New Badge */}
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{isWorn ? "Worn" : "New"}</Text>
      </View>

      {/* Bottom Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.dragHandle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{itemName}</Text>
          <View style={styles.wearPill}>
            <Text style={styles.wearPillText}>{wearCount}× worn</Text>
          </View>
        </View>

        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{categoryName}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{itemColor}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{itemOccasion}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Last Worn</Text>
            <Text style={styles.statValue}>2 days ago</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Cost per Wear</Text>
            <Text style={styles.statValue}>$12.50</Text>
          </View>
        </View>
      </View>
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
    height: SCREEN_HEIGHT * 0.75, // Takes up 75% of screen
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
    shadowOpacity: 0.1,
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
    shadowOpacity: 0.1,
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
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
