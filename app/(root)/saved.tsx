import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Lock, Play, Plus } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppGradientBackground } from "../../components/ui/AppGradientBackground";

const { width } = Dimensions.get("window");
const GRID_SPACING = 2;
const ITEM_SIZE = (width - GRID_SPACING * 2) / 3;

const FILTERS = ["All", "Collections", "Series", "Reels", "Posts", "Audio"];

// Mock data matching the grid in the screenshot
const SAVED_POSTS = [
  {
    id: "1",
    type: "reel",
    image:
      "https://images.unsplash.com/photo-1520975954732-57dd22299614?w=400&q=80",
  },
  {
    id: "2",
    type: "reel",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
  },
  {
    id: "3",
    type: "reel",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
  },
  {
    id: "4",
    type: "reel",
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80",
  },
  {
    id: "5",
    type: "reel",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
  },
  {
    id: "6",
    type: "post",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80",
  },
  {
    id: "7",
    type: "post",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80",
  },
  {
    id: "8",
    type: "post",
    image:
      "https://images.unsplash.com/photo-1434389678232-068a8ebce4ea?w=400&q=80",
  },
  {
    id: "9",
    type: "post",
    image:
      "https://images.unsplash.com/photo-1550614000-4b95d466f289?w=400&q=80",
  },
];

export default function SavedScreen() {
  const router = useRouter();

  const renderHeader = () => (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft color="#1D1A27" size={28} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Saved</Text>
        </View>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus color="#1D1A27" size={28} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map((filter, index) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                index === 0 && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  index === 0 && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Collections Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Collections</Text>
        <TouchableOpacity>
          <Text style={styles.actionText}>See all</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.collectionItem}>
        <View style={styles.collectionImageContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&q=80",
            }}
            style={styles.collectionImage}
          />
        </View>
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName}>free</Text>
          <View style={styles.privateContainer}>
            <Lock color="#8E8E93" size={12} strokeWidth={2} />
            <Text style={styles.privateText}>Private</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Reels and Posts Header */}
      <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12 }]}>
        <Text style={styles.sectionTitle}>Reels and posts</Text>
        <TouchableOpacity>
          <Text style={styles.actionText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGridItem = ({ item }: { item: (typeof SAVED_POSTS)[0] }) => (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={{ uri: item.image }} style={styles.gridImage} />
      {item.type === "reel" && (
        <View style={styles.reelIconContainer}>
          <Play fill="#FFFFFF" color="#FFFFFF" size={14} />
        </View>
      )}
      {item.type === "post" && (
        <View style={styles.postIconContainer}>
          <View style={styles.multiPostIconOuter}>
            <View style={styles.multiPostIconInner} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <FlatList
            data={SAVED_POSTS}
            keyExtractor={(item) => item.id}
            renderItem={renderGridItem}
            numColumns={3}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
          />
        </SafeAreaView>
      </AppGradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    backgroundColor: "transparent",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  navTitle: {
    color: "#1D1A27",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 24,
  },
  filtersContainer: {
    marginTop: 12,
    marginBottom: 24,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E8",
  },
  filterPillActive: {
    backgroundColor: "#1D1A27",
    borderColor: "#1D1A27",
  },
  filterText: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#1D1A27",
    fontSize: 18,
    fontWeight: "600",
  },
  actionText: {
    color: "#4C9EEB",
    fontSize: 15,
    fontWeight: "600",
  },
  collectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  collectionImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F8F7FC",
  },
  collectionImage: {
    width: "100%",
    height: "100%",
  },
  collectionInfo: {
    marginLeft: 16,
    justifyContent: "center",
  },
  collectionName: {
    color: "#1D1A27",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  privateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  privateText: {
    color: "#8E8E93",
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: GRID_SPACING,
    marginBottom: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: "relative",
    backgroundColor: "#F8F7FC",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  reelIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 4,
  },
  postIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 6,
  },
  multiPostIconOuter: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 3,
    backgroundColor: "transparent",
    position: "relative",
  },
  multiPostIconInner: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 3,
  },
});
