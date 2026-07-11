import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import {
  IconAdjustmentsHorizontal,
  IconArrowsDiagonal,
  IconChevronDown,
  IconChevronUp,
  IconFlipHorizontal,
  IconLetterT,
  IconTrash,
  IconX,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function CreateOutfitScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();

  const items = useUserWardrobeStore((state) => state.items);
  const initialItem = items.find((item) => item.id === itemId);

  const [activeTab, setActiveTab] = useState("Tops");

  // Dummy data for bottom grid
  const DUMMY_CLOTHES = [
    {
      id: "1",
      image: "https://picsum.photos/seed/101/200/300",
      brand: "No Brand",
      date: "7/4/2026",
    },
    {
      id: "2",
      image: "https://picsum.photos/seed/102/200/300",
      brand: "No Brand",
      date: "7/4/2026",
    },
    {
      id: "3",
      image: "https://picsum.photos/seed/103/200/300",
      brand: "No Brand",
      date: "7/4/2026",
    },
    {
      id: "4",
      image: "https://picsum.photos/seed/104/200/300",
      brand: "No Brand",
      date: "7/4/2026",
    },
  ];

  const TABS = ["Tops", "Dresses", "Pants", "Outerwear", "Shoes", "Bags"];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <IconX size={24} color="#1D1A27" />
          </Pressable>
          <Pressable style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </View>

        {/* ── Canvas Area ── */}
        <View style={styles.canvasContainer}>
          <View style={styles.canvas}>
            {/* Mock Item on Canvas */}
            <View style={styles.canvasItemWrapper}>
              <View style={styles.boundingWrapper}>
                <ExpoImage
                  source={{
                    uri:
                      initialItem?.imageUrl ??
                      "https://picsum.photos/seed/shirt/400/500",
                  }}
                  style={styles.canvasItemImage}
                  contentFit="contain"
                />
                <View style={styles.boundingBox} />

                {/* Controls on bounding box */}
                <View style={[styles.controlBadge, { top: -14, left: "40%" }]}>
                  <IconFlipHorizontal size={14} color="#1D1A27" />
                </View>
                <View style={[styles.controlBadge, { top: -14, right: -14 }]}>
                  <IconTrash size={14} color="#1D1A27" />
                </View>
                <View
                  style={[styles.controlBadge, { bottom: -14, right: -14 }]}
                >
                  <IconArrowsDiagonal size={14} color="#1D1A27" />
                </View>
              </View>
            </View>

            {/* Floating Toolbar inside canvas */}
            <View style={styles.floatingToolbar}>
              <Pressable style={styles.toolbarIcon}>
                <IconLetterT size={22} color="#4B5563" />
              </Pressable>
              <Pressable style={styles.toolbarIcon}>
                <IconFlipHorizontal size={22} color="#4B5563" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Bottom Panel (Wardrobe) ── */}
        <View style={styles.bottomPanel}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Filters Row */}
          <View style={styles.filtersRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              <Pressable style={styles.filterIconButton}>
                <IconAdjustmentsHorizontal size={18} color="#4B5563" />
              </Pressable>

              <Pressable style={styles.filterChip}>
                <Text style={styles.filterChipText}>All clothes</Text>
                <IconChevronDown size={16} color="#4B5563" />
              </Pressable>

              <Pressable style={styles.filterChip}>
                <Text style={styles.filterChipText}>Recently added</Text>
                <IconChevronDown size={16} color="#4B5563" />
              </Pressable>

              <Pressable
                style={[styles.filterChip, { backgroundColor: "#F9FAFB" }]}
              >
                <Text style={styles.filterChipText}>Summer</Text>
                <IconX size={14} color="#4B5563" style={{ marginLeft: 2 }} />
              </Pressable>
            </ScrollView>
          </View>

          {/* Categories Row */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={styles.tabItem}
                  >
                    <Text
                      style={[styles.tabText, isActive && styles.tabTextActive]}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          {/* Clothes Grid */}
          <ScrollView
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {DUMMY_CLOTHES.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <View style={styles.gridImageContainer}>
                    <ExpoImage
                      source={{ uri: item.image }}
                      style={styles.gridImage}
                      contentFit="contain"
                    />
                  </View>
                  <Text style={styles.gridBrandText}>{item.brand}</Text>
                  <Text style={styles.gridDateText}>{item.date}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Scroll to Top FAB */}
          <Pressable style={styles.fab}>
            <IconChevronUp size={24} color="#1D1A27" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF1F5",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nextButton: {
    backgroundColor: "#1D1A27",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  canvasContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  canvas: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  canvasItemWrapper: {
    width: 200,
    height: 250,
  },
  boundingWrapper: {
    flex: 1,
    position: "relative",
  },
  canvasItemImage: {
    width: "100%",
    height: "100%",
  },
  boundingBox: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  controlBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  floatingToolbar: {
    position: "absolute",
    bottom: 24,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  toolbarIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPanel: {
    height: "45%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  filtersRow: {
    marginBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    gap: 4,
  },
  filterChipText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 24,
    paddingBottom: 8,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#1D1A27",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    width: "100%",
  },
  gridContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
  },
  gridImageContainer: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gridImage: {
    width: "80%",
    height: "80%",
  },
  gridBrandText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 2,
  },
  gridDateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
});
