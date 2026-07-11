import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { IconBookmark, IconHanger, IconPlus } from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryId =
  | "all"
  | "top"
  | "bottoms"
  | "footwear"
  | "outerwear"
  | "dress"
  | "ethnic"
  | "accessory"
  | "activewear"
  | "sportswear"
  | "formal"
  | "casual"
  | "partywear"
  | "sleepwear"
  | "swimwear"
  | "winterwear"
  | "summerwear"
  | "loungewear"
  | "bags"
  | "jewelry"
  | "watches"
  | "sunglasses"
  | "belts"
  | "hats"
  | "co_ords"
  | "jumpsuits"
  | "blazers"
  | "hoodies"
  | "jackets"
  | "sweaters"
  | "jeans"
  | "trousers"
  | "shorts"
  | "skirts"
  | "traditional"
  | "festive"
  | "wedding"
  | "new_arrivals"
  | "trending"
  | "favorites"
  | "recommended";

interface ClothingItem {
  id: string;
  name: string;
  category: CategoryId;
  color: string;
  bgColor: string;
  occasion: string;
  wears: number;
  isNew: boolean;
  image?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 8;
const GRID_PADDING = 16;

const CONTENT_WIDTH = SCREEN_WIDTH - GRID_PADDING * 2;
const ITEM_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2 - 0.1;
const ITEM_HEIGHT = ITEM_WIDTH;

// ─── Bento grid card ───────────────────────────────────────────────────

const BentoCard = React.memo(function BentoCard({
  item,
  width,
  height,
}: {
  item: ClothingItem;
  width: number;
  height: number;
}) {
  const router = useRouter();
  const bg = "#FFFFFF";
  return (
    <Pressable
      onPress={() => router.push(`/(root)/cloth-details/${item.id}` as never)}
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F0EEF8",
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {item.image ? (
        <ExpoImage
          source={{ uri: item.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: bg }} />
      )}
    </Pressable>
  );
});

// ─── Empty state ───

const EmptyState = React.memo(function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: "#F8F7FC",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#E9EBF8",
        }}
      >
        <IconHanger size={36} color="#9CA3AF" strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1D1A27",
          marginBottom: 8,
        }}
      >
        Your wardrobe is empty
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#9B9BAF",
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 15,
        }}
      >
        Start adding your clothes to track what you wear and get personalized AI
        outfit ideas.
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          backgroundColor: "#1D1A27",
          borderRadius: 26,
          paddingHorizontal: 28,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <IconPlus size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
          Add your first item
        </Text>
      </Pressable>
    </View>
  );
});

// ─── Main Screen ────────────────────────r─────────────────────────────────────

export default function WardrobeScreen() {
  const { onScroll: hideTabBarOnScroll } = useScrollToHideTabBar();
  const router = useRouter();
  const userItems = useUserWardrobeStore((state) => state.items);

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 50;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, HEADER_HEIGHT],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.6, HEADER_HEIGHT],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  const displayItems = useMemo(() => {
    return userItems.map(
      (item): ClothingItem => ({
        id: item.id,
        name: item.customName || item.subCategory || item.category,
        category: item.category as CategoryId,
        color: item.primaryColor ?? "—",
        bgColor: "#F8F7FC",
        occasion: item.occasion?.[0] ?? "Casual",
        wears: item.wearCount ?? 0,
        isNew: true,
        image: item.imageUrl ?? `https://picsum.photos/seed/${item.id}/300/400`,
      }),
    );
  }, [userItems]);

  const handleSaved = useCallback(() => {
    router.push("/(root)/saved" as never);
  }, [router]);

  return (
    <SwipeTabWrapper tabIndex={1}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <Animated.ScrollView
            key="grid-view"
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: hideTabBarOnScroll },
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {/* ── Header ── */}
            <Animated.View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 25,
                height: HEADER_HEIGHT,
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity,
                zIndex: 0,
              }}
            >
              <View>
                <ExpoImage
                  source={require("@/assets/images/getStartedLogo.png")}
                  style={{ height: 70, width: 224, marginLeft: -40 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/(root)/calendar" as never)}
                  activeOpacity={0.7}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#E2E2EA",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <ExpoImage
                    source={{
                      uri: "https://lottie.host/d792b296-3b91-4233-bdd3-5c0cdd8fd7d6/bN9RwNrbUY.svg",
                    }}
                    style={{ width: 22, height: 22 }}
                    contentFit="contain"
                  />
                </TouchableOpacity>

                <Pressable
                  onPress={handleSaved}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#E2E2EA",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <IconBookmark size={20} color="#1D1A27" strokeWidth={1.5} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Scrollable content — scrolls over the header */}
            <View style={{ zIndex: 1, position: "relative" }}>
              {displayItems.length === 0 ? (
                <EmptyState
                  onAdd={() =>
                    router.push("/(root)/log-outfit/camera" as never)
                  }
                />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    paddingHorizontal: GRID_PADDING,
                    gap: GRID_GAP,
                  }}
                >
                  {displayItems.map((item) => (
                    <BentoCard
                      key={item.id}
                      item={item}
                      width={ITEM_WIDTH}
                      height={ITEM_HEIGHT}
                    />
                  ))}
                </View>
              )}
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
